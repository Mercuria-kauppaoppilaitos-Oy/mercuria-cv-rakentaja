import { expect, it } from 'vitest';
import { getCvSections } from './cv-content';
import { createLongCvFixture } from '../../test/cv-fixture';
import { createEmptyCv } from './cv-model';
it.each([false, true])('kuva ja väri eivät muuta semanttista sisältövirtaa: %s', (photo) => {
  const data = createLongCvFixture(); const original = getCvSections(data);
  data.appearance.photoDataUrl = photo ? 'data:image/jpeg;base64,/9j/AA==' : '';
  data.appearance.accentColor = '#203040';
  expect(getCvSections(data)).toEqual(original);
  expect(original.map((section) => section.heading)).toEqual(['ESITTELY', 'TYÖKOKEMUS', 'KOULUTUS', 'OSAAMINEN', 'KIELITAITO', 'KORTIT JA PÄTEVYYDET', 'SUOSITTELIJAT']);
});
it('tyhjällä CV:llä ei ole sisältöosioita eikä esimerkkitekstejä', () => expect(getCvSections(createEmptyCv())).toEqual([]));
