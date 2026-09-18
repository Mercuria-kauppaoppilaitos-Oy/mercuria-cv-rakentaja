import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyCv } from './cv-model';
import { draftStorageKey, loadDraft, removeDrafts, saveDraft } from './draft-storage';
afterEach(() => vi.restoreAllMocks());
it('tallentaa ja palauttaa istuntoluonnoksen väreineen ja kuvineen', () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Aino';
  data.appearance.accentColor = '#203040';
  data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA==';
  expect(saveDraft(data, false)).toBe('');
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(loadDraft()).toMatchObject({ data, restored: true, persistent: false });
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).schemaVersion).toBe(2);
});
it('siirtää luonnoksen tallennusten välillä ja poistaa molemmat turvallisesti', () => {
  const data = createEmptyCv();
  saveDraft(data, false);
  saveDraft(data, true);
  expect(sessionStorage.getItem(draftStorageKey)).toBeNull();
  expect(loadDraft().persistent).toBe(true);
  saveDraft(data, false);
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(loadDraft().persistent).toBe(false);
  expect(removeDrafts()).toBe('');
  expect(sessionStorage.getItem(draftStorageKey)).toBeNull();
});
it.each(['invalid json', '{"schemaVersion":0}', '{"schemaVersion":1,"data":{}}'])('palauttaa tyhjän tilan virheellisestä tai vanhasta luonnoksesta: %s', (value) => {
  sessionStorage.setItem(draftStorageKey, value);
  expect(loadDraft()).toMatchObject({ data: createEmptyCv(), restored: false, persistent: false });
  expect(loadDraft().error).not.toBe('');
});
it('hylkää aktiivisen sisällön kuvaosoitteessa', () => {
  const data = createEmptyCv();
  data.appearance.photoDataUrl = 'data:image/svg+xml,<svg onload="alert(1)"/>';
  sessionStorage.setItem(draftStorageKey, JSON.stringify({ schemaVersion: 1, persistent: false, data }));
  expect(loadDraft().restored).toBe(false);
});
it('käsittelee kiintiön ylittymisen ja tallennuksen estymisen kaatumatta', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  expect(saveDraft(createEmptyCv(), false)).toContain('tallennustila');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
  expect(loadDraft().data).toEqual(createEmptyCv());
});
it('säilyttää aiemman istuntoluonnoksen, jos pysyvän tallennuksen käyttöönotto epäonnistuu', () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Aino';
  saveDraft(data, false);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  expect(saveDraft(data, true)).toContain('tallennustila');
  expect(sessionStorage.getItem(draftStorageKey)).toContain('Aino');
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
});
it.each([false, true])('migroi version 1 kuvan ja värin poistamalla kohdistusarvot (persistent=%s)', (persistent) => {
  const data = createEmptyCv(); data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA=='; data.appearance.accentColor = '#203040';
  const legacy = { ...data, appearance: { ...data.appearance, photoPositionX: 80, photoPositionY: 20 } };
  (persistent ? localStorage : sessionStorage).setItem(draftStorageKey, JSON.stringify({ schemaVersion: 1, persistent, data: legacy }));
  const restored = loadDraft(); expect(restored).toMatchObject({ restored: true, persistent, data });
  expect(restored.data.appearance).not.toHaveProperty('photoPositionX'); expect(restored.data.appearance).not.toHaveProperty('photoPositionY');
  saveDraft(restored.data, persistent);
  expect(JSON.parse((persistent ? localStorage : sessionStorage).getItem(draftStorageKey)!).schemaVersion).toBe(2);
});
