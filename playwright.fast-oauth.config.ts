import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'fast-oauth.spec.ts', workers: 1,
  use: { baseURL: 'http://localhost:3312', channel: 'chrome', serviceWorkers: 'block' },
  webServer: [
    {command: 'node tests/fast-oauth-api.cjs', url: 'http://localhost:3313/api/config', reuseExistingServer: false},
    {command: 'npm run start -- --hostname localhost --port 3312', url: 'http://localhost:3312/login', reuseExistingServer: false, env: {KIMLIK_INTERNAL_API_URL: 'http://localhost:3313/api'}},
  ],
});
