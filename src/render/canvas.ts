export type CanvasSize = {
  cssWidthPx: number;
  cssHeightPx: number;
  backingWidthPx: number;
  backingHeightPx: number;
  pixelRatio: number;
};

// Cap the ratio: 3x screens triple the fill cost for no visible gain on soft shapes.
const MAX_PIXEL_RATIO = 2;

export function computeCanvasSize(options: {
  cssWidthPx: number;
  cssHeightPx: number;
  devicePixelRatio: number;
}): CanvasSize {
  const pixelRatio = Math.min(Math.max(options.devicePixelRatio, 1), MAX_PIXEL_RATIO);
  const cssWidthPx = Math.max(0, options.cssWidthPx);
  const cssHeightPx = Math.max(0, options.cssHeightPx);
  return {
    cssWidthPx,
    cssHeightPx,
    backingWidthPx: Math.round(cssWidthPx * pixelRatio),
    backingHeightPx: Math.round(cssHeightPx * pixelRatio),
    pixelRatio,
  };
}

// Sizes the backing store and sets a transform so all drawing code works in CSS pixels.
export function applyCanvasSize(
  canvas: HTMLCanvasElement,
  size: CanvasSize,
): CanvasRenderingContext2D {
  canvas.width = size.backingWidthPx;
  canvas.height = size.backingHeightPx;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is not available');
  context.setTransform(size.pixelRatio, 0, 0, size.pixelRatio, 0, 0);
  return context;
}
