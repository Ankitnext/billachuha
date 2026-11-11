// Actual Chase canvas, 15-player fixture, hosted and APK-bundled sources. No
// accounts or live backend; only the automatic session restore is replaced.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http'),os=require('node:os'),{spawn}=require('node:child_process');
const backend=path.resolve(__dirname,'../../billachuha_backend/internal/playweb'),bundled=path.resolve(process.env.CHASE_BUNDLED_SOURCE||path.resolve(__dirname,'../../billachuha_app/app/src/main/assets/online_multiplayer'));
const errors=[],sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fixture=`
window.ChaseArtFixture={
 setup(){
  const roles=[...Array(7).fill('rat'),...Array(5).fill('cat'),...Array(3).fill('dog')];
  me={id:'p7'};
  const players=roles.map((role,i)=>({id:'p'+i,name:i===7?'Your Cat':'Player '+(i+1),role,x:600+i%5*90,y:620+Math.floor(i/5)*90,z:0,aimX:i%2?-.8:.8,aimY:.6,health:i===10?24:100,protected:i===4}));
  const draw=window.ModeArt.character,limbs=window.CharacterMotion.sideLimbs;this.calls={};this.poses={};
  this.originalDraw=draw;
  window.ModeArt.character=(c,p,color,pose,options)=>{this.lastDrawn=p.id;this.calls[p.id]={role:p.role,weapon:p.weapon,color,fullBody:options.fullBody};draw(c,p,color,pose,options);};
  window.CharacterMotion.sideLimbs=(c,pose,options)=>{this.lastPose=pose;limbs(c,pose,options);};
  this.show(players);screen('arena');fitArena();window.ChaseConnection?.ready();
 },
 show(players){receiveWorld({matchId:'character-fixture',width:2400,height:1600,remainingMs:300000,ended:false,players:players.map(Object.freeze),props:[],cheese:[{x:540,y:610,available:true}],ammo:[],healthBags:[],shots:[],bombs:[],scores:{rat:0,cat:0,dog:0},self:{id:me.id,role:'cat',health:100,ammo:0,moveSpeed:220,primaryReadyInMs:0,secondaryReadyInMs:0}});},
 walk(){this.show(world.players.map(p=>({...p,x:p.x+4})));},
 jump(){this.show(world.players.map(p=>({...p,z:p.id===me.id?65:0})));},
 invisible(){this.show(world.players.map(p=>({...p,z:0,invisible:p.id===me.id})));},
 inspect(){return{calls:this.calls,lastDrawn:this.lastDrawn,actors:JSON.stringify(world.players),canvas:{width:canvas.width,height:canvas.height}};},
 anatomy(){
  return ['rat','cat','dog'].map((role,index)=>{
   const c=document.createElement('canvas');c.width=160;c.height=160;const context=c.getContext('2d');
   const actor={role,aimX:1,aimY:0,weapon:role==='dog'?'pistol':null};
   const draw=fullBody=>{context.clearRect(0,0,160,160);context.save();context.translate(80,80);this.originalDraw(context,actor,roles[role].color,CharacterMotion.pose(),{fullBody});context.restore();return context.getImageData(0,0,160,160).data;};
   const full=draw(true),classic=draw(false);
   const count=(pixels,x,y,w,h)=>{let n=0;for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)if(pixels[(row*160+col)*4+3]>100)n++;return n;};
   const bounds=pixels=>{let top=160,bottom=0;for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(pixels[(y*160+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y);}return bottom-top+1;};
   return{role,height:bounds(full),classicHeight:bounds(classic),head:count(full,50,20,60,36),torso:count(full,68,56,24,34),arms:count(full,51,57,17,36)+count(full,92,57,17,36),legs:count(full,50,90,60,27),leftFoot:count(full,65,105,14,13),rightFoot:count(full,81,105,16,13)};
  });
 },
 atlas(){
  const sheet=document.createElement('canvas');sheet.id='character-atlas';sheet.width=780;sheet.height=420;
  const c=sheet.getContext('2d');c.fillStyle='#14291e';c.fillRect(0,0,780,420);
  ['rat','cat','dog'].forEach((role,index)=>{c.save();c.translate(130+index*260,288);c.scale(2.5,2.5);this.originalDraw(c,{role,aimX:index===1?-1:1,aimY:0,weapon:role==='dog'?'pistol':null},roles[role].color,CharacterMotion.pose(),{fullBody:true});c.restore();c.fillStyle='#f2f3d9';c.textAlign='center';c.font='bold 20px system-ui';c.fillText(role.toUpperCase(),130+index*260,395);});
  return sheet.toDataURL('image/png');
 },
 pose(){return characterMotion.sample(me.id,world.players.find(p=>p.id===me.id),performance.now()/1000,{topDown:true,grounded:!world.players.find(p=>p.id===me.id).z,motion:!reducedMotion.matches});}
};
ChaseArtFixture.setup();`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/')){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"entries":[],"challenges":[]}');}
 const base=req.headers.cookie?.includes('apk=1')?bundled:backend;
 const relative=['/multiplayer','/multiplayer/app'].includes(url.pathname)?'index.html':url.pathname.replace(/^\/multiplayer\//,'');
 const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 let source=fs.readFileSync(file);if(relative==='game.js'){source=source.toString().replace(/restoreSession\(\);\s*$/,fixture);}
 res.writeHead(200,{'Cache-Control':'no-store','Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'})[path.extname(file)]||'text/plain'});res.end(source);
});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,profile=fs.mkdtempSync(path.join(os.tmpdir(),'bc-chase-art-'));
 const chrome=spawn(process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});let cdp;
 try{
  const address=await new Promise((resolve,reject)=>{let text='';const timeout=setTimeout(()=>{clearInterval(poll);reject(Error('Browser startup: '+text));},15000);const poll=setInterval(()=>{const file=path.join(profile,'DevToolsActivePort');if(fs.existsSync(file)){const [port,route]=fs.readFileSync(file,'utf8').trim().split(/\r?\n/);clearTimeout(timeout);clearInterval(poll);resolve('ws://127.0.0.1:'+port+route);}},100);chrome.stderr.on('data',c=>text+=c);chrome.on('error',reject);});
  cdp=new WebSocket(address);await new Promise((resolve,reject)=>{cdp.onopen=resolve;cdp.onerror=reject;});let id=0;const pending=new Map();
  cdp.onmessage=e=>{const data=JSON.parse(e.data);if(data.id){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);data.error?p.reject(Error(JSON.stringify(data.error))):p.resolve(data.result);}if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);};
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{pending.set(++id,{resolve,reject});cdp.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});
  const {targetId}=await send('Target.createTarget',{url:'about:blank'}),{sessionId}=await send('Target.attachToTarget',{targetId,flatten:true}),call=(method,params={})=>send(method,params,sessionId);
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
  const until=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(50);}throw Error('Timed out: '+expression);};
  await call('Runtime.enable');await call('Page.enable');await call('Network.enable');await call('Emulation.setFocusEmulationEnabled',{enabled:true});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('chase.has_seen_tutorial.v1','1');localStorage.setItem('chase.has_seen_controls.v1','1');"});
  const shots=path.join(__dirname,'screenshots');fs.mkdirSync(shots,{recursive:true});
  for(const apk of [false,true])for(const size of [{width:1280,height:800},{width:844,height:390},{width:390,height:844}]){
   await call('Network.setCookie',{name:'apk',value:apk?'1':'0',url:origin});await call('Emulation.setDeviceMetricsOverride',{...size,deviceScaleFactor:1,mobile:size.width<1000});
   await call('Page.navigate',{url:origin+(apk?'/multiplayer/app':'/multiplayer')});await until("document.readyState==='complete'&&!!window.ChaseArtFixture&&Object.keys(ChaseArtFixture.calls).length===15");
   const initial=await evaluate('ChaseArtFixture.inspect()');assert.equal(Object.keys(initial.calls).length,15);assert.equal(Object.values(initial.calls).filter(p=>p.weapon==='pistol').length,3);assert.equal(Object.values(initial.calls).filter(p=>p.role==='rat').length,7);
   assert.ok(Object.values(initial.calls).every(p=>p.fullBody===true),'Every Chase player must use the full-body profile');assert.equal(initial.lastDrawn,'p7','Your full body must remain visible in a crowd');
   for(const parts of await evaluate('ChaseArtFixture.anatomy()')){
    assert.ok(parts.height>=80&&parts.height>parts.classicHeight*1.5,parts.role+' must have a full-length silhouette');
    assert.ok(parts.torso>500&&parts.arms>40&&parts.legs>100&&parts.leftFoot>15&&parts.rightFoot>15,parts.role+' must visibly draw torso, arms, legs and both feet');
    assert.ok(parts.torso+parts.legs>parts.head*1.4,parts.role+' must not be dominated by its head');
   }
   const actors=initial.actors;await sleep(100);assert.equal(await evaluate('ChaseArtFixture.inspect().actors'),actors,'Rendering must not alter server positions');
   for(let i=0;i<6;i++){await evaluate('ChaseArtFixture.walk()');await sleep(60);}assert.ok(await evaluate('ChaseArtFixture.pose().speed>0'),'Horde gait follows Chase walking');
   await evaluate('ChaseArtFixture.jump()');await sleep(80);assert.ok(await evaluate('ChaseArtFixture.pose().tuck>0'),'Jump uses an airborne pose');
   await evaluate('ChaseArtFixture.invisible()');await sleep(80);
   await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await evaluate('ChaseArtFixture.walk()');await sleep(70);assert.equal(await evaluate('ChaseArtFixture.pose().swing'),0);await call('Emulation.setEmulatedMedia',{features:[]});
   await evaluate('ChaseArtFixture.show(world.players.map(p=>({...p,invisible:false,z:0})))');await sleep(100);
   const screenshot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(shots,`chase-horde-${apk?'app':'web'}-${size.width}.png`),Buffer.from(screenshot.data,'base64'));
   if(apk&&size.width===844){const atlas=await evaluate('ChaseArtFixture.atlas()');fs.writeFileSync(path.join(shots,'chase-full-body-characters.png'),Buffer.from(atlas.split(',')[1],'base64'));}
  }
  assert.deepEqual(errors,[]);console.log('PASS shared Horde artwork for 7 rats/5 cats/3 dogs, walking/jumping/invisibility/reduced motion, immutable server actors, browser and Android source at three viewport sizes.');
 }finally{if(cdp?.readyState===1){cdp.send(JSON.stringify({id:999999,method:'Browser.close'}));await sleep(500);cdp.close();}chrome.kill();server.closeAllConnections();server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;server.close();});
