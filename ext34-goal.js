/* Weighted draw consumes one supplied RNG random() call per card. */
(function(g){"use strict";
function draw(r,stats,rng){const pool=r.cards.slice(),result=[];for(let i=0;i<Math.min(r.cards_shown,pool.length);i++){
 const weights=pool.map(c=>c.stat?(120-(stats[c.stat]||0))/120+0.2:0.6),total=weights.reduce((a,b)=>a+b,0);let n=rng.random()*total,idx=weights.length-1;
 for(let j=0;j<weights.length;j++){n-=weights[j];if(n<0){idx=j;break;}}result.push(pool.splice(idx,1)[0]);}return result;}
function judge(r,card,value,laurenMet){const ok=value>=card.need,over=ok&&value>=card.need*r.over.ratio;return {card:card.id,value,ok,over,nextWeekGain:ok?r.success.next_week_gain_mult:1,laurenEncounter:ok?r.success.lauren_encounter_mult:1,laurenF:ok&&laurenMet?r.success.lauren_f:0,laurenU:over&&laurenMet?r.over.lauren_u:0,line:laurenMet?(over?r.over.line:ok?r.success.line:r.fail.line):null};}
const api={draw,judge};if(typeof module!=="undefined")module.exports=api;g.Ext34Goal=api;
})(typeof globalThis!=="undefined"?globalThis:this);
