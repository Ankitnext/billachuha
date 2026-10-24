// Build only public site assets. No sibling checkout or dependency install needed.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const environmentIndex = process.argv.indexOf('--environment');
const environment = environmentIndex >= 0 ? process.argv[environmentIndex + 1] : process.argv.includes('--production') ? 'production' : 'development';
if (!['development', 'staging', 'production'].includes(environment)) throw new Error('Use --environment development, staging or production.');
const envFile = join(root, `.env.${environment}`);
const settings = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
const backendUrl = process.env.BACKEND_URL || settings.BACKEND_URL;
const hosted = environment !== 'development';
if (hosted && !backendUrl) throw new Error(`Set BACKEND_URL or .env.${environment} before building ${environment}.`);
const backend = new URL(backendUrl || 'http://127.0.0.1:3000');
const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(backend.hostname);
if ((backend.protocol !== 'https:' && !(backend.protocol === 'http:' && local && !hosted)) || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) throw new Error('BACKEND_URL must be an HTTPS origin with no path, query or credentials (local HTTP allowed for development).');

// This exact generated directory is the only path the build may clear.
if (output !== join(root, 'dist')) throw new Error('Unexpected output directory');
rmSync(output, { recursive: true, force: true });
mkdirSync(output);
const publicExtensions = new Set(['.html', '.css', '.js', '.mp3']);
const publicDirectories = new Set(['bck_img', 'image', 'img', 'js']);
for (const entry of readdirSync(root, { withFileTypes: true })) {
  if ((entry.isFile() && publicExtensions.has(extname(entry.name))) || (entry.isDirectory() && publicDirectories.has(entry.name))) cpSync(join(root, entry.name), join(output, entry.name), { recursive: true });
}
const home = readFileSync(join(output, 'index.html'), 'utf8');
for (const file of ['site-config.js', 'online-chase.js']) {
  if (!home.includes(`src="./${file}"`)) throw new Error(`Missing homepage script: ${file}`);
}
writeFileSync(join(output, 'site-config.js'), 'window.BILLACHUHA_CONFIG = ' + JSON.stringify({ backendUrl: backend.origin, environment }) + ';' + String.fromCharCode(10));
writeFileSync(join(output, '.nojekyll'), '');
console.log(`Built ${environment} website in dist/ using game server ${backend.origin}`);
