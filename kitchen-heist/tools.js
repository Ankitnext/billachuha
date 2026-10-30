((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  const TOOL_INFO={decoy:{name:'Cheese decoy',short:'DECOY',mark:'D',color:'#f7c552',description:'A moving fake cheese lures the nearest patrol within 200px for six seconds.'},smoke:{name:'Smoke bomb',short:'SMOKE',mark:'S',color:'#b4c8d4',description:'A 96px cloud blocks Cat and Dog vision for four seconds.'},hole:{name:'Mouse hole',short:'TUNNEL',mark:'H',color:'#d4afe3',description:'Use once for an entrance; move 40–400px and use again for the exit. Step into the entrance to travel once.'},paws:{name:'Soft Paws',short:'PAWS',mark:'P',color:'#92d4b3',description:'Move silently for five seconds. Cat vision range is reduced by 30%; camera beams still detect you.'}};
  function consume(player){const item=player.tools[player.selected];if(--item.charges<=0)player.tools.splice(player.selected,1);player.selected=Math.min(player.selected,Math.max(0,player.tools.length-1));}
  function evade(game,guard){if(guard?.boss&&game.elapsed>=game.nextEvade){game.evades++;game.nextEvade=game.elapsed+1.5;game.emit('evade');game.message=`Hunter distracted · ${game.evades}/4 escapes`;}}
  function useTool(game){
    const p=game.player,item=p.tools[p.selected];if(!item){game.message='Walk over a glowing tool cache to collect it.';return false;}
    if(item.type==='paws'&&p.paws>0){game.message='Soft Paws is already active.';return false;}
    if(item.type==='hole'){
      if(!game.hole){game.hole={entrance:{x:p.x,y:p.y},exit:null,armedAt:Infinity};game.emit('hole');game.message='Entrance placed. Move 40–400px, then use the tunnel again.';return true;}
      const d=K.distance(p,game.hole.entrance);
      if(game.hole.exit||d<40||d>400){game.message='Place the exit 40–400px from the entrance.';return false;}
      game.hole.exit={x:p.x,y:p.y};game.hole.armedAt=game.elapsed+.4;game.message='Tunnel ready. Step into the first hole to travel once.';
    }else if(item.type==='decoy'){
      const pos={x:p.x+Math.cos(p.angle)*18,y:p.y+Math.sin(p.angle)*18};if(!K.walkable(game.level,pos.x,pos.y,5))Object.assign(pos,{x:p.x,y:p.y});
      const decoy={...pos,angle:p.angle,life:6,id:++game.serial};game.decoys.push(decoy);
      const guard=game.guards.filter(g=>(g.state==='patrol'||g.boss)&&K.distance(g,p)<200).sort((a,b)=>K.distance(a,p)-K.distance(b,p))[0];
      if(guard){evade(game,guard);guard.state='distracted';guard.decoy=decoy.id;guard.timer=0;guard.path=null;}
    }else if(item.type==='smoke'){
      game.smoke.push({x:p.x,y:p.y,r:96,life:4});
      for(const guard of game.guards)if(K.distance(guard,p)<96){evade(game,guard);guard.state='search';guard.timer=0;guard.blind=2.5;guard.lastKnown={x:guard.x,y:guard.y};guard.path=null;}
    }else if(item.type==='paws'){p.paws=5;game.message='Soft Paws · silent movement for five seconds.';}
    game.emit(item.type);game.toolsUsed++;consume(p);return true;
  }
  function updateTools(game,dt){
    for(const item of game.pickups)if(!item.taken&&K.distance(item,game.player)<22&&game.player.tools.length<3){item.taken=true;game.player.tools.push({type:item.type,charges:item.charges});game.emit('pickup');game.message=`${TOOL_INFO[item.type].name} collected${item.charges>1?' · two charges':''}`;}
    for(const cloud of game.smoke)cloud.life-=dt;game.smoke=game.smoke.filter(c=>c.life>0);
    for(const decoy of game.decoys){decoy.life-=dt;K.move(decoy,Math.cos(decoy.angle)*40,Math.sin(decoy.angle)*40,dt,game.level,5);}game.decoys=game.decoys.filter(d=>d.life>0);
    if(game.hole?.exit&&game.elapsed>=game.hole.armedAt&&K.distance(game.player,game.hole.entrance)<18){Object.assign(game.player,game.hole.exit,{vx:0,vy:0});game.hole=null;game.emit('hole');game.message='One clean shortcut.';}
  }
  return{TOOL_INFO,useTool,updateTools};
});
