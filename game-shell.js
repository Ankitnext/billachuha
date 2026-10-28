/* Preserve game state and event handlers while docking existing controls. */
(() => {
 'use strict';
 window.ArcadeStick=(base,thumb,onMove)=>{
  let pointer=null;
  function move(event){
   const box=base.getBoundingClientRect(),radius=base.clientWidth/2,thumbRadius=thumb.clientWidth/2,max=Math.max(1,radius-thumbRadius);
   let dx=event.clientX-box.left-box.width/2,dy=event.clientY-box.top-box.height/2;
   const length=Math.hypot(dx,dy);if(length>max){dx=dx/length*max;dy=dy/length*max;}
   thumb.style.left=`${radius+dx-thumbRadius}px`;thumb.style.top=`${radius+dy-thumbRadius}px`;onMove(dx/max,dy/max);
  }
  function reset(){const old=pointer;pointer=null;if(old!==null&&base.hasPointerCapture(old))base.releasePointerCapture(old);thumb.style.left='calc(50% - 17px)';thumb.style.top='calc(50% - 17px)';onMove(0,0);}
  base.addEventListener('pointerdown',event=>{if(pointer!==null||(event.pointerType==='mouse'&&event.button!==0))return;event.preventDefault();pointer=event.pointerId;base.setPointerCapture(pointer);move(event);});
  base.addEventListener('pointermove',event=>{if(event.pointerId===pointer){event.preventDefault();move(event);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(type,event=>{if(event.pointerId===pointer)reset();});
  window.addEventListener('resize',reset);window.addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});reset();
 };
 if(document.documentElement.dataset.arcadeLayout==='custom')return;
 const canvas=document.querySelector('canvas'); if(!canvas)return;
 document.documentElement.classList.add('arcade-page');
 const make=(tag,cls)=>{const n=document.createElement(tag);n.className=cls;return n;};
 const shell=make('main','arcade-shell'), header=make('header','arcade-toolbar');
 const home=make('a','');home.href='index.html';home.textContent='‹ Games';
 const title=make('h1','arcade-title');title.textContent='Billa Chuha';
 const credit=make('small','arcade-credit');credit.textContent=document.title.replace(/^Billa Chuha — /,'').replace(/ \| Osieq$/,'')+' · A game by Osieq';title.append(credit);
 const fullscreen=make('button','');fullscreen.type='button';fullscreen.textContent='Full screen';
 fullscreen.hidden=!document.documentElement.requestFullscreen;
 fullscreen.onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{});};
 header.append(home,title,fullscreen);
 const play=make('div','arcade-play'), stage=make('section','arcade-stage'), left=make('div','arcade-rail arcade-left'),right=make('div','arcade-rail arcade-right');
 left.setAttribute('aria-label','Movement controls');right.setAttribute('aria-label','Action controls');
 const screen=document.getElementById('game-container') || (location.pathname.endsWith('fight.html')?canvas.parentElement:make('div',''));
 if(!screen.contains(canvas))screen.append(canvas);
 screen.classList.add('arcade-screen');stage.append(screen);
 const restart=document.getElementById('restart');if(restart)screen.append(restart);
 const stick=document.getElementById('joystick-container');if(stick)left.append(stick);
 for(const [baseId,knobId,rail] of [['move-base','move-knob',left],['aim-base','aim-knob',right]]){
  const base=document.getElementById(baseId),knob=document.getElementById(knobId);if(base)rail.append(base);if(knob)rail.append(knob);
 }
 const arrows=['up','left','down','right'].map(id=>document.getElementById(id));
 if(arrows.every(Boolean)){const pad=make('div','arcade-pad');pad.append(...arrows);left.append(pad);}
 for(const id of ['jumpBtn','fire-button','runButton','jumpButton']){const button=document.getElementById(id);if(button)right.append(button);}
 if(location.pathname.endsWith('fight.html')) {
  const pad=make('div','arcade-pad');
  for(const [label,key,rail] of [['←','a',pad],['→','d',pad],['Jump','w',right],['Attack',' ',right]]){
   const button=make('button','');button.type='button';button.textContent=label;button.dataset.fightKey=key;rail.append(button);
  }
  left.append(pad);
  const rematch=make('button','');rematch.textContent='Rematch';rematch.onclick=()=>location.reload();right.append(rematch);
 }
 if(!right.children.length){const hint=make('p','arcade-help');hint.textContent=left.children.length?'Use the movement controls':'Animation preview';right.append(hint);}
 play.append(left,stage,right);shell.append(header,play);
 // Remove presentation wrappers, but keep script nodes and their already-loaded code.
 for(const child of [...document.body.children])if(child.tagName!=='SCRIPT')child.remove();
 document.body.append(shell);
 const aspect=location.pathname.endsWith('index6.html')?2/3:canvas.width/canvas.height || 1.5;
 function fit(){
  const box=stage.getBoundingClientRect(),w=Math.max(1,Math.min(box.width,box.height*aspect)),h=w/aspect;
  screen.style.setProperty('width',`${w}px`,'important');screen.style.setProperty('height',`${h}px`,'important');
 }
 new ResizeObserver(fit).observe(stage);fit();
 window.visualViewport?.addEventListener('resize',fit);window.addEventListener('resize',fit);
 window.addEventListener('load',()=>{fit();window.dispatchEvent(new Event('resize'));});
 // Recenter legacy thumbs after layout/rotation without changing gameplay coordinates.
 if(stick){const thumb=document.getElementById('joystick-thumb');if(thumb){thumb.style.left='calc(50% - 17px)';thumb.style.top='calc(50% - 17px)';}}
 window.addEventListener('keydown',event=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(event.key)&&!event.target.matches('input,textarea,select'))event.preventDefault();});
 const touches=new Map(),pressedKeys=new Map();
 document.addEventListener('touchstart',event=>{for(const touch of event.changedTouches)touches.set(touch.identifier,{touch,target:event.target});},{capture:true,passive:true});
 for(const type of ['touchend','touchcancel'])document.addEventListener(type,event=>{for(const touch of event.changedTouches)touches.delete(touch.identifier);},{capture:true,passive:true});
 document.addEventListener('keydown',event=>pressedKeys.set(event.code||event.key,{key:event.key,code:event.code}),true);
 document.addEventListener('keyup',event=>pressedKeys.delete(event.code||event.key),true);
 function releaseControls(){
  for(const {touch,target} of [...touches.values()]){const event=new Event('touchcancel',{bubbles:true});Object.defineProperties(event,{touches:{value:[]},changedTouches:{value:[touch]}});target.dispatchEvent(event);}
  touches.clear();
  for(const key of pressedKeys.values())document.dispatchEvent(new KeyboardEvent('keyup',{...key,bubbles:true}));pressedKeys.clear();
 }
 window.addEventListener('resize',releaseControls);window.addEventListener('blur',releaseControls);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseControls();});
})();
