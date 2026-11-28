import { expect, it } from 'bun:test';
import { isWebAddress } from '../../shared/web-address';
import { withWebScheme } from './wish-limits';

it('a link copied without its scheme becomes a secure web address', () => {
  expect(withWebScheme('amazon.de/dp/123')).toBe('https://amazon.de/dp/123');
  expect(withWebScheme('http://example.com')).toBe('http://example.com');
  expect(withWebScheme('')).toBe('');
});

it('only web pages count as links', () => {
  expect(isWebAddress(withWebScheme('www.example.com/schal'))).toBe(true);
  expect(isWebAddress(withWebScheme('kein Link'))).toBe(false);
  expect(isWebAddress(withWebScheme('mailto:mara@example.com'))).toBe(false);
  expect(isWebAddress(withWebScheme('example.com:abc/item'))).toBe(false);
  expect(isWebAddress(withWebScheme('https:example.com/item'))).toBe(false);
});
