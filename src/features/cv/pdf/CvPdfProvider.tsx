import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CvData } from '../cv-model';
import { preparePdfInput, type PdfResult } from './pdf-input';

export type PdfState = {
  result?: PdfResult; sourceKey: string; ready: boolean; updating: boolean; error: string;
  retry: () => void; presented: (key: string) => void;
};
const PdfContext = createContext<PdfState | null>(null);
export function useCvPdf() {
  const state = useContext(PdfContext);
  if (!state) throw new Error('PDF provider is missing');
  return state;
}

export function CvPdfProvider({ data, includePhoto, children }: { data: CvData; includePhoto: boolean; children: ReactNode }) {
  const input = preparePdfInput(data, includePhoto);
  const sourceKey = input?.sourceKey ?? '';
  const latestInput = useRef(input);
  latestInput.current = input;
  const [result, setResult] = useState<PdfResult>();
  const [presentedKey, setPresentedKey] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const revision = useRef(0);
  // Bounded cache: only the last successful document, no growing per-keystroke map.
  const cached = useRef<PdfResult | undefined>(undefined);
  useEffect(() => {
    const request = ++revision.current;
    const controller = new AbortController();
    setError('');
    if (!sourceKey) return () => controller.abort();
    if (cached.current?.sourceKey === sourceKey) { setResult(cached.current); return () => controller.abort(); }
    const timer = setTimeout(async () => {
      const snapshot = latestInput.current;
      if (!snapshot || snapshot.sourceKey !== sourceKey) return;
      try {
        const { generateCvPdf } = await import('./create-cv-pdf');
        controller.signal.throwIfAborted();
        const next = await generateCvPdf(snapshot, controller.signal);
        if (request !== revision.current || controller.signal.aborted) return;
        cached.current = next;
        setResult(next);
      } catch {
        if (request === revision.current && !controller.signal.aborted) setError('Esikatselun päivittäminen epäonnistui. Edellinen valmis versio säilyy näkyvissä.');
      }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [sourceKey, attempt]);
  const ready = Boolean(sourceKey && result?.sourceKey === sourceKey && presentedKey === result.key);
  const message = sourceKey ? error : 'Korjaa lomakkeen virheelliset tiedot, jotta esikatselu voidaan päivittää.';
  return <PdfContext.Provider value={{ result, sourceKey, ready, updating: !ready && !message, error: message, retry: () => setAttempt((value) => value + 1), presented: setPresentedKey }}>{children}</PdfContext.Provider>;
}
