/* Resolve online games against the same public origin configuration as Chase. */
(() => {
  'use strict';
  const modes=new Set(['zombie-horde','arena-blitz']);
  try {
    const backend=new URL(window.BILLACHUHA_CONFIG?.backendUrl);
    const local=['localhost','127.0.0.1','10.0.2.2'].includes(backend.hostname);
    if((backend.protocol!=='https:'&&!(local&&backend.protocol==='http:'))||backend.username||backend.password||backend.pathname!=='/'||backend.search||backend.hash)throw Error();
    function target(game){const url=new URL('/multiplayer/modes',backend);url.searchParams.set('game',game);return url;}
    for(const link of document.querySelectorAll('[data-online-mode]'))if(modes.has(link.dataset.onlineMode))link.href=target(link.dataset.onlineMode).href;
    const game=document.body.dataset.onlineMode;if(!modes.has(game))return;
    const url=target(game),code=new URLSearchParams(location.search).get('room');if(/^[a-f0-9]{8}$/i.test(code||''))url.searchParams.set('room',code.toLowerCase());
    if(game==='zombie-horde'&&new URLSearchParams(location.search).get('variant')==='capture')url.searchParams.set('variant','capture');
    document.getElementById('launch-game').href=url.href;
    location.replace(url.href);
  }catch(_){const status=document.getElementById('launch-status');if(status)status.textContent='The online game server is not configured. Please return to the library and try again later.';}
})();
