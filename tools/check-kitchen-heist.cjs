// Local-source browser checks. NODE_PATH provides Playwright; no server/accounts needed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');const root=path.resolve(__dirname,'..'),screens=path.join(root,'tools/screenshots');
async function main(){
  fs.mkdirSync(screens,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext({viewport:{width:1365,height:900}}),errors=[];
    await context.route('http://heist.test/**',async route=>{
      const relative=new URL(route.request().url()).pathname.slice(1),file=path.resolve(root,relative||'index.html');
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
      let body=fs.readFileSync(file);
      if(relative==='kitchen-heist/menu.js')body=body.toString().replace(/\}\)\(\);\s*$/,"window.HeistFixture={get game(){return game},save,begin,input,audio};})();");
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';
      await route.fulfill({contentType:mime,body});
    });
    const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR',error.message);});
    await page.goto('http://heist.test/index2.html');await page.waitForURL('**/kitchen-heist.html');
    await page.screenshot({path:path.join(screens,'kitchen-heist-title.png')});
    await page.locator('#start').click();await page.locator('#close-tutorial').click();
    assert.equal(await page.locator('#sound').innerText(),'Sound on');await page.waitForFunction(()=>HeistFixture.audio.sound.context?.state==='running');
    assert.ok(await page.evaluate(()=>{HeistFixture.audio.alarm();return HeistFixture.audio.sound.active.size>0;}));
    await page.locator('#sound').click();assert.equal(await page.evaluate(()=>HeistFixture.audio.sound.active.size),0);
    const x=await page.evaluate(()=>HeistFixture.game.player.x);await page.keyboard.down('KeyD');await page.waitForFunction(x=>HeistFixture.game.player.x>x+15,x);await page.keyboard.up('KeyD');
    await page.locator('#pause').click();const time=await page.evaluate(()=>HeistFixture.game.elapsed);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>HeistFixture.game.elapsed),time);await page.locator('#resume').click();
    // Navigate using only simulation inputs while every guard remains active.
    await page.evaluate(()=>{
      HeistFixture.begin(0);document.querySelector('#tutorial-dialog').close();const g=HeistFixture.game,K=KitchenHeist;
      for(const target of [...g.level.cheese,g.level.exit])for(const point of K.pathfind(g.level,g.player,target))for(let i=0;i<100&&K.distance(g.player,point)>6&&g.status==='playing';i++){
        const dx=point.x-g.player.x,dy=point.y-g.player.y,d=Math.hypot(dx,dy);g.update({x:dx/d,y:dy/d,sprint:true},1/60);
      }
    });
    await page.locator('#result-dialog').waitFor({state:'visible'});assert.match(await page.locator('#result-title').innerText(),/cleared/);
    assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem(KitchenHeist.SAVE_KEY)).stars['1-1']>=1));
    await page.reload();await page.locator('#choose-level').click();assert.equal(await page.locator('.level-card').nth(1).isEnabled(),true);
    await page.screenshot({path:path.join(screens,'kitchen-heist-levels.png')});
    for(const [width,height,label]of [[1365,900,'desktop'],[390,844,'phone'],[844,390,'landscape'],[320,568,'small-phone']]){
      await page.setViewportSize({width,height});await page.evaluate(()=>HeistFixture.begin(0));await page.waitForTimeout(100);
      const layout=await page.evaluate(()=>{
        const c=document.getElementById('stage').getBoundingClientRect(),v=document.getElementById('viewport').getBoundingClientRect();
        return{width:c.width,height:c.height,left:c.left,top:c.top,right:c.right,bottom:c.bottom,inside:c.left>=v.left-1&&c.right<=v.right+1&&c.top>=v.top-1&&c.bottom<=v.bottom+1,ratio:HeistFixture.game.view.width/HeistFixture.game.view.height,scroll:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.ok(layout.width>120&&layout.height>90&&layout.inside,JSON.stringify({label,layout}));assert.ok(Math.abs(layout.width/layout.height-layout.ratio)<.02);assert.equal(layout.scroll,false);
      await page.screenshot({path:path.join(screens,'kitchen-heist-'+label+'.png')});
      await page.locator('#edit-keys').click();await page.locator('[data-key-action="use"]').click();await page.keyboard.press('KeyF');await page.locator('.control-settings [data-save]').click();
      assert.equal(await page.evaluate(()=>HeistFixture.input.settings.resolve('KeyF')),'use');
      console.log('PASS layout, pause and remapping: '+label);
    }
    // Real two-finger movement and sprint on a phone.
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>HeistFixture.begin(0));
    const cdp=await context.newCDPSession(page),stick=await page.locator('#move-stick').boundingBox(),sprint=await page.locator('#sprint').boundingBox();
    const touch=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,stick.x+stick.width/2,stick.y+stick.height/2),touch(2,sprint.x+sprint.width/2,sprint.y+sprint.height/2)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,stick.x+stick.width+15,stick.y+stick.height/2),touch(2,sprint.x+sprint.width/2,sprint.y+sprint.height/2)]});
    await page.waitForTimeout(160);assert.ok(await page.evaluate(()=>HeistFixture.game.player.x>60&&HeistFixture.game.player.sprinting));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(60);assert.equal(await page.evaluate(()=>HeistFixture.input.sprint),false);
    // Every world and its distinctive hazards render without exceptions.
    await page.evaluate(()=>{for(const l of KitchenHeist.LEVELS){const g=new KitchenHeist.HeistGame(l.index);KitchenHeist.HeistArt.render(document.getElementById('stage'),g,1);}});
    assert.deepEqual(errors,[]);console.log('PASS first-stage escape/save/reload, two-finger touch, all 50 renders and old-link redirect.');await context.close();
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
