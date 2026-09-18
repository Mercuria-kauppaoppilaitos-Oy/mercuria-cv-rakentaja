# Mercuria CV

Suomenkielinen selainpohjainen CV-rakentaja, joka käyttää Reactia, TypeScriptiä ja Viteä. Perustietojen, esittelyn, työkokemusten, koulutusten, osaamisen, kielten, pätevyyksien ja suosittelijoiden lisäksi voit valita CV:n korostusvärin, lisätä vapaaehtoisen valokuvan ja ladata CV:n tekstipohjaisena PDF:nä.

## Käynnistys ja komennot

Tarvitset Node.js 24:n tai uudemman ja npm:n. Komennot toimivat Windowsin VS Codessa ja Command Promptissa. PowerShellissä voi käyttää `npm.cmd`-komentoa.

```cmd
npm install
npm run dev
```

| Komento | Toiminto |
| --- | --- |
| `npm run dev` | Paikallinen kehityspalvelin. |
| `npm test` | Vitest-yksikkö-, integraatio-, HTML-rakenne-, saavutettavuus- ja oikean PDF:n tekstinpoimintatestit. |
| `npm run test:watch` | Jatkuva testaus muokkauksen aikana. |
| `npm run build` | TypeScript-tarkistus ja tuotantokoonti dist-kansioon. |
| `npm run preview` | Tuotantokoonnin paikallinen tarkastelu. |
| `npm run test:e2e` | Playwrightin Chromium-selaintestit. |
| `npm run test:e2e:ui` | Playwrightin interaktiivinen testikäyttöliittymä. |

Playwrightin selain asennetaan tarvittaessa:

```cmd
npx playwright install chromium
npm run test:e2e
```

Vaihtoehtoisesti voi käyttää asennettua Chromium-pohjaista Chromea. Tässä ympäristössä selaintestit ajettiin seuraavasti:

```cmd
set "PLAYWRIGHT_CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run test:e2e
```

PowerShellissä vastaava asetus on `$env:PLAYWRIGHT_CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'`. Tämä ei ole salaisuus. Testitulokset ja epäonnistuneiden ajokertojen jäljet jäävät versionhallinnan ulkopuoliseen test-results-kansioon. Testit käyttävät vain keinotekoista CV-dataa ja omaa pientä testikuvaa.

## Vaiheet ja yhteinen lomaketila

Vaiheet ovat Perustiedot, Esittely, Työkokemus, Koulutus, Osaaminen, Lisäosiot ja Viimeistele. Osaaminen sisältää yhden yleisen taitolistan sekä kielitaidon. Ohjelmistot ja järjestelmät lisätään samaan Osaaminen-listaan. Lisäosiot sisältää kortit, pätevyydet, muun koulutuksen ja suosittelijat. Viimeistele sisältää värivalinnan, tallennusasetuksen, tyhjennyksen, täytettyjen osioiden yhteenvedon ja PDF-latauksen.

Yksi React Hook Formin useForm-instanssi hallitsee CV-dataa. shouldUnregister on false, joten ehdollisesti näkyvät kentät ja kaikki useFieldArray-listat säilyvät vaiheiden välillä. Käyttöliittymätila hallitsee vain vaihetta, näkymän näkyvyyttä ja ilmoituksia. Lomakedataa ei kopioida erilliseen muokattavaan tilaan. Tyhjät esimerkkitekstit kuuluvat vain esikatseluun.

Työpöydällä näkyvät vaihevalikko, lomake ja omalla vierityksellä varustettu esikatselu. Keskikokoisella näytöllä esikatselun voi piilottaa. Mobiilissa käytetään nimettyä vaihevalitsinta sekä Lomake/Esikatselu-painikkeita, joiden tila on aria-pressed-attribuutissa. Aktiivinen vaihe merkitään aria-current="step"-attribuutilla, numerolla, lihavoinnilla ja reunuksella. Edellinen ja Seuraava siirtävät vaiheiden välillä ja ovat poissa käytöstä päätepisteissä.

Työkokemukset sopivat myös TET-jaksoon, harjoitteluun ja työssäoppimiseen. Kirjoita tehtävistä 2–4 lyhyttä kokonaislausetta: ne näkyvät yhtenä kappaleena. Vanhat rivit yhdistetään esityksessä lisäämällä vain puuttuva lopetusmerkki; alkuperäinen luonnos säilyy. Kuukaudet näytetään muodossa MM/YYYY. Jatkuvan työn päättymiskuukausi on pois käytöstä, ja jatkuvan työn tai opintojen ajanjakso päättyy nykyhetkeen. Aiemmin annettu päättymiskuukausi säilyy muistissa valinnan poistamista varten.

Osaamismerkinnöissä on yksi tekstikenttä; kielissä Äidinkieli, Erinomainen, Sujuva, Hyvä, Tyydyttävä ja Perusteet. Tasot esitetään tekstinä. Suoritusvuosi hyväksyy tyhjän tai nelinumeroisen arvon. Suosittelijoiden näyttötavat ovat yhteystiedot, saatavilla pyydettäessä ja piilotettu. Pyydä suosittelijalta lupa. Täytetty sähköpostiosoite validoidaan.

## Luonnoksen säilyminen ja poistaminen

Oletuksena luonnos tallentuu sessionStorageen 400 ms viiveellä ja palautuu saman välilehden päivityksessä. pagehide-tapahtuma pyrkii tallentamaan myös ennen viiveen päättymistä. Istuntotallennuksen elinkaari riippuu selaimesta; esimerkiksi suljetun välilehden palautus voi palauttaa myös sen istuntotiedot. Yhteiskäyttöisellä laitteella tyhjennä tiedot ennen poistumista.

Viimeistele-vaiheen Säilytä luonnos tällä laitteella siirtää luonnoksen localStorageen ja poistaa istuntokopion. Asetus säilyy luonnoksen mukana. Valinnan poistaminen poistaa pysyvän kopion heti, säilyttää lomakedatan ja jatkaa istuntotallennusta. Pysyvää tallennusta ei suositella yhteiskäyttöisellä tietokoneella. Tallennustavan käyttöönottoa varten virheelliset kentät on korjattava.

Tallennus käyttää vain avainta mercuria-cv-draft-v1 ja versionumeroitua rakennetta { schemaVersion: 3, persistent, data }. Palautus validoidaan nykyisellä Zod-skeemalla, myös ulkoasu ja kuvan dataosoite. Versioiden 1 ja 2 luonnokset migroidaan säilyttäen muut tiedot, kuva ja korostusväri. Digitaidot yhdistetään Osaamiseen; nimeltään samat merkinnät yhdistetään kirjainkoosta ja ympäröivistä välilyönneistä riippumatta. Vanha osaamistaso säilyy näkyvänä nimen yhteydessä. Version 1 vanhat kohdistusarvot poistuvat. Virheellinen tai tuntemattoman version luonnos palauttaa turvallisesti tyhjän oletustilan ja ilmoituksen. Viimeisin kelvollinen lomakedata tallennetaan; keskeneräiset virheelliset kentät eivät korvaa aiempaa kelvollista luonnosta.

Tallennustilan loppuminen tai selaimen estämä tallennus ei kaada sovellusta eikä poista avoimen lomakkeen tietoja. Virheilmoitus ehdottaa kuvan poistamista tai pysyvän tallennuksen poistamista käytöstä. Selainluonnos ei korvaa ladattua PDF-tiedostoa tai varmuuskopiota.

Tyhjennä kaikki tiedot avaa vahvistusdialogin. Peruuttaminen ja Escape säilyttävät tiedot ja palauttavat fokuksen avaavaan painikkeeseen. Fokus pysyy dialogin sisällä ja taustatoiminnot ovat inert. Vahvistus poistaa tämän sovelluksen luonnokset molemmista tallennuksista, nollaa lomakkeen, kuvan ja värin, palauttaa ensimmäisen vaiheen sekä näyttää statusviestin. Tyhjä luonnos ei synny uudelleen ennen seuraavaa muokkausta. Jos selain estää poistamisen, siitä ilmoitetaan erikseen.

## Valokuva ja värivalinta

Kuva on vapaaehtoinen eikä sitä tarvita ATS-järjestelmiä varten. Alkuperäinen JPEG-, PNG- tai WebP-tiedosto saa olla enintään 5 Mt (5 × 1024 × 1024 tavua). Tarkistukset sisältävät MIME-tyypin, tiedoston tunnisteen, koon ja todellisen purkamisen kuvaksi. Rikkinäinen tai väärä kuva saa ymmärrettävän, kenttään kytketyn virheviestin.

Tiedoston valinta avaa saavutettavan “Rajaa valokuva” -dialogin. Alkuperäistä kuvaa siirretään hiirellä, kosketuksella tai nuolinäppäimillä pyöreän maskin sisällä. Ainoa säätöliuku on Zoomaus (1–3). Sarkain siirtää fokuksen kuvaan; Shift + nuolinäppäin mahdollistaa tarkan siirron. Natiivi modaalinen dialogi pitää fokuksen sisällä, estää taustatoiminnot ja lukitsee sivun vierityksen. Peruuta ja Escape säilyttävät aiemman kuvan ja palauttavat fokuksen valintapainikkeeseen.

Vasta Käytä kuvaa leikkaa alkuperäisestä kuvasta editorin croppedAreaPixels-alueen, pienentää neliön enintään kokoon 512 × 512 px ja pakkaa JPEG-muotoon enintään 400 KiB. Läpinäkyvyys täytetään valkoisella ja metatiedot poistuvat canvas-uudelleenrenderöinnissä. Selaimen kuvapurku huomioi EXIF-orientaation. Bitmap ja dialogin alkuperäistä kuvaa varten luotu object URL vapautetaan käytön jälkeen. Luonnokseen tallennetaan vain valmis kuva, ei alkuperäistä tiedostoa.

Kuvaa voi vaihtaa ja poistaa. CV:ssä valmis kuva on pyöreä, 24 mm täysikokoisella A4-arkilla, nimen vasemmalla puolella, object-fit: cover ja object-position: center -asetuksilla sekä tyhjällä alt-tekstillä. Lomake-esikatselun kuvalla on ymmärrettävä alt-teksti. Vanhoja vaaka- ja pystykohdistussäätimiä ei enää ole.

Oletuskorostusväri #E9E1D8 määritellään keskitetysti. Värivalitsin ja HEX-kenttä ovat synkronoituja. Hyväksytty muoto on #RRGGBB. Virheellinen teksti saa saavutettavan virheen, ja esikatselu käyttää silloin turvallista beigeä. Väri vaikuttaa vain CV:n otsakealueeseen, profiilin hienovaraiseen taustaan ja koristeisiin. Ylätunnisteen musta tai valkoinen tekstiväri valitaan todellisen suhteellisen luminanssin ja kontrastisuhteen perusteella; parempi vaihtoehto saavuttaa vähintään 4.5:1-kontrastin. Vaaleat sävyt muodostetaan TypeScriptissä HEX-arvoina, ja niitä käytetään myös PDF:ssä.

## Brändi, CV ja tietosuoja

Sovellus käyttää muuttamatonta Mercurian virallista sinistä SVG-logoa, Lato-fonttia ja Mercurian brändivärejä. Logo kuuluu vain käyttöliittymään. CV käyttää Manrope-otsikoita, Source Sans 3 -leipätekstiä ja oletuksena beigeä, valkoista sekä hiilenharmaata. Kaikki fontit toimitetaan paikallisista @fontsource-paketeista. Käyttäjän valitsema väri voi poiketa neutraalista oletuksesta.

CV-arkki on 210 × 297 mm, sisältömarginaalit 18 mm ja leipäteksti oletuksena 11 pt. Korkeus voi kasvaa pitkän sisällön mukana. ResizeObserver ja CSS-zoom sovittavat saman arkin esikatselun leveyteen muuttamatta sen tekstiasettelua. Kulmat ovat suorakulmaiset; selainvarjo poistuu tulostustyyleissä. prefers-reduced-motion poistaa painikkeiden siirtymäanimaatiot.

Tiedot, kuva ja luonnos käsitellään kokonaan selaimessa. Niitä ei lähetetä palvelimelle tai tallenneta URL-osoitteeseen. Sovelluksessa ei ole backendia, kirjautumista, pilvitallennusta, analytiikkaa, seurantaa, evästebanneria tai ulkoisia fonttipyyntöjä. Pysyvä tallennus on käyttäjän valinta. Muut saman sivuston skriptit ja laitteen käyttäjät voivat periaatteessa päästä selaimen tallennuksiin; älä käytä pysyvää tallennusta yhteiskäyttöisellä laitteella. Sovellus ei tulosta henkilötietoja konsoliin.

## Testauksen taso ja rajaukset

HTML-rakenteen ATS-testit ovat käytössä: semanttiset otsikot, luonnollinen DOM-järjestys, tekstiä sisältävät yhteystiedot, tekstiluettelot, tyhjien osioiden piilottaminen, koristeellisen valokuvan tyhjä alt, logon puuttuminen CV:stä ja canvas-/table-renderöinnin puuttuminen. Värin ja kuvan lisääminen eivät muuta osioiden järjestystä. Nimen ja kuvan yhteinen ylätunniste ei tee dokumentin sisällöstä kaksipalstaista.

src/test/cv-fixture.ts sisältää pitkän keinotekoisen CV:n ä-, ö- ja å-merkeillä, pitkällä nimellä, useilla työkokemuksilla ja koulutuksilla, luetteloilla, linkeillä, pitkällä profiililla, kappaleiksi yhdistettävillä vanhoilla tehtäväriveillä ja kaikilla valinnaisilla osioilla monisivuisen PDF:n tekstinpoimintatestausta varten.

Axe-core tarkistaa tärkeät näkymät Vitestissä. jsdom ei mittaa värikontrastia tai asettelua, joten niitä tarkistetaan erikseen Chromiumin axe-ajossa ja kontrastifunktioiden yksikkötesteissä. Playwright tarkistaa täyttämisen, värin ja kuvan, sivun päivityksen, luonnoksen palautuksen, tallennustavat, poistamisen, dialogin näppäimistökäytön, 390 px mobiilin, 320 px vaakavierityksen ja 200 % zoomia vastaavan 720 CSS-pikselin asettelun. Automaattiset tarkistukset eivät korvaa kaikkia ruudunlukijan ja selainzoomauksen käsintarkistuksia.

PDF:n ATS-tarkistukset ajetaan aina osana npm test -komentoa. Testit generoivat oikean PDF:n ja lukevat kaikkien sivujen tekstin PDF.js:llä: sisältö, ääkköset, osioiden ja merkintöjen järjestys, tyhjien osioiden puuttuminen, A4-mitat, tekstin mahtuminen marginaaleihin, pitkän merkinnän jatkuminen sivulta toiselle, tyhjien sivujen puuttuminen, kuvaobjekti, linkkiannotaatiot ja metatiedot. Playwright tarkistaa myös oikean selaimessa ladatun PDF:n tekstin ja kuvaobjektin, tiedostonimen, PDF-tunnisteen, konsolivirheiden puuttumisen sekä paikalliset verkkopyynnöt. PDF-koodi ei lataudu ennen latauspainikkeen käyttöä.

Jos pdftotext löytyy PATHista, sama pitkä fixture tarkistetaan lisäksi Popplerin tekstinpoiminnalla. Jos komentoa ei löydy, testi ohitetaan ja ajossa näkyy selkeä OHITETTU-ilmoitus. PDF.js-testit ajetaan silti. PDF-tiedostot, lataukset, kuvatarkistukset ja testitulokset eivät kuulu versionhallintaan. tests/fixtures/generate-photo.mjs tuottaa vain synteettiset PNG- ja JPEG-testikuvat.

DOCX, kirjautuminen, pilvitallennus, tekoäly ja useat pohjat eivät ole vielä käytössä.

## PDF-lataus ja ATS-luettavuus

Viimeistele-vaiheen Lataa CV PDF-muodossa muodostaa tiedoston vasta painettaessa. Painike estää kaksoispainallukset, ilmoittaa generoinnista ja latauksen käynnistymisestä ruudunlukijalle ja sallii uuden yrityksen virheen jälkeen. Virheelliset CV-tiedot on korjattava ennen lataamista. Generointi käyttää painallushetken tietokopiota. Tiedostonimi on puhdistettu Etunimi_Sukunimi_CV.pdf (ääkköset translitteroidaan; tyhjän nimen vaihtoehto on CV.pdf). Latauslinkki poistuu heti ja blob-URL vapautetaan 30 sekunnin kuluttua, jotta selain ehtii aloittaa latauksen.

PDF on valittavaa, kopioitavaa tekstiä ja ATS-luettavaksi suunniteltu. Se muodostetaan @react-pdf/renderer-kirjastolla kokonaan selaimessa. PDF:ää, henkilötietoja tai valokuvaa ei lähetetä palvelimelle. Kirjasto ja fontit toimitetaan sovelluksen mukana samasta lähteestä; ulkopuolisia fonttipalveluita tai API-rajapintoja ei käytetä. PDF-kirjasto on erillisessä dynaamisessa JavaScript-paketissa, joka latautuu vasta painettaessa. Koonti voi huomauttaa tämän erillisen paketin koosta; se ei kuulu sovelluksen aloituspakettiin.

HTML-esikatselu ja PDF jakavat CV-tietomallin, osioiden järjestyksen, päivämäärät, luettelorivit ja tyhjien osioiden tunnistuksen cv-content.ts-moduulissa. PDF käyttää paikallisten Manrope- ja Source Sans 3 -fonttien WOFF-tiedostoja sekä erikseen rekisteröityjä normaaleja ja lihavoituja leikkauksia. Automaattinen tavutus on poistettu. PDF:n otsikoissa ei käytetä kirjainvälistystä, koska tekstinpoimijat voivat lisätä silloin välilyöntejä sanojen sisään. Mahdollinen vanhan tietomallin serif-valinta käyttää PDF:n Times-Roman-fonttia Georgian sijaan.

A4-sivujen marginaalit ovat 18 mm. Ensimmäisen sivun korostettu otsakelohko ja valinnainen pyöreä valokuva vastaavat esikatselun rakennetta. Esittely käyttää vaaleaa korostuspintaa. Osio-otsikot ja merkintöjen ensimmäiset rivit suojataan minPresenceAhead-asetuksilla; pitkät tekstit ja luettelokohdat saavat jakautua sivuille orphan/widow-suojauksella. Henkilön otsakelohkoa ei toisteta eikä sivunumeroita lisätä. Mercurian logoa, esimerkkitekstejä tai käyttöliittymän tekstejä ei tulosteta CV:hen.

Sähköposti ja kelvolliset HTTP/HTTPS-osoitteet ovat klikattavia, ja niiden näkyvä teksti säilyy. PDF:n title ja author tulevat käyttäjän nimestä ja subject on Ansioluettelo. Varsinaiset sisältöosiot etenevät yhdessä palstassa ilman taulukoita tai sivupalkkeja. Testit todentavat teknisen tekstinpoiminnan ja lukujärjestyksen, eivät jokaisen ulkopuolisen ATS-tuotteen omia tulkintasääntöjä. PDF/UA-tunnisteisuutta tai PDF:n täydellistä saavutettavuutta ei vielä luvata. Käyttöliittymän axe-testit eivät ole PDF/UA-validointi.

## Moduulit ja riippuvuudet

- src/App.tsx: yksi useForm, vaihe- ja näkymätila sekä toimintojen kokoaminen.
- src/features/cv/cv-model.ts: keskitetty Zod-skeema, tyypit ja lähtöarvot.
- cv-content ja CvContentPreview: yhteinen sisältöprojektio sekä sen HTML-renderöinti.
- src/features/cv/pdf/: PDF-dokumentti, fontit, dynaaminen generointi, turvallinen tiedostonimi ja latauspainike.
- CvForm, CvHistoryFields ja CvAdditionalFields: vaiheittainen lomake ja useFieldArray-listat.
- CvAppearanceControls, CvPhotoUpload ja CvDraftControls: ulkoasun ja luonnoksen käyttöliittymä.
- color-utils, image-utils, draft-storage ja useDraftStorage: värilaskenta, kuvan turvallinen käsittely ja versionoitu tallennus.
- CvPhotoCropDialog: alkuperäisen kuvan visuaalinen rajaus ja vahvistus; React 19:n JSX-tyyppiyhteensopivuus on src/react-easy-crop-compat.d.ts-tiedostossa.
- ClearDraftDialog: vahvistus ja näppäimistökohdistuksen hallinta.
- CvPreview, CvHeader, CvPhoto ja CvSheet: sisältö, valokuva, A4-geometria ja reaaliaikainen esikatselu.
- tests/e2e, playwright.config.ts ja tests/fixtures: selaintestit ja pieni keinotekoinen testikuva.

React Hook Form, Zod ja resolvers toteuttavat lomaketilan ja validoinnin; paikalliset fonttipaketit toimittavat typografian. react-easy-crop toteuttaa visuaalisen rajauksen hiiri-, kosketus- ja näppäimistötuella. Lopullinen kuvankäsittely ja tallennus käyttävät selaimen omia rajapintoja. @react-pdf/renderer on tuotantoriippuvuus oikeaa tekstipohjaista PDF:ää varten. buffer on rajattu selaintuki @react-pdf/layout-kirjaston kuvankäsittelylle, joka käyttää globaalia Buffer-tarkistusta; myös se ladataan vain PDF-paketin mukana. pdfjs-dist on kehitysriippuvuus valmiiden PDF-tiedostojen tarkistamiseen. Playwright ja axe-core ovat kehitysriippuvuuksia selain- ja saavutettavuustestaukseen. TypeScriptin skipLibCheck ohittaa riippuvuuksien keskenään yhteensopimattomat ilmoitustiedostot; sovelluksen oma koodi tarkistetaan edelleen tiukasti.

Sovellus ei tarvitse API-avaimia. Älä laita salaisuuksia selaimelle toimitettavaan koodiin tai VITE_-muuttujiin. Mahdolliset salaisuudet pidetään paikallisessa .env-tiedostossa ja muuttujat dokumentoidaan .env.example-tiedostoon ilman oikeita arvoja.

## Tiivis otsake ja paikallinen ilmoitusvertailu

HTML ja PDF jakavat cv-layout.ts-mitoituksen: otsake on tavallisesti 38 mm valokuvalla ja 31 mm ilman valokuvaa, kuva 24 mm, nimi 20 pt ja ammatillinen otsikko 10 pt. Yhteystiedot seuraavat 4 mm välin jälkeen. Pitkä nimi tai otsikko kasvattaa aluetta; tekstiä ei piiloteta tai katkaista. PDF-viennin Sisällytä valokuva PDF:ään on oletuksena valittu, kun kuva on olemassa. Valinta koskee vain kyseisen Viimeistele-näkymän vientiä ja nollautuu näkymästä poistuttaessa; kuva säilyy lomakkeessa ja luonnoksessa. Kuvallinen ja kuvaton PDF sisältävät saman tekstin samassa järjestyksessä.

Viimeistele sisältää yleisen ATS-tarkistuslistan ja Vertaa CV:tä työpaikkailmoitukseen -toiminnon. Ilmoitus on vain komponentin muistissa: sitä ei lähetetä verkkoon, tallenneta sessionStorageen/localStorageen, luonnokseen tai PDF:ään. Ilmoitus ja analyysi poistuvat vaiheesta poistuttaessa. Muokkausvihje säilyy vain käyttöliittymässä. Vahvistettu lisäys sen sijaan kuuluu näkyvään CV:hen ja tavalliseen luonnokseen.

Vertailu on paikallinen heuristiikka, ei tekoäly tai ulkopuolisen ATS-järjestelmän testi. Se tunnistaa vaatimusten ja toiveiden vihjeet, rajatun käsitteistön, tunnetut synonyymit ja erikseen luetellut taivutusmuodot. Suomen sanoille ei tehdä aggressiivista katkaisua. Tuntemattomat monisanaiset koulutus-, kokemus- ja roolivaatimukset jäävät käyttäjän tarkistettaviksi. Merkitystä, kokemuksen kestoa, negatiivisia asiayhteyksiä tai kaikkia tekstimuotoja ei voida tunnistaa täydellisesti. Ryhmät ovat Löytyy CV:stä, Tarkista tai täydennä ja Ei vielä löydy CV:stä; puuttuva maininta ei osoita puuttuvaa osaamista. Pisteitä, hyväksyntä-/hylkäysarvioita tai ATS-takuuta ei anneta. Työnantajan tai oppilaitoksen nimi ei kelpaa osaamistodisteeksi.

Ehdotettu tunnettu taito lisätään vasta erillisen Vahvistan, että tämä vastaa omaa osaamistani tai kokemustani -valinnan jälkeen. Lisäys liitetään olemassa olevaan lomakelistaan eikä korvaa tekstiä. Epäselvät vaatimukset ja puuttuvat kokemusesimerkit ohjaavat oikeaan muokkausvaiheeseen. Käyttäjän tulee kertoa missä taitoa on käyttänyt: irrallista avainsanaluetteloa ei suositella eikä PDF:ään lisätä näkymättömiä avainsanoja.

Yksikkötestit kattavat normalisoinnin, tunnetut synonyymit, sananrajat, vaatimusten/toiveiden eron, kielteiset ja epävarmat maininnat, pitkän/tyhjän ilmoituksen ja tarkistuslistan. Komponenttitestit tarkistavat vahvistuksen, näkyvän lisäyksen, fokuksen, muokkausohjauksen ja tallennusten yksityisyyden. Selaintesti täyttää taidon, analysoi ilmoituksen, vahvistaa uuden taidon, palaa muokkauksesta ja lukee ladatun PDF:n PDF.js:llä: vain hyväksytyt CV-tiedot ovat mukana. ATS-tuloksille tehdään Chromiumin axe-tarkistus ja 320/720 CSS-pikselin asettelutarkistus. PDF.js-testit tarkistavat myös työkokemus- ja koulutuslohkojen tehtävä–organisaatio–ajankohta-järjestyksen sekä viennin valokuvavalinnan ja datan muuttumattomuuden. Valinnainen pdftotext-testi säilyy.

Tekninen tekstinpoiminta on todettu näillä testeillä. Kaikkien kaupallisten ATS-tuotteiden yhteensopivuutta ei voida taata: myös [Greenhousen oma dokumentaatio](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse) kuvaa jäsennyksen rajoituksia. Kuvaton, yksipalstainen tekstipohjainen vienti on tarjolla sähköiseen hakemukseen. Tähän viimeistelyyn ei lisätty tuotantoriippuvuuksia.

Käyttäjä vastaa CV:n tietojen paikkansapitävyydestä. Ehdotus ei tarkoita, että käyttäjällä olisi kyseinen taito tai pätevyys. Ilmoituksen enimmäispituus on 100 000 merkkiä ja tulosten enimmäismäärä 100 vaatimuskohtaa; rajojen ylitys näyttää virheen ja pyytää rajaamaan tekstiä. Tekstiä ei katkaista hiljaisesti.

## Sisällön tiiviimpi taitto ja sivutus

cv-layout.ts sisältää HTML:n ja PDF:n yhteiset sisältövälit: osioiden väli 5 mm (ensimmäisellä 4 mm), otsikon ja sisällön väli 2 mm, koristeviivan väli 1,5 mm, esittelyn pystypadding 3 mm ja merkintöjen väli 4 mm. Leipäteksti säilyy 11 pisteessä ja sivumarginaalit 18 millimetrissä.

Työkokemuksen tehtävät ovat yhtenä kappaleena, ilman generoituja bullet-merkkejä. cv-content.ts yhdistää vanhojen luonnosten rivit vain esitysvaiheessa: sanat ja lyhenteet säilyvät, puuttuva lopetusmerkki täydennetään pisteellä ja rivien alun listamerkit poistetaan. Sovellus ei keksi kokonaisia lauseita irrallisista tehtävänimistä eikä kirjoita muotoiltua tekstiä alkuperäisen description-kentän päälle. Kirjoita itse 2–4 lyhyttä lausetta siitä, mitä teit. Työ- ja koulutusmerkintöjen organisaatio, mahdollinen paikkakunta ja ajanjakso ovat samalla rivillä, esimerkiksi Esimerkkikauppa · 09/2026–11/2026. Osaaminen ja kielet näkyvät peräkkäisinä tekstiriveinä ilman luettelosisennystä; jokainen taito säilyy omana tekstikohteenaan.

PDF:n osio-otsikot ja sisältö ovat samassa sivutusvirrassa. Kokonaisia osioita tai ensimmäisiä listakohtia ei lukita wrap=false-asetuksella. Otsikon minPresenceAhead varaa vain ensimmäisen tekstirivin tilan marginaaleineen; merkintöjen alussa suojataan nimike ja metadata, esittelyssä kaksi orporiviä sekä laatikon padding. Pitkät kappaleet säilyttävät kahden leski-/orporivin suojauksen ja pitkät listat saavat jatkua sivulta toiselle.

Projektista ei löytynyt valmista Olivia Osaaja -fixtureä. src/test/cv-fixture.ts sisältää nyt synteettisen lyhyen Olivia-fixturen: kaksi työkokemusta, yksi koulutus, viisi yhdistettyä taitoa, kaksi kieltä ja hygieniapassi. Tämä testisisältö muodosti ennen muutosta kaksi sivua sekä kuvalla että ilman; korjauksen jälkeen molemmat muodostavat yhden sivun. Pitkä olemassa oleva fixture muuttui neljästä kolmeen sivuun. Sivumäärät on mitattu oikeista PDF-tiedostoista PDF.js:llä. Tämä ei tarkoita, että kaikki CV:t pakotettaisiin yhdelle sivulle.

Regressiotestit tarkistavat kuvallisen ja kuvattoman lyhyen PDF:n yhden sivun, identtisen tekstin, metadatan järjestyksen, kappaleet ja alkuperäisen datan säilymisen. Seitsemän eri sisältöpituutta tarkistaa sivurajoille osuvat otsikot. Erillinen 75 rivin kieliosio varmistaa, että pitkä osio jakautuu sivuille ja ensimmäinen rivi pysyy otsikon kanssa. HTML-testi tarkistaa yhteisen sisältöprojektion ja ATS-vertailun; aiemmat ATS-, saavutettavuus- ja selaintestit säilyvät.


## Yhdistetty osaaminen ja vakaa esikatselu

Aktiivisessa CvData-mallissa ei ole digitalSkills-listaa. Yksi Osaaminen-useFieldArray sisältää ammatilliset taidot, työtehtävät ja ohjelmistot. ATS-vertailu ja vahvistettujen järjestelmätaitojen lisäys käyttävät samaa listaa; Procountor on mukana käsitteistössä. Vanha digitalSkills tunnetaan vain versioiden 1/2 tallennusten lukemisessa. Migraatio ei kirjoita alkuperäistä tallennusta palautuksen yhteydessä; seuraava tavallinen onnistunut tallennus käyttää versiota 3. Ensimmäinen osaamismerkintä ja sen tunniste säilyvät, duplikaatit yhdistetään, ja vanhat osaamistasot säilyvät näkyvässä tekstissä.

Lyhyeseen Olivia-regressiofixtureen kuuluu nyt lopuksi Hygieniapassi – 2026. Ennen listarivin ylimääräisen ylämarginaalin korjausta kuvallinen vienti siirsi tämän otsikon ja yhden rivin toiselle sivulle. Otsikon alapuolinen väli ja ensimmäisen listakohdan ylämarginaali varasivat tilaa päällekkäin. Ensimmäisellä listarivillä ei enää ole erillistä ylämarginaalia, ja minPresenceAhead varaa vain kyseisen rivin tilan. Kuvallinen ja kuvaton vienti mahtuvat yhdelle sivulle; fontti ja sivumarginaalit säilyvät. Pyynnössä mainittu Olivia_Osaaja_CV (3).pdf ei ollut saatavilla liitetiedostoissa; regressio perustuu kuvattuun tilanteeseen ja synteettiseen fixtureen.

Esikatselun palautesilmukka toistettiin Chromiumissa oikeilla vierityspalkeilla ja paneelin korkeudella, joka osui vierityksen rajalle. Vierityspalkin ilmestyminen kavensi mitattua aluetta 17 px, pienensi skaalaa ja korkeutta ja poisti vierityspalkin; leveys ja skaala kasvoivat takaisin. Leveys vuorotteli 452/469 px ja skaala 0,5694/0,5909. scrollbar-gutter: stable varaa tilan pysyvästi ja katkaisee tämän silmukan. Säiliön inline-size-containment erottaa sisällön mittausleveydestä. ResizeObserver tarkkailee vain ulkoista säiliötä; leveys pyöristetään kokonaispikseleihin, skaala rajataan 0,1–1 ja tila muuttuu vain vähintään 0,001 erolla. Observer vapautetaan näkymän poistuessa. A4-arkin fyysiset mitat säilyvät. Korjaus ei käytä viivettä tai animaatioiden poistamista.

Playwright käyttää näkyviä vierityspalkkeja myös headless-ajossa. Vakaustesti sisältää kaikki CV-osiot, kahdeksan työkokemusta, kolme koulutusta, valokuvan ja käyttäjän tekemät muokkaukset. Se mittaa bounding boxin ja skaalan joka ruudunpäivityksellä vähintään kaksi sekuntia sekä työpöydällä vieritysrajalla että mobiilissa ja tarkistaa konsolivirheet. PDF.js tarkistaa migroidut taidot, poistuneen digitaalisen osio-otsikon, tehtävälauseiden välilyönnit sekä yhden sivun hygieniapassitapauksen.
