// EXAMPLE: delete once the first real flow exists. Shows the one-flow-per-file shape.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('AUTH-01 sign in', () => {
  test('signs in, handles empty and error states', async ({ page }) => {
    await test.step('happy path: valid credentials reach the dashboard', async () => {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill('owner@example.com');
      await page.getByLabel('Password').fill('correct-password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/dashboard');
    });

    await test.step('empty state: a new user sees the first-task prompt', async () => {
      await expect(page.getByText('No tasks yet')).toBeVisible();
    });

    await test.step('error state: a wrong password keeps the email and shows an error', async () => {
      await page.goto('/sign-in');
      await page.getByLabel('Email').fill('owner@example.com');
      await page.getByLabel('Password').fill('wrong-password');
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByLabel('Email')).toHaveValue('owner@example.com');
    });

    await test.step('accessibility: no axe violations on the sign-in page', async () => {
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  });
});
