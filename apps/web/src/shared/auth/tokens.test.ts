import { expect, it } from 'bun:test';
import { hashToken, isWellFormedToken, newToken } from './tokens';

it('new tokens are well formed and differ', () => {
  const first = newToken();
  const second = newToken();
  expect(isWellFormedToken(first)).toBe(true);
  expect(first).not.toBe(second);
});

it('the hash is stable and hides the token', () => {
  const token = newToken();
  expect(hashToken(token)).toBe(hashToken(token));
  expect(hashToken(token)).not.toContain(token);
  expect(hashToken(token)).toHaveLength(64);
});

it('malformed tokens are refused', () => {
  expect(isWellFormedToken('')).toBe(false);
  expect(isWellFormedToken('a'.repeat(42))).toBe(false);
  expect(isWellFormedToken(`${'a'.repeat(42)}=`)).toBe(false);
});
