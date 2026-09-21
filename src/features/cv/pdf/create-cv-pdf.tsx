import { pdf } from '@react-pdf/renderer';
import { Buffer } from 'buffer/';
import { z } from 'zod';
import type { CvData } from '../cv-model';
import { CvPdfDocument } from './CvPdfDocument';
import { preparePdfFonts } from './pdf-fonts';
import type { CvPdfOptions } from './pdf-options';
import { pdfCacheKey, preparePdfInput, type PdfInput, type PdfResult } from './pdf-input';
import { selectPdfDensity } from './pdf-density';
import type { CvDensity } from '../cv-layout';

// Installed renderer's completed paginated layout; PDF.js tests verify the count
// against the actual bytes. Fail closed if a future renderer changes this contract.
const completedLayout = z.object({ _INTERNAL__LAYOUT__DATA_: z.object({ children: z.array(z.object({ type: z.literal('PAGE') })).min(1) }) });
let renderQueue: Promise<unknown> = Promise.resolve();

export function renderCvPdf(input: PdfInput, density: CvDensity, signal?: AbortSignal): Promise<PdfResult> {
  const render = async () => {
    signal?.throwIfAborted();
    if (typeof globalThis.Buffer === 'undefined') Object.defineProperty(globalThis, 'Buffer', { value: Buffer, configurable: true, writable: true });
    await preparePdfFonts();
    signal?.throwIfAborted();
    let pageCount = 0;
    const blob = await pdf(<CvPdfDocument data={input.data} includePhoto={input.includePhoto} density={density} onRender={(result) => {
      pageCount = completedLayout.parse(result)._INTERNAL__LAYOUT__DATA_.children.length;
    }} />).toBlob();
    signal?.throwIfAborted();
    if (!pageCount) throw new Error('PDF page count unavailable');
    return { blob, pageCount, density, sourceKey: input.sourceKey, key: pdfCacheKey(input.sourceKey, density), data: input.data };
  };
  // Shared renderer/font state: allow an in-flight render to finish, but skip
  // cancelled queued renders and never publish an obsolete result.
  const task = renderQueue.then(render, render);
  renderQueue = task.then(() => undefined, () => undefined);
  return task;
}
export async function generateCvPdf(input: PdfInput, signal?: AbortSignal): Promise<PdfResult> {
  return selectPdfDensity((density) => renderCvPdf(input, density, signal), signal);
}
export async function createCvPdf(data: CvData, options: CvPdfOptions = {}): Promise<Blob> {
  const input = preparePdfInput(data, options.includePhoto);
  if (!input) throw new Error('Korjaa CV:n virheelliset tiedot ennen PDF:n lataamista.');
  return (options.density ? await renderCvPdf(input, options.density) : await generateCvPdf(input)).blob;
}
