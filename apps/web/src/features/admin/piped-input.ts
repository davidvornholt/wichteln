import { Effect } from 'effect';
import { refuse } from './admin-refusal';

// The draw and the import file come from a file or a pipe. Typed into a
// terminal, every line would stay on the screen and in its scrollback, so
// such input is refused before anything is read.
export const readPipedInput = Effect.fnUntraced(function* (
  stdinIsTerminal: boolean,
  read: () => Promise<string>,
) {
  if (stdinIsTerminal) {
    return yield* refuse(
      'Die Eingabe muss aus einer Datei kommen, nicht aus dem Terminal.',
    );
  }
  return yield* Effect.promise(read);
});
