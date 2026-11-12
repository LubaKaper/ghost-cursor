import { expect, test } from '@playwright/test';

test('the stats panel scores the baselines after movement', async ({ page }) => {
  await page.goto('/');
  const panel = page.getByRole('region', { name: 'How far off is each guess?' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('row', { name: /Constant velocity/ })).toContainText('waiting');

  // Circle for about 1.5 s, longer than the 0.5 s horizon plus the history window.
  const center = { x: 200, y: 260 };
  for (let i = 0; i <= 90; i += 1) {
    const angle = (i / 45) * Math.PI;
    await page.mouse.move(center.x + 120 * Math.cos(angle), center.y + 120 * Math.sin(angle));
    await page.waitForTimeout(16);
  }

  await expect.poll(async () => Number(await panel.getAttribute('data-scored'))).toBeGreaterThan(0);
  for (const name of ['Hold position', 'Constant velocity', 'Constant acceleration']) {
    await expect(panel.getByRole('row', { name: new RegExp(name) })).toContainText(/\d+ px/);
  }
  await expect(panel).toContainText(/Based on \d+ scored guess/);
});

test('the stats panel is reachable from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('region', { name: 'How far off is each guess?' })).toBeFocused();
});
