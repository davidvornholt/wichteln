import process from 'node:process';
import { PgLive } from '@wichteln/db/client';
import { type Paper, papers } from '@wichteln/db/papers';
import { Effect, Layer } from 'effect';
import type { AdminRefusal } from '../src/features/admin/admin-refusal';
import {
  AdminRepository,
  AdminRepositoryLive,
} from '../src/features/admin/admin-repository';
import type { Status } from '../src/features/admin/admin-status';
import { decodeImportFile } from '../src/features/admin/import-file';
import type { DatabaseError } from '../src/shared/database-error';
import { publicOrigin } from '../src/shared/env/server';

const usage = `Befehle:
  status
  person add <Name> [${papers.join('|')}]
  season open <Jahr> <Name>...
  season pairs <Jahr>, dann je Zeile <Schenkende>=<Beschenkte> und Strg+D
  link issue <Name>
  link revoke <Name>
  import < datei.json`;

// Wichteln started long after this year, so a smaller one is a typo.
const earliestYear = 2000;

const fail = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const say = (line: string) =>
  Effect.sync(() => process.stdout.write(`${line}\n`));

const parseYear = (value: string | undefined): number => {
  const year = Number(value);
  return Number.isInteger(year) && year > earliestYear ? year : fail(usage);
};

const required = (value: string | undefined): string => value ?? fail(usage);

const isPaper = (value: string): value is Paper =>
  (papers as ReadonlyArray<string>).includes(value);

const parsePair = (pair: string) => {
  const [giver, recipient, ...extra] = pair
    .split('=')
    .map((name) => name.trim());
  return giver === undefined || recipient === undefined || extra.length > 0
    ? fail(usage)
    : ([giver, recipient] as const);
};

// One pair per line. The draw comes on stdin, so it stays out of the process
// arguments, the shell history, and the command line `bun run` echoes.
const parsePairs = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map(parsePair);

const readStdin = Effect.promise(() => Bun.stdin.text());

const statusLines = ({ people, seasons }: Status) => [
  ...people.map(
    (person) =>
      `${person.name} (${person.paper}): ${person.activeLinks} Link(s), ${person.devices} Gerät(e)`,
  ),
  ...seasons.flatMap((season) => [
    '',
    String(season.year),
    ...season.participants.map(
      (participant) =>
        `  ${participant.name}: ${participant.paired ? 'gezogen' : 'noch nicht gezogen'}, ${participant.wishes} Wunsch/Wünsche`,
    ),
  ]),
];

type Command = (
  admin: typeof AdminRepository.Service,
  args: ReadonlyArray<string>,
) => Effect.Effect<unknown, AdminRefusal | DatabaseError>;

const commands: Record<string, Command> = {
  status: (admin) =>
    admin.status.pipe(
      Effect.flatMap((status) => say(statusLines(status).join('\n'))),
    ),
  'person add': (admin, [name, paper]) => {
    if (paper !== undefined && !isPaper(paper)) {
      return Effect.sync(() => fail(usage));
    }
    return admin
      .addPerson(required(name), paper)
      .pipe(
        Effect.flatMap((chosen) =>
          say(`${name} bekommt das Papier ${chosen}.`),
        ),
      );
  },
  'season open': (admin, [year, ...names]) =>
    admin
      .openSeason(parseYear(year), names)
      .pipe(Effect.andThen(say(`Die Saison ${year} ist eröffnet.`))),
  'season pairs': (admin, [year, ...extra]) => {
    const season = extra.length > 0 ? fail(usage) : parseYear(year);
    return readStdin.pipe(
      Effect.flatMap((text) => admin.setPairs(season, parsePairs(text))),
      Effect.andThen(say(`Die Paare für ${season} stehen.`)),
    );
  },
  'link issue': (admin, [name]) =>
    admin
      .issueLink(required(name))
      .pipe(
        Effect.flatMap((token) =>
          say(new URL(`/willkommen#${token}`, publicOrigin()).href),
        ),
      ),
  'link revoke': (admin, [name]) =>
    admin
      .revokeLinks(required(name))
      .pipe(Effect.andThen(say(`Die Links von ${name} gelten nicht mehr.`))),
  import: (admin) =>
    readStdin.pipe(
      Effect.map((text) => decodeImportFile(JSON.parse(text))),
      Effect.tap((file) => admin.importSeasons(file)),
      Effect.flatMap((file) =>
        say(`${file.seasons.length} Saison(s) importiert.`),
      ),
    ),
};

const [group = '', action = '', ...rest] = process.argv.slice(2);
const [command, args] =
  group in commands
    ? [commands[group], [action, ...rest].filter(Boolean)]
    : [commands[`${group} ${action}`], rest];

await Effect.runPromise(
  Effect.gen(function* () {
    const admin = yield* AdminRepository;
    yield* (command ?? (() => Effect.sync(() => fail(usage))))(admin, args);
  }).pipe(
    Effect.catchTag('AdminRefusal', (refusal) =>
      Effect.sync(() => fail(refusal.message)),
    ),
    Effect.provide(AdminRepositoryLive.pipe(Layer.provide(PgLive))),
  ),
);
