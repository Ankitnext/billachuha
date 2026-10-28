/* Cat Chase simulation. Shared by the browser and Node tests; no DOM or timers. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.CatChase=api;})(globalThis,()=>{
 'use strict';
 const DT=1/60,GRAVITY=1800,JUMP=660,SPEED=250;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 const int=(v,max=1000000)=>Number.isFinite(v)?clamp(Math.floor(v),0,max):0;
 const TRAPS={
  crumble:{name:'Crumbling floor',hint:'Cracks mean trouble. Jump the floor before it drops away.'},
  spikes:{name:'Popup spikes',hint:'Jump the marked spikes, or wait for the safe interval.'},
  drop:{name:'Falling crate',hint:'Watch the ceiling arrow. Let the crate fall and retract.'},
  ceiling:{name:'Ceiling slam',hint:'The whole ceiling drops. Wait beside the striped danger zone, then run underneath as it rises.'},
  shift:{name:'Shifting ground',hint:'This floor slides sideways and carries you. Ride it, or jump the opening it leaves behind.'},
  lift:{name:'Elevator floor',hint:'The ground rises and falls. Jump onto it, ride up, and choose your landing.'},
  crusher:{name:'Floor crusher',hint:'The piston shoots up from below. Wait for it to retract, then cross the hatch.'},
  pendulum:{name:'Swinging wrecking ball',hint:'Watch the swing. Run underneath while the ball is high, or time a jump past it.'},
  gate:{name:'Timed shutter',hint:'The shutter closes from above. Run underneath while it is open; jumping into it is dangerous.'},
  belt:{name:'Conveyor belt',hint:'The belt really moves your paws. Watch the arrows and jump to break free.'},
  wall:{name:'Sliding wall',hint:'Jump over the sliding wall. Pounce cannot pass through solid obstacles.'},
  spring:{name:'Spring pad',hint:'The spring launches you higher. Steer toward a safe landing.'},
  fake:{name:'Fake exit',hint:'The Rat enjoys a joke. Keep following the real Rat.'}
 };
 const WORLDS=[
  {name:'Kitchen',theme:'kitchen',tag:'The hunter has entered the kitchen.'},
  {name:'Garden',theme:'garden',tag:'Even the flowerbeds have a few tricks.'},
  {name:'Rooftop',theme:'rooftop',tag:'One wrong step above the city.'},
  {name:'Sewer',theme:'sewer',tag:'Mind the gaps. And the grates.'},
  {name:'Inferno',theme:'inferno',tag:'The last chase is the hottest.'}
 ];
 const NAMES=[
  ['Cat on the case','The floor lies','The ceiling drops','The floor has legs','Pendulum pantry','Up from below','Closing time','Up the cupboards','Going up?','Kitchen machinery'],
  ['Against the belt','Loose paving','The swinging pot','Potting lift','Garden conveyor','The greenhouse gate','Groundskeeper’s piston','Up the trellis','Sideways shortcut','Garden gauntlet'],
  ['Loose rooftop cargo','Rolling shutter','Chimney crusher','A roof on rails','Above the wrecking ball','Falling roofline','Skyline conveyor','Above the skyline','Rooftop elevator','Midnight machines'],
  ['Upstream conveyor','Sinking ceiling','Closing pipe','Pressure elevator','Hydraulic surprise','The drain gate','Swinging valve','Up the drain','Pipe conveyor','Sewer surprise'],
  ['Furnace shutter','The wrong conveyor','Falling furnace','Ash on rails','Swing of fire','Boiling piston','The final gate','Out of the chimney','Out of the furnace','The final chase']
 ];
 const HINTS=['A/D or arrows moves. W, Up or Space jumps. Catch the Rat before it escapes.',
  'Cracks mean trouble. Jump the marked floor before it drops away.',
  'Spikes pop after a warning. Jump over them or wait for them to retract.',
  'Watch the ceiling marker. Let the block fall, then pass when it retracts.',
  'The ledge moves over a real gap. Jump across, or use it as a stepping stone.',
  'Jump over the sliding wall. Pounce will not pass through solid obstacles.',
  'The spring launches you higher. Steer in the air and watch the landing.',
  'The Rat is taking the high route. Jump up the shelves to follow.',
  'Two gaps and one dishonest floor. Keep an eye on your landing.',
  'Final chase of this world. Use what you learned, and pounce when you get close.'];
 const LEVELS=[];
 for(let world=0;world<5;world++)for(let n=0;n<10;n++){
  const width=(n===9?2300:n===7?1740:1510+n*35)+world*75;
  const l={index:world*10+n,id:`${world+1}-${n+1}`,world,number:n+1,name:NAMES[world][n],theme:WORLDS[world].theme,width,height:480,ground:400,variant:n,boss:n===9,spawn:{x:64,y:352},ratSpawn:{x:294,y:368},door:{x:width-72,y:330,w:38,h:70},platforms:[],gaps:[],traps:[],bells:[],waypoints:[],hint:HINTS[n],parMs:Math.round(((width-180)/SPEED+3.8)*1000),ratSpeed:208+world*2,ratWait:5.5,warning:Math.max(.34,.65-world*.065)};
  const gap=(x,w)=>l.gaps.push({x,w}),trap=(type,x,extra={})=>l.traps.push({type,x,y:400,w:{crumble:100,spikes:66,ceiling:180,shift:120,lift:120,crusher:70,gate:44,belt:170,pendulum:48}[type]||56,h:type==='ceiling'?34:28,...extra});
  const primary=[['gap','crumble','ceiling','shift','pendulum','crusher','gate','shelves','lift','mix'],['belt','shift','pendulum','lift','belt','gate','crusher','shelves','shift','mix'],['drop','gate','crusher','shift','pendulum','ceiling','belt','shelves','lift','mix'],['belt','ceiling','gate','lift','crusher','gate','pendulum','shelves','belt','mix'],['gate','belt','ceiling','shift','pendulum','crusher','gate','shelves','lift','mix']][world][n];
  l.challenge=primary;
  if(n===0){gap(560+world*25,90+world*5);if(world)trap(primary,world===2?400:380,{...(primary==='drop'?{w:66,h:64}:{}),direction:world%2?-1:1});}
  if(n===1){trap(primary,490+world*12,{direction:-1});gap(1050,90);}
  if(n===2){trap(primary,510+world*12);gap(1080,100);}
  if(n===3){trap(primary,510+world*12);gap(1110,90);}
  if(n===4){trap(primary,560+world*12,{direction:world%2?-1:1});gap(970,125);l.platforms.push({x:955,y:320,w:145,h:16,solid:false,moving:true,origin:955});}
  if(n===5){trap(primary,510+world*12);trap('wall',1100,{w:36,h:72});}
  if(n===6){trap(primary,490+world*12);trap('spring',850);gap(1070,120);}
  if(n===7){for(const [x,y,w]of [[430,320,220],[610,240,230],[790,160,290],[1000,160,width-1000]])l.platforms.push({x,y,w,h:18,solid:false});l.waypoints=[{x:520,y:320},{x:700,y:240},{x:900,y:160},{x:width-90,y:160}];l.door.y=90;}
  if(n===7){trap('belt',1100,{y:160,direction:world%2?-1:1});if(world>1)trap('spikes',1390,{y:160});}
  if(n===8){trap(primary,510+world*12,{direction:-1});gap(1180,105);trap('fake',width-230);if(world>0)trap('spikes',930);}
  if(n===9){trap('ceiling',410,{w:180+world*6});trap('shift',760,{direction:world%2?-1:1});trap('pendulum',1120);trap('gate',1540);trap('crusher',1840);trap('spikes',2100);}
  let left=0;for(const g of l.gaps){l.platforms.push({x:left,y:400,w:g.x-left,h:80,solid:true});left=g.x+g.w;}l.platforms.push({x:left,y:400,w:width-left,h:80,solid:true});
  // Sliding/elevator floors are real moving pieces, leaving real holes behind.
  for(const t of l.traps.filter(t=>['crumble','shift','lift'].includes(t.type))){
   const p=l.platforms.find(p=>p.y===400&&p.x<=t.x&&p.x+p.w>=t.x+t.w);if(!p)continue;
   const middle={...p,x:t.x,w:t.w};if(t.type==='crumble')middle.crumble=l.traps.indexOf(t);else Object.assign(middle,{floorTrap:l.traps.indexOf(t),moving:true,origin:t.x,originY:400,h:20});
   l.platforms.splice(l.platforms.indexOf(p),1,{...p,w:t.x-p.x},middle,{...p,x:t.x+t.w,w:p.x+p.w-t.x-t.w});
  }
  l.platforms=l.platforms.filter(p=>p.w>0);
  for(let b=0;b<3;b++){const x=Math.round(width*(.24+b*.22));l.bells.push({x,y:n===7?(b===0?280:b===1?120:120):355,w:18,h:22});}
  l.hint=TRAPS[primary]?.hint||HINTS[n];l.baitX=n===7?1160:Math.round(width*.64);l.baitTime=n===9?.3:.65;
  l.ratWait=n===9?9:7;l.parMs+=l.traps.reduce((s,t)=>s+(['ceiling','gate','crusher'].includes(t.type)?2200:0),0);
  LEVELS.push(l);
 }
 function loadLevel(index){if(!Number.isInteger(index)||!LEVELS[index])throw new RangeError('Unknown Cat Chase stage');const l=JSON.parse(JSON.stringify(LEVELS[index]));l.traps.forEach(t=>Object.assign(t,{state:'idle',timer:0,age:0,motion:0,offset:0,rise:0,blockY:t.y-285,gateBottom:t.y-175,ballX:t.x+t.w/2,ballY:t.y-52}));l.bells.forEach(b=>b.taken=false);return l;}
 function actor(x,y,rat=false){return{x,y,w:rat?24:34,h:rat?32:48,vx:0,vy:0,face:1,grounded:true,standing:null,coyote:.1,jumpBuffer:0,prevJump:false,pounce:0,cooldown:0,waypoint:0,stunned:false,state:rat?'running':'chasing'};}
 function trapBox(t){
  if(t.type==='wall'&&t.state!=='idle')return{x:t.x+t.offset,y:t.y-t.h,w:t.w,h:t.h,solid:true};
  if(['drop','ceiling'].includes(t.type)&&['falling','down','rising'].includes(t.state))return{x:t.x,y:t.blockY,w:t.w,h:t.h,solid:true};
  if(t.type==='gate')return{x:t.x,y:t.y-290,w:t.w,h:Math.max(0,t.gateBottom-(t.y-290)),solid:true};
  if(t.type==='crusher'&&t.rise>0)return{x:t.x,y:t.y-t.rise,w:t.w,h:t.rise,solid:true};
  return null;
 }
 function platforms(game){const a=game.level.platforms.filter(p=>p.crumble===undefined||game.level.traps[p.crumble].state!=='open');for(const t of game.level.traps){const b=trapBox(t);if(b)a.push(b);}return a;}
 function updatePlatforms(game){for(const p of game.level.platforms)if(p.moving){const oldX=p.x,oldY=p.y;if(p.floorTrap!==undefined){const t=game.level.traps[p.floorTrap];p.x=p.origin+(t.type==='shift'?t.offset:0);p.y=p.originY-(t.type==='lift'?t.rise:0);}else p.x=p.origin+Math.sin(game.elapsed*1.7)*48;p.dx=p.x-oldX;p.dy=p.y-oldY;}}
 function move(p,input,l,tiles,speed=SPEED){
  const was=p.grounded,oldX=p.x;
  if(p.grounded&&p.standing?.moving){p.x+=p.standing.dx||0;p.y+=p.standing.dy||0;}
  if(p.grounded)for(const t of l.traps)if(t.type==='belt'&&t.state==='active'&&Math.abs(p.y+p.h-t.y)<3&&p.x+p.w>t.x&&p.x<t.x+t.w)p.x+=(t.direction||1)*95*DT;
  const oldBottom=p.y+p.h;
  const axis=clamp(Number(input.x)||0,-1,1);if(axis)p.face=Math.sign(axis);
  p.vx+=clamp(axis*speed-p.vx,-2600*DT,2600*DT);
  if(input.jump&&!p.prevJump)p.jumpBuffer=.12;else p.jumpBuffer=Math.max(0,p.jumpBuffer-DT);p.prevJump=!!input.jump;p.coyote=p.grounded?.1:Math.max(0,p.coyote-DT);
  let jumped=false;if(p.jumpBuffer>0&&p.coyote>0){p.vy=-JUMP;p.grounded=false;p.jumpBuffer=0;p.coyote=0;jumped=true;}
  p.x=clamp(p.x+p.vx*DT,0,l.width-p.w);
  const direction=Math.sign(p.x-oldX);for(const t of tiles)if(t.solid&&overlap(p,t)){if(direction>0)p.x=t.x-p.w;else if(direction<0)p.x=t.x+t.w;p.vx=0;}
  const oldTop=p.y;p.vy=Math.min(640,p.vy+GRAVITY*DT);p.y+=p.vy*DT;p.grounded=false;p.standing=null;
  if(p.vy>=0){let best=null;for(const t of tiles)if(p.x+p.w>t.x&&p.x<t.x+t.w&&oldBottom<=t.y+2&&p.y+p.h>=t.y&&(!best||t.y<best.y))best=t;if(best){p.y=best.y-p.h;p.vy=0;p.grounded=true;p.standing=best;p.coyote=.1;}}
  else for(const t of tiles)if(t.solid&&p.x+p.w>t.x&&p.x<t.x+t.w&&oldTop>=t.y+t.h-1&&p.y<t.y+t.h){p.y=t.y+t.h;p.vy=0;break;}
  return{jumped,landed:!was&&p.grounded,moved:p.x-oldX};
 }
 function ratInput(game){
  const p=game.rat,l=game.level;let x=1,jump=false;
  if(p.wait>0){p.wait-=DT;return{x:0};}
  if(!p.baited&&p.x>=l.baitX&&p.grounded){p.baited=true;p.wait=l.baitTime;return{x:0};}
  if(p.x>=l.door.x-15&&Math.abs(p.y+p.h-(l.door.y+l.door.h))<45){p.state='taunting';p.exitTime=(p.exitTime||0)+DT;return{x:0};}
  if(l.waypoints.length){
   while(p.waypoint<l.waypoints.length-1&&p.grounded&&Math.abs(p.y+p.h-l.waypoints[p.waypoint].y)<3)p.waypoint++;
   const t=l.waypoints[p.waypoint];jump=p.grounded&&p.y+p.h>t.y+3&&p.x+p.w>=t.x-112;
   if(!p.grounded&&p.x>t.x+26&&p.y+p.h<t.y+6)x=-.35;
  }else jump=p.grounded&&l.gaps.some(g=>p.x<g.x+g.w&&p.x+p.w>=g.x-22);
  for(const t of l.traps){
   if(Math.abs(p.y+p.h-t.y)>45)continue;
   if((['crumble','shift','lift'].includes(t.type)||t.type==='spikes'&&t.state==='active')&&p.grounded&&p.x<t.x+t.w&&p.x+p.w>=t.x-16)jump=true;
   if(t.type==='wall'&&t.state!=='idle'&&p.grounded&&p.x<t.x+t.offset+t.w&&p.x+p.w>=t.x+t.offset-55)jump=true;
   if(['drop','ceiling'].includes(t.type)&&['falling','down','rising'].includes(t.state)&&p.x+p.w<t.x&&t.x-p.x-p.w<130)x=0;
   if(t.type==='gate'&&['closing','closed'].includes(t.state)&&p.x+p.w<t.x&&t.x-p.x-p.w<100)x=0;
   if(t.type==='crusher'&&t.rise>5&&p.x+p.w<t.x&&t.x-p.x-p.w<100)x=0;
   if(t.type==='pendulum'&&t.state==='active'&&p.grounded&&t.ballX>p.x&&t.ballX-p.x-p.w<95&&t.ballY+22>p.y)jump=true;
  }
  return{x,jump};
 }
 function updateTraps(game){
  const l=game.level,p=game.player,foot=p.y+p.h;
  for(const t of l.traps){t.age+=DT;const reach=['drop','ceiling','gate','pendulum'].includes(t.type)?245:150,near=p.x+p.w>t.x-reach&&p.x<t.x+t.w+70&&Math.abs(foot-t.y)<160;
   if(t.state==='idle'&&near){t.state='warning';t.timer=t.type==='crumble'?.48:Math.max(l.warning,['ceiling','gate','crusher'].includes(t.type)?.65:0);game.emit('warning',{trap:t.type});game.message=TRAPS[t.type].hint;}
   if(t.state==='warning'){t.timer-=DT;if(t.timer<=0){t.state=t.type==='crumble'?'open':['drop','ceiling'].includes(t.type)?'falling':t.type==='gate'?'closing':t.type==='crusher'?'rising':'active';t.timer=t.type==='crumble'?2.2:t.type==='spikes'?1.05:0;t.blockY=t.y-(t.type==='drop'?320:285);t.vy=0;t.motion=0;}}
   if(t.type==='crumble'&&t.state==='open'){t.timer-=DT;if(t.timer<=0)t.state='spent';}
   if(t.type==='spikes'&&t.state==='active'){t.timer-=DT;if(t.timer<=0){t.state='safe';t.timer=1.1;}else if(overlap(p,{x:t.x+5,y:t.y-25,w:t.w-10,h:25}))game.fail('Spikes! Jump the warning or wait for the safe gap.');}
   else if(t.type==='spikes'&&t.state==='safe'){t.timer-=DT;if(t.timer<=0){t.state='active';t.timer=1.05;}}
   if(['drop','ceiling'].includes(t.type)){
    if(t.state==='falling'){t.vy+=1100*DT;t.blockY=Math.min(t.y-t.h,t.blockY+t.vy*DT);if(t.blockY===t.y-t.h){t.state='down';t.timer=.65;game.emit('impact',{trap:t.type});}}
    else if(t.state==='down'){t.timer-=DT;if(t.timer<=0)t.state='rising';}
    else if(t.state==='rising'){t.blockY-=330*DT;if(t.blockY<=t.y-(t.type==='drop'?320:285))t.state='spent';}
   }
   if(t.type==='gate'){
    if(t.state==='closing'){t.gateBottom=Math.min(t.y,t.gateBottom+315*DT);if(t.gateBottom>=t.y){t.state='closed';t.timer=.8;game.emit('impact',{trap:t.type});}}
    else if(t.state==='closed'){t.timer-=DT;if(t.timer<=0)t.state='opening';}
    else if(t.state==='opening'){t.gateBottom=Math.max(t.y-175,t.gateBottom-315*DT);if(t.gateBottom<=t.y-175){t.state='open';t.timer=1.5;}}
    else if(t.state==='open'){t.timer-=DT;if(t.timer<=0){t.state='warning';t.timer=.65;game.emit('warning',{trap:t.type});}}
   }
   if(t.type==='crusher'){
    if(t.state==='rising'){t.rise=Math.min(132,t.rise+440*DT);if(t.rise>=132){t.state='up';t.timer=.6;game.emit('impact',{trap:t.type});}}
    else if(t.state==='up'){t.timer-=DT;if(t.timer<=0)t.state='retracting';}
    else if(t.state==='retracting'){t.rise=Math.max(0,t.rise-300*DT);if(t.rise<=0){t.state='safe';t.timer=1.5;}}
    else if(t.state==='safe'){t.timer-=DT;if(t.timer<=0){t.state='warning';t.timer=.65;game.emit('warning',{trap:t.type});}}
   }
   if(['shift','lift','pendulum'].includes(t.type)&&t.state==='active'){
    t.motion+=DT;
    if(t.type==='shift')t.offset=Math.sin(t.motion*1.65)*68*(t.direction||1);
    if(t.type==='lift')t.rise=(1-Math.cos(t.motion*1.65))*.5*90;
    if(t.type==='pendulum'){const angle=Math.sin(t.motion*1.35+.75)*.75;t.ballX=t.x+t.w/2+Math.sin(angle)*200;t.ballY=t.y-252+Math.cos(angle)*200;}
   }
   if(t.type==='wall'&&['active','warning'].includes(t.state))t.offset=Math.sin(t.age*2.3)*55;
   if(t.type==='spring'&&t.state!=='idle'&&p.grounded&&overlap(p,{x:t.x,y:t.y-6,w:t.w,h:12})){p.vy=-810;p.grounded=false;game.emit('spring');game.message='Boing! Steer toward your landing.';}
   if(t.type==='fake'&&t.state==='active'&&p.x+p.w>t.x){t.state='spent';game.message='Nice try, Rat. The real exit is farther ahead.';game.emit('trick');}
   if(game.phase==='failed')return;
  }
  checkHazards(game);
 }
 function checkHazards(game){if(game.phase!=='playing')return;const p=game.player;
  for(const t of game.level.traps){let hit=false;
   if(t.type==='spikes'&&t.state==='active')hit=overlap(p,{x:t.x+5,y:t.y-25,w:t.w-10,h:25});
   if(['drop','ceiling'].includes(t.type)&&['falling','down','rising'].includes(t.state))hit=overlap(p,trapBox(t));
   if(t.type==='crusher'&&t.rise>3||t.type==='gate'&&t.gateBottom>p.y+1)hit=overlap(p,trapBox(t));
   if(t.type==='pendulum'&&t.state==='active'){const x=clamp(t.ballX,p.x,p.x+p.w),y=clamp(t.ballY,p.y,p.y+p.h);hit=(x-t.ballX)**2+(y-t.ballY)**2<18**2;}
   if(hit){game.fail({ceiling:'Ceiling slam! Wait beside the striped zone before crossing.',drop:'Bonk! Let the falling block pass first.',gate:'The shutter closed! Run through its open window.',crusher:'Up from below! Wait for the piston to retract.',pendulum:'Bonk! Watch the swing before you cross.',spikes:'Spikes! Jump the warning or wait for the safe gap.'}[t.type]);return;}
  }
 }
 function starsFor(time,par,bells,retries){return bells===3||time<=par&&retries===0?3:retries<=2?2:1;}
 class ChaseGame{
  constructor(index=0){this.index=index;this.retries=0;this.attempt=0;this.events=[];this.reset();}
  reset(){this.level=loadLevel(this.index);const l=this.level;this.player=actor(l.spawn.x,l.spawn.y);this.rat=actor(l.ratSpawn.x,l.ratSpawn.y,true);this.phase='ready';this.elapsed=0;this.frame=0;this.bells=0;this.pounces=0;this.prevPounce=false;this.failTime=0;this.result=null;this.message=l.hint;this.attempt++;}
  emit(type,data={}){if(this.events.length<32)this.events.push({type,...data});}
  fail(message){if(this.phase!=='playing')return;this.phase='failed';this.message=message;this.retries++;this.failTime=.42;this.player.state='stunned';this.emit('fail');}
  win(){if(this.phase!=='playing')return;this.phase='won';this.rat.state='caught';this.player.state='winner';this.result={time:Math.max(1,Math.round(this.elapsed*1000)),bells:this.bells,retries:this.retries,pounces:this.pounces};this.result.stars=starsFor(this.result.time,this.level.parMs,this.bells,this.retries);this.message='Caught you! The chase is yours.';this.emit('win');}
  step(input={}){
   if(this.phase==='won')return;
   if(this.phase==='failed'){this.failTime-=DT;if(this.failTime<=0){this.reset();this.prevPounce=!!input.pounce;this.player.prevJump=!!input.jump;this.emit('retry');}return;}
   if(this.phase==='ready'){if(!input.x&&!input.jump&&!input.pounce)return;this.phase='playing';this.emit('start');}
   this.elapsed+=DT;this.frame++;const p=this.player,l=this.level;
   updateTraps(this);if(this.phase!=='playing')return;
   updatePlatforms(this);
   p.cooldown=Math.max(0,p.cooldown-DT);p.pounce=Math.max(0,p.pounce-DT);
   if(input.pounce&&!this.prevPounce&&p.cooldown<=0){p.pounce=.19;p.cooldown=1.35;p.dashFace=input.x?Math.sign(input.x):p.face;p.vx=p.dashFace*490;this.pounces++;this.emit('pounce');}
   this.prevPounce=!!input.pounce;
   const motion=move(p,{x:p.pounce>0?p.dashFace:input.x,jump:input.jump},l,platforms(this),p.pounce>0?490:SPEED);
   if(motion.jumped)this.emit('jump');if(motion.landed)this.emit('land');
   move(this.rat,ratInput(this),l,platforms(this,true),l.ratSpeed);
   checkHazards(this);if(this.phase!=='playing')return;
   for(const b of l.bells)if(!b.taken&&overlap(p,b)){b.taken=true;this.bells++;this.emit('bell');}
   if(p.y>l.height+35){this.fail(l.theme==='inferno'?'Too hot down there. Jump the gap.':'Missed that landing. One more try.');return;}
   if(this.rat.y>l.height+70){this.fail('The Rat took a shortcut. Try the chase again.');return;}
   if(overlap(p,this.rat)){this.win();return;}
   if((this.rat.exitTime||0)>l.ratWait){this.fail('The Rat escaped! Try a quicker route or use your pounce.');return;}
   if(this.rat.state==='taunting')this.message=`The Rat is at the exit. ${Math.max(0,Math.ceil(l.ratWait-this.rat.exitTime))}s to catch it!`;
  }
 }
 class ChaseSave{
  constructor(raw={}){this.stars={};this.bestTimes={};this.bestBells={};this.retries=int(raw?.retries);for(const l of LEVELS){const s=int(raw?.stars?.[l.id],3);if(s){this.stars[l.id]=s;const t=int(raw?.bestTimes?.[l.id],3600000);if(t)this.bestTimes[l.id]=t;this.bestBells[l.id]=int(raw?.bestBells?.[l.id],3);}}}
  get totalStars(){return Object.values(this.stars).reduce((a,b)=>a+b,0);}
  unlocked(index){return Number.isInteger(index)&&!!LEVELS[index]&&(index===0||this.stars[LEVELS[index-1].id]>0);}
  next(){for(let i=0;i<50;i++)if(this.unlocked(i)&&!this.stars[LEVELS[i].id])return i;return 49;}
  complete(index,result){if(!this.unlocked(index)||!Number.isFinite(result?.time)||result.time<1||![1,2,3].includes(result.stars))return false;const id=LEVELS[index].id;this.stars[id]=Math.max(this.stars[id]||0,result.stars);this.bestTimes[id]=Math.min(this.bestTimes[id]||Infinity,int(result.time,3600000));this.bestBells[id]=Math.max(this.bestBells[id]||0,int(result.bells,3));return true;}
 }
 return{DT,GRAVITY,JUMP,SPEED,TRAPS,WORLDS,LEVELS,clamp,overlap,loadLevel,actor,platforms,trapBox,updatePlatforms,checkHazards,move,ratInput,updateTraps,starsFor,ChaseGame,ChaseSave};
});
