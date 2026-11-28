import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 3000, strictPort: true },
  plugins: [
    tanstackStart({
      // The database drivers cannot run in a browser, and the schema would
      // bring the query builder along. The build fails when one of these
      // imports survives into the client bundle.
      importProtection: {
        include: ['src/**', '**/packages/**'],
        client: {
          specifiers: [
            '@wichteln/db/client',
            '@wichteln/db/migrate',
            '@wichteln/db/schema',
            /^@effect\/sql-pg(?:\/|$)/u,
            /^postgres(?:\/|$)/u,
          ],
        },
      },
    }),
    nitro({
      preset: 'bun',
      plugins: ['./src/shared/runtime/exit-on-close.ts'],
    }),
    viteReact(),
    tailwindcss(),
  ],
});
