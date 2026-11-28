import { Schema } from 'effect';

// The person does not take part in the current season, so they have no wish
// list to change.
export class NotTakingPart extends Schema.TaggedError<NotTakingPart>()(
  'NotTakingPart',
  {},
) {}
