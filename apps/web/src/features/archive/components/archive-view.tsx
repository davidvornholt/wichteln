import { motion } from 'motion/react';
import { type KeyboardEvent, useId, useRef, useState } from 'react';
import { classNames } from '../../../shared/ui/class-names';
import { Paper } from '../../../shared/ui/paper';
import { WishTag } from '../../../shared/ui/wish-tag';
import type { ArchivedSeason } from '../archive';

const listStagger = 0.07;

const SeasonLists = ({ season }: { readonly season: ArchivedSeason }) => {
  const headingBaseId = useId();
  if (season.lists.length === 0) {
    return (
      <p className="max-w-[36ch] text-ink-soft leading-relaxed">
        Die Wunschzettel von {season.year} sind nicht erhalten geblieben.
      </p>
    );
  }
  return (
    <div className="space-y-12">
      {season.lists.map((list, index) => (
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          aria-labelledby={`${headingBaseId}-${index}`}
          initial={{ opacity: 0, y: 16 }}
          key={list.name}
          transition={{
            delay: listStagger * index,
            duration: 0.4,
            ease: 'easeOut',
          }}
        >
          <div className="flex items-center gap-3">
            <Paper className="size-9 shrink-0" paper={list.paper} tile={0.5} />
            <h2
              className="font-display font-extrabold text-[2rem] uppercase leading-none"
              id={`${headingBaseId}-${index}`}
            >
              {list.name}
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {list.wishes.map((wish) => (
              <li key={wish.id}>
                <WishTag
                  note={wish.note}
                  paper={list.paper}
                  title={wish.title}
                  url={wish.url}
                />
              </li>
            ))}
          </ul>
        </motion.section>
      ))}
    </div>
  );
};

type ArchiveViewProps = {
  readonly seasons: ReadonlyArray<ArchivedSeason>;
};

// The tab a key moves to in a tab list of the given length, as in any tab
// list: arrows step and wrap around, Home and End jump to the ends.
const tabAfterKey = (
  key: string,
  current: number,
  count: number,
): number | undefined => {
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current + count - 1) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return undefined;
  }
};

// The wish lists of earlier years, one year at a time.
export const ArchiveView = ({ seasons }: ArchiveViewProps) => {
  const [selected, setSelected] = useState(0);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const tabBaseId = useId();
  const panelId = `${tabBaseId}-panel`;
  const season = seasons[selected];

  const moveWithKeys = (event: KeyboardEvent) => {
    const next = tabAfterKey(event.key, selected, seasons.length);
    if (next === undefined) {
      return;
    }
    event.preventDefault();
    setSelected(next);
    tabsRef.current[next]?.focus();
  };

  return (
    <>
      <h1 className="font-display font-extrabold text-[2.75rem] uppercase leading-[0.88]">
        Früher
      </h1>
      {season === undefined ? (
        <p className="mt-3 max-w-[36ch] text-ink-soft leading-relaxed">
          Wenn eine Wichtelrunde vorbei ist, findest du ihre Wunschzettel hier.
        </p>
      ) : (
        <>
          <p className="mt-3 max-w-[38ch] text-ink-soft leading-relaxed">
            Was sich alle in den letzten Jahren gewünscht haben. Wer wen
            beschenkt hat, bleibt geheim.
          </p>
          <div
            aria-label="Jahr"
            className="-mx-5 mt-8 flex overflow-x-auto border-line border-b px-5 [scrollbar-width:none]"
            onKeyDown={moveWithKeys}
            role="tablist"
          >
            {seasons.map((each, index) => (
              <button
                aria-controls={panelId}
                aria-selected={index === selected}
                className={classNames(
                  'relative shrink-0 px-3 pt-1 pb-3 font-display font-extrabold text-[2.5rem] tabular-nums leading-none transition-colors first:pl-0',
                  index === selected
                    ? 'text-ink'
                    : 'text-ink-soft hover:text-ink',
                )}
                id={`${tabBaseId}-${each.year}`}
                key={each.year}
                onClick={() => setSelected(index)}
                ref={(element) => {
                  tabsRef.current[index] = element;
                }}
                role="tab"
                tabIndex={index === selected ? 0 : -1}
                type="button"
              >
                {each.year}
                {index === selected ? (
                  <motion.span
                    aria-hidden="true"
                    className={classNames(
                      'absolute right-3 bottom-[-1px] h-1.5 bg-accent',
                      index === 0 ? 'left-0' : 'left-3',
                    )}
                    layoutId="jahr-marker"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                ) : null}
              </button>
            ))}
          </div>
          <div
            aria-labelledby={`${tabBaseId}-${season.year}`}
            className="pt-8"
            id={panelId}
            role="tabpanel"
          >
            <SeasonLists key={season.year} season={season} />
          </div>
        </>
      )}
    </>
  );
};
