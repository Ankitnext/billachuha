(() => {
 'use strict';const T=window.TrapEscape,$=id=>document.getElementById(id);
 const timeString=ms=>`${(ms/1000).toFixed(2)}s`;
 class EscapeHUD{
  constructor(){this.signature='';this.message='';}
  update(g){const l=g.level,c=g.cat;$('stage-id').textContent=`${T.WORLDS[l.world].name.toUpperCase()} / ${l.id}${l.boss?' · BOSS':''}`;$('stage-name').textContent=l.name;$('clock').textContent=timeString(g.elapsed*1000);$('retry-count').textContent=`${g.retries} ${g.retries===1?'retry':'retries'}`;
   $('stun-meter').textContent='●'.repeat(Math.min(c.stuns,l.targetStuns))+'○'.repeat(Math.max(0,l.targetStuns-c.stuns));$('stun-meter').setAttribute('aria-label',`${c.stuns} of ${l.targetStuns} Cat stuns`);$('combo-meter').textContent=g.combo>1?`${g.combo}× CHAIN!${l.boss?' · 2× needed':''}`:l.boss?'4 stuns + a 2× chain':'Chain traps within 3s';
   const d=Math.max(0,g.player.x-c.x),pct=T.clamp(d/360*100,0,100);$('distance-fill').style.width=(c.state==='waiting'?100:pct)+'%';$('distance-fill').classList.toggle('danger',pct<25&&c.state!=='waiting');$('distance-track').setAttribute('aria-valuenow',Math.round(c.state==='waiting'?100:pct));$('distance-label').textContent=c.state==='waiting'?'Head start':c.state==='defeated'?'Cat gives up':c.stunned?'Cat stunned!':d<70?'Right behind you!':`${Math.round(d/40)} tiles behind`;
   $('exit-progress').textContent=`${Math.round(T.clamp((g.player.x-l.spawn.x)/(l.door.x-l.spawn.x),0,1)*100)}% to exit`;
   const signature=g.inventory.join(',')+'|'+g.selected;if(signature!==this.signature){this.signature=signature;document.querySelectorAll('[data-slot]').forEach((b,i)=>{const type=g.inventory[i],spec=T.ITEMS[type],c=b.querySelector('canvas'),ctx=c.getContext('2d');ctx.clearRect(0,0,56,56);if(type)T.trapIcon(ctx,type,28,29,35);b.querySelector('small').textContent=spec?.name||'Empty';b.setAttribute('aria-pressed',String(!!type&&i===g.selected));b.setAttribute('aria-label',spec?`${spec.name}${i===g.selected?', selected. Activate to drop.':'. Activate to select.'}`:`Empty trap slot ${i+1}`);});}
   $('drop-button').disabled=!g.inventory.length;
   if(g.message!==this.message){this.message=g.message;$('game-message').textContent=g.message;}
  }
 }
 Object.assign(T,{EscapeHUD,timeString});
})();
