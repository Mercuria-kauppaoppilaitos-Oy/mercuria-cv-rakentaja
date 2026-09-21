import type { CvDensity } from '../cv-layout';

/** Equal page counts keep the airier layout. Only finished candidates are used. */
export async function selectPdfDensity<T extends { pageCount: number }>(render: (density: CvDensity) => Promise<T>, signal?: AbortSignal): Promise<T & { density: CvDensity }> {
  let best: (T & { density: CvDensity }) | undefined;
  for (const density of ['comfortable', 'compact', 'tight'] as const) {
    signal?.throwIfAborted();
    const candidate = { ...await render(density), density };
    signal?.throwIfAborted();
    if (!Number.isInteger(candidate.pageCount) || candidate.pageCount < 1) throw new Error('Invalid PDF page count');
    if (!best || candidate.pageCount < best.pageCount) best = candidate;
    if (best.pageCount === 1) break;
  }
  return best!;
}
