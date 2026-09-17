import { useEffect, useRef, useState } from 'react';
import { createEmptyCv, cvSchema, type CvData } from './cv-model';
import { loadDraft, removeDrafts, removePersistentDraft, saveDraft } from './draft-storage';

export function useDraftStorage(data: CvData, initial: ReturnType<typeof loadDraft>) {
  const [persistent, setPersistent] = useState(initial.persistent);
  const [notice, setNotice] = useState(initial.restored ? 'Luonnos palautettu' : '');
  const [error, setError] = useState(initial.error);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cleared = useRef(false);
  useEffect(() => {
    clearTimeout(timer.current);
    if (cleared.current && JSON.stringify(data) === JSON.stringify(createEmptyCv())) return;
    cleared.current = false;
    timer.current = setTimeout(() => setError(saveDraft(data, persistent)), 400);
    return () => clearTimeout(timer.current);
  }, [data, persistent]);
  // Flush on refresh/close before the debounce completes.
  useEffect(() => {
    const flush = () => { if (!cleared.current) saveDraft(data, persistent); };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [data, persistent]);
  return {
    persistent, notice, error,
    dismissNotice: () => setNotice(''),
    changePersistence: (value: boolean) => {
      clearTimeout(timer.current);
      if (value && !cvSchema.safeParse(data).success) {
        setError('Korjaa lomakkeen virheelliset kentät ennen pysyvän tallennuksen käyttöönottoa.');
        return;
      }
      if (!value) {
        const removalError = removePersistentDraft();
        if (removalError) { setError(removalError); return; }
      }
      const failure = saveDraft(data, value);
      setPersistent(value); setError(failure);
    },
    clear: () => {
      clearTimeout(timer.current); cleared.current = true;
      setPersistent(false); setError(removeDrafts()); setNotice('Kaikki tiedot tyhjennetty');
    },
  };
}
