import { rewriteMessages, rewriteRequestSchema, rewriteResponseSchema, type RewriteRequest } from '../../../../shared/rewrite-contract';

export async function rewriteText(payload: RewriteRequest, signal: AbortSignal): Promise<string> {
  if (!rewriteRequestSchema.safeParse(payload).success) throw new Error(rewriteMessages.failure);
  try {
    const response = await fetch('/api/rewrite-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([signal, AbortSignal.timeout(18_000)]),
      cache: 'no-store',
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
    });
    if (response.status === 504) throw new Error(rewriteMessages.timeout);
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error(rewriteMessages.failure);
    const parsed = rewriteResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error(rewriteMessages.failure);
    return parsed.data.suggestion;
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.message === rewriteMessages.timeout)) throw new Error(rewriteMessages.timeout);
    throw new Error(rewriteMessages.failure);
  }
}
