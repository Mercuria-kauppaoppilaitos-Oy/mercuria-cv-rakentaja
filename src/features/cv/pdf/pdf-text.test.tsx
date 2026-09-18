// @vitest-environment node
import { beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { getDocument, OPS, type PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { createLongCvFixture, createShortCvFixture } from '../../../test/cv-fixture';
import { createEmptyCv, type CvData } from '../cv-model';
import { createCvPdf } from './create-cv-pdf';
import { registerPdfFonts } from './pdf-fonts';

const require = createRequire(import.meta.url);
beforeAll(() => registerPdfFonts({
  headingRegular: require.resolve('@fontsource/manrope/files/manrope-latin-400-normal.woff'),
  headingBold: require.resolve('@fontsource/manrope/files/manrope-latin-700-normal.woff'),
  bodyRegular: require.resolve('@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff'),
  bodyBold: require.resolve('@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff'),
}));

type ExtractedPage = { text: string; items: TextItem[]; width: number; height: number };
async function readPdf(data: CvData, includePhoto = true): Promise<{ bytes: Uint8Array; document: PDFDocumentProxy; pages: ExtractedPage[]; text: string; destroy: () => Promise<void> }> {
  const blob = await createCvPdf(data, { includePhoto });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const task = getDocument({ data: bytes.slice(), useSystemFonts: false, standardFontDataUrl: join(dirname(require.resolve('pdfjs-dist/package.json')), 'standard_fonts').replace(/\\/g, '/') + '/' });
  const document = await task.promise;
  const pages: ExtractedPage[] = [];
  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    const items = (await page.getTextContent()).items.filter((item): item is TextItem => 'str' in item);
    const viewport = page.getViewport({ scale: 1 });
    pages.push({ items, text: items.map((item) => item.str + (item.hasEOL ? '\n' : ' ')).join('').replace(/\s+/g, ' ').trim(), width: viewport.width, height: viewport.height });
  }
  return { bytes, document, pages, text: pages.map((page) => page.text).join(' '), destroy: () => task.destroy() };
}

function expectOrder(text: string, expected: string[]) {
  let offset = 0;
  for (const value of expected) {
    const index = text.indexOf(value, offset);
    expect(index, `Missing/out-of-order PDF text: ${value}`).toBeGreaterThanOrEqual(offset);
    offset = index + value.length;
  }
}

it('lyhyt Olivia-fixture mahtuu yhdelle sivulle kuvalla ja ilman, myös Kielitaito', async () => {
  const data = createShortCvFixture();
  data.appearance.photoDataUrl = `data:image/jpeg;base64,${(await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url))).toString('base64')}`;
  const snapshot = JSON.stringify(data);
  let text = '';
  for (const includePhoto of [true, false]) {
    const result = await readPdf(data, includePhoto);
    try {
      expect(result.pages).toHaveLength(1);
      expectOrder(result.text, ['Olivia Osaaja', 'Liiketoiminnan opiskelija', 'olivia@example.com', 'Esittely', 'TYÖKOKEMUS', 'Myymäläharjoittelija', 'Esimerkkikauppa · 09/2026–11/2026', 'Hyllytys. Siisteys. Palvelin asiakkaita kassalla.', 'Kesätyöntekijä', 'Esimerkki Oy · 06/2026–08/2026', 'KOULUTUS', 'Liiketoiminnan perustutkinto', 'Esimerkkioppilaitos · 08/2024–05/2027', 'OSAAMINEN', 'DIGITAIDOT JA JÄRJESTELMÄT', 'Microsoft 365 – hyvä', 'Procountor – perusteet', 'KIELITAITO', 'Suomi – äidinkieli', 'Englanti – hyvä']);
      const workText = result.text.slice(result.text.indexOf('TYÖKOKEMUS'), result.text.indexOf('KOULUTUS'));
      expect(workText).not.toContain('•');
      expect(result.text.slice(result.text.indexOf('DIGITAIDOT JA JÄRJESTELMÄT'))).not.toContain('•');
      if (text) expect(result.text).toBe(text);
      text = result.text;
      expect(JSON.stringify(data)).toBe(snapshot);
      const operators = await (await result.document.getPage(1)).getOperatorList();
      expect(operators.fnArray.filter((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toHaveLength(includePhoto ? 1 : 0);
    } finally { await result.destroy(); }
  }
});

it('pitkä Kielitaito-osio jakautuu sivuille ja otsikko pysyy ensimmäisen sisältörivin kanssa', async () => {
  const data = createShortCvFixture();
  data.languages = Array.from({ length: 75 }, (_, index) => ({ id: `language-${index}`, name: `Testikieli ${index + 1}`, proficiency: 'Hyvä' as const }));
  const result = await readPdf(data);
  try {
    expect(result.pages.length).toBeGreaterThanOrEqual(2);
    const first = result.pages.find((page) => page.text.includes('KIELITAITO'))!;
    expect(first.text).toContain('Testikieli 1 – hyvä');
    expect(first.text).not.toContain('Testikieli 75 – hyvä');
    expectOrder(result.text, data.languages.map((entry) => `${entry.name} – hyvä`));
    expect(result.pages.every((page) => page.text.trim().length > 0)).toBe(true);
  } finally { await result.destroy(); }
});

it.each([0, 5, 10, 15, 20, 25, 30])('osio-otsikot eivät jää yksin sivun loppuun eri sivurajoilla: %s', async (extra) => {
  const data = createShortCvFixture();
  data.summary += ' Olen huolellinen ja palveluhenkinen sekä haluan oppia työssä uusia taitoja.'.repeat(extra);
  const result = await readPdf(data);
  try {
    for (const heading of ['Esittely', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'DIGITAIDOT JA JÄRJESTELMÄT', 'KIELITAITO']) {
      const page = result.pages.find((page) => page.text.includes(heading))!;
      expect(page.text.endsWith(heading), heading).toBe(false);
    }
    expect(result.pages.every((page) => page.text.trim().length > 0)).toBe(true);
  } finally { await result.destroy(); }
});

it('generoi oikean monisivuisen A4-PDF:n ja säilyttää kaiken sisällön ATS-lukujärjestyksessä', async () => {
  const data = createLongCvFixture();
  const result = await readPdf(data);
  try {
    expect(new TextDecoder().decode(result.bytes.slice(0, 5))).toBe('%PDF-');
    expect(result.document.numPages).toBeGreaterThanOrEqual(2);
    for (const page of result.pages) {
      expect(page.text.trim().length).toBeGreaterThan(0);
      expect(page.width).toBeCloseTo(595.28, 1); expect(page.height).toBeCloseTo(841.89, 1);
      for (const item of page.items.filter((item) => item.str.trim())) {
        expect(item.transform[4]).toBeGreaterThanOrEqual(50);
        expect(item.transform[4] + item.width).toBeLessThanOrEqual(page.width - 49);
        expect(item.transform[5]).toBeGreaterThanOrEqual(45);
        const isHeader = page === result.pages[0] && item.transform[5] > page.height - 90;
        expect(item.transform[5] + item.height).toBeLessThanOrEqual(page.height - (isHeader ? 18 : 45));
      }
    }
    expectOrder(result.text, [
      'Åsa-Maria Ääkkönen-Östergård Pitkänimi', data.personalDetails.professionalTitle,
      'test@example.com', '040 000 0000', 'Vantaa', data.personalDetails.linkedIn,
      'Esittely', 'Ääkköset: ä ö å Ä Ö Å', 'Esimerkki: Päivi Määttä, Jyväskylä, työpäällikkö',
      'TYÖKOKEMUS', ...data.workExperience.map((entry) => entry.title),
      'KOULUTUS', ...data.education.map((entry) => entry.qualification),
      'OSAAMINEN', 'Asiakaspalvelu ja myyntityö',
      'DIGITAIDOT JA JÄRJESTELMÄT', 'Microsoft Excel – hyvä',
      'KIELITAITO', 'Englanti – sujuva',
      'KORTIT JA PÄTEVYYDET', 'Hygieniapassi – Esimerkkijärjestäjä – 2025 – Voimassa toistaiseksi',
      'SUOSITTELIJAT', 'Testi Suosittelija', 'Esihenkilö – Esimerkki Oy', 'reference@example.com', '040 000 0001',
    ]);
    expect(result.text.match(/Palvelin asiakkaita/g)).toHaveLength(8);
    expect(result.text.match(/Käsittelin verkkokaupan tilauksia/g)).toHaveLength(8);
    expect(result.text.match(/Tuotin sosiaalisen median sisältöä/g)).toHaveLength(8);
    expect(result.text).toContain('08/2023–05/2024');
    for (let index = 0; index < data.workExperience.length; index++) {
      const entry = data.workExperience[index]!;
      const start = result.text.indexOf(entry.title);
      const end = index + 1 < data.workExperience.length ? result.text.indexOf(data.workExperience[index + 1]!.title, start + entry.title.length) : result.text.indexOf('KOULUTUS', start);
      const block = result.text.slice(start, end);
      expectOrder(block, [entry.title, entry.employer, entry.location, `${entry.startDate.slice(5)}/${entry.startDate.slice(0, 4)}`, 'Palvelin asiakkaita', 'Käsittelin verkkokaupan tilauksia', 'Tuotin sosiaalisen median sisältöä']);
    }
    for (const entry of data.education) {
      const block = result.text.slice(result.text.indexOf(entry.qualification));
      expectOrder(block, [entry.qualification, entry.institution, entry.location, `${entry.startDate.slice(5)}/${entry.startDate.slice(0, 4)}`]);
    }
    const metadata = (await result.document.getMetadata()).info as { Title: string; Author: string; Subject: string };
    expect(metadata).toMatchObject({ Title: 'Åsa-Maria Ääkkönen-Östergård Pitkänimi – CV', Author: 'Åsa-Maria Ääkkönen-Östergård Pitkänimi', Subject: 'Ansioluettelo' });
    const urls = [];
    for (let number = 1; number <= result.document.numPages; number++) urls.push(...(await (await result.document.getPage(number)).getAnnotations()).map((item) => item.url));
    expect(urls).toContain('mailto:test@example.com'); expect(urls).toContain(data.personalDetails.linkedIn); expect(urls).toContain('mailto:reference@example.com');
    // No heading may be the final content on its page, and the name is not repeated.
    for (const heading of ['Esittely', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'DIGITAIDOT JA JÄRJESTELMÄT', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT']) {
      const page = result.pages.find((page) => page.text.includes(heading))!;
      expect(page.text.endsWith(heading), heading + " / " + page.text.slice(-180)).toBe(false);
    }
    expect(result.text.match(/Åsa-Maria/g)).toHaveLength(1);
    expect(result.text).not.toMatch(/Mercuria|CV-esikatselu|Muokkaa tietojasi|Lataa CV PDF-muodossa|aino\.esimerkki/);
  } finally { await result.destroy(); }
}, 30_000);

it('pitkä yksittäinen työkokemus saa jatkua sivulta toiselle eikä otsikko jää yksin', async () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Päivi'; data.personalDetails.lastName = 'Määttä';
  data.workExperience = [{ id: 'long', title: 'Työpäällikkö', employer: 'Testiyritys', location: 'Jyväskylä', startDate: '2024-01', endDate: '', isCurrent: true,
    description: Array.from({ length: 90 }, (_, index) => `Tehtävä ${index + 1}: Vastasin työvuoroista ja järjestin asiakaspalvelun koulutuksia.`).join('\n') }];
  const result = await readPdf(data);
  try {
    expect(result.pages.length).toBeGreaterThanOrEqual(2);
    expect(result.pages.every((page) => page.text.length > 0)).toBe(true);
    expect(result.pages[0]!.text).toContain('Työpäällikkö Testiyritys, Jyväskylä');
    expectOrder(result.text, Array.from({ length: 90 }, (_, index) => `Tehtävä ${index + 1}:`));
    expect(result.text).toContain('01/2024–nykyhetki');
  } finally { await result.destroy(); }
}, 30_000);

it('tyhjät osiot, tyhjät merkinnät ja HTML-esimerkkitekstit eivät tulostu', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  data.workExperience = [{ id: 'empty', title: ' ', employer: '', location: '', startDate: '', endDate: '', isCurrent: false, description: '\n' }];
  data.skills = [{ id: 'empty', name: ' ' }];
  const result = await readPdf(data);
  try {
    expect(result.pages.length).toBe(1); expect(result.text).toBe('Päivi');
    expect(result.text).not.toMatch(/Aino|Esimerkki|Asiakaspalvelun|Esittely|TYÖKOKEMUS|KOULUTUS|OSAAMINEN|SUOSITTELIJAT|Mercuria/);
  } finally { await result.destroy(); }
});

it('sivuttaa myös yhden erittäin pitkän luettelokohdan ja säilyttää tekstin leikkautumatta', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  const description = Array.from({ length: 150 }, (_, index) => `Työtehtävä ${index + 1}: Ohjasin työntekijöitä ja kehitin yhteistyötä.`).join(' ');
  data.workExperience = [{ id: 'paragraph', title: 'Työpäällikkö', employer: '', location: '', startDate: '', endDate: '', isCurrent: false, description }];
  const result = await readPdf(data);
  try {
    expect(result.pages.length).toBeGreaterThanOrEqual(2);
    expect(result.pages.every((page) => page.text.length > 0)).toBe(true);
    expect(result.text).toContain(description);
    const titlePage = result.pages.find((page) => page.text.includes('Työpäällikkö'))!;
    expect(titlePage.text).toContain('Työtehtävä 1:');
    for (const page of result.pages) for (const item of page.items.filter((item) => item.str.trim())) {
      expect(item.transform[4] + item.width).toBeLessThanOrEqual(page.width - 49);
      expect(item.transform[5]).toBeGreaterThanOrEqual(45);
    }
  } finally { await result.destroy(); }
}, 30_000);

it('valokuva ja eri korostusvärit säilyttävät täsmälleen saman poimittavan tekstin', async () => {
  const data = createEmptyCv(); data.personalDetails = { ...data.personalDetails, firstName: 'Päivi', lastName: 'Määttä', professionalTitle: 'Työpäällikkö' };
  data.summary = 'Ääkköset: ä ö å Ä Ö Å';
  data.personalDetails.email = 'header@example.com';
  const plain = await readPdf(data);
  try {
    const plainOperators = await (await plain.document.getPage(1)).getOperatorList();
    expect(plainOperators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(false);
    const photo = await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url));
    data.appearance.photoDataUrl = `data:image/jpeg;base64,${photo.toString('base64')}`;
    data.appearance.accentColor = '#203040';
    const withPhoto = await readPdf(data);
    try {
      expect(withPhoto.text).toBe(plain.text);
      const operators = await (await withPhoto.document.getPage(1)).getOperatorList();
      expect(operators.fnArray.filter((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toHaveLength(1);
      const snapshot = JSON.stringify(data);
      const excluded = await readPdf(data, false);
      try {
        expect(excluded.text).toBe(withPhoto.text);
        expect(JSON.stringify(data)).toBe(snapshot);
        const excludedOperators = await (await excluded.document.getPage(1)).getOperatorList();
        expect(excludedOperators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(false);
        const name = excluded.pages[0]!.items.find((item) => item.str.includes('Päivi'))!;
        expect(name.transform[4]).toBeCloseTo(18 * 72 / 25.4, 1);
        expect(name.height).toBeCloseTo(20, 1);
        const contact = excluded.pages[0]!.items.find((item) => item.str.includes('header@example.com'))!;
        const photoContact = withPhoto.pages[0]!.items.find((item) => item.str.includes('header@example.com'))!;
        // The photo changes only the header height, by exactly 38 - 31 mm.
        expect(contact.transform[5] - photoContact.transform[5]).toBeCloseTo(7 * 72 / 25.4, 1);
        expect(excluded.pages[0]!.height - contact.transform[5]).toBeGreaterThan(35 * 72 / 25.4);
        expect(excluded.pages[0]!.height - contact.transform[5]).toBeLessThan(40 * 72 / 25.4);
      } finally { await excluded.destroy(); }
    } finally { await withPhoto.destroy(); }
  } finally { await plain.destroy(); }
});

it('pitkä kaksiosainen nimi ja ammattinimike kasvattavat ensimmäistä otsaketta sekoittamatta tekstiä', async () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Åsa-Maria Päivi';
  data.personalDetails.lastName = 'Ääkkönen-Östergård Pitkänimi Esimerkkisukunimi';
  data.personalDetails.professionalTitle = 'Asiakaspalvelun ja verkkokaupan kehittämisen sekä kansainvälisen yhteistyön kokenut ammattilainen';
  data.personalDetails.email = 'longheader@example.com'; data.summary = 'Seuraava sisältö alkaa yhteystietojen jälkeen.';
  data.appearance.photoDataUrl = `data:image/jpeg;base64,${(await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url))).toString('base64')}`;
  const result = await readPdf(data);
  try {
    expectOrder(result.text, [`${data.personalDetails.firstName} ${data.personalDetails.lastName}`, data.personalDetails.professionalTitle, data.personalDetails.email, 'Esittely', data.summary]);
    expect(result.pages.length).toBe(1);
    const contact = result.pages[0]!.items.find((item) => item.str.includes(data.personalDetails.email))!;
    const headerItems = result.pages[0]!.items.filter((item) => item.str.trim() && item.transform[5] > contact.transform[5]);
    expect(headerItems.length).toBeGreaterThan(3);
    for (const item of headerItems) {
      expect(item.height).toBeGreaterThanOrEqual(10);
      expect(item.transform[4]).toBeGreaterThan(50);
      expect(item.transform[4] + item.width).toBeLessThan(result.pages[0]!.width - 49);
      expect(item.transform[5] + item.height).toBeLessThan(result.pages[0]!.height - 18);
    }
    expect(result.text).not.toMatch(/ATS-tarkistus|Työpaikkailmoitus|Analysoi|Vahvistan/);
  } finally { await result.destroy(); }
});

it('piilotetut suosittelijat eivät vuoda PDF:ään ja pyydettäessä-tila tulostuu', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  data.references = [{ id: 'secret', name: 'Piilotettu henkilö', title: '', organization: '', email: 'hidden@example.com', phone: '' }];
  data.referencesDisplay = 'hidden';
  const hidden = await readPdf(data);
  try { expect(hidden.text).not.toMatch(/Piilotettu|hidden@example|SUOSITTELIJAT/); } finally { await hidden.destroy(); }
  data.referencesDisplay = 'on-request'; const requested = await readPdf(data);
  try { expect(requested.text).toContain('SUOSITTELIJAT Suosittelijat saatavilla pyydettäessä'); expect(requested.text).not.toContain('hidden@example'); } finally { await requested.destroy(); }
});

const hasPoppler = !spawnSync('pdftotext', ['-v'], { windowsHide: true }).error;
if (!hasPoppler) console.info('OHITETTU: pdftotext ei ole asennettu; PDF.js-tekstinpoimintatarkistukset ajetaan aina.');
it.skipIf(!hasPoppler)('valinnainen toinen ATS-tekstinpoiminta pdftotext-komennolla', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'mercuria-cv-pdf-'));
  try {
    const blob = await createCvPdf(createLongCvFixture());
    const path = join(folder, 'cv.pdf'); await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    const process = spawnSync('pdftotext', ['-enc', 'UTF-8', path, '-'], { encoding: 'utf8', windowsHide: true });
    expect(process.status).toBe(0);
    expectOrder(process.stdout.replace(/\s+/g, ' '), ['Åsa-Maria', 'Ääkköset: ä ö å Ä Ö Å', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'SUOSITTELIJAT']);
  } finally {
    if (dirname(resolve(folder)) !== resolve(tmpdir()) || !folder.includes('mercuria-cv-pdf-')) throw new Error('Unexpected temporary PDF directory');
    await rm(folder, { recursive: true, force: true });
  }
}, 30_000);
