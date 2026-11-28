import { expect, it } from 'bun:test';
import { Effect } from 'effect';
import { readPipedInput } from './piped-input';

it('input typed into a terminal is refused before anything is read', async () => {
  let read = false;
  const refusal = await Effect.runPromise(
    readPipedInput(true, () => {
      read = true;
      return Promise.resolve('Mara=Jonas');
    }).pipe(Effect.flip),
  );
  expect(refusal.message).toBe(
    'Die Eingabe muss aus einer Datei kommen, nicht aus dem Terminal.',
  );
  expect(read).toBe(false);
});

it('input from a file or a pipe is read', async () => {
  expect(
    await Effect.runPromise(
      readPipedInput(false, () => Promise.resolve('Mara=Jonas')),
    ),
  ).toBe('Mara=Jonas');
});
