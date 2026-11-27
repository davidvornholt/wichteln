import { afterAll, beforeAll, expect, it } from 'bun:test';
import { Database, pgLayerForUrl } from '@wichteln/db/client';
import {
  createTestDatabase,
  type TestDatabase,
} from '@wichteln/db/testing/postgres-test-database';
import { fileURLToPath, spawn, which } from 'bun';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { AdminRepository, AdminRepositoryLive } from './admin-repository';

const script = fileURLToPath(
  new URL('../../../scripts/admin.ts', import.meta.url),
);
const bun = which('bun') ?? 'bun';
const family = ['Mara', 'Jonas', 'Zoë'];

let database: TestDatabase;
let runtime: ManagedRuntime.ManagedRuntime<AdminRepository | Database, unknown>;

// Runs the command line from source against the test database only: the
// child gets no other environment and loads no .env file.
const runAdmin = async (args: ReadonlyArray<string>, input: string) => {
  const child = spawn([bun, '--no-env-file', script, ...args], {
    env: Object.fromEntries([['DATABASE_URL', database.url]]),
    stdin: new Blob([input]),
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { output: stdout + stderr, exitCode };
};

const recipients = () =>
  runtime.runPromise(
    Effect.gen(function* () {
      const sql = yield* Database;
      return yield* sql<{ readonly giver: string; readonly recipient: string }>`
        select givers.name as giver, recipients.name as recipient
        from participations
        join people as givers on givers.id = participations.person_id
        join people as recipients on recipients.id = participations.recipient_id
        where participations.year = 2026
        order by givers.name
      `;
    }),
  );

beforeAll(async () => {
  database = await createTestDatabase();
  runtime = ManagedRuntime.make(
    AdminRepositoryLive.pipe(Layer.provideMerge(pgLayerForUrl(database.url))),
  );
  await runtime.runPromise(
    Effect.gen(function* () {
      const admin = yield* AdminRepository;
      yield* Effect.forEach(family, (name) => admin.addPerson(name, undefined));
      yield* admin.openSeason(2026, family);
    }),
  );
});

afterAll(async () => {
  await runtime.dispose();
  await database.drop();
});

it('the draw comes in on stdin and never shows up in the output', async () => {
  const { output, exitCode } = await runAdmin(
    ['season', 'pairs', '2026'],
    'Mara=Jonas\n\nJonas = Zoë\r\nZoë=Mara\n',
  );
  expect(exitCode).toBe(0);
  expect(output).toContain('Die Paare für 2026 stehen.');
  expect(await recipients()).toEqual([
    { giver: 'Jonas', recipient: 'Zoë' },
    { giver: 'Mara', recipient: 'Jonas' },
    { giver: 'Zoë', recipient: 'Mara' },
  ]);
  for (const name of family) {
    expect(output).not.toContain(name);
  }
});

it('a draw passed as arguments is refused', async () => {
  const { output, exitCode } = await runAdmin(
    ['season', 'pairs', '2026', 'Mara=Zoë', 'Zoë=Jonas', 'Jonas=Mara'],
    '',
  );
  expect(exitCode).toBe(1);
  expect(output).toContain('Befehle:');
  expect(await recipients()).toContainEqual({
    giver: 'Mara',
    recipient: 'Jonas',
  });
});
