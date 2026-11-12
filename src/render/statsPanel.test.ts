import { describe, expect, it } from 'vitest';
import { countText, noteText, statsRows } from './statsPanel';

describe('statsRows', () => {
  it('rounds to whole pixels and marks the lowest error', () => {
    const rows = statsRows({
      scores: [
        { name: 'Hold position', meanErrorPx: 120.4 },
        { name: 'Constant velocity', meanErrorPx: 40.6 },
        { name: 'Constant acceleration', meanErrorPx: 55 },
      ],
      scoredCount: 10,
    });
    expect(rows).toEqual([
      { name: 'Hold position', missText: '120 px', isBest: false },
      { name: 'Constant velocity', missText: '41 px', isBest: true },
      { name: 'Constant acceleration', missText: '55 px', isBest: false },
    ]);
  });

  it('says waiting and marks nothing before any guess is scored', () => {
    const rows = statsRows({
      scores: [{ name: 'Hold position', meanErrorPx: null }],
      scoredCount: 0,
    });
    expect(rows).toEqual([{ name: 'Hold position', missText: 'waiting', isBest: false }]);
  });
});

describe('noteText', () => {
  it('states the horizon and window in plain units', () => {
    expect(noteText({ horizonMs: 500, windowSeconds: 10 })).toBe(
      'Average distance between the guess and where you really were 0.5 s later, ' +
        'over your last 10 s of movement.',
    );
    expect(noteText({ horizonMs: 300, windowSeconds: 10 })).toContain('0.3 s later');
  });
});

describe('countText', () => {
  it('explains the wait before the first score', () => {
    expect(countText({ scoredCount: 0, horizonMs: 500 })).toBe(
      'Move the pointer to start. Guesses are scored after 0.5 s.',
    );
  });

  it('uses the right plural', () => {
    expect(countText({ scoredCount: 1, horizonMs: 500 })).toBe('Based on 1 scored guess.');
    expect(countText({ scoredCount: 42, horizonMs: 500 })).toBe('Based on 42 scored guesses.');
  });
});
