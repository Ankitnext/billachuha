(() => {
'use strict';
const chaseLink = document.getElementById('online-chase') || document.querySelector('[data-chase-play]');
if (!chaseLink) return;
const chaseStatus = document.getElementById('online-chase-status') || {textContent:''};
try {
  const backend = new URL(window.BILLACHUHA_CONFIG.backendUrl);
  const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(backend.hostname);
  if ((backend.protocol !== 'https:' && !(backend.protocol === 'http:' && local)) || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) throw new Error('Invalid backend URL');
  chaseLink.href = new URL('/multiplayer', backend).href;
  chaseLink.hidden = false;
  for (const link of document.querySelectorAll('[data-chase-play]')) { link.href=chaseLink.href;link.hidden=false; }
  chaseStatus.textContent = 'Browser + Android · Friends or bots.';
  const account = document.getElementById('arcade-account'), signIn = document.getElementById('arcade-signin');
  if (!account || !signIn) return;
  signIn.href = chaseLink.href; signIn.hidden = false;
  const accountKey = `billachuha.account.${backend.origin}`;
  let accountGeneration=0, loggingOut=false;
  function showAccount(user) {
    account.hidden = !user; signIn.hidden = !!user;
    document.getElementById('arcade-player').textContent = user ? `Signed in as ${user.name}` : '';
    document.getElementById('arcade-player-id').textContent = user ? `Player ID: ${user.id}` : '';
    chaseLink.textContent = user ? 'Open Chase lobby →' : 'Play Chase Now →';
    try { if(user)localStorage.setItem(accountKey,JSON.stringify({id:user.id,name:user.name}));else localStorage.removeItem(accountKey); } catch (_) {}
  }
  try { const cached=JSON.parse(localStorage.getItem(accountKey)); if(cached && typeof cached.id==='string' && typeof cached.name==='string')showAccount(cached); } catch (_) {}
  async function refreshAccount() {
    if(loggingOut)return;
    const generation=++accountGeneration;
    try {
      const response=await fetch(new URL('/auth/web/session',backend),{credentials:'include',headers:{'X-Chase-Web':'1'},cache:'no-store',signal:AbortSignal.timeout(10000)});
      if(generation!==accountGeneration)return;
      if(response.status===401){showAccount(null);return;}
      if(!response.ok)return;
      const data=await response.json(); if(generation===accountGeneration)showAccount(data.user);
    } catch (_) { /* Keep saved identity during a temporary outage. */ }
  }
  document.getElementById('arcade-logout').addEventListener('click',async()=>{
    const button=document.getElementById('arcade-logout');button.disabled=true;
    loggingOut=true;accountGeneration++;
    try {
      const response=await fetch(new URL('/auth/web/logout',backend),{method:'POST',credentials:'include',headers:{'X-Chase-Web':'1'},signal:AbortSignal.timeout(10000)});
      if(!response.ok)throw new Error();
      showAccount(null);chaseStatus.textContent='You are logged out. Sign in once to remember this device.';
    } catch (_) {chaseStatus.textContent='Could not reach the server to log out. Reconnect and try again.';}
    finally {loggingOut=false;accountGeneration++;button.disabled=false;}
  });
  window.addEventListener('pageshow',refreshAccount);
  window.addEventListener('focus',refreshAccount);
  refreshAccount();
  chaseStatus.textContent = '7 rats · 5 cats · 3 dogs. Join Android players or start with bots.';
} catch (_) {
  chaseLink.hidden = true;
  for (const link of document.querySelectorAll('[data-chase-play]')) link.hidden=true;
  chaseStatus.textContent = 'Online Chase will be available when the game server is configured.';
}

})();
