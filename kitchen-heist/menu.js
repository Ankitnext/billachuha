(()=>{
  'use strict';const K=window.KitchenHeist,$=id=>document.getElementById(id);let save;
  try{save=new K.HeistSave(JSON.parse(localStorage.getItem(K.SAVE_KEY)));}catch(_){save=new K.HeistSave();}
  let game=null,screen='title',world=0,last=0,hudAt=0,posterAt=0,caughtAt=0,frameID=0,committed=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),audio=new K.HeistAudio([$('sound')]),hud=new K.HeistHUD(),particles=new K.HeistParticles();
  const modal=()=>!!document.querySelector('dialog[open]');
  const input=new K.HeistInput(()=>screen==='play'&&!modal()&&game?.status==='playing',()=>pause());
  const poster=new K.HeistGame(0);poster.player.x=112;poster.player.y=350;poster.player.angle=-.4;
  function persist(){try{localStorage.setItem(K.SAVE_KEY,JSON.stringify(save));}catch(_){if(game)game.message='Browser storage is unavailable; progress cannot be saved.';}summary();}
  function summary(){$('save-summary').textContent=save.totalStars?`${Object.keys(save.stars).length}/50 jobs completed · ${save.totalStars}/150 stars · Your next job: ${K.LEVELS[save.nextPlayable()].id}`:'No sign-in. No downloads. Your progress stays right here.';}
  function setScreen(next){screen=next;for(const id of ['title','levels','play'])$(id).hidden=id!==next;$('pause').hidden=next!=='play';input.clear();if(next==='play')requestAnimationFrame(fit);}
  function closeDialogs(){for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();}
  function fit(){const area=$('viewport').getBoundingClientRect();if(!area.width||!area.height)return;const portrait=innerWidth<innerHeight,viewW=portrait?Math.max(320,Math.min(400,area.width)):640,viewH=portrait?Math.min(480,viewW*area.height/area.width):480,width=Math.min(area.width,area.height*viewW/viewH),height=width*viewH/viewW;if(game)game.view={x:0,y:0,width:viewW,height:viewH};$('stage').width=Math.round(viewW*2);$('stage').height=Math.round(viewH*2);Object.assign($('stage').style,{width:width+'px',height:height+'px'});input.settings?.refresh();}
  function begin(index){if(!save.unlocked(index))return;closeDialogs();game=new K.HeistGame(index);particles.items=[];caughtAt=0;committed=false;setScreen('play');hud.update(game);$('stage-intro').textContent=game.level.name;$('stage').focus({preventScroll:true});
    let seen=false;try{seen=localStorage.getItem('kitchen-heist.tutorial.v1')==='1';}catch(_){}
    if(index===0&&!seen)$('tutorial-dialog').showModal();
  }
  function pause(){if(screen!=='play'||modal())return;input.clear();audio.silence();$('pause-dialog').showModal();}
  function choose(){closeDialogs();if(game)world=game.level.world;setScreen('levels');renderLevels();}
  function renderLevels(){
    $('world-tabs').replaceChildren();K.WORLDS.forEach((item,i)=>{const button=document.createElement('button');button.type='button';button.setAttribute('aria-pressed',String(world===i));button.innerHTML=`<span>0${i+1} / ${save.worldUnlocked(i)?'OPEN':'LOCKED'}</span>${item.name}`;button.onclick=()=>{world=i;renderLevels();};$('world-tabs').append(button);});
    $('world-name').textContent=K.WORLDS[world].name;$('world-label').textContent=K.WORLDS[world].label;$('world-stars').textContent=save.worldStars(world)+' / 30 ★';$('unlock-note').textContent=save.worldUnlocked(world)?'Ten jobs. One guarded kitchen. Make every getaway count.':`Clear ${K.WORLDS[world-1].name}’s boss and collect 15 stars there to unlock this world.`;
    $('level-grid').replaceChildren();for(const level of K.LEVELS.slice(world*10,world*10+10)){const stars=save.stars[level.id]||0,button=document.createElement('button');button.className='level-card'+(level.boss?' boss':'');button.disabled=!save.unlocked(level.index);button.innerHTML=`<span class="stage-number">${String(level.number).padStart(2,'0')}${level.boss?' / HUNTER':''}</span><strong>${level.name}</strong><span class="stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</span><small>${save.bestTimes[level.id]?(save.bestTimes[level.id]/1000).toFixed(1)+'s best':'PAR '+level.parTime/1000+'s'}${button.disabled?' · LOCKED':''}</small>`;button.onclick=()=>begin(level.index);$('level-grid').append(button);}
  }
  function result(){save.complete(game.index,game.result);save.toolsUsed+=game.toolsUsed;persist();committed=true;const r=game.result;$('result-title').textContent=game.level.name+' / cleared.';$('result-stars').textContent='★'.repeat(r.stars)+'☆'.repeat(3-r.stars);$('result-stars').setAttribute('aria-label',r.stars+' of 3 stars');$('result-stats').textContent=`${(r.time/1000).toFixed(1)}s · ${r.spotted} spotted · ${game.cheeseCount} cheese · ${game.toolsUsed} tools used`;$('result-note').textContent=r.stars===3?'Not a whisker out of place. A perfect heist.':r.spotted===0?'A clean route. Beat par for the third star.':'Try a different route or time your distractions for a cleaner getaway.';$('next').disabled=!save.unlocked(game.index+1);$('next').textContent=game.index===49?'Campaign complete':save.unlocked(game.index+1)?'Next heist ↗':'Earn 15 stars to open the next world';input.clear();$('result-dialog').showModal();}
  function frame(now){
    frameID=0;if(document.hidden){last=0;return;}const dt=Math.min(.05,Math.max(0,(now-(last||now))/1000));last=now;
    if(screen==='play'&&game){
      if(!modal()){
        if(game.status==='playing')game.update(input.poll(),dt);
        else if(game.status==='caught'){if(!committed){committed=true;save.deaths++;save.toolsUsed+=game.toolsUsed;persist();input.clear();}caughtAt+=dt;if(caughtAt>=2)begin(game.index);}
        if(!reduced.matches)particles.update(dt);
      }
      for(const event of game.events.splice(0)){audio.play(event);if(!reduced.matches&&['pickup','smoke','evade'].includes(event.type))particles.burst(event);}
      if(game.status==='won'&&!committed)result();
      if(now-hudAt>75){hudAt=now;hud.update(game);if(game.elapsed>4)$('stage-intro').textContent='';}
      if(game.view){game.view.x=K.clamp(game.player.x-game.view.width*.5,0,640-game.view.width);game.view.y=K.clamp(game.player.y-game.view.height*.5,0,480-game.view.height);}
      K.HeistArt.render($('stage'),game,game.elapsed,reduced.matches?null:particles);
    }else if(screen==='title'&&(now-posterAt>100||!posterAt)){
      posterAt=now;if(!reduced.matches){poster.guards[0].angle=Math.PI+.25*Math.sin(now/2400);poster.elapsed=now/1000;}K.HeistArt.render($('poster'),poster,poster.elapsed);
    }
    frameID=requestAnimationFrame(frame);
  }
  $('start').onclick=()=>begin(save.nextPlayable());$('choose-level').onclick=choose;$('back-title').onclick=()=>setScreen('title');$('brand').onclick=event=>{event.preventDefault();if(screen==='play')pause();else setScreen('title');};$('pause').onclick=pause;$('resume').onclick=()=>$('pause-dialog').close();$('retry').onclick=()=>begin(game.index);$('pause-levels').onclick=choose;$('quit').onclick=()=>{closeDialogs();setScreen('title');};$('next').onclick=()=>begin(game.index+1);$('replay').onclick=()=>begin(game.index);$('result-levels').onclick=choose;
  $('help').onclick=()=>{input.clear();audio.silence();$('help-dialog').showModal();};$('close-help').onclick=()=>$('help-dialog').close();$('close-tutorial').onclick=()=>{try{localStorage.setItem('kitchen-heist.tutorial.v1','1');}catch(_){}$('tutorial-dialog').close();};
  for(const item of Object.values(K.TOOL_INFO)){const node=document.createElement('div'),title=document.createElement('b'),description=document.createElement('p');title.textContent=item.short+' / '+item.name;description.textContent=item.description;node.append(title,description);$('tool-guide').append(node);}
  for(const [index,button]of [...$('inventory').children].entries())button.onclick=()=>{if(game?.player.tools[index]){game.player.selected=index;hud.update(game);}};
  $('fullscreen').hidden=!document.documentElement.requestFullscreen;$('fullscreen').onclick=()=>{const op=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();op?.catch(()=>{});};
  for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>{input.clear();last=0;if(screen==='play')$('stage').focus({preventScroll:true});});
  window.addEventListener('blur',()=>{input.clear();pause();});window.addEventListener('resize',fit);new ResizeObserver(fit).observe($('viewport'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();audio.silence();if(frameID)cancelAnimationFrame(frameID);frameID=0;last=0;}else if(!frameID)frameID=requestAnimationFrame(frame);});
  summary();frameID=requestAnimationFrame(frame);
})();
