import { expect, it } from 'bun:test';
import { pairProblems } from './pairs';

const family = ['Mara', 'Jonas', 'Zoë', 'Kemal'];

it('a ring is valid', () => {
  expect(
    pairProblems(family, [
      ['Mara', 'Jonas'],
      ['Jonas', 'Zoë'],
      ['Zoë', 'Kemal'],
      ['Kemal', 'Mara'],
    ]),
  ).toEqual([]);
});

it('drawing yourself is refused', () => {
  expect(
    pairProblems(
      ['Mara', 'Jonas'],
      [
        ['Mara', 'Mara'],
        ['Jonas', 'Jonas'],
      ],
    ),
  ).toContain('Mara würde sich selbst beschenken.');
});

it('someone left out is named', () => {
  const problems = pairProblems(family, [
    ['Mara', 'Jonas'],
    ['Jonas', 'Mara'],
    ['Zoë', 'Kemal'],
  ]);
  expect(problems).toContain('Kemal beschenkt 0 statt einer Person.');
  expect(problems).toContain('Zoë wird von 0 statt einer Person beschenkt.');
});

it('an outsider is named', () => {
  expect(
    pairProblems(
      ['Mara', 'Jonas'],
      [
        ['Mara', 'Paul'],
        ['Jonas', 'Mara'],
      ],
    ),
  ).toContain('Paul nimmt nicht teil.');
});
