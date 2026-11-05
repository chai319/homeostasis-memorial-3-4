/* Morning weather and once-per-day stress buffer. */
(function(g){"use strict";
function initial(){return {rainDays:0,cold:false,thunderPending:false,thunderSeen:false};}
function morning(s,r,stress){const band=[...r.bands].reverse().find(x=>stress>=x[0])||r.bands[0];
 const rainy=band[1]==="rain"||band[1]==="thunder";s.rainDays=rainy?s.rainDays+1:0;
 if(s.rainDays>=r.rain.cold_flag_after_days)s.cold=true;
 const scene=s.thunderPending&&!s.thunderSeen?r.thunder.scene_once:null;
 if(scene)s.thunderSeen=true;s.thunderPending=band[1]==="thunder"&&!s.thunderSeen;
 return {band:band[1],label:band[2],scene,cold:s.cold,rainDays:s.rainDays};}
function end(r,stress,talked){return Math.max(0,stress+(talked.some(c=>r.buffer.chars.includes(c))?r.buffer.stress:0));}
const api={initial,morning,end};if(typeof module!=="undefined")module.exports=api;g.Ext34Weather=api;
})(typeof globalThis!=="undefined"?globalThis:this);
