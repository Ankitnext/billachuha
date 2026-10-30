(() => {
 'use strict';const T=window.TrapEscape,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const THEMES={kitchen:{sky:'#e8eee2',far:'#cad9ce',floor:'#415d50',edge:'#b0c49b',ink:'#294b43',accent:'#e6ae55'},garden:{sky:'#e4edce',far:'#b6c990',floor:'#44684b',edge:'#a4c575',ink:'#335e49',accent:'#de9f71'},rooftop:{sky:'#253d53',far:'#375069',floor:'#3e5363',edge:'#9caeb4',ink:'#dbe6d9',accent:'#e7bb71'},sewer:{sky:'#273f3c',far:'#344d46',floor:'#42594a',edge:'#8aa68c',ink:'#d5e2bf',accent:'#b7d477'},inferno:{sky:'#523d39',far:'#69433a',floor:'#664739',edge:'#ce9867',ink:'#f5d6b0',accent:'#f0a465'}};
 const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const line=(c,points,color,width=3)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const label=(c,text,x,y,color='#294b43',size=11,align='center')=>{c.font=`800 ${size}px system-ui,sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);};
 function star(c,x,y,r,color){c.beginPath();for(let i=0;i<10;i++){let a=i*Math.PI/5-Math.PI/2,s=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*s,y+Math.sin(a)*s);}c.closePath();c.fillStyle=color;c.fill();}
 function trapIcon(c,type,x,y,size=28){
  if(T.MACHINERY?.[type]&&T.drawMachineIcon){T.drawMachineIcon(c,type,x,y,size);return;}
  c.save();c.translate(x,y);c.scale(size/28,size/28);c.lineJoin='round';
  if(type==='banana'){c.fillStyle='#edca58';c.beginPath();c.moveTo(-12,7);c.quadraticCurveTo(-7,3,-4,-10);c.quadraticCurveTo(3,4,13,4);c.quadraticCurveTo(6,12,0,5);c.quadraticCurveTo(-7,15,-12,7);c.fill();line(c,[[-4,-9],[-4,-13]],'#715d3e',3);}
  else if(type==='mousetrap'){c.fillStyle='#b78c60';c.fillRect(-13,-7,26,17);line(c,[[-9,4],[-9,-9],[9,-9],[9,4],[-9,4]],'#e1d9ba',2);circle(c,0,0,4,'#e6bb56');line(c,[[-5,4],[5,4]],'#53645a',3);}
  else if(type==='paint'||type==='bucket'){c.fillStyle=type==='paint'?'#87c8c9':'#a9bec0';c.beginPath();c.moveTo(-11,-8);c.lineTo(11,-8);c.lineTo(8,12);c.lineTo(-8,12);c.closePath();c.fill();line(c,[[-9,-7],[-8,-15],[8,-15],[9,-7]],'#597874',2);c.fillStyle=type==='paint'?'#dc8b75':'#d8e7d9';c.fillRect(-9,-7,18,4);if(type==='paint'){circle(c,2,0,4,'#df927d');line(c,[[5,0],[5,7]],'#df927d',3);}}
  else if(type==='magnet'){c.strokeStyle='#d57b6c';c.lineWidth=9;c.beginPath();c.moveTo(-8,-10);c.lineTo(-8,3);c.arc(0,3,8,Math.PI,0,true);c.lineTo(8,-10);c.stroke();line(c,[[-8,-10],[-8,-4]],'#dce6df',8);line(c,[[8,-10],[8,-4]],'#dce6df',8);}
  else if(type==='ice'){c.fillStyle='#a9d9e4';c.strokeStyle='#5b9cae';c.lineWidth=2;c.fillRect(-11,-11,22,22);c.strokeRect(-11,-11,22,22);line(c,[[-7,3],[3,-7]],'#edf8f0',3);line(c,[[1,7],[7,1]],'#edf8f0',2);}
  else if(type==='firecracker'){c.fillStyle='#cd6f5d';c.fillRect(-7,-10,14,22);c.fillStyle='#edbe64';c.fillRect(-7,-5,14,4);line(c,[[0,-10],[2,-15],[8,-17]],'#53604a',2);star(c,9,-18,5,'#f0b255');}
  else if(type==='sweep'){line(c,[[10,-15],[-5,5]],'#986d4e',4);c.fillStyle='#d1b46e';c.beginPath();c.moveTo(-8,0);c.lineTo(1,7);c.lineTo(-6,16);c.lineTo(-17,7);c.closePath();c.fill();line(c,[[-12,6],[-6,11]],'#8e784d',1);}
  else if(type==='spring'){line(c,[[-11,11],[11,11]],'#4a6559',4);line(c,[[-8,7],[8,3],[-8,-1],[8,-5],[-8,-9],[8,-13]],'#a3b57f',3);line(c,[[-12,-15],[12,-15]],'#d8dcae',4);}
  else if(type==='wire'){line(c,[[-13,9],[-7,2],[-1,7],[6,1],[12,6]],'#9fc9c1',3);line(c,[[-3,-12],[-8,-2],[0,-2],[-3,7],[8,-6],[1,-6],[5,-12]],'#f5d87a',2);}
  else if(type==='pit'){c.fillStyle='#263b33';c.fillRect(-14,2,28,10);c.fillStyle='#8f9c7c';c.save();c.rotate(-.5);c.fillRect(-14,-5,28,5);c.restore();}
  else if(type==='steam'){line(c,[[-11,11],[-11,-2],[8,-2]],'#aab8a3',9);line(c,[[8,-9],[12,-14],[7,-18]],'#e5e5cf',3);}
  c.restore();
 }
 function rat(c,p,time=0,hero=true){
  c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.face||1,1);
  const air=p.grounded===false,tuck=air?((p.vy||0)<0?8:4):0,reach=air?12:0;
  const run=p.grounded&&!reduced.matches?Math.sin(time*19)*Math.min(1,Math.abs(p.vx)/100):0,bounce=p.grounded?Math.abs(run)*1.5:0;
  c.translate(0,-bounce);line(c,[[-7,-14],[-17,-9],[-24,-12],[-25,-20]],'#7fabb2',3);
  line(c,[[-4,-13],[-6+run*7,-6-tuck],[-7+run*8,-1-tuck*.7]],'#558c9a',5);line(c,[[4,-13],[5-run*7,-6-tuck*.5],[8-run*8,-1-tuck]],'#79b0b8',5);
  c.fillStyle='#7badb5';c.beginPath();c.ellipse(0,-21,10,14,0,0,Math.PI*2);c.fill();
  const arm=p.dropPose>0?-11:run*6;
  line(c,[[-5,-28],[-11,-19+arm-reach],[-13,-17+arm-reach]],'#5d95a3',4);line(c,[[5,-28],[12,-24-arm-reach],[14,-22-arm-reach]],'#88b9bd',4);
  circle(c,-7,-40,7,'#83b4bc');circle(c,6,-41,7,'#8abcc1');circle(c,-7,-40,4,'#d69f9a');circle(c,6,-41,4,'#e4b0a4');
  c.fillStyle='#91c0c5';c.beginPath();c.ellipse(0,-32,12,10,0,0,Math.PI*2);c.fill();circle(c,11,-30,4,'#c9d9ca');circle(c,14,-30,2.3,'#375752');
  circle(c,4,-35,4,'#f8f1d6');circle(c,5,-35,1.8,'#263d36');line(c,[[3,-40],[8,-39]],'#496f6a',1.5);
  line(c,[[8,-27],[11,-27]],'#4c6f66',1);if(p.caught){circle(c,5,-35,3,'#294b43');circle(c,8,-26,3,'#294b43');}
  c.restore();if(hero)label(c,'YOU',p.x+p.w/2,p.y-15,'#355e51',10);
 }
 function cat(c,p,time=0){
  const type=p.active?.type,progress=p.active?1-p.active.remaining/p.active.duration:0,stunned=p.stunned||p.state==='defeated';
  c.save();c.translate(p.x+p.w/2,p.y+p.h);c.scale(p.face||1,1);
  if(type==='banana'||type==='ice'||type==='belt'){c.translate(0,-18);c.rotate(type==='banana'?-1.2*Math.sin(progress*Math.PI):-.9);}
  if(type==='ceiling')c.scale(1.2,.65);
  if(type==='pendulum')c.rotate(Math.sin(progress*Math.PI*2)*.9);
  if(type==='gate')c.scale(.8,1.05);
  if(type==='sweep')c.rotate(Math.sin(progress*Math.PI*2)*1.1);
  if(type==='spring')c.scale(.85,1.2);
  const air=!stunned&&(p.grounded===false||p.grounded===undefined&&Math.abs(p.vy)>30),tuck=air?9:0;
  const run=stunned||air||reduced.matches?0:Math.sin(time*20)*Math.min(1,Math.abs(p.vx)/80),hop=type==='mousetrap'?Math.abs(Math.sin(time*17))*12:0;c.translate(0,-hop);
  line(c,[[-9,-20],[-24,-18],[-30,-29],[-26,-38]],'#bd7655',7);
  line(c,[[-6,-16],[-8+run*9,-7-tuck],[-9+run*10,-2-tuck*.7]],'#bd7655',7);line(c,[[6,-16],[8-run*9,-8-tuck*.5],[11-run*10,-2-tuck]],'#dc9c69',7);
  c.fillStyle=type==='steam'?'#696b5b':'#d49362';c.beginPath();c.ellipse(0,-27,14,19,0,0,Math.PI*2);c.fill();c.fillStyle='#ead5a6';c.beginPath();c.ellipse(4,-24,7,11,0,0,Math.PI*2);c.fill();
  line(c,[[-8,-37],[-17,-27+run*7-tuck],[-15,-23+run*7-tuck]],'#b97956',6);line(c,[[9,-37],[20,-33-run*7-tuck],[20,-27-run*7-tuck]],'#dfa16c',6);
  c.fillStyle='#d89a69';c.beginPath();c.moveTo(-14,-48);c.lineTo(-12,-66);c.lineTo(-3,-56);c.lineTo(5,-57);c.lineTo(15,-65);c.lineTo(14,-46);c.fill();
  c.fillStyle='#e6bca0';c.beginPath();c.moveTo(-11,-54);c.lineTo(-11,-61);c.lineTo(-6,-55);c.moveTo(7,-55);c.lineTo(13,-61);c.lineTo(12,-53);c.fill();
  c.fillStyle=type==='steam'?'#717164':'#dfa16e';c.beginPath();c.ellipse(1,-47,17,13,0,0,Math.PI*2);c.fill();
  circle(c,10,-42,9,'#efe2bb');circle(c,16,-45,3,'#865c52');
  if(type==='paint'){c.fillStyle='#7cc5c4';c.beginPath();c.ellipse(2,-49,15,8,-.2,0,Math.PI*2);c.fill();}
  if(stunned){line(c,[[-5,-52],[1,-47],[-5,-47],[1,-52]],'#4c5949',1.8);line(c,[[7,-52],[12,-47],[7,-47],[12,-52]],'#4c5949',1.8);}
  else{circle(c,-2,-49,4.5,'#fff4d6');circle(c,8,-49,4.5,'#fff4d6');circle(c,0,-49,2,'#355447');circle(c,10,-49,2,'#355447');line(c,[[-6,-56],[2,-54]],'#685c43',2);line(c,[[5,-54],[13,-56]],'#685c43',2);}
  line(c,[[13,-39],[9,-37],[6,-39]],'#735e48',1.5);line(c,[[-1,-41],[-15,-42]],'#8f7857',1);line(c,[[0,-38],[-14,-35]],'#8f7857',1);
  if(type==='bucket')trapIcon(c,'bucket',3,-59,32);
  if(type==='magnet'){trapIcon(c,'magnet',26,-38,22);circle(c,-20,-34,4,'#a7c3b4');}
  if(type==='wire'){line(c,[[0,-54],[0,-16],[-13,-34],[14,-34],[-8,-2],[0,-16],[10,-2]],'#fff4c6',2);}
  if(type==='ice')trapIcon(c,'ice',16,-10,20);
  if(type==='firecracker'){circle(c,1,-66,6,'#bf795b');line(c,[[-14,-68],[-22,-77]],'#d7bc73',2);}
  if(type==='mousetrap')trapIcon(c,'mousetrap',10,-4,22);
  c.restore();
  if(stunned)for(let i=0;i<3;i++){const a=time*3+i*2.1;star(c,p.x+p.w/2+Math.cos(a)*27,p.y-16+Math.sin(a)*6,4,'#d5a348');}
  if(p.state==='defeated'){line(c,[[p.x-8,p.y],[p.x-8,p.y-28]],'#9fa98b',2);c.fillStyle='#f8eed2';c.fillRect(p.x-8,p.y-28,19,12);}
 }
 function backdrop(c,theme,w,h,camX,time){
  const a=THEMES[theme];c.fillStyle=a.sky;c.fillRect(0,0,w,h);c.save();c.translate(-camX*.18%260,0);
  for(let x=-260;x<w+520;x+=260){
   if(theme==='kitchen'){c.fillStyle=a.far;c.fillRect(x+20,20,200,h-55);c.fillStyle='#f4f0d7';c.fillRect(x+43,46,154,126);line(c,[[x+120,46],[x+120,172]],a.far,7);line(c,[[x+43,109],[x+197,109]],a.far,7);c.strokeStyle='#b9cbbf';c.lineWidth=1;c.strokeRect(x+20,204,200,h);circle(c,x+198,223,3,'#a5b5a2');}
   else if(theme==='garden'){circle(c,x+70,h-20,110,a.far);circle(c,x+180,h-10,90,'#c4d29c');line(c,[[x+80,110],[x+80,h]],'#9db880',9);circle(c,x+80,100,65,'#bad09d');}
   else if(theme==='rooftop'){c.fillStyle=a.far;c.fillRect(x+20,100,95,h);c.fillRect(x+130,160,100,h);c.fillStyle='#cdbb79';for(let j=0;j<4;j++)for(let k=0;k<2;k++)c.fillRect(x+38+k*40,123+j*50,12,16);circle(c,x+210,60,26,'#d9d9b5');}
   else if(theme==='sewer'){c.strokeStyle=a.far;c.lineWidth=30;c.beginPath();c.moveTo(x+25,h);c.lineTo(x+25,80);c.lineTo(x+210,80);c.stroke();line(c,[[x+120,80],[x+120,160]],'#799085',15);circle(c,x+120,166,4,'#adc5b4');}
   else{c.fillStyle=a.far;c.beginPath();c.moveTo(x,h);c.lineTo(x+80,60);c.lineTo(x+150,h);c.lineTo(x+215,150);c.lineTo(x+260,h);c.fill();circle(c,x+80,50+Math.sin(time+x)*8,3,'#d59066');}
  }c.restore();
 }
 function environment(c,e,time){
  const active=e.state==='armed'||e.state==='arming',used=e.used;
  c.globalAlpha=used?.4:1;
  if(e.type==='bucket'){line(c,[[e.x,e.y-112],[e.x,e.y-153],[e.triggerX,e.y-153],[e.triggerX,e.y-25]],'#9c9e7c',2);trapIcon(c,'bucket',e.x,e.y-112,29);}
  else trapIcon(c,e.type,e.x,e.y-17,32);
  line(c,[[e.triggerX-6,e.y],[e.triggerX-6,e.y-21],[e.triggerX+3,e.y-29]],active?'#bd7d58':'#718d74',3);circle(c,e.triggerX+3,e.y-29,4,active?'#e4b66e':'#b6ca95');
  if(!used)label(c,active?'ARMED':'RUN PAST →',e.triggerX,e.y-52,active?'#985b3f':'#577764',9);
  c.globalAlpha=1;
 }
 function drawScene(c,g,camX,camY,w,h,scale,time,effects){
  const l=g.level,a=THEMES[l.theme];backdrop(c,l.theme,w,h,camX,time);c.save();c.scale(scale,scale);c.translate(-camX,-camY);
  for(const e of l.environment)if(e.type==='shift'||e.type==='lift'){c.fillStyle='#213f32';c.fillRect(e.x,e.y,e.w,80);}
  for(const p of l.platforms){if(p.disabled||p.machineBlock!==undefined||p.x+p.w<camX-60||p.x>camX+w/scale+60)continue;c.fillStyle=a.floor;c.fillRect(p.x,p.y,p.w,p.h);c.fillStyle=a.edge;c.fillRect(p.x,p.y,p.w,7);c.strokeStyle=a.edge+'44';c.lineWidth=1;for(let x=Math.floor(p.x/40)*40;x<p.x+p.w;x+=40){if(x>=p.x){c.beginPath();c.moveTo(x,p.y+9);c.lineTo(x,p.y+p.h);c.stroke();}}}
  for(const gap of l.gaps){c.fillStyle=l.theme==='inferno'?'#c77b4d':'#1f3f35';c.fillRect(gap.x,400,gap.w,80);if(l.theme==='inferno'){c.fillStyle='#e8ac65';for(let x=gap.x+5;x<gap.x+gap.w;x+=20)circle(c,x,414+Math.sin(x+time*3)*4,6,'#e8ac65');}label(c,'JUMP ↗',gap.x-30,377,a.ink,10);for(let x=gap.x-30;x<gap.x-5;x+=9)line(c,[[x,394],[x+4,389],[x+8,394]],a.accent,2);}
  const door=l.door;c.fillStyle='#b2bf95';c.fillRect(door.x-6,door.y-6,door.w+12,door.h+6);c.fillStyle=g.level.boss?'#96775a':'#759f7f';c.beginPath();c.roundRect(door.x,door.y,door.w,door.h,[20,20,0,0]);c.fill();circle(c,door.x+31,door.y+44,3,'#f0d69c');label(c,l.boss?'4 TRAPS':'EXIT',door.x+20,door.y-17,a.ink,11);if(l.boss)label(c,'+ 2× CHAIN',door.x+20,door.y-32,a.ink,9);
  for(const p of l.pickups)if(!p.taken){circle(c,p.x+12,p.y+12,22,'#f4eed7aa');trapIcon(c,p.type,p.x+12,p.y+12+Math.sin(time*4+p.x)*2,25);label(c,'PICK UP',p.x+12,p.y-13,a.ink,8);}
  for(const e of l.environment){if(T.MACHINERY?.[e.type]&&T.drawMachine)T.drawMachine(c,e,time,a.ink);else environment(c,e,time);}
  for(const p of g.drops){if(!p.used)trapIcon(c,p.type,p.x+13,p.y+9,p.armed?26:22);if(p.explosion>0&&effects){star(c,p.x,p.y,65*p.explosion/.3,'#e4bb75aa');}}
  if(effects)for(const p of g.effects.pool)if(p.life>0){c.globalAlpha=Math.min(1,p.life*3);circle(c,p.x,p.y,p.size||3,p.color);}c.globalAlpha=1;
  circle(c,g.player.x+14,g.player.y+g.player.h+3,12,'#193a3022');rat(c,g.player,time);
  cat(c,g.cat,time);
  for(const t of g.texts){c.globalAlpha=Math.min(1,t.life*2);label(c,t.text,t.x,t.y,a.ink,14);}c.globalAlpha=1;
  c.restore();
 }
 class EscapeArt{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.w=800;this.h=400;this.scale=1;this.camX=0;this.camY=0;}
  resize(){const b=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.w=Math.max(1,b.width);this.h=Math.max(1,b.height);this.canvas.width=Math.round(this.w*d);this.canvas.height=Math.round(this.h*d);this.dpr=d;}
  draw(g,time=0,effects=true){const c=this.ctx;c.setTransform(this.dpr||1,0,0,this.dpr||1,0,0);const s=Math.max(.75,Math.min(1.25,this.h/450));this.scale=s;this.camX=T.clamp(g.player.x-this.w/s*.38,0,Math.max(0,g.level.width-this.w/s));this.camY=T.clamp(g.player.y-this.h/s*.54,0,Math.max(0,480-this.h/s));drawScene(c,g,this.camX,this.camY,this.w,this.h,s,time,effects);
   if(g.cat.stunned&&(g.cat.x<this.camX-30||g.cat.x>this.camX+this.w/s)){const iw=130,ih=102,x=this.w-iw-12,y=12;c.fillStyle='#e8eeddee';c.beginPath();c.roundRect(x,y,iw,ih,10);c.fill();label(c,'MEANWHILE, THE CAT…',x+iw/2,y+16,'#3e6355',8);c.save();c.beginPath();c.rect(x,y+20,iw,ih-20);c.clip();c.translate(x+iw/2-(g.cat.x+g.cat.w/2),y+91-(g.cat.y+g.cat.h));cat(c,g.cat,time);c.restore();}
   if(g.phase==='ready'){const x=this.w/2,y=Math.max(28,this.h*.15);c.fillStyle='#fff9e6ed';c.beginPath();c.roundRect(x-Math.min(180,this.w/2-12),y-20,Math.min(360,this.w-24),55,9);c.fill();label(c,'A HEAD START. A FEW GOOD TRICKS.',x,y,'#355e51',Math.min(12,this.w/30));label(c,'Move to start the chase.',x,y+19,'#56796a',11);}
   if(g.phase==='failed'){c.fillStyle='#f1e9d680';c.fillRect(0,0,this.w,this.h);label(c,'ONE MORE TRY ↻',this.w/2,this.h*.42,'#4f6451',22);label(c,g.message,this.w/2,this.h*.42+26,'#4f6451',12);}
  }
 }
 function drawPoster(canvas){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;backdrop(c,'kitchen',w,h,0,0);c.fillStyle='#446252';c.fillRect(0,h-90,w,90);c.fillStyle='#bdcda1';c.fillRect(0,h-90,w,8);c.save();c.translate(w*.53,h-90);c.scale(3.2,3.2);rat(c,{x:0,y:-40,w:28,h:40,vx:240,grounded:true,face:1,dropPose:0},.4,false);c.restore();c.save();c.translate(w*.24,h-90);c.scale(3.2,3.2);cat(c,{x:0,y:-54,w:38,h:54,vx:0,face:1,state:'stunned',stunned:true,active:{type:'banana',duration:1,remaining:.5}},.7);c.restore();trapIcon(c,'banana',w*.42,h-82,54);label(c,'ONE SMALL RAT.',w*.68,58,'#456451',15);label(c,'ONE VERY LONG CHASE.',w*.68,81,'#456451',15);c.fillStyle='#f5e2b4';c.fillRect(w*.74,h-210,80,120);c.fillStyle='#74987a';c.fillRect(w*.74+7,h-203,66,113);label(c,'EXIT →',w*.74+40,h-226,'#466452',14);}
 Object.assign(T,{EscapeArt,trapIcon,drawPoster,drawRat:rat,drawCat:cat,drawWorld:backdrop});
})();
