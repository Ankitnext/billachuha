((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  const ITEMS=Object.freeze({banana:{name:'Banana peel',stun:60,reaction:'slip',color:'#e2c65d'},mousetrap:{name:'Mousetrap',stun:90,reaction:'snap',color:'#b89065'},paint:{name:'Paint bucket',stun:100,reaction:'paint',color:'#86bfce'},magnet:{name:'Magnet',stun:75,reaction:'magnet',color:'#e18e7b'},ice:{name:'Ice cube',stun:45,reaction:'ice',color:'#a9d7e3'},firecracker:{name:'Firecracker',stun:120,reaction:'firecracker',color:'#d77b65'}});
  function dropItem(game){
    if(!game.inventory.length||game.drops.length>=12){game.message='Collect a trap item first.';return false;}
    game.selected=Math.min(game.selected,game.inventory.length-1);const type=game.inventory.splice(game.selected,1)[0],p=game.player;
    game.drops.push({type,x:p.face>0?p.x-20:p.x+p.w+4,y:p.y+p.h-18,w:26,h:18,vy:0,age:0,used:false,armed:false,explosion:0});
    game.selected=game.inventory.length?game.selected%game.inventory.length:0;p.dropPose=.22;game.trapsUsed++;game.emit('drop');game.message=`${ITEMS[type].name} dropped. The Cat is following your route.`;return true;
  }
  function updateDrops(game,dt){
    for(const trap of game.drops){if(trap.used&&trap.explosion<=0)continue;trap.age+=dt;trap.explosion=Math.max(0,trap.explosion-dt);
      if(!trap.used){const old=trap.y+trap.h;trap.vy=Math.min(600,trap.vy+T.RULES.gravity*dt);trap.y+=trap.vy*dt;
        for(const tile of game.level.platforms)if(!tile.disabled&&trap.x+trap.w>tile.x&&trap.x<tile.x+tile.w&&old<=tile.y+2&&trap.y+trap.h>=tile.y){trap.y=tile.y-trap.h;trap.vy=0;break;}
        trap.armed=trap.age>=.2;
        if(trap.type==='firecracker'&&trap.age>=2){trap.used=true;trap.explosion=.3;game.burst(trap.x+13,trap.y,'#e5bc75',30);game.emit('firecracker');
          const c=game.cat;if(Math.hypot(c.x+c.w/2-trap.x,c.y+c.h/2-trap.y)<130)game.hitCat(trap);}
        else if(trap.type!=='firecracker'&&trap.armed&&T.overlap(trap,game.cat)&&game.cat.state!=='waiting'){trap.used=true;game.hitCat(trap);}
        if(trap.y>game.level.height+100)trap.used=true;
      }
    }
  }
  return{ITEMS,dropItem,updateDrops};
});
