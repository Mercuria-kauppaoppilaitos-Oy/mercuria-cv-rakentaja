import { createContext, useContext, type ReactNode } from 'react';
import { vi } from 'vitest';
import type { CvData } from '../features/cv/cv-model';
import { getCvSections, getFullName } from '../features/cv/cv-content';
const Input = createContext<{ data: CvData; includePhoto: boolean } | null>(null);
import type { CvSection } from '../features/cv/cv-content';

function ContentProbe({ section }: { section: CvSection }) {
  return <section className={section.kind === 'summary' ? 'cv-summary' : 'cv-history'} aria-labelledby={section.id}>
    <h4 id={section.id}>{section.heading}</h4>
    {(section.kind === 'summary' || section.kind === 'notice') && <p>{section.text}</p>}
    {section.kind === 'list' && <ul className={section.id === 'cv-skills-title' || section.id === 'cv-languages-title' ? 'cv-compact-list' : undefined} role="list">{section.items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>}
    {section.kind === 'entries' && section.entries.map((entry) => <div className="cv-history-entry" key={entry.id}>
      {entry.title && <h5>{entry.title}</h5>}
      {entry.lines.map((line, index) => <p className={entry.metadata ? 'cv-metadata' : undefined} key={index}>{line}</p>)}
      {entry.paragraph && <p className="cv-education-description">{entry.paragraph}</p>}
    </div>)}
  </section>;
}

function Probe() {
  const { data, includePhoto } = useContext(Input)!;
  return <section><h2>CV-esikatselu</h2><article aria-label="Ansioluettelon esikatselu" style={{ '--cv-accent': data.appearance.accentColor } as React.CSSProperties}>
    <h3>{getFullName(data.personalDetails)}</h3>
    {includePhoto && data.appearance.photoDataUrl && <img src={data.appearance.photoDataUrl} alt="" />}
    {Object.values(data.personalDetails).slice(2).filter(Boolean).map((text, index) => <p key={index}>{text}</p>)}
    {getCvSections(data).map((section) => <ContentProbe key={section.id} section={section} />)}
  </article></section>;
}
vi.mock('../features/cv/CvPreview', () => ({ CvPreview: Probe }));
vi.mock('../features/cv/pdf/CvPdfProvider', () => ({
  CvPdfProvider: ({ data, includePhoto, children }: { data: CvData; includePhoto: boolean; children: ReactNode }) => <Input.Provider value={{ data, includePhoto }}>{children}</Input.Provider>,
  useCvPdf: () => ({ ready: false, updating: false, error: '', retry: () => {}, presented: () => {} }),
}));
