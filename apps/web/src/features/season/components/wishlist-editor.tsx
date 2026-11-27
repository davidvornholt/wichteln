import { useRouter } from '@tanstack/react-router';
import type { Paper as PaperName } from '@wichteln/db/papers';
import { AnimatePresence } from 'motion/react';
import { useEffect, useId, useState } from 'react';
import { addWish, deleteWish, updateWish } from '../server-fns';
import type { Wish } from '../wish';
import { UndoToast } from './undo-toast';
import { type WishDraft, WishForm } from './wish-form';
import { WishItem } from './wish-item';

// The strike line needs this long to cross the title.
const strikeMilliseconds = 380;
const undoMilliseconds = 7000;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

type WishlistEditorProps = {
  readonly year: number;
  readonly paper: PaperName;
  readonly wishes: ReadonlyArray<Wish>;
};

// The signed-in person's own wish list for the season. A wish struck off can
// be brought back for a few seconds.
export const WishlistEditor = ({
  year,
  paper,
  wishes,
}: WishlistEditorProps) => {
  const router = useRouter();
  const headingId = useId();
  const [editing, setEditing] = useState<string | null>(null);
  const [striking, setStriking] = useState<string | null>(null);
  const [struckOff, setStruckOff] = useState<Wish | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (struckOff === null) {
      return;
    }
    const hide = setTimeout(() => setStruckOff(null), undoMilliseconds);
    return () => clearTimeout(hide);
  }, [struckOff]);

  const add = async (draft: WishDraft) => {
    await addWish({ data: draft });
    await router.invalidate();
  };

  const change = (id: string) => async (draft: WishDraft) => {
    await updateWish({ data: { id, wish: draft } });
    await router.invalidate();
    setEditing(null);
  };

  const strike = async (wish: Wish) => {
    setProblem(null);
    setStriking(wish.id);
    try {
      await Promise.all([
        deleteWish({ data: { id: wish.id } }),
        wait(strikeMilliseconds),
      ]);
      setStruckOff(wish);
      await router.invalidate();
    } catch {
      setProblem(
        `„${wish.title}“ steht noch auf dem Zettel. Prüfe die Internetverbindung und versuch es noch einmal.`,
      );
    } finally {
      setStriking(null);
    }
  };

  const bringBack = async (wish: Wish) => {
    setStruckOff(null);
    try {
      await add({
        title: wish.title,
        note: wish.note ?? '',
        url: wish.url ?? '',
      });
    } catch {
      setProblem(`„${wish.title}“ konnte nicht zurückgeholt werden.`);
    }
  };

  return (
    <>
      {wishes.length === 0 ? (
        <p className="border-2 border-line border-dashed px-5 py-6 text-ink-soft leading-relaxed">
          Noch steht nichts auf deinem Zettel. Schreib unten deinen ersten
          Wunsch auf.
        </p>
      ) : (
        <ul aria-label={`Deine Wünsche ${year}`} className="space-y-3">
          <AnimatePresence initial={false}>
            {wishes.map((wish) => (
              <WishItem
                busy={striking !== null}
                editing={editing === wish.id}
                key={wish.id}
                onCancel={() => setEditing(null)}
                onEdit={() => setEditing(wish.id)}
                onSave={change(wish.id)}
                onStrike={() => strike(wish)}
                paper={paper}
                striking={striking === wish.id}
                wish={wish}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
      {problem === null ? null : (
        <p className="mt-4 font-bold text-kirsch-deep" role="alert">
          {problem}
        </p>
      )}
      <section aria-labelledby={headingId} className="mt-12">
        <h2
          className="font-display font-extrabold text-[2rem] uppercase leading-none"
          id={headingId}
        >
          Neuer Wunsch
        </h2>
        <div className="mt-5">
          <WishForm onSave={add} />
        </div>
      </section>
      <UndoToast onBringBack={bringBack} wish={struckOff} />
    </>
  );
};
