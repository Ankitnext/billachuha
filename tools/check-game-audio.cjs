// Playwright source/audio verification. No account, live server or downloaded audio.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb'),app=path.resolve(root,'../billachuha_app/app/src/main/assets/long_run');
async function main(){
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext();
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url()),type=route.request().resourceType();
      if(url.hostname!=='audio.test')return route.fulfill({contentType:type==='image'?'image/svg+xml':'text/plain',body:type==='image'?'<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#75965a"/></svg>':''});
      if(url.pathname==='/test')return route.fulfill({contentType:'text/html',body:'<!doctype html><button id="sound">Sound on</button><script src="/game-audio.js"></script>'});
      if(url.pathname.startsWith('/auth')||url.pathname.startsWith('/api'))return route.fulfill({status:401,contentType:'application/json',body:'{"error":{"message":"Test fixture"}}'});
      const online=url.pathname.startsWith('/multiplayer'),offline=url.pathname.startsWith('/offline/'),base=online?backend:offline?app:root;let relative=online?url.pathname.replace(/^\/multiplayer\/?/,'')||'index.html':offline?url.pathname.slice(9):url.pathname.slice(1);
      if(relative==='modes')relative='modes.html';
      const file=path.resolve(base,relative);
      if(!file.startsWith(base+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:'Not found'});
      let body=fs.readFileSync(file);
      if(online&&relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,"screen('home');");
      if(online&&relative==='modes.js')body=body.toString().replace(/\nboot\(\);/,"\nshow('home');");
      const mime={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'}[path.extname(file)]||'application/octet-stream';
      await route.fulfill({contentType:mime,body});
    });
    await context.addInitScript(()=>{localStorage.setItem('chase.has_seen_tutorial.v1','1');});
    const page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);
    page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.message);});
    await page.goto('http://audio.test/test');
    const spectra=await page.evaluate(async()=>{
      const results={};
      for(const name of ['pistol','shotgun','smg','rifle','sniper','rocket','minigun','flame','turret','explosion','reload','hook']){
        const c=new OfflineAudioContext(1,44100,44100),s=GameAudio.create({key:'test'});s.enabled=true;s.context=c;
        Object.defineProperty(c,'state',{value:'running'});s.master=c.createGain();s.master.gain.value=.25;s.master.connect(c.destination);
        s.noise=c.createBuffer(1,44100,44100);const noise=s.noise.getChannelData(0);let seed=19;
        for(let i=0;i<noise.length;i++){seed=(seed*1664525+1013904223)>>>0;noise[i]=seed/2147483648-1;}
        if(!s.play(name))throw Error('Could not synthesize '+name);
        const audio=(await c.startRendering()).getChannelData(0);
        const rms=(from,to)=>Math.sqrt(audio.slice(from*44100,to*44100).reduce((sum,x)=>sum+x*x,0)/((to-from)*44100));
        results[name]={early:rms(0,.08),tail:rms(.13,.22),peak:audio.reduce((peak,x)=>Math.max(peak,Math.abs(x)),0),finite:audio.every(Number.isFinite)};
      }
      return results;
    });
    for(const [name,result]of Object.entries(spectra)){assert.ok(result.finite&&result.early>.0001&&result.peak<=1,name+' should produce finite, audible, bounded samples');}
    assert.ok(spectra.shotgun.tail>spectra.pistol.tail*10+.0001,'shotgun must have a heavier tail than pistol');
    assert.ok(spectra.explosion.tail>spectra.smg.tail+.001,'explosion must sustain beyond automatic fire');
    await page.evaluate(()=>{window.sfx=GameAudio.create({key:'browser.audio.test'}).bind([document.getElementById('sound')]);});
    assert.equal(await page.evaluate(()=>sfx.enabled),true);
    await page.keyboard.press('KeyA');await page.waitForFunction(()=>sfx.context?.state==='running');
    assert.equal(await page.evaluate(()=>sfx.play('shotgun')),true);
    await page.locator('#sound').click();
    assert.deepEqual(await page.evaluate(()=>({enabled:sfx.enabled,voices:sfx.active.size,muted:!sfx.play('pistol'),saved:localStorage.getItem('browser.audio.test')})),{enabled:false,voices:0,muted:true,saved:'off'});
    console.log('PASS rendered 12 synthesized effects; default-on gesture unlock; immediate mute and persisted preference.');
    for(const url of ['/multiplayer','/multiplayer/modes?game=zombie-horde','/multiplayer/modes?game=zombie-horde&variant=capture','/multiplayer/modes?game=arena-blitz','/dungeon-dash.html','/snake-ladder.html','/index2.html','/index4.html','/index6.html','/fight.html','/trap-escape.html','/cat-chase.html','/super-fight.html']){
      await page.goto('http://audio.test'+url);
      const button=url==='/multiplayer'?page.locator('#home-sound'):['/index4.html','/fight.html'].includes(url)?page.getByRole('button',{name:/^(Enable|Mute) game sounds$/}).first():page.locator('#sound');
      // Horde's toggle is intentionally inside the arena, so expose its existing toolbar for this source check.
      const expose=async()=>{if(url.includes('/modes'))await page.evaluate(()=>{document.getElementById('arena').hidden=false;document.getElementById('home').hidden=true;});};await expose();
      assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await button.innerText(),'Sound on');
      await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');
      await page.reload();await expose();assert.equal(await button.getAttribute('aria-pressed'),'false');assert.equal(await button.innerText(),'Sound off');
      await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
      await page.reload();await expose();assert.equal(await button.getAttribute('aria-pressed'),'true');
      console.log('PASS default-on, mute and preference reload: '+url);
    }
    await page.goto('http://audio.test/offline/index.html');await page.waitForFunction(()=>window.LongRun?.getState().mode==='ready');assert.equal(await page.locator('#mute').innerText(),'Sound on');
    await page.locator('#primary-action').click();await page.locator('#mute').click();assert.equal(await page.locator('#mute').innerText(),'Sound off');await page.reload();await page.waitForFunction(()=>window.LongRun?.getState().mode==='ready');assert.equal(await page.locator('#mute').innerText(),'Sound off');await page.locator('#primary-action').click();await page.locator('#mute').click();assert.equal(await page.locator('#mute').innerText(),'Sound on');
    console.log('PASS offline Android Long Run keeps default-on and saved mute behavior.');
    assert.deepEqual(errors,[]);
    await context.close();
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
