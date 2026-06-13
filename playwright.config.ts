import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Assumes dev servers are already running (npm run dev in both backend/ and frontend/)
  // To start them automatically, uncomment the webServer blocks below:
  // webServer: [
  //   {
  //     command: 'npm run dev',
  //     cwd: './backend',
  //     port: 4000,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: 'npm run dev',
  //     cwd: './frontend',
  //     port: 5174,
  //     reuseExistingServer: true,
  //   },
  // ],
})
