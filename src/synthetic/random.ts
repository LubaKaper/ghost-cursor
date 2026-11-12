export type Random = {
  // Uniform in [0, 1).
  next(): number;
  // Standard normal: mean 0, standard deviation 1.
  normal(): number;
};

// mulberry32: a tiny 32-bit generator with good enough statistics for test paths and weight
// init, and fully reproducible from the seed. https://gist.github.com/tommyettinger/46a874533244883189143505d203312c
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Box-Muller transform. 1 - next() keeps the log argument away from 0.
  const normal = (): number =>
    Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  return { next, normal };
}
