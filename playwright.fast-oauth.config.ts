import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'fast-oauth.spec.ts', workers: 1,
  use: { baseURL: 'http://localhost:3312', channel: 'chrome', serviceWorkers: 'block' },
  webServer: { command: 'npm run start -- --hostname localhost --port 3312', url: 'http://localhost:3312/login', reuseExistingServer: true },
});
