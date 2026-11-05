/* Extra 3-4 contract checks complement HMCore.validate. */
(function(g){"use strict";
const expressions={shion:['neutral','happy','worried','blush','tearful','surprised'],shito:['neutral','faint_smile','deadpan','blush','lonely','surprised'],chin:['neutral','warm_smile','cold','sweaty','irritated','blush'],lauren:['neutral','grin','serious','blush','glasses','glasses_smile'],kanade:['neutral','smile','battle','feverish','blush','lonely'],hyoma:['neutral','small_smile','frown','tired','blush','surprised'],eguchi:['day_neutral','day_smile','night','night_smile','troubled','teary'],toni:['neutral','happy','exasperated','sleepy','blush','worried'],yoko:['neutral','happy','angry'],toko:['neutral','happy','angry']};
function validate(data,assets={}){
 const errors=[],warnings=[],ids=data.rules.cast.targets,expected=['shion','shito','chin','lauren','kanade','hyoma'];
 if(ids.length!==expected.length||expected.some(id=>!ids.includes(id)))errors.push('Invalid 3-4 targets');
 if(data.meta.save_key!=='homeostasis-memorial-3-4')errors.push('Invalid save namespace');
 const speakers=new Set([...expected,'eguchi','toni','yoko','toko','principal','mob','me','narr','ui']);
 const bgm=new Set([...(data.rules.bgm_ids?.min||[]),...Object.keys(data.rules.bgm_ids?.optional||{}),'keep']);
 const stats=new Set(Object.keys(data.rules.stats||{})),simpleEffects=new Set(['f','t','u','pf','pt','pu','rvok','rs','stress','pick','goal_ok','buffer',...expected,...stats]);
 const simpleConditions=new Set(['f','t','u','pf','pt','ident','rvok','rs','rank','mg','stress','weather','rain_days','birthday',...expected,...stats]);
 function validGifted(key){return expected.some(id=>key.startsWith('gifted_'+id+'_')&&Object.hasOwn(data.rules.gifts.items,key.slice(('gifted_'+id+'_').length)));}
 function checkConditions(conditions,where){for(const entry of conditions||[]){if(!Array.isArray(entry)||entry.length!==3){errors.push(where+': malformed condition');continue;}const [key,op]=entry;if(typeof key!=='string'){errors.push(where+': invalid condition key');continue;}if(!['>=','<=','>','<','==','!='].includes(op))errors.push(where+': unknown condition operator '+op);if(!simpleConditions.has(key)&&!(key.startsWith('bm_')&&[...expected,'eguchi'].includes(key.slice(3)))&&!validGifted(key))errors.push(where+': unknown condition '+key);}}
 function checkEffects(effects,where){for(const key of Object.keys(effects||{})){if(simpleEffects.has(key)||/^(shion|shito|chin|lauren|kanade|hyoma|eguchi)_[ftu]$/.test(key))continue;if(key.startsWith('relax_')&&expected.includes(key.slice(6)))continue;if(key.startsWith('gift:')&&Object.hasOwn(data.rules.gifts.items,key.slice(5)))continue;errors.push(where+': unknown effect '+key);}}
 for(const scene of data.scenes){
  if(scene.bgm&&!bgm.has(scene.bgm))errors.push(`${scene.id}: unknown BGM ${scene.bgm}`);
  if(scene.place!=='keep'&&!data.places[scene.place])errors.push(`${scene.id}: unknown place ${scene.place}`);
  checkConditions(scene.need,scene.id);checkConditions(scene.goto?.cond,scene.id);checkEffects(scene.goto?.effects,scene.id);
  for(const choice of scene.choices||[])for(const option of choice.options||[]){checkConditions(option.cond,scene.id);checkEffects(option.effects,scene.id);}
  const lines=[...(scene.lines||[]),...(scene.after||[]),...(scene.choices||[]).flatMap(c=>[...(c.pre||[]),...(c.options||[]).flatMap(o=>o.response||[])])];
  for(const line of lines){const who=line.who;if(who&&!speakers.has(who))errors.push(`${scene.id}: unknown speaker ${who}`);if(who&&line.expr&&expressions[who]&&!expressions[who].includes(line.expr))warnings.push(`${scene.id}: unknown expression ${who}/${line.expr}; use neutral`);}
 }
 if(assets.music){for(const id of data.rules.bgm_ids.min||[])if(!assets.music[id])warnings.push(`Missing music asset ${id}`);}
 return {ok:errors.length===0,errors,warnings};
}
const api={validate,expressions};g.Ext34Validate=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
