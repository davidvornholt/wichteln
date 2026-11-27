import { createA11yPlaywrightConfig } from '@davidvornholt/a11y-testing/playwright-config';
import { a11yPort } from './a11y/family';

// The web server needs the PostgreSQL server on the host, so the suite runs
// with `playwright test` rather than the network-isolated a11y-playwright.
const config = createA11yPlaywrightConfig({
  baseUrl: `http://127.0.0.1:${a11yPort}`,
  webServerCommand: 'bun --env-file=.env.local a11y/serve.ts',
});

export default {
  ...config,
  webServer: {
    ...config.webServer,
    // Gives a11y/serve.ts the time to drop its database.
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10_000 },
  },
};
