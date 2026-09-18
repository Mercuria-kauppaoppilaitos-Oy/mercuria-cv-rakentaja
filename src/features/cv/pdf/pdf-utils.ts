import { z } from 'zod';

export type PdfTextPart = { text: string; href?: string };

/** Preserve visible text; only valid HTTPS/HTTP addresses and emails become links. */
export function getLinkedText(text: string): PdfTextPart[] {
  const pattern = /https?:\/\/[^\s<>]+|[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
  const parts: PdfTextPart[] = [];
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    const value = match[0].replace(/[.,;:!?)}\]]+$/, '');
    const index = match.index;
    if (index > start) parts.push({ text: text.slice(start, index) });
    let href: string | undefined;
    if (value.includes('://')) {
      try { const url = new URL(value); if (url.hostname && ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) href = url.href; } catch { /* Render malformed URLs as text. */ }
    } else if (z.email().safeParse(value).success) href = `mailto:${value}`;
    parts.push({ text: value, href });
    start = index + value.length;
  }
  if (start < text.length) parts.push({ text: text.slice(start) });
  return parts;
}

/** Browser downloads have no completion event: retain the URL briefly for the browser. */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  try { anchor.click(); }
  catch (error) { URL.revokeObjectURL(url); throw error; }
  finally { anchor.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
