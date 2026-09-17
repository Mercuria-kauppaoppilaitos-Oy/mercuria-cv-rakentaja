import type { UseFormReturn } from 'react-hook-form';
import type { CvData } from './cv-model';
import { defaultAccentColor, isHexColor } from './color-utils';

export function CvAppearanceControls({ form, appearance }: { form: UseFormReturn<CvData>; appearance: CvData['appearance'] }) {
  const error = form.formState.errors.appearance?.accentColor;
  const safeColor = isHexColor(appearance.accentColor) ? appearance.accentColor : defaultAccentColor;
  return <fieldset><legend>CV:n ulkoasu</legend>
    <p id="color-help" className="field-help">Väri vaikuttaa vain CV:n koriste-elementteihin ja otsakealueeseen.</p>
    <div className="color-controls">
      <div><label htmlFor="accent-picker">CV:n korostusväri</label><input id="accent-picker" type="color" value={safeColor} aria-describedby="color-help" onChange={(event) => form.setValue('appearance.accentColor', event.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })} /></div>
      <div><label htmlFor="accent-hex">HEX-väri</label><input id="accent-hex" type="text" {...form.register('appearance.accentColor')} aria-invalid={Boolean(error)} aria-describedby={error ? 'color-help color-error' : 'color-help'} /></div>
      <span className="color-swatch" aria-hidden="true" style={{ backgroundColor: safeColor }} />
    </div>
    {error && <p className="field-error" id="color-error" role="alert">{error.message}</p>}
    <button type="button" onClick={() => form.setValue('appearance.accentColor', defaultAccentColor, { shouldDirty: true, shouldValidate: true })}>Palauta beige oletusväri</button>
  </fieldset>;
}
