/* Scene-level music routing. HMAudio supplies the crossfade and playback. */
(function(g){"use strict";
class Music {
 constructor(audio,volume=.3){this.audio=audio;this.volume=volume;this.muted=false;this.current=null;}
 unlock(){this.audio.unlock();}
 request(id){if(!id||id==='keep'||id===this.current)return;this.current=id;return this.audio.play(id);}
 scene(scene){return this.request(scene.mode==='night'?'evening_class':scene.bgm);}
 setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.audio.setVolume(this.muted?0:this.volume);}
 setMuted(value){this.muted=!!value;this.audio.setVolume(this.muted?0:this.volume);}
}
const api={Music};g.Ext34Music=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
