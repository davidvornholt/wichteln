import { expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { WishTag } from './wish-tag';

const tagWithLink = (url: string) =>
  renderToStaticMarkup(
    <WishTag note={null} paper="kirsch" title="Schal" url={url} />,
  );

it('a stored web link opens the page', () => {
  expect(tagWithLink('https://www.example.com/schal')).toContain(
    'href="https://www.example.com/schal"',
  );
});

it('a stored link that is no web page is shown as text only', () => {
  const markup = tagWithLink('mailto:mara@example.com');
  expect(markup).not.toContain('<a');
  expect(markup).not.toContain('href');
  expect(markup).toContain('mailto:mara@example.com');
});
