import { expect, it } from 'vitest';
import { contrastingText, contrastRatio, isHexColor, mixWithWhite, relativeLuminance } from './color-utils';

it.each(['#E9E1D8', '#a0b1c2', '#000000'])('hyväksyy kuusinumeroisen HEX-värin %s', (value) => expect(isHexColor(value)).toBe(true));
it.each(['red', '#fff', '#1234567', '123456', '#GG0000'])('hylkää virheellisen HEX-värin %s', (value) => expect(isHexColor(value)).toBe(false));
it('laskee suhteellisen luminanssin ja todellisen kontrastisuhteen', () => {
  expect(relativeLuminance('#000000')).toBe(0);
  expect(relativeLuminance('#FFFFFF')).toBe(1);
  expect(contrastRatio('#000000', '#FFFFFF')).toBe(21);
  expect(contrastRatio('#FFFFFF', '#000000')).toBe(21);
});
it.each(['#000000', '#FFFFFF', '#E9E1D8', '#006FBA', '#E44398', '#777777'])('valitsee AA-kontrastin saavuttavan tekstivärin taustalle %s', (value) => expect(contrastRatio(value, contrastingText(value))).toBeGreaterThanOrEqual(4.5));
it('muodostaa vaalean taustan HEX-arvona ilman CSS color-mix-funktiota', () => {
  expect(mixWithWhite('#000000', 0.5)).toBe('#808080');
  expect(mixWithWhite('#203040', 1)).toBe('#FFFFFF');
  expect(mixWithWhite('#203040', 0)).toBe('#203040');
});
