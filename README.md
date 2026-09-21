# Mercuria CV

Suomenkielinen selainpohjainen CV-rakentaja, joka käyttää Reactia, TypeScriptiä ja Viteä. Perustietojen, esittelyn, työkokemusten, koulutusten, osaamisen, kielten, pätevyyksien ja suosittelijoiden lisäksi voit valita CV:n korostusvärin, lisätä vapaaehtoisen valokuvan ja ladata CV:n tekstipohjaisena PDF:nä.

## Käynnistys ja komennot

Tarvitset Node.js 24:n tai uudemman ja npm:n. Komennot toimivat Windowsin VS Codessa ja Command Promptissa. PowerShellissä voi käyttää `npm.cmd`-komentoa.

```cmd
npm ci
npm run dev
```

| Komento | Toiminto |
| --- | --- |
| `npm run dev` | Paikallinen kehityspalvelin. |
| `npm run dev:full` | Käyttöliittymä ja vapaaehtoinen AI-rajapinta paikallisesti, ilman Vercel-projektiin linkittämistä. |
| `npm test` | Vitest-yksikkö-, integraatio-, sisältöprojektio-, saavutettavuus- ja oikean PDF:n tekstinpoimintatestit. |
| `npm run test:watch` | Jatkuva testaus muokkauksen aikana. |
| `npm run build` | TypeScript-tarkistus, tuotantokoonti ja palvelinsalaisuuksien merkkien tarkistus dist-kansiosta. |
| `npm run preview` | Tuotantokoonnin paikallinen tarkastelu. |
| `npm run test:production` | Buildin jälkeen paikallinen tuotantotilan HTTP-savutesti: aloitusreitti, resurssit ja käännetty API ilman avainta tai ulkoisia kutsuja. |
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

Vaiheet ovat Perustiedot, Esittely, Työkokemus, Koulutus, Osaaminen, Lisäosiot ja Viimeistele. Osaaminen sisältää yhden yleisen taitolistan sekä kielitaidon. Ohjelmistot ja järjestelmät lisätään samaan Osaaminen-listaan. Lisäosiot sisältää kortit, pätevyydet, muun koulutuksen ja suosittelijat. Viimeistele sisältää värivalinnan ja PDF-latauksen. Työpaikkailmoitusvertailu on poistettu myöhempää kehitysvaihetta varten.

Yksi React Hook Formin useForm-instanssi hallitsee CV-dataa. shouldUnregister on false, joten ehdollisesti näkyvät kentät ja kaikki useFieldArray-listat säilyvät vaiheiden välillä. Käyttöliittymätila hallitsee vain vaihetta, näkymän näkyvyyttä ja ilmoituksia. Lomakedataa ei kopioida erilliseen muokattavaan tilaan. Esimerkkitekstejä ei lisätä tyhjään CV:hen tai PDF:ään.

Työpöydällä näkyvät vaihevalikko, lomake ja omalla vierityksellä varustettu esikatselu. Keskikokoisella näytöllä esikatselun voi piilottaa. Mobiilissa käytetään nimettyä vaihevalitsinta sekä Lomake/Esikatselu-painikkeita, joiden tila on aria-pressed-attribuutissa. Aktiivinen vaihe merkitään aria-current="step"-attribuutilla, numerolla, lihavoinnilla ja reunuksella. Edellinen ja Seuraava siirtävät vaiheiden välillä ja ovat poissa käytöstä päätepisteissä.

Työkokemukset sopivat myös TET-jaksoon, harjoitteluun ja työssäoppimiseen. Kirjoita tehtävistä 2–4 lyhyttä kokonaislausetta: ne näkyvät yhtenä kappaleena. Vanhat rivit yhdistetään esityksessä lisäämällä vain puuttuva lopetusmerkki; alkuperäinen luonnos säilyy. Kuukaudet näytetään muodossa MM/YYYY. Jatkuvan työn ja opintojen päättymiskuukausi on pois käytöstä, ja jatkuvan työn tai opintojen ajanjakso päättyy nykyhetkeen. Aiemmin annettu päättymiskuukausi säilyy muistissa valinnan poistamista varten.

Osaamismerkinnöissä on yksi tekstikenttä; kielissä Äidinkieli, Erinomainen, Sujuva, Hyvä, Tyydyttävä ja Perusteet. Tasot esitetään tekstinä. Suoritusvuosi hyväksyy tyhjän tai nelinumeroisen arvon. Suosittelijoiden näyttötavat ovat yhteystiedot, saatavilla pyydettäessä ja piilotettu. Pyydä suosittelijalta lupa. Täytetty sähköpostiosoite validoidaan.

## Luonnoksen säilyminen ja poistaminen

Oletuksena luonnos tallentuu sessionStorageen 400 ms viiveellä ja palautuu saman välilehden päivityksessä. pagehide-tapahtuma pyrkii tallentamaan myös ennen viiveen päättymistä. Istuntotallennuksen elinkaari riippuu selaimesta; esimerkiksi suljetun välilehden palautus voi palauttaa myös sen istuntotiedot. Yhteiskäyttöisellä laitteella poista tarvittaessa sivuston tiedot selaimen asetuksista.

Pysyvä tallennus ja sen valinta on poistettu. Aiempi kelvollinen localStorage-luonnos palautetaan vielä kerran, jos istuntoluonnosta ei ole. Se siirtyy sessionStorageen seuraavan onnistuneen tallennuksen yhteydessä; pysyvä kopio poistetaan vasta tämän jälkeen. Muita selaimen tallennusavaimia ei muuteta.

Tallennus käyttää vain avainta mercuria-cv-draft-v1 ja versionumeroitua rakennetta { schemaVersion: 4, persistent, data }. Palautus validoidaan nykyisellä Zod-skeemalla, myös ulkoasu ja kuvan dataosoite. Versioiden 1 ja 2 luonnokset migroidaan säilyttäen muut tiedot, kuva ja korostusväri. Digitaidot yhdistetään Osaamiseen; nimeltään samat merkinnät yhdistetään kirjainkoosta ja ympäröivistä välilyönneistä riippumatta. Vanha osaamistaso säilyy näkyvänä nimen yhteydessä. Version 1 vanhat kohdistusarvot poistuvat. Virheellinen tai tuntemattoman version luonnos palauttaa turvallisesti tyhjän oletustilan ja ilmoituksen. Viimeisin kelvollinen lomakedata tallennetaan; keskeneräiset virheelliset kentät eivät korvaa aiempaa kelvollista luonnosta.

Tallennustilan loppuminen tai selaimen estämä tallennus ei kaada sovellusta eikä poista avoimen lomakkeen tietoja. Virheilmoitus ehdottaa kuvan poistamista. Selainluonnos ei korvaa ladattua PDF-tiedostoa tai varmuuskopiota.

Aloita alusta on sivupalkin alaosassa ja mobiilissa vaihevalinnan yhteydessä. Painike tyhjentää CV:n heti ilman vahvistusdialogia: kaikki kentät, kuvan, ulkoasun, PDF-valinnan, AI-ehdotusten tilan sekä vanhan esikatselun. Se palaa Perustietoihin ja kirjoittaa tyhjän oletusluonnoksen istuntoon heti, joten sivun päivitys ei palauta poistettuja tietoja. Muut tallennusavaimet säilyvät.

## Valokuva ja värivalinta

Kuva on vapaaehtoinen eikä sitä tarvita ATS-järjestelmiä varten. Alkuperäinen JPEG-, PNG- tai WebP-tiedosto saa olla enintään 5 Mt (5 × 1024 × 1024 tavua). Tarkistukset sisältävät MIME-tyypin, tiedoston tunnisteen, koon ja todellisen purkamisen kuvaksi. Rikkinäinen tai väärä kuva saa ymmärrettävän, kenttään kytketyn virheviestin.

Tiedoston valinta avaa saavutettavan “Rajaa valokuva” -dialogin. Alkuperäistä kuvaa siirretään hiirellä, kosketuksella tai nuolinäppäimillä pyöreän maskin sisällä. Ainoa säätöliuku on Zoomaus (1–3). Sarkain siirtää fokuksen kuvaan; Shift + nuolinäppäin mahdollistaa tarkan siirron. Natiivi modaalinen dialogi pitää fokuksen sisällä, estää taustatoiminnot ja lukitsee sivun vierityksen. Peruuta ja Escape säilyttävät aiemman kuvan ja palauttavat fokuksen valintapainikkeeseen.

Vasta Käytä kuvaa leikkaa alkuperäisestä kuvasta editorin croppedAreaPixels-alueen, pienentää neliön enintään kokoon 512 × 512 px ja pakkaa JPEG-muotoon enintään 400 KiB. Läpinäkyvyys täytetään valkoisella ja metatiedot poistuvat canvas-uudelleenrenderöinnissä. Selaimen kuvapurku huomioi EXIF-orientaation. Bitmap ja dialogin alkuperäistä kuvaa varten luotu object URL vapautetaan käytön jälkeen. Luonnokseen tallennetaan vain valmis kuva, ei alkuperäistä tiedostoa.

Kuvaa voi vaihtaa ja poistaa. CV:ssä valmis kuva on pyöreä ja nimen vasemmalla puolella. Halkaisija on tiheydestä riippuen 24, 22 tai 20 mm. Lomakkeen kuvan esikatselulla on ymmärrettävä alt-teksti. Vanhoja vaaka- ja pystykohdistussäätimiä ei enää ole.

Oletuskorostusväri #E9E1D8 määritellään keskitetysti. Värivalitsin ja HEX-kenttä ovat synkronoituja. Hyväksytty muoto on #RRGGBB. Virheellinen HEX-teksti saa saavutettavan virheen eikä korvaa viimeistä hyväksyttyä väriä. Otsakealue ja Esittely-laatikko käyttävät täsmälleen samaa korostusväriä sekä samaa laskettua mustaa tai valkoista tekstiväriä, myös linkeissä. Yhteinen suhteellisen luminanssin ja kontrastisuhteen laskenta valitsee paremman vaihtoehdon, joka saavuttaa vähintään 4.5:1-kontrastin. Oletusbeigen ja tumman käyttäjävärin regressiot lukevat värit sekä tekstin todellisen PDF:n piirto-operaatioista.

## Brändi, CV ja tietosuoja

Sovellus käyttää muuttamatonta Mercurian virallista sinistä SVG-logoa, Lato-fonttia ja Mercurian brändivärejä. Logo kuuluu vain käyttöliittymään. CV käyttää Manrope-otsikoita, Source Sans 3 -leipätekstiä ja oletuksena beigeä, valkoista sekä hiilenharmaata. Kaikki fontit toimitetaan paikallisista @fontsource-paketeista. Käyttäjän valitsema väri voi poiketa neutraalista oletuksesta.

PDF-sivut ovat A4-kokoisia (210 × 297 mm), sisältömarginaalit 18 mm ja leipäteksti 11 pt. Selaimen PDF-katselin näyttää kaikki sivut vieritettävässä kehyksessä. Erillistä HTML-arkkia, ResizeObserver-mittausta tai CSS-zoomausta ei käytetä. prefers-reduced-motion poistaa painikkeiden siirtymäanimaatiot.

CV:n täyttö, kuva, esikatselu, luonnos ja PDF muodostetaan selaimessa. Vapaaehtoinen AI-jalostus on poikkeus: painikkeesta lähetetään vain valitun Esittely- tai työkokemuskentän teksti ja työkokemuksen mahdollinen tehtävänimike palvelinrajapinnan kautta OpenAI:lle. Koko CV:tä, yhteystietokenttiä, kuvaa tai muiden osioiden sisältöä ei liitetä pyyntöön. Jos käyttäjä itse kirjoittaa henkilötietoja jalostettavaan tekstiin, ne ovat osa lähetettävää tekstiä. Ehdotukset näkyvät tavallisena tekstinä, ja vasta erillinen hyväksyntä lisää ehdotuksen CV:hen ja luonnokseen.

Tietoja ei tallenneta URL-osoitteeseen. Sovelluksessa ei ole kirjautumista, pilvitallennusta, analytiikkaa, seurantaa, evästebanneria tai ulkoisia fonttipyyntöjä. Uudet luonnokset tallentuvat vain sessionStorageen. Muut saman sivuston skriptit ja laitteen käyttäjät voivat periaatteessa päästä selaimen tallennuksiin; poista tarvittaessa sivuston tiedot yhteiskäyttöisen laitteen selaimesta. Sovellus ei lokita jalostettavaa tekstiä, nimikettä, ehdotusta, pyyntörunkoa tai API-avainta.

## Vapaaehtoinen AI-tekstinjalostus paikallisesti

OpenAI API laskutetaan erikseen ChatGPT- ja Codex-tilauksista. ChatGPT-tilaus ei sisällä tämän sovelluksen API-kutsuja; tarkista erillinen API-laskutus ja projektin käyttörajat [OpenAI:n laskutusohjeesta](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform). Luo tarvittaessa palvelinpuolen avain [API keys -sivulla](https://platform.openai.com/api-keys) [virallisen aloitusohjeen](https://developers.openai.com/api/docs/quickstart) mukaisesti. Älä lähetä tai tulosta avainta.

Luo **projektin juureen**, package.json-tiedoston viereen, `.env.local` (UTF-8 ilman BOM-merkkiä). Älä korvaa olemassa olevaa tiedostoa. Lisää omassa editorissasi avain seuraavaan muuttujaan (esimerkin arvo on vain paikkamerkki):

```dotenv
OPENAI_API_KEY=OMA_PALVELINPUOLEN_AVAIN
OPENAI_MODEL=gpt-5.6-luna
```

`src/.env.local` ei ole oikea sijainti Vercelin ympäristömuuttujille. Vercel CLI 59:n Function-ympäristö lukee automaattisesti `.env`-tiedoston; tämän projektin palvelin lataa siksi juuren `.env.local`-tiedoston Node 24:n omalla loadEnvFile-toiminnolla vain paikallisessa Vercel-kehitystilassa. Tuotantotilassa käytettäisiin palvelinympäristöön asetettuja muuttujia. SDK lukee avaimen vain process.env-muuttujasta. Käynnistä kehityspalvelin uudelleen ympäristömuutosten jälkeen. Älä käytä `VITE_`-alkuista avainmuuttujaa. `.env`, `.env.local` ja muut `.env.*`-tiedostot ohitetaan Gitissä, myös alikansioissa; vain avaimeton `.env.example` voidaan versionhallita. Avainta ei saa lisätä Git-repositorioon. Mallivalinta on myös vain palvelimella.

```cmd
npm ci
npm run dev:full
```

Vastaava suora komento on `npx vercel dev --local --listen 127.0.0.1:3000`. Avaa **http://127.0.0.1:3000**. Nykyinen paikallinen Vercel CLI tukee `--local`-tilaa ilman kirjautumista tai projektin linkittämistä. Myös `npx vercel dev` on CLI:n tavallinen käynnistystapa, mutta se voi pyytää kirjautumista ja Vercel-projektin linkitystä; tässä pilotissa käytä `--local`-tilaa. Kehys ja Vite-kehityskomento tunnistetaan automaattisesti, joten vercel.json-tiedostoa ei tarvita. Vercel CLI on tässä vaiheessa vain paikallinen kehitystyökalu. Globaalia asennusta ei tarvita eikä sovellusta ole tämän työn yhteydessä julkaistu.

`npm run dev` toimii edelleen ilman rajapintaa osoitteessa http://localhost:5173. Silloin AI-painike ilmoittaa hallitun virheen ja säilyttää tekstin; CV:n muu käyttö ja PDF toimivat normaalisti. Jos avain puuttuu kokonaisuudesta, rajapinta palauttaa yleisen virheen. Kehitysterminaali kertoo vain ympäristömuuttujan puuttumisesta. Selaimessa ei näytetä avaintietoja tai OpenAI:n teknisiä virheitä.

Kenttään kirjoitetaan tekstiä suoraan; erillistä avainsanakenttää ei ole. Vähintään 10 ja enintään 1500 merkkiä pitkä teksti voidaan jalostaa painikkeesta. Ehdotuspaneeli jättää muut kentät käytettäviksi. Se näyttää alkuperäisen ja ehdotuksen sekä Käytä ehdotusta-, Yritä uudelleen- ja Peruuta-painikkeet. Uusi yritys käyttää samaa alkuperäistä tekstiä. Peruuta ja paneelin Escape palauttavat fokuksen avaavaan painikkeeseen. Työkokemus kohdistetaan pysyvän tunnisteen avulla myös muiden merkintöjen poistamisen jälkeen. Myöhemmin muokattua tekstiä ei ylikirjoiteta.

### Rajapinta ja pilotin rajat

`api/rewrite-text.ts` tarjoaa Node.js Vercel Web Handler -rajapinnan `POST /api/rewrite-text`. Palvelinlogiikka ja suomenkieliset ohjeet ovat `server/`-kansiossa, yhteiset Zod-sopimukset `shared/`-kansiossa. Selain ei tuo palvelinkoodia. Asennettu virallinen `openai`-SDK tarvitaan palvelimen Responses API -kutsuun; asennettu `vercel` on vain kehitysriippuvuus. Uusia riippuvuuksia ei lisätty.

Pyyntö hyväksyy vain `{ textType: "profile" | "workExperience", sourceText, jobTitle? }`. Nimikettä käytetään vain työkokemuksessa, sen raja on 150 merkkiä. Ylimääräiset kentät, virheellinen JSON, väärä sisältötyyppi ja yli 8192 tavun runko hylätään ennen mallikutsua. Myös ilmoittamattoman pituuden runko tarkistetaan lukemisen aikana. Muut metodit hylätään. Selainperäiset eri alkuperän pyynnöt hylätään, eikä rajapinta avaa CORS-oikeuksia.

Jokainen painallus tekee yhden Responses API -kutsun ilman SDK:n automaattisia uudelleenyrityksiä, keskusteluhistoriaa tai työkaluja. Oletus on [gpt-5.6-luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna), matala päättelytaso, enintään 1200 vastaustokenia (sisältää päättelyn), 15 sekunnin aikakatkaisu ja `store: false`. Tuetuille GPT-5/GPT-6/o1/o3/o4-malliperheille käytetään low-tasoa; muiden mallien kanssa päättelyasetus jätetään pois. Vaihtomallin on tuettava Responses API:a ja Structured Outputsia. Rakenteinen `{ suggestion: string }` tarkistetaan lisäksi palvelimella: 10–1000 merkkiä, ei HTML:ää, Markdown-otsikoita, listoja tai ympäröiviä lainausmerkkejä. Vastausten otsakkeet sisältävät no-store-, no-referrer-, nosniff- ja DENY-suojaukset.

Malli voi silti muuttaa merkitystä tai tuottaa virheellistä sisältöä; kieli ja tosiasioiden säilyminen ohjataan palvelimen ohjeilla, eikä niitä voida taata skeemalla. Käyttäjän on tarkistettava ehdotus. `store: false` ei ole lupaus palveluntarjoajan kaikkien lokien puuttumisesta. Pilotissa ei ole käyttäjätunnistusta, jaettua nopeusrajoitusta tai sovelluksen globaalia kustannuskattoa. Selainesto ja alkuperätarkistus eivät korvaa niitä. Verkkoon vietävä suljettukin pilotti tarvitsee palvelimella valvotun käyttöoikeuden, jaetun nopeusrajoituksen ja kustannusrajat; tarkat julkaisuasetukset ovat jäljempänä. Ulkoista tietokantaa tai maksullista lisäpalvelua ei ole lisätty.

### AI-testit ja ensimmäinen oikea savutesti

```cmd
npm test
npx playwright test
npm run build
git diff --check
npm audit --omit=dev
```

Yksikkö- ja käyttöliittymätestit mockaavat SDK:n tai fetchin. Playwright mockaa `/api/rewrite-text`-reitin desktopissa ja mobiilissa ja tarkistaa ehdotusnäkymän axe-corella. Oikeita OpenAI-kutsuja ei tehdä testeissä. Koonti skannaa selaimen dist-tekstitiedostot avainmuuttujan, sk-alkuisten testiavainten, palvelinohjeiden ja SDK:n pääteosoitteen varalta lukematta ympäristötiedostoja tai oikean avaimen arvoa.

Kun `npm run dev:full` on käynnissä, `node scripts/smoke-local-api.mjs` tarkistaa käyttöliittymän ja rajapinnan virhereitit tekemättä mallikutsua. `--missing-key`-lisävalinta on tarkoitettu vain palvelimelle, joka on käynnistetty varmasti ilman avainta.

Ensimmäinen oikea AI-testi tehdään käsin: varmista editorissasi juuren `.env.local`, käynnistä paikallinen kokonaisuus ja avaa http://127.0.0.1:3000. Kirjoita Esittelyyn keinotekoinen teksti, esimerkiksi “Olen liiketoiminnan opiskelija. Opettelen asiakaspalvelua ja Excelin käyttöä.” Paina Jalosta tekoälyllä, tarkista tosiasiat ja varmista, että alkuperäinen säilyy ennen hyväksyntää. Peruuta ensin, kokeile uudelleen ja hyväksy ehdotus; tarkista lomake ja esikatselu. Tee vastaava testi työkokemukselle käyttäen nimikettä “Harjoittelija” ja tekstiä “Avustin asiakkaita ja järjestin tuotteita.” Lataa lopuksi PDF ja tarkista hyväksytty teksti. Kukin jalostuspainallus tekee maksullisen API-kutsun. Älä käytä oikeita henkilötietoja savutestissä.

## Testauksen taso ja rajaukset

Sisältöprojektion testit tarkistavat osioiden järjestyksen, tekstisisällön ja tyhjien osioiden piilottamisen. Lomakkeen komponenttitestit käyttävät PDF-syötteen testikaksoista; varsinainen PDF-esikatselu testataan erikseen aidolla providerilla ja selaimessa. PDF.js lukee todelliset PDF-tavut ja tarkistaa lukujärjestyksen.

src/test/cv-fixture.ts sisältää pitkän keinotekoisen CV:n ä-, ö- ja å-merkeillä, pitkällä nimellä, useilla työkokemuksilla ja koulutuksilla, luetteloilla, linkeillä, pitkällä profiililla, kappaleiksi yhdistettävillä vanhoilla tehtäväriveillä ja kaikilla valinnaisilla osioilla monisivuisen PDF:n tekstinpoimintatestausta varten.

Axe-core tarkistaa tärkeät näkymät Vitestissä. jsdom ei mittaa värikontrastia tai asettelua, joten niitä tarkistetaan erikseen Chromiumin axe-ajossa ja kontrastifunktioiden yksikkötesteissä. Playwright tarkistaa täyttämisen, värin ja kuvan, sivun päivityksen, luonnoksen palautuksen, istuntotallennuksen, Aloita alusta -toiminnon, dialogin näppäimistökäytön, 390 px mobiilin, 320 px vaakavierityksen ja 200 % zoomia vastaavan 720 CSS-pikselin asettelun. Automaattiset tarkistukset eivät korvaa kaikkia ruudunlukijan ja selainzoomauksen käsintarkistuksia.

PDF:n ATS-tarkistukset ajetaan aina osana npm test -komentoa. Testit generoivat oikean PDF:n ja lukevat kaikkien sivujen tekstin PDF.js:llä: sisältö, ääkköset, osioiden ja merkintöjen järjestys, tyhjien osioiden puuttuminen, A4-mitat, tekstin mahtuminen marginaaleihin, pitkän merkinnän jatkuminen sivulta toiselle, tyhjien sivujen puuttuminen, kuvaobjekti, linkkiannotaatiot ja metatiedot. Playwright tarkistaa myös oikean selaimessa ladatun PDF:n tekstin ja kuvaobjektin, tiedostonimen, PDF-tunnisteen, konsolivirheiden puuttumisen sekä paikalliset verkkopyynnöt. PDF-koodi latautuu dynaamisesti ensimmäisen esikatselun muodostuessa.

Jos pdftotext löytyy PATHista, sama pitkä fixture tarkistetaan lisäksi Popplerin tekstinpoiminnalla. Jos komentoa ei löydy, testi ohitetaan ja ajossa näkyy selkeä OHITETTU-ilmoitus. PDF.js-testit ajetaan silti. PDF-tiedostot, lataukset, kuvatarkistukset ja testitulokset eivät kuulu versionhallintaan. tests/fixtures/generate-photo.mjs tuottaa vain synteettiset PNG- ja JPEG-testikuvat.

DOCX, kirjautuminen, pilvitallennus ja useat pohjat eivät ole vielä käytössä.

## PDF-lataus ja ATS-luettavuus

Viimeistele-vaiheen Lataa CV PDF-muodossa käyttää täsmälleen samaa valmista Blobia kuin näkyvä ajantasainen esikatselu. Painallus ei generoi uutta PDF:ää. Painike on estetty heti tietojen muuttuessa ja pysyy estettynä, kunnes uusin PDF on latautunut esikatseluun. Tiedostonimi tulee saman PDF:n tietokopiosta: Etunimi_Sukunimi_CV.pdf (ääkköset translitteroidaan; tyhjän nimen vaihtoehto CV.pdf). Latauslinkki poistuu heti ja sen oma blob-URL vapautetaan 30 sekunnissa.

PDF on valittavaa, kopioitavaa tekstiä ja ATS-luettavaksi suunniteltu. Se muodostetaan @react-pdf/renderer-kirjastolla kokonaan selaimessa. PDF:ää, henkilötietoja tai valokuvaa ei lähetetä palvelimelle. Kirjasto ja fontit toimitetaan sovelluksen mukana samasta lähteestä; ulkopuolisia fonttipalveluita tai API-rajapintoja ei käytetä. PDF-kirjasto on erillisessä dynaamisessa JavaScript-paketissa, joka latautuu ensimmäisen esikatselun generoinnin yhteydessä. Koonti voi huomauttaa tämän erillisen paketin koosta; se ei kuulu sovelluksen aloituspakettiin.

PDF käyttää yhteistä CV-tietomallia sekä cv-content.ts-moduulin osiojärjestystä, päivämääriä, luettelorivejä ja tyhjien osioiden tunnistusta. PDF käyttää paikallisten Manrope- ja Source Sans 3 -fonttien WOFF-tiedostoja sekä erikseen rekisteröityjä normaaleja ja lihavoituja leikkauksia. Automaattinen tavutus on poistettu. PDF:n otsikoissa ei käytetä kirjainvälistystä, koska tekstinpoimijat voivat lisätä silloin välilyöntejä sanojen sisään. Mahdollinen vanhan tietomallin serif-valinta käyttää PDF:n Times-Roman-fonttia Georgian sijaan.

A4-sivujen marginaalit ovat 18 mm. Ensimmäisen sivun korostettu otsakelohko ja valinnainen pyöreä valokuva vastaavat esikatselun rakennetta. Esittely käyttää otsakkeen kanssa samaa korostusväriä ja kontrastiväriä. Osio-otsikot ja merkintöjen ensimmäiset rivit suojataan minPresenceAhead-asetuksilla; pitkät tekstit ja luettelokohdat saavat jakautua sivuille orphan/widow-suojauksella. Henkilön otsakelohkoa ei toisteta eikä sivunumeroita lisätä. Mercurian logoa, esimerkkitekstejä tai käyttöliittymän tekstejä ei tulosteta CV:hen.

Sähköposti ja kelvolliset HTTP/HTTPS-osoitteet ovat klikattavia, ja niiden näkyvä teksti säilyy. PDF:n title ja author tulevat käyttäjän nimestä ja subject on Ansioluettelo. Varsinaiset sisältöosiot etenevät yhdessä palstassa ilman taulukoita tai sivupalkkeja. Testit todentavat teknisen tekstinpoiminnan ja lukujärjestyksen, eivät jokaisen ulkopuolisen ATS-tuotteen omia tulkintasääntöjä. PDF/UA-tunnisteisuutta tai PDF:n täydellistä saavutettavuutta ei vielä luvata. Käyttöliittymän axe-testit eivät ole PDF/UA-validointi.

## Moduulit ja riippuvuudet

- src/App.tsx: yksi useForm, vaihe- ja näkymätila sekä toimintojen kokoaminen.
- src/features/cv/cv-model.ts: keskitetty Zod-skeema, tyypit ja lähtöarvot.
- cv-content: PDF:n yhteinen sisältöprojektio.
- src/features/cv/pdf/: PDF-dokumentti, fontit, dynaaminen generointi, turvallinen tiedostonimi ja latauspainike.
- CvForm, CvHistoryFields ja CvAdditionalFields: vaiheittainen lomake ja useFieldArray-listat.
- CvAppearanceControls ja CvPhotoUpload: ulkoasun ja valokuvan käyttöliittymä.
- MonthPicker: natiivit suomenkieliset kuukausi- ja vuosivalinnat sekä tyhjennys.
- color-utils, image-utils, draft-storage ja useDraftStorage: värilaskenta, kuvan turvallinen käsittely ja versionoitu tallennus.
- CvPhotoCropDialog: alkuperäisen kuvan visuaalinen rajaus ja vahvistus; React 19:n JSX-tyyppiyhteensopivuus on src/react-easy-crop-compat.d.ts-tiedostossa.
- CvPreview, CvPdfProvider ja CvPdfPreview: yksi yhteinen PDF-prosessi, välimuisti ja Blob-URLien elinkaari.
- tests/e2e, playwright.config.ts ja tests/fixtures: selaintestit ja pieni keinotekoinen testikuva.

React Hook Form, Zod ja resolvers toteuttavat lomaketilan ja validoinnin; paikalliset fonttipaketit toimittavat typografian. react-easy-crop toteuttaa visuaalisen rajauksen hiiri-, kosketus- ja näppäimistötuella. Lopullinen kuvankäsittely ja tallennus käyttävät selaimen omia rajapintoja. @react-pdf/renderer on tuotantoriippuvuus oikeaa tekstipohjaista PDF:ää varten. buffer on rajattu selaintuki @react-pdf/layout-kirjaston kuvankäsittelylle, joka käyttää globaalia Buffer-tarkistusta; myös se ladataan vain PDF-paketin mukana. pdfjs-dist on kehitysriippuvuus valmiiden PDF-tiedostojen tarkistamiseen. Playwright ja axe-core ovat kehitysriippuvuuksia selain- ja saavutettavuustestaukseen. TypeScriptin skipLibCheck ohittaa riippuvuuksien keskenään yhteensopimattomat ilmoitustiedostot; sovelluksen oma koodi tarkistetaan edelleen tiukasti.

CV:n täyttö ja PDF-vienti eivät tarvitse API-avaimia. Vapaaehtoinen AI-jalostus tarvitsee palvelimelle OPENAI_API_KEY-muuttujan. Älä laita salaisuuksia selaimelle toimitettavaan koodiin tai VITE_-muuttujiin. Mahdolliset salaisuudet pidetään paikallisessa .env-tiedostossa ja muuttujat dokumentoidaan .env.example-tiedostoon ilman oikeita arvoja.

## Otsake ja valokuva

cv-layout.ts keskittää PDF:n kolme taittotiheyttä. Pitkä nimi tai otsikko kasvattaa otsakealuetta; tekstiä ei piiloteta tai katkaista. Sisällytä valokuva PDF:ään on oletuksena valittu. Valinta vaikuttaa yhteiseen esikatseluun, lataukseen ja tiheyden laskentaan; se säilyy vaiheiden välillä mutta ei tallennu luonnokseen. Alkuperäinen rajattu kuva säilyy luonnoksessa. Kuvallinen ja kuvaton PDF sisältävät saman tekstin samassa järjestyksessä.

Työpaikkailmoitusvertailun käyttöliittymä, tila, tyylit ja käyttämättömät analyysimoduulit on poistettu. Yleinen checkCv ja sen tarvitsemat tekstin normalisointi- ja käsitemoduulit sekä tekniset PDF/ATS-testit säilyvät. Viimeistele-vaiheen regressio tarkistaa poistetun otsikon, kentän ja painikkeen puuttumisen. AI-jalostus säilyy Esittelyssä ja Työkokemuksessa.

## Sisällön tiiviimpi taitto ja sivutus

cv-layout.ts sisältää comfortable-, compact- ja tight-taiton mitat. Kaikissa leipäteksti on 11 pt ja sivumarginaalit 18 mm. Rivivälit ovat 1,6 / 1,4 / 1,3, osiovälit 5 / 3 / 2 mm ja merkintöjen välit 4 / 2 / 1,3 mm. Tiivistys muuttaa välejä, ei käyttäjän sisältöä.

Työkokemuksen tehtävät ovat yhtenä kappaleena, ilman generoituja bullet-merkkejä. cv-content.ts yhdistää vanhojen luonnosten rivit vain esitysvaiheessa: sanat ja lyhenteet säilyvät, puuttuva lopetusmerkki täydennetään pisteellä ja rivien alun listamerkit poistetaan. Sovellus ei keksi kokonaisia lauseita irrallisista tehtävänimistä eikä kirjoita muotoiltua tekstiä alkuperäisen description-kentän päälle. Kirjoita itse 2–4 lyhyttä lausetta siitä, mitä teit. Työ- ja koulutusmerkintöjen organisaatio, mahdollinen paikkakunta ja ajanjakso ovat samalla rivillä, esimerkiksi Esimerkkikauppa · 09/2026–11/2026. Osaaminen ja kielet näkyvät peräkkäisinä tekstiriveinä ilman luettelosisennystä; jokainen taito säilyy omana tekstikohteenaan.

PDF:n osio-otsikot ja sisältö ovat samassa sivutusvirrassa. Kokonaisia osioita tai ensimmäisiä listakohtia ei lukita wrap=false-asetuksella. Jokaisen osio-otsikon sama minPresenceAhead varaa kahden rivin tilan; merkintöjen alussa suojataan nimike ja metadata, esittelyssä kaksi orporiviä sekä laatikon padding. Pitkät kappaleet säilyttävät kahden leski-/orporivin suojauksen ja pitkät listat saavat jatkua sivulta toiselle.

src/test/cv-fixture.ts sisältää synteettisen lyhyen Olivia-fixturen ja pitkän monisivuisen CV:n. PDF.js-regressiot tarkistavat jokaisen taittotiheyden sekä automaattisen valinnan kuvalla ja ilman kuvaa. Lyhyt CV mahtuu turvallisesti yhdelle sivulle; pitkää CV:tä ei pakoteta yhdelle sivulle.

Regressiotestit tarkistavat kuvallisen ja kuvattoman lyhyen PDF:n yhden sivun, identtisen tekstin, metadatan järjestyksen, kappaleet ja alkuperäisen datan säilymisen. Seitsemän eri sisältöpituutta tarkistaa sivurajoille osuvat otsikot. Erillinen 75 rivin kieliosio varmistaa, että pitkä osio jakautuu sivuille ja ensimmäinen rivi pysyy otsikon kanssa. Sisältötestit tarkistavat yhteisen projektion; yleiset ATS-, saavutettavuus- ja PDF-testit säilyvät.


## Yhdistetty osaaminen ja vakaa esikatselu

Aktiivisessa CvData-mallissa ei ole digitalSkills-listaa. Yksi Osaaminen-useFieldArray sisältää ammatilliset taidot, työtehtävät ja ohjelmistot. Vanha digitalSkills tunnetaan vain versioiden 1/2 tallennusten lukemisessa. Migraatio ei kirjoita alkuperäistä tallennusta palautuksen yhteydessä; seuraava tavallinen onnistunut tallennus käyttää versiota 4. Ensimmäinen osaamismerkintä ja sen tunniste säilyvät, duplikaatit yhdistetään, ja vanhat osaamistasot säilyvät näkyvässä tekstissä.

Lyhyt Olivia-fixture sisältää kaikki seitsemän osiotyyppiä sekä ääkköset ja LinkedIn-linkin. Ensimmäisellä listarivillä ei ole erillistä ylämarginaalia. Käyttäjän aiemmassa pyynnössä mainittu Olivia_Osaaja_CV (3).pdf ei ollut liitteissä; regressio käyttää synteettistä testidataa.

PDF-esikatselun kehyksellä on vakaa korkeus eikä PDF:n sisältö määrää paneelin kokoa. Paneelin scrollbar-gutter: stable säilyy. Välivaiheiden tiheyskandidaatteja ei näytetä; vain lopullinen valittu PDF vaihtuu näkyviin.

Playwright tarkistaa esikatselukehyksen mittojen ja Blob-osoitteen vakauden vähintään kahden sekunnin ajan työpöydällä ja mobiilissa. Testit kattavat kaikki osiot, valokuvan, käyttäjän muokkaukset ja konsolivirheiden puuttumisen.

## Käyttöliittymän ja PDF-taiton päivitys

Selaimen otsikko on Mercuria | CV-rakentaja. Yläpalkin palvelulupaus mukautuu pieniin näyttöihin. AI-painikkeiden pitkä ohjeteksti, sivupalkin iskulause, ATS-merkintä ja täytettyjen osioiden yhteenveto on poistettu. AI-ehdotuksen tarkistus, hyväksyntä, uudelleenyritys ja peruutus säilyvät.

Kuukausivalitsin käyttää kahta tavallista select-elementtiä ja tyhjennyspainiketta ilman uusia riippuvuuksia. Kuukaudet ovat suomeksi, molemmilla valinnoilla on saavutettava nimi ja ne toimivat näppäimistöllä. Vuosialue on 1990–kuluva vuosi + 5 uusimmasta vanhimpaan. Yhteinen getMonthYears muodostaa listan ajon aikaisesta vuodesta; palautettu tämän ulkopuolinen vuosi lisätään vaihtoehdoksi muuttamatta tallennettua arvoa. Testit kattavat vuodenvaihteen hallitulla järjestelmäajalla sekä vanhat työ- ja koulutusvuodet. Työpöydällä joustava otsikkotila tasaa alku- ja loppukontrollit; mobiilissa ryhmät pinoutuvat. Kuukausi, vuosi ja tyhjennys ovat yhtä korkeita. Playwright mittaa tasauksen 2 px toleranssilla ja tarkistaa 1440, 1024, 390 sekä 320 px näkymät. Yhteinen React Hook Form -tila ja luonnos käyttävät edelleen YYYY-MM-muotoa. Keskeneräinen valinta ei tallenna virheellistä päivämäärää. Jatkuva työ tai opiskelu poistaa päättymisvalinnat käytöstä säilyttäen aiemman arvon.

PDF:n leipäteksti on aina 11 pt. Vanhan luonnoksen ulkoasukentät säilyvät datassa, mutta PDF:n riviväli ja fonttikoko määräytyvät keskitetystä taittotiheydestä. URL-linkkien ligatuurit on poistettu käytöstä tarkan tekstinpoiminnan säilyttämiseksi. Dokumentin kieli on fi. ESITTELY käyttää samaa otsikkokomponenttia, fonttia, välejä, viivaa ja sivutusvarausta kuin muut osiot.

Esikatselu näyttää aina oikean PDF:n. Tekstiluonnos- ja Sivutettu PDF -valinnat sekä HTML-esikatselukomponentit on poistettu. Selaimen oma PDF-katselin vastaa sivujen näyttämisestä; upotuksen tuki riippuu selaimesta. Valmiin tiedoston voi avata myös erilliseen välilehteen. PDF-moottoria ei vaihdettu eikä tuotantoriippuvuuksia lisätty.

Oikean PDF:n regressio kattaa kuvan, yhteystiedot ja LinkedInin, esittelyn, kaksi työkokemusta, kaksi koulutusta, kaksi osaamista, kolme kieltä, pätevyyden ja suosittelijan. Kuvallinen ja kuvaton versio ovat kumpikin yhden A4-sivun mittaisia sekä uudella 1,4- että vanhan luonnoksen 1,6-rivivälillä. PDF.js tarkistaa tarkan https://www.linkedin.com/in/oliviaosaaja-tekstin ja linkkikohteen. Pitkät CV:t testataan monisivuisina, sisältö ja lukujärjestys säilyttäen. PDF/UA-vaatimustenmukaisuutta tai kaikkien kaupallisten ATS-järjestelmien toimintaa ei luvata.


## Yhteisen PDF-prosessin elinkaari ja tiheyden valinta

CvPdfProvider ottaa normalisoidun tietokopion 500 ms debounce-viiveen jälkeen. Välimuistiavain sisältää vain PDF-sisällön, värin, fonttiperheen, kuvan sisällyttämisen ja kuvan sekä layout-version; lopullinen avain sisältää myös valitun tiheyden. Lomakkeen rivitunnisteet, tyhjät rivit ja käyttöliittymätila eivät käynnistä uutta generointia. Välimuistissa on vain viimeisin onnistunut tulos.

Generoinnit on sarjoitettu PDF-moottorin yhteisen tilan vuoksi. AbortSignal estää vanhentuneet jonossa olevat työt ja seuraavat tiheyskandidaatit. Moottori ei tue jo alkaneen renderöinnin turvallista keskeytystä: sen annetaan valmistua, mutta revisiotarkistus hylkää vanhentuneen tuloksen. Edellinen kehys jää näkyviin, kunnes uuden kehyksen load-tapahtuma vahvistaa latauksen. Sen jälkeen vanha URL vapautetaan; poistuttaessa kaikki esikatselun URLit vapautetaan. Generointivirhe säilyttää vanhan näkymän ja tarjoaa Yritä uudelleen -painikkeen. Vanhaa PDF:ää ei voi tällöin ladata CV:n latauspainikkeella.

Valinta kokeilee comfortable-tiheyttä ensin. Yksi sivu hyväksytään heti. Muutoin kokeillaan compact ja tarvittaessa tight; pienin sivumäärä voittaa, tasatilanteessa ilmavampi. Sivumäärä luetaan asennetun react-pdf-moottorin valmiista sivutetusta onRender-layoutista, jonka rakenne tarkistetaan Zodilla. Tämä sisäinen rajapinta on eristetty create-cv-pdf.tsx-moduuliin: moottoripäivityksessä sopimus on tarkistettava. PDF.js-regressiot vertaavat määrää todellisen PDF:n sivumäärään kaikilla tiheyksillä. Selainpakettiin ei lisätä PDF.js:ää eikä sivuja lasketa regexillä.

Oletusbeige #E9E1D8 palautettiin Gitin aiemmasta color-utils.ts-vakiosta. Tallennusskeema 4 muuntaa vain version 3 väliaikaisen oletusharmaan #EDF3F5 beigeen. Versio 3 ei tallentanut värin alkuperää: tarkoituksella valittua täsmälleen samaa harmaata ei voi erottaa oletuksesta. Muut värit ja muiden versioiden harmaa säilyvät. Version 4 harmaata ei muuteta, joten migraatio on idempotentti. Puuttuva tai virheellinen tallennettu väri korjataan beigeen säilyttäen muu kelvollinen luonnos.

PDF.js:llä mitatut regressiosivumäärät (kuvalla ja ilman kuvaa):

| Testi-CV | Comfortable | Compact | Tight | Automaattinen tulos |
| --- | --- | --- | --- | --- |
| Hyvin lyhyt CV, nimi, työkokemus ja taidot | 1 | ei tarvita | ei tarvita | comfortable, 1 sivu |
| Lyhyt Olivia, kaikki seitsemän osiota | 2 | 1 | 1 | compact, 1 sivu |
| Pitkä CV, 8 työkokemusta ja 3 koulutusta | 3 | 2 | 2 | compact, 2 sivua |

Testit säilyttävät sivumäärät versionhallittuna snapshotina ja vertaavat jokaisen tiheyden tekstisisältöä sekä marginaaleja. Provider-testit kattavat debounce-päivitykset, hitaan vanhan tuloksen hylkäämisen, StrictModen, virheen ja uudelleenyrityksen, tyhjennyksen kesken generoinnin sekä 20 päivityksen URL-elinkaaren. Selaimessa tarkistetaan myös esikatselun ja latauksen tavujen yhtäläisyys, peräkkäisten muokkausten URLien vapautus, työpöydän ja mobiilin vakaus sekä axe myös mobiilin pelkässä esikatselunäkymässä.

## Vercel ja suljetun pilotin julkaisuasetukset

Koodin tekninen tarkastus on tehty, mutta verkkoon julkaistavaa pilottia ei saa avata ennen alla olevia pääsy- ja kustannusrajauksia. Sovelluskoodissa ei ole tunnistautumista eikä jaettua palvelinpuolen nopeusrajoitusta. Julkista /api/rewrite-text-reittiä voi muuten kutsua suoraan selaimen ulkopuolelta. CORS, Origin-tarkistus ja painikkeen estäminen eivät rajoita tätä käyttöä.

Vercelin projektiasetukset: projektin juurihakemisto on tämä repository, Framework Preset **Vite**, Install Command **npm ci**, Build Command **npm run build**, Output Directory **dist** ja Node.js-versio **24.x**. Älä julkaise pelkkää dist-kansiota erilliseksi staattiseksi projektiksi: juuren api/rewrite-text.ts kuuluu samaan Vercel-projektiin. [Node.js Functions tukee suoraan api-hakemistoa ja Web Handler -metodivientejä](https://vercel.com/docs/functions/runtimes/node-js). Aloitusreitti on /; sovelluksessa ei ole erillisiä SPA-alireittejä, joten kaikkia pyyntöjä nielevää rewrite-sääntöä ei tarvita. GitHub Pages yksin ei suorita API:a.

Aseta OPENAI_API_KEY ja OPENAI_MODEL Vercelin palvelinympäristömuuttujiin vain tarvittaviin Production-/Preview-ympäristöihin, ilman VITE_-etuliitettä. Paikallisia ympäristötiedostoja ei siirretä Gitiin. Aseta funktion enimmäiskestoksi vähintään 20 sekuntia (esimerkiksi 30): sovellus katkaisee mallikutsun 15 sekunnissa. Puuttuva avain tuottaa turvallisen 503-vastauksen; CV ja PDF toimivat ilman AI:ta.

Ennen 1–5 henkilön pilottia omistaja tekee seuraavat asetukset:

1. **Pääsy:** ota käyttöön Vercel Authentication ja **All Deployments** -suojaus, rajaa pääsy pilottiryhmälle ja varmista kirjautumattomana sekä oma domain että generoidut Production-/Preview-osoitteet. Myös suora POST /api/rewrite-text on suojattava. Standard Protection ei yksin suojaa tuotantodomainia. Katso [Deployment Protection](https://vercel.com/docs/deployment-protection).
2. **Nopeusraja:** lisää Vercel WAF -sääntö polulle /api/rewrite-text, metodille POST ja lähde-IP:lle, aluksi esimerkiksi 10 pyyntöä/minuutti. Valitse estävä 429-toiminto, älä pelkkää lokitusta; julkaise sääntö ja varmista sen toiminta. Koulun yhteinen IP jakaa rajan. Tarkista käytettävän tilauksen saatavuus ja kustannukset [WAF-ohjeesta](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting). Jos WAF ei ole käytettävissä, tarvitaan pieni palvelinratkaisu: tunnistetun pilotin käyttäjä ja atominen laskuri jaetussa tallennuksessa ennen SDK-kutsua. Pelkkä serverless-prosessin muistilaskuri ei riitä.
3. **Kustannus:** luo pilotille oma OpenAI-projekti ja palvelinavain. Rajaa sallitut mallit ja pienennä projektin mallikohtaisia RPM/TPM-rajoja. Aseta omistajan hyväksymä kuukausiraja, esimerkiksi 10 USD, ja ota erikseen käyttöön **Enforce a hard limit**. Lisää ennakkohälytykset esimerkiksi 50 % ja 80 % kohdalle. Pelkkä spend alert ei katkaise liikennettä; hard limit tuottaa 429-vastauksia, mutta viiveestä voi aiheutua pieni ylitys. Katso [OpenAI:n kulurajat](https://developers.openai.com/api/docs/guides/spend-limits) ja [projektin nopeusrajat](https://developers.openai.com/api/docs/guides/terraform/rate-limits-and-spend).
4. **Seuranta:** nimeä vastuuhenkilö tarkistamaan projektin kulut ja HTTP-virhemäärät päivittäin. Älä lokita CV-tekstejä, vastauksia tai avaimia. Poikkeamassa sulje pääsy API:in ja poista palvelinavain käytöstä. Jos tarvitaan täsmällinen päivittäinen sovelluskiintiö, lisää samaan jaettuun tallennukseen atominen kokonaislaskuri; nykykoodi ei toteuta sitä.

Nämä asetukset on dokumentoitu, mutta Vercel- ja OpenAI-tilien asetuksia ei ole muutettu tai varmennettu. Sovellusta ei ole julkaistu. Pilottia ei pidä kutsua suojatuksi ennen kuin pääsyesto, 429-raja ja kustannusasetukset on todettu käytännössä.

### Paikallinen tuotantotilan savutesti

Aja npm run build ja sen jälkeen npm run test:production. Savutesti kääntää api-, server- ja shared-moduulit TypeScriptillä erillisiksi JavaScript-tiedostoiksi ilman bundlausta (tsconfig.server.json, NodeNext), lataa API-entryn tavallisella Node.js ESM-resoluutiolla ja tarkistaa metodiviennit ja käynnistää väliaikaisen paikallisen HTTP-palvelimen. Se lukee dist-aloitussivun ja sen resurssit, testaa API:n 405/400/503-vastaukset sekä no-store-otsakkeen. Onnistunut 200-vastaus tarkistetaan mockaamalla SDK:n Responses.parse; oikeaa mallikutsua ei tehdä. Tuotantotila ja tyhjä avain asetetaan ennen API:n tuontia; ympäristötiedostoja ei ladata, ja ulkoiset fetch-pyynnöt on estetty. Väliaikainen koonti poistuu testin jälkeen. Tämä ei ole Vercelin pilvikoonti eikä todista tilikohtaisia reititys-, suojaus- tai ympäristöasetuksia; ne tarkistetaan vasta erikseen hyväksytyn julkaisun jälkeen.

Pilotin tekniset regressiot kattavat seitsemän vaihetta, luonnoksen palautuksen ja nollauksen, valokuvan käsittelyn, värit, PDF:n tekstinpoiminnan/lukujärjestyksen sekä mockatun AI:n onnistumisen, 503-, 429-, aikakatkaisu- ja verkkovirheen. Virhe ei korvaa alkuperäistä tekstiä, ja kukin painallus tekee yhden pyynnön. Testit eivät tee maksullisia mallikutsuja. Valinnainen pdftotext-testi vaatii erillisen Poppler-asennuksen; PDF.js-tarkistukset ajetaan aina.

Ennen laajempaa käyttöä suositellaan käsintestausta oikealla mobiiliselaimella ja ruudunlukijalla sekä PDF:n avaamista pilotin omissa katselimissa. Erillisen PDF-kirjastopaketin kokovaroitus on tiedossa; moottori latautuu tarvittaessa. PDF/UA-vaatimustenmukaisuutta tai kaikkien kaupallisten ATS-järjestelmien tulkintaa ei luvata.

### Palvelimen ESM-importit

package.json säilyttää type: module -asetuksen. Selainkoodin tsconfig käyttää ESNext/Bundler-resoluutiota; palvelimen erillinen tsconfig.server.json käyttää NodeNext/NodeNext-asetuksia ja kuuluu npm run build -tarkistukseen. Palvelimen paikallisissa runtime-importeissa käytetään eksplisiittistä .js-päätettä. TypeScript ratkaisee sen vastaavaan .ts-lähteeseen ja säilyttää .js-polun tuotantokoodissa. api/rewrite-text tuo server/rewrite-handler- ja server/local-env-moduulit. Handler tuo shared/rewrite-contract- ja server/rewrite-prompts-moduulit; local-env käyttää vain Node.js:n sisäisiä moduuleja. Pakettilähtöiset ja node:-importit säilyvät ennallaan.

Aiempi Vite SSR -savutesti niputti paikalliset moduulit ja peitti päätteettömien importtien virheen. Uusi testi säilyttää moduulirajat. Se poistaa lisäksi vuorollaan jokaisen neljän paikallisen importin .js-päätteen vain väliaikaisesta JavaScript-kopiosta ja varmistaa uudessa Node-prosessissa ERR_MODULE_NOT_FOUND-virheen. Lähdetiedostoja ei muuteta negatiivisissa kontrolleissa.

Vercelin asentaman @vercel/nft-jäljittimen testi varmistaa kaikkien viiden paikallisen moduulin sisältymisen sekä TypeScript-lähteistä että käännetystä entry-tiedostosta. Lähteet transpiloidaan jäljittimelle kuten @vercel/node tekee, ja ympäristötiedostot rajataan pois ennen lukemista. Staattiset .js-importit löytyvät automaattisesti; ylimääräistä includeFiles-asetusta ei tarvita. Jäljitystesti käyttää nykyisen Vercel-kehitysriippuvuuden mukana asennettua työkalua.

npx vercel build vaatii paikalliset Vercel-projektiasetukset. Tässä korjaustarkistuksessa komento pysähtyi project_settings_required-virheeseen: pilvikoontia ei siis varmennettu eikä asetuksia tai ympäristömuuttujia haettu. Paikallinen Node ESM- ja jäljitystesti ei korvaa tilikohtaisen Vercel-buildin tarkistusta projektin omistajan linkitetyssä ympäristössä. Korjaus ei julkaise sovellusta.
