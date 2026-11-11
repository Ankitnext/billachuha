/* Shared room transport. Dice, turns, collisions and results come from the server. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),appMode=location.pathname==='/multiplayer/app';
  const icons={rat:'🐭',cat:'🐱',dog:'🐶'};
  let hooks,me,room,state,socket,connection=0,retry,timer,sequence=0,received=0,serverTime=0,delay=1000,pending=false,paused=false,closing=false,lastSent=0;
  let invite=new URLSearchParams(location.search).get('room')||'';
  if(!/^[a-f0-9]{8}$/i.test(invite))invite='';
  const live=()=>socket?.readyState===1&&(state?.phase==='finished'||performance.now()-received<1500)&&!paused;
  const own=()=>!!me&&state?.players[state.current]?.id===me.id;
  const canAct=()=>live()&&own()&&!pending&&state?.phase!=='finished';
  function status(text){$('online-status').textContent=text||'';}
  async function api(path,body){
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
    try{
      const response=await fetch(path,{method:body===undefined?'GET':'POST',credentials:'include',signal:controller.signal,
        headers:{[appMode?'X-Chase-App':'X-Chase-Web']:'1',...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
      const data=await response.json();
      if(!response.ok){if(appMode&&response.status===401&&!closing)location.replace('https://appassets.androidplatform.net/reconnect');const error=Error(data.error?.message||'Unable to connect to the game server.');error.status=response.status;throw error;}
      return data;
    }finally{clearTimeout(timeout);}
  }
  function run(task){return async event=>{event?.preventDefault();if(pending)return;pending=true;decorate();try{await task();status();}catch(error){status(error.name==='AbortError'?'Connection timed out. Please try again.':error.message);}finally{pending=false;renderRoom();decorate();}};}
  function stop(){connection++;clearTimeout(retry);retry=null;const previous=socket;socket=null;previous?.close();hooks?.clearInput();}
  function home(){stop();room=null;state=null;serverTime=0;received=0;hooks.home();$('online-lobby').hidden=false;renderRoom();}
  function acceptRoom(next){
    if(next.game!=='snake-ladder-online'){room=next;stop();hooks.home();$('online-lobby').hidden=false;renderRoom();return;}
    if(room?.code===next.code&&next.revision<room.revision)return;
    const changed=room?.code!==next.code;room=next;
    if(changed){state=null;serverTime=0;received=0;}
    if(room.state==='waiting'){state=null;serverTime=0;hooks.home();$('online-lobby').hidden=false;}
    renderRoom();
  }
  function acceptWorld(world){
    if(!world?.snake||room?.game!=='snake-ladder-online'||room.state==='waiting'||world.serverTime<serverTime)return;
    if(state?.matchId===world.snake.matchId&&world.snake.revision<state.revision)return;
    serverTime=world.serverTime;received=performance.now();state=world.snake;
    $('online-lobby').hidden=true;hooks.snapshot(state);decorate();
    if(state.phase==='finished'&&world.matchId!==lastRewardMatch){lastRewardMatch=world.matchId;window.Rewards?.accountResult($('result-stats').parentElement,world.matchId);}
  }
  function schedule(generation){if(generation!==connection||closing||paused||!room)return;clearTimeout(retry);status('Reconnecting… controls released.');retry=setTimeout(connect,delay);delay=Math.min(8000,delay*1.5);}
  async function connect(){
    stop();if(!room||room.game!=='snake-ladder-online'||paused||closing)return;const generation=connection;
    try{
      const code=room.code;
      const current=await api(`/api/v1/rooms/${code}`);if(generation!==connection)return;acceptRoom(current.room);
      const ticket=await api(`/api/v1/rooms/${code}/ticket`,{});if(generation!==connection)return;
      const url=new URL(ticket.path,location.origin);url.protocol=location.protocol==='https:'?'wss:':'ws:';url.searchParams.set('ticket',ticket.ticket);
      const ws=new WebSocket(url);socket=ws;
      ws.onopen=()=>{if(generation!==connection){ws.close();return;}sequence=0;delay=1000;status();};
      ws.onmessage=event=>{if(generation!==connection)return;try{const data=JSON.parse(event.data);if(data.type==='room.state')acceptRoom(data.room);if(data.type==='match.state')acceptWorld(data.match);if(data.type==='error')status(data.error?.message||'Game connection interrupted.');}catch{status('Unable to read the game state. Reconnecting…');ws.close();}};
      ws.onerror=()=>ws.close();ws.onclose=()=>{if(generation!==connection)return;socket=null;hooks.clearInput();schedule(generation);};
    }catch(error){if(generation!==connection)return;if([403,404].includes(error.status)){home();status('Your room ended or you left it. Create or join a room to play again.');}else schedule(generation);}
  }
  function renderRoom(){
    if(!hooks)return;
    if(!state){$('online-connection').textContent=room?`Room ${room.code.toUpperCase()}`:'Online · 2–4 players';$('online-rematch').hidden=true;}
    $('online-auth').hidden=!!me;$('online-home').hidden=!me||!!room;$('online-room').hidden=!room;
    $('online-actions').hidden=!room;
    $('online-identity').textContent=me?`Signed in as ${me.name}`:'Sign in to play with friends on separate devices.';
    if(!room)return;
    const other=room.game!=='snake-ladder-online';$('online-room-title').textContent=other?'You already have a room':`Room ${room.code.toUpperCase()} · ${room.players.length} / 4 players`;
    $('online-room-note').textContent=other?'Leave your current game before creating a Snake & Ladder room.':room.state==='waiting'?'Choose a character, then get ready. The host starts with 2–4 players.':'Reconnecting to your race…';
    $('online-roles').hidden=other||room.state!=='waiting';$('online-ready').hidden=other||room.state!=='waiting';$('online-start').hidden=other||room.state!=='waiting'||room.hostId!==me?.id;
    $('online-start').disabled=pending||room.players.length<2||room.players.some(p=>!p.ready);
    const self=room.players.find(p=>p.id===me?.id);$('online-ready').textContent=self?.ready?'Ready ✓ · undo':'I’m ready';$('online-ready').disabled=pending;
    for(const button of $('online-roles').children){button.setAttribute('aria-pressed',String(button.dataset.role===self?.role));button.disabled=pending;}
    $('online-players').replaceChildren();for(let i=0;i<4;i++){
      const p=room.players[i],row=document.createElement('li');row.textContent=p?`${icons[p.role]||''} ${p.name}${p.id===me?.id?' · You':''}${p.id===room.hostId?' · Host':''} — ${p.ready?'Ready ✓':'Choosing…'}`:'＋ Waiting for a friend';$('online-players').append(row);
    }
    $('online-invite').hidden=other;$('online-code').textContent=other?'':`Share code ${room.code.toUpperCase()}`;
    $('online-link').textContent=other?'':new URL(`/multiplayer/snake-ladder?room=${room.code}`,location.origin).href;
  }
  function decorate(){
    if(!hooks||!state)return;
    const actor=state.players[state.current],active=canAct(),spectating=!own();
    const connectionText=live()?(state.phase==='finished'?'Race complete':`${own()?'Your turn':`Watching ${actor.name}`} · ${state.phase==='action'?'Live stage':`${Math.ceil(state.decisionRemainingMs/1000)}s`}`):'Reconnecting… controls released';
    $('online-connection').textContent=connectionText;
    document.body.classList.toggle('online-spectating',spectating||!live());
    for(const id of ['roll','reroll','play-move','continue'])$(id).disabled=!active;
    $('new-game').textContent='Leave room';$('play-again').textContent='Leave room';
    $('turn-message').textContent=(spectating?`Waiting for ${actor.name}. `:'')+state.message;
    const label=document.querySelector('.turn-head .eyebrow');if(label)label.textContent=own()?'YOUR TURN':'WATCHING';
    $('stage-kind').textContent=connectionText;
    $('continue').textContent=spectating?`Waiting for ${actor.name}…`:state.queued?'Play the next challenge →':'Next player →';
    $('online-rematch').hidden=state.phase!=='finished'||room?.hostId!==me?.id;
    $('online-rematch').disabled=pending;
  }
  async function command(action){
    if(!canAct())return;pending=true;decorate();
    try{const data=await api(`/api/v1/rooms/${room.code}/snake`,{action,matchId:state.matchId,revision:state.revision});acceptWorld(data.match);status();}
    catch(error){status(error.message);if(error.status===409)try{acceptWorld((await api(`/api/v1/rooms/${room.code}/match`)).match);}catch{}}
    finally{pending=false;decorate();}
  }
  async function leave(){if(!room||pending)return;pending=true;try{await api(`/api/v1/rooms/${room.code}/leave`,{});home();status('You left the room.');}catch(error){status(error.message);}finally{pending=false;renderRoom();}}
  let lastRewardMatch='';
  async function boot(){
    status('Connecting to the game server…');
    try{
      me=(await api(appMode?'/auth/me':'/auth/web/session')).user;
      window.Rewards?.prime(me,api);
      $('online-login').hidden=true;renderRoom();
      try{const current=await api('/api/v1/rooms/current');acceptRoom(current.room);await connect();}
      catch(error){if(error.status!==404)throw error;}
      if(invite&&!room){$('online-room-code').value=invite;status('Your friend’s room code is filled in. Tap Join room.');}else status();
    }catch(error){if(![401,403].includes(error.status))status(error.message);else status('Sign in to create or join a room.');$('online-login').hidden=appMode;}
    renderRoom();
  }
  async function closeApp(){
    if(closing)return;closing=true;stop();
    const cleanup=async()=>{try{if(room)await api(`/api/v1/rooms/${room.code}/leave`,{});}catch{}try{await api('/api/v1/app/end',{});}catch{}};
    await Promise.race([cleanup(),new Promise(resolve=>setTimeout(resolve,2000))]);location.replace('https://appassets.androidplatform.net/menu');
  }
  function attach(callbacks){
    hooks=callbacks;document.body.classList.add('online-stairs');
    const lobby=document.createElement('section');lobby.id='online-lobby';lobby.innerHTML=`
      <div class="online-card"><p class="eyebrow">SNAKE & LADDER · 2–4 ONLINE PLAYERS</p><h2>Race your friends to 100.</h2>
      <p id="online-identity"></p><p>Take turns rolling and playing a platform challenge. Everyone sees the same board and watches the active player live.</p>
      <div id="online-auth"><form id="online-login"><label>Email<input id="online-email" type="email" required autocomplete="email" maxlength="254"></label><label>Password<input id="online-password" type="password" required autocomplete="current-password" maxlength="256"></label><button class="primary">Sign in</button></form><a href="/multiplayer" target="_blank" rel="noopener">Create account or use email sign-in ↗</a><button id="online-retry" class="secondary">I’m signed in · reconnect</button></div>
      <div id="online-home" hidden><button id="online-create" class="primary">Create a room · up to 4 players</button><form id="online-join"><label>Friend’s room code<input id="online-room-code" required pattern="[a-fA-F0-9]{8}" maxlength="8" placeholder="8-character code" autocomplete="off" autocapitalize="characters"></label><button class="secondary">Join room →</button></form></div>
      <div id="online-room" hidden><h3 id="online-room-title"></h3><p id="online-room-note"></p><p id="online-code"></p><div id="online-invite"><button id="online-copy" class="secondary">Copy invitation</button><p id="online-link"></p></div><div id="online-roles" role="group" aria-label="Choose character"><button data-role="rat">🐭 Rat · Double jump</button><button data-role="cat">🐱 Cat · Speed boost</button><button data-role="dog">🐶 Dog · Shoot & reroll</button></div><ol id="online-players"></ol><div id="online-actions" class="online-room-actions" hidden><button id="online-ready" class="primary">I’m ready</button><button id="online-start" class="primary">Start race →</button><button id="online-leave" class="quiet">Leave room</button></div></div>
      <p class="online-rules">30 seconds to roll or start a move. Results advance after 8 seconds. A lost connection can rejoin; missed turns pass automatically. Leaving forfeits your place. The race ends at cell 100 or after 45 minutes.</p></div>`;
    $('snake-shell').append(lobby);
    // Pin Ready/Start/Leave outside the scrolling room contents on short phones.
    lobby.append($('online-actions'));
    const bar=document.createElement('aside');bar.id='online-bar';bar.innerHTML='<span id="online-connection">Online · 2–4 players</span><span id="online-status" role="status" aria-live="polite"></span><button id="online-rematch" hidden>Back to room · Rematch</button>';$('snake-shell').append(bar);
    $('online-login').onsubmit=run(async()=>{me=(await api('/auth/web/login',{email:$('online-email').value.trim(),password:$('online-password').value})).user;$('online-password').value='';await boot();});
    $('online-retry').onclick=()=>boot();
    if(appMode){$('online-login').hidden=true;$('online-auth').querySelector('a').hidden=true;$('online-retry').textContent='Reconnect to server';}
    $('online-create').onclick=run(async()=>{const data=await api('/api/v1/rooms',{game:'snake-ladder-online',maxPlayers:4});acceptRoom(data.room);await connect();});
    $('online-join').onsubmit=run(async()=>{const code=$('online-room-code').value.trim().toLowerCase();if(!/^[a-f0-9]{8}$/.test(code))throw Error('Enter the 8-character room code.');const data=await api(`/api/v1/rooms/${code}/join`,{});acceptRoom(data.room);invite='';await connect();});
    for(const button of $('online-roles').children)button.onclick=run(async()=>acceptRoom((await api(`/api/v1/rooms/${room.code}/role`,{role:button.dataset.role})).room));
    $('online-ready').onclick=run(async()=>acceptRoom((await api(`/api/v1/rooms/${room.code}/ready`,{ready:!room.players.find(p=>p.id===me.id)?.ready})).room));
    $('online-start').onclick=run(async()=>acceptRoom((await api(`/api/v1/rooms/${room.code}/start`,{})).room));
    $('online-rematch').onclick=run(async()=>acceptRoom((await api(`/api/v1/rooms/${room.code}/finish`,{})).room));
    $('online-leave').onclick=leave;
    $('online-copy').onclick=async()=>{try{await navigator.clipboard.writeText($('online-link').textContent);status('Invitation copied.');}catch{status('Share the room code or invitation link shown above.');}};
    $('new-game').onclick=()=>{hooks.clearInput();$('pause-dialog').showModal();};
    $('play-again').onclick=leave;
    $('pause-dialog').querySelector('h2').textContent='Online race keeps running.';$('pause-dialog').querySelector('p:not(.eyebrow)').textContent='Your controls are released while this menu is open. Return before the turn or stage timer runs out.';$('quit').textContent='Leave room';
    $('pause').textContent='Options';
    for(const p of $('help-dialog').querySelectorAll('p'))p.textContent=p.textContent.replace('P pauses.','P opens Options; the online race continues.');
    // Shared scores in this room are authoritative; they are not solo uploads.
    for(const node of document.querySelectorAll('#rankings,.arcade-toolbar a[href*="rankings"],#online-entry'))node.hidden=true;
    $('help-dialog').querySelector('p:last-of-type').textContent='Online: 2–4 friends on separate devices. Create a room and share its code. Only the current player rolls and controls the challenge; everyone else watches live. Choose Ready before the host starts.';
    const back=document.querySelector('.arcade-toolbar>a');back.textContent=appMode?'‹ App menu':'‹ Games';back.href=appMode?'https://appassets.androidplatform.net/menu':'/multiplayer';
    back.onclick=async event=>{if(appMode){event.preventDefault();await closeApp();}else if(room){event.preventDefault();hooks.clearInput();$('pause-dialog').showModal();}};
    const menu=document.createElement('details');menu.className='native-game-menu';menu.innerHTML='<summary>Menu</summary><div></div>';const toolbar=document.querySelector('.toolbar-actions');for(const child of [...toolbar.children])if(!['pause','fullscreen'].includes(child.id))menu.lastElementChild.append(child);toolbar.append(menu);menu.addEventListener('toggle',()=>hooks.clearInput());menu.lastElementChild.onclick=()=>{menu.open=false;};
    if(appMode){document.body.classList.add('android-arcade','app-mode');$('fullscreen').hidden=true;window.ChaseApp=Object.freeze({editHud(){hooks.editHud();return true;},dismissSettings(){if(window.Rewards?.dismiss())return true;if(menu.open){menu.open=false;return true;}const dialog=document.querySelector('dialog[open]');if(!dialog)return false;const cancel=dialog.querySelector('[data-cancel]');if(cancel)cancel.click();else dialog.close();hooks.clearInput();return true;},pause(){paused=true;stop();},resume(){paused=false;if(room&&!socket)connect();},close:closeApp});}
    function layout(){document.body.classList.toggle('is-playing',!$('action').hidden);}
    new MutationObserver(layout).observe($('action'),{attributes:true,attributeFilter:['hidden']});layout();
    timer=setInterval(()=>{decorate();if(socket?.readyState===1&&state&&state.phase!=='finished'&&performance.now()-received>5000){socket.close();}},500);
    window.addEventListener('pagehide',()=>{clearInterval(timer);stop();});
    window.addEventListener('online',()=>{if(room&&!socket)connect();});
    boot();
  }
  window.StairsOnline={appMode,attach,command,leave,decorate,sent:false,input(input){
    this.sent=false;const now=performance.now();if(now-lastSent<50)return;lastSent=now;this.sent=true;
    if(!live()||!own()||state.phase!=='action')return;
    socket.send(JSON.stringify({type:'player.input',sequence:++sequence,boardRevision:state.revision,x:input.x||0,y:0,jump:!!input.jump,ability:!!input.ability,shoot:!!input.shoot}));
  }};
})();
