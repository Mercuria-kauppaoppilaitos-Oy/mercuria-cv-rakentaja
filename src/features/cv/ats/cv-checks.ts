import type { CvData } from '../cv-model';
import { skillConcepts } from './skill-concepts';
import { containsPhrase } from './text-normalization';
export type CvCheck = { label: string; status: 'Kunnossa' | 'Kannattaa tarkistaa' | 'Puuttuu'; detail: string };
export function checkCv(data: CvData): CvCheck[] {
  const present = (label: string, value: boolean): CvCheck => ({ label, status: value ? 'Kunnossa' : 'Puuttuu', detail: value ? 'Tieto on mukana CV:ssä.' : 'Täydennä, jos tieto on tilanteessasi tarpeellinen.' });
  const checks = [present('Nimi', Boolean(data.personalDetails.firstName.trim() && data.personalDetails.lastName.trim())), present('Ammatillinen otsikko', Boolean(data.personalDetails.professionalTitle.trim())), present('Yhteystiedot', Boolean(data.personalDetails.email.trim() || data.personalDetails.phone.trim())), present('Esittely', Boolean(data.summary.trim())), present('Työkokemus', data.workExperience.some((entry) => Boolean(entry.title.trim()))), present('Koulutus', data.education.some((entry) => Boolean(entry.qualification.trim()))), present('Näkyvä osaaminen', [...data.skills, ...data.digitalSkills, ...data.languages, ...data.certifications].some((entry) => Boolean(entry.name.trim())))];
  const entries = [...data.workExperience.map((entry) => ({ ...entry, organization: entry.employer })), ...data.education.map((entry) => ({ ...entry, title: entry.qualification, organization: entry.institution }))];
  const incomplete = entries.some((entry) => !entry.title.trim() || !entry.organization.trim() || !entry.startDate || (!entry.isCurrent && !entry.endDate) || !entry.description.trim());
  checks.push({ label: 'Tehtävät, organisaatiot, ajankohdat ja kuvaukset', status: incomplete ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: incomplete ? 'Yhdestä tai useammasta merkinnästä puuttuu tietoja.' : 'Täytetyt merkinnät sisältävät perustiedot.' });
  const invalidDates = entries.some((entry) => [entry.startDate, entry.isCurrent ? '' : entry.endDate].some((date) => Boolean(date) && !/^\d{4}-(0[1-9]|1[0-2])$/.test(date)) || (!entry.isCurrent && Boolean(entry.startDate && entry.endDate) && entry.startDate > entry.endDate));
  checks.push({ label: 'Ajankohtien johdonmukaisuus', status: invalidDates ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: invalidDates ? 'Tarkista kuukausien muoto ja alku- sekä loppuajankohdan järjestys.' : 'Ajankohdissa ei havaittu ristiriitaa.' });
  const vague = entries.some((entry) => entry.title.trim().length < 3 || /^(työ|tekijä|työntekijä|harjoittelu)$/i.test(entry.title.trim()));
  checks.push({ label: 'Tehtävänimikkeiden täsmällisyys', status: vague ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: 'Kuvaava tehtävänimike auttaa ymmärtämään kokemustasi.' });
  const long = data.summary.length > 900 || entries.some((entry) => entry.description.split('\n').some((paragraph) => paragraph.length > 1200));
  checks.push({ label: 'Tekstin luettavuus', status: long ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: long ? 'Tiivistä pitkää esittelyä tai jaa pitkä kappale.' : 'Tekstin pituudessa ei havaittu selvää ongelmaa.' });
  const empty = [...entries, ...data.skills, ...data.digitalSkills, ...data.languages, ...data.certifications, ...data.references].some((entry) => !Object.entries(entry).some(([key, value]) => key !== 'id' && typeof value === 'string' && value.trim()));
  checks.push({ label: 'Tyhjät merkinnät', status: empty ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: empty ? 'Poista tyhjät lisätyt rivit tai täydennä ne.' : 'Tyhjiä lisättyjä rivejä ei havaittu.' });
  const withoutExample = skillConcepts.filter((concept) => concept.example && data.skills.some((entry) => [concept.name, ...concept.aliases].some((alias) => containsPhrase(entry.name, alias))) && !data.workExperience.some((entry) => [concept.name, ...concept.aliases].some((alias) => containsPhrase(entry.description, alias))));
  checks.push({ label: 'Osaamisen esimerkit', status: withoutExample.length ? 'Kannattaa tarkistaa' : 'Kunnossa', detail: withoutExample.length ? `Kuvaa näiden taitojen käyttöä kokemuksessasi: ${withoutExample.map((concept) => concept.name).join(', ')}.` : 'Tunnetuista kirjatuista taidoista ei havaittu puuttuvaa kokemusesimerkkiä. Tarkistus ei tunnista kaikkia taitoja.' });
  return checks;
}
