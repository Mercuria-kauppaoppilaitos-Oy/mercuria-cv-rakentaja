# mercuria-cv

Responsiivinen React-, TypeScript- ja Vite-sovellus.

## Vaatimukset ja käynnistys

Tarvitset Node.js 24:n tai uudemman sekä npm:n. Komennot toimivat Windowsin Command Prompt -terminaalissa.

Asenna riippuvuudet, jos ohitit asennuksen projektin luonnissa:

```cmd
npm install
npm run dev
```

## Testaus ja koonti

```cmd
npm test
npm run build
```

Testit käyttävät Node.js:n omaa testiajuria. Ne eivät tee verkkokutsuja.
Avaa projekti VS Codessa komennolla `code .`.

Git alustetaan main-haaralle projektin luonnissa. Jos alustus epäonnistui, asenna Git ja suorita `git init --initial-branch=main`.
Luonti ei tee commitia eikä luo etärepositoriota.

## Rakenne ja käyttö

- `index.html`: suomenkielinen HTML-sivu ja näkymän metatiedot.
- `src/App.tsx`: aloitusnäkymä ja laskuri.
- `src/styles.css`: responsiiviset tyylit, näkyvä näppäimistökohdistus ja ohituslinkki.
- `src/counter.ts` ja `tests/counter.test.mjs`: laskurin logiikka ja sen testi.

`npm run dev` tulostaa selaimessa avattavan paikallisen osoitteen.
Koonti syntyy dist-kansioon. Tarkastele sitä koonnin jälkeen komennolla `npm run preview`.
Testi tarkistaa laskurin logiikan; selaimen ulkoasu ja näppäimistökäyttö tarkistetaan erikseen.

React ja React DOM toteuttavat käyttöliittymän; Vite, TypeScript ja tyypitykset ovat kehitysriippuvuuksia.
Pohja ei tarvitse ympäristömuuttujia. Älä laita salaisuuksia selaimelle toimitettavaan koodiin tai VITE_-muuttujiin.
