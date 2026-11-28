import type { CSSProperties } from 'react';

// The moments of the unwrapping, in milliseconds after the press. The gift
// swells and rumbles while cracks of light spread through its paper, then
// bursts, and the name slams in letter by letter. The styles read the same
// moments from the custom properties of timingStyle, and the confetti and the
// vibration from here, so all of them stay in step.
export const chargeMilliseconds = 1150;
export const burstMilliseconds = chargeMilliseconds;
const nameAfterBurst = 260;
export const nameMilliseconds = burstMilliseconds + nameAfterBurst;
export const letterStaggerMilliseconds = 80;
// After this the gift counts as open, and the wish list rises below it.
export const openingMilliseconds = 3000;

const seconds = 1000;
export const inSeconds = (milliseconds: number) => milliseconds / seconds;

export const timingStyle = {
  '--charge': `${chargeMilliseconds}ms`,
  '--burst': `${burstMilliseconds}ms`,
  '--name': `${nameMilliseconds}ms`,
  '--letter-stagger': `${letterStaggerMilliseconds}ms`,
} as CSSProperties;

// The phone's vibration through the unwrapping, as alternating on and off
// times: pulses that come faster and harder while the gift charges, like a
// die rolling to a stop in reverse, one long hit when it bursts, and a tick
// as each letter of the name lands.
const firstGap = 120;
const lastGap = 14;
const firstPulse = 8;
const lastPulse = 34;
const burstPulse = 170;
const letterPulse = 12;
// Gaps shrink fast at first and slowly towards the burst.
const gapEasing = 0.6;

export const unwrapVibration = (letters: number): ReadonlyArray<number> => {
  const pattern: Array<number> = [];
  let elapsed = 0;
  while (elapsed < chargeMilliseconds) {
    const progress = elapsed / chargeMilliseconds;
    const pulse = Math.round(firstPulse + (lastPulse - firstPulse) * progress);
    const gap = Math.round(
      firstGap + (lastGap - firstGap) * progress ** gapEasing,
    );
    const left = chargeMilliseconds - elapsed;
    pattern.push(
      Math.min(pulse, left),
      Math.max(0, Math.min(gap, left - pulse)),
    );
    elapsed += pulse + gap;
  }
  pattern.push(burstPulse, nameMilliseconds - burstMilliseconds - burstPulse);
  for (let letter = 0; letter < letters; letter += 1) {
    pattern.push(letterPulse, letterStaggerMilliseconds - letterPulse);
  }
  return pattern;
};
