((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  'use strict';
  const ATTACKS=Object.freeze({punch:{damage:8,range:60,cooldown:.3,duration:.22,start:.055,kx:240,ky:-75},kick:{damage:12,range:90,cooldown:.5,duration:.34,start:.11,kx:430,ky:-160},uppercut:{damage:15,range:70,cooldown:.6,duration:.38,start:.09,kx:180,ky:-740},slam:{damage:18,range:100,cooldown:.8,duration:.48,start:.08,kx:250,ky:750}});
  const multiplier=combo=>combo>=10?1.5:combo>=6?1.2:combo>=3?1.1:1;
  function hit(game,a,d,spec){
    if(d.ko||d.invulnerable>0)return false;
    const src=spec.origin||S.center(a),target=S.center(d),front=(src.x-target.x)*d.face>=0;
    if(d.shield&&d.energy>0){game.impact(target.x,target.y,'#a4e5d7',12);game.emit('shield-hit',d);return false;}
    const blocked=d.block&&front&&d.energy>=6;
    if(d.block&&front&&!blocked){d.block=false;d.stun=.3;game.text('GUARD BREAK',target.x,target.y-95,'#f3ca90');}
    const now=game.time; a.combo=now<=a.comboUntil?a.combo+1:1;a.comboUntil=now+.8;a.maxCombo=Math.max(a.maxCombo,a.combo);
    const amount=spec.damage*multiplier(a.combo)*(blocked?.25:1),damage=Math.min(d.hp,amount);
    d.hp=Math.max(0,d.hp-damage);a.damageDealt+=damage;d.damageTaken+=damage;
    d.receivedHits=now<=d.receivedUntil?d.receivedHits+1:1;d.receivedUntil=now+.8;
    if(blocked)d.energy=Math.max(0,d.energy-6);
    else{d.stun=Math.max(d.stun,.15);d.state='stun';d.attack=null;d.charging=false;d.charge=0;d.sp1Consumed=true;}
    const dir=spec.dir||Math.sign(target.x-src.x)||a.face;
    d.vx=dir*(spec.kx||260)*(blocked?.18:1);d.vy=(spec.ky||-70)*(blocked?.2:1);d.knockTime=blocked?.05:.17;d.grounded=false;d.hurtFlash=.1;
    game.impact(target.x,target.y,a.color,blocked?10:28);game.emit(blocked?'block-hit':spec.heavy?'heavy-hit':'hit',a);
    if(spec.heavy&&!blocked){game.hitstop=Math.max(game.hitstop,.05);game.shake=Math.max(game.shake,.25);game.flash=Math.max(game.flash,.12);}
    else game.shake=Math.max(game.shake,.08);
    if(a.combo>1)game.emit('combo',a);
    if(d.hp<=0){d.ko=true;d.state='ko';d.vx=dir*400;d.vy=-400;game.hitstop=.08;game.shake=.4;game.flash=.25;game.impact(target.x,target.y,d.color,60);game.emit('ko',d);}
    return true;
  }
  function melee(game,f,input){
    if(!input.attack||!f.canAct()||f.attackCooldown>0)return;
    const kind=input.y<-.45?'uppercut':input.y>.45?(f.grounded?'kick':'slam'):'punch',spec=ATTACKS[kind];
    f.attack={kind,elapsed:0,duration:spec.duration,start:spec.start,hit:false,spec};f.attackCooldown=spec.cooldown;f.state='attack';f.block=false;
    if(kind==='slam')f.vy=800;
    game.emit('swing',f);
  }
  function meleeBox(f,attack){
    const spec=attack.spec;
    if(attack.kind==='slam')return{x:f.x-30,y:f.y+f.h*.55,w:f.w+60,h:100};
    return{x:f.face>0?f.x+f.w*.45:f.x-spec.range,y:f.y-(attack.kind==='uppercut'?45:0)+10,w:spec.range+f.w*.55,h:attack.kind==='uppercut'?f.h+45:f.h*.75};
  }
  function resolveMelee(game,dt){
    for(const f of game.fighters){const a=f.attack;if(!a||a.power||a.kind==='pound')continue;a.elapsed+=dt;
      if(!a.hit&&a.elapsed>=a.start){const d=game.fighters[1-f.id];if(S.overlap(meleeBox(f,a),d)){a.hit=true;hit(game,f,d,{...a.spec,dir:f.face,heavy:a.kind!=='punch'});}}
      if(a.elapsed>=a.duration){f.attack=null;if(!f.ko)f.state=f.grounded?'idle':'fall';}
    }
  }
  return{ATTACKS,multiplier,hit,melee,meleeBox,resolveMelee};
});
