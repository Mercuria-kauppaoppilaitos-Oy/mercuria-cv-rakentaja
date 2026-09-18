import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CvData } from '../cv-model';
import { checkCv } from './cv-checks';
import { detectRequirements, type Requirement } from './requirement-detection';
import { compareRequirements, type Finding } from './job-analysis';

function FindingCard({ finding, form, onEdit, onAdded }: { finding: Finding; form: UseFormReturn<CvData>; onEdit: (step: number, hint: string) => void; onAdded: (name: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  function add() {
    if (!confirmed || !finding.concept) return;
    const { target, name } = finding.concept;
    if (form.getValues(target).some((entry) => entry.name.toLocaleLowerCase('fi').trim() === name.toLocaleLowerCase('fi'))) return;
    const entry = target === 'certifications' ? { id: crypto.randomUUID(), name, issuer: '', issuedDate: '', expiryDate: '' } : target === 'skills' ? { id: crypto.randomUUID(), name } : { id: crypto.randomUUID(), name, proficiency: '' as const };
    // Append to the existing form array; never replace an existing description.
    switch (target) {
      case 'skills': form.setValue(target, [...form.getValues(target), { id: entry.id, name }], { shouldDirty: true }); break;
      case 'digitalSkills': form.setValue(target, [...form.getValues(target), { id: entry.id, name, proficiency: '' }], { shouldDirty: true }); break;
      case 'languages': form.setValue(target, [...form.getValues(target), { id: entry.id, name, proficiency: '' }], { shouldDirty: true }); break;
      case 'certifications': form.setValue(target, [...form.getValues(target), { id: entry.id, name, issuer: '', issuedDate: '', expiryDate: '' }], { shouldDirty: true }); break;
    }
    setConfirming(false);
    onAdded(name);
  }
  return <li className="ats-finding">
    <h5>{finding.name}</h5><p>{finding.priority} · {finding.category} · {finding.match}</p>
    <p>Poiminnan peruste: {finding.source}</p>
    {finding.evidence.map((evidence, index) => <p key={index}><strong>{evidence.section}:</strong> {evidence.text}</p>)}
    <p>{finding.suggestion}</p>
    {finding.status !== 'found' && <button type="button" onClick={() => onEdit(finding.status === 'review' && finding.concept?.example ? 2 : finding.step, `${finding.name}: ${finding.suggestion}`)}>Siirry muokkaamaan</button>}
    {finding.status === 'missing' && finding.concept && <>
      <button type="button" onClick={() => setConfirming(!confirming)}>Lisää ehdotus CV:hen: {finding.name}</button>
      {confirming && <div><label className="checkbox-field"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Vahvistan, että tämä vastaa omaa osaamistani tai kokemustani.</label><button type="button" disabled={!confirmed} onClick={add}>Lisää vahvistettu taito: {finding.name}</button></div>}
    </>}
  </li>;
}
export function CvAtsReview({ data, form, onEdit }: { data: CvData; form: UseFormReturn<CvData>; onEdit: (step: number, hint: string) => void }) {
  const [ad, setAd] = useState('');
  const [requirements, setRequirements] = useState<Requirement[] | null>(null);
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const results = useRef<HTMLHeadingElement>(null);
  const findings = compareRequirements(data, requirements ?? []);
  function analyze() {
    try {
      const next = detectRequirements(ad);
      setRequirements(next); setError('');
      setAnnouncement(`Analyysi valmis. ${next.length} tarkistettavaa vaatimusta.`);
      requestAnimationFrame(() => results.current?.focus());
    } catch (failure) { setRequirements(null); setAnnouncement(''); setError(failure instanceof Error ? failure.message : 'Analyysi epäonnistui.'); }
  }
  return <section className="ats-review" aria-labelledby="ats-review-title">
    <h3 id="ats-review-title">CV:n ATS-tarkistuslista</h3>
    <p>Tarkistus on paikallinen apuväline. Se ei ennusta rekrytointijärjestelmän toimintaa tai arvioi soveltuvuuttasi.</p>
    <ul>{checkCv(data).map((check) => <li key={check.label}><strong>{check.label}: {check.status}</strong><p>{check.detail}</p></li>)}</ul>
    <h3>Vertaa CV:tä työpaikkailmoitukseen</h3>
    <p>Liitä työpaikkailmoituksen teksti. Tarkistus tehdään tällä laitteella, eikä tekstiä tai CV-tietojasi lähetetä palvelimelle.</p>
    <p>Ilmoitus käsitellään vain tässä näkymässä selaimessasi. Sitä ei tallenneta luonnokseen eikä sisällytetä PDF:ään. Vertailu tunnistaa vain rajatun joukon käsitteitä ja tunnettuja sanamuotoja.</p>
    <label htmlFor="job-ad">Työpaikkailmoitus</label>
    <textarea id="job-ad" rows={8} value={ad} onChange={(event) => { setAd(event.target.value); setRequirements(null); setAnnouncement(''); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'job-ad-help job-ad-error' : 'job-ad-help'} />
    <p id="job-ad-help">Avainsana toimii parhaiten, kun kerrot missä olet käyttänyt taitoa. Pelkkä irrallinen sanalista ei osoita osaamista.</p>
    <button type="button" onClick={analyze}>Analysoi ilmoitus</button>
    {error && <p id="job-ad-error" role="alert">{error}</p>}
    <p aria-live="polite" aria-atomic="true">{announcement}</p>
    {requirements && <div>
      <h4 tabIndex={-1} ref={results}>Ilmoitusvertailun tulokset</h4>
      {!requirements.length && <p>Tunnistettuja vaatimuksia ei löytynyt. Tarkista ilmoitus ja CV itse.</p>}
      {(['found', 'review', 'missing'] as const).map((status) => <section key={status} aria-label={{ found: 'Löytyy CV:stä', review: 'Tarkista tai täydennä', missing: 'Ei vielä löydy CV:stä' }[status]}>
        <h4>{{ found: 'Löytyy CV:stä', review: 'Tarkista tai täydennä', missing: 'Ei vielä löydy CV:stä' }[status]}</h4>
        <ul>{findings.filter((finding) => finding.status === status).map((finding) => <FindingCard key={finding.id} finding={finding} form={form} onEdit={onEdit} onAdded={(name) => { setAnnouncement(`${name} lisätty näkyvään CV:hen.`); requestAnimationFrame(() => results.current?.focus()); }} />)}</ul>
        {!findings.some((finding) => finding.status === status) && <p>Ei havaintoja tässä ryhmässä.</p>}
      </section>)}
    </div>}
  </section>;
}
