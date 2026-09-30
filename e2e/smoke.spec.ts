import { expect, test } from '@playwright/test';

test('page loads with a sized canvas and no errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Ghost Cursor' })).toBeVisible();
  const canvas = page.locator('#stage');
  await expect(canvas).toHaveAttribute('data-ready', 'true');

  const viewport = page.viewportSize();
  if (!viewport) throw new Error('No viewport');
  const box = await canvas.boundingBox();
  expect(box?.width).toBe(viewport.width);
  expect(box?.height).toBe(viewport.height);
  expect(errors).toEqual([]);
});

test('makes no requests to other origins', async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on('request', (request) => {
    if (baseURL && !request.url().startsWith(baseURL)) foreign.push(request.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(foreign).toEqual([]);
});

test('has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
