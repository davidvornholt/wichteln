import { PgClient } from '@effect/sql-pg';
import { Config, Redacted } from 'effect';
import { SqlClient } from 'effect/sql';

// Application services depend on this service through @wichteln/db instead
// of reaching through the package boundary to effect/sql.
export const Database = SqlClient.SqlClient;
export type Database = SqlClient.SqlClient;

// The family is small, so a handful of connections serves every request.
const maxConnections = 4;

export const PgLive = PgClient.layerConfig({
  url: Config.Redacted('DATABASE_URL'),
  maxConnections: Config.succeed(maxConnections),
  idleTimeout: Config.succeed('10 seconds'),
});

// For tests and the admin command, which name their database directly.
export const pgLayerForUrl = (url: string) =>
  PgClient.layer({ url: Redacted.make(url), maxConnections: 2 });
