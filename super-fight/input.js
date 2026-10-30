(() => {
  'use strict';
  const maps=[{left:'KeyA',right:'KeyD',up:'KeyW',down:'KeyS',attack:'KeyF',sp1:'KeyG',sp2:'KeyH',block:'ShiftLeft'},{left:'ArrowLeft',right:'ArrowRight',up:'ArrowUp',down:'ArrowDown',attack:'KeyL',sp1:'KeyK',sp2:'KeyJ',block:'ShiftRight'}];
  class FightInput{
    constructor({enabled,onPause,onCancel}){
      this.enabled=enabled;this.onCancel=onCancel;this.keys=new Set();this.touch=[{},{}];this.latch=[{},{}];this.axes=[{x:0,y:0},{x:0,y:0}];this.dashes=[{x:0,y:0},{x:0,y:0}];this.lastTap=[{},{}];this.sticks=[];

 this.settings=window.ControlSettings?.create({key:'super-fight.controls.v1',title:'Super Fighting Arena',
 actions:[...maps.flatMap((map,id)=>Object.entries(map).map(([action,code])=>({id:code,label:'Player '+(id+1)+' · '+({up:'Jump / Fly',down:'Fast fall',left:'Left',right:'Right',attack:'Attack',sp1:'Special 1',sp2:'Special 2',block:'Block'}[action]),codes:[code]}))),{id:'pause',label:'Pause',codes:['KeyP']}],
 hud:[...['one','two'].map((name,id)=>({id:'stick-'+name,label:'P'+(id+1)+' Move',stick:true})),...Array.from(document.querySelectorAll('[data-player][data-action]')).map(button=>{button.id='fight-'+button.dataset.player+'-'+button.dataset.action;return{id:button.id,label:'P'+(Number(button.dataset.player)+1)+' '+button.dataset.action};})],
 note:'Both players share this keyboard. Each key can control one action. Combat pauses while settings are open.',
 onOpen:()=>this.reset(),onClose:()=>this.reset(),onRelease:()=>this.reset()
 });
 document.getElementById('edit-hud').addEventListener('click',()=>this.settings?.open('hud'));
 document.getElementById('edit-keys').addEventListener('click',()=>this.settings?.open('keys'));

      const codes=new Set(maps.flatMap(Object.values));
      document.addEventListener('keydown',e=>{
        if(this.settings?.editing||e.ctrlKey||e.metaKey||e.altKey||!enabled()||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName))return;
        const resolved=this.settings?this.settings.resolve(e.code):e.code;
        if(e.code==='Escape'||resolved==='pause'||(!this.settings&&e.code==='KeyP')){e.preventDefault();if(!e.repeat)onPause();return;}
        if(!codes.has(resolved))return;e.preventDefault();if(this.settings)this.settings.updateKeys(e,this.keys,true);else this.keys.add(resolved);
        if(!e.repeat)maps.forEach((map,id)=>{for(const [action,code]of Object.entries(map))if(code===resolved){if(['left','right','up','down'].includes(action))this.direction(id,action);else this.latch[id][action]=true;}});
      });
      document.addEventListener('keyup',e=>{if(this.settings)this.settings.updateKeys(e,this.keys,false);else this.keys.delete(e.code);});
      for(const [id,name]of ['one','two'].entries())this.stick(id,document.getElementById('stick-'+name),document.getElementById('thumb-'+name));
      for(const button of document.querySelectorAll('[data-player][data-action]')){
        const id=Number(button.dataset.player),action=button.dataset.action;
        button.addEventListener('pointerdown',e=>{if(!enabled()||this.touch[id][action]!==undefined||e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);this.touch[id][action]=e.pointerId;this.latch[id][action]=true;});
        for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,e=>{if(this.touch[id][action]!==e.pointerId)return;delete this.touch[id][action];if(type!=='pointerup')this.reset();});
        button.addEventListener('click',e=>{if(e.detail===0&&enabled())this.latch[id][action]=true;});
      }
      window.addEventListener('blur',()=>this.reset());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
    }
    direction(id,dir){const now=performance.now();if(this.lastTap[id][dir]!==undefined&&now-this.lastTap[id][dir]<250){this.dashes[id]={x:dir==='left'?-1:dir==='right'?1:0,y:dir==='up'?-1:dir==='down'?1:0};delete this.lastTap[id][dir];}else this.lastTap[id][dir]=now;}
    stick(id,base,thumb){
      let pointer=null,lastDir='';
      const reset=()=>{pointer=null;lastDir='';this.axes[id]={x:0,y:0};thumb.style.left='calc(50% - '+thumb.clientWidth/2+'px)';thumb.style.top='calc(50% - '+thumb.clientHeight/2+'px)';};
      const move=e=>{const b=base.getBoundingClientRect(),range=Math.max(1,(b.width-thumb.clientWidth)/2);let x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2,length=Math.hypot(x,y);if(length>range){x*=range/length;y*=range/length;}this.axes[id]={x:Math.abs(x/range)<.16?0:x/range,y:Math.abs(y/range)<.3?0:y/range};thumb.style.left=`${b.width/2+x-thumb.clientWidth/2}px`;thumb.style.top=`${b.height/2+y-thumb.clientHeight/2}px`;const axis=this.axes[id],dir=Math.max(Math.abs(axis.x),Math.abs(axis.y))<.6?'':Math.abs(axis.x)>Math.abs(axis.y)?axis.x>0?'right':'left':axis.y>0?'down':'up';if(dir&&dir!==lastDir)this.direction(id,dir);lastDir=dir;};
      base.addEventListener('pointerdown',e=>{if(pointer!==null||!this.enabled()||e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();pointer=e.pointerId;base.setPointerCapture(pointer);move(e);});
      base.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(e);}});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])base.addEventListener(type,e=>{if(e.pointerId===pointer){reset();if(type!=='pointerup')this.reset();}});
      this.sticks.push(reset);reset();
    }
    sample(){return maps.map((map,id)=>{const a=this.axes[id],press=key=>this.keys.has(map[key])||this.touch[id][key]!==undefined||!!this.latch[id][key];const value={x:Math.abs(a.x)>.16?a.x:(this.keys.has(map.right)?1:0)-(this.keys.has(map.left)?1:0),y:Math.abs(a.y)>.3?a.y:(this.keys.has(map.down)?1:0)-(this.keys.has(map.up)?1:0),attack:press('attack'),sp1:press('sp1'),sp2:press('sp2'),block:press('block'),dashX:this.dashes[id].x,dashY:this.dashes[id].y};this.latch[id]={};this.dashes[id]={x:0,y:0};return value;});}
    reset(){this.settings?.release();this.keys.clear();this.touch=[{},{}];this.latch=[{},{}];this.axes=[{x:0,y:0},{x:0,y:0}];this.dashes=[{x:0,y:0},{x:0,y:0}];this.lastTap=[{},{}];for(const reset of this.sticks)reset();this.onCancel?.();}
  }
  window.SuperFight.FightInput=FightInput;
})();
