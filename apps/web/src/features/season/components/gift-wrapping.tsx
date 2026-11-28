import type { CSSProperties } from 'react';
import { Paper } from '../../../shared/ui/paper';
import { cracks, type Shard, shardPolygon, shards } from './gift-shards';

const percent = 100;

// The dark paper with the ribbon tied around it, as large as the gift.
const Print = ({ style }: { readonly style?: CSSProperties }) => (
  <Paper className="gift-print" paper="wrap" style={style} tile={1.1}>
    <div className="gift-ribbon" data-axis="down" />
    <div className="gift-ribbon" data-axis="across" />
  </Paper>
);

// The paper as it is while the gift is whole. Its cracks light up while the
// gift charges, in the colour of the paper inside.
export const GiftSurface = () => (
  <div className="gift-surface">
    <Print />
    {(['glow', 'core'] as const).map((layer) => (
      <svg
        aria-hidden="true"
        className="gift-cracks"
        data-layer={layer}
        key={layer}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {cracks.map((crack) => (
          <line
            key={`${crack.from.join()}-${crack.to.join()}`}
            pathLength={1}
            // biome-ignore lint/nursery/noInlineStyles: Each crack lights up as far from the knot as it starts, which is data.
            style={{ '--reach': crack.reach } as CSSProperties}
            x1={crack.from[0]}
            x2={crack.to[0]}
            y1={crack.from[1]}
            y2={crack.to[1]}
          />
        ))}
      </svg>
    ))}
  </div>
);

// Where a shard flies, how it tumbles, and when it leaves. The shards nearest
// the knot leave first and fastest, towards the viewer.
const nearest = 0.5;
const slowest = 52;
const fastest = 96;
const lift = 26;
const shortestFall = 40;
const fallSpread = 40;
const nearestDepth = 440;
const farthestDepth = 160;
const mostTumble = 520;
const leastTumble = 160;
const mostTwist = 220;
const latestStart = 70;
const shortestFlight = 1050;
const flightSpread = 350;
const goldenRatio = 1.618_034;

const drawsPerShard = 8;

const fraction = (value: number) => value - Math.floor(value);

// Values from 0 to 1 for one shard, a new one on each call. Successive
// multiples of the golden ratio never line up, so neighbouring shards fly
// differently without looking arranged.
const variety = (shard: Shard) => {
  let drawn = 0;
  return () => {
    drawn += 1;
    return fraction((shard.index * drawsPerShard + drawn) * goldenRatio);
  };
};

const flight = (shard: Shard): CSSProperties => {
  const next = variety(shard);
  const either = () => (next() < nearest ? -1 : 1);
  const closeness = 1 - shard.reach;
  const distance =
    slowest + (fastest - slowest) * (closeness * nearest + next() * nearest);
  const tumble = leastTumble + (mostTumble - leastTumble) * next();
  const twist = (next() - nearest) * 2 * mostTwist;
  return {
    left: `${shard.left}%`,
    top: `${shard.top}%`,
    width: `${shard.width}%`,
    height: `${shard.height}%`,
    '--tx': `${shard.direction[0] * distance}cqi`,
    '--ty': `${shard.direction[1] * distance - lift * closeness}cqi`,
    '--tz': `${farthestDepth + (nearestDepth - farthestDepth) * closeness}px`,
    '--fall': `${shortestFall + fallSpread * next()}cqi`,
    '--rx': `${either() * tumble}deg`,
    '--ry': `${either() * tumble * nearest}deg`,
    '--rz': `${twist}deg`,
    '--delay': `${Math.round(latestStart * shard.reach)}ms`,
    '--fly': `${Math.round(shortestFlight + flightSpread * next())}ms`,
    '--front-clip': shardPolygon(shard),
    '--back-clip': shardPolygon(shard, true),
  } as CSSProperties;
};

// Inside a shard, the print sits where it sits on the whole gift, so the
// pattern and the ribbon line up across the cracks.
const printIn = (shard: Shard): CSSProperties => ({
  left: `${(-shard.left / shard.width) * percent}%`,
  top: `${(-shard.top / shard.height) * percent}%`,
  width: `${(percent / shard.width) * percent}%`,
  height: `${(percent / shard.height) * percent}%`,
});

const flights = shards.map((shard) => ({
  shard,
  style: flight(shard),
  print: printIn(shard),
}));

// The paper broken along its cracks. It takes the whole paper's place the
// moment the gift bursts, and every shard flies off, tumbling, its plain back
// showing as it turns.
export const GiftShards = () => (
  <div className="gift-shards">
    {flights.map(({ shard, style, print }) => (
      <div
        className="gift-shard"
        key={shard.index}
        // biome-ignore lint/nursery/noInlineStyles: Each shard's outline and flight path are geometry, not design tokens.
        style={style}
      >
        <div className="gift-shard-face">
          <Print style={print} />
        </div>
        <div className="gift-shard-face gift-shard-back" />
      </div>
    ))}
  </div>
);

// The bow where the ribbon crosses, drawn as two folded triangles around a
// knot in the colour of the person's paper.
export const GiftBow = () => (
  <svg aria-hidden="true" className="gift-bow" viewBox="0 0 120 68">
    <path d="M0 4 L58 34 L0 64 Z" fill="var(--color-card)" />
    <path d="M120 4 L62 34 L120 64 Z" fill="var(--color-card)" />
    <path d="M34 22 L58 34 L34 46 Z" fill="var(--color-line)" />
    <path d="M86 22 L62 34 L86 46 Z" fill="var(--color-line)" />
    <rect fill="var(--color-accent)" height="26" width="22" x="49" y="21" />
  </svg>
);
