/* Enhance the static catalog; every game/detail link works without JavaScript. */
(() => {
  'use strict';
  const recentKey='billachuha.recent-games.v1';
  function rawRecent(){try{const data=JSON.parse(localStorage.getItem(recentKey));return Array.isArray(data)?[...new Set(data.filter(id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)))].slice(0,6):[];}catch(_){return [];}}
  document.addEventListener('click',event=>{const link=event.target.closest('a[data-play-game]'),id=link?.dataset.playGame;if(!id||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))return;try{localStorage.setItem(recentKey,JSON.stringify([id,...rawRecent().filter(previous=>previous!==id)].slice(0,6)));}catch(_){}});
  const grid=document.getElementById('gameGrid');if(!grid)return;
  const cards=[...grid.querySelectorAll('[data-game-id]')],search=document.getElementById('searchBar'),filters=[...document.querySelectorAll('[data-category]')];
  const count=document.getElementById('catalog-count'),empty=document.getElementById('search-empty'),more=document.getElementById('load-more'),clear=document.getElementById('clear-filters');
  const batch=24;let limit=batch,category='all';
  const categories=new Set(filters.map(button=>button.dataset.category));
  function readLocation(){const query=new URLSearchParams(location.search);search.value=(query.get('q')||'').slice(0,100);category=categories.has(query.get('category'))?query.get('category'):'all';limit=batch;}
  function updateLocation(){const url=new URL(location.href);for(const name of ['q','category'])url.searchParams.delete(name);if(search.value.trim())url.searchParams.set('q',search.value.trim());if(category!=='all')url.searchParams.set('category',category);history.replaceState(null,'',url);}
  function render(updateURL=true){
    const words=search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const matches=cards.filter(card=>(category==='all'||card.dataset.tags.split('|').includes(category))&&words.every(word=>card.dataset.search.includes(word)));
    const visible=new Set(matches.slice(0,limit));for(const card of cards)card.hidden=!visible.has(card);
    for(const button of filters)button.setAttribute('aria-pressed',String(button.dataset.category===category));
    count.textContent=`Showing ${Math.min(limit,matches.length)} of ${matches.length} ${category==='demos'?'demos':'games & demos'}`;
    empty.hidden=matches.length>0;more.hidden=matches.length<=limit;more.textContent=`Show ${Math.min(batch,Math.max(0,matches.length-limit))} more`;clear.hidden=category==='all'&&!words.length;
    if(updateURL)updateLocation();
  }
  search.addEventListener('input',()=>{limit=batch;render();});
  for(const button of filters)button.addEventListener('click',()=>{category=button.dataset.category;limit=batch;render();});
  clear.addEventListener('click',()=>{category='all';search.value='';limit=batch;render();search.focus();});more.addEventListener('click',()=>{limit+=batch;render(false);});
  window.addEventListener('popstate',()=>{readLocation();render(false);});readLocation();render(false);

  const byId=new Map(cards.map(card=>[card.dataset.gameId,card]));
  function readRecent(){return rawRecent().filter(id=>byId.has(id));}
  function renderRecent(){const section=document.getElementById('recently-played'),list=document.getElementById('recent-games');list.replaceChildren();const recent=readRecent();section.hidden=!recent.length;for(const id of recent){const card=byId.get(id),link=document.createElement('a'),img=document.createElement('img'),name=document.createElement('span');link.href=card.querySelector('[data-play-game]').href;link.dataset.playGame=id;img.src=card.querySelector('img').src;img.alt='';img.loading='lazy';name.textContent=card.querySelector('h3').textContent;link.append(img,name);list.append(link);}}
  window.addEventListener('pageshow',renderRecent);window.addEventListener('storage',event=>{if(event.key===recentKey)renderRecent();});renderRecent();
})();
