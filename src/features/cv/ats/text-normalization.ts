export function normalizeText(text: string): string {
  return text.normalize('NFKC').toLocaleLowerCase('fi').replace(/[^\p{L}\p{N}-]+/gu, ' ').trim().replace(/\s+/g, ' ');
}
export function containsPhrase(text: string, phrase: string): boolean {
  return ` ${normalizeText(text)} `.includes(` ${normalizeText(phrase)} `);
}
