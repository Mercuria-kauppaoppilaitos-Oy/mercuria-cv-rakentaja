export type DraftControls = { persistent: boolean; onPersistenceChange: (value: boolean) => void; onClear: () => void };
export function CvDraftControls({ persistent, onPersistenceChange, onClear }: DraftControls) {
  return <fieldset><legend>Luonnoksen säilyttäminen</legend>
    <div className="checkbox-field"><input id="persist-draft" type="checkbox" checked={persistent} onChange={(event) => onPersistenceChange(event.target.checked)} aria-describedby="storage-help" /><label htmlFor="persist-draft">Säilytä luonnos tällä laitteella</label></div>
    <p id="storage-help" className="field-help">Istuntoluonnos palautuu sivun päivityksessä. Pysyvä tallennus säilyttää tiedot myös myöhempää käyttöä varten.</p>
    {persistent && <p className="storage-warning">Älä käytä pysyvää tallennusta yhteiskäyttöisellä tietokoneella.</p>}
    <button type="button" className="remove-button" onClick={onClear}>Tyhjennä kaikki tiedot</button>
  </fieldset>;
}
