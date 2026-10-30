((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./physics.js'):root.SuperFight);if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.SuperFight,api);})(globalThis,S=>{
  const DIFFICULTIES=Object.freeze({easy:{reaction:.4,aggression:.52,defense:.2},normal:{reaction:.2,aggression:.7,defense:.52},hard:{reaction:.1,aggression:.85,defense:.78},impossible:{reaction:.05,aggression:.97,defense:.94}});
  class SuperBot{
    constructor(difficulty='normal',random=Math.random,level=1){if(!DIFFICULTIES[difficulty])throw Error('Choose a bot difficulty.');this.level=Math.max(1,Math.min(50,Math.floor(level)||1));const base=DIFFICULTIES[difficulty],n=this.level-1;this.spec={reaction:Math.max(.035,base.reaction/(1+n*.12)),aggression:Math.min(.99,base.aggression+n*.018),defense:Math.min(.97,base.defense+n*.025)};this.difficulty=difficulty;this.random=random;this.next=0;this.decision=S.neutral();this.bias=.85+random()*.3;this.beamUntil=0;}
    input(game,f,target){
      if(f.ko||target.ko)return S.neutral();
      if(game.time>=this.next){this.next=game.time+this.spec.reaction;const dx=S.center(target).x-S.center(f).x,dy=S.center(target).y-S.center(f).y,range=Math.abs(dx),a=this.spec.aggression*this.bias,d=S.neutral();
        d.x=range>75?Math.sign(dx):range<42?-Math.sign(dx):0;
        d.y=dy<-75?-1:dy>170?1:0;
        if(f.grounded&&range<160&&target.attack&&this.random()<this.spec.defense)d.y=-1;
        if(range<115&&Math.abs(dy)<130&&this.random()<a){d.attack=true;if(target.y+target.h<f.y+40)d.y=-1;else if(this.random()<.23)d.y=1;}
        const danger=target.charging&&target.charge>.25||game.beams.some(b=>b.owner!==f.id)||game.projectiles.some(b=>b.owner!==f.id&&Math.abs(b.x-f.x)<250);
        if(danger&&this.random()<this.spec.defense){d.block=true;d.x=0;if(f.energy>45&&target.charging)d.sp2=true;}
        if(f.receivedHits>=5&&f.energy>=25&&this.difficulty!=='easy'){d.tap2=true;d.attack=false;}
        else if(range>500&&f.energy>45&&this.random()<a*.5){d.dashX=Math.sign(dx);if(dy<-180)d.dashY=-1;}
        if(range>190&&range<1000&&Math.abs(dy)<75&&f.energy>=20&&this.random()<a*.7)d.tap1=true;
        if(range>300&&Math.abs(dy)<80&&f.energy>=55&&this.random()<a*.12){this.beamUntil=game.time+f.spec.charge+.08;}
        if(range<130&&dy<-45&&f.energy>35&&this.random()<a*.6){d.y=-1;d.tap1=true;}
        if(!f.grounded&&dy>100&&range<180&&f.energy>=35&&this.random()<a*.4){d.y=1;d.tap2=true;}
        if(this.beamUntil>game.time){d.sp1=true;d.tap1=false;d.y=0;d.x=0;d.attack=false;}
        this.decision=d;
      }
      const result={...this.decision};this.decision.tap1=this.decision.tap2=false;this.decision.dashX=this.decision.dashY=0;return result;
    }
  }
  return{DIFFICULTIES,SuperBot};
});
