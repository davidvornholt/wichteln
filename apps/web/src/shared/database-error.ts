import { Schema } from 'effect';

// A query that failed. The operation names what the app was doing, so the log
// says more than the driver's message.
export class DatabaseError extends Schema.TaggedError<DatabaseError>()(
  'DatabaseError',
  { operation: Schema.String, cause: Schema.Defect() },
) {}

export const databaseFailure = (operation: string) => (cause: unknown) =>
  new DatabaseError({ operation, cause });
