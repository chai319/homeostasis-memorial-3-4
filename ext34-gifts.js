/* Pure gift rules; host applies the returned effects and records the event. */
(function(g){"use strict";
function initial(r){return {tickets:r.weekly_tickets,seen:{},given:{}};}
function monday(s,r){s.tickets=r.weekly_tickets;}
function canGive(s,r,char){return s.tickets>0 && Object.hasOwn(r.table,char);}
function give(s,r,char,item,day){
 if(!canGive(s,r,char)||!Object.hasOwn(r.items,item)||!Object.hasOwn(r.table[char],item))throw Error("Invalid gift");
 const count=s.given[char]?.[item]||0, novelty=r.novelty?.[char];
 const grade=novelty?.item===item&&count>0?novelty.after_first:r.table[char][item];
 const mult=r.birthdays[char]===day&&r.birthday_mult_applies_to.includes(grade)?r.birthday_mult:1;
 const effects=Object.fromEntries(Object.entries(r.effects[grade]).map(([k,v])=>[k,v*mult]));
 (s.seen[char]??={})[item]=grade;(s.given[char]??={})[item]=count+1;s.tickets--;
 return {char,item,grade,mult,effects};
}
const api={initial,monday,canGive,give};if(typeof module!=="undefined")module.exports=api;g.Ext34Gifts=api;
})(typeof globalThis!=="undefined"?globalThis:this);
