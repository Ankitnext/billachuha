const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../sky-siege-core.js');
function run(){return new S.Run({seed:7123,id:'test'});}
function cat(r,type='walker',layer=3){const p=r.layer(layer).platforms[0],c={id:++r.serial,type,hp:S.CAT_TYPES[type].hp,wave:1,layer,platform:p.id,x:p.x+p.w/2,y:p.y,state:'waiting',waitUntil:0,travel:null,stunUntil:0,revealedUntil:0,dead:false};r.cats.push(c);return c;}
function defense(r,type,layer=3){const p=r.layer(layer).platforms[0];Object.assign(r.player,{x:p.x+p.w/2,y:p.y,grounded:true,standing:p.id});r.cheese=1000;r.nextPlace=0;assert.equal(r.place(type),true);return p;}
test('seeded layers have two or three bounded shelves, cheese and reachable next-layer routes',()=>{
  const flight=(620+Math.sqrt(620**2-2*1800*80))/1800,range=260*flight;
  for(let seed=1;seed<=30;seed++)for(let i=1;i<=100;i++){
    const l=S.generateLayer(i,seed),previous=S.generateLayer(i-1,seed);assert.deepEqual(l,S.generateLayer(i,seed));assert.ok(l.platforms.length>=2&&l.platforms.length<=3);assert.ok(l.platforms.some(p=>p.cheese));
    for(const p of l.platforms){assert.ok(p.x>=4&&p.x+p.w<=476&&p.w>=90&&p.w<=180);assert.equal(p.y,-i*80);assert.ok(previous.platforms.some(q=>Math.max(0,p.x-q.x-q.w,q.x-p.x-p.w)<range));}
  }
});
test('jump edges give two leaps without auto-bouncing; upgraded jumps and wall slides work',()=>{
  const r=run();r.update({jump:true},.1);assert.equal(r.player.jumpsRemaining,1);r.update({jump:true},.1);assert.equal(r.player.jumpsRemaining,1);r.update({},.01);r.update({jump:true},.01);assert.equal(r.player.jumpsRemaining,0);
  const upgraded=new S.Run({upgrades:{extra_jump:2,climb_speed:3}});assert.equal(upgraded.maxJumps,4);assert.equal(upgraded.speed,260*1.45);
  Object.assign(upgraded.player,{x:15,y:-50,vy:300,grounded:false});upgraded.update({x:-1},1/60);assert.equal(upgraded.player.wallSliding,true);assert.ok(upgraded.player.vy<=60.01);
});
test('a real jump reaches a generated shelf and landing refills leaps',()=>{
  const r=run(),target=r.layer(1).platforms.reduce((a,b)=>Math.abs(a.x+a.w/2-240)<Math.abs(b.x+b.w/2-240)?a:b),x=target.x+target.w/2;
  for(let i=0;i<90&&(r.player.standing==='0:0'||!r.player.grounded);i++){r.update({x:Math.abs(x-r.player.x)>8?Math.sign(x-r.player.x):0,jump:i===0},1/60);}
  assert.ok(r.player.grounded);assert.notEqual(r.player.standing,'0:0');assert.equal(r.player.jumpsRemaining,2);
});
test('placement requires a shelf, enough cheese and one empty defense slot',()=>{
  const r=run();r.cheese=4;assert.equal(r.place('butter'),false);r.cheese=100;r.player.grounded=false;assert.equal(r.place('butter'),false);r.player.grounded=true;assert.equal(r.place('butter'),true);assert.equal(r.cheese,95);assert.equal(r.place('dogGuard'),false);assert.equal(r.cheese,95);assert.equal(r.trapsPlaced,1);assert.equal(r.place('__proto__'),false);
});
test('walkers climb one shelf while Jumpers skip intermediate landing traps',()=>{
  for(const [type,expected]of [['walker',2],['jumper',3]]){
    const r=run(),c=cat(r,type,1);for(const p of r.layer(2).platforms)if(type==='jumper')p.trap={type:'butter',state:'ready'};
    r.updateCats(.01);assert.equal(c.travel.layer,expected);const duration=c.travel.duration;
    r.elapsed+=duration;r.updateCats(duration);assert.equal(c.layer,expected);assert.equal(c.dead,false);
    if(type==='jumper')assert.ok(r.layer(2).platforms.every(p=>p.trap));
  }
});
test('butter stops a Walker, while a Tank survives, destroys the trap and drops two layers',()=>{
  const r=run(),p=defense(r,'butter',4),c=cat(r,'tank',4);r.trigger(p,c);assert.equal(c.hp,1);assert.equal(p.trap,null);assert.equal(c.travel.layer,2);r.updateCats(.7);assert.equal(c.layer,2);
  const other=defense(r,'butter',3),walker=cat(r,'walker',3);r.trigger(other,walker);assert.equal(walker.dead,true);assert.equal(r.kills,1);
});
test('magnet pulls within 60px, reveals and holds for three seconds before its hit',()=>{
  const r=run(),p=defense(r,'magnet'),c=cat(r,'ninja');c.x=p.trap.x+45;c.y=p.y-10;r.updateTraps();assert.equal(c.state,'stunned');assert.equal(c.x,p.trap.x);assert.equal(c.stunUntil,3);assert.ok(c.revealedUntil>3);
  r.elapsed=2.99;r.updateTraps();assert.equal(c.dead,false);r.elapsed=3.01;r.updateTraps();assert.equal(c.dead,true);assert.equal(p.trap,null);
});
test('Firecracker waits for a two-second fuse and hits the surrounding Cats; Tank takes two hits',()=>{
  const r=run(),p=defense(r,'firecracker'),a=cat(r),b=cat(r,'jumper'),tank=cat(r,'tank');b.x+=30;tank.x-=25;r.trigger(p,a);assert.equal(p.trap.state,'fuse');r.elapsed=1.99;r.updateTraps();assert.equal(a.dead,false);r.elapsed=2.01;r.updateTraps();assert.ok(a.dead&&b.dead);assert.equal(tank.hp,1);assert.equal(tank.travel.layer,0);assert.equal(r.kills,2);assert.equal(p.trap,null);r.hit(tank,'butter');assert.equal(r.kills,3);
});
test('Dog Guards punch three times, survive Tanks, expire and reveal Ninjas with barks',()=>{
  const r=run(),p=defense(r,'dogGuard');for(let i=0;i<3;i++){r.elapsed=i*.7;const c=cat(r);r.trigger(p,c);assert.equal(c.dead,true);}assert.equal(p.trap,null);
  const p2=defense(r,'dogGuard',4),tank=cat(r,'tank',4);r.trigger(p2,tank);assert.equal(tank.hp,1);assert.ok(p2.trap);
  const n=cat(r,'ninja',5);n.x=p2.trap.x;n.y=p2.y-85;r.elapsed=p2.trap.barkAt;r.updateTraps();assert.ok(n.revealedUntil>r.elapsed);r.elapsed=p2.trap.expires+.01;r.updateTraps();assert.equal(p2.trap,null);
});
test('Ninja visibility depends on adjacent layer, a reveal, or a defense blast',()=>{
  const r=run(),c=cat(r,'ninja',4);assert.equal(r.catVisible(c),false);r.player.y=-240;assert.equal(r.catVisible(c),true);r.player.y=0;c.revealedUntil=2;assert.equal(r.catVisible(c),true);r.elapsed=3;assert.equal(r.catVisible(c),false);
});
test('waves queue every five layers with two seconds of warning and may overlap',()=>{
  const r=run();r.reach(4);assert.equal(r.pending.length,0);r.reach(5);assert.equal(r.pending.length,1);assert.equal(r.pending[0].at,2);r.reach(15);assert.equal(r.pending.length,3);
  for(const pending of r.pending)r.spawnWave(pending);assert.equal(r.waves.length,3);assert.equal(r.cats.length,7);
  for(const wave of [1,3,5,8,100]){const types=new Set(Array.from({length:50},(_,seed)=>S.waveComposition(wave,S.random(seed))).flat());assert.ok(types.has('walker'));assert.equal(types.has('jumper'),wave>=3);assert.equal(types.has('tank'),wave>=5);assert.equal(types.has('ninja'),wave>=8);assert.ok(S.waveComposition(wave).length<=8);}
});
test('wave-clear rewards pay once and outpaced Cats do not count as defeated',()=>{
  const r=run();r.spawnWave({number:1,types:['walker','walker']});const [a,b]=r.cats;r.defeat(a,'butter');r.defeat(a,'butter');r.defeat(b,'butter');assert.equal(r.kills,2);assert.equal(r.cheese,7);assert.equal(r.waves[0].paid,true);
  const other=run();other.spawnWave({number:1,types:['walker','walker']});other.retire(other.cats[0]);other.defeat(other.cats[1],'butter');assert.equal(other.cheese,1);assert.equal(other.waves[0].paid,false);
});
test('contact catches Rat, defense stun protects, and the catch animation lasts 1.5 seconds',()=>{
  const r=run(),c=cat(r,'walker',0);c.x=r.player.x;c.y=r.player.y;c.waitUntil=100;r.update({},.01);assert.equal(r.phase,'caught');for(let i=0;i<14;i++)r.update({},.1);assert.equal(r.phase,'caught');r.update({},.1);assert.equal(r.phase,'dead');
  const protectedRun=run(),stunned=cat(protectedRun,'walker',0);stunned.x=240;stunned.y=0;stunned.state='stunned';stunned.stunUntil=10;protectedRun.update({},.1);assert.equal(protectedRun.phase,'playing');
});
test('earned cheese times height determines score; only unspent earned cheese can be banked',()=>{
  const p=new S.Profile({upgrades:{starting_cheese:4}}),r=new S.Run({id:'funds',upgrades:p.upgrades});p.begin(r.id);assert.equal(r.cheese,20);assert.equal(r.stats().bankable,0);r.addCheese(12);r.highestLayer=8;assert.equal(r.score,96);r.place('firecracker');assert.equal(r.cheese,17);assert.equal(r.stats().bankable,12);r.elapsed=1;r.nextPlace=0;r.player.standing=r.layer(1).platforms[0].id;r.place('butter');assert.equal(r.stats().bankable,12);r.retreat();assert.equal(p.bank(r),true);assert.equal(p.cheese,12);assert.equal(p.bank(r),false);assert.equal(p.cheese,12);
});
test('all seven upgrades validate levels, costs, limits and apply only to new runs',()=>{
  const p=new S.Profile({cheese:10000});assert.equal(Object.keys(S.UPGRADES).length,7);assert.equal(p.buy('__proto__'),false);assert.equal(p.buy('nope'),false);
  for(const [key,item]of Object.entries(S.UPGRADES)){for(let i=0;i<item.costs.length;i++){const before=p.cheese;assert.equal(p.buy(key),true);assert.equal(p.cheese,before-item.costs[i]);}assert.equal(p.buy(key),false);}
  const r=new S.Run({upgrades:p.upgrades});assert.equal(r.maxJumps,4);assert.equal(r.cost('butter'),2);assert.equal(r.blastRadius,128);assert.equal(r.collectRange,66);assert.equal(r.startingCheese,20);p.begin('active');assert.equal(p.buy('extra_jump'),false);
});
test('milestone cheese repeats per run; badge/wallet rewards are once per profile',()=>{
  const p=new S.Profile(),r=run();p.begin(r.id);r.reach(25);assert.equal(r.totalCheese,10);p.checkpoint(r);assert.equal(p.cheese,15);p.checkpoint(r);assert.equal(p.cheese,15);r.reach(25);assert.equal(r.totalCheese,10);r.reach(50);p.checkpoint(r);assert.equal(p.cheese,40);assert.deepEqual(p.milestones,[25,50]);r.retreat();p.bank(r);const next=new S.Run({id:'next'});p.begin('next');next.reach(25);const wallet=p.cheese;p.checkpoint(next);assert.equal(p.cheese,wallet);
});
test('profile JSON recovery banks a checkpoint once and rejects invalid data',()=>{
  const p=new S.Profile(),r=run();p.begin(r.id);r.addCheese(14);r.highestLayer=6;r.kills=3;r.trapsPlaced=2;p.checkpoint(r);let loaded=new S.Profile(JSON.parse(JSON.stringify(p)));assert.equal(loaded.recover(),true);assert.equal(loaded.cheese,14);assert.equal(loaded.recover(),false);loaded=new S.Profile(JSON.parse(JSON.stringify(loaded)));assert.equal(loaded.cheese,14);assert.equal(loaded.bestScore,84);assert.equal(loaded.totalCatsDefeated,3);
  const bad=new S.Profile({cheese:'900',bestHeight:NaN,upgrades:{extra_jump:100,climb_speed:-2},milestones:[25,25,'50',600],active:{id:'',cheese:1000}});assert.equal(bad.cheese,0);assert.equal(bad.bestHeight,0);assert.equal(bad.upgrades.extra_jump,2);assert.equal(bad.upgrades.climb_speed,0);assert.deepEqual(bad.milestones,[25]);assert.equal(bad.active,null);
});
test('long climbs retain a bounded shelf buffer, Cat roster, effects and wave records',()=>{
  const r=run();for(let i=1;i<=600;i++){r.player.y=-i*80;r.player.x=100;r.cameraY=r.player.y-300;r.reach(i);r.manageLayers();r.elapsed+=.5;for(const w of r.pending.filter(w=>w.at<=r.elapsed))r.spawnWave(w);r.pending=r.pending.filter(w=>w.at>r.elapsed);r.updateCats(.1);r.waves=r.waves.filter(w=>w.remaining>0||w.number>=r.waveNumber-8);}
  assert.ok(r.layers.length<=30);assert.ok(r.platforms.length<=85);assert.ok(r.cats.length<=96);assert.ok(r.waves.length<=40);assert.ok(r.pending.length<=12);assert.ok(r.layer(0));assert.ok(r.cats.every(c=>Number.isFinite(c.x)&&Number.isFinite(c.y)));
});
