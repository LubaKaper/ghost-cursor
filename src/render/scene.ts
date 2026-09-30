import type { ResampledStep } from '../input/types';
import type { CanvasSize } from './canvas';
import type { Palette } from './palette';
import { drawTrail } from './trail';

export type SceneState = {
  trail: readonly ResampledStep[];
  palette: Palette;
  // Off under prefers-reduced-motion.
  showTrail: boolean;
};

const CREATURE_RADIUS_PX = 14;

export function drawScene(
  context: CanvasRenderingContext2D,
  size: CanvasSize,
  scene: SceneState,
): void {
  context.clearRect(0, 0, size.cssWidthPx, size.cssHeightPx);
  if (scene.showTrail) drawTrail(context, scene.trail, scene.palette.creature);

  // Before any input the creature waits in the middle.
  const head = scene.trail.at(-1)?.positionPx ?? {
    x: size.cssWidthPx / 2,
    y: size.cssHeightPx / 2,
  };
  context.fillStyle = scene.palette.creature;
  context.beginPath();
  context.arc(head.x, head.y, CREATURE_RADIUS_PX, 0, Math.PI * 2);
  context.fill();
}
