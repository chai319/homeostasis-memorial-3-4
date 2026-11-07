/* V4.3 rules port. Generator yields UI events; never duplicates scenario text or rules. */
(function(global) {
"use strict";
const {PythonRandom,pyRound:round}=global.HMRng || require("./rng-v4.js");
const {compile:compilePresentation}=global.HMPresentation || require("./presentation-34.js");

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const week=day=>day.startsWith("fest")?day:day.split("d")[0].split("h")[0];
const map=(targets,value)=>Object.fromEntries(targets.map(t=>[t,typeof value==="function"?value():value]));
const increment=(obj,k,n=1)=>obj[k]=(obj[k]||0)+n;

function validate(data) {
 const errors=[],ids=new Set(data.scenes.map(s=>s.id)), R=data.rules, T=R.cast.targets;
 if(ids.size!==data.scenes.length)errors.push("duplicate scene ID");
 const destination=(id,from)=>{
   if(ids.has(id)||["DAY","ENDING","END","EXAM"].includes(id))return;
   if(id.startsWith("DREAM:")){errors.push(from+": dreams are disabled");return;}
   if(id.startsWith("BODYMAP:")){if(!R.bodymap.answer[id.slice(8)])errors.push(from+": invalid body map");return;}
   if(id==="GOAL:pick")return;
   if(id.startsWith("MINIGAME:")){const key=id.slice(9),m=R.minigames[key];if(!["beat","guard"].includes(key)||!m||!ids.has(m.scene_next))errors.push(from+": invalid minigame");return;}
   errors.push(from+": missing destination "+id);
 };
 for(const scene of data.scenes) {
   if(scene.place!=="keep"&&!data.places[scene.place])errors.push(scene.id+": missing place");
   if(!scene.bgm)errors.push(scene.id+": missing bgm");
   for(const choice of scene.choices)for(const o of choice.options)if(o.next)destination(o.next,scene.id);
   const g=scene.goto;if(g){if(g.type==="pick")for(const t of T)destination(g.prefix+t,scene.id);else if(g.type==="rank"){errors.push(scene.id+": rank event is disabled");}else if(g.type==="if"){destination(g.then,scene.id);destination(g.else,scene.id);}else destination(g.id,scene.id);}
   const lines=[...scene.lines,...(scene.after||[]),...scene.choices.flatMap(ch=>[...(ch.pre||[]),...ch.options.flatMap(o=>o.response)])];
   for(const l of lines){if(l.act&&l.act!=="-"&&!R.acting.ids.includes(l.act))errors.push(scene.id+": unknown act");if(l.act==="love-accepted"&&!T.some(t=>scene.id==="end_"+t))errors.push(scene.id+": love-accepted forbidden here");}
 }
 for(const id of Object.values(R.events_at))destination(id,"events_at");
 for(const s of data.scenes)if(s.goto?.type==="next"&&s.goto.id.startsWith("DREAM:"))destination(s.goto.id,s.id);
 if(new Set(data.exam_bank.map(q=>q.id)).size!==R.exam.bank)errors.push("exam count / duplicate");
 return {ok:errors.length===0,errors,scenes:ids.size,pools:Object.keys(data.pools).length,exam_bank:data.exam_bank.length,places:Object.keys(data.places).length,rules:Object.keys(R).length};
}

class Game {
 constructor(data,seed=0) {
  this.d=data;this.R=data.rules;this.T=[...this.R.cast.targets];this.rng=new PythonRandom(seed);this.seed=seed;this.S=Object.fromEntries(data.scenes.map(s=>[s.id,s]));this.CID=data.meta.targets;
  this.st=Object.fromEntries(Object.keys(this.R.stats).map(k=>[k,0]));this.st.stress=0;
  for(const k of ["fr","tk","und","hurt","cool","pstage","dates","relaxp4","info","rv","rvok","rs"])this[k]=map(this.T,0);
  this.lit=map(this.T,false);this.ident=map(this.T,false);this.clues=map(this.T,()=>new Set());this.statev=new Set();this.nf=new Set();
  this.spot_visits={};this.chars=0;this.clicks=0;this.log={};this.sick_next=false;this.day="w0";this.weekday="水";this.vars={rank:240,mg:0};this.picked=null;
  this.seen={};this.bags={};this.cur_char=null;this.talkedWith=new Set();this.dreamed=new Set();this.dream_cb={};this.trio_cap=false;this.scene=null;
  this.stageSerial=0;this.presentation={cast:[],scope:"initial",serial:0,revision:0};
  this.cues=compilePresentation(data);this.bond=map(this.T,0);this.bond_day=null;this.rankHistory=[];
 }
 set_cast(cast,scope){this.presentation={cast:[...new Set(cast)],scope,serial:++this.stageSerial,revision:0};}
 stage_line(line){
  const cue=this.cues.get(line),stage=this.presentation;
  let cast=cue.clear?[]:stage.cast.filter(who=>!(cue.exit||[]).includes(who));
  cast=[...new Set([...cast,...(cue.enter||[])])];
  const actor=Object.values(this.CID).includes(line.who)||[this.d.meta.friend,this.d.meta.mentor].includes(line.who);
  // Broadcasts are off screen; mentioning an absent person never creates a sprite.
  if(actor&&!line.text.startsWith("（放送）")&&!(this.scene?.id==="ep_wake"&&line.who===this.d.meta.mentor)&&!cast.includes(line.who))cast.push(line.who);
  if(cast.join("|")!==stage.cast.join("|")){stage.cast=cast;stage.revision++;}
 }
 tier(t){let r=0;this.R.tiers.forEach(([th],i)=>{if(this.fr[t]>=th)r=i;});return r;}
 compat(t){const req=Object.entries(this.R.requirements[t]);return this.R.compat.base+this.R.compat.span*req.reduce((s,[k,v])=>s+Math.min(1,this.st[k]/v),0)/req.length;}
 period(t){return this.R.period[t][week(this.day)]??1;}
 scale(t,n){return n>0?Math.max(1,round(n*this.compat(t)*this.period(t))):n;}
 *read(lines) {
  const previous=this.presentation;
  if(lines.stageCast&&(!lines.stageCast.length||!lines.stageCast.every(who=>previous.cast.includes(who))))this.set_cast(lines.stageCast,"pool");
  this.chars+=lines.reduce((sum,l)=>sum+Array.from(l.text).length,0);this.clicks+=lines.length;
  try{for(const line of lines){this.stage_line(line);yield* this.interactive({type:line.who==="ui"?"status":"line",line,scene:this.scene});}}
  finally{this.presentation=previous;}
 }
 pool(c,k) {
  const key=c+":"+k,items=this.d.pools[c]?.[k];if(!Array.isArray(items))throw new Error("Missing pool "+key);
  if(!this.bags[key]?.length){if(this.seen[key]){increment(this.log,"pool_ui");return [{who:"ui",text:"",exhaustedPool:{character:c,kind:k}}];}this.bags[key]=this.rng.shuffle(items.map((_,i)=>i));increment(this.seen,key);}
  const lines=items[this.bags[key].pop()].map(line=>({...line}));
  if(k==="pass"&&lines.length)lines[0].locationCue={place:"corridor",time:"放課後"};
  lines.stageCast=c==="mob"?[]:[c];return lines;
 }
 *touch(t,kind) {
  if(["talk","walk","call"].includes(kind))this.talkedWith.add(t);
  if(["walk","date","sched","trouble","call","talk"].includes(kind)){this.hurt[t]=0;if(this.lit[t]){this.lit[t]=false;yield* this.read(this.pool(this.CID[t],"fix"));increment(this.log,"fix");}}
 }
 *add_f(t,n,kind="ev") {
  n=this.scale(t,n);const old=this.fr[t];this.fr[t]=clamp(old+n,0,100);
  if(this.trio_cap&&n>0)this.fr[t]=Math.min(this.fr[t],Math.max(old,this.R.trio.cap_f));
  if(n>0)yield* this.touch(t,kind);
 }
 *add_t(t,n,kind="ev") {
  n=this.scale(t,n);const cap=Math.min(100,this.fr[t]+this.R.affection_model.t_cap_over_f);
  if(n<=0||this.tk[t]<cap)this.tk[t]=clamp(this.tk[t]+n,0,n>0?cap:100);
  if(n>0)yield* this.touch(t,kind);
  if(this.tk[t]>=this.R.nf_at&&this.fr[t]>=60&&!this.nf.has(t)){this.nf.add(t);yield* this.read(this.pool(this.CID[t],"nf"));increment(this.log,"nf");}
 }
 add_u(t,n){for(let i=0;i<n;i++){this.und[t]++;this.clues[t].add("理解"+this.und[t]);}}
 *gain(t,n,kind){yield* this.add_f(t,round(n*this.R.legacy_split.f),kind);yield* this.add_t(t,round(n*this.R.legacy_split.t),kind);}
 *apply(eff,char=null) {
  for(let [k,v] of Object.entries(eff)) {
   if(k==="pick")k=this.picked;const c=char||this.cur_char;
   if(k==="festival_role"){this.vars.festival_role=v;continue;}
   if(["f","t","u","pf","pt","pu"].includes(k)) {
    const t=k.startsWith("p")?this.R.pairs[c]:c,stat=k.at(-1);
    if(!t)throw new Error("Effect needs current character: "+k);
    if(stat==="f")yield* this.add_f(t,v,"talk");else if(stat==="t")yield* this.add_t(t,v,"talk");else this.add_u(t,v);
   }else if(k==="rvok")this.rvok[c]=1;else if(k==="rs")this.rs[c]+=v;
   else if(this.T.includes(k))yield* this.gain(k,v,"ev");
   else if(k==="stress")this.st.stress=clamp(this.st.stress+v,0,100);
   else if(k.startsWith("relax_"))this.relaxp4[k.slice(6)]=1;
   else yield* this.add_stat(k,v);
  }
 }
 *add_stat(k,v) {
  if(!(k in this.st))throw new Error("Unknown stat "+k);
  const before=this.st[k];this.st[k]=clamp(before+v,0,this.R.stat_max);
  for(const t of this.T)if(Object.keys(this.R.requirements[t])[0]===k)for(const [i,th] of [25,45,65].entries()){
   const key=t+":"+i;if(before<th&&this.st[k]>=th&&!this.statev.has(key)){this.statev.add(key);yield* this.read(this.pool(this.CID[t],"stat"+(i+1)));yield* this.gain(t,this.R.gains.stat_event,"stat");increment(this.log,"statev");}
  }
 }
 cond(conditions,char=null) {
  const c=char||this.cur_char,p=this.R.pairs[c];
  return conditions.every(([k,op,v])=>{
   const values={f:this.fr[c],t:this.tk[c],u:this.und[c],ident:this.ident[c]?1:0,pf:this.fr[p],pt:this.tk[p],rvok:this.rvok[c],rs:this.rs[c]};
   const x=k in values?values[k]:(this.vars[k]??this.st[k]??this.fr[k]??0);
   if(op==="==")return x===v;if(op==="!=")return x!==v;if(op===">=")return x>=v;if(op==="<=")return x<=v;if(op==="<")return x<v;if(op===">")return x>v;throw new Error("Unknown condition "+op);
  });
 }
 *pick(mode) {
  const score=t=>this.fr[t]+this.tk[t];
  if(mode==="top2"){const top=[...this.T].sort((a,b)=>this.fr[b]-this.fr[a]||this.T.indexOf(a)-this.T.indexOf(b)).slice(0,2);return this.rng.choice(top);}
  if(mode==="top"){let best=null;for(const t of this.T){const r=this.rng.random();if(!best||score(t)>best.score||(score(t)===best.score&&r>best.r))best={t,score:score(t),r};}return best.t;}
  if(mode==="lunch"){const two=this.T.map(t=>({t,score:score(t),r:this.rng.random()})).sort((a,b)=>b.score-a.score||a.r-b.r).slice(0,2).map(x=>x.t);return yield* this.interactive({type:"decision",kind:"pick_lunch",options:two});}
  return this.rng.weighted(this.T,this.T.map(t=>score(t)/2+10));
 }
 *interactive(event) {
  return yield event;
 }
 *maybe_identify() { /* 3-4 uses the body map; legacy guessing is disabled. */ }
 *run_scene(sid) {
  for(let count=0;count<1000;count++) {
   if(["DAY","ENDING","END"].includes(sid))return sid;
   if(sid==="EXAM"){yield* this.exam();return "DAY";}
   if(sid.startsWith("BODYMAP:")||sid==="GOAL:pick"){if(!this.ui_route)throw Error("UI extension unavailable");const next=this.uiNext||"DAY";this.uiNext=null;sid=yield* this.ui_route(sid,next);continue;}
   if(sid.startsWith("MINIGAME:")){sid=yield* this.minigame(sid.slice(9));continue;}
   if(sid.startsWith("DREAM:"))throw new Error("Dreams are disabled in 3-4");
   const replacement=yield {type:"scene:resolve",id:sid};if(typeof replacement==="string")sid=replacement;
   const s=this.S[sid];if(!s)throw new Error("Unknown scene "+sid);
   this.scene=s;this.set_cast(/^(?:lake_|kz_|fs2_crisis_)/.test(sid)||sid==="ev_lake"?s.cast||[]:[],"scene:"+sid);yield {type:"scene",scene:s};yield* this.read(s.lines);let next=null;increment(this.seen,"scene:"+sid);
   const prev=this.cur_char;if(s.char)this.cur_char=s.char;
   for(const c of s.clues||[])this.clues[c.char].add(c.text);
   for(const ch of s.choices) {
    let attempt=0;while(true){
    if(ch.pre)yield* this.read(ch.pre);
    let options=ch.options.filter(o=>!o.cond||this.cond(o.cond));
    if(ch.source==="top2"){const ids=[...this.T].sort((a,b)=>this.fr[b]+this.tk[b]-this.fr[a]-this.tk[a]||this.T.indexOf(a)-this.T.indexOf(b)).slice(0,2);options=options.filter(o=>ids.includes(o.char));}
    if(this.R.shuffle_choices_in.includes(s.day))options=this.rng.sample(options,options.length);
    increment(this.log,"hidden_shown",options.filter(o=>o.cond).length);
    if(!options.length)throw new Error("No available options: "+sid);
    const index=yield* this.interactive({type:"decision",kind:"choose",scene:s,choice:ch,prompt:ch.prompt,options});
    if(!Number.isInteger(index)||!options[index])throw new Error("Invalid choice index");
    const o=options[index];this.clicks++;yield* this.read(o.response);yield* this.apply(attempt?Object.fromEntries(Object.entries(o.effects||{}).map(([k,v])=>[k,v>0?Math.ceil(v/2):v])):o.effects);if(o.next)next=o.next;
    if(!ch.retry||o.correct)break;if(++attempt>1000)throw Error("Choice retry limit reached");
    }
   }
   if(s.after)yield* this.read(s.after);this.set_cast([],"end:"+sid);this.scene=null;this.cur_char=prev;const g=s.goto;yield {type:"scene:after",id:sid};
   if(next===null) {
    if(!g)return "DAY";
    if(g.type==="if")next=this.cond(g.cond)?g.then:g.else;
    else if(g.type==="pick"){this.picked=yield* this.pick(g.mode);next=g.prefix+this.picked;}
    else if(g.type==="rank")throw new Error("Rank events are disabled in 3-4");
    else {next=g.id;this.uiNext=g.next||null;yield* this.apply(g.effects||{});}
   }
   yield* this.maybe_identify();sid=next;
  }
  throw new Error("Scene chain exceeded safe bound");
 }
 next_talk(t,prefixes=["cv_"]) {
  for(const pre of prefixes)for(const k of Object.keys(this.S).filter(k=>k.startsWith(pre+t+"_")&&!this.seen["scene:"+k]).sort())if(!this.S[k].need||this.cond(this.S[k].need,t))return k;
  return null;
 }
 rival_due(t) {
  const R=this.R.rival,st=this.rv[t];if(st>=3||this.tk[t]<R.stage_t[st])return 0;
  if(st+1===3){const wk=week(this.day),n=/^w\d+$/.test(wk)?Number(wk.slice(1)):99;if(n<R.stage3_from_week)return 0;}
  return st+1;
 }
 *run_rival(t,stage){this.rv[t]=stage;this.cur_char=t;
  let resolved=stage===3?(this.rs[t]>=this.R.rival.resolve_rs?'3ok':'3ng'):String(stage);
  yield* this.run_scene("rv_"+t+"_"+(stage===3&&this.S["rv_"+t+"_3"]?"3":resolved));
  if(stage===3)resolved=this.rs[t]>=this.R.rival.resolve_rs?"3ok":"3ng";
  if(stage===2&&this.tk[this.R.pairs[t]]>=20&&this.S["rv_"+t+"_2j"])yield* this.run_scene("rv_"+t+"_2j");
  if(stage===3){this.rvok[t]=resolved==='3ok'?1:0;yield* this.add_t(t,resolved==='3ok'?4:-2,'talk');}
  this.cur_char=null;increment(this.log,"rival"+stage);
 }
 *dream(kind) {
  if(this.dreamed.has(kind))return;this.dreamed.add(kind);
  const t=yield* this.pick("top"),prev=this.cur_char;
  if(this.fr[t]>=this.R.dreams.min_f){this.cur_char=t;yield* this.run_scene("dream_"+kind+"_"+t);this.dream_cb[t]=kind;}
  else{this.cur_char=null;yield* this.run_scene("dream_"+kind+"_red");}
  this.cur_char=prev;increment(this.log,"dream_"+kind);
 }
 *talk(t,prefixes=["cv_"]) {
  this.talkedWith.add(t);
  if(t in this.dream_cb){const kind=this.dream_cb[t];delete this.dream_cb[t];yield* this.read(this.pool(this.CID[t],"dream_after_"+kind));increment(this.log,"dream_after");}
  if(this.rival_due(t)===1){this.rv[t]=1;yield* this.run_scene("rv_"+t+"_1");increment(this.log,"rival1");return true;}
  const k=this.next_talk(t,prefixes);
  if(!k){yield* this.read(this.pool("mob","talk_done"));increment(this.log,"talk_exhausted");return false;}
  yield* this.run_scene(k);increment(this.log,"talk");return true;
 }
 *day_tick() {
  const R=this.R.bomb;for(const t of this.T) {
   if(this.cool[t]>0)this.cool[t]--;
   if(this.fr[t]>=R.care_from) {
    this.hurt[t]++;if(this.hurt[t]>=R.lit&&!this.lit[t]){this.lit[t]=true;increment(this.log,"lit");}
    if(this.hurt[t]>=R.explode) {
     yield* this.read(this.pool(this.CID[t],"bomb"));increment(this.log,"explode");
     this.fr[t]=Math.max(0,this.fr[t]+R.explode_self);this.tk[t]=Math.max(0,this.tk[t]+R.explode_self);
     for(const u of this.T)if(u!==t){this.fr[u]=Math.max(0,this.fr[u]+R.explode_others);this.tk[u]=Math.max(0,this.tk[u]+R.explode_others);}
     this.hurt[t]=0;this.lit[t]=false;
    }
   }
  }
 }
 *do_place(place,mult=1) {
  const P=this.R.places[place];if(!P)throw new Error("Unknown place");this.clicks+=2;
  const fail=this.st.stress>=this.R.fail.stress_from&&this.rng.random()<this.R.fail.chance;
  for(const [k,[a,b]] of Object.entries(P.gain)){let v=this.rng.randint(a,b)*mult;if(fail&&v>0)v=Math.floor(v/2);yield* this.add_stat(k,round(v));}
  this.st.stress=clamp(this.st.stress+P.stress,0,100);yield {type:"stats",place,stats:{...this.st},fail};
  yield* this.read([{who:"ui",text:this.R.places[place].label}]);
 }
 *encounter(place) {
  const E=this.R.encounter,here=this.T.filter(t=>{const override=this.encounterChance?.(t,place,this.weekday);const chance=override??(this.R.schedule[t][this.weekday]===place?E.sched_chance:0);return chance>0&&this.rng.random()<Math.min(1,chance*(this.encounterMultipliers?.[t]||1));});
  const override=yield {type:"encounter:place",place,weekday:this.weekday,candidates:[...here]};if(override?.handled)return;
  if(here.length){const t=here.reduce((a,b)=>this.fr[b]>this.fr[a]?b:a);yield* this.sched_meet(t);return;}
  if(this.rng.random()<E.pass_chance){const t=this.rng.weighted(this.T,this.T.map(x=>(1+this.tier(x))*(this.encounterMultipliers?.[x]||1)));yield {type:"encounter",char:t,kind:"pass"};yield* this.read(this.pool(this.CID[t],"pass"));yield* this.add_f(t,this.R.gains.pass,"pass");increment(this.log,"pass");return;}
  if(this.rng.random()<E.trouble_chance) {
   const cand=Object.keys(this.S).filter(k=>k.startsWith("tr_")&&!this.seen["scene:"+k]);
   if(cand.length){const sid=this.rng.choice(cand),t=sid.split("_")[1];this.cur_char=t;yield* this.run_scene(sid);yield* this.touch(t,"trouble");increment(this.log,"trouble");this.cur_char=null;return;}
  }
  if(this.rng.random()<E.rumor_chance){yield* this.read(this.pool("mob","rumor"));increment(this.log,"rumor");return;}
  yield* this.read(this.pool("mob","nobody"));increment(this.log,"nobody");
 }
 *sched_meet(t) {
  this.talkedWith.add(t);
  yield {type:"encounter",char:t,kind:"sched"};
  increment(this.log,"sched");const ps=this.pstage[t],main=Object.keys(this.R.requirements[t])[0];let next=null;
  if(ps===0)next=1;else if(ps===1&&this.fr[t]>=30&&this.st[main]>=25)next=2;else if(ps===2&&this.ident[t]&&this.fr[t]>=50)next=3;else if(ps===3&&this.ident[t]&&this.fr[t]>=70&&true)next=4;
  if(next){this.pstage[t]=next;yield* this.run_scene("pe_"+t+"_"+next);increment(this.log,"personal");}
  else if(this.rng.random()<this.R.talk.sched_talk_chance&&this.next_talk(t)){this.cur_char=t;yield* this.talk(t);this.cur_char=null;}
  else yield* this.read(this.pool(this.CID[t],"sched"+Math.min(2,Math.floor(this.tier(t)/2))));
  yield* this.add_f(t,this.R.gains.sched,"sched");
 }
 *rank_event(g){
  const top=[...this.T].sort((a,b)=>this.fr[b]+this.tk[b]-this.fr[a]-this.tk[a]||this.T.indexOf(a)-this.T.indexOf(b)).slice(0,g.n),min=this.R.rank_event.min_f,prev=this.cur_char;let red=false;const scenes=[];
  try{for(const t of [...top].reverse()){
   if(this.fr[t]<min){if(!red){red=true;this.cur_char=null;scenes.push(g.prefix+"red");yield* this.run_scene(g.prefix+"red");}continue;}
   this.cur_char=t;scenes.push(g.prefix+t);yield* this.run_scene(g.prefix+t);
  }
  if(this.fr[top[0]]>=min){this.cur_char=top[0];scenes.push(g.prefix+"end_"+top[0]);yield* this.run_scene(g.prefix+"end_"+top[0]);}
  }finally{this.cur_char=prev;}
  this.rankHistory.push({day:this.day,top,scenes});increment(this.log,"rank_event");
 }
 *bond_check(n){
  const B=this.R.bond;if(!B||B.skip_event_days&&this.R.events_at[this.day]||this.bond_day===this.day)return;
  const candidates=this.T.filter(t=>{const st=this.bond[t],g=B.stages[st];return st===n-1&&g&&this.fr[t]>=g.f&&this.tk[t]>=g.t;}).sort((a,b)=>this.fr[b]+this.tk[b]-this.fr[a]-this.tk[a]||this.T.indexOf(a)-this.T.indexOf(b));
  if(!candidates.length)return;const t=candidates[0];this.bond[t]++;this.bond_day=this.day;increment(this.log,"bond");yield* this.run_scene("kz_"+t+"_"+this.bond[t]);
 }
 *school_day() {
  this.set_cast([],"afternoon");
  if(this.sick_next){this.sick_next=false;this.st.stress=this.R.sick.reset;yield* this.read(this.pool("mob","sick"));increment(this.log,"sick");yield* this.day_tick();return;}
  
  const place=yield* this.interactive({type:"decision",kind:"place",options:Object.keys(this.R.places)});
  yield* this.do_place(place);if(this.st.stress>=this.R.sick.stress_at)this.sick_next=true;
  yield* this.encounter(place);yield* this.gate();yield* this.day_tick();
 }
 *trio(t) {
  this.set_cast([this.CID[t],this.d.meta.friend],"trio:"+t);
  yield* this.read(this.pool(this.d.meta.friend,"trio_join"));this.trio_cap=true;yield* this.add_f(t,this.R.trio.gain_f,"walk");this.cur_char=t;
  const k=Object.keys(this.S).sort().find(x=>x.startsWith("tw_"+t+"_")&&!this.seen["scene:"+x]);
  if(k){yield* this.run_scene(k);increment(this.log,"trio_talk");}else yield* this.read(this.pool(this.d.meta.friend,"trio_walk"));
  this.cur_char=null;this.trio_cap=false;increment(this.log,"trio");
 }
 *gate() {
  const G=this.R.gate;this.set_cast([],"gate");yield {type:"location",place:"gate",time:"下校",bgm:"gate_walk"};
  const due=this.T.map(t=>[this.tk[t],t,this.rival_due(t)]).filter(x=>[2,3].includes(x[2])).sort((a,b)=>b[0]-a[0]||(a[1]<b[1]?1:-1));
  if(due.length){const [,t,stage]=due[0];this.clicks++;yield* this.run_rival(t,stage);return;}
  if(this.rng.random()<G.nobody_chance){yield* this.read(this.pool(this.d.meta.friend,"gate"));yield* this.read(this.pool(this.d.meta.friend,"walk"));this.clicks++;return;}
  const weights=this.T.map(t=>G.weight_base+G.weight_compat*(this.compat(t)-0.75)*4+(this.fr[t]>=80&&this.tk[t]>=70?G.weight_tier4:0));
  const t=this.rng.weighted(this.T,weights),c=this.CID[t];this.set_cast([c],"gate:"+t);yield* this.read(this.pool(c,"gate"));
  if(this.fr[t]>=80&&this.tk[t]>=70) {
   yield* this.read(this.pool(c,"invite4"));
   if(yield* this.interactive({type:"decision",kind:"accept_invite",target:t,options:[true,false]})){yield* this.add_f(t,this.R.gains.invite_accept,"walk");this.cur_char=t;yield* this.talk(t);this.cur_char=null;increment(this.log,"walk");}
   else this.hurt[t]+=this.R.bomb.decline_invite;
   this.clicks++;return;
  }
  if(!(yield* this.interactive({type:"decision",kind:"ask",target:t,options:[true,false]}))){yield* this.read(this.pool(this.d.meta.friend,"alone"));this.clicks++;return;}
  this.clicks++;
  if(this.fr[t]<50) {
   yield* this.read(this.pool(c,"refuse"+Math.min(this.tier(t),1)));
   if(this.fr[t]>=this.R.trio.from_f&&this.rng.random()<this.R.trio.redcell_chance){yield* this.trio(t);return;}
   increment(this.log,"refused");return;
  }
  yield* this.read(this.pool(c,this.tk[t]>=60?"ok3":"ok2"));yield* this.add_f(t,this.R.gains.walk,"walk");yield* this.add_t(t,1,"walk");
  this.cur_char=t;yield* this.talk(t);this.cur_char=null;increment(this.log,"walk");
 }
 spot_value(t,spot){const V=this.R.date_values,n=this.spot_visits[t+":"+spot]||0;return (this.R.spot_like[t].includes(spot)?V.like:this.R.spot_bad[t].includes(spot)?V.bad:V.neutral)-V.repeat_penalty*n+(n===0?V.first_visit_bonus:0);}
 can_date(t){return this.fr[t]>=30;}
 spots_open(target){return Object.keys(this.R.spots).filter(s=>(s!=='mizuho'||target==='kanade')&&(!this.R.spot_season[s]||this.R.spot_season[s].includes(week(this.day))));}
 *holiday() {
  this.set_cast([],"holiday");
  const act=yield* this.interactive({type:"decision",kind:"holiday",options:[]});this.clicks+=2;
  if(act[0]==="birthday"){yield* this.run_scene("bd_"+act[1]);return;}
  if(act[0]==="date"){
   let [,t,spot]=act;const c=this.CID[t];if(!this.spots_open(t).includes(spot))spot="library";
   if(!this.can_date(t)){yield* this.read(this.pool(c,"date_refuse"));increment(this.log,"date_refused");return;}
   increment(this.log,"date");this.dates[t]++;const value=this.spot_value(t,spot),key=t+":"+spot;
   this.set_cast([c],"date:"+t);yield {type:"location",place:spot,time:"休日",bgm:"date"};
   if(!this.spot_visits[key])yield* this.read(this.d.pools[c]["spot_"+spot][0]);else{yield* this.read(this.pool(c,"repeat"));increment(this.log,"date_repeat");}
   increment(this.spot_visits,key);const f0=this.fr[t],t0=this.tk[t];
   if(value>0)yield* this.add_f(t,value,"date");else yield* this.apply({[t]:value});
   this.cur_char=t;yield* this.talk(t,["dt_","cv_"]);
   if(this.rng.random()<0.5){const cand=Object.keys(this.S).filter(k=>k.startsWith("hp_"+t+"_")&&!this.seen["scene:"+k]);if(cand.length){yield* this.run_scene(this.rng.choice(cand));increment(this.log,"happen");}}
   this.cur_char=null;const total=this.fr[t]-f0+this.tk[t]-t0;
   for(const [th,text,bonus] of this.R.date_impression)if(total>=th){yield* this.read([{text}]);increment(this.log,"impression_"+th);if(bonus>0)yield* this.add_t(t,bonus,"date");else if(bonus<0)this.tk[t]=Math.max(0,this.tk[t]+bonus);break;}
   this.st.stress=Math.max(0,this.st.stress-10);
  }else if(act[0]==="phone") {
   const t=act[1],cap=Math.min(4,this.tier(t)+1+(this.ident[t]?1:0)),adv=this.info[t]<cap;if(adv)this.info[t]++;
   yield* this.read(this.pool(this.d.meta.friend,"phone"));yield* this.read(adv?this.d.pools[this.CID[t]]["info"+Math.max(1,this.info[t])][0]:this.pool(this.d.meta.friend,"no_news"));
   if(Object.values(this.lit).some(Boolean))yield* this.read([{text:"（不調の警告）"}]);yield* this.read(this.pool(this.d.meta.friend,"phone_end"));
  }else if(act[0]==="call"){const t=act[1];if(this.fr[t]>=30)yield* this.add_f(t,this.R.gains.call,"call");else yield* this.touch(t,"call");yield* this.read(this.pool(this.CID[t],"phone_call"));}
  else if(act[0]==="play"){yield* this.read(this.pool(this.d.meta.friend,"play"));this.st.stress=Math.max(0,this.st.stress-20);}
  else yield* this.do_place(act[1],this.R.holiday_multiplier);
 }
 *identify(t,guess) {
  if(this.ident[t]||this.cool[t]>0||this.clues[t].size<this.R.identify.clues_needed)return;
  this.clicks+=2;
  if(guess===this.R.identify.answer[t]){this.ident[t]=true;yield* this.gain(t,this.R.gains.identify,"ev");yield* this.add_stat("gaku",2);yield* this.add_stat("rika",2);yield {type:"identified",target:t};yield* this.read(this.d.pools[this.CID[t]].textbook[0]);increment(this.log,"identified");}
  else{this.fr[t]=Math.max(0,this.fr[t]+this.R.gains.identify_wrong);this.cool[t]=this.R.identify.cooldown_days;increment(this.log,"wrong_guess");yield {type:"feedback",text:this.R.identify.wrong_hints[guess]||"観察メモをもう一度見直してみよう。",target:t};}
 }
 *exam(){
  const questions=this.rng.sample(this.d.exam_bank,this.R.exam.questions);let score=0;
  for(const [number,q] of questions.entries()){
   const lines=[{text:q.q},...q.options.map(text=>({text}))];
   this.chars+=lines.reduce((n,l)=>n+Array.from(l.text).length,0);this.clicks+=lines.length+1;
   const answer=yield* this.interactive({type:"decision",kind:"exam",question:q,number:number+1,total:questions.length});
   const roll=this.rng.random();
   const correct=answer?.simulation?roll<Math.min(.95,.35+.006*(this.st.gaku+this.st.rika)/2+(answer.studyBonus||0)):answer===q.answer;
   if(correct)score++;
   yield {type:"exam-feedback",correct,answer:q.options[q.answer],score,number:number+1,total:questions.length};
   yield* this.read([{text:q.explain}]);
  }
  const composite=score*6+this.st.gaku*.25+this.st.rika*.15;
  this.vars.rank=Math.max(1,round(241-2.4*composite));increment(this.log,"exam_score",score);increment(this.log,"rank",this.vars.rank);
  yield {type:"exam-result",score,total:questions.length,rank:this.vars.rank,students:this.R.exam.students};
 }
 *minigame(name){
  const M=this.R.minigames[name];if(!M)throw Error("Unknown minigame "+name);this.clicks+=10;let mg=0;
  if(name==="borrow"){
   const targets=this.rng.sample(this.T,3);
   for(const [number,t] of targets.entries()){
    const answer=yield {type:"decision",kind:"minigame",name,target:t,number:number+1,total:targets.length};
    const roll=this.rng.random(),p=this.ident[t]?.9:Math.min(.85,.35+.08*this.clues[t].size);
    const correct=answer?.simulation?roll<p:answer===t;
    if(correct){mg++;yield* this.gain(t,this.R.gains.borrow_ok,"ev");this.clues[t].add("借り物競走");}
    yield {type:"game-feedback",correct,target:t,number:number+1,total:targets.length};
   }
  }else{
   const jitter=name==="dash"?this.rng.random()*1.7-.5:this.rng.random()*1.2-.6;
   const modeled=name==="dash"?round(this.st.tai/30+jitter):round((this.st.tai+this.st.kiku)/50+this.fr[this.picked]/60+jitter);
   const answer=yield {type:"decision",kind:"minigame",name,target:this.picked};
   mg=clamp(answer?.simulation?modeled:(Number.isInteger(answer?.score)?answer.score:0),0,3);
  }
  this.vars.mg=mg;increment(this.log,"mg_"+name,mg);return M.next;
 }
 ending(){
  const E=this.R.ending,candidates=[];
  for(const t of this.T){
   const steps=Math.min(this.R.relax.max_steps,(this.dates[t]>=this.R.relax.dates_for_step?1:0)+this.relaxp4[t]);
   const requirements=Object.entries(this.R.requirements[t]).every(([k,v])=>this.st[k]>=v-steps*this.R.relax.per_step);
   if(this.fr[t]>=E.f&&this.tk[t]>=E.t&&this.und[t]>=E.u&&this.ident[t]&&requirements&&!this.lit[t])candidates.push(t);
  }
  if(candidates.length)return "end_"+candidates.reduce((a,b)=>this.fr[b]+this.tk[b]>this.fr[a]+this.tk[a]?b:a);
  const P=this.R.pair_ending;let best=null;
  for(const a of ["ins","adr","thy"]){const b=this.R.pairs[a];if(Math.min(this.fr[a],this.fr[b])>=P.f&&Math.min(this.tk[a],this.tk[b])>=P.t&&Math.min(this.und[a],this.und[b])>=P.u&&this.ident[a]&&this.ident[b]){
   const score=this.fr[a]+this.fr[b]+this.tk[a]+this.tk[b];if(!best||score>best.score)best={score,a};
  }}
  return best?"end_pair_"+best.a:"end_friend";
 }
 *play({throughApril=false}={}) {
  for(const [day,date,kind,wd] of this.R.calendar) {
   if(throughApril&&!date.startsWith("4月")&&!date.startsWith("5月1日")){yield {type:"milestone",id:"M2",text:"4月の試遊はここまでです。"};return "M2";}
   this.day=day;this.weekday=wd;this.talkedWith.clear();this.set_cast([],"day:"+day);yield {type:"day:morning",day,weekday:wd,stress:this.st.stress};yield {type:"day",day,date,kind};
   const event=this.R.events_at[day];
   if(event){const result=yield* this.run_scene(event);if(result==="ENDING"){
    const ending=this.ending();yield {type:"ending:pick",scene:ending};this.cur_char=this.T.find(t=>ending.startsWith("end_"+t+"_"))||null;
    yield* this.run_scene(ending);this.cur_char=null;this.set_cast([],"complete");yield {type:"complete",ending};return ending;
   }}
   if(kind==="school")yield* this.school_day();else if(kind==="holiday"){yield* this.holiday();yield* this.day_tick();}
   else if(kind==="exam"||kind==="event"){if(kind==="exam")yield* this.gate();yield* this.day_tick();}
   yield {type:"day:end",day,talkedWith:[...this.talkedWith]};this.set_cast([],"day-end:"+day);yield {type:"day-end",day};
  }
 }
 snapshot() {
  const out={};for(const k of ["st","fr","tk","und","hurt","lit","ident","cool","pstage","dates","spot_visits","relaxp4","info","chars","clicks","log","sick_next","day","weekday","vars","picked","seen","bags","cur_char","dream_cb","rv","rvok","rs","trio_cap"])out[k]=this[k];
  if(this.ext34)out.ext34=this.ext34;
  out.bond={...this.bond};out.bond_day=this.bond_day;out.rankHistory=JSON.parse(JSON.stringify(this.rankHistory));out.clues=Object.fromEntries([...this.T,this.d.meta.mentor].filter(t=>this.clues[t]).map(t=>[t,[...this.clues[t]].sort()]));out.statev=[...this.statev].sort();out.nf=[...this.nf].sort();out.dreamed=[...this.dreamed].sort();return JSON.parse(JSON.stringify(out));
 }
}
const api={Game,validate,week};Object.defineProperty(api,"T",{get:()=>global.HM_GAME_34?.rules.cast.targets||[]});global.HMCore=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);

