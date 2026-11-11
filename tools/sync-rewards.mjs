// The server owns badge definitions; the shared presentation belongs to the site.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),backend=resolve(root,'../billachuha_backend');
function write(path,data){if(!existsSync(path)||!readFileSync(path).equals(data))writeFileSync(path,data);}
write(resolve(root,'rewards-catalog.json'),readFileSync(resolve(backend,'internal/rewards/catalog.json')));
for(const file of ['rewards.js','rewards.css','rewards-catalog.json'])write(resolve(backend,'internal/playweb',file),readFileSync(resolve(root,file)));
console.log('Synchronized badge catalog and shared rewards presentation.');
