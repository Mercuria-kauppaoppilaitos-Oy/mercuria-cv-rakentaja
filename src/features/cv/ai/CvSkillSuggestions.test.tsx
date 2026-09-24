import '../../../test/pdf-input-probe';
import { webcrypto } from 'node:crypto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { createShortCvFixture } from '../../../test/cv-fixture';
import { selectStep } from '../../../test/navigation';
import { getSkillSource, skillSourceKey, skillsStorageKey, SkillsCache } from './skill-suggestions';
import { normalizeSkill } from '../../../../shared/rewrite-contract';

const fetchMock = vi.fn();
const suggestions = ['Asiakaspalvelu', 'Hyllytys', 'Tuotteiden esillepano'];
const response = () => new Response(JSON.stringify({ skills: suggestions }), { headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { fetchMock.mockReset().mockImplementation(async () => response()); vi.stubGlobal('fetch', fetchMock); vi.stubGlobal('crypto', webcrypto); });
afterEach(() => vi.unstubAllGlobals());
async function setup(filled = true) {
  const data = createShortCvFixture(); data.skills = [{ id: 'existing', name: ' ASIAKASPALVELU ' }];
  if (filled) sessionStorage.setItem('mercuria-cv-draft-v1', JSON.stringify({ schemaVersion: 4, persistent: false, data }));
  const user = userEvent.setup(); render(<App />); await selectStep(user, 'Osaaminen');
  return { user, data, button: screen.getByRole('button', { name: 'Ehdota tekoälyllä' }) };
}
it('does not call automatically or without sufficient source; shares decorative accessible AI button', async () => {
  const { user, button } = await setup(false); expect(fetchMock).not.toHaveBeenCalled();
  expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  await user.click(button);
  expect(screen.getByText('Lisää ensin sisältöä esittelyyn, työkokemukseen tai koulutukseen.')).toBeVisible(); expect(fetchMock).not.toHaveBeenCalled();
});
it('sends only professional fields, adds explicitly without duplicates, reuses cache and clears it on confirmed reset', async () => {
  const { user, data, button } = await setup();
  await user.dblClick(button);
  const panel = await screen.findByRole('region', { name: 'Osaamisehdotukset' });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, request] = fetchMock.mock.calls[0]!;
  expect(url).toBe('/api/rewrite-text'); expect(JSON.parse(request.body)).toEqual({ operation: 'suggest-skills', source: getSkillSource(data) });
  for (const privateText of ['Olivia', 'olivia@example.com', 'linkedin.com', 'reference@example.com', 'Esimerkkikauppa', 'Esimerkkioppilaitos', 'Testi Suosittelija', '040 123']) expect(request.body).not.toContain(privateText);
  const preview = within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' }));
  expect(preview.queryByText('Tuotteiden esillepano', { exact: true })).toBeNull();
  expect(within(panel).getByRole('button', { name: /Asiakaspalvelu/ })).toHaveAttribute('aria-pressed', 'true');
  await user.dblClick(within(panel).getByRole('button', { name: /Hyllytys/ }));
  expect(screen.getAllByRole('textbox', { name: 'Osaaminen' })).toHaveLength(2);
  await user.click(within(panel).getByRole('button', { name: 'Lisää kaikki' }));
  expect(screen.getAllByRole('textbox', { name: 'Osaaminen' })).toHaveLength(3);
  expect(preview.getByText('Tuotteiden esillepano', { exact: true })).toBeVisible();
  await selectStep(user, 'Esittely'); await selectStep(user, 'Osaaminen');
  await screen.findByRole('region', { name: 'Osaamisehdotukset' }); await user.click(screen.getByRole('button', { name: 'Ehdota tekoälyllä' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const cached = sessionStorage.getItem(skillsStorageKey)!; expect(cached).not.toContain(data.summary); expect(new SkillsCache().get(await skillSourceKey(getSkillSource(data)))).toEqual(suggestions);
  await selectStep(user, 'Esittely'); fireEvent.change(screen.getByLabelText('Esittely', { exact: true }), { target: { value: 'Uusi ammatillinen esittelyteksti.' } });
  await selectStep(user, 'Osaaminen'); expect(screen.queryByRole('region', { name: 'Osaamisehdotukset' })).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Ehdota tekoälyllä' })); await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await user.click(screen.getByRole('button', { name: 'Aloita alusta' })); expect(sessionStorage.getItem(skillsStorageKey)).not.toBeNull();
  await user.click(screen.getByRole('button', { name: 'Oletko varma?' }));
  expect(sessionStorage.getItem(skillsStorageKey)).toBeNull(); expect(screen.getByLabelText('Etunimi', { exact: true })).toHaveValue('');
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Perustiedot' })).toHaveFocus());
});
it('blocks parallel requests and does not add skills when an obsolete response arrives', async () => {
  let resolve!: (response: Response) => void; fetchMock.mockImplementation(() => new Promise<Response>((done) => { resolve = done; }));
  const { user, button } = await setup(); await user.dblClick(button);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1)); expect(button).toBeDisabled(); expect(button).toHaveTextContent('Ehdotetaan…');
  await selectStep(user, 'Perustiedot'); resolve(response()); await selectStep(user, 'Osaaminen');
  expect(screen.queryByRole('region', { name: 'Osaamisehdotukset' })).toBeNull(); expect(screen.getAllByRole('textbox', { name: 'Osaaminen' })).toHaveLength(1);
});
it.each([503, 429, 504, 'network', 'invalid'] as const)('preserves existing skills on %s', async (status) => {
  fetchMock.mockImplementation(async () => { if (status === 'network') throw new Error('private detail'); return new Response(JSON.stringify(status === 'invalid' ? { skills: ['<script>bad</script>'] } : { error: 'private detail' }), { status: typeof status === 'number' ? status : 200, headers: { 'Content-Type': 'application/json' } }); });
  const { user, button } = await setup(); await user.click(button);
  await waitFor(() => expect(screen.getByText(status === 504 ? 'Pyyntö kesti liian kauan. Yritä uudelleen.' : 'Osaamisehdotusten hakeminen ei onnistunut. Yritä uudelleen.')).toBeVisible());
  expect(screen.getByRole('textbox', { name: 'Osaaminen' })).toHaveValue(' ASIAKASPALVELU '); expect(screen.queryByText('private detail')).toBeNull();
});
it('normalizes Unicode and case without changing existing names', () => {
  expect(normalizeSkill('  ÄLYKÄS　TYÖ ')).toBe(normalizeSkill('A\u0308lykäs työ'));
});

it('fingerprint ignores private fields, row IDs and empty rows; source changes produce another key', async () => {
  const data = createShortCvFixture(); const original = getSkillSource(data); const key = await skillSourceKey(original);
  data.personalDetails.firstName = 'Private'; data.personalDetails.lastName = 'Secret'; data.personalDetails.email = 'secret@example.com';
  data.personalDetails.phone = '999'; data.personalDetails.linkedIn = 'https://www.linkedin.com/in/private';
  data.appearance.photoDataUrl = 'data:image/jpeg;base64,private'; data.references[0]!.name = 'Hidden reference';
  data.workExperience[0]!.id = 'new-id'; data.workExperience[0]!.employer = 'Private employer'; data.workExperience[0]!.startDate = '1990-01';
  data.education[0]!.institution = 'Private institution'; data.workExperience.push({ ...data.workExperience[0]!, id: 'blank', title: '', description: '' });
  expect(getSkillSource(data)).toEqual(original); expect(await skillSourceKey(getSkillSource(data))).toBe(key);
  data.summary += ' Uusi tehtävä.'; expect(await skillSourceKey(getSkillSource(data))).not.toBe(key);
});
it('rejects oversized UTF-8 requests without a network call', async () => {
  const { suggestSkills } = await import('./skill-suggestions');
  await expect(suggestSkills({ professionalTitle: '', summary: 'ä'.repeat(1500), workExperience: Array(3).fill({ title: 'Myyjä', description: 'ä'.repeat(1500) }), education: [] }, new AbortController().signal)).rejects.toThrow('Lähdeteksti on liian pitkä');
  expect(fetchMock).not.toHaveBeenCalled();
});
