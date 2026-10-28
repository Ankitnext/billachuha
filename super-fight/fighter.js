((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  'use strict';
  const CHARACTERS=Object.freeze({
    blaze:{name:'Blaze',hp:100,energy:120,speed:440,charge:.7,teleportCooldown:.85,poundRadius:180,color:'#75caef',description:'Fast feet. Faster beams.',signature:'Beam charges 30% faster'},
    shadow:{name:'Shadow',hp:90,energy:150,speed:380,charge:1,teleportCooldown:0,poundRadius:180,color:'#c3a1ef',description:'Be everywhere. Be unexpected.',signature:'Teleport has no cooldown'},
    titan:{name:'Titan',hp:130,energy:90,speed:320,charge:1,teleportCooldown:.85,poundRadius:252,color:'#e9be77',description:'Stand firm. Hit the whole ground.',signature:'Ground Pound radius +40%'}
  });
  class Fighter{
    constructor(id,character){
      if(!CHARACTERS[character])throw Error('Choose Blaze, Shadow or Titan.');
      const c=CHARACTERS[character];this.id=id;this.character=character;this.name=c.name;this.color=id===0?c.color:'#f08d83';this.tint=c.color;
      this.w=46;this.h=106;this.x=id===0?330:1024;this.y=S.RULES.floor-this.h;this.vx=0;this.vy=0;this.face=id===0?1:-1;
      this.maxHp=c.hp;this.hp=c.hp;this.maxEnergy=c.energy;this.energy=c.energy;this.speed=c.speed;this.grounded=true;this.state='idle';
      this.stun=0;this.invulnerable=0;this.knockTime=0;this.dashTime=0;this.dashCooldown=0;this.teleportCooldown=0;this.attackCooldown=0;this.powerCooldown=0;
      this.attack=null;this.block=false;this.shield=false;this.charging=false;this.charge=0;this.sp1Consumed=false;this.sp2Time=0;this.sp2Consumed=false;
      this.prevSp1=false;this.prevSp2=false;this.prevUp=false;this.upTime=0;this.flying=false;this.ko=false;
      this.combo=0;this.comboUntil=0;this.maxCombo=0;this.receivedHits=0;this.receivedUntil=0;this.damageDealt=0;this.damageTaken=0;this.afterimages=[];this.hurtFlash=0;
    }
    get spec(){return CHARACTERS[this.character];}
    canAct(){return!this.ko&&this.stun<=0&&!this.attack&&!this.charging&&!this.shield;}
    timers(dt){for(const key of ['stun','invulnerable','knockTime','dashCooldown','teleportCooldown','attackCooldown','powerCooldown','hurtFlash'])this[key]=Math.max(0,this[key]-dt);if(this.stun>0)this.state='stun';}
  }
  return{CHARACTERS,Fighter};
});
