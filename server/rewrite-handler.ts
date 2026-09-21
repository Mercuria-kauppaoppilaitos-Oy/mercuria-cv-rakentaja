import OpenAI from 'openai';
import { APIConnectionTimeoutError } from 'openai/core/error';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { rewriteMessages, rewriteRequestSchema, rewriteResponseSchema } from '../shared/rewrite-contract.js';
import { rewritePrompts } from './rewrite-prompts.js';

export const rewriteTimeoutMs = 15_000;
export const maxRewriteBodyBytes = 8192;
const outputSchema = z.object({ suggestion: z.string() }).strict();

function json(value: unknown, status: number, extraHeaders?: Record<string, string>) {
  return Response.json(value, { status, headers: {
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    ...extraHeaders,
  } });
}

class BodyTooLarge extends Error {}

async function readBody(request: Request, signal: AbortSignal) {
  const length = request.headers.get('content-length');
  if (length && (!/^\d+$/u.test(length) || Number(length) > maxRewriteBodyBytes)) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (signal.aborted) { cancel(); throw new Error('aborted'); }
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error('aborted');
      if (done) break;
      size += value.byteLength;
      if (size > maxRewriteBodyBytes) {
        cancel();
        throw new BodyTooLarge();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  } finally {
    signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}

export async function handleRewriteRequest(request: Request): Promise<Response> {
  if (request.method !== 'POST') return json({ error: rewriteMessages.failure }, 405, { Allow: 'POST' });
  if (request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    return json({ error: rewriteMessages.failure }, 415);
  }
  // Cross-origin browser calls are not needed. This is not authentication or a global rate limit.
  const origin = request.headers.get('origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
    return json({ error: rewriteMessages.failure }, 403);
  }
  const controller = new AbortController();
  const cancel = () => controller.abort();
  request.signal.addEventListener('abort', cancel, { once: true });
  if (request.signal.aborted) cancel();
  const timer = setTimeout(cancel, rewriteTimeoutMs);
  try {
    let raw: unknown;
    try { raw = await readBody(request, controller.signal); }
    catch (error) {
      if (controller.signal.aborted) return json({ error: rewriteMessages.timeout }, 504);
      return json({ error: rewriteMessages.failure }, error instanceof BodyTooLarge ? 413 : 400);
    }
    const parsed = rewriteRequestSchema.safeParse(raw);
    if (!parsed.success) return json({ error: rewriteMessages.failure }, 400);
    if (!process.env.OPENAI_API_KEY) {
      if (process.env.NODE_ENV !== 'production') console.warn('OPENAI_API_KEY environment variable is missing.');
      return json({ error: rewriteMessages.failure }, 503);
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0, timeout: rewriteTimeoutMs, logLevel: 'off' });
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.6-luna';
    const { textType, sourceText, jobTitle } = parsed.data;
    const response = await client.responses.parse({
      model,
      instructions: rewritePrompts[textType],
      input: [{ role: 'user', content: JSON.stringify({ sourceText, ...(jobTitle ? { jobTitle } : {}) }) }],
      text: { format: zodTextFormat(outputSchema, 'cv_rewrite') },
      ...(/^(?:gpt-5(?:[.-]|$)|gpt-6(?:[.-]|$)|o[134](?:-|$))/u.test(model) ? { reasoning: { effort: 'low' as const } } : {}),
      max_output_tokens: 1200,
      store: false,
    }, { signal: controller.signal });
    if (controller.signal.aborted) return json({ error: rewriteMessages.timeout }, 504);
    const output = rewriteResponseSchema.safeParse(response.output_parsed);
    const refused = response.output?.some((item) => item.type === 'message' && item.content.some((content) => content.type === 'refusal'));
    if (response.status !== 'completed' || refused || !output.success) return json({ error: rewriteMessages.failure }, 502);
    return json(output.data, 200);
  } catch (error) {
    if (controller.signal.aborted || error instanceof APIConnectionTimeoutError) return json({ error: rewriteMessages.timeout }, 504);
    if (error instanceof OpenAI.APIError && error.status === 429) return json({ error: rewriteMessages.failure }, 429, { 'Retry-After': '60' });
    // Provider errors can include input or credentials: deliberately never log them.
    return json({ error: rewriteMessages.failure }, 502);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', cancel);
  }
}
