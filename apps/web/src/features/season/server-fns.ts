import { createServerFn } from '@tanstack/react-start';
import { Effect } from 'effect';
import { requirePerson } from '../../shared/auth/require-person';
import { serverRuntime } from '../../shared/runtime/server';
import { SeasonRepository, SeasonRepositoryLive } from './season-repository';
import { hasUnwrapped, rememberUnwrapped } from './unwrapped-cookie';
import {
  decodeUnwrapping,
  decodeWishInput,
  decodeWishReference,
  decodeWishUpdate,
} from './wish-input';

const run = <A, E>(effect: Effect.Effect<A, E, SeasonRepository>) =>
  serverRuntime.runPromise(effect.pipe(Effect.provide(SeasonRepositoryLive)));

export const loadSeason = createServerFn().handler(async () => {
  const person = await requirePerson();
  const view = await run(
    Effect.gen(function* () {
      const season = yield* SeasonRepository;
      return yield* season.view(person.id);
    }),
  );
  const unwrapped = view.kind === 'taking-part' && hasUnwrapped(view.year);
  return { person, view, unwrapped };
});

// Remembers on this device that its person has unwrapped this year's gift.
export const markUnwrapped = createServerFn({ method: 'POST' })
  .validator(decodeUnwrapping)
  .handler(async ({ data }) => {
    await requirePerson();
    rememberUnwrapped(data.year);
  });

export const addWish = createServerFn({ method: 'POST' })
  .validator(decodeWishInput)
  .handler(async ({ data }) => {
    const person = await requirePerson();
    return run(
      Effect.gen(function* () {
        const season = yield* SeasonRepository;
        return yield* season.addWish(person.id, data);
      }),
    );
  });

export const updateWish = createServerFn({ method: 'POST' })
  .validator(decodeWishUpdate)
  .handler(async ({ data }) => {
    const person = await requirePerson();
    return run(
      Effect.gen(function* () {
        const season = yield* SeasonRepository;
        return yield* season.updateWish(person.id, data.id, data.wish);
      }),
    );
  });

export const deleteWish = createServerFn({ method: 'POST' })
  .validator(decodeWishReference)
  .handler(async ({ data }) => {
    const person = await requirePerson();
    await run(
      Effect.gen(function* () {
        const season = yield* SeasonRepository;
        return yield* season.deleteWish(person.id, data.id);
      }),
    );
  });
