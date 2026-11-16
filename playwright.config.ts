import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'verification-return.spec.ts',
  workers: 1,
  use: {
    baseURL: 'http://localhost:3311',
    channel: 'chrome',
    serviceWorkers: 'block',
    trace: 'off',
  },
  webServer: {
    command: 'npm run start -- --hostname localhost --port 3311',
    url: 'http://localhost:3311/en/settings/verification',
    reuseExistingServer: false,
  },
});
