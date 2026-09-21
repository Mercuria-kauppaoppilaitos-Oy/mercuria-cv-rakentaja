import { afterEach, expect, it, vi } from 'vitest';
import { createEmptyCv } from './cv-model';
import { defaultAccentColor } from './color-utils';
import { draftStorageKey, loadDraft, saveDraft } from './draft-storage';
afterEach(() => vi.restoreAllMocks());
it.each([1, 2])('migroi version %s osaamiset ja digitaidot hävittämättä muita tietoja', (schemaVersion) => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Olivia';
  data.summary = 'Ääkköset ja alkuperäiset rivit\nsäilyvät.';
  data.skills = [{ id: 'original', name: ' Excel ' }, { id: 'duplicate', name: 'excel' }, { id: 'service', name: 'Asiakaspalvelu' }];
  const legacy = { ...data, digitalSkills: [{ id: 'old-excel', name: 'EXCEL', proficiency: 'Hyvä' }, { id: 'old-procountor', name: ' Procountor ', proficiency: 'Perusteet' }, { id: 'old-duplicate', name: 'procountor', proficiency: 'Perusteet' }] };
  const raw = JSON.stringify({ schemaVersion, persistent: false, data: legacy }); sessionStorage.setItem(draftStorageKey, raw);
  const restored = loadDraft();
  expect(restored.restored).toBe(true); expect(restored.error).toBe('');
  expect(restored.data.skills).toEqual([{ id: 'original', name: 'Excel – hyvä' }, { id: 'service', name: 'Asiakaspalvelu' }, { id: 'old-procountor', name: 'Procountor – perusteet' }]);
  expect(restored.data).not.toHaveProperty('digitalSkills');
  expect({ ...restored.data, skills: data.skills }).toEqual(data);
  expect(sessionStorage.getItem(draftStorageKey)).toBe(raw);
  saveDraft(restored.data);
  expect(loadDraft().data).toEqual(restored.data);
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).schemaVersion).toBe(4);
});
it('tallentaa ja palauttaa istuntoluonnoksen väreineen ja kuvineen', () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Aino';
  data.appearance.accentColor = '#203040';
  data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA==';
  expect(saveDraft(data)).toBe('');
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(loadDraft()).toMatchObject({ data, restored: true, persistent: false });
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).schemaVersion).toBe(4);
});
it('siirtää vanhan pysyvän luonnoksen istuntoon vasta onnistuneen tallennuksen jälkeen', () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Aino';
  localStorage.setItem(draftStorageKey, JSON.stringify({ schemaVersion: 3, persistent: true, data }));
  expect(loadDraft()).toMatchObject({ data, restored: true, persistent: false });
  expect(localStorage.getItem(draftStorageKey)).not.toBeNull();
  saveDraft(data);
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(loadDraft().data).toEqual(data);
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
  expect(saveDraft(createEmptyCv())).toContain('tallennustila');
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Denied', 'SecurityError'); });
  expect(loadDraft().data).toEqual(createEmptyCv());
});
it('säilyttää aiemman istuntoluonnoksen, jos seuraava tallennus epäonnistuu', () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Aino';
  saveDraft(data);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  expect(saveDraft(data)).toContain('tallennustila');
  expect(sessionStorage.getItem(draftStorageKey)).toContain('Aino');
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
});
it.each([false, true])('migroi version 1 kuvan ja värin poistamalla kohdistusarvot (persistent=%s)', (persistent) => {
  const data = createEmptyCv(); data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA=='; data.appearance.accentColor = '#203040';
  const legacy = { ...data, appearance: { ...data.appearance, photoPositionX: 80, photoPositionY: 20 } };
  (persistent ? localStorage : sessionStorage).setItem(draftStorageKey, JSON.stringify({ schemaVersion: 1, persistent, data: legacy }));
  const restored = loadDraft(); expect(restored).toMatchObject({ restored: true, persistent: false, data });
  expect(restored.data.appearance).not.toHaveProperty('photoPositionX'); expect(restored.data.appearance).not.toHaveProperty('photoPositionY');
  saveDraft(restored.data);
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).schemaVersion).toBe(4);
});
it.each([1, 2, 3, 4])('korjaa version %s virheellisen tai puuttuvan värin hävittämättä sisältöä', (schemaVersion) => {
  for (const color of [undefined, 'not-a-color', null]) {
    const data = createEmptyCv(); data.personalDetails.firstName = 'Testi';
    const stored = { ...data, appearance: { ...data.appearance, accentColor: color } };
    sessionStorage.setItem(draftStorageKey, JSON.stringify({ schemaVersion, persistent: false, data: stored }));
    expect(loadDraft()).toMatchObject({ restored: true, data });
  }
});
it.each([
  [3, '#EDF3F5', defaultAccentColor], [3, '#203040', '#203040'],
  [4, '#EDF3F5', '#EDF3F5'], [2, '#EDF3F5', '#EDF3F5'],
])('värimigraatio %s / %s on rajattu ja idempotentti', (schemaVersion, color, expected) => {
  const data = createEmptyCv(); data.summary = 'Alkuperäinen esittely'; data.appearance.accentColor = String(color);
  sessionStorage.setItem(draftStorageKey, JSON.stringify({ schemaVersion, persistent: false, data }));
  const restored = loadDraft();
  expect(restored.data).toEqual({ ...data, appearance: { ...data.appearance, accentColor: expected } });
  saveDraft(restored.data);
  expect(loadDraft().data).toEqual(restored.data);
  expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).schemaVersion).toBe(4);
});
