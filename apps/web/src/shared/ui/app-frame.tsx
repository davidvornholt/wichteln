import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { SignedInPerson } from '../auth/signed-in-person';
import { AccountMenu } from './account-menu';
import { Countdown } from './countdown';
import { Paper } from './paper';
import { TabBar } from './tab-bar';

type AppFrameProps = {
  readonly person: SignedInPerson;
  readonly onSignOut: () => Promise<void>;
  readonly children: ReactNode;
};

// The frame around every page of a signed-in person: the edge of their
// wrapping paper along the top, the countdown, and the tabs.
export const AppFrame = ({ person, onSignOut, children }: AppFrameProps) => (
  <div
    className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom))]"
    data-accent={person.paper}
  >
    <header className="[view-transition-name:app-header]">
      <Paper className="h-2" paper={person.paper} tile={0.5} />
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4 px-5 pt-4 pb-2">
        <Link
          className="font-display font-extrabold text-[1.75rem] uppercase leading-none tracking-[0.02em]"
          to="/"
        >
          Wichteln
        </Link>
        <div className="flex items-center gap-4">
          <Countdown />
          <AccountMenu onSignOut={onSignOut} person={person} />
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-xl px-5 pt-6 pb-16">{children}</main>
    <TabBar />
  </div>
);
