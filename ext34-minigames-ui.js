/* UI timers pause while the page is hidden or the host opens an overlay. */
(function(g){"use strict";
function guard(root,{rules,sequence,onDone,onCancel}){
 const state=g.Ext34Minigames.guardStart(rules,sequence),actions=[];let cancelled=false,paused=false,frame=0,last=null,elapsed=0;
 root.replaceChildren();root.className='mg34-root';const title=document.createElement('h2');title.textContent='騎馬戦';root.append(title);
 const status=document.createElement('p');status.setAttribute('role','status');root.append(status);
 const field=document.createElement('div');field.className='mg34-field';root.append(field);
 const cue=document.createElement('p');cue.className='mg34-cue';field.append(cue);
 const buttons=document.createElement('div');buttons.className='mg34-buttons';root.append(buttons);
 const cancel=document.createElement('button');cancel.textContent='中断';cancel.onclick=()=>{cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);onCancel();};root.append(cancel);
 const visibility=()=>{last=null;};document.addEventListener('visibilitychange',visibility);
 function begin(){if(cancelled)return;buttons.replaceChildren();const c=g.Ext34Minigames.guardCue(state,rules);status.textContent=`${state.index+1} / ${rules.rounds}`;cue.textContent=({left:'左',right:'右',front:'正面'})[c.direction]+'からの予兆'+(c.seenBefore?' ✨':'');elapsed=0;last=null;frame=requestAnimationFrame(tick);}
 function tick(now){if(cancelled)return;if(paused||document.hidden)last=null;else if(last!==null)elapsed+=now-last;last=paused||document.hidden?null:now;if(elapsed<rules.omen_ms)frame=requestAnimationFrame(tick);else reveal();}
 function reveal(){cue.textContent='守る方向を選ぶ';for(const [id,label] of [['left','左'],['front','正面'],['right','右']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{actions.push(id);const r=g.Ext34Minigames.guardChoose(state,rules,id);if(r.done){cancelled=true;document.removeEventListener('visibilitychange',visibility);onDone({score:r.score,reward:r.reward,sequence:[...state.sequence],actions:[...actions]});}else begin();};buttons.append(b);}}
 begin();return {setPaused(value){paused=!!value;last=null;},destroy(){cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);}};
}
function beat(root,{rules,just,onDone,onCancel,playBeat=()=>{}}){
 let cancelled=false,paused=false,started=false,frame=0,last=null,elapsed=0,nextBeat=0,pending=null,expected=null;const records=[],state=g.Ext34Minigames.beatStart(rules,just);
 root.replaceChildren();root.className='mg34-root';const title=document.createElement('h2');title.textContent='応援合戦';root.append(title);const status=document.createElement('p');status.setAttribute('role','status');status.textContent='太鼓をタップしてビートに合わせる';root.append(status);
 const drum=document.createElement('button');drum.className='mg34-drum';drum.textContent='太鼓';drum.disabled=true;root.append(drum);
 const controls=document.createElement('div');controls.className='mg34-controls';root.append(controls);const start=document.createElement('button');start.textContent='開始';controls.append(start);const cancel=document.createElement('button');cancel.textContent='中断';controls.append(cancel);
 const visibility=()=>{last=null;};document.addEventListener('visibilitychange',visibility);
 function finish(){cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);drum.disabled=true;onDone(records);}
 function finalize(){if(expected===null)return;records.push({expected,tap:pending});if(pending===null)g.Ext34Minigames.beatMiss(state,rules);else g.Ext34Minigames.beatTap(state,rules,expected,pending);pending=null;}
 function tick(now){if(cancelled)return;if(paused||document.hidden)last=null;else if(last!==null)elapsed+=now-last;last=paused||document.hidden?null:now;
  if(elapsed>=nextBeat){finalize();if(records.length===rules.beats){finish();return;}expected=nextBeat;nextBeat+=60000/state.bpm;status.textContent=`${records.length+1} / ${rules.beats}　${state.bpm} BPM`;playBeat();}
  frame=requestAnimationFrame(tick);
 }
 start.onclick=()=>{if(started)return;started=true;start.disabled=true;drum.disabled=false;frame=requestAnimationFrame(tick);};
 drum.onclick=()=>{if(!cancelled&&started&&expected!==null&&pending===null)pending=elapsed;};
 cancel.onclick=()=>{cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);onCancel();};
 return {setPaused(v){paused=!!v;last=null;},destroy(){cancelled=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);}};
}
g.Ext34MinigamesUI={guard,beat};if(typeof module!=="undefined")module.exports=g.Ext34MinigamesUI;
})(globalThis);
