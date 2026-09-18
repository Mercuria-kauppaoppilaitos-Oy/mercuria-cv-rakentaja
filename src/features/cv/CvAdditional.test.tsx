import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../App';
import { addEntry, selectStep } from '../../test/navigation';
import { languageLevels } from './cv-model';

const cases = [
  { add: 'Lisää osaaminen', entry: 'Osaaminen', field: 'Osaaminen', value: 'Myyntityö', heading: 'OSAAMINEN', remove: 'Poista osaaminen' },
  { add: 'Lisää kieli', entry: 'Kieli', field: 'Kieli', value: 'Englanti', heading: 'KIELITAITO', remove: 'Poista kieli' },
  { add: 'Lisää kortti tai pätevyys', entry: 'Kortti tai pätevyys', field: 'Nimi', value: 'Hygieniapassi', heading: 'KORTIT JA PÄTEVYYDET', remove: 'Poista kortti tai pätevyys' },
  { add: 'Lisää suosittelija', entry: 'Suosittelija', field: 'Nimi', value: 'Meri', heading: 'SUOSITTELIJAT', remove: 'Poista suosittelija' },
] as const;
function preview() { return within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' })); }
function entry(name: string, index = 1) { return within(screen.getByRole('group', { name: `${name} ${index}` })); }

describe('Uudet CV-osiot', () => {
  it.each(cases)('lisää merkinnän osioon $heading ja päivittää esikatselun', async (section) => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, section.add);
    await user.type(entry(section.entry).getByLabelText(section.field), section.value);
    expect(preview().getByRole('heading', { name: section.heading })).toBeVisible();
    expect(preview().getByText(section.value)).toBeVisible();
  });

  it.each(cases)('poistaa valitun merkinnän osiosta $heading ja säilyttää toisen', async (section) => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, section.add);
    await user.type(entry(section.entry).getByLabelText(section.field), section.value);
    await addEntry(user, section.add);
    await user.type(entry(section.entry, 2).getByLabelText(section.field), 'Toinen');
    await user.click(screen.getByRole('button', { name: `${section.remove} 1: ${section.value}` }));
    expect(preview().queryByText(section.value)).not.toBeInTheDocument();
    const remaining = entry(section.entry).getByLabelText(section.field);
    expect(remaining).toHaveValue('Toinen');
    await user.type(remaining, ' merkintä');
    expect(preview().getByText('Toinen merkintä')).toBeVisible();
    await user.click(screen.getByRole('button', { name: `${section.remove} 1: Toinen merkintä` }));
    expect(preview().queryByRole('heading', { name: section.heading })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: section.add })).toHaveFocus();
  });

  it('piilottaa tyhjät merkinnät ja osiot sekä pitää kenttien tunnisteet yksilöllisinä', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    for (const section of cases) {
      expect(preview().queryByRole('heading', { name: section.heading })).not.toBeInTheDocument();
      await addEntry(user, section.add);
      await user.type(entry(section.entry).getByLabelText(section.field), '   ');
    }
    await selectStep(user, 'Osaaminen');
    await user.selectOptions(entry('Kieli').getByRole('combobox'), 'Sujuva');
    for (const section of cases) expect(preview().queryByRole('heading', { name: section.heading })).not.toBeInTheDocument();
    const controls = Array.from(container.querySelectorAll('input, textarea, select'));
    expect(new Set(controls.map((control) => control.id)).size).toBe(controls.length);
    for (const control of controls) expect(control).toHaveAccessibleName();
  });

  it('näyttää ohjelmiston osaamisessa ja kaikki kielitasot tekstinä', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää osaaminen');
    await user.type(entry('Osaaminen').getByLabelText('Osaaminen'), 'Microsoft Excel');
    expect(preview().getByText('Microsoft Excel')).toBeVisible();
    await addEntry(user, 'Lisää kieli');
    await user.type(entry('Kieli').getByLabelText('Kieli'), 'Englanti');
    for (const level of languageLevels) {
      await user.selectOptions(entry('Kieli').getByRole('combobox'), level);
      expect(preview().getByText(`Englanti – ${level.toLocaleLowerCase('fi')}`)).toBeVisible();
    }
  });

  it('toteuttaa kaikki kolme suosittelijoiden näyttötapaa tietoja menettämättä', async () => {
    const user = userEvent.setup();
    render(<App />);
    await selectStep(user, 'Lisäosiot');
    expect(screen.getByText('Pyydä henkilöltä lupa ennen kuin lisäät hänet suosittelijaksi.')).toBeVisible();
    const display = screen.getByLabelText('Suosittelijoiden näyttötapa');
    await user.selectOptions(display, 'on-request');
    expect(preview().getByText('Suosittelijat saatavilla pyydettäessä')).toBeVisible();
    await addEntry(user, 'Lisää suosittelija');
    await user.type(entry('Suosittelija').getByLabelText('Nimi'), 'Meri');
    await user.type(entry('Suosittelija').getByLabelText('Tehtävänimike'), 'Esihenkilö');
    await user.type(entry('Suosittelija').getByLabelText('Organisaatio'), 'Kauppa');
    await user.type(entry('Suosittelija').getByLabelText('Sähköpostiosoite (valinnainen)'), 'meri@example.com');
    await user.type(entry('Suosittelija').getByLabelText('Puhelinnumero (valinnainen)'), '040 123');
    expect(preview().queryByText('Meri')).not.toBeInTheDocument();
    await user.selectOptions(display, 'contact');
    expect(preview().getByText('Meri')).toBeVisible();
    expect(preview().getByText('Esihenkilö – Kauppa')).toBeVisible();
    expect(preview().getByText('meri@example.com')).toBeVisible();
    expect(preview().getByText('040 123')).toBeVisible();
    expect(preview().queryByText('Suosittelijat saatavilla pyydettäessä')).not.toBeInTheDocument();
    await user.selectOptions(display, 'hidden');
    expect(preview().queryByRole('heading', { name: 'SUOSITTELIJAT' })).not.toBeInTheDocument();
    expect(preview().queryByText('meri@example.com')).not.toBeInTheDocument();
    await user.selectOptions(display, 'contact');
    expect(preview().getByText('Meri')).toBeVisible();
  });

  it('validoi suosittelijan sähköpostin ja kytkee virheen saavutettavasti kenttään', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää suosittelija');
    const email = entry('Suosittelija').getByLabelText('Sähköpostiosoite (valinnainen)');
    await user.type(email, 'virhe');
    expect(await screen.findByRole('alert')).toHaveTextContent('Tarkista sähköpostiosoitteen muoto.');
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('Tarkista sähköpostiosoitteen muoto.');
    await user.clear(email);
    expect(email).toHaveAttribute('aria-invalid', 'false');
    await user.type(email, 'meri@example.com');
    expect(email).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hyväksyy tyhjän tai nelinumeroisen suoritusvuoden ja näyttää pätevyyden lisätiedot', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää kortti tai pätevyys');
    const certificate = entry('Kortti tai pätevyys');
    await user.type(certificate.getByLabelText('Nimi'), 'Ensiapukoulutus');
    await user.type(certificate.getByLabelText('Myöntäjä tai koulutuksen järjestäjä (valinnainen)'), 'SPR');
    await user.type(certificate.getByLabelText('Voimassaoloaika tai lisätieto (valinnainen)'), 'Voimassa 2028 asti');
    const year = certificate.getByLabelText('Suoritusvuosi (valinnainen)');
    for (const value of ['123', '20255', 'abcd']) {
      fireEvent.change(year, { target: { value } });
      expect(await screen.findByRole('alert')).toHaveTextContent('Anna nelinumeroinen suoritusvuosi tai jätä kenttä tyhjäksi.');
      expect(year).toHaveAccessibleDescription('Anna nelinumeroinen suoritusvuosi tai jätä kenttä tyhjäksi.');
    }
    await user.clear(year);
    expect(year).toHaveAttribute('aria-invalid', 'false');
    await user.type(year, '2025');
    expect(year).toHaveAttribute('aria-invalid', 'false');
    expect(preview().getByText('Ensiapukoulutus – SPR – 2025 – Voimassa 2028 asti')).toBeVisible();
  });

  it('näyttää kaikki CV-osiot pyydetyssä järjestyksessä', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addEntry(user, 'Lisää työkokemus');
    await user.type(entry('Työkokemus').getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'Myyjä');
    await addEntry(user, 'Lisää koulutus');
    await user.type(entry('Koulutus').getByLabelText('Tutkinnon tai koulutuksen nimi'), 'Merkonomi');
    for (const section of cases) {
      await addEntry(user, section.add);
      await user.type(entry(section.entry).getByLabelText(section.field), section.value);
    }
    expect(preview().getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)).toEqual([
      'Esittely', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT',
    ]);
  });
});
