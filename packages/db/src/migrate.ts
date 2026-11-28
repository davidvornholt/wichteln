import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { Effect, Schema } from 'effect';
import { makePostgresConnection } from './postgres-connection';

export const migrationsFolder = `${import.meta.dir}/../drizzle`;

export class DatabaseMigrationError extends Schema.TaggedError<DatabaseMigrationError>()(
  'DatabaseMigrationError',
  { message: Schema.String, cause: Schema.Defect() },
) {}

// Applies every generated migration the database has not seen yet.
export const migrateDatabase = (url: string) =>
  Effect.acquireUseRelease(
    Effect.sync(() => makePostgresConnection(url)),
    (connection) =>
      Effect.tryPromise({
        try: () => migrate(drizzle(connection), { migrationsFolder }),
        catch: (cause) =>
          new DatabaseMigrationError({
            message: 'Could not apply the Wichteln database migrations.',
            cause,
          }),
      }),
    (connection) => Effect.promise(() => connection.end()),
  );
