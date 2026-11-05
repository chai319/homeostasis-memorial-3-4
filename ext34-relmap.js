/* Derive the relationship map from the existing scene and seen state. */
(function(g){"use strict";
function cells(game,char){
 if(!game.T.includes(char))throw Error('Unknown relationship-map character');
 const personal=Array.from({length:4},(_,i)=>({kind:'personal',id:`pe_${char}_${i+1}`}));
 const talk=Array.from({length:6},(_,i)=>({kind:'talk',id:`cv_${char}_${String(i+1).padStart(2,'0')}`}));
 const trio=Array.from({length:2},(_,i)=>({kind:'trio',id:`tw_${char}_${i+1}`}));
 const birthdayRule=game.R.gifts.birthday_scenes[char]||'',match=birthdayRule.match(/(?:^|\s)((?:ev|bd)_[A-Za-z0-9_]+)/);
 const birthday={kind:'birthday',id:match?match[1]:`bd_${char}`,day:game.R.gifts.birthdays[char]};
 const all=[...personal,...talk,...trio,birthday];let nextFound=false;
 return all.map(cell=>{
  const scene=game.S[cell.id],seen=!!game.seen['scene:'+cell.id];let status,hintKey=null;
  if(seen)status='seen';
  else if(!scene)status='unavailable';
  else if(cell.day&&game.R.calendar.findIndex(r=>r[0]===game.day)>game.R.calendar.findIndex(r=>r[0]===cell.day)&&game.R.calendar.some(r=>r[0]===cell.day))status='expired';
  else if(scene.need&&!game.cond(scene.need,char)){status='locked';hintKey=scene.need.some(c=>c[0]==='ident')?'relmap_hint_ident':'relmap_hint_friend';}
  else if(!nextFound){status='next';nextFound=true;}else status='pending';
  return {...cell,status,hintKey};
 });
}
const api={cells};g.Ext34Relmap=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);
