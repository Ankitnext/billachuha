((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./levels.js'):root.KitchenHeist);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,K=>{
  const SAVE_KEY='billachuha_kitchen_heist_v1';
  const integer=(n,max=10000000)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
  class HeistSave{
    constructor(raw={}){this.version=1;this.stars={};this.bestTimes={};this.spottedCounts={};this.deaths=integer(raw?.deaths);this.toolsUsed=integer(raw?.toolsUsed);
      for(const level of K.LEVELS){const id=level.id,stars=integer(raw?.stars?.[id],3),time=integer(raw?.bestTimes?.[id],3600000);if(stars&&time){this.stars[id]=stars;this.bestTimes[id]=time;this.spottedCounts[id]=integer(raw?.spottedCounts?.[id],10000);}}
    }
    worldStars(world){return K.LEVELS.slice(world*10,world*10+10).reduce((n,l)=>n+(this.stars[l.id]||0),0);}
    worldUnlocked(world){return world===0||world>0&&world<5&&this.worldStars(world-1)>=15&&!!this.stars[`${world}-10`];}
    unlocked(index){const level=K.LEVELS[index];return !!level&&this.worldUnlocked(level.world)&&(level.number===1||!!this.stars[K.LEVELS[index-1].id]);}
    nextPlayable(){for(let i=0;i<50;i++)if(this.unlocked(i)&&!this.stars[K.LEVELS[i].id])return i;for(let i=49;i>=0;i--)if(this.unlocked(i))return i;return 0;}
    complete(index,result){const level=K.LEVELS[index];if(!level||!this.unlocked(index)||![1,2,3].includes(result?.stars)||!Number.isFinite(result.time)||result.time<=0)return false;const id=level.id;this.stars[id]=Math.max(this.stars[id]||0,result.stars);this.bestTimes[id]=Math.min(this.bestTimes[id]||Infinity,integer(result.time,3600000));this.spottedCounts[id]=Math.min(this.spottedCounts[id]??Infinity,integer(result.spotted,10000));return true;}
    get totalStars(){return Object.values(this.stars).reduce((a,b)=>a+b,0);}
    campaignTime(){return K.LEVELS.every(l=>this.bestTimes[l.id])?K.LEVELS.reduce((n,l)=>n+this.bestTimes[l.id],0):null;}
  }
  return{HeistSave,SAVE_KEY};
});
