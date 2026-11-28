import { expect, it } from 'bun:test';
import { isWebAddress } from './web-address';

it('a web page is a web address', () => {
  expect(isWebAddress('https://www.example.com/schal')).toBe(true);
  expect(isWebAddress('http://example.com')).toBe(true);
  expect(isWebAddress('HTTPS://example.com/schal')).toBe(true);
});

it('an address without both slashes is none, because it opens on this app', () => {
  expect(isWebAddress('https:example.com/item')).toBe(false);
  expect(isWebAddress('HTTP:example.com/item')).toBe(false);
  expect(isWebAddress('https:/example.com/item')).toBe(false);
});

it('an address the browser cannot open is none', () => {
  expect(isWebAddress('https://example.com:abc/item')).toBe(false);
  expect(isWebAddress('https://kein Link')).toBe(false);
  expect(isWebAddress('https://example.com/kein Link')).toBe(false);
  expect(isWebAddress('mailto:mara@example.com')).toBe(false);
  expect(isWebAddress('javascript:alert(1)')).toBe(false);
  expect(isWebAddress('')).toBe(false);
});
