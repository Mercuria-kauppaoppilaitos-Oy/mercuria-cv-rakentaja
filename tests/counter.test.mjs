import test from 'node:test';
import assert from 'node:assert/strict';
import { increment } from '../src/counter.ts';

test('painallus kasvattaa laskuria yhdellä', () => {
  assert.equal(increment(0), 1);
  assert.equal(increment(9), 10);
});
