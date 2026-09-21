import { expect, it, vi } from 'vitest';
import { selectPdfDensity } from './pdf-density';
import { pdfCacheKey, preparePdfInput } from './pdf-input';
import { createEmptyCv } from '../cv-model';

it.each([
  [[1, 1, 1], 'comfortable', 1], [[2, 1, 1], 'compact', 2], [[2, 2, 1], 'tight', 3],
  [[3, 2, 2], 'compact', 3], [[2, 2, 2], 'comfortable', 3],
] as const)('sivumäärät %j valitsevat %s', async (counts, expected, calls) => {
  const render = vi.fn(async (density: string) => ({ pageCount: counts[['comfortable', 'compact', 'tight'].indexOf(density)]!, text: 'Sama sisältö' }));
  expect(await selectPdfDensity(render)).toMatchObject({ density: expected, text: 'Sama sisältö' });
  expect(render).toHaveBeenCalledTimes(calls);
  expect(await selectPdfDensity(render)).toMatchObject({ density: expected });
});
it('keskeytys estää seuraavan tiheyskandidaatin generoinnin', async () => {
  const controller = new AbortController();
  const render = vi.fn(async () => { controller.abort(); return { pageCount: 2 }; });
  await expect(selectPdfDensity(render, controller.signal)).rejects.toThrow();
  expect(render).toHaveBeenCalledOnce();
});
it('avain sisältää ulkoasun, kuvan, tiheyden ja layout-version mutta ei tyhjiä rivejä tai tunnisteita', () => {
  const data = createEmptyCv(); const original = preparePdfInput(data)!;
  data.skills.push({ id: 'empty', name: ' ' });
  expect(preparePdfInput(data)!.sourceKey).toBe(original.sourceKey);
  expect(preparePdfInput(data, false)!.sourceKey).not.toBe(original.sourceKey);
  data.appearance.accentColor = '#203040';
  expect(preparePdfInput(data)!.sourceKey).not.toBe(original.sourceKey);
  expect(pdfCacheKey(original.sourceKey, 'comfortable')).not.toBe(pdfCacheKey(original.sourceKey, 'compact'));
  expect(JSON.parse(original.sourceKey).layoutVersion).toBeGreaterThan(0);
});
