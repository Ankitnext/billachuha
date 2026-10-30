const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const M=require('../character-motion.js');

function travel(fps){const t=new M.Tracker();let pose;for(let i=0;i<=fps;i++)pose=t.sample('rat',{x:i/fps*150,y:20},i/fps);return pose;}
test('the same travelled distance produces the same walk cycle at 30, 60 and 120 FPS',()=>{
  const poses=[30,60,120].map(travel);
  for(const p of poses){assert.ok(p.speed>149);assert.ok(Math.abs(p.phase-poses[0].phase)<1e-10);assert.ok(Math.abs(p.swing-poses[0].swing)<.001);}
});
test('stopped or blocked characters settle; rotating aim alone never starts footsteps',()=>{
  const t=new M.Tracker();let p;
  for(let i=0;i<120;i++)p=t.sample('cat',{x:30,y:40,aimX:Math.sin(i),aimY:Math.cos(i)},i/60,{topDown:true});
  assert.equal(p.swing,0);assert.equal(p.speed,0);
  t.sample('cat',{x:50,y:40},2,{topDown:true});
  for(let i=1;i<=60;i++)p=t.sample('cat',{x:50,y:40},2+i/60,{topDown:true});
  assert.equal(p.swing,0);assert.equal(p.speed,0);
});
test('top-down vertical walking animates while platform vertical flight does not',()=>{
  const t=new M.Tracker();for(let i=0;i<20;i++){
    t.sample('top',{x:0,y:i*2},i/60,{topDown:true});t.sample('side',{x:0,y:i*2},i/60);
  }
  assert.ok(t.sample('top',{x:0,y:40},20/60,{topDown:true}).speed>100);
  assert.equal(t.sample('side',{x:0,y:40},20/60).speed,0);
});
test('jump, fall, jetpack and landing have separate poses without ground running in the air',()=>{
  const rise=M.pose({grounded:false,vy:-400,speed:250,phase:1}),fall=M.pose({grounded:false,vy:400}),jet=M.pose({grounded:false,jetting:true});
  assert.equal(rise.swing,0);assert.ok(rise.tuck>fall.tuck);assert.ok(rise.reach>jet.reach);
  const t=new M.Tracker();t.sample('rat',{x:0,y:0},0,{grounded:false});
  const landed=t.sample('rat',{x:0,y:0},1/60,{grounded:true});assert.ok(landed.bob>1);
  const resting=t.sample('rat',{x:0,y:0},.2,{grounded:true});assert.equal(resting.bob,0);
});
test('pause, reconnect, teleport, defeat and removed actors cannot leave runaway animation',()=>{
  const t=new M.Tracker();t.sample('dog',{x:0,y:0},0);const moving=t.sample('dog',{x:4,y:0},.02);
  assert.deepEqual(t.sample('dog',{x:4,y:0},.02),moving);
  assert.equal(t.sample('dog',{x:900,y:0},.04).speed,0);
  assert.equal(t.sample('dog',{x:902,y:0},2).speed,0);
  assert.equal(t.sample('dog',{x:904,y:0},2.02,{dead:true}).swing,0);
  t.sample('other',{x:0,y:0},2);t.prune(['dog']);assert.equal(t.states.size,1);t.clear();assert.equal(t.states.size,0);
});
test('reduced motion suppresses gait and bounce but still communicates jumping',()=>{
  const p=M.pose({phase:1,speed:300,motion:false,landing:1});assert.equal(p.swing,0);assert.equal(p.bob,0);
  assert.ok(M.pose({motion:false,grounded:false,vy:-100}).tuck>0);
});
test('sampling never changes authoritative actors and rejects invalid position values',()=>{
  const t=new M.Tracker(),actor=Object.freeze({x:20,y:30,z:0,hp:90});t.sample('rat',actor,0);t.sample('rat',actor,.1);
  assert.deepEqual(actor,{x:20,y:30,z:0,hp:90});
  assert.ok(Object.values(t.sample('bad',{x:NaN,y:Infinity,z:-Infinity},NaN)).filter(x=>typeof x==='number').every(Number.isFinite));
});
test('website, embedded multiplayer and offline Android ship the identical animation helper',()=>{
  const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'character-motion.js'),'utf8');
  for(const file of ['../billachuha_backend/internal/playweb/character-motion.js','../billachuha_app/app/src/main/assets/long_run/character-motion.js']){
    const target=path.resolve(root,file);if(fs.existsSync(target))assert.equal(fs.readFileSync(target,'utf8'),source);
  }
});
