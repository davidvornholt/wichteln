import { christmasEveCountdown } from '../dates/christmas';

const sentences = {
  tomorrow: 'Morgen ist Heiligabend',
  today: 'Heute ist Heiligabend',
  over: 'Frohe Weihnachten',
} as const;

// The days left until the gifts are given, in the corner of every page.
export const Countdown = () => {
  const countdown = christmasEveCountdown(new Date());
  if (countdown.kind !== 'days') {
    return (
      <p className="max-w-[9rem] text-right font-bold font-display text-xl uppercase leading-none">
        {sentences[countdown.kind]}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-2">
      <span className="font-display font-extrabold text-[2.75rem] tabular-nums leading-[0.8]">
        {countdown.days}
      </span>
      <span className="font-bold text-[0.8125rem] text-ink-soft uppercase leading-[1.05] tracking-[0.06em]">
        Tage bis
        <br />
        Heiligabend
      </span>
    </p>
  );
};
