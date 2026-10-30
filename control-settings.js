/* Device-local keyboard bindings and touch layouts, shared by the arcade clients. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ControlSettings = api;
})(typeof window === 'undefined' ? globalThis : window, function() {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const validCode = code => typeof code === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Enter|Tab|Backspace|CapsLock|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Backquote|Numpad[0-9]|Numpad(Add|Subtract|Multiply|Divide|Decimal|Enter))$/.test(code);
  function keyLabel(code) {
    return code === 'Space' ? 'Space' : code.replace(/^Key|^Digit/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  function normalize(value, actions) {
    const bindings = {}, used = new Set();
    for (const action of actions) {
      const codes = value?.version === 1 ? value.bindings?.[action.id] : action.codes;
      if (!Array.isArray(codes) || !codes.length || codes.some(c => !validCode(c) || used.has(c)) || new Set(codes).size !== codes.length) return normalize(null, actions);
      bindings[action.id] = [...codes]; codes.forEach(c => used.add(c));
    }
    return {version: 1, bindings};
  }
  function normalizeHud(value, controls) {
    if (!value || typeof value !== 'object') return null;
    const out = {};
    for (const item of controls) {
      const c = value[item.id];
      if (!c || !['x','y','size','opacity'].every(k => typeof c[k] === 'number' && Number.isFinite(c[k]))) return null;
      out[item.id] = {x:clamp(c.x,0,1),y:clamp(c.y,0,1),size:clamp(c.size,60,140),opacity:clamp(c.opacity,.35,1)};
    }
    return out;
  }
  function box(control, definition, bounds) {
    const base = definition.stick ? 86 : 56;
    const size = Math.min(base * control.size / 100, bounds.width / 4, bounds.height / 2);
    return {left: control.x * Math.max(0,bounds.width-size), top:control.y * Math.max(0,bounds.height-size), size};
  }
  function create(options) {
    const actions = options.actions, controls = options.hud || [];
    let stored; try { stored = JSON.parse(localStorage.getItem(options.key)); } catch (_) {}
    let saved = normalize(stored, actions), layouts = {
      portrait: normalizeHud(stored?.layouts?.portrait, controls), landscape: normalizeHud(stored?.layouts?.landscape, controls)
    };
    let draft, hudDraft, mode, waiting = null, selection, dragging = null, previousFocus;
    const physical = new Set();
    const dialog = document.createElement('dialog'); dialog.className = 'control-settings';
    dialog.setAttribute('aria-label', `${options.title} controls`);
    dialog.innerHTML = '<div class="cs-header"><h2></h2><button type="button" data-close aria-label="Close control settings">Close</button></div><div class="cs-tabs"><button type="button" data-tab="keys">Choose keys</button><button type="button" data-tab="hud">Customize HUD</button></div><p class="cs-note"></p><div class="cs-keys"></div><div class="cs-hud" hidden><div class="cs-tools"><label>Control <select data-select></select></label><label>Size <input data-size type="range" min="60" max="140" step="5"></label><label>Opacity <input data-opacity type="range" min="35" max="100" step="5"></label></div><div class="cs-preview" aria-label="Drag controls to move them"></div></div><p class="cs-status" role="status" aria-live="polite"></p><div class="cs-footer"><button type="button" data-reset>Reset defaults</button><button type="button" data-cancel>Cancel</button><button type="button" data-save>Save</button></div>';
    const find = selector => dialog.querySelector(selector);
    find('h2').textContent = options.title + ' · Controls';
    find('.cs-note').textContent = options.note || 'Settings stay on this browser. Drag touch controls or choose the keys for each action.';
    find('[data-tab="hud"]').hidden = !controls.length;
    document.body.append(dialog);
    const safeArea=document.createElement('div');safeArea.className='cs-safe-area';safeArea.setAttribute('aria-hidden','true');document.body.append(safeArea);
    const orientation = () => innerWidth > innerHeight ? 'landscape' : 'portrait';
    let editingOrientation, resetHud = false, hudDirty = false;
    function actualBounds() {
      return safeArea.getBoundingClientRect();
    }
    const originals = new Map();
    function apply() {
      const layout = layouts[orientation()], bounds = actualBounds();
      for (const item of controls) {
        const node = document.getElementById(item.id); if (!node) continue;
        if (!originals.has(node)) originals.set(node, node.getAttribute('style'));
        if (!layout) { const old = originals.get(node); if (old === null) node.removeAttribute('style'); else node.setAttribute('style', old); continue; }
        const c = layout[item.id], b = box(c,item,bounds);
        for (const [name,value] of Object.entries({position:'fixed',left:`${bounds.left+b.left}px`,top:`${bounds.top+b.top}px`,right:'auto',bottom:'auto',width:`${b.size}px`,height:`${b.size}px`,'min-width':'0','min-height':'0','max-width':'none','max-height':'none',margin:'0',opacity:String(c.opacity),'z-index':'20'})) node.style.setProperty(name,value,'important');
      }
    }
    function defaults() {
      const out = {}, buttons = controls.filter(c=>!c.stick), sticks=controls.filter(c=>c.stick);
      sticks.forEach((item,i)=>out[item.id]={x:sticks.length>1?i:0,y:1,size:100,opacity:.85});
      const rows=Math.ceil(buttons.length/3), bounds=actualBounds();
      const size=Math.min(100,Math.max(60,(bounds.height/(rows+1)-8)/56*100));
      buttons.forEach((item,i)=>out[item.id]={x:.48+(i%3)*.26,y:rows===1 ? .5 : .08+Math.floor(i/3)*.76/Math.max(1,rows-1),size,opacity:.85});
      return out;
    }
    function status(text) { find('.cs-status').textContent = text; }
    function renderKeys(focusId) {
      const container=find('.cs-keys'); container.replaceChildren();
      for (const action of actions) {
        const row=document.createElement('div');row.className='cs-key-row';
        const label=document.createElement('span');label.textContent=action.label;
        const button=document.createElement('button');button.type='button';button.dataset.keyAction=action.id;button.textContent=draft.bindings[action.id].map(keyLabel).join(' / ');
        button.setAttribute('aria-label', `${action.label}: ${button.textContent}. Choose a new key`);
        button.onclick=()=>{waiting=action.id;status(`Press a key for ${action.label}. Escape cancels.`);button.textContent='Press a key…';};
        row.append(label,button);container.append(row);
        if(focusId===action.id)button.focus();
      }
    }
    function choose(id) {
      selection=id;find('[data-select]').value=id;
      find('[data-size]').value=hudDraft[id].size; find('[data-opacity]').value=Math.round(hudDraft[id].opacity*100);
      renderHud();
    }
    function renderHud() {
      if (!hudDraft || !dialog.open || mode !== 'hud') return;
      const area=find('.cs-preview'), bounds=actualBounds();
      const available=area.parentElement.clientWidth, scale=Math.min(available/bounds.width,innerHeight*.38/bounds.height);
      area.style.width=`${bounds.width*scale}px`;area.style.height=`${bounds.height*scale}px`;
      area.dataset.scale=scale;
      for (const item of controls) {
        const node=area.querySelector(`[data-hud="${item.id}"]`), c=hudDraft[item.id], b=box(c,item,bounds);
        Object.assign(node.style,{left:`${b.left*scale}px`,top:`${b.top*scale}px`,width:`${b.size*scale}px`,height:`${b.size*scale}px`,opacity:c.opacity});
        node.classList.toggle('selected',selection===item.id);
      }
    }
    for (const item of controls) {
      const option=document.createElement('option');option.value=item.id;option.textContent=item.label;find('[data-select]').append(option);
      const node=document.createElement('button');node.type='button';node.dataset.hud=item.id;node.textContent=item.label;
      node.setAttribute('aria-label', `${item.label}: drag or use arrow keys to move`);
      node.onpointerdown=event=>{if(event.button!==0)return;event.preventDefault();choose(item.id);node.focus();const rect=node.getBoundingClientRect();dragging={id:item.id,pointer:event.pointerId,dx:event.clientX-rect.left,dy:event.clientY-rect.top};node.setPointerCapture(event.pointerId);};
      node.onpointermove=event=>{if(dragging?.pointer!==event.pointerId||dragging.id!==item.id)return;const area=find('.cs-preview'),rect=area.getBoundingClientRect(),bounds=actualBounds(),scale=Number(area.dataset.scale),b=box(hudDraft[item.id],item,bounds);hudDraft[item.id].x=clamp((event.clientX-rect.left-dragging.dx)/scale/Math.max(1,bounds.width-b.size),0,1);hudDraft[item.id].y=clamp((event.clientY-rect.top-dragging.dy)/scale/Math.max(1,bounds.height-b.size),0,1);resetHud=false;hudDirty=true;renderHud();};
      for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,()=>{dragging=null;});
      node.onclick=()=>choose(item.id);
      node.onkeydown=event=>{if(!event.code.startsWith('Arrow'))return;event.preventDefault();choose(item.id);resetHud=false;hudDirty=true;const c=hudDraft[item.id],step=event.shiftKey ? .05 : .01;if(event.code==='ArrowLeft')c.x=clamp(c.x-step,0,1);if(event.code==='ArrowRight')c.x=clamp(c.x+step,0,1);if(event.code==='ArrowUp')c.y=clamp(c.y-step,0,1);if(event.code==='ArrowDown')c.y=clamp(c.y+step,0,1);renderHud();};
      find('.cs-preview').append(node);
    }
    function setMode(next) {
      mode=next;waiting=null;find('.cs-keys').hidden=mode!=='keys';find('.cs-hud').hidden=mode!=='hud';
      for(const tab of dialog.querySelectorAll('[data-tab]'))tab.setAttribute('aria-pressed',String(tab.dataset.tab===mode));
      status(mode==='keys'?'Click an action, then press its new key. Each key can control one action. Escape is reserved for closing menus.':'Drag controls in the preview. This layout is saved for the current screen orientation.');
      renderKeys();renderHud();
    }
    function open(tab='keys') {
      if(dialog.open)return;
      previousFocus=document.activeElement;physical.clear();resetHud=false;hudDirty=false;options.onOpen?.();
      draft=normalize(saved,actions);editingOrientation=orientation();hudDraft=structuredClone(layouts[editingOrientation]||defaults());
      dialog.showModal();setMode(tab);if(controls.length)choose(controls[0].id);
    }
    function close() { dialog.close(); }
    dialog.addEventListener('close',()=>{waiting=null;dragging=null;physical.clear();options.onClose?.();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});});
    dialog.addEventListener('cancel',event=>{if(waiting){event.preventDefault();waiting=null;renderKeys();status('Key change cancelled.');}});
    dialog.addEventListener('keydown',event=>{
      event.stopPropagation();
      if(!waiting)return;
      event.preventDefault();
      if(event.code==='Escape'){const id=waiting;waiting=null;renderKeys(id);status('Key change cancelled.');return;}
      if(event.ctrlKey||event.metaKey||event.altKey||!validCode(event.code)){status('Choose a letter, number, arrow, Shift or punctuation key without Ctrl, Alt or Windows.');return;}
      const conflict=actions.find(a=>a.id!==waiting&&draft.bindings[a.id].includes(event.code));
      if(conflict){status(`${keyLabel(event.code)} is already used for ${conflict.label}. Choose another key or change that action first.`);return;}
      const id=waiting;draft.bindings[id]=[event.code];waiting=null;renderKeys(id);status('Key updated. Save to keep your changes.');
    });
    dialog.addEventListener('keyup',event=>event.stopPropagation());
    for(const tab of dialog.querySelectorAll('[data-tab]'))tab.onclick=()=>setMode(tab.dataset.tab);
    for(const name of ['close','cancel'])find(`[data-${name}]`).onclick=close;
    find('[data-select]').onchange=()=>choose(find('[data-select]').value);
    find('[data-size]').oninput=()=>{hudDraft[selection].size=Number(find('[data-size]').value);resetHud=false;hudDirty=true;renderHud();};
    find('[data-opacity]').oninput=()=>{hudDraft[selection].opacity=Number(find('[data-opacity]').value)/100;resetHud=false;hudDirty=true;renderHud();};
    find('[data-reset]').onclick=()=>{if(mode==='keys'){draft=normalize(null,actions);renderKeys();}else{resetHud=true;hudDirty=true;hudDraft=defaults();choose(selection);}status('Defaults restored. Save to keep them.');};
    find('[data-save]').onclick=()=>{
      const nextLayouts={...layouts};
      if(hudDirty) {
        if(!resetHud) {
          const bounds=actualBounds(),boxes=controls.map(item=>box(hudDraft[item.id],item,bounds));
          if(boxes.some((a,i)=>boxes.slice(i+1).some(b=>a.left<b.left+b.size+3&&a.left+a.size+3>b.left&&a.top<b.top+b.size+3&&a.top+a.size+3>b.top))){status('Some controls overlap. Move them apart or reduce their size before saving.');return;}
        }
        nextLayouts[editingOrientation]=resetHud?null:normalizeHud(hudDraft,controls);
      }
      try{localStorage.setItem(options.key,JSON.stringify({...draft,layouts:nextLayouts}));}catch(_){status('Browser storage is unavailable. Settings could not be saved.');return;}
      saved=normalize(draft,actions);layouts=nextLayouts;resetHud=false;apply();close();
    };
    window.addEventListener('resize',()=>{physical.clear();options.onRelease?.();apply();if(dialog.open&&editingOrientation!==orientation()){editingOrientation=orientation();hudDraft=structuredClone(layouts[editingOrientation]||defaults());resetHud=false;hudDirty=false;status('Screen rotated. Editing the layout for this orientation.');}renderHud();});
    window.addEventListener('blur',()=>physical.clear());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)physical.clear();});
    apply();
    return {
      open, get editing(){return dialog.open;},
      resolve(code){return actions.find(a=>saved.bindings[a.id].includes(code))?.id;},
      updateKeys(event, keys, down) {if(down)physical.add(event.code);else physical.delete(event.code);keys.clear();for(const code of physical){const action=actions.find(a=>saved.bindings[a.id].includes(code));if(action)keys.add(action.id);}},
      release(){physical.clear();}, refresh:apply
    };
  }
  return {create,normalize,normalizeHud,box,keyLabel,validCode};
});
