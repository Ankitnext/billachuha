((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?{...require('./physics.js'),...require('./levels.js')}:root.TrapEscape);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,T=>{
  class EscapeSave{
    constructor(raw={}){this.version=1;this.stars={};this.bestTimes={};this.bestCombos={};this.deaths=T.integer(raw?.deaths);this.trapsUsed=T.integer(raw?.trapsUsed);
      for(const level of T.LEVELS){const id=level.id,stars=T.integer(raw?.stars?.[id],3);if(stars>0){this.stars[id]=stars;const time=T.integer(raw?.bestTimes?.[id],3600000);if(time>0)this.bestTimes[id]=time;this.bestCombos[id]=T.integer(raw?.bestCombos?.[id],99);}}
      this.recompute();
    }
    recompute(){this.totalStars=Object.values(this.stars).reduce((a,b)=>a+b,0);this.worldsCleared=[0,1,2,3,4].filter(w=>T.LEVELS.slice(w*10,w*10+10).every(l=>this.stars[l.id]>0)).map(w=>w+1);this.currentLevel=this.nextPlayable()+1;}
    worldStars(world){return T.LEVELS.slice(world*10,world*10+10).reduce((sum,l)=>sum+(this.stars[l.id]||0),0);}
    worldUnlocked(world){return world===0||this.worldStars(world-1)>=15&&(this.stars[`${world}-10`]||0)>0;}
    unlocked(index){const level=T.LEVELS[index];return!!level&&this.worldUnlocked(level.world)&&(level.number===1||(this.stars[T.LEVELS[index-1].id]||0)>0);}
    nextPlayable(){for(let i=0;i<50;i++)if(this.unlocked(i)&&!this.stars[T.LEVELS[i].id])return i;for(let i=49;i>=0;i--)if(this.unlocked(i))return i;return 0;}
    complete(index,result){const level=T.LEVELS[index];if(!level||!this.unlocked(index)||!Number.isFinite(result?.time)||result.time<1||![1,2,3].includes(result.stars))return false;const id=level.id;this.stars[id]=Math.max(this.stars[id]||0,result.stars);this.bestTimes[id]=Math.min(this.bestTimes[id]||Infinity,T.integer(result.time,3600000));this.bestCombos[id]=Math.max(this.bestCombos[id]||0,T.integer(result.combo,99));this.recompute();return true;}
    campaignTime(){return T.LEVELS.every(l=>this.bestTimes[l.id]>0)?T.LEVELS.reduce((sum,l)=>sum+this.bestTimes[l.id],0):null;}
  }
  return{EscapeSave};
});
