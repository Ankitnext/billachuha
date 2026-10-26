/* Public aggregate presence only; hidden tabs do not poll. */
(() => {
 'use strict';
 const status=document.getElementById('online-count');if(!status)return;
 let timer=null,busy=false,backend;
 try {
  backend=new URL(window.BILLACHUHA_CONFIG.backendUrl);
  const local=['localhost','127.0.0.1','10.0.2.2'].includes(backend.hostname);
  if((backend.protocol!=='https:'&&!(backend.protocol==='http:'&&local))||backend.username||backend.password||backend.pathname!=='/'||backend.search||backend.hash)throw Error();
 }catch(_){status.textContent='Chase online count unavailable.';status.classList.remove('is-loading');status.setAttribute('aria-busy','false');return;}
 async function refresh(){
  clearTimeout(timer);if(document.hidden||busy)return;busy=true;status.setAttribute('aria-busy','true');
  try {
   const response=await fetch(new URL('/api/v1/stats/online',backend),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error();const data=await response.json();
   if(!Number.isSafeInteger(data.playersOnline)||data.playersOnline<0||!Number.isSafeInteger(data.activeMatches)||data.activeMatches<0)throw Error();
   status.textContent=`● ${data.playersOnline} players online in Chase · ${data.activeMatches} active Chase matches`;
  }catch(_){status.textContent='Chase online count unavailable. The server may be sleeping; trying again shortly.';}
  finally{busy=false;status.classList.remove('is-loading');status.setAttribute('aria-busy','false');if(!document.hidden)timer=setTimeout(refresh,30000);}
 }
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)refresh();});
 window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',refresh);refresh();
})();
