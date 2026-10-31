// Render final server statistics in the shared web/Android Chase interface.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb');
const stats=[{id:'rat',role:'rat',name:'Rat player',score:7,captures:7,deaths:1,longestLifeMs:90000},{id:'cat',role:'cat',name:'Cat player',score:15,captures:3,deaths:2,longestLifeMs:90000},{id:'dog',role:'dog',name:'Dog player',score:10,captures:2,deaths:0,longestLifeMs:90000}];
async function main(){const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 try{const context=await browser.newContext({hasTouch:true}),page=await context.newPage(),errors=[];page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{
  for(const k of ['chase.has_seen_tutorial.v1','chase.has_seen_controls.v1'])localStorage.setItem(k,'1');
  window.cardLabels=[];const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.id==='share-card')window.cardLabels.push(String(text));return fill.call(this,text,...args);};
 });
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());if(url.hostname!=='chase-cheese.test')return route.abort();
  if(url.pathname.match(/^\/api\/v1\/rooms\/test-(rat|cat|dog)\/share$/)){
   const role=url.pathname.split('/')[4].slice(5),player=stats.find(s=>s.role===role);
   return route.fulfill({json:{matchId:'test-'+role,player,winners:['Cats'],mvpName:'Cat player',mvpScore:15,url:'https://osieq.online/games/chase/',text:'Test result'}});
  }
  if(!url.pathname.startsWith('/multiplayer'))return route.fulfill({status:401,json:{error:{message:'Source fixture'}}});
  let relative=url.pathname.replace(/^\/multiplayer\/?/,'');if(!relative||relative==='app')relative='index.html';const file=path.resolve(backend,relative);
  if(!file.startsWith(backend+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing source'});
  let body=fs.readFileSync(file);if(relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,`screen('home');window.CheeseFixture={show(role,stats){window.cardLabels=[];me={id:role,guest:true};room={code:'test-'+role,state:'finished',players:stats};const result={scores:{rat:7,cat:15,dog:10},winners:['cat'],reason:'time',playerStats:stats,mvp:'cat'},self={id:role,role,health:100,ammo:10};receiveWorld({matchId:'test-'+role,width:2400,height:1600,remainingMs:0,ended:true,players:stats.map((s,i)=>({...s,x:400+i*400,y:500,z:0,health:100,aimX:1,aimY:0})),props:[],cheese:[],ammo:[],healthBags:[],shots:[],scores:result.scores,result,self});screen('arena');drawHUD();window.ChaseConnection?.ready();}};`);
  await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream',body});
 });
 for(const app of [false,true])for(const size of [{width:1280,height:800},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto('http://chase-cheese.test/multiplayer'+(app?'/app':''));
  for(const role of ['rat','cat','dog']){
   await page.evaluate(({role,stats})=>CheeseFixture.show(role,stats),{role,stats});await page.locator('#results').waitFor({state:'visible'});
   assert.deepEqual(await page.locator('.result-team.rat th').allTextContents(),['Player','Score','Cheese caught','Deaths']);
   assert.deepEqual((await page.locator('.result-team.rat tr').nth(1).locator('td').allTextContents()).slice(1),['7','7','1']);
   assert.deepEqual((await page.locator('.result-team.cat tr').nth(1).locator('td').allTextContents()).slice(1),['15','3','2']);
   assert.deepEqual((await page.locator('.result-team.dog tr').nth(1).locator('td').allTextContents()).slice(1),['10','2','0']);
   assert.equal(await page.locator('#personal-stats > div').nth(1).innerText(),role==='rat'?'7\nCheese caught':(role==='cat'?'3':'2')+'\nCaptures');
   await page.waitForFunction(label=>cardLabels.includes(label),role==='rat'?'CHEESE CAUGHT':'CAPTURES');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(role==='rat'){
    fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});await page.locator('.result-team.rat').scrollIntoViewIfNeeded();
    await page.screenshot({path:path.join(root,'tools/screenshots/chase-cheese-'+(app?'app':'web')+'-'+size.width+'.png')});
   }
  }
  console.log('PASS '+(app?'app':'web')+' '+size.width+': Rat cheese catches, Cat/Dog catches, personal stats and share card');
 }
 assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
