((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
 'use strict';
 const MACHINERY=Object.freeze({
  ceiling:{name:'Ceiling slam',stun:110,windup:.34,reaction:'ceiling',color:'#a3b58b',metal:true,hint:'Run past the far lever. The wide ceiling slams down on the Cat behind you.'},
  shift:{name:'Sliding floor',stun:100,windup:.16,reaction:'shift',color:'#bfc984',metal:false,hint:'Ride or jump the sliding floor, then pass its lever to make the Cat lose its footing.'},
  lift:{name:'Elevator launch',stun:100,windup:.18,reaction:'lift',color:'#adc7a0',metal:true,hint:'The elevator carries you up. Pass its far lever to launch the Cat into the air.'},
  crusher:{name:'Floor piston',stun:105,windup:.18,reaction:'crusher',color:'#d8b781',metal:true,hint:'Pass the lever beyond the piston hatch. It springs up under the following Cat.'},
  pendulum:{name:'Pendulum bonk',stun:95,windup:.26,reaction:'pendulum',color:'#a5beb0',metal:true,hint:'Run beyond the marked lever to send the swinging wrecking ball into the Cat.'},
  gate:{name:'Shutter trap',stun:95,windup:.22,reaction:'gate',color:'#91b6a3',metal:true,hint:'Slip past the raised shutter and its lever. It closes on the Cat, then reopens.'},
  belt:{name:'Reverse conveyor',stun:70,windup:.12,reaction:'belt',color:'#d3be7a',metal:false,hint:'Follow the conveyor arrows. Pass its lever to reverse it under the Cat.'}
 });
 const isMachine=t=>!!MACHINERY[t.type];
 function decorateMachinery(level){
  level.environment.forEach((t,index)=>{if(!isMachine(t))return;Object.assign(t,{age:0,motion:0,offset:0,rise:0,attack:0,attackDuration:0,moving:false,targetX:0,targetY:0,blockY:t.y-270,gateBottom:t.y-155,ballX:t.x+t.w/2,ballY:t.y-120});
   if(t.type==='shift'||t.type==='lift'){
    const floor=level.platforms.find(p=>p.y===t.y&&p.x<=t.x&&p.x+p.w>=t.x+t.w);
    if(!floor)throw new Error(`Machine floor outside a platform in ${level.id}`);
    level.platforms.splice(level.platforms.indexOf(floor),1,{...floor,w:t.x-floor.x},{x:t.x,y:t.y,w:t.w,h:18,solid:false,moving:true,machine:index,originX:t.x,originY:t.y,dx:0,dy:0},{...floor,x:t.x+t.w,w:floor.x+floor.w-t.x-t.w});
   }
   if(['ceiling','gate','crusher'].includes(t.type))level.platforms.push({x:t.x,y:t.y-270,w:t.w,h:1,solid:true,disabled:true,machineBlock:index});
  });level.platforms=level.platforms.filter(p=>p.w>0);
 }
 function showMachineImpact(game,t){
  if(!Number.isFinite(t.x)||!Number.isFinite(t.y))return;
  t.used=true;t.state='cooling';t.timer=.7;t.attack=0;t.targetX=game.cat.x+game.cat.w/2;t.targetY=game.cat.y+game.cat.h*.45;
  if(t.type==='ceiling')t.blockY=t.y-30;if(t.type==='gate')t.gateBottom=t.y;if(t.type==='crusher')t.rise=110;
  if(t.type==='pendulum'){t.ballX=t.targetX;t.ballY=t.targetY;}
  game.cat.machineHold=0;game.emit('machine-impact',{trap:t.type});
 }
 function advanceMachinery(game,dt){
  const l=game.level,p=game.player;
  for(const t of l.environment){if(!isMachine(t))continue;t.age+=dt;
   if((t.type==='shift'||t.type==='lift')&&p.x+p.w>t.x-90&&p.x<t.x+t.w+120&&Math.abs(p.y+p.h-t.y)<155)t.moving=true;
   if(t.moving){t.motion+=dt;if(t.type==='shift')t.offset=Math.sin(t.motion*1.55)*48*(t.direction||1);else t.rise=(1-Math.cos(t.motion*1.65))*.5*72;}
   if(t.state==='attacking'){
    t.attack=Math.max(0,t.attack-dt);const k=1-t.attack/t.attackDuration;
    if(t.type==='ceiling')t.blockY=t.y-270+k*k*240;
    if(t.type==='gate')t.gateBottom=t.y-155+k*155;
    if(t.type==='crusher')t.rise=k*110;
    if(t.type==='pendulum'){t.ballX=t.x+t.w/2+110*(1-k)+(t.targetX-(t.x+t.w/2))*k;t.ballY=(t.y-205)*(1-k)+t.targetY*k;}
    if(t.attack<=0&&!t.used)game.hitCat(t);
   }else if(t.state==='cooling'){
    t.timer-=dt;const k=T.clamp(t.timer/.7,0,1);
    if(t.type==='ceiling')t.blockY=t.y-270+240*k;
    if(t.type==='gate')t.gateBottom=t.y-155+155*k;
    if(t.type==='crusher')t.rise=110*k;
    if(t.timer<=0)t.state='spent';
   }
  }
  for(const tile of l.platforms){
   if(tile.machine!==undefined){const t=l.environment[tile.machine],x=tile.x,y=tile.y;tile.x=tile.originX+(t.type==='shift'?t.offset:0);tile.y=tile.originY-(t.type==='lift'?t.rise:0);tile.dx=tile.x-x;tile.dy=tile.y-y;}
   if(tile.machineBlock!==undefined){const t=l.environment[tile.machineBlock];tile.disabled=!['attacking','cooling'].includes(t.state);tile.x=t.x;
    if(t.type==='ceiling'){tile.y=t.blockY;tile.h=30;}
    if(t.type==='gate'){tile.y=t.y-270;tile.h=Math.max(1,t.gateBottom-tile.y);}
    if(t.type==='crusher'){tile.y=t.y-t.rise;tile.h=Math.max(1,t.rise);}
   }
  }
 }
 function updateMachinery(game,dt,oldCenter){
  const p=game.player,c=game.cat,center=p.x+p.w/2,foot=p.y+p.h;
  for(const t of game.level.environment){if(!isMachine(t)||t.used)continue;
   if(t.state==='idle'&&center>=t.triggerX&&oldCenter<t.triggerX&&Math.abs(foot-t.y)<150){t.state='arming';t.timer=.1;game.trapsUsed++;game.emit('lever');game.message=`${MACHINERY[t.type].name} armed behind you.`;game.burst(t.triggerX,t.y-20,MACHINERY[t.type].color,8);}
   if(t.state==='arming'){t.timer-=dt;if(t.timer<=0)t.state='armed';}
   if(t.state!=='armed'||c.state==='waiting'||c.state==='defeated')continue;
   const tall=t.type==='ceiling'||t.type==='pendulum'||t.type==='gate';
   const zone={x:t.x-15,y:t.y-(tall?195:105),w:t.w+30,h:tall?195:120};
   if(c.x+c.w/2>=t.x+12&&c.x+c.w/2<=t.x+t.w-8&&T.overlap(zone,c)){t.state='attacking';t.attackDuration=MACHINERY[t.type].windup;t.attack=t.attackDuration;t.targetX=c.x+c.w/2;t.targetY=c.y+c.h*.45;c.machineHold=Math.max(c.machineHold||0,t.attackDuration+.04);game.emit('machine-trigger',{trap:t.type});}
  }
 }
 return{MACHINERY,isMachine,decorateMachinery,advanceMachinery,updateMachinery,showMachineImpact};
});
