// Measures the baselines on the fixed synthetic paths and prints markdown tables for
// docs/RESULTS.md. Run with `npm run report`.
import { test } from 'vitest';
import { createExtrapolator, holdPosition, type Predictor } from '../src/baselines/predictors';
import { createEvaluator } from '../src/metrics/evaluator';
import { PATH_NAMES, syntheticPath } from '../src/synthetic/paths';

const DURATION_S = 60;
const SEED = 1;
const HORIZONS_STEPS = [18, 30];
const VELOCITY_WINDOWS = [2, 4, 8, 12];
const ACCELERATION_WINDOWS = [4, 8, 12, 16];

const candidates: Predictor[] = [
  holdPosition,
  ...VELOCITY_WINDOWS.map((w) =>
    createExtrapolator({
      name: `Constant velocity, ${String(w)} steps`,
      degree: 1,
      historySteps: w,
    }),
  ),
  ...ACCELERATION_WINDOWS.map((w) =>
    createExtrapolator({
      name: `Constant acceleration, ${String(w)} steps`,
      degree: 2,
      historySteps: w,
    }),
  ),
];

function meanErrors(horizonSteps: number): Map<string, number[]> {
  const table = new Map<string, number[]>(candidates.map((c) => [c.name, []]));
  for (const name of PATH_NAMES) {
    const evaluator = createEvaluator({
      predictors: candidates,
      horizonSteps,
      idleAfterMs: 300,
      windowSize: DURATION_S * 60,
    });
    for (const step of syntheticPath({ name, durationS: DURATION_S, seed: SEED })) {
      evaluator.push(step);
    }
    for (const score of evaluator.snapshot().scores) {
      table.get(score.name)?.push(score.meanErrorPx ?? Number.NaN);
    }
  }
  return table;
}

test('baseline report', () => {
  const lines: string[] = [];
  for (const horizonSteps of HORIZONS_STEPS) {
    const ms = Math.round((horizonSteps * 1000) / 60);
    lines.push(`### Horizon ${String(ms)} ms (${String(horizonSteps)} steps)`, '');
    lines.push(`| Predictor | ${PATH_NAMES.join(' | ')} |`);
    lines.push(`| --- | ${PATH_NAMES.map(() => '---:').join(' | ')} |`);
    for (const [name, errors] of meanErrors(horizonSteps)) {
      lines.push(`| ${name} | ${errors.map((e) => e.toFixed(1)).join(' | ')} |`);
    }
    lines.push('');
  }
  console.log(lines.join('\n'));
});
