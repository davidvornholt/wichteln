import type { Paper } from '@wichteln/db/papers';

export type ParticipantStatus = {
  readonly name: string;
  readonly paired: boolean;
  readonly wishes: number;
};

export type SeasonStatus = {
  readonly year: number;
  readonly participants: ReadonlyArray<ParticipantStatus>;
};

export type PersonStatus = {
  readonly name: string;
  readonly paper: Paper;
  readonly activeLinks: number;
  readonly devices: number;
};

export type Status = {
  readonly people: ReadonlyArray<PersonStatus>;
  readonly seasons: ReadonlyArray<SeasonStatus>;
};

// Groups participants sorted by year into their seasons.
export const groupSeasons = (
  rows: ReadonlyArray<ParticipantStatus & { readonly year: number }>,
): ReadonlyArray<SeasonStatus> => {
  const seasons: Array<{
    year: number;
    participants: Array<ParticipantStatus>;
  }> = [];
  for (const { year, ...participant } of rows) {
    let season = seasons.at(-1);
    if (season?.year !== year) {
      season = { year, participants: [] };
      seasons.push(season);
    }
    season.participants.push(participant);
  }
  return seasons;
};
