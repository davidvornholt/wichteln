type ControlPoints = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
};

const bezier = ({ x1, y1, x2, y2 }: ControlPoints) => [x1, y1, x2, y2] as const;

// Slow to start, fast through the middle, gentle at the end: paper being
// pulled open or unrolled.
export const unrollCurve = bezier({ x1: 0.7, y1: 0, x2: 0.2, y2: 1 });

// Starts quickly and settles softly into place.
export const settleCurve = bezier({ x1: 0.2, y1: 0.9, x2: 0.25, y2: 1 });

// Gathers speed as it leaves.
export const leaveCurve = bezier({ x1: 0.5, y1: 0, x2: 0.75, y2: 0 });
