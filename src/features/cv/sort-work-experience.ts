import type { CvData } from './cv-model';

type WorkExperience = CvData['workExperience'][number];
const validMonth = (value: string) => /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value);
const validPeriod = (entry: WorkExperience) => validMonth(entry.startDate)
  && (entry.isCurrent || (validMonth(entry.endDate) && entry.endDate >= entry.startDate));

/** Presentation only. Invalid/incomplete periods retain their relative order at the end. */
export function sortWorkExperience(entries: readonly WorkExperience[]): WorkExperience[] {
  return [...entries].sort((a, b) => {
    const aValid = validPeriod(a); const bValid = validPeriod(b);
    if (aValid !== bValid) return aValid ? -1 : 1;
    if (!aValid) return 0;
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    if (!a.isCurrent && a.endDate !== b.endDate) return a.endDate < b.endDate ? 1 : -1;
    return a.startDate === b.startDate ? 0 : a.startDate < b.startDate ? 1 : -1;
  });
}
