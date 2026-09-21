import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

// Production-mode smoke of the actual /api entry and built static assets.
// No env files, credentials, Vercel login or paid model requests are needed.
process.env.NODE_ENV = 'production';
process.env.VERCEL_ENV = 'production';
process.env.OPENAI_API_KEY = '';
const root = resolve(import.meta.dirname, '..');
const outputRoot = join(root, 'test-results');
await mkdir(outputRoot, { recursive: true });
const output = await mkdtemp(join(outputRoot, 'production-smoke-'));
const originalFetch = globalThis.fetch;
let server;
try {
  await build({ root, configFile: false, envFile: false, logLevel: 'error', build: {
    ssr: 'api/rewrite-text.ts', outDir: output, emptyOutDir: false,
  } });
  const entry = (await readdir(output)).find((name) => /^rewrite-text\.(?:js|mjs)$/.test(name));
  assert.ok(entry, 'Compiled API entry exists');
  const api = await import(pathToFileURL(join(output, entry)).href);
  for (const method of ['POST', 'GET', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']) assert.equal(typeof api[method], 'function');
  const index = await readFile(join(root, 'dist/index.html'), 'utf8');
  const assets = [...index.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map((match) => match[1]);
  assert.ok(assets.some((asset) => asset.endsWith('.js')));
  const files = new Map([['/', Buffer.from(index)]]);
  for (const asset of assets) files.set(asset, await readFile(join(root, 'dist', asset.slice(1))));
  server = createServer(async (incoming, outgoing) => {
    try {
      const url = new URL(incoming.url, `http://${incoming.headers.host}`);
      if (url.pathname === '/api/rewrite-text') {
        const chunks = []; for await (const chunk of incoming) chunks.push(chunk);
        const method = incoming.method;
        const response = await api[method](new Request(url, {
          method, headers: incoming.headers,
          ...(method === 'GET' || method === 'HEAD' ? {} : { body: Buffer.concat(chunks) }),
        }));
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(Buffer.from(await response.arrayBuffer()));
      } else {
        const file = files.get(url.pathname);
        outgoing.writeHead(file ? 200 : 404); outgoing.end(file ?? 'Not found');
      }
    } catch { outgoing.writeHead(500); outgoing.end('Smoke server error'); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  globalThis.fetch = (input, options) => {
    assert.equal(new URL(input instanceof Request ? input.url : input).origin, base, 'External requests are forbidden in this smoke test');
    return originalFetch(input, { ...options, signal: AbortSignal.timeout(10000) });
  };
  for (const path of ['/', ...assets]) {
    const response = await fetch(base + path); assert.equal(response.status, 200);
    assert.ok((await response.arrayBuffer()).byteLength > 0);
  }
  assert.equal((await fetch(base + '/api/rewrite-text')).status, 405);
  for (const [body, expected] of [[{ textType: 'profile', sourceText: 'short' }, 400], [{ textType: 'profile', sourceText: 'Olen opiskelija ja opettelen asiakaspalvelua.' }, 503]]) {
    const response = await fetch(base + '/api/rewrite-text', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify(body) });
    assert.equal(response.status, expected); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Tekstin jalostaminen ei juuri nyt onnistunut. Alkuperäinen tekstisi säilyi.' });
  }
  console.log('Production smoke passed: root/assets, compiled Vercel API exports, HTTP 405/400/503, no-store, no external calls.');
} finally {
  globalThis.fetch = originalFetch;
  if (server) { server.closeAllConnections(); await new Promise((done) => server.close(done)); }
  if (dirname(output) !== outputRoot || !output.startsWith(outputRoot + sep)) throw new Error('Unsafe smoke cleanup path');
  await rm(output, { recursive: true, force: true });
}
