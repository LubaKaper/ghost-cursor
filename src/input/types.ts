export type Vec2 = {
  readonly x: number;
  readonly y: number;
};

// One raw pointer reading. Time uses the performance.now() clock, position is CSS pixels
// relative to the viewport.
export type PointerSample = {
  readonly timeMs: number;
  readonly positionPx: Vec2;
};

// One evenly spaced step from the resampler. Steps in the same segment are exactly one
// step apart in time; a new segment means a break (pointer left, tab hidden, long idle).
export type ResampledStep = {
  readonly timeMs: number;
  readonly positionPx: Vec2;
  readonly segment: number;
  // Time since the pointer last moved. Lets later stages tell idle input from real stops.
  readonly stillForMs: number;
};
