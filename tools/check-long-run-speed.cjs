// Test the real website/app controllers with deterministic frame timing.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),app=path.resolve(root,'../billachuha_app/app/src/main/assets/long_run');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} should equal ${b}`);
async function main(){
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext(),page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);
    page.on('pageerror',e=>errors.push(e.message));
    await context.addInitScript(()=>{window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.hostname!=='pace.test')return route.abort();
      const offline=url.pathname.startsWith('/offline/'),base=offline?app:root,relative=offline?url.pathname.slice(9):url.pathname.slice(1),file=path.resolve(base,relative);
      if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing source'});
      let body=fs.readFileSync(file);
      if(relative==='index4.html'){
        body=body.toString();const end=body.lastIndexOf('\n};');assert.ok(end>0);
        body=body.slice(0,end)+`\nwindow.MovementFixture={update,reset(){x=6000;y=4000;z=vx=vy=vz=rotation=0;health=100;gameOver=false;joyX=joyY=0;for(const k of Object.keys(keys))delete keys[k];worldBombs=[];staticBombs=[];chasingBombs=[];coinBombs=[];healthPickups=[];coin={x:100,y:100,vx:0,vy:0};},touch(x,y){joyX=x;joyY=y;},state(){return{x,y,z,vx,vy,vz};}};`+body.slice(end);
      }
      if(offline&&relative==='game.js'){
        body=body.toString().replace('const obstacles = geometry.createObstacles(worldW, worldH);','const obstacles = [];');const end=body.lastIndexOf('})();');assert.ok(end>0);
        body=body.slice(0,end)+`window.MovementFixture={update,reset(){resetGame();x=6000;y=4000;mode='running';obstacles.length=0;worldBombs=[];staticBombs=[];chasingBombs=[];coinBombs=[];healthPickups=[];coin={x:100,y:100,vx:0,vy:0};},touch(x,y){joyX=x;joyY=y;},state(){return{x,y,z,vx,vy,vz};}};`+body.slice(end);
      }
      await route.fulfill({contentType:{'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream',body});
    });
    const results={};
    for(const file of ['index4.html','offline/index.html']){
      await page.goto('http://pace.test/'+file);await page.waitForFunction(()=>window.MovementFixture&&(!window.LongRun||LongRun.getState().mode==='ready'));
      const rates=[];
      for(const fps of [30,60,90,120,144,240]){
        await page.evaluate(()=>MovementFixture.reset());await page.keyboard.down('KeyD');
        const state=await page.evaluate(fps=>{for(let i=0;i<fps;i++)MovementFixture.update(1/fps);return MovementFixture.state();},fps);await page.keyboard.up('KeyD');
        close(state.vx,225*(1-Math.pow(.9,60)));assert.ok(state.x-6000>190);close(state.y,4000);rates.push({fps,distance:state.x-6000,speed:state.vx});
      }
      for(const sample of rates)close(sample.distance,rates[0].distance);
      await page.evaluate(()=>MovementFixture.reset());await page.keyboard.down('KeyD');await page.keyboard.press('Space');
      const impulse=await page.evaluate(()=>MovementFixture.state());close(impulse.vz,800);close(Math.hypot(impulse.vx,impulse.vy),400);
      const jump=await page.evaluate(()=>{MovementFixture.update(1/60);return MovementFixture.state();});await page.keyboard.up('KeyD');assert.ok(jump.z>0,'jump leaves the ground');
      await page.evaluate(()=>{MovementFixture.reset();MovementFixture.touch(1,0);for(let i=0;i<120;i++)MovementFixture.update(1/120);});
      const touch=await page.evaluate(()=>MovementFixture.state());close(touch.x-6000,rates[0].distance*2.5);
      results[file]=rates;console.log('PASS '+file+': matching keyboard pace at 30–240 Hz, original touch boost and jump impulse.');
    }
    close(results['index4.html'][0].distance,results['offline/index.html'][0].distance);assert.deepEqual(errors,[]);
    console.log('PASS website/Android controller parity; no browser errors.');await context.close();
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
