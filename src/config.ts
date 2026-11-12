// Engine settings shared by the demo page and the tests. Reasons are in docs/DECISIONS.md;
// numbers behind the baseline windows are in docs/RESULTS.md.
export const ENGINE_CONFIG = {
  stepsPerSecond: 60,
  // 500 ms ahead.
  horizonSteps: 30,
  // A pointer still for longer than this is idle input.
  idleAfterMs: 300,
  // The rolling error covers the last 600 scored guesses: 10 s of movement.
  errorWindowGuesses: 600,
  velocityWindowSteps: 4,
  accelerationWindowSteps: 8,
} as const;
