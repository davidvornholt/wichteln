import { afterAll, beforeAll, expect, it } from 'bun:test';
import { Database, pgLayerForUrl } from '@wichteln/db/client';
import {
  createTestDatabase,
  type TestDatabase,
} from '@wichteln/db/testing/postgres-test-database';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { SeasonRepository, SeasonRepositoryLive } from './season-repository';

let database: TestDatabase;
let runtime: ManagedRuntime.ManagedRuntime<
  SeasonRepository | Database,
  unknown
>;

const run = <A, E>(effect: Effect.Effect<A, E, SeasonRepository | Database>) =>
  runtime.runPromise(effect);

const ids = new Map<string, string>();
const idOf = (name: string) => ids.get(name) ?? '';

// Last year Mara gave to Jonas. This year Mara gives to Jonas again, Jonas to
// Zoë, and Zoë to Mara. Paul took part only last year.
const seed = Effect.gen(function* () {
  const sql = yield* Database;
  const people = yield* sql<{ readonly id: string; readonly name: string }>`
    insert into people (name, paper) values
      ('Mara', 'kirsch'), ('Jonas', 'tanne'), ('Zoë', 'kobalt'), ('Paul', 'senf')
    returning id, name
  `;
  for (const person of people) {
    ids.set(person.name, person.id);
  }
  yield* sql`insert into seasons (year) values (2025), (2026)`;
  yield* sql`
    insert into participations (year, person_id) values
      (2025, ${idOf('Mara')}), (2025, ${idOf('Jonas')}), (2025, ${idOf('Paul')}),
      (2026, ${idOf('Mara')}), (2026, ${idOf('Jonas')}), (2026, ${idOf('Zoë')})
  `;
  const pair = (year: number, giver: string, recipient: string) => sql`
    update participations set recipient_id = ${idOf(recipient)}
    where year = ${year} and person_id = ${idOf(giver)}
  `;
  yield* pair(2025, 'Mara', 'Jonas');
  yield* pair(2025, 'Jonas', 'Paul');
  yield* pair(2025, 'Paul', 'Mara');
  yield* pair(2026, 'Mara', 'Jonas');
  yield* pair(2026, 'Jonas', 'Zoë');
  yield* pair(2026, 'Zoë', 'Mara');
  yield* sql`
    insert into wishes (year, person_id, title) values
      (2025, ${idOf('Jonas')}, 'Altes Spiel'),
      (2026, ${idOf('Jonas')}, 'Neues Spiel'),
      (2026, ${idOf('Zoë')}, 'Kletterseil')
  `;
});

const pastWishId = Effect.gen(function* () {
  const sql = yield* Database;
  const [row] = yield* sql<{ readonly id: string }>`
    select id from wishes where year = 2025 and person_id = ${idOf('Jonas')}
  `;
  return row?.id ?? '';
});

beforeAll(async () => {
  database = await createTestDatabase();
  runtime = ManagedRuntime.make(
    SeasonRepositoryLive.pipe(Layer.provideMerge(pgLayerForUrl(database.url))),
  );
  await run(seed);
});

afterAll(async () => {
  await runtime.dispose();
  await database.drop();
});

const viewOf = (name: string) =>
  run(
    Effect.flatMap(SeasonRepository, (repository) =>
      repository.view(idOf(name)),
    ),
  );

it('a giver sees this year’s wishes of their recipient and no one else’s', async () => {
  const view = await viewOf('Mara');
  expect(view).toEqual({
    kind: 'taking-part',
    year: 2026,
    recipient: {
      name: 'Jonas',
      paper: 'tanne',
      wishes: [
        { id: expect.any(String), title: 'Neues Spiel', note: null, url: null },
      ],
    },
    ownWishes: [],
  });
});

it('someone who skips the current season is told so', async () => {
  const view = await viewOf('Paul');
  expect(view).toEqual({ kind: 'not-taking-part', year: 2026 });
});

it('a wish goes on the current list of the person who writes it', async () => {
  const titles = await run(
    Effect.gen(function* () {
      const repository = yield* SeasonRepository;
      yield* repository.addWish(idOf('Mara'), {
        title: 'Schal',
        note: '',
        url: 'https://example.com/schal',
      });
      const view = yield* repository.view(idOf('Zoë'));
      return view.kind === 'taking-part'
        ? view.recipient?.wishes.map((wish) => [
            wish.title,
            wish.note,
            wish.url,
          ])
        : undefined;
    }),
  );
  expect(titles).toEqual([['Schal', null, 'https://example.com/schal']]);
});

it('someone who skips the current season cannot write wishes', async () => {
  const error = await run(
    Effect.flatMap(SeasonRepository, (repository) =>
      repository.addWish(idOf('Paul'), { title: 'Buch', note: '', url: '' }),
    ).pipe(Effect.flip),
  );
  expect(error._tag).toBe('NotTakingPart');
});

it('nobody changes or strikes off someone else’s wish', async () => {
  const errors = await run(
    Effect.gen(function* () {
      const repository = yield* SeasonRepository;
      const view = yield* repository.view(idOf('Jonas'));
      const zoesWish =
        view.kind === 'taking-part'
          ? (view.recipient?.wishes[0]?.id ?? '')
          : '';
      const changed = yield* repository
        .updateWish(idOf('Jonas'), zoesWish, {
          title: 'Nichts',
          note: '',
          url: '',
        })
        .pipe(Effect.flip);
      const struck = yield* repository
        .deleteWish(idOf('Jonas'), zoesWish)
        .pipe(Effect.flip);
      return [changed._tag, struck._tag];
    }),
  );
  expect(errors).toEqual(['WishNotFound', 'WishNotFound']);
});

it('last year’s wishes stay as they were', async () => {
  const error = await run(
    Effect.gen(function* () {
      const repository = yield* SeasonRepository;
      const id = yield* pastWishId;
      return yield* repository.deleteWish(idOf('Jonas'), id).pipe(Effect.flip);
    }),
  );
  expect(error._tag).toBe('WishNotFound');
});

it('a person changes and strikes off their own wish', async () => {
  const wishes = await run(
    Effect.gen(function* () {
      const repository = yield* SeasonRepository;
      const added = yield* repository.addWish(idOf('Jonas'), {
        title: 'Kopfhörer',
        note: '',
        url: '',
      });
      const changed = yield* repository.updateWish(idOf('Jonas'), added.id, {
        title: 'Kopfhörer',
        note: 'Over-Ear',
        url: '',
      });
      const before = yield* repository.view(idOf('Jonas'));
      yield* repository.deleteWish(idOf('Jonas'), added.id);
      const after = yield* repository.view(idOf('Jonas'));
      const own = (view: typeof before) =>
        view.kind === 'taking-part'
          ? view.ownWishes.map((wish) => wish.title)
          : [];
      return { changed: changed.note, before: own(before), after: own(after) };
    }),
  );
  expect(wishes).toEqual({
    changed: 'Over-Ear',
    before: ['Neues Spiel', 'Kopfhörer'],
    after: ['Neues Spiel'],
  });
});
