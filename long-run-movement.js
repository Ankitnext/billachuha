/* Preserve Long Run's original 60 Hz acceleration and drag at any refresh rate. */
((root,factory)=>{
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.LongRunMovement=api;
})(globalThis,()=>{
  'use strict';
  function axis(velocity,acceleration,friction,dt){
    if(!Number.isFinite(dt)||dt<=0)return{velocity,distance:0};
    if(friction===1)return{velocity:velocity+acceleration*dt,distance:velocity*dt+acceleration*dt*dt/2};
    if(friction===0)return{velocity:0,distance:0};
    const damping=Math.pow(friction,dt*60);
    const target=acceleration*friction/(60*(1-friction));
    // Fractional steps of the old update: v=(v+a/60)*friction; x+=v/60.
    // This also preserves distance when one frame is split into several frames.
    return{velocity:target+(velocity-target)*damping,
      distance:target*dt+(velocity-target)*friction*(1-damping)/(60*(1-friction))};
  }
  return{axis};
});
