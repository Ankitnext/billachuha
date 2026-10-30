((root)=>{
  class HeistHUD{
    constructor(){this.$=id=>document.getElementById(id);}
    update(game){const $=this.$,p=game.player; $('cheese-count').textContent=game.cheeseCount+'/'+game.cheese.length;$('time').textContent=game.elapsed.toFixed(1)+'s';$('stage-label').textContent=game.level.id+' / '+game.level.name;$('stealth').textContent=game.alarm>0?'ALARM · '+Math.ceil(game.alarm)+'s':game.spottedNow?'SPOTTED':game.spotted?'SEEN '+game.spotted+'×':'UNSEEN';$('stealth').dataset.alert=String(game.alarm>0||game.spottedNow);$('boss-progress').hidden=!game.level.boss;$('boss-progress').textContent='HUNTER ESCAPES '+game.evades+'/4';$('paws-timer').textContent=p.paws>0?'SOFT PAWS · '+p.paws.toFixed(1)+'s':'';$('use-tool').querySelector('small').textContent=p.tools[p.selected]?root.KitchenHeist.TOOL_INFO[p.tools[p.selected].type].short:'NO TOOL';
      for(const [index,button]of [...$('inventory').children].entries()){const item=p.tools[index],info=item?root.KitchenHeist.TOOL_INFO[item.type]:null;button.textContent=info?info.short+(item.charges>1?' ×'+item.charges:''):'—';button.setAttribute('aria-label',info?info.name+', '+item.charges+' charge'+(item.charges>1?'s':''):'Empty tool slot');button.setAttribute('aria-pressed',String(p.selected===index&&!!item));button.disabled=!item;}
      $('game-message').textContent=game.message;root.KitchenHeist.HeistArt.minimap($('minimap'),game);
    }
  }
  if(typeof module==='object'&&module.exports)module.exports={HeistHUD};else Object.assign(root.KitchenHeist,{HeistHUD});
})(globalThis);
