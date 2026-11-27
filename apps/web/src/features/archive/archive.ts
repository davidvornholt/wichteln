import type { Paper } from '@wichteln/db/papers';

export type ArchivedWish = {
  readonly id: string;
  readonly title: string;
  readonly note: string | null;
  readonly url: string | null;
};

export type ArchivedList = {
  readonly name: string;
  readonly paper: Paper;
  readonly wishes: ReadonlyArray<ArchivedWish>;
};

// A past season's wish lists, empty when they were lost. Who gave to whom
// stays out of it: the archive is for remembering wishes, not for guessing
// the pairs.
export type ArchivedSeason = {
  readonly year: number;
  readonly lists: ReadonlyArray<ArchivedList>;
};
