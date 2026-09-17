import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import axe from 'axe-core';
import { App } from '../../App';
import { selectStep } from '../../test/navigation';
import { createLongCvFixture } from '../../test/cv-fixture';
import { CvPreview } from './CvPreview';

const rules = { 'color-contrast': { enabled: false } }; // jsdom has no layout; contrast is tested in Chromium.
it.each(['Perustiedot', 'Viimeistele'])('axe-tarkistus vaiheelle %s', async (step) => {
  const user = userEvent.setup();
  const { container } = render(<App />);
  if (step !== 'Perustiedot') await selectStep(user, step);
  expect((await axe.run(container, { rules })).violations).toEqual([]);
});
it('axe-tarkistus tyhjennysdialogille', async () => {
  const user = userEvent.setup();
  render(<App />);
  await selectStep(user, 'Viimeistele');
  await user.click(screen.getByRole('button', { name: 'Tyhjennä kaikki tiedot' }));
  expect((await axe.run(screen.getByRole('dialog'), { rules })).violations).toEqual([]);
});
it('axe-tarkistus kattavalle CV-esikatselulle', async () => {
  const { container } = render(<main><h1>CV-rakentaja</h1><CvPreview data={createLongCvFixture()} /></main>);
  expect((await axe.run(container, { rules })).violations).toEqual([]);
});
