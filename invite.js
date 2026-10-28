'use strict';
(async()=>{
 const status=document.getElementById('invite-status'),button=document.getElementById('continue-invite');
 try{
  const code=new URLSearchParams(location.search).get('room')?.toLowerCase();
  if(!/^[a-f0-9]{8}$/.test(code||''))throw new Error('This invitation is incomplete. Ask your friend for a new link.');
  const backend=new URL(window.BILLACHUHA_CONFIG.backendUrl);
  const local=['localhost','127.0.0.1','10.0.2.2'].includes(backend.hostname);
  if((backend.protocol!=='https:'&&!(local&&backend.protocol==='http:'))||backend.username||backend.password||backend.pathname!=='/'||backend.search||backend.hash)throw new Error('The game server is not configured.');
  const response=await fetch(new URL(`/api/v1/rooms/${code}/info`,backend),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)}),data=await response.json();
  if(!response.ok)throw new Error(data.error?.message||'This invitation is no longer available.');
  status.textContent=`${data.room.hostName} invited you · ${data.room.playerCount} / ${data.room.maxPlayers} players. ${data.room.state==='waiting'?'The lobby is waiting for players.':'This match has started. Existing members can reconnect; new players must wait for the next lobby.'}`;
  const arcade=['zombie-horde','arena-blitz'].includes(data.room.game);
  const target=new URL(arcade?'/multiplayer/modes':'/multiplayer',backend);if(arcade)target.searchParams.set('game',data.room.game);if(data.room.variant==='capture')target.searchParams.set('variant','capture');target.searchParams.set('room',code);button.href=target.href;button.hidden=false;
 }catch(error){status.textContent=error.name==='TimeoutError'?'The server is taking a while. Reload to check your invitation.':error.message;}
})();
