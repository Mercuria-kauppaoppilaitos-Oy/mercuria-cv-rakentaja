import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { selectStep } from '../../test/navigation';
import { createEmptyCv } from './cv-model';
import { defaultAccentColor } from './color-utils';
import { draftStorageKey, saveDraft } from './draft-storage';
import * as imageUtils from './image-utils';
const photo = 'data:image/jpeg;base64,/9j/AA==';
afterEach(() => vi.restoreAllMocks());

it('synkronoi värikentät, näyttää virheen ja palauttaa oletusvärin', async () => {
  const user = userEvent.setup();
  render(<App />);
  await selectStep(user, 'Viimeistele');
  const hex = screen.getByLabelText('HEX-väri');
  const picker = screen.getByLabelText('CV:n korostusväri');
  fireEvent.change(picker, { target: { value: '#203040' } });
  await waitFor(() => expect(hex).toHaveValue('#203040'));
  expect(screen.getByRole('article').style.getPropertyValue('--cv-accent')).toBe('#203040');
  await user.clear(hex); await user.type(hex, '#GGGGGG');
  expect(hex).toHaveAttribute('aria-invalid', 'true');
  expect(hex).toHaveAccessibleDescription(/Anna väri muodossa #RRGGBB/);
  await user.click(screen.getByRole('button', { name: 'Palauta beige oletusväri' }));
  expect(hex).toHaveValue(defaultAccentColor);
  expect(picker).toHaveValue(defaultAccentColor.toLowerCase());
  expect(hex).toHaveAttribute('aria-invalid', 'false');
});

it.each([
  ['Väärä muoto', 'Valitse JPEG-, PNG- tai WebP-kuva.'],
  ['Liian suuri', 'Kuva on liian suuri. Enimmäiskoko on 5 Mt.'],
  ['Rikkinäinen', 'Kuvaa ei voitu avata.'],
])('näyttää kuvan virheen saavutettavasti: %s', async (_, message) => {
  vi.spyOn(imageUtils, 'validatePhoto').mockRejectedValue(new Error(message));
  const user = userEvent.setup();
  render(<App />);
  await user.upload(screen.getByLabelText('Lisää valokuva'), new File(['photo'], 'photo.png', { type: 'image/png' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByLabelText('Lisää valokuva')).toHaveAccessibleDescription(new RegExp(message.replace(/[.]/g, '\\.')));
});

it('autotallentaa istuntoon, palauttaa luonnoksen ja sallii ilmoituksen sulkemisen', async () => {
  const user = userEvent.setup();
  const first = render(<App />);
  await user.type(screen.getByLabelText('Etunimi'), 'Aino');
  await waitFor(() => expect(JSON.parse(sessionStorage.getItem(draftStorageKey)!).data.personalDetails.firstName).toBe('Aino'));
  first.unmount();
  render(<App />);
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Aino');
  expect(screen.getByRole('status')).toHaveTextContent('Luonnos palautettu');
  await user.click(screen.getByRole('button', { name: 'Sulje luonnosilmoitus' }));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

it('vaihtaa pysyvään tallennukseen ja takaisin istuntoon ilman toista luonnosta', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Etunimi'), 'Aino');
  await selectStep(user, 'Viimeistele');
  const checkbox = screen.getByLabelText('Säilytä luonnos tällä laitteella');
  await user.click(checkbox);
  expect(screen.getByText('Älä käytä pysyvää tallennusta yhteiskäyttöisellä tietokoneella.')).toBeVisible();
  expect(localStorage.getItem(draftStorageKey)).toContain('Aino');
  expect(sessionStorage.getItem(draftStorageKey)).toBeNull();
  await user.click(checkbox);
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(sessionStorage.getItem(draftStorageKey)).toContain('Aino');
  await selectStep(user, 'Perustiedot');
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Aino');
});

it('kiintiön ylittyminen ei poista kenttien arvoja', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Etunimi'), 'Aino');
  expect(await screen.findByRole('alert')).toHaveTextContent('tallennustila');
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Aino');
});

it('peruuttaa ja sulkee tyhjennysdialogin sekä tyhjentää kuvan, värin ja tallennukset vahvistettaessa', async () => {
  const data = createEmptyCv();
  data.personalDetails.firstName = 'Aino'; data.appearance.photoDataUrl = photo; data.appearance.accentColor = '#203040';
  saveDraft(data, true);
  const user = userEvent.setup();
  render(<App />);
  await selectStep(user, 'Viimeistele');
  const opener = screen.getByRole('button', { name: 'Tyhjennä kaikki tiedot' });
  await user.click(opener);
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByRole('button', { name: 'Peruuta' })).toHaveFocus();
  await user.tab({ shift: true });
  expect(dialog.getByRole('button', { name: 'Vahvista tyhjennys' })).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(opener).toHaveFocus();
  expect(localStorage.getItem(draftStorageKey)).toContain('Aino');
  await user.click(opener); await user.click(screen.getByRole('button', { name: 'Peruuta' }));
  expect(opener).toHaveFocus();
  await user.click(opener); await user.click(screen.getByRole('button', { name: 'Vahvista tyhjennys' }));
  expect(screen.getByRole('button', { name: 'Perustiedot' })).toHaveAttribute('aria-current', 'step');
  expect(screen.getByLabelText('Etunimi')).toHaveValue('');
  expect(screen.getByRole('article').querySelector('img')).toBeNull();
  expect(screen.getByRole('article').style.getPropertyValue('--cv-accent')).toBe(defaultAccentColor);
  expect(screen.getByRole('status')).toHaveTextContent('Kaikki tiedot tyhjennetty');
  await new Promise((resolve) => setTimeout(resolve, 500));
  expect(localStorage.getItem(draftStorageKey)).toBeNull();
  expect(sessionStorage.getItem(draftStorageKey)).toBeNull();
});
