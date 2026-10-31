// Exercise the other HUD-enabled games with intercepted local source only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const backend=path.resolve(root,'../billachuha_backend/internal/playweb'),offline=path.resolve(root,'../billachuha_app/app/src/main/assets/long_run');
const cases=[
 {name:'Kitchen Heist',url:'/kitchen-heist.html',canvas:'#stage',view:'#viewport',setup:()=>HeistFixture.begin(0),open:'#edit-hud'},
 {name:'Sky Siege',url:'/sky-siege.html',canvas:'#game',view:'#viewport',setup:()=>SiegeFixture.start(),open:'#edit-hud'},
 {name:'Snake & Ladder',url:'/snake-ladder.html',canvas:'#action-canvas',view:'#action-viewport',setup:()=>ControlFixture.setup(),open:'#edit-hud'},
 {name:'Fight solo',url:'/super-fight.html',canvas:'#arena',view:'#viewport',setup:()=>ControlFixture.start(),open:'#edit-hud'},
 {name:'Fight local',url:'/super-fight.html?local',canvas:'#arena',view:'#viewport',setup:()=>{document.querySelector('[name="mode"][value="local"]').checked=true;ControlFixture.start();},open:'#edit-hud'},
 {name:'Chase web',url:'/multiplayer',canvas:'#game',view:'.arena-wrap',setup:()=>ControlFixture.setup(),open:'#arena-edit-hud',legacy:true},
 {name:'Chase app',url:'/multiplayer/app',canvas:'#game',view:'.arena-wrap',setup:()=>ControlFixture.setup(),open:'#arena-edit-hud',legacy:true},
 {name:'Long Run app',url:'/offline/index.html',canvas:'#canvas',view:'#game-frame',setup:()=>LongRun.resume(),open:'#edit-hud',legacy:true}
];
async function main(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({hasTouch:true}),page=await context.newPage(),errors=[],failures=[];page.setDefaultTimeout(5000);
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{for(const key of ['chase.has_seen_tutorial.v1','chase.has_seen_controls.v1','kitchen-heist.tutorial.v1','sky-siege.tutorial.v1'])localStorage.setItem(key,'1');});
 await context.route('http://hud-games.test/**',async route=>{
  const url=new URL(route.request().url()),online=url.pathname.startsWith('/multiplayer'),native=url.pathname.startsWith('/offline/');
  const base=online?backend:native?offline:root;
  let relative=online?url.pathname.replace(/^\/multiplayer\/?/,''):native?url.pathname.slice(9):url.pathname.slice(1);
  if(!relative||relative==='app')relative='index.html';const file=path.resolve(base,relative);
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing local source'});
  let body=fs.readFileSync(file);
  if(relative==='kitchen-heist/menu.js')body=body.toString().replace(/\}\)\(\);\s*$/,'window.HeistFixture={begin,input};})();');
  if(relative==='sky-siege.js')body=body.toString().replace(/\}\)\(\);\s*$/,'window.SiegeFixture={start,settings};})();');
  if(relative==='snake-ladder.js')body=body.toString().replace(/\}\)\(\);\s*$/,"window.ControlFixture={settings:controlSettings,setup(){game=new Core.Race({mode:'solo',players:[{name:'Test',role:'rat'}],seed:7});game.roll(1);game.startStage();renderState();$('action-canvas').focus();}};})();");
  if(relative==='super-fight/menu.js')body=body.toString().replace(/\}\)\(\);\s*$/,'window.ControlFixture={input,start};})();');
  if(online&&relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,"screen('home');window.ControlFixture={setup(){me={id:'one'};receiveWorld({matchId:'hud',width:2400,height:1800,ended:false,props:[],cheese:[],ammo:[],shots:[],scores:{rat:0,cat:0,dog:0},players:[{id:'one',name:'Test',role:'rat',x:600,y:500,z:0,health:100,aimX:1,aimY:0}]});screen('arena');drawHUD();fitArena();}};");
  await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream',body});
 });
 const measure=c=>page.evaluate(({canvas,view})=>{const b=n=>{const r=document.querySelector(n).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};};return{canvas:b(canvas),view:b(view),scroll:document.documentElement.scrollWidth>innerWidth+1};},{canvas:c.canvas,view:c.view});
 const stable=(a,b,label)=>{for(const k of ['canvas','view'])for(const d of ['width','height'])assert.ok(b[k][d]>=a[k][d]-2,label+' '+k+' '+d+' '+JSON.stringify({before:a,after:b}));assert.equal(b.scroll,false,label+' horizontal overflow');};
 const init=async c=>{if(c.url.startsWith('/offline/')){await page.locator('#primary-action').click();}else await page.evaluate(c.setup);await page.waitForTimeout(80);};
 const editor=c=>c.legacy?'.hud-editor':'.control-settings';
 const open=async c=>{const paused=c.url.startsWith('/offline/')&&await page.locator('#overlay').isVisible();await page.locator(paused?'#overlay-edit-hud':c.open).click();await page.locator(editor(c)).waitFor({state:'visible'});};
 const save=async c=>{await page.locator(editor(c)+' [data-save]').click();assert.equal(await page.locator(editor(c)).isVisible(),false,await page.locator(editor(c)+' '+(c.legacy?'[data-message]':'.cs-status')).innerText());await page.waitForTimeout(80);};
 for(const c of cases)for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1280,height:800}]){
  const label=c.name+' '+size.width+'×'+size.height;
  try{await page.setViewportSize(size);await page.goto('http://hud-games.test'+c.url);await page.evaluate(()=>{for(const key of Object.keys(localStorage))if(!key.includes('tutorial')&&!key.includes('seen'))localStorage.removeItem(key);});await page.reload();await init(c);
   const before=await measure(c);assert.ok(before.canvas.width>80&&before.canvas.height>80,label+' initial arena');
   await open(c);
   const clipped=await page.locator(editor(c)).evaluate(n=>[...n.querySelectorAll('[data-save], [data-cancel], [data-select], [data-control], [data-size], [data-opacity]')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.left<0||r.right>innerWidth+1);}).map(el=>el.outerHTML));
   assert.deepEqual(clipped,[],label+' editor clipped');
   await page.locator(editor(c)+' [data-opacity]').fill('60');await save(c);stable(before,await measure(c),label+' save');
   await page.reload();await init(c);stable(before,await measure(c),label+' reload');
   await open(c);await page.locator(editor(c)+' [data-opacity]').fill('80');await page.locator(editor(c)+' [data-cancel]').click();stable(before,await measure(c),label+' cancel');
   await open(c);await page.locator(editor(c)+' [data-reset]').click();await save(c);stable(before,await measure(c),label+' reset');
   console.log('PASS '+label);
  }catch(e){failures.push(label+': '+e.message);fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});await page.screenshot({path:path.join(root,'tools/screenshots/hud-audit-'+c.name.replace(/[^a-z0-9]/gi,'-')+'-'+size.width+'.png')});console.error('FAIL '+failures.at(-1));}
 }
 // Save different layouts for each orientation, then rotate inside the editor.
 // Sliders must track the newly loaded draft, and the arena must keep its size.
 for(const c of cases){
  await page.setViewportSize({width:390,height:844});await page.goto('http://hud-games.test'+c.url);await init(c);
  if(!c.legacy){await open(c);await page.locator('.control-settings [data-opacity]').fill('55');await save(c);}
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(80);const landscape=await measure(c);
  await open(c);await page.locator(editor(c)+' [data-opacity]').fill('75');await save(c);stable(landscape,await measure(c),c.name+' rotated save');
  await open(c);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);
  if(!c.legacy)assert.equal(await page.locator('.control-settings [data-opacity]').inputValue(),'55',c.name+' rotated sliders');
  await page.locator(editor(c)+' [data-cancel]').click();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(80);stable(landscape,await measure(c),c.name+' rotated restore');
  console.log('PASS rotation and restored layout: '+c.name);
 }
 assert.deepEqual(errors,[],'page errors');assert.deepEqual(failures,[],'HUD audit failures');await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
