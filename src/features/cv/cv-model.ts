import { z } from 'zod';

const optionalEmail = z.union([z.literal(''), z.email('Tarkista sähköpostiosoitteen muoto.')]);
const optionalLinkedIn = z.string().refine((value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'));
  } catch { return false; }
}, 'Anna LinkedIn-osoite muodossa https://www.linkedin.com/in/nimi.');
const dateRangeSchema = z.object({ startDate: z.string(), endDate: z.string(), isCurrent: z.boolean() });

export const cvSchema = z.object({
  personalDetails: z.object({ firstName: z.string(), lastName: z.string(), professionalTitle: z.string(), email: optionalEmail, phone: z.string(), city: z.string(), linkedIn: optionalLinkedIn }),
  summary: z.string(),
  workExperience: z.array(dateRangeSchema.extend({ id: z.string(), employer: z.string(), title: z.string(), location: z.string(), description: z.string() })),
  education: z.array(dateRangeSchema.extend({ id: z.string(), institution: z.string(), qualification: z.string(), location: z.string(), description: z.string() })),
  skills: z.array(z.object({ id: z.string(), name: z.string() })),
  digitalSkills: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
  languages: z.array(z.object({ id: z.string(), name: z.string(), proficiency: z.string() })),
  certifications: z.array(z.object({ id: z.string(), name: z.string(), issuer: z.string(), issuedDate: z.string(), expiryDate: z.string() })),
  references: z.array(z.object({ id: z.string(), name: z.string(), title: z.string(), organization: z.string(), email: optionalEmail, phone: z.string() })),
  template: z.literal('single-column'),
  appearance: z.object({ fontFamily: z.enum(['sans-serif', 'serif']), fontSize: z.number().positive(), lineHeight: z.number().positive() }),
});
export type CvData = z.infer<typeof cvSchema>;
export function createEmptyWorkExperience(): CvData['workExperience'][number] {
  return { id: crypto.randomUUID(), title: '', employer: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
}
export function createEmptyEducation(): CvData['education'][number] {
  return { id: crypto.randomUUID(), qualification: '', institution: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' };
}
export function createEmptyCv(): CvData {
  return {
    personalDetails: { firstName: '', lastName: '', professionalTitle: '', email: '', phone: '', city: '', linkedIn: '' },
    summary: '', workExperience: [], education: [], skills: [], digitalSkills: [], languages: [], certifications: [], references: [],
    template: 'single-column', appearance: { fontFamily: 'sans-serif', fontSize: 11, lineHeight: 1.6 },
  };
}
