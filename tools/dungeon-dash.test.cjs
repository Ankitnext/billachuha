const test=require('node:test'),assert=require('node:assert/strict');
const {Profile,Run,UPGRADES,WEAPONS,generateRoom,enemyTypes,themeFor}=require('../dungeon-dash-core.js');
const defeat=run=>{for(const e of [...run.room.enemies])run.hitEnemy(e,Infinity,{x:e.x,y:e.y},true);run.checkClear();};
const advance=run=>{defeat(run);run.leaveRoom();if(run.phase==='shop')run.continueShop();for(let i=0;i<4;i++)run.update({},.1);};

test('rooms are deterministic, varied, bounded and have a reachable platform graph',()=>{
  for(const [width,height]of [[560,600],[800,420],[800,600]])for(let seed=1;seed<=100;seed++){
    const room=generateRoom(1+(seed%9),seed,width,height);
    assert.deepEqual(room,generateRoom(1+(seed%9),seed,width,height));
    assert.ok(room.platforms.length>=4&&room.platforms.length<=8);
    const reached=new Set([0]);for(let pass=0;pass<8;pass++)room.platforms.forEach((p,i)=>{
      for(const j of reached){const q=room.platforms[j],rise=q.y-p.y,gap=Math.max(0,p.x-q.x-q.w,q.x-p.x-p.w);if(rise>=0&&rise<=240&&gap<=280)reached.add(i);}
    });
    assert.equal(reached.size,room.platforms.length,`unreachable ${seed}/${width}`);
    for(const p of room.platforms)assert.ok(p.x>=0&&p.x+p.w<=width&&p.y>=60&&p.y<=height-48);
    assert.ok(room.enemies.length>=2&&room.enemies.length<=4);
  }
  assert.notDeepEqual(generateRoom(4,1),generateRoom(4,2));
});
test('enemy unlocks, floor themes and endless scaling follow the plan',()=>{
  assert.deepEqual(enemyTypes(3),['walker']);assert.ok(enemyTypes(4).includes('jumper'));assert.ok(enemyTypes(7).includes('shooter'));
  assert.ok(enemyTypes(11).includes('charger'));assert.ok(enemyTypes(21).includes('flyer'));assert.ok(enemyTypes(31).includes('shielded'));
  assert.deepEqual([1,11,21,31,41,101].map(themeFor),['kitchen','garden','rooftop','sewer','inferno','inferno']);
  const r=new Run();r.roomNumber=111;r.enterRoom();assert.equal(r.room.floor,12);assert.ok(r.room.enemies.length<=8);assert.ok(r.room.enemies.every(e=>e.hp>2));
});
test('locked doors cannot skip enemies; clearing collects loot and advances to a new room',()=>{
  const r=new Run({seed:10});r.player.x=r.room.door.x;r.update({},.02);assert.equal(r.phase,'playing');assert.equal(r.roomNumber,1);
  defeat(r);const loot=r.room.gems.reduce((sum,g)=>sum+g.value,0);r.leaveRoom();assert.equal(r.gems,loot);assert.equal(r.phase,'transition');r.update({},.1);assert.equal(r.roomNumber,2);r.update({},.1);r.update({},.1);r.update({},.1);assert.equal(r.phase,'playing');assert.equal(r.player.x,42);assert.equal(r.room.cleared,false);
});
test('double jumping uses separate presses, upgrades apply and landing restores jumps',()=>{
  const r=new Run({upgrades:{max_hp:5,extra_jump:2,speed:3,damage:5,armor:1,greed:3,starting_weapon:2}});
  assert.equal(r.maxHp,10);assert.equal(r.maxJumps,4);assert.equal(r.speed,435);assert.equal(r.damage,2);assert.equal(r.shield,true);assert.equal(r.greed,1.5);assert.equal(r.weapon.type,'shotgun');
  r.update({jump:true},.02);assert.equal(r.player.jumps,3);r.update({jump:true},.02);assert.equal(r.player.jumps,3);r.update({},.02);r.update({jump:true},.02);assert.equal(r.player.jumps,2);
  r.room.enemies=[];for(let i=0;i<200;i++)r.update({},1/60);assert.equal(r.player.jumps,4);
});
test('weapons fire at their rates, consume ammo, swap and fall back to an unlimited pistol',()=>{
  for(const type of Object.keys(WEAPONS)){
    const r=new Run({seed:1});r.weapon=r.makeWeapon(type);r.nextShot=0;r.fire();assert.equal(r.bullets.length,WEAPONS[type].pellets);const ammo=r.weapon.ammo;r.fire();assert.equal(r.weapon.ammo,ammo);
  }
  const r=new Run();r.weapon={type:'smg',ammo:1};r.nextShot=0;r.fire();assert.equal(r.weapon.type,'pistol');assert.equal(r.weapon.ammo,Infinity);
  r.room.drops=[{type:'rocket',x:r.player.x,y:r.player.y,w:30,h:20}];r.swap();assert.equal(r.weapon.type,'rocket');assert.equal(r.reserve.type,'pistol');r.swap();assert.equal(r.weapon.type,'pistol');r.swap();assert.equal(r.weapon.type,'rocket');
});
test('damage has a one-second grace period, shield absorbs once, death resolves and cannot resume',()=>{
  const r=new Run({upgrades:{armor:1}});r.elapsed=10;r.hurt();assert.equal(r.player.hp,5);assert.equal(r.shield,false);r.hurt();assert.equal(r.player.hp,5);
  for(let i=0;i<5;i++){r.elapsed+=1.1;r.hurt();}assert.equal(r.player.hp,0);assert.equal(r.phase,'dying');for(let i=0;i<6;i++)r.update({},.1);assert.equal(r.phase,'dead');const t=r.elapsed;r.update({fire:true},.1);assert.equal(r.elapsed,t);
});
test('combos increase gem rewards, expire and do not pay twice for a defeated enemy',()=>{
  const r=new Run({seed:3});const [one,two]=r.room.enemies; r.hitEnemy(one,100,{x:0,y:0},true);r.hitEnemy(two,100,{x:0,y:0},true);
  assert.equal(r.combo,2);assert.equal(r.bestCombo,2);const loot=r.room.gems.reduce((n,g)=>n+g.value,0);assert.ok(loot>=3);
  const kills=r.kills;r.hitEnemy(one,100,{x:0,y:0},true);assert.equal(r.kills,kills);
  r.elapsed+=4;r.update({},.01);assert.equal(r.combo,0);
});
test('safe shops spend current gems, buffs last full rooms and room bombs clear the next room',()=>{
  const r=new Run({seed:4});r.roomNumber=5;r.enterRoom();r.player.hp=3;r.gems=200;r.earned=200;defeat(r);r.leaveRoom();assert.equal(r.phase,'shop');
  const gems=r.gems;assert.equal(r.buy('heal'),true);assert.equal(r.player.hp,5);assert.equal(r.gems,gems-15);assert.equal(r.buy('heal'),false);
  assert.equal(r.buy('damage'),true);assert.equal(r.buy('magnet'),true);assert.equal(r.buy('bomb'),true);assert.equal(r.buy('bomb'),false);
  r.continueShop();for(let i=0;i<4;i++)r.update({},.1);assert.equal(r.roomNumber,6);assert.equal(r.room.cleared,true);assert.equal(r.buffs.damage,3);assert.equal(r.buffs.magnet,5);assert.equal(r.buffs.bomb,false);
  for(let i=0;i<3;i++)advance(r);assert.equal(r.buffs.damage,0);assert.equal(r.buffs.magnet,2);
});
test('permanent shop enforces costs, caps and cannot spend during a run',()=>{
  const p=new Profile({gems:10000});for(const [key,item]of Object.entries(UPGRADES)){for(const cost of item.costs){const wallet=p.gems;assert.equal(p.buy(key),true);assert.equal(p.gems,wallet-cost);}assert.equal(p.buy(key),false);}
  const poor=new Profile();assert.equal(poor.buy('max_hp'),false);assert.equal(poor.buy('unknown'),false);p.begin('one');assert.equal(p.buy('max_hp'),false);
});
test('checkpoints bank unspent gems exactly once, survive reload and recover an interrupted run',()=>{
  const p=new Profile({gems:20}),r=new Run({id:'unique'});p.begin(r.id);r.collect(40);r.kills=3;r.elapsed=42;r.roomNumber=8;r.spent=15;r.gems-=15;p.checkpoint(r);p.checkpoint(r);
  assert.equal(p.totalKills,3);assert.equal(p.gems,20);const loaded=new Profile(JSON.parse(JSON.stringify(p)));assert.equal(loaded.recover(),true);assert.equal(loaded.gems,45);assert.equal(loaded.recover(),false);assert.equal(loaded.bestRoom,8);assert.equal(loaded.totalRuns,1);
  assert.equal(p.bank(r),true);assert.equal(p.gems,45);assert.equal(p.bank(r),false);assert.equal(p.gems,45);assert.equal(p.totalKills,3);
  const invalid=new Profile({gems:-4,bestRoom:Infinity,upgrades:{max_hp:999,armor:-1}});assert.equal(invalid.gems,0);assert.equal(invalid.upgrades.max_hp,5);assert.equal(invalid.upgrades.armor,0);
});
test('three boss encounters have distinct phases, turret shielding and twin enrage',()=>{
  const cat=new Run();cat.roomNumber=10;cat.enterRoom();cat.elapsed=10;let boss=cat.room.enemies[0];boss.hp=boss.maxHp*.45;cat.enemyAI(boss,.02);assert.ok(cat.room.enemies.some(e=>e.type==='walker'));boss.hp=boss.maxHp*.2;cat.enemyAI(boss,.02);assert.equal(boss.phase,3);assert.ok(boss.slamAt>cat.elapsed);
  const dog=new Run();dog.roomNumber=20;dog.enterRoom();dog.elapsed=10;boss=dog.room.enemies[0];boss.hp=boss.maxHp*.2;dog.enemyAI(boss,.02);assert.equal(dog.generalShield(boss),true);const hp=boss.hp;dog.hitEnemy(boss,4,{x:0,y:0},true);assert.equal(boss.hp,hp);const turret=dog.room.enemies.find(e=>e.type==='turret');dog.hitEnemy(turret,1000,{x:0,y:0},true);assert.equal(dog.generalShield(boss),false);dog.hitEnemy(boss,1,{x:0,y:0},true);assert.equal(boss.hp,hp-1);
  const twins=new Run();twins.roomNumber=30;twins.enterRoom();twins.elapsed=10;const [one,two]=twins.room.enemies;twins.hitEnemy(one,1000,{x:0,y:0},true);twins.enemyAI(two,.02);assert.equal(two.enraged,true);twins.hitEnemy(two,1000,{x:0,y:0},true);const value=twins.room.gems.reduce((s,g)=>s+g.value,0);assert.equal(value,70);assert.equal(twins.room.rewardGiven,true);
});
test('front shields block shots, elevated attacks bypass them and rockets also hurt nearby players',()=>{
  const r=new Run();r.roomNumber=31;r.enterRoom();const e=r.makeEnemy({type:'shielded',platform:0,x:400},99);r.room.enemies=[e];
  assert.equal(r.hitEnemy(e,1,{x:0,y:e.y+10}),false);assert.equal(r.hitEnemy(e,1,{x:450,y:e.y+10}),true);assert.equal(r.hitEnemy(e,1,{x:e.x,y:e.y-100}),true);
  r.elapsed=10;r.explode({x:r.player.x+17,y:r.player.y+26,damage:5,origin:{x:0,y:0}});assert.equal(r.player.hp,4);
});
test('long combat keeps bullets, bombs, particles and drops bounded',()=>{
  const r=new Run({seed:26});r.roomNumber=30;r.enterRoom();r.player.hp=10000;
  for(let i=0;i<7200;i++)r.update({fire:true,x:Math.sin(i/150),jump:i%50===0},1/60);
  assert.ok(r.bullets.length<=153);assert.ok(r.bombs.length<=18);assert.ok(r.particles.length<=180);assert.ok(r.room.drops.length<=13);assert.ok(r.texts.length<=20);assert.ok(r.room.gems.length<=120);
});
test('rotation reshapes the same room without resetting enemies, health or run currency',()=>{
  const r=new Run({seed:14,width:560,height:600});r.player.hp=3;r.collect(25);r.room.enemies[0].hp=1;
  const flyer=r.makeEnemy({type:'flyer',platform:1,x:300},99);flyer.y=150;r.room.enemies.push(flyer);const flyerBottom=flyer.y+flyer.h;
  const enemyCount=r.room.enemies.length,number=r.roomNumber;
  r.resize(800,420);assert.equal(r.width,800);assert.equal(r.height,420);assert.equal(r.player.y+r.player.h,372);assert.equal(r.room.enemies.length,enemyCount);assert.equal(r.room.enemies[0].hp,1);assert.equal(r.player.hp,3);assert.equal(r.gems,25);assert.equal(r.roomNumber,number);assert.equal(r.room.door.y+r.room.door.h,372);
  r.resize(560,600);assert.equal(r.player.y+r.player.h,552);for(const p of r.room.platforms)assert.ok(p.y>=60&&p.x+p.w<=561);
  assert.equal(flyer.standing,null);assert.ok(Math.abs(flyer.y+flyer.h-flyerBottom)<.01);
});
