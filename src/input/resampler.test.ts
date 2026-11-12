import { describe, expect, it } from 'vitest';
import { createResampler, DEFAULT_RESAMPLER_OPTIONS, type ResamplerOptions } from './resampler';
import type { PointerSample, ResampledStep } from './types';

const options: ResamplerOptions = {
  stepMs: 10,
  holdAfterMs: 50,
  breakAfterStillMs: 200,
  stillEpsilonPx: 0.5,
};

const sample = (timeMs: number, x: number, y = 0): PointerSample => ({
  timeMs,
  positionPx: { x, y },
});

function pushAll(samples: PointerSample[], resamplerOptions = options): ResampledStep[] {
  const resampler = createResampler(resamplerOptions);
  return samples.flatMap((s) => resampler.push(s));
}

describe('createResampler', () => {
  it('emits one step immediately for the first sample', () => {
    const steps = pushAll([sample(100, 5, 7)]);
    expect(steps).toEqual([{ timeMs: 100, positionPx: { x: 5, y: 7 }, segment: 0, stillForMs: 0 }]);
  });

  it('interpolates uneven samples onto an even grid', () => {
    // Constant speed of 1 px per ms, sampled at irregular times.
    const steps = pushAll([sample(0, 0), sample(7, 7), sample(23, 23), sample(41, 41)]);
    expect(steps.map((s) => s.timeMs)).toEqual([0, 10, 20, 30, 40]);
    for (const step of steps) expect(step.positionPx.x).toBeCloseTo(step.timeMs, 10);
  });

  it('interpolates both axes', () => {
    const steps = pushAll([sample(0, 0, 0), sample(20, 20, -40)]);
    expect(steps[1]?.positionPx).toEqual({ x: 10, y: -20 });
  });

  it('does not drift over long runs', () => {
    const stepMs = 1000 / 60;
    const resampler = createResampler({ ...options, stepMs });
    const steps: ResampledStep[] = [];
    for (let t = 0; t <= 100_000; t += 7) steps.push(...resampler.push(sample(t, t)));
    // The last raw sample is at 99995 ms, so the last step is index 5999 at 99983.3 ms.
    expect(steps).toHaveLength(6000);
    for (let i = 1; i < steps.length; i += 1) {
      const gap = (steps[i]?.timeMs ?? 0) - (steps[i - 1]?.timeMs ?? 0);
      expect(gap).toBeCloseTo(stepMs, 9);
    }
    expect(steps.at(-1)?.positionPx.x).toBeCloseTo(5999 * stepMs, 6);
  });

  it('holds position across a long gap instead of gliding', () => {
    // 80 ms apart is more than holdAfterMs, so the pointer was resting at x = 0.
    const steps = pushAll([sample(0, 0), sample(80, 100)]);
    expect(steps.map((s) => s.positionPx.x)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 100]);
  });

  it('ignores duplicate and out-of-order timestamps', () => {
    const steps = pushAll([sample(0, 0), sample(20, 20), sample(20, 999), sample(15, 999)]);
    expect(steps.map((s) => s.positionPx.x)).toEqual([0, 10, 20]);
  });

  it('ignores non-finite samples', () => {
    const steps = pushAll([sample(0, Number.NaN), sample(0, 1), sample(Infinity, 2)]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.positionPx.x).toBe(1);
  });

  it('counts how long the pointer has been still', () => {
    const steps = pushAll([sample(0, 0), sample(20, 20), sample(40, 20), sample(60, 20.2)]);
    expect(steps.map((s) => s.stillForMs)).toEqual([0, 0, 0, 10, 20, 30, 40]);
  });

  it('emits held steps while resting, but only after holdAfterMs', () => {
    const resampler = createResampler(options);
    resampler.push(sample(0, 3));
    expect(resampler.advanceTo(50)).toEqual([]);
    const held = resampler.advanceTo(80);
    expect(held.map((s) => s.timeMs)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
    expect(held.every((s) => s.positionPx.x === 3)).toBe(true);
    expect(held.at(-1)?.stillForMs).toBe(80);
  });

  it('continues the grid after held steps when movement resumes', () => {
    const resampler = createResampler(options);
    resampler.push(sample(0, 0));
    resampler.advanceTo(75);
    const steps = resampler.push(sample(95, 50));
    expect(steps.map((s) => [s.timeMs, s.positionPx.x])).toEqual([
      [80, 0],
      [90, 0],
    ]);
    expect(resampler.push(sample(105, 60)).map((s) => s.positionPx.x)).toEqual([55]);
  });

  it('ends the segment after being still too long', () => {
    const resampler = createResampler(options);
    resampler.push(sample(0, 0));
    const held = resampler.advanceTo(1000);
    expect(held.at(-1)?.timeMs).toBe(200);
    expect(held.at(-1)?.stillForMs).toBe(200);
    expect(resampler.advanceTo(2000)).toEqual([]);
    const next = resampler.push(sample(2000, 9));
    expect(next).toEqual([{ timeMs: 2000, positionPx: { x: 9, y: 0 }, segment: 1, stillForMs: 0 }]);
  });

  it('ends the segment on a long gap even without frame updates', () => {
    const steps = pushAll([sample(0, 0), sample(500, 40)]);
    const lastOfFirst = steps.filter((s) => s.segment === 0).at(-1);
    expect(lastOfFirst?.timeMs).toBe(200);
    expect(steps.at(-1)).toEqual({
      timeMs: 500,
      positionPx: { x: 40, y: 0 },
      segment: 1,
      stillForMs: 0,
    });
  });

  it('starts a new segment and grid after an explicit break', () => {
    const resampler = createResampler(options);
    resampler.push(sample(0, 0));
    resampler.push(sample(20, 20));
    resampler.breakSegment();
    expect(resampler.advanceTo(500)).toEqual([]);
    const steps = [...resampler.push(sample(503, 7)), ...resampler.push(sample(516, 20))];
    expect(steps.map((s) => [s.timeMs, s.segment])).toEqual([
      [503, 1],
      [513, 1],
    ]);
    expect(steps[1]?.positionPx.x).toBeCloseTo(17, 10);
  });

  it('holds long enough for a 500 ms horizon by default', () => {
    expect(DEFAULT_RESAMPLER_OPTIONS.breakAfterStillMs).toBeGreaterThan(500);
  });
});
