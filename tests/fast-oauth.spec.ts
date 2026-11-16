import { test, expect } from '@playwright/test';
const query = new URLSearchParams({client_id:'00000000-0000-0000-0000-000000000000',redirect_uri:'https://toy.az/auth/kimlik/callback',response_type:'code',state:'test-state',code_challenge:'test-challenge',code_challenge_method:'S256'});
const authorize = `/oauth/authorize?${query}`;
const login = `/login?${new URLSearchParams({return_url:authorize})}`;
test.beforeEach(async ({context}) => {
  await context.route('**/*', route => /googletagmanager|google-analytics|analytics.google|doubleclick|connect.facebook|facebook.com\/tr|clarity.ms|hotjar/.test(route.request().url()) ? route.abort() : route.continue());
});
for (const prefix of ['', '/az', '/en', '/ru']) {
  test(`signed-out ${prefix || '/'} redirects directly with intact OAuth parameters`, async ({request}) => {
    const response = await request.get(`${prefix}${authorize}`, {maxRedirects:0});
    expect(response.status()).toBe(307);
    const destination = new URL(response.headers().location, 'http://localhost:3312');
    expect(destination.pathname).toBe(`${['/en','/ru'].includes(prefix) ? prefix : ''}/login`);
    const returned = new URL(destination.searchParams.get('return_url')!);
    expect(returned.pathname).toBe(`${prefix}/oauth/authorize`);
    expect(returned.searchParams.toString()).toBe(query.toString());
    expect(response.headers()['cache-control']).toContain('no-store');
  });
}
for(const prefix of ['', '/az']) {
  test(`${prefix || '/'} login works without JavaScript or locale redirects`, async ({browser,request}) => {
    const response = await request.get(`${prefix}${login}`, {maxRedirects:0});
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('type="email"');
    const context = await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'});
    await context.route('**/*',r=>new URL(r.request().url()).hostname==='localhost'?r.continue():r.abort());
    const page=await context.newPage();await page.goto(`http://localhost:3312${prefix}${login}`);
    await expect(page.locator('input[type=email]')).toBeVisible();await context.close();
  });
}
test('no authorize bundle, browser metadata requests, prefetches or Telegram until tapped', async ({page}) => {
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
  await page.goto(authorize);await expect(page.locator('input[type=email]')).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(requests.filter(u=>/fonts.googleapis.com|fonts.gstatic.com|telegram|\/api\/config|\/apple\/availability|\/oauth\/client|\/register|\/forgot-password|chunks\/app\/.*oauth.*authorize/.test(u))).toEqual([]);
  await page.getByRole('button',{name:'Telegram',exact:true}).click();
  await expect.poll(()=>requests.some(u=>u.includes('telegram-widget.js'))).toBe(true);
});
test('stale hint without token recovers to login',async({context,page})=>{
  await context.addCookies([{name:'kimlik_session',value:'1',url:'http://localhost:3312'}]);
  await page.goto(authorize);await expect(page.locator('input[type=email]')).toBeVisible();
  expect((await context.cookies()).some(c=>c.name==='kimlik_session')).toBe(false);
});
test('old localStorage-only session is bridged then expired token is cleared without a loop',async({context,page})=>{
  await page.addInitScript(()=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('token','expired-test-token');sessionStorage.setItem('seeded','1')}});
  let checked=0;
  await context.route('**/api/oauth/authorize?*',r=>{checked++;return r.fulfill({status:401,json:{message:'Unauthenticated'}})});
  await page.goto(authorize);
  await expect.poll(()=>checked).toBe(1);
  await expect(page.locator('input[type=email]')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
  expect((await context.cookies()).some(c=>c.name==='kimlik_session')).toBe(false);
});
test('successful email login writes hint before returning to consent',async({context,page})=>{
  await context.route('**/api/auth/login',r=>r.fulfill({json:{status:'success',data:{token:'test-only-token'}}}));
  let bearer='';await context.route('**/api/oauth/authorize?*',r=>{bearer=r.request().headers().authorization;return r.fulfill({status:400,json:{message:'Test consent response'}})});
  await page.goto(login.replace('test-state','test-state%26prompt%3Dconsent'));await page.locator('input[type=email]').fill('test@example.com');await page.locator('input[type=password]').fill('test-password');await page.locator('button[type=submit]').click();
  await expect.poll(()=>bearer).toBe('Bearer test-only-token');
  expect((await context.cookies()).find(c=>c.name==='kimlik_session')?.value).toBe('1');
});
test('signed-in hint preserves both authorize paths without a locale hop',async({request})=>{
  for(const prefix of ['', '/az']) {
    const response=await request.get(`${prefix}${authorize}`,{maxRedirects:0,headers:{Cookie:'kimlik_session=1'}});
    expect(response.status()).toBe(200);
  }
});
test('saved language and partner hint are respected on the direct redirect',async({request})=>{
  for(const [cookie,hint,expected] of [['NEXT_LOCALE=ru','en','ru'],['','en','en']]) {
    const response=await request.get(`${authorize}&hl=${hint}`,{maxRedirects:0,headers:{Cookie:cookie}});
    expect(new URL(response.headers().location,'http://localhost:3312').pathname).toBe(`/${expected}/login`);
  }
});
test('standalone login does not prefetch registration or password reset',async({page})=>{
  const requests:string[]=[];page.on('request',r=>requests.push(r.url()));
  await page.goto('/login');await page.waitForLoadState('networkidle');
  expect(requests.filter(u=>/\/register|\/forgot-password/.test(u))).toEqual([]);
});
test('shared public shell contains no flow state or PKCE and is identical across flows',async({request})=>{
  const a=await request.get(login);
  const b=await request.get(login.replace('test-state','different-private-state').replace('test-challenge','different-private-challenge'));
  const first=await a.text(),second=await b.text();
  expect(first.includes('test-state')).toBe(false);expect(first.includes('test-challenge')).toBe(false);
  expect(second).not.toContain('different-private-state');expect(second).not.toContain('different-private-challenge');
  expect(first === second).toBe(true);expect(first).toContain('Test partner');
  expect(first).toContain('<style');expect(first).not.toMatch(/rel="stylesheet"/);
});
test('session bridge rejects cross-origin requests and invalid bearer credentials',async({request})=>{
  await expect((await request.post('/api/session',{headers:{Origin:'https://evil.test',Authorization:'Bearer test-only-token'}})).status()).toBe(403);
  await expect((await request.post('/api/session',{headers:{Origin:'http://localhost:3312',Authorization:'Bearer bad-token'}})).status()).toBe(401);
});
test('validated HttpOnly session completes authorization with one 302 and no page',async({request})=>{
  const bridge=await request.post('/api/session',{headers:{Origin:'http://localhost:3312',Authorization:'Bearer test-only-token'}});
  expect(bridge.status()).toBe(204);expect(bridge.headers()['set-cookie']).toContain('HttpOnly');expect(bridge.headers()['set-cookie']).toContain('Secure');
  const response=await request.get(authorize,{maxRedirects:0,headers:{Cookie:'kimlik_session=1; __Host-kimlik_auth=test-only-token'}});
  expect(response.status()).toBe(302);const returned=new URL(response.headers().location);
  expect(returned.searchParams.get('state')).toBe('test-state');expect(returned.searchParams.get('code')).toBe('test-code');
  expect(response.headers()['cache-control']).toContain('no-store');expect(await response.text()).not.toContain('<html');
});
test('a hint alone, invalid bearer or explicit consent cannot take the shortcut',async({request})=>{
  for(const cookie of ['kimlik_session=1','kimlik_session=1; __Host-kimlik_auth=bad-token','__Host-kimlik_auth=test-only-token']) {
    const response=await request.get(authorize,{maxRedirects:0,headers:{Cookie:cookie}});expect(response.status()).not.toBe(302);
  }
  const response=await request.get(authorize+'&prompt=consent',{maxRedirects:0,headers:{Cookie:'kimlik_session=1; __Host-kimlik_auth=test-only-token'}});expect(response.status()).toBe(200);
});
test('direct shell URLs cannot poison the static router payload with query data',async({request})=>{
  const redirect=Buffer.from('https://toy.az/auth/kimlik/callback').toString('base64url');
  const response=await request.get(`/login-shell/az/00000000-0000-0000-0000-000000000000/${redirect}?state=private`,{maxRedirects:0});
  expect(response.status()).toBe(307);expect(response.headers().location).not.toContain('private');
});
