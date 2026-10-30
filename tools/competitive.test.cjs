const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../competitive.js'),S=Object.assign({},...['physics','fighter','combat','powers','particles','bot','engine'].map(name=>require('../super-fight/'+name+'.js')));
test('completed matches rank both local players and never award scores twice',()=>{
 const p=new C.Profile(),result={id:'completed-match-1',game:'super-fight',challenge:3,players:[{name:'Alice',score:2500,won:true},{name:'Bob',score:1000,won:false}]};assert.equal(p.record(result),true);assert.equal(p.record(result),false);const rows=p.list('super-fight');assert.equal(rows.length,2);assert.equal(rows[0].name,'Alice');assert.equal(rows[0].score,2500);assert.equal(rows[0].matches,1);assert.equal(rows[0].wins,1);assert.equal(rows[0].stage,2);assert.equal(rows[1].stage,1);
 const restored=new C.Profile(JSON.parse(JSON.stringify(p)));assert.equal(restored.player('super-fight',' ALICE ').stage,2);assert.equal(restored.record(result),false);
});
test('names, save corruption, scores and challenge progression remain bounded',()=>{
 const p=new C.Profile({entries:[null,42,{game:'fake',name:'Bad'},{game:'super-fight',name:'__proto__',best:Infinity,stage:9999,xp:NaN}],seen:'bad'});assert.equal(p.entries.length,1);assert.equal(p.entries[0].stage,50);assert.equal(p.entries[0].best,0);
 assert.equal(p.record({id:'x',game:'super-fight',players:[{name:'Alice'},{name:' ALICE '}]}),false);assert.equal(p.record({id:'x',game:'arena-blitz',players:[{name:'Alice'}]}),false);
 assert.equal(C.load({getItem(){throw Error('blocked');}}).entries.length,0);assert.equal(C.save(p,{setItem(){throw Error('blocked');}}),false);
 assert.equal(C.level(100),2);assert.equal(C.level(400),3);assert.equal(C.level(1e9),50);
});
test('global local-game sync reports only Player 1 under their account and caps the score',async()=>{
 const previous=global.fetch;let request;global.fetch=async(url,options)=>{request={url,options};return{ok:true,json:async()=>({saved:true})};};
 try{await C.sync({id:'match-id-123456789',game:'super-fight',challenge:2,players:[{name:'Alice',score:9e9,won:true},{name:'Bob',score:500}]});const payload=JSON.parse(request.options.body);assert.equal(payload.score,1e6);assert.equal(payload.game,'super-fight');assert.equal(payload.won,true);assert.equal(Object.hasOwn(payload,'name'),false);assert.equal(request.options.credentials,'include');assert.equal(request.options.headers['X-Chase-Web'],'1');}finally{global.fetch=previous;}
});
test('bot difficulty rises with campaign and round levels while human stats stay unchanged',()=>{
 const easy=new S.SuperBot('normal',()=>.5,1),later=new S.SuperBot('normal',()=>.5,8);assert.ok(later.spec.reaction<easy.spec.reaction);assert.ok(later.spec.defense>easy.spec.defense);assert.ok(later.spec.aggression>easy.spec.aggression);
 const a=new S.Match({mode:'solo',level:1}),b=new S.Match({mode:'solo',level:8});assert.equal(a.fighters[0].maxHp,b.fighters[0].maxHp);assert.equal(a.fighters[0].spec.speed,b.fighters[0].spec.speed);b.wins[0]=1;b.nextRound();assert.equal(b.bot.level,9);const max=new S.SuperBot('impossible',()=>.5,50);assert.ok(max.spec.reaction>=.035&&max.spec.defense<=.97);assert.throws(()=>new S.Match({level:51}));
});
test('fighting points reward completed wins, combos and tougher matches without exceeding the score limit',()=>{
 const match={history:[{stats:[{damage:100,maxCombo:3}]}],wins:[2,0],difficulty:'normal',level:1};const score=C.fightScore(match,0);assert.ok(score>2000);assert.ok(C.fightScore({...match,level:5},0)>score);assert.ok(C.fightScore({...match,wins:[0,2]},0)<score);
});
test('local and embedded ranking assets stay identical',()=>{
 const back=path.resolve(__dirname,'../../billachuha_backend/internal/playweb');if(!fs.existsSync(back))return;for(const f of ['competitive.js','rankings.js','rankings.css'])assert.equal(fs.readFileSync(path.join(back,f),'utf8'),fs.readFileSync(path.resolve(__dirname,'..',f),'utf8'),f);
});
