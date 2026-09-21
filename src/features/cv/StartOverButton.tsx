import { useEffect, useRef, useState } from 'react';

export function StartOverButton({ activeStep, onReset }: { activeStep: number; onReset: () => void }) {
  const [armed, setArmed] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => { setArmed(false); }, [activeStep]);
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 8000);
    const cancel = (event: Event) => {
      if (event instanceof KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); setArmed(false); } }
      else if (event.target instanceof Element && !button.current?.contains(event.target) && event.target.closest('button, input, select, textarea, a, summary, [role="button"]')) setArmed(false);
    };
    document.addEventListener('pointerdown', cancel, true);
    document.addEventListener('click', cancel, true);
    document.addEventListener('keydown', cancel, true);
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', cancel, true); document.removeEventListener('click', cancel, true); document.removeEventListener('keydown', cancel, true); };
  }, [armed]);
  return <>
    <button ref={button} type="button" className={`start-over ${armed ? 'start-over-confirm' : ''}`} onClick={() => {
      if (armed) { setArmed(false); onReset(); } else setArmed(true);
    }}>{armed ? 'Oletko varma?' : 'Aloita alusta'}</button>
    <span className="sr-only" aria-live="polite" aria-atomic="true" role={armed ? 'status' : undefined}>{armed ? 'Vahvista CV:n tyhjennys painamalla uudelleen kahdeksan sekunnin kuluessa. Escape peruuttaa.' : ''}</span>
  </>;
}
