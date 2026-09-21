import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useCvPdf } from './CvPdfProvider';
type Frame = { url: string; key: string; sourceKey: string; pageCount: number };

export function CvPdfPreview() {
  const pdf = useCvPdf();
  const [frames, setFrames] = useState<Frame[]>([]);
  const [shown, setShown] = useState('');
  const [loaded, setLoaded] = useState('');
  const shownRef = useRef('');
  const newest = useRef('');
  const owned = useRef(new Set<string>());
  useEffect(() => {
    if (!pdf.result) return;
    const url = URL.createObjectURL(pdf.result.blob);
    owned.current.add(url); newest.current = url;
    const next = { url, key: pdf.result.key, sourceKey: pdf.result.sourceKey, pageCount: pdf.result.pageCount };
    setFrames((current) => [...current.filter((frame) => frame.url === shownRef.current), next]);
  }, [pdf.result]);
  // After the replacement frame is mounted/loaded, release frames no longer used.
  useLayoutEffect(() => {
    for (const url of owned.current) if (!frames.some((frame) => frame.url === url)) {
      URL.revokeObjectURL(url); owned.current.delete(url);
    }
  }, [frames]);
  // A completed Blob may still be loading when the form changes again. Publish
  // only the current input; an undo can reuse the already loaded cached frame.
  useLayoutEffect(() => {
    const frame = frames.find((item) => item.url === loaded);
    if (!frame || newest.current !== frame.url || frame.sourceKey !== pdf.sourceKey || shownRef.current === loaded) return;
    shownRef.current = loaded; setShown(loaded);
    setFrames([frame]);
    pdf.presented(frame.key);
  }, [frames, loaded, pdf.sourceKey, pdf.presented]);
  useEffect(() => () => { for (const url of owned.current) URL.revokeObjectURL(url); owned.current.clear(); }, []);
  const visible = frames.find((frame) => frame.url === shown);
  return <div className="pdf-preview" aria-busy={pdf.updating}>
    <p className="preview-status" role="status" aria-live="polite">{pdf.updating ? 'Päivitetään esikatselua…' : visible ? `${visible.pageCount} ${visible.pageCount === 1 ? 'sivu' : 'sivua'}` : ''}</p>
    {pdf.error && <div className="field-error" role="alert"><p>{pdf.error}</p><button type="button" onClick={pdf.retry}>Yritä uudelleen</button></div>}
    <div className="pdf-frame-stack">
      {frames.map((frame) => <iframe key={frame.url} title={frame.url === shown || !shown ? 'CV:n PDF-esikatselu' : 'Valmistuva PDF-esikatselu'}
        className={frame.url === shown ? 'pdf-frame-current' : 'pdf-frame-pending'} aria-hidden={Boolean(shown && frame.url !== shown)} tabIndex={shown && frame.url !== shown ? -1 : 0}
        src={`${frame.url}#toolbar=0&view=FitH`} onLoad={() => {
          if (newest.current !== frame.url) return;
          setLoaded(frame.url);
        }} />)}
    </div>
    {visible && <a href={visible.url} target="_blank" rel="noreferrer">Avaa PDF-esikatselu uuteen välilehteen</a>}
  </div>;
}
