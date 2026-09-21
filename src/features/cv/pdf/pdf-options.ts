import type { CvDensity } from '../cv-layout';
/** Export settings are deliberately separate from the persisted CV model. */
export type CvPdfOptions = { includePhoto?: boolean; density?: CvDensity };

export type PdfPhotoControl = { includePhoto: boolean; onChange: (value: boolean) => void };
