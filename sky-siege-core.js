/* Sky Siege's seeded world, platform physics, defenses and durable progression. No DOM. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkySiege=api;})(globalThis,()=>{
  'use strict';
  const RULES=Object.freeze({width:480,layerHeight:80,gravity:1800,jump:620,speed:260,ratW:30,ratH:40,catchRadius:28,waveInterval:5,maxCats:96});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const integer=(n,max=1e12)=>typeof n==='number'&&Number.isFinite(n)?clamp(Math.floor(n),0,max):0;
  function random(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};}
  const TRAPS=Object.freeze({butter:{name:'Butter Trap',cost:5,mark:'B',color:'#eed06e',description:'One slip knocks a Cat down two layers. A Tank survives its first hit.'},magnet:{name:'Magnet Mine',cost:10,mark:'M',color:'#e99788',description:'Pulls one Cat within 60px, reveals it and stuns it for three seconds before a hit.'},firecracker:{name:'Firecracker',cost:15,mark:'F',color:'#f4a363',description:'A two-second fuse, then an 80px blast. Knocks survivors down three layers.'},dogGuard:{name:'Dog Guard',cost:25,mark:'D',color:'#a8ccba',description:'Guards for 20 seconds or three punches. Barks every five seconds to reveal Ninjas.'}});
  const CAT_TYPES=Object.freeze({walker:{name:'Walker',speed:50,hp:1,jumpLayers:1,value:1},jumper:{name:'Jumper',speed:70,hp:1,jumpLayers:2,value:2},tank:{name:'Tank',speed:35,hp:2,jumpLayers:1,value:3},ninja:{name:'Ninja',speed:80,hp:1,jumpLayers:1,value:2}});
  const UPGRADES=Object.freeze({extra_jump:{name:'Extra leap',mark:'↑',costs:[30,80],description:'Add a third jump, then a fourth jump.'},climb_speed:{name:'Quick paws',mark:'»',costs:[25,60,120],description:'+15% horizontal movement speed per level.'},trap_discount:{name:'Bargain builder',mark:'⚙',costs:[40,90,160],description:'Traps cost 1, then 2, then 3 less cheese.'},blast_radius:{name:'Bigger bang',mark:'✹',costs:[50,110],description:'+30% Firecracker radius per level.'},dog_duration:{name:'Good boy',mark:'D',costs:[60,130],description:'+10 seconds of Dog Guard time per level.'},cheese_magnet:{name:'Cheese nose',mark:'◆',costs:[35,75,140],description:'+40% cheese collection range per level.'},starting_cheese:{name:'Packed lunch',mark:'C',costs:[20,50,100,180],description:'Start with 5 trap-only cheese per level. Starter cheese cannot be banked.'}});
  const MILESTONES=Object.freeze({25:{name:'First Tower',reward:15},50:{name:'Halfway to the Sky',reward:25},75:{name:'Cloud Puncher',reward:40},100:{name:'Sky Legend',reward:60},150:{name:'Beyond the Stars',reward:100}});
  const THEMES=['kitchen','garden','rooftop','sewer','inferno'];
  const levels=raw=>Object.fromEntries(Object.entries(UPGRADES).map(([k,v])=>[k,integer(raw?.[k],v.costs.length)]));
  function generateLayer(index,seed=1){
    const rng=typeof seed==='function'?seed:random((seed^Math.imul(index+1,0x45d9f3b))>>>0),y=-index*80;
    if(index===0)return{index,y,platforms:[{id:'0:0',layer:0,x:16,y:0,w:448,h:20,trap:null,cheese:{collected:false,value:1,x:240,y:-17}}]};
    const count=2+(rng()<.3?1:0),slot=480/count,platforms=[];
    for(let i=0;i<count;i++){const w=Math.min(slot-18,90+rng()*90),x=clamp(i*slot+(slot-w)/2+(rng()-.5)*30,i*slot+4,(i+1)*slot-w-4);platforms.push({id:index+':'+i,layer:index,x,y,w,h:16,trap:null,cheese:null});}
    const first=Math.floor(rng()*count);platforms[first].cheese={x:platforms[first].x+platforms[first].w/2,y:y-17,value:1,collected:false};
    if(rng()<.2){const p=platforms[(first+1)%count];p.cheese={x:p.x+p.w/2,y:y-17,value:2,collected:false};}
    return{index,y,platforms};
  }
  function waveComposition(wave,rng=random(wave)){const types=['walker',...(wave>=3?['jumper']:[]),...(wave>=5?['tank']:[]),...(wave>=8?['ninja']:[])];return Array.from({length:Math.min(8,2+Math.floor(wave/3))},()=>types[Math.floor(rng()*types.length)]);}
  function safeStats(raw){if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id)return null;const cheese=integer(raw.cheese,1e8),earned=integer(raw.earned,1e8),height=integer(raw.height,1e6);return{id:raw.id.slice(0,100),cheese,earned,bankable:Math.min(cheese,earned),height,score:integer(height*earned),kills:integer(raw.kills),traps:integer(raw.traps),time:integer(raw.time,1e9),reason:String(raw.reason||'Interrupted run').slice(0,100)};}
  class Profile{
    constructor(raw={}){this.version=1;this.cheese=integer(raw?.cheese);this.bestScore=integer(raw?.bestScore);this.bestHeight=integer(raw?.bestHeight,1e6);this.totalRuns=integer(raw?.totalRuns);this.totalCatsDefeated=integer(raw?.totalCatsDefeated);this.totalTrapsPlaced=integer(raw?.totalTrapsPlaced);this.upgrades=levels(raw?.upgrades);this.milestones=Array.isArray(raw?.milestones)?[...new Set(raw.milestones.filter(n=>Number.isInteger(n)&&MILESTONES[n]))]:[];this.active=safeStats(raw?.active);this.last=safeStats(raw?.last);}
    buy(key){if(!Object.hasOwn(UPGRADES,key))return false;const u=UPGRADES[key],cost=u?.costs[this.upgrades[key]];if(this.active||!u||cost===undefined||this.cheese<cost)return false;this.cheese-=cost;this.upgrades[key]++;return true;}
    begin(id){if(this.active)this.recover();this.totalRuns++;this.active=safeStats({id,height:0,cheese:0});}
    checkpoint(run){if(!this.active||this.active.id!==run.id)return false;const stats=safeStats(run.stats());if(!stats)return false;this.totalCatsDefeated+=Math.max(0,stats.kills-this.active.kills);this.totalTrapsPlaced+=Math.max(0,stats.traps-this.active.traps);this.bestHeight=Math.max(this.bestHeight,stats.height);this.bestScore=Math.max(this.bestScore,stats.score);for(const [layer,award]of Object.entries(MILESTONES))if(stats.height>=+layer&&!this.milestones.includes(+layer)){this.milestones.push(+layer);this.cheese+=award.reward;}this.active=stats;return true;}
    bank(run){if(!this.checkpoint(run))return false;this.cheese=integer(this.cheese+this.active.bankable);this.last={...this.active};this.active=null;return true;}
    recover(){if(!this.active)return false;this.cheese=integer(this.cheese+this.active.bankable);this.last={...this.active,reason:'Interrupted run · saved cheese recovered'};this.active=null;return true;}
  }
  class Run{
    constructor({seed=Date.now(),id=String(seed),upgrades={},viewHeight=600}={}){
      this.seed=seed>>>0;this.id=String(id);this.rng=random(this.seed^0x7823ab);this.upgrades=levels(upgrades);this.viewHeight=clamp(viewHeight,320,760);this.layers=[];this.generated=-1;this.lowestKept=0;this.cats=[];this.pending=[];this.waves=[];this.effects=[];this.events=[];this.serial=0;this.elapsed=0;this.phase='playing';this.caughtTime=0;this.highestLayer=0;this.waveNumber=0;this.kills=0;this.trapsPlaced=0;this.startingCheese=this.upgrades.starting_cheese*5;this.cheese=this.startingCheese;this.totalCheese=0;this.spent=0;this.selectedTrap=0;this.maxJumps=2+this.upgrades.extra_jump;this.speed=260*(1+.15*this.upgrades.climb_speed);this.collectRange=30*(1+.4*this.upgrades.cheese_magnet);this.blastRadius=80*(1+.3*this.upgrades.blast_radius);this.cameraY=80-this.viewHeight;this.reason='';this.message='Collect cheese. Leave defenses below. Keep climbing.';this.jumpHeld=false;this.nextPlace=0;this.player={x:240,y:0,vx:0,vy:0,w:30,h:40,face:1,grounded:true,standing:'0:0',jumpsRemaining:this.maxJumps,wallSliding:false};this.manageLayers();
    }
    get score(){return integer(this.highestLayer*this.totalCheese);}
    get theme(){return THEMES[Math.floor(this.highestLayer/25)%5];}
    get platforms(){return this.layers.flatMap(l=>l.platforms);}
    platform(id){return this.layers.find(l=>l.index===Number(String(id).split(':')[0]))?.platforms.find(p=>p.id===id);}
    layer(index){return this.layers.find(l=>l.index===index);}
    emit(type,x=this.player.x,y=this.player.y,extra={}){if(this.events.length<60)this.events.push({type,x,y,...extra});}
    fx(type,x,y,extra={}){if(this.effects.length<160)this.effects.push({type,x,y,age:0,life:type==='defeat'?1.3:.7,...extra});}
    addCheese(amount){amount=integer(amount,1000000);this.cheese+=amount;this.totalCheese+=amount;}
    cost(type){return Math.max(1,(TRAPS[type]?.cost||0)-this.upgrades.trap_discount);}
    place(type=Object.keys(TRAPS)[this.selectedTrap]){const p=this.platform(this.player.standing);if(this.phase!=='playing'||!this.player.grounded||!p){this.message='Land on a shelf before placing a defense.';return false;}if(!Object.hasOwn(TRAPS,type)||p.trap||this.elapsed<this.nextPlace){this.message=p.trap?'This shelf already has a defense.':'Give those paws a moment.';return false;}const cost=this.cost(type);if(this.cheese<cost){this.message='Need '+cost+' cheese for '+TRAPS[type].name+'.';this.emit('empty');return false;}this.cheese-=cost;this.spent+=cost;this.trapsPlaced++;this.nextPlace=this.elapsed+.2;p.trap={type,x:clamp(this.player.x,p.x+15,p.x+p.w-15),y:p.y,placed:this.elapsed,state:'ready',ends:0,cat:null,uses:3,barkAt:this.elapsed+5,punchAt:0,expires:this.elapsed+20+this.upgrades.dog_duration*10};this.emit('place',p.trap.x,p.y);this.message=TRAPS[type].name+' ready. Climb and let the Cats come to it.';return true;}
    manageLayers(){const top=Math.max(0,Math.floor(-this.cameraY/80)),max=Math.max(this.highestLayer+8,top+8);while(this.generated<max){this.generated++;this.layers.push(generateLayer(this.generated,this.seed));}this.lowestKept=Math.max(1,top-15);this.layers=this.layers.filter(l=>l.index===0||l.index>=this.lowestKept);for(const cat of this.cats)if(!cat.dead&&this.lowestKept>1&&cat.layer<this.lowestKept&&(cat.travel?.layer??cat.layer)<this.lowestKept)this.retire(cat);this.cats=this.cats.filter(c=>!c.dead);}
    setViewHeight(height){height=clamp(height,320,760);if(height!==this.viewHeight){const footScreen=this.player.y-this.cameraY;this.viewHeight=height;this.cameraY=this.player.y-clamp(footScreen,height*.35,height*.85);this.manageLayers();}}
    reach(height){height=integer(height,1e6);if(height<=this.highestLayer)return;const before=this.highestLayer;this.highestLayer=height;const bonuses=Math.floor(height/25)-Math.floor(before/25);if(bonuses){this.addCheese(bonuses*10);this.emit('milestone');this.message='LAYER '+Math.floor(height/25)*25+' · +10 milestone cheese';}const target=Math.floor(height/5);while(this.waveNumber<target&&this.pending.length<12){const n=++this.waveNumber;this.pending.push({number:n,at:this.elapsed+2,types:waveComposition(n,this.rng)});this.emit('wave',this.player.x,this.player.y,{number:n});}}
    spawnWave(pending){const base=this.layer(Math.max(this.lowestKept,this.highestLayer-10))||this.layer(0),record={number:pending.number,count:pending.types.length,remaining:pending.types.length,kills:0,outpaced:0,paid:false};this.waves.push(record);for(const [i,type]of pending.types.entries()){if(this.cats.length>=RULES.maxCats)this.retire(this.cats.find(c=>!c.dead));const p=base.platforms[i%base.platforms.length];this.cats.push({id:++this.serial,type,hp:CAT_TYPES[type].hp,wave:record.number,layer:p.layer,platform:p.id,x:p.x+p.w*(.3+.4*((i%3)/2)),y:p.y,state:'waiting',waitUntil:this.elapsed+.3+i*.15,travel:null,stunUntil:0,revealedUntil:0,dead:false,angle:0});}this.cats=this.cats.filter(c=>!c.dead);}
    retire(cat){if(!cat||cat.dead)return;cat.dead=true;const wave=this.waves.find(w=>w.number===cat.wave);if(wave){wave.remaining--;wave.outpaced++;}}
    defeat(cat,kind){if(cat.dead)return;cat.dead=true;this.kills++;this.addCheese(CAT_TYPES[cat.type].value);this.fx('defeat',cat.x,cat.y,{catType:cat.type,vx:cat.x<240?-65:65});this.emit(kind,cat.x,cat.y);const wave=this.waves.find(w=>w.number===cat.wave);if(wave){wave.remaining--;wave.kills++;if(wave.remaining===0&&wave.outpaced===0&&!wave.paid){wave.paid=true;this.addCheese(5*wave.number);this.emit('wave-clear');this.message='WAVE '+wave.number+' CLEARED · +'+5*wave.number+' cheese';}}}
    knockDown(cat,layers){const target=this.layer(Math.max(0,cat.layer-layers));if(!target){this.retire(cat);return;}const p=target.platforms.reduce((best,p)=>Math.abs(p.x+p.w/2-cat.x)<Math.abs(best.x+best.w/2-cat.x)?p:best,target.platforms[0]);cat.travel={from:{x:cat.x,y:cat.y},to:{x:clamp(cat.x,p.x+12,p.x+p.w-12),y:p.y},progress:0,duration:.65,fall:true,platform:p.id,layer:p.layer};cat.state='falling';cat.revealedUntil=this.elapsed+3;}
    hit(cat,kind,drop=2){if(!cat||cat.dead)return;cat.hp--;cat.revealedUntil=this.elapsed+3;if(cat.hp<=0)this.defeat(cat,kind);else{this.knockDown(cat,drop);this.emit(kind,cat.x,cat.y);}}
    trigger(platform,cat){const trap=platform.trap;if(!trap||trap.state!=='ready'||cat.dead)return;
      if(trap.type==='butter'){platform.trap=null;this.hit(cat,'butter',2);}
      else if(trap.type==='magnet'){trap.state='holding';trap.cat=cat.id;trap.ends=this.elapsed+3;cat.travel=null;cat.x=trap.x;cat.y=platform.y;cat.layer=platform.layer;cat.platform=platform.id;cat.state='stunned';cat.stunUntil=trap.ends;cat.revealedUntil=trap.ends+2;this.emit('magnet',trap.x,trap.y);}
      else if(trap.type==='firecracker'){trap.state='fuse';trap.ends=this.elapsed+2;cat.state='fuse';cat.travel=null;cat.waitUntil=trap.ends+.05;this.emit('firecracker-fuse',trap.x,trap.y);}
      else if(trap.type==='dogGuard'&&this.elapsed>=trap.punchAt){trap.punchAt=this.elapsed+.6;trap.punchUntil=this.elapsed+.2;trap.uses--;this.hit(cat,'dog-punch',2);if(trap.uses<=0)platform.trap=null;}
    }
    updateTraps(){for(const platform of this.platforms){const t=platform.trap;if(!t)continue;
      if(t.type==='magnet'&&t.state==='ready'){const cat=this.cats.find(c=>!c.dead&&c.state!=='falling'&&Math.hypot(c.x-t.x,c.y-t.y)<60);if(cat)this.trigger(platform,cat);}
      if(t.type==='magnet'&&t.state==='holding'&&this.elapsed>=t.ends){const cat=this.cats.find(c=>c.id===t.cat);platform.trap=null;if(cat&&!cat.dead)this.hit(cat,'magnet',2);}
      if(t.type==='firecracker'&&t.state==='fuse'&&this.elapsed>=t.ends){platform.trap=null;this.fx('blast',t.x,t.y,{radius:this.blastRadius});this.emit('firecracker-boom',t.x,t.y);for(const cat of this.cats)if(!cat.dead&&Math.hypot(cat.x-t.x,cat.y-t.y)<this.blastRadius+12)this.hit(cat,'blast-hit',3);}
      if(t.type==='dogGuard'){if(this.elapsed>=t.expires){platform.trap=null;continue;}if(this.elapsed>=t.barkAt){t.barkAt=this.elapsed+5;t.barkUntil=this.elapsed+.5;this.emit('dog-bark',t.x,t.y);for(const cat of this.cats)if(Math.hypot(cat.x-t.x,cat.y-t.y)<120)cat.revealedUntil=this.elapsed+5;}if(this.elapsed>=t.punchAt){const cat=this.cats.find(c=>!c.dead&&!['falling','stunned'].includes(c.state)&&Math.abs(c.y-t.y)<28&&c.x>=platform.x-12&&c.x<=platform.x+platform.w+12);if(cat)this.trigger(platform,cat);}}
    }}
    catVisible(cat){return cat.type!=='ninja'||Math.abs(cat.layer-Math.floor(-this.player.y/80))<=1||cat.revealedUntil>this.elapsed;}
    updateCats(dt){for(const cat of this.cats){if(cat.dead)continue;if(cat.state==='stunned'&&this.elapsed<=cat.stunUntil)continue;
      if(cat.travel){const t=cat.travel;t.progress=Math.min(1,t.progress+dt/t.duration);const n=t.progress;cat.x=t.from.x+(t.to.x-t.from.x)*n;cat.y=t.from.y+(t.to.y-t.from.y)*n-(t.fall?0:Math.sin(n*Math.PI)*30);cat.angle=t.fall?n*8:0;if(n>=1){cat.layer=t.layer;cat.platform=t.platform;cat.travel=null;cat.state='waiting';cat.waitUntil=this.elapsed+.15;const p=this.platform(cat.platform);if(p)this.trigger(p,cat);}continue;}
      if(cat.state==='fuse'&&this.elapsed<cat.waitUntil)continue;if(this.elapsed<cat.waitUntil)continue;
      const def=CAT_TYPES[cat.type],next=this.layer(cat.layer+def.jumpLayers);if(!next)continue;
      const p=next.platforms.reduce((best,p)=>{const cost=p=>Math.abs(p.x+p.w/2-cat.x)+Math.abs(p.x+p.w/2-this.player.x)*.22;return cost(p)<cost(best)?p:best;},next.platforms[0]);
      const speed=def.speed*(1+Math.min(1.2,cat.wave*.025))*(cat.type==='ninja'&&this.catVisible(cat)?1.2:1);cat.state='climbing';cat.travel={from:{x:cat.x,y:cat.y},to:{x:p.x+p.w/2,y:p.y},progress:0,duration:Math.max(.35,(cat.layer+def.jumpLayers-cat.layer)*80/speed),fall:false,platform:p.id,layer:p.layer};
    }}
    catch(reason='The Cats reached your shelf.') {if(this.phase!=='playing')return;this.phase='caught';this.reason=reason;this.caughtTime=0;this.emit('caught');}
    retreat(){if(this.phase!=='playing')return false;this.phase='dead';this.reason='Retreated with saved cheese';return true;}
    update(input={},dt=1/60){if(!Number.isFinite(dt)||dt<=0||this.phase==='dead')return;if(this.phase==='caught'){this.caughtTime+=Math.min(.1,dt);if(this.caughtTime>=1.5)this.phase='dead';return;}
      if(input.cycle)this.selectedTrap=(this.selectedTrap+1)%4;if(input.place)this.place();const jump=!!input.jump&&!this.jumpHeld;this.jumpHeld=!!input.jump;
      let first=true;for(let left=Math.min(.1,dt);left>1e-8&&this.phase==='playing';){const step=Math.min(1/120,left);this.tick(input,step,first&&jump);first=false;left-=step;}
    }
    tick(input,dt,jump){
      this.elapsed+=dt;const p=this.player,oldY=p.y,wasGrounded=p.grounded,axis=clamp(Number(input.x)||0,-1,1);if(axis)p.face=Math.sign(axis);p.vx+=clamp(axis*this.speed-p.vx,-2100*dt,2100*dt);
      if(jump&&p.jumpsRemaining>0){p.vy=-620;p.jumpsRemaining--;p.grounded=false;p.standing=null;this.emit('jump');}
      p.vy=Math.min(1000,p.vy+1800*dt);p.wallSliding=p.vy>60&&(p.x<=15.1&&axis<0||p.x>=464.9&&axis>0);if(p.wallSliding)p.vy=60;p.x=clamp(p.x+p.vx*dt,15,465);p.y+=p.vy*dt;p.grounded=false;p.standing=null;
      if(p.vy>=0){let hit=null;for(const platform of this.platforms)if(oldY<=platform.y+.1&&p.y>=platform.y&&p.x+15>platform.x&&p.x-15<platform.x+platform.w&&(!hit||platform.y<hit.y))hit=platform;if(hit){p.y=hit.y;p.vy=0;p.grounded=true;p.standing=hit.id;p.jumpsRemaining=this.maxJumps;if(!wasGrounded)this.emit('land',p.x,p.y);}}
      for(const platform of this.platforms){const c=platform.cheese;if(c&&!c.collected&&Math.hypot(p.x-c.x,p.y-20-c.y)<this.collectRange){c.collected=true;this.addCheese(c.value);this.fx('collect',c.x,c.y);this.emit('collect',c.x,c.y);}}
      this.reach(Math.max(0,Math.floor(-p.y/80)));const target=p.y-this.viewHeight*.62;this.cameraY=Math.min(this.cameraY,this.cameraY+(target-this.cameraY)*Math.min(1,dt*6));this.manageLayers();
      for(const pending of this.pending.filter(w=>w.at<=this.elapsed))this.spawnWave(pending);this.pending=this.pending.filter(w=>w.at>this.elapsed);
      this.updateCats(dt);this.updateTraps();for(const cat of this.cats)if(!cat.dead&&!['falling','stunned'].includes(cat.state)&&Math.hypot(cat.x-p.x,cat.y-12-(p.y-20))<28){this.catch();break;}
      this.cats=this.cats.filter(c=>!c.dead);this.waves=this.waves.filter(w=>w.remaining>0||w.number>=this.waveNumber-8);
      for(const effect of this.effects){effect.age+=dt;if(effect.type==='defeat'){effect.x+=(effect.vx||0)*dt;effect.y+=effect.age*180*dt;}}this.effects=this.effects.filter(e=>e.age<e.life);
      if(p.y>this.cameraY+this.viewHeight+100)this.catch('You fell below your defenses.');
    }
    stats(){return{id:this.id,cheese:integer(this.cheese),earned:integer(this.totalCheese),bankable:Math.min(integer(this.cheese),integer(this.totalCheese)),height:this.highestLayer,score:this.score,kills:this.kills,traps:this.trapsPlaced,time:Math.floor(this.elapsed),reason:this.reason};}
  }
  return{RULES,TRAPS,CAT_TYPES,UPGRADES,MILESTONES,THEMES,Profile,Run,generateLayer,waveComposition,random,clamp,integer};
});
