import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PaperPattern } from './paper';
import { Paper } from './paper';

type WishTagProps = {
  readonly title: string;
  readonly note: string | null;
  readonly url: string | null;
  // The paper of the person who wished for it.
  readonly paper: PaperPattern;
  // Draws a line through the wish while it is being struck off the list.
  readonly struck?: boolean;
  readonly actions?: ReactNode;
};

const leadingWww = /^www\./u;

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(leadingWww, '');
  } catch {
    return url;
  }
};

// A wish written on a gift tag. The tag's end is wrapped in the paper of the
// person who wished for it, with the hole for the string punched through.
export const WishTag = ({
  title,
  note,
  url,
  paper,
  struck = false,
  actions,
}: WishTagProps) => (
  <div className="drop-shadow-[0_1px_1px_oklch(0.21_0.03_268/0.14)] filter">
    <div className="tag-shape flex bg-card">
      <Paper className="w-9 shrink-0" paper={paper} tile={0.6} />
      <div className="min-w-0 flex-1 p-4">
        <p className="relative w-fit max-w-full font-bold text-[1.0625rem] leading-snug [overflow-wrap:anywhere]">
          {title}
          <span
            aria-hidden="true"
            className="absolute inset-x-[-0.2em] top-[55%] h-[0.14em] origin-left bg-ink transition-transform duration-300 ease-out data-[struck=false]:scale-x-0"
            data-struck={struck}
          />
        </p>
        {note === null ? null : (
          <p className="mt-1 whitespace-pre-line text-ink-soft leading-snug [overflow-wrap:anywhere]">
            {note}
          </p>
        )}
        {url === null ? null : (
          <a
            className="mt-2 inline-flex min-h-6 items-center gap-1 font-bold text-ink underline decoration-2 decoration-line underline-offset-4 hover:decoration-ink"
            href={url}
            referrerPolicy="no-referrer"
            rel="noopener noreferrer"
            target="_blank"
          >
            {hostOf(url)}
            <ArrowUpRight aria-hidden="true" size={16} />
            <span className="sr-only">(öffnet in einem neuen Tab)</span>
          </a>
        )}
        {actions}
      </div>
    </div>
  </div>
);
