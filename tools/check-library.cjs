// Source-only browser checks: no APK, live account or deployed server required.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),app=path.resolve(root,'../billachuha_app/app/src/main/assets/multiplayer');
const catalog=JSON.parse(fs.readFileSync(path.join(root,'games.json'),'utf8'));
const errors=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const json=data=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));};
 if(url.pathname==='/api/v1/stats/online')return json({playersOnline:2});
 if(url.pathname==='/site-config.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.BILLACHUHA_CONFIG={backendUrl:location.origin};');}
 if(url.pathname.startsWith('/auth/')){res.writeHead(401,{'Content-Type':'application/json'});return res.end('{"error":{"message":"Sign in"}}');}
 const native=url.pathname.startsWith('/assets/multiplayer/'),base=native?app:root;
 const file=path.resolve(base,'.'+(native?url.pathname.replace('/assets/multiplayer',''):url.pathname));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));
});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'bc-library-'));
 const chrome=spawn(process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});let cdp;
 try{
  const address=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>{clearInterval(poll);reject(Error('Browser startup: '+text));},15000);const poll=setInterval(()=>{const file=path.join(profile,'DevToolsActivePort');if(fs.existsSync(file)){const [port,route]=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);clearTimeout(timeout);clearInterval(poll);resolve('ws://127.0.0.1:'+port+route);}},100);chrome.stderr.on('data',c=>text+=c);chrome.on('error',reject);});
  cdp=new WebSocket(address);await new Promise((resolve,reject)=>{cdp.onopen=resolve;cdp.onerror=reject;});let id=0;const pending=new Map();
  cdp.onmessage=e=>{const data=JSON.parse(e.data);if(data.id){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);};
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});cdp.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
  const call=(method,params={})=>send(method,params,sessionId);
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const until=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(50);}throw Error('Timed out: '+expression);};
  const visit=async url=>{await call('Page.navigate',{url:origin+url});await until('location.href==='+JSON.stringify(origin+url)+"&&document.readyState==='complete'");};
  await call('Runtime.enable');await call('Page.enable');await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  for(const size of [{width:1280,height:900},{width:390,height:844},{width:320,height:568}]){
   await call('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:true});await visit('/index.html');
   assert.deepEqual(await evaluate("[...document.querySelectorAll('[data-category]')].map(b=>b.dataset.category)"),['all','solo','multiplayer','mixed']);
   assert.equal(await evaluate("document.querySelectorAll('#gameGrid [data-game-id]').length"),11);
   for(const category of ['solo','multiplayer','mixed']){
    await evaluate(`document.querySelector('[data-category=${category}]').click()`);
    const expected=catalog.filter(g=>g.category===category).map(g=>g.id);
    assert.deepEqual(await evaluate("[...document.querySelectorAll('#gameGrid [data-game-id]:not([hidden])')].map(c=>c.dataset.gameId)"),expected);
   }
   assert.equal(await evaluate("document.querySelectorAll('#gameGrid [data-game-id=moving-stairs]').length"),1);
   assert.equal(await evaluate("document.querySelectorAll('#gameGrid [data-game-id=fighting-arena]').length"),1);
   await evaluate("document.getElementById('searchBar').value='fighting';document.getElementById('searchBar').dispatchEvent(new Event('input'))");
   assert.equal(await evaluate("document.querySelectorAll('#gameGrid .catalog-card:not([hidden])').length"),1);
   await call('Page.reload');await until("document.readyState==='complete'&&document.getElementById('searchBar')?.value==='fighting'");
   assert.equal(await evaluate("document.querySelector('[data-category=mixed]').getAttribute('aria-pressed')"),'true');
   await evaluate("document.getElementById('clear-filters').click();document.activeElement.blur()");
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),true,'Phone library should not overflow');
   const directory=path.join(__dirname,'screenshots');fs.mkdirSync(directory,{recursive:true});const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(directory,'library-'+size.width+'.png'),Buffer.from(shot.data,'base64'));
  }
  for(const prefix of ['/','/assets/multiplayer/'])for(const game of ['super-fight','snake-ladder'])for(const mode of ['solo','local']){
   await visit(prefix+game+'.html?mode='+mode);await until("!!document.querySelector('[name=mode]:checked')");
   assert.equal(await evaluate("document.querySelector('[name=mode]:checked').value"),mode,'Chosen native mode should reach the game');
   if(game==='snake-ladder')assert.equal(await evaluate("document.getElementById('online-entry').hidden"),false,'Same game keeps online play accessible');
   if(mode==='local'){
    if(game==='super-fight'){await evaluate("document.getElementById('start').click()");await until("!document.getElementById('battle').hidden");}
    else assert.equal(await evaluate("document.getElementById('player-choices').children.length"),2);
   }
  }
  assert.deepEqual(errors,[]);console.log('PASS exclusive Solo/Multiplayer/Mixed filters, unique game cards, search/reload, three screen sizes, website and Android local mode launches.');
 }finally{if(cdp?.readyState===1){cdp.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(500);cdp.close();}chrome.kill();server.closeAllConnections();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
