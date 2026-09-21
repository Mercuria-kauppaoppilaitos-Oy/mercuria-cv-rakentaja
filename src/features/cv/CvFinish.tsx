import type { PdfPhotoControl } from './pdf/pdf-options';
import { cvSchema, type CvData } from './cv-model';
import { CvPdfDownloadButton } from './pdf/CvPdfDownloadButton';

export function CvFinish({ data, pdfPhoto }: { data: CvData; pdfPhoto?: PdfPhotoControl }) {
  const validation = cvSchema.safeParse(data);
  return <section aria-label="PDF-lataus">
    {!validation.success && <div className="validation-summary" role="alert"><p>Korjaa vielä seuraavat tiedot:</p><ul>{validation.error.issues.map((issue, index) => <li key={index}>{issue.message}</li>)}</ul></div>}
    <CvPdfDownloadButton data={data} pdfPhoto={pdfPhoto} />
    <p className="field-help">Luonnos säilyy tässä selainistunnossa.</p>
  </section>;
}
