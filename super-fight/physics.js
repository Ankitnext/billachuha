((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight||={},api);})(globalThis,()=>{
  'use strict';
  const RULES=Object.freeze({width:1400,height:800,floor:740,dt:1/60,gravity:2160,jump:740,flight:440,flightDrain:90,groundRegen:120,shieldDrain:180,roundTime:90});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const center=f=>({x:f.x+f.w/2,y:f.y+f.h/2});
  const random=seed=>{let state=seed>>>0;return()=>{state+=0x6D2B79F5;let n=state;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return((n^n>>>14)>>>0)/4294967296;};};
  const neutral=()=>({x:0,y:0,attack:false,sp1:false,sp2:false,block:false,dashX:0,dashY:0,tap1:false,tap2:false});
  function physics(game,f,input,dt){
    if(f.ko)return;
    const locked=f.stun>0||f.attack?.root||f.charging||f.shield;
    const axis=locked?0:clamp(input.x||0,-1,1);
    const target=axis*f.speed*(f.block?.42:1),accel=f.grounded?2600:1500;
    let endDash=false;
    if(f.dashTime>0){f.dashTime=Math.max(0,f.dashTime-dt);endDash=f.dashTime<=1e-6;}
    else if(f.knockTime>0){f.knockTime=Math.max(0,f.knockTime-dt);f.vx*=Math.pow(.06,dt);}
    else f.vx+=clamp(target-f.vx,-accel*dt,accel*dt);
    const up=input.y<-.45;
    if(up&&!f.prevUp&&!locked&&f.grounded){f.vy=-RULES.jump;f.grounded=false;f.upTime=0;game.emit('jump',f);}
    f.upTime=up?f.upTime+dt:0;f.prevUp=up;
    const flying=up&&!f.grounded&&!locked&&f.upTime>.16&&f.energy>=RULES.flightDrain*dt&&f.dashTime<=0;
    if(flying){f.energy-=RULES.flightDrain*dt;f.vy+=clamp(-RULES.flight-f.vy,-2600*dt,2600*dt);}
    else if(f.dashTime<=0)f.vy=Math.min(1200,f.vy+RULES.gravity*dt*(input.y>.45&&!f.grounded?1.35:1));
    f.flying=flying;
    if(f.attack?.kind==='pound')f.vy=Math.max(1100,f.vy);
    f.x+=f.vx*dt;f.y+=f.vy*dt;
    if(endDash){f.vx*=.2;f.vy*=.2;}
    const wall=f.x<0||f.x+f.w>RULES.width;
    if(wall){f.x=clamp(f.x,0,RULES.width-f.w);if(Math.abs(f.vx)>750){f.vx*=-.6;f.knockTime=.2;f.dashTime=0;game.impact(f.x+f.w/2,f.y+f.h/2,f.color,14);game.emit('wall',f);}else f.vx=0;}
    if(f.y<8){f.y=8;if(f.vy<0)f.vy=Math.abs(f.vy)*.25;}
    f.grounded=f.y+f.h>=RULES.floor;
    if(f.grounded){f.y=RULES.floor-f.h;f.vy=0;if(!f.shield&&!f.charging&&!f.attack?.power)f.energy=Math.min(f.maxEnergy,f.energy+RULES.groundRegen*dt);}
    f.energy=clamp(f.energy,0,f.maxEnergy);
    if(!f.stun&&!f.attack&&!f.charging&&!f.shield)f.state=f.block?'block':flying?'fly':!f.grounded?(f.vy<0?'jump':'fall'):Math.abs(f.vx)>40?'run':'idle';
  }
  return{RULES,clamp,overlap,center,random,neutral,physics};
});
