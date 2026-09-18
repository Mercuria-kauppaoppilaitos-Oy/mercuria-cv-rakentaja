import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { formatDescription, getCvSections } from './cv-content';
import { createShortCvFixture } from '../../test/cv-fixture';
import { CvPreview } from './CvPreview';
import { compareRequirements } from './ats/job-analysis';
import { detectRequirements } from './ats/requirement-detection';

it.each([
  ['Hyllytys\nSiisteys', 'Hyllytys. Siisteys.'],
  ['Tähän tulee tietoa kokemuksesta\nTähän tulee tietoa kokemuksesta', 'Tähän tulee tietoa kokemuksesta. Tähän tulee tietoa kokemuksesta.'],
  ['Ääkköset ja esim. CRM', 'Ääkköset ja esim. CRM.'],
  ['Ensimmäinen tehtävä\u2028Toinen tehtävä\u2029Kolmas tehtävä.', 'Ensimmäinen tehtävä. Toinen tehtävä. Kolmas tehtävä.'],
  ['Palvelin asiakkaita.\r\nOpin kassatyötä!', 'Palvelin asiakkaita. Opin kassatyötä!'],
  [' esim.\nCRM-järjestelmä mm.\nM365 / ERP', 'esim. CRM-järjestelmä mm. M365 / ERP.'],
  [' \n\r\n', ''],
  ['• Hyllytys\n- Siisteys\n* Kassatyö', 'Hyllytys. Siisteys. Kassatyö.'],
  ['Kysyin: ”Tarvitsetko apua?”\nAsiakaspalvelu…', 'Kysyin: ”Tarvitsetko apua?” Asiakaspalvelu…'],
])('yhdistää vanhat rivit vain esityksessä ja säilyttää lopetusmerkit: %s', (input, expected) => {
  expect(formatDescription(input)).toBe(expected);
});
it('HTML käyttää samaa sisältöprojektiota, säilyttää lähdedatan ja ATS tunnistaa taidot', () => {
  const data = createShortCvFixture(); const snapshot = JSON.stringify(data);
  const sections = getCvSections(data); render(<CvPreview data={data} />);
  const article = screen.getByRole('article');
  for (const section of sections) {
    if (section.kind !== 'entries') continue;
    for (const entry of section.entries) {
      for (const line of entry.lines) expect(within(article).getByText(line)).toBeVisible();
      if (entry.paragraph) expect(within(article).getByText(entry.paragraph)).toBeVisible();
    }
  }
  const work = article.querySelector('[aria-labelledby="cv-work-title"]')!;
  expect(work.querySelector('ul, li')).toBeNull();
  expect(article.querySelector('[aria-labelledby="cv-skills-title"] ul')).toHaveClass('cv-compact-list');
  expect(article.querySelector('[aria-labelledby="cv-languages-title"] ul')).toHaveClass('cv-compact-list');
  expect(JSON.stringify(data)).toBe(snapshot);
  const findings = compareRequirements(data, detectRequirements('Edellytämme Microsoft 365 ja kassatyö osaamista.'));
  expect(findings.find((finding) => finding.name === 'Microsoft 365')!.status).toBe('found');
  expect(findings.find((finding) => finding.name === 'Kassatyö')!.status).toBe('missing');
});
