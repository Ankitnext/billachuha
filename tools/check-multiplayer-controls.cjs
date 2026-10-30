// Optional real-browser checks; uses intercepted local source and no accounts/server.
// NODE_PATH must provide Playwright. CHROMIUM_PATH may select an installed browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const backend = path.resolve(root, '../billachuha_backend/internal/playweb');
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
async function main() {
  const browser = await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try {
    const context=await browser.newContext({viewport:{width:1280,height:800}});
    await context.route('http://controls.test/**',async route=>{
      const url=new URL(route.request().url());
      const online=url.pathname.startsWith('/multiplayer');
      const relative=online?url.pathname.replace(/^\/multiplayer\/?/,'')||'index.html':url.pathname.slice(1);
      const file=path.resolve(online?backend:root,relative==='modes'?'modes.html':relative);
      if(!file.startsWith((online?backend:root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Not found'});
      let body=fs.readFileSync(file);
      if(relative==='game.js'&&online)body=body.toString().replace(/restoreSession\(\);\s*$/, "screen('home');window.ControlFixture={keys,settings:chaseControls,axis:movementAxis};");
      if(relative==='modes.js')body=body.toString().replace(/\nboot\(\);/,"\nshow('home');window.ControlFixture={keys,settings:modeControls,input,setup(){show('arena');receivedAt=performance.now()+1000000;}};");
      if(relative==='snake-ladder.js')body=body.toString().replace(/\}\)\(\);\s*$/,"window.ControlFixture={keys,settings:controlSettings,setup(){game=new Core.Race({mode:'solo',players:[{name:'Test',role:'rat'}],seed:7});game.roll(1);game.startStage();renderState();$('action-canvas').focus();},get x(){return game.stage.player.x;}};})();");
      if(relative==='super-fight/menu.js')body=body.toString().replace(/\}\)\(\);\s*$/,"window.ControlFixture={input,start};})();");
      await route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body});
    });
    await context.addInitScript(()=>{localStorage.setItem('chase.has_seen_tutorial.v1','1');localStorage.setItem('chase.has_seen_controls.v1','1');});
    const page=await context.newPage(), errors=[];page.setDefaultTimeout(8000);
    page.on('pageerror',error=>(errors.push(error.message),console.error('PAGE ERROR:',error.message)));
    async function bind(action,code) {
      await page.locator(`[data-key-action="${action}"]`).click();
      await page.keyboard.press(code);
    }
    async function save() {await page.locator('.control-settings [data-save]').click();await page.locator('.control-settings').waitFor({state:'hidden'});}
    const cases=[
      ['/multiplayer','home-edit-keys','home-edit-hud','d','KeyD'],
      ['/multiplayer/modes?game=zombie-horde','home-edit-keys','home-edit-hud','d','KeyD'],
      ['/multiplayer/modes?game=zombie-horde&variant=capture','home-edit-keys','home-edit-hud','d','KeyD'],
      ['/multiplayer/modes?game=arena-blitz','home-edit-keys','home-edit-hud','d','KeyD'],
      ['/snake-ladder.html','edit-keys','edit-hud','d','KeyD'],
      ['/super-fight.html','edit-keys','edit-hud','KeyD','KeyD']
    ];
    for(const [url,keysButton,hudButton,action,oldCode] of cases) {
      await page.goto('http://controls.test'+url);
      await page.locator('#'+keysButton).click();
      await bind(action,'KeyA');
      assert.match(await page.locator('.cs-status').innerText(),/already used/);
      await page.keyboard.press('Escape'); // Cancel capture, keep the editor open.
      assert.equal(await page.locator('.control-settings').evaluate(d=>d.open),true);
      await bind(action,'KeyB');
      await save();
      assert.equal(await page.evaluate(()=>{const s=window.ControlFixture.settings||window.ControlFixture.input.settings;return s.resolve('KeyB');}),action);
      assert.equal(await page.evaluate(code=>{const s=window.ControlFixture.settings||window.ControlFixture.input.settings;return s.resolve(code);},oldCode),undefined);
      await page.reload();
      assert.equal(await page.evaluate(()=>{const s=window.ControlFixture.settings||window.ControlFixture.input.settings;return s.resolve('KeyB');}),action);
      if(url.includes('/modes')) {
        await page.evaluate(()=>window.ControlFixture.setup());
        await page.keyboard.down('KeyB');
        assert.equal(await page.evaluate(()=>window.ControlFixture.input().x),1);
        await page.keyboard.up('KeyB');
        assert.equal(await page.evaluate(()=>window.ControlFixture.input().x),0);
        await page.locator('#arena-edit-keys').click();
        await page.keyboard.down('KeyB');
        assert.equal(await page.evaluate(()=>window.ControlFixture.keys.size),0);
        await page.keyboard.up('KeyB');
        await page.locator('.control-settings [data-cancel]').click();
        await page.evaluate(()=>{document.getElementById('arena').hidden=true;document.getElementById('home').hidden=false;document.body.classList.remove('is-playing');});
      }
      await page.locator('#'+hudButton).click();
      if(url==='/multiplayer') {await page.locator('.hud-editor [data-cancel]').click();console.log('PASS keys, conflicts, persistence and existing HUD: '+url);continue;}
      const preview=page.locator('.cs-preview button').first();
      await preview.focus();await page.keyboard.press('ArrowUp');
      await page.locator('.cs-tools [data-opacity]').fill('60');
      await save();
      const stored=await page.evaluate(()=>{
        const key=Object.keys(localStorage).find(k=>k.endsWith('controls.v1')&&JSON.parse(localStorage[k]).layouts?.landscape);
        return key?JSON.parse(localStorage[key]):null;
      });
      assert.ok(stored?.layouts.landscape);
      await page.locator('#'+hudButton).click();
      await page.locator('.control-settings [data-reset]').click();await save();
      if(url==='/super-fight.html') {
        await page.locator('[name="mode"][value="local"]').check();
        await page.evaluate(async()=>{window.ControlFixture.start();await new Promise(requestAnimationFrame);});
        await page.keyboard.down('KeyB');await page.keyboard.down('ArrowLeft');
        assert.deepEqual(await page.evaluate(()=>window.ControlFixture.input.sample().map(p=>p.x)),[1,-1]);
        await page.keyboard.up('KeyB');await page.keyboard.up('ArrowLeft');
        await page.locator('#edit-keys').click();await page.keyboard.press('KeyB');
        assert.equal(await page.evaluate(()=>window.ControlFixture.input.keys.size),0);
        await page.locator('.control-settings [data-cancel]').click();
      }
      if(url==='/snake-ladder.html') {
        await page.evaluate(()=>window.ControlFixture.setup());
        const x=await page.evaluate(()=>window.ControlFixture.x);
        await page.keyboard.down('KeyB');
        await page.waitForFunction(x=>window.ControlFixture.x>x+2,x);
        await page.keyboard.up('KeyB');
      }
      console.log('PASS keys, conflicts, persistence and HUD: '+url);
    }
    // Two aliases held together must release independently.
    await page.goto('http://controls.test/multiplayer/modes?game=zombie-horde');
    await page.evaluate(()=>window.ControlFixture.setup());
    await page.keyboard.down('KeyW');await page.keyboard.down('ArrowUp');await page.keyboard.up('KeyW');
    assert.equal(await page.evaluate(()=>window.ControlFixture.input().y),-1);
    await page.keyboard.up('ArrowUp');assert.equal(await page.evaluate(()=>window.ControlFixture.input().y),0);
    // Compact portrait: all settings stay reachable, save layouts per orientation.
    await page.setViewportSize({width:390,height:844});
    await page.locator('#arena-edit-hud').click();
    await page.locator('.cs-preview button').first().focus();await page.keyboard.press('ArrowUp');
    await save();
    await page.locator('#arena-edit-keys').click();
    assert.ok(await page.locator('.control-settings [data-save]').isVisible());
    await page.screenshot({path:path.join(root,'tools/screenshots/multiplayer-control-settings.png')});
    await page.locator('.control-settings [data-cancel]').click();
    assert.deepEqual(errors,[]);
    console.log('PASS physical-key aliases, editor input isolation and phone layout.');
    await context.close();
  } finally {await browser.close();}
}
fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});
main().catch(error=>{console.error(error);process.exitCode=1;});
