import { useEffect, useRef } from 'react';

export function ClearDraftDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);
  return <div className="dialog-backdrop">
    <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="clear-title" aria-describedby="clear-description" className="clear-dialog" onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancel(); }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll('button');
        if (!buttons) return;
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons[buttons.length - 1]?.focus(); }
        else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) { event.preventDefault(); buttons[0]?.focus(); }
      }
    }}>
      <h2 id="clear-title">Tyhjennetäänkö kaikki tiedot?</h2>
      <p id="clear-description">Henkilötiedot, kokemukset, koulutukset ja muut merkinnät sekä valittu väri ja valokuva poistetaan lomakkeesta ja selaimen luonnostallennuksista.</p>
      <div className="dialog-actions"><button type="button" onClick={onCancel}>Peruuta</button><button type="button" className="remove-button" onClick={onConfirm}>Vahvista tyhjennys</button></div>
    </div>
  </div>;
}
