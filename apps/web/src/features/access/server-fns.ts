import { createServerFn } from '@tanstack/react-start';
import { Effect, Schema } from 'effect';
import { AccessRepository } from '../../shared/auth/access-repository';
import {
  clearSessionCookie,
  readSessionCookie,
  writeSessionCookie,
} from '../../shared/auth/session-cookie';
import type { SignedInPerson } from '../../shared/auth/signed-in-person';
import { serverRuntime } from '../../shared/runtime/server';

const Invitation = Schema.Struct({ token: Schema.String });

export type Redemption =
  | { readonly kind: 'signed-in'; readonly person: SignedInPerson }
  | { readonly kind: 'invalid' };

// Signs this device in with the secret from a personal link.
export const redeemInvitation = createServerFn({ method: 'POST' })
  .validator(Schema.decodeUnknownSync(Invitation))
  .handler(async ({ data }): Promise<Redemption> => {
    const session = await serverRuntime.runPromise(
      Effect.gen(function* () {
        const access = yield* AccessRepository;
        return yield* access.redeemLink(data.token);
      }),
    );
    if (session === undefined) {
      return { kind: 'invalid' };
    }
    writeSessionCookie(session.token, session.expiresAt);
    return { kind: 'signed-in', person: session.person };
  });

// Signs this device out. The personal link keeps working on other devices.
export const signOut = createServerFn({ method: 'POST' }).handler(async () => {
  const token = readSessionCookie();
  if (token !== undefined) {
    await serverRuntime.runPromise(
      Effect.gen(function* () {
        const access = yield* AccessRepository;
        yield* access.endSession(token);
      }),
    );
  }
  clearSessionCookie();
});
