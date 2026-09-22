import { expect, it } from 'vitest';
import { createShortCvFixture } from '../../test/cv-fixture';
import { getCvSections } from './cv-content';
import { sortWorkExperience } from './sort-work-experience';

it('sorts only the presentation, with stable ties and invalid periods last', () => {
  const data = createShortCvFixture();
  data.education.reverse();
  const base = data.workExperience[0]!;
  data.workExperience = [
    { ...base, id: 'missing', startDate: '' },
    { ...base, id: 'old', endDate: '2026-10' },
    { ...base, id: 'tie-a' },
    { ...base, id: 'invalid', endDate: '2026-13' },
    { ...base, id: 'earlier-start', startDate: '2026-08' },
    { ...base, id: 'tie-b' },
    { ...base, id: 'current', startDate: '2025-01', endDate: '', isCurrent: true },
    { ...base, id: 'reverse', endDate: '2025-01' },
    { ...base, id: 'invalid-current', startDate: '', isCurrent: true },
    { ...base, id: 'new-current', isCurrent: true },
    { ...base, id: 'zero-year', startDate: '0000-01' },
  ];
  const snapshot = structuredClone(data);
  data.workExperience.forEach(Object.freeze); Object.freeze(data.workExperience);
  const expected = ['new-current', 'current', 'tie-a', 'tie-b', 'earlier-start', 'old', 'missing', 'invalid', 'reverse', 'invalid-current', 'zero-year'];
  expect(sortWorkExperience(data.workExperience).map((entry) => entry.id)).toEqual(expected);
  const sections = getCvSections(data);
  const work = sections.find((section) => section.id === 'cv-work-title');
  const education = sections.find((section) => section.id === 'cv-education-title');
  expect(work?.kind === 'entries' && work.entries.map((entry) => entry.id)).toEqual(expected);
  expect(education?.kind === 'entries' && education.entries.map((entry) => entry.id)).toEqual(data.education.map((entry) => entry.id));
  expect(data).toEqual(snapshot);
});
