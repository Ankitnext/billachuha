((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,()=>{
  class Particles{
    constructor(random=Math.random){this.random=random;this.pool=Array.from({length:500},()=>({life:0}));this.cursor=0;}
    emit(x,y,color,count=20,speed=270){for(let i=0;i<count;i++){const p=this.pool[this.cursor++%500],angle=this.random()*Math.PI*2,velocity=(.3+this.random()*.7)*speed;Object.assign(p,{x,y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,life:.18+this.random()*.4,maxLife:.6,size:2+this.random()*5,color});}}
    update(dt){for(const p of this.pool)if(p.life>0){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;}}
    clear(){for(const p of this.pool)p.life=0;}
  }
  return{Particles};
});
