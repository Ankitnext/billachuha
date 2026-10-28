(() => {
 'use strict';const T=window.TrapEscape;
 const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
 const line=(c,p,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
 const text=(c,t,x,y,color,size=9)=>{c.font=`800 ${size}px system-ui,sans-serif`;c.textAlign='center';c.fillStyle=color;c.fillText(t,x,y);};
 function stripe(c,x,y,w,h){c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle='#d8c078';c.fillRect(x,y,w,h);c.strokeStyle='#65755b';c.lineWidth=5;for(let a=-h;a<w+h;a+=14){c.beginPath();c.moveTo(x+a,y+h);c.lineTo(x+a+h,y);c.stroke();}c.restore();}
 function drawMachineIcon(c,type,x,y,size=28){c.save();c.translate(x,y);c.scale(size/28,size/28);
  if(type==='ceiling'){c.fillStyle='#829776';c.fillRect(-14,-8,28,12);stripe(c,-14,1,28,4);line(c,[[-9,-15],[-9,-8],[9,-8],[9,-15]],'#9eac8c',2);line(c,[[0,8],[0,15],[-3,12],[0,15],[3,12]],'#567359',2);}
  else if(type==='shift'||type==='lift'){c.fillStyle='#92a97c';c.fillRect(-13,-1,26,7);stripe(c,-13,3,26,3);if(type==='shift'){line(c,[[-14,-7],[14,-7],[10,-11],[14,-7],[10,-3]],'#5b795c',2);}else{line(c,[[0,-15],[0,-5],[-4,-9],[0,-5],[4,-9]],'#5b795c',2);line(c,[[0,7],[0,14]],'#8b9e7e',6);}}
  else if(type==='crusher'){c.fillStyle='#83977a';c.fillRect(-9,-7,18,21);stripe(c,-13,-10,26,6);line(c,[[-5,0],[5,4],[-5,8],[5,12]],'#c3c99b',2);line(c,[[0,-14],[0,-19]],'#5c7b5b',2);}
  else if(type==='pendulum'){line(c,[[-10,-15],[10,-15]],'#7a9279',4);line(c,[[0,-15],[7,4]],'#607d6b',2);circle(c,8,7,8,'#738b77');circle(c,8,7,5,'#b7c49a');}
  else if(type==='gate'){line(c,[[-12,-16],[-12,15],[12,15],[12,-16]],'#91a98c',3);c.fillStyle='#7e9c88';c.fillRect(-9,-14,18,20);for(let sy=-10;sy<4;sy+=5)line(c,[[-6,sy],[6,sy]],'#c4d2aa',1);stripe(c,-9,3,18,4);}
  else if(type==='belt'){c.fillStyle='#718f6e';c.fillRect(-14,-4,28,12);circle(c,-9,2,3,'#c6cc9b');circle(c,9,2,3,'#c6cc9b');line(c,[[-6,-10],[9,-10],[5,-14],[9,-10],[5,-6]],'#829b69',2);}
  c.restore();
 }
 function drawMachine(c,t,time,ink='#355f4a'){
  const x=t.x,y=t.y,armed=['arming','armed','attacking'].includes(t.state),firing=t.state==='attacking'||t.state==='cooling';
  if(t.type==='ceiling'){
   const by=t.blockY;line(c,[[x+10,y-300],[x+10,by]],'#91a281',3);line(c,[[x+t.w-10,y-300],[x+t.w-10,by]],'#91a281',3);
   c.fillStyle='#819774';c.fillRect(x,by,t.w,30);c.fillStyle='#b4c29b';c.fillRect(x+4,by+4,t.w-8,16);stripe(c,x,by+22,t.w,8);for(let dx=15;dx<t.w;dx+=28)circle(c,x+dx,by+12,2.5,'#71866a');
   text(c,'CEILING TRAP',x+t.w/2,by-12,ink,9);c.strokeStyle='#b7b77f';c.setLineDash([4,5]);c.strokeRect(x,y-7,t.w,7);c.setLineDash([]);
  }else if(t.type==='shift'||t.type==='lift'){
   const px=x+(t.type==='shift'?t.offset:0),py=y-(t.type==='lift'?t.rise:0);
   if(t.type==='lift'){line(c,[[x+t.w/2,y+70],[x+t.w/2,py+18]],'#93a485',11);line(c,[[x+t.w/2,y+70],[x+t.w/2,py+18]],'#c3cba5',4);}
   stripe(c,px,py+6,t.w,5);text(c,t.type==='shift'?'SLIDING FLOOR ↔':'ELEVATOR ↑↓',px+t.w/2,py-12,ink,8);c.strokeStyle='#9aaf88';c.setLineDash([4,4]);c.strokeRect(x,y,t.w,6);c.setLineDash([]);
  }else if(t.type==='crusher'){
   c.fillStyle='#729176';c.fillRect(x,y-t.rise,t.w,t.rise);for(let sy=y-t.rise+16;sy<y;sy+=15)line(c,[[x+10,sy],[x+t.w-10,sy+6]],'#bfcca2',3);stripe(c,x,y-t.rise-6,t.w,9);text(c,'PISTON TRAP ↑',x+t.w/2,y-t.rise-18,ink,8);
  }else if(t.type==='pendulum'){
   const ax=x+t.w/2,ay=y-240;line(c,[[ax-13,ay-7],[ax+13,ay-7]],'#78947b',6);circle(c,ax,ay,5,'#9bb28b');line(c,[[ax,ay],[t.ballX,t.ballY]],'#799980',3);circle(c,t.ballX,t.ballY,20,'#d7c788');circle(c,t.ballX,t.ballY,17,'#7c9785');circle(c,t.ballX-4,t.ballY-5,6,'#bdcaaa');text(c,'PENDULUM',ax,ay-22,ink,8);
  }else if(t.type==='gate'){
   const top=y-270;line(c,[[x-5,top],[x-5,y]],'#9fb496',4);line(c,[[x+t.w+5,top],[x+t.w+5,y]],'#9fb496',4);c.fillStyle='#7c9d88';c.fillRect(x,top,t.w,t.gateBottom-top);for(let sy=top+7;sy<t.gateBottom-9;sy+=12)line(c,[[x+4,sy],[x+t.w-4,sy]],'#bacda7',2);stripe(c,x,t.gateBottom-8,t.w,8);text(c,'SHUTTER',x+t.w/2,top-12,ink,8);
  }else if(t.type==='belt'){
   c.fillStyle='#72926b';c.fillRect(x,y-5,t.w,12);const dir=(t.used?-1:1)*(t.direction||1),offset=time*65*dir%22;
   c.save();c.beginPath();c.rect(x,y-5,t.w,12);c.clip();for(let dx=-22;dx<t.w+22;dx+=22){const bx=x+dx+offset;line(c,[[bx-dir*4,y-3],[bx+dir*3,y],[bx-dir*4,y+3]],'#d9d09b',2);}c.restore();circle(c,x+5,y+1,3,'#bccca0');circle(c,x+t.w-5,y+1,3,'#bccca0');text(c,t.used?'REVERSED!':'CONVEYOR',x+t.w/2,y-17,ink,8);
  }
  const leverY=y-23;line(c,[[t.triggerX-7,y],[t.triggerX-7,leverY],[t.triggerX+3,leverY-8]],armed?'#c6975b':'#7d9c70',3);circle(c,t.triggerX+3,leverY-8,4,armed?'#e5c782':'#b9d399');
  if(!t.used)text(c,firing?'GOT YOU!':armed?'CAT TRAP ARMED':'RUN PAST →',t.triggerX,y-51,ink,8);
 }
 Object.assign(T,{drawMachine,drawMachineIcon});
})();
