import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { App } from '../../App';
import { selectStep } from '../../test/navigation';
import { createLongCvFixture } from '../../test/cv-fixture';
import { CvPreview } from './CvPreview';
import { CvPdfProvider } from './pdf/CvPdfProvider';
vi.mock('./pdf/create-cv-pdf', () => ({ generateCvPdf: () => new Promise(() => {}) }));

const rules = { 'color-contrast': { enabled: false } }; // jsdom has no layout; contrast is tested in Chromium.
it.each(['Perustiedot', 'Viimeistele'])('axe-tarkistus vaiheelle %s', async (step) => {
  const user = userEvent.setup();
  const { container } = render(<App />);
  if (step !== 'Perustiedot') await selectStep(user, step);
  expect((await axe.run(container, { rules })).violations).toEqual([]);
});

it('axe-tarkistus kattavalle CV-esikatselulle', async () => {
  const { container } = render(<main><h1>CV-rakentaja</h1><CvPdfProvider data={createLongCvFixture()} includePhoto={true}><CvPreview /></CvPdfProvider></main>);
  expect((await axe.run(container, { rules })).violations).toEqual([]);
});
