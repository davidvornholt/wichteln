import { Schema } from 'effect';

// A request the data cannot satisfy, in words for the person running the
// command.
export class AdminRefusal extends Schema.TaggedError<AdminRefusal>()(
  'AdminRefusal',
  { message: Schema.String },
) {}

export const refuse = (message: string) => new AdminRefusal({ message });
