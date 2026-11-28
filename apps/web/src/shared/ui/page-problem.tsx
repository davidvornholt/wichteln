import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { buttonClass } from './button-class';
import { Paper } from './paper';

type PageProblemProps = {
  readonly title: string;
  readonly children: ReactNode;
  readonly action?: ReactNode;
};

// A page that could not be shown, with what to do about it.
export const PageProblem = ({ title, children, action }: PageProblemProps) => (
  <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-16">
    <Paper className="h-3 w-24" paper="wrap" tile={0.6} />
    <h1 className="mt-6 font-display font-extrabold text-[3rem] uppercase leading-[0.88]">
      {title}
    </h1>
    <div className="mt-4 max-w-[36ch] text-lg leading-relaxed">{children}</div>
    <div className="mt-8">
      {action ?? (
        <Link className={buttonClass('secondary')} to="/">
          Zur Startseite
        </Link>
      )}
    </div>
  </main>
);
