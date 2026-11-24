import { test, expect } from '@playwright/test';

test.describe('NFR-01 site opens', () => {
  test('the home page opens and its document title is the site title', async ({ page }) => {
    await test.step('open the home page', async () => {
      const response = await page.goto('/');
      expect(response?.ok()).toBe(true);
    });

    await test.step('the document title is the site title', async () => {
      await expect(page).toHaveTitle('Vonn Salve');
    });
  });
});
