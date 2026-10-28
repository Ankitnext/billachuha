((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,()=>{
  class CartoonParticles{
    constructor(){this.pool=Array.from({length:240},()=>({life:0}));this.cursor=0;}
    burst(x,y,color,count=15){for(let i=0;i<count;i++){const p=this.pool[this.cursor++%240],angle=i*2.39996;Object.assign(p,{x,y,color,vx:Math.cos(angle)*(50+i%5*22),vy:Math.sin(angle)*120-40,size:2+i%4,life:.3+i%4*.08});}}
    update(dt){for(const p of this.pool)if(p.life>0){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=240*dt;p.life-=dt;}}
  }
  return{CartoonParticles};
});
