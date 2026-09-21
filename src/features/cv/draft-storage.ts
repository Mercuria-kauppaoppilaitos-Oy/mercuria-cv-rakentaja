import { z } from 'zod';
import { defaultAccentColor, isHexColor } from './color-utils';
import { createEmptyCv, cvSchema, type CvData } from './cv-model';
const draftSchemaVersion = 4;

export const draftStorageKey = 'mercuria-cv-draft-v1';
const storedCvSchema = cvSchema.extend({ appearance: cvSchema.shape.appearance.extend({ accentColor: z.preprocess((value) => typeof value === 'string' && isHexColor(value) ? value : defaultAccentColor, cvSchema.shape.appearance.shape.accentColor) }) });
const legacyCvSchema = storedCvSchema.extend({ digitalSkills: z.array(z.object({ id: z.string(), name: z.string(), proficiency: z.enum(['', 'Perusteet', 'Hyvä', 'Edistynyt']) })).optional() });
const envelopeSchema = z.discriminatedUnion('schemaVersion', [
  z.object({ schemaVersion: z.literal(4), persistent: z.boolean(), data: storedCvSchema }),
  z.object({ schemaVersion: z.literal(3), persistent: z.boolean(), data: storedCvSchema }),
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
export const storageErrorMessage = 'Luonnoksen tallennus ei onnistunut. Selaimen tallennustila voi olla täynnä tai estetty. Kokeile poistaa kuva. Nykyiset tiedot ovat edelleen lomakkeessa.';

export function loadDraft(): { data: CvData; persistent: boolean; restored: boolean; error: string } {
  try {
    const local = localStorage.getItem(draftStorageKey);
    const session = sessionStorage.getItem(draftStorageKey);
    const stored = session ?? local;
    if (!stored) return { data: createEmptyCv(), persistent: false, restored: false, error: '' };
    const result = envelopeSchema.safeParse(JSON.parse(stored));
    if (!result.success) {
      throw new Error('Invalid draft');
    }

    const data = result.data.schemaVersion >= 3 ? result.data.data : migrateLegacySkills(result.data.data);
    // Version 3 did not record whether its temporary default was selected manually.
    if (result.data.schemaVersion === 3 && data.appearance.accentColor.toUpperCase() === '#EDF3F5') data.appearance.accentColor = defaultAccentColor;
    return { data, persistent: false, restored: true, error: '' };
  } catch {
    return { data: createEmptyCv(), persistent: false, restored: false, error: 'Luonnosta ei voitu palauttaa. Tallennus on estetty tai luonnos on virheellinen tai vanhentunut. Aloitetaan tyhjästä.' };
  }
}

export function saveDraft(data: CvData): string {
  if (!cvSchema.safeParse(data).success) return '';
  try {
    const target = sessionStorage;
    // Keep the previous valid copy if the new storage write exceeds its quota.
    target.setItem(draftStorageKey, JSON.stringify({ schemaVersion: draftSchemaVersion, persistent: false, data: cvSchema.parse(data) }));
    localStorage.removeItem(draftStorageKey);
    return '';
  } catch { return storageErrorMessage; }
}
