import { type Paper as PaperName, papers } from '@wichteln/db/papers';
import type { CSSProperties } from 'react';
import { Paper } from '../../../shared/ui/paper';

const snippetCount = 26;
// Successive multiples of these angles and ratios never line up, so the
// snippets spread evenly without looking arranged.
const goldenAngle = 2.399_963;
const goldenRatio = 1.618_034;

// Distances are fractions of the gift's width. The burst leans upwards and
// is flatter than it is wide, like paper thrown up from a table.
const nearestReach = 0.42;
const reachSpread = 0.45;
const upwardLean = 0.22;
const flattening = 0.8;
const shortestFall = 0.3;
const fallSpread = 0.35;
const mostTurnDegrees = 760;
// The burst waits until the flaps have opened far enough to let it out.
const burstStartMilliseconds = 760;
const mostDelayMilliseconds = 90;
const percent = 100;
const half = 0.5;

const fraction = (value: number) => value - Math.floor(value);

// A value from 0 to 1 that changes from one snippet to the next. The seed
// keeps the values for reach, fall, and spin apart from each other.
const variation = (index: number, seed: number) =>
  fraction((index + seed) * goldenRatio);

type Snippet = {
  readonly paper: PaperName;
  readonly style: CSSProperties;
  readonly wide: boolean;
};

const snippets: ReadonlyArray<Snippet> = Array.from(
  { length: snippetCount },
  (_, index) => {
    const angle = index * goldenAngle;
    const reach = nearestReach + reachSpread * variation(index, 0);
    const rise = Math.sin(angle) * reach * flattening - upwardLean;
    const fall = shortestFall + fallSpread * variation(index, half);
    const turn = (variation(index, goldenAngle) - half) * mostTurnDegrees;
    const delay =
      burstStartMilliseconds + mostDelayMilliseconds * variation(index, 1);
    return {
      paper: papers[index % papers.length] ?? 'kirsch',
      style: {
        '--dx': `${Math.cos(angle) * reach * percent}cqi`,
        '--dy': `${rise * percent}cqi`,
        '--fall': `${fall * percent}cqi`,
        '--turn': `${turn}deg`,
        animationDelay: `${delay}ms`,
      } as CSSProperties,
      wide: variation(index, goldenRatio) > half,
    };
  },
);

// Offcuts of everyone's wrapping paper that burst out when a gift opens. It
// sits inside the gift, whose width the distances are measured against.
export const PaperSnippets = () => (
  <div
    aria-hidden="true"
    className="gift-snippets pointer-events-none absolute top-1/2 left-1/2 z-20"
  >
    {snippets.map((snippet, index) => (
      <Paper
        className={`gift-snippet ${snippet.wide ? '-mt-[4px] -ml-[8px] h-[9px] w-[16px]' : '-mt-[7px] -ml-[4px] h-[14px] w-[8px]'}`}
        // biome-ignore lint/suspicious/noArrayIndexKey: the snippets are a fixed list that never reorders.
        key={index}
        paper={snippet.paper}
        style={snippet.style}
        tile={0.3}
      />
    ))}
  </div>
);
