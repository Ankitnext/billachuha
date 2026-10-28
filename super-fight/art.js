(() => {
  'use strict';const S=window.SuperFight;
  const line=(c,x1,y1,x2,y2,width,color)=>{c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
  const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  const label=(c,txt,x,y,size,color,align='center')=>{c.fillStyle=color;c.font=`850 ${size}px system-ui`;c.textAlign=align;c.textBaseline='middle';c.fillText(txt,x,y);};
  function limb(c,x,y,a,b,l1,l2,width,color){const elbow={x:x+Math.sin(a)*l1,y:y+Math.cos(a)*l1},end={x:elbow.x+Math.sin(a+b)*l2,y:elbow.y+Math.cos(a+b)*l2};line(c,x,y,elbow.x,elbow.y,width,color);line(c,elbow.x,elbow.y,end.x,end.y,width*.86,color);return end;}
  function fighter(c,f,now=0,motion=true,ghost=false){
    const bright=f.hurtFlash>0?'#f9f8e8':f.color,ink='#142b36',phase=motion?now:0;
    c.save();c.translate(f.x+f.w/2,f.y);c.scale(f.face,1);
    if(f.ko){c.translate(0,55);c.rotate(1.1);c.translate(0,-55);}
    const state=f.attack?.kind||f.state;
    if(state==='dash'||state==='fly')c.rotate(.13);
    if(!ghost&&(f.energy/f.maxEnergy>.65||f.charging||f.shield||f.flying)){
      const aura=c.createRadialGradient(0,49,12,0,49,f.charging?115:85);aura.addColorStop(0,f.color+'44');aura.addColorStop(1,f.color+'00');c.fillStyle=aura;c.beginPath();c.ellipse(0,45,80,f.charging?125:100,0,0,Math.PI*2);c.fill();
      c.strokeStyle=f.color+'50';c.lineWidth=2;c.beginPath();c.ellipse(0,48,32+Math.sin(phase*4)*3,72,0,0,Math.PI*2);c.stroke();
    }
    if(f.grounded&&!ghost){c.save();c.scale(1/f.face,1);c.fillStyle='#040e1e55';c.beginPath();c.ellipse(0,106,34,7,0,0,Math.PI*2);c.fill();c.restore();}
    let armA=.25,armB=-.2,otherA=-.5,otherB=-.8,legA=.25,legB=-.25,kneeA=.1,kneeB=.1;
    if(state==='run'){const cycle=Math.sin(phase*14);armA=cycle*.7;otherA=-cycle*.7;legA=-cycle*.7;legB=cycle*.7;kneeA=Math.max(0,cycle)*.8;kneeB=Math.max(0,-cycle)*.8;}
    if(['jump','fall','fly','dash','teleport'].includes(state)){armA=1.9;armB=-1.4;otherA=-.6;otherB=-.8;legA=-.65;legB=.75;kneeA=.8;kneeB=-.85;}
    if(state==='punch'){armA=1.5;armB=.1;otherA=.8;otherB=-1.7;legA=.4;legB=-.4;}
    if(state==='kick'){legA=1.35;kneeA=.1;legB=-.3;armA=.7;armB=-1.6;}
    if(state==='uppercut'||state==='dragon'){armA=3.05;armB=-.15;otherA=.9;otherB=-1.7;legA=-.5;legB=.65;kneeB=-1;}
    if(state==='slam'||state==='pound'){armA=2.8;armB=.7;otherA=-2.7;otherB=-.5;legA=.5;legB=-.4;}
    if(state==='charge'){armA=1.35;armB=-2.5;otherA=.9;otherB=-2.1;legA=.5;legB=-.5;}
    if(state==='beam'||state==='blast'){armA=1.5;armB=.05;otherA=1.7;otherB=-.2;legA=.5;legB=-.65;}
    if(state==='block'||state==='shield'){armA=2.3;armB=-.9;otherA=1.8;otherB=-1.3;legA=.4;legB=-.4;}
    if(state==='stun'){armA=-1.3;armB=-.2;otherA=-.7;legA=.8;legB=-.5;}
    const weight=f.character==='titan'?13:10;
    if(!ghost){c.shadowColor=bright;c.shadowBlur=f.charging?17:7;}
    limb(c,0,62,legB,kneeB,23,23,weight*.8,bright);limb(c,-2,33,otherA,otherB,21,23,weight*.7,bright);
    line(c,0,24,0,65,weight,bright);line(c,-9,38,9,38,weight*.7,bright);
    const hand=limb(c,3,34,armA,armB,24,25,weight*.8,bright);limb(c,0,62,legA,kneeA,23,23,weight*.8,bright);
    circle(c,0,11,17,bright);circle(c,0,11,12,ink);line(c,2,8,11,7,2.8,'#f5f5de');
    c.shadowBlur=0;
    if(f.character==='blaze'){c.fillStyle=bright;c.beginPath();c.moveTo(-15,0);c.lineTo(-14,-19);c.lineTo(-4,-8);c.lineTo(4,-25);c.lineTo(9,-8);c.lineTo(23,-13);c.lineTo(14,3);c.fill();}
    else if(f.character==='shadow'){c.strokeStyle=bright;c.lineWidth=6;c.beginPath();c.arc(0,9,21,Math.PI*.8,Math.PI*2.15);c.stroke();}
    else{line(c,-17,2,18,2,7,bright);circle(c,hand.x,hand.y,9,bright);line(c,-11,44,10,44,6,bright);}
    if(f.charging){const radius=9+f.charge/f.spec.charge*18;circle(c,hand.x,hand.y,radius,f.color+'55');circle(c,hand.x,hand.y,radius*.55,'#edffff');}
    if(f.shield){c.strokeStyle='#c3f6e9';c.lineWidth=3;c.beginPath();c.ellipse(0,45,50,78,0,0,Math.PI*2);c.stroke();c.strokeStyle=f.color+'55';c.lineWidth=12;c.stroke();}
    c.restore();
  }
  function background(c,now,motion){
    const grad=c.createLinearGradient(0,-100,0,800);grad.addColorStop(0,'#102636');grad.addColorStop(.7,'#4b7979');grad.addColorStop(1,'#c7c9a4');c.fillStyle=grad;c.fillRect(-2000,-1500,5400,3500);
    circle(c,1130,180,75,'#deedc733');circle(c,1130,180,59,'#e8edc84d');
    for(let i=0;i<30;i++)circle(c,i*137%1400,35+i*73%370,i%3?1:2,'#eaf4d24d');
    for(let i=0;i<9;i++){const x=i*200-100,y=530+i%3*48;c.fillStyle=i%2?'#203c4c66':'#38576677';c.beginPath();c.moveTo(x,740);c.lineTo(x+70,y-90);c.lineTo(x+115,y-130);c.lineTo(x+190,740);c.fill();}
    c.fillStyle='#18333c';c.fillRect(-100,740,1600,500);c.fillStyle='#b6c9aa';c.fillRect(0,738,1400,4);c.fillStyle='#57968c';c.fillRect(0,744,1400,6);
    c.strokeStyle='#739b8533';c.lineWidth=2;for(let x=-100;x<=1500;x+=100){c.beginPath();c.moveTo(x,750);c.lineTo(700+(x-700)*1.7,1000);c.stroke();}
    for(let y=775;y<1000;y+=65){c.beginPath();c.moveTo(0,y);c.lineTo(1400,y);c.stroke();}
    for(const x of [30,1330]){line(c,x,520,x,738,8,'#304e51');circle(c,x,510,13,'#b8d39f');line(c,x-14,535,x+14,535,3,'#92b5a4');}
    label(c,'SKY RING / 07',90,775,11,'#a8c7ac','left');label(c,'OSIEQ COMBAT SYSTEMS',1320,775,10,'#9bbda5','right');
    if(motion)for(let i=0;i<10;i++){const x=(i*167+now*8)%1400;line(c,x,270+i*29,x+50,270+i*29,1,'#e4f5de12');}
  }
  function draw(canvas,match,camera,now,dt,motion=true){
    const c=canvas.getContext('2d'),view=camera.update(match,canvas.width/canvas.height,dt,motion);
    c.clearRect(0,0,canvas.width,canvas.height);c.save();
    if(motion&&match.shake>0)c.translate(Math.sin(now*89)*match.shake*12,Math.cos(now*71)*match.shake*9);
    c.scale(canvas.width/view.w,canvas.height/view.h);c.translate(-view.x,-view.y);background(c,now,motion);
    for(const f of match.fighters){if(motion)for(const ghost of f.afterimages){c.save();c.globalAlpha=Math.min(.4,ghost.life);fighter(c,{...f,...ghost,attack:null,charging:false,shield:false,ko:false},now,false,true);c.restore();}fighter(c,f,now,motion);}
    for(const b of match.projectiles){const owner=match.fighters[b.owner],x=b.x+12,y=b.y+12;c.save();c.shadowColor=owner.color;c.shadowBlur=22;line(c,x-b.vx*.04,y,x,y,17,owner.color+'55');circle(c,x,y,14,owner.color);circle(c,x,y,8,'#eeffff');c.restore();}
    for(const b of match.beams){const f=match.fighters[b.owner],end=b.clashed?b.clashX:b.face>0?1400:0;c.save();c.shadowColor=f.color;c.shadowBlur=25;line(c,b.x,b.y,end,b.y,motion?38+Math.sin(now*45)*4:38,f.color+'77');line(c,b.x,b.y,end,b.y,19,f.color);line(c,b.x,b.y,end,b.y,7,'#f3fff5');c.restore();}
    if(match.clash){const p=match.clash;c.save();c.shadowColor='#e7efc4';c.shadowBlur=40;circle(c,p.x,p.y,42,'#e9f6c2aa');circle(c,p.x,p.y,22,'#fcffe8');c.restore();}
    for(const wave of match.waves){c.strokeStyle=wave.color;c.lineWidth=4;c.globalAlpha=wave.life/.45;const r=wave.radius*(1-wave.life/.5);c.beginPath();c.ellipse(wave.x,wave.y,r,35,0,Math.PI,0);c.stroke();for(let i=0;i<5;i++)line(c,wave.x,wave.y,wave.x+(i-2)*r*.4,wave.y+12+(i%2)*8,2,wave.color);c.globalAlpha=1;}
    if(motion)for(const p of match.effects.pool)if(p.life>0){c.globalAlpha=Math.min(1,p.life*3);circle(c,p.x,p.y,p.size,p.color);}c.globalAlpha=1;
    for(const t of match.texts){c.globalAlpha=Math.min(1,t.life*2);label(c,t.text,t.x,t.y,20,t.color);}c.globalAlpha=1;
    for(const f of match.fighters)if(f.combo>1&&match.phase==='fight'){label(c,`${f.combo} HITS`,f.x+f.w/2,f.y-57,Math.min(36,19+f.combo*1.3),f.color);}
    c.restore();
    if(motion&&match.flash>0){c.fillStyle=`rgba(235,255,244,${Math.min(.22,match.flash)})`;c.fillRect(0,0,canvas.width,canvas.height);}
    if(match.phase==='intro'){c.fillStyle='#0a1e2d55';c.fillRect(0,0,canvas.width,canvas.height);label(c,match.intro>.48?`ROUND ${match.roundNumber}`:'FIGHT',canvas.width/2,canvas.height*.42,Math.min(54,canvas.width*.08),'#f3efcf');label(c,'TAKE IT TO THE SKY',canvas.width/2,canvas.height*.42+45,12,'#c7dfcd');}
  }
  Object.assign(S,{FightArt:{draw,fighter}});
})();
