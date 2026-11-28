import { scanWcag22AaViolations } from '@davidvornholt/a11y-testing/axe';
import { expect } from '@playwright/test';
import { welcomePath } from './family';
import { signIn, test } from './fixtures';

const welcomeAddress = /\/willkommen$/u;
const listHeading = /^Dein Wunschzettel/u;
const notALink = /^Das ist kein Link\./u;
const exampleLink = /example\.com/u;
const changeScarf = /^Ändern.*Ein warmer Schal$/u;
const strikeThickScarf = /^Streichen.*Ein dicker Schal$/u;
const openLinkAgain =
  /öffne deinen Link dann noch einmal aus Davids Nachricht/u;

test('the landing page for a device that is not signed in', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Wichteln' })).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
});

test('a link that is no longer valid', async ({ page }) => {
  await page.goto(`/willkommen#${'x'.repeat(43)}`);
  await expect(
    page.getByRole('heading', { name: 'Dieser Link gilt nicht mehr' }),
  ).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
});

test('the greeting after a personal link signs a device in', async ({
  page,
}) => {
  await page.goto(welcomePath('Maximilian'));
  await expect(
    page.getByRole('button', { name: 'Zu deinem Geschenk' }),
  ).toBeVisible();
  await expect(page).toHaveURL(welcomeAddress);
  expect(await scanWcag22AaViolations(page)).toEqual([]);
});

test('a sign-in that fails on the way to the server', async ({ page }) => {
  let failed = false;
  await page.route('**/_serverFn/**', (route) => {
    if (failed || route.request().method() !== 'POST') {
      return route.fallback();
    }
    failed = true;
    return route.abort('internetdisconnected');
  });
  await page.goto(welcomePath('Maximilian'));
  await expect(
    page.getByRole('heading', { name: 'Die Anmeldung hat nicht geklappt' }),
  ).toBeVisible();
  await expect(page.getByText(openLinkAgain)).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  // The link from the message works again, also when it opens in this tab,
  // which only changes the fragment.
  await page.goto(welcomePath('Maximilian'));
  await expect(
    page.getByRole('button', { name: 'Zu deinem Geschenk' }),
  ).toBeVisible();
});

test('the wrapped gift and the unwrapped name with its wish list', async ({
  page,
}) => {
  await signIn(page, 'Mara');
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Auspacken' }).click();
  await expect(
    page.getByRole('heading', { name: 'Wunschzettel von Maximilian' }),
  ).toBeVisible();
  await expect(page.getByText('Hörbuch')).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  // The device remembers the unwrapped gift.
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Noch einmal einpacken' }),
  ).toBeVisible();
});

test('without motion, the greeting and the gift wait for nothing', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  // From here on, no timer fires and no animation frame runs.
  await page.clock.pauseAt(Date.now() + 60_000);
  await page.goto(welcomePath('Mara'));
  const onward = page.getByRole('button', { name: 'Zu deinem Geschenk' });
  await expect(onward).toBeVisible();
  // The paper and the card are in place as soon as the greeting appears.
  const greeting = await page.getByRole('main').evaluate((main) => {
    const [paper, content] = main.children;
    const card = content?.firstElementChild;
    return {
      paperClip: paper === undefined ? '' : getComputedStyle(paper).clipPath,
      cardOpacity: card ? getComputedStyle(card).opacity : '',
    };
  });
  expect(greeting).toEqual({
    paperClip: 'inset(0px 0px 0%)',
    cardOpacity: '1',
  });
  await onward.click();
  await page.getByRole('button', { name: 'Auspacken' }).click();
  await expect(
    page.getByRole('heading', { name: 'Wunschzettel von Maximilian' }),
  ).toBeAttached();
  await expect(page.getByText('Hörbuch')).toBeAttached();
});

test('writing, changing, and striking off wishes', async ({ page }) => {
  await signIn(page, 'Ida');
  await page.getByRole('link', { name: 'Wunschzettel' }).click();
  await expect(page.getByRole('heading', { name: listHeading })).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByLabel('Was wünschst du dir?').fill('Ein warmer Schal');
  await page.getByLabel('Link (optional)').fill('kein Link');
  await page.getByRole('button', { name: 'Auf den Zettel' }).click();
  await expect(page.getByRole('alert')).toHaveText(notALink);
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  // A link copied without https:// is completed.
  await page.getByLabel('Link (optional)').fill('www.example.com/schal');
  await page.getByRole('button', { name: 'Auf den Zettel' }).click();
  const list = page.getByRole('list', { name: 'Deine Wünsche 2026' });
  await expect(
    list.getByText('Ein warmer Schal', { exact: true }),
  ).toBeVisible();
  await expect(list.getByRole('link', { name: exampleLink })).toHaveAttribute(
    'href',
    'https://www.example.com/schal',
  );
  const editedTitle = page.getByLabel('Wunsch', { exact: true });
  await page.getByRole('button', { name: changeScarf }).click();
  await expect(editedTitle).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  // Cancelling keeps the wish as it was.
  await editedTitle.fill('Ein dicker Schal');
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(editedTitle).toBeHidden();
  await expect(
    list.getByText('Ein warmer Schal', { exact: true }),
  ).toBeVisible();
  // Saving changes it for good.
  await page.getByRole('button', { name: changeScarf }).click();
  await editedTitle.fill('Ein dicker Schal');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(editedTitle).toBeHidden();
  await page.reload();
  await expect(
    list.getByText('Ein dicker Schal', { exact: true }),
  ).toBeVisible();
  await expect(list.getByText('Ein warmer Schal', { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: strikeThickScarf }).click();
  await expect(page.getByText('„Ein dicker Schal“ gestrichen.')).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Zurückholen' }).click();
  await expect(
    list.getByText('Ein dicker Schal', { exact: true }),
  ).toBeVisible();
});

test('the wish lists of earlier years', async ({ page }) => {
  await signIn(page, 'Mara');
  await page.getByRole('link', { name: 'Früher' }).click();
  await expect(page.getByRole('tab', { name: '2025' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page.getByText('Die Wunschzettel von 2025 sind nicht erhalten geblieben.'),
  ).toBeVisible();
  await page.getByRole('tab', { name: '2025' }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: '2024' })).toBeFocused();
  await expect(page.getByText('Kletterseil')).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
});

test('the account menu', async ({ page }) => {
  await signIn(page, 'Maximilian');
  await page.getByRole('button', { name: 'Angemeldet als Maximilian' }).click();
  await expect(
    page.getByRole('button', { name: 'Auf diesem Gerät abmelden' }),
  ).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Auf diesem Gerät abmelden' }).click();
  await expect(page.getByRole('heading', { name: 'Wichteln' })).toBeVisible();
});

test('someone who skips this year', async ({ page }) => {
  await page.goto(welcomePath('Kemal'));
  await page.getByRole('button', { name: 'Zu deinem Geschenk' }).click();
  await expect(
    page.getByRole('heading', { name: '2026 ohne dich' }),
  ).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
});
