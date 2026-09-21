import { z } from 'zod';

export const rewriteRequestSchema = z.object({
  operation: z.literal('rewrite').default('rewrite'),
  textType: z.enum(['profile', 'workExperience']),
  sourceText: z.string().trim().min(10).max(1500),
  jobTitle: z.string().trim().max(150).optional(),
}).strict().refine((value) => value.textType === 'workExperience' || value.jobTitle === undefined);

export const rewriteResponseSchema = z.object({
  suggestion: z.string().trim().min(10).max(1000).refine((text) =>
    !/[<>•●▪‣◦\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)
    && !/^\s*(?:#{1,6}\s|[-*+•●▪‣◦]\s|\d+[.)]\s)/mu.test(text)
    && !/^["'“”„«»]|["'“”„«»]$/u.test(text)
    && !/```|\*\*|\[[^\]]+\]\(/u.test(text),
  ),
}).strict();

export type RewriteRequest = z.input<typeof rewriteRequestSchema>;
export const normalizeSkill = (value: string) => value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('fi');
export const skillSourceSchema = z.object({
  professionalTitle: z.string().trim().max(150), summary: z.string().trim().max(1500),
  workExperience: z.array(z.object({ title: z.string().trim().max(150), description: z.string().trim().max(1500) }).strict()).max(10),
  education: z.array(z.object({ qualification: z.string().trim().max(200), description: z.string().trim().max(1500) }).strict()).max(10),
}).strict();
export const hasSkillSource = (source: z.infer<typeof skillSourceSchema>) => [source.summary, ...source.workExperience.flatMap((entry) => [entry.title, entry.description]), ...source.education.flatMap((entry) => [entry.qualification, entry.description])].join(' ').trim().length >= 10;
export const skillsRequestSchema = z.object({ operation: z.literal('suggest-skills'), source: skillSourceSchema.refine(hasSkillSource) }).strict();
export type SkillsRequest = z.infer<typeof skillsRequestSchema>;
export const aiRequestSchema = z.preprocess((value) => {
  // Existing deployed clients may still omit the rewrite operation.
  if (value && typeof value === 'object' && !Array.isArray(value) && !('operation' in value)) return { ...value, operation: 'rewrite' };
  return value;
}, z.discriminatedUnion('operation', [rewriteRequestSchema, skillsRequestSchema]));
const skillName = z.string().trim().min(2).max(80).refine((value) =>
  !/[<>\r\n\u0000-\u001f]/u.test(value) && !/^(?:[-*+#•]|\d+[.)])|https?:|\*\*|\[[^\]]+\]\(/u.test(value)
  && !['osaaminen', 'työntekijä', 'henkilö', 'opiskelija'].includes(normalizeSkill(value)));
export const skillsResponseSchema = z.object({ skills: z.array(skillName).min(1).max(10) }).strict().transform(({ skills }) => ({
  skills: skills.filter((skill, index) => skills.findIndex((other) => normalizeSkill(other) === normalizeSkill(skill)) === index),
}));
export const skillsMessages = {
  empty: 'Lisää ensin sisältöä esittelyyn, työkokemukseen tai koulutukseen.',
  long: 'Lähdeteksti on liian pitkä osaamisehdotuksia varten.',
  failure: 'Osaamisehdotusten hakeminen ei onnistunut. Yritä uudelleen.',
};
export const rewriteMessages = {
  short: 'Teksti on liian lyhyt jalostettavaksi.',
  long: 'Jalostettavan tekstin enimmäispituus on 1500 merkkiä.',
  failure: 'Tekstin jalostaminen ei juuri nyt onnistunut. Alkuperäinen tekstisi säilyi.',
  timeout: 'Pyyntö kesti liian kauan. Yritä uudelleen.',
  changed: 'Kentän teksti on muuttunut. Alkuperäistä tekstiä ei korvattu. Peruuta ehdotus ja jalosta nykyinen teksti uudelleen.',
} as const;
