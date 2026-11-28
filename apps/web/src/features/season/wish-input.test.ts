import { expect, it } from 'bun:test';
import { decodeWishInput } from './wish-input';

const wishWithLink = (url: string) =>
  decodeWishInput({ title: 'Schal', note: '', url });

it('a completed link to a web page is taken', () => {
  expect(wishWithLink('https://www.example.com/schal').url).toBe(
    'https://www.example.com/schal',
  );
  expect(wishWithLink('').url).toBe('');
});

it('a link the browser cannot open is refused as a link', () => {
  expect(() => wishWithLink('https://example.com:abc/item')).toThrow(
    'Der Link führt nicht zu einer Webseite.',
  );
  expect(() => wishWithLink('mailto:mara@example.com')).toThrow(
    'Der Link führt nicht zu einer Webseite.',
  );
});
