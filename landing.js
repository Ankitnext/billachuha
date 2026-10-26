/* Local, illustrative preview: no socket, match simulation or external asset requests. */
(() => {
  'use strict';
  const download=document.getElementById('android-download');
  if(download){
    try {const target=new URL(window.BILLACHUHA_CONFIG.androidDownloadUrl);if(target.protocol!=='https:'||target.username||target.password)throw Error();download.href=target.href;download.hidden=false;document.getElementById('android-status').textContent='Download the Android app from the published link below.';}
    catch(_){document.getElementById('android-status').textContent='The Android app is being prepared for public download. Explore the browser game library while the published download becomes available.';}
  }
  const canvas=document.getElementById('chase-preview'),button=document.getElementById('preview-toggle');if(!canvas)return;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let paused=reduced.matches,visible=false,frame=null,last=0,time=0;
  function circle(x,y,r,color){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function animal(x,y,type,color){ctx.save();ctx.translate(x,y);ctx.fillStyle='#0004';ctx.beginPath();ctx.ellipse(0,15,22,8,0,0,Math.PI*2);ctx.fill();if(type==='rat'){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,4);ctx.quadraticCurveTo(-40,25,-44,4);ctx.stroke();circle(-8,-15,8,color);circle(8,-15,8,color);}else if(type==='cat'){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-17,-3);ctx.lineTo(-15,-26);ctx.lineTo(-1,-13);ctx.lineTo(15,-26);ctx.lineTo(17,0);ctx.fill();}else{circle(-19,-7,9,'#567b98');circle(19,-7,9,'#567b98');}circle(0,0,21,color);circle(-7,-3,3,'#101812');circle(7,-3,3,'#101812');circle(0,7,3,'#101812');ctx.restore();}
  function draw(){ctx.fillStyle='#283c2e';ctx.fillRect(0,0,720,380);ctx.strokeStyle='#ffffff09';ctx.lineWidth=1;for(let x=0;x<720;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,380);ctx.stroke();}for(let y=0;y<380;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(720,y);ctx.stroke();}for(const [x,y,w,h] of [[210,130,105,100],[445,130,105,100]]){ctx.fillStyle='#122419';ctx.fillRect(x+5,y+8,w,h);ctx.fillStyle='#976f42';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#c49a65';ctx.strokeRect(x+6,y+6,w-12,h-12);}for(let i=0;i<10;i++){const a=i*Math.PI/5;const x=360+245*Math.cos(a),y=190+130*Math.sin(a);ctx.fillStyle='#efd66b';ctx.beginPath();ctx.moveTo(x-8,y+6);ctx.lineTo(x+9,y+6);ctx.lineTo(x+4,y-9);ctx.closePath();ctx.fill();}for(const [offset,type,color] of [[0,'rat','#c5e66b'],[.65,'cat','#f3b273'],[1.25,'dog','#8cbee7']]){const a=time*.55-offset;animal(360+245*Math.cos(a),190+130*Math.sin(a),type,color);}}
  function updateButton(){button.textContent=paused?'Play preview':'Pause preview';button.setAttribute('aria-pressed',String(paused));}
  function tick(now){frame=null;if(paused||!visible||document.hidden)return;if(now-last>=33){time+=last?Math.min(now-last,70)/1000:0;last=now;draw();}frame=requestAnimationFrame(tick);}
  function sync(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  button.addEventListener('click',()=>{paused=!paused;updateButton();sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;updateButton();sync();});
  if(typeof IntersectionObserver==='function')new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);else{visible=true;sync();}
  document.addEventListener('visibilitychange',sync);window.addEventListener('pagehide',()=>{visible=false;sync();});window.addEventListener('pageshow',()=>{const box=canvas.getBoundingClientRect();visible=box.bottom>0&&box.top<innerHeight;sync();});updateButton();draw();
})();
