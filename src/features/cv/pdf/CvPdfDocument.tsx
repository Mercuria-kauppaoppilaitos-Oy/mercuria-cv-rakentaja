import { Document, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { CvData } from '../cv-model';
import { getCvSections, getFullName, type ContentEntry, type CvSection } from '../cv-content';
import { contrastingText, defaultAccentColor, isHexColor } from '../color-utils';
import { getLinkedText } from './pdf-utils';
import { cvHeaderLayout as layout, cvDensityLayouts, type CvDensityLayout } from '../cv-layout';
import type { CvPdfOptions } from './pdf-options';

const mm = (value: number) => value * 72 / 25.4;
function createStyles(contentLayout: CvDensityLayout) { return StyleSheet.create({
  page: { padding: mm(contentLayout.pageMarginMm), fontFamily: 'CvBody', fontSize: 11, lineHeight: 1.6, color: '#292725' },
  header: { marginTop: -mm(contentLayout.pageMarginMm), marginHorizontal: -mm(contentLayout.pageMarginMm), paddingVertical: mm(contentLayout.headerPaddingMm), paddingHorizontal: mm(contentLayout.pageMarginMm), flexDirection: 'row', alignItems: 'center', gap: mm(layout.gapMm) },
  photo: { width: mm(contentLayout.photoDiameterMm), height: mm(contentLayout.photoDiameterMm), borderRadius: mm(contentLayout.photoDiameterMm / 2), objectFit: 'cover', flexShrink: 0 },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontFamily: 'CvHeading', fontWeight: 700, fontSize: layout.nameFontSizePt, lineHeight: 1.2 },
  professionalTitle: { fontSize: layout.titleFontSizePt, lineHeight: 1.3, marginTop: mm(layout.titleMarginMm) },
  contacts: { marginTop: mm(contentLayout.contactMarginMm), fontSize: layout.contactFontSizePt, lineHeight: 1.4, color: '#6F6963' },
  // Letter spacing can cause ATS/PDF readers to insert spaces inside Finnish words.
  heading: { lineHeight: 1.25, fontFamily: 'CvHeading', fontSize: 11.5, fontWeight: 700, marginTop: mm(contentLayout.sectionGapMm), marginBottom: mm(contentLayout.headingGapMm), paddingBottom: mm(contentLayout.decorationGapMm + 1) },
  headingDecoration: { position: 'absolute', bottom: 0, left: 0, width: mm(14), height: mm(1) },
  summary: { paddingVertical: mm(contentLayout.summaryPaddingMm), paddingHorizontal: mm(5) },
  entry: { marginBottom: mm(contentLayout.entryGapMm) },
  entryTitle: { lineHeight: 1.3, fontSize: 12, fontWeight: 700 },
  compactLine: { marginTop: 2 },
  metadata: { lineHeight: 1.4, fontSize: 10.5, color: '#6F6963', marginTop: mm(contentLayout.metadataGapMm) },
  paragraph: { marginTop: mm(contentLayout.descriptionGapMm) },
}); }
type PdfStyles = ReturnType<typeof createStyles>;
// Preserve exact URL characters during text extraction.
const linkStyle = { textDecoration: 'none' as const, fontFeatureSettings: { liga: false, clig: false } };

function LinkedText({ text, color = '#292725' }: { text: string; color?: string }) {
  return <>{getLinkedText(text).map((part, index) => part.href
    ? <Link key={index} src={part.href} style={[linkStyle, { color }]}>{part.text}</Link>
    : <Text key={index}>{part.text}</Text>)}</>;
}

function Entry({ entry, lineHeight, last, contentLayout, styles }: { entry: ContentEntry; lineHeight: number; last: boolean; contentLayout: CvDensityLayout; styles: PdfStyles }) {
  // Protect the title and the first metadata/content line; descriptions can split.
  const lead: ReactNode[] = [];
  if (entry.title) lead.push(<Text key="title" style={styles.entryTitle} minPresenceAhead={lineHeight + mm(contentLayout.metadataGapMm)}><LinkedText text={entry.title} /></Text>);
  entry.lines.forEach((line, index) => lead.push(<Text key={`line-${index}`} style={entry.metadata ? styles.metadata : undefined}><LinkedText text={line} /></Text>));
  return <View style={[styles.entry, { marginBottom: last ? 0 : mm(contentLayout.entryGapMm) }]} wrap>
    {lead}
    {entry.paragraph && <Text style={styles.paragraph} orphans={2} widows={2}><LinkedText text={entry.paragraph} /></Text>}
  </View>;
}

function Section({ section, accent, accentText, lineHeight, contentLayout, styles }: { section: CvSection; accent: string; accentText: string; lineHeight: number; contentLayout: CvDensityLayout; styles: PdfStyles }) {
  // Reserve only the minimum start of the next text block, not four lines of
  // additional content. Keep headings and content in the same page flow.
  const presence = lineHeight * 2 + mm(contentLayout.metadataGapMm);
  const heading = (
    <View style={styles.heading} minPresenceAhead={presence} wrap={false}>
      <Text>{section.heading}</Text>
      <View style={[styles.headingDecoration, { backgroundColor: accent }]} />
    </View>
  );
  return <>
    {heading}
    {section.kind === 'summary' && <Text style={[styles.summary, { backgroundColor: accent, color: accentText }]} orphans={2} widows={2}><LinkedText text={section.text} color={accentText} /></Text>}
    {section.kind === 'notice' && <Text orphans={2} widows={2}>{section.text}</Text>}
    {section.kind === 'list' && section.items.map((item, index) => <Text key={item.id} style={[styles.compactLine, { marginTop: index === 0 ? 0 : 2 }]} orphans={1} widows={2}><LinkedText text={item.text} /></Text>)}
    {section.kind === 'entries' && section.entries.map((entry, index) => <Entry key={entry.id} entry={entry} lineHeight={lineHeight} last={index === section.entries.length - 1} contentLayout={contentLayout} styles={styles} />)}
  </>;
}

export function CvPdfDocument({ data, includePhoto = true, density = 'comfortable', onRender }: { data: CvData; onRender?: (props: unknown) => void } & CvPdfOptions) {
  const contentLayout = cvDensityLayouts[density];
  const styles = createStyles(contentLayout);
  const name = getFullName(data.personalDetails);
  const title = data.personalDetails.professionalTitle.trim();
  const accent = isHexColor(data.appearance.accentColor) ? data.appearance.accentColor : defaultAccentColor;
  const accentText = contrastingText(accent);
  const contacts = [data.personalDetails.email, data.personalDetails.phone, data.personalDetails.city, data.personalDetails.linkedIn].map((value) => value.trim()).filter(Boolean);
  const lineHeight = contentLayout.bodyFontSize * contentLayout.bodyLineHeight;
  const hasPhoto = includePhoto && Boolean(data.appearance.photoDataUrl);
  return <Document onRender={onRender} title={name ? `${name} – CV` : 'CV'} author={name} subject="Ansioluettelo" language="fi">
    <Page size="A4" wrap style={[styles.page, { fontSize: contentLayout.bodyFontSize, lineHeight: contentLayout.bodyLineHeight, fontFamily: data.appearance.fontFamily === 'serif' ? 'Times-Roman' : 'CvBody' }]}>
      <View style={[styles.header, { backgroundColor: accent, color: accentText, minHeight: mm(hasPhoto ? contentLayout.photoHeaderHeightMm : contentLayout.plainHeaderHeightMm) }]} wrap={false}>
        {hasPhoto && <Image src={data.appearance.photoDataUrl} style={styles.photo} />}
        <View style={styles.nameBlock}>
          {name && <Text style={styles.name}>{name}</Text>}
          {title && <Text style={styles.professionalTitle}><LinkedText text={title} color={accentText} /></Text>}
        </View>
      </View>
      {contacts.length > 0 && <Text style={styles.contacts} orphans={2} widows={2}><LinkedText text={contacts.join(' · ')} color="#6F6963" /></Text>}
      {getCvSections(data).map((section) => <Section key={section.id} section={section} accent={accent} accentText={accentText} lineHeight={lineHeight} contentLayout={contentLayout} styles={styles} />)}
    </Page>
  </Document>;
}
