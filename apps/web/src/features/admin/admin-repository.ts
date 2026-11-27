import { Database } from '@wichteln/db/client';
import { type Paper, papers } from '@wichteln/db/papers';
import { Context, Effect, Layer } from 'effect';
import { hashToken, newToken } from '../../shared/auth/tokens';
import {
  type DatabaseError,
  databaseFailure,
} from '../../shared/database-error';
import { type AdminRefusal, refuse } from './admin-refusal';
import { groupSeasons, type PersonStatus, type Status } from './admin-status';
import { type ImportFile, participantsOf } from './import-file';
import { pairProblems } from './pairs';

type AdminError = DatabaseError | AdminRefusal;
type Pairs = ReadonlyArray<readonly [string, string]>;
type Sql = Database;

export class AdminRepository extends Context.Service<
  AdminRepository,
  {
    readonly addPerson: (
      name: string,
      paper: Paper | undefined,
    ) => Effect.Effect<Paper, AdminError>;
    readonly openSeason: (
      year: number,
      names: ReadonlyArray<string>,
    ) => Effect.Effect<void, AdminError>;
    readonly setPairs: (
      year: number,
      pairs: Pairs,
    ) => Effect.Effect<void, AdminError>;
    // Revokes the person's earlier links, signs out their devices, and
    // returns the secret of a new link.
    readonly issueLink: (name: string) => Effect.Effect<string, AdminError>;
    readonly revokeLinks: (name: string) => Effect.Effect<void, AdminError>;
    readonly importSeasons: (
      file: ImportFile,
    ) => Effect.Effect<void, AdminError>;
    readonly status: Effect.Effect<Status, DatabaseError>;
  }
>()('@wichteln/web/admin/AdminRepository') {}

const personIdQuery = (sql: Sql) =>
  Effect.fn('AdminRepository.personId')(function* (name: string) {
    const [row] = yield* sql<{ readonly id: string }>`
      select id from people where name = ${name}
    `.pipe(Effect.mapError(databaseFailure('find a person')));
    if (row === undefined) {
      return yield* refuse(`Niemand heißt ${name}.`);
    }
    return row.id;
  });

const addPersonCommand = (sql: Sql) =>
  Effect.fn('AdminRepository.addPerson')(function* (
    name: string,
    paper: Paper | undefined,
  ) {
    const taken = yield* sql<{ readonly paper: Paper }>`
      select paper from people
    `.pipe(Effect.mapError(databaseFailure('read the papers in use')));
    const used = new Set(taken.map((row) => row.paper));
    // A new person gets a paper nobody has yet, while there is one.
    const chosen =
      paper ??
      papers.find((candidate) => !used.has(candidate)) ??
      papers[taken.length % papers.length];
    if (chosen === undefined) {
      return yield* refuse('Es gibt kein Geschenkpapier.');
    }
    const inserted = yield* sql`
      insert into people (name, paper) values (${name}, ${chosen})
      on conflict (name) do nothing
      returning id
    `.pipe(Effect.mapError(databaseFailure('add a person')));
    if (inserted.length === 0) {
      return yield* refuse(`${name} gibt es schon.`);
    }
    return chosen;
  });

// Clears the season's pairs first, so a changed round never trips the rule
// that nobody receives twice halfway through.
const writePairs = (sql: Sql, year: number, pairs: Pairs) =>
  Effect.gen(function* () {
    yield* sql`update participations set recipient_id = null where year = ${year}`;
    yield* Effect.forEach(
      pairs,
      ([giver, recipient]) => sql`
        update participations
        set recipient_id = (select id from people where name = ${recipient})
        where year = ${year}
          and person_id = (select id from people where name = ${giver})
      `,
      { discard: true },
    );
  });

const seasonCommands = (sql: Sql) => {
  const personId = personIdQuery(sql);

  const openSeason = Effect.fn('AdminRepository.openSeason')(function* (
    year: number,
    names: ReadonlyArray<string>,
  ) {
    const ids = yield* Effect.forEach(names, personId);
    yield* sql
      .withTransaction(
        Effect.gen(function* () {
          yield* sql`insert into seasons (year) values (${year})`;
          yield* Effect.forEach(
            ids,
            (id) =>
              sql`insert into participations (year, person_id) values (${year}, ${id})`,
            { discard: true },
          );
        }),
      )
      .pipe(Effect.mapError(databaseFailure(`open the season ${year}`)));
  });

  const setPairs = Effect.fn('AdminRepository.setPairs')(function* (
    year: number,
    pairs: Pairs,
  ) {
    const participants = yield* sql<{ readonly name: string }>`
      select people.name from participations
      join people on people.id = participations.person_id
      where participations.year = ${year}
    `.pipe(
      Effect.map((rows) => rows.map((row) => row.name)),
      Effect.mapError(databaseFailure(`read the season ${year}`)),
    );
    if (participants.length === 0) {
      return yield* refuse(`Für ${year} nimmt niemand teil.`);
    }
    const problems = pairProblems(participants, pairs);
    if (problems.length > 0) {
      return yield* refuse(problems.join('\n'));
    }
    yield* sql
      .withTransaction(writePairs(sql, year, pairs))
      .pipe(Effect.mapError(databaseFailure(`set the pairs for ${year}`)));
  });

  return { openSeason, setPairs };
};

const linkCommands = (sql: Sql) => {
  const personId = personIdQuery(sql);

  const revokeFor = (id: string) =>
    Effect.gen(function* () {
      yield* sql`
        delete from sessions where link_id in (
          select id from access_links where person_id = ${id}
        )
      `;
      yield* sql`
        update access_links set revoked_at = now()
        where person_id = ${id} and revoked_at is null
      `;
    });

  const issueLink = Effect.fn('AdminRepository.issueLink')(function* (
    name: string,
  ) {
    const id = yield* personId(name);
    const token = newToken();
    yield* sql
      .withTransaction(
        Effect.gen(function* () {
          yield* revokeFor(id);
          yield* sql`
            insert into access_links (person_id, token_hash)
            values (${id}, ${hashToken(token)})
          `;
        }),
      )
      .pipe(Effect.mapError(databaseFailure('issue a personal link')));
    return token;
  });

  const revokeLinks = Effect.fn('AdminRepository.revokeLinks')(function* (
    name: string,
  ) {
    const id = yield* personId(name);
    yield* sql
      .withTransaction(revokeFor(id))
      .pipe(Effect.mapError(databaseFailure('revoke personal links')));
  });

  return { issueLink, revokeLinks };
};

// Every season's pairs must form a valid round before anything is written.
const importProblems = (file: ImportFile) =>
  file.seasons.flatMap((season) => {
    const pairs = Object.entries(season.pairs);
    const problems =
      pairs.length === 0 ? [] : pairProblems(participantsOf(season), pairs);
    return problems.length === 0
      ? []
      : [`${season.year}:\n${problems.join('\n')}`];
  });

const writeSeason = (sql: Sql, season: ImportFile['seasons'][number]) =>
  Effect.gen(function* () {
    yield* sql`insert into seasons (year) values (${season.year})`;
    yield* Effect.forEach(
      participantsOf(season),
      (name) => sql`
        insert into participations (year, person_id)
        select ${season.year}, id from people where name = ${name}
      `,
      { discard: true },
    );
    yield* writePairs(sql, season.year, Object.entries(season.pairs));
    const wishes = Object.entries(season.wishes).flatMap(([name, list]) =>
      list.map((wish) => ({ name, ...wish })),
    );
    yield* Effect.forEach(
      wishes,
      (wish) => sql`
        insert into wishes (year, person_id, title, note, url)
        select ${season.year}, id, ${wish.title}, ${wish.note}, ${wish.url}
        from people where name = ${wish.name}
      `,
      { discard: true },
    );
  });

const importCommand = (sql: Sql) =>
  Effect.fn('AdminRepository.importSeasons')(function* (file: ImportFile) {
    const problems = importProblems(file);
    if (problems.length > 0) {
      return yield* refuse(problems.join('\n'));
    }
    yield* sql
      .withTransaction(
        Effect.gen(function* () {
          yield* Effect.forEach(
            file.people,
            (person) => sql`
              insert into people (name, paper) values (${person.name}, ${person.paper})
              on conflict (name) do nothing
            `,
            { discard: true },
          );
          yield* Effect.forEach(
            file.seasons,
            (season) => writeSeason(sql, season),
            { discard: true },
          );
        }),
      )
      .pipe(Effect.mapError(databaseFailure('import seasons')));
  });

const statusQuery = (sql: Sql) =>
  Effect.gen(function* () {
    const people = yield* sql<PersonStatus>`
      select people.name, people.paper,
        count(distinct access_links.id) filter (where access_links.revoked_at is null)::int as "activeLinks",
        count(distinct sessions.id) filter (where sessions.expires_at > now())::int as devices
      from people
      left join access_links on access_links.person_id = people.id
      left join sessions on sessions.link_id = access_links.id
      group by people.id
      order by people.name
    `;
    const participants = yield* sql<{
      readonly year: number;
      readonly name: string;
      readonly paired: boolean;
      readonly wishes: number;
    }>`
      select participations.year, people.name,
        participations.recipient_id is not null as paired,
        (select count(*)::int from wishes
          where wishes.year = participations.year
            and wishes.person_id = participations.person_id) as wishes
      from participations
      join people on people.id = participations.person_id
      order by participations.year desc, people.name
    `;
    return { people, seasons: groupSeasons(participants) };
  }).pipe(Effect.mapError(databaseFailure('read the status')));

export const AdminRepositoryLive = Layer.effect(
  AdminRepository,
  Effect.gen(function* () {
    const sql = yield* Database;
    return AdminRepository.of({
      addPerson: addPersonCommand(sql),
      ...seasonCommands(sql),
      ...linkCommands(sql),
      importSeasons: importCommand(sql),
      status: statusQuery(sql),
    });
  }),
);
