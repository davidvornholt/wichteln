import { Paper } from '../../../shared/ui/paper';

const sides = ['top', 'right', 'bottom', 'left'] as const;

// The paper around the gift, folded into four flaps that open towards the
// viewer and show the plain inside of the paper as they turn. styles/gift.css
// holds the geometry and the timing.
export const GiftWrapping = () => (
  <>
    {sides.map((side) => (
      <div className="gift-flap" data-side={side} key={side}>
        <Paper className="gift-flap-face" paper="wrap" tile={1.1} />
        <div className="gift-flap-face gift-flap-back" />
      </div>
    ))}
    <svg
      aria-hidden="true"
      className="gift-creases absolute inset-0 size-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <path
        d="M0 0 L100 100 M100 0 L0 100"
        stroke="oklch(1 0 0 / 0.16)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </>
);

// The ribbon around the gift. Its four ends slide off the box when it opens.
export const GiftRibbon = () => (
  <div className="absolute inset-0 overflow-hidden">
    {sides.map((side) => (
      <div className="gift-ribbon" data-side={side} key={side} />
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
