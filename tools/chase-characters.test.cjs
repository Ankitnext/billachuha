const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=path.resolve(__dirname,'../../billachuha_backend/internal/playweb');

function renderer(){
 const commands=[],characters=[];let now=1000;
 const ctx=new Proxy({measureText:text=>({width:text.length*6})},{get(target,key){return key in target?target[key]:(...args)=>commands.push({method:key,args});}});
 const context=vm.createContext({ctx,canvas:{width:1100,clientWidth:1100},window:{CharacterMotion:require('../character-motion.js')},performance:{now:()=>now}});
 vm.runInContext(fs.readFileSync(path.join(source,'mode-art.js'),'utf8'),context);
 const draw=context.window.ModeArt.character;
 context.window.ModeArt.character=(c,p,color,pose,options)=>{characters.push({p,color,pose,options});draw(c,p,color,pose,options);};
 const game=fs.readFileSync(path.join(source,'game.js'),'utf8');
 vm.runInContext(game.slice(game.indexOf('const roles ='),game.indexOf('const appMode =')),context);
 vm.runInContext("const me={id:'self'},camera={x:0,y:0},world={ended:false},reducedMotion={matches:false};const characterMotion=new window.CharacterMotion.Tracker();",context);
 vm.runInContext(game.slice(game.indexOf('function animal(player)'),game.indexOf('\nfunction frame()')),context);
 return{draw:player=>context.animal(player),characters,commands,time:value=>now=value,reduce:()=>vm.runInContext('reducedMotion.matches=true',context),phone:()=>vm.runInContext('canvas.clientWidth=390',context)};
}
test('Chase uses Horde art for every role without changing authoritative actors',()=>{
 const r=renderer();
 for(const role of ['rat','cat','dog']){
  const player=Object.freeze({id:'self',name:'Test',role,x:100,y:100,z:0,health:80,aimX:-.6,aimY:.8});
  const before=JSON.stringify(player);r.draw(player);assert.equal(JSON.stringify(player),before);
  const drawn=r.characters.at(-1);assert.equal(drawn.p.role,role);assert.equal(drawn.p.weapon,role==='dog'?'pistol':null);assert.equal(drawn.p.aimY,.8);assert.equal(drawn.options.fullBody,true);
 }
 assert.ok(r.commands.some(c=>c.method==='fillText'&&c.args[0]==='YOU · Test'));
 assert.ok(r.commands.filter(c=>c.method==='arc').length>6,'Faces and local player rings are drawn');
});

test('upright body stays unrotated while aiming and labels clear its full height',()=>{
 const r=renderer();
 r.draw({id:'self',name:'Rat',role:'rat',x:100,y:200,z:0,health:100,aimX:0,aimY:-1});
 assert.equal(r.commands.filter(c=>c.method==='rotate').length,0,'Aiming up must not rotate the body into a top-down head');
 const name=r.commands.find(c=>c.method==='fillText'&&c.args[0]==='YOU · Rat');
 assert.ok(name.args[2]<120,'Label must clear the taller head and body');
 assert.ok(r.commands.some(c=>c.method==='ellipse'&&c.args[2]===6&&c.args[3]===3.5),'Distinct feet are drawn');
});
test('shared limbs follow Chase movement and jumping, including reduced-motion poses',()=>{
 const r=renderer(),player={id:'rat',name:'Rat',role:'rat',x:100,y:100,z:0,health:100,aimX:1,aimY:0};
 r.draw(player);r.time(1080);r.draw({...player,x:108});assert.ok(r.characters.at(-1).pose.speed>0);
 r.time(1160);r.draw({...player,x:116,z:30});const jump=r.characters.at(-1).pose;
 assert.ok(jump.tuck>0);assert.equal(jump.swing,0);
 r.reduce();r.time(1240);r.draw({...player,x:124});assert.equal(r.characters.at(-1).pose.swing,0);assert.equal(r.characters.at(-1).pose.bob,0);
 r.draw({...player,id:'decoy',decoy:true,invisible:true});assert.ok(r.commands.some(c=>c.method==='fillText'&&c.args[0]==='Rat · decoy'));
});

test('phone character size is capped and drawing still leaves the player unchanged',()=>{
 const r=renderer(),player=Object.freeze({id:'self',name:'Phone player',role:'cat',x:30,y:40,z:0,health:100,aimX:1,aimY:0});
 r.phone();r.draw(player);assert.ok(r.commands.some(c=>c.method==='scale'&&c.args[0]===1.5));assert.equal(player.x,30);
});
