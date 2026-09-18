import { render, screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import { createLongCvFixture } from '../../test/cv-fixture';
import { createEmptyCv } from './cv-model';
import { CvPreview } from './CvPreview';

it.each([false, true])('säilyttää yhden semanttisen sisältövirran, myös valokuvalla: %s', (photo) => {
  const data = createLongCvFixture();
  if (photo) data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA==';
  data.appearance.accentColor = '#203040';
  render(<CvPreview data={data} />);
  const article = screen.getByRole('article');
  const cv = within(article);
  expect(cv.getByRole('heading', { level: 3, name: 'Åsa-Maria Ääkkönen-Östergård Pitkänimi' })).toBeVisible();
  expect(cv.getByText(data.personalDetails.professionalTitle)).toBeVisible();
  expect(cv.getByText(data.personalDetails.email)).toBeVisible();
  expect(cv.getByText(data.personalDetails.linkedIn)).toBeVisible();
  expect(cv.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual(['Esittely', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT']);
  expect(article.querySelectorAll(':scope > section')).toHaveLength(7);
  expect(article.querySelector('canvas, table, svg')).toBeNull();
  expect(article.querySelectorAll('img')).toHaveLength(photo ? 1 : 0);
  if (photo) expect(article.querySelector('img')).toHaveAttribute('alt', '');
  expect(cv.queryByRole('img', { name: 'Mercuria' })).not.toBeInTheDocument();
  expect(cv.getAllByText('Palvelin asiakkaita. Käsittelin verkkokaupan tilauksia. Tuotin sosiaalisen median sisältöä.')).toHaveLength(8);
  expect(article.querySelector('[aria-labelledby="cv-work-title"] ul')).toBeNull();
  for (const section of article.querySelectorAll(':scope > section')) expect(section.querySelector('h4')).not.toBeNull();
});
it('piilottaa tyhjät osiot myös kuvaa ja väriä käytettäessä', () => {
  const data = createEmptyCv();
  data.appearance.photoDataUrl = 'data:image/jpeg;base64,/9j/AA==';
  data.appearance.accentColor = '#FF0000';
  render(<CvPreview data={data} />);
  expect(within(screen.getByRole('article')).getAllByRole('heading', { level: 4 })).toHaveLength(1);
});
