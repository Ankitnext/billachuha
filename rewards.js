/* Permanent cosmetic rewards. Local profiles and account results stay separate. */
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Rewards=api;})(globalThis,()=>{
 'use strict';
 const integer=n=>Number.isFinite(n)?Math.max(0,Math.min(1e9,Math.floor(n))):0;
 function stats(entries,name){
  const out={matches:0,wins:0,xp:0,games:0},normalize=value=>String(value).normalize('NFKC').trim().slice(0,24).toLowerCase();
  for(const p of entries||[]){if(name&&normalize(p.name)!==normalize(name))continue;out.matches+=integer(p.matches);out.wins+=integer(p.wins);out.xp+=integer(p.xp);if(p.matches>0)out.games++;
   const key={chase:'chaseWins','capture-zone':'captureWins','arena-blitz':'blitzWins','moving-stairs':'snakeWins','snake-ladder-online':'snakeWins'}[p.game];if(key)out[key]=(out[key]||0)+integer(p.wins);
  }return out;
 }
 function evaluate(catalog,values={}){
  const xp=integer(values.xp),level=Math.min(50,1+Math.floor(Math.sqrt(xp/100))),levelTarget=(2*level-1)*100;
  const data={xp,level,levelTarget,levelXP:level===50?levelTarget:Math.min(levelTarget,xp-(level-1)**2*100),earned:0,nextBadge:'',badges:[],styles:[]};let closest=-1;
  for(const item of catalog.badges){const progress=Math.min(item.target,integer(values[item.stat])),earned=progress>=item.target;data.badges.push({...item,progress,earned});if(earned)data.earned++;else if(progress/item.target>closest){closest=progress/item.target;data.nextBadge=item.id;}}
  data.styles=catalog.styles.map(s=>({...s,unlocked:data.earned>=s.required}));return data;
 }
 const result={stats,evaluate};if(typeof document==='undefined')return result;
 const script=document.currentScript,assetBase=new URL('.',script.src),C=window.Competitive;
 const onlinePage=/^\/(?:multiplayer(?:\/|$)|join\/)/.test(location.pathname);
 let catalogPromise,identity=null,accountAPI=null,accountBaseline=null,dialog=null,loadGeneration=0,localName='';
 const cache=new Map(),tokens=new WeakMap();
 const catalog=()=>catalogPromise??=fetch(new URL('rewards-catalog.json',assetBase)).then(r=>{if(!r.ok)throw Error('Badge collection is unavailable.');return r.json();});
 const node=(tag,text,className)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;};
 function storage(key,value){try{if(value===undefined)return localStorage.getItem(key);localStorage.setItem(key,value);}catch{}return null;}
 function styleFor(data,key){const saved=storage('billachuha.style.v1:'+location.origin+':'+key);return data.styles.find(s=>s.id===saved&&s.unlocked)||data.styles.filter(s=>s.unlocked).at(-1)||data.styles[0];}
 function meter(value,target,label){const wrap=node('div',undefined,'reward-meter');wrap.setAttribute('role','progressbar');wrap.setAttribute('aria-label',label);wrap.setAttribute('aria-valuemin','0');wrap.setAttribute('aria-valuemax',String(target));wrap.setAttribute('aria-valuenow',String(value));const fill=node('i');fill.style.width=`${Math.min(100,value/Math.max(1,target)*100)}%`;wrap.append(fill);return wrap;}
 async function request(path){
  if(accountAPI)return accountAPI(path);
  const app=location.pathname==='/multiplayer/app'||new URLSearchParams(location.search).get('return')==='app';
  const url=new URL(path,window.BILLACHUHA_CONFIG?.backendUrl||location.origin),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(url,{credentials:'include',signal:controller.signal,headers:{[app?'X-Chase-App':'X-Chase-Web']:'1'}});const data=await response.json();if(!response.ok){const e=Error(response.status===404?'Badges need the updated game server.':data.error?.message||'Sign in to see account badges.');e.status=response.status;throw e;}return data;}finally{clearTimeout(timer);}
 }
 async function account(){if(!identity)identity=(await request(location.pathname==='/multiplayer/app'||new URLSearchParams(location.search).get('return')==='app'?'/auth/me':'/auth/web/session')).user;if(identity.guest)throw Error('Sign in to collect account badges. Local game badges are available in the game menu.');return request('/api/v1/rewards/me');}
 function summary(data,key,name){
  const style=styleFor(data,key),box=node('section',undefined,'reward-profile');box.style.setProperty('--reward-accent',style.color);
  const emblem=node('span','✦','reward-level');emblem.setAttribute('aria-hidden','true');
  const copy=node('div');copy.append(node('p',style.title,'reward-kicker'),node('h3',name||'Your collection'),node('p',`Level ${data.level} · ${data.xp.toLocaleString()} XP · ${data.earned} / ${data.badges.length} badges`));
  box.append(emblem,copy);const next=data.badges.find(b=>b.id===data.nextBadge);
  box.append(meter(data.levelXP,data.levelTarget,`Level ${data.level} progress`));
  box.append(node('p',data.level===50?'Maximum player level':`${(data.levelTarget-data.levelXP).toLocaleString()} XP to level ${data.level+1}`,'reward-level-note'));
  if(next){const goal=node('div',undefined,'reward-next');goal.append(node('strong',`${next.icon} Next badge · ${next.name}`),node('span',`${next.progress.toLocaleString()} / ${next.target.toLocaleString()}`),meter(next.progress,next.target,next.description),node('small',next.description));box.append(goal);}
  else box.append(node('p','All badges collected. Your achievements stay yours.','reward-next'));
  return box;
 }
 function renderCollection(data,key,name,host,filter='all'){
  host.classList.add('reward-collection');
  const sidebar=node('div',undefined,'reward-sidebar'),list=node('div',undefined,'reward-list');sidebar.append(summary(data,key,name));host.replaceChildren(sidebar,list);
  const custom=node('section',undefined,'reward-custom');custom.append(node('h3','Choose your profile style'));
  const choices=node('div',undefined,'reward-styles'),selected=styleFor(data,key);
  for(const s of data.styles){const b=node('button',`${s.unlocked?'✦':'◇'} ${s.name}${s.unlocked?'':` · ${s.required} badges`}`);b.type='button';b.disabled=!s.unlocked;b.style.setProperty('--reward-accent',s.color);b.setAttribute('aria-pressed',String(s.id===selected.id));b.title=s.title;b.onclick=()=>{storage('billachuha.style.v1:'+location.origin+':'+key,s.id);renderCollection(data,key,name,host,filter);};choices.append(b);}custom.append(choices,node('p','Styles and titles are cosmetic. Your selection stays on this device.','reward-caption'));sidebar.append(custom);
  const filters=node('div',undefined,'reward-filters');for(const [id,label]of [['all','All badges'],['earned','Earned'],['locked','In progress']]){const b=node('button',label);b.type='button';b.setAttribute('aria-pressed',String(filter===id));b.onclick=()=>renderCollection(data,key,name,host,id);filters.append(b);}list.append(filters);
  const grid=node('div',undefined,'reward-grid');for(const b of data.badges){if(filter==='earned'&&!b.earned||filter==='locked'&&b.earned)continue;
   const card=node('article',undefined,`reward-badge ${b.rarity}${b.earned?' earned':''}`),icon=node('span',b.icon,'reward-medal');icon.setAttribute('aria-hidden','true');
   card.append(icon,node('p',b.earned?'✓ EARNED':b.rarity.toUpperCase(),'reward-kicker'),node('h3',b.name),node('p',b.description),meter(b.progress,b.target,b.description),node('small',`${b.progress.toLocaleString()} / ${b.target.toLocaleString()}`));grid.append(card);
  }if(!grid.children.length)grid.append(node('p',filter==='earned'?'Finish a match to earn your first badge.':'Every badge collected!'));list.append(grid);
 }
 async function open(source){
  window.dispatchEvent(new Event('blur'));if(!dialog){dialog=node('dialog',undefined,'rewards-dialog');dialog.setAttribute('aria-label','Badges and profile styles');const header=node('header');header.append(node('h2','Your trophy room'));const close=node('button','Close');close.type='button';close.onclick=()=>dialog.close();header.append(close);dialog.append(header,node('div',undefined,'reward-content'));document.body.append(dialog);}
  if(!dialog.open)dialog.showModal();const host=dialog.lastElementChild,generation=++loadGeneration;host.replaceChildren(node('p','Loading your collection…'));
  try{const c=await catalog();if(generation!==loadGeneration)return;
   const device=source==='device'||source===undefined&&!onlinePage;
   if(device){const profile=C.load(),names=[...new Set(profile.entries.map(p=>p.name))];if(!names.length)names.push(localName||profile.names[0]);if(!names.includes(localName))localName=names[0];
    const label=node('label','This device · Player'),select=node('select');for(const name of names){const option=node('option',name);option.value=name;select.append(option);}select.value=localName;label.append(select);const body=node('div');host.replaceChildren(label,body);const show=()=>{localName=select.value;renderCollection(evaluate(c,stats(profile.entries,localName)),'device:'+localName,localName,body);};select.onchange=show;show();
   }else{const data=await account();if(generation!==loadGeneration)return;renderCollection(data,'account:'+identity.id,identity.name,host);}
  }catch(error){if(generation!==loadGeneration)return;host.replaceChildren(node('p',error.message||'Unable to load badges.'));const retry=node('button','Try again');retry.onclick=()=>open(source);host.append(retry);}
 }
 function resultCard(host,data,previous,key,name,id){
  if(!host?.isConnected||tokens.get(host)!==id)return;let panel=host.querySelector(':scope > .reward-result');if(!panel){panel=node('section',undefined,'reward-result');host.append(panel);}panel.replaceChildren();panel.style.setProperty('--reward-accent',styleFor(data,key).color);
  const fresh=previous?data.badges.filter(b=>b.earned&&!previous.badges.some(p=>p.id===b.id&&p.earned)):[];
  const title=fresh.length?`${fresh[0].icon} Badge unlocked · ${fresh[0].name}${fresh.length>1?` +${fresh.length-1}`:''}`:`✦ Level ${data.level} · ${data.earned} badges`;
  panel.classList.toggle('reward-unlocked',fresh.length>0);panel.append(node('strong',title),meter(data.levelXP,data.levelTarget,'Player level progress'));
  const next=data.badges.find(b=>b.id===data.nextBadge);if(next)panel.append(node('small',`Next: ${next.name} · ${next.progress} / ${next.target}`));
  const b=node('button','View badges & styles →');b.type='button';b.onclick=()=>{localName=name;open(key.startsWith('device:')?'device':'account');};panel.append(b);
 }
 result.localResult=async(host,before,profile,name,id)=>{if(!host)return;tokens.set(host,id);try{const c=await catalog();resultCard(host,evaluate(c,stats(profile.entries,name)),evaluate(c,before),'device:'+name,name,id);}catch{}};
 result.prime=(user,api)=>{identity=user;accountAPI=api;accountBaseline=null;if(user&&!user.guest)account().then(data=>{if(identity?.id===user.id){accountBaseline=data;cache.set(user.id,data);}}).catch(()=>{});};
 result.accountResult=async(host,id)=>{if(!host||!identity||identity.guest)return;tokens.set(host,id);const who=identity.id,previous=cache.get(who)||accountBaseline;try{for(let i=0;i<5;i++){const data=await account();if(identity?.id!==who||tokens.get(host)!==id)return;if(i<4&&previous&&data.xp===previous.xp){await new Promise(r=>setTimeout(r,750));continue;}resultCard(host,data,previous,'account:'+who,identity.name,id);cache.set(who,data);break;}}catch{}};
 result.open=open;
 result.dismiss=()=>{if(!dialog?.open)return false;loadGeneration++;dialog.close();return true;};
 result.clear=host=>{if(host){tokens.set(host,null);host.querySelector(':scope > .reward-result')?.remove();}};
 function install(){const toolbar=document.querySelector('.native-game-menu>div')||document.querySelector('.toolbar-actions')||document.querySelector('#home .option-actions,#home .home-actions,main>header');if(!toolbar)return;const b=node('button','✦ Badges','reward-entry');b.id='open-rewards';b.type='button';b.onclick=()=>open(document.getElementById('source')?.value==='global'||onlinePage?'account':'device');toolbar.append(b);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();return result;
});
