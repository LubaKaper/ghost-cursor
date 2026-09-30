import { describe, expect, it } from 'vitest';
import type { ResampledStep } from '../input/types';
import { appendToTrail, trailLines } from './trail';

const step = (timeMs: number, x: number, segment = 0): ResampledStep => ({
  timeMs,
  positionPx: { x, y: 0 },
  segment,
  stillForMs: 0,
});

describe('appendToTrail', () => {
  it('keeps only the newest steps', () => {
    const trail = appendToTrail([step(0, 0), step(1, 1)], [step(2, 2), step(3, 3)], 3);
    expect(trail.map((s) => s.timeMs)).toEqual([1, 2, 3]);
  });

  it('does not change the input trail', () => {
    const original = [step(0, 0)];
    appendToTrail(original, [step(1, 1)]);
    expect(original).toHaveLength(1);
  });
});

describe('trailLines', () => {
  it('joins consecutive steps and fades older pieces', () => {
    const lines = trailLines([step(0, 0), step(1, 1), step(2, 2)]);
    expect(lines.map((l) => l.age)).toEqual([0.5, 1]);
    expect(lines[0]?.from.x).toBe(0);
    expect(lines[1]?.to.x).toBe(2);
  });

  it('never joins across a break', () => {
    const lines = trailLines([step(0, 0, 0), step(1, 100, 1), step(2, 101, 1)]);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.from.x).toBe(100);
  });

  it('draws nothing for fewer than two steps', () => {
    expect(trailLines([])).toEqual([]);
    expect(trailLines([step(0, 0)])).toEqual([]);
  });
});
