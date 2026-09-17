# Mercuria CV

Suomenkielinen, selainpohjainen CV-rakentaja. React-, TypeScript- ja Vite-sovelluksessa muokataan perustietoja, esittelytekstiä, työkokemuksia, koulutuksia, osaamisia, digitaitoja, kielitaitoa, kortteja ja pätevyyksiä sekä suosittelijoita. Kaikki osiot ovat vapaaehtoisia. Täytettyjen sähköpostiosoitteiden ja LinkedIn-osoitteen muoto tarkistetaan kirjoitettaessa.

Lomake ja heti päivittyvä esikatselu näkyvät työpöydällä rinnakkain ja mobiilissa allekkain. Esikatselu muistuttaa valkoista A4-sivua; pitkä sisältö kasvattaa sivua. Yksipalstainen, tekstipohjainen rakenne tukee ATS-luettavuutta. Harmaat esimerkkitekstit ovat vain näkymän apuna, eivät käyttäjätietoja.

## Työkokemus ja koulutus

Lisää merkintöjä painikkeilla **Lisää työkokemus** ja **Lisää koulutus**. Jokaisen merkinnän voi poistaa erikseen. Työkokemukseen sopivat myös TET-jakso, työharjoittelu ja työssäoppiminen. Kirjoita tehtävät ja saavutukset yksi kohta omalle rivilleen; esikatselu näyttää ne tavallisena tekstiluettelona ja ohittaa tyhjät rivit.

Kuukaudet valitaan kuukausikentistä ja näytetään CV:ssä muodossa `08/2023–12/2023`. Valinta **Työskentelen täällä edelleen** poistaa päättymiskuukauden käytöstä ja näyttää loppuna `nykyhetki`. Aiemmin syötetty päättymiskuukausi säilyy muistissa ja tulee takaisin käyttöön, jos valinta poistetaan. Koulutukselle voi antaa arvioidun valmistumiskuukauden; valinta **Opinnot jatkuvat** näyttää sen sijaan ajanjakson loppuna `nykyhetki`.

Esikatselun järjestys on nimi ja yhteystiedot, Esittely, TYÖKOKEMUS, KOULUTUS, OSAAMINEN, DIGITAIDOT JA JÄRJESTELMÄT, KIELITAITO, KORTIT JA PÄTEVYYDET ja SUOSITTELIJAT. Tyhjät osiot ja kokonaan tyhjät merkinnät piilotetaan. Merkinnät näkyvät lisäysjärjestyksessä. Merkintöjen CSS-sivutussäännöt pyrkivät pitämään ne yhtenäisinä tulevaa PDF-sivutusta varten; PDF-toimintoa ei vielä ole.

## Osaaminen, digitaidot, kielet ja pätevyydet

Jokaisessa osiossa voi lisätä ja poistaa useita merkintöjä. Osaaminen esitetään tavallisena tekstiluettelona. Digitaitoon lisätään ohjelman tai järjestelmän nimi ja haluttaessa taso **Perusteet**, **Hyvä** tai **Edistynyt**. Kielitaidon tasot ovat **Äidinkieli**, **Erinomainen**, **Sujuva**, **Hyvä**, **Tyydyttävä** ja **Perusteet**. Tasot esitetään tekstinä, esimerkiksi `Microsoft Excel – hyvä` ja `Englanti – sujuva`. Pelkkä tason valinta ilman nimeä ei näy CV:ssä.

Kortteihin, pätevyyksiin ja muuhun koulutukseen voi lisätä nimen, myöntäjän tai järjestäjän, suoritusvuoden ja voimassaoloajan tai lisätiedon. Suoritusvuosi hyväksyy tyhjän arvon tai neljä numeroa. Virhe ilmoitetaan kenttään kytketyllä viestillä, eikä virheellistä vuotta näytetä esikatselussa. Esimerkkejä ovat hygieniapassi, ikärajapassi, työturvallisuuskortti ja ensiapukoulutus.

## Suosittelijat

Pyydä henkilöltä lupa ennen kuin lisäät hänet suosittelijaksi. Merkintään voi kirjoittaa nimen, tehtävänimikkeen, organisaation sekä vapaaehtoiset sähköpostiosoitteen ja puhelinnumeron. Täytetty sähköpostiosoite validoidaan, ja virheviesti kytketään saavutettavasti kyseiseen kenttään.

Näyttötavat ovat **Näytä yhteystiedot**, **Näytä ”Suosittelijat saatavilla pyydettäessä”** ja **Piilota osio**. Yhteystietojen näyttäminen on oletus, mutta tyhjä osio ei näy CV:ssä. Pyydettäessä-vaihtoehto näyttää pelkän lauseen myös ilman merkintöjä. Piilotettu osio ei näytä mitään. Näyttötavan vaihtaminen säilyttää merkinnät lomakkeessa; yksityiskohtaiset tiedot näkyvät esikatselussa vain yhteystietojen näyttötavalla.

## Tietosuoja ja ensimmäisen version rajaus

Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle. Sovellus ei sisällä backendia, analytiikkaa, ulkoisia fontteja tai käyttäjätietoja lähettäviä verkkokutsuja. Tiedot ovat vain avoimen sivun muistissa; sivun uudelleenlataus tai sulkeminen poistaa ne. Selaimen oma automaattinen täyttö voi ehdottaa tietoja sen asetusten mukaan.

Nykyisessä versiossa ei ole PDF-latausta, paikallista tallennusta, valokuvan käsittelyä tai useita pohjia. Ulkoasun asetuksia varten on tietomalli, mutta niitä ei vielä muokata käyttöliittymässä.

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
- `src/features/cv/cv-model.ts`: Zod-skeema, siitä johdetut TypeScript-tyypit, tyhjät lähtöarvot, taitotasot ja suosittelijoiden näyttötapa. Digitaidot ja kielet käyttävät rajattua `proficiency`-tasoa. Pätevyyksien `issuedDate` sisältää suoritusvuoden ja `expiryDate` vapaamuotoisen voimassaoloajan tai lisätiedon. Työkokemuksen ja koulutuksen kuukaudet tallentuvat muotoon `YYYY-MM`.
- `src/features/cv/CvForm.tsx`: saavutettavasti nimetyt lomakekentät ja kenttiin kytketyt virheviestit.
- `src/features/cv/CvHistoryFields.tsx`: työkokemuksen ja koulutuksen dynaamiset kentät. Molemmat käyttävät `useFieldArray`-toimintoa nykyisessä yhteisessä lomaketilassa. Merkinnöillä on omat tietomallin tunnisteet ja erilliset React Hook Formin kenttätunnisteet.
- `src/features/cv/CvHistoryPreview.tsx`: historiaosioiden tekstipohjainen esitys, kuukausien muotoilu ja tyhjien merkintöjen suodatus.
- `src/features/cv/CvAdditionalFields.tsx`: viiden muun osion tiiviit, dynaamiset kentät, suosittelijoiden näyttötapa ja saavutettavat virheviestit. Jokainen lista käyttää `useFieldArray`-toimintoa samassa yhteisessä lomaketilassa.
- `src/features/cv/CvAdditionalPreview.tsx`: osaamisen, taitotasojen, pätevyyksien ja suosittelijoiden tekstipohjainen esikatselu.
- `src/features/cv/CvPreview.tsx`: yksipalstainen esikatselu ja pelkästään näkymässä käytettävät esimerkit.
- `src/styles.css`: responsiivinen ulkoasu ja näkyvä näppäimistökohdistus.
- `src/App.test.tsx`, `src/features/cv/CvHistory.test.tsx`, `src/features/cv/CvAdditional.test.tsx`, `src/features/cv/cv-model.test.ts`: käyttöliittymän, dynaamisten osioiden ja lähtötietojen testit.
- `src/test/setup.ts`, `vite.config.ts`: React Testing Libraryn siivous, jest-dom-tarkistukset ja Vitest-asetukset.

React ja React DOM toteuttavat käyttöliittymän. `react-hook-form` hallitsee lomaketilaa ja kenttien seurantaa, `zod` määrittelee keskitetyn tietomallin ja validoinnin, ja `@hookform/resolvers` yhdistää nämä. Vitest, jsdom ja React Testing Library apukirjastoineen ovat kehitysriippuvuuksia.

Testit varmistavat keskeiset otsikot ja tietosuojatiedon, perustietojen välittömän päivittymisen esikatseluun, esimerkkien erillisyyden käyttäjätiedoista, validointiviestit sekä kelvolliset ja itsenäiset tyhjät lähtöarvot. Historiaosioiden testit kattavat lisäämisen, useat merkinnät, poistamisen, jatkuvat työt ja opinnot, kuukausien muotoilun, tehtäväluettelot, tyhjien osioiden piilottamisen, osioiden järjestyksen ja kenttien saavutettavat nimet sekä yksilölliset tunnisteet. jsdom-testit eivät arvioi selaimen visuaalista asettelua tai todellisten ATS-järjestelmien toimintaa.

Uusien osioiden testit kattavat jokaisen listan lisäämisen ja poistamisen, jäljelle jäävän merkinnän muokkaamisen, tyhjien merkintöjen piilottamisen, kaikki kieli- ja digitaitotasot, suosittelijoiden kolme näyttötapaa, sähköpostin ja suoritusvuoden validoinnin sekä kaikkien osioiden järjestyksen.

Sovellus ei tarvitse ympäristömuuttujia tai API-avaimia. Älä lisää salaisuuksia selaimelle toimitettavaan koodiin tai `VITE_`-muuttujiin. Mahdolliset myöhemmät salaisuudet pidetään paikallisessa `.env`-tiedostossa ja muuttujat dokumentoidaan `.env.example`-tiedostoon ilman oikeita arvoja.
