import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CvData } from './cv-model';
import { validatePhoto } from './image-utils';
import { CvPhoto } from './CvPhoto';
import { CvPhotoCropDialog } from './CvPhotoCropDialog';

export function CvPhotoUpload({ form, appearance }: { form: UseFormReturn<CvData>; appearance: CvData['appearance'] }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const restoreFocus = useRef(false);
  useEffect(() => () => { request.current++; }, []);
  useEffect(() => {
    if (!file && restoreFocus.current) { restoreFocus.current = false; opener.current?.focus(); }
  }, [file]);
  const hasPhoto = Boolean(appearance.photoDataUrl);
  const close = () => { restoreFocus.current = true; setFile(null); };
  return <fieldset className="photo-controls"><legend>Valokuva</legend>
    <p id="photo-help" className="field-help">Valokuva on vapaaehtoinen eikä sitä tarvita ATS-järjestelmiä varten. JPEG, PNG tai WebP, enintään 5 Mt. Kuva käsitellään ja pienennetään selaimessa.</p>
    <button ref={opener} type="button" disabled={busy} aria-describedby={error ? 'photo-help photo-error' : 'photo-help'} onClick={() => input.current?.click()}>{hasPhoto ? 'Vaihda kuva' : 'Lisää valokuva'}</button>
    <input ref={input} id="photo-file" hidden tabIndex={-1} aria-label={hasPhoto ? 'Vaihda kuva' : 'Lisää valokuva'} type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={error ? 'photo-help photo-error' : 'photo-help'} aria-invalid={Boolean(error)} disabled={busy} onChange={async (event) => {
      const selected = event.target.files?.[0];
      event.target.value = '';
      if (!selected) return;
      const current = ++request.current;
      setBusy(true); setError('');
      try { await validatePhoto(selected); if (request.current === current) setFile(selected); }
      catch (failure) { if (request.current === current) setError(failure instanceof Error ? failure.message : 'Kuvaa ei voitu käsitellä.'); }
      finally { if (request.current === current) setBusy(false); }
    }} />
    {busy && <p role="status">Kuvaa tarkistetaan…</p>}
    {error && <p className="field-error" id="photo-error" role="alert">{error}</p>}
    {hasPhoto && <><CvPhoto appearance={appearance} /><button type="button" className="remove-button" onClick={() => {
      request.current++; setBusy(false); setError('');
      form.setValue('appearance.photoDataUrl', '', { shouldDirty: true, shouldValidate: true });
    }}>Poista kuva</button></>}
    {file && <CvPhotoCropDialog file={file} onCancel={close} onConfirm={(photo) => {
      form.setValue('appearance.photoDataUrl', photo, { shouldDirty: true, shouldValidate: true }); close();
    }} />}
  </fieldset>;
}
