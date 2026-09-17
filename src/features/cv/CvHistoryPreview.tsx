import type { CvData } from './cv-model';

type HistoryEntry = CvData['workExperience'][number] | CvData['education'][number];

function formatMonth(value: string): string {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
  return match ? `${match[2]}/${match[1]}` : '';
}

function formatPeriod(entry: HistoryEntry): string {
  const start = formatMonth(entry.startDate);
  const end = entry.isCurrent ? 'nykyhetki' : formatMonth(entry.endDate);
  return start && end ? `${start}–${end}` : start || end;
}

function hasContent(entry: HistoryEntry): boolean {
  const title = 'title' in entry ? entry.title : entry.qualification;
  const organization = 'employer' in entry ? entry.employer : entry.institution;
  return [title, organization, entry.location, entry.description, entry.startDate, entry.isCurrent ? '' : entry.endDate].some((value) => value.trim());
}

export function CvHistoryPreview({ entries, heading, id }: { entries: HistoryEntry[]; heading: string; id: string }) {
  const visibleEntries = entries.filter(hasContent);
  if (!visibleEntries.length) return null;

  return (
    <section className="cv-history" aria-labelledby={id}>
      <h4 id={id}>{heading}</h4>
      {visibleEntries.map((entry) => {
        const title = 'title' in entry ? entry.title.trim() : entry.qualification.trim();
        const organization = 'employer' in entry ? entry.employer.trim() : entry.institution.trim();
        const period = formatPeriod(entry);
        const description = entry.description.trim();
        const bullets = description.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        return (
          <div className="cv-history-entry" key={entry.id}>
            {title && <h5>{title}</h5>}
            {(organization || entry.location.trim()) && <p>{[organization, entry.location.trim()].filter(Boolean).join(', ')}</p>}
            {period && <p className="cv-period">{period}</p>}
            {'title' in entry
              ? bullets.length > 0 && <ul>{bullets.map((line, index) => <li key={index}>{line}</li>)}</ul>
              : description && <p className="cv-education-description">{description}</p>}
          </div>
        );
      })}
    </section>
  );
}
