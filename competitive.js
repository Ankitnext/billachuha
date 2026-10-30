/* Shared local competitive profiles and optional account sync. No game physics. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Competitive=api;})(globalThis,()=>{
 'use strict';
 const KEY='billachuha.competition.v1',localGames=['super-fight','sword-arena','moving-stairs'];
 const games=[['chase','Chase',true],['zombie-horde','Zombie Horde',true],['capture-zone','Capture the Zone',true],['arena-blitz','Arena Blitz',true],['super-fight','Super Fighting Arena',false],['sword-arena','Original Sword Arena',false],['moving-stairs','Snake & Ladder',false]].map(([id,name,verified])=>({id,name,verified,teams:verified}));
 const integer=(n,max=1000000)=>Math.max(0,Math.min(max,Number.isFinite(n)?Math.floor(n):0));
 const name=n=>String(n||'Player').normalize('NFKC').trim().slice(0,24)||'Player';
 const level=xp=>Math.min(50,1+Math.floor(Math.sqrt(integer(xp,1e9)/100)));
 class Profile{
  constructor(raw){this.entries=[];this.seen=[];this.names=['Player 1','Player 2'];
   if(raw&&Array.isArray(raw.entries))for(const p of raw.entries.slice(0,400)){
    if(!p||typeof p!=='object'||!localGames.includes(p.game)||!p.name)continue;const clean={game:p.game,name:name(p.name),best:integer(p.best),wins:integer(p.wins),matches:integer(p.matches),xp:integer(p.xp,1e9),stage:Math.max(1,integer(p.stage,50)),challenge:Math.max(1,integer(p.challenge,50))};
    if(!this.entries.some(e=>e.game===clean.game&&e.name.toLowerCase()===clean.name.toLowerCase()))this.entries.push(clean);
   }
   if(Array.isArray(raw?.seen))this.seen=raw.seen.filter(x=>typeof x==='string'&&x.length<=80).slice(-256);
   if(Array.isArray(raw?.names)&&raw.names.length>=2)this.names=raw.names.slice(0,4).map(name);
  }
  player(game,n){return this.entries.find(p=>p.game===game&&p.name.toLowerCase()===name(n).toLowerCase())||{game,name:name(n),best:0,wins:0,matches:0,xp:0,stage:1,challenge:1};}
  record({id,game,players,challenge=1}){
   if(!localGames.includes(game)||typeof id!=='string'||id.length>80||this.seen.includes(id)||!Array.isArray(players)||players.length<1||players.length>4||players.some(p=>!p||typeof p!=='object'))return false;
   const unique=new Set(players.map(p=>name(p.name).toLowerCase()));if(unique.size!==players.length)return false;
   for(const p of players){const previous=this.player(game,p.name),e={...previous};e.matches++;if(p.won)e.wins++;e.best=Math.max(e.best,integer(p.score));e.xp=integer(e.xp+15+(p.won?35:0),1e9);e.challenge=Math.max(e.challenge,integer(challenge,50));if(p.won)e.stage=Math.min(50,e.stage+1);const at=this.entries.indexOf(previous);if(at>=0)this.entries[at]=e;else this.entries.push(e);}
   this.entries=this.entries.slice(-400);this.seen.push(id);this.seen=this.seen.slice(-256);return true;
  }
  list(game='all'){return this.entries.filter(e=>game==='all'||e.game===game).map(e=>({...e,score:e.best,level:level(e.xp),verified:false})).sort((a,b)=>b.score-a.score||b.wins-a.wins||a.name.localeCompare(b.name)).map((e,i)=>({...e,rank:i+1}));}
 }
 function load(storage){let raw;try{storage??=globalThis.localStorage;raw=JSON.parse(storage?.getItem(KEY)||'null');}catch{}return new Profile(raw);}
 function save(profile,storage){try{storage??=globalThis.localStorage;storage.setItem(KEY,JSON.stringify(profile));return true;}catch{return false;}}
 function id(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)+'-match';}
 function base(){return String(globalThis.BILLACHUHA_CONFIG?.backendUrl||globalThis.location?.origin||'').replace(/\/$/,'');}
 async function api(route,body){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{const response=await fetch(base()+route,{signal:controller.signal,credentials:'include',headers:{'X-Chase-Web':'1',...(body?{'Content-Type':'application/json'}:{})},...(body?{method:'POST',body:JSON.stringify(body)}:{})});let data;try{data=await response.json();}catch{throw Error('Rankings are unavailable. Local results are saved.');}if(!response.ok){const error=Error(data.error?.message||'Sign in to sync local results.');error.status=response.status;throw error;}return data;}finally{clearTimeout(timer);}}
 async function sync(result){const p=result.players[0];return api('/api/v1/competition/local',{id:result.id,game:result.game,level:result.challenge,score:integer(p.score),won:!!p.won});}
 function fightScore(match,index){const rounds=match.history.map(r=>r.stats[index]),damage=rounds.reduce((sum,r)=>sum+r.damage,0),combo=Math.max(0,...rounds.map(r=>r.maxCombo)),won=match.wins[index]>=2;
  const multiplier={easy:1,normal:1.2,hard:1.5,impossible:2}[match.difficulty]||1;
  return integer((damage+combo*20+match.wins[index]*400+(won?2000:0))*multiplier*(1+(Math.max(1,match.level||1)-1)*.08));
 }
 return{KEY,games,localGames,Profile,load,save,name,level,id,api,sync,fightScore};
});
