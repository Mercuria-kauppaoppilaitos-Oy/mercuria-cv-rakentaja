import { MonthPicker } from './MonthPicker';
import { useRef } from 'react';
import { useFieldArray, useWatch, type FieldPath, type UseFormReturn } from 'react-hook-form';
import { createEmptyEducation, createEmptyWorkExperience, type CvData } from './cv-model';
import { CvTextRewrite } from './ai/CvTextRewrite';

type HistoryName = 'workExperience' | 'education';
const sections = {
  workExperience: {
    heading: 'Työkokemus',
    entryName: 'Työkokemus',
    addLabel: 'Lisää työkokemus',
    removeLabel: 'Poista työkokemus',
    help: 'Voit lisätä myös TET-jakson, työharjoittelun tai työssäoppimisen. Kerro, mitä teit ja opit.',
    titleKey: 'title', titleLabel: 'Tehtävänimike tai kokemuksen tyyppi',
    organizationKey: 'employer', organizationLabel: 'Työnantaja tai organisaatio',
    endLabel: 'Päättymiskuukausi', currentLabel: 'Työskentelen täällä edelleen',
    descriptionLabel: 'Tehtävät ja saavutukset',
    descriptionHelp: 'Kirjoita 2–4 lyhyttä kokonaislausetta tehtävistäsi ja saavutuksistasi. Esimerkiksi: Vastasin tuotteiden hyllytyksestä ja myymälän siisteydestä. Kerro vain, mitä itse teit.',
  },
  education: {
    heading: 'Koulutus',
    entryName: 'Koulutus',
    addLabel: 'Lisää koulutus',
    removeLabel: 'Poista koulutus',
    help: 'Lisää myös keskeneräiset opinnot. Voit merkitä arvioidun valmistumiskuukauden.',
    titleKey: 'qualification', titleLabel: 'Tutkinnon tai koulutuksen nimi',
    organizationKey: 'institution', organizationLabel: 'Oppilaitos',
    endLabel: 'Valmistumiskuukausi tai arvioitu valmistumiskuukausi', currentLabel: 'Opinnot jatkuvat',
    descriptionLabel: 'Osaamisala, suuntautuminen tai lyhyt lisätieto',
    descriptionHelp: 'Kerro esimerkiksi osaamisalasi tai opintojesi tärkeimmistä sisällöistä.',
  },
} as const;

export function CvHistoryFields({ form, name }: { form: UseFormReturn<CvData>; name: HistoryName }) {
  const config = sections[name];
  const { fields, append, remove } = useFieldArray({ control: form.control, name, keyName: 'fieldId' });
  const entries = useWatch({ control: form.control, name });
  const addButton = useRef<HTMLButtonElement>(null);

  return (
    <fieldset className="history-fields" aria-describedby={`${name}-help`}>
      <legend>{config.heading}</legend>
      <p id={`${name}-help`} className="field-help">{config.help}</p>
      {fields.map((field, index) => {
        const prefix = `${name}-${field.fieldId}`;
        const entry = entries[index];
        const title = entry && ('title' in entry ? entry.title : entry.qualification);
        const organization = entry && ('employer' in entry ? entry.employer : entry.institution);
        const identity = [title?.trim(), organization?.trim()].filter(Boolean).join(', ');
        const path = (key: string) => `${name}.${index}.${key}` as FieldPath<CvData>;
        return (
          <fieldset className="history-entry" key={field.fieldId}>
            <legend>{config.entryName} {index + 1}</legend>
            <div className="field-grid">
              <div className="field field-wide">
                <label htmlFor={`${prefix}-title`}>{config.titleLabel}</label>
                <input id={`${prefix}-title`} {...form.register(path(config.titleKey))} />
              </div>
              <div className="field field-wide">
                <label htmlFor={`${prefix}-organization`}>{config.organizationLabel}</label>
                <input id={`${prefix}-organization`} {...form.register(path(config.organizationKey))} />
              </div>
              <div className="field field-wide">
                <label htmlFor={`${prefix}-location`}>Paikkakunta (valinnainen)</label>
                <input id={`${prefix}-location`} {...form.register(`${name}.${index}.location`)} />
              </div>
              <MonthPicker id={`${prefix}-start`} label="Aloituskuukausi" value={entry?.startDate ?? ''} onChange={(value) => form.setValue(`${name}.${index}.startDate`, value, { shouldDirty: true })} />
              <MonthPicker id={`${prefix}-end`} label={config.endLabel} value={entry?.endDate ?? ''} disabled={entry?.isCurrent} onChange={(value) => form.setValue(`${name}.${index}.endDate`, value, { shouldDirty: true })} />
              <div className="field field-wide checkbox-field">
                <input id={`${prefix}-current`} type="checkbox" {...form.register(`${name}.${index}.isCurrent`)} />
                <label htmlFor={`${prefix}-current`}>{config.currentLabel}</label>
              </div>
              <div className="field field-wide">
                <label htmlFor={`${prefix}-description`}>{config.descriptionLabel}</label>
                <p id={`${prefix}-description-help`} className="field-help">{config.descriptionHelp}</p>
                <textarea id={`${prefix}-description`} rows={4} aria-describedby={`${prefix}-description-help`} {...form.register(`${name}.${index}.description`)} />
                {name === 'workExperience' && <CvTextRewrite form={form} textType="workExperience" entryId={field.id} sourceText={entry?.description ?? ''} jobTitle={entry && 'title' in entry ? entry.title : ''} />}
              </div>
            </div>
            <button type="button" className="remove-button" aria-label={`${config.removeLabel} ${index + 1}${identity ? `: ${identity}` : ''}`} onClick={() => {
              remove(index);
              addButton.current?.focus();
            }}>Poista merkintä</button>
          </fieldset>
        );
      })}
      <button ref={addButton} type="button" className="add-button" onClick={() => append(name === 'workExperience' ? createEmptyWorkExperience() : createEmptyEducation())}>{config.addLabel}</button>
    </fieldset>
  );
}
