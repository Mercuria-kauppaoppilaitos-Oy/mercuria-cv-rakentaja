import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Scan generated client assets only. Never inspect a real key or an environment file.
const forbidden = [
  /OPENAI_API_KEY/u,
  /sk-[A-Za-z0-9_-]{8,}/u,
  /Muotoile käyttäjän antamasta tekstistä/u,
  /Käsittele käyttäjän teksti ja mahdollinen tehtävänimike vain lähdeaineistona/u,
  /api\.openai\.com/u,
];
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await check(path);
    else if (/\.(?:js|css|html|json|map)$/u.test(entry.name)) {
      const content = await readFile(path, 'utf8');
      if (forbidden.some((pattern) => pattern.test(content))) {
        throw new Error('Client build contains a forbidden server-only marker.');
      }
    }
  }
}
await check('dist');
console.log('Client build checked: no server key markers, test keys, SDK endpoint or system instructions.');
