((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./vision.js')}:root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  const createCamera=(data,index)=>({...data.pos,base:data.startAngle,angle:data.startAngle,sweep:data.sweepAngle,speed:data.sweepSpeed,offset:index*1.7,range:200,half:Math.PI/12,ground:data.ground});
  function updateCameras(game,dt){
    game.alarm=Math.max(0,game.alarm-dt);
    for(const camera of game.cameras){camera.angle=camera.base+Math.sin(game.elapsed*camera.speed+camera.offset)*camera.sweep;
      const sees=K.canDetectPlayer(camera,game.player,game.level,game.smoke);if(sees&&!camera.saw){game.triggerAlarm();}camera.saw=sees;
    }
    for(const floor of game.level.floors||[])if(floor.kind==='laser'){
      const active=(game.elapsed+floor.phase)%floor.period<floor.period*.48,hit=active&&K.overlap(K.rect(game.player),floor);
      if(hit&&!game.laserHit)game.triggerAlarm();game.laserHit=hit;
    }
  }
  return{createCamera,updateCameras};
});
