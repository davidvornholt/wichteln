import { expect, it } from 'bun:test';
import { christmasEveCountdown } from './christmas';

it('days count in Berlin, where the day starts an hour before UTC', () => {
  expect(christmasEveCountdown(new Date('2026-11-27T12:00:00Z'))).toEqual({
    kind: 'days',
    days: 27,
  });
  expect(christmasEveCountdown(new Date('2026-12-22T23:30:00Z'))).toEqual({
    kind: 'tomorrow',
  });
});

it('Christmas Eve itself and the days after it', () => {
  expect(christmasEveCountdown(new Date('2026-12-24T08:00:00Z'))).toEqual({
    kind: 'today',
  });
  expect(christmasEveCountdown(new Date('2026-12-25T08:00:00Z'))).toEqual({
    kind: 'over',
  });
});

it('the count starts again in the new year', () => {
  expect(christmasEveCountdown(new Date('2027-01-01T08:00:00Z'))).toEqual({
    kind: 'days',
    days: 357,
  });
});
