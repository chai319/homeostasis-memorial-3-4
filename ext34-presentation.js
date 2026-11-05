/* 3-4 character presentation: scene metadata only, no authored dialogue. */
(function(g){"use strict";
function cue({who,expr='',scene={},playerGender='female'}){
 const teacher=who==='eguchi',night=teacher&&scene.mode==='night',chin=who==='chin';
 const beat=chin?(scene.beat!==null&&scene.beat!==undefined&&Number.isFinite(Number(scene.beat))&&Number(scene.beat)>0?Number(scene.beat):104):null;
 return {sprite:teacher?(night?'eguchi_night':'eguchi'):who==='toni'?'toni_'+playerGender:who==='lauren'&&expr.startsWith('glasses')?'lauren_glasses':who==='kanade'&&expr==='battle'?'kanade_battle':who==='shion'&&expr!=='happy'?'shion_neutral':who,
  nameSuffix:night?'（夜）':'',dialogueSize:teacher?(night?'large':'small'):'normal',
  compactName:who==='lauren'&&expr.startsWith('glasses'),battle:who==='kanade'&&expr==='battle',
  beat:chin?{bpm:beat,band:beat<80?'slow':beat>=120?'fast':'normal'}:null};
}
const api={cue};g.Ext34Presentation=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
