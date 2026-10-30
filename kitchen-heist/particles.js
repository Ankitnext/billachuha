((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,()=>{
  class HeistParticles{
    constructor(){this.items=[];}
    burst(event){if(this.items.length>100)return;for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;this.items.push({x:event.x,y:event.y,vx:Math.cos(angle)*38,vy:Math.sin(angle)*38,life:.5,color:event.type==='pickup'?'#ffdf7e':'#b3d7c7'});}}
    update(dt){for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;}this.items=this.items.filter(p=>p.life>0);}
    draw(c){for(const p of this.items){c.globalAlpha=p.life*2;c.fillStyle=p.color;c.fillRect(p.x-2,p.y-2,4,4);}c.globalAlpha=1;}
  }
  return{HeistParticles};
});
