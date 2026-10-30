const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {axis}=require('../long-run-movement.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} should equal ${b}`);
function simulate(steps,{velocity=0,acceleration=1500,friction=.9}={}){
  let distance=0;for(const dt of steps){const next=axis(velocity,acceleration,friction,dt);velocity=next.velocity;distance+=next.distance;}return{velocity,distance};
}
test('the original 60 FPS keyboard, joystick, air momentum and braking are preserved',()=>{
  for(const friction of [.9,.995])for(const acceleration of [-3750,-1500,0,1500,3750]){
    let velocity=400,distance=0;for(let i=0;i<120;i++){velocity=(velocity+acceleration/60)*friction;distance+=velocity/60;}
    const actual=simulate(Array(120).fill(1/60),{velocity:400,acceleration,friction});close(actual.velocity,velocity);close(actual.distance,distance);
  }
});
test('30/60/90/120/144/240 Hz have identical acceleration and travelled distance',()=>{
  const reference=simulate(Array(60).fill(1/60));
  for(const fps of [30,60,90,120,144,240]){const actual=simulate(Array(fps).fill(1/fps));close(actual.velocity,reference.velocity);close(actual.distance,reference.distance);}
  assert.ok(reference.velocity>224&&reference.distance>190,'retain the old keyboard pace');
});
test('irregular frame timing and releases do not change the pace or leave permanent drift',()=>{
  const irregular=Array.from({length:40},(_,i)=>i%2?.04:.01),regular=Array(60).fill(1/60);
  const a=simulate(irregular),b=simulate(regular);close(a.velocity,b.velocity);close(a.distance,b.distance);
  const releasedA=simulate(irregular,{velocity:a.velocity,acceleration:0}),releasedB=simulate(regular,{velocity:b.velocity,acceleration:0});
  close(releasedA.velocity,releasedB.velocity);close(releasedA.distance,releasedB.distance);assert.ok(releasedA.velocity<.5);
});
test('touch retains its original 2.5x boost and jump impulses retain their original momentum',()=>{
  const keyboard=simulate(Array(120).fill(1/120)),touch=simulate(Array(120).fill(1/120),{acceleration:3750});
  close(touch.velocity,keyboard.velocity*2.5);close(touch.distance,keyboard.distance*2.5);
  const jump60=simulate(Array(30).fill(1/60),{velocity:625,acceleration:0,friction:.995}),jump144=simulate(Array(72).fill(1/144),{velocity:625,acceleration:0,friction:.995});
  close(jump60.velocity,jump144.velocity);close(jump60.distance,jump144.distance);
});
test('zero, negative and invalid elapsed times never move the character',()=>{
  for(const dt of [0,-1,NaN,Infinity])assert.deepEqual(axis(225,1500,.9,dt),{velocity:225,distance:0});
});
test('website and offline Android share the same movement timing',()=>{
  const source=fs.readFileSync(path.resolve(__dirname,'../long-run-movement.js'),'utf8'),app=path.resolve(__dirname,'../../billachuha_app/app/src/main/assets/long_run/long-run-movement.js');
  if(fs.existsSync(app))assert.equal(fs.readFileSync(app,'utf8'),source);
});
