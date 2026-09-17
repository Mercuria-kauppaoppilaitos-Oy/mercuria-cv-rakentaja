import type { UseFormReturn } from 'react-hook-form';
import type { CvData } from './cv-model';

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
export function CvForm({ form }: { form: UseFormReturn<CvData> }) {
  const { register, formState: { errors } } = form;
  return (
    <section className="editor panel" aria-labelledby="editor-title">
      <div className="panel-heading"><p className="eyebrow">OMA CV:SI</p><h2 id="editor-title">Muokkaa tietojasi</h2><p>Kaikki kentät ovat vapaaehtoisia. Esikatselu päivittyy kirjoittaessasi.</p></div>
      <form noValidate onSubmit={(event) => event.preventDefault()}>
        <fieldset><legend>Perustiedot</legend><div className="field-grid">
          {fields.map((field) => {
            const error = errors.personalDetails?.[field.name];
            return <div className={`field ${field.name === 'firstName' || field.name === 'lastName' ? '' : 'field-wide'}`} key={field.name}>
              <label htmlFor={field.name}>{field.label}</label>
              <input id={field.name} type={field.type ?? 'text'} placeholder={field.placeholder} autoComplete={field.autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${field.name}-error` : undefined} {...register(`personalDetails.${field.name}`)} />
              {error && <p className="field-error" id={`${field.name}-error`} role="alert">{error.message}</p>}
            </div>;
          })}
        </div></fieldset>
        <fieldset className="summary-fields"><legend>Esittelyteksti</legend>
          <p id="summary-help" className="field-help">Kerro lyhyesti vahvuuksistasi, osaamisestasi ja tavoitteistasi.</p>
          <label htmlFor="summary">Esittely</label>
          <textarea id="summary" rows={6} placeholder="Olen palveluhenkinen ja huolellinen ammattilainen…" aria-describedby="summary-help" {...register('summary')} />
        </fieldset>
      </form>
    </section>
  );
}
