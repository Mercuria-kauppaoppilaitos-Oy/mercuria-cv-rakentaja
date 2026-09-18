import { containsPhrase } from './text-normalization';
import { skillConcepts, type SkillConcept } from './skill-concepts';
export type Requirement = { id: string; name: string; source: string; priority: string; concept?: SkillConcept; step: number; category: string };
const mandatory = /edellytämme|vaaditaan|sinulla on|tehtävässä tarvitset|odotamme/i;
const preferred = /toivomme|katsomme eduksi|eduksi luetaan|arvostamme|hyödyksi on/i;
export function detectRequirements(ad: string): Requirement[] {
  if (ad.trim().length < 20) throw new Error('Kirjoita vähintään 20 merkin työpaikkailmoitus.');
  if (ad.length > 100000) throw new Error('Ilmoitus on liian pitkä. Enimmäispituus on 100 000 merkkiä.');
  const requirements: Requirement[] = [];
  let priority = '';
  for (const raw of ad.split(/\n|[.!?]\s+/)) {
    const source = raw.trim();
    if (!source) continue;
    if (/^(haemme|etsimme)\s+/i.test(source)) {
      requirements.push({ id: `role-${requirements.length}`, name: source, source, priority: 'Tehtävä', step: 0, category: 'Tehtävä tai rooli' });
      priority = '';
      continue;
    }
    if (/tarjoamme|meiltä saat|ei (?:tarvita|edellytetä|vaadita)|emme (?:edellytä|vaadi)/i.test(source)) { priority = ''; continue; }
    const cue = preferred.test(source) ? 'Toivottu' : mandatory.test(source) ? 'Edellytetty' : '';
    if (cue) priority = cue;
    if (!priority) continue;
    const concepts = skillConcepts.filter((concept) => [concept.name, ...concept.aliases].some((alias) => containsPhrase(source, alias)));
    for (const concept of concepts) {
      if (!requirements.some((item) => item.concept === concept)) requirements.push({ id: concept.name, name: concept.name, source, priority, concept, step: concept.target === 'certifications' ? 5 : 4, category: { skills: concept.name === 'Tiimityö' ? 'Työelämätaito' : 'Ammatillinen taito', languages: 'Kielitaito', certifications: 'Kortti tai pätevyys' }[concept.target] });
    }
    if (!concepts.length && !(cue && source.endsWith(':')) && source.replace(/[-•:]/g, '').trim().length > 8) {
      const step = /koulutus|tutkinto|merkonomi|tradenomi/i.test(source) ? 3 : /kokemus|vuotta|tehtävä|nimike/i.test(source) ? 2 : 4;
      requirements.push({ id: `manual-${requirements.length}`, name: source, source, priority, step, category: step === 3 ? 'Koulutus' : /vuotta|kokemus/i.test(source) ? 'Kokemus' : /tehtävä|nimike/i.test(source) ? 'Tehtävä tai rooli' : 'Monisanainen vaatimus' });
    }
    if (cue && !source.endsWith(':')) priority = '';
  }
  if (requirements.length > 100) throw new Error('Ilmoituksesta löytyi yli 100 vaatimuskohtaa. Rajaa teksti olennaisiin vaatimuksiin.');
  return requirements;
}
