import { useState } from 'react';
import { increment } from './counter';

export function App() {
  const [count, setCount] = useState(0);
  return (
    <>
      <a className="skip-link" href="#main">Siirry sisältöön</a>
      <header><span>mercuria-cv</span></header>
      <main id="main" tabIndex={-1}>
        <p className="eyebrow">Valmiina ensimmäiseen ideaan</p>
        <h1>Tervetuloa uuteen projektiisi</h1>
        <p>Muokkaa aloitusnäkymää tiedostossa src/App.tsx ja aloita rakentaminen.</p>
        <section aria-labelledby="example-title">
          <h2 id="example-title">Kokeile sovellusta</h2>
          <p role="status">Painalluksia: {count}</p>
          <button type="button" onClick={() => setCount(increment)}>Lisää painallus</button>
        </section>
      </main>
      <footer>Rakennettu Reactilla ja TypeScriptillä.</footer>
    </>
  );
}
