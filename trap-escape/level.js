((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./levels.js'),...require('./machinery.js')}:root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  function loadLevel(index){const source=T.LEVELS[index];if(!source)throw Error('Choose a level from 1 to 50.');const level=JSON.parse(JSON.stringify(source));for(const item of level.pickups)item.taken=false;for(const env of level.environment){env.state='idle';env.timer=0;env.used=false;}T.decorateMachinery(level);if(level.mechanic&&!level.boss)level.hint=T.MACHINERY[level.mechanic].hint+(level.variant==='shelves'?' The exit is at the top.':'');return level;}
  return{loadLevel};
});
