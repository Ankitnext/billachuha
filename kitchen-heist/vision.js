((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  function rayRect(origin,dx,dy,wall,max){
    let near=0,far=max;
    for(const [p,d,min,maxValue]of [[origin.x,dx,wall.x,wall.x+wall.w],[origin.y,dy,wall.y,wall.y+wall.h]]){
      if(Math.abs(d)<1e-9){if(p<min||p>maxValue)return null;continue;}
      let a=(min-p)/d,b=(maxValue-p)/d;if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;
    }
    return near>=0&&near<=max?near:null;
  }
  function rayCircle(o,dx,dy,c,max){const x=o.x-c.x,y=o.y-c.y,b=x*dx+y*dy,d=b*b-(x*x+y*y-c.r*c.r);if(d<0)return null;const t=-b-Math.sqrt(d);if(x*x+y*y<c.r*c.r)return 0;return t>=0&&t<=max?t:null;}
  function castRay(origin,angle,maxDist,walls,smoke=[]){
    const dx=Math.cos(angle),dy=Math.sin(angle);let dist=maxDist,hitWall=false;
    for(const wall of walls){const t=rayRect(origin,dx,dy,wall,dist);if(t!==null){dist=t;hitWall=true;}}
    for(const cloud of smoke){const t=rayCircle(origin,dx,dy,cloud,dist);if(t!==null){dist=t;hitWall=true;}}
    return{x:origin.x+dx*dist,y:origin.y+dy*dist,dist,hitWall};
  }
  function canSee(source,target,level,smoke=[],range=source.range||K.RULES.vision,half=source.half||K.RULES.halfAngle){
    const d=K.distance(source,target),angle=Math.atan2(target.y-source.y,target.x-source.x);
    if(d>range||Math.abs(K.angleDelta(source.angle,angle))>half)return false;
    return castRay(source,angle,d,level.walls,smoke).dist>=d-.01;
  }
  function buildCone(source,level,smoke=[]){const half=source.half||K.RULES.halfAngle,range=source.range||K.RULES.vision,result=[{x:source.x,y:source.y}],steps=Math.ceil(half*2/(Math.PI/90));for(let i=0;i<=steps;i++)result.push(castRay(source,source.angle-half+half*2*i/steps,range,level.walls,smoke));return result;}
  function pointInCone(x,y,polygon){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
  function canDetectPlayer(source,player,level,smoke=[],range=source.range){return [[0,0],[-7,0],[7,0],[0,-7],[0,7]].some(([dx,dy])=>canSee(source,{x:player.x+dx,y:player.y+dy},level,smoke,range));}
  function checkDetection(player,guards,cameras,level,smoke=[]){const source=[...guards,...cameras].find(item=>canDetectPlayer(item,player,level,smoke,item.range*(guards.includes(item)&&player.paws>0?.7:1)));return{spotted:!!source,source:source||null};}
  return{castRay,buildCone,pointInCone,canSee,canDetectPlayer,checkDetection};
});
