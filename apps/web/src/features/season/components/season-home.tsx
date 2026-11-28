import { Link, useRouter } from '@tanstack/react-router';
import { Gift as GiftIcon, PenLine, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { SignedInPerson } from '../../../shared/auth/signed-in-person';
import { Button } from '../../../shared/ui/button';
import { buttonClass } from '../../../shared/ui/button-class';
import { markUnwrapped } from '../server-fns';
import type { SeasonView } from '../wish';
import { Gift } from './gift';
import type { GiftState } from './gift-state';
import { openingMilliseconds, unwrapVibration } from './gift-timing';
import { RecipientWishes } from './recipient-wishes';

type TakingPart = Extract<SeasonView, { readonly kind: 'taking-part' }>;

const rise = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
} as const;

const headingClass =
  'font-display font-extrabold text-[2.75rem] uppercase leading-[0.88]';
const introClass = 'max-w-[36ch] text-ink-soft leading-relaxed';

const introFor = (paired: boolean, state: GiftState) => {
  if (!paired) {
    return 'Die Namen werden gerade verteilt. Schau bald wieder rein.';
  }
  if (state === 'closed') {
    return 'Pack aus, wen du dieses Jahr beschenkst. Nur du siehst den Namen.';
  }
  return 'Nur du siehst, wen du beschenkst.';
};

const EmptyOwnList = () => (
  <aside className="mt-12 border-2 border-ink border-dashed p-5">
    <p className="font-bold text-lg leading-snug">
      Dein Wunschzettel ist noch leer.
    </p>
    <p className="mt-1 text-ink-soft leading-relaxed">
      Wer dich beschenkt, freut sich über ein paar Ideen.
    </p>
    <Link className={buttonClass('secondary', 'mt-4')} to="/wunschzettel">
      <PenLine aria-hidden="true" size={18} />
      Wünsche aufschreiben
    </Link>
  </aside>
);

// Phones that can vibrate feel the gift charge and burst. Others, such as
// iPhones, simply don't.
const vibrate = (pattern: ReadonlyArray<number>) => {
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate([...pattern]);
  }
};

type TakingPartHomeProps = {
  readonly person: SignedInPerson;
  readonly view: TakingPart;
  readonly unwrapped: boolean;
};

const TakingPartHome = ({ person, view, unwrapped }: TakingPartHomeProps) => {
  const [state, setState] = useState<GiftState>(unwrapped ? 'open' : 'closed');
  const [burst, setBurst] = useState(false);
  const still = useReducedMotion() === true;
  const router = useRouter();
  const { recipient } = view;

  useEffect(() => {
    if (state !== 'opening') {
      return;
    }
    const done = setTimeout(() => setState('open'), openingMilliseconds);
    return () => clearTimeout(done);
  }, [state]);

  const open = () => {
    // Without motion, nothing unwraps, so there is nothing to wait for and
    // nothing bursts.
    setState(still ? 'open' : 'opening');
    if (!still) {
      setBurst(true);
      vibrate(
        unwrapVibration(
          recipient === null ? 0 : Array.from(recipient.name).length,
        ),
      );
    }
    if (!unwrapped) {
      // Remembering is a nicety. If it fails, the gift is wrapped again on
      // the next visit, which is the safe side to fail on.
      markUnwrapped({ data: { year: view.year } })
        .then(() => router.invalidate())
        .catch(() => undefined);
    }
  };

  return (
    <>
      <h1 className={headingClass}>Dein Wichtel {view.year}</h1>
      <p className={`${introClass} mt-2 mb-8`}>
        {introFor(recipient !== null, state)}
      </p>
      <Gift
        burst={burst}
        onBurstDone={() => setBurst(false)}
        onOpen={open}
        recipient={recipient}
        state={state}
        viewer={person}
      />
      <div className="mt-10 flex min-h-14 justify-center">
        <AnimatePresence mode="wait">
          {state === 'closed' ? (
            <motion.div key="auspacken" {...rise}>
              <Button
                disabled={recipient === null}
                icon={<GiftIcon aria-hidden="true" size={20} />}
                onClick={open}
              >
                Auspacken
              </Button>
            </motion.div>
          ) : null}
          {state === 'open' ? (
            <motion.div key="einpacken" {...rise}>
              <Button
                icon={<RotateCcw aria-hidden="true" size={18} />}
                onClick={() => {
                  setBurst(false);
                  vibrate([]);
                  setState('closed');
                }}
                variant="quiet"
              >
                Noch einmal einpacken
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {state === 'open' && recipient !== null ? (
          <motion.div key="wuensche" {...rise}>
            <RecipientWishes recipient={recipient} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {view.ownWishes.length === 0 ? <EmptyOwnList /> : null}
    </>
  );
};

type SeasonHomeProps = {
  readonly person: SignedInPerson;
  readonly view: SeasonView;
  readonly unwrapped: boolean;
};

// The home page of a signed-in person: their wrapped gift and, once it is
// unwrapped, the wish list of the person they give to.
export const SeasonHome = ({ person, view, unwrapped }: SeasonHomeProps) => {
  if (view.kind === 'taking-part') {
    return <TakingPartHome person={person} unwrapped={unwrapped} view={view} />;
  }
  if (view.kind === 'no-season') {
    return (
      <>
        <h1 className={headingClass}>Noch keine Runde</h1>
        <p className={`${introClass} mt-3`}>
          Sobald die nächste Wichtelrunde beginnt, findest du hier, wen du
          beschenkst.
        </p>
      </>
    );
  }
  return (
    <>
      <h1 className={headingClass}>{view.year} ohne dich</h1>
      <p className={`${introClass} mt-3`}>
        Bei der Wichtelrunde {view.year} bist du nicht dabei. Die Wunschzettel
        der früheren Jahre kannst du dir weiter ansehen.
      </p>
      <Link className={buttonClass('secondary', 'mt-6')} to="/frueher">
        Frühere Wunschzettel
      </Link>
    </>
  );
};
