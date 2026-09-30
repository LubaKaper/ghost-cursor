import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const url = `http://localhost:${String(port)}`;
// Lets sandboxes with a preinstalled Chromium skip the browser download.
const executablePath = process.env['PLAYWRIGHT_CHROMIUM_PATH'];

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: url,
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${String(port)} --strictPort`,
    url,
    reuseExistingServer: !process.env['CI'],
  },
});
