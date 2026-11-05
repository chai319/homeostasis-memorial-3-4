/* The host supplies already-computed relaxed eligibility for stat requirements. */
(function(g){"use strict";
function pick(r,people,targets,mentorEligible,pairOrder){
 const L=r.ending.letter,B=r.ending.branch;
 const qualified=targets.filter(id=>{const p=people[id];return p&&p.f>=L.f&&p.u>=L.u&&p.identified&&p.statsEligible;});
 qualified.sort((a,b)=>(people[b].f+people[b].t)-(people[a].f+people[a].t));
 if(qualified.length){const char=qualified[0],kind=people[char].t>=B.t_suki?'suki':'naka';return {kind,char,scene:`end_${char}_${kind}`,letter:!!mentorEligible};}
 const P=r.pair_ending;for(const key of pairOrder){const ids=key.split('/');if(!Object.hasOwn(P.scenes,key)||ids.length!==2)continue;
 if(ids.every(id=>{const p=people[id];return p&&p.f>=P.f&&p.t>=P.t&&p.u>=P.u&&p.identified;}))return {kind:'pair',scene:P.scenes[key],letter:false};}
 if(mentorEligible)return {kind:'mentor',scene:r.mentor.ending.scene,letter:false};return {kind:'friend',scene:r.ending.friend_scene,letter:false};
}
const api={pick};if(typeof module!=="undefined")module.exports=api;g.Ext34Ending=api;
})(typeof globalThis!=="undefined"?globalThis:this);
