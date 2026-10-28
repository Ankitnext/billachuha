((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  function collectItems(game){for(const item of game.level.pickups)if(!item.taken&&game.inventory.length<3&&T.overlap(game.player,item)){item.taken=true;game.inventory.push(item.type);game.emit('pickup');game.message='Trap collected. Drop it on solid ground behind you.';}}
  function cycleItem(game){if(game.inventory.length)game.selected=(game.selected+1)%game.inventory.length;}
  return{collectItems,cycleItem};
});
