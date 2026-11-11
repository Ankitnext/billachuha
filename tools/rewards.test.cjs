const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../rewards.js'),catalog=require('../rewards-catalog.json'),C=require('../competitive.js');
test('new profiles, XP levels and cosmetic unlocks use permanent milestones',()=>{
 const empty=R.evaluate(catalog);assert.equal(empty.earned,0);assert.equal(empty.level,1);assert.equal(empty.nextBadge,'first_finish');assert.equal(empty.badges.length,13);assert.deepEqual(empty.styles.map(s=>s.unlocked),[true,false,false,false]);
 const stats={matches:10,wins:1,xp:1000,games:3,snakeWins:1,runnerBest:1000},data=R.evaluate(catalog,stats);
 assert.equal(data.earned,7);assert.equal(data.level,4);assert.equal(data.levelXP,100);assert.equal(data.levelTarget,700);assert.deepEqual(data.styles.map(s=>s.unlocked),[true,true,true,false]);assert.deepEqual(R.evaluate(catalog,stats),data);
});
test('nearest goal, capped levels and corrupt numbers are handled without fake rewards',()=>{
 assert.equal(R.evaluate(catalog,{matches:9,wins:2}).nextBadge,'ten_matches');
 const data=R.evaluate(catalog,{matches:-2,wins:Infinity,xp:NaN});assert.equal(data.earned,0);assert.equal(data.level,1);
 const high=R.evaluate(catalog,{xp:1e9});assert.equal(high.level,50);assert.equal(high.levelXP,high.levelTarget);
 const before=JSON.stringify(catalog);R.evaluate(catalog,{xp:1000});assert.equal(JSON.stringify(catalog),before);
});
test('local achievements stay with each named player and duplicate results grant no progress',()=>{
 const p=new C.Profile(),match={id:'reward-fixture-1',game:'moving-stairs',players:[{name:'Alice',score:5000,won:true},{name:'Bob',score:2000,won:false}]};
 p.record(match);const alice=R.evaluate(catalog,R.stats(p.entries,'Alice')),bob=R.evaluate(catalog,R.stats(p.entries,'Bob'));
 assert.equal(alice.earned,3);assert.equal(bob.earned,1);assert.equal(alice.xp,50);assert.equal(bob.xp,15);assert.equal(p.record(match),false);assert.deepEqual(R.evaluate(catalog,R.stats(p.entries,'Alice')),alice);
 const restored=C.load({getItem:()=>JSON.stringify(p)});assert.deepEqual(R.stats(restored.entries,'Alice'),R.stats(p.entries,'Alice'));
 assert.deepEqual(R.stats(p.entries,' Ａlice '),R.stats(p.entries,'Alice'),'Named player matching follows saved profile normalization');
});
