import { createServerFn } from '@tanstack/react-start';
import { Effect } from 'effect';
import { requirePerson } from '../../shared/auth/require-person';
import { serverRuntime } from '../../shared/runtime/server';
import { ArchiveRepository, ArchiveRepositoryLive } from './archive-repository';

export const loadArchive = createServerFn().handler(async () => {
  await requirePerson();
  return serverRuntime.runPromise(
    Effect.gen(function* () {
      const archive = yield* ArchiveRepository;
      return yield* archive.seasons;
    }).pipe(Effect.provide(ArchiveRepositoryLive)),
  );
});
