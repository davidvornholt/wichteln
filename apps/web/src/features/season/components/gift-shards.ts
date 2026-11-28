// How the wrapping paper breaks when the gift bursts: into shards around the
// knot at the centre, like glass hit from behind. Coordinates are percent of
// the gift's side. The cracks between the shards light up first, and the
// paper then breaks along them.

export type Point = readonly [number, number];

export type Shard = {
  readonly points: ReadonlyArray<Point>;
  // The shard's bounding box, so each shard is only as large as it needs to
  // be when the browser draws it.
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  // How far from the knot the shard sits, from 0 at the knot to 1 at the
  // farthest corner.
  readonly reach: number;
  // The direction the shard flies in, a unit vector away from the knot.
  readonly direction: Point;
  readonly index: number;
};

export type Crack = {
  // The crack runs from the end nearer the knot to the farther one.
  readonly from: Point;
  readonly to: Point;
  // How far from the knot the crack starts, from 0 to 1.
  readonly reach: number;
};

const side = 100;
const half = 50;
const pointsAlongSide = 3;
const third = side / pointsAlongSide;
const knotWobble = 3;
const edgeWobble = 7;
const innerRadius = 21;
const innerWobble = 6;
const goldenRatio = 1.618_034;
const centred = 0.5;
const farthest = Math.hypot(half, half);
const onEdge = 0.001;

const fraction = (value: number) => value - Math.floor(value);

// A value from -1 to 1 that changes from one call to the next without
// looking arranged. The points below take their values in a fixed order, so
// every gift breaks the same way.
let wobbles = 0;
const wobble = () => {
  wobbles += 1;
  return (fraction(wobbles * goldenRatio) - centred) * 2;
};

const knot: Point = [
  half + wobble() * knotWobble,
  half + wobble() * knotWobble,
];

// The edge of the gift, clockwise from the top left corner: each corner and
// two points on each side between them.
const outline: ReadonlyArray<Point> = (() => {
  const near = () => third + wobble() * edgeWobble;
  const far = () => side - third + wobble() * edgeWobble;
  return [
    [0, 0],
    [near(), 0],
    [far(), 0],
    [side, 0],
    [side, near()],
    [side, far()],
    [side, side],
    [side - near(), side],
    [side - far(), side],
    [0, side],
    [0, side - near()],
    [0, side - far()],
  ];
})();

const outlineCount = outline.length;
const ringCount = outlineCount / 2;

const at = <T>(list: ReadonlyArray<T>, index: number): T => {
  const item = list[((index % list.length) + list.length) % list.length];
  if (item === undefined) {
    throw new Error('A gift shard refers to a point that does not exist.');
  }
  return item;
};

// A ring of points around the knot, each one facing every other point of the
// outline, so the shards between the ring and the edge stay well shaped.
const ring: ReadonlyArray<Point> = Array.from(
  { length: ringCount },
  (_, index) => {
    const [x, y] = at(outline, index * 2 + 1);
    const angle = Math.atan2(y - knot[1], x - knot[0]);
    const radius = innerRadius + wobble() * innerWobble;
    return [
      knot[0] + Math.cos(angle) * radius,
      knot[1] + Math.sin(angle) * radius,
    ];
  },
);

const triangles: ReadonlyArray<ReadonlyArray<Point>> = Array.from(
  { length: ringCount },
  (_, index) => {
    const inner = at(ring, index);
    const next = at(ring, index + 1);
    const first = at(outline, index * 2);
    const middle = at(outline, index * 2 + 1);
    const last = at(outline, index * 2 + 2);
    return [
      [knot, inner, next],
      [inner, first, middle],
      [inner, middle, last],
      [inner, last, next],
    ];
  },
).flat();

const centroid = (points: ReadonlyArray<Point>): Point => [
  points.reduce((sum, [x]) => sum + x, 0) / points.length,
  points.reduce((sum, [, y]) => sum + y, 0) / points.length,
];

const distanceToKnot = ([x, y]: Point) => Math.hypot(x - knot[0], y - knot[1]);

export const shards: ReadonlyArray<Shard> = triangles.map((points, index) => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const middle = centroid(points);
  const length = distanceToKnot(middle);
  return {
    points,
    left,
    top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
    reach: length / farthest,
    direction: [(middle[0] - knot[0]) / length, (middle[1] - knot[1]) / length],
    index,
  };
});

const onOutline = ([x, y]: Point) =>
  x < onEdge || y < onEdge || x > side - onEdge || y > side - onEdge;

const sameEdge = (a: Point, b: Point) =>
  (Math.abs(a[0] - b[0]) < onEdge && (a[0] < onEdge || a[0] > side - onEdge)) ||
  (Math.abs(a[1] - b[1]) < onEdge && (a[1] < onEdge || a[1] > side - onEdge));

const keyDigits = 3;
const key = ([x, y]: Point) =>
  `${x.toFixed(keyDigits)},${y.toFixed(keyDigits)}`;

// Every edge that two shards share, once. The gift's own edge never cracks.
export const cracks: ReadonlyArray<Crack> = (() => {
  const seen = new Map<string, Crack>();
  for (const points of triangles) {
    for (const [index, start] of points.entries()) {
      const end = at(points, index + 1);
      const inside = !(
        onOutline(start) &&
        onOutline(end) &&
        sameEdge(start, end)
      );
      const [from, to] =
        distanceToKnot(start) <= distanceToKnot(end)
          ? [start, end]
          : [end, start];
      const name = `${key(from)}-${key(to)}`;
      if (inside && !seen.has(name)) {
        seen.set(name, { from, to, reach: distanceToKnot(from) / farthest });
      }
    }
  }
  return [...seen.values()];
})();

// A polygon for CSS clip-path, in percent of the shard's own box. Mirrored, it
// draws the back of the shard, which is turned half a turn around its middle.
export const shardPolygon = (shard: Shard, mirrored = false) =>
  `polygon(${shard.points
    .map(([x, y]) => {
      const across = ((x - shard.left) / shard.width) * side;
      const down = ((y - shard.top) / shard.height) * side;
      return `${(mirrored ? side - across : across).toFixed(2)}% ${down.toFixed(2)}%`;
    })
    .join(', ')})`;

export const knotPoint = knot;
