import { Link, useLocation } from '@tanstack/react-router';
import { Gift, History, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';
import { classNames } from './class-names';

type Tab = {
  readonly to: '/' | '/wunschzettel' | '/frueher';
  readonly label: string;
  readonly icon: ReactNode;
};

const iconSize = 22;

const tabs: ReadonlyArray<Tab> = [
  { to: '/', label: 'Wichtel', icon: <Gift size={iconSize} /> },
  {
    to: '/wunschzettel',
    label: 'Wunschzettel',
    icon: <ScrollText size={iconSize} />,
  },
  { to: '/frueher', label: 'Früher', icon: <History size={iconSize} /> },
];

// The three places of the app, at the bottom where thumbs reach them. The bar
// over the current tab glides to the next one when the page changes.
export const TabBar = () => {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Bereiche"
      className="fixed inset-x-0 bottom-0 z-30 border-line border-t bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md [view-transition-name:tab-bar]"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-3">
        {tabs.map((tab) => {
          const current = pathname === tab.to;
          return (
            <li key={tab.to}>
              <Link
                aria-current={current ? 'page' : undefined}
                className={classNames(
                  'relative flex h-16 flex-col items-center justify-center gap-1 text-[0.8125rem] transition-colors',
                  current
                    ? 'font-bold text-ink'
                    : 'text-ink-soft hover:text-ink',
                )}
                to={tab.to}
              >
                {current ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-5 top-0 h-1 bg-accent [view-transition-name:tab-marker]"
                  />
                ) : null}
                {tab.icon}
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
