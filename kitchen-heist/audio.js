((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist,api);})(globalThis,()=>{
  class HeistAudio{
    constructor(buttons){this.sound=typeof window!=='undefined'?window.GameAudio?.create({key:'kitchen-heist.sound.v1'}).bind(buttons):null;}
    play(event){if(event.type==='alarm'){this.alarm();return;}const name={footstep:'empty',sprint:'hit',pickup:'gem',alert:'confirm',chase:'boss',caught:'impact',escape:'round',decoy:'decoy',smoke:'swing',hole:'hide',paws:'pickup',door:'reload',evade:'confirm'}[event.type];if(name)this.sound?.play(name,{volume:event.type==='footstep'?.18:event.type==='sprint'?.25:.8});}
    alarm(){const sound=this.sound,c=sound?.context;if(!sound?.enabled||!c||c.state!=='running'||sound.active.size>24||document.hidden)return;const at=c.currentTime;if(at-(sound.last.get('heist-alarm')??-10)<1)return;sound.last.set('heist-alarm',at);try{const o=c.createOscillator(),gain=c.createGain();o.type='triangle';o.frequency.setValueAtTime(660,at);for(let i=1;i<=4;i++)o.frequency.linearRampToValueAtTime(i%2?980:660,at+i*.22);gain.gain.setValueAtTime(.07,at);gain.gain.exponentialRampToValueAtTime(.0001,at+1);o.connect(gain);gain.connect(sound.master);sound.active.add(o);o.onended=()=>{sound.active.delete(o);o.disconnect();gain.disconnect();};o.start(at);o.stop(at+1);}catch(_){/* Audio never blocks play. */}}
    silence(){this.sound?.silence();}
  }
  return{HeistAudio};
});
