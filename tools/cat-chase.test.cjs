const test=require('node:test'),assert=require('node:assert/strict'),C=require('../cat-chase-core.js');
// Drives the actual fixed-step simulation with ordinary movement, jump and pounce inputs.
function runner(g){
 const p=g.player,l=g.level;let x=1,jump=false;
 if(l.waypoints.length){
  while(p.guide<l.waypoints.length-1&&p.grounded&&Math.abs(p.y+p.h-l.waypoints[p.guide].y)<3)p.guide++;
  const t=l.waypoints[p.guide];jump=p.grounded&&p.y+p.h>t.y+3&&p.x+p.w>=t.x-112;
  if(!p.grounded&&p.x>t.x+30&&p.y+p.h<t.y+6)x=-.35;
 }
 const danger=l.traps.filter(t=>Math.abs(p.y+p.h-t.y)<55);
 const ahead=danger.find(t=>(['drop','ceiling'].includes(t.type)&&t.state!=='spent'||t.type==='gate'&&t.state!=='open'||t.type==='crusher'&&t.state!=='safe')&&p.x+p.w<t.x+3&&t.x-(p.x+p.w)<(t.type==='crusher'?120:185));
 if(ahead){x=0;if(p.x+p.w>ahead.x-85)x=-.5;}
 const gaps=l.gaps.concat(l.traps.filter(t=>['crumble','shift','lift'].includes(t.type)).map(t=>({x:t.x,w:t.w})));
 if(p.grounded&&gaps.some(t=>p.x<t.x+t.w&&p.x+p.w>=t.x-42))jump=true;
 if(p.grounded&&danger.some(t=>['spikes','wall'].includes(t.type)&&p.x<t.x+t.w+(t.type==='wall'?55:0)&&p.x+p.w>=t.x-(t.type==='wall'?100:58)))jump=true;
 if(p.grounded&&danger.some(t=>t.type==='pendulum'&&t.state==='active'&&t.ballX>p.x&&t.ballX-p.x-p.w<110&&t.ballY+22>p.y))jump=true;
 const distance=g.rat.x-p.x;
 if(distance<-10&&p.grounded&&Math.abs((p.y+p.h)-(g.rat.y+g.rat.h))<60)x=-1;
 if(x<0&&p.grounded&&danger.some(t=>t.type==='spikes'&&p.x>t.x&&p.x<t.x+t.w+65))jump=true;
 if(x<0&&p.grounded&&gaps.some(t=>p.x>t.x&&p.x<t.x+t.w+42))jump=true;
 if(p.grounded)p.backJump=false;
 if(jump&&x<0)p.backJump=true;
 if(p.backJump)x=-1;
 const swingJump=jump&&danger.some(t=>t.type==='pendulum'&&t.state==='active'&&Math.abs(t.ballX-p.x)<150);
 const pounce=(swingJump||distance>35&&distance<160&&p.grounded&&!gaps.some(t=>t.x>p.x&&t.x-p.x<230)&&!danger.some(t=>(t.type==='spring'||t.type==='spikes'||t.type==='pendulum')&&Math.abs(t.x-p.x)<230)&&Math.abs((p.y+p.h)-(g.rat.y+g.rat.h))<50&&!ahead&&!jump)&&p.cooldown<=0;
 return{x,jump,pounce};
}
function solve(index){const g=new C.ChaseGame(index);g.player.guide=0;g.seenTraps=new Set();for(let i=0;i<2400&&g.phase!=='won'&&!g.retries;i++){g.step(runner(g));for(const e of g.events)if(e.type==='warning')g.seenTraps.add(e.trap);g.events.length=0;}return g;}
test('50 stages mix thirteen trap families with a different primary pattern in each world',()=>{
 assert.equal(C.LEVELS.length,50);assert.equal(new Set(C.LEVELS.map(l=>l.name)).size,50);assert.equal(new Set(C.LEVELS.map(l=>l.theme)).size,5);
 const types=new Set();for(const l of C.LEVELS){assert(l.platforms.every(p=>p.w>0));assert(l.gaps.every(p=>p.w<=125));assert(l.spawn.x<l.ratSpawn.x);assert(l.ratSpawn.x<l.door.x);l.traps.forEach(t=>types.add(t.type));assert.equal(l.bells.length,3);}assert.deepEqual([...types].sort(),Object.keys(C.TRAPS).sort());assert.equal(new Set(C.LEVELS.slice(0,10).map(l=>l.challenge)).size,10);assert.equal(C.LEVELS[2].traps[0].type,'ceiling');assert.equal(C.LEVELS[3].traps[0].type,'shift');
 const copy=C.loadLevel(1);copy.traps[0].state='open';assert.equal(C.LEVELS[1].traps[0].state,undefined);
});
test('manual movement accelerates, jump presses are distinct, gravity lands and walls block',()=>{
 const l=C.loadLevel(0),p=C.actor(64,352),tiles=l.platforms;C.move(p,{x:1,jump:true},l,tiles);assert(p.vy<0);const initial=p.vy;C.move(p,{jump:true},l,tiles);assert(p.vy>initial);for(let i=0;i<60;i++)C.move(p,{},l,tiles);assert.equal(p.y,352);assert(p.grounded);
 tiles.push({x:130,y:320,w:30,h:80,solid:true});for(let i=0;i<60;i++)C.move(p,{x:1},l,tiles);assert(p.x+p.w<=130);
});
test('the game waits for input, the Cat is the player, and the autonomous Rat runs ahead',()=>{
 const g=new C.ChaseGame();for(let i=0;i<100;i++)g.step({});assert.equal(g.elapsed,0);assert.equal(g.phase,'ready');assert.equal(g.player.h,48);assert.equal(g.rat.h,32);g.step({x:1});assert(g.rat.x>294);assert(g.player.x>64);assert.equal(g.phase,'playing');
});
test('pounce is a brief directional burst with a cooldown and does not repeat when held',()=>{
 const g=new C.ChaseGame();for(let i=0;i<25;i++)g.step({x:1,pounce:true});assert.equal(g.pounces,1);assert(g.player.x>190);assert(g.player.cooldown>0);assert.equal(g.player.pounce,0);g.step({pounce:false});g.step({pounce:true});assert.equal(g.pounces,1);
});
test('cracked floor warns then opens, removes collision and eventually restores',()=>{
 const g=new C.ChaseGame(1),t=g.level.traps[0];g.player.x=t.x-100;C.updateTraps(g);assert.equal(t.state,'warning');assert(C.platforms(g).some(p=>p.crumble===0));for(let i=0;i<30;i++)C.updateTraps(g);assert.equal(t.state,'open');assert(!C.platforms(g).some(p=>p.crumble===0));assert(!C.platforms(g,true).some(p=>p.crumble===0));for(let i=0;i<140;i++)C.updateTraps(g);assert.equal(t.state,'spent');assert(C.platforms(g).some(p=>p.crumble===0));
});
test('spikes give a warning, hurt when active and have a safe interval',()=>{
 const g=new C.ChaseGame(9),t=g.level.traps.find(t=>t.type==='spikes');g.level.traps=[t];g.phase='playing';g.player.x=t.x;C.updateTraps(g);assert.equal(g.phase,'playing');assert.equal(t.state,'warning');for(let i=0;i<45;i++)C.updateTraps(g);assert.equal(g.phase,'failed');assert.equal(g.retries,1);g.player.x=64;for(let i=0;i<70;i++)C.updateTraps(g);assert(['safe','active'].includes(t.state));
});
test('a falling block has warning/fall/down/retract phases and solid collision',()=>{
 const g=new C.ChaseGame(20),t=g.level.traps[0];g.phase='playing';g.player.x=t.x-200;const states=new Set();for(let i=0;i<240;i++){C.updateTraps(g);states.add(t.state);}for(const state of ['warning','falling','down','rising','spent'])assert(states.has(state),state);
});
test('moving ledges carry grounded actors, and spring pads launch higher than a jump',()=>{
 const g=new C.ChaseGame(4),p=g.player,t=g.level.platforms.find(t=>t.moving);p.x=t.x+30;p.y=t.y-p.h;p.grounded=true;p.standing=t;t.dx=4;const before=p.x;C.move(p,{},g.level,[t]);assert.equal(p.x,before+4);
 const s=new C.ChaseGame(6),spring=s.level.traps.find(t=>t.type==='spring');s.player.x=spring.x;s.phase='playing';C.updateTraps(s);assert.equal(s.player.vy,-810);assert(!s.player.grounded);
});
test('capture wins once, and failure retries quickly without keeping held action edges',()=>{
 const g=new C.ChaseGame();g.rat.x=g.player.x+15;g.step({x:1});assert.equal(g.phase,'won');const time=g.result.time;for(let i=0;i<100;i++)g.step({x:1});assert.equal(g.result.time,time);
 const h=new C.ChaseGame();h.step({x:1});h.fail('test');h.fail('test');assert.equal(h.retries,1);for(let i=0;i<26;i++)h.step({pounce:true,jump:true});assert.equal(h.phase,'ready');assert.equal(h.attempt,2);assert(h.prevPounce);assert(h.player.prevJump);
});
test('bells, star rules and local saves preserve best results and sequential unlocks',()=>{
 assert.equal(C.starsFor(9000,8000,3,5),3);assert.equal(C.starsFor(7000,8000,0,0),3);assert.equal(C.starsFor(9000,8000,0,1),2);assert.equal(C.starsFor(9000,8000,0,3),1);
 const s=new C.ChaseSave(null);assert(s.unlocked(0));assert(!s.unlocked(1));assert(!s.complete(3,{time:1000,stars:3}));assert(s.complete(0,{time:8000,stars:3,bells:2}));assert(s.unlocked(1));s.complete(0,{time:9000,stars:1,bells:0});assert.equal(s.bestTimes['1-1'],8000);assert.equal(s.stars['1-1'],3);assert.equal(s.bestBells['1-1'],2);assert.equal(new C.ChaseSave(JSON.parse(JSON.stringify(s))).totalStars,3);assert.equal(new C.ChaseSave({stars:{'1-1':-7},retries:Infinity}).retries,0);
});
test('an unpursued Rat really escapes, and the loss does not hang the stage',()=>{
 const g=new C.ChaseGame();g.step({x:1});for(let i=0;i<1500&&g.phase==='playing';i++){g.step({});g.events.length=0;}assert.equal(g.phase,'failed');assert.match(g.message,/escaped/);assert(g.elapsed<20);for(let i=0;i<26;i++)g.step({});assert.equal(g.phase,'ready');assert.equal(g.retries,1);
});
test('Rat jumps a real open floor hole instead of running on invisible ground',()=>{
 const g=new C.ChaseGame(1),t=g.level.traps[0];t.state='open';let airborne=false;
 for(let i=0;i<180&&g.rat.x<t.x+t.w+40;i++){
  C.move(g.rat,C.ratInput(g),g.level,C.platforms(g,true),g.level.ratSpeed);
  if(g.rat.x+g.rat.w>t.x&&g.rat.x<t.x+t.w){assert(!g.rat.grounded);airborne=true;}
  assert(g.rat.y<450);
 }
 assert(airborne);assert(g.rat.x>t.x+t.w);
});
for(let index=0;index<50;index++)test(`stage ${C.LEVELS[index].id}: Cat can catch Rat with normal controls`,()=>{
 const g=solve(index);assert.equal(g.phase,'won',`${g.level.id} ${g.message}; cat ${Math.round(g.player.x)},${Math.round(g.player.y)}; rat ${Math.round(g.rat.x)},${Math.round(g.rat.y)}; traps ${g.level.traps.map(t=>t.type+':'+t.state)}`);assert.equal(g.retries,0);assert(g.elapsed<30);
 if(C.TRAPS[g.level.challenge])assert(g.seenTraps.has(g.level.challenge),'Main trap must be encountered before the Rat is caught');
});

test('a wide ceiling slab warns, falls, blocks the whole zone, retracts and can crush',()=>{
 const g=new C.ChaseGame(2),t=g.level.traps[0];g.phase='playing';g.player.x=t.x-140;assert(t.w>=180);const states=new Set();for(let i=0;i<220;i++){C.updateTraps(g);states.add(t.state);}for(const s of ['warning','falling','down','rising','spent'])assert(states.has(s));
 t.state='down';t.blockY=t.y-t.h;g.player.x=t.x+50;C.checkHazards(g);assert.equal(g.phase,'failed');assert.match(g.message,/Ceiling/);
});
test('shifting ground changes real collision and carries the standing Cat sideways',()=>{
 const g=new C.ChaseGame(3),t=g.level.traps[0],tile=g.level.platforms.find(p=>p.floorTrap===0),p=g.player;g.phase='playing';t.state='active';p.x=tile.x+40;p.y=tile.y-p.h;p.standing=tile;p.grounded=true;const relative=p.x-tile.x;
 for(let i=0;i<24;i++)g.step({});assert(tile.x>t.x+30);assert(Math.abs(p.x-tile.x-relative)<.01);assert(p.grounded);assert.equal(p.y+p.h,tile.y);assert(!C.platforms(g).some(v=>v.y===400&&v.x<=t.x+2&&v.x+v.w>t.x+2));
});
test('elevator floor carries the Cat upward and keeps its feet on the moving top',()=>{
 const g=new C.ChaseGame(8),t=g.level.traps[0],tile=g.level.platforms.find(p=>p.floorTrap===0),p=g.player;g.phase='playing';t.state='active';p.x=tile.x+40;p.y=tile.y-p.h;p.standing=tile;p.grounded=true;
 for(let i=0;i<110;i++){g.elapsed+=C.DT;C.updateTraps(g);C.updatePlatforms(g);C.move(p,{},g.level,C.platforms(g));assert(p.grounded);assert(Math.abs(p.y+p.h-tile.y)<.01);}assert(t.rise>85);assert(p.y<270);
});
test('conveyors move both actors without manual input and their arrows match the direction',()=>{
 const g=new C.ChaseGame(10),t=g.level.traps[0];t.state='active';for(const rat of [false,true]){const p=C.actor(t.x+70,rat?368:352,rat),before=p.x;for(let i=0;i<20;i++)C.move(p,{},g.level,C.platforms(g));assert(p.x<before-25);assert(p.grounded);}
});
test('a floor piston cycles up and down, has a safe crossing window and crushes from below',()=>{
 const g=new C.ChaseGame(5),t=g.level.traps[0];g.phase='playing';g.player.x=t.x-100;const states=new Set();for(let i=0;i<220;i++){C.updateTraps(g);states.add(t.state);}for(const s of ['warning','rising','up','retracting','safe'])assert(states.has(s));t.rise=100;g.player.x=t.x+10;C.checkHazards(g);assert.equal(g.phase,'failed');assert.match(g.message,/piston/);
});
test('shutters cycle through an open window, block while shut and never grant pounce immunity',()=>{
 const g=new C.ChaseGame(6),t=g.level.traps[0];g.phase='playing';g.player.x=t.x-160;const states=new Set();for(let i=0;i<260;i++){C.updateTraps(g);states.add(t.state);}for(const s of ['warning','closing','closed','opening','open'])assert(states.has(s));g.player.x=t.x+4;t.state='open';t.gateBottom=t.y-175;C.checkHazards(g);assert.equal(g.phase,'playing');t.state='closed';t.gateBottom=t.y;g.player.pounce=.19;C.checkHazards(g);assert.equal(g.phase,'failed');assert.match(g.message,/shutter/);
});
test('wrecking balls follow an arc and use circle collision rather than invisible square corners',()=>{
 const g=new C.ChaseGame(4),t=g.level.traps[0];g.phase='playing';g.player.x=64;t.state='active';const before=t.ballX;for(let i=0;i<25;i++)C.updateTraps(g);assert(t.ballX>before+100);assert(t.ballY<t.y-80);t.ballX=500;t.ballY=350;g.player.x=517;g.player.y=367;C.checkHazards(g);assert.equal(g.phase,'playing');g.player.x=490;g.player.y=340;C.checkHazards(g);assert.equal(g.phase,'failed');assert.match(g.message,/swing/);
});
test('retry restores moving floors, machinery and trap phases without modifying the stage definition',()=>{
 const g=new C.ChaseGame(9);g.step({x:1});for(const t of g.level.traps){t.state='active';t.offset=60;t.rise=100;t.motion=7;}C.updatePlatforms(g);g.fail('test');for(let i=0;i<26;i++)g.step({});assert.equal(g.phase,'ready');assert(g.level.traps.every(t=>t.state==='idle'&&t.motion===0&&t.offset===0&&t.rise===0));assert(g.level.platforms.filter(p=>p.floorTrap!==undefined).every(p=>p.x===p.origin&&p.y===p.originY));
});
test('Rat navigation reaches the real exit in all 50 stages without falling or teleporting',()=>{
 for(let i=0;i<50;i++){
  const g=new C.ChaseGame(i);let reached=false;
  for(let frame=0;frame<1800&&!reached;frame++){
   g.elapsed+=C.DT;
   C.updatePlatforms(g);
   C.move(g.rat,C.ratInput(g),g.level,C.platforms(g,true),g.level.ratSpeed);
   assert(g.rat.y<520,`${g.level.id} Rat fell at ${g.rat.x}`);reached=g.rat.state==='taunting';
  }
  assert(reached,`${g.level.id} Rat cannot reach its exit`);
 }
});
