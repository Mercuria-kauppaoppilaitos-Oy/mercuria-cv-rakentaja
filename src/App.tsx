import { CvPdfProvider } from './features/cv/pdf/CvPdfProvider';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CvForm } from './features/cv/CvForm';
import { CvPreview } from './features/cv/CvPreview';
import { CvStepNavigation } from './features/cv/CvStepNavigation';
import { createEmptyCv, cvSchema, type CvData } from './features/cv/cv-model';
import { useMediaQuery } from './hooks/useMediaQuery';
import mercuriaLogo from './assets/mercuria-logo.svg';
import { loadDraft } from './features/cv/draft-storage';
import { useDraftStorage } from './features/cv/useDraftStorage';

export function App() {
  const [initialDraft] = useState(loadDraft);
  const form = useForm<CvData>({ defaultValues: initialDraft.data, resolver: zodResolver(cvSchema), mode: 'onChange', shouldUnregister: false });
  const data = useWatch({ control: form.control }) as CvData;
  const draft = useDraftStorage(data, initialDraft);
  const [activeStep, setActiveStep] = useState(0);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [showPreview, setShowPreview] = useState(true);
  const [resetVersion, setResetVersion] = useState(0);
  const [includePhoto, setIncludePhoto] = useState(true);
  const mobile = useMediaQuery('(max-width: 767px)');
  const compact = useMediaQuery('(max-width: 1279px)');
  const previousStep = useRef(activeStep);
  useEffect(() => {
    if (previousStep.current !== activeStep) document.getElementById('active-step-heading')?.focus();
    previousStep.current = activeStep;
  }, [activeStep]);
  const selectStep = (step: number) => {
    setActiveStep(step);
    setMobileView('form');
  };
  const startOver = () => {
    const empty = createEmptyCv();
    draft.replace(empty);
    form.reset(empty);
    setIncludePhoto(true);
    setActiveStep(0);
    setMobileView('form');
    setShowPreview(true);
    setResetVersion((value) => value + 1);
    requestAnimationFrame(() => document.getElementById('active-step-heading')?.focus());
  };
  const previewHidden = mobile ? mobileView !== 'preview' : compact && !showPreview;

  return (
    <CvPdfProvider key={resetVersion} data={data} includePhoto={includePhoto}>
    <div className="app-shell">
      <a className="skip-link" href="#main">Siirry sisältöön</a>
      <header className="site-header">
        <div className="brand"><img src={mercuriaLogo} alt="Mercuria" /><span>CV-rakentaja</span></div>
        <p className="privacy-note">Luo muutamassa minuutissa CV, jonka rekrytointijärjestelmät ja tekoäly pystyvät lukemaan.</p>
      </header>
      <main id="main" tabIndex={-1} className={`workspace ${previewHidden ? 'preview-hidden' : ''}`}>
        <CvStepNavigation activeStep={activeStep} onSelect={selectStep} mobile={mobile} onReset={startOver} />
        <div className="mobile-view-switch" role="group" aria-label="Näkymä" hidden={!mobile}>
          <button type="button" aria-pressed={mobileView === 'form'} aria-controls="form-panel" onClick={() => setMobileView('form')}>Lomake</button>
          <button type="button" aria-pressed={mobileView === 'preview'} aria-controls="preview-panel" onClick={() => setMobileView('preview')}>Esikatselu</button>
        </div>
        <div id="form-panel" className="form-column" hidden={mobile && mobileView !== 'form'}>
          <div className="intro"><p className="eyebrow">SEURAAVA ASKEL URALLASI</p><h1>Hyvä CV alkaa sinusta.</h1></div>
          <details className="privacy-details"><summary>Tietosuoja ja luonnoksen säilyminen</summary><p>CV-tiedot säilyvät normaalisti tällä laitteella. Tekoälytoimintoa käytettäessä vain käsiteltäväksi valitsemasi kentän teksti ja mahdollinen tehtävänimike lähetetään tekoälypalvelulle. Kuva pienennetään selaimessa. Istuntoluonnos suojaa sivun vahinkopäivitykseltä. Luonnos säilyy vain tässä selainistunnossa.</p></details>
          {draft.notice && <div className="draft-notice"><p role="status">{draft.notice}</p><button type="button" aria-label="Sulje luonnosilmoitus" onClick={draft.dismissNotice}>Sulje</button></div>}
          {draft.error && <p role="alert" className="field-error">{draft.error}</p>}
          {compact && !mobile && <button className="preview-toggle" type="button" aria-expanded={showPreview} aria-controls="preview-panel" onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Piilota esikatselu' : 'Näytä esikatselu'}</button>}
          <CvForm form={form} data={data} activeStep={activeStep} onSelect={selectStep} pdfPhoto={{ includePhoto, onChange: setIncludePhoto }} />
        </div>
        <aside id="preview-panel" className="preview-column" aria-label="CV-esikatselu" hidden={previewHidden}>
          <CvPreview primaryHeading={mobile && mobileView === 'preview'} />
        </aside>
      </main>
    </div>
    </CvPdfProvider>
  );
}
