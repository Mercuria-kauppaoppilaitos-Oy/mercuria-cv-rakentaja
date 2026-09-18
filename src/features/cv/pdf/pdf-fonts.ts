import { Font } from '@react-pdf/renderer';
import headingRegular from '@fontsource/manrope/files/manrope-latin-400-normal.woff?url';
import headingBold from '@fontsource/manrope/files/manrope-latin-700-normal.woff?url';
import bodyRegular from '@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff?url';
import bodyBold from '@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff?url';

export const pdfFontSources = { headingRegular, headingBold, bodyRegular, bodyBold };
let registered = false;

/** Tests can supply absolute paths to the same local font files on Node. */
export function registerPdfFonts(sources = pdfFontSources): void {
  if (registered) return;
  Font.register({ family: 'CvHeading', fonts: [{ src: sources.headingRegular, fontWeight: 400 }, { src: sources.headingBold, fontWeight: 700 }] });
  Font.register({ family: 'CvBody', fonts: [{ src: sources.bodyRegular, fontWeight: 400 }, { src: sources.bodyBold, fontWeight: 700 }] });
  // Keep words intact in ATS text extraction, including Finnish compound words.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
