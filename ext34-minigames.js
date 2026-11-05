/* Mini-game mechanics; display, clock pause and beat score bands are separate. */
(function(g){"use strict";
function beatStart(r,just){return {bpm:just?r.bpm_just:r.bpm_fast,errors:[],previousTap:null};}
function beatTap(state,r,expectedMs,tapMs){
 if(state.errors.length>=r.beats||!Number.isFinite(expectedMs)||!Number.isFinite(tapMs))throw Error('Invalid beat');
 const interval=state.previousTap===null?null:tapMs-state.previousTap;
 if(interval!==null&&interval>60000/state.bpm&&state.bpm>r.bpm_just)state.bpm=Math.max(r.bpm_just,state.bpm-4);
 state.previousTap=tapMs;state.errors.push(Math.abs(tapMs-expectedMs));
 return {count:state.errors.length,bpm:state.bpm,done:state.errors.length===r.beats};
}
function beatMiss(state,r){if(state.errors.length>=r.beats)throw Error('Beat complete');state.errors.push(null);state.previousTap=null;}
function beatResult(state,r,bands){
 if(state.errors.length!==r.beats)throw Error('Beat incomplete');
 const missed=state.errors.filter(x=>x===null).length,meanMs=missed?null:state.errors.reduce((a,b)=>a+b,0)/state.errors.length;
 if(!Array.isArray(bands)||bands.length!==3||bands.some((v,i)=>!Number.isFinite(v)||v<0||(i&&v<bands[i-1])))return {meanMs,score:null,needsScoreBands:true};
 const score=missed?0:meanMs<=bands[0]?3:meanMs<=bands[1]?2:meanMs<=bands[2]?1:0;
 return {meanMs,score,reward:score===3?r.reward3:null};
}
function guardStart(r,sequence){
 if(sequence.length!==r.rounds||sequence.some(x=>!r.choices.includes(x)))throw Error('Invalid guard sequence');
 return {sequence:[...sequence],index:0,correct:0,seen:[]};
}
function guardCue(s,r){if(s.index>=r.rounds)throw Error('Guard complete');const direction=s.sequence[s.index];return {direction,seenBefore:s.seen.includes(direction),omenMs:r.omen_ms};}
function guardChoose(s,r,direction){if(!r.choices.includes(direction)||s.index>=r.rounds)throw Error('Invalid guard choice');const cue=guardCue(s,r),correct=direction===cue.direction;s.seen.push(cue.direction);s.index++;if(correct)s.correct++;return {correct,done:s.index===r.rounds,score:s.correct,reward:s.index===r.rounds?(s.correct===r.rounds?r.win:r.lose):null};}
const api={beatStart,beatTap,beatMiss,beatResult,guardStart,guardCue,guardChoose};g.Ext34Minigames=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);
