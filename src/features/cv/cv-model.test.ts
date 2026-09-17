import { expect, it } from 'vitest';
import { createEmptyCv, cvSchema } from './cv-model';

it('luo kelvollisen tyhjän CV:n ja itsenäiset lähtöarvot', () => {
  const first = createEmptyCv();
  const second = createEmptyCv();
  expect(cvSchema.safeParse(first).success).toBe(true);
  expect(Object.values(first.personalDetails).every((value) => value === '')).toBe(true);
  expect(first.summary).toBe('');
  first.skills.push({ id: 'skill-1', name: 'Asiakaspalvelu' });
  first.personalDetails.firstName = 'Meri';
  expect(second.skills).toEqual([]);
  expect(second.personalDetails.firstName).toBe('');
});
