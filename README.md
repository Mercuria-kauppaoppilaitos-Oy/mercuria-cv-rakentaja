# Mercuria CV

Suomenkielinen, selainpohjainen CV-rakentaja. React-, TypeScript- ja Vite-sovelluksessa muokataan perustietoja, esittelytekstiä, työkokemuksia, koulutuksia, osaamisia, digitaitoja, kielitaitoa, kortteja ja pätevyyksiä sekä suosittelijoita. Kaikki osiot ovat vapaaehtoisia. Täytettyjen sähköpostiosoitteiden ja LinkedIn-osoitteen muoto tarkistetaan kirjoitettaessa.

Työpöydällä sovellus jakautuu kolmeen palstaan: vaihevalikko, aktiivisen vaiheen lomake ja heti päivittyvä CV-esikatselu. Esikatselu muistuttaa valkoista A4-sivua; pitkä sisältö kasvattaa sivua. Yksipalstainen, tekstipohjainen rakenne tukee ATS-luettavuutta. Harmaat esimerkkitekstit ovat vain näkymän apuna, eivät käyttäjätietoja.

## Vaiheittainen käyttöliittymä

Vaiheet ovat **Perustiedot**, **Esittely**, **Työkokemus**, **Koulutus**, **Osaaminen**, **Lisäosiot** ja **Viimeistele**. Perustietoihin kuuluvat nimi, ammatillinen otsikko ja yhteystiedot. Osaaminen-vaihe sisältää myös digitaidot ja kielitaidon; Lisäosiot sisältää kortit, pätevyydet, muun koulutuksen ja suosittelijat.

Vaihetta voi vaihtaa valikosta tai **Edellinen**- ja **Seuraava**-painikkeilla. Aktiivinen vaihe merkitään `aria-current="step"`-attribuutilla, reunuksella, lihavoinnilla ja numeromerkillä. Vaihdettaessa kohdistus siirtyy vaiheen otsikkoon. Ensimmäisessä vaiheessa Edellinen ja viimeisessä Seuraava ovat poissa käytöstä. Viimeistele näyttää täytettyjen osioiden yhteenvedon ja mahdolliset korjattavat validointivirheet. PDF-lataus lisätään seuraavassa vaiheessa; tässä versiossa ei ole latauspainiketta.

Sovelluksessa on yksi `useForm`-instanssi ja `shouldUnregister: false`. Vaiheet renderöidään ehdollisesti, mutta tavalliset kentät, validointivirheet ja kaikki `useFieldArray`-listat säilyvät vaihetta vaihdettaessa. Aktiivinen vaihe ja esikatselun näkyvyys ovat käyttöliittymätilaa, eivät erillisiä CV-tietojen kopioita. Esikatselu käyttää aina samaa lomakedataa.

Vähintään 1280 px leveydessä sivupalkki on 250 px, lomakepalsta vähintään 520 px ja esikatselupalsta noin 420–520 px. Palstat hyödyntävät näkymän korkeuden, ja lomakkeella sekä esikatselulla on oma vieritys. Leveyksillä 768–1279 px navigaatio on tiiviimpi ja esikatselun voi piilottaa tai näyttää. Mobiilissa käytetään nimettyä vaihevalitsinta sekä **Lomake / Esikatselu** -painikkeita, joiden tila ilmoitetaan `aria-pressed`-attribuutilla. Piilotettu palsta poistuu myös saavutettavuuspuusta. Yksipalstainen mobiiliasettelu ja joustavat kentät on suunniteltu myös 320 px leveydelle.

Mercurian värit määritellään CSS-muuttujilla. Sininen on pääväri ja fuksia pienissä korostuksissa. Lato-fontin 400- ja 700-leikkaukset toimitetaan paikallisesti `@fontsource/lato`-paketista, joten fontteja ei ladata Google Fontsista tai muista ulkoisista palveluista. Varsinainen CV säilyy yksipalstaisena tekstidokumenttina nykyisine fonttiasetuksineen.

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

Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle. Sovellus ei sisällä backendia, analytiikkaa, ulkoisista palveluista ladattavia fontteja tai käyttäjätietoja lähettäviä verkkokutsuja. Tiedot ovat vain avoimen sivun muistissa; sivun uudelleenlataus tai sulkeminen poistaa ne. Selaimen oma automaattinen täyttö voi ehdottaa tietoja sen asetusten mukaan.

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

- `src/App.tsx`: kolmipalstainen sivurakenne, yksi yhteinen lomaketila sekä aktiivisen vaiheen ja esikatselun näkyvyyden käyttöliittymätila.
- `src/features/cv/cv-steps.ts`, `CvStepNavigation.tsx`: vaiheiden järjestys, saavutettava vaihevalikko ja mobiilin vaihevalitsin.
- `src/features/cv/CvFinish.tsx`: täytettyjen osioiden yhteenveto ja validointivirheiden tarkistus.
- `src/hooks/useMediaQuery.ts`: responsiivisten vaihtajien ja piilotettujen palstojen tilan seuranta.
- `src/features/cv/cv-model.ts`: Zod-skeema, siitä johdetut TypeScript-tyypit, tyhjät lähtöarvot, taitotasot ja suosittelijoiden näyttötapa. Digitaidot ja kielet käyttävät rajattua `proficiency`-tasoa. Pätevyyksien `issuedDate` sisältää suoritusvuoden ja `expiryDate` vapaamuotoisen voimassaoloajan tai lisätiedon. Työkokemuksen ja koulutuksen kuukaudet tallentuvat muotoon `YYYY-MM`.
- `src/features/cv/CvForm.tsx`: aktiivisen vaiheen lomake, saavutettavasti nimetyt kentät, kenttiin kytketyt virheviestit ja Edellinen/Seuraava-painikkeet. Historia- ja lisäosiokomponentit uudelleenkäytetään.
- `src/features/cv/CvHistoryFields.tsx`: työkokemuksen ja koulutuksen dynaamiset kentät. Molemmat käyttävät `useFieldArray`-toimintoa nykyisessä yhteisessä lomaketilassa. Merkinnöillä on omat tietomallin tunnisteet ja erilliset React Hook Formin kenttätunnisteet.
- `src/features/cv/CvHistoryPreview.tsx`: historiaosioiden tekstipohjainen esitys, kuukausien muotoilu ja tyhjien merkintöjen suodatus.
- `src/features/cv/CvAdditionalFields.tsx`: viiden muun osion tiiviit, dynaamiset kentät, suosittelijoiden näyttötapa ja saavutettavat virheviestit. Jokainen lista käyttää `useFieldArray`-toimintoa samassa yhteisessä lomaketilassa.
- `src/features/cv/CvAdditionalPreview.tsx`: osaamisen, taitotasojen, pätevyyksien ja suosittelijoiden tekstipohjainen esikatselu.
- `src/features/cv/CvPreview.tsx`: yksipalstainen esikatselu ja pelkästään näkymässä käytettävät esimerkit.
- `src/styles.css`: responsiivinen ulkoasu ja näkyvä näppäimistökohdistus.
- `src/App.test.tsx`, `src/features/cv/CvHistory.test.tsx`, `src/features/cv/CvAdditional.test.tsx`, `src/features/cv/cv-model.test.ts`: käyttöliittymän, dynaamisten osioiden ja lähtötietojen testit.
- `src/test/setup.ts`, `vite.config.ts`: React Testing Libraryn siivous, jest-dom-tarkistukset ja Vitest-asetukset.

React ja React DOM toteuttavat käyttöliittymän. `react-hook-form` hallitsee lomaketilaa ja kenttien seurantaa, `zod` määrittelee keskitetyn tietomallin ja validoinnin, ja `@hookform/resolvers` yhdistää nämä. Vitest, jsdom ja React Testing Library apukirjastoineen ovat kehitysriippuvuuksia.

`@fontsource/lato` on tuotantoriippuvuus paikallisten fonttitiedostojen toimittamista varten. `src/main.tsx` tuo fonttien latin- ja latin-ext-osajoukot sovellukseen.

Testit varmistavat keskeiset otsikot ja tietosuojatiedon, perustietojen välittömän päivittymisen esikatseluun, esimerkkien erillisyyden käyttäjätiedoista, validointiviestit sekä kelvolliset ja itsenäiset tyhjät lähtöarvot. Historiaosioiden testit kattavat lisäämisen, useat merkinnät, poistamisen, jatkuvat työt ja opinnot, kuukausien muotoilun, tehtäväluettelot, tyhjien osioiden piilottamisen, osioiden järjestyksen ja kenttien saavutettavat nimet sekä yksilölliset tunnisteet. jsdom-testit eivät arvioi selaimen visuaalista asettelua tai todellisten ATS-järjestelmien toimintaa.

Uusien osioiden testit kattavat jokaisen listan lisäämisen ja poistamisen, jäljelle jäävän merkinnän muokkaamisen, tyhjien merkintöjen piilottamisen, kaikki kieli- ja digitaitotasot, suosittelijoiden kolme näyttötapaa, sähköpostin ja suoritusvuoden validoinnin sekä kaikkien osioiden järjestyksen.

`src/features/cv/CvSteps.test.tsx` tarkistaa aloitusvaiheen, valikon ja Edellinen/Seuraava-painikkeet, `aria-current`-tilan, tavallisten kenttien ja kaikkien seitsemän listan säilymisen vaiheiden välillä, esikatselun päivittymisen, säilyvän validoinnin, mobiilivaihtajan semantiikan ja keskikokoisen näytön esikatselun piilottamisen. Aiemmat toiminnallisuustestit avaavat oikean vaiheen `src/test/navigation.ts`-apufunktioilla ja säilyttävät alkuperäiset tarkistuksensa. Responsiivisten vaihtajien testit käyttävät simuloitua `matchMedia`-tilaa; jsdom ei tarkista pikseliasettelua.

Uudistuksen asettelu tarkistettiin lisäksi paikallisessa headless-Chromessa leveyksillä 320, 768, 1024, 1280 ja 1440 px. Mittauksessa ei syntynyt vaakasuuntaista sivuvieritystä, ja 320 px leveydessä tarkistettiin kaikki vaiheet lisättyine dynaamisine kenttineen sekä mobiilin esikatselu.

Sovellus ei tarvitse ympäristömuuttujia tai API-avaimia. Älä lisää salaisuuksia selaimelle toimitettavaan koodiin tai `VITE_`-muuttujiin. Mahdolliset myöhemmät salaisuudet pidetään paikallisessa `.env`-tiedostossa ja muuttujat dokumentoidaan `.env.example`-tiedostoon ilman oikeita arvoja.
