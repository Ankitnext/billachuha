// Chase header regression using only intercepted local source and snapshots.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb');
async function main(){
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{localStorage.setItem('chase.has_seen_tutorial.v1','1');localStorage.setItem('chase.has_seen_controls.v1','1');});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='chase-header.test')return route.abort();
  let relative=url.pathname.replace(/^\/multiplayer\/?/,'');if(!relative||relative==='app')relative='index.html';const file=path.resolve(backend,relative);
  if(!file.startsWith(backend+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing local source'});
  let body=fs.readFileSync(file);if(relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,"screen('home');window.HeaderFixture={set(role='cat',large=false){me={id:'self'};const self={id:'self',name:'Player',role,x:1200,y:800,z:0,health:large?25:100,ammo:large?0:10,slowed:large,primaryReadyInMs:0,secondaryReadyInMs:2000};receiveWorld({matchId:'header',level:large?999:2,width:2400,height:1600,remainingMs:220000,ended:false,scores:large?{rat:999999,cat:999999,dog:999999}:{rat:117,cat:65,dog:90},players:[self],self,props:[],cheese:[],ammo:[],healthBags:[],shots:[]});screen('arena');drawHUD();window.ChaseConnection?.ready();fitArena();}};");
  await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body});
 });
 const inspect=async()=>page.evaluate(()=>{
  const rect=el=>{const b=el.getBoundingClientRect();return{left:b.left,top:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
  const selectors=['.score','#competition-level','#timer','#role-badge','.match-actions button','.match-vitals','#ammo-status','.arena-guide summary'];
  const nodes=selectors.flatMap(s=>[...document.querySelectorAll(s)]).filter(n=>n.getClientRects().length);
  const items=nodes.map(n=>({label:n.id||n.textContent.trim(),...rect(n)}));const conflicts=[];
  for(let i=0;i<items.length;i++)for(const b of items.slice(i+1)){const a=items[i];if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)conflicts.push([a.label,b.label]);}
  const unreachable=[...document.querySelectorAll('.match-actions button,.arena-guide summary')].filter(n=>n.getClientRects().length).filter(n=>{const b=rect(n),hit=document.elementFromPoint((b.left+b.right)/2,(b.top+b.bottom)/2);return!hit||!n.contains(hit);}).map(n=>n.id||n.textContent);
  return{items,conflicts,unreachable,canvas:rect(document.getElementById('game')),scroll:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1};
 });
 fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});
 for(const app of [false,true]){
  await page.goto('http://chase-header.test/multiplayer'+(app?'/app':''));
  await page.evaluate(()=>localStorage.removeItem('chase.hud.v1'));await page.reload();
  for(const size of [{width:844,height:390},{width:568,height:320},{width:390,height:844},{width:320,height:568},{width:1280,height:800}]){
   await page.setViewportSize(size);
   for(const role of ['cat','dog','rat'])for(const large of [false,true]){
    await page.evaluate(({role,large})=>HeaderFixture.set(role,large),{role,large});await page.waitForTimeout(60);
    const result=await inspect(),label=(app?'app':'web')+' '+size.width+'×'+size.height+' '+role+(large?' large scores':'');
    if(role==='cat'&&!large)await page.screenshot({path:path.join(root,'tools/screenshots/chase-header-'+(app?'app':'web')+'-'+size.width+'.png')});
    assert.deepEqual(result.conflicts,[],label+' overlaps');assert.deepEqual(result.unreachable,[],label+' blocked buttons');assert.equal(result.scroll,false,label+' page overflow');
    for(const item of result.items)assert.ok(item.left>=-1&&item.top>=-1&&item.right<=size.width+1&&item.bottom<=size.height+1,label+' offscreen '+JSON.stringify(item));
    assert.ok(result.canvas.width>100&&result.canvas.height>80,label+' usable arena');
    if(!app)for(const item of result.items)assert.ok(item.bottom<=result.canvas.top+1,label+' header overlaps arena');
   }
   const before=(await inspect()).canvas;
   await page.locator('.arena-guide summary').click();
   const panel=await page.locator('.arena-guide-content').boundingBox();assert.ok(panel&&panel.x>=0&&panel.x+panel.width<=size.width+1&&panel.y+panel.height<=size.height+1,'Map icons panel fits');
   assert.deepEqual((await inspect()).canvas,before,'Opening Map icons preserves the arena');
   await page.locator('#controls-help').click();await page.locator('#chase-tutorial').waitFor({state:'visible'});await page.locator('#tutorial-next').click();await page.locator('.arena-guide summary').click();
   await page.locator('#arena-edit-hud').click();await page.locator('.hud-editor [data-reset]').click();await page.locator('.hud-editor [data-opacity]').fill('60');await page.locator('.hud-editor [data-save]').click();
   assert.equal(await page.locator('.hud-editor').isVisible(),false,await page.evaluate(()=>JSON.stringify({width:innerWidth,height:innerHeight,message:document.querySelector('.hud-editor [data-message]').textContent,previews:[...document.querySelectorAll('.hud-preview-control')].map(n=>({id:n.dataset.controlId,rect:n.getBoundingClientRect().toJSON()}))})));
   await page.waitForTimeout(60);
   assert.deepEqual((await inspect()).canvas,before,'Saving the HUD preserves the arena');
   assert.deepEqual((await inspect()).unreachable,[],'Header buttons remain reachable after HUD save');
   console.log('PASS '+(app?'app':'web')+' '+size.width+'×'+size.height+': roles, health/ammo, large scores and reachable buttons');
  }
  // A saved control moved to the top must respect the reflowed header and cutout.
  await page.evaluate(()=>{
   localStorage.setItem('chase.hud.v1',JSON.stringify({version:1,controls:{joystick:{x:0,y:1,size:100,opacity:1},primary:{x:0,y:0,size:100,opacity:1},secondary:{x:1,y:0,size:100,opacity:1}}}));
  });
  await page.reload();await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{document.documentElement.style.setProperty('--native-safe-top','32px');document.documentElement.style.setProperty('--native-safe-left','28px');HeaderFixture.set('dog',true);});await page.waitForTimeout(100);
  for(const size of [{width:390,height:844},{width:844,height:390}]){
   await page.setViewportSize(size);await page.waitForTimeout(100);
   const check=await page.evaluate(()=>{const bottom=document.getElementById('match-hud').getBoundingClientRect().bottom;return ['joystick','primary','secondary'].map(id=>({id,top:document.getElementById(id).getBoundingClientRect().top,bottom}));});
   for(const control of check)assert.ok(control.top>=control.bottom+7,'Saved controls respect header after rotation: '+JSON.stringify(control));
   assert.deepEqual((await inspect()).conflicts,[],'Cutout header stays separate');
  }
  if(!app&&await page.evaluate(()=>document.fullscreenEnabled)){
   await page.locator('#fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.waitForTimeout(100);assert.deepEqual((await inspect()).conflicts,[],'Fullscreen header stays separate');await page.evaluate(()=>document.exitFullscreen());
  }
  console.log('PASS '+(app?'app':'web')+': Map icons, help, HUD saving, rotation, cutout and saved controls');
 }
 assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
