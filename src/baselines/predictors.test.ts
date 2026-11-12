import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../input/types';
import { createBaselines } from './predictors';

const HISTORY = 8;
const HORIZON = 30;

// Positions at steps -(HISTORY-1) .. 0, oldest first.
const history = (f: (t: number) => Vec2): Vec2[] =>
  Array.from({ length: HISTORY }, (_, i) => f(i - (HISTORY - 1)));

const [hold, velocity, acceleration] = createBaselines({
  velocityWindowSteps: HISTORY,
  accelerationWindowSteps: HISTORY,
});
if (!hold || !velocity || !acceleration) throw new Error('Missing baselines');

describe('baselines', () => {
  it('hold always predicts no movement', () => {
    const moving = history((t) => ({ x: 10 * t, y: 0 }));
    expect(hold.predictDisplacementPx(moving, HORIZON)).toEqual({ x: 0, y: 0 });
  });

  it('constant velocity is exact on a straight line at constant speed', () => {
    const line = history((t) => ({ x: 100 + 4 * t, y: 50 - 2 * t }));
    const guess = velocity.predictDisplacementPx(line, HORIZON);
    expect(guess.x).toBeCloseTo(4 * HORIZON, 9);
    expect(guess.y).toBeCloseTo(-2 * HORIZON, 9);
  });

  it('constant acceleration is exact on a parabola', () => {
    const parabola = history((t) => ({ x: 3 * t + 0.1 * t * t, y: 0 }));
    const guess = acceleration.predictDisplacementPx(parabola, HORIZON);
    // p(H) - p(0) = 3H + 0.1H^2
    expect(guess.x).toBeCloseTo(3 * HORIZON + 0.1 * HORIZON * HORIZON, 9);
  });

  it('constant velocity falls short on an accelerating path', () => {
    const speedingUp = history((t) => ({ x: 10 * t + 0.1 * t * t, y: 0 }));
    const guess = velocity.predictDisplacementPx(speedingUp, HORIZON);
    // A line fit over t = -7..0 sees the average velocity of the window, 10 + 0.2 * -3.5 = 9.3
    // px per step, so it predicts 9.3 * 30 = 279 px. The pointer really moves 300 + 90 = 390 px.
    expect(guess.x).toBeCloseTo(279, 9);
  });

  it('every baseline predicts nothing for a still pointer', () => {
    const still = history(() => ({ x: 42, y: 7 }));
    for (const baseline of [hold, velocity, acceleration]) {
      const guess = baseline.predictDisplacementPx(still, HORIZON);
      expect(guess.x).toBeCloseTo(0, 9);
      expect(guess.y).toBeCloseTo(0, 9);
    }
  });

  it('has plain names for the stats panel', () => {
    expect([hold, velocity, acceleration].map((b) => b.name)).toEqual([
      'Hold position',
      'Constant velocity',
      'Constant acceleration',
    ]);
  });
});
