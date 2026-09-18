import { cvSchema, type CvData } from './cv-model';
import { CvPdfDownloadButton } from './pdf/CvPdfDownloadButton';

function countContent(entries: { id: string; [key: string]: string | boolean }[]) {
  return entries.filter((entry) => Object.entries(entry).some(([key, value]) => key !== 'id' && key !== 'proficiency' && typeof value === 'string' && value.trim())).length;
}

export function CvFinish({ data }: { data: CvData }) {
  const sections = [
    ['Perustiedot', Object.values(data.personalDetails).some((value) => value.trim()) ? 'Täytetty' : 'Tyhjä'],
    ['Esittely', data.summary.trim() ? 'Täytetty' : 'Tyhjä'],
    ['Työkokemus', `${countContent(data.workExperience)} merkintää`],
    ['Koulutus', `${countContent(data.education)} merkintää`],
    ['Osaaminen', `${countContent(data.skills)} merkintää`],
    ['Digitaidot ja järjestelmät', `${data.digitalSkills.filter((entry) => entry.name.trim()).length} merkintää`],
    ['Kielitaito', `${data.languages.filter((entry) => entry.name.trim()).length} merkintää`],
    ['Kortit ja pätevyydet', `${countContent(data.certifications)} merkintää`],
    ['Suosittelijat', data.referencesDisplay === 'hidden' ? 'Piilotettu' : data.referencesDisplay === 'on-request' ? 'Saatavilla pyydettäessä' : `${countContent(data.references)} merkintää`],
  ];
  const validation = cvSchema.safeParse(data);
  return <section aria-labelledby="finish-title" className="finish-summary">
    <h3 id="finish-title">Yhteenveto täytetyistä osioista</h3>
    <p>Tarkista CV-esikatselu ja palaa tarvittaessa muokkaamaan tietoja. Kaikki osiot ovat vapaaehtoisia.</p>
    <dl>{sections.map(([label, status]) => <div key={label}><dt>{label}</dt><dd>{status}</dd></div>)}</dl>
    {!validation.success && <div className="validation-summary" role="alert"><p>Korjaa vielä seuraavat tiedot:</p><ul>{validation.error.issues.map((issue, index) => <li key={index}>{issue.message}</li>)}</ul></div>}
    <CvPdfDownloadButton data={data} />
    <p className="field-help">Luonnos säilyy oletuksena selaimen istunnossa. Pysyvä tallennus tapahtuu vain omalla valinnallasi.</p>
  </section>;
}
