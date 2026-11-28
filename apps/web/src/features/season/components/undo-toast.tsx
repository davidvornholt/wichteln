import { Undo2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Wish } from '../wish';

type UndoToastProps = {
  // The wish just struck off, or nothing when there is nothing to undo.
  readonly wish: Wish | null;
  readonly onBringBack: (wish: Wish) => void;
};

// A note above the tab bar that a wish was struck off, with a way back.
export const UndoToast = ({ wish, onBringBack }: UndoToastProps) => (
  <div
    aria-live="polite"
    className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4"
  >
    <AnimatePresence>
      {wish === null ? null : (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto flex max-w-md items-center gap-4 bg-ink py-2 pr-2 pl-4 text-card shadow-[0_12px_28px_oklch(0.21_0.03_268/0.3)]"
          data-on-dark="true"
          exit={{ opacity: 0, y: 16 }}
          initial={{ opacity: 0, y: 24 }}
          key={wish.id}
        >
          <p className="min-w-0 truncate">„{wish.title}“ gestrichen.</p>
          <button
            className="inline-flex h-10 shrink-0 items-center gap-1.5 px-3 font-bold text-card underline decoration-2 decoration-card/40 underline-offset-4 hover:decoration-card"
            onClick={() => onBringBack(wish)}
            type="button"
          >
            <Undo2 aria-hidden="true" size={18} />
            Zurückholen
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
