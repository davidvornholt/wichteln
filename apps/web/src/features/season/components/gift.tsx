import type { Paper as PaperName } from '@wichteln/db/papers';
import { motion } from 'motion/react';
import { type CSSProperties, useRef } from 'react';
import { FitName } from '../../../shared/ui/fit-name';
import { Paper } from '../../../shared/ui/paper';
import { GiftBurst } from './gift-burst';
import { GiftLightBehind, GiftLightInFront } from './gift-light';
import type { GiftState } from './gift-state';
import { GiftTag } from './gift-tag';
import {
  burstMilliseconds,
  inSeconds,
  nameMilliseconds,
  timingStyle,
} from './gift-timing';
import { GiftBow, GiftShards, GiftSurface } from './gift-wrapping';
import { SlammingLetters } from './slamming-letters';

type Person = { readonly name: string; readonly paper: PaperName };

type GiftProps = {
  readonly state: GiftState;
  // The person the gift is for, named on its tag.
  readonly viewer: Person;
  // The person inside, once the gift opens.
  readonly recipient: Person | null;
  readonly onOpen: () => void;
  // True from the moment the person unwraps the gift on this page until the
  // last confetti has fallen, which is after the gift counts as open.
  readonly burst: boolean;
  readonly onBurstDone: () => void;
};

// The card springs up from the middle as the shards leave it.
const cardAfterBurst = 40;
const cardStart = { scale: 0.3, opacity: 0, rotate: -10 } as const;
const cardSpring = { type: 'spring', stiffness: 320, damping: 15 } as const;

type RevealedNameProps = {
  readonly recipient: Person;
  // False when the gift was already unwrapped on this device.
  readonly animate: boolean;
  // True until the burst has ended, so the sheen after a long name still
  // runs its course once the gift counts as open.
  readonly sheen: boolean;
};

// What the opened gift holds: the name of the person to give to, on a card in
// their own wrapping paper, which floods out from the middle as the gift
// bursts.
const RevealedName = ({ recipient, animate, sheen }: RevealedNameProps) => (
  <Paper
    className="gift-flood absolute inset-0"
    paper={recipient.paper}
    tile={1.1}
  >
    <motion.div
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      className="absolute inset-[9%] flex flex-col justify-center bg-card px-[7%] text-ink shadow-[0_10px_30px_oklch(0.21_0.03_268/0.25)]"
      initial={animate ? cardStart : false}
      transition={{
        ...cardSpring,
        delay: inSeconds(burstMilliseconds + cardAfterBurst),
      }}
    >
      <p className="font-bold text-[4cqi] text-ink-soft uppercase tracking-[0.14em]">
        Du beschenkst
      </p>
      <FitName className="mt-[2cqi]" name={recipient.name}>
        <SlammingLetters
          animate={animate}
          delay={inSeconds(nameMilliseconds)}
          text={recipient.name}
        />
      </FitName>
    </motion.div>
    {sheen ? <span aria-hidden="true" className="gift-sheen" /> : null}
  </Paper>
);

const giftStyle = (recipient: Person | null): CSSProperties =>
  ({
    ...timingStyle,
    '--glow':
      recipient === null
        ? 'var(--color-card)'
        : `var(--color-${recipient.paper})`,
    '--letters': recipient === null ? 0 : Array.from(recipient.name).length,
  }) as CSSProperties;

// The gift on the home page. It stays wrapped, shaking now and then, until the
// person unwraps it. styles/gift.css holds the choreography and
// gift-burst.tsx what happens beyond the gift's box.
export const Gift = ({
  state,
  viewer,
  recipient,
  onOpen,
  burst,
  onBurstDone,
}: GiftProps) => {
  const giftRef = useRef<HTMLDivElement>(null);
  const canOpen = state === 'closed' && recipient !== null;
  const opening = state === 'opening';
  // The gift shrinks on short screens, so the heading above it and the button
  // below it stay in view without scrolling.
  return (
    <div
      className="gift relative mx-auto w-full max-w-[clamp(16rem,calc(100svh_-_25rem),24rem)] md:max-w-[clamp(16rem,calc(100svh_-_25rem),28rem)]"
      data-state={state}
      ref={giftRef}
      // biome-ignore lint/nursery/noInlineStyles: The timing comes from gift-timing.ts, and the light takes the colour of the paper inside.
      style={giftStyle(recipient)}
    >
      <div
        aria-hidden="true"
        className="gift-shadow absolute inset-x-[6%] -bottom-[5%] h-[9%] bg-[radial-gradient(closest-side,oklch(0.21_0.03_268/0.28),transparent)]"
      />
      {opening ? <GiftLightBehind /> : null}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tapping the gift is a pointer shortcut for the Auspacken button below it, which keyboards and screen readers use. */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: The gift is a picture, and the Auspacken button below it is the control. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: The Auspacken button below the gift is the keyboard's way to open it. */}
      <div
        className="gift-body relative aspect-square w-full [container-type:inline-size] data-[can-open=true]:cursor-pointer"
        data-can-open={canOpen}
        onClick={canOpen ? onOpen : undefined}
      >
        {state !== 'closed' && recipient !== null ? (
          <RevealedName animate={opening} recipient={recipient} sheen={burst} />
        ) : null}
        {state === 'open' ? null : (
          <div aria-hidden="true" className="gift-wrapping absolute inset-0">
            <GiftSurface />
            {opening ? <GiftShards /> : null}
            <GiftTag name={viewer.name} paper={viewer.paper} />
            <GiftBow />
          </div>
        )}
      </div>
      {opening ? <GiftLightInFront /> : null}
      {burst && recipient !== null ? (
        <GiftBurst
          giftRef={giftRef}
          onDone={onBurstDone}
          paper={recipient.paper}
        />
      ) : null}
    </div>
  );
};
