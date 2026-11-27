import { createFileRoute } from '@tanstack/react-router';
import { Database } from '@wichteln/db/client';
import { Effect } from 'effect';
import { serverRuntime } from '../../shared/runtime/server';

const healthCheck = Effect.gen(function* () {
  const sql = yield* Database;
  yield* sql`select 1`;
}).pipe(
  Effect.timeout('3 seconds'),
  Effect.match({
    onFailure: () =>
      Response.json(
        { status: 'unhealthy' },
        { headers: { 'cache-control': 'no-store' }, status: 503 },
      ),
    onSuccess: () =>
      Response.json(
        { status: 'ok' },
        { headers: { 'cache-control': 'no-store' } },
      ),
  }),
);

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: () => serverRuntime.runPromise(healthCheck),
    },
  },
});
