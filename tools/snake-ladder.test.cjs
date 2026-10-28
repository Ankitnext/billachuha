const test=require('node:test'),assert=require('node:assert/strict');
const {Race,Stage,SNAKES,LADDERS,POWERS,cellPoint,theme}=require('../snake-ladder-core.js');
const clear=(g,success=true,coins=0,kills=0,shieldUsed=false)=>{if(g.phase==='rolled')g.startStage();g.complete({success,coins,kills,shieldUsed});};

test('the 100-cell board snakes through rows and all connections stay in bounds',()=>{
  assert.deepEqual(cellPoint(1),{x:.5,y:9.5});assert.deepEqual(cellPoint(10),{x:9.5,y:9.5});assert.deepEqual(cellPoint(11),{x:9.5,y:8.5});assert.deepEqual(cellPoint(100),{x:.5,y:.5});
  for(const [a,b]of Object.entries(SNAKES))assert.ok(b>=1&&b<Number(a)&&Number(a)<100);
  for(const [a,b]of Object.entries(LADDERS))assert.ok(Number(a)>=1&&Number(a)<b&&b<=100);
  assert.deepEqual([1,26,51,76].map(theme),['garden','house','night','volcano']);
});
test('a roll creates an action stage and a failed crossing preserves the original cell',()=>{
  const g=new Race();assert.equal(g.roll(3),4);assert.equal(g.player.cell,1);assert.equal(g.turn.target,5);
  g.startStage();g.complete({success:false,coins:3,kills:1});assert.equal(g.player.cell,1);assert.equal(g.player.coins,3);assert.equal(g.player.kills,1);g.next();assert.equal(g.phase,'board');
  assert.throws(()=>g.roll(7));assert.throws(()=>g.startStage());
});
test('ladder climbs are earned and falling keeps the player at the foot',()=>{
  for(const success of [false,true]){const g=new Race();g.roll(2);clear(g);assert.equal(g.player.cell,4);assert.equal(g.queued.kind,'ladder');g.next();assert.equal(g.stage.kind,'ladder');clear(g,success);assert.equal(g.player.cell,success?14:4);}
});
test('snake coins soften the fall without moving above its head and Cat saves once',()=>{
  for(const coins of [0,4,100]){const g=new Race({players:[{role:'dog'}]});g.player.cell=10;g.roll(6);clear(g);g.next();clear(g,true,coins);assert.equal(g.player.cell,Math.min(15,6+coins));}
  const cat=new Race({players:[{role:'cat'}]});cat.player.cell=10;cat.roll(6);clear(cat);assert.equal(cat.player.cell,16);assert.equal(cat.player.snakeSaved,true);assert.equal(cat.queued,null);cat.next();cat.player.cell=10;cat.roll(6);clear(cat);assert.equal(cat.queued.kind,'snake');
});
test('Dog rerolls once without consuming power durations twice',()=>{
  const g=new Race({players:[{role:'dog'}]});g.player.powers.speed=3;g.roll(1);assert.equal(g.player.powers.speed,2);g.roll(6,true);assert.equal(g.turn.steps,6);assert.equal(g.player.powers.speed,2);assert.throws(()=>g.roll(2,true));
});
test('power cells last three future turns and a shield is not renewed during a ladder challenge',()=>{
  const g=new Race({players:[{role:'dog'}]});g.roll(6);clear(g);assert.equal(g.player.powers[POWERS[7]],3);g.next();
  for(let i=0;i<3;i++){g.player.cell=1;g.roll(1);assert.equal(g.turn.powers.shield,3-i);clear(g);g.next();}assert.equal(g.player.powers.shield,0);
  const shield=new Race();shield.player.powers.shield=3;shield.roll(2);const stage=shield.startStage();stage.damage();assert.equal(stage.player.hp,3);assert.equal(stage.shield,false);shield.complete({success:true,shieldUsed:true});shield.next();assert.equal(shield.stage.kind,'ladder');assert.equal(shield.stage.shield,false);
});
test('guardian wins award four cells and losses skip the next local or solo turn',()=>{
  const g=new Race({mode:'local',players:[{role:'dog',name:'One'},{role:'cat',name:'Two'}]});g.player.cell=24;g.roll(1);clear(g);g.next();clear(g,false);g.next();assert.equal(g.current,1);g.roll(1);clear(g);g.next();assert.equal(g.current,1);assert.equal(g.players[0].skipNext,false);
  const solo=new Race({players:[{role:'dog'}]});solo.player.cell=24;solo.roll(1);clear(solo);solo.next();clear(solo,false);solo.next();assert.equal(solo.elapsed,8);
  solo.player.cell=24;solo.roll(1);clear(solo);solo.next();clear(solo,true);assert.equal(solo.player.cell,29);
});
test('solo timeout and finishing at 100 stop the race and preserve turn ownership',()=>{
  const timed=new Race();timed.tick(601);assert.equal(timed.phase,'finished');assert.equal(timed.winner,null);
  const g=new Race({mode:'local',players:[{role:'rat',name:'One'},{role:'dog',name:'Two'}]});g.player.cell=98;g.roll(6);assert.equal(g.turn.steps,2);clear(g,true,4,1);assert.equal(g.phase,'finished');assert.equal(g.winner,0);assert.equal(g.player.cell,100);assert.ok(g.score()>5000);
});

function runNormal(stage){
  stage.enemies=[];stage.bombAt=999;let release=false;
  for(let i=0;i<2400&&!stage.done;i++){
    const p=stage.player,f=p.standing!==null?stage.platforms[p.standing]:null;
    const jump=!!f&&p.x+p.w>f.x+f.w-65&&!release;
    stage.update({x:1,jump},1/60);release=jump;
  }
  return stage.outcome;
}
test('normal moves of every dice length are physically reachable for all characters',()=>{
  for(const role of ['rat','cat','dog'])for(let steps=1;steps<=7;steps++)for(const seed of [1,15,62]){
    const s=new Stage('move',{role,steps,seed});const result=runNormal(s);assert.equal(result?.success,true,`${role}, ${steps} platforms, seed ${seed}: ${JSON.stringify(result)}`);
  }
});
test('ladder platforms are reachable using a single jump',()=>{
  const s=new Stage('ladder',{role:'dog',seed:8});s.enemies=[];s.bombAt=999;let target=1,release=false;
  for(let i=0;i<2700&&!s.done;i++){
    const p=s.player;if(p.standing!==null)target=Math.min(s.platforms.length-1,p.standing+1);
    const f=s.platforms[target],delta=f.x+f.w/2-(p.x+p.w/2),x=Math.abs(delta)<8?0:Math.sign(delta);
    const jump=p.standing!==null&&Math.abs(delta)<145&&!release;s.update({x,jump},1/60);release=jump;
  }
  assert.equal(s.outcome?.success,true,JSON.stringify({outcome:s.outcome,y:s.player.y,target}));
});
test('jump presses are distinct, Rat wall slides and Dog shots remain bounded',()=>{
  const rat=new Stage('move',{role:'rat'});rat.update({jump:true},.02);assert.equal(rat.player.jumps,1);rat.update({jump:true},.02);assert.equal(rat.player.jumps,1);rat.update({},.02);rat.update({jump:true},.02);assert.equal(rat.player.jumps,0);
  rat.player.x=0;rat.player.y=100;rat.player.vy=400;rat.player.standing=null;rat.update({x:-1},.02);assert.ok(rat.player.vy<=90);
  const dog=new Stage('boss',{role:'dog'});for(let i=0;i<300;i++)dog.update({fire:true},1/60);assert.ok(dog.bullets.length<=12);assert.ok(dog.kills>0||dog.enemies[0].hp<dog.enemies[0].maxHp);
  const cat=new Stage('move',{role:'cat'});cat.update({ability:true},.02);assert.ok(cat.boostUntil>cat.elapsed);const ready=cat.nextPower;cat.update({ability:true},.02);assert.equal(cat.nextPower,ready);
});
test('snake fall is playable and all transient entities stay bounded',()=>{
  const s=new Stage('snake',{role:'dog'});for(let i=0;i<1000&&!s.done;i++)s.update({},1/60);assert.ok(s.done);assert.ok(s.outcome.coins>0);assert.ok(s.bombs.length<=6&&s.bullets.length<=12);
});
