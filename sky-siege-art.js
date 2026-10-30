/* Original Canvas characters, towers and layered skies. No image downloads. */
((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./sky-siege-core.js'):root.SkySiege);if(typeof module==='object'&&module.exports)module.exports=api;else root.SkySiegeArt=api;})(globalThis,S=>{
  const M=typeof module==='object'&&module.exports?require('./character-motion.js'):globalThis.CharacterMotion;
  const PALETTES={kitchen:{sky:'#e8eee2',far:'#cad9ce',plat:'#8b7355',edge:'#b0a080',accent:'#e6ae55'},garden:{sky:'#e4edce',far:'#b6c990',plat:'#5a8a4a',edge:'#a4c575',accent:'#78c070'},rooftop:{sky:'#253d53',far:'#375069',plat:'#6a7a8a',edge:'#9caeb4',accent:'#e7bb71'},sewer:{sky:'#273f3c',far:'#344d46',plat:'#4a6a50',edge:'#8aa68c',accent:'#b7d477'},inferno:{sky:'#523d39',far:'#69433a',plat:'#8a5a3a',edge:'#ce9867',accent:'#f0a465'}};
  const round=(c,x,y,w,h,r=4)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
  function label(c,text,x,y,size=11,color='#fff',align='center'){c.font=`700 ${size}px system-ui`;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);}
  function mix(a,b,t){const n=x=>parseInt(x.slice(1),16),x=n(a),y=n(b),out=[16,8,0].map(shift=>Math.round(((x>>shift)&255)*(1-t)+((y>>shift)&255)*t));return'#'+out.map(v=>v.toString(16).padStart(2,'0')).join('');}
  function palette(run){const n=Math.floor(run.highestLayer/25),current=PALETTES[S.THEMES[n%5]],previous=PALETTES[S.THEMES[(n+4)%5]],t=n===0?1:Math.min(1,(run.highestLayer%25)/3);return Object.fromEntries(Object.keys(current).map(k=>[k,mix(previous[k],current[k],t)]));}
  function cheese(c,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#c18e3a';c.beginPath();c.moveTo(-10,7);c.lineTo(10,7);c.lineTo(8,-7);c.closePath();c.fill();c.fillStyle='#ffe49a';c.beginPath();c.moveTo(-10,3);c.lineTo(10,3);c.lineTo(8,-11);c.closePath();c.fill();c.fillStyle='#dcaf51';for(const [x,y,r]of [[4,-3,2],[-1,0,1.5],[7,2,1.4]]){c.beginPath();c.arc(x,y,r,0,7);c.fill();}c.restore();}
  function rat(c,p,time,motion=true){const pose=M.forActor(p,time,{grounded:p.grounded,vy:p.vy,motion});c.save();c.translate(p.x,p.y+pose.bob);c.scale(p.face,1);M.sideLimbs(c,pose,{w:30,h:40,color:'#438d95'});c.strokeStyle='#6c9699';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(-12,-12);c.bezierCurveTo(-33,-12+pose.swing*3,-29,-4,-39,-8);c.stroke();
    c.fillStyle='#5eb6b5';c.beginPath();c.ellipse(0,-18,16,13,0,0,7);c.fill();c.fillStyle='#8cd2c5';c.beginPath();c.ellipse(9,-29,13,11,0,0,7);c.fill();c.fillStyle='#438d95';c.beginPath();c.arc(0,-38,8,0,7);c.fill();c.fillStyle='#dca8a3';c.beginPath();c.arc(0,-38,4.7,0,7);c.fill();c.fillStyle='#1c3b43';c.beginPath();c.arc(15,-31,2,0,7);c.fill();c.fillStyle='#e6b69f';c.beginPath();c.arc(23,-26,2.5,0,7);c.fill();c.strokeStyle='#d9eee2';c.lineWidth=.8;for(const y of [-30,-25]){c.beginPath();c.moveTo(20,y);c.lineTo(29,y-2);c.stroke();}c.restore();}
  function cat(c,cat,time,visible=true,motion=true){c.save();c.translate(cat.x,cat.y);if(cat.state==='falling')c.rotate(cat.angle||0);c.scale(cat.face||1,1);c.globalAlpha=visible?1:.09;const tank=cat.type==='tank',color={walker:'#d99551',jumper:'#c89362',tank:'#a9aaa0',ninja:'#384559'}[cat.type];
    const pose=M.forActor(cat,time,{grounded:!cat.travel,dead:cat.state==='stunned'||cat.state==='falling',motion});c.translate(0,pose.bob);M.sideLimbs(c,pose,{w:tank?38:28,h:43,color});
    c.strokeStyle=color;c.lineWidth=tank?8:5;c.lineCap='round';c.beginPath();c.moveTo(-12,-12);c.bezierCurveTo(-33,-12,-27,-29,-20,-25);c.stroke();c.fillStyle=color;c.beginPath();c.ellipse(0,-17,tank?21:14,tank?17:13,0,0,7);c.fill();c.beginPath();c.ellipse(6,-33,tank?17:13,12,0,0,7);c.fill();for(const x of [-4,15]){c.beginPath();c.moveTo(x-5,-39);c.lineTo(x-3,-52);c.lineTo(x+8,-40);c.closePath();c.fill();}
    c.fillStyle=cat.type==='ninja'?'#172536':'#f1c792';round(c,-6,-37,24,8,3);c.fill();c.fillStyle=cat.type==='ninja'?'#d9e3bd':'#263a33';c.fillRect(10,-35,3,3);
    if(cat.type==='jumper'){c.strokeStyle='#e2d9a3';c.lineWidth=1.6;for(const x of [-8,6]){c.beginPath();for(let i=0;i<6;i++)c.lineTo(x+(i%2?5:0),-18+i*3);c.stroke();}}
    if(tank){c.fillStyle='#6b7e84';round(c,-13,-48,39,10,5);c.fill();c.fillRect(-14,-40,5,12);label(c,cat.hp===2?'II':'I',0,-16,10,'#f4ead3');}
    if(cat.type==='ninja'){c.strokeStyle='#aca4c5';c.lineWidth=3;c.beginPath();c.moveTo(-5,-39);c.lineTo(-20,-34);c.stroke();}
    if(cat.state==='stunned'){label(c,'✦',-10,-57,15,'#f5d385');label(c,'✦',15,-61,10,'#f5d385');}c.restore();
  }
  function dog(c,t,time,motion=true){c.save();c.translate(t.x,t.y);c.fillStyle='#97704e';c.beginPath();c.ellipse(0,-16,16,15,0,0,7);c.fill();round(c,-10,-5,24,5,2);c.fill();c.fillStyle='#b38862';round(c,-12,-43,28,27,8);c.fill();c.fillStyle='#674e3d';round(c,-18,-40,10,22,5);c.fill();c.fillStyle='#e3c79a';round(c,5,-32,20,12,5);c.fill();c.fillStyle='#263c3d';c.beginPath();c.arc(23,-28,3,0,7);c.fill();c.beginPath();c.arc(10,-37,2,0,7);c.fill();c.fillStyle='#657c70';round(c,-11,-20,24,5,2);c.fill();c.strokeStyle='#b38862';c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(10,-18);c.lineTo(t.punchUntil>time?33:17,-15);c.stroke();
    if(t.barkUntil>time&&motion){const progress=(.5-(t.barkUntil-time))/.5;c.strokeStyle='#ebd9a7';c.lineWidth=1.8;c.globalAlpha=1-progress;for(const r of [16,28]){c.beginPath();c.arc(24,-29,r+progress*24,-.7,.7);c.stroke();}}c.restore();
  }
  function trap(c,t,time,motion=true){c.save();c.translate(t.x,t.y);
    if(t.type==='butter'){c.fillStyle='#e5c35f';c.beginPath();c.ellipse(0,-2,19,4,0,0,7);c.fill();c.fillStyle='#fff0a2';round(c,-8,-9,17,7,2);c.fill();c.strokeStyle='#fff4c1';c.beginPath();c.moveTo(-10,-2);c.lineTo(12,-2);c.stroke();}
    if(t.type==='magnet'){c.strokeStyle='#cf7169';c.lineWidth=7;c.beginPath();c.arc(0,-10,10,0,Math.PI);c.stroke();c.fillStyle='#dae2d7';c.fillRect(-14,-18,7,8);c.fillRect(7,-18,7,8);if(t.state==='holding'&&motion){c.strokeStyle='#d5e2ba';c.lineWidth=1;c.beginPath();c.arc(0,-10,20+Math.sin(time*14)*3,0,7);c.stroke();}}
    if(t.type==='firecracker'){c.fillStyle='#b94e4e';round(c,-6,-24,12,23,3);c.fill();c.fillStyle='#f2c37a';c.fillRect(-5,-19,10,3);c.strokeStyle='#b79c6b';c.lineWidth=2;c.beginPath();c.moveTo(1,-24);c.quadraticCurveTo(12,-34,6,-37);c.stroke();if(t.state==='fuse'){c.fillStyle='#ffdd8a';c.beginPath();c.arc(6,-37,motion?3+Math.sin(time*29)*1.5:4,0,7);c.fill();}}
    c.restore();if(t.type==='dogGuard')dog(c,t,time,motion);
  }
  function background(c,run,p,motion){const h=run.viewHeight,camera=run.cameraY;c.fillStyle=p.sky;c.fillRect(0,0,480,h);c.fillStyle=p.far;
    for(let i=0;i<7;i++){const x=i*86-20,y=((i*113-camera*.15)%(h+160)+h+160)%(h+160)-80;round(c,x,y,50,125,10);c.fill();c.fillStyle=p.sky+'88';c.fillRect(x+12,y+18,26,42);c.fillStyle=p.far;}
    c.strokeStyle=p.far;c.lineWidth=7;for(let x=28;x<480;x+=210){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
    c.globalAlpha=.35;for(let i=0;i<15;i++){const y=((i*89-camera*.3)%(h+100)+h+100)%(h+100)-50;c.fillStyle=p.accent;c.beginPath();c.arc((i*79+40)%480,y,i%3===0?3:1.5,0,7);c.fill();}c.globalAlpha=1;
    const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#ffffff08');shade.addColorStop(1,'#19313e18');c.fillStyle=shade;c.fillRect(0,0,480,h);
  }
  function draw(canvas,run,{motion=true}={}){
    const c=canvas.getContext('2d'),p=palette(run),time=run.elapsed;c.clearRect(0,0,canvas.width,canvas.height);c.save();c.scale(canvas.width/480,canvas.height/run.viewHeight);background(c,run,p,motion);c.save();c.translate(0,-run.cameraY);
    for(const layer of run.layers){if(layer.y<run.cameraY-100||layer.y>run.cameraY+run.viewHeight+80)continue;
      if(layer.index%5===0){label(c,String(layer.index).padStart(2,'0'),17,layer.y-25,20,p.plat,'left');c.strokeStyle=p.far;c.setLineDash([3,7]);c.lineWidth=1;c.beginPath();c.moveTo(57,layer.y-31);c.lineTo(458,layer.y-31);c.stroke();c.setLineDash([]);}
      for(const platform of layer.platforms){const t=platform.trap;c.fillStyle='#19342620';round(c,platform.x+3,platform.y+7,platform.w,platform.h,4);c.fill();if(t){c.save();c.shadowColor=S.TRAPS[t.type].color;c.shadowBlur=motion?10:4;c.fillStyle=p.plat;round(c,platform.x,platform.y,platform.w,platform.h,4);c.fill();c.restore();}else{c.fillStyle=p.plat;round(c,platform.x,platform.y,platform.w,platform.h,4);c.fill();}c.fillStyle=p.edge;round(c,platform.x,platform.y,platform.w,5,3);c.fill();c.strokeStyle='#e3dab540';c.lineWidth=1;c.beginPath();c.moveTo(platform.x+8,platform.y+10);c.lineTo(platform.x+platform.w-9,platform.y+10);c.stroke();
        if(run.theme==='garden'){c.strokeStyle='#5c914e';c.lineWidth=2;c.beginPath();c.moveTo(platform.x+10,platform.y+16);c.quadraticCurveTo(platform.x+4,platform.y+33,platform.x+16,platform.y+39);c.stroke();}
        const pickup=platform.cheese;if(pickup&&!pickup.collected){cheese(c,pickup.x,pickup.y+(motion?Math.sin(time*3+layer.index)*2:0),pickup.value>1?1.15:.85);if(pickup.value>1)label(c,'+2',pickup.x,pickup.y-16,8,p.plat);}
        if(t)trap(c,t,time,motion);
        if(run.player.standing===platform.id&&run.phase==='playing'){const name=Object.keys(S.TRAPS)[run.selectedTrap],affordable=run.cheese>=run.cost(name);c.strokeStyle=affordable?'#5e9a7a':'#b68561';c.lineWidth=1.5;c.setLineDash([3,4]);c.strokeRect(platform.x-3,platform.y-3,platform.w+6,platform.h+6);c.setLineDash([]);if(!t)label(c,S.TRAPS[name].mark+' · '+run.cost(name),platform.x+platform.w/2,platform.y+31,9,p.plat);}
      }
    }
    for(const enemy of run.cats)if(enemy.y>run.cameraY-70&&enemy.y<run.cameraY+run.viewHeight+80)cat(c,{...enemy,face:run.player.x>=enemy.x?1:-1},time,run.catVisible(enemy),motion);
    for(const e of run.effects){if(!motion)continue;const progress=e.age/e.life;c.save();c.globalAlpha=1-progress;if(e.type==='defeat'){c.translate(e.x,e.y);c.rotate(e.age*9);cat(c,{x:0,y:0,type:e.catType,hp:0},time,true,true);}else if(e.type==='blast'){c.fillStyle='#f0b15b40';c.beginPath();c.arc(e.x,e.y,Math.min(e.radius,e.age*350),0,7);c.fill();c.strokeStyle='#f5d88d';c.lineWidth=2;c.stroke();}else{for(let i=0;i<6;i++){const angle=i*Math.PI/3;cheese(c,e.x+Math.cos(angle)*progress*35,e.y+Math.sin(angle)*progress*35,.16);}}c.restore();}
    rat(c,run.player,time,motion);c.restore();
    const pending=run.pending[0];if(pending){c.fillStyle='#233943ec';round(c,65,18,350,47,7);c.fill();label(c,'WAVE '+pending.number+' / INCOMING '+Math.max(0,Math.ceil(pending.at-run.elapsed))+'s',240,38,12,'#f5d6a2');label(c,pending.types.map(t=>S.CAT_TYPES[t].name.toUpperCase()).join(' · '),240,54,8,'#b4c9bd');}
    if(run.phase==='caught'||run.phase==='dead'){c.fillStyle='#102536c9';c.fillRect(0,0,480,run.viewHeight);label(c,'THE CATS WIN.',240,run.viewHeight*.45,27,'#f4dcb1');label(c,'The next tower is yours.',240,run.viewHeight*.45+29,12,'#b6d0c3');}
    c.restore();
  }
  return{PALETTES,draw,rat,cat,cheese};
});
