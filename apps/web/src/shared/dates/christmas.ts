const dayMilliseconds = 86_400_000;
const december = 11;
const christmasEve = 24;

const berlinDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export type Countdown =
  | { readonly kind: 'days'; readonly days: number }
  | { readonly kind: 'tomorrow' }
  | { readonly kind: 'today' }
  | { readonly kind: 'over' };

// How far it is to Christmas Eve, counted in Berlin's calendar days. The days
// after it, until New Year's Eve, count as over.
export const christmasEveCountdown = (now: Date): Countdown => {
  const [year = 0, month = 1, day = 1] = berlinDay
    .format(now)
    .split('-')
    .map(Number);
  const days = Math.round(
    (Date.UTC(year, december, christmasEve) - Date.UTC(year, month - 1, day)) /
      dayMilliseconds,
  );
  if (days < 0) {
    return { kind: 'over' };
  }
  if (days === 0) {
    return { kind: 'today' };
  }
  if (days === 1) {
    return { kind: 'tomorrow' };
  }
  return { kind: 'days', days };
};
