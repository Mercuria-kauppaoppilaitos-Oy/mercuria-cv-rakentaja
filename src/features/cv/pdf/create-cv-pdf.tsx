import { pdf } from '@react-pdf/renderer';
import { Buffer } from 'buffer/';
import { cvSchema, type CvData } from '../cv-model';
import { CvPdfDocument } from './CvPdfDocument';
import { registerPdfFonts } from './pdf-fonts';
import type { CvPdfOptions } from './pdf-options';

export async function createCvPdf(data: CvData, options: CvPdfOptions = {}): Promise<Blob> {
  const validated = cvSchema.safeParse(data);
  if (!validated.success) throw new Error('Korjaa CV:n virheelliset tiedot ennen PDF:n lataamista.');
  // @react-pdf/layout 5.2 checks the global Buffer when resolving even data-URL images.
  // This compatibility module is only loaded with the on-demand PDF bundle.
  if (typeof globalThis.Buffer === 'undefined') Object.defineProperty(globalThis, 'Buffer', { value: Buffer, configurable: true, writable: true });
  registerPdfFonts();
  return pdf(<CvPdfDocument data={validated.data} includePhoto={options.includePhoto} />).toBlob();
}
