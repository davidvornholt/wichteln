import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  // biome-ignore lint/suspicious/noDeprecatedImports: Only the positional overload is deprecated; this file calls the object form Drizzle recommends.
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { type Paper, papers } from './papers';

const createdAt = () =>
  timestamp({ withTimezone: true }).notNull().defaultNow();

// Everyone who has ever taken part. A person outlives the seasons they skip,
// so their earlier wish lists stay in the archive.
export const people = pgTable(
  'people',
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull().unique(),
    paper: text().$type<Paper>().notNull(),
    createdAt: createdAt(),
  },
  () => [
    check(
      'people_paper_is_known',
      sql.raw(`paper in (${papers.map((paper) => `'${paper}'`).join(', ')})`),
    ),
  ],
);

// One Christmas. The newest season is the current one; every earlier season
// is the archive.
export const seasons = pgTable('seasons', {
  year: integer().primaryKey(),
  createdAt: createdAt(),
});

// Who takes part in a season and whom they give to. The recipient is another
// participant of the same season, and nobody receives twice.
export const participations = pgTable(
  'participations',
  {
    year: integer()
      .notNull()
      .references(() => seasons.year, { onDelete: 'cascade' }),
    personId: uuid()
      .notNull()
      .references(() => people.id),
    recipientId: uuid(),
  },
  (table) => [
    primaryKey({ columns: [table.year, table.personId] }),
    unique('participations_one_giver_per_recipient').on(
      table.year,
      table.recipientId,
    ),
    foreignKey({
      name: 'participations_recipient_takes_part',
      columns: [table.year, table.recipientId],
      foreignColumns: [table.year, table.personId],
    }),
    check(
      'participations_nobody_gives_to_themselves',
      sql`${table.recipientId} <> ${table.personId}`,
    ),
  ],
);

export const wishes = pgTable(
  'wishes',
  {
    id: uuid().primaryKey().defaultRandom(),
    year: integer().notNull(),
    personId: uuid().notNull(),
    title: text().notNull(),
    note: text(),
    url: text(),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      name: 'wishes_belong_to_a_participation',
      columns: [table.year, table.personId],
      foreignColumns: [participations.year, participations.personId],
    }).onDelete('cascade'),
    index('wishes_by_participation').on(
      table.year,
      table.personId,
      table.createdAt,
    ),
    check('wishes_title_is_not_blank', sql`btrim(${table.title}) <> ''`),
  ],
);

// A personal link that signs one person in. It stays valid until it is
// revoked, so the same link can sign in a phone and a tablet. Only the SHA-256
// hash of its secret is stored.
export const accessLinks = pgTable('access_links', {
  id: uuid().primaryKey().defaultRandom(),
  personId: uuid()
    .notNull()
    .references(() => people.id, { onDelete: 'cascade' }),
  tokenHash: text().notNull().unique(),
  createdAt: createdAt(),
  revokedAt: timestamp({ withTimezone: true }),
});

// One signed-in device. Revoking its link deletes it.
export const sessions = pgTable(
  'sessions',
  {
    id: uuid().primaryKey().defaultRandom(),
    linkId: uuid()
      .notNull()
      .references(() => accessLinks.id, { onDelete: 'cascade' }),
    tokenHash: text().notNull().unique(),
    createdAt: createdAt(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_by_link').on(table.linkId)],
);
