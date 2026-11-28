import { describe, expect, it } from 'bun:test';
import {
  burstMilliseconds,
  chargeMilliseconds,
  letterStaggerMilliseconds,
  nameMilliseconds,
  openingMilliseconds,
  unwrapVibration,
} from './gift-timing';

const sum = (values: ReadonlyArray<number>) =>
  values.reduce((total, value) => total + value, 0);

describe('the vibration through the unwrapping', () => {
  const pattern = unwrapVibration(5);
  const burstAt = pattern.indexOf(170);
  const charge = pattern.slice(0, burstAt);

  it('rumbles for exactly as long as the gift charges, faster towards the end', () => {
    expect(sum(charge)).toBe(chargeMilliseconds);
    const pulses = charge.filter((_, index) => index % 2 === 0);
    const gaps = charge.filter((_, index) => index % 2 === 1).slice(0, -1);
    expect(pulses.at(-2)).toBeGreaterThan(pulses[0] ?? 0);
    expect(gaps.at(-1)).toBeLessThan(gaps[0] ?? 0);
  });

  it('hits when the paper bursts and ticks once for each letter of the name', () => {
    expect(burstAt % 2).toBe(0);
    expect(sum(pattern.slice(0, burstAt))).toBe(burstMilliseconds);
    expect(sum(pattern.slice(0, burstAt + 2))).toBe(nameMilliseconds);
    expect(pattern.slice(burstAt + 2)).toEqual([
      12, 68, 12, 68, 12, 68, 12, 68, 12, 68,
    ]);
    expect(letterStaggerMilliseconds).toBe(80);
  });

  it('never has a negative time, and ends before the gift counts as open', () => {
    expect(pattern.every((value) => value >= 0)).toBe(true);
    expect(sum(pattern)).toBeLessThan(openingMilliseconds);
  });
});
