/** Density-independent PDF header typography. Long text may grow the header. */
export const cvHeaderLayout = {
  gapMm: 6,
  nameFontSizePt: 20,
  titleFontSizePt: 10,
  titleMarginMm: 2,
  contactFontSizePt: 10,
};

export type CvDensity = 'comfortable' | 'compact' | 'tight';
export const pdfLayoutVersion = 3;
export interface CvDensityLayout {
  pageMarginMm: number;
  headerPaddingMm: number;
  photoDiameterMm: number;
  photoHeaderHeightMm: number;
  plainHeaderHeightMm: number;
  contactMarginMm: number;
  sectionGapMm: number;
  headingGapMm: number;
  decorationGapMm: number;
  summaryPaddingMm: number;
  entryGapMm: number;
  descriptionGapMm: number;
  metadataGapMm: number;
  bodyFontSize: number;
  bodyLineHeight: number;
}
export const cvDensityLayouts: Record<CvDensity, CvDensityLayout> = {
  comfortable: { pageMarginMm: 18, headerPaddingMm: 7, photoDiameterMm: 24, photoHeaderHeightMm: 38, plainHeaderHeightMm: 31, contactMarginMm: 4, sectionGapMm: 5, headingGapMm: 2, decorationGapMm: 1.5, summaryPaddingMm: 3, entryGapMm: 4, descriptionGapMm: 1.5, metadataGapMm: 0.5, bodyFontSize: 11, bodyLineHeight: 1.6 },
  compact: { pageMarginMm: 18, headerPaddingMm: 6, photoDiameterMm: 22, photoHeaderHeightMm: 35, plainHeaderHeightMm: 28, contactMarginMm: 4, sectionGapMm: 3, headingGapMm: 1, decorationGapMm: 0.7, summaryPaddingMm: 2, entryGapMm: 2, descriptionGapMm: 1, metadataGapMm: 0.5, bodyFontSize: 11, bodyLineHeight: 1.4 },
  tight: { pageMarginMm: 18, headerPaddingMm: 6, photoDiameterMm: 20, photoHeaderHeightMm: 32, plainHeaderHeightMm: 28, contactMarginMm: 3, sectionGapMm: 2, headingGapMm: 0.8, decorationGapMm: 0.5, summaryPaddingMm: 1.5, entryGapMm: 1.3, descriptionGapMm: 0.7, metadataGapMm: 0.4, bodyFontSize: 11, bodyLineHeight: 1.3 },
};
