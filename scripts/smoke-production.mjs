import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join, resolve, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { mock } from 'node:test';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { nodeFileTrace } from '@vercel/nft';

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
  // Preserve module boundaries and specifiers: bundling would hide invalid ESM imports.
  const configPath = join(root, 'tsconfig.server.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root, { noEmit: false, outDir: output });
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const diagnostics = [...parsed.errors, ...ts.getPreEmitDiagnostics(program)];
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => root, getCanonicalFileName: (file) => file, getNewLine: () => '\n',
  }));
  assert.equal(program.emit().emitSkipped, false);
  const entry = join(output, 'api/rewrite-text.js');
  const modules = ['api/rewrite-text', 'server/rewrite-handler', 'server/rewrite-prompts', 'server/local-env', 'shared/rewrite-contract'];
  // Same tracer used by @vercel/node; validate .js -> .ts tracing and emitted JS tracing.
  // Never inspect environment files, including when tracing the local-only env loader.
  for (const [traceEntry, base, extension] of [[join(root, 'api/rewrite-text.ts'), root, '.ts'], [entry, output, '.js']]) {
    const traced = await nodeFileTrace([traceEntry], {
      base: root, processCwd: base, ts: true,
      ignore: (file) => file.split(/[\\/]/).some((part) => part.startsWith('.env')),
      async readFile(file) {
        if (file.split(/[\\/]/).some((part) => part.startsWith('.env'))) return null;
        let source;
        try { source = await readFile(file, 'utf8'); }
        catch (error) { if (error.code === 'ENOENT' || error.code === 'EISDIR') return null; throw error; }
        // @vercel/node likewise compiles TypeScript before passing it to the tracer.
        return file.endsWith('.ts') && !file.endsWith('.d.ts')
          ? ts.transpileModule(source, { compilerOptions: parsed.options, fileName: file }).outputText
          : source;
      },
    });
    const tracedPaths = new Set([...traced.fileList].map((file) => file.split(sep).join('/')));
    for (const module of modules) {
      const file = relative(root, join(base, module + extension)).split(sep).join('/');
      assert.ok(tracedPaths.has(file), `Vercel tracing includes ${file}`);
    }
  }
  const api = await import(pathToFileURL(entry).href);
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
  const { Responses } = await import('openai/resources/responses/responses');
  const suggestion = 'Opettelen asiakaspalvelua opiskelijana.';
  const parse = mock.method(Responses.prototype, 'parse', async (options) => ({
    status: 'completed', output_parsed: options.text.format.name === 'cv_skills' ? { skills: ['Asiakaspalvelu'] } : { suggestion }, output: [],
  }));
  try {
    process.env.OPENAI_API_KEY = 'smoke-placeholder-not-a-real-key';
    const response = await fetch(base + '/api/rewrite-text', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ textType: 'profile', sourceText: 'Olen opiskelija ja opettelen asiakaspalvelua.' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { suggestion });
    assert.equal(parse.mock.callCount(), 1);
    const skills = await fetch(base + '/api/rewrite-text', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base },
      body: JSON.stringify({ operation: 'suggest-skills', source: { professionalTitle: '', summary: 'Palvelin asiakkaita myymälässä.', workExperience: [], education: [] } }),
    });
    assert.equal(skills.status, 200); assert.deepEqual(await skills.json(), { skills: ['Asiakaspalvelu'] });
    assert.equal(parse.mock.callCount(), 2);
  } finally { parse.mock.restore(); process.env.OPENAI_API_KEY = ''; }
  // Prove that every original extensionless import would fail in a fresh Node process.
  for (const [module, specifier] of [
    ['api/rewrite-text', '../server/rewrite-handler.js'],
    ['api/rewrite-text', '../server/local-env.js'],
    ['server/rewrite-handler', '../shared/rewrite-contract.js'],
    ['server/rewrite-handler', './rewrite-prompts.js'],
  ]) {
    const file = join(output, module + '.js');
    const source = await readFile(file, 'utf8');
    assert.ok(source.includes(specifier));
    try {
      await writeFile(file, source.replace(specifier, specifier.slice(0, -3)));
      const broken = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(pathToFileURL(entry).href)})`], {
        encoding: 'utf8', windowsHide: true, timeout: 15000,
      });
      assert.equal(broken.error, undefined);
      assert.notEqual(broken.status, 0);
      assert.match(broken.stderr, /ERR_MODULE_NOT_FOUND/);
    } finally { await writeFile(file, source); }
  }
  console.log('Production smoke passed: unbundled Node ESM, Vercel dependency tracing, four extensionless negative controls, root/assets, HTTP 405/400/503/200 (SDK mocked), no external calls.');
} finally {
  globalThis.fetch = originalFetch;
  if (server) { server.closeAllConnections(); await new Promise((done) => server.close(done)); }
  if (dirname(output) !== outputRoot || !output.startsWith(outputRoot + sep)) throw new Error('Unsafe smoke cleanup path');
  await rm(output, { recursive: true, force: true });
}
