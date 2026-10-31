const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../control-settings.js');
const actions = [{id:'left',codes:['KeyA','ArrowLeft']},{id:'right',codes:['KeyD','ArrowRight']}];
test('corrupt, missing and duplicate stored keys recover the complete default scheme',()=>{
  const defaults=C.normalize(null,actions);
  for(const value of [false,[],{version:2},{version:1,bindings:{}},{version:1,bindings:{left:['KeyB'],right:['KeyB']}},{version:1,bindings:{left:['Escape'],right:['KeyD']}}])assert.deepEqual(C.normalize(value,actions),defaults);
  assert.deepEqual(C.normalize({version:1,bindings:{left:['KeyB'],right:['KeyN']}},actions).bindings,{left:['KeyB'],right:['KeyN']});
});
test('layout storage rejects nonfinite controls and keeps oversized values in bounds',()=>{
  const defs=[{id:'move',stick:true},{id:'fire'}];
  assert.equal(C.normalizeHud({move:{x:NaN,y:0,size:100,opacity:1}},defs),null);
  const layout=C.normalizeHud({move:{x:-20,y:4,size:10000,opacity:0},fire:{x:1,y:1,size:70,opacity:.5}},defs);
  assert.deepEqual(layout.move,{x:0,y:1,size:140,opacity:.35});
  for(const bounds of [{width:296,height:90},{width:366,height:700},{width:1256,height:560}])for(const def of defs){
    const b=C.box(layout[def.id],def,bounds);assert.ok(b.left>=0&&b.top>=0&&b.left+b.size<=bounds.width&&b.top+b.size<=bounds.height);
  }
});
test('default HUD fits both fighting players without collisions on compact screens',()=>{
  const controls=[{id:'one',stick:true},{id:'two',stick:true},...Array.from({length:8},(_,i)=>({id:'action-'+i}))];
  for(const bounds of [{width:296,height:408},{width:544,height:204},{width:366,height:684},{width:820,height:253}]){
    const layout=C.defaultHud(controls,bounds);
    assert.equal(C.hudOverlaps(layout,controls,bounds),false,JSON.stringify(bounds));
    for(const item of controls){const b=C.box(layout[item.id],item,bounds);assert.ok(b.size>=33&&b.left>=0&&b.top>=0&&b.left+b.size<=bounds.width+.01&&b.top+b.size<=bounds.height+.01);}
  }
});
test('local and embedded settings assets match across checkout line endings',()=>{
  const backend=path.resolve(__dirname,'../../billachuha_backend/internal/playweb');
  if(!fs.existsSync(backend))return;
  const source=file=>fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  for(const file of ['control-settings.js','control-settings.css'])assert.equal(source(path.resolve(__dirname,'..',file)),source(path.join(backend,file)));
});
test('native overlay defaults keep touch controls separate and leave the middle clear',()=>{
  const online=[{id:'move',stick:true},...Array.from({length:9},(_,i)=>({id:'action-'+i}))];
  const local=[0,1].flatMap(group=>[{id:'stick-'+group,stick:true,group},...Array.from({length:4},(_,i)=>({id:group+'-'+i,group}))]);
  for(const bounds of [{width:544,height:184},{width:820,height:254},{width:366,height:708}])for(const controls of [online,local]){
    const layout=C.overlayHud(controls,bounds);
    assert.equal(C.hudOverlaps(layout,controls,bounds),false);
    for(const item of controls){const b=C.box(layout[item.id],item,bounds);assert.ok(b.size>=42);assert.ok(b.left>=0&&b.top>=0&&b.left+b.size<=bounds.width+.01&&b.top+b.size<=bounds.height+.01);if(bounds.width>bounds.height)assert.ok(b.left+b.size<bounds.width*.42||b.left>bounds.width*.58,'landscape middle stays clear');else assert.ok(b.top>bounds.height*.5,'portrait upper play area stays clear');}
  }
});
