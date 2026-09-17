import { test, expect, type Page } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import axe from 'axe-core';
const photoPath = fileURLToPath(new URL('../fixtures/photo.png', import.meta.url));
const key = 'mercuria-cv-draft-v1';
async function step(page: Page, label: string) { await page.getByRole('navigation', { name: 'CV:n vaiheet' }).getByRole('button', { name: label, exact: true }).click(); }

test('luonnos, väri ja käsitelty kuva palautuvat, poistuvat ja tyhjennys poistaa tallennukset', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Etunimi', { exact: true }).fill('Aino');
  await page.getByLabel('Sukunimi', { exact: true }).fill('Åström');
  await page.getByLabel('Ammatillinen otsikko').fill('Myyjä');
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
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
  const externalRequests: string[] = [];
  page.on('request', (request) => { if (!request.url().startsWith('http://127.0.0.1:4173') && !request.url().startsWith('data:')) externalRequests.push(request.url()); });
  await page.goto('/');
  await page.addScriptTag({ content: axe.source });
  const violations = () => page.evaluate(async () => {
    const runner = (window as unknown as { axe: typeof axe }).axe;
    return (await runner.run(document)).violations.map((issue) => ({ id: issue.id, elements: issue.nodes.map((node) => node.target) }));
  });
  await page.getByLabel('Lisää valokuva').setInputFiles(photoPath);
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
