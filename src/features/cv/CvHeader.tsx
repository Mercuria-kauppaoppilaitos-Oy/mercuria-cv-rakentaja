import type { CvData } from './cv-model';
import { CvPhoto } from './CvPhoto';
import { getFullName } from './cv-content';
import type { CSSProperties } from 'react';
import { cvHeaderLayout as layout } from './cv-layout';

export function CvHeader({ data }: { data: CvData }) {
  const details = data.personalDetails;
  const name = getFullName(details);
  const style: CSSProperties & Record<string, string> = {
    '--cv-header-height': `${data.appearance.photoDataUrl ? layout.photoHeaderHeightMm : layout.plainHeaderHeightMm}mm`,
    '--cv-header-padding': `${layout.paddingMm}mm`,
    '--cv-header-gap': `${layout.gapMm}mm`,
    '--cv-photo-diameter': `${layout.photoDiameterMm}mm`,
    '--cv-name-size': `${layout.nameFontSizePt}pt`,
    '--cv-title-size': `${layout.titleFontSizePt}pt`,
    '--cv-title-margin': `${layout.titleMarginMm}mm`,
  };
  return <div className="cv-masthead" style={style}>
    {data.appearance.photoDataUrl && <CvPhoto appearance={data.appearance} decorative />}
    <div className="cv-name-block">
      <h3 className={name ? 'cv-name' : 'cv-name example-text'}>{name || 'Aino Esimerkki'}</h3>
      <p className={`cv-title ${details.professionalTitle.trim() ? '' : 'example-text'}`}>{details.professionalTitle.trim() || 'Asiakaspalvelun ammattilainen'}</p>
    </div>
  </div>;
}
