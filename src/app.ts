import { createStage, drawPlaceholder } from './render/stage';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
if (!canvas) throw new Error('Missing #stage canvas');

const stage = createStage(canvas);
drawPlaceholder(stage);
canvas.dataset['ready'] = 'true';
