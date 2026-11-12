import { applyCanvasSize, computeCanvasSize, type CanvasSize } from './canvas';

export type Stage = {
  context: CanvasRenderingContext2D;
  size: CanvasSize;
};

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
  });

  return stage;
}
