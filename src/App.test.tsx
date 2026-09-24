import './test/pdf-input-probe';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { selectStep } from './test/navigation';

describe('CV-rakentaja', () => {
  it('näyttää keskeiset otsikot ja tietosuojatiedon', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('img', { name: 'Mercuria' })).toBeVisible();
    expect(screen.getByText('CV-rakentaja')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Tee osaamisesi näkyväksi.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Muokkaa tietojasi' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'CV-esikatselu' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Perustiedot' })).toBeVisible();
    await selectStep(user, 'Esittely');
    expect(screen.getByRole('group', { name: 'Esittelyteksti' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'ESITTELY', level: 4 })).toBeNull();
    expect(screen.getByText('Luo muutamassa minuutissa CV, jonka rekrytointijärjestelmät ja tekoäly pystyvät lukemaan.')).toBeVisible();
  });

  it('päivittää kaikki seitsemän perustietokenttää esikatseluun ilman lähetystä', async () => {
    const user = userEvent.setup();
    render(<App />);
    const values = [
      ['Etunimi', 'Meri'], ['Sukunimi', 'Virtanen'], ['Osaamistasi kuvaava otsikko', 'Myyntineuvoja'],
      ['Sähköposti', 'meri@example.com'], ['Puhelinnumero', '+358 40 987 6543'],
      ['LinkedIn', 'https://www.linkedin.com/in/meri-virtanen'],
      ['Esittely', 'Autan asiakkaita löytämään sopivat ratkaisut.\nOpin mielelläni uutta.'],
    ] as const;
    const preview = within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' }));
    for (const [label, value] of values) {
      if (label === 'Esittely') await selectStep(user, 'Esittely');
      await user.click(screen.getByRole('textbox', { name: label }));
      await user.paste(value);
      if (label === 'Etunimi' || label === 'Sukunimi') {
        expect(preview.getByRole('heading', { name: label === 'Etunimi' ? 'Meri' : 'Meri Virtanen' })).toBeVisible();
      } else {
        expect(preview.getByText(value.replace('\n', ' '))).toBeVisible();
      }
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('ei lisää esimerkkitietoja tyhjään PDF-syötteeseen', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const input of screen.getAllByRole('textbox')) expect(input).toHaveValue('');
    const firstName = screen.getByRole('textbox', { name: 'Etunimi' });
    expect(screen.queryByRole('heading', { name: 'Aino Esimerkki' })).toBeNull();
    await user.type(firstName, 'Meri');
    expect(screen.queryByRole('heading', { name: 'Aino Esimerkki' })).not.toBeInTheDocument();
    await user.clear(firstName);
    expect(firstName).toHaveValue('');
    expect(screen.queryByRole('heading', { name: 'Meri' })).toBeNull();
  });

  it('kytkee sähköpostin ja LinkedInin virheet kenttiin ja poistaa ne korjattaessa', async () => {
    const user = userEvent.setup();
    render(<App />);
    const email = screen.getByRole('textbox', { name: 'Sähköposti' });
    await user.type(email, 'virhe');
    expect(await screen.findByText('Tarkista sähköpostiosoitteen muoto.')).toBeVisible();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Tarkista sähköpostiosoitteen muoto.');
    await user.clear(email);
    await user.type(email, 'meri@example.com');
    expect(email).toHaveAttribute('aria-invalid', 'false');
    const linkedIn = screen.getByRole('textbox', { name: 'LinkedIn' });
    await user.type(linkedIn, 'https://example.com');
    expect(await screen.findByText('Anna LinkedIn-osoite muodossa https://www.linkedin.com/in/nimi.')).toBeVisible();
    expect(linkedIn).toHaveAttribute('aria-invalid', 'true');
    await user.clear(linkedIn);
    await user.type(linkedIn, 'https://www.linkedin.com/in/meri');
    expect(linkedIn).toHaveAttribute('aria-invalid', 'false');
  });

  it('näyttää Esittely-kentässä reaaliaikaisen merkkilaskurin ja rajaa syötteen 300 merkkiin', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectStep(user, 'Esittely');
    const summary = screen.getByRole('textbox', { name: 'Esittely' });
    expect(screen.getByText('0/300 merkkiä')).toBeVisible();
    await user.type(summary, 'Opin uutta.');
    expect(screen.getByText('11/300 merkkiä')).toBeVisible();
    await user.clear(summary);
    await user.type(summary, 'a'.repeat(305));
    expect(summary).toHaveValue('a'.repeat(300));
    expect(screen.getByText('300/300 merkkiä')).toBeVisible();
  });
});

it('Aloita alusta nollaa CV:n, ulkoasun ja istuntoluonnoksen heti myös Viimeistele-vaiheesta', async () => {
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText('Etunimi', { exact: true }), 'Poistettava');
  await selectStep(user, 'Esittely');
  await user.type(screen.getByRole('textbox', { name: 'Esittely' }), 'Salainen esittely');
  await selectStep(user, 'Viimeistele');
  await user.clear(screen.getByLabelText('HEX-väri'));
  await user.type(screen.getByLabelText('HEX-väri'), '#203040');
  await user.click(screen.getByRole('button', { name: 'Aloita alusta' }));
  expect(screen.getByLabelText('HEX-väri')).toHaveValue('#203040');
  await user.click(screen.getByRole('button', { name: 'Oletko varma?' }));
  expect(screen.getByLabelText('Etunimi', { exact: true })).toHaveValue('');
  window.dispatchEvent(new Event('pagehide'));
  const stored = JSON.parse(sessionStorage.getItem('mercuria-cv-draft-v1')!);
  expect(stored.data.personalDetails.firstName).toBe('');
  expect(stored.data.summary).toBe('');
  expect(stored.data.appearance.accentColor).toBe('#E9E1D8');
  expect(stored.data.appearance.photoDataUrl).toBe('');
  expect(localStorage.getItem('mercuria-cv-draft-v1')).toBeNull();
  await selectStep(user, 'Viimeistele');
  expect(screen.getByLabelText('HEX-väri')).toHaveValue('#E9E1D8');
});
