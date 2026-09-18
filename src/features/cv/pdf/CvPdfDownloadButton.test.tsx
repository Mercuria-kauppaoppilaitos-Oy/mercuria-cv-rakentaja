import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { createEmptyCv } from '../cv-model';
import { CvPdfDownloadButton } from './CvPdfDownloadButton';

const { generate, download } = vi.hoisted(() => ({ generate: vi.fn(), download: vi.fn() }));
vi.mock('./create-cv-pdf', () => ({ createCvPdf: generate }));
vi.mock('./pdf-utils', () => ({ downloadPdf: download }));
beforeEach(() => { generate.mockReset(); download.mockReset(); generate.mockResolvedValue(new Blob(['%PDF-test'], { type: 'application/pdf' })); });

it('muodostaa PDF:n vasta näppäimistöpainalluksessa ja ilmoittaa onnistumisesta saavutettavasti', async () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi'; data.personalDetails.lastName = 'Määttä';
  render(<CvPdfDownloadButton data={data} />);
  expect(generate).not.toHaveBeenCalled(); expect(download).not.toHaveBeenCalled();
  const user = userEvent.setup(); await user.tab();
  expect(screen.getByRole('button', { name: 'Lataa CV PDF-muodossa' })).toHaveFocus();
  await user.keyboard('{Enter}');
  await waitFor(() => expect(download).toHaveBeenCalledWith(expect.any(Blob), 'Paivi_Maatta_CV.pdf'));
  expect(screen.getByRole('status')).toHaveTextContent('PDF on valmis');
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});

it('estää kaksoispainallukset ja käyttää painallushetken muuttumatonta tietokopiota', async () => {
  let resolve!: (blob: Blob) => void;
  generate.mockReturnValue(new Promise<Blob>((done) => { resolve = done; }));
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  render(<CvPdfDownloadButton data={data} />);
  const button = screen.getByRole('button');
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(generate).toHaveBeenCalledOnce());
  expect(button).toBeDisabled(); expect(screen.getByRole('status')).toHaveTextContent('PDF:ää luodaan…');
  data.personalDetails.firstName = 'Muutettu';
  expect(generate.mock.calls[0]![0].personalDetails.firstName).toBe('Päivi');
  await act(async () => resolve(new Blob(['%PDF-test'])));
  expect(download).toHaveBeenCalledWith(expect.any(Blob), 'Paivi_CV.pdf'); expect(button).toBeEnabled();
});

it('näyttää virheen ja sallii uuden yrityksen', async () => {
  generate.mockRejectedValueOnce(new Error('Render failed'));
  render(<CvPdfDownloadButton data={createEmptyCv()} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Yritä uudelleen');
  expect(screen.getByRole('button')).toBeEnabled(); expect(download).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button'));
  await waitFor(() => expect(download).toHaveBeenCalledOnce()); expect(screen.queryByRole('alert')).toBeNull();
});

it('ei aloita latausta, jos käyttäjä poistuu näkymästä generoinnin aikana', async () => {
  let resolve!: (blob: Blob) => void;
  generate.mockReturnValue(new Promise<Blob>((done) => { resolve = done; }));
  const view = render(<CvPdfDownloadButton data={createEmptyCv()} />);
  fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(generate).toHaveBeenCalledOnce()); view.unmount();
  await act(async () => resolve(new Blob(['%PDF-test'])));
  expect(download).not.toHaveBeenCalled();
});

it('estää virheellisten CV-tietojen viennin', () => {
  const data = createEmptyCv(); data.personalDetails.email = 'invalid';
  render(<CvPdfDownloadButton data={data} />);
  expect(screen.getByRole('button')).toBeDisabled(); expect(generate).not.toHaveBeenCalled();
});
