# Mercuria CV

Suomenkielinen, selainpohjainen CV-rakentaja. React-, TypeScript- ja Vite-sovelluksessa muokataan etunimeä, sukunimeä, ammatillista otsikkoa, sähköpostia, puhelinnumeroa, paikkakuntaa, LinkedIn-osoitetta ja esittelytekstiä. Kaikki kentät ovat vapaaehtoisia. Sähköpostin ja LinkedIn-osoitteen muoto tarkistetaan kirjoitettaessa.

Lomake ja heti päivittyvä esikatselu näkyvät työpöydällä rinnakkain ja mobiilissa allekkain. Esikatselu muistuttaa valkoista A4-sivua; pitkä sisältö kasvattaa sivua. Yksipalstainen, tekstipohjainen rakenne tukee ATS-luettavuutta. Harmaat esimerkkitekstit ovat vain näkymän apuna, eivät käyttäjätietoja.

## Tietosuoja ja ensimmäisen version rajaus

Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle. Sovellus ei sisällä backendia, analytiikkaa, ulkoisia fontteja tai käyttäjätietoja lähettäviä verkkokutsuja. Tiedot ovat vain avoimen sivun muistissa; sivun uudelleenlataus tai sulkeminen poistaa ne. Selaimen oma automaattinen täyttö voi ehdottaa tietoja sen asetusten mukaan.

Ensimmäisessä versiossa ei ole PDF-latausta, paikallista tallennusta, valokuvan käsittelyä tai useita pohjia. Muita CV-osioita ja ulkoasun asetuksia varten on tietomalli, mutta niitä ei vielä muokata tai näytetä käyttöliittymässä.

## Käynnistys ja komennot

Tarvitset Node.js 24:n tai uudemman sekä npm:n. Komennot toimivat Windowsin Command Prompt -terminaalissa ja VS Coden terminaalissa. PowerShellissä voit tarvittaessa käyttää `npm.cmd`-komentoa.

```cmd
npm install
npm run dev
```

| Komento | Toiminto |
| --- | --- |
| `npm run dev` | Käynnistää Viten paikallisen kehityspalvelimen ja tulostaa selainosoitteen. |
| `npm test` | Suorittaa Vitest-testit kerran jsdom-ympäristössä. |
| `npm run test:watch` | Suorittaa testit jatkuvasti tiedostoja muokattaessa. |
| `npm run build` | Tarkistaa TypeScript-tyypit ja luo tuotantokoonnin `dist`-kansioon. |
| `npm run preview` | Käynnistää paikallisen palvelimen tuotantokoonnin tarkasteluun. |

Avaa projekti VS Codessa komennolla `code .`.

## Rakenne ja riippuvuudet

- `src/App.tsx`: sivun rakenne ja yhteinen lomaketila.
- `src/features/cv/cv-model.ts`: Zod-skeema, siitä johdetut TypeScript-tyypit ja tyhjät lähtöarvot. Malli kattaa perustiedot, esittelyn, työkokemukset, koulutukset, osaamiset, digitaidot, kielet, kortit ja pätevyydet sekä muun koulutuksen, suosittelijat, pohjan ja ulkoasuasetukset. Päivämäärät ja kielitaidon tasot ovat tässä vaiheessa merkkijonoja; tarkemmat säännöt lisätään osioiden toteutuksen yhteydessä.
- `src/features/cv/CvForm.tsx`: saavutettavasti nimetyt lomakekentät ja kenttiin kytketyt virheviestit.
- `src/features/cv/CvPreview.tsx`: yksipalstainen esikatselu ja pelkästään näkymässä käytettävät esimerkit.
- `src/styles.css`: responsiivinen ulkoasu ja näkyvä näppäimistökohdistus.
- `src/App.test.tsx`, `src/features/cv/cv-model.test.ts`: käyttöliittymän ja lähtötietojen testit.
- `src/test/setup.ts`, `vite.config.ts`: React Testing Libraryn siivous, jest-dom-tarkistukset ja Vitest-asetukset.

React ja React DOM toteuttavat käyttöliittymän. `react-hook-form` hallitsee lomaketilaa ja kenttien seurantaa, `zod` määrittelee keskitetyn tietomallin ja validoinnin, ja `@hookform/resolvers` yhdistää nämä. Vitest, jsdom ja React Testing Library apukirjastoineen ovat kehitysriippuvuuksia.

Testit varmistavat keskeiset otsikot ja tietosuojatiedon, kaikkien kahdeksan kentän välittömän päivittymisen esikatseluun, esimerkkien erillisyyden käyttäjätiedoista, validointiviestit sekä kelvolliset ja itsenäiset tyhjät lähtöarvot. jsdom-testit eivät arvioi selaimen visuaalista asettelua tai todellisten ATS-järjestelmien toimintaa.

Sovellus ei tarvitse ympäristömuuttujia tai API-avaimia. Älä lisää salaisuuksia selaimelle toimitettavaan koodiin tai `VITE_`-muuttujiin. Mahdolliset myöhemmät salaisuudet pidetään paikallisessa `.env`-tiedostossa ja muuttujat dokumentoidaan `.env.example`-tiedostoon ilman oikeita arvoja.
