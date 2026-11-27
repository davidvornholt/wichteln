import type { Paper as PaperName } from '@wichteln/db/papers';
import { Pencil, X } from 'lucide-react';
import { motion } from 'motion/react';
import { leaveCurve, settleCurve } from '../../../shared/ui/motion-curves';
import { WishTag } from '../../../shared/ui/wish-tag';
import type { Wish } from '../wish';
import { type WishDraft, WishForm } from './wish-form';

const actionClass =
  'inline-flex h-10 items-center gap-1.5 px-1 font-bold text-[0.9375rem] text-ink-soft transition-colors hover:text-ink';

// A wish slides in from the left and leaves to the right, folding the gap.
const slide = {
  initial: { opacity: 0, height: 0, x: -24 },
  animate: { opacity: 1, height: 'auto', x: 0 },
  exit: {
    opacity: 0,
    height: 0,
    x: 48,
    transition: { duration: 0.32, ease: leaveCurve },
  },
  transition: { duration: 0.4, ease: settleCurve },
} as const;

type WishItemProps = {
  readonly wish: Wish;
  readonly paper: PaperName;
  readonly editing: boolean;
  readonly striking: boolean;
  // True while any wish is being struck off.
  readonly busy: boolean;
  readonly onEdit: () => void;
  readonly onStrike: () => void;
  readonly onSave: (draft: WishDraft) => Promise<void>;
  readonly onCancel: () => void;
};

// One wish on the signed-in person's own list, with its actions, or the form
// that changes it.
export const WishItem = ({
  wish,
  paper,
  editing,
  striking,
  busy,
  onEdit,
  onStrike,
  onSave,
  onCancel,
}: WishItemProps) => (
  <motion.li layout="position" {...slide}>
    {editing ? (
      <div className="border-2 border-ink bg-card p-5">
        <WishForm onCancel={onCancel} onSave={onSave} wish={wish} />
      </div>
    ) : (
      <WishTag
        actions={
          <div className="mt-2 -ml-1 flex gap-4">
            <button
              className={actionClass}
              disabled={busy}
              onClick={onEdit}
              type="button"
            >
              <Pencil aria-hidden="true" size={16} />
              Ändern
              <span className="sr-only">: {wish.title}</span>
            </button>
            <button
              className={actionClass}
              disabled={busy}
              onClick={onStrike}
              type="button"
            >
              <X aria-hidden="true" size={18} />
              Streichen
              <span className="sr-only">: {wish.title}</span>
            </button>
          </div>
        }
        note={wish.note}
        paper={paper}
        struck={striking}
        title={wish.title}
        url={wish.url}
      />
    )}
  </motion.li>
);
