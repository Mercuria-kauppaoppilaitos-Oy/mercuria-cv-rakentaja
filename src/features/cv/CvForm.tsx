import type { PdfPhotoControl } from './pdf/pdf-options';
import type { UseFormReturn } from 'react-hook-form';
import { CvTextRewrite } from './ai/CvTextRewrite';
import { summaryMaxLength, type CvData } from './cv-model';
import { CvHistoryFields } from './CvHistoryFields';
import { CvAdditionalFields } from './CvAdditionalFields';
import { CvFinish } from './CvFinish';
import { cvSteps } from './cv-steps';
import { CvAppearanceControls } from './CvAppearanceControls';
import { CvPhotoUpload } from './CvPhotoUpload';

type PersonalField = keyof CvData['personalDetails'];
const fields: { name: PersonalField; label: string; placeholder: string; type?: 'email' | 'tel' | 'url'; autoComplete?: string }[] = [
  { name: 'firstName', label: 'Etunimi', placeholder: 'Aino', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Sukunimi', placeholder: 'Esimerkki', autoComplete: 'family-name' },
  { name: 'professionalTitle', label: 'Osaamistasi kuvaava otsikko', placeholder: 'Asiakaspalvelun ammattilainen', autoComplete: 'organization-title' },
  { name: 'email', label: 'Sähköposti', placeholder: 'aino.esimerkki@example.com', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Puhelinnumero', placeholder: '040 123 4567', type: 'tel', autoComplete: 'tel' },
  { name: 'linkedIn', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/aino-esimerkki', type: 'url' },
];
export function CvForm({ form, data, activeStep, onSelect, pdfPhoto }: { form: UseFormReturn<CvData>; data: CvData; activeStep: number; onSelect: (step: number) => void; pdfPhoto?: PdfPhotoControl }) {
  const { register, formState: { errors } } = form;
  const summaryError = errors.summary;
  const summaryLength = data.summary.length;
  const summaryDescribedBy = ['summary-help', summaryError ? 'summary-error' : ''].filter(Boolean).join(' ');
  return (
    <section className="editor panel" aria-labelledby="editor-title">
      <div className="panel-heading"><p className="eyebrow">OMA CV:SI</p><h2 id="editor-title">Muokkaa tietojasi</h2><p>Kaikki kentät ovat vapaaehtoisia. Esikatselu päivittyy kirjoittaessasi.</p></div>
      <h3 className="active-step-heading" tabIndex={-1} id="active-step-heading">{cvSteps[activeStep]}</h3>
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        {activeStep === 0 && <fieldset><legend>Perustiedot</legend><div className="field-grid">
          {fields.map((field) => {
            const error = errors.personalDetails?.[field.name];
            return <div className={`field ${field.name === 'firstName' || field.name === 'lastName' ? '' : 'field-wide'}`} key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input id={field.name} type={field.type ?? 'text'} placeholder={field.placeholder} autoComplete={field.autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${field.name}-error` : undefined} {...register(`personalDetails.${field.name}`)} />
              {error && <p className="field-error" id={`${field.name}-error`} role="alert">{error.message}</p>}
            </div>;
          })}
        </div></fieldset>}
        {activeStep === 0 && <CvPhotoUpload form={form} appearance={data.appearance} />}
        {activeStep === 1 && <fieldset className="summary-fields"><legend>Esittelyteksti</legend>
          <p id="summary-help" className="field-help">Kerro lyhyesti vahvuuksistasi, osaamisestasi ja tavoitteistasi.</p>
          <label htmlFor="summary">Esittely</label>
          <textarea id="summary" rows={6} maxLength={summaryMaxLength} placeholder="Olen palveluhenkinen ja huolellinen ammattilainen…" aria-invalid={Boolean(summaryError)} aria-describedby={summaryDescribedBy} {...register('summary')} />
          <div className="summary-meta">
            {summaryError && <p className="field-error" id="summary-error" role="alert">{summaryError.message}</p>}
            <p className="summary-counter" id="summary-counter" aria-hidden="true">{summaryLength}/{summaryMaxLength} merkkiä</p>
          </div>
          <CvTextRewrite form={form} textType="profile" sourceText={data.summary} />
        </fieldset>}
        {activeStep === 2 && <CvHistoryFields key="workExperience" form={form} name="workExperience" />}
        {activeStep === 3 && <CvHistoryFields key="education" form={form} name="education" />}
        {activeStep === 4 && <>
          <CvAdditionalFields key="skills" form={form} name="skills" />
          <CvAdditionalFields key="languages" form={form} name="languages" />
        </>}
        {activeStep === 5 && <>
          <CvAdditionalFields key="certifications" form={form} name="certifications" />
          <CvAdditionalFields key="references" form={form} name="references" />
        </>}
        {activeStep === 6 && <>
          <CvAppearanceControls form={form} appearance={data.appearance} />
          <CvFinish data={data} pdfPhoto={pdfPhoto} />
        </>}
        <div className="step-actions">
          <button type="button" disabled={activeStep === 0} onClick={() => onSelect(activeStep - 1)}>Edellinen</button>
          <span>{activeStep + 1} / {cvSteps.length}</span>
          <button className="add-button" type="button" disabled={activeStep === cvSteps.length - 1} onClick={() => onSelect(activeStep + 1)}>Seuraava</button>
        </div>
        {activeStep === 6 && <details className="privacy-details"><summary>Tietosuoja ja luonnoksen säilyminen</summary>
          <p>CV-luonnos ja valokuva käsitellään selaimessa. PDF muodostetaan selaimessa. Luonnos tallentuu tämän välilehden istuntotallennukseen ja palautuu sivun päivityksessä. Selaimen istunnon palautus voi palauttaa myös luonnoksen. Yhteiskäyttöisellä laitteella poista tarvittaessa sivuston tiedot selaimen asetuksista.</p>
          <p>AI toimii vain painalluksestasi. Esittelyn ja työkokemuksen parantamiseen lähetetään valitun kentän teksti ja mahdollinen tehtävänimike palvelinrajapinnan kautta OpenAI-palveluun. Osaamisehdotuksiin lähetetään osaamista kuvaava otsikko, esittely sekä työtehtävien ja koulutusten nimet ja kuvaukset. Nimi-, yhteystieto-, valokuva-, työnantaja-, oppilaitos- ja suosittelijakenttiä ei lähetetä osaamisehdotuksia varten. Jos kirjoitat henkilötietoja ammatilliseen vapaatekstiin, myös ne sisältyvät lähetykseen.</p>
          <p>Ehdotuksia ei lisätä CV:hen ilman valintaasi. Osaamisehdotukset ja lähdetietojen tarkiste säilyvät istuntotallennuksessa; erillistä kopiota lähdetekstistä ei tallenneta. Aloita alusta tyhjentää myös ehdotukset. Tallennus voi estyä selaimen asetusten vuoksi. Työpaikkailmoituksia ei käsitellä. Sovellus ei lokita AI-tekstejä; palveluntarjoajan tietojen käsittelyyn sovelletaan sen ehtoja.</p>
        </details>}
      </form>
    </section>
  );
}
