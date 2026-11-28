// The accessibility suite's web server: a fresh database with made-up
// seasons, and the built app on top of it. The database is dropped when
// Playwright stops the server.
import process from 'node:process';
import { Database, pgLayerForUrl } from '@wichteln/db/client';
import { createTestDatabase } from '@wichteln/db/testing/postgres-test-database';
import { Effect, Layer } from 'effect';
import {
  AdminRepository,
  AdminRepositoryLive,
} from '../src/features/admin/admin-repository';
import { hashToken } from '../src/shared/auth/tokens';
import { a11yPort, family } from './family';

const seed = Effect.gen(function* () {
  const admin = yield* AdminRepository;
  const sql = yield* Database;
  yield* admin.importSeasons({
    people: family.map(({ name, paper }) => ({ name, paper })),
    seasons: [
      {
        year: 2024,
        pairs: {},
        wishes: Object.fromEntries([
          [
            'Kemal',
            [
              { title: 'Kletterseil', note: 'Mindestens 60 Meter', url: null },
              {
                title: 'Kaffeebohnen',
                note: null,
                url: 'https://example.com/kaffee',
              },
            ],
          ],
          ['Mara', [{ title: 'Wollsocken', note: 'Größe 38', url: null }]],
        ]),
      },
      { year: 2025, pairs: {}, wishes: {} },
    ],
  });
  yield* admin.openSeason(2026, ['Mara', 'Maximilian', 'Ida']);
  yield* admin.setPairs(2026, [
    ['Mara', 'Maximilian'],
    ['Maximilian', 'Ida'],
    ['Ida', 'Mara'],
  ]);
  yield* Effect.forEach(
    family,
    ({ name, secret }) => sql`
      insert into access_links (person_id, token_hash)
      select id, ${hashToken(secret)} from people where name = ${name}
    `,
    { discard: true },
  );
  yield* sql`
    insert into wishes (year, person_id, title, note, url)
    select 2026, id, 'Hörbuch', 'Gern ein Krimi', 'https://example.com/hoerbuch'
    from people where name = 'Maximilian'
  `;
});

const database = await createTestDatabase();
await Effect.runPromise(
  seed.pipe(
    Effect.provide(
      AdminRepositoryLive.pipe(Layer.provideMerge(pgLayerForUrl(database.url))),
    ),
  ),
);

const origin = `http://127.0.0.1:${a11yPort}`;
// The server runs as in production, with its secure, host-only session
// cookie, which Chromium accepts from 127.0.0.1 without HTTPS.
const server = Bun.spawn(['bun', '.output/server/index.mjs'], {
  env: {
    ...process.env,
    ...Object.fromEntries([
      ['NODE_ENV', 'production'],
      ['DATABASE_URL', database.url],
      ['PORT', String(a11yPort)],
      ['HOST', '127.0.0.1'],
      ['PUBLIC_ORIGIN', origin],
    ]),
  },
  stdio: ['ignore', 'inherit', 'inherit'],
});

const stop = async () => {
  server.kill();
  await server.exited;
  await database.drop();
  process.exit(0);
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
