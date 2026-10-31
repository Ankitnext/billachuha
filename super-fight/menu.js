(() => {
  'use strict';const S=window.SuperFight,$=id=>document.getElementById(id);
  const C=window.Competitive,profile=C.load();$('player-name-one').value=profile.names[0];$('player-name-two').value=profile.names[1];
  let match=null,preview=null,last=0,accumulator=0,hudAt=0,inBattle=false;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const audio=new S.FightAudio(),hud=new S.FightHUD(),camera=new S.FightCamera(),previewCamera=new S.FightCamera();
  const modal=()=>!!document.querySelector('dialog[open]'),paused=()=>document.hidden||modal();
  const input=new S.FightInput({enabled:()=>inBattle&&!!match&&!paused()&&['intro','fight'].includes(match.phase),onPause:()=>pause(),onCancel:id=>{if(Number.isInteger(id)&&match)S.cancelCharge(match.fighters[id]);else match?.clearControls();audio.silence();}});
  function options(){return{mode:document.querySelector('[name="mode"]:checked').value,characters:[$('character-one').value,$('character-two').value],difficulty:$('difficulty').value,level:profile.player('super-fight',$('player-name-one').value).stage,seed:crypto.getRandomValues(new Uint32Array(1))[0]};}
  function choices(){
    const o=options();$('difficulty-label').hidden=o.mode==='local';$('opponent-label').textContent=o.mode==='solo'?'Bot fighter':'Player 2';$('fighter-info').replaceChildren();
    $('progress-copy').textContent=`Challenge level ${o.level} · ${profile.player('super-fight',$('player-name-one').value).wins} wins. Win a match to unlock the next bot level. Bots also react faster in later rounds.`;
    for(const key of o.characters){const c=S.CHARACTERS[key],p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=`♥ ${c.hp} · ϟ ${c.energy} · ${c.speed===440?'FAST':c.speed===380?'BALANCED':'HEAVY'}`;p.append(strong,document.createTextNode(c.signature));$('fighter-info').append(p);}
    preview=new S.Match({...o,mode:'local'});preview.phase='fight';preview.fighters[0].x=390;preview.fighters[0].y=390;preview.fighters[0].charging=true;preview.fighters[0].charge=.5;preview.fighters[0].grounded=false;preview.fighters[1].x=820;preview.fighters[1].y=440;preview.fighters[1].state='fly';preview.fighters[1].grounded=false;previewCamera.reset();
  }
  function closeDialogs(){for(const d of document.querySelectorAll('dialog[open]'))d.close();}
  function fit(){const box=$('viewport').getBoundingClientRect();if(box.width>0&&box.height>0){const dpr=Math.min(2,window.devicePixelRatio||1);$('arena').width=Math.round(box.width*dpr);$('arena').height=Math.round(box.height*dpr);}camera.reset();}
  function start(){const names=[$('player-name-one').value,$('player-name-two').value].map(C.name);if(options().mode==='local'&&names[0].toLowerCase()===names[1].toLowerCase()){$('progress-copy').textContent='Use different player names for separate rankings.';return;}profile.names=names;C.save(profile);closeDialogs();match=new S.Match(options());match.competitiveID=C.id();match.playerNames=names;inBattle=true;accumulator=0;$('setup').hidden=true;$('battle').hidden=false;$('pause').hidden=false;$('fight-layout').classList.toggle('local',match.mode==='local');camera.reset();input.reset();hud.update(match);requestAnimationFrame(fit);$('arena').focus({preventScroll:true});}
  function recordMatch(){if(match.phase!=='matchover'){$('competition-result').textContent='Finish the match to save its score.';return;}const result={id:match.competitiveID,game:'super-fight',challenge:match.level,players:match.playerNames.slice(0,match.mode==='solo'?1:2).map((name,i)=>({name,score:C.fightScore(match,i),won:match.wins[i]>=2}))};if(!profile.record(result))return;const saved=C.save(profile);$('competition-result').textContent=saved?`Saved on this device · ${result.players.map(p=>p.name+': '+p.score+' points').join(' · ')}. Next challenge: level ${profile.player('super-fight',result.players[0].name).stage}.`:'Storage unavailable; scores last for this visit.';const id=match.competitiveID;C.sync(result).then(()=>{if(match?.competitiveID===id)$('competition-result').textContent+=' Player 1 synced to the browser-reported account board.';}).catch(()=>{});}
  function setup(){closeDialogs();inBattle=false;match=null;input.reset();audio.silence();$('setup').hidden=false;$('battle').hidden=true;$('pause').hidden=true;choices();$('start').focus({preventScroll:true});}
  function showDialog(id){input.reset();audio.silence();if(!$(id).open)$(id).showModal();accumulator=0;}
  function pause(){if(inBattle&&match&&['intro','fight'].includes(match.phase)&&!modal())showDialog('pause-dialog');}
  function frame(now){
    const dt=Math.min(.1,Math.max(0,(now-(last||now))/1000));last=now;
    if(inBattle&&match){
      if(!paused()){
        accumulator+=dt;let steps=0;
        while(accumulator>=S.RULES.dt&&steps++<6){const before=match.phase;match.step(input.sample());accumulator-=S.RULES.dt;
          if(['roundover','matchover'].includes(match.phase)&&match.phase!==before){hud.update(match);hud.results(match);recordMatch();showDialog('results-dialog');break;}
        }
      }else accumulator=0;
      for(const event of match.events.splice(0))audio.play(event.type);audio.update(match,paused());
      S.FightArt.draw($('arena'),match,camera,now/1000,dt,motion);
      if(now-hudAt>80){hudAt=now;hud.update(match);}
    }else if(preview)S.FightArt.draw($('preview'),preview,previewCamera,now/1000,dt,motion);
    requestAnimationFrame(frame);
  }
  $('match-form').addEventListener('submit',e=>{e.preventDefault();start();});
  for(const select of document.querySelectorAll('#match-form select,#match-form input'))select.addEventListener('change',choices);
  $('pause').onclick=pause;$('resume').onclick=()=>{$('pause-dialog').close();$('arena').focus({preventScroll:true});};$('restart').onclick=start;$('quit').onclick=setup;
  $('moves').onclick=()=>showDialog('moves-dialog');$('close-moves').onclick=()=>$('moves-dialog').close();
  $('next-round').onclick=()=>{closeDialogs();if(match?.nextRound()){camera.reset();input.reset();accumulator=0;hud.update(match);$('arena').focus({preventScroll:true});}};
  $('rematch').onclick=start;$('new-opponent').onclick=setup;
  const soundLabels=()=>{for(const id of ['sound','help-sound']){$(id).textContent=audio.enabled?'Sound on':'Sound off';$(id).setAttribute('aria-pressed',String(audio.enabled));}};
  const toggleSound=()=>{audio.set(!audio.enabled);soundLabels();};
  $('sound').onclick=toggleSound;$('help-sound').onclick=toggleSound;
  soundLabels();
  const effects=()=>{$('effects').textContent=motion?'Effects on':'Effects off';$('effects').setAttribute('aria-pressed',String(motion));};effects();$('effects').onclick=()=>{motion=!motion;effects();camera.reset();};
  $('fullscreen').hidden=!document.documentElement.requestFullscreen;$('fullscreen').onclick=()=>{const op=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();op?.catch(()=>{});};
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',()=>{input.reset();accumulator=0;});
  window.addEventListener('blur',()=>{input.reset();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden){input.reset();pause();}});
  window.addEventListener('resize',fit);new ResizeObserver(()=>requestAnimationFrame(fit)).observe($('viewport'));
  choices();requestAnimationFrame(frame);
})();
