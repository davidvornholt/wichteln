// The unwrapping on a phone: what it does to the page around the gift, and
// how it ends when something gets in its way.
import type * as playwright from '@playwright/test';
import { expect } from '@playwright/test';
import { signIn, test } from './fixtures';

const phone = { width: 390, height: 844 };
const turned = { width: 844, height: 390 };
// Long enough to be past the burst, which comes 1.15 s after the press.
const pastTheBurst = 1800;
const ownList = /^Dein Wunschzettel/u;

// Where the page's vibrations are recorded.
type Recording = typeof globalThis & {
  vibrations?: Array<ReadonlyArray<number>>;
};

test.use({ viewport: phone });

// Records every vibration the page asks for, so a test can read them.
const recordVibrations = async (page: playwright.Page) => {
  await page.addInitScript(() => {
    const recording: Recording = globalThis;
    recording.vibrations = [];
    Object.defineProperty(navigator, 'vibrate', {
      configurable: true,
      value: (pattern: number | Iterable<number>) => {
        recording.vibrations?.push(
          typeof pattern === 'number' ? [pattern] : [...pattern],
        );
        return true;
      },
    });
  });
};

const vibrationsIn = (page: playwright.Page) =>
  page.evaluate(() => (globalThis as Recording).vibrations ?? []);

const unwrap = (page: playwright.Page) =>
  page.getByRole('button', { name: 'Auspacken' }).click();

test('the burst never makes the page wider than the phone', async ({
  page,
}) => {
  await signIn(page, 'Mara');
  await unwrap(page);
  const widestPage = await page.evaluate(
    (duration) =>
      new Promise<number>((resolve) => {
        const start = performance.now();
        let widest = 0;
        const sample = () => {
          widest = Math.max(widest, document.documentElement.scrollWidth);
          if (performance.now() - start < duration) {
            requestAnimationFrame(sample);
          } else {
            resolve(widest);
          }
        };
        sample();
      }),
    pastTheBurst,
  );
  expect(widestPage).toBe(phone.width);
});

test('reduced motion turned on after the page loaded still skips the unwrapping', async ({
  page,
}) => {
  await recordVibrations(page);
  await signIn(page, 'Mara');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await unwrap(page);
  // The gift opens at once, where the unwrapping would take three seconds.
  await expect(
    page.getByRole('heading', { name: 'Wunschzettel von Maximilian' }),
  ).toBeAttached({ timeout: 1000 });
  await expect(page.locator('.gift-confetti')).toHaveCount(0);
  expect(await vibrationsIn(page)).toEqual([]);
});

test('leaving the page while the gift charges stops the vibration', async ({
  page,
}) => {
  await recordVibrations(page);
  await signIn(page, 'Mara');
  await unwrap(page);
  await page.getByRole('link', { name: 'Wunschzettel', exact: true }).click();
  await expect(page.getByRole('heading', { name: ownList })).toBeVisible();
  const vibrations = await vibrationsIn(page);
  expect(vibrations.length).toBeGreaterThan(1);
  expect(vibrations.at(-1)).toEqual([]);
});

test('turning the phone while the gift charges turns the confetti with it', async ({
  page,
}) => {
  await signIn(page, 'Mara');
  await unwrap(page);
  // The confetti's canvas is there from the press on, and the gift bursts
  // only later.
  await expect(page.locator('.gift-confetti')).toBeAttached();
  await page.setViewportSize(turned);
  await expect
    .poll(() =>
      page
        .locator('.gift-confetti')
        .evaluate((canvas: HTMLCanvasElement) => [canvas.width, canvas.height]),
    )
    .toEqual([turned.width, turned.height]);
});

test('the sheen runs its course after the gift counts as open', async ({
  page,
}) => {
  await signIn(page, 'Mara');
  await unwrap(page);
  await expect(
    page.getByRole('button', { name: 'Noch einmal einpacken' }),
  ).toBeVisible();
  await expect(page.locator('.gift-sheen')).toBeAttached();
});

test('without a canvas the gift still opens and the room lifts', async ({
  page,
}) => {
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await signIn(page, 'Mara');
  await unwrap(page);
  await expect(
    page.getByRole('heading', { name: 'Wunschzettel von Maximilian' }),
  ).toBeVisible();
  await expect(page.locator('.gift-room')).toHaveCount(0);
});
