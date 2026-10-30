((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?Object.assign({},...['physics','levels','vision','player','patrol','camera','tools'].map(n=>require('./'+n+'.js'))):root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  class HeistGame{
    constructor(index=0){this.index=K.clamp(Math.floor(index),0,49);this.level=K.LEVELS[this.index];this.player=K.createPlayer(this.level);this.guards=this.level.guards.map(K.createGuard);this.cameras=this.level.cameras.map(K.createCamera);this.cheese=this.level.cheese.map(p=>({...p,taken:false}));this.pickups=this.level.tools.map(p=>({...p,taken:false}));this.elapsed=0;this.alarm=0;this.status='playing';this.cheeseCount=0;this.spotted=0;this.spotFlash=0;this.doorFlash=0;this.lastSpotted=-10;this.spottedNow=false;this.smoke=[];this.decoys=[];this.hole=null;this.serial=0;this.toolsUsed=0;this.evades=0;this.nextEvade=0;this.message=this.level.hint;this.events=[];this.stepAt=0;this.laserHit=false;}
    emit(type){if(this.events.length<40)this.events.push({type,x:this.player.x,y:this.player.y});}
    noteSpotted(){this.spottedNow=true;}
    triggerAlarm(){this.alarm=10;this.noteSpotted();this.emit('alarm');for(const guard of this.guards){if(guard.state==='distracted'||guard.blind>0)continue;guard.state='alert';guard.timer=0;guard.lastKnown={x:this.player.x,y:this.player.y};}}
    catch(){if(this.status!=='playing')return;this.status='caught';this.emit('caught');}
    get exitOpen(){return this.cheeseCount===this.cheese.length&&(!this.level.boss||this.evades>=4);}
    update(input={},dt=1/60){
      if(this.status!=='playing'||!Number.isFinite(dt)||dt<=0)return;
      if(input.cycle&&this.player.tools.length)this.player.selected=(this.player.selected+1)%this.player.tools.length;
      if(input.use)K.useTool(this);
      for(let left=Math.min(.1,dt);left>1e-8&&this.status==='playing';){const step=Math.min(1/60,left);this.tick(input,step);left-=step;}
    }
    tick(input,dt){
      this.elapsed+=dt;this.spotFlash=Math.max(0,this.spotFlash-dt);this.doorFlash=Math.max(0,this.doorFlash-dt);this.spottedNow=false;K.updatePlayer(this.player,input,this.level,dt);K.updateTools(this,dt);
      for(const guard of this.guards)K.updateGuard(guard,this,dt);K.updateCameras(this,dt);
      if(this.spottedNow){if(this.elapsed-this.lastSpotted>.75){this.spotted++;this.spotFlash=.6;this.emit('spotted');}this.lastSpotted=this.elapsed;}
      for(const cheese of this.cheese)if(!cheese.taken&&K.distance(this.player,cheese)<20){cheese.taken=true;this.cheeseCount++;this.emit('pickup');if(this.cheeseCount===this.cheese.length){this.emit('door');this.doorFlash=2;this.message=this.exitOpen?'All cheese! Reach the green exit.':'All cheese! Distract the hunter four times to unlock the exit.';}}
      if(Math.hypot(this.player.vx,this.player.vy)>20&&this.player.paws<=0&&this.elapsed-this.stepAt>(this.player.sprinting?.2:.3)){this.stepAt=this.elapsed;this.emit(this.player.sprinting?'sprint':'footstep');}
      if(this.status==='playing'&&this.exitOpen&&K.distance(this.player,this.level.exit)<22){this.status='won';const time=Math.max(1,Math.round(this.elapsed*1000)),stars=this.spotted===0&&time<=this.level.parTime?3:this.spotted<=1?2:1;this.result={time,stars,spotted:this.spotted,tools:this.toolsUsed};this.emit('escape');}
    }
  }
  return{HeistGame};
});
