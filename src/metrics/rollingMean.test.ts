import { describe, expect, it } from 'vitest';
import { createRollingMean } from './rollingMean';

describe('createRollingMean', () => {
  it('is empty at first', () => {
    const mean = createRollingMean({ capacity: 3 });
    expect(mean.mean()).toBeNull();
    expect(mean.count()).toBe(0);
  });

  it('averages values until full', () => {
    const mean = createRollingMean({ capacity: 3 });
    mean.add(2);
    mean.add(4);
    expect(mean.mean()).toBe(3);
    expect(mean.count()).toBe(2);
  });

  it('forgets the oldest value once full', () => {
    const mean = createRollingMean({ capacity: 3 });
    [1, 2, 3, 10].forEach((v) => {
      mean.add(v);
    });
    expect(mean.mean()).toBe(5);
    expect(mean.count()).toBe(3);
  });

  it('stays accurate over many laps', () => {
    const mean = createRollingMean({ capacity: 7 });
    for (let i = 0; i < 100_000; i += 1) mean.add(i % 2 === 0 ? 1e9 : 0.1);
    for (let i = 0; i < 7; i += 1) mean.add(0.5);
    expect(mean.mean()).toBeCloseTo(0.5, 6);
  });

  it('ignores non-finite values', () => {
    const mean = createRollingMean({ capacity: 2 });
    mean.add(Number.NaN);
    mean.add(Infinity);
    expect(mean.count()).toBe(0);
  });

  it('clears', () => {
    const mean = createRollingMean({ capacity: 2 });
    mean.add(5);
    mean.clear();
    expect(mean.mean()).toBeNull();
    mean.add(1);
    expect(mean.mean()).toBe(1);
  });

  it('rejects a bad capacity', () => {
    expect(() => createRollingMean({ capacity: 0 })).toThrow();
  });
});
