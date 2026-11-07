/* Extension bridge. Construct again and replay input history to restore. */
(function(g){"use strict";
const Weather=g.Ext34Weather||(typeof module!=="undefined"?require('./ext34-weather.js'):null);
const Gifts=g.Ext34Gifts||(typeof module!=="undefined"?require('./ext34-gifts.js'):null);
const Goals=g.Ext34Goal||(typeof module!=="undefined"?require('./ext34-goal.js'):null);
const Bodymap=g.Ext34Bodymap||(typeof module!=="undefined"?require('./ext34-bodymap.js'):null);
const Ending=g.Ext34Ending||(typeof module!=="undefined"?require('./ext34-ending.js'):null);
const Mini=g.Ext34Minigames||(typeof module!=="undefined"?require('./ext34-minigames.js'):null);
const Rng=g.HMRng||(typeof module!=="undefined"?require('./rng-v4.js'):null);
class Session {
 constructor(game){this.game=game;this.state={weather:Weather.initial(),gift:Gifts.initial(game.R.gifts),goal:null,bonusPending:false,bonusActive:false,manualBuffer:false,missingPools:[],chinEveningTalk:false,mentorMapOffered:false,birthdayOffered:[],bodymap:Bodymap.initial()};
  game.ext34=this.state;
  const mentor=game.d.meta.mentor;game.fr[mentor]=0;game.tk[mentor]=0;game.und[mentor]=0;game.ident[mentor]=false;game.clues[mentor]=new Set();
  const session=this,original=game.add_stat.bind(game),baseCond=game.cond.bind(game);
  game.cond=function(conditions,char=null){return conditions.every(condition=>{
   const [key,op,value]=condition,subject=char||game.cur_char;let actual,expected=value,custom=true;
   if(key==='weather'){const bands=['sunny','cloudy','rain','thunder'];actual=bands.indexOf(session.state.weather.band||'sunny');expected=typeof value==='string'?bands.indexOf(value):value;}
   else if(key==='rain_days')actual=session.state.weather.rainDays;
   else if(key==='birthday')actual=Number(game.R.gifts.birthdays[subject]===game.day);
   else if(key.startsWith('bm_'))actual=Number(!!game.ident[key.slice(3)]);
   else if(key.startsWith('gifted_')){const id=game.T.find(t=>key.startsWith('gifted_'+t+'_'));actual=id?Number((session.state.gift.given[id]?.[key.slice(('gifted_'+id+'_').length)]||0)>0):0;}
   else custom=false;
   if(!custom)return baseCond([condition],char);
   if(op==='>=')return actual>=expected;if(op==='<=')return actual<=expected;if(op==='>')return actual>expected;if(op==='<')return actual<expected;if(op==='==')return actual==expected;if(op==='!=')return actual!=expected;throw Error('Unknown condition operator '+op);
  });};
  const basePeriod=game.period.bind(game);
  game.period=function(id){let mult=basePeriod(id);const dynamic=game.R.period_dynamic;if(!dynamic)return mult;
   if(id==='lauren'&&session.state.bonusActive)mult*=dynamic.lauren_after_goal;
   if(id==='hyoma'&&['rain','thunder'].includes(session.state.weather.band))mult*=dynamic.hyoma_rain_day;
   const birthday=game.R.gifts.birthdays[id];if(birthday&&game.day.split(/[dh]/)[0]===birthday.split(/[dh]/)[0])mult*=dynamic.birthday_week;
   return mult;
  };
  game.encounterChance=(id,place)=>game.day.startsWith('w6')?(place==='library'?0.3:0):null;
  game.ending=()=>{session.lastEnding=session.pickEnding();session.state.lastEnding=session.lastEnding;return session.lastEnding.scene;};
  game.ui_route=function*(id,next){
   if(id.startsWith('BODYMAP:')){const char=id.slice(8),request=yield {type:'bodymap:required',char};if(request?.answers){const date=game.R.calendar.find(row=>row[0]===game.day)?.[1].match(/(\d+)月(\d+)日/);if(!date)throw Error('Calendar unavailable');const ordinal=Date.UTC(2000,+date[1]-1,+date[2])/86400000;yield* session.submitBodymap(char,request.answers,ordinal,{forced:true});}}
   else {const cards=Goals.draw(game.R.weekly_goal,game.st,game.rng),answer=yield {type:'goal:pick',cards},card=cards.find(c=>c.id===answer);if(!card)throw Error('Invalid weekly goal');session.state.goal={card,progress:0,active:true,walkStart:game.log.walk||0};}
   return next;
  };
  game.minigame=function*(name){
   const rule=game.R.minigames[name];if(!rule||!['beat','guard'].includes(name))throw Error('Disabled or unknown minigame');
   let score,reward;
   if(name==='guard'){
    const sequence=[rule.choices[0],rule.choices[2],rule.choices[0]];
    const actions=yield {type:'minigame:guard',sequence};
    if(!Array.isArray(actions)||actions.length!==rule.rounds)throw Error('Invalid guard input');
    const state=Mini.guardStart(rule,sequence);for(const action of actions)Mini.guardChoose(state,rule,action);
    score=state.correct;reward=score===rule.rounds?rule.win:rule.lose;
   }else{
    const just=session.state.chinEveningTalk;
    const beats=yield {type:'minigame:beat',just};
    if(!Array.isArray(beats)||beats.length!==rule.beats)throw Error('Invalid beat input');
    const state=Mini.beatStart(rule,just);for(const beat of beats){if(beat.tap===null)Mini.beatMiss(state,rule);else Mini.beatTap(state,rule,beat.expected,beat.tap);}
    const result=Mini.beatResult(state,rule,[80,150,250]);score=result.score;reward=result.reward;
   }
   for(const [key,value] of Object.entries(reward||{})){
    const m=key.match(/^(.+)_(f|t)$/);if(m){const [,id,kind]=m;if(kind==='f')game.fr[id]=Math.max(0,Math.min(100,game.fr[id]+value));else game.tk[id]=Math.max(0,Math.min(100,game.fr[id]+game.R.affection_model.t_cap_over_f,game.tk[id]+value));}
    else yield* game.add_stat(key,value);
   }
   game.vars.mg=score;yield {type:'minigame:done',id:name,score};return rule.scene_next;
  };
  const apply=game.apply.bind(game);
  game.apply=function*(effects,char=null){
   const subject=char||game.cur_char,rest={...effects};
   for(const key of Object.keys(rest)){
    const match=key.match(/^(shion|shito|chin|lauren|kanade|hyoma|eguchi)_([ftu])$/);if(!match)continue;
    const [,target,kind]=match,value=rest[key];delete rest[key];
    if(target===mentor){if(kind==='f')game.fr[target]=Math.max(0,Math.min(100,game.fr[target]+value));else if(kind==='u')game.und[target]=Math.max(0,game.und[target]+value);game.tk[target]=0;}
    else if(kind==='f')yield* game.add_f(target,value,'talk');else if(kind==='t')yield* game.add_t(target,value,'talk');else game.add_u(target,value);
   }
   for(const key of Object.keys(rest))if(key.startsWith('gift:')){yield* session.grantGift(subject,key.slice(5));delete rest[key];}
   if('goal_ok' in rest){if(session.state.goal?.active)session.state.goal.override=true;delete rest.goal_ok;}
   if('buffer' in rest){session.state.manualBuffer=true;delete rest.buffer;}
   if(subject===mentor){
    if('f' in rest){game.fr[mentor]=Math.max(0,Math.min(100,game.fr[mentor]+rest.f));delete rest.f;}
    if('t' in rest){game.tk[mentor]=0;delete rest.t;}
    if('u' in rest){game.und[mentor]=Math.max(0,game.und[mentor]+rest.u);delete rest.u;}
   }
   yield* apply(rest,char);
  };
  game.add_stat=function*(key,value){const before=game.st[key];const boosted=value>0&&session.state.bonusActive?Rng.pyRound(value*game.R.weekly_goal.success.next_week_gain_mult):value;
   yield* original(key,boosted);const delta=game.st[key]-before,goal=session.state.goal;if(goal&&goal.active&&goal.card.stat===key&&delta>0)goal.progress+=delta;};
 }
 pickEnding(){
  const game=this.game,R=game.R,people={};
  for(const id of game.T){
   const steps=Math.min(R.relax.max_steps,(game.dates[id]>=R.relax.dates_for_step?1:0)+(game.relaxp4[id]||0));
   const statsEligible=Object.entries(R.requirements[id]).every(([key,need])=>game.st[key]>=need-steps*R.relax.per_step);
   people[id]={f:game.fr[id],t:game.tk[id],u:game.und[id],identified:game.ident[id],statsEligible};
  }
  const id=game.d.meta.mentor,M=R.mentor.ending;
  const mentorEligible=game.fr[id]>=M.f&&game.und[id]>=M.u&&!!game.ident[id]&&Object.entries(M.stats).every(([k,n])=>game.st[k]>=n);
  if(R.toni_route&&game.vars.toni_visits>=R.toni_route.visits_needed&&game.vars.toni_romance===1)return {kind:'suki',char:'toni',scene:'end_toni_suki',letter:mentorEligible};
  return Ending.pick(R,people,game.T,mentorEligible,Object.keys(R.pair_ending.scenes));
 }
 *submitBodymap(char,answers,dayOrdinal,{forced=false}={}){
  const game=this.game,r=game.R.bodymap,memos=forced?Math.max(r.memos_needed,game.clues[char]?.size||0):(game.clues[char]?.size||0);
  const result=Bodymap.submit(this.state.bodymap,r,char,answers,dayOrdinal,memos);
  if(result.identified){
   game.ident[char]=true;game.fr[char]=Math.min(100,game.fr[char]+r.reward.f);
   yield* game.add_stat('gaku',r.reward.gaku);yield* game.add_stat('rika',r.reward.rika);
   yield {type:'identify',char,sameOxy:result.sameOxy};
  }else{
   game.fr[char]=Math.max(0,game.fr[char]+result.friendship);
   yield {type:'bodymap:wrong',char,fields:result.wrong,retryAt:result.retryAt};
  }
  return result;
 }
 *ask(event){
  let answer=yield event;
  while(answer&&typeof answer==='object'&&answer.bodymap){
   const row=this.game.R.calendar.find(r=>r[0]===this.game.day),match=row?.[1].match(/(\d+)月(\d+)日/);
   if(!match)throw Error('Calendar date unavailable');
   const ordinal=Date.UTC(2000,Number(match[1])-1,Number(match[2]))/86400000;
   yield* this.submitBodymap(answer.bodymap.char,answer.bodymap.answers,ordinal);
   answer=yield {...event,revisit:true};
  }
  return answer;
 }
 *readNamedPool(who,key){
  const game=this.game,nested=game.d.pools[who]?.[key],top=game.d.pools[key];
  if(Array.isArray(nested)&&nested.length){yield* game.read(game.pool(who,key));return;}
  if(Array.isArray(top)&&top.length){
   const id='ext34:'+key;if(!game.bags[id]?.length){if(game.seen[id])return;game.bags[id]=game.rng.shuffle(top.map((_,i)=>i));game.seen[id]=1;}
   const item=top[game.bags[id].pop()],lines=Array.isArray(item)?item:[item];yield* game.read(lines.map(line=>({...line})));return;
  }
  if(!this.state.missingPools.includes(key))this.state.missingPools.push(key);
 }
 *runNested(id,{stopBefore=null}={}){
  const iter=this.game.run_scene(id);let step=iter.next();
  while(!step.done){const event=step.value;if(event.type==='scene:resolve'&&event.id===stopBefore){iter.return();return;}const answer=['scene:resolve','scene:after'].includes(event.type)?undefined:yield* this.ask(event);step=iter.next(answer);}
  return step.value;
 }
 *grantGift(char,item){
  const game=this.game,r=char==='shion'&&game.day==='w5d1'?{...game.R.gifts,birthdays:{...game.R.gifts.birthdays,shion:'w5d1'}}:game.R.gifts,gift=Gifts.give(this.state.gift,r,char,item,game.day);
  if(this.state.goal?.active&&this.state.goal.card.count==='gift')this.state.goal.progress++;
  if(gift.effects.f)game.fr[char]=Math.max(0,Math.min(100,game.fr[char]+gift.effects.f));
  if(gift.effects.t){const cap=Math.min(100,game.fr[char]+game.R.affection_model.t_cap_over_f);game.tk[char]=Math.max(0,Math.min(cap,game.tk[char]+gift.effects.t));}
  yield {type:'gift:given',...gift,tickets:this.state.gift.tickets};
 }
 *giftEncounter(e){
  const game=this.game,allowed=Gifts.canGive(this.state.gift,game.R.gifts,e.char);
  const choice=yield* this.ask({...e,giftOptions:allowed?Object.keys(game.R.gifts.items):[],giftTickets:this.state.gift.tickets,giftSeen:{...(this.state.gift.seen[e.char]||{})},birthday:game.R.gifts.birthdays[e.char]===game.day});
  if(choice?.gift){
   if(!allowed)throw Error('Gift not available');
   yield* this.grantGift(e.char,choice.gift);
  }
 }
 *play(options={}){
  const game=this.game,it=game.play(options);let step=it.next();
  while(!step.done){const e=step.value;let response;
   if(e.type==='day:morning'){
    this.state.manualBuffer=false;
    if(e.weekday==='月')Gifts.monday(this.state.gift,game.R.gifts);
    const weather=Weather.morning(this.state.weather,game.R.mood_weather,e.stress);this.state.weather.band=weather.band;
    response=yield* this.ask({...e,weather,giftTickets:this.state.gift.tickets});
    yield* this.readNamedPool(game.d.meta.friend,'toni_morning_'+weather.band);
    if(e.day==='w1d2'&&game.S.ev_lunch_exchange&&!game.seen['scene:ev_lunch_exchange'])yield* this.runNested('ev_lunch_exchange');
    if(weather.scene){if(game.S[weather.scene])yield* this.runNested(weather.scene);else yield {type:'missing-scene',id:weather.scene};}
    if(e.weekday==='月'){
     this.state.bonusActive=this.state.bonusPending;this.state.bonusPending=false;this.state.goal=null;
     game.encounterMultipliers={hyoma:['rain','thunder'].includes(weather.band)?game.R.mood_weather.rain.hyoma_encounter_mult:1,lauren:this.state.bonusActive?game.R.weekly_goal.success.lauren_encounter_mult:1};
     const week=e.day.startsWith('fest')?'fest':e.day.split(/[dh]/)[0];
     if(!game.R.weekly_goal.skip_weeks.includes(week)){
      const cards=Goals.draw(game.R.weekly_goal,game.st,game.rng);
      const choice=yield* this.ask({type:'goal:pick',cards});const card=cards.find(c=>c.id===choice);
      if(!card)throw Error('Invalid weekly goal');
      this.state.goal={card,progress:0,active:true,walkStart:game.log.walk||0};
     }
    }
    game.encounterMultipliers={hyoma:['rain','thunder'].includes(weather.band)?game.R.mood_weather.rain.hyoma_encounter_mult:1,lauren:this.state.bonusActive?game.R.weekly_goal.success.lauren_encounter_mult:1};
   }else if(e.type==='day:end'){
    if(e.day==='w10d4'&&e.talkedWith.includes('chin'))this.state.chinEveningTalk=true;
    game.st.stress=Weather.end(game.R.mood_weather,game.st.stress,this.state.manualBuffer?[...e.talkedWith,game.R.mood_weather.buffer.chars[0]]:e.talkedWith);
    const goal=this.state.goal;
    if(game.weekday==='金'&&goal?.active){
     const count=goal.override?Math.max(goal.card.need,goal.progress):goal.card.count==='gate_walk'?(game.log.walk||0)-goal.walkStart:goal.progress;
     const met=(game.pstage.lauren||0)>0,result=Goals.judge(game.R.weekly_goal,goal.card,count,met);
     goal.active=false;this.state.bonusPending=result.ok;
     if(result.laurenF)game.fr.lauren=Math.min(100,game.fr.lauren+result.laurenF);
     if(result.laurenU)game.add_u('lauren',result.laurenU);
     yield {type:'goal:result',...result};
     if(result.line)yield* this.readNamedPool('lauren',result.line);
    }
    response=yield* this.ask({...e,stress:game.st.stress});
   }else if(e.type==='encounter:place'){
    const mentor=game.d.meta.mentor,M=game.R.mentor,chance=e.place===M.place?(M.chance[e.weekday]||0):0,stage=M.stages.find(x=>x.n===3);
    const due=e.weekday==='水'&&game.ident[mentor]&&game.fr[mentor]>=50&&!game.seen['scene:'+stage.scene]&&!!game.S[stage.scene];
    const present=chance&&game.rng.random()<chance,highest=Math.max(-1,...e.candidates.map(id=>game.fr[id]));
    if(present&&(due||!e.candidates.length||game.fr[mentor]>highest)){
     yield* this.giftEncounter({type:'encounter',char:mentor,kind:'sched'});
     if(due)yield* this.runNested(stage.scene);
     else if(Array.isArray(game.d.pools[mentor]?.sched0))yield* game.read(game.pool(mentor,'sched0'));
     else yield {type:'mentor:encounter',char:mentor};
     game.fr[mentor]=Math.min(100,game.fr[mentor]+(M.encounter_f??0));game.talkedWith.add(mentor);
     response={handled:true};
    }else response={handled:false};
   }else if(e.type==='decision'&&e.kind==='holiday'){
    response=yield* this.ask(e);
    if(response?.[0]==='play'&&game.R.toni_route){const n=Math.min(game.R.toni_route.visits_needed,(game.vars.toni_visits||0)+1);if(!game.seen['scene:toni_visit_'+n]){game.vars.toni_visits=n;yield* this.runNested('toni_visit_'+n);}}
   }else if(e.type==='scene:resolve'){
    if(e.id==='ev_epilogue'&&this.lastEnding?.letter&&!this.state.mentorLetterPlayed&&game.S.ep_letter){this.state.mentorLetterPlayed=true;yield* this.runNested('ep_letter',{stopBefore:'ev_epilogue'});}
    const mentor=game.d.meta.mentor,stage=game.R.mentor.stages.find(x=>x.n===4);
    response=e.id==='ev_epilogue'&&this.lastEnding?.scene==='end_toni_suki'&&game.S.ev_epilogue_toni?'ev_epilogue_toni':e.id==='ev_camp_room'?'ev_camp_room_'+(game.playerGender||'female'):e.id==='ev_prep_night'&&game.ident[mentor]&&game.fr[mentor]>=70&&game.seen['scene:mt_eguchi_3']&&game.S[stage.scene]?stage.scene:undefined;
   }else if(e.type==='scene:after'){
    const mentor=game.d.meta.mentor,id='mt_eguchi_2b';
    if(e.id==='ev_fusen'&&game.fr[mentor]>=30&&game.S[id]&&!game.seen['scene:'+id])yield* this.runNested(id);
    if(e.id==='ev_crisis'&&!game.ident[mentor]&&!this.state.mentorMapOffered){this.state.mentorMapOffered=true;const choice=yield {type:'bodymap:required',char:mentor};if(choice?.answers){const row=game.R.calendar.find(r=>r[0]===game.day),match=row?.[1].match(/(\d+)月(\d+)日/);if(!match)throw Error('Calendar date unavailable');const day=Date.UTC(2000,Number(match[1])-1,Number(match[2]))/86400000;yield* this.submitBodymap(mentor,choice.answers,day,{forced:true});}}
   }else if(e.type==='ending:pick'){
    response=yield* this.ask({...e,selection:this.lastEnding});
   }else if(e.type==='encounter'){
    yield* this.giftEncounter(e);
   }else if(e.type==='scene'){
    const birthday=Object.entries(game.R.gifts.birthdays).find(([id,day])=>day===game.day&&(game.R.gifts.birthday_scenes[id]||'').includes(e.scene.id));
    if(birthday){const key=game.day+':'+birthday[0];if(!this.state.birthdayOffered.includes(key)){this.state.birthdayOffered.push(key);yield* this.giftEncounter({type:'encounter',char:birthday[0],kind:'birthday'});}}
    response=yield* this.ask(e);
   }else response=yield* this.ask(e);
   step=it.next(response);
  }
  return step.value;
 }
}
const api={Session};g.Ext34Session=api;if(typeof module!=="undefined")module.exports=api;
})(globalThis);
