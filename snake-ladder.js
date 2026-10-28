/* Moving Stairs: menus, local turns, accessible controls and optional score sync. */
(() => {
  'use strict';
  const Core = window.StairsGame, Art = window.StairsArt;
  const $ = id => document.getElementById(id);
  const roles = {rat: '🐭', cat: '🐱', dog: '🐶'};
  const roleNames = {rat: 'Rat', cat: 'Cat', dog: 'Dog'};
  const powerNames = {shield: 'Shield', double: 'Extra jump', speed: 'Speed'};
  const clock = seconds => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.floor(Math.max(0, seconds)) % 60).padStart(2, '0')}`;
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const keys = new Set(), held = new Map();
  let game = null, rolling = null, joystick = 0, jumpPending = false, abilityPending = false;
  let last = 0, lastHud = 0, lastBoard = 0, sound = false, audio = null;
  let savedGame = null, scoreRequest = false, screen = 'setup';
  const bestKey = 'moving-stairs.snake-ladder.best.v1';
  let best = null;
  try {
    const value = JSON.parse(localStorage.getItem(bestKey));
    if (value && Number.isInteger(value.score) && value.score >= 0 && value.score <= 1000000) best = value;
  } catch { /* Storage is optional, including private browsing. */ }

  function bestCopy() {
    $('best-copy').textContent = best
      ? `Solo best on this device: ${best.score.toLocaleString()} points. No account needed to play.`
      : 'No account needed to play. Your solo best stays on this device.';
  }
  function choices() {
    const old = [...$('player-choices').children].map(row => ({name: row.querySelector('input').value, role: row.querySelector('select').value}));
    const local = document.querySelector('[name="mode"]:checked').value === 'local';
    $('count-label').hidden = !local;
    const count = local ? Number($('player-count').value) : 1;
    $('player-choices').replaceChildren();
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div'); row.className = 'player-choice';
      const nameLabel = document.createElement('label'); nameLabel.textContent = `Player ${i + 1}`;
      const input = document.createElement('input'); input.name = `player-${i}`; input.maxLength = 24;
      input.value = old[i]?.name || `Player ${i + 1}`; input.autocomplete = 'off'; nameLabel.append(input);
      const roleLabel = document.createElement('label'); roleLabel.textContent = 'Character';
      const select = document.createElement('select'); select.name = `role-${i}`;
      for (const role of Core.ROLES) {
        const option = document.createElement('option'); option.value = role;
        option.textContent = `${roles[role]} ${roleNames[role]} · ${{rat: 'double jump', cat: 'speed boost', dog: 'shoot & reroll'}[role]}`;
        select.append(option);
      }
      select.value = old[i]?.role || Core.ROLES[i % 3]; roleLabel.append(select);
      row.append(nameLabel, roleLabel); $('player-choices').append(row);
    }
  }
  function beep(frequency = 440, duration = .07) {
    if (!sound) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      audio.resume().catch(() => {});
      const oscillator = audio.createOscillator(), volume = audio.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(.035, audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(volume); volume.connect(audio.destination);
      oscillator.start(); oscillator.stop(audio.currentTime + duration);
    } catch { /* Sound is optional. */ }
  }
  function clearInput() {
    keys.clear(); held.clear(); joystick = 0; jumpPending = false; abilityPending = false;
    for (const button of document.querySelectorAll('[data-action]')) button.classList.remove('held');
    if (game?.stage) game.stage.jumpHeld = false;
  }
  const modalOpen = () => !!document.querySelector('dialog[open]');
  const active = () => game && game.phase !== 'finished';
  function openDialog(id) {
    if ($(id).open) return;
    clearInput(); $(id).showModal();
    if (id === 'map-dialog') drawBoard($('map-canvas'));
  }
  function pause() {
    if (active() && !modalOpen()) openDialog('pause-dialog');
  }
  function handoff() {
    if (game?.mode !== 'local' || game.phase !== 'board') return;
    $('handoff-title').textContent = `${roles[game.player.role]} ${game.player.name}, you’re up.`;
    $('handoff-detail').textContent = `${roleNames[game.player.role]} · Cell ${game.player.cell}. Roll the dice, then play your own platform challenge.`;
    openDialog('handoff-dialog');
  }
  function setScreen(next) {
    screen = next;
    for (const name of ['setup', 'board', 'action', 'result']) $(name).hidden = name !== next;
    $('pause').hidden = !active();
    clearInput(); requestAnimationFrame(fit);
  }
  function setDice(value) {
    const indices = {0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]}[value];
    [...$('dice').firstElementChild.children].forEach((pip, i) => pip.classList.toggle('on', indices.includes(i)));
    $('dice').setAttribute('aria-label', value ? `Die shows ${value}` : 'Die ready to roll');
  }
  function renderBoard() {
    const p = game.player;
    $('race-label').textContent = game.mode === 'solo' ? 'SOLO ADVENTURE · REACH 100' : `${game.players.length} PLAYERS · PASS & PLAY`;
    $('turn-title').textContent = `${p.name}’s turn · Cell ${p.cell}`;
    $('active-name').textContent = p.name; $('active-role').textContent = roles[p.role];
    $('active-cell').textContent = `${roleNames[p.role]} · Cell ${p.cell} / 100`;
    $('turn-message').textContent = game.message;
    $('roll').hidden = game.phase !== 'board'; $('roll').disabled = !!rolling;
    $('play-move').hidden = game.phase !== 'rolled'; $('play-move').disabled = !!rolling;
    $('reroll').hidden = game.phase !== 'rolled' || p.role !== 'dog' || p.rerolled;
    $('reroll').disabled = !!rolling;
    $('power-badges').replaceChildren();
    const powers = game.turn?.powers || p.powers;
    for (const key of Object.keys(powers)) if (powers[key] > 0) {
      const badge = document.createElement('span'); badge.textContent = `${powerNames[key]} · ${powers[key]} turn${powers[key] === 1 ? '' : 's'}`;
      $('power-badges').append(badge);
    }
    $('standings').replaceChildren();
    game.players.forEach((player, i) => {
      const row = document.createElement('div'); row.className = `standing${i === game.current ? ' active' : ''}`;
      const icon = document.createElement('span'); icon.className = 'standing-role'; icon.textContent = roles[player.role];
      const name = document.createElement('strong'); name.textContent = player.name;
      const cell = document.createElement('span'); cell.textContent = `${player.cell} / 100`;
      const coins = document.createElement('small'); coins.textContent = player.skipNext ? 'Skip next turn' : `● ${player.coins}`;
      row.append(icon, name, cell, coins); $('standings').append(row);
    });
    setDice(game.dice); drawBoard($('board-canvas'));
  }
  function stageCopy() {
    const s = game.stage, a = game.action;
    $('stage-kind').textContent = {move: 'MOVING STAIRS', ladder: 'LADDER CLIMB', snake: 'SNAKE FALL', boss: 'CELL GUARDIAN'}[s.kind];
    $('stage-goal').textContent = {move: `${s.steps} stairs · Cell ${a.from} → ${a.to}`, ladder: `Climb from ${a.from} to ${a.to}`, snake: `Catch coins · Save cells above ${a.to}`, boss: 'Defeat the guardian · Win 4 cells'}[s.kind];
    $('jump-button').hidden = s.kind === 'snake';
    $('ability-button').hidden = s.kind === 'snake' || s.role === 'rat';
    $('ability-note').textContent = s.kind === 'snake' ? 'Steer left & right. Catch coins. Avoid thorns.' : {rat: 'Two jumps. Wall slide. +1 on every roll.', cat: 'E: speed boost. First snake is harmless.', dog: 'E / F: fire. One reroll per game.'}[s.role];
    $('stage-tip').textContent = s.kind === 'ladder' ? 'Jump from stair to stair. A big fall ends the climb.' : s.kind === 'snake' ? 'Every coin saves one cell. Aim for gaps between the thorns.' : s.kind === 'boss' ? 'Stomp from above to hurt the guardian. Dog can also shoot.' : 'A / D or ← / → move · W / ↑ / Space jump · E ability · P pause';
  }
  function recordBest() {
    if (game.mode !== 'solo' || game.winner === null || savedGame === game) return;
    savedGame = game;
    const score = game.score();
    if (!best || score > best.score) {
      best = {score, time: Math.round(game.elapsed), role: game.player.role};
      try { localStorage.setItem(bestKey, JSON.stringify(best)); } catch { /* Keep playing without storage. */ }
      bestCopy();
    }
  }
  function renderResult() {
    const finished = game.phase === 'finished';
    if (finished) recordBest();
    $('result-tag').textContent = finished ? (game.winner === null ? 'ADVENTURE COMPLETE' : 'ALL THE WAY TO 100') : `${{move: 'MOVE', ladder: 'LADDER', snake: 'SNAKE', boss: 'GUARDIAN'}[game.result.kind]} · ${game.result.success ? 'CLEARED' : 'TRY AGAIN NEXT TURN'}`;
    $('result-title').textContent = game.result.title;
    $('result-detail').textContent = game.result.detail;
    $('result-stats').replaceChildren();
    const stats = [`● ${game.player.coins} coins`, `${game.score().toLocaleString()} points`, clock(game.elapsed)];
    if (finished && game.mode === 'solo' && best) stats.push(`Best ${best.score.toLocaleString()}`);
    for (const text of stats) { const item = document.createElement('span'); item.textContent = text; $('result-stats').append(item); }
    $('continue').hidden = finished;
    $('continue').textContent = game.queued ? {snake: 'Play the snake fall →', ladder: 'Climb the ladder →', boss: 'Meet the guardian →'}[game.queued.kind] : game.mode === 'local' ? 'Next player →' : 'Back to the board →';
    $('play-again').hidden = !finished;
    $('score-actions').hidden = !finished || game.mode !== 'solo' || game.winner === null;
    $('save-score').disabled = false; $('score-status').textContent = ''; $('score-signin').hidden = true;
    drawBoard($('result-board'));
  }
  function renderState() {
    if (!game) { setScreen('setup'); return; }
    if (['board', 'rolled'].includes(game.phase)) { setScreen('board'); renderBoard(); }
    else if (game.phase === 'action') { setScreen('action'); stageCopy(); }
    else { setScreen('result'); renderResult(); beep(game.winner !== null ? 700 : 280, .18); }
    updateHud();
  }
  function updateHud() {
    if (!game) return;
    $('clock').textContent = `◷ ${clock(game.mode === 'solo' ? game.limit - game.elapsed : game.elapsed)}`;
    $('race-coins').textContent = `● ${game.player.coins}`; $('race-score').textContent = `${game.score().toLocaleString()} pts`;
    if (!game.stage) return;
    const s = game.stage;
    $('stage-health').textContent = '♥'.repeat(s.player.hp) + '♡'.repeat(3 - s.player.hp) + (s.shield ? ' ◈' : '');
    $('stage-health').setAttribute('aria-label', `${s.player.hp} of 3 hearts${s.shield ? ', shield ready' : ''}`);
    $('stage-coins').textContent = `● ${s.coins}`; $('stage-clock').textContent = `◷ ${clock(s.timeLimit - s.elapsed)}`;
    $('jump-button').textContent = `JUMP${s.maxJumps > 1 ? ` · ${s.player.jumps}` : ''}`;
    $('ability-button').textContent = s.role === 'dog' ? 'FIRE · E' : s.elapsed < s.boostUntil ? 'BOOSTING' : s.elapsed < s.nextPower ? `BOOST · ${Math.ceil(s.nextPower - s.elapsed)}s` : 'BOOST · E';
  }
  function startRoll(reroll = false) {
    if (!game || rolling || modalOpen() || (reroll ? game.phase !== 'rolled' || game.player.role !== 'dog' || game.player.rerolled : game.phase !== 'board')) return;
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? .15 : .85;
    rolling = {elapsed: 0, duration, value: 1 + Math.floor(game.random() * 6), reroll, pip: -1};
    $('dice').classList.add('is-rolling'); renderBoard(); beep(360);
  }
  function playMove() {
    if (game?.phase !== 'rolled' || rolling || modalOpen()) return;
    game.startStage(); renderState(); $('action-canvas').focus({preventScroll: true});
  }
  function nextTurn() {
    if (game?.phase !== 'result' || modalOpen()) return;
    game.next(); renderState(); handoff();
  }
  function setup() {
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    rolling = null; game = null; $('dice').classList.remove('is-rolling'); renderState(); bestCopy();
    $('start-game').focus({preventScroll: true});
  }
  function fit() {
    clearInput();
    if (screen === 'board') {
      const box = $('board-wrap').getBoundingClientRect(), size = Math.max(1, Math.min(box.width, box.height));
      $('board-canvas').style.width = `${size}px`; $('board-canvas').style.height = `${size}px`;
    }
    if (screen !== 'action' || !game?.stage) return;
    const s = game.stage, box = $('action-viewport').getBoundingClientRect();
    const canvas = $('action-canvas');
    // Fit a following camera instead of shrinking the whole level into the viewport.
    canvas.width = Math.min(s.width, Math.max(1, Math.round(box.width / .9)));
    canvas.height = Math.min(s.height, Math.max(1, Math.round(box.height / .9)));
    const scale = Math.min(box.width / canvas.width, box.height / canvas.height);
    $('action-screen').style.width = `${Math.floor(canvas.width * scale)}px`;
    $('action-screen').style.height = `${Math.floor(canvas.height * scale)}px`;
  }
  function drawBoard(canvas, now = performance.now() / 1000) {
    const preview = {players: [{name: 'Rat', role: 'rat', cell: 4}, {name: 'Cat', role: 'cat', cell: 31}, {name: 'Dog', role: 'dog', cell: 67}], current: 0};
    Art.board(canvas.getContext('2d'), canvas.width, game || preview, now);
  }
  function drawStage(now) {
    const s = game.stage, canvas = $('action-canvas');
    const cam = {width: canvas.width, height: canvas.height,
      x: clamp(s.player.x + s.player.w / 2 - canvas.width * (s.player.face > 0 ? .36 : .64), 0, Math.max(0, s.width - canvas.width)),
      y: clamp(s.player.y - canvas.height * (s.kind === 'ladder' ? .63 : .52), 0, Math.max(0, s.height - canvas.height))};
    Art.stage(canvas.getContext('2d'), canvas, s, cam, now);
  }
  function frame(now) {
    const dt = Math.min(.1, Math.max(0, (now - (last || now)) / 1000)); last = now;
    if (active() && !document.hidden && !modalOpen()) {
      const phase = game.phase; game.tick(dt);
      if (game.phase === 'finished' && phase !== 'finished') { rolling = null; $('dice').classList.remove('is-rolling'); renderState(); }
      else if (rolling) {
        rolling.elapsed += dt;
        const pip = Math.floor(rolling.elapsed * 14) % 6 + 1;
        if (pip !== rolling.pip) { setDice(pip); rolling.pip = pip; }
        if (rolling.elapsed >= rolling.duration) {
          const roll = rolling; rolling = null; $('dice').classList.remove('is-rolling');
          game.roll(roll.value, roll.reroll); renderBoard(); beep(530);
        }
      } else if (game.phase === 'action') {
        const s = game.stage, coins = s.coins, kills = s.kills;
        const keyboardX = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0);
        s.update({x: Math.abs(joystick) > .12 ? joystick : keyboardX,
          jump: jumpPending || held.has('jump') || keys.has('w') || keys.has('arrowup') || keys.has(' '),
          ability: abilityPending || held.has('ability') || keys.has('e'), fire: keys.has('f')}, dt);
        jumpPending = false; abilityPending = false;
        if (s.coins > coins) beep(880, .035); if (s.kills > kills) beep(600, .1);
        if (s.done) { game.complete(s.outcome); renderState(); }
      }
    }
    if (screen === 'action' && game?.stage) drawStage(now / 1000);
    if (now - lastBoard > 50) {
      lastBoard = now;
      const canvas = screen === 'setup' ? $('preview-board') : screen === 'board' ? $('board-canvas') : screen === 'result' ? $('result-board') : null;
      if (canvas) drawBoard(canvas, now / 1000);
    }
    if (now - lastHud > 100) { lastHud = now; updateHud(); }
    requestAnimationFrame(frame);
  }

  function backendOrigin() {
    try {
      const url = new URL(window.BILLACHUHA_CONFIG?.backendUrl);
      const local = ['127.0.0.1', 'localhost', '10.0.2.2', '[::1]'].includes(url.hostname);
      if (url.username || url.password || url.search || url.hash || url.pathname !== '/' || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) return null;
      return url.origin;
    } catch { return null; }
  }
  async function api(path, body) {
    const origin = backendOrigin();
    if (!origin) throw Error('Online scores are unavailable. You can keep playing offline.');
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(origin + path, {method: body ? 'POST' : 'GET', credentials: 'include', signal: controller.signal,
        headers: {'X-Chase-Web': '1', ...(body ? {'Content-Type': 'application/json'} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
      const data = await response.json();
      if (!response.ok) { const error = Error(data.error?.message || 'Online scores are unavailable right now.'); error.status = response.status; throw error; }
      return data;
    } finally { clearTimeout(timer); }
  }
  async function rankings() {
    openDialog('leaderboard-dialog'); $('leaderboard-list').replaceChildren(); $('leaderboard-status').textContent = 'Loading solo scores…';
    try {
      const data = await api('/api/v1/leaderboard/moving-stairs?limit=20');
      if (!Array.isArray(data.entries)) throw Error('Unable to read scores. Try again later.');
      $('leaderboard-status').textContent = data.entries.length ? 'Best solo scores' : 'No solo scores yet. Your adventure could be the first.';
      for (const entry of data.entries.slice(0, 20)) {
        const row = document.createElement('li'), score = document.createElement('span');
        row.append(document.createTextNode(String(entry.name || 'Player').slice(0, 48)));
        score.textContent = Number(entry.score).toLocaleString(); row.append(score); $('leaderboard-list').append(row);
      }
    } catch { $('leaderboard-status').textContent = 'Scores are unavailable right now. Your adventure and local best still work offline.'; }
  }
  async function saveScore() {
    if (scoreRequest || game?.phase !== 'finished' || game.mode !== 'solo' || game.winner === null) return;
    const run = game; scoreRequest = true; $('save-score').disabled = true; $('score-signin').hidden = true;
    $('score-status').textContent = 'Saving your completed adventure…';
    try {
      await api('/auth/web/session');
      const data = await api('/api/v1/scores', {game: 'moving-stairs', score: run.score()});
      if (game === run) $('score-status').textContent = `Saved. Your online best is ${Number(data.bestScore).toLocaleString()} points.`;
    } catch (error) {
      if (game !== run) return;
      if ([401, 403].includes(error.status) && backendOrigin()) {
        $('score-status').textContent = 'Sign in with your Billa Chuha account, then return here and save. Your finished run will wait in this tab.';
        $('score-signin').href = backendOrigin() + '/multiplayer'; $('score-signin').hidden = false;
      } else $('score-status').textContent = 'Couldn’t save online. Your local best is kept on this device. Try again when connected.';
    } finally { scoreRequest = false; if (game === run) $('save-score').disabled = false; }
  }

  for (let i = 0; i < 9; i++) $('dice').firstElementChild.append(document.createElement('i'));
  document.querySelectorAll('[name="mode"]').forEach(input => input.addEventListener('change', choices));
  $('player-count').addEventListener('change', choices);
  $('setup-form').addEventListener('submit', event => {
    event.preventDefault();
    const players = [...$('player-choices').children].map(row => ({name: row.querySelector('input').value, role: row.querySelector('select').value}));
    const seed = window.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    game = new Core.Race({mode: document.querySelector('[name="mode"]:checked').value, players, seed});
    rolling = null; renderState(); handoff(); beep(500);
  });
  $('roll').onclick = () => startRoll(); $('reroll').onclick = () => startRoll(true);
  $('play-move').onclick = playMove; $('continue').onclick = nextTurn;
  $('new-game').onclick = () => openDialog('pause-dialog'); $('play-again').onclick = setup;
  $('pause').onclick = pause; $('resume').onclick = () => $('pause-dialog').close(); $('quit').onclick = setup;
  $('ready-player').onclick = () => $('handoff-dialog').close();
  $('help').onclick = () => openDialog('help-dialog'); $('close-help').onclick = () => $('help-dialog').close();
  $('map-button').onclick = () => openDialog('map-dialog'); $('close-map').onclick = () => $('map-dialog').close();
  $('rankings').onclick = rankings; $('close-leaderboard').onclick = () => $('leaderboard-dialog').close();
  $('save-score').onclick = saveScore;
  $('sound').onclick = () => { sound = !sound; $('sound').textContent = sound ? 'Sound on' : 'Sound off'; $('sound').setAttribute('aria-pressed', String(sound)); beep(); };
  $('fullscreen').hidden = !document.documentElement.requestFullscreen;
  $('fullscreen').onclick = () => { const operation = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); operation?.catch(() => {}); };

  window.ArcadeStick($('joystick-container'), $('joystick-thumb'), x => { joystick = game?.phase === 'action' && !modalOpen() ? x : 0; });
  for (const button of document.querySelectorAll('[data-action]')) {
    button.addEventListener('pointerdown', event => {
      if (game?.phase !== 'action' || modalOpen() || (event.pointerType === 'mouse' && event.button !== 0)) return;
      event.preventDefault(); if (held.has(button.dataset.action)) return;
      button.setPointerCapture(event.pointerId); held.set(button.dataset.action, event.pointerId); button.classList.add('held');
      if (button.dataset.action === 'jump') jumpPending = true;
      if (button.dataset.action === 'ability') abilityPending = true;
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => {
      if (held.get(button.dataset.action) !== event.pointerId) return;
      held.delete(button.dataset.action); button.classList.remove('held');
      if (type !== 'pointerup' && button.dataset.action === 'jump') jumpPending = false;
      if (type !== 'pointerup' && button.dataset.action === 'ability') abilityPending = false;
    });
    // Keyboard activation of a focused touch button also works.
    button.addEventListener('click', event => {
      if (event.detail !== 0 || game?.phase !== 'action' || modalOpen()) return;
      if (button.dataset.action === 'jump') jumpPending = true;
      if (button.dataset.action === 'ability') abilityPending = true;
    });
  }
  document.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey || event.altKey || modalOpen() || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if (['BUTTON', 'A'].includes(event.target.tagName) && ['enter', ' '].includes(key)) return;
    if (key === 'p' || key === 'escape') { if (active()) { event.preventDefault(); pause(); } return; }
    if (game?.phase === 'board' && ['r', 'enter'].includes(key)) { event.preventDefault(); if (!event.repeat) startRoll(); return; }
    if (game?.phase === 'rolled' && key === 'enter') { event.preventDefault(); if (!event.repeat) playMove(); return; }
    if (game?.phase === 'result' && key === 'enter') { event.preventDefault(); if (!event.repeat) nextTurn(); return; }
    if (game?.phase !== 'action' || !['a', 'd', 'arrowleft', 'arrowright', 'w', 'arrowup', ' ', 'e', 'f'].includes(key)) return;
    event.preventDefault(); keys.add(key);
    if (!event.repeat && ['w', 'arrowup', ' '].includes(key)) jumpPending = true;
    if (!event.repeat && ['e', 'f'].includes(key)) abilityPending = true;
  });
  document.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
  for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('close', clearInput);
  window.addEventListener('blur', () => { clearInput(); pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); pause(); } });
  window.addEventListener('resize', fit);
  new ResizeObserver(() => requestAnimationFrame(fit)).observe($('action-viewport'));
  new ResizeObserver(() => { if (screen === 'board') fit(); }).observe($('board-wrap'));
  choices(); bestCopy(); fit(); requestAnimationFrame(frame);
})();
