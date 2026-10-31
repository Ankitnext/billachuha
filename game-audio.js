/* Original procedural game sounds. No samples, recordings, songs or network requests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GameAudio=api;})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  // noise duration, filter Hz, noise level, body Hz, body end Hz, body duration
  const weapons={
    pistol:[.065,2500,.22,170,55,.09], dual:[.05,3100,.18,210,65,.07],
    shotgun:[.22,1250,.5,85,28,.23], smg:[.045,3600,.14,220,85,.055],
    rifle:[.105,2300,.3,125,40,.13], sniper:[.3,1700,.42,100,26,.3],
    rocket:[.3,750,.3,65,115,.24], minigun:[.04,2900,.16,140,50,.05],
    flame:[.18,580,.21,45,38,.12], turret:[.095,1900,.3,115,35,.12]
  };
  const clamp=(value,a,b)=>Math.max(a,Math.min(b,value));
  function distanceGain(x,y,self){return self?Math.max(0,1-Math.hypot(x-self.x,y-self.y)/1000):0;}
  class SnapshotSounds {
    constructor(){this.reset();}
    reset(){this.id=null;this.time=-1;this.at=0;this.previous=null;this.eventID=0;this.shots=new Set();}
    update(world,selfID,now=Date.now(),audible=true){
      if(!world)return [];
      const mode=world.mode, time=Number(world.serverTime??(mode?.elapsed||0)*1000);
      if(this.id===world.matchId&&time<=this.time)return [];
      const first=this.id!==world.matchId||now-this.at>1000||!audible;
      const self=mode?mode.players?.find(p=>p.id===selfID):world.players?.find(p=>p.id===selfID);
      const events=[],push=(name,x=self?.x,y=self?.y,volume=1)=>{
        const gain=distanceGain(x,y,self)*volume;if(gain>.03)events.push({name,volume:gain,pan:clamp((x-self.x)/600,-1,1)});
      };
      const previous=this.previous;
      if(mode){
        for(const shot of mode.shots||[])if(!first&&shot.kind==='hook'&&!this.shots.has(shot.id))push('hook',shot.x,shot.y);
        this.shots=new Set((mode.shots||[]).map(shot=>shot.id));
        for(const e of mode.effects||[]){
          if(!first&&e.id>this.eventID){
            const names={explosion:'explosion',hit:'hit',death:'impact',pickup:'pickup',melee:'swing',jump:'jump',dash:'boost',pounce:'impact',speed:'boost',hide:'hide',bark:'bark',decoy:'decoy'};
            const name=e.kind==='muzzle'?(weapons[e.weapon]?e.weapon:'pistol'):names[e.kind];
            if(name)push(name,e.x,e.y,e.owner===selfID?1:.6);
          }
          this.eventID=Math.max(this.eventID,e.id||0);
        }
        if(!first&&self&&previous){
          if(self.reloadIn>0&&!(previous.reloadIn>0))push('reload');
          if(self.hp<previous.hp)push('hurt');
          if(self.kills>previous.kills)push('confirm');
          if(self.hp<=0&&previous.hp>0)push('death');
        }
      }else{
        let ownShot=false,ownHook=false;
        for(const shot of world.shots||[]){
          if(!first&&!this.shots.has(shot.id)){
            push(shot.kind==='hook'?'hook':'pistol',shot.x,shot.y,shot.owner===selfID?1:.55);
            if(shot.owner===selfID){ownShot||=shot.kind!=='hook';ownHook||=shot.kind==='hook';}
          }
        }
        this.shots=new Set((world.shots||[]).map(s=>s.id));
        const status=world.self;
        if(!first&&status&&previous){
          if(status.health<previous.health)push('hurt');
          if(status.health>previous.health+5)push('pickup');
          if(status.ammo>previous.ammo)push('reload');
          if(status.primaryReadyInMs>previous.primaryReadyInMs+100){
            if(status.role==='rat')push('jump');else if(status.role==='cat')push('boost');else if(!ownShot&&status.ammo<previous.ammo)push('pistol');
          }
          if(status.secondaryReadyInMs>previous.secondaryReadyInMs+100&&!(status.role==='dog'&&ownHook))push(({rat:'decoy',cat:'hide',dog:'hook'})[status.role]);
        }
      }
      if(!first&&world.ended&&!previous?.ended)push('round');
      this.id=world.matchId;this.time=time;this.at=now;
      this.previous={...(mode?self:world.self),ended:world.ended};
      return events;
    }
  }
  class Sound {
    constructor(options={}){
      this.key=options.key||'billa.sound.v1';this.enabled=true;this.context=null;this.master=null;this.noise=null;
      this.active=new Set();this.last=new Map();this.buttons=[];this.tracker=new SnapshotSounds();
      try{this.enabled=localStorage.getItem(this.key)!=='off';}catch(_){}
      if(typeof document!=='undefined'){
        for(const name of ['pointerdown','keydown'])document.addEventListener(name,()=>{if(this.enabled)this.unlock();},{capture:true});
        document.addEventListener('visibilitychange',()=>{if(document.hidden)this.silence();this.tracker.reset();});
        window.addEventListener('blur',()=>{this.silence();this.tracker.reset();});
        window.addEventListener('pagehide',()=>this.silence());
      }
    }
    async unlock(){
      if(!this.enabled)return false;
      try{
        if(!this.context){
          const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;
          const c=this.context=new Context(),master=this.master=c.createGain(),compressor=c.createDynamicsCompressor();
          master.gain.value=.32;compressor.threshold.value=-16;compressor.knee.value=16;compressor.ratio.value=6;
          master.connect(compressor);compressor.connect(c.destination);
          this.noise=c.createBuffer(1,c.sampleRate,c.sampleRate);const data=this.noise.getChannelData(0);
          for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
        }
        if(this.context.state==='suspended')await this.context.resume();
        return this.context.state==='running';
      }catch(_){return false;}
    }
    set(enabled){
      this.enabled=!!enabled;this.tracker.reset();this.last.clear();
      try{localStorage.setItem(this.key,this.enabled?'on':'off');}catch(_){}
      if(this.enabled)this.unlock();else this.silence();this.labels();
    }
    bind(nodes){
      this.buttons=nodes.filter(Boolean);
      for(const button of this.buttons)button.addEventListener('click',async()=>{this.set(!this.enabled);if(this.enabled&&await this.unlock())this.play('pickup');});
      this.labels();return this;
    }
    labels(){for(const button of this.buttons){button.textContent=this.enabled?'Sound on':'Sound off';button.setAttribute('aria-pressed',String(this.enabled));button.setAttribute('aria-label',this.enabled?'Mute game sounds':'Enable game sounds');}}
    silence(){for(const source of this.active){try{source.stop();}catch(_){}}this.active.clear();}
    reset(){this.silence();this.tracker.reset();this.last.clear();}
    observe(world,selfID){
      for(const event of this.tracker.update(world,selfID,Date.now(),this.enabled&&typeof document!=='undefined'&&!document.hidden))this.play(event.name,event);
    }
    play(name,options={}){
      const c=this.context;
      if(!this.enabled||!c||c.state!=='running'||(typeof document!=='undefined'&&document.hidden)||this.active.size>=28)return false;
      const now=c.currentTime,interval=weapons[name] ? .04 : .065;
      if(now-(this.last.get(name)??-100)<interval)return false;
      this.last.set(name,now);
      const volume=clamp(Number.isFinite(options.volume)?options.volume:1,0,1),pan=clamp(options.pan||0,-1,1);
      const voice=(source,duration,level,delay=0,filterHz=0)=>{
        if(this.active.size>=32)return;
        const gain=c.createGain(),at=now+delay,nodes=[source,gain];let tail=source;
        if(filterHz){const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=filterHz;source.connect(filter);tail=filter;nodes.push(filter);}
        tail.connect(gain);gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(Math.max(.0001,level*volume),at+.003);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
        if(c.createStereoPanner){const panner=c.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(this.master);nodes.push(panner);}else gain.connect(this.master);
        this.active.add(source);source.onended=()=>{this.active.delete(source);for(const node of nodes)node.disconnect();};source.start(at);source.stop(at+duration+.01);
      };
      const tone=(hz,end,duration,level=.16,type='sine',delay=0)=>{const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(hz,now+delay);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+delay+duration);voice(o,duration,level,delay);};
      const noise=(duration,hz,level=.24,delay=0)=>{const source=c.createBufferSource();source.buffer=this.noise;voice(source,duration,level,delay,hz);};
      try{
        const w=weapons[name];
        if(w){noise(w[0],w[1],w[2]);tone(w[3],w[4],w[5],name==='shotgun'?.38:.19);
          if(name==='shotgun'){noise(.055,2800,.12,.16);tone(650,180,.04,.05,'triangle',.18);}
          if(name==='dual')noise(.04,3100,.14,.045);
          return true;
        }
        if(name==='explosion'){noise(.65,800,.55);tone(70,23,.5,.38);return true;}
        if(name==='reload'){noise(.035,3500,.11);noise(.045,2200,.14,.15);tone(700,350,.035,.06,'triangle',.18);return true;}
        if(['hit','hurt','impact','swing','bark','hook'].includes(name)){
          const spec={hit:[.06,1600,180,55],hurt:[.14,900,110,35],impact:[.18,700,80,28],swing:[.09,1700,300,100],bark:[.2,600,140,70],hook:[.13,3100,750,160]}[name];
          noise(spec[0],spec[1],.2);tone(spec[2],spec[3],spec[0],.18);return true;
        }
        const notes={jump:[220,650,.16],boost:[130,600,.2],hide:[700,100,.23],decoy:[320,780,.2],pickup:[650,1100,.12],gem:[900,1400,.08],confirm:[550,850,.1],death:[170,30,.45],round:[440,660,.24],boss:[90,35,.35],door:[550,900,.18],buy:[620,1050,.12],empty:[150,100,.035]};
        const spec=notes[name];if(!spec)return false;tone(...spec,.13,'triangle');
        if(name==='round'){tone(550,550,.2,.1,'triangle',.12);tone(880,880,.3,.1,'sine',.24);}
        return true;
      }catch(_){return false;}
    }
  }
  let legacySound;
  return {create:options=>new Sound(options),legacy:()=>legacySound||=new Sound({key:'arcade.'+location.pathname+'.sound.v1'}),Sound,SnapshotSounds,weapons,distanceGain};
});
