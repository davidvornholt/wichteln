import { useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import type { SignedInPerson } from '../../../shared/auth/signed-in-person';
import { Button } from '../../../shared/ui/button';
import { FitName } from '../../../shared/ui/fit-name';
import { unrollCurve } from '../../../shared/ui/motion-curves';
import { Paper } from '../../../shared/ui/paper';
import { redeemInvitation } from '../server-fns';

type Arrival =
  | { readonly kind: 'checking' }
  | { readonly kind: 'signed-in'; readonly person: SignedInPerson }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'incomplete' }
  | { readonly kind: 'failed' };

const problems = {
  invalid: {
    title: 'Dieser Link gilt nicht mehr',
    text: 'Bitte David um einen neuen.',
  },
  incomplete: {
    title: 'Der Link ist unvollständig',
    text: 'Öffne ihn noch einmal direkt aus Davids Nachricht, ohne ihn abzutippen.',
  },
  failed: {
    title: 'Die Anmeldung hat nicht geklappt',
    text: 'Prüfe die Internetverbindung und lade die Seite neu.',
  },
} as const;

// Reads the secret from the link's fragment, which never reaches a server
// log, takes it out of the address bar and the history, and signs in with it.
// The result is kept, because the secret is gone from the address once read
// and React may run the effect that asks for it twice.
let arrival: Promise<Arrival> | undefined;
const arrive = (): Promise<Arrival> => {
  arrival ??= ((): Promise<Arrival> => {
    const { location, history } = globalThis;
    const secret = location.hash.slice(1);
    history.replaceState(null, '', location.pathname);
    if (secret === '') {
      return Promise.resolve({ kind: 'incomplete' } as const);
    }
    return redeemInvitation({ data: { token: secret } }).catch(
      () => ({ kind: 'failed' }) as const,
    );
  })();
  return arrival;
};

// The card lands on the paper once the paper is half unrolled, slightly
// askew like a card laid down by hand.
const card = {
  arriving: { opacity: 0, y: 40, rotate: 2 },
  placed: {
    opacity: 1,
    y: 0,
    rotate: -1.5,
    transition: { delay: 0.55, type: 'spring', stiffness: 220, damping: 20 },
  },
} as const;

// The page a personal link opens. It signs this device in and greets the
// person on their own wrapping paper.
export const Welcome = () => {
  const [state, setState] = useState<Arrival>({ kind: 'checking' });
  const router = useRouter();
  const navigate = useNavigate();

  useEffect(() => {
    let current = true;
    arrive()
      .then(async (result) => {
        if (result.kind === 'signed-in') {
          // The frame needs to know who is signed in now.
          await router.invalidate();
        }
        if (current) {
          setState(result);
        }
      })
      .catch(() => {
        if (current) {
          setState({ kind: 'failed' });
        }
      });
    return () => {
      current = false;
    };
  }, [router]);

  if (state.kind === 'checking') {
    return (
      <main className="grid min-h-dvh place-items-center px-5">
        <h1 className="font-display font-extrabold text-3xl text-ink-soft uppercase">
          Einen Moment …
        </h1>
      </main>
    );
  }

  if (state.kind !== 'signed-in') {
    const problem = problems[state.kind];
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
        <Paper className="h-3 w-24" paper="wrap" tile={0.6} />
        <h1 className="mt-6 font-display font-extrabold text-[3rem] uppercase leading-[0.88]">
          {problem.title}
        </h1>
        <p className="mt-4 max-w-[34ch] text-lg leading-relaxed">
          {problem.text}
        </p>
      </main>
    );
  }

  const { person } = state;
  return (
    <main
      className="relative min-h-dvh overflow-hidden"
      data-accent={person.paper}
    >
      <motion.div
        animate={{ clipPath: 'inset(0 0 0% 0)' }}
        className="absolute inset-0"
        initial={{ clipPath: 'inset(0 0 100% 0)' }}
        transition={{ duration: 0.9, ease: unrollCurve }}
      >
        <Paper className="size-full" paper={person.paper} tile={1.4} />
      </motion.div>
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-12">
        <motion.div
          animate="placed"
          className="bg-card p-7 text-ink shadow-[0_18px_40px_oklch(0.21_0.03_268/0.3)]"
          initial="arriving"
          variants={card}
        >
          <p className="font-bold text-ink-soft text-sm uppercase tracking-[0.14em]">
            Hallo
          </p>
          <h1 className="mt-2">
            <FitName name={person.name} />
          </h1>
          <p className="mt-5 max-w-[34ch] text-lg leading-relaxed">
            Dieses Gerät ist jetzt angemeldet. Dein Link funktioniert auch auf
            deinen anderen Geräten.
          </p>
          <Button
            className="mt-7 w-full"
            icon={<ArrowRight aria-hidden="true" size={20} />}
            onClick={() => navigate({ to: '/' })}
          >
            Zu deinem Geschenk
          </Button>
        </motion.div>
      </div>
    </main>
  );
};
