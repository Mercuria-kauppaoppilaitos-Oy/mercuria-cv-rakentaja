import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CvAtsReview } from './ats/CvAtsReview';
import type { CvData } from './cv-model';
import { CvHistoryFields } from './CvHistoryFields';
import { CvAdditionalFields } from './CvAdditionalFields';
import { CvFinish } from './CvFinish';
import { cvSteps } from './cv-steps';
import { CvAppearanceControls } from './CvAppearanceControls';
import { CvPhotoUpload } from './CvPhotoUpload';
import { CvDraftControls, type DraftControls } from './CvDraftControls';

type PersonalField = keyof CvData['personalDetails'];
const fields: { name: PersonalField; label: string; placeholder: string; type?: 'email' | 'tel' | 'url'; autoComplete?: string }[] = [
  { name: 'firstName', label: 'Etunimi', placeholder: 'Aino', autoComplete: 'given-name' },
  { name: 'lastName', label: 'Sukunimi', placeholder: 'Esimerkki', autoComplete: 'family-name' },
  { name: 'professionalTitle', label: 'Ammatillinen otsikko', placeholder: 'Asiakaspalvelun ammattilainen', autoComplete: 'organization-title' },
  { name: 'email', label: 'Sähköposti', placeholder: 'aino.esimerkki@example.com', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Puhelinnumero', placeholder: '040 123 4567', type: 'tel', autoComplete: 'tel' },
  { name: 'city', label: 'Paikkakunta', placeholder: 'Vantaa', autoComplete: 'address-level2' },
  { name: 'linkedIn', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/aino-esimerkki', type: 'url' },
];
export function CvForm({ form, data, activeStep, onSelect, draftControls }: { form: UseFormReturn<CvData>; data: CvData; activeStep: number; onSelect: (step: number) => void; draftControls: DraftControls }) {
  const { register, formState: { errors } } = form;
  const [editHint, setEditHint] = useState<{ step: number; text: string } | null>(null);
  return (
    <section className="editor panel" aria-labelledby="editor-title">
      <div className="panel-heading"><p className="eyebrow">OMA CV:SI</p><h2 id="editor-title">Muokkaa tietojasi</h2><p>Kaikki kentät ovat vapaaehtoisia. Esikatselu päivittyy kirjoittaessasi.</p></div>
      <h3 className="active-step-heading" tabIndex={-1} id="active-step-heading">{cvSteps[activeStep]}</h3>
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        {editHint?.step === activeStep && <div className="field-help" role="status"><p>{editHint.text}</p><button type="button" onClick={() => setEditHint(null)}>Sulje muokkausvihje</button></div>}
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
          <textarea id="summary" rows={6} placeholder="Olen palveluhenkinen ja huolellinen ammattilainen…" aria-describedby="summary-help" {...register('summary')} />
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
          <CvDraftControls {...draftControls} />
          <CvFinish data={data} />
          <CvAtsReview data={data} form={form} onEdit={(step, text) => { setEditHint({ step, text }); onSelect(step); }} />
        </>}
        <div className="step-actions">
          <button type="button" disabled={activeStep === 0} onClick={() => onSelect(activeStep - 1)}>Edellinen</button>
          <span>{activeStep + 1} / {cvSteps.length}</span>
          <button className="add-button" type="button" disabled={activeStep === cvSteps.length - 1} onClick={() => onSelect(activeStep + 1)}>Seuraava</button>
        </div>
      </form>
    </section>
  );
}
