// Copy the reusable Snake & Ladder presentation into the standalone API repo.
// Backend and Android builds use checked-in assets; no sibling checkout needed.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(root,'../billachuha_backend/internal/playweb');
const files=['snake-ladder.js','snake-ladder.css','snake-ladder-core.js','snake-ladder-art.js','snake-ladder-view.js','snake-ladder-online.js','snake-ladder-online.css','game-shell.js','game-shell.css','game-runtime.js'];
function write(file,data){const path=resolve(target,file);if(!existsSync(path)||readFileSync(path,'utf8')!==data)writeFileSync(path,data);}
for(const file of files)write(file,readFileSync(resolve(root,file),'utf8'));
const html=readFileSync(resolve(root,'snake-ladder.html'),'utf8')
 .replace('<title>Moving Stairs: Snake & Ladder','<title>Online Snake & Ladder')
 .replace('<script defer src="site-config.js"></script>','')
 .replace('<script defer src="snake-ladder.js">','<script defer src="snake-ladder-online.js"></script><script defer src="snake-ladder.js">')
 .replace('</head>','<link rel="stylesheet" href="snake-ladder-online.css"></head>');
write('snake-ladder-online.html',html);
console.log(`Synchronized ${files.length+1} Snake & Ladder online presentation assets.`);
