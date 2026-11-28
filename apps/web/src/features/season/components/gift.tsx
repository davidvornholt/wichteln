import type { Paper as PaperName } from '@wichteln/db/papers';
import { motion } from 'motion/react';
import { FitName } from '../../../shared/ui/fit-name';
import { Paper } from '../../../shared/ui/paper';
import { RisingLetters } from '../../../shared/ui/rising-letters';
import type { GiftState } from './gift-state';
import { GiftTag } from './gift-tag';
import { GiftBow, GiftRibbon, GiftWrapping } from './gift-wrapping';
import { PaperSnippets } from './paper-snippets';

type Person = { readonly name: string; readonly paper: PaperName };

type GiftProps = {
  readonly state: GiftState;
  // The person the gift is for, named on its tag.
  readonly viewer: Person;
  // The person inside, once the gift opens.
  readonly recipient: Person | null;
  readonly onOpen: () => void;
  // True from the moment the person unwraps the gift on this page, so the
  // burst of paper plays to its end after the gift is open.
  readonly burst: boolean;
};

// The card rises once the flaps are halfway open, and the letters of the
// name follow it.
const cardDelay = 0.62;
const lettersDelay = 0.85;
const cardStartScale = 0.82;

type RevealedNameProps = {
  readonly recipient: Person;
  // False when the gift was already unwrapped on this device.
  readonly animate: boolean;
};

// What the opened gift holds: the name of the person to give to, on a card in
// their own wrapping paper.
const RevealedName = ({ recipient, animate }: RevealedNameProps) => (
  <Paper className="absolute inset-0" paper={recipient.paper} tile={1.1}>
    <motion.div
      animate={{ scale: 1, opacity: 1 }}
      className="absolute inset-[9%] flex flex-col justify-center bg-card px-[7%] text-ink shadow-[0_10px_30px_oklch(0.21_0.03_268/0.25)]"
      initial={animate ? { scale: cardStartScale, opacity: 0 } : false}
      transition={{
        delay: cardDelay,
        type: 'spring',
        stiffness: 260,
        damping: 22,
      }}
    >
      <p className="font-bold text-[4cqi] text-ink-soft uppercase tracking-[0.14em]">
        Du beschenkst
      </p>
      <FitName className="mt-[2cqi]" name={recipient.name}>
        <RisingLetters
          animate={animate}
          delay={lettersDelay}
          text={recipient.name}
        />
      </FitName>
    </motion.div>
  </Paper>
);

// The gift on the home page. It stays wrapped, shaking now and then, until the
// person unwraps it. The bow flies off, the ribbon slides away, the paper
// opens in four flaps, and offcuts of everyone's paper burst out around the
// name inside. styles/gift.css holds the choreography.
export const Gift = ({
  state,
  viewer,
  recipient,
  onOpen,
  burst,
}: GiftProps) => {
  const canOpen = state === 'closed' && recipient !== null;
  // The gift shrinks on short screens, so the heading above it and the button
  // below it stay in view without scrolling.
  return (
    <div
      className="gift relative mx-auto w-full max-w-[clamp(16rem,calc(100svh_-_25rem),24rem)] md:max-w-[clamp(16rem,calc(100svh_-_25rem),28rem)]"
      data-state={state}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-[6%] -bottom-[5%] h-[9%] bg-[radial-gradient(closest-side,oklch(0.21_0.03_268/0.28),transparent)]"
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tapping the gift is a pointer shortcut for the Auspacken button below it, which keyboards and screen readers use. */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: The gift is a picture, and the Auspacken button below it is the control. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: The Auspacken button below the gift is the keyboard's way to open it. */}
      <div
        className="gift-body relative aspect-square w-full [container-type:inline-size] data-[can-open=true]:cursor-pointer"
        data-can-open={canOpen}
        onClick={canOpen ? onOpen : undefined}
      >
        {state !== 'closed' && recipient !== null ? (
          <RevealedName animate={state === 'opening'} recipient={recipient} />
        ) : null}
        {state === 'open' ? null : (
          <div aria-hidden="true" className="absolute inset-0">
            <GiftWrapping />
            <GiftRibbon />
            <GiftTag name={viewer.name} paper={viewer.paper} />
            <GiftBow />
          </div>
        )}
        {burst && state !== 'closed' ? <PaperSnippets /> : null}
      </div>
    </div>
  );
};
