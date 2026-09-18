import type { CvData } from '../cv-model';
import { containsPhrase } from './text-normalization';
import type { Requirement } from './requirement-detection';
export type Finding = Requirement & { status: 'found' | 'review' | 'missing'; match: string; evidence: { section: string; text: string }[]; suggestion: string };
export function compareRequirements(data: CvData, requirements: Requirement[]): Finding[] {
  const fields = [
    { section: 'Ammatillinen otsikko', text: data.personalDetails.professionalTitle },
    { section: 'Esittely', text: data.summary },
    ...data.workExperience.flatMap((entry) => [{ section: 'Työkokemus', text: entry.title, example: false }, { section: 'Työkokemus', text: entry.description, example: true }]),
    ...data.education.flatMap((entry) => [{ section: 'Koulutus', text: entry.qualification }, { section: 'Koulutus', text: entry.description }]),
    ...(['skills', 'digitalSkills', 'languages', 'certifications'] as const).flatMap((key) => data[key].map((entry) => ({ section: { skills: 'Osaaminen', digitalSkills: 'Digitaidot ja järjestelmät', languages: 'Kielitaito', certifications: 'Kortit ja pätevyydet' }[key], text: entry.name }))),
  ];
  return requirements.map((requirement) => {
    if (!requirement.concept) return { ...requirement, status: 'review', match: 'Epävarma tulkinta', evidence: [], suggestion: 'Tarkista vaatimus itse ja kuvaa todellinen koulutuksesi tai kokemuksesi.' };
    const concept = requirement.concept;
    const evidence = fields.flatMap((field) => field.text.split(/[.!?;\n]|\bmutta\b|\bvaan\b/).map((text) => ({ section: field.section, text: text.trim(), example: 'example' in field && field.example }))).filter((field) => [concept.name, ...concept.aliases].some((alias) => containsPhrase(field.text, alias)));
    const positive = evidence.filter((field) => !/\ben\b|\bei\b|\bemme\b|ilman|haluaisin|haluan oppia|kiinnostaa|opettelen|kokeilin/i.test(field.text) && field.section !== 'Koulutus');
    const exampleMissing = concept.example && positive.length > 0 && !positive.some((field) => field.example && field.text.length > concept.name.length + 12);
    return { ...requirement, status: positive.length ? exampleMissing ? 'review' : 'found' : evidence.length ? 'review' : 'missing', match: positive.length ? positive.some((field) => containsPhrase(field.text, concept.name)) ? 'Täsmällinen osuma' : 'Tunnettu synonyymi tai taivutusmuoto' : evidence.length ? 'Epävarma asiayhteys' : 'Ei osumaa', evidence, suggestion: exampleMissing ? 'Kerro työkokemuksessa, missä olet käyttänyt taitoa.' : positive.length ? 'Varmista, että kuvaus vastaa omaa osaamistasi.' : concept.target === 'certifications' ? 'Lisää vain, jos sinulla on kyseinen voimassa oleva kortti tai pätevyys.' : 'Lisää vain taito, jota todella osaat, tai siirry kuvaamaan kokemustasi.' };
  });
}
