// Test source pages directly; no build, deployment or external network required.
const {createServer}=require('node:http');
const {readFileSync,existsSync,mkdirSync}=require('node:fs');
const {resolve,extname}=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=resolve(__dirname,'..');
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.mp3':'audio/mpeg'};
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),chase=pathname.startsWith('/multiplayer');
 const folder=chase?resolve(root,'../billachuha_backend/internal/playweb'):root;
 const file=resolve(folder,chase?(pathname==='/multiplayer'?'index.html':pathname.slice('/multiplayer/'.length)):'.'+pathname);
 if(!file.startsWith(folder+require('node:path').sep)||!existsSync(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(readFileSync(file));
});
(async()=>{
 let browser;
 try{
  await new Promise(done=>server.listen(0,'127.0.0.1',done));const base=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'});
  const context=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:844}});
  await context.addInitScript(()=>{localStorage.setItem('chase.has_seen_tutorial.v1','1');localStorage.setItem('chase.has_seen_controls.v1','1');});
  await context.route('**/*',route=>{
   if(route.request().url().startsWith(base))return route.continue();
   if(route.request().resourceType()==='image')return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
   return route.abort();
  });
  for(const name of [...Array.from({length:9},(_,i)=>`index${i+1}.html`),'fight.html']){
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/${name}`);await page.locator('.arcade-shell').waitFor();
   for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:568},{width:568,height:320},{width:1280,height:720}]){
    await page.setViewportSize(size);await page.waitForTimeout(120);
    const layout=await page.evaluate(()=>{
     const rect=n=>{const b=n.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
     return {width:innerWidth,height:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,
      canvas:rect(document.querySelector('canvas')),controls:[...document.querySelectorAll('.arcade-rail button,.arcade-rail #joystick-container,.arcade-rail .joystick-base')].map(rect)};
    });
    assert.ok(layout.scrollW<=size.width+1&&layout.scrollH<=size.height+1,`${name}: page scrolls ${JSON.stringify(layout)}`);
    for(const box of [layout.canvas,...layout.controls])assert.ok(box.x>=-1&&box.y>=-1&&box.right<=size.width+1&&box.bottom<=size.height+1&&box.width>0&&box.height>0,`${name}: offscreen ${JSON.stringify(box)} at ${JSON.stringify(size)}`);
    for(const box of layout.controls){const c=layout.canvas;assert.ok(!(box.x<c.right&&box.right>c.x&&box.y<c.bottom&&box.bottom>c.y),`${name}: control overlaps game`);}
   }
   assert.deepEqual(errors,[],`${name}: script errors`);
   if(['index6.html','index7.html'].includes(name)){
    await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
    const session=await context.newCDPSession(page),stick=await page.locator('#joystick-container').boundingBox(),fire=await page.locator('#fire-button').boundingBox();
    await page.evaluate(()=>{window.touchTrace=[];for(const type of ['pointerdown','pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,e=>touchTrace.push([type,e.pointerId,e.target.id]));});
    const fireTouch={id:1,x:fire.x+fire.width/2,y:fire.y+fire.height/2},moveTouch={id:2,x:stick.x+stick.width/2+20,y:stick.y+stick.height/2};
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[fireTouch]});
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[fireTouch,moveTouch]});
    const thumb=()=>page.locator('#joystick-thumb').evaluate(n=>parseFloat(getComputedStyle(n).left));
    assert.ok(await thumb()>40,`${name}: movement starts immediately with another finger firing`);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[fireTouch]});
    assert.ok(await thumb()>40,`${name}: releasing fire must not stop movement: ${JSON.stringify(await page.evaluate(()=>touchTrace))}`);
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(120);
    const center=await page.locator('#joystick-container').evaluate(n=>(n.clientWidth-document.getElementById('joystick-thumb').clientWidth)/2);
    assert.ok(Math.abs(await thumb()-center)<1,`${name}: rotation must release held controls`);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   if(name==='fight.html'){
    await page.setViewportSize({width:844,height:390});
    await page.evaluate(()=>{player.position.x=100;enemy.position.x=650;});
    const before=await page.evaluate(()=>enemy.position.x);await page.waitForTimeout(900);
    assert.ok(await page.evaluate(()=>enemy.position.x)<before,'bot must approach without player-two input');
    const button=page.locator('[data-fight-key="d"]'),box=await button.boundingBox(),session=await context.newCDPSession(page);
    const start=await page.evaluate(()=>player.position.x);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});await page.waitForTimeout(300);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.ok(await page.evaluate(()=>player.position.x)>start,'touch movement must move player');
    await page.waitForTimeout(50);assert.equal(await page.evaluate(()=>fightKeys.size),0,'touch release must clear controls');
    mkdirSync(resolve(root,'tools','screenshots'),{recursive:true});
    for(const size of [{width:390,height:844},{width:844,height:390}]){await page.setViewportSize(size);await page.waitForTimeout(100);await page.screenshot({path:resolve(root,'tools','screenshots',`fight-${size.width}.png`)});}
   }
   console.log(`PASS ${name}: portrait, landscape, small phone, desktop; no overlap or scroll`);await page.close();
  }
  if(existsSync(resolve(root,'../billachuha_backend/internal/playweb/index.html'))){
  const chase=await context.newPage();const errors=[];chase.on('pageerror',error=>errors.push(error.message));
  await chase.addInitScript(()=>localStorage.setItem('chase.hud.v1',JSON.stringify({version:1,controls:{joystick:{x:1,y:1,size:150,opacity:1},primary:{x:0,y:0,size:150,opacity:1},secondary:{x:0,y:0,size:150,opacity:1}}})));
  await chase.goto(base+'/multiplayer');await chase.waitForTimeout(150);
  await chase.evaluate(()=>{
   me={id:'self',name:'Tester'};room={state:'running',players:[{id:'self',role:'rat'}]};
   receiveWorld({matchId:'test',width:2400,height:1600,remainingMs:300000,scores:{rat:0,cat:0,dog:0},players:[{id:'self',name:'Tester',role:'rat',x:1200,y:800,z:0,health:100,aimX:1,aimY:0}],props:[],cheese:[],ammo:[],healthBags:[],shots:[],self:{id:'self',role:'rat',health:100,ammo:10,primaryReadyInMs:0,secondaryReadyInMs:0}});
   screen('arena');drawHUD();
  });
  for(const size of [{width:390,height:844},{width:844,height:390},{width:320,height:568},{width:568,height:320}]){
   await chase.setViewportSize(size);await chase.waitForTimeout(150);
   const layout=await chase.evaluate(()=>{
    const box=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};};
    return {canvas:box(document.getElementById('game')),controls:['joystick','primary','secondary','arena-edit-hud','exit-game'].map(id=>box(document.getElementById(id))).concat([box(document.querySelector('.arena-guide summary'))]),scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight};
   });
   assert.ok(layout.scrollW<=size.width+1&&layout.scrollH<=size.height+1,`Chase scrolls: ${JSON.stringify(layout)}`);
   for(const b of layout.controls){assert.ok(b.x>=0&&b.y>=0&&b.right<=size.width+1&&b.bottom<=size.height+1,'Chase controls off screen');const c=layout.canvas;assert.ok(!(b.x<c.right&&b.right>c.x&&b.y<c.bottom&&b.bottom>c.y),`Chase overlaps: ${JSON.stringify(layout)}`);}
   for(let i=0;i<layout.controls.length;i++)for(const b of layout.controls.slice(i+1)){const a=layout.controls[i];assert.ok(!(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y),'Chase controls overlap each other');}
   if(size.width===390||size.width===844)await chase.screenshot({path:resolve(root,'tools/screenshots',`chase-${size.width}.png`)});
  }
  assert.deepEqual(errors,[]);console.log('PASS Online Chase: portrait and landscape control lanes');await chase.close();
  }
 }finally{await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
