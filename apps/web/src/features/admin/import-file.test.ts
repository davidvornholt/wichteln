import { expect, it } from 'bun:test';
import { decodeImportFile } from './import-file';

const fileWithLink = (url: string | null) => ({
  people: [{ name: 'Mara', paper: 'kirsch' }],
  seasons: [
    {
      year: 2024,
      pairs: {},
      wishes: Object.fromEntries([
        ['Mara', [{ title: 'Schal', note: null, url }]],
      ]),
    },
  ],
});

it('an imported wish keeps its web link', () => {
  const file = decodeImportFile(fileWithLink('https://example.com/schal'));
  expect(file.seasons[0]?.wishes.Mara?.[0]?.url).toBe(
    'https://example.com/schal',
  );
  expect(() => decodeImportFile(fileWithLink(null))).not.toThrow();
});

it('an import with a link that is no web page is refused', () => {
  expect(() =>
    decodeImportFile(fileWithLink('mailto:mara@example.com')),
  ).toThrow('Der Link führt nicht zu einer Webseite.');
});
