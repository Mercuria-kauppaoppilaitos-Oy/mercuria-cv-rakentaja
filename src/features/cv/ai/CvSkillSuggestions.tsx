import { useEffect, useRef, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { hasSkillSource, normalizeSkill, skillsMessages, skillsRequestSchema, rewriteMessages } from '../../../../shared/rewrite-contract';
import type { CvData } from '../cv-model';
import { AiButton } from './AiButton';
import { getSkillSource, skillSourceKey, suggestSkills, useSkillsCache } from './skill-suggestions';

export function CvSkillSuggestions({ form, append }: { form: UseFormReturn<CvData>; append: (entries: CvData['skills']) => void }) {
  const data = useWatch({ control: form.control }) as CvData;
  const source = getSkillSource(data);
  const sourceJson = JSON.stringify(source);
  const currentSource = useRef(sourceJson); currentSource.current = sourceJson;
  const cache = useSkillsCache();
  const [proposal, setProposal] = useState<{ source: string; skills: string[] }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  useEffect(() => {
    let active = true;
    setError(''); setBusy(false); request.current?.abort(); request.current = null;
    void skillSourceKey(JSON.parse(sourceJson)).then((key) => {
      const saved = cache.get(key);
      if (active) setProposal(saved ? { source: sourceJson, skills: saved } : undefined);
    }).catch(() => { /* Clicking still reports a safe error if hashing is unavailable. */ });
    return () => { active = false; request.current?.abort(); request.current = null; };
  }, [sourceJson, cache]);
  async function start() {
    if (request.current) return;
    if (!hasSkillSource(source)) { setError(skillsMessages.empty); return; }
    if (!skillsRequestSchema.safeParse({ operation: 'suggest-skills', source }).success) { setError(skillsMessages.long); return; }
    const controller = new AbortController(); request.current = controller; setBusy(true); setError('');
    try {
      const key = await skillSourceKey(source);
      if (controller.signal.aborted) return;
      const skills = cache.get(key) ?? await suggestSkills(source, controller.signal);
      if (controller.signal.aborted || currentSource.current !== sourceJson) return;
      cache.set(key, skills); setProposal({ source: sourceJson, skills });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error && [skillsMessages.long, rewriteMessages.timeout].includes(failure.message) ? failure.message : skillsMessages.failure);
    } finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  }
  const suggestions = proposal?.source === sourceJson ? proposal.skills : [];
  const existing = new Set(data.skills.map((skill) => normalizeSkill(skill.name)));
  function add(names: string[]) {
    const seen = new Set(form.getValues('skills').map((skill) => normalizeSkill(skill.name)));
    const additions = names.filter((name) => { const key = normalizeSkill(name); if (seen.has(key)) return false; seen.add(key); return true; });
    if (additions.length) append(additions.map((name) => ({ id: crypto.randomUUID(), name })));
  }
  return <div className="skill-suggestions">
    <AiButton disabled={busy} onClick={() => void start()}>{busy ? 'Ehdotetaan…' : 'Ehdota tekoälyllä'}</AiButton>
    <p className="field-error" role="status">{error}</p>
    {suggestions.length > 0 && <section aria-label="Osaamisehdotukset">
      <div className="skill-suggestions-heading"><h4>Osaamisehdotukset</h4><button type="button" disabled={suggestions.every((name) => existing.has(normalizeSkill(name)))} onClick={() => add(suggestions)}>Lisää kaikki</button></div>
      <div className="skill-chips">{suggestions.map((name) => {
        const added = existing.has(normalizeSkill(name));
        return <button type="button" key={normalizeSkill(name)} aria-pressed={added} onClick={() => add([name])}><span aria-hidden="true">{added ? '✓' : '+'}</span> {name}<span className="sr-only">{added ? ', lisätty' : ', lisää osaaminen'}</span></button>;
      })}</div>
    </section>}
  </div>;
}
