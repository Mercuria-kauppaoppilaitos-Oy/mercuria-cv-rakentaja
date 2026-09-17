import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CvForm } from './features/cv/CvForm';
import { CvPreview } from './features/cv/CvPreview';
import { createEmptyCv, cvSchema, type CvData } from './features/cv/cv-model';

export function App() {
  const form = useForm<CvData>({ defaultValues: createEmptyCv(), resolver: zodResolver(cvSchema), mode: 'onChange' });
  const data = useWatch({ control: form.control }) as CvData;
  return (
    <>
      <a className="skip-link" href="#main">Siirry sisältöön</a>
      <header className="site-header"><div className="header-inner"><span className="brand">Mercuria CV</span><span className="header-caption">Osaamisesi näkyväksi</span></div></header>
      <main id="main" tabIndex={-1}>
        <div className="intro"><p className="eyebrow">SEURAAVA ASKEL URALLASI</p><h1>Hyvä CV alkaa sinusta.</h1><p>Kokoa perustietosi ja kerro, mitä osaat. Näet ansioluettelosi muotoutuvan heti.</p><p className="privacy-note">Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle.</p></div>
        <div className="builder-layout"><CvForm form={form} /><CvPreview data={data} /></div>
      </main>
      <footer>Tiedot säilyvät vain avoimessa näkymässä. Sivun uudelleenlataus tyhjentää ne.</footer>
    </>
  );
}
