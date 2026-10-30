const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {SnapshotSounds,weapons,distanceGain}=require('../game-audio.js');
function mode(time,effects=[],change={}){return{matchId:'one',serverTime:time,mode:{players:[{id:'self',x:0,y:0,hp:100,kills:0,reloadIn:0,...change}],effects,shots:[]}};}
test('a shotgun trigger creates one distinct blast, not one per pellet or repeated snapshot',()=>{
  const tracker=new SnapshotSounds();assert.deepEqual(tracker.update(mode(100), 'self',100),[]);
  const shot={id:1,kind:'muzzle',weapon:'shotgun',owner:'self',x:20,y:0};
  assert.deepEqual(tracker.update(mode(150,[shot]),'self',150).map(e=>e.name),['shotgun']);
  assert.deepEqual(tracker.update(mode(200,[shot]),'self',200),[]);
  assert.deepEqual(tracker.update(mode(250,[shot,{...shot,id:2}]),'self',250).map(e=>e.name),['shotgun']);
  assert.equal(new Set(Object.values(weapons).map(w=>JSON.stringify(w))).size,Object.keys(weapons).length);
});
test('first join, mute, reconnect, stale packets and a new round never replay old combat',()=>{
  const tracker=new SnapshotSounds(),effect={id:50,kind:'explosion',x:0,y:0};
  assert.deepEqual(tracker.update(mode(100,[effect]),'self',100),[]);
  assert.deepEqual(tracker.update(mode(150,[{...effect,id:51}]),'self',150,false),[]);
  assert.deepEqual(tracker.update(mode(200,[{...effect,id:51}]),'self',200),[]);
  assert.deepEqual(tracker.update(mode(175,[{...effect,id:52}]),'self',210),[]);
  assert.deepEqual(tracker.update(mode(1500,[{...effect,id:53}]),'self',1500),[]);
  assert.deepEqual(tracker.update({...mode(20,[{...effect,id:1}]),matchId:'new'},'self',1550),[]);
});
test('nearby combat, reloads, damage and kills have separate cues; far sounds are silent',()=>{
  const tracker=new SnapshotSounds();tracker.update(mode(100),'self',100);
  const events=tracker.update(mode(150,[{id:1,kind:'explosion',x:2000,y:0},{id:2,kind:'jump',x:20,y:0}],{hp:80,kills:1,reloadIn:1}),'self',150);
  assert.deepEqual(events.map(e=>e.name),['jump','reload','hurt','confirm']);
  assert.ok(events.every(e=>e.volume>0&&e.volume<=1));assert.equal(distanceGain(1001,0,{x:0,y:0}),0);
});
test('Chase dog bullets and hooks deduplicate, and cooldown fallback covers instant impacts',()=>{
  const tracker=new SnapshotSounds();
  const world=t=>({matchId:'chase',serverTime:t,players:[{id:'self',x:0,y:0}],shots:[],self:{role:'dog',ammo:10,health:100,primaryReadyInMs:0,secondaryReadyInMs:0}});
  tracker.update(world(100),'self',100);
  const next=world(150);next.shots=[{id:'bullet',kind:'bullet',owner:'self',x:10,y:0}];next.self.ammo=9;next.self.primaryReadyInMs=250;
  assert.deepEqual(tracker.update(next,'self',150).map(e=>e.name),['pistol']);
  assert.deepEqual(tracker.update({...next,serverTime:200},'self',200),[]);
  const hook={...next,serverTime:250,self:{...next.self,secondaryReadyInMs:8000},shots:[...next.shots,{id:'hook',kind:'hook',owner:'self',x:5,y:0}]};
  assert.deepEqual(tracker.update(hook,'self',250).map(e=>e.name),['hook']);
});
test('independent website and embedded procedural audio copies stay identical',()=>{
  const backend=path.resolve(__dirname,'../../billachuha_backend/internal/playweb/game-audio.js');
  if(fs.existsSync(backend))assert.equal(fs.readFileSync(backend,'utf8'),fs.readFileSync(path.resolve(__dirname,'../game-audio.js'),'utf8'));
});
test('Dungeon Dash retains the fired weapon for its final shell after automatic pistol fallback',()=>{
  const {Run}=require('../dungeon-dash-core.js');const run=new Run({seed:4});
  run.weapon={type:'shotgun',ammo:1};run.nextShot=0;run.fire();
  assert.equal(run.weapon.type,'pistol');assert.equal(run.lastWeaponFired,'shotgun');
});
