import type { PdfPhotoControl } from './pdf-options';
import { useState } from 'react';
import type { CvData } from '../cv-model';
import { getPdfFilename } from './pdf-filename';
import { downloadPdf } from './pdf-utils';
import { useCvPdf } from './CvPdfProvider';

export function CvPdfDownloadButton({ data, pdfPhoto }: { data: CvData; pdfPhoto?: PdfPhotoControl }) {
  const pdf = useCvPdf();
  const [status, setStatus] = useState('');
  return <div className="pdf-download">
    {data.appearance.photoDataUrl && pdfPhoto && <label className="checkbox-field"><input type="checkbox" checked={pdfPhoto.includePhoto} onChange={(event) => pdfPhoto.onChange(event.target.checked)} />Sisällytä valokuva PDF:ään</label>}
    <p className="field-help">Valokuva on vapaaehtoinen.</p>
    <button type="button" className="add-button" disabled={!pdf.ready} aria-describedby="pdf-download-state pdf-privacy" onClick={() => {
      if (!pdf.ready || !pdf.result) return;
      try { downloadPdf(pdf.result.blob, getPdfFilename(pdf.result.data.personalDetails)); setStatus('PDF on valmis. Tiedoston lataus käynnistyi.'); }
      catch { setStatus('Lataus ei onnistunut. Yritä uudelleen latauspainikkeella.'); }
    }}>Lataa CV PDF-muodossa</button>
    <p id="pdf-download-state" className="field-help">{pdf.ready ? '' : pdf.error ? 'Korjaa tiedot tai yritä esikatselun päivittämistä uudelleen.' : 'PDF:ää päivitetään. Lataus on käytettävissä, kun esikatselu on valmis.'}</p>
    <p id="pdf-privacy" className="field-help">PDF muodostetaan tällä laitteella. Tietojasi ei lähetetä palvelimelle.</p>
    <p role="status" aria-live="polite">{status}</p>
  </div>;
}
