// The suite's `test`. Every test fails on an uncaught error in any of its
// pages, because a server-only module in the browser bundle can leave every
// page unresponsive while each check still passes.
import type * as playwright from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { type FamilyName, welcomePath } from './family';

export const test = base.extend<{ failOnPageError: undefined }>({
  failOnPageError: [
    async ({ context }, use) => {
      // Listening on the context, before the test opens anything, catches
      // errors in every page, also while a page loads.
      const errors: Array<string> = [];
      context.on('weberror', (webError) => {
        const error = webError.error();
        errors.push(error.stack ?? error.message);
      });
      await use(undefined);
      expect(errors, 'uncaught errors in the page').toEqual([]);
    },
    { auto: true },
  ],
});

const giftHeading = /^Dein Wichtel/u;

export const signIn = async (page: playwright.Page, name: FamilyName) => {
  await page.goto(welcomePath(name));
  await page.getByRole('button', { name: 'Zu deinem Geschenk' }).click();
  await expect(page.getByRole('heading', { name: giftHeading })).toBeVisible();
};
