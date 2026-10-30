const test=require('node:test'),assert=require('node:assert/strict');
const K=Object.assign({},...['physics','levels','vision','player','patrol','camera','tools','engine','save'].map(name=>require('../kitchen-heist/'+name+'.js')));
const empty=()=>({width:20,height:15,walls:[{x:0,y:0,w:640,h:32},{x:0,y:448,w:640,h:32},{x:0,y:0,w:32,h:480},{x:608,y:0,w:32,h:480}],floors:[]});
const sandbox=()=>{const game=new K.HeistGame(0);game.level={...empty(),boss:false,parTime:100000,exit:{x:580,y:400}};game.guards=[];game.cameras=[];game.pickups=[];game.cheese=[];game.player.x=80;game.player.y=80;return game;};
test('50 authored stages have reachable objectives, valid patrol segments and generous geometric par budgets',()=>{
  assert.equal(K.LEVELS.length,50);assert.equal(new Set(K.LEVELS.map(l=>l.id)).size,50);
  for(const level of K.LEVELS){
    for(const p of [level.spawn,level.exit,...level.cheese,...level.tools,...level.guards.map(g=>g.pos)])assert.ok(K.walkable(level,p.x,p.y,11),level.id+' blocked object');
    let from=level.spawn,total=0;
    for(const target of [...level.cheese,level.exit]){const path=K.pathfind(level,from,target);assert.ok(path.length,level.id+' unreachable objective');for(const point of path){total+=K.distance(from,point);from=point;}}
    assert.ok(total/120*1000<level.parTime,level.id+' needs a larger par budget');
    for(const guard of level.guards)for(let i=0;i<guard.route.length;i++){
      const a=guard.route[i],b=guard.route[(i+1)%guard.route.length],d=K.distance(a,b);
      for(let step=0;step<=d;step+=4){const t=step/(d||1);assert.ok(K.walkable(level,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,11),level.id+' blocked patrol route');}
    }
    if(level.boss){assert.equal(level.guards.length,1);assert.equal(level.guards[0].route.length,0);assert.equal(level.tools.length,2);assert.equal(level.tools.reduce((n,t)=>n+t.charges,0),4);}
  }
});
test('vision rays and polygons stop at furniture; cone boundaries and smoke agree with detection',()=>{
  const level=empty();level.walls.push({x:180,y:40,w:32,h:200});const source={x:100,y:100,angle:0,range:160,half:Math.PI/3};
  assert.equal(K.castRay(source,0,160,level.walls).dist,80);assert.equal(K.canSee(source,{x:230,y:100},level),false);
  assert.equal(K.canSee(source,{x:140,y:100},level),true);assert.equal(K.canSee(source,{x:70,y:100},level),false);
  assert.equal(K.canSee(source,{x:100+50*Math.cos(Math.PI/3+.01),y:100+50*Math.sin(Math.PI/3+.01)},level),false);
  assert.equal(K.canSee(source,{x:140,y:100},level,[{x:125,y:100,r:10}]),false);
  assert.equal(K.pointInCone(140,100,K.buildCone(source,level)),true);assert.equal(K.pointInCone(230,100,K.buildCone(source,level)),false);
});
test('movement normalizes diagonals, slides at walls, respects sprint noise and Soft Paws',()=>{
  const level=empty();level.walls.push({x:130,y:32,w:32,h:200});const p=K.createPlayer({...level,spawn:{x:115,y:80}});
  for(let i=0;i<60;i++)K.updatePlayer(p,{x:1,y:1},level,1/60);
  assert.ok(p.x<=120.01&&p.y>150);assert.ok(Math.hypot(p.vx,p.vy)<=120.1);
  K.updatePlayer(p,{x:0,y:1,sprint:true},level,.1);assert.equal(p.noise,96);
  p.paws=5;K.updatePlayer(p,{x:0,y:1,sprint:true},level,.1);assert.equal(p.noise,0);assert.ok(p.paws<5);
});
test('Cat alert, chase, last-known search and patrol recovery run independently',()=>{
  const game=sandbox();game.player.x=160;game.player.y=100;
  const guard=K.createGuard({pos:{x:80,y:100},route:[{x:80,y:100},{x:80,y:300}],angle:0,speed:1,pauseTime:1,boss:false});
  K.updateGuard(guard,game,1/60);assert.equal(guard.state,'alert');
  for(let i=0;i<92;i++)K.updateGuard(guard,game,1/60);assert.equal(guard.state,'chase');
  game.player.x=550;game.player.y=400;for(let i=0;i<182;i++)K.updateGuard(guard,game,1/60);assert.equal(guard.state,'search');
  for(let i=0;i<305;i++)K.updateGuard(guard,game,1/60);assert.equal(guard.state,'patrol');
  const boss=K.createGuard({pos:{x:500,y:350},route:[],angle:Math.PI,speed:1,pauseTime:0,boss:true});const old=boss.x;K.updateGuard(boss,game,.1);assert.ok(boss.x!==old||boss.y!==350);assert.equal(boss.route.length,0);
});
test('chasing cats pathfind around solid furniture rather than passing through it',()=>{
  const game=sandbox();game.level.walls.push({x:180,y:64,w:64,h:288});game.player.x=300;game.player.y=100;
  const guard=K.createGuard({pos:{x:140,y:100},route:[],angle:0,speed:1,pauseTime:0,boss:true});guard.state='hunt';
  for(let i=0;i<450;i++){K.updateGuard(guard,game,1/60);assert.ok(K.walkable(game.level,guard.x,guard.y,10));}
});
test('Dog detection raises a ten-second alarm, wall cover prevents it and smoke blocks beams',()=>{
  const game=sandbox();const camera=K.createCamera({pos:{x:80,y:80},startAngle:0,sweepAngle:0,sweepSpeed:.8},0);game.cameras=[camera];game.player.x=150;
  K.updateCameras(game,1/60);assert.equal(game.alarm,10);
  game.player.x=550;for(let i=0;i<600;i++)K.updateCameras(game,1/60);assert.ok(game.alarm<.0001);
  game.player.x=150;game.level.walls.push({x:110,y:40,w:20,h:150});camera.saw=false;K.updateCameras(game,.1);assert.equal(game.alarm,0);
  game.level.walls.pop();game.smoke=[{x:120,y:80,r:20}];K.updateCameras(game,.1);assert.equal(game.alarm,0);
});
test('decoy picks the nearest patrol, smoke blinds, and inventory never exceeds three slots',()=>{
  const game=sandbox();game.player.tools=[{type:'decoy',charges:1}];
  const make=x=>K.createGuard({pos:{x,y:100},route:[{x,y:100}],speed:1,pauseTime:1,angle:0});game.guards=[make(120),make(230)];
  assert.equal(K.useTool(game),true);assert.equal(game.guards[0].state,'distracted');assert.equal(game.guards[1].state,'patrol');assert.equal(game.player.tools.length,0);
  game.player.tools=[{type:'smoke',charges:1}];K.useTool(game);assert.equal(game.smoke.length,1);assert.equal(game.guards[0].state,'search');assert.ok(game.guards[0].blind>0);
  game.player.tools=[{type:'decoy',charges:1},{type:'smoke',charges:1},{type:'paws',charges:1}];game.pickups=[{x:80,y:80,type:'hole',charges:1}];K.updateTools(game,.1);assert.equal(game.player.tools.length,3);assert.equal(game.pickups[0].taken,undefined);
});
test('a mouse tunnel needs two legal placements, consumes one item and teleports only once',()=>{
  const game=sandbox();game.player.tools=[{type:'hole',charges:1}];assert.equal(K.useTool(game),true);assert.equal(game.player.tools.length,1);
  assert.equal(K.useTool(game),false);game.player.x=550;assert.equal(K.useTool(game),false);
  game.player.x=200;assert.equal(K.useTool(game),true);assert.equal(game.player.tools.length,0);
  game.elapsed=1;game.player.x=80;K.updateTools(game,.1);assert.equal(game.player.x,200);assert.equal(game.hole,null);
});
test('Soft Paws lasts five seconds, silences sprinting, reduces guard vision and blocks reactivation',()=>{
  const game=sandbox();game.player.tools=[{type:'paws',charges:2}];K.useTool(game);assert.equal(game.player.paws,5);assert.equal(K.useTool(game),false);assert.equal(game.player.tools[0].charges,1);
  for(let i=0;i<300;i++)K.updatePlayer(game.player,{x:1,sprint:true},game.level,1/60);assert.ok(game.player.paws<.001);
  const guard={x:80,y:80,angle:0,range:160,half:Math.PI/3};assert.equal(K.canSee(guard,{x:220,y:80},game.level,[],112),false);
});
test('world hazards push only on conveyors; lasers alarm only while active',()=>{
  const game=sandbox();game.level.floors=[{x:64,y:64,w:100,h:32,kind:'conveyor',direction:1}];const x=game.player.x;K.updatePlayer(game.player,{},game.level,.1);assert.ok(game.player.x>x);
  game.level.floors=[{x:64,y:64,w:100,h:32,kind:'laser',phase:0,period:4}];game.elapsed=3;K.updateCameras(game,.1);assert.equal(game.alarm,0);game.elapsed=0;K.updateCameras(game,.1);assert.equal(game.alarm,10);
});
test('stars, boss tool escapes, pause-by-no-update, and all-cheese exit gate are enforced',()=>{
  const game=sandbox();game.level={...game.level,boss:true};game.player.x=580;game.player.y=400;game.cheese=[{x:580,y:400,taken:false}];game.update({},.1);assert.equal(game.status,'playing');assert.equal(game.exitOpen,false);
  game.evades=4;game.update({},.1);assert.equal(game.status,'won');assert.equal(game.result.stars,3);const elapsed=game.elapsed;game.update({},1);assert.equal(game.elapsed,elapsed);
  const caught=sandbox();caught.catch();caught.update({x:1},.1);assert.equal(caught.elapsed,0);
});
test('two double-charge boss tools can produce the required four independent distractions',()=>{
  const game=sandbox();game.level.boss=true;const guard=K.createGuard({pos:{x:125,y:80},route:[],speed:1,pauseTime:0,angle:Math.PI,boss:true});game.guards=[guard];
  game.player.tools=[{type:'smoke',charges:2},{type:'decoy',charges:2}];
  for(let i=0;i<4;i++){game.elapsed=i*2;assert.equal(K.useTool(game),true);}
  assert.equal(game.evades,4);assert.equal(game.player.tools.length,0);assert.equal(game.exitOpen,true);
});
test('progress JSON preserves best stars/times and requires both 15 stars and a cleared boss',()=>{
  let save=new K.HeistSave(null);assert.equal(save.unlocked(0),true);assert.equal(save.unlocked(1),false);assert.equal(save.complete(1,{stars:3,time:1000}),false);
  for(let i=0;i<10;i++)assert.equal(save.complete(i,{stars:2,time:20000,spotted:1}),true);
  assert.equal(save.worldUnlocked(1),true);save.complete(0,{stars:3,time:10000,spotted:0});save.complete(0,{stars:1,time:30000,spotted:8});
  save=new K.HeistSave(JSON.parse(JSON.stringify(save)));assert.equal(save.stars['1-1'],3);assert.equal(save.bestTimes['1-1'],10000);assert.equal(save.spottedCounts['1-1'],0);
  delete save.stars['1-10'];assert.equal(save.worldUnlocked(1),false);save.stars={'1-10':3};assert.equal(save.worldUnlocked(1),false);
  const bad=new K.HeistSave({stars:{'1-1':'3'},bestTimes:{'1-1':NaN}});assert.equal(bad.totalStars,0);
});
