import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import axe from 'axe-core';
import { createShortCvFixture, createLongCvFixture } from '../../src/test/cv-fixture';
const photoPath = fileURLToPath(new URL('../fixtures/photo.png', import.meta.url));
const key = 'mercuria-cv-draft-v1';
async function previewBytes(page: Page) {
  await expect(page.locator('.pdf-preview')).toHaveAttribute('aria-busy', 'false', { timeout: 30000 });
  const frame = page.locator('.pdf-frame-current');
  await expect(frame).toHaveCount(1);
  const url = (await frame.getAttribute('src'))!.split('#')[0]!;
  return page.evaluate(async (src) => Array.from(new Uint8Array(await (await fetch(src)).arrayBuffer())), url);
}
async function previewText(page: Page) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(await previewBytes(page)) });
  try {
    const pdf = await task.promise; const texts: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) texts.push((await (await pdf.getPage(n)).getTextContent()).items.map((item) => 'str' in item ? item.str : '').join(' '));
    return texts.join(' ').replace(/\s+/g, ' ').trim();
  } finally { await task.destroy(); }
}

test('kuukausi ja vuosi toimivat näppäimistöllä mobiilissa ja säilyvät istunnossa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page).toHaveTitle('Mercuria | CV-rakentaja');
  await page.locator('#active-step').selectOption('2');
  await page.getByRole('button', { name: 'Lisää työkokemus' }).click();
  const month = page.getByLabel('Aloituskuukausi', { exact: true });
  const year = page.getByLabel('Aloituskuukausi: vuosi');
  await month.focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Tab');
  await expect(month).toHaveValue('01'); await expect(year).toBeFocused();
  await year.selectOption('2026');
  await expect.poll(() => page.evaluate((storageKey) => JSON.parse(sessionStorage.getItem(storageKey) ?? 'null')?.data.workExperience[0]?.startDate, key)).toBe('2026-01');
  await page.addScriptTag({ content: axe.source });
  expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.reload(); await page.locator('#active-step').selectOption('2');
  await expect(month).toHaveValue('01'); await expect(year).toHaveValue('2026');
  await year.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
  await expect(month).toHaveValue(''); await expect(year).toHaveValue('');
});

test('sivutettu esikatselu näyttää saman oikean monisivuisen PDF:n', async ({ page }) => {
  const data = createLongCvFixture();
  await page.addInitScript((cvData) => { if (window === window.top && location.origin === 'http://127.0.0.1:4173') sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 3, persistent: false, data: cvData })); }, data);
  await page.goto('/');
  const bytes = await previewBytes(page);
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  const pdf = await task.promise;
  try {
    expect(pdf.numPages).toBeGreaterThan(1);
    let text = '';
    for (let number = 1; number <= pdf.numPages; number++) text += (await (await pdf.getPage(number)).getTextContent()).items.map((item) => 'str' in item ? item.str : '').join(' ');
    expect(text).toContain(data.personalDetails.linkedIn);
    expect(text).toContain('Testi Suosittelija');
  } finally { await task.destroy(); }
  await expect(page.getByRole('button', { name: /Tekstiluonnos|Sivutettu PDF/ })).toHaveCount(0);
});
async function step(page: Page, label: string) { await page.getByRole('navigation', { name: 'CV:n vaiheet' }).getByRole('button', { name: label, exact: true }).click(); }

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`vapaaehtoinen AI-ehdotus hyväksytään oikeaan kenttään, axe ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const original = 'Avustin asiakkaita ja järjestin tuotteita.';
    const suggestion = 'Avustin asiakkaita ja huolehdin tuotteiden järjestämisestä.';
    const requests: unknown[] = [];
    await page.route('**/api/rewrite-text', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ suggestion }) });
    });
    await page.goto('/');
    await page.getByLabel('Etunimi', { exact: true }).fill('Aino');
    await page.getByLabel('Sähköposti', { exact: true }).fill('private@example.com');
    if (viewport.width < 768) await page.locator('#active-step').selectOption('2');
    else await step(page, 'Työkokemus');
    await page.getByRole('button', { name: 'Lisää työkokemus' }).click();
    await page.getByLabel('Tehtävänimike tai kokemuksen tyyppi').fill('Harjoittelija');
    await page.getByLabel('Tehtävät ja saavutukset').fill(original);
    expect(requests).toHaveLength(0);
    await page.getByRole('button', { name: 'Paranna tekoälyllä' }).click();
    await expect(page.getByRole('heading', { name: 'Tekoälyn tekstiehdotus' })).toBeFocused();
    await expect(page.getByLabel('Tehtävät ja saavutukset')).toHaveValue(original);
    await expect(page.locator('.rewrite-proposal')).toContainText(suggestion);
    expect(requests).toEqual([{ operation: 'rewrite', textType: 'workExperience', sourceText: original, jobTitle: 'Harjoittelija' }]);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations);
    expect(violations).toEqual([]);
    await page.getByRole('button', { name: 'Käytä ehdotusta' }).click();
    await expect(page.getByLabel('Tehtävät ja saavutukset')).toHaveValue(suggestion);
    await expect(page.getByRole('button', { name: 'Paranna tekoälyllä' })).toBeFocused();
    if (viewport.width < 768) await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
    expect(await previewText(page)).toContain(suggestion);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('luonnos, väri ja käsitelty kuva palautuvat istunnossa', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Etunimi', { exact: true }).fill('Aino');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Åström');
  await page.getByLabel('Osaamistasi kuvaava otsikko').fill('Myyjä');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await expect(page.getByRole('dialog', { name: 'Rajaa valokuva' })).toBeVisible();
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await expect(page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toBeVisible();
  await step(page, 'Työkokemus');
  await page.getByRole('button', { name: 'Lisää työkokemus' }).click();
  await page.getByLabel('Tehtävänimike tai kokemuksen tyyppi').fill('Työharjoittelu');
  await step(page, 'Koulutus');
  await page.getByRole('button', { name: 'Lisää koulutus' }).click();
  await page.getByLabel('Tutkinnon tai koulutuksen nimi').fill('Merkonomi');
  await step(page, 'Viimeistele');
  await page.getByLabel('HEX-väri').fill('#203040');
  expect(await previewBytes(page)).not.toHaveLength(0);
  await expect.poll(() => page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toContain('#203040');
  await page.reload();
  await expect(page.getByText('Luonnos palautettu', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Etunimi', { exact: true })).toHaveValue('Aino');
  await expect(page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toBeVisible();
  expect(await previewBytes(page)).not.toHaveLength(0);
  expect(await previewText(page)).toContain('Työharjoittelu');
  expect(await previewText(page)).toContain('Merkonomi');
  await page.getByRole('button', { name: 'Poista kuva' }).click();
  await expect(page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toHaveCount(0);
  await step(page, 'Viimeistele');
  await expect(page.getByLabel('Säilytä luonnos tällä laitteella')).toHaveCount(0);
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toBeNull();
});

test('390 px mobiilissa vaihevalinta, valokuva ja näkymävaihtaja toimivat', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await expect(page.getByRole('dialog', { name: 'Rajaa valokuva' })).toBeVisible();
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await expect(page.getByRole('button', { name: 'Poista kuva' })).toBeVisible();
  await page.getByLabel('Vaihe 1 / 7').selectOption('1');
  await page.getByRole('textbox', { name: 'Esittely', exact: true }).fill('Palvelen asiakkaita.');
  await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
  expect(await previewText(page)).toContain('Palvelen asiakkaita.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Lomake', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Esittely', exact: true })).toHaveValue('Palvelen asiakkaita.');
});

test('320 px leveydessä kaikki vaiheet ja esikatselu mahtuvat, myös 200 % zoomia vastaavassa asettelussa', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto('/');
  for (let index = 0; index < 7; index++) {
    await page.locator('#active-step').selectOption(String(index));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 720, height: 500 });
  // At 200% browser zoom, a 1440px display has a 720 CSS-pixel viewport.
  await page.getByRole('button', { name: 'Lomake', exact: true }).click();
  await expect(page.getByLabel('HEX-väri')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Chromiumin axe-tarkistus sisältää värikontrastin, kuvan, värivalitsimen ja rajausdialogin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const externalRequests: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:') && !request.url().startsWith('chrome-extension:') && !request.url().startsWith('chrome:')) externalRequests.push(request.url()); });
  await page.goto('/');
  await page.addScriptTag({ content: axe.source });
  const violations = () => page.evaluate(async () => {
    const runner = (window as unknown as { axe: typeof axe }).axe;
    return (await runner.run(document)).violations.map((issue) => ({ id: issue.id, elements: issue.nodes.map((node) => node.target) }));
  });
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await expect(page.getByRole('dialog', { name: 'Rajaa valokuva' })).toBeVisible();
  expect(await violations()).toEqual([]);
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await expect(page.getByRole('button', { name: 'Poista kuva' })).toBeVisible();
  expect(await violations()).toEqual([]);
  await step(page, 'Viimeistele');
  await page.getByLabel('HEX-väri').fill('#006FBA');
  expect(await violations()).toEqual([]);
  expect(await violations()).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('reunakohteen rajaus raahaamalla ja näppäimistöllä säilyy sekä mobiilidialogi mahtuu', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  const dialog = page.getByRole('dialog', { name: 'Rajaa valokuva' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('slider')).toHaveCount(1);
  const area = page.getByLabel('Siirrä kuvaa', { exact: true });
  const bounds = (await area.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width - 5, bounds.y + bounds.height / 2, { steps: 10 }); await page.mouse.up();
  await dialog.getByLabel('Zoomaus').fill('1.2');
  await area.focus();
  for (let i = 0; i < 100; i++) await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await expect(page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toBeVisible();
  const saved = await page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' }).getAttribute('src');
  const pixels = await page.evaluate(async (src) => {
    const image = new Image(); image.src = src!; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    return { width: image.width, height: image.height, left: Array.from(context.getImageData(2, image.height / 2, 1, 1).data) };
  }, saved);
  expect(pixels.width).toBe(pixels.height); expect(pixels.left[0]).toBeGreaterThan(200); expect(pixels.left[1]).toBeLessThan(60);
  await expect.poll(() => page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toContain(saved!);
  await page.reload(); await expect(page.getByRole('img', { name: 'Lisätyn valokuvan esikatselu' })).toHaveAttribute('src', saved!);
  for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 500 }, { width: 720, height: 500 }]) {
    await page.setViewportSize(viewport);
    await page.getByLabel('Vaihda kuva').setInputFiles(photoPath);
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!; expect(box.height).toBeLessThanOrEqual(viewport.height * .9 + 1);
    for (const name of ['Peruuta', 'Käytä kuvaa']) { const button = (await dialog.getByRole('button', { name }).boundingBox())!; expect(button.y + button.height).toBeLessThanOrEqual(viewport.height); }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Vaihda kuva' })).toBeFocused();
  }
});

test('lataa selaimessa tekstipohjaisen ATS-luettavan PDF:n paikallisesti ja vasta painettaessa', async ({ page }, testInfo) => {
  const consoleErrors: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await page.getByLabel('Etunimi', { exact: true }).fill('Päivi');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Määttä');
  await page.getByLabel('Osaamistasi kuvaava otsikko').fill('Työpäällikkö');
  await page.getByLabel('Sähköposti').fill('paivi@example.com');
  await page.getByLabel('Paikkakunta').fill('Jyväskylä');
  await page.getByLabel('LinkedIn').fill('https://www.linkedin.com/in/pdf-fixture');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await step(page, 'Esittely');
  await page.getByRole('textbox', { name: 'Esittely', exact: true }).fill('Ääkköset: ä ö å Ä Ö Å. Johdan asiakaspalvelua.');
  await step(page, 'Työkokemus');
  await page.getByRole('button', { name: 'Lisää työkokemus' }).click();
  await page.getByLabel('Tehtävänimike tai kokemuksen tyyppi').fill('Palvelupäällikkö');
  await page.getByLabel('Työnantaja').fill('Testiyritys');
  const rawSentence = 'Tehtäviini kuului organisaation työelämä- ja yritysyhteistyön toimintamallien kehittäminen sekä raportoinnin';
  await page.getByLabel('Tehtävät ja saavutukset').fill(`${rawSentence} kehittäminen oli tärkeä osa työtäni.`);
  await step(page, 'Koulutus');
  await page.getByRole('button', { name: 'Lisää koulutus' }).click();
  await page.getByLabel('Tutkinnon tai koulutuksen nimi').fill('Merkonomi');
  await step(page, 'Viimeistele');
  await page.getByLabel('HEX-väri').fill('#203040');
  const shownBytes = await previewBytes(page);
  const downloading = page.waitForEvent('download');
  const button = page.getByRole('button', { name: 'Lataa CV PDF-muodossa' });
  await button.focus(); await page.keyboard.press('Enter');
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('Paivi_Maatta_CV.pdf');
  const path = testInfo.outputPath(download.suggestedFilename()); await download.saveAs(path);
  const bytes = await readFile(path);
  expect(Array.from(bytes)).toEqual(shownBytes);
  expect(bytes.length).toBeGreaterThan(1000); expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  const pdftotext = process.env.PDFTOTEXT_BINARY || 'pdftotext';
  const probe = spawnSync(pdftotext, ['-v'], { windowsHide: true });
  if (process.env.PDFTOTEXT_BINARY) expect(probe.error).toBeUndefined();
  if (!probe.error) {
    const raw = spawnSync(pdftotext, ['-raw', '-enc', 'UTF-8', path, '-'], { encoding: 'utf8', windowsHide: true });
    expect(raw.status, raw.stderr).toBe(0);
    expect(raw.stdout).toContain(rawSentence);
  } else testInfo.annotations.push({ type: 'Poppler', description: 'pdftotext puuttuu; PDF.js tarkistetaan aina.' });
  // Also verify the PDF produced by the actual browser download, not just Node fixtures.
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(bytes) });
  const document = await task.promise;
  try {
    const text = (await (await document.getPage(1)).getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ').replace(/\s+/g, ' ');
    expect(text).toContain(rawSentence);
    let offset = 0;
    for (const expected of ['Päivi Määttä', 'Työpäällikkö', 'paivi@example.com', 'Jyväskylä', 'ESITTELY', 'Ääkköset: ä ö å Ä Ö Å', 'TYÖKOKEMUS', 'Palvelupäällikkö', 'Testiyritys', 'KOULUTUS', 'Merkonomi']) {
      const index = text.indexOf(expected, offset); expect(index).toBeGreaterThanOrEqual(offset); offset = index + expected.length;
    }
    const operators = await (await document.getPage(1)).getOperatorList();
    expect(operators.argsArray.filter((_, index) => operators.fnArray[index] === OPS.setFillRGBColor).flat()).toContain('#203040');
    expect(operators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(true);
  } finally { await task.destroy(); }
  await expect(page.getByText('PDF on valmis. Tiedoston lataus käynnistyi.')).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:') && !url.startsWith('chrome-extension:') && !url.startsWith('chrome:'))).toEqual([]);
});

test('lyhyen Olivia-luonnoksen esikatselu ja molemmat PDF-viennit säilyttävät kappaleet ja yhden sivun', async ({ page }, testInfo) => {
  const data = createShortCvFixture();
  data.appearance.photoDataUrl = `data:image/jpeg;base64,${(await readFile(fileURLToPath(new URL('../fixtures/cropped-photo.jpg', import.meta.url)))).toString('base64')}`;
  await page.addInitScript((cvData) => { if (window === window.top && location.origin === 'http://127.0.0.1:4173') sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 3, persistent: false, data: cvData })); }, data);
  await page.goto('/');
  expect(await previewText(page)).toContain('Hyllytys. Siisteys. Palvelin asiakkaita kassalla.');
  await step(page, 'Työkokemus');
  await expect(page.getByLabel('Tehtävät ja saavutukset').nth(0)).toHaveValue('Hyllytys\nSiisteys\nPalvelin asiakkaita kassalla.');
  await step(page, 'Viimeistele');
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  let previousText = '';
  for (const includePhoto of [true, false]) {
    await page.getByLabel('Sisällytä valokuva PDF:ään').setChecked(includePhoto);
    const previewBytesValue = await previewBytes(page);
    const previewTask = getDocument({ data: new Uint8Array(previewBytesValue) });
    let previewText = '';
    try {
      const document = await previewTask.promise;
      expect(document.numPages).toBe(1);
      const pdfPage = await document.getPage(1);
      previewText = (await pdfPage.getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      const operators = await pdfPage.getOperatorList();
      expect(operators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(includePhoto);
    } finally { await previewTask.destroy(); }
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
    const download = await downloading;
    const path = testInfo.outputPath(includePhoto ? 'Olivia_photo.pdf' : 'Olivia_plain.pdf'); await download.saveAs(path);
    expect(Array.from(await readFile(path))).toEqual(previewBytesValue);
    const task = getDocument({ data: new Uint8Array(await readFile(path)) });
    try {
      const document = await task.promise; expect(document.numPages).toBe(1);
      const pdfPage = await document.getPage(1);
      const text = (await pdfPage.getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
      expect(text).toBe(previewText);
      expect(text).toContain('Hyllytys. Siisteys. Palvelin asiakkaita kassalla.');
      expect(text).toContain('KIELITAITO Suomi – äidinkieli Englanti – hyvä');
      expect(text.slice(text.indexOf('TYÖKOKEMUS'), text.indexOf('KOULUTUS'))).not.toContain('•');
      if (previousText) expect(text).toBe(previousText);
      previousText = text;
      const operators = await pdfPage.getOperatorList();
      expect(operators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(includePhoto);
    } finally { await task.destroy(); }
  }
});

test('pitkät nimet ja otsikot säilyvät mobiilin PDF:ssä', async ({ page }) => {
  await page.goto('/');
  await step(page, 'Perustiedot');
  await page.getByLabel('Etunimi', { exact: true }).fill('Åsa-Maria Päivi');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Ääkkönen-Östergård Pitkänimi Esimerkkisukunimi');
  await page.getByLabel('Osaamistasi kuvaava otsikko').fill('Asiakaspalvelun ja verkkokaupan kehittämisen sekä kansainvälisen yhteistyön kokenut ammattilainen');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
  expect(await previewText(page)).toContain('Åsa-Maria Päivi');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('täysi CV ja valokuva eivät aiheuta esikatselun koon tai skaalan palautesilmukkaa', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const data = createLongCvFixture();
  await page.addInitScript((cvData) => { if (window === window.top && location.origin === 'http://127.0.0.1:4173') sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 3, persistent: false, data: cvData })); }, data);
  await page.setViewportSize({ width: 1440, height: 900 }); await page.goto('/');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await step(page, 'Työkokemus');
  await page.getByLabel('Tehtävät ja saavutukset').nth(0).fill('Palvelin asiakkaita.\nKäsittelin tilauksia ja käytin Microsoft Excel -ohjelmaa.');
  await step(page, 'Koulutus');
  await page.getByLabel('Tutkinnon tai koulutuksen nimi').nth(0).fill('Liiketoiminnan koulutus ja taloushallinto');
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    if (width === 390) await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
    await previewBytes(page);
    const frame = page.locator('.pdf-frame-current');
    await expect(frame).toBeVisible();
    const samples = await frame.evaluate(async (element) => {
      const values: { width: number; height: number; src: string | null }[] = [];
      const started = performance.now();
      while (performance.now() - started < 2000) {
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        const box = element.getBoundingClientRect();
        values.push({ width: box.width, height: box.height, src: element.getAttribute('src') });
      }
      return values;
    });
    for (const dimension of ['width', 'height'] as const) {
      const values = samples.map((sample) => sample[dimension]);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThan(.5);
    }
    expect(new Set(samples.map((sample) => sample.src)).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  expect(errors).toEqual([]);
});

for (const width of [1440, 390]) {
  test('Aloita alusta tyhjentää kaiken ja säilyy välittömässä päivityksessä ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    await page.getByLabel('Etunimi', { exact: true }).fill('Poistettava');
    await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
    await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
    await expect(page.getByRole('button', { name: 'Poista kuva', exact: true })).toBeVisible();
    if (width < 768) await page.locator('#active-step').selectOption('6'); else await step(page, 'Viimeistele');
    await page.getByLabel('HEX-väri').fill('#203040');
    await page.getByLabel('Sisällytä valokuva PDF:ään').uncheck();
    await page.getByRole('button', { name: 'Aloita alusta', exact: true }).click();
    await page.getByRole('button', { name: 'Oletko varma?', exact: true }).click();
    await expect(page.getByLabel('Etunimi', { exact: true })).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Poista kuva' })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Etunimi', { exact: true })).toHaveValue('');
    if (width < 768) await page.locator('#active-step').selectOption('6'); else await step(page, 'Viimeistele');
    await expect(page.getByLabel('HEX-väri')).toHaveValue('#E9E1D8');
    await expect(page.getByLabel('Työpaikkailmoitus', { exact: true })).toHaveCount(0);
    expect(await previewText(page)).toBe('');
  });
}

for (const width of [1440, 390]) {
  test('jatkuva esikatselu säilyy ja PDF-URLit vapautuvat muokatessa ' + width + 'px', async ({ page }) => {
    await page.addInitScript(() => {
      if (window !== window.top) return;
      const create = URL.createObjectURL.bind(URL); const revoke = URL.revokeObjectURL.bind(URL);
      const live = new Set<string>(); let created = 0;
      Object.assign(window, { pdfUrls: { live, created: () => created } });
      URL.createObjectURL = (blob) => { const url = create(blob); if (blob instanceof Blob && blob.type === 'application/pdf') { live.add(url); created++; } return url; };
      URL.revokeObjectURL = (url) => { live.delete(url); revoke(url); };
    });
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    const initial = await previewBytes(page);
    const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({ data: new Uint8Array(initial) });
    try {
      const document = await task.promise;
      const operators = await (await document.getPage(1)).getOperatorList();
      expect(operators.argsArray.filter((_, index) => operators.fnArray[index] === OPS.setFillRGBColor).flat()).toContain('#e9e1d8');
    } finally { await task.destroy(); }
    await expect(page.getByRole('button', { name: /Tekstiluonnos|Sivutettu PDF/ })).toHaveCount(0);
    for (let revision = 0; revision < 4; revision++) {
      const old = await page.locator('.pdf-frame-current').getAttribute('src');
      await page.getByLabel('Etunimi', { exact: true }).fill('Muutos ' + revision);
      expect(await page.locator('.pdf-frame-current').getAttribute('src')).toBe(old);
      await expect(page.locator('.pdf-preview')).toHaveAttribute('aria-busy', 'true');
      expect(await previewText(page)).toContain('Muutos ' + revision);
      await expect(page.locator('.pdf-frame-current')).not.toHaveAttribute('src', old!);
      expect(await page.evaluate(() => (window as unknown as { pdfUrls: { live: Set<string> } }).pdfUrls.live.size)).toBe(1);
    }
    const count = await page.evaluate(() => (window as unknown as { pdfUrls: { created: () => number } }).pdfUrls.created());
    expect(count).toBe(5);
    if (width < 768) await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
    await expect(page.getByTitle('CV:n PDF-esikatselu')).toBeVisible();
    await page.addScriptTag({ content: axe.source });
    expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations)).toEqual([]);
    await page.screenshot({ path: test.info().outputPath('continuous-preview.png'), fullPage: true });
  });
}

for (const width of [1440, 1024, 390, 320]) {
  test('päivämäärien tasaus, vuosirajat ja viimeistely ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    const currentYear = await page.evaluate(() => new Date().getFullYear());
    for (const [index, label, add] of [[2, 'Työkokemus', 'Lisää työkokemus'], [3, 'Koulutus', 'Lisää koulutus']] as const) {
      if (width < 768) await page.locator('#active-step').selectOption(String(index)); else await step(page, label);
      await page.getByRole('button', { name: add }).click();
      const groups = page.locator('.month-picker');
      const boxes = await groups.evaluateAll((elements) => elements.map((element) => [...element.children].map((child) => { const box = child.getBoundingClientRect(); return { y: box.y, height: box.height }; })));
      for (const controls of boxes) for (const box of controls) { expect(Math.abs(box.y - controls[0]!.y)).toBeLessThanOrEqual(2); expect(Math.abs(box.height - controls[0]!.height)).toBeLessThanOrEqual(2); }
      if (width >= 1280) expect(Math.abs(boxes[0]![0]!.y - boxes[1]![0]!.y)).toBeLessThanOrEqual(2);
      const years = await page.getByLabel('Aloituskuukausi: vuosi').locator('option').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
      expect(years[0]).toBe(String(currentYear + 5)); expect(years.at(-1)).toBe('1990');
      expect(years).toEqual([...years].sort((a, b) => Number(b) - Number(a)));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    if (width < 768) await page.locator('#active-step').selectOption('6'); else await step(page, 'Viimeistele');
    await expect(page.getByRole('heading', { name: 'Vertaa CV:tä työpaikkailmoitukseen' })).toHaveCount(0);
    await expect(page.getByLabel('Työpaikkailmoitus')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Analysoi ilmoitus' })).toHaveCount(0);
    await page.addScriptTag({ content: axe.source });
    expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations)).toEqual([]);
  });
}
for (const width of [1440, 390]) {
  test('AI:n Esittely-onnistuminen ja virheet säilyttävät alkuperäisen ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/');
    if (width < 768) await page.locator('#active-step').selectOption('1'); else await step(page, 'Esittely');
    const original = 'Olen opiskelija ja opettelen asiakaspalvelua.';
    const field = page.getByRole('textbox', { name: 'Esittely', exact: true }); await field.fill(original);
    let mode: number | 'network' = 503; let calls = 0;
    await page.route('**/api/rewrite-text', async (route) => {
      calls++; expect(route.request().postDataJSON()).toEqual({ operation: 'rewrite', textType: 'profile', sourceText: original });
      if (mode === 'network') await route.abort();
      else await route.fulfill({ status: mode, contentType: 'application/json', body: JSON.stringify(mode === 200 ? { suggestion: 'Opiskelen liiketoimintaa ja harjoittelen asiakaspalvelua.' } : { error: 'Internal secret must not appear' }) });
    });
    for (const status of [503, 429, 504, 'network'] as const) {
      mode = status; const before = calls;
      await page.getByRole('button', { name: 'Paranna tekoälyllä' }).click();
      await expect(page.locator('.rewrite-error')).not.toBeEmpty();
      await expect(field).toHaveValue(original); expect(calls).toBe(before + 1);
      await expect(page.getByText('Internal secret must not appear')).toHaveCount(0);
    }
    mode = 200; await page.getByRole('button', { name: 'Paranna tekoälyllä' }).click();
    await expect(page.getByRole('heading', { name: 'Tekoälyn tekstiehdotus' })).toBeFocused();
    await page.getByRole('button', { name: 'Käytä ehdotusta' }).click();
    await expect(field).toHaveValue('Opiskelen liiketoimintaa ja harjoittelen asiakaspalvelua.');
    expect(await previewText(page)).toContain('Opiskelen liiketoimintaa');
  });
}

for (const width of [1440, 390]) {
  test('osaamisehdotukset, välimuisti, vahvistettu nollaus ja tietosuoja ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    const data = createShortCvFixture(); data.skills = [{ id: 'existing', name: ' ASIAKASPALVELU ' }];
    await page.addInitScript(({ key, data }) => { if (window !== window.top) return; if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify({ schemaVersion: 4, persistent: false, data })); }, { key, data });
    const requests: unknown[] = [];
    await page.route('**/api/rewrite-text', async (route) => {
      requests.push(route.request().postDataJSON());
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ skills: ['Asiakaspalvelu', 'Hyllytys', 'Tuotteiden esillepano ja myymälän siisteydestä huolehtiminen'] }) });
    });
    const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
    const go = async (index: number, label: string) => { if (width < 768) await page.locator('#active-step').selectOption(String(index)); else await step(page, label); };
    await page.goto('/'); await expect(page.getByText('Tietosuoja ja luonnoksen säilyminen', { exact: true })).toHaveCount(0);
    await go(4, 'Osaaminen'); expect(requests).toHaveLength(0);
    const button = page.getByRole('button', { name: 'Ehdota tekoälyllä' });
    await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await button.focus(); await page.keyboard.press('Enter');
    const panel = page.getByRole('region', { name: 'Osaamisehdotukset' }); await expect(panel).toBeVisible(); expect(requests).toHaveLength(1);
    expect(requests[0]).toEqual({ operation: 'suggest-skills', source: {
      professionalTitle: data.personalDetails.professionalTitle, summary: data.summary,
      workExperience: data.workExperience.map(({ title, description }) => ({ title, description })),
      education: data.education.map(({ qualification, description }) => ({ qualification, description })),
    } });
    expect(await previewText(page)).not.toContain('Tuotteiden esillepano ja myymälän siisteydestä huolehtiminen');
    await expect(panel.getByRole('button', { name: /Asiakaspalvelu/ })).toHaveAttribute('aria-pressed', 'true');
    await panel.getByRole('button', { name: /Hyllytys/ }).dblclick();
    await expect(page.getByRole('textbox', { name: 'Osaaminen', exact: true })).toHaveCount(2);
    await page.screenshot({ path: 'test-results/skill-suggestions-' + width + '.png' });
    await panel.getByRole('button', { name: 'Lisää kaikki' }).click();
    await expect(page.getByRole('textbox', { name: 'Osaaminen', exact: true })).toHaveCount(3);
    expect(await previewText(page)).toContain('Tuotteiden esillepano ja myymälän siisteydestä huolehtiminen');
    const url = await page.locator('.pdf-frame-current').getAttribute('src'); await page.waitForTimeout(1200);
    await expect(page.locator('.pdf-frame-current')).toHaveAttribute('src', url!);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.addScriptTag({ content: axe.source });
    expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations)).toEqual([]);
    await go(1, 'Esittely'); await expect(page.getByRole('button', { name: 'Paranna tekoälyllä' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Jalosta tekoälyllä' })).toHaveCount(0);
    await go(4, 'Osaaminen'); await expect(panel).toBeVisible(); await button.click(); expect(requests).toHaveLength(1);
    await page.reload(); await go(4, 'Osaaminen'); await expect(panel).toBeVisible(); expect(requests).toHaveLength(1);
    await go(6, 'Viimeistele'); const privacy = page.locator('.privacy-details');
    await expect(privacy).not.toHaveAttribute('open'); await privacy.locator('summary').focus(); await page.keyboard.press('Enter'); await expect(privacy).toHaveAttribute('open', '');
    await expect(privacy).toContainText('OpenAI');
    await page.getByRole('button', { name: 'Aloita alusta', exact: true }).click(); await expect(page.getByRole('button', { name: 'Oletko varma?' })).toBeFocused();
    await page.keyboard.press('Escape'); await expect(page.getByRole('button', { name: 'Aloita alusta', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Aloita alusta', exact: true }).click(); await page.getByRole('button', { name: 'Oletko varma?' }).click();
    await expect(page.getByRole('heading', { name: 'Perustiedot', exact: true })).toBeFocused();
    expect(await page.evaluate(() => sessionStorage.getItem('mercuria-cv-skills-v1'))).toBeNull();
    await go(4, 'Osaaminen'); await button.click(); await expect(page.getByText('Lisää ensin sisältöä esittelyyn, työkokemukseen tai koulutukseen.')).toBeVisible(); expect(requests).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test('Harjoittelija ja suosittelijan koko nimi säilyvät toistuvissa PDF-päivityksissä ja latauksessa', async ({ page }) => {
  const data = createShortCvFixture(); data.workExperience[1]!.title = 'Harjoittelija '; data.references[0]!.name = 'Hanna Åäkkönen';
  await page.addInitScript(({ key, data }) => sessionStorage.setItem(key, JSON.stringify({ schemaVersion: 4, persistent: false, data })), { key, data });
  await page.goto('/'); await step(page, 'Työkokemus');
  const title = page.getByRole('group', { name: 'Työkokemus 2', exact: true }).getByLabel('Tehtävänimike tai kokemuksen tyyppi');
  for (const text of ['H', 'Harjoittelija ', 'Taloushallinnon harjoittelija', 'Harjoittelija']) {
    await title.fill(text); const pdf = await previewText(page); expect(pdf).toContain(text.trim()); expect(pdf).toContain('Hanna Åäkkönen');
  }
  await step(page, 'Lisäosiot'); await page.getByRole('group', { name: 'Suosittelija 1', exact: true }).getByLabel('Nimi', { exact: true }).fill('Testi Suosittelija');
  expect(await previewText(page)).toContain('Testi Suosittelija');
  await step(page, 'Viimeistele'); const bytes = await previewBytes(page);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
  expect(Array.from(await readFile((await (await download).path())!))).toEqual(bytes);
});

test('työkokemusten esitysjärjestys säilyy esikatselussa ja latauksessa muuttamatta luonnosta', async ({ page }) => {
  const data = createShortCvFixture();
  data.workExperience.reverse();
  data.workExperience.push({ ...data.workExperience[0]!, id: 'current-work', title: 'Nykyinen tehtävä', startDate: '2025-01', endDate: '', isCurrent: true });
  await page.addInitScript(({ key, data }) => { if (window === window.top) sessionStorage.setItem(key, JSON.stringify({ schemaVersion: 4, persistent: false, data })); }, { key, data });
  await page.goto('/'); await step(page, 'Työkokemus');
  const titles = page.getByLabel('Tehtävänimike tai kokemuksen tyyppi');
  for (const [index, entry] of data.workExperience.entries()) await expect(titles.nth(index)).toHaveValue(entry.title);
  const text = await previewText(page);
  expect(text.indexOf('Nykyinen tehtävä')).toBeLessThan(text.indexOf('Myymäläharjoittelija'));
  expect(text.indexOf('Myymäläharjoittelija')).toBeLessThan(text.indexOf('Kesätyöntekijä'));
  await step(page, 'Viimeistele');
  const bytes = await previewBytes(page);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
  expect(Array.from(await readFile((await (await download).path())!))).toEqual(bytes);
  expect(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!).data.workExperience, key)).toEqual(data.workExperience);
});

test('pätevyydet ilman luettelomerkkejä samassa esikatselun ja latauksen PDF:ssä', async ({ page }) => {
  const data = createShortCvFixture();
  data.certifications.push({ id: 'second-certificate', name: 'Ensiapukoulutus', issuer: '', issuedDate: '2025', expiryDate: '' });
  await page.addInitScript(({ key, data }) => { if (window === window.top) sessionStorage.setItem(key, JSON.stringify({ schemaVersion: 4, persistent: false, data })); }, { key, data });
  await page.goto('/'); await step(page, 'Viimeistele');
  const text = await previewText(page);
  expect(text.slice(text.indexOf('KORTIT JA PÄTEVYYDET'), text.indexOf('SUOSITTELIJAT')).trim()).toBe('KORTIT JA PÄTEVYYDET Hygieniapassi – 2026 Ensiapukoulutus – 2025');
  const bytes = await previewBytes(page);
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
  expect(Array.from(await readFile((await (await download).path())!))).toEqual(bytes);
});
