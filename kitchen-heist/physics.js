((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist||={},api);})(globalThis,()=>{
  'use strict';
  const RULES=Object.freeze({tile:32,dt:1/60,ratSpeed:120,sprint:180,patrol:70,chase:150,vision:160,halfAngle:Math.PI/3,hearing:96,alert:1.5,search:5,lost:3,alarm:10,radius:10});
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const rect=(p,r=RULES.radius)=>({x:p.x-r,y:p.y-r,w:r*2,h:r*2});
  const walkable=(level,x,y,r=RULES.radius)=>x>=r&&y>=r&&x<=level.width*32-r&&y<=level.height*32-r&&!level.walls.some(w=>overlap(rect({x,y},r),w));
  function move(body,vx,vy,dt,level,r=RULES.radius){
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(vx),Math.abs(vy))*dt/6));
    for(let i=0;i<steps;i++){
      const x=body.x+vx*dt/steps;if(walkable(level,x,body.y,r))body.x=x;
      const y=body.y+vy*dt/steps;if(walkable(level,body.x,y,r))body.y=y;
    }
  }
  const cell=(p)=>({x:Math.floor(p.x/32),y:Math.floor(p.y/32)});
  const center=(p)=>({x:p.x*32+16,y:p.y*32+16});
  function pathfind(level,from,to,r=11){
    const start=cell(from),end=cell(to),key=p=>p.y*level.width+p.x;
    if(!walkable(level,to.x,to.y,r))return [];
    const queue=[start],parents=new Map([[key(start),null]]),scores=new Map([[key(start),0]]);
    while(queue.length){
      queue.sort((a,b)=>(scores.get(key(a))+Math.abs(a.x-end.x)+Math.abs(a.y-end.y))-(scores.get(key(b))+Math.abs(b.x-end.x)+Math.abs(b.y-end.y)));
      const node=queue.shift();if(key(node)===key(end)){
        const result=[];let current=node;
        while(parents.get(key(current))){result.unshift(center(current));current=parents.get(key(current));}
        result.push({...to});return result;
      }
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
        const next={x:node.x+dx,y:node.y+dy},pos=center(next),id=key(next),cost=scores.get(key(node))+1;
        if(!walkable(level,pos.x,pos.y,r)||cost>=(scores.get(id)??Infinity))continue;
        parents.set(id,node);scores.set(id,cost);if(!queue.some(p=>key(p)===id))queue.push(next);
      }
    }
    return [];
  }
  function travel(body,target,speed,dt,level){
    body.repath=(body.repath||0)-dt;
    if(body.repath<=0||!body.path||!body.target||distance(body.target,target)>20){body.path=pathfind(level,body,target);body.target={...target};body.repath=.4;}
    while(body.path?.length&&distance(body,body.path[0])<4)body.path.shift();
    const next=body.path?.[0];if(!next)return;
    const dx=next.x-body.x,dy=next.y-body.y,d=Math.hypot(dx,dy),step=Math.min(speed,d/Math.max(dt,.001));
    body.angle+=(angleDelta(body.angle,Math.atan2(dy,dx)))*Math.min(1,dt*8);
    move(body,dx/(d||1)*step,dy/(d||1)*step,dt,level,11);
  }
  return{RULES,clamp,distance,angleDelta,overlap,rect,walkable,move,cell,center,pathfind,travel};
});
