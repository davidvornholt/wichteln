import { afterAll, beforeAll, expect, it } from 'bun:test';
import { makePostgresConnection } from './postgres-connection';
import {
  createTestDatabase,
  type TestDatabase,
} from './testing/postgres-test-database';

let database: TestDatabase;
let sql: ReturnType<typeof makePostgresConnection>;

beforeAll(async () => {
  database = await createTestDatabase();
  sql = makePostgresConnection(database.url);
  await sql`insert into seasons (year) values (2026)`;
  await sql`insert into people (name, paper) values ('Mara', 'kirsch'), ('Jonas', 'kobalt')`;
});

afterAll(async () => {
  await sql.end();
  await database.drop();
});

const idOf = async (name: string) => {
  const [row] = await sql<
    Array<{ id: string }>
  >`select id from people where name = ${name}`;
  if (row === undefined) {
    throw new Error(`No person named ${name}.`);
  }
  return row.id;
};

it('a recipient must take part in the same season', async () => {
  const mara = await idOf('Mara');
  const jonas = await idOf('Jonas');
  await sql`insert into participations (year, person_id) values (2026, ${mara})`;
  await expect(
    sql`update participations set recipient_id = ${jonas} where person_id = ${mara}`,
  ).rejects.toThrow();
});

it('nobody gives to themselves', async () => {
  const mara = await idOf('Mara');
  await expect(
    sql`update participations set recipient_id = ${mara} where person_id = ${mara}`,
  ).rejects.toThrow();
});

it('an unknown wrapping paper is refused', async () => {
  await expect(
    sql`insert into people (name, paper) values ('Paul', 'glitzer')`,
  ).rejects.toThrow();
});
