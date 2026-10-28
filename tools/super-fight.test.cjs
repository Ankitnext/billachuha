const test=require('node:test'),assert=require('node:assert/strict');
const S=Object.assign({},...['physics','fighter','combat','powers','particles','bot','engine','camera'].map(name=>require('../super-fight/'+name+'.js')));
const game=(characters=['blaze','shadow'])=>{const g=new S.Match({mode:'local',characters,seed:72});g.phase='fight';return g;};
const ticks=(g,n,a={},b={})=>{for(let i=0;i<n;i++)g.step([a,b]);};
test('arena, 60 Hz rules and three character signatures are explicit',()=>{
  assert.equal(S.RULES.dt,1/60);assert.equal(S.RULES.width,1400);assert.equal(S.RULES.height,800);assert.equal(S.RULES.roundTime,90);
  const g=game(['titan','shadow']);assert.equal(g.fighters[0].maxHp,130);assert.equal(g.fighters[1].maxEnergy,150);assert.equal(g.fighters[1].spec.teleportCooldown,0);assert.equal(g.fighters[0].spec.poundRadius,252);
  assert.throws(()=>new S.Match({mode:'online'}));assert.throws(()=>new S.Fighter(0,'goku'));
});
test('jumping, flight drain, ground recharge and knockback stay within arena bounds',()=>{
  const g=game(),f=g.fighters[0],start=f.y;ticks(g,35,{y:-1});assert.ok(f.y<start-150);assert.ok(f.energy<100&&f.energy>0);assert.equal(f.flying,true);
  ticks(g,150);assert.equal(f.grounded,true);assert.equal(f.energy,f.maxEnergy);f.x=-10;f.vx=-1200;f.knockTime=.2;g.step();assert.equal(f.x,0);assert.ok(f.vx>0);
});
test('dash costs 20 energy, travels approximately 200 pixels and respects cooldown',()=>{
  const g=game(),f=g.fighters[0];f.y=350;f.grounded=false;const start=f.x;assert.equal(S.dash(g,f,1,0),true);assert.equal(f.energy,100);assert.equal(S.dash(g,f,1,0),false);ticks(g,8);assert.ok(f.x-start>=175&&f.x-start<=225);assert.ok(f.x<1400);
});
test('four basic attacks have distinct ranges, cooldowns and launch vectors',()=>{
  assert.deepEqual(Object.values(S.ATTACKS).map(a=>a.damage),[8,12,15,18]);
  for(const [y,air,kind]of [[0,false,'punch'],[1,false,'kick'],[-1,false,'uppercut'],[1,true,'slam']]){
    const g=game(),f=g.fighters[0];f.grounded=!air;S.melee(g,f,{attack:true,y});assert.equal(f.attack.kind,kind);assert.ok(f.attackCooldown>0);
  }
  const g=game(),[a,b]=g.fighters;b.x=a.x+75;S.melee(g,a,{attack:true,y:-1});S.resolveMelee(g,.12);assert.equal(b.hp,b.maxHp-15);assert.ok(b.vy<-700);assert.equal(b.stun,.15);
});
test('combo multipliers, 800 ms window and 150 ms stun produce bounded damage',()=>{
  const g=game(),[a,b]=g.fighters;b.hp=1000;b.maxHp=1000;let sum=0;
  for(let i=1;i<=10;i++){g.time+=.2;sum+=8*S.multiplier(i);S.hit(g,a,b,{damage:8});}
  assert.ok(Math.abs(a.damageDealt-sum)<.001);assert.equal(a.combo,10);assert.equal(a.maxCombo,10);assert.equal(S.multiplier(10),1.5);
  g.time+=.81;S.hit(g,a,b,{damage:8});assert.equal(a.combo,1);ticks(g,10);assert.equal(b.stun,0);
});
test('physical guard chips from the front while shield blocks all damage and drains energy',()=>{
  const g=game(),[a,b]=g.fighters;b.block=true;S.hit(g,a,b,{damage:8});assert.equal(b.hp,b.maxHp-2);
  a.x=1200;b.block=true;S.hit(g,a,b,{damage:8});assert.equal(b.hp,b.maxHp-10);
  const h=game(),defender=h.fighters[0];ticks(h,25,{sp2:true});assert.equal(defender.shield,true);const hp=defender.hp,energy=defender.energy;S.hit(h,h.fighters[1],defender,{damage:35});assert.equal(defender.hp,hp);ticks(h,10,{sp2:true});assert.ok(defender.energy<energy-20);ticks(h,120,{sp2:true});assert.ok(defender.energy>=0);assert.equal(defender.shield,false);
});
test('special 1 taps fire blasts, holds charge one beam and Blaze charges faster',()=>{
  const g=game();ticks(g,5,{sp1:true});g.step([{},{}]);assert.equal(g.projectiles.length,1);assert.equal(g.beams.length,0);
  const blaze=game();ticks(blaze,43,{sp1:true});assert.equal(blaze.events.filter(e=>e.type==='beam').length,1);ticks(blaze,90,{sp1:true});assert.equal(blaze.events.filter(e=>e.type==='beam').length,1);
  const shadow=game(['shadow','titan']);ticks(shadow,43,{sp1:true});assert.equal(shadow.beams.length,0);ticks(shadow,18,{sp1:true});assert.equal(shadow.events.filter(e=>e.type==='beam').length,1);
});
test('teleport spends energy, appears behind and can break a five-hit combo during stun',()=>{
  const g=game(),[a,b]=g.fighters;const before=a.energy;assert.equal(S.teleport(g,a),true);assert.equal(a.energy,before-25);assert.ok(a.x>b.x);assert.ok(a.invulnerable>0);const hp=a.hp;S.hit(g,b,a,{damage:35});assert.equal(a.hp,hp);
  const h=game(),f=h.fighters[0];f.stun=.15;f.receivedHits=4;assert.equal(S.teleport(h,f),false);f.receivedHits=5;h.fighters[1].combo=5;assert.equal(S.teleport(h,f),true);assert.equal(f.stun,0);assert.equal(h.fighters[1].combo,0);
  const shadow=game(['shadow','titan']);for(let i=0;i<6;i++)assert.equal(S.teleport(shadow,shadow.fighters[0]),true);assert.equal(S.teleport(shadow,shadow.fighters[0]),false);
});
test('holding Special 1 buffers charging through an attack or cooldown without repeating beams',()=>{
  const g=game();S.melee(g,g.fighters[0],{attack:true,y:0});ticks(g,65,{sp1:true});assert.equal(g.events.filter(e=>e.type==='beam').length,1);ticks(g,90,{sp1:true});assert.equal(g.events.filter(e=>e.type==='beam').length,1);
  const h=game();h.fighters[0].powerCooldown=.3;ticks(h,67,{sp1:true});assert.equal(h.events.filter(e=>e.type==='beam').length,1);
});
test('charged beam hits only once and opposing beams clash without damaging either fighter',()=>{
  const g=game(),[a,b]=g.fighters;S.beam(g,a);ticks(g,40);assert.equal(b.hp,b.maxHp-35);
  const h=game(),[x,y]=h.fighters;S.beam(h,x);S.beam(h,y);h.step();assert.ok(h.clash);assert.ok(h.beams.every(b=>b.clashX===h.clash.x));assert.equal(x.hp,x.maxHp);assert.equal(y.hp,y.maxHp);ticks(h,35);assert.equal(h.events.filter(e=>e.type==='clash').length,1);
  const staggered=game();S.beam(staggered,staggered.fighters[0]);ticks(staggered,3);S.beam(staggered,staggered.fighters[1]);staggered.step();assert.ok(staggered.clash);assert.ok(staggered.fighters.every(f=>f.hp===f.maxHp));
});
test('rising dragon launches both fighters and Titan has the larger ground-pound wave',()=>{
  const g=game(),[a,b]=g.fighters;b.x=a.x+55;S.dragon(g,a);S.resolvePowers(g,1/60);assert.ok(a.vy<0&&b.vy<0);assert.equal(b.hp,b.maxHp-22);
  for(const character of ['blaze','titan']){const h=game([character,'shadow']),[f,d]=h.fighters;f.y-=180;f.grounded=false;d.x=f.x+220;assert.equal(S.pound(h,f),true);ticks(h,25);assert.equal(d.hp,d.maxHp-(character==='titan'?28:0));assert.ok(f.energy>=0);}
});
test('pause/input cancellation never releases an uncommitted blast or teleport',()=>{
  const g=game();ticks(g,8,{sp1:true,sp2:true});g.clearControls();g.step();assert.equal(g.projectiles.length,0);assert.equal(g.beams.length,0);assert.equal(g.events.filter(e=>e.type==='teleport').length,0);assert.equal(g.fighters[0].charging,false);
});
test('rounds stop on KO/time, draws replay the round and two wins finish the match',()=>{
  const g=game();g.remaining=S.RULES.dt;g.step();assert.equal(g.phase,'roundover');assert.equal(g.roundResult.winner,null);assert.deepEqual(g.wins,[0,0]);assert.equal(g.nextRound(),true);assert.equal(g.roundNumber,1);
  g.phase='fight';g.fighters[1].hp=1;S.hit(g,g.fighters[0],g.fighters[1],{damage:8});ticks(g,10);assert.equal(g.wins[0],1);assert.equal(g.phase,'roundover');g.nextRound();g.phase='fight';g.fighters[1].hp=1;S.hit(g,g.fighters[0],g.fighters[1],{damage:8});ticks(g,10);assert.equal(g.phase,'matchover');assert.equal(g.wins[0],2);assert.equal(g.nextRound(),false);
});
test('four bot reactions are distinct and decisions respect reaction delay and KO',()=>{
  assert.deepEqual(Object.values(S.DIFFICULTIES).map(d=>d.reaction),[.4,.2,.1,.05]);
  const g=game(),[target,f]=g.fighters,bot=new S.SuperBot('easy',()=>.5);assert.equal(bot.input(g,f,target).x,-1);target.x=1300;g.time=.1;assert.equal(bot.input(g,f,target).x,-1);g.time=.41;assert.equal(bot.input(g,f,target).x,1);f.ko=true;assert.deepEqual(bot.input(g,f,target),S.neutral());
});
test('pooled effects, projectiles, beams and fighter values stay bounded over complete matches',()=>{
  const p=new S.Particles(()=>.5);p.emit(0,0,'#fff',2000);assert.equal(p.pool.length,500);p.update(1);assert.ok(p.pool.every(p=>p.life<=0));
  for(const difficulty of Object.keys(S.DIFFICULTIES)){const g=new S.Match({mode:'solo',difficulty,seed:14}),bot=new S.SuperBot('hard',S.random(21));for(let i=0;i<12000&&g.phase!=='matchover';i++){if(g.phase==='roundover')g.nextRound();g.step([bot.input(g,g.fighters[0],g.fighters[1])]);assert.ok(g.projectiles.length<=32);assert.ok(g.beams.length<=2);for(const f of g.fighters)assert.ok(Number.isFinite(f.x)&&f.x>=0&&f.x+f.w<=1400.01&&f.energy>=0&&f.energy<=f.maxEnergy+.01&&f.hp>=0);}}
});
test('camera fits both fighters during a wide vertical split on landscape phones',()=>{
  const g=game();g.fighters[0].y=8;g.fighters[0].grounded=false;const camera=new S.FightCamera(),v=camera.update(g,2.3,1/60,false);
  for(const f of g.fighters)assert.ok(f.x>=v.x&&f.x+f.w<=v.x+v.w&&f.y>=v.y&&f.y+f.h<=v.y+v.h);
  assert.ok(v.w>1400);
  const h=game(),moving=new S.FightCamera();moving.update(h,2.3,1/60,false);h.fighters[1].x=1354;const framed=moving.update(h,2.3,1/60,true);for(const f of h.fighters)assert.ok(f.x>=framed.x&&f.x+f.w<=framed.x+framed.w);
});
test('the hard bot pursues an airborne opponent rather than staying on the floor',()=>{
  const g=new S.Match({mode:'solo',characters:['shadow','titan'],difficulty:'hard',seed:14});g.phase='fight';g.fighters[0].y=120;g.fighters[0].grounded=false;
  let minY=634,minEnergy=90;for(let i=0;i<75;i++){g.step([{y:-1}]);minY=Math.min(minY,g.fighters[1].y);minEnergy=Math.min(minEnergy,g.fighters[1].energy);}
  assert.ok(minY<500);assert.ok(minEnergy<90);
});
