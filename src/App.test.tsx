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
    expect(screen.getByRole('heading', { name: 'Hyvä CV alkaa sinusta.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Muokkaa tietojasi' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'CV-esikatselu' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Perustiedot' })).toBeVisible();
    await selectStep(user, 'Esittely');
    expect(screen.getByRole('group', { name: 'Esittelyteksti' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Esittely', level: 4 })).toBeVisible();
    expect(screen.getByText('Tietosi käsitellään tällä laitteella eikä niitä lähetetä palvelimelle.')).toBeVisible();
  });

  it('päivittää kaikki kahdeksan kenttää esikatseluun ilman lähetystä', async () => {
    const user = userEvent.setup();
    render(<App />);
    const values = [
      ['Etunimi', 'Meri'], ['Sukunimi', 'Virtanen'], ['Ammatillinen otsikko', 'Myyntineuvoja'],
      ['Sähköposti', 'meri@example.com'], ['Puhelinnumero', '+358 40 987 6543'],
      ['Paikkakunta', 'Helsinki'], ['LinkedIn', 'https://www.linkedin.com/in/meri-virtanen'],
      ['Esittely', 'Autan asiakkaita löytämään sopivat ratkaisut.\nOpin mielelläni uutta.'],
    ] as const;
    const preview = within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' }));
    for (const [label, value] of values) {
      if (label === 'Esittely') await selectStep(user, 'Esittely');
      await user.type(screen.getByRole('textbox', { name: label }), value);
      if (label === 'Etunimi' || label === 'Sukunimi') {
        expect(preview.getByRole('heading', { name: label === 'Etunimi' ? 'Meri' : 'Meri Virtanen' })).toBeVisible();
      } else {
        expect(preview.getByText(value.replace('\n', ' '))).toBeVisible();
      }
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('pitää esimerkit erillään tyhjistä kentistä ja palauttaa ne tyhjennettäessä', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const input of screen.getAllByRole('textbox')) expect(input).toHaveValue('');
    const firstName = screen.getByRole('textbox', { name: 'Etunimi' });
    expect(screen.getByRole('heading', { name: 'Aino Esimerkki' })).toHaveClass('example-text');
    await user.type(firstName, 'Meri');
    expect(screen.queryByRole('heading', { name: 'Aino Esimerkki' })).not.toBeInTheDocument();
    await user.clear(firstName);
    expect(firstName).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'Aino Esimerkki' })).toBeVisible();
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
});
