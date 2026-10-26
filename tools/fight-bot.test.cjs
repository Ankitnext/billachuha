const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
function setup(){
 const context=vm.createContext({});
 vm.runInContext(readFileSync(require('node:path').join(__dirname,'../js/fight-bot.js'),'utf8')+`;globalThis.bot=new FightBot(()=>.5);globalThis.actor={health:100,width:50,position:{x:500,y:330},velocity:{y:0}};globalThis.target={health:100,position:{x:100,y:330},isAttacking:false};`,context);
 return script=>vm.runInContext(script,context);
}
test('bot closes distance with a reaction delay and stops to fight in range',()=>{
 const run=setup();assert.equal(run('bot.update(0,actor,target,1024).move'),-1);
 run('target.position.x=800');assert.equal(run('bot.update(50,actor,target,1024).move'),-1);
 assert.equal(run('bot.update(400,actor,target,1024).move'),1);
 run('target.position.x=610');assert.equal(run('bot.update(800,actor,target,1024).move'),0);
});
test('bot attacks with a cooldown and reacts to threats without jumping in midair',()=>{
 const run=setup();run('target.position.x=610');assert.equal(run('bot.update(0,actor,target,1024).attack'),true);
 assert.equal(run('bot.update(400,actor,target,1024).attack'),false);
 run('target.isAttacking=true');assert.equal(run('bot.update(800,actor,target,1024).jump'),true);
 run('actor.velocity.y=-10');assert.equal(run('bot.update(2800,actor,target,1024).jump'),false);
});
test('defeated fighters cannot move, jump or attack',()=>{
 const run=setup();run('actor.health=0');assert.equal(run('JSON.stringify(bot.update(0,actor,target,1024))'),'\u007b"move":0,"jump":false,"attack":false}');
});
