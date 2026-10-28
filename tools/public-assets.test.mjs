import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePublicAssets, validateServedAssets } from './check-public-assets.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'billachuha-assets-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'games', 'example'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<script defer src="trap-escape/physics.js"></script><link rel="stylesheet" href="game.css">');
  writeFileSync(join(root, 'games', 'example', 'index.html'), '<script src="../../super-fight/physics.js?v=1"></script><script src="https://external.example/script.js"></script>');
  writeFileSync(join(root, 'game.css'), 'body {}');
  return root;
}

test('missing game directories fail public artifact validation', t => {
  const root = fixture(t);
  assert.throws(() => validatePublicAssets(root), error => {
    assert.match(error.message, /trap-escape\/physics\.js/);
    assert.match(error.message, /super-fight\/physics\.js/);
    return true;
  });
  for (const folder of ['trap-escape', 'super-fight']) {
    mkdirSync(join(root, folder));
    writeFileSync(join(root, folder, 'physics.js'), '// game physics');
  }
  assert.equal(validatePublicAssets(root).length, 5);
});

test('all repository game pages have their script and stylesheet dependencies', () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const assets = validatePublicAssets(root);
  for (const path of ['trap-escape/physics.js', 'trap-escape/menu.js', 'super-fight/physics.js', 'super-fight/menu.js', 'cat-chase.js']) {
    assert.ok(assets.some(asset => asset.path === path), path);
  }
});

test('HTTP validation rejects both missing scripts and HTML fallback responses', async t => {
  const root = fixture(t);
  for (const folder of ['trap-escape', 'super-fight']) {
    mkdirSync(join(root, folder));
    writeFileSync(join(root, folder, 'physics.js'), '// game physics');
  }
  let mode = 'missing';
  const server = createServer((request, response) => {
    const script = request.url.includes('.js');
    response.writeHead(script && mode === 'missing' ? 404 : 200, { 'Content-Type': script && mode === 'healthy' ? 'text/javascript' : request.url.endsWith('.css') ? 'text/css' : 'text/html' });
    response.end(script && mode === 'healthy' ? '// physics' : '<html></html>');
  });
  t.after(() => new Promise(done => server.close(done)));
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  await assert.rejects(validateServedAssets(root, base), /HTTP 404/);
  mode = 'fallback';
  await assert.rejects(validateServedAssets(root, base), /HTTP 200, text\/html/);
  mode = 'healthy';
  assert.equal((await validateServedAssets(root, base)).length, 5);
});
