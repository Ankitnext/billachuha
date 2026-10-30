/* Original procedural limb animation. Presentation only: never changes physics. */
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CharacterMotion = api;
})(globalThis, () => {
  'use strict';
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const finite = n => Number.isFinite(n) ? n : 0;
  function pose({phase=0, speed=0, grounded=true, vy=0, jetting=false, dead=false, motion=true, landing=0}={}) {
    const amount = dead || !grounded || !motion ? 0 : clamp(speed / 150, 0, 1);
    const swing = amount ? Math.sin(phase) * amount : 0;
    const air = !grounded && !dead;
    return {swing, leftLift:Math.max(0, swing), rightLift:Math.max(0, -swing),
      bob:motion ? -Math.abs(Math.sin(phase * 2)) * amount * 1.3 + landing * 1.5 : 0,
      tuck:air ? (jetting ? .65 : vy < -20 ? 1 : .45) : 0,
      reach:air ? (jetting ? .4 : vy < -20 ? 1 : .65) : 0, dead, grounded, phase, speed};
  }
  class Tracker {
    constructor() { this.states = new Map(); }
    clear() { this.states.clear(); }
    prune(keys) { const keep = new Set(keys); for (const key of this.states.keys()) if (!keep.has(key)) this.states.delete(key); }
    sample(key, actor, time, options={}) {
      let state = this.states.get(key);
      if (!state) { state = {}; this.states.set(key, state); }
      return sample(state, actor, time, options);
    }
  }
  function sample(state, actor, time, {topDown=false, grounded=actor.grounded !== false, vy, motion=true, dead=false}={}) {
    time = finite(time);
    const x=finite(actor.x), y=finite(actor.y), z=finite(actor.z);
    const dt=time-(state.time ?? time), dx=x-(state.x ?? x), dy=y-(state.y ?? y), dz=z-(state.z ?? z);
    if (dt > 0 && dt <= .3 && Math.hypot(dx,dy) < 160 && !dead) {
      const distance=topDown ? Math.hypot(dx,dy) : Math.abs(dx);
      const speed=grounded ? Math.min(700, distance/dt) : 0;
      state.speed=(state.speed || 0)+(speed-(state.speed || 0))*(1-Math.exp(-dt/ .065));
      if (state.speed < 2) state.speed=0;
      if (grounded) state.phase=(state.phase || 0)+distance/32*Math.PI*2;
      state.landing=grounded && state.grounded === false ? 1 : Math.max(0,(state.landing || 0)-dt*7);
      state.vy=topDown ? -dz/dt : dy/dt;
    } else if (dt !== 0 || state.time === undefined || dead) {
      state.speed=0; state.landing=0; state.vy=0;
    }
    Object.assign(state,{x,y,z,time,grounded});
    return pose({phase:state.phase || 0,speed:state.speed,grounded,vy:vy ?? state.vy,
      jetting:actor.jetting,dead,motion,landing:state.landing});
  }
  const actors = new WeakMap();
  function forActor(actor, time, options) {
    let state=actors.get(actor); if (!state) { state={}; actors.set(actor,state); }
    return sample(state,actor,time,options);
  }
  function stroke(c, points, color, width) {
    c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();
    points.forEach(([x,y],i)=>i ? c.lineTo(x,y) : c.moveTo(x,y));c.stroke();
  }
  // Coordinates are center/bottom. Draw before the torso so joints stay hidden.
  function sideLimbs(c,p,{x=0,y=0,w=30,h=44,color='#72afbf',face=1,arms=true,hand=null}={}) {
    c.save();c.translate(x,y);c.scale(face < 0 ? -1 : 1,1);
    const swing=p.swing*w*.28, tuck=p.tuck*h*.16, weight=Math.max(3,w*.17);
    for (const [dir,lift] of [[-1,p.leftLift],[1,p.rightLift]]) {
      const step=swing*dir;
      stroke(c,[[dir*w*.17,-h*.26],[dir*w*.2+step*.5,-h*.13-tuck],[dir*w*.24+step,-lift*h*.11-tuck*.8]],color,weight);
    }
    if (arms) for (const dir of [-1,1]) {
      const shoulder=[dir*w*.3,-h*.57];
      const end=hand ? [(hand.x-x)*(face < 0 ? -1 : 1),hand.y-y] : [dir*w*.56-swing*dir*.6,-h*.32-p.reach*h*.39];
      stroke(c,[shoulder,[dir*w*.5,-h*.43-p.reach*h*.17],end],color,weight*.8);
    }
    c.restore();
  }
  // Top-down paws: opposite front/rear limbs alternate while aiming stays free.
  function topLimbs(c,p,{color='#72afbf',scale=1,armed=false}={}) {
    c.save();c.scale(scale,scale);
    for (const dir of [-1,1]) {
      stroke(c,[[-7,dir*8],[-10+p.swing*dir*6,dir*(15-p.tuck*4)]],color,5);
      stroke(c,[[7,dir*8],[armed ? 17 : 9-p.swing*dir*5,dir*(armed ? 8 : 16-p.reach*5)]],color,4);
    }
    c.restore();
  }
  // Front-facing original Rat for Long Survival / Android Long Run.
  function rat(c,p,{size=50,face=1}={}) {
    c.save();c.scale(size/50*(face < 0 ? -1 : 1),size/50);c.translate(0,p.bob);
    stroke(c,[[13,12],[25,19],[27,7],[21,10]],'#df9c98',2.5);
    sideLimbs(c,p,{y:24,w:28,h:43,color:'#b89a78'});
    c.fillStyle='#d3b795';c.beginPath();c.ellipse(0,9,12,9,0,0,Math.PI*2);c.fill();
    for(const x of [-12,12]){c.fillStyle='#a48568';c.beginPath();c.arc(x,-14,9,0,Math.PI*2);c.fill();c.fillStyle='#e9aaa1';c.beginPath();c.arc(x,-14,5.7,0,Math.PI*2);c.fill();}
    c.fillStyle='#d3b795';c.beginPath();c.ellipse(0,-4,14,14,0,0,Math.PI*2);c.fill();
    for(const x of [-5,5]){c.fillStyle='#fff8e6';c.beginPath();c.ellipse(x,-6,3.5,5,0,0,Math.PI*2);c.fill();c.fillStyle='#25372b';c.beginPath();c.ellipse(x+face,-5,1.7,3,0,0,Math.PI*2);c.fill();}
    c.fillStyle='#6c4a43';c.beginPath();c.ellipse(0,2,3.5,2.5,0,0,Math.PI*2);c.fill();
    for(const dir of [-1,1])for(const y of [3,7])stroke(c,[[dir*7,y],[dir*20,y+(y===3?-2:2)]],'#6c4a43',1);
    c.restore();
  }
  return {pose,Tracker,forActor,sideLimbs,topLimbs,rat};
});
