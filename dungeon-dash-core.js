/* Dungeon Dash: deterministic rooms, combat and durable progression, independent of the DOM. */
((root, factory) => { const api = factory(); if (typeof module === 'object' && module.exports) module.exports = api; else root.DungeonDash = api; })(globalThis, () => {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const integer = (n, max = 1000000000) => Number.isFinite(n) ? clamp(Math.floor(n), 0, max) : 0;
  const overlap = (a, b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  const center = p => ({x:p.x+p.w/2, y:p.y+p.h/2});
  const distance = (a, b) => Math.hypot(a.x-b.x, a.y-b.y);
  function random(seed) { let state = seed>>>0; return () => { state += 0x6D2B79F5; let n=state; n=Math.imul(n^n>>>15,n|1); n^=n+Math.imul(n^n>>>7,n|61); return ((n^n>>>14)>>>0)/4294967296; }; }
  const UPGRADES = Object.freeze({
    max_hp:{name:'Heart container',icon:'♥',costs:[50,80,120,180,250],description:'One more heart per level. Start each run at full health.'},
    damage:{name:'Stronger shots',icon:'➶',costs:[40,70,110,160,230],description:'+20% weapon and stomp damage per level.'},
    speed:{name:'Quick paws',icon:'»',costs:[60,100,160],description:'+15% movement speed per level.'},
    extra_jump:{name:'Extra leap',icon:'↑',costs:[80,150],description:'Add a third jump, then a fourth jump.'},
    armor:{name:'Starting shield',icon:'◈',costs:[120],description:'Absorb one hit at the start of every run.'},
    greed:{name:'Gem finder',icon:'◆',costs:[70,120,190],description:'Gem rewards increase by 15%, 30%, then 50%.'},
    starting_weapon:{name:'Starting weapon',icon:'✦',costs:[100,200],description:'Start with an SMG, then a shotgun. Pistol stays available.'}
  });
  const WEAPONS = Object.freeze({
    pistol:{name:'Pistol',damage:1,delay:1/3,ammo:Infinity,speed:850,pellets:1,spread:0},
    smg:{name:'SMG',damage:.6,delay:1/8,ammo:40,speed:920,pellets:1,spread:.07},
    shotgun:{name:'Shotgun',damage:.7,delay:1,ammo:15,speed:780,pellets:3,spread:.26},
    rocket:{name:'Rocket',damage:5,delay:2,ammo:5,speed:510,pellets:1,spread:0}
  });
  const ITEMS = Object.freeze({
    heal:{name:'Patch up',icon:'♥',cost:15,description:'Restore two hearts.'},
    shield:{name:'Pocket shield',icon:'◈',cost:25,description:'Absorb the next hit.'},
    damage:{name:'Double damage',icon:'ϟ',cost:30,description:'Twice the damage for the next three rooms.'},
    magnet:{name:'Gem magnet',icon:'◆',cost:20,description:'Pull gems from farther away for five rooms.'},
    bomb:{name:'Room bomb',icon:'✹',cost:40,description:'Clear the enemies in the next room.'}
  });
  const THEMES = ['kitchen','garden','rooftop','sewer','inferno'];
  const emptyLevels = () => Object.fromEntries(Object.keys(UPGRADES).map(key=>[key,0]));
  function safeStats(raw) {
    if (!raw || typeof raw !== 'object') return null;
    return {id:String(raw.id||'').slice(0,80),room:Math.max(1,integer(raw.room,1000000)),kills:integer(raw.kills),gems:integer(raw.gems),earned:integer(raw.earned),spent:integer(raw.spent),time:integer(raw.time),combo:integer(raw.combo,100),reason:String(raw.reason||'').slice(0,100)};
  }
  class Profile {
    constructor(raw={}) {
      this.version=1; this.gems=integer(raw?.gems); this.bestRoom=integer(raw?.bestRoom,1000000);
      this.totalRuns=integer(raw?.totalRuns); this.totalKills=integer(raw?.totalKills); this.upgrades=emptyLevels();
      for (const key of Object.keys(UPGRADES)) this.upgrades[key]=integer(raw?.upgrades?.[key],UPGRADES[key].costs.length);
      this.active=safeStats(raw?.active); this.last=safeStats(raw?.last);
    }
    buy(key) {
      const item=UPGRADES[key]; if (!item || this.active) return false;
      const cost=item.costs[this.upgrades[key]]; if (cost===undefined || this.gems<cost) return false;
      this.gems-=cost; this.upgrades[key]++; return true;
    }
    begin(id) {
      if (this.active) this.recover();
      this.totalRuns=integer(this.totalRuns+1); this.active=safeStats({id,room:1});
    }
    checkpoint(run) {
      if (!this.active || this.active.id!==run.id) return false;
      const stats=safeStats(run.stats());
      this.totalKills=integer(this.totalKills+Math.max(0,stats.kills-this.active.kills));
      this.bestRoom=Math.max(this.bestRoom,stats.room); this.active=stats; return true;
    }
    bank(run) {
      if (!this.checkpoint(run)) return false;
      this.gems=integer(this.gems+this.active.gems); this.last=this.active; this.active=null; return true;
    }
    recover() {
      if (!this.active) return false;
      this.gems=integer(this.gems+this.active.gems); this.last={...this.active,reason:'Interrupted run · saved gems recovered'};
      this.active=null; return true;
    }
  }
  function floorFor(room) { return Math.floor((room-1)/10)+1; }
  function themeFor(room) { return THEMES[Math.min(4,floorFor(room)-1)]; }
  function enemyTypes(room) { return ['walker',...(room>=4?['jumper']:[]),...(room>=7?['shooter']:[]),...(room>=11?['charger']:[]),...(room>=21?['flyer']:[]),...(room>=31?['shielded']:[])]; }
  function generateRoom(number, seed, width=800, height=600) {
    const rng=random(seed), floor=floorFor(number), ground=height-48;
    const room={number,floor,theme:themeFor(number),width,height,platforms:[{x:0,y:ground,w:width,h:48}],enemies:[],gems:[],drops:[],cleared:false,boss:number%10===0,door:{x:width-59,y:ground-78,w:43,h:78},rewardGiven:false};
    if (!room.boss) {
      const slots=new Set(['0,0','1,1','2,2']);
      const count=3+Math.floor(rng()*5);
      while (slots.size<count) slots.add(`${Math.floor(rng()*4)},${Math.floor(rng()*3)}`);
      const rise=Math.min(118,(ground-80)/3), tile=width/4;
      for (const slot of slots) {
        const [col,row]=slot.split(',').map(Number), w=Math.min(150,tile-22);
        room.platforms.push({x:col*tile+(tile-w)/2+(rng()-.5)*12,y:ground-rise*(row+1),w,h:16});
      }
      const types=enemyTypes(number), countEnemies=Math.min(8,2+floor-1+Math.floor(rng()*3));
      for (let i=0;i<countEnemies;i++) {
        const platform=i===0?0:1+(i-1)%(room.platforms.length-1), p=room.platforms[platform];
        room.enemies.push({type:types[Math.floor(rng()*types.length)],platform,x:platform===0?width*.58:p.x+p.w*.55});
      }
      if (number%3===0) room.drops.push({x:width*.5,y:ground-20,type:['smg','shotgun','rocket'][Math.floor(rng()*3)],w:30,h:20});
    } else {
      room.platforms.push({x:width*.18,y:ground-115,w:width*.2,h:16},{x:width*.62,y:ground-115,w:width*.2,h:16});
      room.bossType=['fat-cat','general','twins'][(floor-1)%3];
      const types=room.bossType==='twins'?['twin-melee','twin-ranged']:[room.bossType];
      for (let i=0;i<types.length;i++) room.enemies.push({type:types[i],platform:0,x:width*(i?.77:.6),boss:true});
    }
    return room;
  }

  class Run {
    constructor({seed=Date.now(),id=String(seed),upgrades={},width=800,height=600}={}) {
      this.seed=seed>>>0; this.id=id; this.random=random(this.seed); this.width=clamp(width,560,1000); this.height=clamp(height,420,760);
      this.levels=emptyLevels(); for (const key of Object.keys(UPGRADES)) this.levels[key]=integer(upgrades[key],UPGRADES[key].costs.length);
      this.maxHp=5+this.levels.max_hp; this.maxJumps=2+this.levels.extra_jump; this.speed=300*(1+.15*this.levels.speed);
      this.damage=1+.2*this.levels.damage; this.greed=[1,1.15,1.3,1.5][this.levels.greed];
      this.phase='playing'; this.elapsed=0; this.roomNumber=1; this.gems=0; this.earned=0; this.spent=0; this.kills=0;
      this.combo=0; this.comboUntil=0; this.bestCombo=0; this.buffs={damage:0,magnet:0,bomb:false}; this.shield=!!this.levels.armor;
      this.weapon=this.makeWeapon(['pistol','smg','shotgun'][this.levels.starting_weapon]); this.reserve=this.weapon.type==='pistol'?null:this.makeWeapon('pistol');
      this.nextShot=0; this.jumpHeld=false; this.swapHeld=false; this.events=[]; this.particles=[]; this.texts=[]; this.bullets=[]; this.bombs=[]; this.waves=[];
      this.reason=''; this.deathTime=0; this.transition=0; this.shake=0; this.enterRoom();
    }
    makeWeapon(type) { return {type,ammo:WEAPONS[type].ammo}; }
    resize(width,height) {
      width=clamp(width,560,1000);height=clamp(height,420,760);
      if(width===this.width&&height===this.height)return;
      const sx=width/this.width,sy=(height-48)/(this.height-48);
      this.width=width;this.height=height;this.room.width=width;this.room.height=height;
      for(const p of this.room.platforms){p.x*=sx;p.w*=sx;p.y*=sy;}
      for(const body of [this.player,...this.room.enemies]){
        body.x=clamp((body.x+body.w/2)*sx-body.w/2,0,width-body.w);
        body.y=body.standing!==null?this.room.platforms[body.standing].y-body.h:(body.y+body.h)*sy-body.h;
      }
      for(const item of [...this.room.gems,...this.room.drops,...this.bullets,...this.bombs,...this.waves,...this.particles,...this.texts]){item.x*=sx;item.y*=sy;}
      this.room.door.x=width-59;this.room.door.y=height-126;
    }
    stats() { return {id:this.id,room:this.roomNumber,kills:this.kills,gems:this.gems,earned:this.earned,spent:this.spent,time:Math.round(this.elapsed),combo:this.bestCombo,reason:this.reason}; }
    emit(type) { if (this.events.length<30) this.events.push(type); }
    text(text,x,y,color='#f5d98a') { this.texts.push({text,x,y,color,life:1.3}); if (this.texts.length>20) this.texts.shift(); }
    burst(x,y,color,count=10) { for(let i=0;i<count;i++)this.particles.push({x,y,vx:(this.random()-.5)*190,vy:-this.random()*180,life:.4+this.random()*.35,color}); if(this.particles.length>180)this.particles.splice(0,this.particles.length-180); }
    enterRoom() {
      this.room=generateRoom(this.roomNumber,Math.floor(this.random()*4294967296),this.width,this.height);
      this.bullets=[];this.bombs=[];this.waves=[];this.particles=[];this.texts=[]; this.combo=0;this.comboUntil=0;
      this.jumpHeld=false;this.swapHeld=false;this.nextShot=this.elapsed+.15;
      const hp=this.player?.hp??this.maxHp;
      this.player={x:42,y:this.height-100,w:34,h:52,vx:0,vy:0,hp,jumps:this.maxJumps,face:1,invulnerable:this.elapsed+.6,standing:0,dropUntil:0};
      this.room.enemies=this.room.enemies.map((spec,i)=>this.makeEnemy(spec,i));
      this.warningUntil=this.room.boss?this.elapsed+1.5:0;
      this.phase='playing'; this.emit(this.room.boss?'boss':'room');
      if (this.buffs.bomb) { this.buffs.bomb=false; for(const e of this.room.enemies)this.hitEnemy(e,Infinity,{x:e.x,y:e.y},true); this.shake=.3; this.checkClear(); }
    }
    makeEnemy(spec,id) {
      const floor=this.room.floor, type=spec.type, boss=!!spec.boss;
      const hpBase={walker:2,jumper:3,shooter:4,charger:3,flyer:3,shielded:6,'fat-cat':36,general:48,'twin-melee':30,'twin-ranged':30,turret:5}[type];
      const scale=boss?1+(floor-1)*.3:[1,1.3,1.6,2,2.5][Math.min(4,floor-1)]+Math.max(0,floor-5)*.3;
      const w=type==='fat-cat'?104:boss?64:34,h=type==='fat-cat'?90:boss?66:38;
      const platform=this.room.platforms[spec.platform],hp=Math.max(1,Math.ceil(hpBase*scale));
      return {...spec,id,w,h,x:clamp(spec.x,10,this.width-w-12),y:platform.y-h,vx:0,vy:0,hp,maxHp:hp,dir:-1,standing:type==='flyer'?null:spec.platform,phase:1,phaseTwo:false,phaseThree:false,enraged:false,nextAction:this.elapsed+1+this.random(),warning:0,actionEnd:0,hitUntil:0,stompUntil:0,bombAt:this.elapsed+2.5,home:spec.x,age:0};
    }
    fire() {
      if (this.elapsed<this.nextShot || this.bullets.length>=120 || this.phase!=='playing') return;
      if (this.weapon.ammo<=0) this.weapon=this.makeWeapon('pistol');
      const spec=WEAPONS[this.weapon.type], p=center(this.player);
      const targets=this.room.enemies.filter(e=>e.hp>0&&!this.generalShield(e));
      targets.sort((a,b)=>distance(p,center(a))-distance(p,center(b)));
      const target=targets[0], aim=target?Math.atan2(center(target).y-p.y,center(target).x-p.x):this.player.face>0?0:Math.PI;
      const muzzle={x:p.x+Math.cos(aim)*23,y:p.y+Math.sin(aim)*23};
      for (let i=0;i<spec.pellets;i++) {
        const angle=aim+(spec.pellets===3?(i-1)*spec.spread:(this.random()-.5)*spec.spread*2);
        this.bullets.push({x:muzzle.x,y:muzzle.y,w:this.weapon.type==='rocket'?15:10,h:6,vx:Math.cos(angle)*spec.speed,vy:Math.sin(angle)*spec.speed,life:1.8,owner:'player',damage:spec.damage*this.damage*(this.buffs.damage>0?2:1),rocket:this.weapon.type==='rocket',origin:muzzle});
      }
      this.weapon.ammo--; this.nextShot=this.elapsed+spec.delay;this.lastWeaponFired=this.weapon.type;this.emit('fire');
      if(this.weapon.ammo<=0){this.weapon=this.makeWeapon('pistol');this.text('PISTOL · ∞',this.player.x,this.player.y-20);}
    }
    swap() {
      const p=center(this.player), near=this.room.drops.filter(d=>distance(p,center(d))<78).sort((a,b)=>distance(p,center(a))-distance(p,center(b)))[0];
      if(near){this.reserve=this.weapon;this.weapon=this.makeWeapon(near.type);this.room.drops.splice(this.room.drops.indexOf(near),1);this.text(WEAPONS[near.type].name.toUpperCase(),this.player.x,this.player.y-20);this.emit('pickup');}
      else if(this.reserve){[this.weapon,this.reserve]=[this.reserve,this.weapon];this.emit('pickup');}
    }
    generalShield(e) { return e.type==='general'&&e.phase===3&&this.room.enemies.some(t=>t.type==='turret'&&t.hp>0); }
    hitEnemy(e, damage, origin, bypass=false) {
      if(e.hp<=0||(this.generalShield(e)&&damage!==Infinity))return false;
      if(!bypass&&e.type==='shielded') {
        const c=center(e),dx=origin.x-c.x,dy=origin.y-c.y;
        if(dx*e.dir>0&&Math.abs(dy)<Math.abs(dx)*.65){this.burst(c.x,c.y,'#b3d6dd',3);return false;}
      }
      e.hp-=damage;e.hitUntil=this.elapsed+.09;this.emit('hit');
      if(e.hp<=0){e.hp=0;this.kill(e);}return true;
    }
    dropGem(x,y,value) {
      if(this.room.gems.length>=120){this.collect(value);return;}
      this.room.gems.push({x,y,w:13,h:17,value,vx:(this.random()-.5)*120,vy:-150,age:0});
    }
    collect(value) { this.gems=integer(this.gems+value);this.earned=integer(this.earned+value);this.emit('gem'); }
    kill(e) {
      this.kills++;this.combo=this.elapsed<this.comboUntil?Math.min(30,this.combo+1):1;
      this.comboUntil=this.elapsed+3;this.bestCombo=Math.max(this.bestCombo,this.combo);
      const c=center(e);this.burst(c.x,c.y,e.boss?'#f0bc6b':'#c8a2c5',e.boss?28:12);this.emit('kill');
      if(this.combo>1)this.text(`${this.combo}× CHAIN`,c.x,c.y-25);
      if(!e.boss){this.dropGem(c.x,c.y,Math.max(1,Math.round((1+Math.floor(this.random()*3))*this.combo*this.greed)));
        if(this.random()<.15&&this.room.drops.length<12)this.room.drops.push({x:c.x-15,y:this.height-68,w:30,h:20,type:['smg','shotgun','rocket'][Math.floor(this.random()*3)]});}
      if(this.room.boss&&!this.room.enemies.some(other=>other.boss&&other.hp>0)&&!this.room.rewardGiven) {
        this.room.rewardGiven=true;
        const reward=({ 'fat-cat':30,general:50,twins:70 }[this.room.bossType]||30)+Math.max(0,this.room.floor-3)*10;
        this.dropGem(c.x,c.y,Math.round(reward*this.greed));
        this.room.drops.push({x:c.x,y:this.height-68,w:30,h:20,type:this.room.floor>1?'rocket':'shotgun'});
        for(const other of this.room.enemies)if(!other.boss)other.hp=0;
        this.text('GUARDIAN DOWN',this.width/2,100,'#ccea9c');this.emit('boss-win');
      }
    }
    hurt(amount=1) {
      const p=this.player;if(this.elapsed<p.invulnerable||this.phase!=='playing')return;
      p.invulnerable=this.elapsed+1;this.shake=.2;this.emit('hurt');
      if(this.shield){this.shield=false;this.text('SHIELD',p.x,p.y-24,'#8cd8d6');return;}
      p.hp=Math.max(0,p.hp-amount);p.vy=-330;p.standing=null;
      if(p.hp===0){this.phase='dying';this.deathTime=0;this.reason='No hearts left';this.emit('death');}
    }
    canBuy(key) {
      const item=ITEMS[key];if(this.phase!=='shop'||!item||this.gems<item.cost)return false;
      if(key==='heal'&&this.player.hp>=this.maxHp||key==='shield'&&this.shield||key==='bomb'&&this.buffs.bomb||key==='damage'&&this.buffs.damage>=3||key==='magnet'&&this.buffs.magnet>=5)return false;
      return true;
    }
    buy(key) {
      if(!this.canBuy(key))return false;const item=ITEMS[key];
      this.gems-=item.cost;this.spent+=item.cost;
      if(key==='heal')this.player.hp=Math.min(this.maxHp,this.player.hp+2);
      else if(key==='shield')this.shield=true;
      else if(key==='bomb')this.buffs.bomb=true;
      else this.buffs[key]=key==='damage'?3:5;
      return true;
    }
    continueShop() { if(this.phase==='shop'){this.roomNumber++;this.phase='transition';this.transition=.3;} }
    retreat() { if(this.phase==='dead')return;this.reason='Retreated with your gems';this.phase='dead'; }
    checkClear() {
      if(!this.room.cleared&&!this.room.enemies.some(e=>e.hp>0)){this.room.cleared=true;this.text('ROOM CLEAR',this.width/2,90,'#d2eea2');this.emit('clear');}
    }
    leaveRoom() {
      if(!this.room.cleared||this.phase!=='playing')return;
      for(const gem of this.room.gems)this.collect(gem.value);this.room.gems=[];
      this.buffs.damage=Math.max(0,this.buffs.damage-1);this.buffs.magnet=Math.max(0,this.buffs.magnet-1);
      if(this.roomNumber%5===0)this.phase='shop';else{this.roomNumber++;this.phase='transition';this.transition=.3;}
      this.emit('door');
    }
    physics(body,dt,drop=false) {
      const oldBottom=body.y+body.h;body.vy=Math.min(900,body.vy+2000*dt);body.x=clamp(body.x+body.vx*dt,0,this.width-body.w);body.y+=body.vy*dt;body.standing=null;
      if(body.vy>=0)for(let i=0;i<this.room.platforms.length;i++) {
        const p=this.room.platforms[i];if(i&&drop)continue;
        if(body.x+body.w>p.x&&body.x<p.x+p.w&&oldBottom<=p.y+2&&body.y+body.h>=p.y){body.y=p.y-body.h;body.vy=0;body.standing=i;body.jumps=this.maxJumps;break;}
      }
      if(body.y>this.height){body.y=this.height-48-body.h;body.vy=0;body.standing=0;}
    }
    enemyShot(e,spread=0,speed=260) {
      if(this.bullets.length>=150)return;const a=center(e),b=center(this.player),aim=Math.atan2(b.y-a.y,b.x-a.x);
      for(const offset of spread?[-spread,0,spread]:[0])this.bullets.push({x:a.x,y:a.y,w:10,h:10,vx:Math.cos(aim+offset)*speed,vy:Math.sin(aim+offset)*speed,owner:'enemy',life:3,damage:1});
    }
    summon(type,x) { if(this.room.enemies.filter(e=>e.hp>0).length>=12)return;this.room.enemies.push(this.makeEnemy({type,x,platform:0},this.kills+this.room.enemies.length+100)); }
    bomb(x,y,vx=0,vy=70) { if(this.bombs.length<18)this.bombs.push({x,y,w:18,h:18,vx,vy,life:5}); }
    enemyAI(e,dt) {
      if(e.hp<=0)return;e.age+=dt;
      const floor=this.room.floor,p=this.player,scale=1+Math.min(.9,(floor-1)*.08),enrage=e.enraged?2:1;
      e.phase=e.hp/e.maxHp<=.25?3:e.hp/e.maxHp<=.5?2:1;
      if(e.boss&&this.elapsed<this.warningUntil)return;
      if(e.type==='flyer') {
        e.x=clamp(e.x+Math.sign(p.x-e.x)*65*scale*dt,5,this.width-e.w-5);
        const y=clamp(p.y-130,60,this.height-180);e.y+=(y-e.y)*dt*1.4;
        if(this.elapsed>=e.bombAt){this.bomb(e.x+e.w/2,e.y+e.h);e.bombAt=this.elapsed+2.7;}return;
      }
      const platform=this.room.platforms[e.standing??e.platform]||this.room.platforms[0];
      if(['shooter','turret','twin-ranged','general'].includes(e.type)) {
        if(this.elapsed>=e.nextAction){this.enemyShot(e,e.type==='general'?.25:0,240*enrage);e.nextAction=this.elapsed+2/enrage;}
        if(e.type==='shooter'||e.type==='turret'){e.vx=0;return;}
      }
      if(e.type==='general') {
        if(e.phase>=2&&!e.phaseTwo){e.phaseTwo=true;this.summon('turret',this.width*.73);}
        if(e.phase===3&&!e.phaseThree){e.phaseThree=true;if(!this.room.enemies.some(t=>t.type==='turret'&&t.hp>0))this.summon('turret',this.width*.35);this.text('TURRET POWERS THE SHIELD',this.width/2,125,'#9ed8df');}
        e.vx=e.phase>=2?Math.sign(p.x-e.x)*130:Math.sin(e.age)*40;
      } else if(e.type==='fat-cat') {
        if(e.phase>=2&&!e.phaseTwo){e.phaseTwo=true;this.summon('walker',this.width*.3);this.summon('walker',this.width*.75);e.vy=-620;e.standing=null;}
        if(e.phase>=2&&this.elapsed>=e.bombAt){this.bomb(e.x+e.w/2,e.y,Math.sign(p.x-e.x)*150,-300);e.bombAt=this.elapsed+2.7;}
        if(this.elapsed>=e.nextAction){e.warning=this.elapsed+.6;e.dir=p.x>e.x?1:-1;e.actionEnd=e.warning+1.25;e.nextAction=this.elapsed+2.6;}
        e.vx=this.elapsed<e.warning?0:this.elapsed<e.actionEnd?e.dir*(e.phase===3?330:230):e.dir*40;
        if(e.x<=3||e.x+e.w>=this.width-3)e.dir*=-1;
        if(e.phase===3&&e.standing!==null&&this.elapsed>=e.slamAt){e.vy=-620;e.standing=null;e.slamPending=true;e.slamAt=this.elapsed+3.4;}
        if(e.phase===3&&!e.phaseThree){e.phaseThree=true;e.slamAt=this.elapsed+.8;}
      } else if(e.type==='charger') {
        if(this.elapsed>=e.nextAction){e.warning=this.elapsed+.65;e.dir=p.x>e.x?1:-1;e.actionEnd=e.warning+.65;e.nextAction=this.elapsed+2.4;}
        e.vx=this.elapsed<e.warning?0:this.elapsed<e.actionEnd?e.dir*300*scale:e.dir*65;
      } else {
        e.vx=e.dir*80*scale*enrage;
        if(e.type==='jumper'||e.type==='twin-melee') {
          if(this.elapsed>=e.nextAction&&e.standing!==null){e.vy=-650;e.vx=Math.sign(p.x-e.x)*170*enrage;e.dir=Math.sign(p.x-e.x)||e.dir;e.standing=null;e.nextAction=this.elapsed+1.7/enrage;}
          if(e.standing===null)e.vx=e.dir*160*enrage;
        }
      }
      if(!e.boss&&e.standing!==null&&(e.x<platform.x+4||e.x+e.w>platform.x+platform.w-4)) {
        e.dir=e.x<platform.x+4?1:-1;e.vx=Math.abs(e.vx)*e.dir;
      }
      const falling=e.vy>0;this.physics(e,dt);
      if(e.type==='fat-cat'&&e.slamPending&&falling&&e.standing===0) {
        e.slamPending=false;this.shake=.2;for(const dir of [-1,1])this.waves.push({x:e.x+e.w/2,y:this.height-62,w:28,h:14,vx:dir*260,life:2.5});this.emit('slam');
      }
      if(e.type.startsWith('twin')&&!e.enraged&&!this.room.enemies.some(t=>t!==e&&t.boss&&t.hp>0)){e.enraged=true;e.nextAction=this.elapsed+.4;this.text('LAST TWIN ENRAGED',this.width/2,125,'#ef9a86');}
    }
    explode(b) {
      this.shake=.2;this.emit('explosion');this.burst(b.x,b.y,'#f0b875',22);
      for(const e of this.room.enemies)if(e.hp>0&&distance(center(e),b)<60+e.w/2)this.hitEnemy(e,b.damage,b.origin,true);
      if(distance(center(this.player),b)<60)this.hurt(1);
    }
    update(input={},dt=1/60) {
      if(!Number.isFinite(dt)||dt<=0||['dead','shop'].includes(this.phase))return;
      dt=Math.min(.1,dt);
      if(this.phase==='dying'){this.deathTime+=dt;this.player.y+=this.player.vy*dt*.15;if(this.deathTime>=.5)this.phase='dead';return;}
      this.elapsed+=dt;
      if(this.phase==='transition'){this.transition-=dt;if(this.transition<=0)this.enterRoom();return;}
      const jump=!!input.jump&&!this.jumpHeld,swap=!!input.swap&&!this.swapHeld;
      this.jumpHeld=!!input.jump;this.swapHeld=!!input.swap;
      if(swap)this.swap();if(input.fire)this.fire();
      for(let left=dt;left>1e-7&&this.phase==='playing';){const part=Math.min(1/120,left);this.step(input,part,jump&&left===dt);left-=part;}
    }
    step(input,dt,jump) {
      const p=this.player,axis=clamp(Number(input.x)||0,-1,1),oldBottom=p.y+p.h;
      if(axis)p.face=Math.sign(axis);p.vx+=clamp(axis*this.speed-p.vx,-2200*dt,2200*dt);
      if(input.drop&&p.standing>0){p.dropUntil=this.elapsed+.2;p.standing=null;p.y+=3;p.vy=80;}
      if(jump&&p.jumps>0){p.vy=-700;p.jumps--;p.standing=null;this.emit('jump');}
      this.physics(p,dt,p.dropUntil>this.elapsed);
      for(const e of this.room.enemies)this.enemyAI(e,dt);
      for(const e of this.room.enemies)if(e.hp>0&&overlap(p,e)) {
        if(p.vy>0&&oldBottom<=e.y+14&&this.elapsed>=e.stompUntil){this.hitEnemy(e,this.damage*(this.buffs.damage>0?2:1),center(p),true);e.stompUntil=this.elapsed+.3;p.y=e.y-p.h;p.vy=-540;p.jumps=Math.max(1,this.maxJumps-1);p.standing=null;}
        else this.hurt();
      }
      for(const b of this.bullets) {
        if(b.life<=0)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
        if(b.owner==='player')for(const e of this.room.enemies)if(e.hp>0&&overlap(b,e)){if(b.rocket)this.explode(b);else this.hitEnemy(e,b.damage,b.origin);b.life=0;break;}
        if(b.owner==='enemy'&&overlap(b,p)){this.hurt();b.life=0;}
        if(b.x<0||b.x>this.width||b.y<0||b.y>this.height){if(b.rocket&&b.life>0)this.explode(b);b.life=0;}
      }
      this.bullets=this.bullets.filter(b=>b.life>0);
      for(const b of this.bombs){b.vy+=600*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(overlap(b,p)){this.hurt();b.life=0;}if(b.y>this.height-48){b.life=0;this.burst(b.x,b.y,'#e9a46e',6);}}
      this.bombs=this.bombs.filter(b=>b.life>0&&b.x>-30&&b.x<this.width+30);
      for(const wave of this.waves){wave.x+=wave.vx*dt;wave.life-=dt;if(overlap(wave,p))this.hurt();}this.waves=this.waves.filter(w=>w.life>0&&w.x>-40&&w.x<this.width+40);
      for(const gem of this.room.gems){
        gem.age+=dt;const c=center(p),g={x:gem.x,y:gem.y},d=distance(c,g),range=this.room.cleared?this.width*2:this.buffs.magnet>0?200:68;
        if(d<range&&gem.age>.12){gem.x+=(c.x-gem.x)*Math.min(1,dt*9);gem.y+=(c.y-gem.y)*Math.min(1,dt*9);}
        else{gem.vy+=550*dt;gem.x=clamp(gem.x+gem.vx*dt,4,this.width-18);gem.y=Math.min(this.height-65,gem.y+gem.vy*dt);if(gem.y>=this.height-65)gem.vy=0;}
        if(d<27){this.collect(gem.value);gem.taken=true;}
      }
      this.room.gems=this.room.gems.filter(g=>!g.taken);
      for(const particle of this.particles){particle.x+=particle.vx*dt;particle.y+=particle.vy*dt;particle.vy+=350*dt;particle.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
      for(const text of this.texts){text.life-=dt;text.y-=22*dt;}this.texts=this.texts.filter(t=>t.life>0);this.shake=Math.max(0,this.shake-dt);
      if(this.elapsed>=this.comboUntil)this.combo=0;
      this.checkClear();if(this.phase==='playing'&&this.room.cleared&&overlap(p,this.room.door))this.leaveRoom();
    }
  }
  return {Profile,Run,UPGRADES,WEAPONS,ITEMS,THEMES,generateRoom,enemyTypes,floorFor,themeFor,overlap,random};
});
