'use strict';
const chaseLink = document.getElementById('online-chase');
const chaseStatus = document.getElementById('online-chase-status');
try {
  const backend = new URL(window.BILLACHUHA_CONFIG.backendUrl);
  const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(backend.hostname);
  if ((backend.protocol !== 'https:' && !(backend.protocol === 'http:' && local)) || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) throw new Error('Invalid backend URL');
  chaseLink.href = new URL('/multiplayer', backend).href;
  chaseLink.hidden = false;
  chaseStatus.textContent = '7 rats · 5 cats · 3 dogs. Join Android players or start with bots.';
} catch (_) {
  chaseLink.hidden = true;
  chaseStatus.textContent = 'Online Chase will be available when the game server is configured.';
}
