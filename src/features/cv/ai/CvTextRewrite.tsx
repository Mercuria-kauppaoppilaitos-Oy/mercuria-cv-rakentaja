import { useEffect, useId, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { rewriteMessages, type RewriteRequest } from '../../../../shared/rewrite-contract';
import type { CvData } from '../cv-model';
import { rewriteText } from './rewrite-text';

type Props = { form: UseFormReturn<CvData>; sourceText: string } & (
  { textType: 'profile'; entryId?: never; jobTitle?: never }
  | { textType: 'workExperience'; entryId: string; jobTitle: string }
);
type Proposal = { original: string; payload: RewriteRequest; suggestion: string };
const setValueOptions = { shouldDirty: true, shouldTouch: true, shouldValidate: true };

export function CvTextRewrite(props: Props) {
  const { form, sourceText, textType } = props;
  const id = useId();
  const opener = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const restoreFocus = useRef(false);
  const request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  useEffect(() => { if (proposal) heading.current?.focus(); }, [proposal]);
  useEffect(() => {
    if (restoreFocus.current && !busy && !proposal) { opener.current?.focus(); restoreFocus.current = false; }
  }, [busy, proposal]);
  const short = sourceText.trim().length < 10;
  const long = sourceText.trim().length > 1500;
  const close = () => {
    request.current?.abort(); request.current = null;
    restoreFocus.current = true;
    setBusy(false); setProposal(null); setError('');
  };
  async function start(previous?: Proposal) {
    if (request.current) return;
    const original = previous?.original ?? sourceText;
    const payload = previous?.payload ?? {
      textType, sourceText: original,
      ...(props.textType === 'workExperience' && props.jobTitle.trim() ? { jobTitle: props.jobTitle } : {}),
    };
    if (original.trim().length < 10) { setError(rewriteMessages.short); return; }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError('');
    try {
      const suggestion = await rewriteText(payload, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;
      setProposal({ original, payload, suggestion });
    } catch (failure) {
      if (request.current !== controller || controller.signal.aborted) return;
      setError(failure instanceof Error && failure.message === rewriteMessages.timeout ? rewriteMessages.timeout : rewriteMessages.failure);
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }
  function accept() {
    if (!proposal || request.current) return;
    if (props.textType === 'profile') {
      if (form.getValues('summary') !== proposal.original) { setError(rewriteMessages.changed); return; }
      form.setValue('summary', proposal.suggestion, setValueOptions);
    } else {
      // Resolve the current index from the domain ID at acceptance, never from a captured array index.
      const entries = form.getValues('workExperience');
      const index = entries.findIndex((entry) => entry.id === props.entryId);
      if (index < 0) { close(); return; }
      if (entries[index]?.description !== proposal.original) { setError(rewriteMessages.changed); return; }
      form.setValue(`workExperience.${index}.description`, proposal.suggestion, setValueOptions);
    }
    close();
  }
  return <div className="text-rewrite">
    <p id={`${id}-privacy`} className="field-help">Tekoälytoimintoa käytettäessä vain tämän kentän teksti ja mahdollinen tehtävänimike lähetetään käsiteltäväksi. Tarkista ehdotus ennen sen käyttämistä.</p>
    {(short || long) && <p id={`${id}-help`} className="field-help">{short ? rewriteMessages.short : rewriteMessages.long}</p>}
    <button ref={opener} type="button" disabled={short || long || busy || Boolean(proposal)} aria-describedby={`${id}-privacy${short || long ? ` ${id}-help` : ''}`} onClick={() => void start()}>{busy ? 'Jalostetaan…' : 'Jalosta tekoälyllä'}</button>
    <p className="field-error rewrite-error" aria-live="polite" aria-atomic="true">{error}</p>
    {proposal && <section className="rewrite-proposal" aria-labelledby={`${id}-heading`} onKeyDown={(event) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
      <h4 id={`${id}-heading`} tabIndex={-1} ref={heading}>Tekoälyn tekstiehdotus</h4>
      <h5>Alkuperäinen teksti</h5><p className="rewrite-copy">{proposal.original}</p>
      <h5>Ehdotus</h5><p className="rewrite-copy">{proposal.suggestion}</p>
      <div className="rewrite-actions">
        <button type="button" className="add-button" disabled={busy} onClick={accept}>Käytä ehdotusta</button>
        <button type="button" disabled={busy} onClick={() => void start(proposal)}>{busy ? 'Jalostetaan…' : 'Yritä uudelleen'}</button>
        <button type="button" onClick={close}>Peruuta</button>
      </div>
    </section>}
  </div>;
}
