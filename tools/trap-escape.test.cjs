const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../trap-escape/physics.js'),{EscapeGame,starsFor}=require('../trap-escape/engine.js'),{LEVELS}=require('../trap-escape/levels.js'),{loadLevel}=require('../trap-escape/level.js'),{PathRecorder}=require('../trap-escape/recorder.js'),{EscapeSave}=require('../trap-escape/save.js'),{ITEMS,updateDrops}=require('../trap-escape/traps-drop.js'),{ENVIRONMENT,updateEnvironment}=require('../trap-escape/traps-env.js');
const M=require('../trap-escape/machinery.js');

// The runner uses the same four inputs as a human: move, jump, drop and cycle.
// It never writes to the player, Cat, timer, platforms or win state.
function solve(index){
 const g=new EscapeGame(index);g.hitTypes=new Set();let lastDrop=-100,waypoint=0;
 for(let i=0;i<4200&&g.phase!=='won'&&g.retries===0;i++){
  const p=g.player,l=g.level;let x=1,jump=false;
  if(l.variant==='shelves'){
   while(waypoint<l.waypoints.length-1&&p.grounded&&Math.abs(p.y+p.h-l.waypoints[waypoint].y)<3)waypoint++;
   const target=l.waypoints[waypoint];
   if(p.grounded&&p.y+p.h>target.y+3){if(p.x+28>=target.x-115)jump=true;}
   if(!p.grounded&&p.x>target.x+30&&p.y+p.h<target.y+5)x=-.35;
  }else{
   const gap=l.gaps.find(v=>p.x<v.x+v.w&&p.x+28>=v.x-48);
   jump=!!gap&&p.grounded;
  }
  if(p.grounded&&l.environment.some(t=>['shift','lift'].includes(t.type)&&p.x<t.x+t.w&&p.x+p.w>=t.x-44))jump=true;
  const drop=!!g.inventory.length&&p.grounded&&p.x-lastDrop>=55&&!g.prevDrop;
  if(drop)lastDrop=p.x;
  g.step({x,jump,drop});for(const e of g.events)if(e.type==='trap-hit')g.hitTypes.add(e.trap);g.events.length=0;
 }
 return g;
}
test('50 stages have valid, independent geometry and every trap is introduced',()=>{
 assert.equal(LEVELS.length,50);assert.equal(new Set(LEVELS.map(l=>l.id)).size,50);
 const types=new Set();for(const l of LEVELS){assert(l.spawn.x<l.door.x);assert(l.platforms.every(p=>p.w>0));l.pickups.concat(l.environment).forEach(t=>types.add(t.type));assert(l.gaps.every(g=>g.w<=120));}
 assert.equal(types.size,19);const copy=loadLevel(0);copy.platforms[0].x=20;assert.equal(LEVELS[0].platforms[0].x,0);
});
test('jump rises, lands and cannot pass through a solid wall',()=>{
 const l=loadLevel(0),p=P.createPlayer(l);P.movePlayer(p,{jump:true},l);assert(p.vy<0);assert(!p.grounded);
 for(let i=0;i<60;i++)P.movePlayer(p,{},l);assert.equal(p.y,360);assert(p.grounded);
 l.platforms.push({x:110,y:300,w:40,h:100,solid:true});for(let i=0;i<30;i++)P.movePlayer(p,{x:1},l);assert(p.x+p.w<=110);
});
test('recorder interpolates the route and bounds its history',()=>{
 const r=new PathRecorder(4);for(let i=0;i<8;i++)r.record({x:i*10,y:i,w:28,h:40,vx:240,vy:0,face:1,grounded:true},i);
 assert.equal(r.get(6.5).x,79);assert.equal(r.get(6.5).foot,46.5);assert.equal(r.get(0),null);assert.equal(r.frames.length,4);assert.equal(r.last-r.first,3);
});
test('Cat waits 90 frames and replays Rat center/feet at the configured speed',()=>{
 const g=new EscapeGame();for(let i=0;i<89;i++)g.step({x:1});assert.equal(g.cat.state,'waiting');
 g.step({x:1});assert.equal(g.cat.cursor,0);assert.equal(g.cat.x+g.cat.w/2,g.recorder.get(0).x);
 g.step({x:1});assert(Math.abs(g.cat.cursor-1.1)<1e-9);assert.equal(g.cat.y+g.cat.h,g.recorder.get(1.1).foot);
 assert(LEVELS[40].speed>LEVELS[0].speed);assert(LEVELS[40].delay<LEVELS[0].delay);
});
test('all six carried traps have distinct reactions and the specified stun time',()=>{
 for(const [type,spec]of Object.entries(ITEMS)){
  const g=new EscapeGame(9);g.phase='playing';g.frame=100;g.cat.state='chasing';g.elapsed=1;
  assert(g.hitCat({type}));assert.equal(g.cat.active.duration,spec.stun/60);assert.equal(g.cat.stuns,1);
 }
});
test('six environment traps arm only after Rat crosses the lever, then hit Cat',()=>{
 for(const [type,spec]of Object.entries(ENVIRONMENT).filter(([type])=>!M.MACHINERY[type])){
  const g=new EscapeGame(9);g.phase='playing';g.cat.state='chasing';const trap={type,x:250,y:400,triggerX:295,state:'idle',used:false};g.level.environment=[trap];
  g.player.x=200;updateEnvironment(g,1/60,190);assert.equal(trap.state,'idle');
  g.player.x=290;updateEnvironment(g,1/60,290);assert.equal(trap.state,'arming');assert.equal(g.cat.stuns,0);
  g.cat.x=250;g.cat.y=346;for(let i=0;i<13;i++)updateEnvironment(g,1/60,304);
  assert(trap.used,type);assert.equal(g.cat.active.duration,spec.stun/60);assert.equal(g.cat.stuns,1);
 }
});
test('drops arm safely, are single use, and firecracker waits for its two second fuse',()=>{
 const g=new EscapeGame(9);g.phase='playing';g.cat.state='chasing';g.cat.x=200;g.cat.y=346;
 const trap={type:'mousetrap',x:200,y:382,w:26,h:18,vy:0,age:0,used:false,armed:false,explosion:0};g.drops=[trap];
 updateDrops(g,.1);assert.equal(g.cat.stuns,0);updateDrops(g,.11);assert.equal(g.cat.stuns,1);updateDrops(g,1);assert.equal(g.cat.stuns,1);
 const fire={...trap,type:'firecracker',age:0,used:false};g.drops=[fire];updateDrops(g,1.9);assert.equal(g.cat.stuns,1);updateDrops(g,.11);assert.equal(g.cat.stuns,2);assert(fire.explosion>0);
});
test('stuns queue, combos expire after three seconds, and bosses need four hits plus a chain',()=>{
 const g=new EscapeGame(9);g.phase='playing';g.elapsed=1;g.hitCat({type:'banana'});g.elapsed=2;g.hitCat({type:'mousetrap'});assert.equal(g.bestCombo,2);assert.equal(g.cat.queue.length,1);
 g.elapsed=5.1;g.hitCat({type:'paint'});assert.equal(g.combo,1);assert.equal(g.phase,'playing');g.elapsed=5.5;g.hitCat({type:'bucket'});assert.equal(g.phase,'won');assert.equal(g.result.stars,3);
 const h=new EscapeGame(9);h.phase='playing';for(let i=0;i<4;i++){h.elapsed=i*4+1;h.hitCat({type:'banana'});}assert.equal(h.phase,'playing');
});
test('magnet pulls a nearby armed metal trap into the combo',()=>{
 const g=new EscapeGame(9);g.phase='playing';g.cat.x=200;g.cat.y=346;g.level.environment=[{type:'bucket',x:240,y:400,state:'armed',used:false}];g.hitCat({type:'magnet'});assert.equal(g.cat.stuns,2);assert.equal(g.bestCombo,2);assert(g.level.environment[0].used);
});
test('star rating distinguishes an exit, a stun, a par time, a chain and knockout',()=>{
 const s={elapsed:20,parMs:10000,stuns:0,bestCombo:0,targetStuns:3};assert.equal(starsFor(s),1);assert.equal(starsFor({...s,stuns:1}),2);assert.equal(starsFor({...s,elapsed:9}),3);assert.equal(starsFor({...s,bestCombo:3}),3);assert.equal(starsFor({...s,stuns:3}),3);
});
test('a failed attempt retries quickly, with no repeated death or stale item edge',()=>{
 const g=new EscapeGame();g.step({x:1});g.fail('test');g.fail('test');assert.equal(g.retries,1);for(let i=0;i<27;i++)g.step({drop:true,jump:true});assert.equal(g.attempt,2);assert.equal(g.retries,1);assert.equal(g.inventory.length,0);
});
test('save preserves best results, rejects malformed data and gates worlds',()=>{
 const s=new EscapeSave(null);assert(s.unlocked(0));assert(!s.unlocked(10));assert(!s.complete(4,{time:1000,stars:3}));
 for(let i=0;i<10;i++)assert(s.complete(i,{time:12000,stars:i<5?2:1,combo:1}));assert(s.worldUnlocked(1));
 s.complete(0,{time:10000,stars:1,combo:0});assert.equal(s.stars['1-1'],2);assert.equal(s.bestTimes['1-1'],10000);
 const roundtrip=new EscapeSave(JSON.parse(JSON.stringify(s)));assert.equal(roundtrip.totalStars,15);assert.equal(roundtrip.deaths,0);
 assert.equal(new EscapeSave({stars:{'1-1':-20},deaths:NaN}).totalStars,0);
});
for(let index=0;index<50;index++)test(`stage ${LEVELS[index].id} can be won with normal controls`,()=>{
 const g=solve(index);assert.equal(g.phase,'won',`${g.level.id}: ${g.phase}, ${g.message}, x=${Math.round(g.player.x)}, y=${Math.round(g.player.y)}, stuns=${g.cat.stuns}`);assert(g.elapsed<40);assert.equal(g.retries,0);
});
for(const [type,spec]of Object.entries(M.MACHINERY))test(`${spec.name}: waits for Rat's lever, catches Cat, queues one stun and resets visually`,()=>{
 const index=LEVELS.findIndex(l=>l.mechanic===type),g=new EscapeGame(index),t=g.level.environment.find(t=>t.type===type);g.phase='playing';g.elapsed=1;g.cat.state='chasing';g.cat.x=t.x+15-g.cat.w/2;g.cat.y=t.y-g.cat.h;
 g.player.x=t.x-100;M.updateMachinery(g,1/60,t.x-90);assert.equal(t.state,'idle');assert.equal(g.cat.stuns,0);
 g.player.x=t.triggerX-g.player.w/2+1;M.updateMachinery(g,1/60,t.triggerX-1);assert.equal(t.state,'arming');
 for(let i=0;i<8;i++)M.updateMachinery(g,1/60,t.triggerX+1);assert.equal(t.state,'attacking');assert(g.cat.machineHold>0);
 for(let i=0;i<50;i++){M.advanceMachinery(g,1/60);M.updateMachinery(g,1/60,t.triggerX+1);}assert.equal(g.cat.stuns,1);assert.equal(g.cat.active.duration,spec.stun/60);assert(t.used);assert.equal(g.events.filter(e=>e.type==='machine-impact').length,1);
 for(let i=0;i<70;i++)M.advanceMachinery(g,1/60);assert.equal(t.state,'spent');assert.equal(g.cat.stuns,1);assert(g.level.platforms.filter(p=>p.machineBlock!==undefined).every(p=>p.disabled));
});
test('sliding and elevator floors physically carry a standing Rat, including vertical movement',()=>{
 for(const type of ['shift','lift']){
  const g=new EscapeGame(LEVELS.findIndex(l=>l.mechanic===type)),t=g.level.environment[0],index=g.level.platforms.findIndex(p=>p.machine===0),tile=g.level.platforms[index],p=g.player;g.phase='playing';p.x=tile.x+35;p.y=tile.y-p.h;p.grounded=true;p.standing=index;const rx=p.x-tile.x;
  const frames=type==='shift'?28:110;
  for(let i=0;i<frames;i++){M.advanceMachinery(g,1/60);P.movePlayer(p,{},g.level);assert(p.grounded);assert(Math.abs(p.y+p.h-tile.y)<.01);assert(Math.abs(p.x-tile.x-rx)<.01);}
  if(type==='shift'){assert(tile.x>t.x+30);assert(!g.level.platforms.some(v=>!v.disabled&&v.y===400&&v.x<=t.x+2&&v.x+v.w>t.x+2));}else{assert(t.rise>70);assert(p.y<290);}
 }
});
test('a conveyor moves the Rat and genuinely reverses after the Cat trips it',()=>{
 const g=new EscapeGame(8),t=g.level.environment[0],p=g.player;p.x=t.x+50;p.y=360;p.grounded=true;const start=p.x;for(let i=0;i<20;i++)P.movePlayer(p,{},g.level);assert(p.x>start+20);t.used=true;const back=p.x;for(let i=0;i<20;i++)P.movePlayer(p,{},g.level);assert(p.x<back-20);
});
test('machinery windup holds the Cat on its recorded path and prevents capture while held',()=>{
 const g=new EscapeGame();for(let i=0;i<110;i++)g.step({x:1});const cursor=g.cat.cursor;g.cat.machineHold=.2;assert(g.cat.stunned);for(let i=0;i<10;i++)g.step({x:1});assert.equal(g.cat.cursor,cursor);for(let i=0;i<10;i++)g.step({x:1});assert(g.cat.cursor>cursor);
});
test('magnets chain armed machinery without double-counting its delayed impact',()=>{
 const g=new EscapeGame(9),t=g.level.environment.find(t=>t.type==='ceiling');g.phase='playing';g.elapsed=1;t.state='armed';g.cat.x=t.x;g.cat.y=t.y-g.cat.h;g.hitCat({type:'magnet'});assert.equal(g.cat.stuns,2);assert.equal(g.bestCombo,2);assert(t.used);for(let i=0;i<100;i++)M.advanceMachinery(g,1/60);assert.equal(g.cat.stuns,2);assert.equal(g.events.filter(e=>e.type==='machine-impact').length,1);
});
test('retry resets machinery phases, solid blockers, moving floors and pending Cat holds',()=>{
 const g=new EscapeGame(3);g.step({x:1});for(const t of g.level.environment)if(M.isMachine(t)){t.state='attacking';t.offset=40;t.rise=60;t.motion=3;t.attack=.2;t.attackDuration=.3;}M.advanceMachinery(g,1/60);g.cat.machineHold=.3;g.fail('test');for(let i=0;i<26;i++)g.step({});assert.equal(g.phase,'ready');assert(g.level.environment.filter(M.isMachine).every(t=>t.state==='idle'&&t.offset===0&&t.rise===0&&t.motion===0));assert(!g.cat.machineHold);assert(g.level.platforms.filter(p=>p.moving).every(p=>p.x===p.originX&&p.y===p.originY));
});
test('each Kitchen machinery introduction lands its new trap during a real chase',()=>{
 for(let i=2;i<=8;i++){const g=solve(i);assert(g.hitTypes.has(g.level.mechanic),`${g.level.id} missed ${g.level.mechanic}: ${[...g.hitTypes]}`);}
});
test('all 50 door routes are physically reachable even when trap knockouts do not end a run early',()=>{
 for(let index=0;index<50;index++){
  const l=loadLevel(index),p=P.createPlayer(l);let waypoint=0,done=false;
  for(let i=0;i<1800&&!done;i++){
   let x=1,jump=false;
   if(l.variant==='shelves'){
    while(waypoint<l.waypoints.length-1&&p.grounded&&Math.abs(p.y+p.h-l.waypoints[waypoint].y)<3)waypoint++;
    const target=l.waypoints[waypoint];jump=p.grounded&&p.y+p.h>target.y+3&&p.x+28>=target.x-115;
    if(!p.grounded&&p.x>target.x+30&&p.y+p.h<target.y+5)x=-.35;
   }else jump=p.grounded&&l.gaps.some(v=>p.x<v.x+v.w&&p.x+28>=v.x-48);
   P.movePlayer(p,{x,jump},l);done=P.overlap(p,l.door);if(p.y>520)break;
  }
  assert(done,`${l.id} door route blocked at ${p.x}, ${p.y}`);
 }
});
