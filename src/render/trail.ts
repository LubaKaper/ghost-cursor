import type { ResampledStep, Vec2 } from '../input/types';

// 30 steps at 60 Hz is 500 ms, the same span as the prediction horizon.
export const TRAIL_LENGTH_STEPS = 30;

// Returns a new trail with the steps appended, keeping only the newest maxLength.
export function appendToTrail(
  trail: readonly ResampledStep[],
  steps: readonly ResampledStep[],
  maxLength: number = TRAIL_LENGTH_STEPS,
): ResampledStep[] {
  if (steps.length === 0) return trail.slice();
  return [...trail, ...steps].slice(-maxLength);
}

export type TrailLine = {
  from: Vec2;
  to: Vec2;
  // 0 at the oldest end of the trail, 1 at the newest.
  age: number;
};

// Pairs consecutive steps into line pieces, never joining across a break.
export function trailLines(trail: readonly ResampledStep[]): TrailLine[] {
  const lines: TrailLine[] = [];
  for (let i = 1; i < trail.length; i += 1) {
    const from = trail[i - 1];
    const to = trail[i];
    if (!from || !to || from.segment !== to.segment) continue;
    lines.push({ from: from.positionPx, to: to.positionPx, age: i / (trail.length - 1) });
  }
  return lines;
}

export function drawTrail(
  context: CanvasRenderingContext2D,
  trail: readonly ResampledStep[],
  color: string,
): void {
  context.save();
  context.strokeStyle = color;
  // Round caps overlap at every joint and show as dots on a translucent line.
  context.lineCap = 'butt';
  for (const line of trailLines(trail)) {
    context.globalAlpha = 0.5 * line.age;
    context.lineWidth = 1 + 5 * line.age;
    context.beginPath();
    context.moveTo(line.from.x, line.from.y);
    context.lineTo(line.to.x, line.to.y);
    context.stroke();
  }
  context.restore();
}
