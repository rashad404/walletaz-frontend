// Run with: node tests/measure-fast-oauth.cjs > measurement.json
// Fresh browser contexts, no throttling, analytics blocked before any navigation.
const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  for (const site of ['toy.az', 'wisher.az']) for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', route => /googletagmanager|google-analytics|analytics.google|doubleclick|connect.facebook|facebook.com\/tr|clarity.ms|hotjar|analytics.tiktok/.test(route.request().url()) ? route.abort() : route.continue());
    let page = await context.newPage(), start;
    if (site === 'wisher.az') {
      await page.goto('https://wisher.az');
      await page.waitForLoadState('networkidle');
      start = Date.now();
      const popup = page.waitForEvent('popup');
      await page.getByRole('link', { name: 'Daxil ol', exact: true }).click();
      page = await popup;
    } else {
      start = Date.now();
      await page.goto('https://toy.az/auth/kimlik?popup=1', { waitUntil: 'commit' });
    }
    await page.locator('input[type=email]').first().waitFor({ state: 'visible', timeout: 20000 });
    const input = Date.now() - start;
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    results.push({ site, run, input, idle: Date.now() - start });
    await context.close();
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
