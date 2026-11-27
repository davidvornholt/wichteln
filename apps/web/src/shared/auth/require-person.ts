import { currentPerson } from './current-person';
import type { SignedInPerson } from './signed-in-person';

// Server functions that read or change a person's data call this first. The
// routes already send signed-out visitors home, so reaching the error means
// the session ended while the page was open.
export const requirePerson = async (): Promise<SignedInPerson> => {
  const person = await currentPerson();
  if (person === null) {
    throw new Error('Dieses Gerät ist nicht mehr angemeldet.');
  }
  return person;
};
