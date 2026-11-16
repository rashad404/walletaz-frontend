// Requires the private fixture emitted by backend/scripts/verification-return-smoke.php.
// Only SMS delivery is intercepted. Validation, code verification, userinfo and navigation are live.
const { chromium, expect: baseExpect } = require('@playwright/test');
const expect = baseExpect.configure({ timeout: 15000 });
let stage = 'setup';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const fixture = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const output = process.argv[3];
  if (!output) throw new Error('Private fixture and output directory required');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { delivery: 'seeded OTP; no SMS sent', checks: {} };
  const returnTo = 'https://toy.az/';
  const url = new URL('https://kimlik.az/az/settings/verification');
  url.search = new URLSearchParams({ client_id: fixture.client_id, return_to: returnTo, need: 'phone' });
  async function context(signedIn) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    await ctx.route('**/*', async route => {
      const request = route.request();
      const target = new URL(request.url());
      if (/googletagmanager|google-analytics|analytics\.google|doubleclick|connect\.facebook|clarity\.ms|hotjar|segment|plausible/i.test(target.hostname)) return route.abort();
      if (target.hostname === 'api.kimlik.az' && target.pathname === '/api/user/send-phone-verification') {
        assert.equal(request.postDataJSON().phone, fixture.phone);
        return route.fulfill({ json: { status: 'success', data: {} } });
      }
      return route.continue();
    });
    if (signedIn) await ctx.addInitScript(token => {
      if (location.origin === 'https://kimlik.az') localStorage.setItem('token', token);
    }, fixture.token);
    return ctx;
  }
  async function screenshots(page, state) {
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: path.join(output, `live-${state}-${width}.png`), fullPage: true });
    }
  }
  try {
    const ctx = await context(true);
    const userinfo = async () => {
      const response = await ctx.request.get('https://api.kimlik.az/api/oauth/user', {
        headers: { Authorization: `Bearer ${fixture.oauth_token}`, Accept: 'application/json', 'Cache-Control': 'no-cache' },
      });
      assert.equal(response.status(), 200);
      assert.match(response.headers()['cache-control'], /no-store/);
      const data = (await response.json()).data;
      assert.equal(data.id, fixture.id);
      return data.verification;
    };
    stage = 'initial userinfo';
    report.before = await userinfo();
    assert.equal(report.before.phone_verified, false);
    const page = await ctx.newPage();
    stage = 'toy parent';
    await page.goto(returnTo, { waitUntil: 'domcontentloaded', timeout: 60000 });
    stage = 'verification page';
    await page.goto(url.href);
    await expect(page.getByRole('heading', { name: 'toy.az sizdən telefon nömrənizi təsdiqləməyi xahiş edir' })).toBeVisible();
    await screenshots(page, 'phone');
    await page.getByRole('button', { name: 'Kod göndər', exact: true }).click();
    await page.locator('input[maxlength="6"]').fill(fixture.code);
    stage = 'submit verification';
    const verified = page.waitForResponse(response => response.url().endsWith('/api/user/verify-phone'));
    await page.getByRole('button', { name: 'Təsdiqlə', exact: true }).click();
    assert.equal((await verified).status(), 200);
    const back = page.getByRole('link', { name: 'toy.az saytına qayıt', exact: true });
    await expect(back).toHaveAttribute('href', returnTo);
    const completedAt = Date.now();
    stage = 'updated userinfo';
    report.after = await userinfo();
    assert.equal(report.after.phone_verified, true);
    assert.equal(report.after.verification_level, 'basic');
    stage = 'automatic return';
    await page.waitForURL(returnTo, { waitUntil: 'domcontentloaded', timeout: 20000 });
    report.returnElapsedMs = Date.now() - completedAt;
    assert(report.returnElapsedMs >= 2700);
    report.checks.livePhoneVerificationAndAutomaticReturn = true;
    report.checks.sameOAuthTokenUpdatedImmediately = true;
    stage = 'completion screenshots';
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.goto(url.href);
    await expect(page.getByRole('link', { name: 'toy.az saytına qayıt', exact: true })).toBeVisible();
    await screenshots(page, 'complete');
    stage = 'invalid return';
    const invalid = new URL(url);
    invalid.searchParams.set('return_to', 'https://example.com/');
    const rejected = page.waitForResponse(response => response.url().endsWith('/api/oauth/verification-request'));
    await page.goto(invalid.href);
    assert.equal((await rejected).status(), 422);
    await expect(page.getByRole('heading', { name: 'Təsdiqləmə səhifəsini açmaq olmadı' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'toy.az saytına qayıt', exact: true })).toHaveCount(0);
    await screenshots(page, 'invalid');
    report.checks.invalidOriginRejected = true;
    await ctx.close();
    stage = 'signed-out continuation';
    const signedOut = await context(false);
    const login = await signedOut.newPage();
    await login.goto(url.href);
    await expect(login).toHaveURL(/\/login\?return_url=/);
    const continuation = new URL(new URL(login.url()).searchParams.get('return_url'), 'https://kimlik.az');
    assert.equal(continuation.search, url.search);
    assert.equal(continuation.pathname, '/az/settings/verification');
    await expect(login.locator('input[type=email]')).toBeVisible();
    report.checks.signedOutContinuationPreserved = true;
    await signedOut.close();
    fs.writeFileSync(path.join(output, 'live-checks.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch(() => { console.error(`Live verification check failed at ${stage}; no fixture credentials logged.`); process.exitCode = 1; });
