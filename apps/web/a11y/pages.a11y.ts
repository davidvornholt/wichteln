import { scanWcag22AaViolations } from '@davidvornholt/a11y-testing/axe';
import type * as playwright from '@playwright/test';
import { expect, test } from '@playwright/test';
import { type FamilyName, welcomePath } from './family';

const giftHeading = /^Dein Wichtel/u;
const welcomeAddress = /\/willkommen$/u;
const listHeading = /^Dein Wunschzettel/u;
const notALink = /^Das ist kein Link\./u;
const exampleLink = /example\.com/u;
const changeScarf = /^Ändern.*Ein warmer Schal$/u;
const strikeScarf = /^Streichen.*Ein warmer Schal$/u;

const signIn = async (page: playwright.Page, name: FamilyName) => {
  await page.goto(welcomePath(name));
  await page.getByRole('button', { name: 'Zu deinem Geschenk' }).click();
  await expect(page.getByRole('heading', { name: giftHeading })).toBeVisible();
};

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
  await page.getByRole('button', { name: changeScarf }).click();
  await expect(page.getByLabel('Wunsch', { exact: true })).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('button', { name: strikeScarf }).click();
  await expect(page.getByText('„Ein warmer Schal“ gestrichen.')).toBeVisible();
  expect(await scanWcag22AaViolations(page)).toEqual([]);
  await page.getByRole('button', { name: 'Zurückholen' }).click();
  await expect(
    list.getByText('Ein warmer Schal', { exact: true }),
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
