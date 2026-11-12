import type { EvaluationSnapshot } from '../metrics/evaluator';

export type StatsRow = {
  name: string;
  missText: string;
  isBest: boolean;
};

// Turns scores into display rows. The lowest error is marked so the panel never needs to
// explain which number matters.
export function statsRows(snapshot: EvaluationSnapshot): StatsRow[] {
  const known = snapshot.scores.flatMap((s) => (s.meanErrorPx === null ? [] : [s.meanErrorPx]));
  const best = known.length > 0 ? Math.min(...known) : null;
  return snapshot.scores.map((score) => ({
    name: score.name,
    missText:
      score.meanErrorPx === null ? 'waiting' : `${String(Math.round(score.meanErrorPx))} px`,
    isBest: best !== null && score.meanErrorPx === best,
  }));
}

export type StatsPanelOptions = {
  root: HTMLElement;
  horizonMs: number;
  windowSeconds: number;
};

const seconds = (ms: number): string => `${String(Number((ms / 1000).toFixed(2)))} s`;

export function noteText(options: { horizonMs: number; windowSeconds: number }): string {
  return (
    `Average distance between the guess and where you really were ${seconds(options.horizonMs)} ` +
    `later, over your last ${String(options.windowSeconds)} s of movement.`
  );
}

export function countText(options: { scoredCount: number; horizonMs: number }): string {
  const { scoredCount, horizonMs } = options;
  if (scoredCount === 0) {
    return `Move the pointer to start. Guesses are scored after ${seconds(horizonMs)}.`;
  }
  return `Based on ${String(scoredCount)} scored ${scoredCount === 1 ? 'guess' : 'guesses'}.`;
}

export type StatsPanel = {
  // Call every frame; the panel redraws at most a few times per second.
  update(readSnapshot: () => EvaluationSnapshot, nowMs: number): void;
};

// Rewriting the DOM every frame would cost layout time and make the numbers unreadable.
const REFRESH_EVERY_MS = 250;

export function createStatsPanel(options: StatsPanelOptions): StatsPanel {
  const { root, horizonMs } = options;
  const note = root.querySelector<HTMLElement>('[data-stats-note]');
  const rows = root.querySelector<HTMLTableSectionElement>('[data-stats-rows]');
  const count = root.querySelector<HTMLElement>('[data-stats-count]');
  if (!note || !rows || !count) throw new Error('Stats panel markup is missing');
  note.textContent = noteText(options);
  let lastRefreshMs = Number.NEGATIVE_INFINITY;

  const render = (snapshot: EvaluationSnapshot): void => {
    rows.replaceChildren(
      ...statsRows(snapshot).map((row) => {
        const tr = document.createElement('tr');
        tr.toggleAttribute('data-best', row.isBest);
        const name = document.createElement('th');
        name.scope = 'row';
        name.textContent = row.name;
        const miss = document.createElement('td');
        miss.textContent = row.missText;
        tr.append(name, miss);
        return tr;
      }),
    );
    count.textContent = countText({ scoredCount: snapshot.scoredCount, horizonMs });
    root.dataset['scored'] = String(snapshot.scoredCount);
  };

  return {
    update(readSnapshot, nowMs) {
      if (nowMs - lastRefreshMs < REFRESH_EVERY_MS) return;
      lastRefreshMs = nowMs;
      render(readSnapshot());
    },
  };
}
