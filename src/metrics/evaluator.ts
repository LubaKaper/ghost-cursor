import type { Predictor } from '../baselines/predictors';
import type { ResampledStep, Vec2 } from '../input/types';
import { createRollingMean, type RollingMean } from './rollingMean';

export type EvaluatorOptions = {
  predictors: readonly Predictor[];
  // 30 steps at 60 Hz is the 500 ms horizon.
  horizonSteps: number;
  // A pointer still for longer than this is idle; we do not predict from idle input.
  idleAfterMs: number;
  // How many scored guesses the rolling error covers.
  windowSize: number;
};

export type PredictorScore = {
  name: string;
  // Average distance in CSS pixels between the guess and where the pointer really was.
  meanErrorPx: number | null;
};

export type EvaluationSnapshot = {
  scores: PredictorScore[];
  // Guesses scored inside the current window, the same for every predictor.
  scoredCount: number;
};

export type Evaluator = {
  push(step: ResampledStep): void;
  snapshot(): EvaluationSnapshot;
  reset(): void;
};

type PendingGuess = {
  stepsLeft: number;
  guessesPx: Vec2[];
};

// Makes a guess from every predictor at each step and scores it once the horizon has passed.
// All predictors are scored on exactly the same moments, so their numbers are comparable.
// A guess whose future is cut off by a break (pointer left, tab hidden) is dropped unscored.
export function createEvaluator(options: EvaluatorOptions): Evaluator {
  const historySteps = Math.max(1, ...options.predictors.map((p) => p.historySteps));
  const errors: RollingMean[] = options.predictors.map(() =>
    createRollingMean({ capacity: options.windowSize }),
  );
  let segment: number | null = null;
  let historyPx: Vec2[] = [];
  let pending: PendingGuess[] = [];

  const score = (guess: PendingGuess, actualPx: Vec2): void => {
    guess.guessesPx.forEach((guessPx, i) => {
      errors[i]?.add(Math.hypot(guessPx.x - actualPx.x, guessPx.y - actualPx.y));
    });
  };

  const guessFrom = (nowPx: Vec2): PendingGuess => ({
    stepsLeft: options.horizonSteps,
    guessesPx: options.predictors.map((predictor) => {
      const displacement = predictor.predictDisplacementPx(
        historyPx.slice(-predictor.historySteps),
        options.horizonSteps,
      );
      return { x: nowPx.x + displacement.x, y: nowPx.y + displacement.y };
    }),
  });

  const push = (step: ResampledStep): void => {
    if (step.segment !== segment) {
      segment = step.segment;
      historyPx = [];
      pending = [];
    }
    historyPx.push(step.positionPx);
    if (historyPx.length > historySteps) historyPx.shift();

    // Labels arrive late: a guess is only scored once its future has actually happened.
    for (const guess of pending) guess.stepsLeft -= 1;
    while (pending[0] && pending[0].stepsLeft <= 0) {
      const due = pending.shift();
      if (due) score(due, step.positionPx);
    }

    if (historyPx.length < historySteps) return;
    if (step.stillForMs > options.idleAfterMs) return;
    pending.push(guessFrom(step.positionPx));
  };

  return {
    push,
    snapshot: () => ({
      scores: options.predictors.map((predictor, i) => ({
        name: predictor.name,
        meanErrorPx: errors[i]?.mean() ?? null,
      })),
      scoredCount: errors[0]?.count() ?? 0,
    }),
    reset() {
      segment = null;
      historyPx = [];
      pending = [];
      for (const error of errors) error.clear();
    },
  };
}
