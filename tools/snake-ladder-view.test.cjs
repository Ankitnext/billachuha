const test=require('node:test'),assert=require('node:assert/strict');
const {Stage}=require('../snake-ladder-core.js');
const View=require('../snake-ladder-view.js');

test('zoomed board keeps the active cell on screen, including edge cells',()=>{
  for(const [w,h]of [[326,220],[590,270],[390,460]])for(const cell of [1,10,11,20,50,91,100]){
    const fit=View.boardView(w,h,1,cell),focus=View.boardView(w,h,2,cell);
    assert.equal(focus.scale,fit.scale*2);
    const x=focus.x+focus.point.x*focus.scale,y=focus.y+focus.point.y*focus.scale;
    assert.ok(x>=0&&x<=w&&y>=0&&y<=h,`${cell}: ${x},${y}`);
    const overview=View.boardView(w,h,1,cell);
    assert.ok(overview.x>=-.01&&overview.y>=-.01&&overview.x+760*overview.scale<=w+.01&&overview.y+760*overview.scale<=h+.01);
  }
});

test('camera keeps real move, ladder, falling and boss actors in view throughout jumps and reversals',()=>{
  for(const kind of ['move','ladder','snake','boss'])for(const role of ['rat','cat','dog'])for(const [width,height]of [[568,320],[844,390],[390,844]]){
    const s=new Stage(kind,{role,steps:7,seed:8}),camera=new View.Camera(),size=View.viewSize(width,height,kind);
    s.enemies=[];s.bombAt=999;s.hazards=[];
    const safe={top:100*size.height/height,bottom:24*size.height/height,left:size.width*.16,right:size.width*.16};
    for(let i=0;i<240&&!s.done;i++){
      const x=i<120?1:-1;
      s.update({x,jump:i===1||i===22||i===100},1/60);
      const c=camera.update(s,size,1/60,x,safe),p=s.player;
      assert.ok(p.x-c.x>=safe.left-1&&p.x+p.w-c.x<=c.width-safe.right+1,`${kind}/${role}: horizontal`);
      assert.ok(p.y-c.y>=safe.top-1&&p.y+p.h-c.y<=c.height-safe.bottom+1,`${kind}/${role}: vertical`);
    }
  }
});

test('a double jump above the level top stays visible and changing facing alone never snaps the camera',()=>{
  const s=new Stage('ladder',{role:'rat'}),camera=new View.Camera(),size=View.viewSize(568,320,'ladder');
  s.player.x=250;s.player.y=5;s.player.standing=null;s.player.vy=-750;
  const a=camera.update(s,size,1/60,0,{top:150});
  assert.ok(a.y<0);assert.ok(s.player.y-a.y>=150);
  s.player.face=-1;
  const b=camera.update(s,size,1/60,0,{top:150});
  assert.ok(Math.abs(a.x-b.x)<1,'Facing changes without movement keep the same framing');
});

test('normal jumps keep the world steady instead of making the camera bob',()=>{
  const s=new Stage('move',{role:'rat',steps:7,seed:8}),camera=new View.Camera();
  const size=View.viewSize(568,320,'move'),safe={top:150,bottom:40,left:150,right:150};
  s.enemies=[];s.bombAt=999;
  const initial=camera.update(s,size,1/60,0,safe);
  let airborne=false;
  for(let i=0;i<110;i++){
    s.update({jump:i===1||i===22},1/60);
    airborne||=s.player.standing===null;
    const c=camera.update(s,size,1/60,0,safe);
    assert.ok(Math.abs(c.x-initial.x)<.01&&Math.abs(c.y-initial.y)<.01,'A jump that fits the screen does not move the camera');
  }
  assert.ok(airborne);assert.equal(s.player.standing,0);
});

test('steering previews and velocity changes cannot pull the camera away from a stationary player',()=>{
  const s=new Stage('move',{role:'rat',steps:7,seed:8}),camera=new View.Camera();
  const size=View.viewSize(844,390,'move');
  Object.assign(s.player,{x:400,y:330,vy:50,standing:null});
  const initial=camera.update(s,size,1/60,0);
  const previews=new Set();
  for(let i=0;i<120;i++){
    const axis=i%3-1;s.player.face=axis||1;s.player.vx=axis*120;
    const c=camera.update(s,size,1/60,axis);
    previews.add(c.landing?`${c.landing.platform}:${Math.round(c.landing.x)}`:'none');
    assert.ok(Math.abs(c.x-initial.x)<.01&&Math.abs(c.y-initial.y)<.01,'Prediction changes do not move the world');
  }
  assert.ok(previews.size>1,'The test actually changes the projected landing');
});

test('landing preview matches an actual unsteered jump onto a stationary platform',()=>{
  const s=new Stage('boss',{role:'dog'});s.enemies=[];s.bombAt=999;
  s.update({jump:true},1/60);
  const predicted=View.landing(s,0);
  assert.ok(predicted&&predicted.path.length>2);
  for(let i=0;i<180&&s.player.standing===null;i++)s.update({},1/120);
  assert.equal(s.player.standing,predicted.platform);
  assert.ok(Math.abs(s.player.y+s.player.h-predicted.y)<1);
  assert.ok(Math.abs(s.player.x+s.player.w/2-predicted.x)<2);
});

test('steered landing previews track moving stair platforms without changing stage state',()=>{
  for(const seed of [1,15,62])for(const role of ['rat','cat','dog']){
    const s=new Stage('move',{role,steps:6,seed});s.enemies=[];s.bombAt=999;
    for(let i=0;i<10;i++)s.update({x:1},1/60);
    s.update({x:1,jump:true},1/60);
    const before=JSON.stringify(s),prediction=View.landing(s,1);
    assert.equal(JSON.stringify(s),before,'Preview must not advance the game');
    assert.ok(prediction);
    for(let i=0;i<240&&s.player.standing===null;i++)s.update({x:1},1/120);
    assert.equal(s.player.standing,prediction.platform);
    assert.ok(Math.abs(s.player.x+s.player.w/2-prediction.x)<10);
    assert.ok(Math.abs(s.player.y+s.player.h-prediction.y)<3);
  }
});
