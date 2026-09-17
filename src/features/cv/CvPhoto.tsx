import type { CvData } from './cv-model';

export function CvPhoto({ appearance, decorative = false }: { appearance: CvData['appearance']; decorative?: boolean }) {
  return <span className="cv-photo-frame"><img src={appearance.photoDataUrl} alt={decorative ? '' : 'Lisätyn valokuvan esikatselu'} style={{ left: `${-0.2 * appearance.photoPositionX}%`, top: `${-0.2 * appearance.photoPositionY}%` }} /></span>;
}
