/* Dungeon Dash browser UI. Game simulation and save validation live in the core. */
(() => {
  'use strict';
  const C=window.DungeonDash,Art=window.DungeonArt,$=id=>document.getElementById(id),SAVE='dungeon-dash.save.v1';
  const clock=n=>`${Math.floor(n/60)}:${String(Math.floor(n)%60).padStart(2,'0')}`;
  const keys=new Set(),held=new Map();let joy=0,pending={jump:false,fire:false,swap:false};
  let run=null,screen='title',last=0,hudAt=0,saveAt=0,oldRoom=0,bestBefore=0;
  let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,storageOK=true,savingScore=false;
  let raw={};try{raw=JSON.parse(localStorage.getItem(SAVE))||{};}catch{storageOK=false;}
  let profile=new C.Profile(raw);const recovered=profile.recover();
  const preview=new C.Run({seed:372,width:800,height:600});preview.player.x=130;preview.player.invulnerable=0;
  function persist() {
    try{localStorage.setItem(SAVE,JSON.stringify(profile));storageOK=true;}catch{storageOK=false;}
    $('storage-note').textContent=storageOK?'Your progress saves on this device. No account needed.':'Browser saving is unavailable. Progress lasts while this tab stays open.';
  }
  function checkpoint(){if(run&&profile.checkpoint(run))persist();}
  function clearInput(){keys.clear();held.clear();joy=0;pending={jump:false,fire:false,swap:false};if(run){run.jumpHeld=false;run.swapHeld=false;}}
  const paused=()=>document.hidden||!!document.querySelector('dialog[open]');
  function dialog(id){clearInput();if(!$(id).open)$(id).showModal();}
  function pause(){if(run&&!['dead','dying'].includes(run.phase)&&!paused())dialog('pause-dialog');}
  function show(next){screen=next;for(const name of ['title','game','upgrade','shop','death'])$(`${name}-screen`).hidden=name!==next;$('pause').hidden=!run||run.phase==='dead'||['title','upgrade','death'].includes(next);clearInput();requestAnimationFrame(fit);}
  function title(){show('title');renderLifetime();}
  function renderLifetime(){
    $('lifetime-stats').replaceChildren();
    for(const [value,label]of [[profile.bestRoom||'—','BEST ROOM'],[profile.gems.toLocaleString(),'GEMS SAVED'],[profile.totalRuns,'RUNS']]){
      const span=document.createElement('span'),strong=document.createElement('strong');strong.textContent=value;span.append(strong,document.createTextNode(label));$('lifetime-stats').append(span);
    }
  }
  function dimensions(){
    if(innerHeight>innerWidth)return{width:560,height:600};
    return innerHeight<500?{width:800,height:420}:{width:800,height:600};
  }
  function start(){
    for(const d of document.querySelectorAll('dialog[open]'))d.close();
    const seed=crypto.getRandomValues(new Uint32Array(1))[0];bestBefore=profile.bestRoom;
    run=new C.Run({seed,id:`${Date.now()}-${seed}`,upgrades:profile.upgrades,...dimensions()});profile.begin(run.id);checkpoint();oldRoom=run.roomNumber;
    show('game');updateHud();$('game').focus({preventScroll:true});
  }
  function fit(){
    if(screen!=='game'||!run)return;
    const box=$('viewport').getBoundingClientRect(),scale=Math.min(box.width/run.width,box.height/run.height);
    $('game').width=run.width;$('game').height=run.height;
    $('arena').style.width=`${Math.max(1,Math.floor(run.width*scale))}px`;$('arena').style.height=`${Math.max(1,Math.floor(run.height*scale))}px`;
  }
  function card(icon,name,description,buttonLabel,disabled,onBuy,levels){
    const article=document.createElement('article');article.className='upgrade-card';
    const emblem=document.createElement('span');emblem.className='upgrade-icon';emblem.textContent=icon;
    const body=document.createElement('div'),heading=document.createElement('h3'),p=document.createElement('p');heading.textContent=name;p.textContent=description;body.append(heading,p);
    if(levels){const track=document.createElement('div');track.className='upgrade-levels';for(let i=0;i<levels.max;i++){const bit=document.createElement('i');bit.classList.toggle('on',i<levels.current);track.append(bit);}const small=document.createElement('small');small.textContent=`Level ${levels.current} / ${levels.max}`;body.append(track,small);}
    const button=document.createElement('button');button.textContent=buttonLabel;button.disabled=disabled;button.setAttribute('aria-label',`${name}: ${buttonLabel}`);button.onclick=onBuy;
    article.append(emblem,body,button);return article;
  }
  function upgrades(){
    show('upgrade');$('wallet').textContent=`◆ ${profile.gems.toLocaleString()} gems`;$('upgrade-list').replaceChildren();
    for(const [key,item]of Object.entries(C.UPGRADES)){
      const level=profile.upgrades[key],cost=item.costs[level];
      $('upgrade-list').append(card(item.icon,item.name,item.description,cost===undefined?'MAXED':`◆ ${cost}`,cost===undefined||profile.gems<cost,()=>{
        if(profile.buy(key)){persist();upgrades();$('upgrade-status').textContent=`${item.name} upgraded. Ready for your next run.`;beep('buy');}
      },{current:level,max:item.costs.length}));
    }
  }
  function shop(){
    show('shop');$('shop-copy').textContent=`Room ${run.roomNumber} cleared. Spend this run’s gems; your saved wallet stays at ${profile.gems}.`;
    $('run-wallet').textContent=`◆ ${run.gems} run gems`;$('shop-health').textContent=`♥ ${run.player.hp} / ${run.maxHp}`;$('shop-list').replaceChildren();
    for(const [key,item]of Object.entries(C.ITEMS))$('shop-list').append(card(item.icon,item.name,item.description,`◆ ${item.cost}`,!run.canBuy(key),()=>{
      if(run.buy(key)){checkpoint();shop();$('shop-status').textContent=`${item.name} ready.`;beep('buy');}
    }));
  }
  function death(){
    const credited=profile.bank(run);if(credited)persist();show('death');
    $('death-tag').textContent=run.roomNumber>bestBefore?'A NEW PERSONAL BEST.':'THE RUN ENDS. THE ADVENTURE DOESN’T.';
    $('death-title').textContent=run.reason.startsWith('Retreated')?'A breather. A stronger return.':'A good run. A better next one.';
    $('death-reason').textContent=run.reason;$('death-room').textContent=run.roomNumber;$('death-stats').replaceChildren();
    for(const [value,label]of [[run.roomNumber,'ROOM REACHED'],[run.kills,'ENEMIES DEFEATED'],[run.earned,'GEMS FOUND'],[run.spent,'GEMS SPENT'],[clock(run.elapsed),'TIME SURVIVED'],[`${run.bestCombo}×`,'BEST CHAIN']]){
      const row=document.createElement('span'),strong=document.createElement('strong');strong.textContent=value;row.append(strong,document.createTextNode(label));$('death-stats').append(row);
    }
    $('banked').textContent=`◆ ${run.gems} gems banked · Wallet ${profile.gems.toLocaleString()}`;
    $('score-status').textContent='';$('sign-in').hidden=true;$('save-score').disabled=false;beep('death');
  }
  function updateHud(){
    if(!run)return;const names={kitchen:'THE KITCHEN',garden:'THE GARDEN',rooftop:'THE ROOFTOPS',sewer:'THE SEWER',inferno:'THE INFERNO'};
    $('floor-label').textContent=`FLOOR ${run.room.floor} / ${names[run.room.theme]}`;$('room-label').textContent=`Room ${run.roomNumber}`;
    $('hearts').textContent='♥'.repeat(run.player.hp)+'♡'.repeat(run.maxHp-run.player.hp)+(run.shield?' ◈':'');$('hearts').setAttribute('aria-label',`${run.player.hp} of ${run.maxHp} hearts${run.shield?', shield ready':''}`);
    const remaining=run.room.enemies.filter(e=>e.hp>0).length;
    $('gems').textContent=`◆ ${run.gems}`;$('enemies').textContent=remaining?`${remaining} enemies left`:'Door unlocked →';$('run-time').textContent=clock(run.elapsed);
    $('weapon-name').textContent=C.WEAPONS[run.weapon.type].name;$('ammo').textContent=Number.isFinite(run.weapon.ammo)?run.weapon.ammo:'∞';
    $('jump').textContent=`JUMP · ${run.player.jumps}`;
    const near=run.room.drops.find(d=>Math.hypot(d.x-run.player.x,d.y-run.player.y)<85);
    $('swap').textContent=near?'PICK UP · F':'SWAP · F';
    $('room-tip').textContent=near?`Pick up ${C.WEAPONS[near.type].name} · F / SWAP`:run.room.cleared?'Room clear. Walk through the green door →':run.room.enemies.some(e=>e.type==='shielded'&&e.hp>0)?'Shielded dog: attack from above or behind.':'Move · Jump · Hold FIRE · Clear the room';
    $('buffs').textContent=[run.shield?'◈ Shield':'',run.buffs.damage?`ϟ Double damage · ${run.buffs.damage} rooms`:'',run.buffs.magnet?`◆ Magnet · ${run.buffs.magnet} rooms`:'',run.buffs.bomb?'✹ Room bomb':''].filter(Boolean).join(' · ');
    const bosses=run.room.enemies.filter(e=>e.boss),hp=bosses.reduce((sum,e)=>sum+e.hp,0),max=bosses.reduce((sum,e)=>sum+e.maxHp,0);
    const visibility=run.room.boss&&hp>0;if($('boss-hud').hidden===visibility){$('boss-hud').hidden=!visibility;requestAnimationFrame(fit);}
    if(visibility){$('boss-name').textContent={ 'fat-cat':'THE FAT CAT',general:'THE DOG GENERAL',twins:'THE TWIN CATS'}[run.room.bossType];$('boss-health').style.width=`${hp/max*100}%`;
      $('boss-note').textContent=bosses.some(e=>run.generalShield(e))?'Destroy the turret to break the shield':bosses.some(e=>e.enraged)?'Last twin enraged':bosses.some(e=>e.phase===3)?'Final phase · keep moving':`♥ ${Math.ceil(hp)} / ${max}`;}
  }
  const dungeonSfx=window.GameAudio?.create({key:'dungeon-dash.sound.v1'}).bind([$('sound'),$('help-sound')]);
  function beep(event){dungeonSfx?.play(event==='fire'?(run.lastWeaponFired||run.weapon.type):({'boss-win':'round',kill:'confirm',slam:'impact'}[event]||event));}
  function frame(now){
    const dt=Math.min(.1,Math.max(0,(now-(last||now))/1000));last=now;
    if(run&&screen==='game'&&!paused()){
      const phase=run.phase;
      const x=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      run.update({x:Math.abs(joy)>.12?joy:x,jump:pending.jump||held.has('jump')||keys.has('w')||keys.has('arrowup'),fire:pending.fire||held.has('fire')||keys.has(' '),swap:pending.swap||held.has('swap')||keys.has('f'),drop:keys.has('s')||keys.has('arrowdown')},dt);
      pending={jump:false,fire:false,swap:false};
      for(const event of [...new Set(run.events.splice(0))])beep(event);
      if(run.phase==='shop'&&phase!=='shop'){$('shop-status').textContent='';checkpoint();shop();}
      else if(run.phase==='dead'&&phase!=='dead')death();
      if(now-saveAt>1000||run.roomNumber!==oldRoom){saveAt=now;oldRoom=run.roomNumber;checkpoint();}
    }
    if(screen==='game'&&run)Art.draw($('game').getContext('2d'),$('game'),run,now/1000,motion);
    if(screen==='title')Art.draw($('preview').getContext('2d'),$('preview'),preview,now/1000,motion);
    if(now-hudAt>100){hudAt=now;if(screen==='game')updateHud();}
    requestAnimationFrame(frame);
  }
  function origin(){try{const u=new URL(window.BILLACHUHA_CONFIG?.backendUrl),local=['localhost','127.0.0.1','10.0.2.2','[::1]'].includes(u.hostname);return !u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==='/'&&(u.protocol==='https:'||local&&u.protocol==='http:')?u.origin:null;}catch{return null;}}
  async function api(path,body){
    if(!origin())throw Error('Scores unavailable');const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),8000);
    try{const response=await fetch(origin()+path,{method:body?'POST':'GET',credentials:'include',headers:{'X-Chase-Web':'1',...(body?{'Content-Type':'application/json'}:{})},signal:abort.signal,...(body?{body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok){const error=Error('Score request failed');error.status=response.status;throw error;}return data;}finally{clearTimeout(timer);}
  }
  async function scores(){
    dialog('scores-dialog');$('scores-status').textContent='Loading the deepest rooms…';$('scores-list').replaceChildren();
    try{const data=await api('/api/v1/leaderboard/dungeon-dash?limit=20');if(!Array.isArray(data.entries))throw Error();$('scores-status').textContent=data.entries.length?'Best rooms reached':'No scores yet. Take the first dash.';
      for(const entry of data.entries.slice(0,20)){const li=document.createElement('li'),value=document.createElement('span');li.append(document.createTextNode(String(entry.name||'Player').slice(0,48)));value.textContent=`Room ${Number(entry.score).toLocaleString()}`;li.append(value);$('scores-list').append(li);}
    }catch{$('scores-status').textContent='Online scores are unavailable. Your dungeon and local upgrades still work.';}
  }
  async function saveScore(){
    if(savingScore||run?.phase!=='dead')return;const current=run;savingScore=true;$('save-score').disabled=true;$('score-status').textContent='Saving your deepest room…';$('sign-in').hidden=true;
    try{await api('/auth/web/session');const data=await api('/api/v1/scores',{game:'dungeon-dash',score:Math.min(1000000,current.roomNumber)});if(run===current)$('score-status').textContent=`Saved. Your online best is Room ${data.bestScore}.`;
    }catch(error){if(run!==current)return;if([401,403].includes(error.status)&&origin()){$('score-status').textContent='Sign in with your existing account, then return to this tab and save.';$('sign-in').href=origin()+'/multiplayer';$('sign-in').hidden=false;}else $('score-status').textContent='Couldn’t save online. Your local progress is kept. Try again when connected.';
    }finally{savingScore=false;if(run===current)$('save-score').disabled=false;}
  }
  for(const id of ['start','upgrade-start','retry'])$(id).onclick=start;
  for(const id of ['upgrades','death-upgrades'])$(id).onclick=()=>{$('upgrade-status').textContent='';upgrades();};
  $('upgrade-back').onclick=title;$('death-home').onclick=title;
  $('shop-continue').onclick=()=>{if(run?.phase==='shop'){run.continueShop();checkpoint();show('game');updateHud();$('game').focus({preventScroll:true});}};
  $('pause').onclick=pause;$('resume').onclick=()=>$('pause-dialog').close();
  $('retreat').onclick=()=>{$('pause-dialog').close();run.retreat();death();};
  $('help').onclick=()=>dialog('help-dialog');$('help-close').onclick=()=>$('help-dialog').close();
  $('scores').onclick=scores;$('scores-close').onclick=()=>$('scores-dialog').close();$('save-score').onclick=saveScore;

  $('motion').textContent=motion?'Motion effects on':'Motion effects off';$('motion').setAttribute('aria-pressed',String(motion));
  $('motion').onclick=()=>{motion=!motion;$('motion').textContent=motion?'Motion effects on':'Motion effects off';$('motion').setAttribute('aria-pressed',String(motion));};
  $('fullscreen').hidden=!document.documentElement.requestFullscreen;
  $('fullscreen').onclick=()=>{const p=document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();p?.catch(()=>{});};
  window.ArcadeStick($('joystick-container'),$('joystick-thumb'),x=>{joy=screen==='game'&&!paused()?x:0;});
  for(const button of document.querySelectorAll('[data-action]')){
    const action=button.dataset.action;
    button.addEventListener('pointerdown',event=>{if(screen!=='game'||paused()||event.pointerType==='mouse'&&event.button!==0||held.has(action))return;event.preventDefault();button.setPointerCapture(event.pointerId);held.set(action,event.pointerId);pending[action]=true;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{if(held.get(action)!==event.pointerId)return;held.delete(action);if(type!=='pointerup')pending[action]=false;});
    button.addEventListener('click',event=>{if(event.detail===0&&screen==='game'&&!paused())pending[action]=true;});
  }
  $('weapon').onclick=()=>{if(screen==='game'&&!paused())pending.swap=true;};
  document.addEventListener('keydown',event=>{
    const key=event.key.toLowerCase();if(event.ctrlKey||event.metaKey||event.altKey||paused()||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;
    if(['BUTTON','A'].includes(event.target.tagName)&&['enter',' '].includes(key))return;
    if(['p','escape'].includes(key)){if(screen==='game'||screen==='shop'){event.preventDefault();pause();}return;}
    if(screen!=='game'||!['a','d','w','s','arrowleft','arrowright','arrowup','arrowdown',' ','f'].includes(key))return;
    event.preventDefault();keys.add(key);if(!event.repeat){if(['w','arrowup'].includes(key))pending.jump=true;if(key===' ')pending.fire=true;if(key==='f')pending.swap=true;}
  });
  document.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
  for(const d of document.querySelectorAll('dialog'))d.addEventListener('close',clearInput);
  window.addEventListener('blur',()=>{clearInput();pause();checkpoint();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();checkpoint();if(run&&!['dead','dying'].includes(run.phase)&&!document.querySelector('dialog[open]'))dialog('pause-dialog');}});
  window.addEventListener('pagehide',checkpoint);window.addEventListener('resize',()=>{clearInput();if(run&&run.phase!=='dead'){const size=dimensions();run.resize(size.width,size.height);}fit();});new ResizeObserver(()=>requestAnimationFrame(fit)).observe($('viewport'));
  persist();if(recovered)$('storage-note').textContent=`Recovered ${profile.last.gems} saved gems from your interrupted run. Your wallet is ready.`;
  title();requestAnimationFrame(frame);
})();
