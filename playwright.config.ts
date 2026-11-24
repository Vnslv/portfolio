import { defineConfig, devices } from '@playwright/test';

const port = process.env.PORT ?? '3000';
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e/flows',
  testIgnore: '_example-flow.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm start',
    url: baseURL,
    // Never reuse a server this run did not start: a different app on the port would be tested.
    reuseExistingServer: false,
  },
});
