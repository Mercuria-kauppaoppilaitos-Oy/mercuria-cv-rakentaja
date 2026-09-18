import type { CvSection } from './cv-content';

export function CvContentPreview({ section }: { section: CvSection }) {
  return <section className={section.kind === 'summary' ? 'cv-summary' : 'cv-history'} aria-labelledby={section.id}>
    <h4 id={section.id}>{section.heading}</h4>
    {(section.kind === 'summary' || section.kind === 'notice') && <p>{section.text}</p>}
    {section.kind === 'list' && <ul>{section.items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>}
    {section.kind === 'entries' && section.entries.map((entry) => <div className="cv-history-entry" key={entry.id}>
      {entry.title && <h5>{entry.title}</h5>}
      {entry.lines.map((line, index) => <p key={index}>{line}</p>)}
      {entry.period && <p className="cv-period">{entry.period}</p>}
      {entry.bullets.length > 0 && <ul>{entry.bullets.map((line, index) => <li key={index}>{line}</li>)}</ul>}
      {entry.paragraph && <p className="cv-education-description">{entry.paragraph}</p>}
    </div>)}
  </section>;
}
