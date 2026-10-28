((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  class PathRecorder{
    constructor(capacity=T.RULES.capacity){this.capacity=capacity;this.frames=new Array(capacity);this.first=0;this.last=-1;}
    record(p,frame){this.frames[frame%this.capacity]={frame,x:p.x+p.w/2,foot:p.y+p.h,vx:p.vx,vy:p.vy,grounded:p.grounded,face:p.face};this.last=frame;this.first=Math.max(0,frame-this.capacity+1);}
    get(frame){if(this.last<0||frame<this.first||frame>this.last)return null;const lo=Math.floor(frame),a=this.frames[lo%this.capacity];if(!a||a.frame!==lo)return null;const b=this.frames[Math.min(this.last,lo+1)%this.capacity],t=frame-lo;return{...a,x:a.x+(b.x-a.x)*t,foot:a.foot+(b.foot-a.foot)*t,vx:a.vx+(b.vx-a.vx)*t,vy:a.vy+(b.vy-a.vy)*t};}
  }
  return{PathRecorder};
});
