import { cvSchema, type CvData } from '../cv-model';
import { getCvSections, getFullName } from '../cv-content';
import { pdfLayoutVersion, type CvDensity } from '../cv-layout';

export function preparePdfInput(data: CvData, includePhoto = true) {
  const parsed = cvSchema.safeParse(data);
  if (!parsed.success) return null;
  const snapshot = parsed.data;
  snapshot.appearance.accentColor = snapshot.appearance.accentColor.toUpperCase();
  const sourceKey = JSON.stringify({
    layoutVersion: pdfLayoutVersion,
    densityPolicy: ['comfortable', 'compact', 'tight'],
    name: getFullName(snapshot.personalDetails), title: snapshot.personalDetails.professionalTitle.trim(),
    contacts: [snapshot.personalDetails.email, snapshot.personalDetails.phone, snapshot.personalDetails.city, snapshot.personalDetails.linkedIn].map((value) => value.trim()).filter(Boolean),
    sections: getCvSections(snapshot), accent: snapshot.appearance.accentColor, fontFamily: snapshot.appearance.fontFamily,
    includePhoto, photo: includePhoto ? snapshot.appearance.photoDataUrl : '',
  }, (key, value: unknown) => key === 'id' ? undefined : value);
  return { data: snapshot, includePhoto, sourceKey };
}
export function pdfCacheKey(sourceKey: string, density: CvDensity): string { return JSON.stringify([sourceKey, density]); }
export type PdfInput = NonNullable<ReturnType<typeof preparePdfInput>>;
export type PdfResult = { blob: Blob; pageCount: number; density: CvDensity; sourceKey: string; key: string; data: CvData };
