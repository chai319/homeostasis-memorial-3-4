/* Short effects and ambient loops. All paths are local. */
(function(g){"use strict";
class SoundEffects {
 constructor(manifest,{volume=.45}={}){this.files=Object.fromEntries(manifest.assets.map(a=>[a.id,'assets/se/'+a.file]));this.volume=volume;this.muted=false;this.active=new Set();}
 async play(id,{loop=false}={}){
  const path=this.files[id];if(!path)return false;const audio=new Audio(path),entry={id,audio};audio.loop=!!loop;audio.volume=this.volume;audio.muted=this.muted;this.active.add(entry);
  audio.addEventListener('ended',()=>this.active.delete(entry),{once:true});
  try{await audio.play();return true;}catch{this.active.delete(entry);return false;}
 }
 stop(id){for(const entry of [...this.active])if(entry.id===id){entry.audio.pause();this.active.delete(entry);}}
 stopAll(){for(const entry of this.active)entry.audio.pause();this.active.clear();}
 setMuted(value){this.muted=!!value;for(const entry of this.active)entry.audio.muted=this.muted;}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));for(const entry of this.active)entry.audio.volume=this.volume;}
}
const api={SoundEffects};g.Ext34Sound=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
