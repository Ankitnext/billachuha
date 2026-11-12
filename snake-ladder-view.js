/* Presentation geometry only. The race and platform rules remain in StairsGame. */
((root,factory)=>{const view=factory();if(typeof module==='object'&&module.exports)module.exports=view;else root.StairsView=view;})(globalThis,()=>{
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function boardView(width,height,zoom=1,cell=1,pan={x:0,y:0}){
    const world=760,pad=world*.027,tile=(world-2*pad)/10;
    const row=Math.floor((clamp(cell,1,100)-1)/10),column=(cell-1)%10;
    const point={x:pad+((row%2?9-column:column)+.5)*tile,y:pad+(9-row+.5)*tile};
    const scale=Math.min(width,height)/world*clamp(zoom,1,3),size=world*scale;
    const offset=(available,center)=>size<=available?(available-size)/2:clamp(available/2-center*scale,available-size,0);
    return{scale,x:offset(width,zoom===1?world/2:point.x+pan.x),y:offset(height,zoom===1?world/2:point.y+pan.y),tile,point};
  }
  function viewSize(width,height,kind='move'){
    const scale=Math.min(1,Math.max(1,width)/(kind==='ladder'||kind==='snake'?620:760),Math.max(1,height)/560);
    return{width:Math.round(Math.max(1,width)/scale),height:Math.round(Math.max(1,height)/scale)};
  }
  function landing(stage,axis=0){
    const p=stage.player;
    if(p.standing!==null){const platform=stage.platforms[p.standing];return{platform:p.standing,x:p.x+p.w/2,y:platform.y,time:0,path:[]};}
    let x=p.x,y=p.y,vx=p.vx,vy=p.vy;
    const path=[{x:x+p.w/2,y:y+p.h}],dt=1/60;
    for(let i=1;i<=150;i++){
      const t=i*dt,bottom=y+p.h;
      const speed=stage.speed*(stage.elapsed+t<stage.boostUntil?1.65:1);
      vx+=clamp(clamp(axis,-1,1)*speed-vx,-2000*dt,2000*dt);
      vy=Math.min(stage.kind==='snake'?360:950,vy+2000*dt);
      if(stage.role==='rat'&&stage.kind!=='snake'&&axis&&(x<=.1||x+p.w>=stage.width-.1)&&(x<1?axis<0:axis>0)&&vy>90)vy=90;
      x=clamp(x+vx*dt,0,stage.width-p.w);y+=vy*dt;
      if(i%4===0)path.push({x:x+p.w/2,y:y+p.h});
      if(vy>=0){
        let hit=null;
        stage.platforms.forEach((f,id)=>{
          const fx=f.baseX+Math.sin((stage.elapsed+t)*f.rate+f.phase)*f.ampX;
          const fy=f.baseY+Math.sin((stage.elapsed+t)*f.rate+f.phase)*f.ampY;
          const oldY=f.baseY+Math.sin((stage.elapsed+t-dt)*f.rate+f.phase)*f.ampY;
          if(x+p.w>fx&&x<fx+f.w&&bottom<=oldY+2&&y+p.h>=fy&&(!hit||fy<hit.y))hit={platform:id,platformX:fx,platformWidth:f.w,x:x+p.w/2,y:fy,time:t,path};
        });
        if(hit){path.push({x:hit.x,y:hit.y});return hit;}
      }
      if(y>stage.height+80)break;
    }
    return null;
  }
  class Camera{
    constructor(){this.reset();}
    reset(){this.x=null;this.y=null;this.stage=null;this.frame=null;}
    update(stage,view,dt=1/60,axis=0,safe={}){
      const p=stage.player,w=view.width,h=view.height;
      const top=clamp(safe.top||20,0,h*.4),bottom=clamp(safe.bottom||24,0,h*.2);
      const left=clamp(safe.left||30,0,w*.3),right=clamp(safe.right||30,0,w*.3);
      const smooth=1-Math.exp(-9*Math.min(.1,Math.max(0,dt)));
      const reset=this.stage!==stage||this.x===null;
      this.stage=stage;
      const predicted=landing(stage,axis),usable=h-top-bottom;
      // Keep the world still inside a comfortable movement window. In particular,
      // a changing landing prediction or releasing the stick must not reframe it.
      const followWidth=w-left-right,forward=stage.kind==='move';
      // A forward run opens at the left edge of its follow window so players
      // can see the next stairs immediately. Vertical stages open centered.
      const startX=left+followWidth*(forward ? .14 : .28),endX=w-right-followWidth*.28;
      const startY=top+Math.min(8,usable*.025),endY=h-bottom-8;
      let targetX=reset?p.x+p.w/2-(forward?startX:w/2):this.x;
      let targetY=reset?p.y+p.h-endY:this.y;
      if(!reset){
        const x=p.x+p.w/2-this.x,y=p.y-this.y,feet=y+p.h;
        if(x<startX)targetX-=startX-x;
        else if(x>endX)targetX+=x-endX;
        if(y<startY)targetY-=startY-y;
        else if(feet>endY)targetY+=feet-endY;
      }
      const minX=-w*.4,maxX=Math.max(minX,stage.width+w*.4-w);
      const minY=Math.min(-h*.55,p.y-top-20),maxY=Math.max(stage.height-h+h*.2,p.y+p.h+bottom-h);
      targetX=clamp(targetX,minX,maxX);targetY=clamp(targetY,minY,maxY);
      this.x=reset?targetX:this.x+(targetX-this.x)*smooth;
      this.y=reset?targetY:this.y+(targetY-this.y)*smooth;
      // A smoothing lag must never hide the actor, including double jumps above y=0.
      this.x=clamp(this.x,p.x+p.w+right-w,p.x-left);
      this.y=clamp(this.y,p.y+p.h+bottom-h,p.y-top);
      this.frame={x:this.x,y:this.y,width:w,height:h,landing:predicted};
      return this.frame;
    }
  }
  return{boardView,viewSize,landing,Camera};
});
