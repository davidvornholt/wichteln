import { describe, expect, it } from 'bun:test';
import { cracks, type Point, shardPolygon, shards } from './gift-shards';

const threeCorners = /^polygon\((?:[\d.]+% [\d.]+%, ){2}[\d.]+% [\d.]+%\)$/u;
// The first number of each corner, the distance across the shard's box.
const across = /[\d.]+(?=% )/gu;

const signedArea = (points: ReadonlyArray<Point>) =>
  points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length] ?? [x, y];
    return sum + (x * nextY - nextX * y) / 2;
  }, 0);

describe('the shards of the wrapping paper', () => {
  it('cover the whole gift without overlapping', () => {
    const areas = shards.map((shard) => signedArea(shard.points));
    // All turn the same way, so none is folded over another, and together
    // they are exactly as large as the gift.
    expect(areas.every((area) => area > 0)).toBe(true);
    expect(areas.reduce((sum, area) => sum + area, 0)).toBeCloseTo(10_000, 6);
  });

  it('each fit their own box and fly away from the knot', () => {
    for (const shard of shards) {
      for (const [x, y] of shard.points) {
        expect(x).toBeGreaterThanOrEqual(shard.left);
        expect(x).toBeLessThanOrEqual(shard.left + shard.width);
        expect(y).toBeGreaterThanOrEqual(shard.top);
        expect(y).toBeLessThanOrEqual(shard.top + shard.height);
      }
      expect(Math.hypot(...shard.direction)).toBeCloseTo(1, 9);
      expect(shard.reach).toBeGreaterThan(0);
      expect(shard.reach).toBeLessThanOrEqual(1);
    }
  });

  it('are drawn as polygons in their own box, mirrored for the back', () => {
    const [first] = shards;
    if (first === undefined) {
      throw new Error('The paper has no shards.');
    }
    expect(shardPolygon(first)).toMatch(threeCorners);
    const front = shardPolygon(first).match(across) ?? [];
    const back = shardPolygon(first, true).match(across) ?? [];
    expect(back.map(Number)).toEqual(
      front.map((x) => Number((100 - Number(x)).toFixed(2))),
    );
  });
});

describe('the cracks between the shards', () => {
  it('run along every inner edge once, and never along the edge of the gift', () => {
    // 24 triangles have 72 sides. The 12 on the gift's edge belong to one
    // triangle each, and the other 60 are shared by two.
    expect(shards).toHaveLength(24);
    expect(cracks).toHaveLength(30);
    for (const crack of cracks) {
      const onOneEdge =
        (crack.from[0] === crack.to[0] && [0, 100].includes(crack.from[0])) ||
        (crack.from[1] === crack.to[1] && [0, 100].includes(crack.from[1]));
      expect(onOneEdge).toBe(false);
    }
  });

  it('start at their end nearer the knot', () => {
    const nearest = Math.min(...cracks.map((crack) => crack.reach));
    expect(nearest).toBe(0);
    for (const crack of cracks) {
      expect(crack.reach).toBeGreaterThanOrEqual(0);
      expect(crack.reach).toBeLessThan(1);
    }
  });
});
