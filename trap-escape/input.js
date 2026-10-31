(() => {
 'use strict';
 class EscapeInput{
  constructor(active){this.active=active;this.keys=new Set();this.pending={};this.touch={};this.axis=0;
   window.addEventListener('keydown',e=>{
    if(!this.active()||e.ctrlKey||e.metaKey||e.altKey||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if(['BUTTON','A'].includes(e.target.tagName)&&['Space','Enter'].includes(e.code))return;
    if(e.code==='Tab'&&e.target.id!=='stage')return;
    const action={KeyW:'jump',ArrowUp:'jump',Space:'jump',KeyE:'drop',KeyF:'drop',KeyQ:'cycle',Tab:'cycle'}[e.code];
    if(action||['KeyA','KeyD','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(!e.repeat&&action)this.pending[action]=true;this.keys.add(e.code);}
   });
   window.addEventListener('keyup',e=>this.keys.delete(e.code));window.addEventListener('blur',()=>this.reset());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});let landscape=innerWidth>innerHeight;window.addEventListener('resize',()=>{const next=innerWidth>innerHeight;if(next!==landscape)this.reset();landscape=next;});
   for(const action of ['jump','drop']){const b=document.getElementById(action+'-button');let pointer=null;
    b.addEventListener('pointerdown',e=>{if(!this.active()||pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;b.setPointerCapture(pointer);this.touch[action]=true;this.pending[action]=true;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{if(e.pointerId===pointer){pointer=null;this.touch[action]=false;}});
    b.addEventListener('click',e=>{if(e.detail===0&&this.active())this.pending[action]=true;});
   }
   window.ArcadeStick(document.getElementById('move-stick'),document.getElementById('move-thumb'),x=>{this.axis=this.active()&&Math.abs(x)>.12?x:0;});
  }
  reset(){this.keys.clear();this.pending={};this.touch={};this.axis=0;const t=document.getElementById('move-thumb');if(t){t.style.left='calc(50% - 17px)';t.style.top='calc(50% - 17px)';}}
  consume(){const k=this.keys,p=this.pending;this.pending={};const x=(k.has('KeyD')||k.has('ArrowRight')?1:0)-(k.has('KeyA')||k.has('ArrowLeft')?1:0);return{x:x||this.axis,jump:!!(p.jump||this.touch.jump||k.has('KeyW')||k.has('ArrowUp')||k.has('Space')),drop:!!(p.drop||this.touch.drop||k.has('KeyE')||k.has('KeyF')),cycle:!!(p.cycle||k.has('KeyQ')||k.has('Tab'))};}
 }
 window.TrapEscape.EscapeInput=EscapeInput;
})();
