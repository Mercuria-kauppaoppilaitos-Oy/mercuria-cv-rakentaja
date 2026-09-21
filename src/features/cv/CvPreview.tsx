import { CvPdfPreview } from './pdf/CvPdfPreview';
export function CvPreview({ primaryHeading = false }: { primaryHeading?: boolean }) {
  const Heading = primaryHeading ? 'h1' : 'h2';
  return <section className="preview" aria-labelledby="preview-title">
    <Heading id="preview-title">CV-esikatselu</Heading>
    <p className="preview-help">Esikatselu vastaa ladattavaa PDF-tiedostoa.</p>
    <CvPdfPreview />
  </section>;
}
