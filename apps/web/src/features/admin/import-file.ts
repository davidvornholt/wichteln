import { papers } from '@wichteln/db/papers';
import { Schema } from 'effect';

const Name = Schema.Trim.check(Schema.isMinLength(1));

const ImportedWish = Schema.Struct({
  title: Schema.Trim.check(Schema.isMinLength(1)),
  note: Schema.NullOr(Schema.String),
  url: Schema.NullOr(Schema.String),
});

// A past season as it was recovered: who gave to whom, if known, and each
// person's wishes. Everyone named in either takes part.
const ImportedSeason = Schema.Struct({
  year: Schema.Int,
  pairs: Schema.Record(Schema.String, Name),
  wishes: Schema.Record(Schema.String, Schema.Array(ImportedWish)),
});

export const ImportFile = Schema.Struct({
  people: Schema.Array(
    Schema.Struct({ name: Name, paper: Schema.Literals(papers) }),
  ),
  seasons: Schema.Array(ImportedSeason),
});
export type ImportFile = typeof ImportFile.Type;
export type ImportedSeason = typeof ImportedSeason.Type;

export const decodeImportFile = Schema.decodeUnknownSync(ImportFile);

export const participantsOf = (
  season: ImportedSeason,
): ReadonlyArray<string> => [
  ...new Set([
    ...Object.keys(season.pairs),
    ...Object.values(season.pairs),
    ...Object.keys(season.wishes),
  ]),
];
