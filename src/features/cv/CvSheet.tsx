import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { CvData } from './cv-model';
import { contrastingText, defaultAccentColor, isHexColor, mixWithWhite } from './color-utils';
import { cvContentLayout as layout } from './cv-layout';

const a4WidthInPixels = 210 * 96 / 25.4;

/** Scales the physical A4 sheet to its viewport without changing its text layout. */
export function CvSheet({ appearance, children }: { appearance: CvData['appearance']; children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const resize = () => {
      const width = Math.floor(element.clientWidth);
      if (width > 0) {
        const next = Math.max(0.1, Math.min(1, Math.floor(width / a4WidthInPixels * 10000) / 10000));
        setScale((current) => Math.abs(next - current) >= 0.001 ? next : current);
      }
    };
    resize();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const accent = isHexColor(appearance.accentColor) ? appearance.accentColor : defaultAccentColor;
  const style: CSSProperties & Record<string, string | number> = {
    '--cv-section-gap': `${layout.sectionGapMm}mm`,
    '--cv-first-section-gap': `${layout.firstSectionGapMm}mm`,
    '--cv-heading-gap': `${layout.headingGapMm}mm`,
    '--cv-decoration-gap': `${layout.decorationGapMm}mm`,
    '--cv-summary-padding': `${layout.summaryPaddingMm}mm`,
    '--cv-entry-gap': `${layout.entryGapMm}mm`,
    '--cv-description-gap': `${layout.descriptionGapMm}mm`,
    '--cv-metadata-gap': `${layout.metadataGapMm}mm`,
    '--cv-accent': accent,
    '--cv-surface': accent === defaultAccentColor ? '#F7F4F0' : mixWithWhite(accent),
    '--cv-header-text': contrastingText(accent),
    fontFamily: appearance.fontFamily === 'serif' ? 'Georgia, serif' : 'var(--cv-body-font)',
    fontSize: `${appearance.fontSize}pt`,
    lineHeight: appearance.lineHeight,
    zoom: scale,
  };
  return <div ref={viewport} className="cv-sheet-viewport">
    <article className="cv-page" style={style} aria-label="Ansioluettelon esikatselu" aria-describedby="preview-help">{children}</article>
  </div>;
}
