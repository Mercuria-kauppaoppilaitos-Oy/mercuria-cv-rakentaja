import type { CvSection } from './cv-content';

export function CvContentPreview({ section }: { section: CvSection }) {
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
