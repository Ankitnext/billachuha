(() => {
 'use strict';const C=window.CatChase,A=window.TrapEscape;
 const THEMES={kitchen:['#665d48','#d6c59a','#4d5544'],garden:['#52674a','#c3cd92','#3f5943'],rooftop:['#4b5465','#a7b3b6','#e1e6d8'],sewer:['#40584b','#9eb397','#e5e3c4'],inferno:['#775140','#d9a06c','#f7dbb1']};
 const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const text=(c,t,x,y,color='#465745',size=10,align='center')=>{c.font=`700 ${size}px system-ui,sans-serif`;c.textAlign=align;c.fillStyle=color;c.fillText(t,x,y);};
 const line=(c,pts,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 function stripe(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#d7b96c';c.fillRect(x,y,w,h);c.strokeStyle='#6c6750';c.lineWidth=6;for(let i=-h;i<w+h;i+=16){c.beginPath();c.moveTo(x+i,y+h);c.lineTo(x+i+h,y);c.stroke();}c.restore();}
 function bell(c,x,y,size=20,filled=true){c.save();c.translate(x,y);c.scale(size/20,size/20);c.fillStyle=filled?'#c9a350':'#b7b5a1';c.beginPath();c.moveTo(-8,6);c.quadraticCurveTo(-5,1,-5,-4);c.quadraticCurveTo(0,-12,5,-4);c.quadraticCurveTo(5,1,8,6);c.closePath();c.fill();circle(c,0,8,2.5,filled?'#9f7843':'#a8a994');circle(c,0,-8,2,filled?'#9f7843':'#a8a994');line(c,[[-9,6],[9,6]],filled?'#896d3c':'#999e8a',2);c.restore();}
 function alert(c,t,color){if(t.state!=='warning')return;const x=t.x+t.w/2,y=t.y-57;c.fillStyle='#f9edcb';c.beginPath();c.moveTo(x,y-18);c.lineTo(x+12,y+3);c.lineTo(x-12,y+3);c.closePath();c.fill();text(c,'!',x,y-1,color,14);}
 function drawTrap(c,t,time,ink){
  const x=t.x,y=t.y;
  if(t.type==='crumble'){
   if(t.state==='open'){c.fillStyle='#253b32';c.fillRect(x,y,t.w,80);text(c,'GONE.',x+t.w/2,y+38,'#b8c6a3',10);}
   else{c.fillStyle=t.state==='warning'?'#c5a971':'#baae86';c.fillRect(x,y,t.w,7);for(let dx=8;dx<t.w;dx+=24)line(c,[[x+dx,y+6],[x+dx+8,y+17],[x+dx+3,y+27],[x+dx+12,y+36]],t.state==='warning'?'#77583c':'#8d8760',t.state==='warning'?2:1);if(t.state==='warning')text(c,'CRACK…',x+t.w/2,y-12,ink,9);}
  }else if(t.type==='spikes'){
   c.fillStyle='#8e8b70';c.fillRect(x,y-4,t.w,5);if(t.state==='active'){c.fillStyle='#bb805a';for(let dx=0;dx<t.w;dx+=12){c.beginPath();c.moveTo(x+dx,y);c.lineTo(x+dx+6,y-25);c.lineTo(x+dx+12,y);c.fill();}}
   else for(let dx=5;dx<t.w;dx+=12)circle(c,x+dx,y-5,2,t.state==='warning'?'#bd7b52':'#aab094');
  }else if(t.type==='drop'){
   const by=['falling','down','rising'].includes(t.state)?t.blockY:80;c.globalAlpha=t.state==='spent'?.4:1;
   c.fillStyle='#938062';c.fillRect(x,by,t.w,t.h);c.strokeStyle='#c9b68a';c.lineWidth=3;c.strokeRect(x+4,by+4,t.w-8,t.h-8);line(c,[[x+8,by+8],[x+t.w-8,by+t.h-8]],'#b7a27a',3);line(c,[[x+t.w-8,by+8],[x+8,by+t.h-8]],'#b7a27a',3);c.globalAlpha=1;text(c,'↓',x+t.w/2,y-14,ink,18);
   if(t.state==='warning'){c.setLineDash([4,5]);line(c,[[x+t.w/2,by+t.h+8],[x+t.w/2,y-80]],'#a88b63',1);c.setLineDash([]);}
  }else if(t.type==='ceiling'){
   const by=['falling','down','rising'].includes(t.state)?t.blockY:y-285;c.globalAlpha=t.state==='spent'?.5:1;
   line(c,[[x+10,y-320],[x+10,by]],'#89937e',4);line(c,[[x+t.w-10,y-320],[x+t.w-10,by]],'#89937e',4);
   c.fillStyle='#737b69';c.fillRect(x,by,t.w,t.h);c.fillStyle='#a2ab8c';c.fillRect(x+4,by+4,t.w-8,t.h-14);stripe(c,x,by+t.h-8,t.w,8);
   for(let dx=16;dx<t.w;dx+=30)circle(c,x+dx,by+12,3,'#5c6759');c.globalAlpha=1;
   stripe(c,x,y-4,t.w,4);text(c,t.state==='warning'?'CEILING! ↓':'CEILING ↓',x+t.w/2,y-15,ink,9);
   if(t.state==='warning'){c.strokeStyle='#b18550';c.setLineDash([4,5]);c.strokeRect(x,y-95,t.w,89);c.setLineDash([]);}
  }else if(t.type==='gate'){
   const top=y-290,bottom=t.gateBottom;line(c,[[x-5,top],[x-5,y]],'#a2a489',4);line(c,[[x+t.w+5,top],[x+t.w+5,y]],'#a2a489',4);
   c.fillStyle='#7c8876';c.fillRect(x,top,t.w,bottom-top);for(let sy=top+6;sy<bottom-9;sy+=12)line(c,[[x+4,sy],[x+t.w-4,sy]],'#adb79a',2);stripe(c,x,bottom-8,t.w,8);
   text(c,t.state==='open'?'GO →':'SHUTTER',x+t.w/2,y-18,ink,8);text(c,'◷',x+t.w/2,top-10,ink,17);
  }else if(t.type==='crusher'){
   c.fillStyle='#4f6254';c.fillRect(x,y-t.rise,t.w,t.rise);for(let sy=y-t.rise+20;sy<y;sy+=18)line(c,[[x+10,sy],[x+t.w-10,sy+8]],'#9da68b',3);
   stripe(c,x,y-t.rise-7,t.w,9);text(c,t.state==='warning'?'PISTON! ↑':'PISTON ↑',x+t.w/2,y-t.rise-20,ink,8);
  }else if(t.type==='pendulum'){
   const ax=x+t.w/2,ay=y-252;line(c,[[ax-15,ay-8],[ax+15,ay-8]],'#6b7d69',7);circle(c,ax,ay,6,'#87957c');line(c,[[ax,ay],[t.ballX,t.ballY]],'#697c69',3);
   circle(c,t.ballX,t.ballY,20,'#cdb76d');circle(c,t.ballX,t.ballY,17,'#647867');circle(c,t.ballX-4,t.ballY-5,7,'#8f9c80');
   for(let a=0;a<6;a++){const r=a*Math.PI/3;circle(c,t.ballX+Math.cos(r)*12,t.ballY+Math.sin(r)*12,2,'#c6cba2');}
   text(c,'WATCH THE SWING',ax,ay-24,ink,8);
  }else if(t.type==='shift'||t.type==='lift'){
   const px=x+(t.type==='shift'?t.offset:0),py=y-(t.type==='lift'?t.rise:0);
   if(t.type==='lift'){line(c,[[x+t.w/2,y+65],[x+t.w/2,py+20]],'#89987d',13);line(c,[[x+t.w/2,y+65],[x+t.w/2,py+20]],'#bac0a0',5);}
   stripe(c,px,py+5,t.w,5);text(c,t.type==='shift'?'FLOOR ↔':'LIFT ↑↓',px+t.w/2,py-12,ink,9);
   c.strokeStyle='#89987d';c.setLineDash([4,5]);c.strokeRect(x,y,t.w,7);c.setLineDash([]);
  }else if(t.type==='belt'){
   c.fillStyle='#64735e';c.fillRect(x,y-5,t.w,12);const dir=t.direction||1,offset=t.state==='active'?(time*95*dir)%24:0;
   c.save();c.beginPath();c.rect(x,y-4,t.w,10);c.clip();for(let dx=-24;dx<t.w+24;dx+=24){const bx=x+dx+offset;line(c,[[bx-dir*4,y-2],[bx+dir*3,y+1],[bx-dir*4,y+4]],'#d6c58b',2);}c.restore();
   circle(c,x+5,y+1,4,'#a5ad8c');circle(c,x+t.w-5,y+1,4,'#a5ad8c');text(c,dir>0?'CONVEYOR →':'← CONVEYOR',x+t.w/2,y-16,ink,8);
  }else if(t.type==='wall'){
   const bx=x+t.offset;c.globalAlpha=t.state==='idle'?.4:1;c.fillStyle='#988a69';c.fillRect(bx,y-t.h,t.w,t.h);c.fillStyle='#c3b38a';for(let dy=6;dy<t.h;dy+=18)c.fillRect(bx+3,y-t.h+dy,t.w-6,3);c.globalAlpha=1;text(c,'↔',bx+t.w/2,y-t.h-11,ink,17);
  }else if(t.type==='spring'){A.trapIcon(c,'spring',x+t.w/2,y-14,35);text(c,'BOING',x+t.w/2,y-40,ink,8);}
  else if(t.type==='fake'){c.fillStyle='#c8bc96';c.fillRect(x,y-54,40,54);c.fillStyle='#716d52';c.fillRect(x+5,y-49,30,49);text(c,t.state==='spent'?'NOPE →':'EXIT?',x+20,y-65,ink,9);}
  alert(c,t,ink);
 }
 class ChaseArt{
  constructor(canvas,map){this.canvas=canvas;this.map=map;this.ctx=canvas.getContext('2d');this.w=800;this.h=400;this.dpr=1;}
  resize(){const b=this.canvas.getBoundingClientRect();this.w=Math.max(1,b.width);this.h=Math.max(1,b.height);this.dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*this.dpr);this.canvas.height=Math.round(this.h*this.dpr);}
  draw(g,time,effects=true){
   const c=this.ctx,l=g.level,p=g.player,r=g.rat,[floor,edge,ink]=THEMES[l.theme],s=Math.max(.8,Math.min(1.35,this.h/420));
   const camX=C.clamp(p.x-this.w/s*.36,0,Math.max(0,l.width-this.w/s)),camY=C.clamp(p.y-this.h/s*.52,0,Math.max(0,480-this.h/s));
   c.setTransform(this.dpr,0,0,this.dpr,0,0);A.drawWorld(c,l.theme,this.w,this.h,camX,effects?time:0);c.save();c.scale(s,s);c.translate(-camX,-camY);
   for(const t of l.traps)if(t.type==='shift'||t.type==='lift'){c.fillStyle='#263e32';c.fillRect(t.x,t.y,t.w,80);}
   for(const t of l.platforms){if(t.crumble!==undefined&&l.traps[t.crumble].state==='open')continue;c.fillStyle=floor;c.fillRect(t.x,t.y,t.w,t.h);c.fillStyle=edge;c.fillRect(t.x,t.y,t.w,6);c.strokeStyle=edge+'44';c.lineWidth=1;for(let x=Math.ceil(t.x/40)*40;x<t.x+t.w;x+=40)line(c,[[x,t.y+9],[x,t.y+t.h]],edge+'33',1);if(t.moving){text(c,'↔',t.x+t.w/2,t.y-9,ink,13);}}
   for(const gap of l.gaps){c.fillStyle=l.theme==='inferno'?'#b77049':'#263e32';c.fillRect(gap.x,400,gap.w,80);if(l.theme==='inferno')for(let dx=6;dx<gap.w;dx+=18)circle(c,gap.x+dx,415+Math.sin(dx+time*3)*3,5,'#e6ad69');text(c,'JUMP ↗',gap.x-27,378,ink,9);for(let x=gap.x-28;x<gap.x-4;x+=9)line(c,[[x,395],[x+4,390],[x+8,395]],'#c7aa65',2);}
   for(const t of l.traps)drawTrap(c,t,time,ink);
   const d=l.door;c.fillStyle='#b6b38c';c.fillRect(d.x-6,d.y-6,d.w+12,d.h+6);c.fillStyle='#52654a';c.beginPath();c.roundRect(d.x,d.y,d.w,d.h,[18,18,0,0]);c.fill();circle(c,d.x+d.w-8,d.y+44,3,'#dcc489');text(c,'RAT’S EXIT',d.x+d.w/2,d.y-17,ink,9);
   for(const b of l.bells)if(!b.taken){circle(c,b.x+9,b.y+11,17,'#f4efd580');bell(c,b.x+9,b.y+9+Math.sin(time*4+b.x)*2,18);}
   if(p.pounce>0&&effects){for(let i=1;i<4;i++){c.globalAlpha=.13*(4-i);A.drawCat(c,{...p,x:p.x-p.face*i*12,state:'chasing',active:null,stunned:false},time);}c.globalAlpha=1;}
   A.drawRat(c,{...r,caught:r.state==='caught'},time,false);text(c,r.state==='caught'?'CAUGHT!':'RAT',r.x+r.w/2,r.y-15,ink,9);
   const failed=g.phase==='failed';A.drawCat(c,{...p,stunned:failed,active:failed?{type:'sweep',duration:1,remaining:.65}:null},time);text(c,'YOU · CAT',p.x+p.w/2,p.y-28,ink,9);
   if(g.phase==='won'&&effects)for(let i=0;i<9;i++){const a=i*Math.PI*2/9+time*.5;circle(c,p.x+p.w/2+Math.cos(a)*42,p.y+10+Math.sin(a)*40,3,'#cfad5d');}
   c.restore();
   const ratScreen=(r.x-camX)*s;if(g.phase==='playing'&&(ratScreen>this.w-20||ratScreen<0)){const right=ratScreen>this.w/2,x=right?this.w-13:13;c.fillStyle='#f6eddaee';c.beginPath();c.roundRect(right?x-122:x-4,12,126,29,6);c.fill();text(c,`${right?'RAT →':'← RAT'} · ${Math.round(Math.abs(r.x-p.x)/40)} tiles`,right?x-60:x+58,31,'#59644f',10);}
   if(g.phase==='ready'){const w=Math.min(this.w-24,370),x=(this.w-w)/2;c.fillStyle='#faf3dfed';c.beginPath();c.roundRect(x,16,w,55,8);c.fill();text(c,'YOU’RE THE CAT THIS TIME.',this.w/2,38,'#66513e',Math.min(12,this.w/25));text(c,'Move to start. Catch that Rat.',this.w/2,57,'#6b765d',11);}
   if(failed){c.fillStyle='#f2ead4a0';c.fillRect(0,0,this.w,this.h);text(c,'ONE MORE TRY ↻',this.w/2,this.h*.43,'#6d5743',21);text(c,g.message,this.w/2,this.h*.43+25,'#685d48',Math.min(12,this.w/33));}
   this.drawMap(g);
  }
  drawMap(g){const c=this.map.getContext('2d'),w=this.map.width,h=this.map.height,l=g.level,k=(w-16)/l.width;c.clearRect(0,0,w,h);c.fillStyle='#ddd9bd';c.fillRect(8,17,w-16,4);for(const gap of l.gaps){c.fillStyle='#9a9c7d';c.fillRect(8+gap.x*k,17,gap.w*k,4);}for(const t of l.traps)if(!['idle','spent','safe'].includes(t.state)){c.fillStyle='#b77a55';c.fillRect(8+t.x*k,13,4,12);}for(const [p,color,rad]of [[g.rat,'#74a6af',4],[g.player,'#bc7e57',6]]){const x=8+(p.x+p.w/2)*k;circle(c,x,18,rad,color);circle(c,x-3,12,2.5,color);circle(c,x+3,12,2.5,color);}c.fillStyle='#516950';c.fillRect(w-12,11,4,14);}
 }
 function poster(canvas){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;A.drawWorld(c,'kitchen',w,h,0,0);c.fillStyle='#665d48';c.fillRect(0,h-90,w,90);c.fillStyle='#cfbf95';c.fillRect(0,h-90,w,7);
  c.save();c.translate(w*.25,h-90);c.scale(3.5,3.5);A.drawCat(c,{x:0,y:-48,w:34,h:48,face:1,vx:250,grounded:true,state:'chasing',stunned:false},.3);c.restore();
  c.save();c.translate(w*.64,h-90);c.scale(3.4,3.4);A.drawRat(c,{x:0,y:-40,w:24,h:40,face:1,vx:240,grounded:true},.38,false);c.restore();
  text(c,'THE CHASE HAS CHANGED SIDES.',w*.5,61,'#64725b',14);text(c,'WATCH YOUR STEP.',w*.5,85,'#64725b',12);c.fillStyle='#263e32';c.fillRect(w*.47,h-90,84,90);text(c,'JUMP ↗',w*.43,h-109,'#5c6850',12);bell(c,w*.83,h-128,42);
 }
 Object.assign(C,{ChaseArt,drawPoster:poster,drawBell:bell});
})();
