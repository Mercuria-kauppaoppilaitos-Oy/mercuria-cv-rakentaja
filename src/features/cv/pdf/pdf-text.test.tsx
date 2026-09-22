import { getCvSections, getFullName } from '../cv-content';
import { Document, Font, Page, Text, pdf } from '@react-pdf/renderer';
// @vitest-environment node
import { beforeAll, expect, it } from 'vitest';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import { createLongCvFixture, createShortCvFixture } from '../../../test/cv-fixture';
import { createEmptyCv, type CvData } from '../cv-model';
import { createCvPdf, generateCvPdf, renderCvPdf } from './create-cv-pdf';
import { preparePdfInput } from './pdf-input';
import { cvDensityLayouts, type CvDensity } from '../cv-layout';
import { preparePdfFonts, registerPdfFonts } from './pdf-fonts';
import { migrateLegacySkills } from '../draft-storage';

const require = createRequire(import.meta.url);
beforeAll(() => registerPdfFonts({
  headingRegular: require.resolve('@fontsource/manrope/files/manrope-latin-400-normal.woff'),
  headingBold: require.resolve('@fontsource/manrope/files/manrope-latin-700-normal.woff'),
  bodyRegular: require.resolve('@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff'),
  bodyBold: require.resolve('@fontsource/source-sans-3/files/source-sans-3-latin-700-normal.woff'),
}));

type ExtractedPage = { text: string; items: TextItem[]; width: number; height: number };
async function readPdf(data: CvData, includePhoto = true, density?: CvDensity) {
  const input = preparePdfInput(data, includePhoto)!;
  const result = density ? await renderCvPdf(input, density) : await generateCvPdf(input);
  const blob = result.blob;
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
  return { density: result.density, pageCount: result.pageCount, bytes, document, pages, text: pages.map((page) => page.text).join(' '), destroy: () => task.destroy() };
}

function expectOrder(text: string, expected: string[]) {
  let offset = 0;
  for (const value of expected) {
    const index = text.indexOf(value, offset);
    expect(index, `Missing/out-of-order PDF text: ${value}`).toBeGreaterThanOrEqual(offset);
    offset = index + value.length;
  }
}

function expectIntactEntries(result: Awaited<ReturnType<typeof readPdf>>, data: CvData) {
  for (const section of getCvSections(data)) {
    if (section.kind !== 'entries') continue;
    for (const [index, entry] of section.entries.entries()) {
      const page = result.pages.find((page) => page.text.includes(entry.title));
      expect(page, entry.title).toBeDefined();
      expectOrder(page!.text, [entry.title, ...entry.lines, entry.paragraph].filter(Boolean));
      if (index === 0) expect(page!.text).toContain(section.heading);
    }
  }
}

async function renderRegressionPages(result: Awaited<ReturnType<typeof readPdf>>, name: string) {
  const { createCanvas } = require('@napi-rs/canvas');
  await mkdir('test-results/pdf-pagination', { recursive: true });
  await writeFile(`test-results/pdf-pagination/${name}.pdf`, result.bytes);
  for (let number = 1; number <= result.pages.length; number++) {
    const page = await result.document.getPage(number);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvas, viewport }).promise;
    await writeFile(`test-results/pdf-pagination/${name}-${number}.png`, canvas.toBuffer('image/png'));
    const items = result.pages[number - 1]!.items.filter((item) => item.str.trim());
    // Reading order must agree with the visible top-to-bottom, left-to-right flow.
    for (let index = 1; index < items.length; index++) {
      const previous = items[index - 1]!; const current = items[index]!;
      expect(current.transform[5]).toBeLessThanOrEqual(previous.transform[5] + 1);
      if (Math.abs(current.transform[5] - previous.transform[5]) < 1) expect(current.transform[4]).toBeGreaterThanOrEqual(previous.transform[4] - 1);
    }
    // Every extracted run must also leave visible ink in the rendered page.
    for (const item of items) {
      const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      const pixels = canvas.getContext('2d').getImageData(Math.floor(x), Math.floor(y - item.height * 1.5), Math.max(1, Math.ceil(item.width * 1.5)), Math.ceil(item.height * 1.8)).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 180 && pixels[i + 1] < 180 && pixels[i + 2] < 180) ink++;
      expect(ink, item.str).toBeGreaterThan(0);
    }
  }
}

it('epäjärjestyksessä annetut työt tulostuvat vakaasti aikajärjestyksessä muuttamatta lähdettä', async () => {
  const data = createShortCvFixture();
  const base = data.workExperience[0]!;
  data.workExperience = [
    { ...base, id: 'missing-a', title: 'Puuttuva alku', startDate: '' },
    { ...base, id: 'old', title: 'Vanha työ', startDate: '2022-01', endDate: '2022-12' },
    { ...base, id: 'tie-a', title: 'Tasatilanne A' },
    { ...base, id: 'missing-b', title: 'Virheellinen loppu', endDate: '2026-13' },
    { ...base, id: 'earlier', title: 'Aiempi aloitus', startDate: '2026-01' },
    { ...base, id: 'current', title: 'Nykyinen työ', startDate: '2020-01', endDate: '', isCurrent: true },
    { ...base, id: 'tie-b', title: 'Tasatilanne B' },
  ];
  const snapshot = JSON.stringify(data);
  const result = await readPdf(data);
  try {
    expectOrder(result.text, ['Nykyinen työ', 'Tasatilanne A', 'Tasatilanne B', 'Aiempi aloitus', 'Vanha työ', 'Puuttuva alku', 'Virheellinen loppu']);
    expect(JSON.stringify(data)).toBe(snapshot);
    expectIntactEntries(result, data);
    await renderRegressionPages(result, 'chronological');
  } finally { await result.destroy(); }
}, 30000);

it.each(['comfortable', 'compact', 'tight'] as const)('kaksisivuinen CV pitää työ- ja koulutusmerkinnät kokonaisina: %s', async (density) => {
  const data = createShortCvFixture();
  const work = data.workExperience[0]!;
  data.workExperience = Array.from({ length: 5 }, (_, index) => ({ ...work, id: `work-${index}`, title: `Tehtävä ${index + 1}`, description: 'Palvelin asiakkaita ja käsittelin tilauksia. '.repeat(5).trim() }));
  const school = data.education[0]!;
  data.education = Array.from({ length: 2 }, (_, index) => ({ ...school, id: `school-${index}`, qualification: `Tutkinto ${index + 1}`, description: 'Opiskelin asiakaspalvelua ja taloushallintoa. '.repeat(4).trim() }));
  const result = await readPdf(data, false, density);
  try {
    expect(result.pages).toHaveLength(2);
    expectIntactEntries(result, data);
    await renderRegressionPages(result, `two-page-${density}`);
  } finally { await result.destroy(); }
}, 30000);

it('vanhat digitaidot löytyvät vain Osaamisesta ja tehtävärivien väli säilyy oikeassa PDF:ssä', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Olivia'; data.personalDetails.lastName = 'Osaaja';
  data.skills = [{ id: 'excel', name: 'Excel' }];
  data.workExperience = [{ id: 'work', title: 'Harjoittelija', employer: 'Esimerkki Oy', location: '', startDate: '2026-09', endDate: '2026-11', isCurrent: false, description: 'Tähän tulee tietoa kokemuksesta\n\nTähän tulee tietoa kokemuksesta.' }];
  const legacy = { ...data, digitalSkills: [{ id: 'old-excel', name: ' EXCEL ', proficiency: 'Hyvä' as const }, { id: 'procountor', name: 'Procountor', proficiency: 'Perusteet' as const }] };
  const snapshot = JSON.stringify(legacy);
  const result = await readPdf(migrateLegacySkills(legacy));
  try {
    expect(result.density).toBe('comfortable');
    expect(result.pages).toHaveLength(1);
    expect(result.text).toBe('Olivia Osaaja TYÖKOKEMUS Harjoittelija Esimerkki Oy · 09/2026–11/2026 Tähän tulee tietoa kokemuksesta. Tähän tulee tietoa kokemuksesta. OSAAMINEN Excel – hyvä Procountor – perusteet');
    expect(result.text).not.toContain('kokemuksestaTähän');
    expect(result.text).not.toMatch(/DIGITAIDOT|Esittely|Aino|Esimerkki:|ATS-tarkistus/);
    expect(JSON.stringify(legacy)).toBe(snapshot);
  } finally { await result.destroy(); }
});

it.each([1.4, 1.6])('lyhyt Olivia-fixture mahtuu yhdelle sivulle kuvalla ja ilman, myös vanha riviväli %s', async (lineHeight) => {
  const data = createShortCvFixture();
  data.appearance.lineHeight = lineHeight;
  data.appearance.photoDataUrl = `data:image/jpeg;base64,${(await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url))).toString('base64')}`;
  const snapshot = JSON.stringify(data);
  let text = '';
  for (const includePhoto of [true, false]) {
    const result = await readPdf(data, includePhoto);
    try {
      expect(result.pages).toHaveLength(1);
      expect(result.text).toContain('https://www.linkedin.com/in/oliviaosaaja');
      expect((await (await result.document.getPage(1)).getAnnotations()).map((item) => item.url)).toContain('https://www.linkedin.com/in/oliviaosaaja');
      expectOrder(result.text, ['Olivia Osaaja', 'Liiketoiminnan opiskelija', 'olivia@example.com', 'ESITTELY', 'TYÖKOKEMUS', 'Myymäläharjoittelija', 'Esimerkkikauppa · 09/2026–11/2026', 'Hyllytys. Siisteys. Palvelin asiakkaita kassalla.', 'Kesätyöntekijä', 'Esimerkki Oy · 06/2026–08/2026', 'KOULUTUS', 'Liiketoiminnan perustutkinto', 'Esimerkkioppilaitos · 08/2024–05/2027', 'OSAAMINEN', 'Microsoft 365 – hyvä', 'Procountor – perusteet', 'KIELITAITO', 'Suomi – äidinkieli', 'Englanti – hyvä', 'KORTIT JA PÄTEVYYDET', 'Hygieniapassi – 2026']);
      const workText = result.text.slice(result.text.indexOf('TYÖKOKEMUS'), result.text.indexOf('KOULUTUS'));
      expect(workText).not.toContain('•');
      expect(result.text.slice(result.text.indexOf('OSAAMINEN'), result.text.indexOf('KORTIT JA PÄTEVYYDET'))).not.toContain('•');
      expect(result.text).not.toContain('DIGITAIDOT JA JÄRJESTELMÄT');
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
    for (const heading of ['ESITTELY', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO']) {
      const page = result.pages.find((page) => page.text.includes(heading))!;
      expect(page.text.endsWith(heading), heading).toBe(false);
    }
    expectIntactEntries(result, data);
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
      'ESITTELY', 'Ääkköset: ä ö å Ä Ö Å', 'Esimerkki: Päivi Määttä, Jyväskylä, työpäällikkö',
      'TYÖKOKEMUS', ...data.workExperience.map((entry) => entry.title),
      'KOULUTUS', ...data.education.map((entry) => entry.qualification),
      'OSAAMINEN', 'Asiakaspalvelu ja myyntityö',
      'Microsoft Excel',
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
    for (const heading of ['ESITTELY', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT']) {
      const page = result.pages.find((page) => page.text.includes(heading))!;
      expect(page.text.endsWith(heading), heading + " / " + page.text.slice(-180)).toBe(false);
    }
    expect(result.text.match(/Åsa-Maria/g)).toHaveLength(1);
    expect(result.text).not.toMatch(/Mercuria|CV-esikatselu|Muokkaa tietojasi|Lataa CV PDF-muodossa|aino\.esimerkki/);
    expectIntactEntries(result, data);
    await renderRegressionPages(result, 'long');
    expect(new Set(data.workExperience.map((entry) => result.pages.findIndex((page) => page.text.includes(entry.title)))).size).toBeGreaterThan(1);
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
    await renderRegressionPages(result, 'oversized');
  } finally { await result.destroy(); }
}, 30_000);

it('valokuva ja eri korostusvärit säilyttävät täsmälleen saman poimittavan tekstin', async () => {
  const data = createEmptyCv(); data.personalDetails = { ...data.personalDetails, firstName: 'Päivi', lastName: 'Määttä', professionalTitle: 'Työpäällikkö' };
  data.summary = 'Ääkköset: ä ö å Ä Ö Å';
  data.personalDetails.email = 'header@example.com';
  const plain = await readPdf(data);
  try {
    const plainOperators = await (await plain.document.getPage(1)).getOperatorList();
    expect(plainOperators.argsArray.filter((_, index) => plainOperators.fnArray[index] === OPS.setFillRGBColor).flat()).toContain('#e9e1d8');
    expect(plainOperators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(false);
    const photo = await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url));
    data.appearance.photoDataUrl = `data:image/jpeg;base64,${photo.toString('base64')}`;
    data.appearance.accentColor = '#203040';
    const withPhoto = await readPdf(data);
    try {
      expect(withPhoto.text).toBe(plain.text);
      const operators = await (await withPhoto.document.getPage(1)).getOperatorList();
      expect(operators.argsArray.filter((_, index) => operators.fnArray[index] === OPS.setFillRGBColor).flat()).toContain('#203040');
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
    expectOrder(result.text, [`${data.personalDetails.firstName} ${data.personalDetails.lastName}`, data.personalDetails.professionalTitle, data.personalDetails.email, 'ESITTELY', data.summary]);
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

const pdftotext = process.env.PDFTOTEXT_BINARY || 'pdftotext';
const popplerProbe = spawnSync(pdftotext, ['-v'], { windowsHide: true });
if (process.env.PDFTOTEXT_BINARY && popplerProbe.error) throw popplerProbe.error;
const hasPoppler = !popplerProbe.error;
if (!hasPoppler) console.info('OHITETTU: pdftotext ei ole asennettu; PDF.js-tekstinpoimintatarkistukset ajetaan aina.');

const spacingSentence = 'Tehtäviini kuului organisaation työelämä- ja yritysyhteistyön toimintamallien kehittäminen sekä raportoinnin';
const spacingParagraph = `${spacingSentence} kehittäminen oli tärkeä osa työtäni.`;
const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

async function extractRawText(bytes: Uint8Array) {
  const folder = await mkdtemp(join(tmpdir(), 'mercuria-cv-raw-'));
  try {
    const path = join(folder, 'cv.pdf');
    await writeFile(path, bytes);
    const result = spawnSync(pdftotext, ['-raw', '-enc', 'UTF-8', path, '-'], { encoding: 'utf8', windowsHide: true });
    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr).toBe(0);
    return result.stdout;
  } finally {
    if (dirname(resolve(folder)) !== resolve(tmpdir()) || !folder.includes('mercuria-cv-raw-')) throw new Error('Unexpected temporary PDF directory');
    await rm(folder, { recursive: true, force: true });
  }
}

it.skipIf(!hasPoppler).each([undefined, 'left'] as const)('Poppler raw säilyttää välit pienimmässä toistossa: textAlign=%s', async (textAlign) => {
  await preparePdfFonts();
  const blob = await pdf(<Document><Page size="A4" style={{ padding: 18 * 72 / 25.4 }}>
    <Text style={{ fontFamily: 'CvBody', fontSize: 11, textAlign }}>{spacingParagraph}</Text>
  </Page></Document>).toBlob();
  const text = await extractRawText(new Uint8Array(await blob.arrayBuffer()));
  // This exact phrase occupies one full line in the unmodified layout.
  expect(text).toContain(spacingSentence);
  expect(normalizeWhitespace(text)).toBe(spacingParagraph);
});

it.each(['comfortable', 'compact', 'tight'] as const)('pitkän suomenkielisen rivin välit, sivutus ja lukujärjestys säilyvät: %s', async (density) => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Päivi';
  data.summary = spacingParagraph;
  data.workExperience = [{ ...createShortCvFixture().workExperience[0]!, description: spacingParagraph }];
  data.education = [{ ...createShortCvFixture().education[0]!, description: spacingParagraph }];
  data.skills = [{ id: 'project', name: `Projektityö: ${spacingParagraph}` }];
  const source = JSON.stringify(data);
  const expected = ['Päivi', ...getCvSections(data).flatMap((section) => [section.heading,
    ...(section.kind === 'entries' ? section.entries.flatMap((entry) => [entry.title, ...entry.lines, entry.paragraph])
      : section.kind === 'list' ? section.items.map((item) => item.text) : [section.text])])].filter(Boolean).join(' ');
  const result = await readPdf(data, false, density);
  try {
    expect(result.pages).toHaveLength(1);
    expect(result.pageCount).toBe(1);
    expect(result.text).toBe(expected);
    expectIntactEntries(result, data);
    const extracted = [result.text];
    if (hasPoppler) {
      const raw = await extractRawText(result.bytes);
      expect(raw).toContain(spacingSentence);
      expect(normalizeWhitespace(raw)).toBe(expected);
      extracted.push(raw);
    }
    const sourceTokens = new Set(expected.split(/\s+/));
    for (const text of extracted) {
      for (const token of text.split(/\s+/).filter((token) => token.length >= 40)) {
        expect(sourceTokens.has(token), `Unexpected joined token: ${token}`).toBe(true);
      }
    }
    await renderRegressionPages(result, `word-spacing-${density}`);
    expect(JSON.stringify(data)).toBe(source);
  } finally { await result.destroy(); }
}, 30000);

it('ActualText säilyttää myös serif-fontin, ligatuurit ja linkkien tekstin', async () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Päivi';
  data.appearance.fontFamily = 'serif';
  data.summary = 'Office ja fiilis: ääkköset ä ö å Ä Ö Å. https://example.com/office?first=1&second=2';
  const result = await readPdf(data);
  try {
    const expected = `Päivi ESITTELY ${data.summary}`;
    expect(result.text).toBe(expected);
    if (hasPoppler) expect(normalizeWhitespace(await extractRawText(result.bytes))).toBe(expected);
  } finally { await result.destroy(); }
});

it.skipIf(!hasPoppler)('valinnainen toinen ATS-tekstinpoiminta pdftotext-komennolla', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'mercuria-cv-pdf-'));
  try {
    const blob = await createCvPdf(createLongCvFixture());
    const path = join(folder, 'cv.pdf'); await writeFile(path, new Uint8Array(await blob.arrayBuffer()));
    const process = spawnSync(pdftotext, ['-enc', 'UTF-8', path, '-'], { encoding: 'utf8', windowsHide: true });
    expect(process.status).toBe(0);
    expectOrder(process.stdout.replace(/\s+/g, ' '), ['Åsa-Maria', 'Ääkköset: ä ö å Ä Ö Å', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'SUOSITTELIJAT']);
  } finally {
    if (dirname(resolve(folder)) !== resolve(tmpdir()) || !folder.includes('mercuria-cv-pdf-')) throw new Error('Unexpected temporary PDF directory');
    await rm(folder, { recursive: true, force: true });
  }
}, 30_000);

it.each([['short', false], ['short', true], ['long', false], ['long', true]] as const)('kaikki tiheydet säilyttävät tekstin, sivumäärän ja otsikot: %s photo=%s', async (kind, includePhoto) => {
  const data = kind === 'short' ? createShortCvFixture() : createLongCvFixture();
  data.appearance.photoDataUrl = 'data:image/jpeg;base64,' + (await readFile(new URL('../../../../tests/fixtures/cropped-photo.jpg', import.meta.url))).toString('base64');
  const snapshot = JSON.stringify(data);
  const counts: number[] = []; let original = '';
  const densities: CvDensity[] = ['comfortable', 'compact', 'tight'];
  for (const density of densities) {
    const result = await readPdf(data, includePhoto, density);
    try {
      expect(result.document.numPages).toBe(result.pageCount);
      counts.push(result.pageCount);
      if (original) expect(result.text).toBe(original); else original = result.text;
      const headings = result.pages.flatMap((page) => page.items).filter((item) => ['ESITTELY', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT'].includes(item.str));
      expect(headings).toHaveLength(7);
      expect(new Set(headings.map((item) => item.fontName)).size).toBe(1);
      expect(new Set(headings.map((item) => item.height)).size).toBe(1);
      const margin = cvDensityLayouts[density].pageMarginMm * 72 / 25.4;
      expect(cvDensityLayouts[density].bodyFontSize).toBeGreaterThanOrEqual(11);
      for (const page of result.pages) {
        expect(page.text).not.toBe('');
        for (const item of page.items.filter((item) => item.str.trim())) {
          expect(item.transform[4]).toBeGreaterThanOrEqual(margin - 1);
          expect(item.transform[4] + item.width).toBeLessThanOrEqual(page.width - margin + 1);
          expect(item.transform[5]).toBeGreaterThanOrEqual(margin - 1);
        }
        const last = page.items.filter((item) => item.str.trim()).at(-1)!;
        expect(headings).not.toContain(last);
      }
    } finally { await result.destroy(); }
  }
  const automatic = await readPdf(data, includePhoto);
  try {
    const best = Math.min(...counts);
    expect(automatic.pageCount).toBe(best);
    expect(automatic.density).toBe(densities[counts.indexOf(best)]);
    expect(automatic.text).toBe(original);
    expect({ counts, density: automatic.density, pages: automatic.pageCount }).toMatchSnapshot();
  } finally { await automatic.destroy(); }
  expect(JSON.stringify(data)).toBe(snapshot);
}, 30000);

it.each([['#E9E1D8', '#000000'], ['#203040', '#ffffff']])('otsake ja Esittely käyttävät samaa taustaa ja kontrastia: %s', async (accent, foreground) => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Meri';
  data.summary = 'Esittelytekstin kontrasti säilyy. https://example.com'; data.appearance.accentColor = accent!;
  const result = await readPdf(data);
  try {
    const operators = await (await result.document.getPage(1)).getOperatorList();
    const fills = operators.argsArray.filter((_, index) => operators.fnArray[index] === OPS.setFillRGBColor).flat();
    // Header, section underline and summary rectangle must all use the accent.
    expect(fills.filter((color) => color === accent!.toLowerCase()).length).toBeGreaterThanOrEqual(3);
    let fill = ''; const stack: string[] = []; const textColors: { text: string; fill: string }[] = [];
    operators.fnArray.forEach((operation, index) => {
      const args = operators.argsArray[index];
      if (operation === OPS.save) stack.push(fill);
      if (operation === OPS.restore) fill = stack.pop() ?? '';
      if (operation === OPS.setFillRGBColor) fill = String(args[0]);
      if (operation === OPS.showText) {
        const glyphs = args[0] as { unicode?: string }[];
        textColors.push({ text: glyphs.map((glyph) => glyph.unicode ?? '').join(''), fill });
      }
    });
    expect(textColors.find((item) => item.text.includes('Meri'))?.fill).toBe(foreground);
    expect(textColors.find((item) => item.text.includes('Esittelytekstin'))?.fill).toBe(foreground);
    expect(textColors.find((item) => item.text.includes('https://example.com'))?.fill).toBe(foreground);
    expect(result.text).toContain('ESITTELY Esittelytekstin kontrasti säilyy. https://example.com');
  } finally { await result.destroy(); }
});

// A glyph first loaded by ID (for example during font subsetting) can have no
// Unicode mapping in fontkit's shared cache. Reproduce that state explicitly.
it('säilyttää Harjoittelija-nimikkeen ja suosittelijan alkukirjaimet myös tyhjällä glyph-mappingilla', async () => {
  const descriptor = { fontFamily: 'CvBody', fontWeight: 700 };
  await Font.load(descriptor);
  const font = Font.getFont(descriptor).data!;
  const glyphs = [72, 84].map((point) => font.glyphForCodePoint(point));
  const mappings = glyphs.map((glyph) => [...glyph.codePoints]);
  glyphs.forEach((glyph) => { glyph.codePoints.length = 0; });
  const data = createShortCvFixture(); data.workExperience[1]!.title = 'Harjoittelija ';
  data.references[0]!.name = 'Testi Suosittelija';
  try {
    const result = await readPdf(data);
    try {
      expect(result.text).toContain('Harjoittelija');
      expect(result.text).toContain('Testi Suosittelija');
    } finally { await result.destroy(); }
  } finally { glyphs.forEach((glyph, index) => { glyph.codePoints.splice(0, glyph.codePoints.length, ...mappings[index]!); }); }
});

it.each(['comfortable', 'compact', 'tight', 'long'] as const)('kaikki näkyvät CV-tekstit säilyvät merkki merkiltä: %s', async (density) => {
  const data = density === 'long' ? createLongCvFixture() : createShortCvFixture();
  data.workExperience[1]!.title = 'Harjoittelija ';
  data.references[0]!.name = 'Hanna Åäkkönen';
  const expected = [getFullName(data.personalDetails), data.personalDetails.professionalTitle,
    [data.personalDetails.email, data.personalDetails.phone, data.personalDetails.city, data.personalDetails.linkedIn].filter(Boolean).join(' · '),
    ...getCvSections(data).flatMap((section) => [section.heading, ...(section.kind === 'entries' ? section.entries.flatMap((entry) => [entry.title, ...entry.lines, entry.paragraph])
      : section.kind === 'list' ? section.items.map((item) => item.text) : [section.text])]),
  ].join(' ').replace(/\s+/g, ' ').trim();
  const result = await readPdf(data, true, density === 'long' ? undefined : density);
  try {
    expect(result.text).toBe(expected);
    if (hasPoppler) expect(normalizeWhitespace(await extractRawText(result.bytes))).toBe(expected);
    if (density === 'compact') {
      const { createCanvas } = require('@napi-rs/canvas');
      const page = await result.document.getPage(1); const viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      await page.render({ canvas, viewport }).promise;
      await mkdir('test-results', { recursive: true });
      await writeFile('test-results/pdf-all-texts.png', canvas.toBuffer('image/png'));
      // Verify actual rendered ink at the start of both reported problem fields.
      for (const title of ['Harjoittelija', 'Hanna Åäkkönen']) {
        const item = result.pages[0]!.items.find((item) => item.str === title)!;
        expect(item).toBeDefined();
        const [x, y] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
        const pixels = canvas.getContext('2d').getImageData(Math.floor(x), Math.floor(y - item.height * 2), 7, Math.ceil(item.height * 2)).data;
        let ink = 0; for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 100 && pixels[i + 1] < 100 && pixels[i + 2] < 100) ink++;
        expect(ink, title + ' first-letter ink').toBeGreaterThan(5);
      }
    }
  } finally { await result.destroy(); }
}, 30000);

it.each(['comfortable', 'compact', 'tight'] as const)('pätevyydet ovat erillisiä tekstirivejä kielten vasemmassa linjassa: %s', async (density) => {
  const data = createShortCvFixture();
  data.certifications.push({ id: 'second-certificate', name: 'Ensiapukoulutus', issuer: '', issuedDate: '2025', expiryDate: '' });
  const result = await readPdf(data, false, density);
  try {
    const items = result.pages.flatMap((page) => page.items);
    const language = items.find((item) => item.str === 'Suomi – äidinkieli')!;
    const rows = ['Hygieniapassi – 2026', 'Ensiapukoulutus – 2025'].map((text) => items.find((item) => item.str === text)!);
    for (const row of rows) { expect(row).toBeDefined(); expect(row.transform[4]).toBeCloseTo(language.transform[4], 5); }
    expect(rows[0]!.transform[5]).toBeGreaterThan(rows[1]!.transform[5]);
    const section = result.text.slice(result.text.indexOf('KORTIT JA PÄTEVYYDET'), result.text.indexOf('SUOSITTELIJAT'));
    expect(section.trim()).toBe('KORTIT JA PÄTEVYYDET Hygieniapassi – 2026 Ensiapukoulutus – 2025');
  } finally { await result.destroy(); }
});
