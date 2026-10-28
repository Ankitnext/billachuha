/* Moving Stairs: deterministic board rules and platform physics, without DOM dependencies. */
((root,factory)=>{const core=factory();if(typeof module==='object'&&module.exports)module.exports=core;else root.StairsGame=core;})(globalThis,()=>{
  'use strict';
  const SNAKES=Object.freeze({16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78});
  const LADDERS=Object.freeze({4:14,9:31,20:38,28:84,40:59,51:67,63:81,71:91});
  const POWERS=Object.freeze({7:'shield',22:'double',35:'speed',58:'shield',69:'double',83:'speed'});
  const BOSSES=Object.freeze([25,50,75,90]);
  const ROLES=Object.freeze(['rat','cat','dog']);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function random(seed){let state=seed>>>0;return()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};}
  function cellPoint(cell,size=1){const row=Math.floor((clamp(cell,1,100)-1)/10),offset=(cell-1)%10;return{x:((row%2?9-offset:offset)+.5)*size,y:(9-row+.5)*size};}
  function theme(cell){return cell<=25?'garden':cell<=50?'house':cell<=75?'night':'volcano';}

  class Race {
    constructor({mode='solo',players=[{name:'Player 1',role:'rat'}],seed=Date.now()}={}){
      if(!['solo','local'].includes(mode)||!Array.isArray(players)||players.length<(mode==='local'?2:1)||players.length>(mode==='solo'?1:4))throw Error('Choose solo or 2–4 local players.');
      this.mode=mode;this.seed=seed>>>0;this.random=random(this.seed);this.players=players.map((p,i)=>{
        if(!ROLES.includes(p.role))throw Error('Choose Rat, Cat or Dog.');
        return{name:String(p.name||`Player ${i+1}`).trim().slice(0,24)||`Player ${i+1}`,role:p.role,cell:1,coins:0,kills:0,turns:0,powers:{shield:0,double:0,speed:0},snakeSaved:false,rerolled:false,skipNext:false};
      });
      this.current=0;this.phase='board';this.elapsed=0;this.limit=600;this.turns=0;this.dice=0;this.turn=null;this.stage=null;this.queued=null;this.result=null;this.winner=null;this.message='Roll a die. Play your way to cell 100.';
    }
    get player(){return this.players[this.current];}
    tick(dt){if(this.phase==='finished'||!Number.isFinite(dt)||dt<=0)return;this.elapsed+=dt;if(this.mode==='solo'&&this.elapsed>=this.limit){this.elapsed=this.limit;this.finish(null,'The adventure clock ran out.');}}
    score(player=this.player){return clamp(Math.floor(player.cell*10+player.coins*25+player.kills*100+(this.winner!==null&&this.players[this.winner]===player?5000+Math.max(0,this.limit-this.elapsed)*10:0)),0,1000000);}
    roll(value,reroll=false){
      if(!Number.isInteger(value)||value<1||value>6)throw Error('A die must show 1–6.');
      const p=this.player;
      if(reroll){if(this.phase!=='rolled'||p.role!=='dog'||p.rerolled)throw Error('Dog has one reroll per game.');p.rerolled=true;}
      else{
        if(this.phase!=='board')throw Error('Finish the current turn first.');
        this.turn={origin:p.cell,powers:{...p.powers},shieldUsed:false};
        for(const key of Object.keys(p.powers))p.powers[key]=Math.max(0,p.powers[key]-1);
        p.turns++;this.turns++;
      }
      this.dice=value;this.turn.steps=Math.min(100-this.turn.origin,value+(p.role==='rat'?1:0));this.turn.target=this.turn.origin+this.turn.steps;
      this.phase='rolled';this.message=`${p.name}: ${value}${p.role==='rat'?' + 1 Rat bonus':''} → cell ${this.turn.target}.`;
      return this.turn.steps;
    }
    startStage(){
      if(this.phase!=='rolled'&&!(this.phase==='result'&&this.queued))throw Error('Roll before entering a stage.');
      const action=this.phase==='rolled'?{kind:'move',from:this.turn.origin,to:this.turn.target}:this.queued;
      this.queued=null;this.action=action;this.phase='action';
      this.stage=new Stage(action.kind,{cell:this.player.cell,steps:this.turn.steps,role:this.player.role,powers:this.turn.powers,shieldAvailable:!this.turn.shieldUsed,seed:Math.floor(this.random()*4294967296)});
      return this.stage;
    }
    complete(outcome){
      if(this.phase!=='action')throw Error('There is no action stage to resolve.');
      const p=this.player,action=this.action,coins=clamp(Math.floor(outcome.coins||0),0,200),kills=clamp(Math.floor(outcome.kills||0),0,20);
      p.coins+=coins;p.kills+=kills;this.turn.shieldUsed||=!!outcome.shieldUsed;this.stage=null;
      let title='',detail='',queued=null;
      if(action.kind==='move'){
        if(!outcome.success){p.cell=this.turn.origin;title='A little setback.';detail=`Stay on cell ${p.cell}. Keep your collected coins and try on your next turn.`;}
        else{
          p.cell=action.to;title=`Cell ${p.cell} reached!`;detail=`${coins} coins collected. Your next roll is waiting.`;
          if(p.cell===100){this.finish(this.current);return;}
          if(SNAKES[p.cell]){
            if(p.role==='cat'&&!p.snakeSaved){p.snakeSaved=true;title='Cat lands on its feet!';detail=`Your one-time snake immunity keeps you on cell ${p.cell}.`;}
            else{queued={kind:'snake',from:p.cell,to:SNAKES[p.cell]};title='Watch the snake!';detail=`Fall toward cell ${queued.to}. Every coin you catch saves one cell of the drop.`;}
          }else if(LADDERS[p.cell]){queued={kind:'ladder',from:p.cell,to:LADDERS[p.cell]};title='A ladder to the next level.';detail=`Climb the moving stairs to cell ${queued.to}. If you fall, stay on ${p.cell}.`;}
          else if(POWERS[p.cell]){const key=POWERS[p.cell];p.powers[key]=3;title='A little extra power.';detail=`${{shield:'Shield',double:'Double jump',speed:'Speed boost'}[key]} is ready for your next three turns.`;}
          else if(BOSSES.includes(p.cell)){queued={kind:'boss',from:p.cell,to:Math.min(100,p.cell+4)};title='Someone is guarding this cell.';detail='Stomp the guardian, or use Dog’s shots. Win four bonus cells; a loss skips your next turn.';}
        }
      }else if(action.kind==='ladder'){
        if(outcome.success)p.cell=action.to;
        title=outcome.success?'A step above the rest.':'That ladder can wait.';detail=outcome.success?`You climbed from ${action.from} to ${p.cell}.`:`Stay at the ladder’s foot on cell ${p.cell}.`;
      }else if(action.kind==='snake'){
        p.cell=outcome.success?Math.min(action.from-1,action.to+coins):action.to;
        title=outcome.success?'Make the most of the fall.':'A rough landing.';detail=`Land on cell ${p.cell}${outcome.success&&coins?` — your coins saved ${p.cell-action.to} cells`:''}. Collected coins are yours to keep.`;
      }else if(action.kind==='boss'){
        if(outcome.success){p.cell=action.to;title='Guardian defeated!';detail=`Four bonus cells take you to ${p.cell}.`;}
        else{p.skipNext=true;title='The guardian wins this time.';detail=this.mode==='solo'?'Your skipped turn costs eight seconds.':'You will sit out your next turn.';}
      }
      this.phase='result';this.queued=queued;this.result={title,detail,kind:action.kind,success:!!outcome.success,coins,kills};
    }
    next(){
      if(this.phase!=='result')throw Error('Finish the stage first.');
      if(this.queued)return this.startStage();
      const skipped=[];this.current=(this.current+1)%this.players.length;
      for(let i=0;i<this.players.length&&this.player.skipNext;i++){
        this.player.skipNext=false;skipped.push(this.player.name);if(this.mode==='solo')this.tick(8);
        if(this.phase==='finished')return null;
        this.current=(this.current+1)%this.players.length;
      }
      this.phase='board';this.turn=null;this.result=null;this.dice=0;
      this.message=skipped.length?`${skipped.join(', ')} skipped a turn. ${this.player.name}, roll next.`:`${this.player.name}, you’re up. Roll when ready.`;
      return null;
    }
    finish(winner,reason=''){
      this.winner=winner;this.phase='finished';this.stage=null;this.queued=null;
      this.result={title:winner===null?'Time for another adventure.':`${this.players[winner].name} reached 100!`,detail:reason||'Every roll. Every leap. All the way to the top.'};
    }
  }

  class Stage {
    constructor(kind,{cell=1,steps=1,role='rat',powers={},shieldAvailable=true,seed=1}={}){
      if(!['move','ladder','snake','boss'].includes(kind)||!ROLES.includes(role))throw Error('Invalid action stage.');
      this.kind=kind;this.cell=cell;this.role=role;this.steps=clamp(steps,1,7);this.random=random(seed);this.theme=theme(cell);
      this.width=kind==='move'?540+this.steps*210:kind==='boss'?900:620;this.height=kind==='ladder'?1460:kind==='snake'?1500:650;
      this.timeLimit=kind==='move'?20+this.steps*4:kind==='ladder'?42:kind==='snake'?18:45;
      this.elapsed=0;this.coins=0;this.kills=0;this.done=false;this.outcome=null;this.platforms=[];this.pickups=[];this.enemies=[];this.bombs=[];this.bullets=[];this.hazards=[];
      this.maxJumps=role==='rat'||powers.double>0?2:1;this.speed=role==='cat'?285:260;this.speed*=powers.speed>0?1.22:1;
      this.shield=powers.shield>0&&shieldAvailable;this.shieldUsed=false;this.jumpHeld=false;this.nextShot=0;this.nextPower=0;this.boostUntil=0;this.bombAt=2.5;this.bestY=this.height;
      this.makeWorld();const floor=this.platforms[0];
      this.player={x:kind==='move'||kind==='boss'?80:290,y:kind==='snake'?60:floor.y-44,w:30,h:44,vx:0,vy:kind==='snake'?140:0,hp:3,jumps:this.maxJumps,face:1,invulnerable:0,standing:kind==='snake'?null:0};
      this.bestY=this.player.y;
    }
    platform(x,y,w,ampX=0,ampY=0){const p={x,y,w,h:18,baseX:x,baseY:y,ampX,ampY,phase:this.random()*6.28,rate:.7+this.random()*.4};p.x+=Math.sin(p.phase)*ampX;p.y+=Math.sin(p.phase)*ampY;p.oldX=p.x;p.oldY=p.y;this.platforms.push(p);return this.platforms.length-1;}
    coin(platform,offset,y=-34){this.pickups.push({platform,offset,dy:y,x:0,y:0,w:22,h:22,taken:false});}
    enemy(platform,offset,boss=false){this.enemies.push({platform,offset,x:0,y:0,w:boss?54:32,h:boss?52:32,hp:boss?3+Math.floor(this.cell/35):1,maxHp:boss?3+Math.floor(this.cell/35):1,dir:this.random()<.5?-1:1,speed:boss?70:42+this.cell*.3,boss,hitUntil:0});}
    makeWorld(){
      if(this.kind==='move'){
        this.platform(0,540,220);
        for(let i=0;i<this.steps;i++){
          const index=this.platform(270+i*210,500+(i%3===1?-35:i%3===2?20:0),150,i%2?0:18,i%2?12:0);
          this.coin(index,42);this.coin(index,84,-70);
          if(i%2===1||this.steps===1)this.enemy(index,90);
        }
        const end=270+this.steps*210;this.platform(end,540,270);this.goal={x:end+155,y:470,w:40,h:70};
      }else if(this.kind==='ladder'){
        this.platform(0,this.height-60,this.width);
        for(let i=0;i<12;i++){
          const index=this.platform(i%2?320:140,this.height-160-i*100,160,12,5);this.coin(index,70);
          if(i===4||i===8)this.enemy(index,90);
        }
        this.platform(190,80,260);this.goal={x:300,y:12,w:40,h:68};
      }else if(this.kind==='snake'){
        this.platform(0,this.height-50,this.width);
        for(let row=0;row<6;row++)for(const x of [130,290,450])this.pickups.push({x,y:220+row*205,w:22,h:22,taken:false});
        for(let i=0;i<6;i++)this.hazards.push({x:i%3===0?0:i%3===1?400:230,y:350+i*175,w:i%3===2?160:220,h:18});
        this.goal={x:0,y:this.height-60,w:this.width,h:60};
      }else{
        this.platform(0,540,this.width);this.platform(190,410,160);this.platform(550,410,160);this.enemy(0,520,true);
        for(const index of [1,2]){this.coin(index,55);this.coin(index,100);}
      }
      this.positionEntities(0);
    }
    positionEntities(dt){
      for(const coin of this.pickups)if(coin.platform!==undefined){const p=this.platforms[coin.platform];coin.x=p.x+coin.offset;coin.y=p.y+coin.dy;}
      for(const e of this.enemies){
        if(e.hp<=0)continue;const p=this.platforms[e.platform],lo=e.boss?400:8,hi=e.boss?740:p.w-e.w-8;
        e.offset+=e.dir*e.speed*dt;if(e.offset<lo){e.offset=lo;e.dir=1;}if(e.offset>hi){e.offset=hi;e.dir=-1;}
        e.x=p.x+e.offset;e.y=p.y-e.h;
      }
    }
    finish(success,reason){if(this.done)return;this.done=true;this.outcome={success,reason,coins:this.coins,kills:this.kills,shieldUsed:this.shieldUsed};}
    damage(){
      const p=this.player;if(this.elapsed<p.invulnerable)return;
      p.invulnerable=this.elapsed+1.1;
      if(this.shield){this.shield=false;this.shieldUsed=true;return;}
      p.hp--;p.vy=this.kind==='snake'?140:-330;p.standing=null;if(p.hp<=0)this.finish(false,'No hearts left.');
    }
    hitEnemy(e){
      if(e.hp<=0||this.elapsed<e.hitUntil)return;e.hp--;e.hitUntil=this.elapsed+.25;
      if(e.hp<=0){this.kills++;this.coins+=e.boss?5:1;if(e.boss)this.finish(true,'Guardian defeated.');}
    }
    update(input={},dt=1/60){
      if(this.done||!Number.isFinite(dt)||dt<=0)return;
      let jump=!!input.jump&&!this.jumpHeld;this.jumpHeld=!!input.jump;
      for(let left=Math.min(.1,dt);left>1e-7&&!this.done;){const step=Math.min(1/120,left);this.step(input,step,jump);jump=false;left-=step;}
    }
    step(input,dt,jump){
      this.elapsed+=dt;const p=this.player,oldBottom=p.y+p.h;
      for(const floor of this.platforms){floor.oldX=floor.x;floor.oldY=floor.y;floor.x=floor.baseX+Math.sin(this.elapsed*floor.rate+floor.phase)*floor.ampX;floor.y=floor.baseY+Math.sin(this.elapsed*floor.rate+floor.phase)*floor.ampY;}
      if(p.standing!==null){const floor=this.platforms[p.standing];p.x+=floor.x-floor.oldX;p.y+=floor.y-floor.oldY;}
      const axis=clamp(Number(input.x)||0,-1,1);if(axis)p.face=Math.sign(axis);
      if(this.role==='cat'&&input.ability&&this.elapsed>=this.nextPower){this.nextPower=this.elapsed+5;this.boostUntil=this.elapsed+2.5;}
      const speed=this.speed*(this.elapsed<this.boostUntil?1.65:1),target=axis*speed;
      p.vx+=clamp(target-p.vx,-2000*dt,2000*dt);
      const wall=p.x<=.1||p.x+p.w>=this.width-.1;
      if(this.kind!=='snake'&&jump&&(p.jumps>0||this.role==='rat'&&wall)){
        p.vy=-750;p.jumps=Math.max(0,p.jumps-1);p.standing=null;
        if(wall&&this.role==='rat'){p.vx=p.x<1?260:-260;p.jumps=1;}
      }
      if(this.role==='dog'&&(input.fire||input.ability)&&this.elapsed>=this.nextShot&&this.bullets.length<12){
        this.nextShot=this.elapsed+.28;this.bullets.push({x:p.x+p.w/2+p.face*20,y:p.y+20,w:12,h:6,vx:p.face*850,life:1.25});
      }
      p.vy=Math.min(this.kind==='snake'?360:950,p.vy+2000*dt);
      if(this.role==='rat'&&wall&&axis&&(p.x<1?axis<0:axis>0)&&p.vy>90&&this.kind!=='snake')p.vy=90;
      p.x=clamp(p.x+p.vx*dt,0,this.width-p.w);p.y+=p.vy*dt;p.standing=null;
      if(p.vy>=0){
        let best=null;
        for(let i=0;i<this.platforms.length;i++){const f=this.platforms[i];if(p.x+p.w>f.x&&p.x<f.x+f.w&&oldBottom<=f.oldY+2&&p.y+p.h>=f.y&&(!best||f.y<best.y))best={id:i,y:f.y};}
        if(best){p.y=best.y-p.h;p.vy=0;p.jumps=this.maxJumps;p.standing=best.id;}
      }
      this.positionEntities(dt);
      for(const c of this.pickups)if(!c.taken&&overlap(p,c)){c.taken=true;this.coins++;}
      for(const e of this.enemies){
        if(e.hp<=0||!overlap(p,e))continue;
        if(p.vy>0&&oldBottom<=e.y+12){this.hitEnemy(e);p.y=e.y-p.h;p.vy=-600;p.jumps=Math.max(1,this.maxJumps-1);p.standing=null;}
        else this.damage();
      }
      for(const s of this.bullets){s.x+=s.vx*dt;s.life-=dt;for(const e of this.enemies)if(e.hp>0&&s.life>0&&overlap(s,e)){this.hitEnemy(e);s.life=0;break;}}
      this.bullets=this.bullets.filter(s=>s.life>0&&s.x>-30&&s.x<this.width+30);
      if(this.kind==='boss'||this.kind==='move'&&this.cell>=26||this.kind==='ladder'&&this.cell>=60){
        if(this.elapsed>=this.bombAt&&this.bombs.length<6){this.bombAt=this.elapsed+(this.kind==='boss'?2.4:3.2);this.bombs.push({x:clamp(p.x+(this.random()-.5)*270,20,this.width-40),y:p.y-380,w:26,h:26,warning:.65,vy:220+this.cell});}
      }
      for(const b of this.bombs){if(b.warning>0){b.warning-=dt;continue;}b.y+=b.vy*dt;if(overlap(p,b)){this.damage();b.y=this.height+100;}}
      this.bombs=this.bombs.filter(b=>b.y<this.height+80);
      for(const h of this.hazards)if(overlap(p,h))this.damage();
      this.bestY=Math.min(this.bestY,p.y);
      if(this.done)return;
      if(this.kind==='snake'&&p.standing===0)this.finish(true,'Safe landing.');
      else if(this.goal&&this.kind!=='snake'&&overlap(p,this.goal))this.finish(true,'Stage cleared.');
      else if(p.y>this.height+80)this.finish(false,'Missed the platform.');
      else if(this.kind==='ladder'&&p.y>this.bestY+420)this.finish(false,'Fell from the ladder.');
      else if(this.elapsed>=this.timeLimit)this.finish(false,'Stage time ran out.');
    }
  }
  return{Race,Stage,SNAKES,LADDERS,POWERS,BOSSES,ROLES,random,cellPoint,theme,overlap};
});
