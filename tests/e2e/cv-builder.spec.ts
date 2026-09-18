import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import { createShortCvFixture, createLongCvFixture } from '../../src/test/cv-fixture';
const photoPath = fileURLToPath(new URL('../fixtures/photo.png', import.meta.url));
const key = 'mercuria-cv-draft-v1';
async function step(page: Page, label: string) { await page.getByRole('navigation', { name: 'CV:n vaiheet' }).getByRole('button', { name: label, exact: true }).click(); }

test('luonnos, väri ja käsitelty kuva palautuvat, poistuvat ja tyhjennys poistaa tallennukset', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Etunimi', { exact: true }).fill('Aino');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Åström');
  await page.getByLabel('Ammatillinen otsikko').fill('Myyjä');
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
  await expect(page.locator('.cv-masthead')).toHaveCSS('background-color', 'rgb(32, 48, 64)');
  await expect.poll(() => page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toContain('#203040');
  await page.reload();
  await expect(page.getByRole('status')).toHaveText('Luonnos palautettu');
  await expect(page.getByLabel('Etunimi', { exact: true })).toHaveValue('Aino');
  await expect(page.locator('.cv-page .cv-photo-frame img')).toHaveAttribute('alt', '');
  await expect(page.locator('.cv-masthead')).toHaveCSS('background-color', 'rgb(32, 48, 64)');
  await expect(page.getByRole('article').getByRole('heading', { name: 'Työharjoittelu' })).toBeVisible();
  await expect(page.getByRole('article').getByRole('heading', { name: 'Merkonomi' })).toBeVisible();
  await page.getByRole('button', { name: 'Poista kuva' }).click();
  await expect(page.locator('.cv-page img')).toHaveCount(0);
  await step(page, 'Viimeistele');
  await page.getByLabel('Säilytä luonnos tällä laitteella').check();
  await expect.poll(() => page.evaluate((storageKey) => localStorage.getItem(storageKey), key)).toContain('#203040');
  expect(await page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toBeNull();
  await page.reload();
  await step(page, 'Viimeistele');
  await expect(page.getByLabel('Säilytä luonnos tällä laitteella')).toBeChecked();
  await page.getByRole('button', { name: 'Tyhjennä kaikki tiedot' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Peruuta' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Vahvista tyhjennys' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Tyhjennä kaikki tiedot' })).toBeFocused();
  await page.getByRole('button', { name: 'Tyhjennä kaikki tiedot' }).click();
  await page.getByRole('button', { name: 'Vahvista tyhjennys' }).click();
  await expect(page.getByRole('button', { name: 'Perustiedot', exact: true })).toHaveAttribute('aria-current', 'step');
  await expect(page.getByLabel('Etunimi', { exact: true })).toHaveValue('');
  await expect(page.locator('.cv-masthead')).toHaveCSS('background-color', 'rgb(233, 225, 216)');
  await page.waitForTimeout(600);
  expect(await page.evaluate((storageKey) => [localStorage.getItem(storageKey), sessionStorage.getItem(storageKey)], key)).toEqual([null, null]);
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
  await expect(page.getByRole('article')).toBeVisible();
  await expect(page.locator('.cv-page img')).toBeVisible();
  await expect(page.getByRole('article').getByText('Palvelen asiakkaita.')).toBeVisible();
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

test('Chromiumin axe-tarkistus sisältää värikontrastin, kuvan, värivalitsimen, tallennuksen ja dialogin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const externalRequests: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) externalRequests.push(request.url()); });
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
  await page.getByLabel('Säilytä luonnos tällä laitteella').check();
  expect(await violations()).toEqual([]);
  await page.getByRole('button', { name: 'Tyhjennä kaikki tiedot' }).click();
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
  await expect(page.locator('.cv-page img')).toBeVisible();
  const saved = await page.locator('.cv-page img').getAttribute('src');
  const pixels = await page.evaluate(async (src) => {
    const image = new Image(); image.src = src!; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    return { width: image.width, height: image.height, left: Array.from(context.getImageData(2, image.height / 2, 1, 1).data) };
  }, saved);
  expect(pixels.width).toBe(pixels.height); expect(pixels.left[0]).toBeGreaterThan(200); expect(pixels.left[1]).toBeLessThan(60);
  await expect.poll(() => page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toContain(saved!);
  await page.reload(); await expect(page.locator('.cv-page img')).toHaveAttribute('src', saved!);
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
  await page.getByLabel('Ammatillinen otsikko').fill('Työpäällikkö');
  const plainHeight = await page.locator('.cv-masthead').evaluate((element) => parseFloat(getComputedStyle(element).height));
  expect(plainHeight).toBeCloseTo(31 * 96 / 25.4, 0);
  await page.getByLabel('Sähköposti').fill('paivi@example.com');
  await page.getByLabel('Paikkakunta').fill('Jyväskylä');
  await page.getByLabel('LinkedIn').fill('https://www.linkedin.com/in/pdf-fixture');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
  await page.getByRole('button', { name: 'Käytä kuvaa' }).click();
  await step(page, 'Esittely');
  const photoHeight = await page.locator('.cv-masthead').evaluate((element) => parseFloat(getComputedStyle(element).height));
  expect(photoHeight).toBeCloseTo(38 * 96 / 25.4, 0);
  await page.getByRole('textbox', { name: 'Esittely', exact: true }).fill('Ääkköset: ä ö å Ä Ö Å. Johdan asiakaspalvelua.');
  await step(page, 'Työkokemus');
  await page.getByRole('button', { name: 'Lisää työkokemus' }).click();
  await page.getByLabel('Tehtävänimike tai kokemuksen tyyppi').fill('Palvelupäällikkö');
  await page.getByLabel('Työnantaja').fill('Testiyritys');
  await step(page, 'Koulutus');
  await page.getByRole('button', { name: 'Lisää koulutus' }).click();
  await page.getByLabel('Tutkinnon tai koulutuksen nimi').fill('Merkonomi');
  await step(page, 'Viimeistele');
  await page.getByLabel('HEX-väri').fill('#203040');
  expect(requests.some((url) => /create-cv-pdf|react-pdf.*renderer|pdfkit/.test(url))).toBe(false);
  const downloading = page.waitForEvent('download');
  const button = page.getByRole('button', { name: 'Lataa CV PDF-muodossa' });
  await button.focus(); await page.keyboard.press('Enter');
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('Paivi_Maatta_CV.pdf');
  const path = testInfo.outputPath(download.suggestedFilename()); await download.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.length).toBeGreaterThan(1000); expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  // Also verify the PDF produced by the actual browser download, not just Node fixtures.
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(bytes) });
  const document = await task.promise;
  try {
    const text = (await (await document.getPage(1)).getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ').replace(/\s+/g, ' ');
    let offset = 0;
    for (const expected of ['Päivi Määttä', 'Työpäällikkö', 'paivi@example.com', 'Jyväskylä', 'Esittely', 'Ääkköset: ä ö å Ä Ö Å', 'TYÖKOKEMUS', 'Palvelupäällikkö', 'Testiyritys', 'KOULUTUS', 'Merkonomi']) {
      const index = text.indexOf(expected, offset); expect(index).toBeGreaterThanOrEqual(offset); offset = index + expected.length;
    }
    const operators = await (await document.getPage(1)).getOperatorList();
    expect(operators.fnArray.some((operation) => [OPS.paintImageXObject, OPS.paintInlineImageXObject].includes(operation))).toBe(true);
  } finally { await task.destroy(); }
  await expect(page.getByRole('status')).toContainText('PDF on valmis');
  expect(consoleErrors).toEqual([]);
  expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:'))).toEqual([]);
});

test('paikallinen ATS-vertailu lisää vain vahvistetun taidon ja PDF säilyttää sen muokkauksen jälkeen', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByLabel('Etunimi', { exact: true }).fill('Päivi');
  await step(page, 'Osaaminen');
  await page.getByRole('button', { name: 'Lisää osaaminen', exact: true }).click();
  await page.getByLabel('Osaaminen', { exact: true }).fill('Microsoft Excel');
  await step(page, 'Viimeistele');
  await page.getByLabel('Työpaikkailmoitus', { exact: true }).fill('Edellytämme Excel ja CRM osaamista. Toivomme ERP. Tarjoamme ILMOITUSSALAISUUS.');
  await page.getByRole('button', { name: 'Analysoi ilmoitus' }).click();
  await expect(page.getByRole('heading', { name: 'Ilmoitusvertailun tulokset' })).toBeFocused();
  await expect(page.getByRole('region', { name: 'Löytyy CV:stä', exact: true }).getByRole('heading', { name: 'Excel', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Lisää ehdotus CV:hen: CRM', exact: true }).click();
  const add = page.getByRole('button', { name: 'Lisää vahvistettu taito: CRM', exact: true });
  await expect(add).toBeDisabled();
  await page.getByLabel('Vahvistan, että tämä vastaa omaa osaamistani tai kokemustani.').check();
  await add.click();
  await expect(page.getByRole('region', { name: 'Löytyy CV:stä', exact: true }).getByRole('heading', { name: 'CRM', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).toContain('CRM');
  expect(await page.evaluate((storageKey) => sessionStorage.getItem(storageKey), key)).not.toContain('ILMOITUSSALAISUUS');
  await step(page, 'Osaaminen');
  await expect(page.getByLabel('Osaaminen', { exact: true }).nth(0)).toHaveValue('Microsoft Excel');
  await expect(page.getByLabel('Osaaminen', { exact: true }).nth(1)).toHaveValue('CRM');
  await step(page, 'Viimeistele');
  await expect(page.getByLabel('Työpaikkailmoitus', { exact: true })).toHaveValue('');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
  const download = await downloading; const path = testInfo.outputPath('approved.pdf'); await download.saveAs(path);
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({ data: new Uint8Array(await readFile(path)) });
  try {
    const document = await task.promise;
    let text = '';
    for (let number = 1; number <= document.numPages; number++) text += (await (await document.getPage(number)).getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ');
    expect(text).toContain('Microsoft Excel'); expect(text).toContain('CRM');
    expect(text.replace(/\s+/g, ' ').trim()).toBe('Päivi OSAAMINEN Microsoft Excel CRM');
    expect(text).not.toMatch(/ERP|ILMOITUSSALAISUUS|Analysoi|Vahvistan|Tarkista tai täydennä/);
  } finally { await task.destroy(); }
});

test('lyhyen Olivia-luonnoksen HTML ja molemmat PDF-viennit säilyttävät kappaleet ja yhden sivun', async ({ page }, testInfo) => {
  const data = createShortCvFixture();
  data.appearance.photoDataUrl = `data:image/jpeg;base64,${(await readFile(fileURLToPath(new URL('../fixtures/cropped-photo.jpg', import.meta.url)))).toString('base64')}`;
  await page.addInitScript((cvData) => sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 3, persistent: false, data: cvData })), data);
  await page.goto('/');
  const work = page.getByRole('region', { name: 'TYÖKOKEMUS' });
  await expect(work.getByText('Esimerkkikauppa · 09/2026–11/2026', { exact: true })).toBeVisible();
  await expect(work.getByText('Hyllytys. Siisteys. Palvelin asiakkaita kassalla.', { exact: true })).toBeVisible();
  await expect(work.getByRole('list')).toHaveCount(0);
  await step(page, 'Työkokemus');
  await expect(page.getByLabel('Tehtävät ja saavutukset').nth(0)).toHaveValue('Hyllytys\nSiisteys\nPalvelin asiakkaita kassalla.');
  await step(page, 'Viimeistele');
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  let previousText = '';
  for (const includePhoto of [true, false]) {
    await page.getByLabel('Sisällytä valokuva PDF:ään').setChecked(includePhoto);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Lataa CV PDF-muodossa' }).click();
    const download = await downloading;
    const path = testInfo.outputPath(includePhoto ? 'Olivia_photo.pdf' : 'Olivia_plain.pdf'); await download.saveAs(path);
    const task = getDocument({ data: new Uint8Array(await readFile(path)) });
    try {
      const document = await task.promise; expect(document.numPages).toBe(1);
      const pdfPage = await document.getPage(1);
      const text = (await pdfPage.getTextContent()).items.filter((item) => 'str' in item).map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
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

test('ATS-tulokset ja pitkät ilmoitukset ovat saavutettavia myös kapeassa asettelussa', async ({ page }) => {
  await page.goto('/'); await step(page, 'Viimeistele');
  await page.getByLabel('Työpaikkailmoitus', { exact: true }).fill('Edellytämme Excel ja CRM osaamista. Toivomme asiakaspalvelua. Tarjoamme ' + 'pitkä ilmoitus '.repeat(2000));
  await page.getByRole('button', { name: 'Analysoi ilmoitus' }).click();
  await page.addScriptTag({ content: axe.source });
  expect(await page.evaluate(async () => (await (window as unknown as { axe: typeof axe }).axe.run(document)).violations.map((issue) => issue.id))).toEqual([]);
  for (const width of [320, 720]) {
    await page.setViewportSize({ width, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await step(page, 'Perustiedot');
  await page.getByLabel('Etunimi', { exact: true }).fill('Åsa-Maria Päivi');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Ääkkönen-Östergård Pitkänimi Esimerkkisukunimi');
  await page.getByLabel('Ammatillinen otsikko').fill('Asiakaspalvelun ja verkkokaupan kehittämisen sekä kansainvälisen yhteistyön kokenut ammattilainen');
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole('button', { name: 'Esikatselu', exact: true }).click();
  await expect(page.locator('.cv-name')).toContainText('Åsa-Maria Päivi');
  expect(await page.locator('.cv-masthead').evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('täysi CV ja valokuva eivät aiheuta esikatselun koon tai skaalan palautesilmukkaa', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const data = createLongCvFixture();
  await page.addInitScript((cvData) => sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 3, persistent: false, data: cvData })), data);
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
    await expect(page.getByRole('article')).toBeVisible();
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll<HTMLImageElement>('.cv-page img')].map((image) => image.decode())); });
    if (width === 1440) {
      // Put the panel at the overflow threshold. Without a reserved scrollbar,
      // removing the bar increases scale enough to make it appear again.
      await page.locator('.preview-column').evaluate((element) => {
        const panel = element as HTMLElement;
        const article = panel.querySelector('.cv-page')!;
        const viewport = panel.querySelector('.cv-sheet-viewport') as HTMLElement;
        const style = getComputedStyle(panel);
        const gutter = panel.offsetWidth - panel.clientWidth - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
        const height = article.getBoundingClientRect().height;
        const outside = panel.querySelector('.preview')!.getBoundingClientRect().height - height + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        panel.style.height = `${outside + height * (1 + gutter / (2 * viewport.clientWidth))}px`;
        panel.style.alignSelf = 'start';
      });
    }
    const samples = await page.locator('.cv-page').evaluate(async (element) => {
      const values: { width: number; height: number; scale: number }[] = [];
      const started = performance.now();
      while (performance.now() - started < 2000) {
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        const box = element.getBoundingClientRect();
        values.push({ width: box.width, height: box.height, scale: Number(getComputedStyle(element).zoom) });
      }
      return values;
    });
    for (const key of ['width', 'height', 'scale'] as const) {
      const values = samples.map((sample) => sample[key]);
      expect(Math.max(...values) - Math.min(...values), `${width}px ${key}`).toBeLessThan(key === 'scale' ? 0.001 : 0.5);
    }
    await page.locator('.preview-column').evaluate((element) => { (element as HTMLElement).style.height = ''; (element as HTMLElement).style.alignSelf = ''; });
  }
  expect(errors).toEqual([]);
});
