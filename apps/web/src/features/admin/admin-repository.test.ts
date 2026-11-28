import { afterAll, beforeAll, expect, it } from 'bun:test';
import { Database, pgLayerForUrl } from '@wichteln/db/client';
import {
  createTestDatabase,
  type TestDatabase,
} from '@wichteln/db/testing/postgres-test-database';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { hashToken } from '../../shared/auth/tokens';
import { AdminRepository, AdminRepositoryLive } from './admin-repository';

let database: TestDatabase;
let runtime: ManagedRuntime.ManagedRuntime<AdminRepository | Database, unknown>;

const run = <A, E>(effect: Effect.Effect<A, E, AdminRepository | Database>) =>
  runtime.runPromise(effect);

const admin = <A, E>(
  use: (repository: typeof AdminRepository.Service) => Effect.Effect<A, E>,
) => run(Effect.flatMap(AdminRepository, use));

const refusal = <A, E extends { readonly message: string }>(
  use: (repository: typeof AdminRepository.Service) => Effect.Effect<A, E>,
) =>
  run(
    Effect.flatMap(AdminRepository, (repository) =>
      use(repository).pipe(Effect.flip),
    ),
  ).then((error) => error.message);

const seasonYears = () =>
  run(
    Effect.gen(function* () {
      const sql = yield* Database;
      const rows = yield* sql<{ readonly year: number }>`
        select year from seasons order by year
      `;
      return rows.map((row) => row.year);
    }),
  );

const recipientOf = (year: number, giver: string) =>
  run(
    Effect.gen(function* () {
      const sql = yield* Database;
      const [row] = yield* sql<{ readonly name: string }>`
        select recipients.name from participations
        join people as givers on givers.id = participations.person_id
        join people as recipients on recipients.id = participations.recipient_id
        where participations.year = ${year} and givers.name = ${giver}
      `;
      return row?.name;
    }),
  );

beforeAll(async () => {
  database = await createTestDatabase();
  runtime = ManagedRuntime.make(
    AdminRepositoryLive.pipe(Layer.provideMerge(pgLayerForUrl(database.url))),
  );
});

afterAll(async () => {
  await runtime.dispose();
  await database.drop();
});

it('earlier seasons come in with their pairs and wishes', async () => {
  await admin((repository) =>
    repository.importSeasons({
      people: [
        { name: 'Mara', paper: 'kirsch' },
        { name: 'Jonas', paper: 'tanne' },
        { name: 'Paul', paper: 'senf' },
      ],
      seasons: [
        {
          year: 2024,
          pairs: Object.fromEntries([
            ['Mara', 'Jonas'],
            ['Jonas', 'Paul'],
            ['Paul', 'Mara'],
          ]),
          wishes: Object.fromEntries([
            ['Jonas', [{ title: 'Spiel', note: null, url: null }]],
          ]),
        },
        { year: 2023, pairs: {}, wishes: {} },
      ],
    }),
  );
  const status = await admin((repository) => repository.status);
  expect(status.people.map((person) => person.name)).toEqual([
    'Jonas',
    'Mara',
    'Paul',
  ]);
  expect(status.seasons.map((season) => season.year)).toEqual([2024]);
  expect(status.seasons[0]?.participants).toEqual([
    { name: 'Jonas', paired: true, wishes: 1 },
    { name: 'Mara', paired: true, wishes: 0 },
    { name: 'Paul', paired: true, wishes: 0 },
  ]);
});

it('an import with a broken round writes nothing', async () => {
  const message = await refusal((repository) =>
    repository.importSeasons({
      people: [{ name: 'Kemal', paper: 'pflaume' }],
      seasons: [
        {
          year: 2022,
          pairs: Object.fromEntries([['Kemal', 'Kemal']]),
          wishes: {},
        },
      ],
    }),
  );
  expect(message).toContain('Kemal würde sich selbst beschenken.');
  const status = await admin((repository) => repository.status);
  expect(status.people.map((person) => person.name)).not.toContain('Kemal');
});

it('an import that names someone nobody declared writes nothing', async () => {
  const misspeltWish = await refusal((repository) =>
    repository.importSeasons({
      people: [{ name: 'Kemal', paper: 'pflaume' }],
      seasons: [
        {
          year: 2022,
          pairs: {},
          wishes: Object.fromEntries([
            ['Kemal', [{ title: 'Buch', note: null, url: null }]],
            ['Kemaal', [{ title: 'Schal', note: null, url: null }]],
          ]),
        },
      ],
    }),
  );
  expect(misspeltWish).toBe('Niemand heißt Kemaal.');
  const misspeltPair = await refusal((repository) =>
    repository.importSeasons({
      people: [{ name: 'Kemal', paper: 'pflaume' }],
      seasons: [
        {
          year: 2022,
          pairs: Object.fromEntries([
            ['Kemal', 'Paol'],
            ['Paol', 'Kemal'],
          ]),
          wishes: {},
        },
      ],
    }),
  );
  expect(misspeltPair).toBe('Niemand heißt Paol.');
  const status = await admin((repository) => repository.status);
  expect(status.people.map((person) => person.name)).not.toContain('Kemal');
  expect(await seasonYears()).toEqual([2023, 2024]);
});

it('a new person gets a paper nobody has yet', async () => {
  expect(
    await admin((repository) => repository.addPerson('Zoë', undefined)),
  ).toBe('kobalt');
  expect(
    await refusal((repository) => repository.addPerson('Zoë', undefined)),
  ).toBe('Zoë gibt es schon.');
});

it('a season takes only pairs that form a round', async () => {
  await admin((repository) =>
    repository.openSeason(2026, ['Mara', 'Jonas', 'Zoë']),
  );
  expect(
    await refusal((repository) =>
      repository.setPairs(2026, [
        ['Mara', 'Jonas'],
        ['Jonas', 'Mara'],
      ]),
    ),
  ).toBe(
    [
      'Zoë beschenkt 0 statt einer Person.',
      'Zoë wird von 0 statt einer Person beschenkt.',
    ].join('\n'),
  );
  await admin((repository) =>
    repository.setPairs(2026, [
      ['Mara', 'Jonas'],
      ['Jonas', 'Zoë'],
      ['Zoë', 'Mara'],
    ]),
  );
  // A changed round replaces the old one, even where it swaps recipients.
  await admin((repository) =>
    repository.setPairs(2026, [
      ['Mara', 'Zoë'],
      ['Zoë', 'Jonas'],
      ['Jonas', 'Mara'],
    ]),
  );
  expect(await recipientOf(2026, 'Mara')).toBe('Zoë');
});

it('a season without anyone taking part is refused', async () => {
  expect(await refusal((repository) => repository.openSeason(2027, []))).toBe(
    'Für 2027 nimmt niemand teil.',
  );
  expect(await seasonYears()).toEqual([2023, 2024, 2026]);
  await admin((repository) => repository.openSeason(2027, ['Mara', 'Jonas']));
  expect(await seasonYears()).toEqual([2023, 2024, 2026, 2027]);
});

it('a new link replaces the old one and signs out its devices', async () => {
  const first = await admin((repository) => repository.issueLink('Mara'));
  const second = await admin((repository) => repository.issueLink('Mara'));
  const links = await run(
    Effect.gen(function* () {
      const sql = yield* Database;
      return yield* sql<{
        readonly tokenHash: string;
        readonly revoked: boolean;
      }>`
        select token_hash as "tokenHash", revoked_at is not null as revoked
        from access_links order by created_at
      `;
    }),
  );
  expect(links).toEqual([
    { tokenHash: hashToken(first), revoked: true },
    { tokenHash: hashToken(second), revoked: false },
  ]);
  expect(await refusal((repository) => repository.issueLink('Niemand'))).toBe(
    'Niemand heißt Niemand.',
  );
});
