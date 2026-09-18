import assert from 'node:assert/strict';

const base = process.argv.find((value) => /^http:\/\/127\.0\.0\.1:\d+$/u.test(value)) ?? 'http://127.0.0.1:3000';
const headers = { 'Content-Type': 'application/json', Origin: base, 'Sec-Fetch-Site': 'same-origin' };
assert.equal((await fetch(base)).status, 200);
const method = await fetch(`${base}/api/rewrite-text`);
assert.equal(method.status, 405);
assert.equal(method.headers.get('cache-control'), 'no-store');
const invalid = await fetch(`${base}/api/rewrite-text`, {
  method: 'POST', headers,
  body: JSON.stringify({ textType: 'profile', sourceText: 'short' }),
});
assert.equal(invalid.status, 400);
assert.equal(invalid.headers.get('cache-control'), 'no-store');
// Only use this flag with a server explicitly started without an API key.
if (process.argv.includes('--missing-key')) {
  const missing = await fetch(`${base}/api/rewrite-text`, {
    method: 'POST', headers,
    body: JSON.stringify({ textType: 'profile', sourceText: 'Olen opiskelija ja opettelen asiakaspalvelua.' }),
  });
  assert.equal(missing.status, 503);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await missing.json(), { error: 'Tekstin jalostaminen ei juuri nyt onnistunut. Alkuperäinen tekstisi säilyi.' });
}
console.log('Local Vercel smoke passed: UI, method rejection, validation and no-store headers.');
