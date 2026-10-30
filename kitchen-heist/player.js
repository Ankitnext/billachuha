((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  const createPlayer=level=>({...level.spawn,vx:0,vy:0,angle:0,tools:[],selected:0,paws:0,noise:0,sprinting:false});
  function updatePlayer(player,input,level,dt){
    let x=K.clamp(Number(input.x)||0,-1,1),y=K.clamp(Number(input.y)||0,-1,1),d=Math.hypot(x,y);if(d>1){x/=d;y/=d;}
    player.sprinting=!!input.sprint&&d>.1;const speed=player.sprinting?K.RULES.sprint:K.RULES.ratSpeed;
    player.vx+=K.clamp(x*speed-player.vx,-1400*dt,1400*dt);player.vy+=K.clamp(y*speed-player.vy,-1400*dt,1400*dt);
    if(d>.1)player.angle=Math.atan2(y,x);K.move(player,player.vx,player.vy,dt,level);
    for(const floor of level.floors||[])if(K.overlap(K.rect(player),floor)&&floor.kind==='conveyor')K.move(player,floor.direction*45,0,dt,level);
    player.paws=Math.max(0,player.paws-dt);player.noise=player.paws>0?0:player.sprinting?96:0;
    if(player.paws<=0&&Math.hypot(player.vx,player.vy)>20&&(level.floors||[]).some(f=>f.kind==='noise'&&K.overlap(K.rect(player),f)))player.noise=128;
  }
  return{createPlayer,updatePlayer};
});
