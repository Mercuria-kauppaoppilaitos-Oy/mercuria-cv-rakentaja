import '../../test/pdf-input-probe';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { selectStep } from '../../test/navigation';
import { defaultAccentColor } from './color-utils';
import { draftStorageKey } from './draft-storage';
import * as imageUtils from './image-utils';
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
  await user.click(screen.getByRole('button', { name: 'Palauta oletusväri' }));
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



it('kiintiön ylittyminen ei poista kenttien arvoja', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota', 'QuotaExceededError'); });
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Etunimi'), 'Aino');
  expect(await screen.findByRole('alert')).toHaveTextContent('tallennustila');
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Aino');
});

it('poistetut osiot eivät näy viimeistelyssä', async () => {
  const user = userEvent.setup(); render(<App />); await selectStep(user, 'Viimeistele');
  for (const text of ['Luonnoksen säilyttäminen', 'Säilytä luonnos tällä laitteella', 'Tyhjennä kaikki tiedot', 'Yhteenveto täytetyistä osioista', 'CV:n ATS-tarkistuslista', 'ATS-ystävällinen yksipalstainen rakenne', 'Oma osaaminen, selkeästi esiin.']) expect(screen.queryByText(text)).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Vertaa CV:tä työpaikkailmoitukseen' })).toBeNull();
  expect(screen.queryByLabelText('Työpaikkailmoitus')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Analysoi ilmoitus' })).toBeNull();
});
