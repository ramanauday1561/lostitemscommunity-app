import { defineConfig, devices } from '@playwright/test';

const isLiveApp = !!process.env.LIVE_APP;

export default defineConfig({
  testDir: './playwright',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  reporter: 'html',
  timeout: 60000,
  use: {
    baseURL: isLiveApp ? 'https://app.lostitemscommunity.com' : 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        executablePath: '/opt/pw-browsers/chromium',
      },
    },
  ],

  webServer: isLiveApp ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
