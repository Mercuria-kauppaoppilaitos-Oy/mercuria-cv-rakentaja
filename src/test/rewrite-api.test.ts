// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OpenAI from 'openai';
import { handleRewriteRequest, maxRewriteBodyBytes, rewriteTimeoutMs } from '../../server/rewrite-handler';
import { rewriteMessages } from '../../shared/rewrite-contract';

const { parse, construct } = vi.hoisted(() => ({ parse: vi.fn(), construct: vi.fn() }));
vi.mock('openai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('openai')>();
  return { ...actual, default: class extends actual.default {
    constructor(options: ConstructorParameters<typeof actual.default>[0]) {
      super(options);
      construct(options);
      this.responses.parse = parse as typeof this.responses.parse;
    }
  } };
});
const source = 'Avustin asiakkaita ja järjestin tuotteita.';
const suggestion = 'Avustin asiakkaita ja huolehdin tuotteiden järjestämisestä.';
function request(body: unknown = { textType: 'profile', sourceText: source }, options: RequestInit = {}) {
  return new Request('http://localhost:3000/api/rewrite-text', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), ...options,
  });
}
beforeEach(() => {
  vi.stubEnv('OPENAI_API_KEY', 'sk-test-only-never-real-rewrite-key');
  vi.stubEnv('OPENAI_MODEL', '');
  parse.mockReset(); construct.mockClear();
  parse.mockResolvedValue({ status: 'completed', output_parsed: { suggestion } });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('AI rewrite API (mock SDK, no network)', () => {
  it.each(['GET', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'])('rejects %s without invoking SDK', async (method) => {
    const response = await handleRewriteRequest(request(undefined, { method, ...(method === 'GET' || method === 'HEAD' ? { body: undefined } : {}) }));
    expect(response.status).toBe(405); expect(response.headers.get('allow')).toBe('POST'); expect(parse).not.toHaveBeenCalled();
  });
  it('requires JSON and rejects cross-origin browser requests', async () => {
    expect((await handleRewriteRequest(request(undefined, { headers: { 'Content-Type': 'text/plain' } }))).status).toBe(415);
    expect((await handleRewriteRequest(request(undefined, { headers: { 'Content-Type': 'application/json', Origin: 'https://other.example' } }))).status).toBe(403);
    expect(parse).not.toHaveBeenCalled();
  });
  it('rejects malformed JSON', async () => {
    expect((await handleRewriteRequest(request(undefined, { body: '{invalid' }))).status).toBe(400); expect(parse).not.toHaveBeenCalled();
  });
  it.each([
    { textType: 'unknown', sourceText: source },
    { textType: 'profile', sourceText: '  short  ' },
    { textType: 'profile', sourceText: 'x'.repeat(1501) },
    { textType: 'workExperience', sourceText: source, jobTitle: 'x'.repeat(151) },
    { textType: 'profile', sourceText: source, personalDetails: { email: 'private@example.com' } },
    { textType: 'profile', sourceText: source, jobTitle: 'Not profile context' },
  ])('rejects invalid or extra fields: %j', async (body) => {
    expect((await handleRewriteRequest(request(body))).status).toBe(400); expect(parse).not.toHaveBeenCalled(); expect(construct).not.toHaveBeenCalled();
  });
  it('limits bytes with and without Content-Length before the model call', async () => {
    const body = 'x'.repeat(maxRewriteBodyBytes + 1);
    expect((await handleRewriteRequest(request(undefined, { body }))).status).toBe(413);
    expect((await handleRewriteRequest(request(undefined, { headers: { 'Content-Type': 'application/json', 'Content-Length': String(body.length) } }))).status).toBe(413);
    expect(parse).not.toHaveBeenCalled();
  });
  it('handles missing key safely without constructing SDK', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const response = await handleRewriteRequest(request());
    expect(response.status).toBe(503); expect(await response.json()).toEqual({ error: rewriteMessages.failure });
    expect(warn).toHaveBeenCalledExactlyOnceWith('OPENAI_API_KEY environment variable is missing.');
    expect(construct).not.toHaveBeenCalled(); expect(parse).not.toHaveBeenCalled();
  });
  it.each(['profile', 'workExperience'])('returns validated %s suggestion with minimal input and one call', async (textType) => {
    const body = { textType, sourceText: `  ${source}  `, ...(textType === 'workExperience' ? { jobTitle: '  Harjoittelija  ' } : {}) };
    const response = await handleRewriteRequest(request(body));
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ suggestion });
    expect(response.headers.get('cache-control')).toBe('no-store'); expect(response.headers.get('referrer-policy')).toBe('no-referrer'); expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(construct).toHaveBeenCalledWith(expect.objectContaining({ maxRetries: 0, timeout: rewriteTimeoutMs, logLevel: 'off' }));
    expect(parse).toHaveBeenCalledTimes(1);
    const options = parse.mock.calls[0]![0];
    expect(options.model).toBe('gpt-5.6-luna'); expect(options.reasoning).toEqual({ effort: 'low' }); expect(options.store).toBe(false);
    expect(options.tools).toBeUndefined(); expect(options.previous_response_id).toBeUndefined();
    expect(options.input).toEqual([{ role: 'user', content: JSON.stringify({ sourceText: source, ...(textType === 'workExperience' ? { jobTitle: 'Harjoittelija' } : {}) }) }]);
    expect(options.text.format.type).toBe('json_schema'); expect(options.text.format.strict).toBe(true);
    expect(options.instructions).toContain('Älä keksi');
  });
  it('supports server-side non-reasoning model override without unsupported effort', async () => {
    vi.stubEnv('OPENAI_MODEL', 'gpt-4.1-mini'); await handleRewriteRequest(request());
    expect(parse.mock.calls[0]![0].model).toBe('gpt-4.1-mini'); expect(parse.mock.calls[0]![0].reasoning).toBeUndefined();
  });
  it.each([
    null, {}, { suggestion: '' }, { suggestion: 'short' }, { suggestion: 'x'.repeat(1001) },
    { suggestion: '<b>Tekstiä kuvaukseen</b>' }, { suggestion: '# Otsikko kuvaukseen' },
    { suggestion: '- Luettelomerkki kuvaukseen' }, { suggestion: '"Lainaus tekstistä."' },
    { suggestion: '**Markdown tekstiä**' }, { suggestion, extra: 'unexpected' },
    { suggestion: 'Avustin asiakkaita • järjestin tuotteita.' },
  ])('rejects invalid provider output: %j', async (output_parsed) => {
    parse.mockResolvedValue({ status: 'completed', output_parsed });
    const response = await handleRewriteRequest(request()); expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: rewriteMessages.failure });
  });
  it.each(['incomplete', 'failed'])('handles %s response and refusal', async (status) => {
    parse.mockResolvedValue({ status, output_parsed: { suggestion } });
    expect((await handleRewriteRequest(request())).status).toBe(502);
    parse.mockResolvedValue({ status: 'completed', output_parsed: null, output: [{ content: [{ type: 'refusal' }] }] });
    expect((await handleRewriteRequest(request())).status).toBe(502);
  });
  it('aborts a slow SDK request after 15 seconds without retry', async () => {
    vi.useFakeTimers();
    parse.mockImplementation((_options, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('secret provider details')))));
    const pending = handleRewriteRequest(request());
    await vi.advanceTimersByTimeAsync(rewriteTimeoutMs + 1);
    const response = await pending;
    expect(response.status).toBe(504); expect(await response.json()).toEqual({ error: rewriteMessages.timeout }); expect(parse).toHaveBeenCalledTimes(1);
  });
  it('rejects a refusal even when another message contains parsed output', async () => {
    parse.mockResolvedValue({ status: 'completed', output_parsed: { suggestion }, output: [{ type: 'message', content: [{ type: 'refusal' }] }] });
    expect((await handleRewriteRequest(request())).status).toBe(502);
  });
  it('bounds slow input reading and handles a request already aborted without an SDK call', async () => {
    vi.useFakeTimers();
    const cancel = vi.fn();
    const body = new ReadableStream({ cancel });
    const slow = new Request('http://localhost:3000/api/rewrite-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half' } as RequestInit);
    const pending = handleRewriteRequest(slow);
    await vi.advanceTimersByTimeAsync(rewriteTimeoutMs + 1);
    expect((await pending).status).toBe(504); expect(cancel).toHaveBeenCalledOnce();
    const controller = new AbortController(); controller.abort();
    expect((await handleRewriteRequest(request(undefined, { signal: controller.signal }))).status).toBe(504);
    expect(parse).not.toHaveBeenCalled();
  });
  it('handles rate limiting and provider errors without logging or returning content', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    parse.mockRejectedValue(new OpenAI.APIError(429, { message: source }, 'raw secret technical details', new Headers()));
    let response = await handleRewriteRequest(request()); expect(response.status).toBe(429); expect(response.headers.get('retry-after')).toBe('60');
    expect(await response.json()).toEqual({ error: rewriteMessages.failure });
    parse.mockRejectedValue(new Error(`private@example.com ${source} stack trace`));
    response = await handleRewriteRequest(request()); expect(response.status).toBe(502); expect(await response.json()).toEqual({ error: rewriteMessages.failure });
    expect(log).not.toHaveBeenCalled();
  });
});
