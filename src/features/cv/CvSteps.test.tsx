import '../../test/pdf-input-probe';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from '../../App';
import { addEntry, selectStep } from '../../test/navigation';
import { cvSteps } from './cv-steps';

afterEach(() => vi.unstubAllGlobals());
function preview() { return within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' })); }

it('aloittaa perustiedoista ja vaihtaa kaikkia vaiheita valikon painikkeilla', async () => {
  const user = userEvent.setup();
  render(<App />);
  const navigation = within(screen.getByRole('navigation', { name: 'CV:n vaiheet' }));
  expect(navigation.getByRole('button', { name: 'Perustiedot' })).toHaveAttribute('aria-current', 'step');
  expect(screen.getByRole('button', { name: 'Edellinen' })).toBeDisabled();
  expect(screen.queryByRole('textbox', { name: 'Esittely' })).not.toBeInTheDocument();
  for (const label of cvSteps) {
    await selectStep(user, label);
    expect(navigation.getByRole('button', { name: label })).toHaveAttribute('aria-current', 'step');
    expect(navigation.getAllByRole('button').filter((button) => button.hasAttribute('aria-current'))).toHaveLength(1);
    expect(document.getElementById('active-step-heading')).toHaveTextContent(label);
  }
  expect(screen.getByRole('button', { name: 'Seuraava' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeVisible();
});

it('siirtyy Edellinen- ja Seuraava-painikkeilla ja säilyttää tavalliset kenttäarvot', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Etunimi'), 'Meri');
  await user.click(screen.getByRole('button', { name: 'Seuraava' }));
  expect(screen.getByRole('button', { name: 'Esittely' })).toHaveAttribute('aria-current', 'step');
  expect(document.getElementById('active-step-heading')).toHaveFocus();
  await user.type(screen.getByRole('textbox', { name: 'Esittely' }), 'Opin uutta.');
  await user.click(screen.getByRole('button', { name: 'Edellinen' }));
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Meri');
  expect(preview().getByText('Opin uutta.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Seuraava' }));
  expect(screen.getByRole('textbox', { name: 'Esittely' })).toHaveValue('Opin uutta.');
});

it.each([
  ['Lisää työkokemus', 'Työkokemus', 'Työkokemus 1', 'Tehtävänimike tai kokemuksen tyyppi'],
  ['Lisää koulutus', 'Koulutus', 'Koulutus 1', 'Tutkinnon tai koulutuksen nimi'],
  ['Lisää osaaminen', 'Osaaminen', 'Osaaminen 1', 'Osaaminen'],
  ['Lisää kieli', 'Osaaminen', 'Kieli 1', 'Kieli'],
  ['Lisää kortti tai pätevyys', 'Lisäosiot', 'Kortti tai pätevyys 1', 'Nimi'],
  ['Lisää suosittelija', 'Lisäosiot', 'Suosittelija 1', 'Nimi'],
] as const)('säilyttää listan vaiheesta poistuttaessa: %s', async (add, step, group, field) => {
  const user = userEvent.setup();
  render(<App />);
  await addEntry(user, add);
  await user.type(within(screen.getByRole('group', { name: group })).getByLabelText(field), 'Merkintä');
  expect(preview().getByText('Merkintä')).toBeVisible();
  await selectStep(user, 'Perustiedot');
  expect(preview().getByText('Merkintä')).toBeVisible();
  await selectStep(user, step);
  expect(within(screen.getByRole('group', { name: group })).getByLabelText(field)).toHaveValue('Merkintä');
  await user.type(within(screen.getByRole('group', { name: group })).getByLabelText(field), ' uusi');
  expect(preview().getByText('Merkintä uusi')).toBeVisible();
});

it('säilyttää validointivirheet vaihdettaessa vaihetta ja näyttää ne yhteenvedossa', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.type(screen.getByLabelText('Sähköposti'), 'virhe');
  expect(await screen.findByRole('alert')).toHaveTextContent('Tarkista sähköpostiosoitteen muoto.');
  await selectStep(user, 'Viimeistele');
  expect(screen.getByRole('alert')).toHaveTextContent('Tarkista sähköpostiosoitteen muoto.');
  expect(screen.queryByText('Yhteenveto täytetyistä osioista')).not.toBeInTheDocument();
  await selectStep(user, 'Perustiedot');
  expect(screen.getByLabelText('Sähköposti')).toHaveAccessibleDescription('Tarkista sähköpostiosoitteen muoto.');
});

it('vaihtaa mobiilissa lomakkeen ja esikatselun semanttisesti sekä säilyttää lomaketiedot', async () => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('767') || query.includes('1279'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const user = userEvent.setup();
  render(<App />);
  expect(screen.queryByRole('navigation', { name: 'CV:n vaiheet' })).not.toBeInTheDocument();
  const switcher = within(screen.getByRole('group', { name: 'Näkymä' }));
  const formButton = switcher.getByRole('button', { name: 'Lomake' });
  const previewButton = switcher.getByRole('button', { name: 'Esikatselu' });
  expect(formButton).toHaveAttribute('aria-pressed', 'true');
  expect(previewButton).toHaveAttribute('aria-pressed', 'false');
  await user.type(screen.getByLabelText('Etunimi'), 'Meri');
  await user.click(previewButton);
  expect(previewButton).toHaveAttribute('aria-pressed', 'true');
  expect(previewButton).toHaveAttribute('aria-controls', 'preview-panel');
  expect(screen.queryByLabelText('Etunimi')).not.toBeVisible();
  expect(preview().getByRole('heading', { name: 'Meri' })).toBeVisible();
  await user.click(formButton);
  expect(screen.getByLabelText('Etunimi')).toHaveValue('Meri');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Vaihe 1 / 7'), '1');
  await user.type(screen.getByRole('textbox', { name: 'Esittely' }), 'Profiili');
  await user.click(previewButton);
  expect(preview().getByText('Profiili')).toBeVisible();
});

it('mahdollistaa esikatselun piilottamisen keskikokoisella näytöllä', async () => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: query.includes('1279'), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const user = userEvent.setup();
  render(<App />);
  const toggle = screen.getByRole('button', { name: 'Piilota esikatselu' });
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await user.click(toggle);
  expect(screen.getByRole('button', { name: 'Näytä esikatselu' })).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Näytä esikatselu' }));
  expect(screen.getByRole('article')).toBeVisible();
});
