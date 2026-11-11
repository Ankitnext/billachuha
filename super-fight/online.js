/* Authenticated human matchmaking; combat snapshots are calculated by Go. */
(() => {
 'use strict';
 const S=window.SuperFight;
 class FightOnline {
  constructor(hooks){this.hooks=hooks;this.room=null;this.socket=null;this.generation=0;this.sequence=0;this.me=null;this.retry=0;this.received=0;this.active=false;this.fighter='blaze';this.timer=setInterval(()=>this.pulse(),50);this.heartbeat=0;}
  get app(){return location.pathname==='/multiplayer/app';}
  get base(){return (window.BILLACHUHA_CONFIG?.backendUrl||location.origin).replace(/\/$/,'');}
  get live(){return this.socket?.readyState===1&&performance.now()-this.received<1500;}
  async api(path,body,keepalive=false){
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
   try{const response=await fetch(this.base+path,{method:body===undefined?'GET':'POST',credentials:'include',headers:{[this.app?'X-Chase-App':'X-Chase-Web']:'1',...(body===undefined?{}:{'Content-Type':'application/json'})},signal:controller.signal,keepalive,...(body===undefined?{}:{body:JSON.stringify(body)})});
    const data=await response.json();if(!response.ok){const error=Error(data.error?.message||'The game server is unavailable.');error.status=response.status;throw error;}return data;
   }finally{clearTimeout(timeout);}
  }
  async find(fighter){
   if(window.BILLACHUHA_CONFIG?.offline){location.assign('https://appassets.androidplatform.net/online-super-fight');return;}
   if(this.active)return;
   this.active=true;this.suspended=false;this.fighter=fighter;const generation=++this.generation;
   this.hooks.status('Connecting to online matchmaking…');
   try{
    const session=await this.api(this.app?'/auth/me':'/auth/web/session');if(generation!==this.generation)return;this.me=session.user;
    const {room}=await this.api('/api/v1/matchmaking',{game:'super-fight',fighter});
    if(generation!==this.generation){await this.api('/api/v1/rooms/'+room.code+'/leave',{});return;}
    this.room=room;this.hooks.room(room,this.me);await this.connect(generation);
   }catch(error){if(generation!==this.generation)return;this.active=false;this.hooks.error(error);}
  }
  async login(email,password){await this.api('/auth/web/login',{email,password});}
  async connect(generation){
   if(generation!==this.generation||!this.room||this.suspended)return;
   const ticket=await this.api('/api/v1/rooms/'+this.room.code+'/ticket',{});
   if(generation!==this.generation||this.suspended)return;
   const socket=new WebSocket(this.base.replace(/^http/,'ws')+ticket.path+'?ticket='+encodeURIComponent(ticket.ticket));this.socket=socket;this.sequence=0;
   socket.onopen=()=>{this.retry=0;};
   socket.onmessage=event=>{
    if(generation!==this.generation||this.suspended||this.socket!==socket)return;
    const data=JSON.parse(event.data);this.received=performance.now();
    if(data.room){this.room=data.room;this.hooks.room(data.room,this.me);}
    if(data.match?.fight)this.hooks.state(data.match.fight,this.me);
   };
   socket.onclose=()=>{
    if(generation!==this.generation||this.suspended||this.socket!==socket)return;
    this.hooks.status('Connection lost. Reconnecting…');
    clearTimeout(this.reconnect);this.reconnect=setTimeout(()=>this.connect(generation).catch(error=>{if(generation===this.generation){this.hooks.error(error);this.active=false;}}),Math.min(4000,500*2**this.retry++));
   };
  }
  pulse(){
   if(!this.active||!this.room||this.suspended)return;
   if(this.room.state==='waiting'&&performance.now()-this.heartbeat>8000){
    this.heartbeat=performance.now();const generation=this.generation;
    this.api('/api/v1/matchmaking',{game:'super-fight',fighter:this.fighter}).then(({room})=>{if(generation===this.generation){this.room=room;this.hooks.room(room,this.me);}}).catch(error=>{if(generation===this.generation)this.hooks.status(error.message);});
   }
   if(this.socket?.readyState!==1||this.room.state!=='running')return;
   const input=this.hooks.input();this.socket.send(JSON.stringify({type:'player.input',sequence:this.sequence++,fight:input}));
  }
  release(){if(this.socket?.readyState===1&&this.room?.state==='running')this.socket.send(JSON.stringify({type:'player.input',sequence:this.sequence++,fight:{...S.neutral(),cancel:true}}));}
  suspend(){this.release();this.suspended=true;clearTimeout(this.reconnect);const socket=this.socket;this.socket=null;socket?.close();}
  resume(){if(!this.suspended)return;this.suspended=false;if(this.active&&this.room)this.connect(this.generation).catch(error=>this.hooks.error(error));}
  async leave(){
   ++this.generation;this.active=false;clearTimeout(this.reconnect);this.release();this.socket?.close();this.socket=null;
   if(this.room){try{await this.api('/api/v1/rooms/'+this.room.code+'/leave',{});}catch(error){if(error.status!==404&&error.status!==403)throw error;}this.room=null;}
  }
 }
 S.FightOnline=FightOnline;
})();
