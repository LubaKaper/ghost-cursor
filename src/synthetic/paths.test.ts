import { describe, expect, it } from 'vitest';
import { PATH_NAMES, syntheticPath } from './paths';

const speedsPxPerS = (name: (typeof PATH_NAMES)[number]): number[] => {
  const steps = syntheticPath({ name, durationS: 10, seed: 1 });
  return steps.slice(1).map((s, i) => {
    const prev = steps[i];
    if (!prev) return 0;
    return Math.hypot(s.positionPx.x - prev.positionPx.x, s.positionPx.y - prev.positionPx.y) * 60;
  });
};

describe('syntheticPath', () => {
  it.each(PATH_NAMES)('%s has one step per 1/60 s in one segment', (name) => {
    const steps = syntheticPath({ name, durationS: 2, seed: 1 });
    expect(steps).toHaveLength(120);
    expect(steps.every((s) => s.segment === 0)).toBe(true);
    expect(steps[1]?.timeMs).toBeCloseTo(1000 / 60, 9);
  });

  it('circle moves at about 628 px/s', () => {
    const speeds = speedsPxPerS('circle');
    const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    expect(mean).toBeGreaterThan(620);
    expect(mean).toBeLessThan(640);
  });

  it.each(PATH_NAMES)('%s lands on whole pixels', (name) => {
    const steps = syntheticPath({ name, durationS: 1, seed: 1 });
    for (const s of steps) {
      expect(Number.isInteger(s.positionPx.x)).toBe(true);
      expect(Number.isInteger(s.positionPx.y)).toBe(true);
    }
  });

  it('zigzag moves at about 600 px/s', () => {
    const speeds = speedsPxPerS('zigzag');
    const median = [...speeds].sort((a, b) => a - b)[Math.floor(speeds.length / 2)] ?? 0;
    expect(median).toBeGreaterThan(590);
    expect(median).toBeLessThan(610);
  });

  it('random walk is reproducible from its seed and differs between seeds', () => {
    const a = syntheticPath({ name: 'random walk', durationS: 1, seed: 5 });
    const b = syntheticPath({ name: 'random walk', durationS: 1, seed: 5 });
    const c = syntheticPath({ name: 'random walk', durationS: 1, seed: 6 });
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});
