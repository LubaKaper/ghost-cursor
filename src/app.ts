import { attachPointerInput } from './input/pointerInput';
import { createResampler } from './input/resampler';
import type { ResampledStep } from './input/types';
import { readPalette } from './render/palette';
import { drawScene } from './render/scene';
import { createStage } from './render/stage';
import { appendToTrail } from './render/trail';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) throw new Error('Missing #stage canvas');

const root = document.documentElement;
const stage = createStage(canvas);
const resampler = createResampler();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lightScheme = window.matchMedia('(prefers-color-scheme: light)');

let palette = readPalette(root);
let trail: ResampledStep[] = [];
let stepCount = 0;

const receive = (steps: ResampledStep[]): void => {
  stepCount += steps.length;
  trail = appendToTrail(trail, steps);
};

lightScheme.addEventListener('change', () => {
  palette = readPalette(root);
});

attachPointerInput({
  target: root,
  onSample: (sample) => {
    receive(resampler.push(sample));
  },
  onBreak: () => {
    resampler.breakSegment();
  },
});

const frame = (nowMs: number): void => {
  receive(resampler.advanceTo(nowMs));
  drawScene(stage.context, stage.size, { trail, palette, showTrail: !reducedMotion.matches });
  // Read by the end-to-end tests.
  canvas.dataset['steps'] = String(stepCount);
  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
canvas.dataset['ready'] = 'true';
