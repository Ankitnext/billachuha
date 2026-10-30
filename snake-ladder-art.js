/* Local Canvas artwork: no image downloads or third-party sprite dependencies. */
(()=>{
  'use strict';
  const C=window.StairsGame,M=window.CharacterMotion,colors={rat:'#70b9d2',cat:'#e9977e',dog:'#b79b78'};
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const palettes={garden:{sky:['#d9e9b8','#eef4d5'],far:'#acc69b',platform:'#678456',top:'#a9ca73',ink:'#365538'},house:{sky:['#f1debb','#dfc7a0'],far:'#c6aa85',platform:'#8b674b',top:'#c99a65',ink:'#755338'},night:{sky:['#142c42','#2a4054'],far:'#344b66',platform:'#485b76',top:'#9acac4',ink:'#cfe2da'},volcano:{sky:['#352d3d','#743f3c'],far:'#8d4d43',platform:'#80514c',top:'#e0a267',ink:'#f1d5ab'}};
  function round(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function disc(ctx,x,y,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  function label(ctx,text,x,y,size=12,color='#e9f2cf',align='center'){ctx.fillStyle=color;ctx.font=`750 ${size}px system-ui`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);}
  function head(ctx,x,y,r,role){
    const color=colors[role];ctx.save();ctx.translate(x,y);
    if(role==='cat'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-r*.9,-r*.1);ctx.lineTo(-r*.9,-r*1.4);ctx.lineTo(-r*.15,-r*.6);ctx.moveTo(r*.9,-r*.1);ctx.lineTo(r*.9,-r*1.4);ctx.lineTo(r*.15,-r*.6);ctx.fill();}
    else if(role==='rat'){disc(ctx,-r*.8,-r*.65,r*.47,color);disc(ctx,r*.8,-r*.65,r*.47,color);disc(ctx,-r*.8,-r*.65,r*.25,'#e8b9a3');disc(ctx,r*.8,-r*.65,r*.25,'#e8b9a3');}
    else{round(ctx,-r*1.2,-r*.5,r*.5,r*1.4,r*.25,color);round(ctx,r*.7,-r*.5,r*.5,r*1.4,r*.25,color);}
    disc(ctx,0,0,r,color);disc(ctx,-r*.36,-r*.15,r*.19,'#fff9e6');disc(ctx,r*.36,-r*.15,r*.19,'#fff9e6');disc(ctx,-r*.36,-r*.15,r*.09,'#263b30');disc(ctx,r*.36,-r*.15,r*.09,'#263b30');disc(ctx,0,r*.38,r*.16,'#31463b');ctx.restore();
  }
  function board(ctx,width,game,now=0){
    ctx.clearRect(0,0,width,width);round(ctx,0,0,width,width,18,'#e9dfb8');
    const pad=width*.027,size=(width-pad*2)/10,point=n=>C.cellPoint(n,size);ctx.save();ctx.translate(pad,pad);
    for(let n=1;n<=100;n++){
      const p=point(n),key=C.theme(n),tile={garden:['#d8e6b9','#e7eccb'],house:['#eddbb3','#e5c99f'],night:['#c5d7d0','#b3c8c2'],volcano:['#eac0a8','#dca88f']}[key];
      ctx.fillStyle=tile[(Math.floor((n-1)/10)+n)%2];ctx.fillRect(p.x-size/2+1,p.y-size/2+1,size-2,size-2);
      if(game.turn&&n>game.turn.origin&&n<=game.turn.target){ctx.fillStyle='#eff57d99';ctx.fillRect(p.x-size/2+2,p.y-size/2+2,size-4,size-4);}
      if(C.POWERS[n]){disc(ctx,p.x,p.y,size*.22,'#f3d779');label(ctx,C.POWERS[n]==='double'?'↑↑':C.POWERS[n]==='shield'?'✚':'ϟ',p.x,p.y,size*.23,'#705c2e');}
      if(C.BOSSES.includes(n)){disc(ctx,p.x,p.y,size*.23,'#a986b2');disc(ctx,p.x-size*.08,p.y-size*.02,size*.045,'#fff0d3');disc(ctx,p.x+size*.08,p.y-size*.02,size*.045,'#fff0d3');round(ctx,p.x-size*.1,p.y+size*.09,size*.2,size*.06,1,'#5b4762');}
    }
    for(const [from,to]of Object.entries(C.LADDERS)){
      const a=point(+from),b=point(to),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),px=-dy/len*size*.12,py=dx/len*size*.12;
      ctx.save();if(game.players.some(p=>Math.abs(p.cell-Number(from))<=3)){ctx.shadowColor='#e6ff99';ctx.shadowBlur=10;}
      ctx.lineCap='round';ctx.strokeStyle='#397f67';ctx.lineWidth=size*.075;ctx.beginPath();ctx.moveTo(a.x+px,a.y+py);ctx.lineTo(b.x+px,b.y+py);ctx.moveTo(a.x-px,a.y-py);ctx.lineTo(b.x-px,b.y-py);ctx.stroke();
      ctx.strokeStyle='#f3efbe';ctx.lineWidth=size*.04;const rungs=Math.max(2,Math.floor(len/(size*.34)));ctx.beginPath();for(let i=0;i<=rungs;i++){const t=i/rungs,x=a.x+dx*t,y=a.y+dy*t;ctx.moveTo(x+px,y+py);ctx.lineTo(x-px,y-py);}ctx.stroke();ctx.restore();
    }
    for(const [from,to]of Object.entries(C.SNAKES)){
      const a=point(+from),b=point(to),bend=(Number(from)%2?1:-1)*size*.6,wave=Math.sin(now*1.6+Number(from))*size*.045;
      ctx.lineCap='round';ctx.lineWidth=size*.21;ctx.strokeStyle='#c16e60';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.bezierCurveTo(a.x+bend+wave,a.y+(b.y-a.y)*.25,b.x-bend,b.y-size*.4,b.x,b.y);ctx.stroke();
      ctx.lineWidth=size*.13;ctx.strokeStyle='#ec967a';ctx.stroke();ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2);ctx.fillStyle='#ec967a';ctx.beginPath();ctx.ellipse(0,0,size*.17,size*.2,0,0,Math.PI*2);ctx.fill();disc(ctx,-size*.07,-size*.04,size*.037,'#fff4d0');disc(ctx,size*.07,-size*.04,size*.037,'#fff4d0');disc(ctx,-size*.07,-size*.04,size*.018,'#483b32');disc(ctx,size*.07,-size*.04,size*.018,'#483b32');ctx.restore();
    }
    for(let n=1;n<=100;n++){const p=point(n);ctx.font=`800 ${size*.2}px system-ui`;ctx.textAlign='left';ctx.textBaseline='top';ctx.strokeStyle='#f3e8c9';ctx.lineWidth=size*.035;ctx.strokeText(String(n),p.x-size*.4,p.y-size*.4);ctx.fillStyle='#37503d';ctx.fillText(String(n),p.x-size*.4,p.y-size*.4);}
    const occupied=new Map();for(const p of game.players){if(!occupied.has(p.cell))occupied.set(p.cell,[]);occupied.get(p.cell).push(p);}
    for(const [cell,players]of occupied){const p=point(cell);for(let i=0;i<players.length;i++){
      const token=players[i],index=game.players.indexOf(token),offset=players.length===1?{x:0,y:size*.08}:{x:(i%2?1:-1)*size*.19,y:(i<2?-.05:.29)*size},x=p.x+offset.x,y=p.y+offset.y+Math.sin(now*2.8+index)*size*.014,r=size*(players.length>1?.17:.24);
      disc(ctx,x,y+3,r+2,'#554c3930');if(index===game.current){ctx.strokeStyle='#fff8d0';ctx.lineWidth=size*.06;ctx.beginPath();ctx.arc(x,y,r+size*.07,0,Math.PI*2);ctx.stroke();}head(ctx,x,y,r,token.role);if(players.length>1)label(ctx,String(index+1),x,y+r*.9,size*.15,'#2b4537');
    }}
    ctx.restore();
  }
  function background(ctx,canvas,stage,cam,now){
    const p=palettes[stage.theme],w=canvas.width,h=canvas.height,gradient=ctx.createLinearGradient(0,0,0,h);gradient.addColorStop(0,p.sky[0]);gradient.addColorStop(1,p.sky[1]);ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
    if(stage.theme==='night'){
      for(let i=0;i<35;i++)disc(ctx,(i*137)%w,(i*79)%Math.max(1,h-70),i%3===0?1.7:1,'#d7e6c885');disc(ctx,w-90,85,30,'#e3e3b4');disc(ctx,w-78,76,29,p.sky[0]);
    }else if(stage.theme==='house'){
      ctx.strokeStyle='#a7805825';ctx.lineWidth=2;for(let x=-cam.x*.2%130;x<w;x+=130){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let x=70-cam.x*.25%400;x<w;x+=400){round(ctx,x,70,100,125,5,'#f5e2ae','#b69369');ctx.fillStyle='#b89a71';ctx.fillRect(x+46,70,7,125);ctx.fillRect(x,128,100,7);}
    }else if(stage.theme==='garden'){
      ctx.fillStyle='#f9f9db99';for(let i=0;i<5;i++){const x=(i*260-cam.x*.18+w*4)%(w+220)-60,y=70+(i%3)*50;disc(ctx,x,y,28,'#fbf9e3aa');disc(ctx,x+34,y-12,40,'#fbf9e3aa');disc(ctx,x+69,y,28,'#fbf9e3aa');}
    }
    ctx.fillStyle=p.far;ctx.globalAlpha=.55;ctx.beginPath();ctx.moveTo(0,h);for(let x=-150;x<w+200;x+=200){const px=x-cam.x*.1%200;ctx.quadraticCurveTo(px+100,h-(stage.theme==='volcano'?240:140),px+200,h-60);}ctx.lineTo(w,h);ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    if(stage.theme==='volcano'){ctx.fillStyle='#eb9a5633';ctx.fillRect(0,h-35,w,35);ctx.strokeStyle='#f1bd6c55';ctx.beginPath();for(let x=0;x<=w;x+=15){const y=h-25+Math.sin(x/40+now*2)*4;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
  }
  function stage(ctx,canvas,s,cam,now){
    background(ctx,canvas,s,cam,now);const palette=palettes[s.theme];ctx.save();ctx.translate(-cam.x,-cam.y);
    for(const f of s.platforms){round(ctx,f.x,f.y,f.w,18,5,palette.platform);ctx.fillStyle=palette.top;ctx.fillRect(f.x,f.y,f.w,5);if(f.ampX||f.ampY){label(ctx,'‹  ›',f.x+f.w/2,f.y+11,10,'#f2edcc');}ctx.fillStyle='#00000015';ctx.fillRect(f.x+5,f.y+18,f.w-10,5);}
    for(const h of s.hazards){ctx.fillStyle='#ba6759';ctx.beginPath();ctx.moveTo(h.x,h.y+h.h);for(let x=h.x;x<h.x+h.w;x+=16){ctx.lineTo(x+8,h.y);ctx.lineTo(x+16,h.y+h.h);}ctx.closePath();ctx.fill();}
    for(const c of s.pickups){if(c.taken)continue;const x=c.x+11,y=c.y+11;ctx.save();ctx.translate(x,y);ctx.scale(.72+Math.abs(Math.sin(now*5+x))*.28,1);disc(ctx,0,0,10,'#c58d32');disc(ctx,0,0,7.5,'#f6d265');label(ctx,'·',0,0,16,'#a8752d');ctx.restore();}
    for(const e of s.enemies){if(e.hp<=0)continue;const color=e.boss?'#9a79a5':'#799961';const pose=M.forActor(e,s.elapsed,{grounded:true,motion:!reducedMotion.matches});M.sideLimbs(ctx,pose,{x:e.x+e.w/2,y:e.y+e.h,w:e.w,h:e.h,color,face:e.dir});round(ctx,e.x,e.y,e.w,e.h*.8,7,color);disc(ctx,e.x+e.w*.3,e.y+12,4,'#f1edbd');disc(ctx,e.x+e.w*.7,e.y+12,4,'#f1edbd');disc(ctx,e.x+e.w*.3,e.y+12,1.7,'#314538');disc(ctx,e.x+e.w*.7,e.y+12,1.7,'#314538');ctx.fillStyle='#e8ddae';ctx.fillRect(e.x+e.w*.35,e.y+e.h*.65,e.w*.3,3);if(e.boss){label(ctx,'GUARDIAN',e.x+e.w/2,e.y-26,10,palette.ink);round(ctx,e.x,e.y-15,e.w,5,2,'#443b43');round(ctx,e.x,e.y-15,e.w*e.hp/e.maxHp,5,2,'#ead28d');}}
    if(s.goal&&s.kind!=='snake'){
      const g=s.goal;ctx.strokeStyle='#47654b';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(g.x+5,g.y);ctx.lineTo(g.x+5,g.y+g.h);ctx.stroke();ctx.fillStyle='#d8ed85';ctx.beginPath();ctx.moveTo(g.x+7,g.y);ctx.lineTo(g.x+45,g.y+9);ctx.lineTo(g.x+7,g.y+25);ctx.closePath();ctx.fill();label(ctx,s.kind==='ladder'?'TOP':'FINISH',g.x+10,g.y-16,11,palette.ink);
    }
    for(const b of s.bombs){if(b.warning>0)continue;disc(ctx,b.x+13,b.y+13,13,'#3e4242');ctx.strokeStyle='#d4b77b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(b.x+16,b.y+2);ctx.quadraticCurveTo(b.x+24,b.y-9,b.x+27,b.y-5);ctx.stroke();disc(ctx,b.x+27,b.y-5,3,'#f1ac58');}
    const p=s.player;ctx.save();if(s.elapsed<p.invulnerable&&Math.floor(now*12)%2)ctx.globalAlpha=.4;
    const pose=M.forActor(p,s.elapsed,{grounded:p.standing!==null,vy:p.vy,motion:!reducedMotion.matches});
    if(p.standing!==null){ctx.fillStyle='#0002';ctx.beginPath();ctx.ellipse(p.x+15,p.y+44,20,5,0,0,Math.PI*2);ctx.fill();}
    ctx.translate(0,pose.bob);M.sideLimbs(ctx,pose,{x:p.x+15,y:p.y+43,w:30,h:44,color:colors[s.role],face:p.face,hand:s.role==='dog'?{x:p.x+15+p.face*17,y:p.y+25}:null});
    if(s.role==='rat'){ctx.strokeStyle=colors.rat;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x+5,p.y+31);ctx.quadraticCurveTo(p.x-18,p.y+36+pose.swing*3,p.x-10,p.y+44);ctx.stroke();}
    round(ctx,p.x+5,p.y+20,20,17,6,colors[s.role]);head(ctx,p.x+15,p.y+13,13,s.role);
    if(s.role==='dog'){ctx.save();ctx.translate(p.x+15+p.face*17,p.y+25);ctx.scale(p.face,1);round(ctx,-7,-4,22,7,2,'#a8bfc1','#354c51');ctx.fillStyle='#394b50';ctx.fillRect(-4,3,5,9);ctx.restore();}
    if(s.shield){ctx.strokeStyle='#7cd4db';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x+15,p.y+21,27,32,0,0,Math.PI*2);ctx.stroke();}
    if(s.elapsed<s.boostUntil){ctx.strokeStyle='#f2e39c';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(p.x-p.face*(10+i*6)+15,p.y+14+i*8);ctx.lineTo(p.x-p.face*(28+i*6)+15,p.y+14+i*8);ctx.stroke();}}
    ctx.restore();
    for(const b of s.bullets){ctx.save();ctx.translate(b.x,b.y+3);if(b.vx<0)ctx.rotate(Math.PI);ctx.strokeStyle='#e8c97566';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-5,0);ctx.stroke();ctx.fillStyle='#e8bb60';ctx.beginPath();ctx.moveTo(-4,-3);ctx.lineTo(7,-3);ctx.lineTo(12,0);ctx.lineTo(7,3);ctx.lineTo(-4,3);ctx.closePath();ctx.fill();ctx.restore();}
    ctx.restore();
    for(const b of s.bombs)if(b.warning>0){const x=Math.max(18,Math.min(canvas.width-18,b.x-cam.x+13));disc(ctx,x,22,12,'#d68b59');label(ctx,'!',x,22,16,'#fff3c0');}
    const progress=s.kind==='move'?p.x/(s.width-100):s.kind==='ladder'?1-p.y/s.height:s.kind==='snake'?p.y/s.height:1-(s.enemies[0]?.hp||0)/(s.enemies[0]?.maxHp||1);
    round(ctx,14,canvas.height-12,canvas.width-28,4,2,'#20382c44');round(ctx,14,canvas.height-12,(canvas.width-28)*Math.max(0,Math.min(1,progress)),4,2,palette.top);
  }
  window.StairsArt={board,stage,head,colors};
})();
