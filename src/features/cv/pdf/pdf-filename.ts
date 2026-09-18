import type { CvData } from '../cv-model';

export function getPdfFilename(details: CvData['personalDetails']): string {
  const name = [details.firstName, details.lastName].map((value) => value
    .normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9 -]/g, '')
    .trim().replace(/\s+/g, '_')).filter(Boolean).join('_').slice(0, 110).replace(/[_-]+$/, '');
  return name ? `${name}_CV.pdf` : 'CV.pdf';
}
