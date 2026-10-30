// Local-source UI/game checks; Playwright on NODE_PATH, optional CHROMIUM_PATH.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),shots=path.join(root,'tools/screenshots');
async function main(){
  fs.mkdirSync(shots,{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext({viewport:{width:1365,height:900}}),page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);
    await context.route('http://siege.test/**',async route=>{
      const relative=new URL(route.request().url()).pathname.slice(1),file=path.resolve(root,relative||'index.html');
      if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
      let body=fs.readFileSync(file);if(relative==='sky-siege.js')body=body.toString().replace(/\}\)\(\);\s*$/,"window.SiegeFixture={get run(){return run},profile,start,pause,finish,persist,settings,keys,poll,updateHUD,audio,sound,held,pointers,get pending(){return pending}};})();");
      const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)]||'application/octet-stream';await route.fulfill({contentType:mime,body});
    });
    page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE ERROR',error.message);});
    await page.goto('http://siege.test/index6.html');await page.waitForURL('**/sky-siege.html');await page.screenshot({path:path.join(shots,'sky-siege-title.png')});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(shots,'sky-siege-title-phone.png')});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.setViewportSize({width:1365,height:900});
    await page.locator('#start').click();await page.locator('#close-tutorial').click();await page.waitForTimeout(60);
    await page.locator('#sound').click();await page.waitForFunction(()=>SiegeFixture.sound.context?.state==='running');
    assert.ok(await page.evaluate(()=>{SiegeFixture.audio('magnet');SiegeFixture.audio('firecracker-fuse');return SiegeFixture.sound.active.size>=2;}));
    await page.locator('#sound').click();assert.equal(await page.evaluate(()=>SiegeFixture.sound.active.size),0);
    const y=await page.evaluate(()=>SiegeFixture.run.player.y);await page.keyboard.press('Space');await page.waitForFunction(y=>SiegeFixture.run.player.y<y-20,y);
    await page.locator('#pause').click();const time=await page.evaluate(()=>SiegeFixture.run.elapsed);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>SiegeFixture.run.elapsed),time);await page.locator('#resume').click();
    await page.evaluate(()=>{SiegeFixture.start();SiegeFixture.run.addCheese(45);});await page.waitForTimeout(70);await page.keyboard.press('KeyE');await page.waitForFunction(()=>SiegeFixture.run.trapsPlaced===1);
    assert.equal(await page.evaluate(()=>SiegeFixture.run.platform('0:0').trap.type),'butter');
    await page.locator('#pause').click();const walletBefore=await page.evaluate(()=>SiegeFixture.profile.cheese),bank=await page.evaluate(()=>SiegeFixture.run.stats().bankable);await page.locator('#retreat').click();await page.locator('#death-screen').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>SiegeFixture.profile.cheese),walletBefore+bank);assert.equal(await page.evaluate(()=>SiegeFixture.profile.active),null);
    await page.locator('#death-upgrades').click();assert.equal(await page.locator('.upgrade-card').count(),7);const wallet=await page.evaluate(()=>SiegeFixture.profile.cheese);
    await page.locator('[data-upgrade="extra_jump"]').click();assert.equal(await page.evaluate(()=>SiegeFixture.profile.cheese),wallet-30);
    await page.locator('#upgrade-start').click();assert.equal(await page.evaluate(()=>SiegeFixture.run.maxJumps),3);
    await page.evaluate(()=>{SiegeFixture.run.addCheese(7);SiegeFixture.run.highestLayer=6;SiegeFixture.profile.checkpoint(SiegeFixture.run);SiegeFixture.persist();});
    const saved=await page.evaluate(()=>SiegeFixture.profile.active.bankable),beforeReload=await page.evaluate(()=>SiegeFixture.profile.cheese);await page.reload();assert.equal(await page.evaluate(()=>SiegeFixture.profile.cheese),beforeReload+saved);await page.reload();assert.equal(await page.evaluate(()=>SiegeFixture.profile.cheese),beforeReload+saved);
    assert.equal(await page.evaluate(()=>SiegeFixture.profile.upgrades.extra_jump),1);
    for(const [width,height,name]of [[1365,900,'desktop'],[390,844,'phone'],[844,390,'landscape'],[320,568,'small-phone']]){
      await page.setViewportSize({width,height});await page.evaluate(()=>SiegeFixture.start());await page.waitForTimeout(80);
      const layout=await page.evaluate(()=>{const c=document.getElementById('game').getBoundingClientRect(),v=document.getElementById('viewport').getBoundingClientRect();return{width:c.width,height:c.height,ratio:480/SiegeFixture.run.viewHeight,inside:c.left>=v.left-1&&c.right<=v.right+1&&c.top>=v.top-1&&c.bottom<=v.bottom+1,scroll:document.documentElement.scrollWidth>innerWidth+1};});
      assert.ok(layout.width>100&&layout.height>100&&layout.inside,JSON.stringify({name,layout}));assert.ok(Math.abs(layout.width/layout.height-layout.ratio)<.02);assert.equal(layout.scroll,false);
      await page.screenshot({path:path.join(shots,'sky-siege-'+name+'.png')});
      await page.locator('#edit-keys').click();await page.locator('[data-key-action="place"]').click();await page.keyboard.press('KeyF');await page.locator('.control-settings [data-save]').click();assert.equal(await page.evaluate(()=>SiegeFixture.settings.resolve('KeyF')),'place');
      console.log('PASS viewport and controls: '+name);
    }
    // Simultaneous real touch: hold right outside the joystick and tap Jump independently.
    await page.setViewportSize({width:390,height:844});await page.evaluate(()=>SiegeFixture.start());await page.waitForTimeout(60);
    const cdp=await context.newCDPSession(page),stick=await page.locator('#move-stick').boundingBox(),jump=await page.locator('#jump').boundingBox(),touch=(id,x,y)=>({id,x,y,radiusX:5,radiusY:5,force:1});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch(1,stick.x+stick.width/2,stick.y+stick.height/2),touch(2,jump.x+jump.width/2,jump.y+jump.height/2)]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touch(1,stick.x+stick.width+15,stick.y+stick.height/2),touch(2,jump.x+jump.width/2,jump.y+jump.height/2)]});
    await page.waitForTimeout(160);assert.ok(await page.evaluate(()=>SiegeFixture.run.player.x>250&&SiegeFixture.run.player.y<0));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[touch(2,jump.x+jump.width/2,jump.y+jump.height/2)]});await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>SiegeFixture.poll().jump),false);assert.ok(await page.evaluate(()=>SiegeFixture.poll().x>.5));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(30);assert.equal(await page.evaluate(()=>SiegeFixture.poll().x),0);
    // Render the five themes with all enemies and defenses; no live data required.
    await page.evaluate(()=>{
      for(let i=0;i<5;i++){const r=new SkySiege.Run({seed:4});r.highestLayer=i*25+3;const p=r.layer(3).platforms[0];for(const [j,type]of Object.keys(SkySiege.TRAPS).entries()){const shelf=r.layer(j+1).platforms[0];shelf.trap={type,x:shelf.x+40,y:shelf.y,state:type==='firecracker'?'fuse':'ready',ends:5,expires:100,uses:3};}r.cats=Object.keys(SkySiege.CAT_TYPES).map((type,j)=>({id:j,type,hp:2,layer:3,x:60+j*100,y:-240,state:'waiting',revealedUntil:100}));SkySiegeArt.draw(document.getElementById('game'),r);}
    });
    const performanceSample=await page.evaluate(()=>{
      const r=new SkySiege.Run({seed:812,viewHeight:600});r.highestLayer=18;r.cameraY=-1812;r.manageLayers();
      for(let i=0;i<4;i++)r.spawnWave({number:i+8,types:['walker','jumper','tank','ninja']});
      for(const [i,c]of r.cats.entries()){const p=r.layer(15+i%2).platforms[i%r.layer(15+i%2).platforms.length];Object.assign(c,{layer:p.layer,platform:p.id,x:p.x+p.w/2,y:p.y,travel:null,waitUntil:0});}
      for(let i=0;i<10;i++){const p=r.layer(i+7).platforms[0];Object.assign(r.player,{x:p.x+35,y:p.y,standing:p.id,grounded:true});r.cheese=1000;r.nextPlace=0;r.place(Object.keys(SkySiege.TRAPS)[i%4]);}
      const top=r.layer(18).platforms[0];Object.assign(r.player,{x:top.x+top.w/2,y:top.y,standing:top.id,grounded:true});
      const start=performance.now();for(let i=0;i<40;i++){r.update({},1/60);SkySiegeArt.draw(document.getElementById('game'),r);}
      return{millisecondsPerFrame:(performance.now()-start)/40,cats:r.cats.length,defenses:r.platforms.filter(p=>p.trap).length};
    });
    console.log('Stress sample:',performanceSample);
    assert.deepEqual(errors,[]);console.log('PASS jump, pause, trap placement, retreat, upgrades, one-time recovery, two-finger input and all theme renders.');await context.close();
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
