import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { CvData } from '../cv-model';
import { getCvSections, getFullName, type ContentEntry, type CvSection } from '../cv-content';
import { contrastingText, defaultAccentColor, isHexColor, mixWithWhite } from '../color-utils';
import { getLinkedText } from './pdf-utils';

const mm = (value: number) => value * 72 / 25.4;
const styles = StyleSheet.create({
  page: { padding: mm(18), fontFamily: 'CvBody', fontSize: 11, lineHeight: 1.6, color: '#292725' },
  header: { marginTop: -mm(18), marginHorizontal: -mm(18), paddingTop: mm(20), paddingHorizontal: mm(18), paddingBottom: mm(16), flexDirection: 'row', alignItems: 'center', gap: mm(7) },
  photo: { width: 75, height: 75, borderRadius: 37.5, objectFit: 'cover', flexShrink: 0 },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'CvHeading', fontWeight: 700, fontSize: 30, lineHeight: 1.2 },
  professionalTitle: { fontSize: 14, marginTop: mm(4) },
  contacts: { marginTop: mm(6), fontSize: 11, color: '#6F6963' },
  // Letter spacing can cause ATS/PDF readers to insert spaces inside Finnish words.
  heading: { fontFamily: 'CvHeading', fontSize: 11.5, fontWeight: 700, marginTop: mm(8), marginBottom: mm(4), paddingBottom: mm(3.5) },
  headingDecoration: { position: 'absolute', bottom: 0, left: 0, width: mm(14), height: mm(1) },
  summary: { paddingVertical: mm(4), paddingHorizontal: mm(5) },
  entry: { marginBottom: mm(6) },
  entryTitle: { fontSize: 12, fontWeight: 700 },
  period: { fontSize: 10.5, color: '#6F6963', marginTop: mm(1.5) },
  bullet: { paddingLeft: 12, marginTop: 2 },
  paragraph: { marginTop: mm(2) },
  link: { textDecoration: 'none' },
});

function LinkedText({ text, color = '#292725' }: { text: string; color?: string }) {
  return <>{getLinkedText(text).map((part, index) => part.href
    ? <Link key={index} src={part.href} style={[styles.link, { color }]}>{part.text}</Link>
    : <Text key={index}>{part.text}</Text>)}</>;
}

function Entry({ entry, lineHeight, last }: { entry: ContentEntry; lineHeight: number; last: boolean }) {
  // Protect the small heading block, but allow the description/list to span pages.
  const lead: ReactNode[] = [];
  if (entry.title) lead.push(<Text key="title" style={styles.entryTitle} minPresenceAhead={lineHeight * 2 + mm(2)}><LinkedText text={entry.title} /></Text>);
  entry.lines.forEach((line, index) => lead.push(<Text key={`line-${index}`} minPresenceAhead={index === 0 && entry.period ? lineHeight : 0}><LinkedText text={line} /></Text>));
  if (entry.period) lead.push(<Text key="period" style={styles.period}>{entry.period}</Text>);
  return <View style={[styles.entry, { marginBottom: last ? 0 : mm(6) }]} wrap>
    {lead}
    {entry.bullets.map((line, index) => <Text key={index} style={styles.bullet} orphans={2} widows={2}>• <LinkedText text={line} /></Text>)}
    {entry.paragraph && <Text style={styles.paragraph} orphans={2} widows={2}><LinkedText text={entry.paragraph} /></Text>}
  </View>;
}

function Section({ section, accent, surface, lineHeight }: { section: CvSection; accent: string; surface: string; lineHeight: number }) {
  return <View wrap>
    <View style={styles.heading} minPresenceAhead={lineHeight * 2} wrap={false}>
      <Text>{section.heading}</Text>
      <View style={[styles.headingDecoration, { backgroundColor: accent }]} />
    </View>
    {section.kind === 'summary' && <Text style={[styles.summary, { backgroundColor: surface }]} orphans={2} widows={2}><LinkedText text={section.text} /></Text>}
    {section.kind === 'notice' && <Text orphans={2} widows={2}>{section.text}</Text>}
    {section.kind === 'list' && section.items.map((item) => <Text key={item.id} style={styles.bullet} orphans={2} widows={2}>• <LinkedText text={item.text} /></Text>)}
    {section.kind === 'entries' && section.entries.map((entry, index) => <Entry key={entry.id} entry={entry} lineHeight={lineHeight} last={index === section.entries.length - 1} />)}
  </View>;
}

export function CvPdfDocument({ data }: { data: CvData }) {
  const name = getFullName(data.personalDetails);
  const title = data.personalDetails.professionalTitle.trim();
  const accent = isHexColor(data.appearance.accentColor) ? data.appearance.accentColor : defaultAccentColor;
  const surface = accent === defaultAccentColor ? '#F7F4F0' : mixWithWhite(accent);
  const contacts = [data.personalDetails.email, data.personalDetails.phone, data.personalDetails.city, data.personalDetails.linkedIn].map((value) => value.trim()).filter(Boolean);
  const lineHeight = data.appearance.fontSize * data.appearance.lineHeight;
  return <Document title={name ? `${name} – CV` : 'CV'} author={name} subject="Ansioluettelo" language="fi-FI">
    <Page size="A4" wrap style={[styles.page, { fontSize: data.appearance.fontSize, lineHeight: data.appearance.lineHeight, fontFamily: data.appearance.fontFamily === 'serif' ? 'Times-Roman' : 'CvBody' }]}>
      {(name || title || data.appearance.photoDataUrl) && <View style={[styles.header, { backgroundColor: accent, color: contrastingText(accent) }]} wrap={false}>
        {data.appearance.photoDataUrl && <Image src={data.appearance.photoDataUrl} style={styles.photo} />}
        <View style={styles.nameBlock}>
          {name && <Text style={styles.name}>{name}</Text>}
          {title && <Text style={styles.professionalTitle}><LinkedText text={title} color={contrastingText(accent)} /></Text>}
        </View>
      </View>}
      {contacts.length > 0 && <Text style={styles.contacts} orphans={2} widows={2}><LinkedText text={contacts.join(' · ')} color="#6F6963" /></Text>}
      {getCvSections(data).map((section) => <Section key={section.id} section={section} accent={accent} surface={surface} lineHeight={lineHeight} />)}
    </Page>
  </Document>;
}
