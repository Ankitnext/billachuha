((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.TrapEscape,api);})(globalThis,()=>{
  'use strict';
  const WORLDS=Object.freeze([
    {name:'Kitchen',tag:'Under the fridge, over the trouble.',theme:'kitchen',delay:90,speed:1,env:'bucket',item:'banana'},
    {name:'Garden',tag:'A little spring in your escape.',theme:'garden',delay:84,speed:1.05,env:'spring',item:'paint'},
    {name:'Rooftop',tag:'Keep your paws off the live wire.',theme:'rooftop',delay:78,speed:1.1,env:'wire',item:'magnet'},
    {name:'Sewer',tag:'Slippery shortcuts. Very long drops.',theme:'sewer',delay:72,speed:1.15,env:'pit',item:'ice'},
    {name:'Inferno',tag:'Too hot to stop. Too clever to catch.',theme:'inferno',delay:60,speed:1.2,env:'steam',item:'firecracker'}
  ]);
  const NAMES=[
    ['The first leap','Peel and run','Bring down the ceiling','Slide the floor','Pendulum prank','Piston surprise','Shutter shuffle','Elevator escape','Wrong-way belt','Kitchen contraptions'],
    ['Paint the garden','Bounce patrol','Over the hedge','Potting shed','Spring collection','Wet paint','Fence hopping','Up the trellis','Garden variety','The gardener’s revenge'],
    ['Wires and whiskers','Magnetic personality','Across the aerials','Neon footsteps','A metal medley','Sign of trouble','The narrow way','Above the skyline','Roof hopping','Midnight mayhem'],
    ['An icy welcome','Mind the hatch','Cold feet','Drip drop','Slippery business','The missing grate','Pipe dreams','Up the drain','Two ways out','Sewer surprise'],
    ['Light the fuse','Steam and speed','Hot on your tail','A close shave','Chain of fire','Boiling point','Keep it moving','Out of the furnace','The last shortcut','The great escape']
  ];
  const VARIANTS=['gap','carry','lever','pair','chain','sweep','pressure','shelves','fork','boss'];
  const HINTS={gap:'Move with A/D or arrows. Jump the marked gap with W, Up or Space.',carry:'Collect the trap. E / F or DROP leaves it behind you.',lever:'Run past the rope or lever. It arms after you are safely past.',pair:'Carry up to three traps. Q cycles; DROP places the selected item.',chain:'Drop traps close together. A slipping Cat can slide into the next one.',sweep:'Run past the marked lever. The Cat follows you into the swing.',pressure:'A shorter head start. Use a trap early to make some breathing room.',shelves:'Jump up the shelves. The exit is at the top.',fork:'Two routes: a direct leap below, or more traps on the upper ledges.',boss:'Boss chase: land four traps and at least one 2× chain. The exit stays locked until then.'};
  const LEVELS=[];
  for(let world=0;world<5;world++)for(let n=1;n<=10;n++){
    const variant=VARIANTS[n-1],boss=n===10,w=WORLDS[world];
    const width=(boss?2520:variant==='shelves'?1880:1440+n*48)+world*80;
    const level={index:world*10+n-1,id:`${world+1}-${n}`,world,number:n,name:NAMES[world][n-1],theme:w.theme,variant,width,height:480,ground:400,spawn:{x:64,y:360},door:{x:width-88,y:330,w:40,h:70},platforms:[],pickups:[],environment:[],hazards:[],waypoints:[],gaps:[],delay:n===7?Math.max(54,w.delay-30):w.delay,speed:1.1*w.speed,targetStuns:boss?4:3,comboRequired:boss?2:0,boss,hint:HINTS[variant],parMs:Math.round(((width-152)/240+1.6+(variant==='shelves'?2:0))*1000)};
    if(boss)level.parMs=16000+world*1000;
    if(variant!=='shelves'&&variant!=='chain'){
      const first=world===0&&n===1?560:Math.min(width-450,690+n%3*100+world*35),gap=world===0&&n===1?100:80+(world>1?20:0)+(variant==='fork'?20:0);
      level.gaps.push({x:first,w:gap});if(world>=2&&n>=4&&variant!=='fork')level.gaps.push({x:Math.min(width-280,first+460),w:80});
    }
    let x=0;for(const gap of level.gaps){level.platforms.push({x,y:400,w:gap.x-x,h:80,solid:true});x=gap.x+gap.w;}level.platforms.push({x,y:400,w:width-x,h:80,solid:true});
    for(const gap of level.gaps)if(world===4)level.hazards.push({x:gap.x,y:405,w:gap.w,h:75,type:'lava'});
    if(variant==='shelves'){
      for(const [x,y,width]of [[500,320,250],[680,240,250],[860,160,300],[1080,160,level.width-1080]])level.platforms.push({x,y,w:width,h:18,solid:false});
      level.door.y=90;level.waypoints=[{x:590,y:320},{x:770,y:240},{x:960,y:160},{x:level.width-90,y:160}];
    }else if(variant==='fork'){
      for(const [x,y]of [[400,320],[600,240],[800,240],[1020,320]])level.platforms.push({x,y,w:210,h:16,solid:false});
    }
    const put=(type,x,y=376)=>level.pickups.push({type,x,y,w:24,h:24});
    const env=(type,x,y=400)=>level.environment.push({type,x,y,triggerX:x+45,w:60,h:70});
    if(world===0){
      if(n===2)put('banana',180);
      if(n===3)env('bucket',360);
      if(n===4){put('banana',180);put('mousetrap',410);}
      if(n===5){put('banana',160);put('mousetrap',200);env('bucket',470);}
      if(n===6){put('banana',180);env('sweep',390);env('bucket',1070);}
      if(n===7){put('mousetrap',175);env('bucket',390);}
      if(n===8){put('banana',180);put('mousetrap',710,216);env('bucket',1000,160);}
      if(n===9){put('banana',180);put('mousetrap',640,216);env('bucket',450);env('sweep',1100);}
      if(n===10){put('banana',155);put('mousetrap',195);put('banana',265);for(const [type,x]of [['bucket',400],['sweep',700],['bucket',1120],['sweep',1510]])env(type,x);}
    }else{
      const types=['banana','mousetrap',w.item];put(types[(n-1)%3],160);put(w.item,210);put(types[n%3],620);
      env(w.env,390);env(world===1?'bucket':WORLDS[world-1].env,variant==='shelves'?1100:1110,variant==='shelves'?160:400);
      if(n>=4)env(w.env,variant==='shelves'?780:1460,variant==='shelves'?240:400);
      if(boss){env(w.env,680);env(world===1?'sweep':'bucket',1760);put(w.item,880);put('mousetrap',1210);}
      if(variant==='fork'){put(w.item,650,216);env(w.env,850,240);}
      if(variant==='shelves'){put(w.item,705,216);env(w.env,570,320);}
    }
    // No trap is placed over a missing floor: the route and lever stay predictable.
    for(const e of level.environment)if(e.y===400){const gap=level.gaps.find(g=>e.x+50>g.x&&e.x-30<g.x+g.w);if(gap){e.x=gap.x-110;e.triggerX=e.x+45;}}
    const matrix=[
      [null,null,'ceiling','shift','pendulum','crusher','gate','lift','belt','ceiling'],
      ['belt','shift','pendulum','lift','gate','ceiling','crusher','belt','shift','pendulum'],
      ['gate','ceiling','crusher','shift','pendulum','belt','lift','gate','ceiling','crusher'],
      ['lift','gate','ceiling','belt','shift','pendulum','crusher','lift','belt','gate'],
      ['belt','crusher','gate','shift','ceiling','pendulum','lift','belt','gate','ceiling']
    ];
    const type=matrix[world][n-1];level.mechanic=type;
    if(type){
      const mx=Math.max(280,350-world*12),mw=type==='ceiling'?160:type==='shift'||type==='lift'?110:type==='belt'?145:type==='gate'?44:type==='pendulum'?60:70;
      level.environment.unshift({type,x:mx,y:400,w:mw,h:30,triggerX:mx+mw+44,direction:world%2?-1:1});
      if(world===0&&n===3)level.environment=level.environment.filter(e=>e.type!=='bucket');
      // Place machinery before the first gap so it becomes part of the early chase.
      if(boss)level.environment.push({type:world%2?'shift':'pendulum',x:1150,y:400,w:world%2?110:60,h:30,triggerX:1150+(world%2?110:60)+44,direction:1});
      level.parMs+=900;
    }
    LEVELS.push(level);
  }
  return{WORLDS,LEVELS};
});
