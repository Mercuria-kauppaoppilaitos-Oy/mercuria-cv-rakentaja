import { z } from 'zod';
import { defaultAccentColor } from './color-utils';

const optionalEmail = z.union([z.literal(''), z.email('Tarkista sähköpostiosoitteen muoto.')]);
const optionalLinkedIn = z.string().refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'));
  } catch { return false; }
}, 'Anna LinkedIn-osoite muodossa https://www.linkedin.com/in/nimi.');
const dateRangeSchema = z.object({ startDate: z.string(), endDate: z.string(), isCurrent: z.boolean() });
export const digitalLevels = ['Perusteet', 'Hyvä', 'Edistynyt'] as const;
export const languageLevels = ['Äidinkieli', 'Erinomainen', 'Sujuva', 'Hyvä', 'Tyydyttävä', 'Perusteet'] as const;

export const cvSchema = z.object({
  personalDetails: z.object({ firstName: z.string(), lastName: z.string(), professionalTitle: z.string(), email: optionalEmail, phone: z.string(), city: z.string(), linkedIn: optionalLinkedIn }),
  summary: z.string(),
  workExperience: z.array(dateRangeSchema.extend({ id: z.string(), employer: z.string(), title: z.string(), location: z.string(), description: z.string() })),
  education: z.array(dateRangeSchema.extend({ id: z.string(), institution: z.string(), qualification: z.string(), location: z.string(), description: z.string() })),
  skills: z.array(z.object({ id: z.string(), name: z.string() })),
  digitalSkills: z.array(z.object({ id: z.string(), name: z.string(), proficiency: z.union([z.literal(''), z.enum(digitalLevels)]) })),
  languages: z.array(z.object({ id: z.string(), name: z.string(), proficiency: z.union([z.literal(''), z.enum(languageLevels)]) })),
  certifications: z.array(z.object({ id: z.string(), name: z.string(), issuer: z.string(), issuedDate: z.string().regex(/^$|^\d{4}$/, 'Anna nelinumeroinen suoritusvuosi tai jätä kenttä tyhjäksi.'), expiryDate: z.string() })),
  references: z.array(z.object({ id: z.string(), name: z.string(), title: z.string(), organization: z.string(), email: optionalEmail, phone: z.string() })),
  referencesDisplay: z.enum(['contact', 'on-request', 'hidden']),
  template: z.literal('single-column'),
  appearance: z.object({
    fontFamily: z.enum(['sans-serif', 'serif']), fontSize: z.number().positive().max(30), lineHeight: z.number().positive().max(3),
    accentColor: z.string().regex(/^#[\da-f]{6}$/i, 'Anna väri muodossa #RRGGBB.'),
    photoDataUrl: z.string().max(560000).regex(/^$|^data:image\/(jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Kuvan tiedot eivät kelpaa.'),
    photoPositionX: z.number().min(0).max(100), photoPositionY: z.number().min(0).max(100),
  }),
});
export type CvData = z.infer<typeof cvSchema>;
export type AdditionalSection = 'skills' | 'digitalSkills' | 'languages' | 'certifications' | 'references';
export function createEmptyAdditionalEntry(name: AdditionalSection) {
  const id = crypto.randomUUID();
  switch (name) {
    case 'skills': return { id, name: '' };
    case 'digitalSkills':
    case 'languages': return { id, name: '', proficiency: '' as const };
    case 'certifications': return { id, name: '', issuer: '', issuedDate: '', expiryDate: '' };
    case 'references': return { id, name: '', title: '', organization: '', email: '', phone: '' };
  }
}
export function createEmptyWorkExperience(): CvData['workExperience'][number] {
  return { id: crypto.randomUUID(), title: '', employer: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
}
export function createEmptyEducation(): CvData['education'][number] {
  return { id: crypto.randomUUID(), qualification: '', institution: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
}
export function createEmptyCv(): CvData {
  return {
    personalDetails: { firstName: '', lastName: '', professionalTitle: '', email: '', phone: '', city: '', linkedIn: '' },
    summary: '', workExperience: [], education: [], skills: [], digitalSkills: [], languages: [], certifications: [], references: [], referencesDisplay: 'contact',
    template: 'single-column', appearance: { fontFamily: 'sans-serif', fontSize: 11, lineHeight: 1.6, accentColor: defaultAccentColor, photoDataUrl: '', photoPositionX: 50, photoPositionY: 50 },
  };
}
