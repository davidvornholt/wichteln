import type { Paper } from '@wichteln/db/papers';

// The person a session belongs to.
export type SignedInPerson = {
  readonly id: string;
  readonly name: string;
  readonly paper: Paper;
};
