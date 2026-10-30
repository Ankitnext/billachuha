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
test('local and embedded settings assets remain identical',()=>{
  const backend=path.resolve(__dirname,'../../billachuha_backend/internal/playweb');
  if(!fs.existsSync(backend))return;
  for(const file of ['control-settings.js','control-settings.css'])assert.equal(fs.readFileSync(path.resolve(__dirname,'..',file),'utf8'),fs.readFileSync(path.join(backend,file),'utf8'));
});
