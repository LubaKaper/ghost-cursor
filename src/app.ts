import { createBaselines } from './baselines/predictors';
import { ENGINE_CONFIG } from './config';
import { attachPointerInput } from './input/pointerInput';
import { createResampler } from './input/resampler';
import type { ResampledStep } from './input/types';
import { createEvaluator } from './metrics/evaluator';
import { readPalette } from './render/palette';
import { drawScene } from './render/scene';
import { createStage } from './render/stage';
import { createStatsPanel } from './render/statsPanel';
import { appendToTrail } from './render/trail';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const statsRoot = document.querySelector<HTMLElement>('[data-stats]');
if (!canvas || !statsRoot) throw new Error('Missing page markup');

const root = document.documentElement;
const stage = createStage(canvas);
const resampler = createResampler();
const evaluator = createEvaluator({
  predictors: createBaselines(ENGINE_CONFIG),
  horizonSteps: ENGINE_CONFIG.horizonSteps,
  idleAfterMs: ENGINE_CONFIG.idleAfterMs,
  windowSize: ENGINE_CONFIG.errorWindowGuesses,
});
const statsPanel = createStatsPanel({
  root: statsRoot,
  horizonMs: (ENGINE_CONFIG.horizonSteps * 1000) / ENGINE_CONFIG.stepsPerSecond,
  windowSeconds: ENGINE_CONFIG.errorWindowGuesses / ENGINE_CONFIG.stepsPerSecond,
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const lightScheme = window.matchMedia('(prefers-color-scheme: light)');

let palette = readPalette(root);
let trail: ResampledStep[] = [];
let stepCount = 0;

const receive = (steps: ResampledStep[]): void => {
  stepCount += steps.length;
  for (const step of steps) evaluator.push(step);
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
  statsPanel.update(() => evaluator.snapshot(), nowMs);
  // Read by the end-to-end tests.
  canvas.dataset['steps'] = String(stepCount);
  requestAnimationFrame(frame);
};

requestAnimationFrame(frame);
canvas.dataset['ready'] = 'true';
