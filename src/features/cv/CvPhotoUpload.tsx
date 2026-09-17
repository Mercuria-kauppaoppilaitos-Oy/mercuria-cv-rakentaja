import { useEffect, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CvData } from './cv-model';
import { processPhoto } from './image-utils';
import { CvPhoto } from './CvPhoto';

export function CvPhotoUpload({ form, appearance }: { form: UseFormReturn<CvData>; appearance: CvData['appearance'] }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const hasPhoto = Boolean(appearance.photoDataUrl);
  return <fieldset className="photo-controls"><legend>Valokuva</legend>
    <p id="photo-help" className="field-help">Valokuva on vapaaehtoinen eikä sitä tarvita ATS-järjestelmiä varten. JPEG, PNG tai WebP, enintään 5 Mt. Kuva käsitellään ja pienennetään selaimessa.</p>
    <label htmlFor="photo-file">{hasPhoto ? 'Vaihda kuva' : 'Lisää valokuva'}</label>
    <input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby={error ? 'photo-help photo-error' : 'photo-help'} aria-invalid={Boolean(error)} disabled={busy} onChange={async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      const current = ++request.current;
      setBusy(true); setError('');
      try {
        const photo = await processPhoto(file);
        if (request.current !== current) return;
        form.setValue('appearance.photoDataUrl', photo, { shouldDirty: true, shouldValidate: true });
        form.setValue('appearance.photoPositionX', 50);
        form.setValue('appearance.photoPositionY', 50);
      } catch (failure) { if (request.current === current) setError(failure instanceof Error ? failure.message : 'Kuvaa ei voitu käsitellä.'); }
      finally { if (request.current === current) setBusy(false); }
    }} />
    {busy && <p role="status">Kuvaa käsitellään…</p>}
    {error && <p className="field-error" id="photo-error" role="alert">{error}</p>}
    {hasPhoto && <>
      <CvPhoto appearance={appearance} />
      <button type="button" className="remove-button" onClick={() => {
        request.current++; setBusy(false); setError('');
        form.setValue('appearance.photoDataUrl', '', { shouldDirty: true, shouldValidate: true });
        form.setValue('appearance.photoPositionX', 50); form.setValue('appearance.photoPositionY', 50);
      }}>Poista kuva</button>
      <label htmlFor="photo-x">Vaakakohdistus</label><input id="photo-x" type="range" min="0" max="100" {...form.register('appearance.photoPositionX', { valueAsNumber: true })} />
      <label htmlFor="photo-y">Pystykohdistus</label><input id="photo-y" type="range" min="0" max="100" {...form.register('appearance.photoPositionY', { valueAsNumber: true })} />
    </>}
  </fieldset>;
}
