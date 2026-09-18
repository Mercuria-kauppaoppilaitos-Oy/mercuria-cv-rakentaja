import { useEffect, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { processPhoto, type PhotoCrop } from './image-utils';

export function CvPhotoCropDialog({ file, onCancel, onConfirm }: { file: File; onCancel: () => void; onConfirm: (photo: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const active = useRef(true);
  const [source, setSource] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PhotoCrop | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    active.current = true;
    const url = URL.createObjectURL(file);
    setSource(url);
    dialog.current?.showModal();
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { active.current = false; URL.revokeObjectURL(url); document.body.style.overflow = previousOverflow; };
  }, [file]);
  return <dialog ref={dialog} className="photo-crop-dialog" aria-modal="true" aria-labelledby="crop-title" aria-describedby="crop-help crop-keyboard" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <h2 id="crop-title">Rajaa valokuva</h2>
    <p id="crop-help">Siirrä kuvaa vetämällä ja säädä kokoa tarvittaessa.</p>
    <p id="crop-keyboard" className="sr-only">Siirrä kohdistus kuvaan sarkaimella. Voit siirtää kuvaa nuolinäppäimillä.</p>
    <div className="photo-crop-area">
      {source && <Cropper image={source} crop={crop} zoom={zoom} aspect={1} cropShape="round" showGrid={false} restrictPosition minZoom={1} maxZoom={3} keyboardStep={5} zoomWithScroll={false} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)} cropperProps={{ role: 'group', 'aria-label': 'Siirrä kuvaa', 'aria-describedby': 'crop-keyboard' }} mediaProps={{ onError: () => setError('Kuvaa ei voitu avata. Valitse ehjä JPEG-, PNG- tai WebP-kuva.') }} />}
    </div>
    <label htmlFor="photo-zoom">Zoomaus</label>
    <input id="photo-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
    {error && <p role="alert" className="field-error">{error}</p>}
    {busy && <p role="status">Kuvaa käsitellään…</p>}
    <div className="dialog-actions">
      <button type="button" onClick={onCancel}>Peruuta</button>
      <button type="button" disabled={busy || !croppedAreaPixels || Boolean(error)} onClick={async () => {
        if (!croppedAreaPixels) return;
        setBusy(true); setError('');
        try { const photo = await processPhoto(file, croppedAreaPixels); if (active.current) onConfirm(photo); }
        catch (failure) { if (active.current) setError(failure instanceof Error ? failure.message : 'Kuvaa ei voitu käsitellä.'); }
        finally { if (active.current) setBusy(false); }
      }}>Käytä kuvaa</button>
    </div>
  </dialog>;
}
