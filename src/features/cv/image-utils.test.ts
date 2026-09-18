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
  await expect(processPhoto(file, { x: 0, y: 0, width: 800, height: 800 })).rejects.toThrow('sisältö');
});
it('ilmoittaa kuvan purkamisen epäonnistumisesta', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('decode')));
  await expect(processPhoto(jpeg(), { x: 0, y: 0, width: 800, height: 800 })).rejects.toThrow('Kuvaa ei voitu avata');
});
it('rajaa valitun alueen neliöksi, pienentää ja uudelleenpakkaa kuvan sekä vapauttaa bitmapin', async () => {
  const close = vi.fn();
  const bitmap = { width: 1600, height: 800, close };
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), drawImage } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
    expect(this.width).toBe(512); expect(this.height).toBe(512);
    callback(new Blob(['processed'], { type: 'image/jpeg' }));
  });
  expect(await processPhoto(jpeg(), { x: 0, y: 0, width: 800, height: 800 })).toMatch(/^data:image\/jpeg;base64,/);
  expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 800, 800, 0, 0, 512, 512);
  expect(close).toHaveBeenCalledOnce();
});
it.each([
  [1600, 800, 0, 0], [1600, 800, 800, 0],
  [800, 1600, 0, 0], [800, 1600, 0, 800], [12000, 8000, 11200, 7200],
])('käyttää alkuperäisen kuvan reunarajausta %sx%s (%s,%s)', async (width, height, x, y) => {
  const bitmap = { width, height, close: vi.fn() };
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue(bitmap));
  const drawImage = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), drawImage } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback, type) {
    expect(this.width).toBe(512); expect(this.height).toBe(512); expect(type).toBe('image/jpeg');
    callback(new Blob(['processed'], { type: 'image/jpeg' }));
  });
  await processPhoto(jpeg(), { x, y, width: 800, height: 800 });
  expect(drawImage).toHaveBeenCalledWith(bitmap, x, y, 800, 800, 0, 0, 512, 512);
  expect(createImageBitmap).toHaveBeenCalledWith(expect.any(File), { imageOrientation: 'from-image' });
  expect(bitmap.close).toHaveBeenCalledOnce();
});
it('pakkaa uudelleen kokorajan saavuttamiseksi eikä suurenna pientä kuvaa', async () => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 64, height: 64, close: vi.fn() }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  let attempts = 0;
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, callback) {
    expect(this.width).toBe(64); expect(this.height).toBe(64);
    callback(new Blob([new Uint8Array(++attempts === 1 ? 410000 : 400000)], { type: 'image/jpeg' }));
  });
  const result = await processPhoto(jpeg(), { x: 0, y: 0, width: 64, height: 64 });
  expect(attempts).toBe(2); expect(atob(result.split(',')[1]!).length).toBeLessThanOrEqual(400 * 1024);
});
it('hylkää liian suuren lopputuloksen ja vapauttaa bitmapin', async () => {
  const close = vi.fn(); vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 64, height: 64, close }));
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob([new Uint8Array(410000)])));
  await expect(processPhoto(jpeg(), { x: 0, y: 0, width: 64, height: 64 })).rejects.toThrow('riittävästi'); expect(close).toHaveBeenCalledOnce();
});
