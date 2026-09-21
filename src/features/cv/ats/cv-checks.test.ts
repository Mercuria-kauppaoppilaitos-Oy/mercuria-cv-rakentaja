import { expect, it } from 'vitest';
import { createEmptyCv } from '../cv-model';
import { normalizeText, containsPhrase } from './text-normalization';
import { checkCv } from './cv-checks';
it('normalisoi kirjainkoon, Unicode-merkit ja välit mutta ei sekoita sanoja', () => {
  expect(normalizeText('  MICROSOFT\n Excel! ')).toBe('microsoft excel');
  expect(containsPhrase('excelent', 'Excel')).toBe(false);
  expect(containsPhrase('kassatyö', 'työ')).toBe(false);
});
it('tarkistaa puuttuvat tiedot, tyhjät rivit, ajankohdat ja pitkät tekstit ilman valokuvavirhettä', () => {
  const data = createEmptyCv(); data.summary = 'x'.repeat(901);
  data.workExperience = [{ id: '1', title: 'Työ', employer: '', location: '', startDate: '2025-02', endDate: '2024-03', isCurrent: false, description: '' }];
  data.skills = [{ id: '1', name: '' }];
  const checks = checkCv(data);
  expect(checks.find((check) => check.label === 'Ajankohtien johdonmukaisuus')!.status).toBe('Kannattaa tarkistaa');
  expect(checks.find((check) => check.label === 'Tyhjät merkinnät')!.status).toBe('Kannattaa tarkistaa');
  expect(checks.find((check) => check.label === 'Tekstin luettavuus')!.status).toBe('Kannattaa tarkistaa');
  expect(checks.some((check) => /valokuva/i.test(check.label))).toBe(false);
});
