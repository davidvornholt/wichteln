import { Schema } from 'effect';

// The wish is gone or belongs to someone else.
export class WishNotFound extends Schema.TaggedError<WishNotFound>()(
  'WishNotFound',
  {},
) {}
