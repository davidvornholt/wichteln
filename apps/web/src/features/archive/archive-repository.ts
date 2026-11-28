import { Database } from '@wichteln/db/client';
import type { Paper } from '@wichteln/db/papers';
import { Context, Effect, Layer } from 'effect';
import {
  type DatabaseError,
  databaseFailure,
} from '../../shared/database-error';
import type { ArchivedSeason, ArchivedWish } from './archive';

type WishRow = {
  readonly year: number;
  readonly name: string;
  readonly paper: Paper;
  readonly id: string;
  readonly title: string;
  readonly note: string | null;
  readonly url: string | null;
};

type MutableList = { name: string; paper: Paper; wishes: Array<ArchivedWish> };

// Puts wishes sorted by name into the seasons they belong to. A season
// without wishes keeps an empty list, because its wish lists were lost.
export const groupArchive = (
  years: ReadonlyArray<number>,
  rows: ReadonlyArray<WishRow>,
): ReadonlyArray<ArchivedSeason> =>
  years.map((year) => {
    const lists = new Map<string, MutableList>();
    for (const { year: wishYear, name, paper, ...wish } of rows) {
      if (wishYear === year) {
        const list = lists.get(name) ?? { name, paper, wishes: [] };
        list.wishes.push(wish);
        lists.set(name, list);
      }
    }
    return { year, lists: [...lists.values()] };
  });

export class ArchiveRepository extends Context.Service<
  ArchiveRepository,
  {
    // Every season before the current one, newest first.
    readonly seasons: Effect.Effect<
      ReadonlyArray<ArchivedSeason>,
      DatabaseError
    >;
  }
>()('@wichteln/web/archive/ArchiveRepository') {}

export const ArchiveRepositoryLive = Layer.effect(
  ArchiveRepository,
  Effect.gen(function* () {
    const sql = yield* Database;
    const pastYears = sql<{ readonly year: number }>`
      select year from seasons
      where year < (select max(year) from seasons)
      order by year desc
    `;
    const pastWishes = sql<WishRow>`
      select wishes.year, people.name, people.paper,
        wishes.id, wishes.title, wishes.note, wishes.url
      from wishes
      join people on people.id = wishes.person_id
      where wishes.year < (select max(year) from seasons)
      order by people.name, wishes.created_at, wishes.id
    `;
    return ArchiveRepository.of({
      seasons: Effect.all([pastYears, pastWishes]).pipe(
        Effect.map(([years, rows]) =>
          groupArchive(
            years.map((row) => row.year),
            rows,
          ),
        ),
        Effect.mapError(databaseFailure('load the archive')),
      ),
    });
  }),
);
