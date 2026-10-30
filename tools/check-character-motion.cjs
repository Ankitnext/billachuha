// Local-source browser checks. No live matches, accounts or network server.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..'),backend=path.resolve(root,'../billachuha_backend/internal/playweb'),app=path.resolve(root,'../billachuha_app/app/src/main/assets/long_run');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
async function main(){
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  try{
    const context=await browser.newContext({viewport:{width:1280,height:900}}),errors=[];
    await context.route('**/*',async route=>{
      const url=new URL(route.request().url());if(url.hostname!=='motion.test')return route.abort();
      if(url.pathname==='/lab')return route.fulfill({contentType:'text/html',body:`<!doctype html><style>body{margin:0;background:#e8eee2}canvas{max-width:100%}</style><canvas id="lab" width="1080" height="990"></canvas>${['/character-motion.js','/multiplayer/mode-art.js','/trap-escape/physics.js','/trap-escape/art.js','/sky-siege-core.js','/sky-siege-art.js','/kitchen-heist/physics.js','/kitchen-heist/levels.js','/kitchen-heist/vision.js','/kitchen-heist/art.js','/dungeon-dash-core.js','/dungeon-dash-art.js','/snake-ladder-core.js','/snake-ladder-art.js'].map(s=>`<script src="${s}"></script>`).join('')}`});
      const online=url.pathname.startsWith('/multiplayer'),offline=url.pathname.startsWith('/offline/'),base=online?backend:offline?app:root;
      let relative=online?url.pathname.replace(/^\/multiplayer\/?/,'')||'index.html':offline?url.pathname.slice(9)||'index.html':url.pathname.slice(1);if(relative==='modes')relative='modes.html';
      const file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return route.fulfill({status:404,body:'Missing source'});
      let body=fs.readFileSync(file);
      if(online&&relative==='modes.js')body=body.toString().replace(/\nboot\(\);/,`\nshow('home');window.MotionMatch={set(w){oldWorld=world;oldReceivedAt=performance.now()-160;world=w;receivedAt=performance.now()-80;me={id:'one'};show('arena');fit();},sample(p,t,options){return characterMotion.sample(p.id,p,t,options);}};`);
      if(online&&relative==='game.js')body=body.toString().replace(/restoreSession\(\);\s*$/,`screen('home');window.MotionMatch={set(w){me={id:'one'};receiveWorld(w);screen('arena');}};`);
      await route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body});
    });
    await context.addInitScript(()=>{localStorage.setItem('chase.has_seen_tutorial.v1','1');localStorage.setItem('kitchen-heist.tutorial.v1','1');localStorage.setItem('sky-siege.tutorial.v1','1');});
    const page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://motion.test/lab');
    const result=await page.evaluate(()=>{
      const M=CharacterMotion,canvas=document.getElementById('lab'),c=canvas.getContext('2d');c.fillStyle='#e8eee2';c.fillRect(0,0,1080,990);
      const rows=[
        ['Horde Rat',(c,p,t,pose)=>ModeArt.character(c,{...p,role:'rat',aimX:1,aimY:0,weapon:'shotgun'},'#65c6f1',pose)],
        ['Horde Cat',(c,p,t,pose)=>ModeArt.character(c,{...p,role:'cat',aimX:-1,aimY:0},'#ff987b',pose)],
        ['Blitz Dog',(c,p,t,pose)=>ModeArt.character(c,{...p,role:'dog',aimX:1,aimY:0,weapon:'rifle'},'#b9a087',pose,{platform:true})],
        ['Zombie',(c,p,t,pose)=>ModeArt.zombie(c,{...p,x:0,y:0,radius:18},'#8ea45c',pose)],
        ['Chase Rat',(c,p,t,pose)=>{M.topLimbs(c,pose,{color:'#c5e66b'});c.fillStyle='#c5e66b';c.beginPath();c.ellipse(0,0,16,12,0,0,7);c.fill();}],
        ['Sky Rat',(c,p,t)=>{c.translate(-p.x,-p.y);SkySiegeArt.rat(c,p,t);}],
        ['Sky Cat',(c,p,t)=>{c.translate(-p.x,-p.y);SkySiegeArt.cat(c,p,t);}],
        ['Heist Cat',(c,p,t)=>{c.translate(-p.x,-p.y);KitchenHeist.HeistArt.cat(c,p,t);}],
        ['Long Run',(c,p,t,pose)=>M.rat(c,pose)]
      ];
      const pixels=[];
      for(let row=0;row<rows.length;row++){
        const [name,draw]=rows[row],p={x:0,y:0,vx:200,vy:0,face:1,grounded:true,angle:0,type:'walker',state:'waiting',hp:1},tracker=new M.Tracker();
        let frames=[];
        for(let frame=0;frame<6;frame++){
          const t=frame*.08;p.x=frame===0?0:frame===1?8:16;p.grounded=frame<3;p.vy=frame===3?-400:400;p.travel=frame>=3?{}:null;p.jetting=frame===5;
          const pose=tracker.sample(name,p,t,{grounded:p.grounded,vy:p.vy});
          c.save();c.translate(frame*180+90,row*110+67);c.fillStyle='#31504d';c.font='11px system-ui';c.textAlign='center';c.fillText(frame===0?name:['','Step A','Step B','Jump','Fall','Jet'][frame],0,37);
          draw(c,p,t,pose);c.restore();frames.push(Array.from(c.getImageData(frame*180+40,row*110,100,93).data));
        }
        const diff=(a,b)=>a.reduce((n,v,i)=>n+(Math.abs(v-b[i])>15?1:0),0);
        pixels.push({name,walk:diff(frames[0],frames[1]),air:diff(frames[1],frames[3])});
      }
      // Exercise the real full-scene renderers, recording the player's limb pose.
      const poses=[],limbs=M.sideLimbs;M.sideLimbs=(c,p,options)=>{poses.push(p);return limbs(c,p,options);};
      const target=document.createElement('canvas');target.width=800;target.height=600;
      const r=new DungeonDash.Run({seed:4,width:800,height:600});DungeonArt.draw(target.getContext('2d'),target,r,0);r.player.x+=8;r.elapsed=.08;DungeonArt.draw(target.getContext('2d'),target,r,0);const dungeonWalk=poses.at(-1).speed;
      r.player.standing=null;r.player.vy=-400;r.elapsed=.16;DungeonArt.draw(target.getContext('2d'),target,r,0);const dungeonJump=poses.at(-1).tuck;
      const race=new StairsGame.Race({mode:'solo',players:[{role:'cat',name:'Test'}],seed:4});race.roll(1);race.startStage();const s=race.stage;
      StairsArt.stage(target.getContext('2d'),target,s,{x:0,y:0},0);s.player.x+=8;s.elapsed=.08;StairsArt.stage(target.getContext('2d'),target,s,{x:0,y:0},0);const stairsWalk=poses.at(-1).speed;
      s.player.standing=null;s.player.vy=-400;s.elapsed=.16;StairsArt.stage(target.getContext('2d'),target,s,{x:0,y:0},0);const stairsJump=poses.at(-1).tuck;
      M.sideLimbs=limbs;return {pixels,dungeonWalk,dungeonJump,stairsWalk,stairsJump};
    });
    for(const p of result.pixels){assert.ok(p.walk>10,`${p.name}: visible walk cycle`);if(p.name!=='Heist Cat')assert.ok(p.air>10,`${p.name}: visible airborne pose`);}
    for(const key of ['dungeonWalk','dungeonJump','stairsWalk','stairsJump'])assert.ok(result[key]>0,key);
    fs.mkdirSync(path.join(root,'tools/screenshots'),{recursive:true});await page.locator('#lab').screenshot({path:path.join(root,'tools/screenshots/character-motion-poses.png')});
    console.log('PASS visible limb animation for all nine character samples and full Dungeon/Stairs scene renderers.');
    for(const variant of ['zombie-horde','zombie-horde&variant=capture','arena-blitz']){
      await page.goto('http://motion.test/multiplayer/modes?game='+variant);
      await page.evaluate(()=>{const h=!location.search.includes('arena-blitz');window.fixture={matchId:'animation',width:2400,height:h?1800:1100,ended:false,mode:{players:[{id:'one',name:'Rat',role:'rat',team:'alpha',x:400,y:400,hp:80,maxHp:80,aimX:1,aimY:0}],enemies:h?[{id:2,kind:'walker',x:480,y:450,radius:18,hp:30,maxHp:30}]:[],map:[{x:0,y:418,w:2400,h:20,kind:'ground'}],pickups:[],effects:[],shots:[],feed:[],decoys:[],phase:'playing'}};MotionMatch.set(fixture);});
      for(let i=0;i<6;i++){await page.evaluate(()=>{fixture=structuredClone(fixture);fixture.mode.players[0].x+=8;if(fixture.mode.enemies[0])fixture.mode.enemies[0].x+=4;MotionMatch.set(fixture);});await page.waitForTimeout(45);}
      await page.screenshot({path:path.join(root,'tools/screenshots/motion-'+variant.replaceAll(/[^a-z]/g,'-')+'.png')});console.log('PASS real multiplayer scene: '+variant);
    }
    await page.goto('http://motion.test/multiplayer');
    await page.evaluate(()=>{window.chaseFixture={matchId:'walk',width:2400,height:1800,ended:false,props:[],cheese:[],ammo:[],shots:[],scores:{rat:0,cat:0,dog:0},players:['rat','cat','dog'].map((role,i)=>({id:i?'other'+i:'one',name:role,role,x:600+i*70,y:600,z:0,aimX:1,aimY:0,health:100}))};MotionMatch.set(chaseFixture);});
    await page.waitForTimeout(70);await page.evaluate(()=>{chaseFixture=structuredClone(chaseFixture);chaseFixture.players.forEach(p=>p.x+=10);MotionMatch.set(chaseFixture);});await page.waitForTimeout(70);
    await page.screenshot({path:path.join(root,'tools/screenshots/motion-chase.png')});console.log('PASS real Chase scene with all three roles.');
    for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      for(const [file,button]of [['kitchen-heist.html','start'],['sky-siege.html','start'],['dungeon-dash.html','start'],['cat-chase.html','continue'],['trap-escape.html','continue'],['/offline/index.html','primary-action']]){
        await page.goto('http://motion.test/'+file.replace(/^\//,''));await page.locator('#'+button).click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(130);await page.keyboard.up('ArrowRight');await page.keyboard.press('Space');await page.waitForTimeout(80);
      }
      await page.goto('http://motion.test/index4.html');await page.keyboard.press('ArrowRight');await page.waitForTimeout(100);
    }
    assert.deepEqual(errors,[]);console.log('PASS desktop/phone game entry points and offline Android Long Run; no browser errors.');
    await context.close();
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
