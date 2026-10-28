((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  class FightCamera{
    constructor(){this.view={x:0,y:0,w:1400,h:800};this.ready=false;}
    update(match,aspect,dt=1/60,motion=true){
      const [a,b]=match.fighters.map(S.center),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2;
      let w=S.clamp(Math.abs(a.x-b.x)+400,850,1400),h=w/aspect;
      if(h<Math.min(800,Math.abs(a.y-b.y)+330)){h=Math.min(800,Math.abs(a.y-b.y)+330);w=h*aspect;}
      if(motion&&(match.clash||match.phase==='matchover')){w*=.94;h*=.94;}
      const target={x:w>1400?(1400-w)/2:S.clamp(cx-w/2,0,1400-w),y:h>800?(800-h)/2:S.clamp(cy-h*.5,0,800-h),w,h};
      const lerp=this.ready&&motion?Math.min(1,dt*8):1;for(const k of ['x','y','w','h'])this.view[k]+=(target[k]-this.view[k])*lerp;
      const minX=Math.min(...match.fighters.map(f=>f.x))-35,maxX=Math.max(...match.fighters.map(f=>f.x+f.w))+35,minY=Math.min(...match.fighters.map(f=>f.y))-38,maxY=Math.max(...match.fighters.map(f=>f.y+f.h))+30;
      const scale=Math.max(1,(maxX-minX)/this.view.w,(maxY-minY)/this.view.h);this.view.w*=scale;this.view.h*=scale;
      this.view.x=Math.min(this.view.x,minX);this.view.y=Math.min(this.view.y,minY);
      if(this.view.x+this.view.w<maxX)this.view.x=maxX-this.view.w;if(this.view.y+this.view.h<maxY)this.view.y=maxY-this.view.h;
      this.ready=true;return this.view;
    }
    reset(){this.ready=false;}
  }
  return{FightCamera};
});
