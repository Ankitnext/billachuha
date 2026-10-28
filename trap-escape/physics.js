((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape||={},api);})(globalThis,()=>{
  'use strict';
  const RULES=Object.freeze({dt:1/60,gravity:1800,jump:660,speed:240,maxFall:600,tile:40,catDelay:90,capacity:3600});
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const integer=(n,max=1000000)=>Number.isFinite(n)?clamp(Math.floor(n),0,max):0;
  function createPlayer(level){return{x:level.spawn.x,y:level.spawn.y,w:28,h:40,vx:0,vy:0,face:1,grounded:true,standing:0,coyote:.1,jumpBuffer:0,prevJump:false,dropPose:0,caught:false};}
  function movePlayer(p,input,level,dt=RULES.dt){
    const wasGrounded=p.grounded,oldX=p.x,standing=level.platforms[p.standing],axis=clamp(Number(input.x)||0,-1,1);if(axis)p.face=Math.sign(axis);
    if(p.grounded&&standing?.moving){p.x+=standing.dx||0;p.y+=standing.dy||0;}
    if(p.grounded)for(const t of level.environment||[])if(t.type==='belt'&&Math.abs(p.y+p.h-t.y)<3&&p.x+p.w>t.x&&p.x<t.x+t.w)p.x+=(t.used?-1:1)*(t.direction||1)*65*dt;
    p.vx+=clamp(axis*RULES.speed-p.vx,-2200*dt,2200*dt);
    if(input.jump&&!p.prevJump)p.jumpBuffer=.12;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);p.prevJump=!!input.jump;
    p.coyote=p.grounded?.1:Math.max(0,p.coyote-dt);
    let jumped=false;if(p.jumpBuffer>0&&p.coyote>0){p.vy=-RULES.jump;p.grounded=false;p.coyote=0;p.jumpBuffer=0;jumped=true;}
    p.x=clamp(p.x+p.vx*dt,0,level.width-p.w);
    const direction=Math.sign(p.x-oldX);for(const tile of level.platforms)if(!tile.disabled&&tile.solid&&overlap(p,tile)){if(direction>0)p.x=tile.x-p.w;else if(direction<0)p.x=tile.x+tile.w;p.vx=0;}
    const oldBottom=p.y+p.h,oldTop=p.y;p.vy=Math.min(RULES.maxFall,p.vy+RULES.gravity*dt);p.y+=p.vy*dt;p.grounded=false;p.standing=null;
    if(p.vy>=0){let best=null;level.platforms.forEach((tile,i)=>{if(!tile.disabled&&p.x+p.w>tile.x&&p.x<tile.x+tile.w&&oldBottom<=tile.y+2&&p.y+p.h>=tile.y&&(!best||tile.y<best.y))best={y:tile.y,index:i};});if(best){p.y=best.y-p.h;p.vy=0;p.grounded=true;p.standing=best.index;p.coyote=.1;}}
    else for(const tile of level.platforms)if(!tile.disabled&&tile.solid&&p.x+p.w>tile.x&&p.x<tile.x+tile.w&&oldTop>=tile.y+tile.h-1&&p.y<tile.y+tile.h){p.y=tile.y+tile.h;p.vy=0;break;}
    p.dropPose=Math.max(0,p.dropPose-dt);
    return{jumped,landed:!wasGrounded&&p.grounded,moved:Math.abs(p.x-oldX)};
  }
  return{RULES,clamp,overlap,integer,createPlayer,movePlayer};
});
