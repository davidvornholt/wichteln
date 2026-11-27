import { Database } from '@wichteln/db/client';
import type { Paper } from '@wichteln/db/papers';
import { Context, Effect, Layer } from 'effect';
import {
  type DatabaseError,
  databaseFailure,
} from '../../shared/database-error';
import { NotTakingPart } from './not-taking-part';
import type { SeasonView, Wish } from './wish';
import { emptyToNull, type WishInput } from './wish-input';
import { WishNotFound } from './wish-not-found';

export class SeasonRepository extends Context.Service<
  SeasonRepository,
  {
    readonly view: (
      personId: string,
    ) => Effect.Effect<SeasonView, DatabaseError>;
    readonly addWish: (
      personId: string,
      wish: WishInput,
    ) => Effect.Effect<Wish, DatabaseError | NotTakingPart>;
    readonly updateWish: (
      personId: string,
      wishId: string,
      wish: WishInput,
    ) => Effect.Effect<Wish, DatabaseError | WishNotFound>;
    readonly deleteWish: (
      personId: string,
      wishId: string,
    ) => Effect.Effect<void, DatabaseError | WishNotFound>;
  }
>()('@wichteln/web/season/SeasonRepository') {}

export const SeasonRepositoryLive = Layer.effect(
  SeasonRepository,
  Effect.gen(function* () {
    const sql = yield* Database;
    const wishesOf = (year: number, personId: string) =>
      sql<Wish>`
        select id, title, note, url from wishes
        where year = ${year} and person_id = ${personId}
        order by created_at, id
      `;

    const view = Effect.fn('SeasonRepository.view')(
      function* (personId: string) {
        const [season] = yield* sql<{
          readonly year: number | null;
          readonly takesPart: boolean;
          readonly recipientId: string | null;
          readonly recipientName: string | null;
          readonly recipientPaper: Paper | null;
        }>`
          select seasons.year,
            participations.person_id is not null as "takesPart",
            recipient.id as "recipientId",
            recipient.name as "recipientName",
            recipient.paper as "recipientPaper"
          from (select (select max(year) from seasons) as year) as seasons
          left join participations
            on participations.year = seasons.year
            and participations.person_id = ${personId}
          left join people as recipient
            on recipient.id = participations.recipient_id
        `;
        if (season === undefined || season.year === null) {
          return { kind: 'no-season' } satisfies SeasonView;
        }
        const { year } = season;
        if (!season.takesPart) {
          return { kind: 'not-taking-part', year } satisfies SeasonView;
        }
        const ownWishes = yield* wishesOf(year, personId);
        if (
          season.recipientId === null ||
          season.recipientName === null ||
          season.recipientPaper === null
        ) {
          return {
            kind: 'taking-part',
            year,
            recipient: null,
            ownWishes,
          } satisfies SeasonView;
        }
        const recipientWishes = yield* wishesOf(year, season.recipientId);
        return {
          kind: 'taking-part',
          year,
          recipient: {
            name: season.recipientName,
            paper: season.recipientPaper,
            wishes: recipientWishes,
          },
          ownWishes,
        } satisfies SeasonView;
      },
      Effect.mapError(databaseFailure('load the current season')),
    );

    const addWish = Effect.fn('SeasonRepository.addWish')(function* (
      personId: string,
      wish: WishInput,
    ) {
      const [created] = yield* sql<Wish>`
        insert into wishes (year, person_id, title, note, url)
        select year, person_id, ${wish.title}, ${emptyToNull(wish.note)}, ${emptyToNull(wish.url)}
        from participations
        where year = (select max(year) from seasons) and person_id = ${personId}
        returning id, title, note, url
      `.pipe(Effect.mapError(databaseFailure('add a wish')));
      if (created === undefined) {
        return yield* new NotTakingPart();
      }
      return created;
    });

    const updateWish = Effect.fn('SeasonRepository.updateWish')(function* (
      personId: string,
      wishId: string,
      wish: WishInput,
    ) {
      const [updated] = yield* sql<Wish>`
        update wishes
        set title = ${wish.title}, note = ${emptyToNull(wish.note)}, url = ${emptyToNull(wish.url)}
        where id = ${wishId} and person_id = ${personId} and year = (select max(year) from seasons)
        returning id, title, note, url
      `.pipe(Effect.mapError(databaseFailure('change a wish')));
      if (updated === undefined) {
        return yield* new WishNotFound();
      }
      return updated;
    });

    const deleteWish = Effect.fn('SeasonRepository.deleteWish')(function* (
      personId: string,
      wishId: string,
    ) {
      const deleted = yield* sql`
        delete from wishes
        where id = ${wishId} and person_id = ${personId} and year = (select max(year) from seasons)
        returning id
      `.pipe(Effect.mapError(databaseFailure('delete a wish')));
      if (deleted.length === 0) {
        return yield* new WishNotFound();
      }
    });

    return SeasonRepository.of({ view, addWish, updateWish, deleteWish });
  }),
);
