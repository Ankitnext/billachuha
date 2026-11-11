// Sync the website-owned combat rules and presentation into the Go binary.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const site=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const backend=resolve(site,'../billachuha_backend/internal');
const rules=['physics','fighter','combat','powers','particles','bot','engine'];
for(const name of rules){const dest=resolve(backend,'fightengine/rules',name+'.js');mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,readFileSync(resolve(site,'super-fight',name+'.js')));}
const files=['super-fight.html','super-fight.css','super-fight/online.js',...['physics','fighter','combat','powers','particles','bot','engine','camera','art','audio','input','hud','menu'].map(n=>'super-fight/'+n+'.js')];
for(const file of files){const dest=resolve(backend,'playweb',file);mkdirSync(dirname(dest),{recursive:true});let data=readFileSync(resolve(site,file),'utf8');if(file.endsWith('.html'))data=data.replace('<script defer src="site-config.js"></script>','').replace('href="games/fighting-arena/"','href="/multiplayer"');writeFileSync(dest,data);}
console.log('Synchronized Super Fighting Arena combat rules and online presentation.');
