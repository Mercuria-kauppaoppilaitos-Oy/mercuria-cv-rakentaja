import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyCv } from '../cv-model';
import { getPdfFilename } from './pdf-filename';
import { downloadPdf, getLinkedText } from './pdf-utils';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
it.each([
  ['Päivi', 'Määttä', 'Paivi_Maatta_CV.pdf'],
  ['Åsa-Maria', 'Ääkkönen Östergård', 'Asa-Maria_Aakkonen_Ostergard_CV.pdf'],
  ['', '', 'CV.pdf'],
  ['<>:"/\\|?*', '\u0000\u0001', 'CV.pdf'],
  ['  Päivi  Maria ', '  Määttä. ', 'Paivi_Maria_Maatta_CV.pdf'],
  ['CON', '', 'CON_CV.pdf'],
])('puhdistaa tiedostonimen %s %s', (firstName, lastName, expected) => {
  expect(getPdfFilename({ ...createEmptyCv().personalDetails, firstName, lastName })).toBe(expected);
});
it('rajoittaa tiedostonimen pituuden ja poistaa polku- sekä ohjausmerkit', () => {
  const filename = getPdfFilename({ ...createEmptyCv().personalDetails, firstName: '../'.repeat(100) + 'Ä'.repeat(200), lastName: 'Nimi' });
  expect(filename.length).toBeLessThanOrEqual(117); expect(filename).toMatch(/^[A-Za-z0-9_-]+_CV\.pdf$/);
});
it('linkittää kelvolliset URL:t ja sähköpostit muuttamatta näkyvää tekstiä', () => {
  const text = 'Portfolio: https://example.com/paivi. Ota yhteyttä: paivi@example.com';
  const parts = getLinkedText(text);
  expect(parts.map((part) => part.text).join('')).toBe(text);
  expect(parts.filter((part) => part.href).map((part) => part.href)).toEqual(['https://example.com/paivi', 'mailto:paivi@example.com']);
});
it('ei tee virheellisistä tai vaarallisista osoitteista linkkejä', () => {
  const text = 'javascript:alert(1) https:// https://user:password@example.com https://[invalid';
  const parts = getLinkedText(text);
  expect(parts.map((part) => part.text).join('')).toBe(text); expect(parts.some((part) => part.href)).toBe(false);
});
it('käynnistää latauksen, poistaa linkin ja vapauttaa blob-URL:n viiveen jälkeen', () => {
  vi.useFakeTimers();
  const create = vi.fn(() => 'blob:cv'); const revoke = vi.fn();
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: create, revokeObjectURL: revoke }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('CV.pdf'); expect(this.href).toBe('blob:cv'); expect(this.isConnected).toBe(true);
  });
  const blob = new Blob(['%PDF-test']); downloadPdf(blob, 'CV.pdf');
  expect(create).toHaveBeenCalledWith(blob); expect(click).toHaveBeenCalledOnce();
  expect(document.querySelector('a[download]')).toBeNull(); expect(revoke).not.toHaveBeenCalled();
  vi.runAllTimers(); expect(revoke).toHaveBeenCalledWith('blob:cv');
});
it('vapauttaa URL:n myös latauksen käynnistämisen epäonnistuessa', () => {
  const revoke = vi.fn();
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL: vi.fn(() => 'blob:cv'), revokeObjectURL: revoke }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('Download failed'); });
  expect(() => downloadPdf(new Blob(['%PDF-test']), 'CV.pdf')).toThrow('Download failed');
  expect(revoke).toHaveBeenCalledWith('blob:cv'); expect(document.querySelector('a[download]')).toBeNull();
});
