export const defaultAccentColor = '#E9E1D8';
export function isHexColor(value: string): boolean { return /^#[\da-f]{6}$/i.test(value); }
function channels(hex: string): number[] {
  if (!isHexColor(hex)) throw new Error('Invalid HEX color');
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
}
export function relativeLuminance(hex: string): number {
  const rgb = channels(hex).map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
}
export function contrastRatio(first: string, second: string): number {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}
export function contrastingText(hex: string): '#000000' | '#FFFFFF' {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#FFFFFF') ? '#000000' : '#FFFFFF';
}
export function mixWithWhite(hex: string, whiteAmount = 0.92): string {
  const amount = Math.min(1, Math.max(0, whiteAmount));
  return '#' + channels(hex).map((value) => Math.round(value * (1 - amount) + 255 * amount).toString(16).padStart(2, '0')).join('').toUpperCase();
}
