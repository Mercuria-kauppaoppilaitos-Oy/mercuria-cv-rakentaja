import { StrictMode } from 'react';
﻿import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createEmptyCv, type CvData } from './cv-model';
import { CvPreview } from './CvPreview';
import { CvPdfProvider } from './pdf/CvPdfProvider';
import { CvPdfDownloadButton } from './pdf/CvPdfDownloadButton';
import { pdfCacheKey, type PdfInput, type PdfResult } from './pdf/pdf-input';
const { generate, download } = vi.hoisted(() => ({ generate: vi.fn(), download: vi.fn() }));
vi.mock('./pdf/create-cv-pdf', () => ({ generateCvPdf: generate }));
vi.mock('./pdf/pdf-utils', async (original) => ({ ...await original<object>(), downloadPdf: download }));
const createUrl = vi.fn(); const revokeUrl = vi.fn();
function result(input: PdfInput): PdfResult { return { blob: new Blob(['PDF']), pageCount: 1, density: 'comfortable', sourceKey: input.sourceKey, key: pdfCacheKey(input.sourceKey, 'comfortable'), data: input.data }; }
function Harness({ data, includePhoto = true }: { data: CvData; includePhoto?: boolean }) {
  return <CvPdfProvider data={data} includePhoto={includePhoto}><CvPreview /><CvPdfDownloadButton data={data} /></CvPdfProvider>;
}
async function debounce() { await act(async () => { await vi.advanceTimersByTimeAsync(500); await vi.dynamicImportSettled(); }); }
function loaded() { const frame = screen.getByTitle('CV:n PDF-esikatselu'); fireEvent.load(frame); return frame; }
beforeEach(() => {
  vi.useFakeTimers(); generate.mockReset(); download.mockReset(); createUrl.mockReset(); revokeUrl.mockReset();
  let serial = 0; createUrl.mockImplementation(() => `blob:pdf-${++serial}`);
  vi.stubGlobal('URL', class extends URL { static createObjectURL = createUrl; static revokeObjectURL = revokeUrl; });
  generate.mockImplementation(async (input: PdfInput) => result(input));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('näyttää vain PDF-esikatselun ja lataa saman Blobin generoimatta uudelleen', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  render(<Harness data={data} />);
  expect(screen.queryByRole('button', { name: 'Tekstiluonnos' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Sivutettu PDF' })).toBeNull();
  expect(screen.queryByRole('article')).toBeNull();
  const button = screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' });
  expect(button).toBeDisabled(); expect(generate).not.toHaveBeenCalled();
  await debounce(); loaded();
  expect(screen.getAllByTitle('CV:n PDF-esikatselu')).toHaveLength(1);
  expect(button).toBeEnabled(); fireEvent.click(button);
  expect(download).toHaveBeenCalledWith(createUrl.mock.calls[0]![0], 'Paivi_CV.pdf');
  expect(generate).toHaveBeenCalledOnce();
});
it('säilyttää edellisen kehyksen kunnes uusi latautuu; vapauttaa URLit vasta vaihdossa ja unmountissa', async () => {
  const data = createEmptyCv(); const view = render(<Harness data={data} />);
  await debounce(); const old = loaded();
  view.rerender(<Harness data={{ ...data, summary: 'Uusi esittely' }} />);
  expect(old).toBeInTheDocument(); expect(revokeUrl).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeDisabled();
  await debounce(); expect(old).toBeInTheDocument(); expect(revokeUrl).not.toHaveBeenCalled();
  fireEvent.load(screen.getByTitle('Valmistuva PDF-esikatselu'));
  expect(old).not.toBeInTheDocument(); expect(revokeUrl).toHaveBeenCalledWith('blob:pdf-1');
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeEnabled();
  view.unmount(); expect(revokeUrl.mock.calls).toEqual([['blob:pdf-1'], ['blob:pdf-2']]);
});
it('uusin revisio voittaa hitaasti valmistuvan vanhan generoinnin', async () => {
  const pending: { input: PdfInput; resolve: (result: PdfResult) => void }[] = [];
  generate.mockImplementation((input: PdfInput) => new Promise<PdfResult>((resolve) => pending.push({ input, resolve })));
  const data = createEmptyCv(); const view = render(<Harness data={data} />); await debounce();
  view.rerender(<Harness data={{ ...data, summary: 'Viimeisin versio' }} />); await debounce();
  await act(async () => pending[1]!.resolve(result(pending[1]!.input))); const current = loaded();
  await act(async () => pending[0]!.resolve(result(pending[0]!.input)));
  expect(screen.getByTitle('CV:n PDF-esikatselu')).toBe(current); expect(createUrl).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' }));
  expect(download).toHaveBeenCalledWith(createUrl.mock.calls[0]![0], 'CV.pdf');
});
it('virhe säilyttää vanhan esikatselun, estää vanhan latauksen ja sallii uuden yrityksen', async () => {
  const data = createEmptyCv(); const view = render(<Harness data={data} />); await debounce(); const old = loaded();
  generate.mockRejectedValueOnce(new Error('secret stack must not be exposed'));
  view.rerender(<Harness data={{ ...data, summary: 'Muutos' }} />); await debounce();
  expect(old).toBeInTheDocument(); expect(screen.getByRole('alert')).not.toHaveTextContent('secret');
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Yritä uudelleen' })); await debounce();
  fireEvent.load(screen.getByTitle('Valmistuva PDF-esikatselu'));
  expect(screen.queryByRole('alert')).toBeNull(); expect(old).not.toBeInTheDocument();
});
it('sama normalisoitu sisältö ei generoidu uudelleen; kuvan valinta käynnistää uuden arvion', async () => {
  const data = createEmptyCv(); data.summary = 'Teksti';
  const view = render(<Harness data={data} />); await debounce(); loaded();
  view.rerender(<Harness data={{ ...data, summary: ' Teksti ' }} />); await debounce(); expect(generate).toHaveBeenCalledOnce();
  view.rerender(<Harness data={data} includePhoto={false} />); await debounce(); expect(generate).toHaveBeenCalledTimes(2);
  expect(generate.mock.calls[1]![0].includePhoto).toBe(false);
});
it('unmount hylkää keskeneräisen tuloksen eikä luo Blob-URLia', async () => {
  let finish!: () => void;
  generate.mockImplementation((input: PdfInput) => new Promise<PdfResult>((resolve) => { finish = () => resolve(result(input)); }));
  const view = render(<Harness data={createEmptyCv()} />); await debounce(); view.unmount();
  await act(async () => finish()); expect(createUrl).not.toHaveBeenCalled();
});
it('20 päivitystä vapauttaa kaikki korvatut ja viimeisen Blob-URLin', async () => {
  const data = createEmptyCv(); const view = render(<Harness data={data} />); await debounce(); loaded();
  for (let index = 0; index < 20; index++) {
    view.rerender(<Harness data={{ ...data, summary: `Versio ${index}` }} />); await debounce();
    fireEvent.load(screen.getByTitle('Valmistuva PDF-esikatselu'));
    expect(screen.getAllByTitle('CV:n PDF-esikatselu')).toHaveLength(1);
  }
  expect(revokeUrl).toHaveBeenCalledTimes(20); view.unmount(); expect(revokeUrl).toHaveBeenCalledTimes(21);
});

it('nopeat muutokset yhdistyvät yhdeksi generoinniksi ja kumoaminen käyttää valmista versiota', async () => {
  const data = createEmptyCv(); const view = render(<Harness data={data} />);
  await debounce(); const original = loaded();
  for (let index = 0; index < 10; index++) {
    view.rerender(<Harness data={{ ...data, summary: String(index) }} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
  }
  expect(generate).toHaveBeenCalledOnce();
  view.rerender(<Harness data={data} />); await debounce();
  expect(generate).toHaveBeenCalledOnce();
  expect(screen.getByTitle('CV:n PDF-esikatselu')).toBe(original);
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeEnabled();
});
it('tyhjennys vapauttaa näkyvän PDF:n eikä kesken ollut generointi palauta henkilötietoja', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Poistettava';
  const view = render(<Harness key="before" data={data} />); await debounce(); loaded();
  let finish!: () => void;
  generate.mockImplementationOnce((input: PdfInput) => new Promise<PdfResult>((resolve) => { finish = () => resolve(result(input)); }));
  view.rerender(<Harness key="before" data={{ ...data, summary: 'Vanha työ' }} />); await debounce();
  view.rerender(<Harness key="after" data={createEmptyCv()} />);
  expect(screen.queryByTitle('CV:n PDF-esikatselu')).toBeNull();
  expect(revokeUrl).toHaveBeenCalledWith('blob:pdf-1');
  await act(async () => finish());
  expect(createUrl).toHaveBeenCalledOnce();
  await debounce(); loaded();
  expect(generate.mock.calls.at(-1)![0].data.personalDetails.firstName).toBe('');
});

it('StrictMode ei luo renderöintisilmukkaa eikä jätä URLia vapauttamatta', async () => {
  const data = createEmptyCv(); const view = render(<StrictMode><Harness data={data} /></StrictMode>);
  await debounce(); loaded(); await debounce();
  expect(generate).toHaveBeenCalledOnce(); expect(createUrl).toHaveBeenCalledOnce();
  view.unmount(); expect(revokeUrl.mock.calls).toEqual([['blob:pdf-1']]);
});

it('hidas kehyksen lataus ei julkaise vanhentunutta versiota; kumoaminen voi käyttää valmista kehystä', async () => {
  const data = createEmptyCv(); const view = render(<Harness data={data} />); await debounce(); const original = loaded();
  const second = { ...data, summary: 'Toinen versio' };
  view.rerender(<Harness data={second} />); await debounce();
  const pending = screen.getByTitle('Valmistuva PDF-esikatselu');
  view.rerender(<Harness data={{ ...data, summary: 'Kolmas versio' }} />);
  fireEvent.load(pending);
  expect(screen.getByTitle('CV:n PDF-esikatselu')).toBe(original);
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeDisabled();
  expect(revokeUrl).not.toHaveBeenCalled();
  view.rerender(<Harness data={second} />);
  expect(screen.getByTitle('CV:n PDF-esikatselu')).toBe(pending);
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toBeEnabled();
  await debounce(); expect(generate).toHaveBeenCalledTimes(2);
  expect(revokeUrl).toHaveBeenCalledWith('blob:pdf-1');
});
