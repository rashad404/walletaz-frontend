// Usage: node tests/measure-fast-oauth-popups.cjs [private-session.json]
// Optional session file must contain {token}; its contents are never printed.
const {chromium,request}=require('@playwright/test');
const fs=require('node:fs');
const privateSession=process.argv[2]?JSON.parse(fs.readFileSync(process.argv[2],'utf8')):null;
const blocked=/googletagmanager|google-analytics|analytics.google|doubleclick|connect.facebook|facebook.com\/tr|clarity.ms|hotjar|analytics.tiktok/;
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 let cookies=[];
 if(privateSession){
  const api=await request.newContext();
  const bridge=await api.post('https://kimlik.az/api/session',{headers:{Origin:'https://kimlik.az',Authorization:`Bearer ${privateSession.token}`}});
  if(bridge.status()!==204)throw Error(`Session bridge status ${bridge.status()}`);
  cookies=(await api.storageState()).cookies;
  if(!cookies.some(c=>c.name==='__Host-kimlik_auth'&&c.httpOnly&&c.secure))throw Error('Missing protected session');
  cookies.push({name:'kimlik_session',value:'1',domain:'kimlik.az',path:'/',secure:true,sameSite:'Lax',expires:Math.floor(Date.now()/1000)+3600});
  await api.dispose();
 }
 const results=[];
 for(const site of ['toy.az','wisher.az'])for(let run=0;run<=3;run++){
  if(!privateSession&&run===0)continue;
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width:1440,height:1000}});
  await context.route('**/*',r=>blocked.test(r.request().url())?r.abort():r.continue());
  if(privateSession){await context.addCookies(cookies);await context.addInitScript(token=>{if(location.origin==='https://kimlik.az')localStorage.setItem('token',token)},privateSession.token)}
  const messages=[];await context.exposeBinding('__recordOAuthType',(_source,type)=>{messages.push(type)});
  await context.addInitScript(()=>{window.addEventListener('message',event=>{if(event.origin===location.origin&&typeof event.data?.type==='string')window.__recordOAuthType(event.data.type)})});
  const page=await context.newPage();await page.goto(`https://${site}`);await page.waitForLoadState('networkidle');
  const docs=[],scripts=[];let start=0;context.on('response',r=>{if(r.request().isNavigationRequest()||/kimlik/.test(new URL(r.url()).pathname))docs.push({path:new URL(r.url()).origin+new URL(r.url()).pathname,status:r.status(),elapsed:Date.now()-start,requestTime:r.request().timing().responseStart});if(r.request().resourceType()==='script'&&new URL(r.url()).hostname==='kimlik.az')scripts.push(new URL(r.url()).pathname)});
  start=Date.now();const opened=page.waitForEvent('popup');
  await page.getByRole(site==='toy.az'?'button':'link',{name:'Daxil ol',exact:true}).click();
  const popup=await opened;
  if(privateSession){
   if(run===0){
    // Establish real consent once for a new test identity. It is not a timing run.
    await Promise.race([popup.waitForEvent('close'),popup.getByRole('button',{name:/^(İcazə ver|Davam et)$/}).waitFor({timeout:10000})]);
    if(!popup.isClosed())await popup.getByRole('button',{name:/^(İcazə ver|Davam et)$/}).click();
   }
   if(!popup.isClosed())await popup.waitForEvent('close',{timeout:15000});
   const close=Date.now()-start;
   for(let wait=0;wait<20&&!messages.length;wait++)await new Promise(resolve=>setTimeout(resolve,50));
   if(!messages.includes(`${site==='toy.az'?'toy':'wisher'}:auth:success`))throw Error(`Partner did not confirm success: ${site}`);
   if(run>0)results.push({site,run,signedIn:true,close,success:true,documents:docs,kimlikScripts:scripts});
  }else{
   await popup.locator('input[type=email]').waitFor({state:'visible',timeout:15000});const input=Date.now()-start;
   await popup.waitForLoadState('networkidle');results.push({site,run,signedIn:false,input,idle:Date.now()-start,documents:docs});
  }
  await context.close();
 }
 await browser.close();console.log(JSON.stringify(results,null,2));
})().catch(error=>{console.error(error.message);process.exit(1)});
