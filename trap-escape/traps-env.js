((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./machinery.js')}:root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  const ENVIRONMENT=Object.freeze({bucket:{name:'Bucket drop',stun:90,reaction:'bucket',color:'#8cbac2',metal:true},sweep:{name:'Broom sweep',stun:75,reaction:'sweep',color:'#c5b17a'},spring:{name:'Spring pad',stun:90,reaction:'spring',color:'#9cbb72',metal:true},wire:{name:'Loose wire',stun:100,reaction:'wire',color:'#b9d8e1',metal:true},pit:{name:'Trapdoor',stun:120,reaction:'pit',color:'#8eaa93'},steam:{name:'Steam pipe',stun:80,reaction:'steam',color:'#e6bd8c',metal:true}});
  function updateEnvironment(game,dt,oldCenter){
    const p=game.player,foot=p.y+p.h,cx=p.x+p.w/2;
    for(const trap of game.level.environment){
      if(trap.used||T.MACHINERY[trap.type])continue;
      if(trap.state==='idle'&&cx>=trap.triggerX&&oldCenter<trap.triggerX&&Math.abs(foot-trap.y)<75){trap.state='arming';trap.timer=.18;game.trapsUsed++;game.emit('lever');game.burst(trap.triggerX,trap.y-20,'#d6dd98',7);game.message=`${ENVIRONMENT[trap.type].name} armed behind you.`;}
      if(trap.state==='arming'){trap.timer-=dt;if(trap.timer<=0)trap.state='armed';}
      if(trap.state==='armed'&&game.cat.state!=='waiting'){
        const box={x:trap.x-18,y:trap.y-(trap.type==='bucket'?135:65),w:62,h:trap.type==='bucket'?135:65};
        if(T.overlap(box,game.cat)){trap.used=true;trap.state='spent';game.hitCat(trap);}
      }
    }
  }
  return{ENVIRONMENT:Object.freeze({...ENVIRONMENT,...T.MACHINERY}),updateEnvironment};
});
