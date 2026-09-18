import { getHistoryEntries, type HistoryEntry } from './cv-content';
import { CvContentPreview } from './CvContentPreview';

export function CvHistoryPreview({ entries, heading, id }: { entries: HistoryEntry[]; heading: string; id: string }) {
  const visibleEntries = getHistoryEntries(entries);
  return visibleEntries.length ? <CvContentPreview section={{ kind: 'entries', entries: visibleEntries, heading, id }} /> : null;
}
