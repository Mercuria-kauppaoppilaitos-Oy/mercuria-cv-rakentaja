import { act, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../App';
import logoAsset from '../../assets/mercuria-logo.svg';
import { createEmptyCv } from './cv-model';
import { CvPreview } from './CvPreview';

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('näyttää virallisen logon yläpalkissa ja jättää sen pois CV:stä', () => {
  render(<App />);
  const logo = screen.getByRole('img', { name: 'Mercuria' });
  expect(logo).toHaveAttribute('src', logoAsset);
  expect(logo.closest('header')).not.toBeNull();
  expect(screen.getByText('CV-rakentaja')).toBeVisible();
  expect(within(screen.getByRole('article')).queryByRole('img')).not.toBeInTheDocument();
});

it('säilyttää valittavan tekstin ja semanttisen rakenteen muuttamatta esimerkkitietoja dataksi', () => {
  const data = createEmptyCv();
  const { rerender } = render(<CvPreview data={data} />);
  const article = screen.getByRole('article');
  const cv = within(article);
  expect(cv.getByRole('heading', { name: 'Aino Esimerkki' })).toHaveClass('example-text');
  expect(data).toEqual(createEmptyCv());
  expect(cv.getAllByRole('heading', { level: 4 })).toHaveLength(1);
  data.personalDetails = { firstName: 'Meri', lastName: 'Virtanen', professionalTitle: 'Myyntineuvoja', email: 'meri@example.com', phone: '040 123', city: 'Vantaa', linkedIn: 'https://www.linkedin.com/in/meri' };
  rerender(<CvPreview data={data} />);
  expect(cv.getByRole('heading', { name: 'Meri Virtanen' })).not.toHaveClass('example-text');
  for (const value of Object.values(data.personalDetails).slice(2)) expect(cv.getByText(value)).toBeVisible();
  expect(article.querySelector('table, canvas, img, svg')).toBeNull();
  expect(article.querySelectorAll(':scope > section')).toHaveLength(1);
  expect(article.style.fontFamily).toBe('var(--cv-body-font)');
});

it('skaalaa saman A4-arkin käytettävään leveyteen ja vapauttaa koonseurannan', () => {
  let width = 400;
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  let resize: () => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const { unmount } = render(<CvPreview data={createEmptyCv()} />);
  const article = screen.getByRole('article');
  expect(Number(article.style.zoom)).toBeCloseTo(400 / (210 * 96 / 25.4));
  width = 1200;
  act(resize);
  expect(Number(article.style.zoom)).toBe(1);
  width = 256;
  act(resize);
  expect(Number(article.style.zoom)).toBeCloseTo(256 / (210 * 96 / 25.4));
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('säilyttää kaikki osiot ja käyttäjän sisällön luonnollisessa yksipalstaisessa tekstijärjestyksessä', () => {
  const data = createEmptyCv();
  data.summary = 'Profiiliteksti';
  data.workExperience = [{ id: 'work', title: 'Myyjä', employer: 'Kauppa', location: 'Espoo', startDate: '2024-08', endDate: '', isCurrent: true, description: 'Palvelin asiakkaita' }];
  data.education = [{ id: 'education', qualification: 'Merkonomi', institution: 'Oppilaitos', location: 'Helsinki', startDate: '2023-08', endDate: '2026-05', isCurrent: false, description: 'Liiketoiminta' }];
  data.skills = [{ id: 'skill', name: 'Myyntityö' }];
  data.digitalSkills = [{ id: 'digital', name: 'Excel', proficiency: 'Hyvä' }];
  data.languages = [{ id: 'language', name: 'Englanti', proficiency: 'Sujuva' }];
  data.certifications = [{ id: 'certificate', name: 'Hygieniapassi', issuer: 'Järjestäjä', issuedDate: '2025', expiryDate: 'Voimassa' }];
  data.references = [{ id: 'reference', name: 'Meri', title: 'Esihenkilö', organization: 'Yritys', email: 'meri@example.com', phone: '040 987' }];
  render(<CvPreview data={data} />);
  const article = screen.getByRole('article');
  const cv = within(article);
  expect(cv.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
    'Esittely', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'DIGITAIDOT JA JÄRJESTELMÄT', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT',
  ]);
  expect(article.querySelectorAll(':scope > section')).toHaveLength(8);
  expect(article.querySelector('img, svg, canvas, table')).toBeNull();
  for (const text of ['Profiiliteksti', 'Myyjä', 'Kauppa, Espoo · 08/2024–nykyhetki', 'Palvelin asiakkaita.', 'Merkonomi', 'Oppilaitos, Helsinki · 08/2023–05/2026', 'Liiketoiminta', 'Myyntityö', 'Excel – hyvä', 'Englanti – sujuva', 'Hygieniapassi – Järjestäjä – 2025 – Voimassa', 'Meri', 'Esihenkilö – Yritys', 'meri@example.com', '040 987']) {
    expect(cv.getByText(text)).toBeVisible();
  }
});

it('esittää yhteystiedot luettavana tekstinä koristeellisista erottimista riippumatta', () => {
  const data = createEmptyCv();
  Object.assign(data.personalDetails, { email: 'aino@example.com', phone: '040 111', city: 'Vantaa', linkedIn: 'https://www.linkedin.com/in/aino' });
  render(<CvPreview data={data} />);
  const contact = screen.getByRole('article').querySelector('.cv-contact')!;
  for (const text of ['aino@example.com', '040 111', 'Vantaa', 'https://www.linkedin.com/in/aino']) expect(within(contact as HTMLElement).getByText(text)).toBeVisible();
  expect(contact.querySelector('img, svg')).toBeNull();
  expect(contact.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
});
