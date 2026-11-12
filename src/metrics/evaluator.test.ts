import { describe, expect, it } from 'vitest';
import { createBaselines, holdPosition, type Predictor } from '../baselines/predictors';
import type { ResampledStep, Vec2 } from '../input/types';
import { createEvaluator, type EvaluatorOptions } from './evaluator';

const STEP_MS = 1000 / 60;

const step = (index: number, positionPx: Vec2, overrides: Partial<ResampledStep> = {}) => ({
  timeMs: index * STEP_MS,
  positionPx,
  segment: 0,
  stillForMs: 0,
  ...overrides,
});

const baseOptions = (predictors: readonly Predictor[]): EvaluatorOptions => ({
  predictors,
  horizonSteps: 5,
  idleAfterMs: 300,
  windowSize: 1000,
});

// Moves right at a constant 2 px per step.
const line = (count: number): ResampledStep[] =>
  Array.from({ length: count }, (_, i) => step(i, { x: 2 * i, y: 0 }));

describe('createEvaluator', () => {
  it('scores nothing until the horizon has passed', () => {
    const evaluator = createEvaluator(baseOptions([holdPosition]));
    line(5).forEach((s) => {
      evaluator.push(s);
    });
    expect(evaluator.snapshot().scoredCount).toBe(0);
    evaluator.push(step(5, { x: 10, y: 0 }));
    expect(evaluator.snapshot().scoredCount).toBe(1);
  });

  it('measures hold error as the distance travelled over the horizon', () => {
    const evaluator = createEvaluator(baseOptions([holdPosition]));
    line(40).forEach((s) => {
      evaluator.push(s);
    });
    // 5 steps at 2 px per step.
    expect(evaluator.snapshot().scores[0]?.meanErrorPx).toBeCloseTo(10, 9);
  });

  it('gives constant velocity zero error on a straight line', () => {
    const baselines = createBaselines({ velocityWindowSteps: 4, accelerationWindowSteps: 6 });
    const evaluator = createEvaluator(baseOptions(baselines));
    line(40).forEach((s) => {
      evaluator.push(s);
    });
    const { scores, scoredCount } = evaluator.snapshot();
    expect(scores.map((s) => s.name)).toEqual([
      'Hold position',
      'Constant velocity',
      'Constant acceleration',
    ]);
    expect(scores[1]?.meanErrorPx).toBeCloseTo(0, 9);
    expect(scores[2]?.meanErrorPx).toBeCloseTo(0, 9);
    // Guesses start once the longest window (6) is full: steps 5..34 are scored by step 39.
    expect(scoredCount).toBe(30);
  });

  it('never scores a guess against a different segment', () => {
    const evaluator = createEvaluator(baseOptions([holdPosition]));
    line(4).forEach((s) => {
      evaluator.push(s);
    });
    // A break: the next steps are far away in a new segment.
    for (let i = 0; i < 4; i += 1)
      evaluator.push(step(10 + i, { x: 1000, y: 1000 }, { segment: 1 }));
    expect(evaluator.snapshot().scoredCount).toBe(0);
  });

  it('does not guess from idle input, but scores guesses whose future is a stop', () => {
    const evaluator = createEvaluator(baseOptions([holdPosition]));
    // One moving step, then the pointer stops for good.
    evaluator.push(step(0, { x: 0, y: 0 }));
    for (let i = 1; i <= 40; i += 1) {
      evaluator.push(step(i, { x: 2, y: 0 }, { stillForMs: (i - 1) * STEP_MS }));
    }
    const stillLimit = Math.floor(300 / STEP_MS) + 1;
    // Guesses are made at steps 0..stillLimit (stillForMs <= 300 ms), all scored by step 40.
    expect(evaluator.snapshot().scoredCount).toBe(stillLimit + 1);
    // Only the guess made at step 0 missed (by 2 px); the rest guessed "stay" correctly.
    expect(evaluator.snapshot().scores[0]?.meanErrorPx).toBeCloseTo(2 / (stillLimit + 1), 9);
  });

  it('keeps only the newest guesses in the rolling window', () => {
    const evaluator = createEvaluator({ ...baseOptions([holdPosition]), windowSize: 3 });
    line(40).forEach((s) => {
      evaluator.push(s);
    });
    expect(evaluator.snapshot().scoredCount).toBe(3);
  });

  it('starts over after reset', () => {
    const evaluator = createEvaluator(baseOptions([holdPosition]));
    line(20).forEach((s) => {
      evaluator.push(s);
    });
    evaluator.reset();
    expect(evaluator.snapshot()).toEqual({
      scores: [{ name: 'Hold position', meanErrorPx: null }],
      scoredCount: 0,
    });
  });
});
