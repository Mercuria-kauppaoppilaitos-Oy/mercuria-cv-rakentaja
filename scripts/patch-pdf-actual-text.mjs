import { createRequire } from 'node:module';
import { readFile, rm, writeFile } from 'node:fs/promises';

// Poppler -raw infers spaces using a strict > 0.2 em threshold. Source Sans 3
// spaces are exactly 0.2 em, and textkit can shrink overfull left-aligned lines.
// Preserve the existing layout and glyphs, adding their Unicode text as PDF
// ActualText inside each text object, after Tf has selected the font.
// This version-sensitive adapter is exercised by real PDF.js/Poppler tests.
const require = createRequire(import.meta.url);
const rendererRequire = createRequire(require.resolve('@react-pdf/renderer'));
const path = rendererRequire.resolve('@react-pdf/render');
const metadata = JSON.parse(await readFile(rendererRequire.resolve('@react-pdf/render/package.json'), 'utf8'));
if (metadata.version !== '4.7.0') throw new Error('Review the PDF ActualText adapter for this render version.');
const replacements = [
  ['const _renderGlyphs = (ctx, encoded, positions, x, y) => {',
    'const _renderGlyphs = (ctx, encoded, positions, x, y, actualText) => {'],
  ['// Adds a segment of text to the TJ command buffer',
    "ctx.markContent('Span', { actual: actualText });\n    // Adds a segment of text to the TJ command buffer"],
  ["// end the text object\n    ctx.addContent('ET');",
    "ctx.endMarkedContent();\n    // end the text object\n    ctx.addContent('ET');"],
  ['return _renderGlyphs(ctx, encodedGlyphs, encodedPositions, x, y);',
    "return _renderGlyphs(ctx, encodedGlyphs, encodedPositions, x, y, glyphs.map((glyph) => String.fromCodePoint(...glyph.codePoints)).join(''));"],
];
const source = await readFile(path, 'utf8');
const patched = replacements.every(([, replacement]) => source.split(replacement).length === 2);
if (!patched) {
  let result = source;
  for (const [original, replacement] of replacements) {
    if (result.split(original).length !== 2 || result.includes(replacement)) {
      throw new Error('Unexpected react-pdf render source; review the PDF ActualText adapter.');
    }
    result = result.replace(original, replacement);
  }
  await writeFile(path, result);
}
// Vite's dependency hash does not include patched node_modules source. Remove
// only its generated metadata so the next dev server rebuilds the browser copy.
await rm(new URL('../node_modules/.vite/deps/_metadata.json', import.meta.url), { force: true });
