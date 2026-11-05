/* Body-map adjudication, independent of UI and engine. */
(function(g){"use strict";
function initial(){return {people:{}};}
function submit(s,r,char,answers,dayIndex,memos){
 if(!Object.hasOwn(r.answer,char)||memos<r.memos_needed||!Number.isInteger(dayIndex))throw Error("Body map unavailable");
 const person=s.people[char]??={confirmed:{},retryAt:0,identified:false};
 if(person.identified||dayIndex<person.retryAt)throw Error("Body map unavailable");
 const fields=Object.keys(r.fields);if(fields.some(k=>!person.confirmed[k]&&!Object.hasOwn(answers,k)))throw Error("Missing field");
 const wrong=[];for(const k of fields){if(person.confirmed[k])continue; if(answers[k]===r.answer[char][k])person.confirmed[k]=answers[k];else wrong.push(k);}
 if(wrong.length){person.lastWrong=[...wrong];person.retryAt=dayIndex+r.cooldown_days;return {identified:false,wrong,friendship:r.wrong_f,retryAt:person.retryAt};}
 person.identified=true;person.lastWrong=[];const oxy=char==="shion"?"shito":char==="shito"?"shion":null;
 return {identified:true,wrong:[],reward:r.reward,sameOxy:!!(oxy&&s.people[oxy]?.identified)};
}
const api={initial,submit};if(typeof module!=="undefined")module.exports=api;g.Ext34Bodymap=api;
})(typeof globalThis!=="undefined"?globalThis:this);
