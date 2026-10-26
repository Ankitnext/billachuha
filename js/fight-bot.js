/* A reactive opponent with limited reaction speed, rather than perfect inputs. */
class FightBot {
 constructor(random = Math.random) { this.random=random; this.thinkAt=0; this.attackAt=0; this.jumpAt=0; this.move=0; }
 update(now, bot, target, width) {
  if(bot.health<=0||target.health<=0)return {move:0,jump:false,attack:false};
  let jump=false,attack=false;
  const delta=target.position.x-bot.position.x, distance=Math.abs(delta), towards=Math.sign(delta)||1;
  if(now>=this.thinkAt){
   this.thinkAt=now+140+this.random()*180;
   this.move=distance>150?towards:distance<65?-towards:0;
   // Give a nearby attack time to develop; sometimes retreat or jump away.
   if(target.isAttacking&&distance<220&&this.random()<.6){
    this.move=-towards;
    if(now>=this.jumpAt&&bot.velocity.y===0){jump=true;this.jumpAt=now+1800;}
   }else if(distance>260&&now>=this.jumpAt&&bot.velocity.y===0&&this.random()<.15){jump=true;this.jumpAt=now+2400;}
   if(distance<190&&Math.abs(target.position.y-bot.position.y)<100&&now>=this.attackAt&&this.random()<.8){
    attack=true;this.attackAt=now+750+this.random()*650;
   }
   if((bot.position.x<30&&this.move<0)||(bot.position.x>width-bot.width-30&&this.move>0))this.move=towards;
  }
  return {move:this.move,jump,attack};
 }
}
