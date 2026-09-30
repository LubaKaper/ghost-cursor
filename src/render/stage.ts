import { applyCanvasSize, computeCanvasSize, type CanvasSize } from './canvas';

export type Stage = {
  context: CanvasRenderingContext2D;
  size: CanvasSize;
};

const PLACEHOLDER_RADIUS_PX = 14;

// Keeps the canvas matched to the window. Returns the live stage; its fields update on resize.
export function createStage(canvas: HTMLCanvasElement): Stage {
  const measure = (): CanvasSize =>
    computeCanvasSize({
      cssWidthPx: window.innerWidth,
      cssHeightPx: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    });

  const size = measure();
  const stage: Stage = { context: applyCanvasSize(canvas, size), size };

  window.addEventListener('resize', () => {
    stage.size = measure();
    stage.context = applyCanvasSize(canvas, stage.size);
    drawPlaceholder(stage);
  });

  return stage;
}

// Day 1 stand-in for the creature: the red circle from the portfolio, resting in the middle.
export function drawPlaceholder(stage: Stage): void {
  const { context, size } = stage;
  const red = getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
  context.clearRect(0, 0, size.cssWidthPx, size.cssHeightPx);
  context.fillStyle = red || '#e2231a';
  context.beginPath();
  context.arc(size.cssWidthPx / 2, size.cssHeightPx / 2, PLACEHOLDER_RADIUS_PX, 0, Math.PI * 2);
  context.fill();
}
