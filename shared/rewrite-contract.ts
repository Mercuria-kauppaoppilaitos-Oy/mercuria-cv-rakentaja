import { z } from 'zod';

export const rewriteRequestSchema = z.object({
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

export type RewriteRequest = z.infer<typeof rewriteRequestSchema>;
export const rewriteMessages = {
  short: 'Teksti on liian lyhyt jalostettavaksi.',
  long: 'Jalostettavan tekstin enimmäispituus on 1500 merkkiä.',
  failure: 'Tekstin jalostaminen ei juuri nyt onnistunut. Alkuperäinen tekstisi säilyi.',
  timeout: 'Pyyntö kesti liian kauan. Yritä uudelleen.',
  changed: 'Kentän teksti on muuttunut. Alkuperäistä tekstiä ei korvattu. Peruuta ehdotus ja jalosta nykyinen teksti uudelleen.',
} as const;
