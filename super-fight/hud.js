(() => {
  const $=id=>document.getElementById(id);
  class FightHUD{
    update(match){
      match.fighters.forEach((f,id)=>{const key=id?'two':'one';$('name-'+key).textContent=`${id===1&&match.mode==='solo'?'BOT':'P'+(id+1)} · ${f.name.toUpperCase()}`;$('rounds-'+key).textContent='●'.repeat(match.wins[id])+'○'.repeat(2-match.wins[id]);$('rounds-'+key).setAttribute('aria-label',`${match.wins[id]} round wins`);
        $('health-'+key).style.width=`${f.hp/f.maxHp*100}%`;$('health-'+key).style.background=`linear-gradient(90deg,hsl(${f.hp/f.maxHp*100} 35% 55%),hsl(${f.hp/f.maxHp*100} 50% 72%))`;
        $('energy-'+key).style.width=`${f.energy/f.maxEnergy*100}%`;$('hp-'+key).textContent=`♥ ${Math.ceil(f.hp)} / ${f.maxHp}`;$('en-'+key).textContent=`ϟ ${Math.floor(f.energy)} / ${f.maxEnergy}`;
        for(const [kind,value,max]of [['health',f.hp,f.maxHp],['energy',f.energy,f.maxEnergy]]){const track=$(kind+'-'+key).parentElement;track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(max));track.setAttribute('aria-valuenow',String(Math.round(value)));}
      });
      $('timer').textContent=String(Math.ceil(match.remaining)).padStart(2,'0');$('round-label').textContent=`ROUND ${match.roundNumber} / 3`;$('match-mode').textContent=match.mode==='solo'?match.difficulty.toUpperCase():'LOCAL 2P';
      const f=match.fighters[0];$('power-note').textContent=f.charging?`Charging beam · ${Math.min(100,Math.round(f.charge/f.spec.charge*100))}%`:f.shield?'Energy shield · draining energy':f.powerCooldown>0?`Power recovery · ${f.powerCooldown.toFixed(1)}s`:f.energy<20?'Land to recharge energy':'Tap Blast / Step. Hold Beam / Shield.';
      const status=match.fighters.find(f=>f.receivedHits>=5&&f.energy>=25);const text=status?`P${status.id+1}: tap Special 2 to break the combo` : match.clash?'BEAM CLASH':'';if($('combat-status').textContent!==text)$('combat-status').textContent=text;
    }
    results(match){const r=match.roundResult,winner=r.winner===null?null:match.fighters[r.winner],over=match.phase==='matchover';$('result-tag').textContent=over?'MATCH COMPLETE':`ROUND ${r.number} / ${r.reason}`;$('result-title').textContent=winner?`${winner.name} ${over?'takes the match.':'wins the round.'}`:'A draw. Run it back.';$('result-detail').textContent=winner?`${r.winner===1&&match.mode==='solo'?'Bot':'Player '+(r.winner+1)} · ${r.reason}${r.reason==='TIME UP'?' · Higher remaining health percentage':''}`:'Neither fighter takes a point. Replay this round.';$('result-score').textContent=`${match.wins[0]} — ${match.wins[1]}`;$('result-stats').replaceChildren();
      match.fighters.forEach((f,id)=>{const box=document.createElement('div'),heading=document.createElement('h3');heading.textContent=`${id===1&&match.mode==='solo'?'Bot':'Player '+(id+1)} · ${f.name}`;box.append(heading);const rounds=over?match.history.map(r=>r.stats[id]):[r.stats[id]],damage=rounds.reduce((n,s)=>n+s.damage,0),combo=Math.max(...rounds.map(s=>s.maxCombo));for(const [value,label]of [[damage,'damage dealt'],[combo+' hits','best combo']]){const p=document.createElement('p'),strong=document.createElement('strong');strong.textContent=value;p.append(strong,document.createTextNode(' · '+label));box.append(p);}$('result-stats').append(box);});
      $('next-round').hidden=over;$('next-round').textContent=r.winner===null?'Replay round →':'Next round →';$('rematch').hidden=!over;
    }
  }
  window.SuperFight.FightHUD=FightHUD;
})();
