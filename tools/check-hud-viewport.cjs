// Regression: fixed-position customized controls must not displace the game grid.
// Intercepted local source and snapshots only; no account or live server needed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb');
async function main(){const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({hasTouch:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 await context.route('http://hud.test/**',async route=>{
  let relative=new URL(route.request().url()).pathname.replace(/^\/multiplayer\/?/,'');if(relative==='modes')relative='modes.html';const file=path.resolve(backend,relative);
  if(!file.startsWith(backend+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing source'});
  let body=fs.readFileSync(file);if(relative==='modes.js')body=body.toString().replace(/\nboot\(\);/,`\nshow('home');window.HudViewportFixture={setup(){me={id:'one'};world={matchId:'hud',width:capture?4000:2400,height:horde?1800:1100,ended:false,mode:{players:[{id:'one',name:'Player',role:'cat',team:'alpha',x:400,y:400,hp:100,maxHp:100,fuel:100,maxFuel:100,aimX:1,aimY:0,magazine:0,reserve:0,grenades:3}],enemies:[],map:[{x:0,y:418,w:2400,h:20,kind:'ground'}],pickups:[],effects:[],shots:[],feed:[],decoys:[],phase:'fighting',wave:3,alpha:21,bravo:0,left:12}};receivedAt=performance.now()+1000000;showArena();}};`);
  await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body});
 });
 const measure=()=>page.evaluate(()=>{const v=document.getElementById('viewport').getBoundingClientRect(),c=document.getElementById('game').getBoundingClientRect();return{viewX:v.x,viewWidth:v.width,viewHeight:v.height,canvasWidth:c.width,canvasHeight:c.height};});
 const stable=(before,after,label)=>{assert.ok(after.viewWidth>=before.viewWidth-2,label+': arena width '+JSON.stringify({before,after}));assert.ok(after.viewHeight>=before.viewHeight-2,label+': arena height');assert.ok(after.canvasWidth>=before.canvasWidth-2,label+': canvas width');assert.ok(after.canvasHeight>=before.canvasHeight-2,label+': canvas height');assert.ok(Math.abs(after.viewX-before.viewX)<=2,label+': arena shifted');};
 async function open(){await page.locator('#arena-edit-hud').click();await page.locator('.control-settings').waitFor({state:'visible'});}
 async function save(){await page.locator('.control-settings [data-save]').click();await page.locator('.control-settings').waitFor({state:'hidden'});await page.waitForTimeout(70);}
 for(const game of ['zombie-horde','zombie-horde&variant=capture','arena-blitz'])for(const size of [{width:844,height:390},{width:915,height:412},{width:390,height:844},{width:1280,height:800}]){
  await page.setViewportSize(size);await page.goto('http://hud.test/multiplayer/modes?game='+game);await page.evaluate(()=>localStorage.clear());await page.reload();await page.evaluate(()=>HudViewportFixture.setup());await page.waitForTimeout(70);const before=await measure();
  await open();await page.locator('.cs-tools [data-opacity]').fill('60');await save();const after=await measure();console.log(game+' '+size.width+'px before/after: '+Math.round(before.canvasWidth)+' → '+Math.round(after.canvasWidth));stable(before,after,'save');
  assert.equal(await page.locator('#move').evaluate(n=>getComputedStyle(n).position),'fixed');
  await page.reload();await page.evaluate(()=>HudViewportFixture.setup());await page.waitForTimeout(70);stable(before,await measure(),'saved layout reload');
  await open();await page.locator('.cs-tools [data-opacity]').fill('80');await page.locator('.control-settings [data-cancel]').click();stable(before,await measure(),'cancel');
  await open();await page.locator('.control-settings [data-reset]').click();await save();stable(before,await measure(),'reset defaults');assert.equal(await page.locator('#move').evaluate(n=>getComputedStyle(n).position),'relative');
 }
 // Rotate while the editor is open, then return to a saved landscape layout.
 await page.setViewportSize({width:844,height:390});await page.goto('http://hud.test/multiplayer/modes?game=zombie-horde');await page.evaluate(()=>HudViewportFixture.setup());await page.waitForTimeout(70);const landscape=await measure();await open();await page.locator('.cs-tools [data-opacity]').fill('60');await save();await open();await page.setViewportSize({width:390,height:844});await page.locator('.control-settings [data-cancel]').click();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(70);stable(landscape,await measure(),'orientation restore');
 if(await page.evaluate(()=>document.fullscreenEnabled)){await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.waitForTimeout(70);const full=await measure();await open();await page.locator('.cs-tools [data-opacity]').fill('65');await save();stable(full,await measure(),'fullscreen save');await page.evaluate(()=>document.exitFullscreen());}
 fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});await page.screenshot({path:path.join(root,'tools/screenshots/hud-viewport-landscape.png')});assert.deepEqual(errors,[]);console.log('PASS HUD save/reload/cancel/reset, orientation changes and fullscreen preserve the arena.');await context.close();
 }finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
