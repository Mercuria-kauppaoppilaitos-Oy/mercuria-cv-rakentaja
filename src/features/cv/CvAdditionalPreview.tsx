import type { CvData } from './cv-model';
import { getAdditionalSections } from './cv-content';
import { CvContentPreview } from './CvContentPreview';

export function CvAdditionalPreview({ data }: { data: CvData }) {
  return <>{getAdditionalSections(data).map((section) => <CvContentPreview key={section.id} section={section} />)}</>;
}
