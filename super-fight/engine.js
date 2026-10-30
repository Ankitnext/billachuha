((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?Object.assign({},...['physics','fighter','combat','powers','particles','bot'].map(name=>require('./'+name+'.js'))):root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  class Match{
    constructor({mode='solo',characters=['blaze','shadow'],difficulty='normal',level=1,seed=Date.now()}={}){
      if(!['solo','local'].includes(mode)||characters.length!==2)throw Error('Choose Solo or Local 2 Player.');
      for(const key of characters)if(!S.CHARACTERS[key])throw Error('Choose a fighter.');
      if(!S.DIFFICULTIES[difficulty])throw Error('Choose a bot difficulty.');
      if(!Number.isInteger(level)||level<1||level>50)throw Error('Choose a level from 1 to 50.');this.level=level;
      this.mode=mode;this.characters=[...characters];this.difficulty=difficulty;this.random=S.random(seed);this.wins=[0,0];this.roundNumber=1;this.history=[];
      this.effects=new S.Particles(this.random);this.events=[];this.time=0;this.nextRound();
    }
    nextRound(){
      if(this.wins.some(w=>w>=2))return false;
      this.roundNumber=this.wins[0]+this.wins[1]+1;this.fighters=this.characters.map((key,id)=>new S.Fighter(id,key));
      this.bot=new S.SuperBot(this.difficulty,this.random,Math.min(50,this.level+this.roundNumber-1));this.remaining=S.RULES.roundTime;this.phase='intro';this.intro=1.2;
      this.projectiles=[];this.beams=[];this.waves=[];this.texts=[];this.clash=null;this.hitstop=0;this.shake=0;this.flash=0;this.roundResult=null;this.effects.clear();this.events=[];
      this.emit('round');return true;
    }
    emit(type,f){if(this.events.length<60)this.events.push({type,player:f?.id??-1});}
    impact(x,y,color,count=25){this.effects.emit(x,y,color,count);}
    text(text,x,y,color){this.texts.push({text,x,y,color,life:1});if(this.texts.length>15)this.texts.shift();}
    clearControls(){for(const f of this.fighters)S.cancelCharge(f);}
    finishRound(reason){
      if(!['fight','intro'].includes(this.phase))return;
      const [a,b]=this.fighters,ratioA=a.hp/a.maxHp,ratioB=b.hp/b.maxHp;
      const winner=a.ko&&b.ko?null:a.ko?1:b.ko?0:Math.abs(ratioA-ratioB)<.0001?null:ratioA>ratioB?0:1;
      if(winner!==null)this.wins[winner]++;
      this.roundResult={winner,reason,number:this.roundNumber,stats:this.fighters.map(f=>({damage:Math.round(f.damageDealt),maxCombo:f.maxCombo,hp:Math.round(f.hp)}))};this.history.push(this.roundResult);
      this.phase=this.wins.some(n=>n===2)?'matchover':'roundover';this.clearControls();this.emit(winner===null?'draw':'win');
    }
    step(inputs=[S.neutral(),S.neutral()]){
      const dt=S.RULES.dt;
      this.effects.update(dt);for(const text of this.texts){text.life-=dt;text.y-=20*dt;}this.texts=this.texts.filter(t=>t.life>0);
      for(const wave of this.waves)wave.life-=dt;this.waves=this.waves.filter(w=>w.life>0);
      for(const f of this.fighters){for(const image of f.afterimages)image.life-=dt;f.afterimages=f.afterimages.filter(i=>i.life>0).slice(-16);}
      this.shake=Math.max(0,this.shake-dt);this.flash=Math.max(0,this.flash-dt);if(this.clash){this.clash.life-=dt;if(this.clash.life<=0)this.clash=null;}
      if(this.phase==='intro'){this.intro-=dt;if(this.intro<=0){this.phase='fight';this.emit('fight');}return;}
      if(this.phase!=='fight')return;
      if(this.hitstop>0){this.hitstop=Math.max(0,this.hitstop-dt);return;}
      this.time+=dt;this.remaining=Math.max(0,this.remaining-dt);
      const normalized=[0,1].map(id=>({...S.neutral(),...inputs[id]}));if(this.mode==='solo')normalized[1]=this.bot.input(this,this.fighters[1],this.fighters[0]);
      for(const f of this.fighters){
        const input=normalized[f.id],other=this.fighters[1-f.id];f.timers(dt);
        if(this.time>f.comboUntil)f.combo=0;if(this.time>f.receivedUntil)f.receivedHits=0;
        f.block=!!input.block&&f.canAct();
        if(!f.attack&&!f.block&&!f.shield&&!f.charging&&f.stun<=0)f.face=S.center(other).x>S.center(f).x?1:-1;
        S.powers(this,f,input,dt);S.melee(this,f,input);S.physics(this,f,input,dt);
        if(f.dashTime>0&&f.afterimages.length<8)f.afterimages.push({x:f.x,y:f.y,face:f.face,state:'fly',life:.13});
        if(f.flying&&Math.floor(this.time*60)%3===0)this.effects.emit(f.x+f.w/2,f.y+f.h,f.color,2,70);
      }
      const [a,b]=this.fighters;
      if(S.overlap(a,b)&&!a.dashTime&&!b.dashTime&&!a.attack?.kind?.includes('pound')&&!b.attack?.kind?.includes('pound')){
        const dx=S.center(a).x-S.center(b).x,amount=(a.w+b.w)/2-Math.abs(dx);if(amount>0){const shift=(dx>=0?1:-1)*amount/2;a.x=S.clamp(a.x+shift,0,S.RULES.width-a.w);b.x=S.clamp(b.x-shift,0,S.RULES.width-b.w);}
      }
      S.resolveMelee(this,dt);S.resolvePowers(this,dt);
      if(a.ko||b.ko)this.finishRound('K.O.');else if(this.remaining<=0)this.finishRound('TIME UP');
    }
  }
  return{Match};
});
