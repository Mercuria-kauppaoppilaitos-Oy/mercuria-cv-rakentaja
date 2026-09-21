import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { createEmptyCv } from '../cv-model';
import { CvPdfDownloadButton } from './CvPdfDownloadButton';
const { state, download } = vi.hoisted(() => ({ state: { ready: false, error: '', result: undefined as { blob: Blob; data: ReturnType<typeof createEmptyCv> } | undefined }, download: vi.fn() }));
vi.mock('./CvPdfProvider', () => ({ useCvPdf: () => state }));
vi.mock('./pdf-utils', () => ({ downloadPdf: download }));
it('ei lataa keskeneräistä PDF:ää ja käyttää valmiin version tietoja ja Blobia', () => {
  const data = createEmptyCv(); data.personalDetails.firstName = 'Päivi';
  state.ready = false; state.result = { blob: new Blob(['PDF']), data };
  const view = render(<CvPdfDownloadButton data={data} />);
  expect(screen.getByRole('button')).toBeDisabled();
  state.ready = true; view.rerender(<CvPdfDownloadButton data={data} />);
  fireEvent.click(screen.getByRole('button'));
  expect(download).toHaveBeenCalledWith(state.result.blob, 'Paivi_CV.pdf');
});
it('valokuvavalinta kutsuu yhteistä ohjainta muuttamatta kuvaa', () => {
  const data = createEmptyCv(); data.appearance.photoDataUrl = 'data:image/jpeg;base64,AAAA'; const snapshot = JSON.stringify(data);
  const change = vi.fn(); render(<CvPdfDownloadButton data={data} pdfPhoto={{ includePhoto: true, onChange: change }} />);
  fireEvent.click(screen.getByLabelText('Sisällytä valokuva PDF:ään'));
  expect(change).toHaveBeenCalledWith(false); expect(JSON.stringify(data)).toBe(snapshot);
});
