import { expect, it } from 'bun:test';
import { webAddress, withWebScheme } from './wish-limits';

it('a link copied without its scheme becomes a secure web address', () => {
  expect(withWebScheme('amazon.de/dp/123')).toBe('https://amazon.de/dp/123');
  expect(withWebScheme('http://example.com')).toBe('http://example.com');
  expect(withWebScheme('')).toBe('');
});

it('only web pages count as links', () => {
  expect(webAddress.test(withWebScheme('www.example.com/schal'))).toBe(true);
  expect(webAddress.test(withWebScheme('kein Link'))).toBe(false);
  expect(webAddress.test(withWebScheme('mailto:mara@example.com'))).toBe(false);
});
