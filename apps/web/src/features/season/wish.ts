import type { Paper } from '@wichteln/db/papers';

export type Wish = {
  readonly id: string;
  readonly title: string;
  readonly note: string | null;
  readonly url: string | null;
};

export type Recipient = {
  readonly name: string;
  readonly paper: Paper;
  readonly wishes: ReadonlyArray<Wish>;
};

// What the home page shows the signed-in person about the current season.
export type SeasonView =
  | { readonly kind: 'no-season' }
  | { readonly kind: 'not-taking-part'; readonly year: number }
  | {
      readonly kind: 'taking-part';
      readonly year: number;
      // Null until the pairs for the season are set.
      readonly recipient: Recipient | null;
      readonly ownWishes: ReadonlyArray<Wish>;
    };
