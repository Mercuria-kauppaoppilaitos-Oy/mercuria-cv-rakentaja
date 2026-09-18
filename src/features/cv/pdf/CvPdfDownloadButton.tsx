import { useEffect, useRef, useState } from 'react';
import { cvSchema, type CvData } from '../cv-model';
import { getPdfFilename } from './pdf-filename';
import { downloadPdf } from './pdf-utils';

export function CvPdfDownloadButton({ data }: { data: CvData }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [includePhoto, setIncludePhoto] = useState(true);
  const inProgress = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  return <div className="pdf-download">
    {data.appearance.photoDataUrl && <label className="checkbox-field"><input type="checkbox" checked={includePhoto} disabled={busy} onChange={(event) => setIncludePhoto(event.target.checked)} />Sisällytä valokuva PDF:ään</label>}
    <p className="field-help">Kuvaton CV on yleensä varmin vaihtoehto sähköisiin rekrytointijärjestelmiin. Valokuva on vapaaehtoinen.</p>
    <button type="button" className="add-button" disabled={busy || !cvSchema.safeParse(data).success} aria-describedby="pdf-privacy pdf-ats" onClick={async () => {
      if (inProgress.current) return;
      inProgress.current = true;
      setBusy(true); setStatus('PDF:ää luodaan…'); setError('');
      try {
        const snapshot = structuredClone(data);
        const { createCvPdf } = await import('./create-cv-pdf');
        const blob = await createCvPdf(snapshot, { includePhoto });
        if (!active.current) return;
        downloadPdf(blob, getPdfFilename(snapshot.personalDetails));
        setStatus('PDF on valmis. Tiedoston lataus käynnistyi.');
      } catch {
        if (active.current) { setStatus(''); setError('PDF:n luominen ei onnistunut. Yritä uudelleen.'); }
      } finally {
        inProgress.current = false;
        if (active.current) setBusy(false);
      }
    }}>{busy ? 'PDF:ää luodaan…' : 'Lataa CV PDF-muodossa'}</button>
    <p id="pdf-privacy" className="field-help">PDF muodostetaan tällä laitteella. Tietojasi ei lähetetä palvelimelle.</p>
    <p id="pdf-ats" className="field-help">ATS-luettavaksi suunniteltu tekstipohjainen PDF.</p>
    <p role="status" aria-live="polite">{status}</p>
    {error && <p role="alert" className="field-error">{error}</p>}
  </div>;
}
