export type RollingMean = {
  add(value: number): void;
  // null until at least one value has been added.
  mean(): number | null;
  count(): number;
  clear(): void;
};

// Mean of the last `capacity` values, kept in a fixed ring so memory never grows.
export function createRollingMean(options: { capacity: number }): RollingMean {
  const { capacity } = options;
  if (!Number.isInteger(capacity) || capacity < 1) throw new Error('Capacity must be >= 1');
  const values = new Float64Array(capacity);
  let next = 0;
  let size = 0;
  let total = 0;

  return {
    add(value) {
      if (!Number.isFinite(value)) return;
      if (size === capacity) total -= values[next] ?? 0;
      else size += 1;
      values[next] = value;
      total += value;
      next = (next + 1) % capacity;
      // Adding and subtracting floats for hours slowly drifts; resum once per lap to reset it.
      if (next === 0) total = values.reduce((a, b) => a + b, 0);
    },
    mean: () => (size === 0 ? null : total / size),
    count: () => size,
    clear() {
      values.fill(0);
      next = 0;
      size = 0;
      total = 0;
    },
  };
}
