import { afterAll, beforeAll, expect, it } from 'bun:test';
import { Database, pgLayerForUrl } from '@wichteln/db/client';
import {
  createTestDatabase,
  type TestDatabase,
} from '@wichteln/db/testing/postgres-test-database';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { AccessRepository, AccessRepositoryLive } from './access-repository';
import { hashToken, newToken } from './tokens';

let database: TestDatabase;
let runtime: ManagedRuntime.ManagedRuntime<
  AccessRepository | Database,
  unknown
>;

const run = <A, E>(effect: Effect.Effect<A, E, AccessRepository | Database>) =>
  runtime.runPromise(effect);

const linkToken = newToken();

beforeAll(async () => {
  database = await createTestDatabase();
  runtime = ManagedRuntime.make(
    AccessRepositoryLive.pipe(Layer.provideMerge(pgLayerForUrl(database.url))),
  );
  await run(
    Effect.gen(function* () {
      const sql = yield* Database;
      yield* sql`
        with person as (
          insert into people (name, paper) values ('Mara', 'kirsch') returning id
        )
        insert into access_links (person_id, token_hash)
        select id, ${hashToken(linkToken)} from person
      `;
    }),
  );
});

afterAll(async () => {
  await runtime.dispose();
  await database.drop();
});

const redeem = (token: string) =>
  run(Effect.flatMap(AccessRepository, (access) => access.redeemLink(token)));

const personFor = (token: string) =>
  run(
    Effect.flatMap(AccessRepository, (access) =>
      access.personForSession(token),
    ),
  );

it('one link signs in a phone and then a tablet', async () => {
  const phone = await redeem(linkToken);
  const tablet = await redeem(linkToken);
  expect(phone?.person.name).toBe('Mara');
  expect(tablet?.person.name).toBe('Mara');
  expect(phone?.token).not.toBe(tablet?.token);
  expect((await personFor(phone?.token ?? ''))?.name).toBe('Mara');
  expect((await personFor(tablet?.token ?? ''))?.name).toBe('Mara');
});

it('an unknown or malformed link signs nobody in', async () => {
  expect(await redeem(newToken())).toBeUndefined();
  expect(await redeem('kurz')).toBeUndefined();
  expect(await personFor('kurz')).toBeUndefined();
});

it('signing out ends only that device’s session', async () => {
  const phone = await redeem(linkToken);
  const tablet = await redeem(linkToken);
  await run(
    Effect.flatMap(AccessRepository, (access) =>
      access.endSession(phone?.token ?? ''),
    ),
  );
  expect(await personFor(phone?.token ?? '')).toBeUndefined();
  expect((await personFor(tablet?.token ?? ''))?.name).toBe('Mara');
});

it('a revoked link signs in no new device and ends the old sessions', async () => {
  const phone = await redeem(linkToken);
  await run(
    Effect.gen(function* () {
      const sql = yield* Database;
      yield* sql`update access_links set revoked_at = now()`;
    }),
  );
  expect(await personFor(phone?.token ?? '')).toBeUndefined();
  expect(await redeem(linkToken)).toBeUndefined();
});
