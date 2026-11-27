import { Config, Effect } from 'effect';
import { migrateDatabase } from '../migrate';
import { makePostgresConnection } from '../postgres-connection';

export type TestDatabase = {
  readonly url: string;
  readonly drop: () => Promise<void>;
};

const databaseUrl = (rootUrl: string, name: string) => {
  const url = new URL(rootUrl);
  url.pathname = `/${name}`;
  return url.toString();
};

// Tests create and drop databases, so they run only against a server on this
// machine or a private network, never a production host.
const privateHost =
  /^(?:localhost|127\.\d+\.\d+\.\d+|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/u;

const rootDatabaseUrl = async () => {
  const rootUrl = await Effect.runPromise(Config.String('DATABASE_URL')).catch(
    (cause: unknown) => {
      throw new Error(
        'DATABASE_URL is not set. Run the tests with `bun --env-file=.env.local test`, after `just dev-env-generate` and `just dev-db-start`.',
        { cause },
      );
    },
  );
  if (!privateHost.test(new URL(rootUrl).hostname)) {
    throw new Error(
      'DATABASE_URL must point to a local or private PostgreSQL server.',
    );
  }
  return rootUrl;
};

// A fresh, migrated database for one test file. DATABASE_URL names a role
// that may create databases: the dev container's owner locally, the CI
// service's superuser in CI.
export const createTestDatabase = async (): Promise<TestDatabase> => {
  const rootUrl = await rootDatabaseUrl();
  const name = `wichteln_test_${crypto.randomUUID().replaceAll('-', '')}`;
  const admin = makePostgresConnection(rootUrl);
  await admin.unsafe(`create database "${name}"`);
  const url = databaseUrl(rootUrl, name);
  await Effect.runPromise(migrateDatabase(url));
  return {
    url,
    drop: async () => {
      await admin.unsafe(`drop database if exists "${name}" with (force)`);
      await admin.end();
    },
  };
};
