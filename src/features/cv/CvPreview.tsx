import type { CSSProperties } from 'react';
import type { CvData } from './cv-model';

function PreviewText({ value, example }: { value: string; example: string }) {
  return <span className={value.trim() ? undefined : 'example-text'}>{value.trim() || example}</span>;
}
export function CvPreview({ data }: { data: CvData }) {
  const details = data.personalDetails;
  const name = [details.firstName.trim(), details.lastName.trim()].filter(Boolean).join(' ');
  const pageStyle: CSSProperties = { fontFamily: data.appearance.fontFamily === 'serif' ? 'Georgia, serif' : 'Arial, sans-serif', fontSize: `${data.appearance.fontSize}pt`, lineHeight: data.appearance.lineHeight };
  return (
    <section className="preview" aria-labelledby="preview-title">
      <div className="preview-heading"><h2 id="preview-title">CV-esikatselu</h2><span>Yksipalstainen pohja</span></div>
      <p className="preview-help" id="preview-help">Harmaat tekstit ovat esimerkkejä. Ne eivät ole osa tietojasi.</p>
      <article className="cv-page" style={pageStyle} aria-label="Ansioluettelon esikatselu" aria-describedby="preview-help">
        <h3 className={name ? 'cv-name' : 'cv-name example-text'}>{name || 'Aino Esimerkki'}</h3>
        <p className="cv-title"><PreviewText value={details.professionalTitle} example="Asiakaspalvelun ammattilainen" /></p>
        <div className="cv-contact">
          <p><PreviewText value={details.email} example="aino.esimerkki@example.com" /></p>
          <p><PreviewText value={details.phone} example="040 123 4567" /></p>
          <p><PreviewText value={details.city} example="Vantaa" /></p>
          <p><PreviewText value={details.linkedIn} example="https://www.linkedin.com/in/aino-esimerkki" /></p>
        </div>
        <section className="cv-summary" aria-labelledby="cv-summary-title"><h4 id="cv-summary-title">Esittely</h4>
          <p><PreviewText value={data.summary} example="Olen palveluhenkinen ja huolellinen ammattilainen. Vahvuuksiani ovat sujuva asiakaspalvelu, yhteistyö ja halu oppia uutta. Etsin tehtävää, jossa voin hyödyntää osaamistani ja kehittyä." /></p>
        </section>
      </article>
    </section>
  );
}
