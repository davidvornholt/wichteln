// Renders the PNG app icons in `public` from `public/favicon.svg`. Run it
// after changing the favicon. The icon is wrapping paper to its edges, so
// launchers may crop it to any shape and it serves as the maskable icon too.
// biome-ignore lint/correctness/noUnresolvedImports: @playwright/test re-exports chromium through playwright/test, a chain Biome does not follow.
import { chromium } from '@playwright/test';

const publicDirectory = `${import.meta.dir}/../public`;

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
] as const;

const browser = await chromium.launch();
try {
  await Promise.all(
    icons.map(async (icon) => {
      const page = await browser.newPage();
      await page.goto(`file://${publicDirectory}/favicon.svg`);
      const svg = page.locator('svg');
      await svg.evaluate((element, size) => {
        element.setAttribute('width', String(size));
        element.setAttribute('height', String(size));
      }, icon.size);
      await svg.screenshot({ path: `${publicDirectory}/${icon.file}` });
    }),
  );
} finally {
  await browser.close();
}
