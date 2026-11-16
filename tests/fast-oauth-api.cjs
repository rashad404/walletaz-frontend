const http=require('node:http');
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost:3313');let body='';for await(const chunk of req)body+=chunk;
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 if(url.pathname==='/api/config')return json(200,{data:{app_name:'Kimlik.az',features:{wallet_enabled:false}}});
 if(url.pathname==='/api/auth/apple/availability')return json(200,{data:{enabled:true}});
 if(url.pathname==='/api/oauth/client')return json(200,{data:{name:'Test partner',logo_url:null,website_url:'https://toy.az'}});
 if(url.pathname==='/api/user')return req.headers.authorization==='Bearer test-only-token'?json(200,{data:{id:1}}):json(401,{});
 if(url.pathname==='/api/oauth/authorize/fast'){
  if(req.headers.authorization!=='Bearer test-only-token')return json(401,{});
  const q=JSON.parse(body);if(q.prompt||q.scope?.includes('wallet'))return json(409,{status:'consent_required'});
  return json(200,{redirect_uri:q.redirect_uri+'?'+new URLSearchParams({code:'test-code',state:q.state})});
 }
 json(404,{});
}).listen(3313,'localhost');
