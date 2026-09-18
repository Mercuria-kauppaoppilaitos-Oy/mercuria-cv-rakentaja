import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { CvData } from '../cv-model';
import { getCvSections, getFullName, type ContentEntry, type CvSection } from '../cv-content';
import { contrastingText, defaultAccentColor, isHexColor, mixWithWhite } from '../color-utils';
import { getLinkedText } from './pdf-utils';
import { cvHeaderLayout as layout, cvContentLayout as contentLayout } from '../cv-layout';
import type { CvPdfOptions } from './pdf-options';

const mm = (value: number) => value * 72 / 25.4;
const styles = StyleSheet.create({
  page: { padding: mm(18), fontFamily: 'CvBody', fontSize: 11, lineHeight: 1.6, color: '#292725' },
  header: { marginTop: -mm(18), marginHorizontal: -mm(18), paddingVertical: mm(layout.paddingMm), paddingHorizontal: mm(18), flexDirection: 'row', alignItems: 'center', gap: mm(layout.gapMm) },
  photo: { width: mm(layout.photoDiameterMm), height: mm(layout.photoDiameterMm), borderRadius: mm(layout.photoDiameterMm / 2), objectFit: 'cover', flexShrink: 0 },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'CvHeading', fontWeight: 700, fontSize: layout.nameFontSizePt, lineHeight: 1.2 },
  professionalTitle: { fontSize: layout.titleFontSizePt, lineHeight: 1.3, marginTop: mm(layout.titleMarginMm) },
  contacts: { marginTop: mm(layout.contactMarginMm), fontSize: layout.contactFontSizePt, lineHeight: 1.4, color: '#6F6963' },
  // Letter spacing can cause ATS/PDF readers to insert spaces inside Finnish words.
  heading: { fontFamily: 'CvHeading', fontSize: 11.5, fontWeight: 700, marginTop: mm(contentLayout.sectionGapMm), marginBottom: mm(contentLayout.headingGapMm), paddingBottom: mm(contentLayout.decorationGapMm + 1) },
  headingDecoration: { position: 'absolute', bottom: 0, left: 0, width: mm(14), height: mm(1) },
  summary: { paddingVertical: mm(contentLayout.summaryPaddingMm), paddingHorizontal: mm(5) },
  entry: { marginBottom: mm(contentLayout.entryGapMm) },
  entryTitle: { fontSize: 12, fontWeight: 700 },
  bullet: { paddingLeft: 12, marginTop: 2 },
  compactLine: { marginTop: 2 },
  metadata: { fontSize: 10.5, color: '#6F6963', marginTop: mm(contentLayout.metadataGapMm) },
  paragraph: { marginTop: mm(contentLayout.descriptionGapMm) },
  link: { textDecoration: 'none' },
});

function LinkedText({ text, color = '#292725' }: { text: string; color?: string }) {
  return <>{getLinkedText(text).map((part, index) => part.href
    ? <Link key={index} src={part.href} style={[styles.link, { color }]}>{part.text}</Link>
    : <Text key={index}>{part.text}</Text>)}</>;
}

function Entry({ entry, lineHeight, last }: { entry: ContentEntry; lineHeight: number; last: boolean }) {
  // Protect the title and the first metadata/content line; descriptions can split.
  const lead: ReactNode[] = [];
  if (entry.title) lead.push(<Text key="title" style={styles.entryTitle} minPresenceAhead={lineHeight + mm(contentLayout.metadataGapMm)}><LinkedText text={entry.title} /></Text>);
  entry.lines.forEach((line, index) => lead.push(<Text key={`line-${index}`} style={entry.metadata ? styles.metadata : undefined}><LinkedText text={line} /></Text>));
  return <View style={[styles.entry, { marginBottom: last ? 0 : mm(contentLayout.entryGapMm) }]} wrap>
    {lead}
    {entry.paragraph && <Text style={styles.paragraph} orphans={2} widows={2}><LinkedText text={entry.paragraph} /></Text>}
  </View>;
}

function Section({ section, accent, surface, lineHeight, first }: { section: CvSection; accent: string; surface: string; lineHeight: number; first: boolean }) {
  const listStyle = section.id === 'cv-skills-title' || section.id === 'cv-languages-title' ? styles.compactLine : styles.bullet;
  // Reserve only the minimum start of the next text block, not four lines of
  // additional content. Keep headings and content in the same page flow.
  const presence = section.kind === 'summary' ? lineHeight * 2 + mm(contentLayout.summaryPaddingMm * 2)
    : section.kind === 'list' ? lineHeight
    : section.kind === 'entries' ? lineHeight * 2 + mm(contentLayout.metadataGapMm)
    : lineHeight;
  const heading = (
    <View style={[styles.heading, { marginTop: mm(first ? contentLayout.firstSectionGapMm : contentLayout.sectionGapMm) }]} minPresenceAhead={presence} wrap={false}>
      <Text>{section.heading}</Text>
      <View style={[styles.headingDecoration, { backgroundColor: accent }]} />
    </View>
  );
  return <>
    {heading}
    {section.kind === 'summary' && <Text style={[styles.summary, { backgroundColor: surface }]} orphans={2} widows={2}><LinkedText text={section.text} /></Text>}
    {section.kind === 'notice' && <Text orphans={2} widows={2}>{section.text}</Text>}
    {section.kind === 'list' && section.items.map((item, index) => <Text key={item.id} style={[listStyle, { marginTop: index === 0 ? 0 : 2 }]} orphans={1} widows={2}>{listStyle === styles.bullet ? '• ' : ''}<LinkedText text={item.text} /></Text>)}
    {section.kind === 'entries' && section.entries.map((entry, index) => <Entry key={entry.id} entry={entry} lineHeight={lineHeight} last={index === section.entries.length - 1} />)}
  </>;
}

export function CvPdfDocument({ data, includePhoto = true }: { data: CvData } & CvPdfOptions) {
  const name = getFullName(data.personalDetails);
  const title = data.personalDetails.professionalTitle.trim();
  const accent = isHexColor(data.appearance.accentColor) ? data.appearance.accentColor : defaultAccentColor;
  const surface = accent === defaultAccentColor ? '#F7F4F0' : mixWithWhite(accent);
  const contacts = [data.personalDetails.email, data.personalDetails.phone, data.personalDetails.city, data.personalDetails.linkedIn].map((value) => value.trim()).filter(Boolean);
  const lineHeight = data.appearance.fontSize * data.appearance.lineHeight;
  const hasPhoto = includePhoto && Boolean(data.appearance.photoDataUrl);
  return <Document title={name ? `${name} – CV` : 'CV'} author={name} subject="Ansioluettelo" language="fi-FI">
    <Page size="A4" wrap style={[styles.page, { fontSize: data.appearance.fontSize, lineHeight: data.appearance.lineHeight, fontFamily: data.appearance.fontFamily === 'serif' ? 'Times-Roman' : 'CvBody' }]}>
      {(name || title || hasPhoto) && <View style={[styles.header, { backgroundColor: accent, color: contrastingText(accent), minHeight: mm(hasPhoto ? layout.photoHeaderHeightMm : layout.plainHeaderHeightMm) }]} wrap={false}>
        {hasPhoto && <Image src={data.appearance.photoDataUrl} style={styles.photo} />}
        <View style={styles.nameBlock}>
          {name && <Text style={styles.name}>{name}</Text>}
          {title && <Text style={styles.professionalTitle}><LinkedText text={title} color={contrastingText(accent)} /></Text>}
        </View>
      </View>}
      {contacts.length > 0 && <Text style={styles.contacts} orphans={2} widows={2}><LinkedText text={contacts.join(' · ')} color="#6F6963" /></Text>}
      {getCvSections(data).map((section, index) => <Section key={section.id} section={section} accent={accent} surface={surface} lineHeight={lineHeight} first={index === 0} />)}
    </Page>
  </Document>;
}
