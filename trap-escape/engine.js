((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?Object.assign({},...['physics','recorder','level','player','cat','traps-drop','traps-env','particles','machinery'].map(n=>require('./'+n+'.js'))):root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  function starsFor({elapsed,parMs,stuns,bestCombo,targetStuns}){return stuns>=targetStuns||elapsed*1000<=parMs||bestCombo>=3?3:stuns>0?2:1;}
  class EscapeGame{
    constructor(index=0){this.index=index;this.retries=0;this.attempt=0;this.events=[];this.effects=new T.CartoonParticles();this.reset();}
    reset(){this.level=T.loadLevel(this.index);this.player=T.createPlayer(this.level);this.cat=new T.Chaser(this.level);this.recorder=new T.PathRecorder();this.recorder.record(this.player,0);this.phase='ready';this.frame=0;this.elapsed=0;this.failTime=0;this.inventory=[];this.selected=0;this.drops=[];this.combo=0;this.comboUntil=0;this.bestCombo=0;this.trapsUsed=0;this.prevDrop=false;this.prevCycle=false;this.texts=[];this.attempt++;this.message=this.level.hint;this.result=null;this.effects.pool.forEach(p=>p.life=0);}
    emit(type,data={}){if(this.events.length<40)this.events.push({type,...data});}
    burst(x,y,color,count){this.effects.burst(x,y,color,count);}
    text(text,x,y,color){this.texts.push({text,x,y,color,life:1.2});if(this.texts.length>12)this.texts.shift();}
    hitCat(trap){return T.trapHit(this,trap);}
    win(reason){if(this.phase!=='playing')return;this.phase='won';if(reason==='traps'){this.cat.state='defeated';this.cat.active=null;this.cat.queue=[];this.cat.y=this.cat.baseY;}
      this.result={reason,time:Math.round(this.elapsed*1000),stuns:this.cat.stuns,combo:this.bestCombo,deaths:this.retries,traps:this.trapsUsed,stars:starsFor({elapsed:this.elapsed,parMs:this.level.parMs,stuns:this.cat.stuns,bestCombo:this.bestCombo,targetStuns:this.level.targetStuns})};this.emit('win',{reason});this.burst(this.player.x,this.player.y,'#e4ce73',40);this.message=reason==='traps'?'The Cat gives up!':'Escaped through the door!';}
    fail(reason){if(this.phase!=='playing')return;this.phase='failed';this.failTime=.42;this.retries++;this.player.caught=true;this.result={reason};this.message=reason;this.emit('fail',{reason});this.burst(this.player.x,this.player.y,'#c8d5b6',15);}
    step(input={}){
      const dt=T.RULES.dt;this.effects.update(dt);for(const text of this.texts){text.life-=dt;text.y-=22*dt;}this.texts=this.texts.filter(t=>t.life>0);
      if(this.phase==='won')return;
      if(this.phase==='failed'){this.failTime-=dt;if(this.failTime<=0){this.reset();this.prevDrop=!!input.drop;this.prevCycle=!!input.cycle;this.player.prevJump=!!input.jump;this.emit('retry');}return;}
      if(this.phase==='ready'){if(!input.x&&!input.jump&&!(input.drop&&this.inventory.length))return;this.phase='playing';this.emit('start');}
      this.elapsed+=dt;this.frame++;
      T.advanceMachinery(this,dt);if(this.phase!=='playing')return;
      const oldCenter=this.player.x+this.player.w/2,movement=T.movePlayer(this.player,input,this.level,dt);
      if(movement.jumped)this.emit('jump');if(movement.landed){this.emit('land');this.burst(this.player.x+14,this.player.y+40,'#cbd4b7',7);}
      T.collectItems(this);
      if(input.cycle&&!this.prevCycle)T.cycleItem(this);this.prevCycle=!!input.cycle;
      if(input.drop&&!this.prevDrop)T.dropItem(this);this.prevDrop=!!input.drop;
      this.recorder.record(this.player,this.frame);this.cat.update(this,dt);
      T.updateEnvironment(this,dt,oldCenter);T.updateMachinery(this,dt,oldCenter);T.updateDrops(this,dt);
      for(const h of this.level.hazards){if(T.overlap(this.player,h))this.fail('Hot floor! Jump over the marked lava.');if(!h.catHit&&this.cat.state!=='waiting'&&T.overlap(this.cat,h)){h.catHit=true;this.hitCat({type:'steam',x:h.x,y:h.y});}}
      if(this.phase!=='playing')return;
      if(this.player.y>this.level.height+40){this.fail('Missed the landing. Try that jump again.');return;}
      if(!this.cat.stunned&&this.cat.grace<=0&&this.cat.state!=='waiting'&&T.overlap(this.player,this.cat)){this.fail('Caught! One more try.');return;}
      if(T.overlap(this.player,this.level.door)){
        if(!this.level.boss)this.win('exit');else this.message=`Boss exit locked: ${this.cat.stuns} / 4 traps · best chain ${this.bestCombo}× / 2×.`;
      }
      if(this.elapsed>this.comboUntil)this.combo=0;
    }
  }
  return{EscapeGame,starsFor};
});
