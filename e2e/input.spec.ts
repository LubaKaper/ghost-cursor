import { expect, test, type Page } from '@playwright/test';

const readSteps = async (page: Page): Promise<number> =>
  Number(await page.locator('#stage').getAttribute('data-steps'));

// Reads one canvas pixel at a CSS-pixel position, as [r, g, b, a].
const pixelAt = (page: Page, x: number, y: number): Promise<number[]> =>
  page.evaluate(
    ({ cssX, cssY }) => {
      const canvas = document.querySelector<HTMLCanvasElement>('#stage');
      const context = canvas?.getContext('2d');
      if (!canvas || !context) throw new Error('No canvas');
      const ratio = canvas.width / canvas.clientWidth;
      return Array.from(
        context.getImageData(Math.round(cssX * ratio), Math.round(cssY * ratio), 1, 1).data,
      );
    },
    { cssX: x, cssY: y },
  );

test('pointer movement produces resampled steps and moves the creature', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true');
  // Not assumed to be 0: some browsers send a pointer event when the page loads under the pointer.
  const stepsBefore = await readSteps(page);

  await page.mouse.move(60, 200);
  await page.mouse.move(260, 240, { steps: 20 });
  await expect.poll(() => readSteps(page)).toBeGreaterThan(stepsBefore + 1);

  // The creature is drawn at the latest resampled position, which is the pointer once it rests.
  await expect.poll(async () => (await pixelAt(page, 260, 240))[3]).toBe(255);
  const [red = 0, , blue = 0] = await pixelAt(page, 260, 240);
  expect(red).toBeGreaterThan(blue);
});

test('a touch tap is picked up', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.hasTouch, 'touch only');
  await page.goto('/');
  await expect(page.locator('#stage')).toHaveAttribute('data-ready', 'true');
  const stepsBefore = await readSteps(page);
  await page.touchscreen.tap(120, 300);
  await expect.poll(() => readSteps(page)).toBeGreaterThan(stepsBefore);
});
