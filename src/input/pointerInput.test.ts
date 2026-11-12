import { describe, expect, it } from 'vitest';
import { samplesFromMoveEvent } from './pointerInput';

const reading = (timeStamp: number, clientX: number, clientY: number) => ({
  timeStamp,
  clientX,
  clientY,
});

describe('samplesFromMoveEvent', () => {
  it('uses coalesced readings when the browser provides them', () => {
    const event = {
      ...reading(30, 3, 3),
      getCoalescedEvents: () => [reading(10, 1, 1), reading(20, 2, 2), reading(30, 3, 3)],
    };
    expect(samplesFromMoveEvent(event).map((s) => s.timeMs)).toEqual([10, 20, 30]);
  });

  it('falls back to the event itself when the coalesced list is empty', () => {
    const event = { ...reading(5, 40, 60), getCoalescedEvents: () => [] };
    expect(samplesFromMoveEvent(event)).toEqual([{ timeMs: 5, positionPx: { x: 40, y: 60 } }]);
  });

  it('works in browsers without getCoalescedEvents', () => {
    expect(samplesFromMoveEvent(reading(5, 1, 2))).toEqual([
      { timeMs: 5, positionPx: { x: 1, y: 2 } },
    ]);
  });
});
