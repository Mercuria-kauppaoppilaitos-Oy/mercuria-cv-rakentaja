import type { CvData } from './cv-model';
import { CvPhoto } from './CvPhoto';
import { getFullName } from './cv-content';

export function CvHeader({ data }: { data: CvData }) {
  const details = data.personalDetails;
  const name = getFullName(details);
  return <div className="cv-masthead">
    {data.appearance.photoDataUrl && <CvPhoto appearance={data.appearance} decorative />}
    <div className="cv-name-block">
      <h3 className={name ? 'cv-name' : 'cv-name example-text'}>{name || 'Aino Esimerkki'}</h3>
      <p className={`cv-title ${details.professionalTitle.trim() ? '' : 'example-text'}`}>{details.professionalTitle.trim() || 'Asiakaspalvelun ammattilainen'}</p>
    </div>
  </div>;
}
