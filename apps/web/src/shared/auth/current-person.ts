import { Effect } from 'effect';
import { serverRuntime } from '../runtime/server';
import { AccessRepository } from './access-repository';
import { readSessionCookie } from './session-cookie';
import type { SignedInPerson } from './signed-in-person';

// The person this request's device is signed in as, or null.
export const currentPerson = (): Promise<SignedInPerson | null> => {
  const token = readSessionCookie();
  if (token === undefined) {
    return Promise.resolve(null);
  }
  return serverRuntime.runPromise(
    Effect.gen(function* () {
      const access = yield* AccessRepository;
      return (yield* access.personForSession(token)) ?? null;
    }),
  );
};
