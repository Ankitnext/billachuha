((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else Object.assign(root.KitchenHeist||={},api);})(globalThis,()=>{
  const WORLDS=[
    {name:'Home Kitchen',theme:'kitchen',label:'WOOD, WHISKERS & WARM LIGHT',floor:'#e7d9b8',tile:'#f1e6cb',wall:'#97764f',accent:'#edb857',ink:'#665238'},
    {name:'Restaurant',theme:'restaurant',label:'THE DINNER SHIFT',floor:'#c8d8d6',tile:'#e2ebe6',wall:'#57736e',accent:'#85c8bd',ink:'#36554c'},
    {name:'Factory',theme:'factory',label:'KEEP OFF THE LOUD TILES',floor:'#b5b6a0',tile:'#cccfb8',wall:'#5a685c',accent:'#ef9c53',ink:'#4b5443'},
    {name:'Warehouse',theme:'warehouse',label:'SOMETHING MOVES IN THE DARK',floor:'#344b50',tile:'#3d5658',wall:'#96774e',accent:'#efc272',ink:'#152f30'},
    {name:'Secret Lab',theme:'lab',label:'ONE LAST MIDNIGHT RAID',floor:'#1b3436',tile:'#234143',wall:'#486968',accent:'#a8e394',ink:'#0d272b'}
  ];
  const names=[['First Bite','Counter Culture','The Long Way Round','A Little Smoke','Two Sets of Whiskers','Dinner Diversion','Behind the Fridge','The Biscuit Tin','Midnight Snack','Chef Whiskers'],['Table for One','Service Corridor','Eyes on the Wall','Cold Storage','The Silver Platter','The Back Door','A Hole in the Plan','Closing Time','Reservations','The Head Waiter'],['Night Shift','Assembly Line','Clattering Plates','Wrong Conveyor','Packing Peanuts','Double Shift','Paws on Steel','Quality Control','The Cheese Press','The Foreman'],['Lights Out','Crate Expectations','Watchdog Alley','Lost and Found','Loading Bay','Silent Shipment','Around the Corner','Blackout Route','The Last Pallet','The Night Watch'],['Test Subject Rat','Green Light','Laser Lunch','A Controlled Escape','Cheese Chemistry','The Blind Spot','Hazard Pay','After Hours','One Final Sample','Professor Claw']];
  const at=(x,y)=>({x:x*32+16,y:y*32+16});
  const layouts=[
    [[4,4,3,2],[12,4,3,2],[4,8,3,2],[12,8,3,2]],
    [[4,4,2,2],[12,4,4,1],[4,8,3,2],[13,8,2,2],[8,5,1,1]],
    [[4,5,3,1],[12,4,3,2],[4,8,2,2],[12,9,4,1],[8,8,1,2]],
    [[4,4,3,2],[12,5,4,1],[4,9,3,1],[12,8,3,2],[8,4,1,2]],
    [[4,4,2,2],[13,4,2,2],[4,8,3,2],[12,8,4,1],[8,9,1,1]]
  ];
  const routes=[[[7,3],[17,3],[17,11],[7,11]],[[2,3],[10,3],[10,11],[2,11]],[[2,7],[17,7]],[[2,2],[17,2],[17,12],[2,12]]];
  const cheeses=[[3,10],[16,4],[9,2],[11,10],[2,5],[17,8],[9,12],[15,2]];
  const LEVELS=Array.from({length:50},(_,index)=>{
    const world=Math.floor(index/10),number=index%10+1,boss=number===10;
    const walls=[{x:0,y:0,w:640,h:32,kind:'border'},{x:0,y:448,w:640,h:32,kind:'border'},{x:0,y:32,w:32,h:416,kind:'border'},{x:608,y:32,w:32,h:416,kind:'border'},...layouts[(number-1+world)%5].map(([x,y,w,h],i)=>({x:x*32,y:y*32,w:w*32,h:h*32,kind:['counter','table','fridge','crate'][i%4]}))];
    const count=boss?1:Math.min(4,1+Math.floor((index+2)/12)+(number>5?1:0));
    const guards=Array.from({length:count},(_,i)=>({route:boss?[]:routes[i].map(([x,y])=>at(x,y)),pos:at(boss?16:routes[i][(world+number+i)%routes[i].length][0],boss?3:routes[i][(world+number+i)%routes[i].length][1]),angle:Math.PI*(i%2),speed:.85+world*.045,pauseTime:Math.max(.5,1.5-world*.18),boss}));
    const tools=boss?[{...at(3,12),type:'decoy',charges:2},{...at(8,12),type:'smoke',charges:2}]:[{...at(3,12),type:'decoy',charges:1},...(index>=3?[{...at(8,12),type:'smoke',charges:1}]:[]),...(index>=15?[{...at(10,6),type:'hole',charges:1}]:[]),...(index>=20?[{...at(17,10),type:'paws',charges:1}]:[])];
    const cameras=world===0?[]:Array.from({length:Math.min(3,world===1?(number>5?2:1):world===4?3:2)},(_,i)=>({pos:at([3,16,10][i],[2,12,2][i]),startAngle:[Math.PI/2,-Math.PI/2,Math.PI/2][i],sweepAngle:Math.PI*.45,sweepSpeed:.65+world*.08,ground:world===3&&i===1}));
    const floors=world>=2?[{x:256,y:224,w:128,h:32,kind:'conveyor',direction:number%2?1:-1},{x:64,y:352,w:128,h:32,kind:'noise'}]:[];
    if(world===4)floors.push({x:320,y:176,w:32,h:128,kind:'laser',period:4.5,phase:number*.47});
    return{id:`${world+1}-${number}`,index,world,number,name:names[world][number-1],theme:WORLDS[world].theme,width:20,height:15,walls,spawn:at(1,13),exit:at(18,1),cheese:cheeses.slice(0,Math.min(8,3+world+Math.floor(number/5))).map(([x,y])=>at(x,y)),tools,guards,cameras,floors,dark:world===3,boss,parTime:(boss?125:55+world*12+number*2)*1000,hint:boss?'Break the hunter’s pursuit four times with your two double-charge tools. Steal all cheese, then escape.':index===0?'Walk behind the furniture. Yellow cones show exactly where the Cat can see.':world===2?'Conveyors move your paws; metal grates make noise even when you walk.':world===3?'Stay close to cover. Dog security sweeps the loading bays.':world===4?'Red lasers sound the alarm. Cross while their emitters are dim.':'Use cover, watch the patrol, and leave a decoy when the route gets tight.'};
  });
  return{WORLDS,LEVELS};
});
