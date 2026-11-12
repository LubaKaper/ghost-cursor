import type { ResampledStep, Vec2 } from '../input/types';
import { createRandom } from './random';

// Fixed pointer paths for measuring predictors. They produce resampled steps directly, so they
// feed the same evaluator as live input. Everything is in CSS pixels at 60 Hz.

const STEP_MS = 1000 / 60;
const CENTER: Vec2 = { x: 600, y: 400 };

export type PathName = 'circle' | 'figure-eight' | 'zigzag' | 'random walk';

export const PATH_NAMES: readonly PathName[] = ['circle', 'figure-eight', 'zigzag', 'random walk'];

// Mouse positions usually arrive as whole CSS pixels. Rounding gives the paths the same
// small jitter, so smoothing over a longer window is not unfairly penalised.
function fromPositions(positions: readonly Vec2[]): ResampledStep[] {
  return positions.map((positionPx, i) => ({
    timeMs: i * STEP_MS,
    positionPx: { x: Math.round(positionPx.x), y: Math.round(positionPx.y) },
    segment: 0,
    stillForMs: 0,
  }));
}

const times = (durationS: number): number[] =>
  Array.from({ length: Math.round(durationS * 60) }, (_, i) => i / 60);

// Radius 200 px, one lap every 2 s: about 630 px/s, a brisk but ordinary hand speed.
function circle(durationS: number): Vec2[] {
  return times(durationS).map((t) => {
    const angle = (2 * Math.PI * t) / 2;
    return { x: CENTER.x + 200 * Math.cos(angle), y: CENTER.y + 200 * Math.sin(angle) };
  });
}

// A Lissajous figure eight, 300 by 150 px, one loop every 3 s. Curvature keeps changing,
// unlike the circle.
function figureEight(durationS: number): Vec2[] {
  return times(durationS).map((t) => {
    const phase = (2 * Math.PI * t) / 3;
    return { x: CENTER.x + 300 * Math.sin(phase), y: CENTER.y + 150 * Math.sin(2 * phase) };
  });
}

// Straight strokes at 600 px/s with a sharp reversal every 0.6 s, while drifting down.
// Smooth extrapolators overshoot every corner.
function zigzag(durationS: number): Vec2[] {
  const strokeS = 0.6;
  const speedPxPerS = 600;
  return times(durationS).map((t) => {
    const phase = (t % (2 * strokeS)) / strokeS;
    const along = phase < 1 ? phase : 2 - phase;
    return {
      x: CENTER.x - 180 + speedPxPerS * strokeS * along,
      y: CENTER.y - 200 + 40 * t,
    };
  });
}

// Velocity random walk on an open plane: each step adds independent Gaussian noise to the
// velocity. The expected future velocity equals the current one, so constant velocity is the
// best possible mean guess here. No walls, because walls would add predictable structure.
function randomWalk(durationS: number, seed: number): Vec2[] {
  const random = createRandom(seed);
  // 0.15 px/step of velocity noise per step keeps speeds in a hand-like range over a minute.
  const noisePxPerStep = 0.15;
  let position = CENTER;
  let velocity: Vec2 = { x: 0, y: 0 };
  return times(durationS).map(() => {
    velocity = {
      x: velocity.x + noisePxPerStep * random.normal(),
      y: velocity.y + noisePxPerStep * random.normal(),
    };
    position = { x: position.x + velocity.x, y: position.y + velocity.y };
    return position;
  });
}

export function syntheticPath(options: {
  name: PathName;
  durationS: number;
  seed: number;
}): ResampledStep[] {
  switch (options.name) {
    case 'circle':
      return fromPositions(circle(options.durationS));
    case 'figure-eight':
      return fromPositions(figureEight(options.durationS));
    case 'zigzag':
      return fromPositions(zigzag(options.durationS));
    case 'random walk':
      return fromPositions(randomWalk(options.durationS, options.seed));
  }
}
