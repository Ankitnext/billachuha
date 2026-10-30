((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./vision.js')}:root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  function createGuard(data){return{...data.pos,route:data.route.map(p=>({...p})),speed:data.speed,angle:data.angle,boss:data.boss,pauseTime:data.pauseTime,waypoint:0,state:data.boss?'hunt':'patrol',timer:0,pause:0,lost:0,blind:0,range:160,half:data.boss?Math.PI*5/12:Math.PI/3,lastKnown:{...data.pos}};}
  function state(guard,next,game){if(guard.state===next)return;guard.state=next;guard.timer=0;guard.path=null;if(next==='alert'||next==='chase')game.emit(next);}
  function updateGuard(guard,game,dt){
    guard.timer+=dt;guard.blind=Math.max(0,guard.blind-dt);guard.pause=Math.max(0,guard.pause-dt);
    const p=game.player,range=guard.range*(p.paws>0?.7:1),sees=guard.blind<=0&&K.canDetectPlayer(guard,p,game.level,game.smoke,range),hears=guard.blind<=0&&p.noise>0&&K.distance(guard,p)<p.noise;
    if(sees){game.noteSpotted();guard.lastKnown={x:p.x,y:p.y};guard.lost=0;}else guard.lost+=dt;
    if(guard.state==='distracted'){
      const decoy=game.decoys.find(d=>d.id===guard.decoy);
      if(!decoy){state(guard,guard.boss?'hunt':'patrol',game);return;}
      K.travel(guard,decoy,90,dt,game.level);
      if(K.distance(guard,decoy)<18){decoy.life=0;state(guard,'search',game);guard.blind=1.2;guard.lastKnown={x:guard.x,y:guard.y};}
      return;
    }
    if(guard.blind>0){guard.angle+=dt;return;}
    if((sees||hears)&&['patrol','search','hunt'].includes(guard.state)){if(hears)guard.lastKnown={x:p.x,y:p.y};state(guard,'alert',game);}
    if(guard.state==='alert'){
      const target=guard.lastKnown;guard.angle+=K.angleDelta(guard.angle,Math.atan2(target.y-guard.y,target.x-guard.x))*Math.min(1,dt*4);
      if(guard.timer>=1.5)state(guard,sees||hears?'chase':guard.boss?'hunt':'patrol',game);
    }else if(guard.state==='chase'){
      K.travel(guard,guard.lastKnown,(guard.boss?195:150)*guard.speed,dt,game.level);
      if(guard.lost>=3)state(guard,'search',game);
    }else if(guard.state==='search'){
      if(K.distance(guard,guard.lastKnown)>8)K.travel(guard,guard.lastKnown,75,dt,game.level);else guard.angle+=dt*1.4;
      if(guard.timer>=5){state(guard,guard.boss?'hunt':'patrol',game);if(guard.route.length)guard.waypoint=guard.route.reduce((best,pos,i)=>K.distance(pos,guard)<K.distance(guard.route[best],guard)?i:best,0);}
    }else if(guard.state==='hunt'){
      K.travel(guard,p,(game.alarm>0?160:100+(game.level.world||0)*7),dt,game.level);
    }else if(guard.route.length&&guard.pause<=0){
      const target=guard.route[guard.waypoint];K.travel(guard,target,(game.alarm>0?150:70)*guard.speed,dt,game.level);
      if(K.distance(guard,target)<5){guard.waypoint=(guard.waypoint+1)%guard.route.length;guard.pause=guard.pauseTime;guard.path=null;}
    }
    if(K.distance(guard,p)<21&&guard.state!=='distracted')game.catch();
  }
  return{createGuard,updateGuard};
});
