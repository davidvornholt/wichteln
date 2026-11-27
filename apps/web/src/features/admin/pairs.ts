const countNames = (names: ReadonlyArray<string>) => {
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
};

// Checks that pairs form a valid Wichteln round: everyone taking part gives
// exactly one gift, receives exactly one, and nobody draws themselves.
// Returns the problems in plain words, empty when the round is valid.
export const pairProblems = (
  participants: ReadonlyArray<string>,
  pairs: ReadonlyArray<readonly [giver: string, recipient: string]>,
): ReadonlyArray<string> => {
  const known = new Set(participants);
  const outsiders = pairs
    .flat()
    .filter((name) => !known.has(name))
    .map((name) => `${name} nimmt nicht teil.`);
  const selfGifts = pairs
    .filter(([giver, recipient]) => giver === recipient)
    .map(([giver]) => `${giver} würde sich selbst beschenken.`);
  const gives = countNames(pairs.map(([giver]) => giver));
  const receives = countNames(pairs.map(([, recipient]) => recipient));
  const unbalanced = participants.flatMap((name) => {
    const given = gives.get(name) ?? 0;
    const received = receives.get(name) ?? 0;
    return [
      given === 1 ? [] : [`${name} beschenkt ${given} statt einer Person.`],
      received === 1
        ? []
        : [`${name} wird von ${received} statt einer Person beschenkt.`],
    ].flat();
  });
  return [...new Set([...outsiders, ...selfGifts, ...unbalanced])];
};
