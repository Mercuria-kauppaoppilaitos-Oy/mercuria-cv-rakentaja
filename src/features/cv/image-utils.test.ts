import { afterEach, expect, it, vi } from 'vitest';
import { maxOriginalImageBytes, processPhoto, validateImageFile } from './image-utils';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each(['image/jpeg', 'image/png', 'image/webp'])('hyväksyy sallitun kuvatyypin %s', (type) => expect(() => validateImageFile(new File(['photo'], 'photo', { type }))).not.toThrow());
it('hylkää väärän muodon, liian suuren ja tyhjän kuvan', () => {
  expect(() => validateImageFile(new File(['photo'], 'photo.svg', { type: 'image/svg+xml' }))).toThrow('JPEG');
  expect(() => validateImageFile(new File([new Uint8Array(maxOriginalImageBytes + 1)], 'photo.png', { type: 'image/png' }))).toThrow('5 Mt');
  expect(() => validateImageFile(new File([], 'photo.png', { type: 'image/png' }))).toThrow('tyhjä');
});
function jpeg() {
  const file = new File(['jpeg'], 'photo.jpg', { type: 'image/jpeg' });
  vi.spyOn(file, 'slice').mockReturnValue({ arrayBuffer: async () => new Uint8Array([255, 216, 255]).buffer } as Blob);
  return file;
}
it('varmistaa tiedoston sisällön eikä luota nimeen tai MIME-tyyppiin', async () => {
  const file = jpeg();
  vi.mocked(file.slice).mockReturnValue({ arrayBuffer: async () => new Uint8Array([0, 0, 0]).buffer } as Blob);
  await expect(processPhoto(file)).rejects.toThrow('sisältö');
});
it('ilmoittaa kuvan purkamisen epäonnistumisesta', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')));
  await expect(processPhoto(jpeg())).rejects.toThrow('Kuvaa ei voitu avata');
});
it('rajaa keskeltä neliöksi, pienentää ja uudelleenpakkaa kuvan sekä vapauttaa bitmapin', async () => {
  const close = vi.fn();
  const bitmap = { width: 1600, height: 800, close };
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), drawImage } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
    expect(this.width).toBe(512); expect(this.height).toBe(512);
    callback(new Blob(['processed'], { type: 'image/jpeg' }));
  });
  expect(await processPhoto(jpeg())).toMatch(/^data:image\/jpeg;base64,/);
  expect(drawImage).toHaveBeenCalledWith(bitmap, 400, 0, 800, 800, 0, 0, 512, 512);
  expect(close).toHaveBeenCalledOnce();
});
