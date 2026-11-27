import { Database } from '@wichteln/db/client';
import { Context, Effect, Layer } from 'effect';
import { type DatabaseError, databaseFailure } from '../database-error';
import type { SignedInPerson } from './signed-in-person';
import { hashToken, isWellFormedToken, newToken } from './tokens';

// A device stays signed in for 400 days, the longest a browser keeps a cookie,
// so nobody has to open their link again during a season.
export const sessionLifetimeDays = 400;

export type NewSession = {
  readonly token: string;
  readonly expiresAt: Date;
  readonly person: SignedInPerson;
};

export class AccessRepository extends Context.Service<
  AccessRepository,
  {
    // Signs a device in with a personal link. Undefined when the link is
    // unknown or revoked. The link stays valid, so another device can use it.
    readonly redeemLink: (
      linkToken: string,
    ) => Effect.Effect<NewSession | undefined, DatabaseError>;
    // The person a device is signed in as, or undefined once the session has
    // expired or its link was revoked.
    readonly personForSession: (
      sessionToken: string,
    ) => Effect.Effect<SignedInPerson | undefined, DatabaseError>;
    readonly endSession: (
      sessionToken: string,
    ) => Effect.Effect<void, DatabaseError>;
  }
>()('@wichteln/web/auth/AccessRepository') {}

export const AccessRepositoryLive = Layer.effect(
  AccessRepository,
  Effect.gen(function* () {
    const sql = yield* Database;

    const redeemLink = Effect.fn('AccessRepository.redeemLink')(function* (
      linkToken: string,
    ) {
      if (!isWellFormedToken(linkToken)) {
        return;
      }
      const token = newToken();
      const rows = yield* sql<{
        readonly expiresAt: Date;
        readonly id: string;
        readonly name: string;
        readonly paper: SignedInPerson['paper'];
      }>`
        with link as (
          select id, person_id from access_links
          where token_hash = ${hashToken(linkToken)} and revoked_at is null
        ), created as (
          insert into sessions (link_id, token_hash, expires_at)
          select id, ${hashToken(token)},
            now() + make_interval(days => ${sessionLifetimeDays})
          from link
          returning expires_at
        )
        select created.expires_at as "expiresAt", people.id, people.name, people.paper
        from created, link join people on people.id = link.person_id
      `.pipe(Effect.mapError(databaseFailure('redeem a personal link')));
      const [row] = rows;
      if (row === undefined) {
        return;
      }
      return {
        token,
        expiresAt: row.expiresAt,
        person: { id: row.id, name: row.name, paper: row.paper },
      } satisfies NewSession;
    });

    const personForSession = Effect.fn('AccessRepository.personForSession')(
      function* (sessionToken: string) {
        if (!isWellFormedToken(sessionToken)) {
          return;
        }
        const rows = yield* sql<SignedInPerson>`
          select people.id, people.name, people.paper
          from sessions
          join access_links on access_links.id = sessions.link_id
          join people on people.id = access_links.person_id
          where sessions.token_hash = ${hashToken(sessionToken)}
            and sessions.expires_at > now()
            and access_links.revoked_at is null
        `.pipe(Effect.mapError(databaseFailure('find the signed-in person')));
        return rows[0];
      },
    );

    const endSession = (sessionToken: string) =>
      sql`delete from sessions where token_hash = ${hashToken(sessionToken)}`.pipe(
        Effect.asVoid,
        Effect.mapError(databaseFailure('end a session')),
      );

    return AccessRepository.of({ redeemLink, personForSession, endSession });
  }),
);
