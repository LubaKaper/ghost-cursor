import { describe, expect, it } from 'vitest';
import { createRandom } from './random';

describe('createRandom', () => {
  it('repeats exactly for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    for (let i = 0; i < 100; i += 1) expect(a.next()).toBe(b.next());
  });

  it('differs for different seeds', () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next());
  });

  it('stays in [0, 1) with a mean near one half', () => {
    const random = createRandom(7);
    let total = 0;
    for (let i = 0; i < 10_000; i += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
      total += value;
    }
    expect(total / 10_000).toBeCloseTo(0.5, 1);
  });

  it('produces a standard normal', () => {
    const random = createRandom(3);
    const values = Array.from({ length: 20_000 }, () => random.normal());
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
    expect(mean).toBeCloseTo(0, 1);
    expect(variance).toBeCloseTo(1, 1);
  });
});
