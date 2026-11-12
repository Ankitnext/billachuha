(() => {
  'use strict';const S=window.SuperFight,$=id=>document.getElementById(id);
  const C=window.Competitive,profile=C.load();$('player-name-one').value=profile.names[0];$('player-name-two').value=profile.names[1];
  let match=null,preview=null,accumulator=0,hudAt=0,inBattle=false,onlineBattle=false,onlineIndex=0,onlineRound='',lastOnlineFrame=-1;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const audio=new S.FightAudio(),hud=new S.FightHUD(),camera=new S.FightCamera(),previewCamera=new S.FightCamera();
  const modal=()=>!!document.querySelector('dialog[open],.native-game-menu[open]'),paused=()=>document.hidden||modal();
  const input=new S.FightInput({enabled:()=>inBattle&&!!match&&!paused()&&['intro','fight'].includes(match.phase),onPause:()=>pause(),onCancel:id=>{if(onlineBattle){online?.release();}else if(Number.isInteger(id)&&match)S.cancelCharge(match.fighters[id]);else match?.clearControls();audio.silence();}});
  const online=new S.FightOnline({
    status:text=>{$('online-status').textContent=text;$('online-connection').textContent=text;},
    error:error=>{if(error.status===401&&online.app){location.replace('https://appassets.androidplatform.net/reconnect');return;}if(error.status===401&&!online.app){$('online-account-link').href=online.base+'/multiplayer';showDialog('online-login-dialog');}else{$('online-status').textContent=error.name==='AbortError'?'Connection timed out. Try again.':error.message;} $('start').disabled=false;},
    input:()=>!inBattle||paused()||!online.live?{...S.neutral(),cancel:true}:input.sample()[0],
    room:(room,me)=>{if(room.state==='waiting')$('online-status').textContent='Searching for another player… Stay here; the fight starts when someone joins.';onlineIndex=Math.max(0,room.players.findIndex(p=>p.id===me.id));},
    state:(view,me)=>{
      const state=view.state;onlineIndex=Math.max(0,view.players.findIndex(p=>p.id===me.id));
      if(!onlineBattle){closeDialogs();match=new S.Match({mode:'local',characters:state.characters});match.effects.pool=[];onlineBattle=true;inBattle=true;loop.refresh();onlineRound='';lastOnlineFrame=-1;$('setup').hidden=true;$('battle').hidden=false;$('pause').hidden=false;$('fight-layout').classList.remove('local');requestAnimationFrame(fit);input.reset();$('arena').focus({preventScroll:true});}
      if(state.frame<lastOnlineFrame)return;
      const events=state.frame===lastOnlineFrame?[]:state.events;lastOnlineFrame=state.frame;
      Object.assign(match,state,{events,playerNames:view.players.map(p=>p.name),onlineIndex});
      match.fighters=state.fighters.map(f=>Object.assign(new S.Fighter(f.id,f.character),f));
      hud.update(match);$('online-connection').hidden=false;$('online-connection').textContent='You are '+view.players[onlineIndex].name+' · '+view.players.map(p=>p.name).join(' vs ')+' · LIVE';
      if(['intro','fight'].includes(state.phase)&&$('results-dialog').open)$('results-dialog').close();
      if(['roundover','matchover'].includes(state.phase)){
        const key=state.history.length+':'+state.phase;
        if(key!==onlineRound){onlineRound=key;hud.results(match);$('next-round').hidden=true;$('rematch').hidden=state.phase!=='matchover';$('rematch').textContent='Find another online opponent';showDialog('results-dialog');}
        $('competition-result').textContent=state.phase==='matchover'?'Online match complete.':'Next round starts automatically in '+Math.ceil(state.nextRoundIn)+'s.';
      }
      $('online-status').textContent=view.players.map(p=>p.name).join(' vs ')+' · Online match';
    }
  });
  async function leaveOnline(){try{await online.leave();onlineBattle=false;lastOnlineFrame=-1;$('online-panel').hidden=true;$('start').disabled=false;return true;}catch(error){$('online-status').textContent='Could not leave the room. Check your connection and retry.';return false;}}
  async function findOnline(){if(online.room&&!await leaveOnline())return;onlineBattle=false;inBattle=false;loop.refresh();match=null;closeDialogs();$('battle').hidden=true;$('setup').hidden=false;$('online-panel').hidden=false;$('start').disabled=true;onlineRound='';lastOnlineFrame=-1;await online.find($('character-one').value);if(!online.active)$('start').disabled=false;}
  $('cancel-online').onclick=async()=>{if(await leaveOnline())setup();};
  $('online-login-form').onsubmit=async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;try{await online.login($('online-email').value.trim(),$('online-password').value);$('online-password').value='';$('online-login-dialog').close();await findOnline();}catch(error){$('online-login-error').textContent=error.message;}finally{button.disabled=false;}};
  $('close-online-login').onclick=()=>$('online-login-dialog').close();
  function options(){return{mode:document.querySelector('[name="mode"]:checked').value,characters:[$('character-one').value,$('character-two').value],difficulty:$('difficulty').value,level:profile.player('super-fight',$('player-name-one').value).stage,seed:crypto.getRandomValues(new Uint32Array(1))[0]};}
  function choices(){
    const o=options();$('difficulty-label').hidden=o.mode!=='solo';$('player-two-label').hidden=o.mode!=='local';$('player-name-two').required=o.mode==='local';$('character-two-label').hidden=o.mode==='online';$('start').textContent=o.mode==='online'?'Online Match · Find opponent →':'Enter the sky ring →';$('mode-note').textContent=o.mode==='online'?'Internet and signed-in account required · Waits for a real opponent':'Best of three · 90-second rounds · No account needed';$('opponent-label').textContent=o.mode==='solo'?'Bot fighter':'Player 2';$('fighter-info').replaceChildren();
    $('progress-copy').hidden=o.mode==='online';$('progress-copy').textContent=`Challenge level ${o.level} · ${profile.player('super-fight',$('player-name-one').value).wins} wins. Win a match to unlock the next bot level. Bots also react faster in later rounds.`;
    for(const key of o.characters){const c=S.CHARACTERS[key],p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`♥ ${c.hp} · ϟ ${c.energy} · ${c.speed===440?'FAST':c.speed===380?'BALANCED':'HEAVY'}`;p.append(strong,document.createTextNode(c.signature));$('fighter-info').append(p);}
    preview=new S.Match({...o,mode:'local'});preview.phase='fight';preview.fighters[0].x=390;preview.fighters[0].y=390;preview.fighters[0].charging=true;preview.fighters[0].charge=.5;preview.fighters[0].grounded=false;preview.fighters[1].x=820;preview.fighters[1].y=440;preview.fighters[1].state='fly';preview.fighters[1].grounded=false;previewCamera.reset();
  }
  function closeDialogs(){for(const d of document.querySelectorAll('dialog[open]'))d.close();}
  function fit(){const box=$('viewport').getBoundingClientRect();if(box.width>0&&box.height>0){GameRuntime.fitCanvas($('arena'),box.width,box.height);}camera.reset();}
  function start(){if(options().mode==='online'){findOnline();return;}const names=[$('player-name-one').value,$('player-name-two').value].map(C.name);if(options().mode==='local'&&names[0].toLowerCase()===names[1].toLowerCase()){$('progress-copy').textContent='Use different player names for separate rankings.';return;}profile.names=names;C.save(profile);closeDialogs();match=new S.Match(options());match.competitiveID=C.id();match.playerNames=names;inBattle=true;loop.refresh();accumulator=0;$('setup').hidden=true;$('battle').hidden=false;$('pause').hidden=false;$('fight-layout').classList.toggle('local',match.mode==='local');camera.reset();input.reset();hud.update(match);requestAnimationFrame(fit);$('arena').focus({preventScroll:true});}
  function recordMatch(){if(match.phase!=='matchover'){window.Rewards?.clear($('competition-result').parentElement);$('competition-result').textContent='Finish the match to save its score.';return;}const before=window.Rewards?.stats(profile.entries,match.playerNames[0]);const result={id:match.competitiveID,game:'super-fight',challenge:match.level,players:match.playerNames.slice(0,match.mode==='solo'?1:2).map((name,i)=>({name,score:C.fightScore(match,i),won:match.wins[i]>=2}))};if(!profile.record(result))return;const saved=C.save(profile);$('competition-result').textContent=saved?`Saved on this device · ${result.players.map(p=>p.name+': '+p.score+' points').join(' · ')}. Next challenge: level ${profile.player('super-fight',result.players[0].name).stage}.`:'Storage unavailable; scores last for this visit.';const id=match.competitiveID;window.Rewards?.localResult($('competition-result').parentElement,before,profile,result.players[0].name,id);C.sync(result).then(()=>{if(match?.competitiveID===id)$('competition-result').textContent+=' Player 1 synced to the browser-reported account board.';}).catch(()=>{});}
  function setup(){if(online.active||online.room){leaveOnline().then(ok=>{if(ok)setup();});return;}onlineBattle=false;$('online-connection').hidden=true;closeDialogs();inBattle=false;loop.refresh();match=null;input.reset();audio.silence();$('setup').hidden=false;$('battle').hidden=true;$('pause').hidden=true;choices();$('start').focus({preventScroll:true});}
  function showDialog(id){input.reset();audio.silence();if(!$(id).open)$(id).showModal();accumulator=0;}
  function pause(){$('pause-title').textContent=onlineBattle?'Online match menu':'Fight paused.';$('pause-copy').textContent=onlineBattle?'The online match continues. Controls are released while this menu is open.':'The round timer and combat are paused.';$('restart').hidden=onlineBattle;if(inBattle&&match&&['intro','fight'].includes(match.phase)&&!modal())showDialog('pause-dialog');}
  function frame(now,dt){
    if(inBattle&&match){
      if(!onlineBattle&&!paused()){
        accumulator+=dt;let steps=0;
        while(accumulator>=S.RULES.dt&&steps++<6){const before=match.phase;match.step(input.sample());accumulator-=S.RULES.dt;
          if(['roundover','matchover'].includes(match.phase)&&match.phase!==before){hud.update(match);hud.results(match);recordMatch();showDialog('results-dialog');break;}
        }
      }else accumulator=0;
      for(const event of match.events.splice(0))audio.play(event.type);audio.update(match,paused()||(onlineBattle&&!online.live));
      S.FightArt.draw($('arena'),match,camera,now/1000,dt,motion);
      if(now-hudAt>80){hudAt=now;hud.update(match);}
    }else if(preview)S.FightArt.draw($('preview'),preview,previewCamera,now/1000,dt,motion);
  }
  $('match-form').addEventListener('submit',e=>{e.preventDefault();start();});
  for(const select of document.querySelectorAll('#match-form select,#match-form input'))select.addEventListener('change',choices);
  $('pause').onclick=pause;$('resume').onclick=()=>{$('pause-dialog').close();$('arena').focus({preventScroll:true});};$('restart').onclick=start;$('quit').onclick=setup;
  $('moves').onclick=()=>showDialog('moves-dialog');$('close-moves').onclick=()=>$('moves-dialog').close();
  $('next-round').onclick=()=>{closeDialogs();if(match?.nextRound()){camera.reset();input.reset();accumulator=0;hud.update(match);$('arena').focus({preventScroll:true});}};
  $('rematch').onclick=()=>onlineBattle?findOnline():start();$('new-opponent').onclick=setup;
  const soundLabels=()=>{for(const id of ['sound','help-sound']){$(id).textContent=audio.enabled?'Sound on':'Sound off';$(id).setAttribute('aria-pressed',String(audio.enabled));}};
  const toggleSound=()=>{audio.set(!audio.enabled);soundLabels();};
  $('sound').onclick=toggleSound;$('help-sound').onclick=toggleSound;
  soundLabels();
  const effects=()=>{$('effects').textContent=motion?'Effects on':'Effects off';$('effects').setAttribute('aria-pressed',String(motion));};effects();$('effects').onclick=()=>{motion=!motion;effects();camera.reset();};
  $('fullscreen').hidden=!document.documentElement.requestFullscreen;$('fullscreen').onclick=()=>{const op=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();op?.catch(()=>{});};
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{input.reset();accumulator=0;});
  window.addEventListener('blur',()=>{input.reset();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){input.reset();pause();}});
  window.addEventListener('resize',fit);new ResizeObserver(()=>requestAnimationFrame(fit)).observe($('viewport'));
  window.ChaseApp={
    pause(){input.reset();audio.silence();online.suspend();},
    resume(){online.resume();},
    editHud(){input.settings?.open('hud');return !!document.querySelector('.control-settings[open]');},
    dismissSettings(){const dialog=document.querySelector('dialog[open]');if(!dialog)return false;const cancel=dialog.querySelector('[data-cancel]');if(cancel)cancel.click();else dialog.close();return true;},
    async close(){await leaveOnline();if(online.app){await online.api('/api/v1/app/end',{}).catch(()=>{});location.replace('https://appassets.androidplatform.net/menu');}else setup();}
  };
  if(location.pathname==='/multiplayer/app'||location.pathname==='/multiplayer/super-fight'){document.querySelector('[name=mode][value=online]').checked=true;}
  const launchMode=new URLSearchParams(location.search).get('mode');if(['solo','local'].includes(launchMode))document.querySelector('[name=mode][value='+launchMode+']').checked=true;
  const loop=GameRuntime.createFrameLoop(frame,()=>inBattle?0:33);
  choices();loop.refresh();
})();
