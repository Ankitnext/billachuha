/* Canvas-native Dungeon Dash artwork. No remote assets or sprite downloads. */
(() => {
  'use strict';
  const M=window.CharacterMotion;
  const palettes={
    kitchen:{sky:['#e7d6ad','#c3c79e'],wall:'#b9aa80',platform:'#6c6546',top:'#b5bb76',ink:'#4a5237',accent:'#9f7551'},
    garden:{sky:['#c7dfb5','#e4e8b9'],wall:'#93ae80',platform:'#567149',top:'#abd16f',ink:'#34503a',accent:'#a9bb76'},
    rooftop:{sky:['#192d42','#3f5263'],wall:'#32495f',platform:'#526477',top:'#9cb9ae',ink:'#e4e6c4',accent:'#88aeb4'},
    sewer:{sky:['#233e3a','#4e6250'],wall:'#425547',platform:'#6f644d',top:'#a6ac73',ink:'#d6dfaf',accent:'#96b48a'},
    inferno:{sky:['#322e37','#7b4741'],wall:'#69463d',platform:'#4b4144',top:'#d59a6b',ink:'#f1d6ae',accent:'#b56c51'}
  };
  const rect=(c,x,y,w,h,r,color,stroke)=>{c.beginPath();c.roundRect(x,y,w,h,r);if(color){c.fillStyle=color;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}};
  const circle=(c,x,y,r,color)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();};
  const text=(c,label,x,y,size=12,color='#f1edcc',align='center')=>{c.font=`800 ${size}px system-ui`;c.fillStyle=color;c.textAlign=align;c.textBaseline='middle';c.fillText(label,x,y);};
  function head(c,x,y,r,role,color){
    c.save();c.translate(x,y);
    if(role==='rat'){circle(c,-r*.8,-r*.7,r*.48,color);circle(c,r*.8,-r*.7,r*.48,color);circle(c,-r*.8,-r*.7,r*.25,'#d2b7a1');circle(c,r*.8,-r*.7,r*.25,'#d2b7a1');}
    else if(role==='cat'){c.fillStyle=color;c.beginPath();c.moveTo(-r,-r*.1);c.lineTo(-r,-r*1.35);c.lineTo(-r*.1,-r*.6);c.moveTo(r,-r*.1);c.lineTo(r,-r*1.35);c.lineTo(r*.1,-r*.6);c.fill();}
    else{rect(c,-r*1.3,-r*.5,r*.6,r*1.5,r*.2,color);rect(c,r*.7,-r*.5,r*.6,r*1.5,r*.2,color);}
    circle(c,0,0,r,color);circle(c,-r*.36,-r*.13,r*.18,'#fff4d9');circle(c,r*.36,-r*.13,r*.18,'#fff4d9');circle(c,-r*.36,-r*.13,r*.08,'#2d3e32');circle(c,r*.36,-r*.13,r*.08,'#2d3e32');circle(c,0,r*.36,r*.14,'#34463a');c.restore();
  }
  function gun(c,x,y,angle,type='pistol') {
    c.save();c.translate(x,y);c.rotate(angle);
    if(Math.cos(angle)<0)c.scale(1,-1);
    const length=type==='rocket'?34:type==='shotgun'?32:type==='smg'?28:22;
    rect(c,-5,-5,length,9,2,type==='rocket'?'#a2ad73':'#7d9695','#3d5149');c.fillStyle='#d5ba7f';c.fillRect(length-8,-4,5,7);rect(c,1,4,7,10,1,'#655e47');c.restore();
  }
  function gem(c,x,y,size,now=0) {
    c.save();c.translate(x,y);c.scale(.85+Math.abs(Math.sin(now*3+x))*.15,1);
    c.fillStyle='#76b5a6';c.beginPath();c.moveTo(0,-size);c.lineTo(size*.7,0);c.lineTo(0,size);c.lineTo(-size*.7,0);c.closePath();c.fill();
    c.fillStyle='#c4f0d5';c.beginPath();c.moveTo(0,-size);c.lineTo(0,size*.35);c.lineTo(-size*.7,0);c.closePath();c.fill();c.restore();
  }
  function background(c,w,h,p,theme,now) {
    const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,p.sky[0]);gradient.addColorStop(1,p.sky[1]);c.fillStyle=gradient;c.fillRect(0,0,w,h);
    if(theme==='kitchen') {
      c.strokeStyle='#706d4420';c.lineWidth=2;for(let x=0;x<w;x+=75){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}for(let y=0;y<h;y+=70){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke();}
      for(let x=80;x<w;x+=360){rect(c,x,70,115,100,5,'#efdfb6','#a59d70');c.fillStyle='#b1aa7a';c.fillRect(x+54,70,6,100);c.fillRect(x,117,115,6);rect(c,x-18,170,150,12,3,'#9c8b62');rect(c,x+180,140,46,26,8,'#aa8965');c.strokeStyle='#aa8965';c.lineWidth=5;c.beginPath();c.arc(x+203,142,12,Math.PI,0);c.stroke();}
    } else if(theme==='garden') {
      for(let i=0;i<4;i++){const x=i*250-30;circle(c,x,70+i%2*40,28,'#f7f1cf88');circle(c,x+35,55+i%2*40,37,'#f7f1cf88');circle(c,x+70,70+i%2*40,28,'#f7f1cf88');}
      c.fillStyle='#6b966d55';c.beginPath();c.moveTo(0,h);for(let x=0;x<w+150;x+=160)c.quadraticCurveTo(x+80,h-170,x+160,h-60);c.lineTo(w,h);c.fill();
      for(let x=25;x<w;x+=100){circle(c,x,h-70,11,'#9fbd7444');circle(c,x+18,h-65,15,'#9fbd7444');}
    } else if(theme==='rooftop') {
      for(let i=0;i<45;i++)circle(c,i*139%w,i*71%(h-100),i%3?1:2,'#f5efd07a');circle(c,w-100,70,30,'#e4e3b9');circle(c,w-88,60,28,p.sky[0]);
      for(let x=0;x<w;x+=75){const bh=70+(x*17%110);rect(c,x,h-bh,64,bh,0,'#182c3c55');for(let y=h-bh+15;y<h;y+=24)for(let k=0;k<3;k++)rect(c,x+10+k*17,y,7,9,1,'#e0cd7955');}
    } else if(theme==='sewer') {
      c.strokeStyle='#78917855';c.lineWidth=22;c.beginPath();c.moveTo(0,95);c.lineTo(w*.7,95);c.quadraticCurveTo(w*.8,95,w*.8,150);c.lineTo(w*.8,h);c.stroke();
      c.strokeStyle='#2b433e55';c.lineWidth=3;for(let x=20;x<w;x+=120){c.beginPath();c.moveTo(x,80);c.lineTo(x,111);c.stroke();}
      for(let i=0;i<6;i++)circle(c,(i*137+40)%w,135+(now*45+i*73)%(h-180),2,'#bdd1a366');
    } else {
      c.fillStyle='#aa644c55';for(let x=-50;x<w;x+=210){c.beginPath();c.moveTo(x,h);c.lineTo(x+100,h-230);c.lineTo(x+220,h);c.fill();}
      c.fillStyle='#f1a66455';c.fillRect(0,h-32,w,32);for(let i=0;i<20;i++)circle(c,(i*103)%w,h-((now*26+i*37)%(h-50)),i%3+1,'#f2be6d66');
    }
  }
  function draw(c,canvas,run,now=0,motion=true) {
    const room=run.room,p=palettes[room.theme],w=run.width,h=run.height;
    c.save();c.scale(canvas.width/w,canvas.height/h);background(c,w,h,p,room.theme,motion?now:0);
    if(motion&&run.shake>0)c.translate(Math.sin(now*90)*3,Math.cos(now*75)*2);
    for(const platform of room.platforms){rect(c,platform.x,platform.y,platform.w,platform.h,platform.h>20?0:4,p.platform);c.fillStyle=p.top;c.fillRect(platform.x,platform.y,platform.w,5);if(platform.h<30){c.fillStyle='#0002';c.fillRect(platform.x+5,platform.y+platform.h,platform.w-10,4);}else{for(let x=15;x<w;x+=48)rect(c,x,platform.y+18,27,13,2,'#ffffff0a');}}
    const d=room.door;
    if(room.cleared){c.save();c.shadowColor='#d1e898';c.shadowBlur=motion?15+Math.sin(now*3)*5:15;rect(c,d.x-5,d.y-5,d.w+10,d.h+7,15,'#d6e9a633');c.restore();}
    rect(c,d.x-4,d.y-6,d.w+8,d.h+7,15,'#827956');rect(c,d.x,d.y,d.w,d.h,12,room.cleared?'#3d684e':'#4f4d3a');
    rect(c,d.x+8,d.y+12,d.w-16,29,9,room.cleared?'#b8d88c':'#a8886a');
    if(!room.cleared){rect(c,d.x+14,d.y+40,17,16,3,'#d0a881');c.strokeStyle='#d0a881';c.lineWidth=3;c.beginPath();c.arc(d.x+22.5,d.y+40,6,Math.PI,0);c.stroke();}else text(c,'→',d.x+d.w/2,d.y+49,24,'#deebaf');
    circle(c,d.x+d.w-8,d.y+59,3,'#e9cd89');text(c,room.cleared?'EXIT':'LOCKED',d.x+d.w/2,d.y-20,10,p.ink);
    for(const drop of room.drops){rect(c,drop.x-7,drop.y-9,43,32,5,'#e0ca8a44','#a18d57');gun(c,drop.x+7,drop.y+3,0,drop.type);text(c,'F',drop.x+15,drop.y-18,9,p.ink);}
    for(const drop of room.gems){gem(c,drop.x,drop.y,10,motion?now:0);if(drop.value>1)text(c,String(drop.value),drop.x+10,drop.y-12,9,p.ink);}
    for(const e of room.enemies){
      if(e.hp<=0)continue;
      const role=['shooter','charger','shielded','general','turret'].includes(e.type)?'dog':'cat';
      const colors={walker:'#ba8c75',jumper:'#b19b62',shooter:'#9a9e84',charger:'#b47e65',flyer:'#9e8aaf',shielded:'#8aa29c','fat-cat':'#c7a171',general:'#a7a16e','twin-melee':'#d39b83','twin-ranged':'#9eafc0',turret:'#929885'};
      const color=run.elapsed<e.hitUntil?'#fff5da':colors[e.type];
      const pose=M.forActor(e,run.elapsed,{grounded:e.standing!==null,vy:e.vy,motion,dead:e.type==='turret'});
      c.save();if(e.enraged){c.shadowColor='#ea9b70';c.shadowBlur=9;}
      c.translate(0,pose.bob);
      if(e.type==='flyer'){c.fillStyle='#a7a8bf';for(const dir of [-1,1]){c.beginPath();c.moveTo(e.x+e.w/2,e.y+22);c.quadraticCurveTo(e.x+e.w/2+dir*40,e.y+(motion?Math.sin(now*8)*10:0),e.x+e.w/2+dir*20,e.y+34);c.fill();}}
      if(e.type!=='turret')M.sideLimbs(c,pose,{x:e.x+e.w/2,y:e.y+e.h,w:e.w,h:e.h,color,face:e.dir,
        hand:['general','shooter','twin-ranged'].includes(e.type)?{x:e.x+e.w/2+e.dir*18,y:e.y+e.h*.65}:null});
      rect(c,e.x+e.w*.15,e.y+e.h*.42,e.w*.7,e.h*.42,8,color);head(c,e.x+e.w/2,e.y+e.h*.3,e.w*.45,role,color);
      if(e.type==='general'||e.type==='shooter'||e.type==='turret'||e.type==='twin-ranged')gun(c,e.x+e.w/2+e.dir*16,e.y+e.h*.65,e.dir>0?0:Math.PI,e.type==='general'?'rocket':'pistol');
      if(e.type==='shielded'||run.generalShield(e)){const x=e.x+(e.dir<0?-6:e.w-4);rect(c,x,e.y+10,13,e.h-8,5,'#a5c8b4','#d4e5bf');}
      if(e.warning>run.elapsed)text(c,'!',e.x+e.w/2,e.y-23,20,'#d98d58');
      if(!e.boss&&e.hp<e.maxHp){rect(c,e.x,e.y-10,e.w,4,2,'#374335');rect(c,e.x,e.y-10,e.w*e.hp/e.maxHp,4,2,'#e8d494');}
      if(e.type==='shielded')text(c,'SHIELD',e.x+e.w/2,e.y-18,8,p.ink);c.restore();
    }
    for(const b of run.bombs){circle(c,b.x+9,b.y+9,10,'#414e45');c.strokeStyle='#e0bc79';c.lineWidth=2;c.beginPath();c.moveTo(b.x+12,b.y);c.lineTo(b.x+18,b.y-6);c.stroke();circle(c,b.x+18,b.y-6,3,'#f2c267');}
    for(const wave of run.waves){rect(c,wave.x,wave.y,wave.w,wave.h,6,'#e8b26d');}
    const a=run.player;
    const pose=M.forActor(a,run.elapsed,{grounded:a.standing!==null,vy:a.vy,motion,dead:run.phase==='dying'});
    const target=room.enemies.filter(e=>e.hp>0&&!run.generalShield(e)).sort((b,d)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(a.x-d.x,a.y-d.y))[0];
    const angle=target?Math.atan2(target.y+target.h/2-a.y-26,target.x+target.w/2-a.x-17):a.face>0?0:Math.PI;
    c.save();if(run.elapsed<a.invulnerable&&motion&&Math.floor(now*12)%2)c.globalAlpha=.4;
    if(a.standing!==null){c.fillStyle='#263c3433';c.beginPath();c.ellipse(a.x+17,a.y+51,22,5,0,0,Math.PI*2);c.fill();}
    c.translate(0,pose.bob);
    M.sideLimbs(c,pose,{x:a.x+17,y:a.y+51,w:34,h:52,color:'#72afbf',face:a.face,hand:{x:a.x+17+Math.cos(angle)*17,y:a.y+30}});
    c.strokeStyle='#72afbf';c.lineWidth=3;c.beginPath();c.moveTo(a.x+6,a.y+35);c.quadraticCurveTo(a.x-19,a.y+41+pose.swing*3,a.x-9,a.y+49);c.stroke();
    rect(c,a.x+6,a.y+23,23,20,6,'#72afbf');head(c,a.x+17,a.y+15,15,'rat','#72afbf');
    rect(c,a.x+5,a.y+27,25,5,2,'#d3b778');
    gun(c,a.x+17+Math.cos(angle)*17,a.y+30,angle,run.weapon.type);
    if(run.shield){c.strokeStyle='#abdcca';c.lineWidth=2;c.beginPath();c.ellipse(a.x+17,a.y+26,29,36,0,0,Math.PI*2);c.stroke();}c.restore();
    for(const b of run.bullets){
      c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));
      c.strokeStyle=b.owner==='enemy'?'#e4a38499':'#eed19288';c.lineWidth=2;c.beginPath();c.moveTo(-15,0);c.lineTo(0,0);c.stroke();
      c.fillStyle=b.owner==='enemy'?'#de926f':'#efcd7d';c.beginPath();c.moveTo(-4,-3);c.lineTo(7,-3);c.lineTo(12,0);c.lineTo(7,3);c.lineTo(-4,3);c.closePath();c.fill();if(b.rocket)circle(c,-6,0,4,'#f2a562');c.restore();
    }
    if(motion)for(const particle of run.particles){c.globalAlpha=Math.min(1,particle.life*2);c.fillStyle=particle.color;c.fillRect(particle.x,particle.y,4,4);}c.globalAlpha=1;
    for(const item of run.texts){c.globalAlpha=Math.min(1,item.life*2);text(c,item.text,item.x,item.y,Math.min(18,w*.027),item.color);}c.globalAlpha=1;
    if(run.combo>1&&run.comboUntil>run.elapsed){text(c,`${run.combo}× CHAIN`,w/2,38,20,p.ink);rect(c,w/2-35,57,70*(run.comboUntil-run.elapsed)/3,3,1,p.accent);}
    if(room.boss&&run.elapsed<run.warningUntil){rect(c,w/2-133,h/2-38,266,75,8,'#362b34e8');text(c,'GUARDIAN AHEAD',w/2,h/2-8,19,'#f0c193');text(c,'WATCH. JUMP. FIGHT.',w/2,h/2+17,10,'#ddc5b0');}
    if(run.phase==='transition'){c.fillStyle=`rgba(7,16,12,${Math.min(1,run.transition/.3)})`;c.fillRect(0,0,w,h);}
    if(run.phase==='dying'){c.fillStyle=`rgba(111,43,36,${Math.min(.7,run.deathTime*1.4)})`;c.fillRect(0,0,w,h);}
    c.restore();
  }
  window.DungeonArt={draw};
})();
