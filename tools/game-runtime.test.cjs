const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

function harness() {
  const document = new EventTarget();
  const window = { devicePixelRatio: 3 };
  const frames = new Map(), timers = new Map();
  let now = 0, sequence = 0;
  vm.runInNewContext(readFileSync(require.resolve('../game-runtime.js'), 'utf8'), {
    document, window, performance: { now: () => now },
    requestAnimationFrame(draw) { frames.set(++sequence, draw); return sequence; },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout(draw, delay) { timers.set(++sequence, { draw, at: now + delay }); return sequence; },
    clearTimeout: id => timers.delete(id),
  });
  return {
    runtime: window.GameRuntime, document, frames, timers,
    advance(ms) {
      now += ms;
      for (const [id, timer] of timers) {
        if (timer.at > now) continue;
        timers.delete(id);
        timer.draw();
      }
      const pending = [...frames.values()];
      frames.clear();
      for (const draw of pending) draw(now);
    },
  };
}

test('active play schedules one frame and resets time after sleep', () => {
  const { runtime, document, frames, advance } = harness();
  const deltas = [];
  let active = true;
  const loop = runtime.createFrameLoop((_, dt) => deltas.push(dt), () => active ? 0 : null, .05);
  loop.refresh();
  loop.refresh();
  assert.equal(frames.size, 1);
  advance(16);
  advance(500);
  assert.deepEqual(deltas, [0, .05]);
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(frames.size, 0);
  advance(2000);
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  advance(16);
  assert.equal(deltas.at(-1), 0);
  active = false;
  loop.refresh();
  assert.equal(frames.size, 0);
});

test('preview pacing sleeps between frames and wakes immediately on entering play', () => {
  const { runtime, frames, timers, advance } = harness();
  let interval = 100;
  const draws = [];
  const loop = runtime.createFrameLoop(now => draws.push(now), () => interval);
  loop.refresh();
  advance(16);
  advance(32);
  assert.deepEqual(draws, [16]);
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 1);
  interval = 0;
  loop.refresh();
  assert.equal(timers.size, 0);
  advance(16);
  assert.deepEqual(draws, [16, 64]);
});

test('canvas fitting limits high-DPI pixels and skips redundant buffer resets', () => {
  const { runtime } = harness();
  let width, height, assignments = 0;
  const canvas = {
    get width() { return width; },
    set width(value) { width = value; assignments++; },
    get height() { return height; },
    set height(value) { height = value; assignments++; },
  };
  runtime.fitCanvas(canvas, 1000, 500);
  assert.ok(Math.abs(width / height - 2) < .004);
  assert.ok(width * height <= 1_002_000);
  runtime.fitCanvas(canvas, 1000, 500);
  assert.equal(assignments, 2);
});
