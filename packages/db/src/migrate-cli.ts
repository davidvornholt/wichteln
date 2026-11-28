import { Config, Effect, Redacted } from 'effect';
import { migrateDatabase } from './migrate';

// Applies the migrations to the database DATABASE_URL names.
await Effect.runPromise(
  Effect.gen(function* () {
    const url = yield* Config.Redacted('DATABASE_URL');
    yield* migrateDatabase(Redacted.value(url));
  }),
);
