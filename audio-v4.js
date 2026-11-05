/* Scene-id based music only. Audio files are copied without modification. */
(function(global){"use strict";
class AudioController {
 constructor(manifest){this.manifest=manifest;this.current=null;this.outgoing=null;this.id=null;this.enabled=false;this.volume=.3;this.token=0;this.missing=new Set();this.sfxVolume=.45;this.sfxContext=null;}
 unlock(){
  this.enabled=true;if(this.current&&this.current.paused)this.current.play().catch(()=>{});
  try{const Context=global.AudioContext||global.webkitAudioContext;if(!this.sfxContext&&Context)this.sfxContext=new Context();if(this.sfxContext?.state==="suspended")this.sfxContext.resume().catch(()=>{});}catch{/* Audio restrictions must not interrupt play. */}
 }
 setSfxVolume(value){this.sfxVolume=Math.max(0,Math.min(1,value));}
 playStatUp(){
  const ctx=this.sfxContext;
  if(!this.enabled||!ctx||ctx.state!=="running"||!this.sfxVolume||document.hidden)return;
  // Original soft two-note bell: short bright attack and a rounded "pi-kohn" tail.
  try{
   const master=ctx.createGain();master.gain.value=this.sfxVolume*.22;master.connect(ctx.destination);
   const start=ctx.currentTime;
   for(const [offset,hz,length] of [[0,1046.5,.15],[.10,1567.98,.48]])for(const [multiple,level] of [[1,1],[2,.14]]){
    const osc=ctx.createOscillator(),env=ctx.createGain(),t=start+offset;osc.type="sine";osc.frequency.value=hz*multiple;
    env.gain.setValueAtTime(0,t);env.gain.linearRampToValueAtTime(level,t+.008);env.gain.exponentialRampToValueAtTime(.001,t+length);
    osc.connect(env);env.connect(master);osc.start(t);osc.stop(t+length+.02);osc.onended=()=>{osc.disconnect();env.disconnect();};
   }
   setTimeout(()=>master.disconnect(),750);
  }catch{/* SE failure must never change game progression. */}
 }
 async play(id){
  if(!id||id==="keep"||id===this.id)return;
  const path=this.manifest[id];
  if(!path){this.missing.add(id);console.warn("BGM unavailable:",id);return;}
  const token=++this.token,old=this.current,next=new Audio(path);this.outgoing=old;next.loop=true;next.volume=0;this.current=next;this.id=id;
  if(this.enabled)await next.play().catch(()=>{});
  const start=performance.now(),from=old?.volume||0;
  const frame=()=>{if(token!==this.token){if(old)old.pause();return;}const t=Math.min(1,(performance.now()-start)/1200);next.volume=this.volume*t;if(old)old.volume=Math.min(from,this.volume)*(1-t);if(t<1)requestAnimationFrame(frame);else if(old){old.pause();old.src="";if(this.outgoing===old)this.outgoing=null;}};
  requestAnimationFrame(frame);
 }
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));if(this.current)this.current.volume=this.volume;if(this.outgoing)this.outgoing.volume=Math.min(this.outgoing.volume,this.volume);}
}
global.HMAudio=AudioController;
})(globalThis);

