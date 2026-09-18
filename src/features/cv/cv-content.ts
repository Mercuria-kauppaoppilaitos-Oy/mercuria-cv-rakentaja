import type { CvData } from './cv-model';

export type HistoryEntry = CvData['workExperience'][number] | CvData['education'][number];
export type ContentEntry = { id: string; title: string; lines: string[]; metadata?: boolean; paragraph: string };
export type CvSection = { id: string; heading: string } & (
  | { kind: 'summary'; text: string }
  | { kind: 'entries'; entries: ContentEntry[] }
  | { kind: 'list'; items: { id: string; text: string }[] }
  | { kind: 'notice'; text: string }
);

export function getFullName(details: CvData['personalDetails']): string {
  return [details.firstName.trim(), details.lastName.trim()].filter(Boolean).join(' ');
}

export function formatMonth(value: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? `${match[2]}/${match[1]}` : '';
}

export function formatPeriod(entry: HistoryEntry): string {
  const start = formatMonth(entry.startDate);
  const end = entry.isCurrent ? 'nykyhetki' : formatMonth(entry.endDate);
  return start && end ? `${start}–${end}` : start || end;
}

export function joinDetails(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(' – ');
}

/** Presentation only: retain words and abbreviations without rewriting the draft. */
export function formatDescription(text: string): string {
  return text.split(/\r\n|[\r\n\u2028\u2029]/).map((line) => line.trim().replace(/^(?:[•●]\s*|[-*]\s+)/u, '')).filter(Boolean)
    .map((line) => /[.!?…:;][”’"')\]]*$/u.test(line) ? line : `${line}.`).join(' ');
}

export function getHistoryEntries(entries: HistoryEntry[]): ContentEntry[] {
  return entries.filter((entry) => {
    const title = 'title' in entry ? entry.title : entry.qualification;
    const organization = 'employer' in entry ? entry.employer : entry.institution;
    return [title, organization, entry.location, entry.description, entry.startDate, entry.isCurrent ? '' : entry.endDate].some((value) => value.trim());
  }).map((entry) => ({
    id: entry.id,
    title: ('title' in entry ? entry.title : entry.qualification).trim(),
    lines: [
      [[('employer' in entry ? entry.employer : entry.institution).trim(), entry.location.trim()].filter(Boolean).join(', '), formatPeriod(entry)].filter(Boolean).join(' · '),
    ].filter(Boolean),
    metadata: true,
    paragraph: 'title' in entry ? formatDescription(entry.description) : entry.description.trim(),
  }));
}

export function getAdditionalSections(data: CvData): CvSection[] {
  const lists: Extract<CvSection, { kind: 'list' }>[] = [
    { kind: 'list', heading: 'OSAAMINEN', id: 'cv-skills-title', items: data.skills.map((entry) => ({ id: entry.id, text: entry.name.trim() })) },
    { kind: 'list', heading: 'KIELITAITO', id: 'cv-languages-title', items: data.languages.map((entry) => ({ id: entry.id, text: entry.name.trim() ? joinDetails([entry.name, entry.proficiency.toLocaleLowerCase('fi')]) : '' })) },
    { kind: 'list', heading: 'KORTIT JA PÄTEVYYDET', id: 'cv-certifications-title', items: data.certifications.map((entry) => ({ id: entry.id, text: joinDetails([entry.name, entry.issuer, /^\d{4}$/.test(entry.issuedDate) ? entry.issuedDate : '', entry.expiryDate]) })) },
  ];
  const sections: CvSection[] = lists.flatMap((section) => {
    const items = section.items.filter((item) => item.text);
    return items.length ? [{ ...section, items }] : [];
  });
  if (data.referencesDisplay === 'on-request') {
    sections.push({ kind: 'notice', heading: 'SUOSITTELIJAT', id: 'cv-references-title', text: 'Suosittelijat saatavilla pyydettäessä' });
  } else if (data.referencesDisplay === 'contact') {
    const entries = data.references.filter((entry) => [entry.name, entry.title, entry.organization, entry.email, entry.phone].some((value) => value.trim())).map((entry) => ({
      id: entry.id, title: entry.name.trim(), lines: [joinDetails([entry.title, entry.organization]), entry.email.trim(), entry.phone.trim()].filter(Boolean), paragraph: '',
    }));
    if (entries.length) sections.push({ kind: 'entries', heading: 'SUOSITTELIJAT', id: 'cv-references-title', entries });
  }
  return sections;
}

/** The canonical document order. Preview-only examples are never included. */
export function getCvSections(data: CvData): CvSection[] {
  const sections: CvSection[] = [];
  if (data.summary.trim()) sections.push({ kind: 'summary', heading: 'Esittely', id: 'cv-summary-title', text: data.summary.trim() });
  for (const [source, heading, id] of [
    [data.workExperience, 'TYÖKOKEMUS', 'cv-work-title'],
    [data.education, 'KOULUTUS', 'cv-education-title'],
  ] as const) {
    const entries = getHistoryEntries(source);
    if (entries.length) sections.push({ kind: 'entries', heading, id, entries });
  }
  return [...sections, ...getAdditionalSections(data)];
}
