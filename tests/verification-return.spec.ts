import { test, expect, type Page } from '@playwright/test';

const clientId = '11111111-1111-4111-8111-111111111111';
const returnTo = 'https://example.com/settings?tab=verification#status';
const link = (need = 'phone', lang = 'en') => `/${lang}/settings/verification?${new URLSearchParams({ client_id: clientId, return_to: returnTo, need })}`;

type Options = { signedIn?: boolean; expired?: boolean; verified?: string; reject?: boolean; failVerification?: boolean; missingEmail?: boolean; name?: string; failUser?: boolean };
async function setup(page: Page, options: Options = {}) {
  const user = { id: 1, name: 'Example', email: options.missingEmail ? null : 'review@example.com', phone: '994501234567', phone_verified_at: null as string | null, email_verified_at: null as string | null, id_verified_at: null as string | null };
  if (options.verified) user[`${options.verified}_verified_at` as 'phone_verified_at'] = '2026-11-15T12:00:00Z';
  let expired = !!options.expired;
  // Install before any navigation. No external traffic, analytics or real OTP sends.
  await page.context().route('**/*', async route => {
    const url = new URL(route.request().url());
    if (/googletagmanager|google-analytics|analytics\.google|doubleclick|connect\.facebook|clarity\.ms|hotjar|segment|plausible/i.test(url.hostname)) return route.abort();
    if (url.origin === 'https://example.com') return route.fulfill({ contentType: 'text/html', body: '<h1>Returned to partner</h1>' });
    if (url.pathname.startsWith('/api/')) {
      const ok = (data: unknown) => route.fulfill({ json: { status: 'success', data } });
      if (url.pathname === '/api/oauth/verification-request') {
        if (options.reject) return route.fulfill({ status: 422, json: { status: 'error' } });
        const body = route.request().postDataJSON();
        return ok({ client_name: options.name || 'toy.az', return_to: body.return_to, need: body.need });
      }
      if (url.pathname === '/api/user') {
        if (options.failUser) return route.fulfill({ status: 503, json: { status: 'error' } });
        if (expired) return route.fulfill({ status: 401, json: { status: 'error' } });
        return ok(user);
      }
      if (url.pathname === '/api/auth/login') {
        expired = false;
        return ok({ token: 'local-browser-test-token', user, return_url: route.request().postDataJSON().return_url });
      }
      if (url.pathname === '/api/user/verify-phone' || url.pathname === '/api/user/verify-email') {
        if (options.failVerification) return route.fulfill({ status: 400, json: { status: 'error' } });
        const body = route.request().postDataJSON();
        if (url.pathname.endsWith('phone')) user.phone_verified_at = '2026-11-15T12:00:00Z';
        else { user.email_verified_at = '2026-11-15T12:00:00Z'; user.email = body.email; }
        return ok({ user });
      }
      return ok({});
    }
    if (url.origin === 'http://localhost:3311') return route.continue();
    return route.abort();
  });
  if (options.signedIn !== false) await page.addInitScript(() => {
    if (!sessionStorage.getItem('test-session-seeded')) {
      localStorage.setItem('token', 'local-browser-test-token');
      sessionStorage.setItem('test-session-seeded', '1');
    }
  });
  return user;
}

for (const expired of [false, true]) {
  test(`preserves the same email step through ${expired ? 'expired session' : 'signed-out'} login`, async ({ page }) => {
    await setup(page, { signedIn: expired, expired });
    await page.goto(link('email'));
    await expect(page).toHaveURL(/\/en\/login\?/);
    const returnUrl = new URL(page.url()).searchParams.get('return_url');
    expect(returnUrl).toBe(link('email'));
    // Stop reinserting the expired test token on every subsequent navigation.
    if (expired) await page.evaluate(() => localStorage.removeItem('token'));
    await page.locator('input[type=email]').fill('review@example.com');
    await page.locator('input[type=password]').fill('browser-test-password');
    await page.locator('form').first().locator('button[type=submit]').click();
    await expect(page.getByRole('heading', { name: 'toy.az asks you to verify your email address' })).toBeVisible();
    await expect(page.locator('input[type=tel]')).toHaveCount(0);
  });
}

for (const need of ['phone', 'email']) {
  test(`${need} success returns only after verification and waits three seconds`, async ({ page }) => {
    await setup(page);
    await page.clock.install();
    await page.goto(link(need));
    await page.getByRole('button', { name: 'Send Code', exact: true }).click();
    await page.locator('input[maxlength="6"]').fill('123456');
    await page.getByRole('button', { name: 'Verify', exact: true }).click();
    const back = page.getByRole('link', { name: 'Return to toy.az', exact: true });
    await expect(back).toHaveAttribute('href', returnTo);
    await page.clock.runFor(2999);
    expect(page.url()).toContain('/settings/verification');
    await page.clock.runFor(1);
    await expect(page).toHaveURL(returnTo);
  });
}

test('invalid request has no external return and does not initiate sign-in', async ({ page }) => {
  await setup(page, { signedIn: false, reject: true });
  await page.goto(link());
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to open verification' })).toContainText('This link is invalid');
  await expect(page.getByRole('link', { name: 'Return to toy.az' })).toHaveCount(0);
  expect(page.url()).toContain('/settings/verification');
});

test('duplicate return parameters fail closed', async ({ page }) => {
  await setup(page);
  await page.goto(`${link()}&return_to=https://example.com/other`);
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to open verification' })).toContainText('This link is invalid');
});

test('failed code and an unrelated verified field do not return', async ({ page }) => {
  await setup(page, { verified: 'email', failVerification: true });
  await page.goto(link('phone'));
  await page.getByRole('button', { name: 'Send Code', exact: true }).click();
  await page.locator('input[maxlength="6"]').fill('000000');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Return to toy.az' })).toHaveCount(0);
  await expect(page.locator('input[maxlength="6"]')).toBeVisible();
});

test('already verified user may pause and return manually', async ({ page }) => {
  await setup(page, { verified: 'email' });
  await page.clock.install();
  await page.goto(link('email'));
  await page.getByRole('button', { name: 'Stay on this page' }).click();
  await page.clock.runFor(5000);
  expect(page.url()).toContain('/settings/verification');
  await page.getByRole('link', { name: 'Return to toy.az', exact: true }).click();
  await expect(page).toHaveURL(returnTo);
});

test('ID remains pending until the server actually reports ID approval', async ({ page }) => {
  const user = await setup(page);
  await page.goto(link('id'));
  await expect(page.getByText('Online identity verification is not currently available.', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to toy.az' })).toHaveCount(0);
  user.id_verified_at = '2026-11-15T12:00:00Z';
  await page.getByRole('button', { name: 'Check status again' }).click();
  await expect(page.getByRole('link', { name: 'Return to toy.az', exact: true })).toBeVisible();
});

test('email can be supplied when the account has no email', async ({ page }) => {
  await setup(page, { missingEmail: true });
  await page.goto(link('email'));
  await page.locator('input[type=email]').fill('review@example.com');
  await page.getByRole('button', { name: 'Send Code', exact: true }).click();
  await page.locator('input[maxlength="6"]').fill('123456');
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Return to toy.az', exact: true })).toBeVisible();
});

test('ordinary settings still shows both verification methods', async ({ page }) => {
  await setup(page);
  await page.goto('/en/settings/verification');
  await expect(page.getByRole('button', { name: 'Send Code', exact: true })).toHaveCount(2);
  await expect(page.getByRole('region', { name: 'Verification request' })).toHaveCount(0);
});

for (const lang of ['az', 'en', 'ru']) for (const width of [375, 1440]) for (const colorScheme of ['light', 'dark'] as const) {
  test(`visual ${lang} ${width} ${colorScheme}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme });
    await page.addInitScript(theme => localStorage.setItem('alertaz-theme', theme), colorScheme);
    await setup(page);
    await page.goto(link('phone', lang));
    await expect(page.locator('section[aria-label]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${lang}-${width}-${colorScheme}.png`), fullPage: true });
  });
}

for (const lang of ['az', 'en', 'ru']) for (const width of [375, 1440]) for (const state of ['complete', 'invalid', 'id', 'missing-email', 'load-error', 'long-name']) {
  test(`state ${state} ${lang} ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.install();
    await setup(page, {
      verified: state === 'complete' || state === 'long-name' ? 'email' : undefined,
      reject: state === 'invalid', missingEmail: state === 'missing-email', failUser: state === 'load-error',
      name: state === 'long-name' ? 'Example'.repeat(12) : undefined,
    });
    await page.goto(link(state === 'id' ? 'id' : 'email', lang));
    if (state === 'invalid' || state === 'load-error') await expect(page.locator('[role=alert]').filter({ has: page.locator('h1') })).toBeVisible();
    else await expect(page.locator('section[aria-label]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`${state}-${lang}-${width}.png`), fullPage: true });
  });
}
