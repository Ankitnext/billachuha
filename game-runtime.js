/* Frame scheduling and Canvas helpers shared by the browser and Android games. */
(() => {
  'use strict';

  // Policy returns 0 for display-rate updates, a delay in ms for previews,
  // or null to sleep until the caller changes state and calls refresh().
  function createFrameLoop(draw, policy, maxDelta = .1) {
    let frame = null;
    let timer = null;
    let last = null;
    let interval = null;

    function resetClock() {
      last = null;
    }

    function refresh() {
      const next = document.hidden ? null : policy();
      if (next !== interval) {
        interval = next;
        if (frame !== null) cancelAnimationFrame(frame);
        if (timer !== null) clearTimeout(timer);
        frame = timer = null;
        resetClock();
      }
      if (interval === null || frame !== null || timer !== null) return;
      const wait = last === null || interval === 0 ? 0 : interval - (performance.now() - last);
      if (wait > 0) {
        timer = setTimeout(() => {
          timer = null;
          frame = requestAnimationFrame(tick);
        }, wait);
      } else {
        frame = requestAnimationFrame(tick);
      }
    }

    function tick(now) {
      frame = null;
      if (!document.hidden && policy() !== null) {
        const dt = last === null ? 0 : Math.min(maxDelta, Math.max(0, (now - last) / 1000));
        last = now;
        draw(now, dt);
      }
      refresh();
    }

    document.addEventListener('visibilitychange', refresh);
    return { refresh, resetClock };
  }

  function setCanvasSize(canvas, width, height) {
    width = Math.max(1, Math.round(width));
    height = Math.max(1, Math.round(height));
    // Assigning an unchanged dimension still clears the buffer and context state.
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }

  function fitCanvas(canvas, width, height) {
    const scale = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1_000_000 / (width * height)));
    setCanvasSize(canvas, width * scale, height * scale);
    return scale;
  }

  function visible(bounds, x, y, width, height) {
    return x + width >= bounds.left && x <= bounds.right &&
      y + height >= bounds.top && y <= bounds.bottom;
  }

  function setText(element, value) {
    const text = String(value);
    if (element.textContent !== text) element.textContent = text;
  }

  window.GameRuntime = Object.freeze({ createFrameLoop, setCanvasSize, fitCanvas, visible, setText });
})();
