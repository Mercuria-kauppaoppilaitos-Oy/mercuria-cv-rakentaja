import { z } from 'zod';
import { createEmptyCv, cvSchema, type CvData } from './cv-model';

export const draftStorageKey = 'mercuria-cv-draft-v1';
const legacyCvSchema = cvSchema.extend({ digitalSkills: z.array(z.object({ id: z.string(), name: z.string(), proficiency: z.enum(['', 'Perusteet', 'Hyvä', 'Edistynyt']) })).optional() });
const envelopeSchema = z.discriminatedUnion('schemaVersion', [
  z.object({ schemaVersion: z.literal(3), persistent: z.boolean(), data: cvSchema }),
  z.object({ schemaVersion: z.literal(2), persistent: z.boolean(), data: legacyCvSchema }),
  z.object({ schemaVersion: z.literal(1), persistent: z.boolean(), data: legacyCvSchema }),
]);

export function migrateLegacySkills(data: z.infer<typeof legacyCvSchema>): CvData {
  const { digitalSkills = [], ...current } = data;
  const seen = new Map<string, number>();
  const skills: CvData['skills'] = [];
  for (const entry of [...current.skills, ...digitalSkills]) {
    const key = entry.name.trim().toLocaleLowerCase('fi');
    const level = 'proficiency' in entry && typeof entry.proficiency === 'string' ? entry.proficiency.toLocaleLowerCase('fi') : '';
    const existing = seen.get(key);
    if (key && existing !== undefined) {
      if (level && !skills[existing]!.name.includes(` – ${level}`)) skills[existing]!.name = `${skills[existing]!.name.trim()} – ${level}`;
      continue;
    }
    if (key) seen.set(key, skills.length);
    skills.push({ id: entry.id, name: level && key ? `${entry.name.trim()} – ${level}` : entry.name });
  }
  return { ...current, skills };
}
export const storageErrorMessage = 'Luonnoksen tallennus ei onnistunut. Selaimen tallennustila voi olla täynnä tai estetty. Poista kuva tai poista pysyvä tallennus käytöstä. Nykyiset tiedot ovat edelleen lomakkeessa.';

export function loadDraft(): { data: CvData; persistent: boolean; restored: boolean; error: string } {
  try {
    const local = localStorage.getItem(draftStorageKey);
    const session = sessionStorage.getItem(draftStorageKey);
    const stored = local ?? session;
    if (!stored) return { data: createEmptyCv(), persistent: false, restored: false, error: '' };
    const result = envelopeSchema.safeParse(JSON.parse(stored));
    if (!result.success || (local !== null && !result.data.persistent) || (local === null && result.data.persistent)) {
      throw new Error('Invalid draft');
    }
    if (local !== null) sessionStorage.removeItem(draftStorageKey);
    return { data: result.data.schemaVersion === 3 ? result.data.data : migrateLegacySkills(result.data.data), persistent: result.data.persistent, restored: true, error: '' };
  } catch {
    return { data: createEmptyCv(), persistent: false, restored: false, error: 'Luonnosta ei voitu palauttaa. Tallennus on estetty tai luonnos on virheellinen tai vanhentunut. Aloitetaan tyhjästä.' };
  }
}

export function saveDraft(data: CvData, persistent: boolean): string {
  if (!cvSchema.safeParse(data).success) return '';
  try {
    const target = persistent ? localStorage : sessionStorage;
    const other = persistent ? sessionStorage : localStorage;
    // Keep the previous valid copy if the new storage write exceeds its quota.
    target.setItem(draftStorageKey, JSON.stringify({ schemaVersion: 3, persistent, data: cvSchema.parse(data) }));
    other.removeItem(draftStorageKey);
    return '';
  } catch { return storageErrorMessage; }
}

export function removeDrafts(): string {
  let error = '';
  for (const getStorage of [() => localStorage, () => sessionStorage]) {
    try { getStorage().removeItem(draftStorageKey); } catch { error = 'Lomake tyhjennettiin, mutta selaimen tallennusta ei voitu poistaa. Tarkista selaimen sivustotiedot ennen laitteen luovuttamista toiselle käyttäjälle.'; }
  }
  return error;
}

export function removePersistentDraft(): string {
  try { localStorage.removeItem(draftStorageKey); return ''; }
  catch { return storageErrorMessage; }
}
