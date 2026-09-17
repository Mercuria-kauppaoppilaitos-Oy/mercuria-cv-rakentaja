import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CvForm } from './features/cv/CvForm';
import { CvPreview } from './features/cv/CvPreview';
import { CvStepNavigation } from './features/cv/CvStepNavigation';
import { createEmptyCv, cvSchema, type CvData } from './features/cv/cv-model';
import { useMediaQuery } from './hooks/useMediaQuery';

export function App() {
  const form = useForm<CvData>({ defaultValues: createEmptyCv(), resolver: zodResolver(cvSchema), mode: 'onChange', shouldUnregister: false });
  const data = useWatch({ control: form.control }) as CvData;
  const [activeStep, setActiveStep] = useState(0);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [showPreview, setShowPreview] = useState(true);
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
  const previewHidden = mobile ? mobileView !== 'preview' : compact && !showPreview;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Siirry sisältöön</a>
      <header className="site-header">
        <span className="brand">Mercuria CV</span>
        <p className="privacy-note">Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle.</p>
      </header>
      <main id="main" tabIndex={-1} className={`workspace ${previewHidden ? 'preview-hidden' : ''}`}>
        <CvStepNavigation activeStep={activeStep} onSelect={selectStep} mobile={mobile} />
        <div className="mobile-view-switch" role="group" aria-label="Näkymä" hidden={!mobile}>
          <button type="button" aria-pressed={mobileView === 'form'} aria-controls="form-panel" onClick={() => setMobileView('form')}>Lomake</button>
          <button type="button" aria-pressed={mobileView === 'preview'} aria-controls="preview-panel" onClick={() => setMobileView('preview')}>Esikatselu</button>
        </div>
        <div id="form-panel" className="form-column" hidden={mobile && mobileView !== 'form'}>
          <div className="intro"><p className="eyebrow">SEURAAVA ASKEL URALLASI</p><h1>Hyvä CV alkaa sinusta.</h1></div>
          {compact && !mobile && <button className="preview-toggle" type="button" aria-expanded={showPreview} aria-controls="preview-panel" onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Piilota esikatselu' : 'Näytä esikatselu'}</button>}
          <CvForm form={form} data={data} activeStep={activeStep} onSelect={selectStep} />
        </div>
        <aside id="preview-panel" className="preview-column" aria-label="CV-esikatselu" hidden={previewHidden}>
          <CvPreview data={data} />
        </aside>
      </main>
    </div>
  );
}
