import { expect, it } from 'vitest';
import { formatDescription, getCvSections } from './cv-content';
import { createShortCvFixture } from '../../test/cv-fixture';

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
it('PDF käyttää yhteistä sisältöprojektiota ja säilyttää lähdedatan', () => {
  const data = createShortCvFixture(); const snapshot = JSON.stringify(data);
  const sections = getCvSections(data);
  expect(sections.map((section) => section.heading)).toEqual(['ESITTELY', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT']);
  expect(sections[1]).toMatchObject({ kind: 'entries', entries: [expect.objectContaining({ paragraph: 'Hyllytys. Siisteys. Palvelin asiakkaita kassalla.' }), expect.anything()] });
  expect(JSON.stringify(data)).toBe(snapshot);
});
