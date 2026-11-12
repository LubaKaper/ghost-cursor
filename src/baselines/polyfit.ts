// Least-squares polynomial fit over the last N evenly spaced points, solved once per N.
//
// Fitting a line (or parabola) through several points instead of differencing the last two
// averages out jitter, the same idea as a Savitzky-Golay filter. Because the points are evenly
// spaced, the fit is a fixed weighted sum of the positions, so we precompute the weights.
//
// Time is measured in steps with the newest point at t = 0 and older points at negative t.
// The fitted curve is p(t) = c0 + c1 t + c2 t^2 (c2 only for degree 2).

export type FitDegree = 1 | 2;

// weights[k][i] is how much point i (oldest first) contributes to coefficient c_k.
export type FitWeights = readonly (readonly number[])[];

export function polyfitWeights(options: { pointCount: number; degree: FitDegree }): FitWeights {
  const { pointCount, degree } = options;
  const terms = degree + 1;
  if (!Number.isInteger(pointCount) || pointCount < terms) {
    throw new Error(`Need at least ${String(terms)} points for a degree ${String(degree)} fit`);
  }
  const times = Array.from({ length: pointCount }, (_, i) => i - (pointCount - 1));
  // Design matrix A: one row per point, one column per power of t.
  const design = times.map((t) => Array.from({ length: terms }, (_, k) => t ** k));
  // Normal equations: (A^T A) c = A^T p, so c = (A^T A)^-1 A^T p.
  const normal = Array.from({ length: terms }, (_, r) =>
    Array.from({ length: terms }, (_, c) => sum(design.map((row) => at(row, r) * at(row, c)))),
  );
  const inverse = invert(normal);
  return Array.from({ length: terms }, (_, k) =>
    design.map((row) => sum(row.map((value, j) => at(at(inverse, k), j) * value))),
  );
}

export function applyWeights(weights: readonly number[], values: readonly number[]): number {
  if (weights.length !== values.length) throw new Error('Weights and values differ in length');
  let total = 0;
  for (let i = 0; i < weights.length; i += 1) total += at(weights, i) * at(values, i);
  return total;
}

// Gauss-Jordan elimination with partial pivoting. Only ever used on 2x2 and 3x3 matrices.
function invert(matrix: readonly (readonly number[])[]): number[][] {
  const size = matrix.length;
  const rows = matrix.map((row, r) => [
    ...row,
    ...Array.from({ length: size }, (_, c) => (r === c ? 1 : 0)),
  ]);
  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < size; r += 1) {
      if (Math.abs(at(at(rows, r), col)) > Math.abs(at(at(rows, pivot), col))) pivot = r;
    }
    [rows[col], rows[pivot]] = [at(rows, pivot), at(rows, col)];
    const pivotRow = at(rows, col);
    const pivotValue = at(pivotRow, col);
    if (Math.abs(pivotValue) < 1e-12) throw new Error('Matrix is singular');
    for (let c = 0; c < 2 * size; c += 1) pivotRow[c] = at(pivotRow, c) / pivotValue;
    for (let r = 0; r < size; r += 1) {
      if (r === col) continue;
      const row = at(rows, r);
      const factor = at(row, col);
      for (let c = 0; c < 2 * size; c += 1) row[c] = at(row, c) - factor * at(pivotRow, c);
    }
  }
  return rows.map((row) => row.slice(size));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

// Indexed read that fails loudly instead of returning undefined.
function at<T>(values: readonly T[], index: number): T {
  const value = values[index];
  if (value === undefined) throw new Error(`Index ${String(index)} out of range`);
  return value;
}
