import { describe, expect, it } from 'vitest';
import { applyWeights, polyfitWeights } from './polyfit';

// Samples f at t = -(n-1) .. 0, oldest first, matching the fit's time axis.
const sampled = (n: number, f: (t: number) => number): number[] =>
  Array.from({ length: n }, (_, i) => f(i - (n - 1)));

describe('polyfitWeights', () => {
  it('recovers a line exactly', () => {
    const weights = polyfitWeights({ pointCount: 8, degree: 1 });
    const values = sampled(8, (t) => 5 + 3 * t);
    expect(applyWeights(weights[0] ?? [], values)).toBeCloseTo(5, 10);
    expect(applyWeights(weights[1] ?? [], values)).toBeCloseTo(3, 10);
  });

  it('recovers a parabola exactly', () => {
    const weights = polyfitWeights({ pointCount: 8, degree: 2 });
    const values = sampled(8, (t) => -2 + 0.5 * t + 0.25 * t * t);
    expect(applyWeights(weights[0] ?? [], values)).toBeCloseTo(-2, 10);
    expect(applyWeights(weights[1] ?? [], values)).toBeCloseTo(0.5, 10);
    expect(applyWeights(weights[2] ?? [], values)).toBeCloseTo(0.25, 10);
  });

  it('matches the textbook slope for a two-point line', () => {
    // With two points the fitted slope is just the last difference.
    const weights = polyfitWeights({ pointCount: 2, degree: 1 });
    expect(weights[1]).toEqual([-1, 1]);
  });

  it('averages out noise better than the last difference', () => {
    // Alternating +-1 jitter on a flat line: the last difference sees a slope of 2,
    // the 8-point fit sees almost none.
    const weights = polyfitWeights({ pointCount: 8, degree: 1 });
    const values = sampled(8, (t) => (t % 2 === 0 ? 1 : -1));
    expect(Math.abs(applyWeights(weights[1] ?? [], values))).toBeLessThan(0.3);
  });

  it('rejects too few points', () => {
    expect(() => polyfitWeights({ pointCount: 2, degree: 2 })).toThrow();
    expect(() => polyfitWeights({ pointCount: 1.5, degree: 1 })).toThrow();
  });
});

describe('applyWeights', () => {
  it('rejects mismatched lengths', () => {
    expect(() => applyWeights([1, 2], [1])).toThrow();
  });
});
