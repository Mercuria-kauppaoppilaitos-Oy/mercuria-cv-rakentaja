import '../../test/pdf-input-probe';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { addEntry, selectStep } from '../../test/navigation';

function preview() {
  return within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' }));
}
function work(index = 1) {
  return within(screen.getByRole('group', { name: `Työkokemus ${index}` }));
}
function education(index = 1) {
  return within(screen.getByRole('group', { name: `Koulutus ${index}` }));
}
function setMonth(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value: value.slice(5) } });
  fireEvent.change(document.getElementById(input.id + '-year')!, { target: { value: value.slice(0, 4) } });
}

describe('Työkokemus ja koulutus', () => {
  it('piilottaa tyhjät osiot myös tyhjien merkintöjen lisäämisen jälkeen', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(preview().queryByRole('heading', { name: 'TYÖKOKEMUS' })).not.toBeInTheDocument();
    expect(preview().queryByRole('heading', { name: 'KOULUTUS' })).not.toBeInTheDocument();
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), '   ');
    await user.click(work().getByRole('checkbox'));
    await addEntry(user, 'Lisää koulutus');
    await user.click(education().getByRole('checkbox'));
    expect(preview().queryByRole('heading', { name: 'TYÖKOKEMUS' })).not.toBeInTheDocument();
    expect(preview().queryByRole('heading', { name: 'KOULUTUS' })).not.toBeInTheDocument();
  });

  it('lisää työkokemuksen, päivittää tiedot ja esittää vanhat tehtävärivit kappaleena', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'TET-jakso');
    await user.type(work().getByLabelText('Työnantaja tai organisaatio'), 'Kauppa');
    await user.type(work().getByLabelText('Paikkakunta (valinnainen)'), 'Vantaa');
    setMonth(work().getByLabelText('Aloituskuukausi'), '2023-08');
    setMonth(work().getByLabelText('Päättymiskuukausi'), '2023-12');
    await user.type(work().getByLabelText('Tehtävät ja saavutukset'), 'Palvelin asiakkaita\n\n Opin kassatyötä');
    expect(preview().getByRole('heading', { name: 'TYÖKOKEMUS' })).toBeVisible();
    expect(preview().getByRole('heading', { name: 'TET-jakso' })).toBeVisible();
    expect(preview().getByText('Kauppa, Vantaa · 08/2023–12/2023')).toBeVisible();
    expect(preview().getByText('Palvelin asiakkaita. Opin kassatyötä.')).toBeVisible();
    expect(preview().queryByRole('listitem')).not.toBeInTheDocument();
    expect(work().getByLabelText('Tehtävät ja saavutukset')).toHaveValue('Palvelin asiakkaita\n\n Opin kassatyötä');
  });

  it('säilyttää useat työkokemukset erillisinä ja kenttien tunnisteet yksilöllisinä', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'Harjoittelu');
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work(2).getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'Myyjä');
    expect(preview().getByRole('heading', { name: 'Harjoittelu' })).toBeVisible();
    expect(preview().getByRole('heading', { name: 'Myyjä' })).toBeVisible();
    expect(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi')).toHaveValue('Harjoittelu');
    expect(work(2).getByLabelText('Tehtävänimike tai kokemuksen tyyppi')).toHaveValue('Myyjä');
    const inputs = Array.from(container.querySelectorAll('input, textarea'));
    expect(new Set(inputs.map((input) => input.id)).size).toBe(inputs.length);
    for (const input of inputs) expect(input).toHaveAccessibleName();
    expect(work(2).getByRole('button', { name: 'Poista työkokemus 2: Myyjä' })).toBeVisible();
  });

  it('poistaa valitun työkokemuksen ja säilyttää jäljelle jäävän merkinnän muokattavana', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'TET');
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work(2).getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'Myyjä');
    await user.click(work().getByRole('button', { name: 'Poista työkokemus 1: TET' }));
    expect(preview().queryByRole('heading', { name: 'TET' })).not.toBeInTheDocument();
    expect(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi')).toHaveValue('Myyjä');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), ' kesätyö');
    expect(preview().getByRole('heading', { name: 'Myyjä kesätyö' })).toBeVisible();
    await user.click(work().getByRole('button', { name: 'Poista työkokemus 1: Myyjä kesätyö' }));
    expect(preview().queryByRole('heading', { name: 'TYÖKOKEMUS' })).not.toBeInTheDocument();
  });

  it('poistaa päättymiskuukauden käytöstä jatkuvassa työssä ja palauttaa sen valinnan poistuttua', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää työkokemus');
    setMonth(work().getByLabelText('Aloituskuukausi'), '2024-08');
    const end = work().getByLabelText('Päättymiskuukausi');
    setMonth(end, '2025-12');
    await user.click(work().getByRole('checkbox', { name: 'Työskentelen täällä edelleen' }));
    expect(end).toBeDisabled();
    expect(preview().getByText('08/2024–nykyhetki')).toBeVisible();
    expect(preview().queryByText(/12\/2025/)).not.toBeInTheDocument();
    await user.click(work().getByRole('checkbox', { name: 'Työskentelen täällä edelleen' }));
    expect(end).toBeEnabled();
    expect(preview().getByText('08/2024–12/2025')).toBeVisible();
  });

  it('lisää koulutuksen, näyttää kaikki tiedot ja poistaa koulutuksen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää koulutus');
    await user.type(education().getByLabelText('Tutkinnon tai koulutuksen nimi'), 'Merkonomi');
    await user.type(education().getByLabelText('Oppilaitos'), 'Mercuria');
    await user.type(education().getByLabelText('Paikkakunta (valinnainen)'), 'Vantaa');
    setMonth(education().getByLabelText('Aloituskuukausi'), '2023-08');
    setMonth(education().getByLabelText('Valmistumiskuukausi tai arvioitu valmistumiskuukausi'), '2026-05');
    await user.type(education().getByLabelText('Osaamisala, suuntautuminen tai lyhyt lisätieto'), 'Asiakaspalvelu');
    expect(preview().getByRole('heading', { name: 'KOULUTUS' })).toBeVisible();
    expect(preview().getByRole('heading', { name: 'Merkonomi' })).toBeVisible();
    expect(preview().getByText('Mercuria, Vantaa · 08/2023–05/2026')).toBeVisible();
    expect(preview().getByText('Asiakaspalvelu')).toBeVisible();
    await user.click(education().getByRole('button', { name: 'Poista koulutus 1: Merkonomi, Mercuria' }));
    expect(preview().queryByRole('heading', { name: 'KOULUTUS' })).not.toBeInTheDocument();
  });

  it('näyttää jatkuvat opinnot nykyhetkeen ja osiot oikeassa järjestyksessä', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää koulutus');
    setMonth(education().getByLabelText('Aloituskuukausi'), '2024-08');
    setMonth(education().getByLabelText('Valmistumiskuukausi tai arvioitu valmistumiskuukausi'), '2027-05');
    await user.click(education().getByRole('checkbox', { name: 'Opinnot jatkuvat' }));
    expect(preview().getByText('08/2024–nykyhetki')).toBeVisible();
    expect(preview().queryByText(/05\/2027/)).not.toBeInTheDocument();
    await addEntry(user, 'Lisää työkokemus');
    await user.type(work().getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'TET');
    expect(preview().getAllByRole('heading').map((heading) => heading.textContent)).toEqual(['', 'TYÖKOKEMUS', 'TET', 'KOULUTUS']);
    await selectStep(user, 'Koulutus');
    await user.click(education().getByRole('checkbox', { name: 'Opinnot jatkuvat' }));
    expect(preview().getByText('08/2024–05/2027')).toBeVisible();
  });

  it('lisää useita koulutuksia ja poistaa niistä vain valitun', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää koulutus');
    await user.type(education().getByLabelText('Tutkinnon tai koulutuksen nimi'), 'Lukio');
    await addEntry(user, 'Lisää koulutus');
    await user.type(education(2).getByLabelText('Tutkinnon tai koulutuksen nimi'), 'Merkonomi');
    expect(preview().getByRole('heading', { name: 'Lukio' })).toBeVisible();
    expect(preview().getByRole('heading', { name: 'Merkonomi' })).toBeVisible();
    await user.click(education().getByRole('button', { name: 'Poista koulutus 1: Lukio' }));
    expect(preview().queryByRole('heading', { name: 'Lukio' })).not.toBeInTheDocument();
    expect(education().getByLabelText('Tutkinnon tai koulutuksen nimi')).toHaveValue('Merkonomi');
  });
});
