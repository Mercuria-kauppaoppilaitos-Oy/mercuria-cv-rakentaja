import { expect, it } from 'vitest';
import { createEmptyCv } from '../cv-model';
import { normalizeText, containsPhrase } from './text-normalization';
import { detectRequirements } from './requirement-detection';
import { compareRequirements } from './job-analysis';
import { checkCv } from './cv-checks';
import { skillConcepts } from './skill-concepts';
it('normalisoi kirjainkoon, Unicode-merkit ja välit mutta ei sekoita sanoja', () => {
  expect(normalizeText('  MICROSOFT\n Excel! ')).toBe('microsoft excel');
  expect(containsPhrase('excelent', 'Excel')).toBe(false);
  expect(containsPhrase('kassatyö', 'työ')).toBe(false);
});
it.each(skillConcepts)('tunnistaa tunnetut synonyymit: $name', (concept) => {
  const data = createEmptyCv(); data.skills = [{ id: 'test', name: concept.aliases[0]! }];
  const requirements = detectRequirements(`Edellytämme osaamista: ${concept.name}.`);
  const result = compareRequirements(data, requirements)[0]!;
  expect(result.evidence).toHaveLength(1);
  expect(result.status).toBe(concept.example ? 'review' : 'found');
});
it('erottaa vaaditun ja toivotun eikä poimi tarjottuja tai kiellettyjä vaatimuksia', () => {
  const result = detectRequirements('Edellytämme:\n- Excel\n- CRM\nToivomme:\n- Hygieniapassi\nTarjoamme Excel-koulutusta. Ei edellytetä kassatyötä.');
  expect(result.map((item) => [item.name, item.priority])).toEqual([['Excel', 'Edellytetty'], ['CRM', 'Edellytetty'], ['Hygieniapassi', 'Toivottu']]);
});
it('ei päättele työnantajan nimestä, kiinnostuksesta tai kielteisestä tekstistä osaamista', () => {
  const data = createEmptyCv();
  data.workExperience = [{ id: '1', title: 'Myyjä', employer: 'Excel', location: '', startDate: '', endDate: '', isCurrent: false, description: 'En osaa Exceliä. Haluaisin oppia CRM.' }];
  const findings = compareRequirements(data, detectRequirements('Edellytämme Exceliä ja CRM osaamista.'));
  expect(findings.map((item) => item.status)).toEqual(['review', 'review']);
  data.workExperience[0]!.description = '';
  expect(compareRequirements(data, detectRequirements('Edellytämme Excel osaamista.'))[0]!.status).toBe('missing');
});
it('vaatii ammatilliselle taidolle esimerkin ja jättää määrällisen kokemuksen tarkistettavaksi', () => {
  const data = createEmptyCv(); data.skills = [{ id: '1', name: 'Asiakaspalvelu' }];
  const requirements = detectRequirements('Odotamme asiakaspalvelua. Vaaditaan kolmen vuoden kokemus.');
  expect(compareRequirements(data, requirements).map((item) => item.status)).toEqual(['review', 'review']);
  data.workExperience = [{ id: '1', title: 'Myyjä', employer: 'Yritys', location: '', startDate: '', endDate: '', isCurrent: false, description: 'Vastasin asiakaspalvelusta ja asiakkaiden palveleminen kuului tehtäviini.' }];
  expect(compareRequirements(data, requirements)[0]!.status).toBe('found');
});
it('antaa ymmärrettävän virheen tyhjälle ja liian pitkälle ilmoitukselle', () => {
  expect(() => detectRequirements('')).toThrow('vähintään');
  expect(() => detectRequirements('Excel')).toThrow('vähintään');
  expect(() => detectRequirements('x'.repeat(100001))).toThrow('liian pitkä');
  expect(detectRequirements('x'.repeat(90000))).toEqual([]);
});
it.each(['Edellytämme', 'Vaaditaan', 'Sinulla on', 'Tehtävässä tarvitset', 'Odotamme'])('tunnistaa pakollisen vihjeen %s', (cue) => {
  expect(detectRequirements(`${cue} Microsoft Excel osaamista.`)[0]!.priority).toBe('Edellytetty');
});
it.each(['Toivomme', 'Katsomme eduksi', 'Eduksi luetaan', 'Arvostamme', 'Hyödyksi on'])('tunnistaa toivotun vihjeen %s', (cue) => {
  expect(detectRequirements(`${cue} Microsoft Excel osaamista.`)[0]!.priority).toBe('Toivottu');
});
it('käsittelee roolin ja koulutuksen epävarmoina eikä sekoita maan nimeä kielitaitoon', () => {
  const data = createEmptyCv();
  const requirements = detectRequirements('Haemme palvelupäällikköä. Edellytämme merkonomin tutkintoa. Sinulla on Suomen paras työpaikka.');
  expect(requirements[0]!.category).toBe('Tehtävä tai rooli');
  expect(requirements[1]!.category).toBe('Koulutus');
  expect(requirements.some((item) => item.concept?.name === 'Suomi')).toBe(false);
  expect(compareRequirements(data, requirements).every((finding) => finding.status === 'review')).toBe(true);
});
it('pelkkä tehtävänimike tai koulutusmaininta ei riitä kokemusesimerkiksi', () => {
  const data = createEmptyCv();
  data.workExperience = [{ id: '1', title: 'Asiakaspalvelu ja verkkokaupan myyjä', employer: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }];
  data.education = [{ id: '2', qualification: 'Excel', institution: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '' }];
  expect(compareRequirements(data, detectRequirements('Odotamme asiakaspalvelua ja Excel osaamista.')).map((finding) => finding.status)).toEqual(['review', 'review']);
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
