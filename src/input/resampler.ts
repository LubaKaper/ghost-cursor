import type { PointerSample, ResampledStep, Vec2 } from './types';

export type ResamplerOptions = {
  // Time between output steps. 1000 / 60 gives 60 Hz.
  stepMs: number;
  // If two raw samples are further apart than this, the pointer was resting in between.
  // We hold the old position instead of drawing a slow fake glide between them.
  holdAfterMs: number;
  // After this long without movement the segment ends. Must be longer than the prediction
  // horizon, so a prediction made just before a stop still gets its full future.
  breakAfterStillMs: number;
  // Movement smaller than this counts as still, so sensor jitter does not reset idle time.
  stillEpsilonPx: number;
};

export const DEFAULT_RESAMPLER_OPTIONS: ResamplerOptions = {
  stepMs: 1000 / 60,
  holdAfterMs: 100,
  breakAfterStillMs: 1000,
  stillEpsilonPx: 0.5,
};

export type Resampler = {
  // Feed a raw sample. Returns the steps that are now known.
  push(sample: PointerSample): ResampledStep[];
  // Call once per frame. While the pointer rests, emits held steps so labels keep arriving.
  advanceTo(timeMs: number): ResampledStep[];
  // End the current segment: pointer left, tab hidden, touch lifted.
  breakSegment(): void;
};

type Segment = {
  id: number;
  startMs: number;
  nextStepIndex: number;
  lastSample: PointerSample;
  anchorPx: Vec2;
  lastMoveMs: number;
};

export function createResampler(options: ResamplerOptions = DEFAULT_RESAMPLER_OPTIONS): Resampler {
  let segment: Segment | null = null;
  let nextSegmentId = 0;

  const stepTime = (current: Segment, index: number): number =>
    // Multiply instead of accumulating so step times never drift.
    current.startMs + index * options.stepMs;

  // Emits every step up to endMs. Returns false if the segment ended from being still too long.
  const emitThrough = (
    current: Segment,
    endMs: number,
    positionAt: (timeMs: number) => Vec2,
    out: ResampledStep[],
  ): boolean => {
    while (stepTime(current, current.nextStepIndex) <= endMs) {
      const timeMs = stepTime(current, current.nextStepIndex);
      const positionPx = positionAt(timeMs);
      if (distance(positionPx, current.anchorPx) > options.stillEpsilonPx) {
        current.anchorPx = positionPx;
        current.lastMoveMs = timeMs;
      }
      const stillForMs = timeMs - current.lastMoveMs;
      out.push({ timeMs, positionPx, segment: current.id, stillForMs });
      current.nextStepIndex += 1;
      if (stillForMs >= options.breakAfterStillMs) return false;
    }
    return true;
  };

  const startSegment = (sample: PointerSample, out: ResampledStep[]): void => {
    const started: Segment = {
      id: nextSegmentId,
      startMs: sample.timeMs,
      nextStepIndex: 0,
      lastSample: sample,
      anchorPx: sample.positionPx,
      lastMoveMs: sample.timeMs,
    };
    nextSegmentId += 1;
    segment = started;
    emitThrough(started, sample.timeMs, () => sample.positionPx, out);
  };

  const push = (sample: PointerSample): ResampledStep[] => {
    const out: ResampledStep[] = [];
    if (!isFiniteSample(sample)) return out;
    if (!segment) {
      startSegment(sample, out);
      return out;
    }
    const previous = segment.lastSample;
    // Out-of-order or duplicate timestamps carry no new timing information.
    if (sample.timeMs <= previous.timeMs) return out;

    const stillOpen = emitThrough(segment, sample.timeMs, positionBetween(previous, sample), out);
    if (!stillOpen) {
      startSegment(sample, out);
      return out;
    }
    segment.lastSample = sample;
    return out;
  };

  const advanceTo = (timeMs: number): ResampledStep[] => {
    const out: ResampledStep[] = [];
    if (!segment) return out;
    const last = segment.lastSample;
    // Until holdAfterMs has passed, the next sample could still be interpolated towards.
    if (timeMs - last.timeMs <= options.holdAfterMs) return out;
    const stillOpen = emitThrough(segment, timeMs, () => last.positionPx, out);
    if (!stillOpen) segment = null;
    return out;
  };

  const breakSegment = (): void => {
    segment = null;
  };

  const positionBetween =
    (from: PointerSample, to: PointerSample) =>
    (timeMs: number): Vec2 => {
      const gapMs = to.timeMs - from.timeMs;
      if (gapMs > options.holdAfterMs) {
        return timeMs < to.timeMs ? from.positionPx : to.positionPx;
      }
      return lerp(from.positionPx, to.positionPx, (timeMs - from.timeMs) / gapMs);
    };

  return { push, advanceTo, breakSegment };
}

function lerp(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isFiniteSample(sample: PointerSample): boolean {
  return (
    Number.isFinite(sample.timeMs) &&
    Number.isFinite(sample.positionPx.x) &&
    Number.isFinite(sample.positionPx.y)
  );
}
