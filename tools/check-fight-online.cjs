// Two isolated browsers against a loopback protocol fixture running the exact
// embedded combat rules. Go manager/API tests cover production authorization.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),crypto=require('node:crypto'),os=require('node:os'),vm=require('node:vm'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),shared=path.resolve(root,'../billachuha_backend/internal/playweb');
const rules=path.resolve(root,'../billachuha_backend/internal/fightengine/rules');
const users=[{id:'a',name:'Alice'},{id:'b',name:'Bob'}],errors=[],sockets=new Map(),tickets=new Map();
let room=null,engine=null,world=null,lastInputs=[{},{}],connections=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function frame(data){const b=Buffer.from(JSON.stringify(data));const h=Buffer.alloc(b.length<126?2:4);h[0]=129;h[1]=b.length<126?b.length:126;if(b.length>=126)h.writeUInt16BE(b.length,2);return Buffer.concat([h,b]);}
function sendWorld(){if(engine){const state=JSON.parse(engine.fightView());world={fight:{state,players:room.players},ended:state.phase==='matchover'};}for(const [s]of sockets){s.write(frame({type:'room.state',room}));if(world)s.write(frame({type:'match.state',match:world}));}}
function newEngine(){engine=vm.createContext({});for(const n of ['physics','fighter','combat','powers','particles','bot','engine','online-server'])vm.runInContext(fs.readFileSync(path.join(rules,n+'.js'),'utf8'),engine);engine.fightInit(JSON.stringify(room.players.map(p=>p.fighter)),42);room.state='running';}
async function body(req){let s='';for await(const c of req)s+=c;return s?JSON.parse(s):{};}
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),user=users[Number(req.headers.cookie?.match(/fixture=(\d)/)?.[1]||0)];
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
 if(url.pathname.startsWith('/auth/')||url.pathname.startsWith('/api/')){
  assert.equal(req.headers['x-chase-web']||req.headers['x-chase-app'],'1');
  if(['/auth/web/session','/auth/me'].includes(url.pathname))return json(200,{user});
  if(url.pathname==='/api/v1/matchmaking'){
   const b=await body(req);assert.equal(b.game,'super-fight');
   if(!room){room={code:'abcd1234',game:'super-fight',state:'waiting',maxPlayers:2,players:[{...user,fighter:b.fighter}]};engine=null;world=null;}
   else if(!room.players.some(p=>p.id===user.id)){room.players.push({...user,fighter:b.fighter});newEngine();}
   sendWorld();return json(200,{room});
  }
  if(url.pathname.endsWith('/ticket')){const ticket=crypto.randomBytes(8).toString('hex');tickets.set(ticket,user.id);return json(201,{ticket,path:'/socket'});}
  if(url.pathname.endsWith('/leave')){if(room&&engine&&room.state==='running'){engine.fightFinish(user.id==='a'?1:0,'Opponent left');room.state='finished';sendWorld();}if(room?.state==='waiting')room=null;return json(200,{ok:true});}
  return json(404,{error:{message:'Missing fixture route'}});
 }
 let file=url.pathname.replace(/^\//,''),base=root;
 if(url.pathname.startsWith('/multiplayer/')){base=shared;file=url.pathname==='/multiplayer/app'?'super-fight.html':url.pathname.replace('/multiplayer/','');}
 if(file==='site-config.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.BILLACHUHA_CONFIG={backendUrl:location.origin};');}
 const full=path.resolve(base,file);if(!full.startsWith(base+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml'})[path.extname(full)]||'text/plain');res.end(fs.readFileSync(full));
 }catch(e){errors.push(e.stack);res.writeHead(500);res.end(e.message);}});
server.on('upgrade',(req,s)=>{
 const key=new URL(req.url,'http://localhost').searchParams.get('ticket'),id=tickets.get(key);tickets.delete(key);if(!id)return s.destroy();
 s.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64')+'\r\n\r\n');sockets.set(s,id);connections++;sendWorld();let buffer=Buffer.alloc(0);
 s.on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);while(buffer.length>=2){const op=buffer[0]&15;let n=buffer[1]&127,offset=2;if(n===126){if(buffer.length<4)return;n=buffer.readUInt16BE(2);offset=4;}if(buffer.length<offset+4+n)return;const mask=buffer.subarray(offset,offset+4),b=Buffer.from(buffer.subarray(offset+4,offset+4+n));buffer=buffer.subarray(offset+4+n);if(op===8){s.end(Buffer.from([136,0]));return;}if(op!==1)continue;for(let i=0;i<n;i++)b[i]^=mask[i%4];const message=JSON.parse(b);assert.equal(message.type,'player.input');lastInputs[id==='a'?0:1]=message.fight;}});s.on('close',()=>sockets.delete(s));s.on('error',()=>{});
});
const tick=setInterval(()=>{if(engine&&room?.state==='running'){engine.fightStep(JSON.stringify(lastInputs),3);lastInputs.forEach(i=>{i.dashX=0;i.dashY=0;});sendWorld();}},50);
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'bc-fight-online-'));
 const executable=process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
 const chrome=spawn(executable,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-background-timer-throttling','--disable-renderer-backgrounding','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});let cdp;
 try{
  const address=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>{clearInterval(poll);reject(Error('Browser startup: '+text));},15000);const poll=setInterval(()=>{const file=path.join(profile,'DevToolsActivePort');if(fs.existsSync(file)){const [port,route]=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);clearTimeout(timeout);clearInterval(poll);resolve('ws://127.0.0.1:'+port+route);}},100);chrome.stderr.on('data',c=>text+=c);chrome.on('error',reject);});
  cdp=new WebSocket(address);await new Promise((resolve,reject)=>{cdp.onopen=resolve;cdp.onerror=reject;});let id=0;const pending=new Map();
  cdp.onmessage=e=>{const b=JSON.parse(e.data);if(b.id){const p=pending.get(b.id);if(!p)return;pending.delete(b.id);b.error?p.reject(Error(JSON.stringify(b.error))):p.resolve(b.result);}if(b.method==='Runtime.exceptionThrown')errors.push(b.params.exceptionDetails.exception?.description||b.params.exceptionDetails.text);};
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});cdp.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  const clients=[];
  for(let i=0;i<2;i++){
   const {browserContextId}=await send('Target.createBrowserContext'),{targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
   const c={send:(m,p)=>send(m,p,sessionId)};c.eval=async expression=>{const r=await c.send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};c.until=async e=>{for(let n=0;n<120;n++){if(await c.eval(e))return;await sleep(60);}throw Error('Timed out '+e+' '+await c.eval('document.body.innerText'));};c.click=id=>c.eval('document.getElementById('+JSON.stringify(id)+').click()');
   await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setCookie',{name:'fixture',value:String(i),url:origin});await c.send('Emulation.setFocusEmulationEnabled',{enabled:true});await c.send('Emulation.setDeviceMetricsOverride',{width:i?390:844,height:i?844:390,deviceScaleFactor:1,mobile:true});
   await c.send('Page.navigate',{url:origin+(i?'/multiplayer/app?game=super-fight-online':'/super-fight.html')});await c.until("document.readyState==='complete'&&!!window.SuperFight.FightOnline");clients.push(c);
  }
  const [a,b]=clients;
  await a.eval("document.querySelector('[name=mode][value=online]').click()");await a.click('start');await a.until("document.getElementById('online-status').textContent.includes('Searching')");assert.equal(room.state,'waiting');assert.equal(room.players.length,1);
  await a.click('cancel-online');await a.until("!document.getElementById('start').disabled");assert.equal(room,null,'Cancel removes queue membership');
  await a.click('start');await a.until("document.getElementById('online-status').textContent.includes('Searching')");await b.click('start');for(const c of clients)await c.until("!document.getElementById('battle').hidden&&document.getElementById('match-mode').textContent==='ONLINE 1v1'");
  await sleep(1400);
  const touchPoint=async(c,selector,fraction=.5)=>c.eval(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {id:1,x:r.left+r.width/2,y:r.top+r.height*${fraction}};})()`);
  for(const [index,action]of [[0,'punch'],[1,'kick']]){
   const c=clients[index];await c.send('Page.bringToFront');
   await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
   const point=await touchPoint(c,'#fight-0-'+action);
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
   for(let i=0;i<20&&!lastInputs[index][action];i++)await sleep(25);
   assert.equal(lastInputs[index][action],true,`The ${action} button sends its own input`);
   assert.ok(!lastInputs[index][action==='punch'?'kick':'punch']);
   await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }
  const duck=await touchPoint(b,'#stick-one',.85);
  await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[duck]});
  for(let i=0;i<20&&!vm.runInContext('fightGame.fighters[1].crouching',engine);i++)await sleep(25);
  assert.equal(vm.runInContext('fightGame.fighters[1].crouching',engine),true,'Joystick Down crouches in the online simulation');
  await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  for(let i=0;i<20&&vm.runInContext('fightGame.fighters[1].crouching',engine);i++)await sleep(25);
  assert.equal(vm.runInContext('fightGame.fighters[1].crouching',engine),false,'Releasing the stick stands up');
  await a.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyD',key:'d',windowsVirtualKeyCode:68});await b.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyA',key:'a',windowsVirtualKeyCode:65});await sleep(500);await a.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyD',key:'d',windowsVirtualKeyCode:68});await b.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyA',key:'a',windowsVirtualKeyCode:65});
  const positions=vm.runInContext('fightGame.fighters.map(f=>f.x)',engine);assert.ok(positions[0]>340&&positions[1]<1010,'Both players move their own fighter using P1 keys');
  await a.send('Input.dispatchKeyEvent',{type:'keyDown',code:'KeyG',key:'g',windowsVirtualKeyCode:71});await sleep(100);await a.send('Input.dispatchKeyEvent',{type:'keyUp',code:'KeyG',key:'g',windowsVirtualKeyCode:71});await sleep(650);assert.ok(vm.runInContext('fightGame.fighters[1].hp<100',engine),'An online blast damages the opponent');
  await b.eval('ChaseApp.pause()');await sleep(100);await b.eval('ChaseApp.resume()');await b.until("document.getElementById('online-connection').textContent.includes('LIVE')");
  const before=connections;for(const [s,id]of sockets)if(id==='a')s.destroy();await a.until("document.getElementById('online-connection').textContent.includes('LIVE')");for(let i=0;i<40&&connections===before;i++)await sleep(80);assert.ok(connections>before,'Socket reconnects');
  for(let round=0;round<2;round++){
   vm.runInContext('fightGame.fighters[1].hp=0;fightGame.fighters[1].ko=true;',engine);for(const c of clients)await c.until("document.getElementById('results-dialog').open");
   if(round===0){engine.fightStep(JSON.stringify([{},{}]),240);sendWorld();for(const c of clients)await c.until("!document.getElementById('results-dialog').open");engine.fightStep(JSON.stringify([{},{}]),75);sendWorld();}
  }
  for(const c of clients){await c.until("document.getElementById('result-tag').textContent==='MATCH COMPLETE'");assert.equal(await c.eval("document.getElementById('result-score').textContent"),'2 — 0');}
  const shots=path.join(__dirname,'screenshots');fs.mkdirSync(shots,{recursive:true});for(let i=0;i<clients.length;i++){const shot=await clients[i].send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(shots,'fight-online-'+i+'.png'),Buffer.from(shot.data,'base64'));}
  assert.deepEqual(errors,[]);console.log('PASS human queue, cancel, website/Android clients, both input identities, reconnect, shared rounds and match result.');
 }finally{if(cdp?.readyState===1){await new Promise(r=>{cdp.onclose=r;cdp.send(JSON.stringify({id:999999,method:'Browser.close'}));setTimeout(r,1500);});}chrome.kill();for(const [s]of sockets)s.destroy();clearInterval(tick);server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;clearInterval(tick);server.close();});
