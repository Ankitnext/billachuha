'use strict';
const fightKeys = new Set(), physicalKeys = new Set(), touchKeys = new Map();
const opponent = new FightBot();
let roundOver=false, lastFrame=0, accumulated=0;
enemy.facing=-1;
function jumpPlayer(){if(!roundOver&&player.velocity.y===0)player.velocity.y=-18;}
function pressFightKey(key){
 if(roundOver)return;
 fightKeys.add(key);
 if(key==='w')jumpPlayer();
 if(key===' ')player.attack();
}
function releaseFightKey(key){if(!physicalKeys.has(key)&&![...touchKeys.values()].includes(key))fightKeys.delete(key);}
function clearFightControls(){physicalKeys.clear();touchKeys.clear();fightKeys.clear();}
window.addEventListener('keydown',event=>{
 const key=({KeyA:'a',KeyD:'d',KeyW:'w',Space:' ',ArrowLeft:'a',ArrowRight:'d',ArrowUp:'w'})[event.code] || event.key.toLowerCase();
 if(!['a','d','w',' '].includes(key))return;
 event.preventDefault();physicalKeys.add(key);if(!event.repeat)pressFightKey(key);
});
window.addEventListener('keyup',event=>{
 const key=({KeyA:'a',KeyD:'d',KeyW:'w',Space:' ',ArrowLeft:'a',ArrowRight:'d',ArrowUp:'w'})[event.code] || event.key.toLowerCase();
 physicalKeys.delete(key);releaseFightKey(key);
});
// Delegation also handles buttons inserted later by the shared viewport shell.
document.addEventListener('pointerdown',event=>{
 const button=event.target.closest('[data-fight-key]');if(!button)return;
 event.preventDefault();button.setPointerCapture(event.pointerId);
 touchKeys.set(event.pointerId,button.dataset.fightKey);pressFightKey(button.dataset.fightKey);
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(type,event=>{
 const key=touchKeys.get(event.pointerId);touchKeys.delete(event.pointerId);if(key)releaseFightKey(key);
});
window.addEventListener('blur',clearFightControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearFightControls();lastFrame=0;accumulated=0;}});
function fightStep(now){
 if(roundOver)return;
 if(timer===0||player.health<=0||enemy.health<=0){roundOver=true;clearFightControls();determineWinner({player,enemy,timerId});return;}
 player.velocity.x=(Number(fightKeys.has('d'))-Number(fightKeys.has('a')))*5;
 if(player.velocity.x)player.facing=Math.sign(player.velocity.x);
 if(fightKeys.has(' '))player.attack(now);
 const decision=opponent.update(now,enemy,player,canvas.width);
 enemy.velocity.x=decision.move*3.6;
 enemy.facing=player.position.x<enemy.position.x?-1:1;
 if(decision.jump&&enemy.velocity.y===0)enemy.velocity.y=-17;
 if(decision.attack)enemy.attack(now);
 for(const fighter of [player,enemy]){
  fighter.switchSprite(fighter.velocity.y<0?'jump':fighter.velocity.y>0?'fall':fighter.velocity.x?'run':'idle');
  fighter.update(false);
 }
 for(const [attacker,target,id] of [[player,enemy,'enemyHealth'],[enemy,player,'playerHealth']]){
  if(attacker.isAttacking&&rectangularCollision({rectangle1:attacker,rectangle2:target})){
   attacker.isAttacking=false;target.health=Math.max(0,target.health-20);
   document.getElementById(id).style.width=`${target.health}%`;
  }
 }
 if(player.health<=0||enemy.health<=0){roundOver=true;clearFightControls();determineWinner({player,enemy,timerId});}
}
function animateFight(now){
 requestAnimationFrame(animateFight);
 if(document.hidden)return;
 if(!lastFrame)lastFrame=now;
 accumulated+=Math.min(100,now-lastFrame);lastFrame=now;
 c.fillStyle='black';c.fillRect(0,0,canvas.width,canvas.height);
 background.update();shop.update();
 // Fixed simulation rate prevents 120Hz phones from running combat twice as fast.
 while(accumulated>=1000/60){fightStep(now);accumulated-=1000/60;}
 player.draw();enemy.draw();
}
decreaseTimer();requestAnimationFrame(animateFight);
