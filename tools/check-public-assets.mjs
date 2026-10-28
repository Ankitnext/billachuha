import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localOrigin = 'https://public-assets.invalid/';
const attribute = (tag, name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];

// Check the actual HTML dependencies, rather than a second hard-coded list of
// game scripts. Run against dist inside Docker to catch excluded parent folders.
export function publicAssets(root) {
  const pages = [];
  function htmlFiles(folder, prefix = '') {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isFile() && entry.name.endsWith('.html')) pages.push(relative);
      if (entry.isDirectory() && (prefix || entry.name === 'games')) htmlFiles(join(folder, entry.name), relative + '/');
    }
  }
  htmlFiles(root);
  if (!pages.length) throw Error('No public HTML pages found.');
  const assets = new Map(pages.map(path => [path, { path, kind: 'html', source: path }]));
  for (const page of pages) {
    const html = readFileSync(join(root, page), 'utf8');
    for (const match of html.matchAll(/<(script|link)\b[^>]*>/gi)) {
      const tag = match[0], script = match[1].toLowerCase() === 'script';
      if (!script && !attribute(tag, 'rel')?.toLowerCase().split(/\s+/).includes('stylesheet')) continue;
      const reference = attribute(tag, script ? 'src' : 'href');
      if (!reference) continue;
      const url = new URL(reference, new URL(page, localOrigin));
      if (url.origin !== new URL(localOrigin).origin) continue;
      const path = decodeURIComponent(url.pathname).slice(1);
      assets.set(path, { path, kind: script ? 'javascript' : 'css', source: page });
    }
  }
  return [...assets.values()];
}

export function validatePublicAssets(root) {
  const assets = publicAssets(root);
  const missing = assets.filter(asset => {
    const file = join(root, asset.path);
    return !existsSync(file) || !statSync(file).isFile();
  });
  if (missing.length) throw Error('Missing public assets:\n' + missing.map(asset => `  ${asset.path} (referenced by ${asset.source})`).join('\n'));
  return assets;
}

export async function validateServedAssets(root, baseURL) {
  const assets = validatePublicAssets(root);
  const base = new URL(baseURL.endsWith('/') ? baseURL : baseURL + '/');
  if (!['http:', 'https:'].includes(base.protocol)) throw Error('Use an HTTP(S) website URL.');
  const failures = [];
  for (let i = 0; i < assets.length; i += 8) {
    await Promise.all(assets.slice(i, i + 8).map(async asset => {
      const url = new URL(asset.path, base);
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const type = (response.headers.get('content-type') || '').split(';')[0].trim();
        const expected = { html: ['text/html'], javascript: ['text/javascript', 'application/javascript'], css: ['text/css'] }[asset.kind];
        if (!response.ok || !expected.includes(type)) failures.push(`${url}: HTTP ${response.status}, ${type || 'missing Content-Type'}`);
        await response.body?.cancel();
      } catch (error) { failures.push(`${url}: ${error.message}`); }
    }));
  }
  if (failures.length) throw Error('Public asset HTTP checks failed:\n' + failures.join('\n'));
  return assets;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args[0] !== '--url' || args.length !== 2)) throw Error('Usage: node tools/check-public-assets.mjs [--url http://127.0.0.1:8080]');
    const assets = args.length ? await validateServedAssets(siteRoot, args[1]) : validatePublicAssets(siteRoot);
    console.log(`Checked ${assets.length} public pages, scripts and styles${args.length ? ' over HTTP' : ''}.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
