import { useEffect, useRef, useState } from 'react';
import type { CvData } from './cv-model';
import { loadDraft, saveDraft } from './draft-storage';
export function useDraftStorage(data: CvData, initial: ReturnType<typeof loadDraft>) {
  const [notice, setNotice] = useState(initial.restored ? 'Luonnos palautettu' : '');
  const [error, setError] = useState(initial.error);
  const latest = useRef(data);
  latest.current = data;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    timer.current = setTimeout(() => setError(saveDraft(latest.current)), 400);
    const flush = () => { saveDraft(latest.current); };
    window.addEventListener('pagehide', flush);
    return () => { clearTimeout(timer.current); window.removeEventListener('pagehide', flush); };
  }, [data]);
  const replace = (next: CvData) => {
    clearTimeout(timer.current);
    latest.current = next;
    setError(saveDraft(next));
    setNotice('CV tyhjennetty. Voit aloittaa alusta.');
  };
  return { notice, error, replace, dismissNotice: () => setNotice('') };
}
