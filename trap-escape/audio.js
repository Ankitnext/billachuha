(() => {
 'use strict';
 class EscapeAudio {
  constructor(){this.enabled=false;this.context=null;this.lastStep=0;}
  unlock(){try{this.context||=new (window.AudioContext||window.webkitAudioContext)();this.context.resume().catch(()=>{});}catch{this.enabled=false;}}
  tone(hz,duration=.12,type='sine',volume=.07,delay=0,end=hz){if(!this.enabled)return;this.unlock();const c=this.context;if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+duration+.02);}
  play(e){if(!this.enabled)return;switch(e.type){
   case 'jump':this.tone(250,.16,'sine',.05,0,650);break;
   case 'land':this.tone(100,.05,'triangle',.035);break;
   case 'pickup':this.tone(700,.1,'sine');this.tone(1000,.12,'sine',.04,.07);break;
   case 'drop':this.tone(340,.08,'triangle',.05,0,180);break;
   case 'lever':this.tone(140,.09,'square',.025);break;
   case 'machine-trigger':this.tone(180,.11,'triangle',.045,0,110);break;
   case 'machine-impact':this.tone(95,.18,'triangle',.075,0,40);break;
   case 'firecracker':this.tone(85,.3,'sawtooth',.04,0,25);break;
   case 'trap-hit':{
    const metal=['bucket','magnet','wire'].includes(e.trap),hz=metal?900:e.trap==='mousetrap'?550:180;
    this.tone(hz,.28,metal?'triangle':'sine',.08,0,metal?250:700);
    if(e.combo>1){this.tone(440*Math.pow(1.18,e.combo),.16,'sine',.08,.12);this.tone(660*Math.pow(1.12,e.combo),.15,'sine',.05,.2);}break;
   }
   case 'fail':this.tone(300,.3,'triangle',.06,0,90);break;
   case 'win':[440,554,659,880,1108].forEach((n,i)=>this.tone(n,.2,'sine',.07,i*.09));break;
  }}
 }
 window.TrapEscape.EscapeAudio=EscapeAudio;
})();
