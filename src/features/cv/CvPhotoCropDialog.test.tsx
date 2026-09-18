import { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../../App';
import { createEmptyCv } from './cv-model';
import { saveDraft } from './draft-storage';
import * as imageUtils from './image-utils';
const photo = 'data:image/jpeg;base64,/9j/AA==';
vi.mock('react-easy-crop', () => ({ default: ({ onCropComplete }: { onCropComplete: (percent: object, pixels: object) => void }) => {
  useEffect(() => { onCropComplete({}, { x: 0, y: 0, width: 64, height: 64 }); }, []);
  return <div tabIndex={0} aria-label="Siirrä kuvaa" />;
} }));
beforeEach(() => {
  vi.spyOn(imageUtils, 'validatePhoto').mockResolvedValue();
  vi.spyOn(imageUtils, 'processPhoto').mockResolvedValue(photo);
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:photo') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
});
afterEach(() => vi.restoreAllMocks());
async function upload() { const user = userEvent.setup(); await user.upload(screen.getByLabelText('Lisää valokuva'), new File(['photo'], 'photo.png', { type: 'image/png' })); return user; }
it('avaa dialogin, tarjoaa vain Zoomauksen ja tallentaa vasta vahvistettaessa sekä poistaa kuvan', async () => {
  render(<App />); const user = await upload();
  const dialog = await screen.findByRole('dialog', { name: 'Rajaa valokuva' });
  expect(screen.getAllByRole('slider')).toHaveLength(1);
  expect(screen.getByRole('slider', { name: 'Zoomaus' })).toBeVisible();
  expect(screen.queryByLabelText('Vaakakohdistus')).toBeNull(); expect(screen.queryByLabelText('Pystykohdistus')).toBeNull();
  expect(imageUtils.processPhoto).not.toHaveBeenCalled();
  expect((await axe.run(dialog, { rules: { 'color-contrast': { enabled: false } } })).violations).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Käytä kuvaa' }));
  expect(imageUtils.processPhoto).toHaveBeenCalledWith(expect.any(File), { x: 0, y: 0, width: 64, height: 64 });
  expect(screen.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toHaveAttribute('src', photo);
  expect(screen.getByRole('button', { name: 'Vaihda kuva' })).toHaveFocus();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:photo');
  await user.click(screen.getByRole('button', { name: 'Poista kuva' }));
  expect(screen.getByRole('article').querySelector('img')).toBeNull();
});
it.each(['Peruuta', 'Escape'])('säilyttää vanhan kuvan ja palauttaa fokuksen: %s', async (action) => {
  const data = createEmptyCv(); data.appearance.photoDataUrl = photo; saveDraft(data, false);
  render(<App />); const user = userEvent.setup();
  await user.upload(screen.getByLabelText('Vaihda kuva'), new File(['new'], 'new.png', { type: 'image/png' }));
  const dialog = await screen.findByRole('dialog');
  if (action === 'Escape') fireEvent(dialog, new Event('cancel', { bubbles: false, cancelable: true }));
  else await user.click(screen.getByRole('button', { name: 'Peruuta' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toHaveAttribute('src', photo);
  expect(screen.getByRole('button', { name: 'Vaihda kuva' })).toHaveFocus();
  expect(imageUtils.processPhoto).not.toHaveBeenCalled();
});
it('ilmoittaa käsittelyn virheen dialogissa säilyttäen aiemman kuvan', async () => {
  vi.mocked(imageUtils.processPhoto).mockRejectedValue(new Error('Käsittely epäonnistui'));
  render(<App />); const user = await upload();
  await user.click(await screen.findByRole('button', { name: 'Käytä kuvaa' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Käsittely epäonnistui');
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());
});
