import '../../../test/pdf-input-probe';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../../App';
import { addEntry, selectStep } from '../../../test/navigation';
import { rewriteMessages } from '../../../../shared/rewrite-contract';

const original = 'Avustin asiakkaita ja järjestin tuotteita.';
const suggestion = 'Avustin asiakkaita ja huolehdin tuotteiden järjestämisestä.';
const fetchMock = vi.fn();
const response = (text = suggestion) => new Response(JSON.stringify({ suggestion: text }), { headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { fetchMock.mockReset(); fetchMock.mockResolvedValue(response()); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());
function work(index = 1) { return within(screen.getByRole('group', { name: `Työkokemus ${index}` })); }
function preview() { return within(screen.getByRole('article', { name: 'Ansioluettelon esikatselu' })); }
async function profile() {
  const user = userEvent.setup(); render(<App />);
  await user.type(screen.getByLabelText('Etunimi', { exact: true }), 'Salainen');
  await user.type(screen.getByLabelText('Sähköposti', { exact: true }), 'private@example.com');
  await selectStep(user, 'Esittely');
  const field = screen.getByRole('textbox', { name: 'Esittely' });
  fireEvent.change(field, { target: { value: original } });
  return { user, field, opener: screen.getByRole('button', { name: 'Jalosta tekoälyllä' }) };
}

describe('Optional field-level AI suggestions', () => {
  it('disables empty, short and oversized source text and never requests while typing', async () => {
    const { user, field, opener } = await profile();
    fireEvent.change(field, { target: { value: '' } }); expect(opener).toBeDisabled();
    await user.type(field, '  lyhyt  '); expect(opener).toBeDisabled(); expect(screen.getByText(rewriteMessages.short)).toBeVisible();
    fireEvent.change(field, { target: { value: 'x'.repeat(1501) } }); expect(opener).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends only current profile field, keeps original until acceptance and updates preview', async () => {
    const { user, field, opener } = await profile();
    await user.click(opener);
    expect(await screen.findByRole('heading', { name: 'Tekoälyn tekstiehdotus' })).toHaveFocus();
    expect(field).toHaveValue(original); expect(preview().getByText(original)).toBeVisible();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ textType: 'profile', sourceText: original });
    expect(fetchMock.mock.calls[0]![0]).toBe('/api/rewrite-text'); expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Käytä ehdotusta' }));
    expect(field).toHaveValue(suggestion); expect(preview().getByText(suggestion)).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Tekoälyn tekstiehdotus' })).not.toBeInTheDocument(); expect(opener).toHaveFocus();
    await selectStep(user, 'Perustiedot'); expect(screen.getByLabelText('Etunimi', { exact: true })).toHaveValue('Salainen');
  });
  it.each(['cancel', 'escape'])('%s preserves original and restores focus', async (action) => {
    const { user, field, opener } = await profile(); await user.click(opener);
    await screen.findByRole('heading', { name: 'Tekoälyn tekstiehdotus' });
    if (action === 'cancel') await user.click(screen.getByRole('button', { name: 'Peruuta' }));
    else await user.keyboard('{Escape}');
    expect(field).toHaveValue(original); expect(opener).toHaveFocus(); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('retries the original snapshot and never the previous suggestion', async () => {
    const { user, field, opener } = await profile(); await user.click(opener);
    await screen.findByRole('heading', { name: 'Tekoälyn tekstiehdotus' });
    fetchMock.mockResolvedValue(response('Avustin asiakkaita ja järjestin myymälän tuotteita.'));
    await user.click(screen.getByRole('button', { name: 'Yritä uudelleen' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls.map((call) => JSON.parse(call[1].body))).toEqual([
      { textType: 'profile', sourceText: original }, { textType: 'profile', sourceText: original },
    ]);
    expect(field).toHaveValue(original);
  });
  it.each([503, 429, 504])('safe HTTP %s error preserves text, announces it and leaves form usable', async (status) => {
    fetchMock.mockResolvedValue(new Response('raw technical details', { status }));
    const { user, field, opener } = await profile(); await user.click(opener);
    const message = status === 504 ? rewriteMessages.timeout : rewriteMessages.failure;
    expect(await screen.findByText(message)).toHaveAttribute('aria-live', 'polite'); expect(field).toHaveValue(original);
    expect(screen.queryByText('raw technical details')).not.toBeInTheDocument();
    await user.type(field, ' Opin uutta.'); expect(preview().getByText(`${original} Opin uutta.`)).toBeVisible();
  });
  it('handles ordinary Vite HTML fallback without changing text', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Vite</html>', { headers: { 'Content-Type': 'text/html' } }));
    const { user, field, opener } = await profile(); await user.click(opener);
    expect(await screen.findByText(rewriteMessages.failure)).toBeVisible(); expect(field).toHaveValue(original);
  });
  it('blocks overlapping requests while other fields remain editable and preserves later edits', async () => {
    let resolve!: (value: Response) => void;
    const pendingResponse = new Promise<Response>((done) => { resolve = done; });
    fetchMock.mockReturnValue(pendingResponse);
    const { user, field, opener } = await profile(); await user.click(opener);
    expect(opener).toHaveTextContent('Jalostetaan…'); expect(opener).toBeDisabled();
    await act(async () => { fireEvent.click(opener); });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await user.type(field, ' Opin uutta.');
    await act(async () => {
      resolve(response());
      await pendingResponse;
    });
    await user.click(await screen.findByRole('button', { name: 'Käytä ehdotusta' }));
    expect(field).toHaveValue(`${original} Opin uutta.`);
    expect(await screen.findByText(rewriteMessages.changed)).toBeVisible();
  });
  it('targets the stable work ID after preceding entry removal and new entry insertion', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    const user = userEvent.setup(); render(<App />);
    await addEntry(user, 'Lisää työkokemus'); fireEvent.change(work().getByLabelText('Tehtävät ja saavutukset'), { target: { value: 'Ensimmäisen merkinnän tehtävät.' } });
    await user.click(screen.getByRole('button', { name: 'Lisää työkokemus' }));
    await user.type(work(2).getByLabelText('Tehtävänimike tai kokemuksen tyyppi'), 'Harjoittelija');
    fireEvent.change(work(2).getByLabelText('Tehtävät ja saavutukset'), { target: { value: original } });
    await user.click(work(2).getByRole('button', { name: 'Jalosta tekoälyllä' }));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ textType: 'workExperience', sourceText: original, jobTitle: 'Harjoittelija' });
    await user.click(work().getByRole('button', { name: /^Poista työkokemus/ }));
    await user.click(screen.getByRole('button', { name: 'Lisää työkokemus' }));
    await act(async () => resolve(response()));
    await user.click(work().getByRole('button', { name: 'Käytä ehdotusta' }));
    expect(work().getByLabelText('Tehtävät ja saavutukset')).toHaveValue(suggestion);
    expect(work(2).getByLabelText('Tehtävät ja saavutukset')).toHaveValue(''); expect(preview().getByText(suggestion)).toBeVisible();
  });
  it('ignores response for removed work entry and aborts its request', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValue(new Promise<Response>((done) => { resolve = done; }));
    const user = userEvent.setup(); render(<App />); await addEntry(user, 'Lisää työkokemus');
    fireEvent.change(work().getByLabelText('Tehtävät ja saavutukset'), { target: { value: original } });
    await user.click(work().getByRole('button', { name: 'Jalosta tekoälyllä' }));
    await user.click(work().getByRole('button', { name: /^Poista työkokemus/ }));
    expect(fetchMock.mock.calls[0]![1].signal.aborted).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Lisää työkokemus' })); await act(async () => resolve(response()));
    expect(work().getByLabelText('Tehtävät ja saavutukset')).toHaveValue('');
    expect(screen.queryByRole('heading', { name: 'Tekoälyn tekstiehdotus' })).not.toBeInTheDocument();
  });
});
