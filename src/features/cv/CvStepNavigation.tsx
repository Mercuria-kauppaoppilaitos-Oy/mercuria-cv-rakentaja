import { cvSteps } from './cv-steps';

export function CvStepNavigation({ activeStep, onSelect, mobile }: { activeStep: number; onSelect: (step: number) => void; mobile: boolean }) {
  return <>
    <nav className="step-sidebar" aria-label="CV:n vaiheet" hidden={mobile}>
      <p className="sidebar-title">Rakenna oma CV</p>
      <ol>{cvSteps.map((label, index) => <li key={label}>
        <button type="button" aria-current={index === activeStep ? 'step' : undefined} onClick={() => onSelect(index)}>
          <span className="step-number" aria-hidden="true">{index + 1}</span><span>{label}</span>
        </button>
      </li>)}</ol>
      <p className="sidebar-note">Oma osaaminen, selkeästi esiin.</p>
    </nav>
    <div className="mobile-step-selector" hidden={!mobile}>
      <label htmlFor="active-step">Vaihe {activeStep + 1} / {cvSteps.length}</label>
      <select id="active-step" value={activeStep} onChange={(event) => onSelect(Number(event.target.value))}>
        {cvSteps.map((label, index) => <option key={label} value={index}>{index + 1}. {label}</option>)}
      </select>
    </div>
  </>;
}
