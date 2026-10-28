((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./combat.js')}:root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  'use strict';
  const pay=(f,cost)=>{if(f.energy+1e-6<cost)return false;f.energy=Math.max(0,f.energy-cost);f.block=false;return true;};
  function cancelCharge(f){f.charging=false;f.charge=0;f.sp1Consumed=false;f.sp2Time=0;f.sp2Consumed=false;f.prevSp1=false;f.prevSp2=false;f.prevUp=false;f.upTime=0;f.shield=false;f.block=false;}
  function blast(game,f){if(!f.canAct()||f.powerCooldown>0||!pay(f,20)||game.projectiles.length>=32)return false;
    const c=S.center(f);game.projectiles.push({owner:f.id,x:c.x+f.face*45,y:f.y+36,w:25,h:25,vx:f.face*800,life:1.8});f.powerCooldown=.4;f.state='blast';f.attack={kind:'blast',power:true,elapsed:0,duration:.2};game.emit('blast',f);return true;
  }
  function beam(game,f){if(f.ko||f.stun>0||f.powerCooldown>0||!pay(f,50))return false;
    f.charging=false;f.charge=0;f.attack={kind:'beam',power:true,root:true,elapsed:0,duration:.48};f.state='beam';f.powerCooldown=1.25;
    game.beams.push({owner:f.id,face:f.face,life:.48,warmup:.1,hit:false,clashed:false,y:f.y+35,x:S.center(f).x+f.face*30});game.emit('beam',f);return true;
  }
  function teleport(game,f){
    const escape=f.stun>0&&f.receivedHits>=5;
    if(f.ko||f.teleportCooldown>0||(!f.canAct()&&!escape)||!pay(f,25))return false;
    const enemy=game.fighters[1-f.id];f.afterimages.push({x:f.x,y:f.y,face:f.face,life:.35,state:f.state});
    f.x=S.clamp(enemy.x-enemy.face*112,15,S.RULES.width-f.w-15);f.y=enemy.y;f.vx=0;f.vy=0;f.stun=0;f.knockTime=0;f.attack=null;f.charging=false;f.shield=false;
    f.invulnerable=.2;f.teleportCooldown=f.spec.teleportCooldown;f.face=S.center(enemy).x>S.center(f).x?1:-1;f.state='teleport';f.receivedHits=0;enemy.combo=0;enemy.comboUntil=0;
    game.impact(f.x+f.w/2,f.y+f.h/2,f.color,20);game.emit('teleport',f);if(escape)game.text('COMBO BREAK',f.x,f.y-30,'#c5e6bd');return true;
  }
  function dragon(game,f){if(!f.canAct()||f.powerCooldown>0||!pay(f,30))return false;
    f.attack={kind:'dragon',power:true,elapsed:0,duration:.42,hit:false};f.state='dragon';f.powerCooldown=.75;f.vy=-740;f.grounded=false;game.emit('dragon',f);return true;
  }
  function pound(game,f){if(f.grounded||!f.canAct()||f.powerCooldown>0||!pay(f,35))return false;
    f.attack={kind:'pound',power:true,elapsed:0,duration:3,hit:false};f.state='pound';f.powerCooldown=.9;f.vy=1100;game.emit('pound',f);return true;
  }
  function dash(game,f,x,y){if(!f.canAct()||f.dashCooldown>0||(!x&&!y)||!pay(f,20))return false;
    const length=Math.hypot(x,y);f.vx=x/length*1500;f.vy=y/length*1500;f.dashTime=200/1500;f.dashCooldown=.45;f.knockTime=0;f.state='dash';f.grounded=false;
    for(let i=0;i<4;i++)f.afterimages.push({x:f.x-x/length*i*28,y:f.y-y/length*i*28,face:f.face,state:'fly',life:.12+i*.045});game.emit('dash',f);return true;
  }
  function powers(game,f,input,dt){
    const one=!!input.sp1,two=!!input.sp2,press1=(one&&!f.prevSp1)||input.tap1,press2=(two&&!f.prevSp2)||input.tap2;
    if(f.ko){cancelCharge(f);return;}
    if(press1)f.sp1Consumed=false;
    if(input.dashX||input.dashY)dash(game,f,input.dashX||0,input.dashY||0);
    if(press1&&input.y<-.45){dragon(game,f);f.sp1Consumed=true;}
    else if(input.tap1){blast(game,f);f.sp1Consumed=true;}
    else if(one&&!f.sp1Consumed&&f.canAct()&&f.powerCooldown<=0&&f.energy>=20){f.charging=true;f.block=false;f.charge=0;f.state='charge';}
    if(one&&f.charging&&!f.sp1Consumed){f.charge+=dt;if(f.charge>=f.spec.charge&&f.energy>=50){beam(game,f);f.sp1Consumed=true;}}
    if(!one&&f.prevSp1){const release=f.charging&&!f.sp1Consumed;f.charging=false;f.charge=0;if(release)blast(game,f);f.sp1Consumed=false;}
    if(press2){f.sp2Time=0;f.sp2Consumed=false;if(input.y>.45&&!f.grounded){pound(game,f);f.sp2Consumed=true;}else if(input.tap2){teleport(game,f);f.sp2Consumed=true;}}
    if(two&&!f.sp2Consumed){f.sp2Time+=dt;if(f.sp2Time>=.24&&!f.attack&&!f.charging&&f.stun<=0){if(f.energy>=S.RULES.shieldDrain*dt){f.shield=true;f.block=false;f.state='shield';f.energy-=S.RULES.shieldDrain*dt;}else{f.shield=false;f.sp2Consumed=true;f.powerCooldown=Math.max(f.powerCooldown,.3);game.emit('shield-break',f);}}}
    if(!two&&f.prevSp2){const tap=f.sp2Time<.24&&!f.sp2Consumed;f.shield=false;if(tap)teleport(game,f);f.sp2Time=0;f.sp2Consumed=false;}
    if(!two)f.shield=false;
    f.prevSp1=one;f.prevSp2=two;
  }
  function beamBox(b){return{x:b.face>0?b.x:0,y:b.y-20,w:b.face>0?S.RULES.width-b.x:b.x,h:40};}
  function resolvePowers(game,dt){
    for(const f of game.fighters){const a=f.attack;if(!a?.power)continue;a.elapsed+=dt;
      if(a.kind==='dragon'&&!a.hit){const d=game.fighters[1-f.id],box={x:f.face>0?f.x:f.x-80,y:f.y-45,w:f.w+80,h:f.h+65};if(S.overlap(box,d)){a.hit=true;S.hit(game,f,d,{damage:22,kx:160,ky:-850,dir:f.face,heavy:true});}}
      if(a.kind==='pound'&&f.grounded){const c=S.center(f),enemy=game.fighters[1-f.id];game.waves.push({x:c.x,y:S.RULES.floor,radius:f.spec.poundRadius,life:.45,color:f.color});game.impact(c.x,S.RULES.floor,f.color,40);game.shake=.3;game.emit('slam',f);
        if(Math.abs(S.center(enemy).x-c.x)<=f.spec.poundRadius&&enemy.y+enemy.h>S.RULES.floor-100)S.hit(game,f,enemy,{damage:28,kx:450,ky:-430,heavy:true});f.attack=null;
      }else if(a.elapsed>=a.duration)f.attack=null;
    }
    for(const shot of game.projectiles){shot.x+=shot.vx*dt;shot.life-=dt;const a=game.fighters[shot.owner],d=game.fighters[1-shot.owner];if(shot.life>0&&S.overlap(shot,d)){S.hit(game,a,d,{damage:15,kx:330,ky:-100,origin:{x:shot.x-shot.vx*.05,y:shot.y}});shot.life=0;}if(shot.x<-40||shot.x>S.RULES.width+40)shot.life=0;}
    game.projectiles=game.projectiles.filter(s=>s.life>0);
    for(const b of game.beams){b.life-=dt;b.warmup=Math.max(0,b.warmup-dt);}
    const active=game.beams.filter(b=>b.life>0);
    if(active.length>=2){for(const a of active)for(const b of active)if(a.owner!==b.owner&&!a.clashed&&!b.clashed&&a.face!==b.face&&S.overlap(beamBox(a),beamBox(b))){a.clashed=b.clashed=true;a.clashX=b.clashX=(a.x+b.x)/2;game.clash={x:a.clashX,y:(a.y+b.y)/2,life:.6};game.hitstop=.05;game.flash=.15;game.shake=.3;game.emit('clash');}}
    for(const b of active)if(!b.hit&&!b.clashed&&b.warmup<=0){const a=game.fighters[b.owner],d=game.fighters[1-b.owner];if(S.overlap(beamBox(b),d)){S.hit(game,a,d,{damage:35,kx:700,ky:-160,dir:b.face,heavy:true});b.hit=true;}}
    game.beams=active;
  }
  return{pay,cancelCharge,blast,beam,teleport,dragon,pound,dash,powers,beamBox,resolvePowers};
});
