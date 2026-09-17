import type { CvData } from './cv-model';
import { CvHistoryPreview } from './CvHistoryPreview';
import { CvAdditionalPreview } from './CvAdditionalPreview';
import { CvSheet } from './CvSheet';
import { CvHeader } from './CvHeader';

function PreviewText({ value, example }: { value: string; example: string }) {
  return <span className={value.trim() ? undefined : 'example-text'}>{value.trim() || example}</span>;
}
export function CvPreview({ data }: { data: CvData }) {
  const details = data.personalDetails;
  return (
    <section className="preview" aria-labelledby="preview-title">
      <div className="preview-heading"><h2 id="preview-title">CV-esikatselu</h2><span>ATS-ystävällinen yksipalstainen rakenne</span></div>
      <p className="preview-help" id="preview-help">Harmaat tekstit ovat esimerkkejä. Ne eivät ole osa tietojasi.</p>
      <CvSheet appearance={data.appearance}>
        <CvHeader data={data} />
        <div className="cv-contact">
          <span className="cv-contact-item"><PreviewText value={details.email} example="aino.esimerkki@example.com" /></span>
          <span aria-hidden="true" className="cv-contact-separator"> · </span>
          <span className="cv-contact-item"><PreviewText value={details.phone} example="040 123 4567" /></span>
          <span aria-hidden="true" className="cv-contact-separator"> · </span>
          <span className="cv-contact-item"><PreviewText value={details.city} example="Vantaa" /></span>
          <span aria-hidden="true" className="cv-contact-separator"> · </span>
          <span className="cv-contact-item"><PreviewText value={details.linkedIn} example="https://www.linkedin.com/in/aino-esimerkki" /></span>
        </div>
        <section className="cv-summary" aria-labelledby="cv-summary-title"><h4 id="cv-summary-title">Esittely</h4>
          <p><PreviewText value={data.summary} example="Olen palveluhenkinen ja huolellinen ammattilainen. Vahvuuksiani ovat sujuva asiakaspalvelu, yhteistyö ja halu oppia uutta. Etsin tehtävää, jossa voin hyödyntää osaamistani ja kehittyä." /></p>
        </section>
        <CvHistoryPreview entries={data.workExperience} heading="TYÖKOKEMUS" id="cv-work-title" />
        <CvHistoryPreview entries={data.education} heading="KOULUTUS" id="cv-education-title" />
        <CvAdditionalPreview data={data} />
      </CvSheet>
    </section>
  );
}
