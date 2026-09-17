import type { ReactNode } from 'react';
import type { CvData } from './cv-model';

function TextList({ entries, heading, id }: { entries: { id: string; text: string }[]; heading: string; id: string }) {
  const visible = entries.filter((entry) => entry.text.trim());
  if (!visible.length) return null;
  return <PreviewSection heading={heading} id={id}><ul>{visible.map((entry) => <li key={entry.id}>{entry.text}</li>)}</ul></PreviewSection>;
}
function PreviewSection({ heading, id, children }: { heading: string; id: string; children: ReactNode }) {
  return <section className="cv-history" aria-labelledby={id}><h4 id={id}>{heading}</h4>{children}</section>;
}
function joinDetails(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean).join(' – ');
}

export function CvAdditionalPreview({ data }: { data: CvData }) {
  const references = data.references.filter((entry) => [entry.name, entry.title, entry.organization, entry.email, entry.phone].some((value) => value.trim()));
  return <>
    <TextList heading="OSAAMINEN" id="cv-skills-title" entries={data.skills.map((entry) => ({ id: entry.id, text: entry.name.trim() }))} />
    <TextList heading="DIGITAIDOT JA JÄRJESTELMÄT" id="cv-digital-title" entries={data.digitalSkills.map((entry) => ({ id: entry.id, text: entry.name.trim() ? joinDetails([entry.name, entry.proficiency.toLocaleLowerCase('fi')]) : '' }))} />
    <TextList heading="KIELITAITO" id="cv-languages-title" entries={data.languages.map((entry) => ({ id: entry.id, text: entry.name.trim() ? joinDetails([entry.name, entry.proficiency.toLocaleLowerCase('fi')]) : '' }))} />
    <TextList heading="KORTIT JA PÄTEVYYDET" id="cv-certifications-title" entries={data.certifications.map((entry) => ({ id: entry.id, text: joinDetails([entry.name, entry.issuer, /^\d{4}$/.test(entry.issuedDate) ? entry.issuedDate : '', entry.expiryDate]) }))} />
    {data.referencesDisplay === 'on-request' && <PreviewSection heading="SUOSITTELIJAT" id="cv-references-title"><p>Suosittelijat saatavilla pyydettäessä</p></PreviewSection>}
    {data.referencesDisplay === 'contact' && references.length > 0 && <PreviewSection heading="SUOSITTELIJAT" id="cv-references-title">
      {references.map((entry) => <div className="cv-history-entry" key={entry.id}>
        {entry.name.trim() && <h5>{entry.name.trim()}</h5>}
        {(entry.title.trim() || entry.organization.trim()) && <p>{joinDetails([entry.title, entry.organization])}</p>}
        {entry.email.trim() && <p>{entry.email.trim()}</p>}
        {entry.phone.trim() && <p>{entry.phone.trim()}</p>}
      </div>)}
    </PreviewSection>}
  </>;
}
