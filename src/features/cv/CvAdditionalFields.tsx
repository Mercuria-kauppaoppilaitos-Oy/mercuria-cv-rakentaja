import { useRef } from 'react';
import { useFieldArray, useWatch, type FieldPath, type UseFormReturn } from 'react-hook-form';
import { createEmptyAdditionalEntry, digitalLevels, languageLevels, type AdditionalSection, type CvData } from './cv-model';

type EntryKey = 'name' | 'proficiency' | 'issuer' | 'issuedDate' | 'expiryDate' | 'title' | 'organization' | 'email' | 'phone';
type EntryField = { key: EntryKey; label: string; options?: readonly string[]; type?: 'email' | 'tel'; inputMode?: 'numeric' };
type SectionConfig = { heading: string; entry: string; add: string; remove: string; help: string; fields: EntryField[] };
const sections: Record<AdditionalSection, SectionConfig> = {
  skills: {
    heading: 'Osaaminen', entry: 'Osaaminen', add: 'Lisää osaaminen', remove: 'Poista osaaminen',
    help: 'Esimerkiksi asiakaspalvelu, myyntityö, verkkokaupan tehtävät ja sosiaalisen median sisällöntuotanto.',
    fields: [{ key: 'name', label: 'Osaaminen' }],
  },
  digitalSkills: {
    heading: 'Digitaidot ja järjestelmät', entry: 'Digitaito', add: 'Lisää digitaito', remove: 'Poista digitaito',
    help: 'Lisää käyttämäsi ohjelmat ja järjestelmät. Voit halutessasi valita osaamistason.',
    fields: [{ key: 'name', label: 'Ohjelman tai järjestelmän nimi' }, { key: 'proficiency', label: 'Osaamistaso (valinnainen)', options: digitalLevels }],
  },
  languages: {
    heading: 'Kielitaito', entry: 'Kieli', add: 'Lisää kieli', remove: 'Poista kieli',
    help: 'Lisää kieli ja valitse taitojasi parhaiten kuvaava taso.',
    fields: [{ key: 'name', label: 'Kieli' }, { key: 'proficiency', label: 'Osaamistaso', options: languageLevels }],
  },
  certifications: {
    heading: 'Kortit, pätevyydet ja muu koulutus', entry: 'Kortti tai pätevyys', add: 'Lisää kortti tai pätevyys', remove: 'Poista kortti tai pätevyys',
    help: 'Esimerkiksi hygieniapassi, ikärajapassi, työturvallisuuskortti ja ensiapukoulutus.',
    fields: [{ key: 'name', label: 'Nimi' }, { key: 'issuer', label: 'Myöntäjä tai koulutuksen järjestäjä (valinnainen)' }, { key: 'issuedDate', label: 'Suoritusvuosi (valinnainen)', inputMode: 'numeric' }, { key: 'expiryDate', label: 'Voimassaoloaika tai lisätieto (valinnainen)' }],
  },
  references: {
    heading: 'Suosittelijat', entry: 'Suosittelija', add: 'Lisää suosittelija', remove: 'Poista suosittelija',
    help: 'Pyydä henkilöltä lupa ennen kuin lisäät hänet suosittelijaksi.',
    fields: [{ key: 'name', label: 'Nimi' }, { key: 'title', label: 'Tehtävänimike' }, { key: 'organization', label: 'Organisaatio' }, { key: 'email', label: 'Sähköpostiosoite (valinnainen)', type: 'email' }, { key: 'phone', label: 'Puhelinnumero (valinnainen)', type: 'tel' }],
  },
};

export function CvAdditionalFields({ form, name }: { form: UseFormReturn<CvData>; name: AdditionalSection }) {
  const config = sections[name];
  const { fields, append, remove } = useFieldArray({ control: form.control, name, keyName: 'fieldId' });
  const entries = useWatch({ control: form.control, name });
  const addButton = useRef<HTMLButtonElement>(null);

  return (
    <fieldset className="history-fields" aria-describedby={`${name}-help`}>
      <legend>{config.heading}</legend>
      <p id={`${name}-help`} className="field-help">{config.help}</p>
      {name === 'references' && <div className="field reference-display">
        <label htmlFor="references-display">Suosittelijoiden näyttötapa</label>
        <select id="references-display" {...form.register('referencesDisplay')}>
          <option value="contact">Näytä yhteystiedot</option>
          <option value="on-request">Näytä ”Suosittelijat saatavilla pyydettäessä”</option>
          <option value="hidden">Piilota osio</option>
        </select>
      </div>}
      {fields.map((field, index) => (
        <fieldset key={field.fieldId} className="history-entry compact-entry">
          <legend>{config.entry} {index + 1}</legend>
          <div className="field-grid">
            {config.fields.map((entryField) => {
              const id = `${name}-${field.fieldId}-${entryField.key}`;
              const path = `${name}.${index}.${entryField.key}` as FieldPath<CvData>;
              const error = form.getFieldState(path, form.formState).error;
              const registration = form.register(path);
              const accessibility = { 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined };
              return <div className={`field ${entryField.key === 'name' || entryField.key === 'expiryDate' || entryField.key === 'issuer' ? 'field-wide' : ''}`} key={entryField.key}>
                <label htmlFor={id}>{entryField.label}</label>
                {entryField.options
                  ? <select id={id} {...accessibility} {...registration}><option value="">Valitse taso</option>{entryField.options.map((level) => <option key={level} value={level}>{level}</option>)}</select>
                  : <input id={id} type={entryField.type ?? 'text'} inputMode={entryField.inputMode} {...accessibility} {...registration} />}
                {error && <p id={`${id}-error`} className="field-error" role="alert">{error.message}</p>}
              </div>;
            })}
          </div>
          <button type="button" className="remove-button" aria-label={`${config.remove} ${index + 1}${entries[index]?.name.trim() ? `: ${entries[index]?.name.trim()}` : ''}`} onClick={() => {
            remove(index);
            addButton.current?.focus();
          }}>Poista merkintä</button>
        </fieldset>
      ))}
      <button ref={addButton} type="button" className="add-button" onClick={() => append(createEmptyAdditionalEntry(name))}>{config.add}</button>
    </fieldset>
  );
}
