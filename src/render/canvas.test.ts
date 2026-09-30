import { describe, expect, it } from 'vitest';
import { computeCanvasSize } from './canvas';

describe('computeCanvasSize', () => {
  it('scales the backing store by the device pixel ratio', () => {
    const size = computeCanvasSize({ cssWidthPx: 400, cssHeightPx: 300, devicePixelRatio: 2 });
    expect(size).toEqual({
      cssWidthPx: 400,
      cssHeightPx: 300,
      backingWidthPx: 800,
      backingHeightPx: 600,
      pixelRatio: 2,
    });
  });

  it('caps very high pixel ratios', () => {
    const size = computeCanvasSize({ cssWidthPx: 100, cssHeightPx: 100, devicePixelRatio: 3 });
    expect(size.pixelRatio).toBe(2);
    expect(size.backingWidthPx).toBe(200);
  });

  it('treats ratios below 1 as 1', () => {
    const size = computeCanvasSize({ cssWidthPx: 100, cssHeightPx: 50, devicePixelRatio: 0.5 });
    expect(size.pixelRatio).toBe(1);
    expect(size.backingHeightPx).toBe(50);
  });

  it('rounds fractional backing sizes', () => {
    const size = computeCanvasSize({ cssWidthPx: 333, cssHeightPx: 101, devicePixelRatio: 1.5 });
    expect(size.backingWidthPx).toBe(500);
    expect(size.backingHeightPx).toBe(152);
  });

  it('clamps negative sizes to zero', () => {
    const size = computeCanvasSize({ cssWidthPx: -5, cssHeightPx: 0, devicePixelRatio: 1 });
    expect(size.backingWidthPx).toBe(0);
    expect(size.backingHeightPx).toBe(0);
  });
});
