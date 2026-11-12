import type { Vec2 } from '../input/types';
import { applyWeights, polyfitWeights, type FitDegree } from './polyfit';

// A predictor looks at the last few positions and guesses how far the pointer will move
// over the horizon. It returns a displacement from the current position, not a screen point,
// so it works the same anywhere on the page.
export type Predictor = {
  readonly name: string;
  // How many recent steps it needs, including "now".
  readonly historySteps: number;
  // historyPx is oldest first and exactly historySteps long; the last entry is "now".
  predictDisplacementPx(historyPx: readonly Vec2[], horizonSteps: number): Vec2;
};

export const holdPosition: Predictor = {
  name: 'Hold position',
  historySteps: 1,
  predictDisplacementPx: () => ({ x: 0, y: 0 }),
};

// Fits a polynomial to the recent path and follows it forward. Degree 1 keeps the current
// velocity; degree 2 also keeps the current acceleration (speeding up, slowing down, turning).
// A longer window averages out more jitter but reacts later to changes, so the window size
// is measured per baseline (see docs/RESULTS.md) instead of guessed.
export function createExtrapolator(options: {
  name: string;
  degree: FitDegree;
  historySteps: number;
}): Predictor {
  const weights = polyfitWeights({ pointCount: options.historySteps, degree: options.degree });
  const [, velocityWeights = [], accelerationWeights = []] = weights;

  const displacementAlong = (values: readonly number[], horizonSteps: number): number => {
    // p(H) - p(0) = c1 H + c2 H^2. Measured from the fitted "now", not the raw last point,
    // so one jittery sample does not shift the whole guess.
    const velocity = applyWeights(velocityWeights, values);
    const acceleration = options.degree === 2 ? applyWeights(accelerationWeights, values) : 0;
    return velocity * horizonSteps + acceleration * horizonSteps * horizonSteps;
  };

  return {
    name: options.name,
    historySteps: options.historySteps,
    predictDisplacementPx: (historyPx, horizonSteps) => ({
      x: displacementAlong(
        historyPx.map((p) => p.x),
        horizonSteps,
      ),
      y: displacementAlong(
        historyPx.map((p) => p.y),
        horizonSteps,
      ),
    }),
  };
}

export type BaselineOptions = {
  velocityWindowSteps: number;
  accelerationWindowSteps: number;
};

export function createBaselines(options: BaselineOptions): Predictor[] {
  return [
    holdPosition,
    createExtrapolator({
      name: 'Constant velocity',
      degree: 1,
      historySteps: options.velocityWindowSteps,
    }),
    createExtrapolator({
      name: 'Constant acceleration',
      degree: 2,
      historySteps: options.accelerationWindowSteps,
    }),
  ];
}
