// What a signed-in device must not leave behind: in a shared tab, in a cache
// between the server and the browser, or in a cookie another site can set.
import type * as playwright from '@playwright/test';
import { expect } from '@playwright/test';
import { family, welcomePath } from './family';
import { signIn, test } from './fixtures';

const giftHeading = /^Dein Wichtel/u;
const listHeading = /^Dein Wunschzettel/u;
const sessionCookie = '__Host-wichteln_session';
const noStore = 'private, no-store';
const welcomeAddress = /\/willkommen$/u;

// Which of the given texts the page's router still holds anywhere, in its
// current matches or in the results it keeps for routes visited before.
const textsInRouter = (
  page: playwright.Page,
  texts: ReadonlyArray<string>,
): Promise<Array<string>> =>
  page.evaluate((searched) => {
    const seen = new WeakSet<object>();
    const strings: Array<string> = [];
    const children = (value: object): Array<unknown> =>
      value instanceof Map || value instanceof Set
        ? [...value.entries()].flat()
        : Object.values(value);
    const visit = (value: unknown): void => {
      if (typeof value === 'string') {
        strings.push(value);
      } else if (
        typeof value === 'object' &&
        value !== null &&
        !(value instanceof Node) &&
        !seen.has(value)
      ) {
        seen.add(value);
        for (const child of children(value)) {
          visit(child);
        }
      }
    };
    const { __TSR_ROUTER__: router } = globalThis as unknown as {
      readonly __TSR_ROUTER__: { readonly state: unknown };
    };
    visit([router.state, router]);
    return searched.filter((text) =>
      strings.some((string) => string.includes(text)),
    );
  }, texts);

test('signing out leaves nothing of the person in the tab', async ({
  context,
  page,
}) => {
  await signIn(page, 'Mara');
  // A document loaded while signed in carries the season itself.
  await page.reload();
  await page.getByRole('link', { name: 'Wunschzettel' }).click();
  await expect(page.getByRole('heading', { name: listHeading })).toBeVisible();
  await page.getByRole('link', { name: 'Wichtel', exact: true }).click();
  await expect(page.getByRole('heading', { name: giftHeading })).toBeVisible();
  await page.getByRole('button', { name: 'Angemeldet als Mara' }).click();
  await page.getByRole('button', { name: 'Auf diesem Gerät abmelden' }).click();
  await expect(page.getByRole('heading', { name: 'Wichteln' })).toBeVisible();
  // Mara gives to Maximilian, who wishes for an audiobook.
  const person = ['Mara', 'Maximilian', 'Hörbuch'];
  const html = await page.content();
  expect(person.filter((text) => html.includes(text))).toEqual([]);
  expect(await textsInRouter(page, person)).toEqual([]);
  expect((await context.cookies()).map(({ name }) => name)).not.toContain(
    sessionCookie,
  );
});

test('pages and server functions of a signed-in device are never cached', async ({
  page,
}) => {
  await signIn(page, 'Mara');
  const serverFunctions: Array<{ method: string; cacheControl?: string }> = [];
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/_serverFn/')) {
      serverFunctions.push({
        method: response.request().method(),
        cacheControl: response.headers()['cache-control'],
      });
    }
  });
  const document = await page.reload();
  expect(document?.headers()['cache-control']).toBe(noStore);
  await page.getByRole('link', { name: 'Wunschzettel' }).click();
  await expect(page.getByRole('heading', { name: listHeading })).toBeVisible();
  await page.getByRole('link', { name: 'Früher' }).click();
  await expect(page.getByRole('tab', { name: '2025' })).toBeVisible();
  expect(serverFunctions.map(({ method }) => method)).toContain('GET');
  expect(serverFunctions).toEqual(
    serverFunctions.map(({ method }) => ({ method, cacheControl: noStore })),
  );
});

test('the session cookie belongs to this host alone', async ({
  baseURL,
  context,
  page,
}) => {
  await signIn(page, 'Mara');
  const cookies = await context.cookies();
  const session = cookies.find(({ name }) => name === sessionCookie);
  expect(session).toMatchObject({ httpOnly: true, path: '/', secure: true });
  expect(cookies.map(({ name }) => name)).not.toContain('wichteln_session');
  // A sibling subdomain can set a cookie without the prefix for the whole
  // domain. Such a cookie signs nobody in, even with a valid session in it.
  await context.clearCookies();
  await context.addCookies([
    { name: 'wichteln_session', value: session?.value ?? '', url: baseURL },
  ]);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wichteln' })).toBeVisible();
  await expect(page.getByRole('heading', { name: giftHeading })).toHaveCount(0);
});

test('of two links opened in one tab, the later one signs the device in', async ({
  page,
}) => {
  const maraSecret = family.find(({ name }) => name === 'Mara')?.secret ?? '';
  const isMaras = (request: playwright.Request) =>
    request.postData()?.includes(maraSecret) === true;
  const held = Promise.withResolvers<void>();
  const released = Promise.withResolvers<void>();
  // Mara's sign-in hangs on the way to the server until the test lets it go.
  await page.route('**/_serverFn/**', async (route) => {
    if (isMaras(route.request())) {
      held.resolve();
      await released.promise;
    }
    await route.fallback();
  });
  await page.goto(welcomePath('Mara'));
  await held.promise;
  await page.goto(welcomePath('Ida'));
  await expect(page).toHaveURL(welcomeAddress);
  const maraAnswered = page.waitForResponse((response) =>
    isMaras(response.request()),
  );
  released.resolve();
  await maraAnswered;
  await expect(page.getByRole('heading', { name: 'Ida' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mara' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Zu deinem Geschenk' }).click();
  await expect(page.getByRole('heading', { name: giftHeading })).toBeVisible();
  // A new document knows only the session cookie.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Angemeldet als Ida' }),
  ).toBeVisible();
});
