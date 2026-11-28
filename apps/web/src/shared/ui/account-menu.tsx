import { LogOut } from 'lucide-react';
import { useState } from 'react';
import type { SignedInPerson } from '../auth/signed-in-person';
import { Button } from './button';
import { Paper } from './paper';

type AccountMenuProps = {
  readonly person: SignedInPerson;
  readonly onSignOut: () => Promise<void>;
};

const menuId = 'konto';

// Who this device is signed in as, and the way to sign it out.
export const AccountMenu = ({ person, onSignOut }: AccountMenuProps) => {
  const [signingOut, setSigningOut] = useState(false);
  return (
    <>
      <button
        aria-label={`Angemeldet als ${person.name}`}
        className="group flex h-11 items-center gap-2 pr-1"
        popoverTarget={menuId}
        type="button"
      >
        <Paper
          className="size-7 shadow-[0_0_0_2px_var(--color-paper),0_0_0_3px_var(--color-line)] transition-transform group-hover:-rotate-6"
          paper={person.paper}
          tile={0.4}
        />
      </button>
      <div
        className="fixed inset-auto top-20 right-4 m-0 w-[min(22rem,calc(100vw-2rem))] border-2 border-ink bg-paper p-5 text-ink shadow-[8px_8px_0_var(--color-ink)] [&:popover-open]:animate-[menu-in_220ms_var(--ease-settle)]"
        id={menuId}
        popover="auto"
      >
        <p className="text-ink-soft text-sm">Dieses Gerät ist angemeldet als</p>
        <p className="mt-1 font-display font-extrabold text-4xl uppercase leading-none">
          {person.name}
        </p>
        <p className="mt-3 text-ink-soft text-sm leading-snug">
          Dein Link meldet jedes Gerät an, auf dem du ihn öffnest.
        </p>
        <Button
          className="mt-5 w-full"
          disabled={signingOut}
          icon={<LogOut aria-hidden="true" size={18} />}
          onClick={async () => {
            setSigningOut(true);
            try {
              await onSignOut();
            } finally {
              setSigningOut(false);
            }
          }}
          variant="secondary"
        >
          Auf diesem Gerät abmelden
        </Button>
      </div>
    </>
  );
};
