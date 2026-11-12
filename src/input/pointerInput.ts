import type { PointerSample } from './types';

export type PointerInputOptions = {
  // The element to listen on. The page decides this; the engine assumes nothing about layout.
  target: HTMLElement;
  onSample: (sample: PointerSample) => void;
  // The pointer stream is interrupted. Nothing should be learned across this point.
  onBreak: () => void;
};

type PointerReading = Pick<PointerEvent, 'timeStamp' | 'clientX' | 'clientY'>;

type MoveEvent = PointerReading & {
  getCoalescedEvents?: () => PointerReading[];
};

// A fast mouse can report several positions per frame; the browser merges them into one
// event. The coalesced list gives them back, which matters for fast flicks.
export function samplesFromMoveEvent(event: MoveEvent): PointerSample[] {
  const coalesced = event.getCoalescedEvents?.() ?? [];
  const readings = coalesced.length > 0 ? coalesced : [event];
  return readings.map(toSample);
}

function toSample(reading: PointerReading): PointerSample {
  // timeStamp shares its clock with performance.now(), so frame time and sample time line up.
  return { timeMs: reading.timeStamp, positionPx: { x: reading.clientX, y: reading.clientY } };
}

// Returns a function that removes every listener.
export function attachPointerInput(options: PointerInputOptions): () => void {
  const { target, onSample, onBreak } = options;
  const documentRef = target.ownerDocument;
  const windowRef = documentRef.defaultView;

  const handleMove = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    for (const sample of samplesFromMoveEvent(event)) onSample(sample);
  };
  const handleDown = (event: PointerEvent): void => {
    if (!event.isPrimary) return;
    onSample(toSample(event));
  };
  // A lifted finger reappears somewhere else. A mouse or hovering pen keeps its position.
  const handleUp = (event: PointerEvent): void => {
    if (event.isPrimary && event.pointerType === 'touch') onBreak();
  };
  const handleVisibility = (): void => {
    if (documentRef.visibilityState === 'hidden') onBreak();
  };

  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerdown', handleDown);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', onBreak);
  target.addEventListener('pointerleave', onBreak);
  documentRef.addEventListener('visibilitychange', handleVisibility);
  windowRef?.addEventListener('blur', onBreak);

  return () => {
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerdown', handleDown);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', onBreak);
    target.removeEventListener('pointerleave', onBreak);
    documentRef.removeEventListener('visibilitychange', handleVisibility);
    windowRef?.removeEventListener('blur', onBreak);
  };
}
