import { defineConfig } from 'vitest/config';

// Measurement scripts, kept out of the normal test run because they print tables, not assert.
export default defineConfig({
  test: {
    include: ['scripts/**/*.report.ts'],
    environment: 'node',
  },
});
