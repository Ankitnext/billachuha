// Real browser touch contacts: hold movement, tap actions, release each finger.
// Source-only fixtures expose controller state; no accounts or live server.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb'),offline=path.resolve(root,'../billachuha_app/app/src/main/assets/long_run');
const cases=[
 {name:'Zombie Horde',url:'/multiplayer/modes?game=zombie-horde',stick:'move',buttons:['jump','fire','jet']},
 {name:'Zombie Horde custom HUD',url:'/multiplayer/modes?game=zombie-horde',stick:'move',buttons:['jump','fire','jet'],custom:true},
 {name:'Capture the Zone',url:'/multiplayer/modes?game=zombie-horde&variant=capture',stick:'move',buttons:['jump','fire','jet']},
 {name:'Arena Blitz',url:'/multiplayer/modes?game=arena-blitz',stick:'move',buttons:['jet','fire','grenade']},
 {name:'Chase web',url:'/multiplayer',stick:'joystick',buttons:['primary','secondary']},
 {name:'Chase app',url:'/multiplayer/app',stick:'joystick',buttons:['primary','secondary']},
 {name:'Long Survival web',url:'/index4.html',stick:'joystick-container',buttons:['jumpBtn']},
 {name:'Long Run app',url:'/offline/index.html',stick:'joystick-container',buttons:['jumpBtn'],native:true},
 {name:'Sky Siege',url:'/sky-siege.html',stick:'move-stick',buttons:['jump','place','cycle']},
 {name:'Kitchen Heist',url:'/kitchen-heist.html',stick:'move-stick',buttons:['use-tool','cycle-tool','sprint']},
 {name:'Snake & Ladder',url:'/snake-ladder.html',stick:'joystick-container',buttons:['jump-button','ability-button']},
 {name:'Trap Escape',url:'/trap-escape.html',stick:'move-stick',buttons:['jump-button','drop-button']},
 {name:'Cat Chase',url:'/cat-chase.html',stick:'move-stick',buttons:['jump-button','pounce-button']},
 {name:'Fighting Arena',url:'/super-fight.html',stick:'stick-one',buttons:['fight-0-attack','fight-0-sp1','fight-0-block']},
 {name:'Fighting Arena local P2',url:'/super-fight.html?local',stick:'stick-two',buttons:['fight-1-attack','fight-1-sp1','fight-1-block']},
 {name:'Dungeon Dash',url:'/dungeon-dash.html',stick:'joystick-container',buttons:['jump','fire','swap']}
].filter(c=>!process.argv[2]||c.name.toLowerCase().includes(process.argv[2].toLowerCase()));
async function main(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[],failures=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{for(const k of ['chase.has_seen_tutorial.v1','chase.has_seen_controls.v1','sky-siege.tutorial.v1','kitchen-heist.tutorial.v1'])localStorage.setItem(k,'1');});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='multitouch.test')return route.abort();
  const online=url.pathname.startsWith('/multiplayer'),native=url.pathname.startsWith('/offline/'),base=online?backend:native?offline:root;
  let relative=online?url.pathname.replace(/^\/multiplayer\/?/,''):native?url.pathname.slice(9):url.pathname.slice(1);if(!relative||relative==='app')relative='index.html';if(relative==='modes')relative='modes.html';
  const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing source'});
  let body=fs.readFileSync(file),hook;
  if(relative==='modes.js')body=body.toString().replace(/\nboot\(\);/,`\nshow('home');window.TouchFixture={setup(role='cat'){me={id:'one'};world={matchId:'touch',level:1,width:2400,height:1800,remainingMs:300000,ended:false,mode:{players:[{id:'one',role,name:'Test',team:'alpha',x:400,y:400,z:0,hp:100,maxHp:100,fuel:100,maxFuel:100,aimX:1,aimY:0,weapon:'pistol',magazine:10,reserve:50,grenades:3,canJump:true}],enemies:[],map:[],pickups:[],effects:[],shots:[],feed:[],decoys:[],phase:'fighting',wave:1,alpha:0,bravo:0,left:12}};receivedAt=performance.now()+1000000;showArena();},state(){return input()},update(value){Object.assign(world.mode.players[0],value);showArena();}};`);
  if(online&&relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,`screen('home');window.TouchFixture={setup(){me={id:'one'};const self={id:'one',role:'rat',name:'Test',x:600,y:600,z:0,health:100,primaryReadyInMs:0,secondaryReadyInMs:0,aimX:1,aimY:0};receiveWorld({matchId:'touch',width:2400,height:1800,remainingMs:300000,ended:false,scores:{rat:0,cat:0,dog:0},players:[self],self,props:[],cheese:[],ammo:[],healthBags:[],shots:[]});screen('arena');drawHUD();window.ChaseConnection?.ready();fitArena();},state(){return {...movementAxis(),primary:held('primary'),secondary:held('secondary')}}};`);
  if(relative==='sky-siege.js')hook=`window.TouchFixture={setup:start,state(){return{x:joy,jump:held.size>0,z:run?.player.y}},update(){updateHUD()}};`;
  if(relative==='kitchen-heist/menu.js')hook=`window.TouchFixture={setup(){begin(0)},state(){return{x:input.axis.x,sprint:input.sprint}}};`;
  if(relative==='snake-ladder.js')hook=`window.TouchFixture={setup(){game=new Core.Race({mode:'solo',players:[{name:'Test',role:'cat'}],seed:7});game.roll(1);game.startStage();renderState();$('action-canvas').focus()},state(){return{x:joystick,jump:held.has('jump')}}};`;
  if(relative==='trap-escape/menu.js'||relative==='cat-chase.js')hook=`window.TouchFixture={setup(){start(0)},state(){return{x:input.axis,...input.touch}}};`;
  if(relative==='super-fight/menu.js')hook=`window.TouchFixture={setup(){if(location.search.includes('local'))document.querySelector('[name="mode"][value="local"]').checked=true;start()},state(){const i=location.search.includes('local')?1:0;return{x:input.axes[i].x,...input.touch[i]}},get input(){return input}};`;
  if(relative==='dungeon-dash.js')hook=`window.TouchFixture={setup:start,state(){return{x:joy,jump:held.has('jump'),fire:held.has('fire')}}};`;
  if(hook)body=body.toString().replace(/\}\)\(\);\s*$/,hook+'})();');
  if(relative==='index4.html'){body=body.toString();const i=body.lastIndexOf('\n};');body=body.slice(0,i)+`\nwindow.TouchFixture={setup(){x=6000;y=4000;health=100;gameOver=false;worldBombs=[];staticBombs=[];chasingBombs=[];coinBombs=[];},state(){return{x:joyX,y:joyY,z}}};`+body.slice(i);}
  if(native&&relative==='game.js')body=body.toString().replace(/\}\)\(\);\s*$/,`window.TouchFixture={setup(){},state(){return{x:joyX,y:joyY,z,mode}}};})();`);
  await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream',body});
 });
 const cdp=await context.newCDPSession(page),touch=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
 const send=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
 const state=()=>page.evaluate(()=>TouchFixture.state());
 for(const c of cases)for(const size of [{width:390,height:844},{width:844,height:390}]){
  const label=c.name+' '+size.width;
  try{await page.setViewportSize(size);await page.goto('http://multitouch.test'+c.url);await page.waitForFunction(()=>!!window.TouchFixture);if(c.native)await page.locator('#primary-action').click();else await page.evaluate(()=>TouchFixture.setup());await page.waitForTimeout(150);
   if(c.custom){await page.locator('#arena-edit-hud').click();await page.locator('.control-settings [data-opacity]').fill('60');await page.locator('.control-settings [data-save]').click();await page.locator('.control-settings').waitFor({state:'hidden'});}
   await page.evaluate(()=>{window.touchTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture','touchstart','touchend'])document.addEventListener(type,e=>touchTrace.push({type,id:e.pointerId,target:e.target.closest('button')?.id||e.target.id,changed:e.changedTouches&&[...e.changedTouches].map(t=>t.identifier)}),true);});
   const b=await page.locator('#'+c.stick).boundingBox();assert.ok(b,label+' joystick visible');const move=touch(1,b.x+b.width*.82,b.y+b.height*.5);
   for(const id of c.buttons){
    const action=await page.locator('#'+id).boundingBox();assert.ok(action,label+' '+id+' visible');const press=touch(2,action.x+action.width/2,action.y+action.height/2);
    await send('touchStart',[move]);assert.ok((await state()).x>.4,label+' joystick starts');
    for(let i=0;i<3;i++){
     await send('touchStart',[move,press]);await page.waitForTimeout(40);assert.ok((await state()).x>.4,label+' '+id+' press stops movement');
     if(id==='jump'&&c.url.includes('/modes'))assert.equal((await state()).jump,true,label+' Jump activates while moving');
     if(c.url.includes('/modes'))await page.evaluate(()=>TouchFixture.update({canJump:false,jumpIn:.3,z:60,fuel:80}));
     await send('touchEnd',[press]);await page.waitForTimeout(40);assert.ok((await state()).x>.4,label+' '+id+' release stops movement');
    }
    // Losing one action's capture must leave the movement finger alone.
    await send('touchStart',[move,press]);
    await send('touchMove',[move,{...press,x:press.x+.5}]);
    const released=await page.evaluate(id=>{const b=document.getElementById(id),p=touchTrace.findLast(e=>e.type==='pointerdown'&&e.target===id)?.id;if(p&&b.hasPointerCapture(p)){b.releasePointerCapture(p);return p;}return null;},id);
    await send('touchMove',[move,{...press,x:press.x+1}]);await page.waitForTimeout(40);
    if(released)assert.ok(await page.evaluate(p=>touchTrace.some(e=>e.type==='lostpointercapture'&&e.id===p),released),label+' capture loss delivered');
    assert.ok((await state()).x>.4,label+' '+id+' lost capture clears unrelated movement');
    await send('touchEnd',[]);assert.ok(Math.abs((await state()).x)<.01,label+' movement finger release');
   }
   await send('touchStart',[move]);assert.ok((await state()).x>.4,label+' movement starts before resize');
   await page.setViewportSize({width:size.width,height:size.height-24});await page.waitForTimeout(100);
   assert.ok((await state()).x>.4,label+' viewport height change drops held joystick');
   await send('touchEnd',[]);assert.ok(Math.abs((await state()).x)<.01,label+' releases after resize');
   const resized=await page.locator('#'+c.stick).boundingBox(),nextMove=touch(1,resized.x+resized.width*.82,resized.y+resized.height/2);
   await send('touchStart',[nextMove]);assert.ok((await state()).x>.4,label+' movement restarts');
   await page.setViewportSize({width:size.height,height:size.width});await page.waitForTimeout(100);assert.ok(Math.abs((await state()).x)<.01,label+' rotation releases input');await send('touchEnd',[]);
   console.log('PASS '+label+': repeated action taps and viewport height changes preserve held movement');
  }catch(e){failures.push(label+': '+e.message);console.error('FAIL '+failures.at(-1));console.error(await page.evaluate(()=>window.touchTrace?.slice(-8)));await send('touchEnd',[]).catch(()=>{});}
 }
 assert.deepEqual(errors,[],'page errors');assert.deepEqual(failures,[],'multi-touch failures');await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
