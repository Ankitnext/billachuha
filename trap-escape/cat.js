((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./traps-drop.js'),...require('./traps-env.js'),...require('./machinery.js')}:root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  class Chaser{
    constructor(level){this.x=8;this.y=346;this.w=38;this.h=54;this.face=1;this.state='waiting';this.cursor=-1;this.stuns=0;this.active=null;this.queue=[];this.recover=0;this.grace=0;this.slide=0;this.baseX=this.x;this.baseY=this.y;this.vx=0;this.vy=0;}
    get stunned(){return!!this.active||this.queue.length>0||(this.machineHold||0)>0;}
    update(game,dt){
      if(this.state==='defeated')return;
      if(game.frame<game.level.delay)return;
      const first=this.cursor<0;if(first){this.cursor=0;this.state='chasing';}
      this.recover=Math.max(0,this.recover-dt);this.grace=Math.max(0,this.grace-dt);this.slide=Math.max(0,this.slide-dt);
      let rate=first?0:game.level.speed*(this.recover>0?1.3:1)*(this.slide>0?1.15:1);
      if(this.active){const a=this.active,elapsed=a.duration-a.remaining;this.state='stunned';rate=a.type==='banana'&&elapsed<.28?game.level.speed*1.8:a.type==='ice'&&elapsed<.58?game.level.speed*1.65:a.type==='paint'&&elapsed<.38?game.level.speed:0;
        a.remaining-=dt;if(a.remaining<=0){this.active=this.queue.shift()||null;if(!this.active){this.recover=1;this.grace=.14;this.state='recovering';}}
      }else this.state=this.recover>0?'recovering':'chasing';
      if((this.machineHold||0)>0){this.machineHold=Math.max(0,this.machineHold-dt);rate=0;}
      this.cursor=T.clamp(this.cursor+rate,game.recorder.first,Math.max(0,game.recorder.last-1));
      const sample=game.recorder.get(this.cursor);if(!sample)return;
      this.baseX=sample.x-this.w/2;this.baseY=sample.foot-this.h;this.x=this.baseX;this.y=this.baseY;this.face=sample.face;this.vx=sample.vx*rate;this.vy=sample.vy;
      if(this.active){const progress=1-this.active.remaining/this.active.duration,type=this.active.type;
        if(type==='spring')this.y-=Math.sin(progress*Math.PI)*Math.min(175,Math.max(0,this.baseY-10));
        if(type==='pit')this.y+=Math.sin(progress*Math.PI)*55;
        if(type==='paint')this.x+=Math.sin(game.elapsed*13)*14;
        if(type==='steam')this.y-=Math.sin(progress*Math.PI)*65;
        if(type==='crusher'||type==='lift')this.y-=Math.sin(progress*Math.PI)*Math.min(type==='crusher'?145:125,Math.max(0,this.baseY-8));
        if(type==='shift')this.y+=Math.sin(progress*Math.PI)*48;
        if(type==='gate')this.x-=Math.sin(progress*Math.PI)*12;
        if(type==='belt')this.x-=this.face*Math.sin(progress*Math.PI)*30;
      }
      this.x=T.clamp(this.x,0,game.level.width-this.w);
    }
  }
  function trapHit(game,trap){
    if(game.phase!=='playing'||game.cat.state==='defeated')return false;
    const c=game.cat,spec=T.ITEMS[trap.type]||T.ENVIRONMENT[trap.type];if(!spec)return false;
    if(T.MACHINERY[trap.type])T.showMachineImpact(game,trap);
    game.combo=game.elapsed<=game.comboUntil?game.combo+1:1;game.comboUntil=game.elapsed+3;game.bestCombo=Math.max(game.bestCombo,game.combo);c.stuns++;
    const reaction={type:trap.type,duration:spec.stun/60,remaining:spec.stun/60};if(c.active)c.queue.push(reaction);else c.active=reaction;
    c.state='stunned';if(trap.type==='sweep'||trap.type==='steam')c.cursor=Math.max(0,c.cursor-10);if(trap.type==='ice')c.slide=2;
    game.burst(c.x+c.w/2,c.y+12,spec.color,22);game.text(game.combo>1?`${game.combo}× CHAIN!`:spec.name.toUpperCase(),c.x+c.w/2,c.y-22,spec.color);game.emit('trap-hit',{trap:trap.type,combo:game.combo});game.message=`${spec.name}! ${c.stuns} / ${game.level.targetStuns} Cat stuns.`;
    if(trap.type==='magnet'){
      const metal=game.level.environment.find(e=>!e.used&&e.state==='armed'&&T.ENVIRONMENT[e.type].metal&&Math.abs(e.x-c.x)<180&&Math.abs(e.y-(c.y+c.h))<160);
      if(metal){metal.used=true;metal.state='spent';game.hitCat(metal);}
    }
    if(c.stuns>=game.level.targetStuns&&game.bestCombo>=game.level.comboRequired)game.win('traps');
    return true;
  }
  return{Chaser,trapHit};
});
