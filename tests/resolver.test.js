const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeTitle, yearsAreCompatible } = require('../src/resolver');

test('normalizeTitle handles punctuation, accents, and simple number-word variants', () => {
  assert.equal(normalizeTitle("Schindler's List"), 'schindler s list');
  assert.equal(normalizeTitle('Mari Cristófaro'), 'mari cristofaro');
  assert.equal(normalizeTitle('Twelve Monkeys'), '12 monkeys');
  assert.equal(normalizeTitle('12 Monkeys'), '12 monkeys');
});

test('yearsAreCompatible allows a one-year release drift but not larger mismatches', () => {
  assert.equal(yearsAreCompatible(2023, 2024), true);
  assert.equal(yearsAreCompatible(2023, 2025), false);
  assert.equal(yearsAreCompatible(null, 2025), true);
});
