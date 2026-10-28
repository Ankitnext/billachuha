// Optional browser smoke check: NODE_PATH must provide Playwright.
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { existsSync, mkdirSync, readFileSync, statSync } = require('node:fs');
const { extname, resolve, sep } = require('node:path');
const { chromium } = require('playwright');

const root = resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = resolve(root, '.' + path);
  if (!file.startsWith(root + sep) || !existsSync(file) || !statSync(file).isFile()) { response.writeHead(404); response.end(); return; }
  response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
  response.end(readFileSync(file));
});

async function drawn(page, id) {
  await page.waitForFunction(id => {
    const canvas = document.getElementById(id);
    if (!canvas?.width || !canvas?.height) return false;
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i]) return true;
    return false;
  }, id);
}

(async () => {
  let browser;
  try {
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
    const shots = resolve(__dirname, 'screenshots');
    mkdirSync(shots, { recursive: true });
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
      for (const game of [
        { file: 'cat-chase.html', preview: 'poster', button: 'continue', screen: 'play-screen', canvas: 'stage' },
        { file: 'trap-escape.html', preview: 'poster', button: 'continue', screen: 'play-screen', canvas: 'stage' },
        { file: 'super-fight.html', preview: 'preview', button: 'start', screen: 'battle', canvas: 'arena' }
      ]) {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => { if (response.request().resourceType() === 'script' && response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
        await page.goto(`${base}/${game.file}`, { waitUntil: 'domcontentloaded' });
        await drawn(page, game.preview);
        await page.locator('#' + game.button).click();
        await page.locator('#' + game.screen).waitFor({ state: 'visible' });
        await drawn(page, game.canvas);
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(300);
        await page.keyboard.up('ArrowRight');
        assert.deepEqual(errors, [], `${game.file} at ${viewport.width}px`);
        await page.screenshot({ path: resolve(shots, `startup-${game.file}-${viewport.width}.png`) });
        await page.close();
        console.log(`PASS ${game.file} at ${viewport.width}px: preview, start button and game canvas.`);
      }
      await context.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
