/* Accessible body-map interface; state remains owned by the session. */
(function(g){"use strict";
const madePositions={'視床下部':[50,14],'下垂体前葉':[43,18],'下垂体後葉':[57,18],'甲状腺':[50,25],'副腎皮質':[39,48],'副腎髄質':[61,48],'すい臓（ランゲルハンス島）':[50,51],'骨髄':[37,75],'中脳':[44,12],'脳幹':[56,12]};
const targetPositions={'全身の細胞':[15,57],'肝臓・筋肉':[37,43],'子宮・乳腺・脳':[53,60],'体じゅうの異物':[84,55],'脳の神経回路':[50,12],'生殖腺（卵巣・精巣）':[48,63],'腎臓（集合管）':[65,49]};
const brain=new Set(['視床下部','下垂体前葉','下垂体後葉','中脳','脳幹']);
const brainPins={'視床下部':[50,13],'下垂体前葉':[22,42],'下垂体後葉':[78,42],'中脳':[22,72],'脳幹':[78,72]};
const bodyPins={'甲状腺':[50,19],'副腎皮質':[23,44],'副腎髄質':[77,44],'すい臓（ランゲルハンス島）':[50,55],'骨髄':[50,79]};
const destinationPins={'全身の細胞':[12,60],'肝臓・筋肉':[23,35],'子宮・乳腺・脳':[42,70],'体じゅうの異物':[88,60],'脳の神経回路':[50,10],'生殖腺（卵巣・精巣）':[73,71],'腎臓（集合管）':[77,35]};
function mount(root,{game,session,onSubmit,onClose,forceChar=null}){
 const rules=game.R.bodymap, people=forceChar?[forceChar]:[...game.T,game.d.meta.mentor],names=game.R.cast.names||{};
 let char=null,answers={},phase='made_at',brainZoom=false,readOnly=false;
 root.replaceChildren();root.className='bm34-root';
 const title=document.createElement('h2');title.textContent='体の地図';root.append(title);
 const main=document.createElement('div');main.className='bm34-layout';root.append(main);
 const list=document.createElement('div');list.className='bm34-people';list.setAttribute('aria-label','人物カード');main.append(list);
 const work=document.createElement('div');work.className='bm34-work';main.append(work);
 const status=document.createElement('p');status.className='bm34-status';status.setAttribute('role','status');work.append(status);
 const summary=document.createElement('div');summary.className='bm34-summary';work.append(summary);const memo=document.createElement('section');memo.className='bm34-memos';work.append(memo);
 const board=document.createElement('div');board.className='bm34-board';board.setAttribute('aria-label','人体の地図');work.append(board);
 const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 100 180');svg.setAttribute('aria-hidden','true');
 svg.innerHTML='<defs><marker id="bm34-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#f26b3a"/></marker></defs><circle cx="50" cy="18" r="13"/><path d="M 39 32 Q 24 37 27 65 L 30 92 L 23 147 L 32 150 L 43 101 L 47 145 L 47 170 L 55 170 L 57 145 L 60 101 L 69 150 L 77 147 L 70 92 L 73 65 Q 76 37 61 32 Z"/><path d="M 31 38 L 17 84 M 69 38 L 83 84" class="limb"/>';
 board.append(svg);const controls=document.createElement('div');controls.className='bm34-controls';work.append(controls);
 const bottom=document.createElement('div');bottom.className='bm34-bottom';root.append(bottom);
 const submit=document.createElement('button');submit.textContent='これで決定';submit.className='bm34-primary';submit.disabled=true;bottom.append(submit);
 const close=document.createElement('button');close.textContent='閉じる';close.onclick=onClose;bottom.append(close);
 function button(label,handler){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=handler;return b;}
 function draw(){
  list.replaceChildren();const row=game.R.calendar.find(r=>r[0]===game.day),match=row?.[1].match(/(\d+)月(\d+)日/),today=match?Date.UTC(2000,Number(match[1])-1,Number(match[2]))/86400000:null;
  for(const id of people){const count=game.clues[id]?.size||0,person=session.state.bodymap.people[id],waiting=today!==null&&person&&today<person.retryAt,b=button(`${names[id]||(id===game.d.meta.mentor?"江口先生":id)}　手がかり${count}件${waiting?'（待ち）':''}`,()=>choose(id));b.disabled=(count<rules.memos_needed&&id!==forceChar&&!game.ident[id]&&!person);b.setAttribute('aria-pressed',String(id===char));if(game.ident[id])b.textContent+='（判明）';list.append(b);}
  while(board.children.length>1)board.lastChild.remove();svg.querySelectorAll('.arrow,.pin').forEach(x=>x.remove());controls.replaceChildren();summary.replaceChildren();memo.replaceChildren();
  if(!char){status.textContent='手がかりが2件以上の人物を選んでください';submit.disabled=true;return;}
  const selectedState=session.state.bodymap.people[char],wait=today!==null&&selectedState&&today<selectedState.retryAt;readOnly=!!game.ident[char]||!!wait;status.textContent=game.ident[char]?'判明済み：地図と観察メモを見直せます。':wait?'再挑戦まであと '+(selectedState.retryAt-today)+' 日。確定した項目と観察メモを確認できます。':phase==='made_at'?'① 作られる場所を選ぶ':phase==='target'?'② 届け先を選ぶ（ドラッグまたはタップ）':phase==='trigger'?'③ きっかけを選ぶ':'④ 指令役を選ぶ';
  const switcher=document.createElement('div');switcher.className='bm34-phases';const labels={made_at:'作られる場所',target:'届け先',trigger:'きっかけ',commander:'指令役'};
  const personState=session.state.bodymap.people[char];for(const k of Object.keys(labels)){const mark=personState?.lastWrong?.includes(k)?' ×':personState?.confirmed?.[k]?' ✓':'';const b=button(labels[k]+mark,()=>{phase=k;draw()});b.setAttribute('aria-pressed',String(phase===k));switcher.append(b);}controls.append(switcher);
  const confirmed=session.state.bodymap.people[char]?.confirmed||{};
  for(const [key,label] of Object.entries(labels)){const item=document.createElement('p');item.textContent=label+'：'+(answers[key]||'未選択')+(confirmed[key]?' ✓':'');summary.append(item);}
  const mt=document.createElement('strong');mt.textContent='観察メモ';memo.append(mt);const notes=[...(game.clues[char]||[])].filter(x=>!/^理解\d+$/.test(x));if(notes.length)for(const note of notes){const p=document.createElement('p');p.textContent=note;memo.append(p);}else{const p=document.createElement('p');p.textContent='文章の観察メモはまだありません。';memo.append(p);}const learned=[...(game.clues[char]||[])].filter(x=>/^理解\d+$/.test(x)).length;if(learned){const p=document.createElement('p');p.textContent='会話から得た手がかり：'+learned+'件';memo.append(p);}
  if(game.ident[char]&&['shion','shito'].includes(char)&&game.ident[char==='shion'?'shito':'shion']){const p=document.createElement('p');p.textContent='志音とシトは、どちらも視床下部でつくられ、下垂体後葉から放出されます。';memo.append(p);}

  const options=document.createElement('div');options.className='bm34-options';controls.append(options);
  if(phase==='made_at'){
   const zoom=button(brainZoom?'全身へ戻る':'脳を拡大',()=>{brainZoom=!brainZoom;draw()});options.append(zoom);
   for(const value of rules.fields.made_at){if(brainZoom&&!brain.has(value))continue;const b=button(value,()=>set('made_at',value));b.disabled=!!confirmed.made_at||readOnly;b.setAttribute('aria-pressed',String(answers.made_at===value));options.append(b);}
  }else if(phase==='target')for(const value of rules.fields.target){const b=button(value,()=>set('target',value));b.dataset.target=value;b.disabled=!!confirmed.target||readOnly;b.setAttribute('aria-pressed',String(answers.target===value));options.append(b);}
  else for(const value of rules.fields[phase]){const field=phase,b=button(value,()=>set(field,value));b.disabled=!!confirmed[field]||readOnly;b.setAttribute('aria-pressed',String(answers[field]===value));options.append(b);}
  const zoomed=phase==='made_at'&&brainZoom;svg.setAttribute('viewBox',zoomed?'25 0 50 40':'0 0 100 180');
  const position=pt=>zoomed?[(pt[0]-25)*2,pt[1]*2.5]:[pt[0],pt[1]/180*100];
  if(phase==='made_at'){
   if(!zoomed){const mark=button('脳',()=>{brainZoom=true;draw()});mark.className='bm34-marker bm34-source bm34-brain';mark.style.left='50%';mark.style.top='5%';mark.setAttribute('aria-label','脳の位置を選ぶ');board.append(mark);}
   for(const [value,pos] of Object.entries(zoomed?brainPins:bodyPins)){const mark=button('＋',()=>set('made_at',value));mark.className='bm34-marker bm34-source';mark.style.left=pos[0]+'%';mark.style.top=pos[1]+'%';mark.setAttribute('aria-label',`作られる場所 ${value}`);mark.disabled=!!confirmed.made_at||readOnly;board.append(mark);}
  }
  const origin=madePositions[answers.made_at],target=targetPositions[answers.target];
  if(origin&&!zoomed){const pin=document.createElement('button');pin.type='button';pin.className='bm34-marker bm34-origin';pin.style.left=origin[0]+'%';pin.style.top=(origin[1]/180*100)+'%';pin.textContent='●';pin.setAttribute('aria-label','作られる場所のピン');pin.onpointerdown=ev=>{if(phase!=='target'||confirmed.target)return;pin.setPointerCapture(ev.pointerId);};pin.onpointerup=ev=>{if(phase!=='target'||confirmed.target)return;const hit=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-target]');if(hit)set('target',hit.dataset.target);};board.append(pin);}
  if(phase==='target')for(const [value,pos] of Object.entries(destinationPins)){const mark=button('＋',()=>set('target',value));mark.className='bm34-marker bm34-target';mark.style.left=pos[0]+'%';mark.style.top=pos[1]+'%';mark.dataset.target=value;mark.setAttribute('aria-label',`届け先 ${value}`);mark.disabled=!!confirmed.target||readOnly;board.append(mark);}
  if(origin&&target){const line=document.createElementNS(NS,'line');for(const [k,v] of Object.entries({x1:origin[0],y1:origin[1],x2:target[0],y2:target[1]}))line.setAttribute(k,v);line.setAttribute('class','arrow');line.setAttribute('marker-end','url(#bm34-arrow)');svg.append(line);}
  if(origin&&target&&game.ident[char]&&['shion','shito'].includes(char)&&game.ident[char==='shion'?'shito':'shion']){const line=document.createElementNS(NS,'line');for(const [k,v] of Object.entries({x1:origin[0]+2,y1:origin[1],x2:target[0]+2,y2:target[1]}))line.setAttribute(k,v);line.setAttribute('class','arrow shared');line.setAttribute('marker-end','url(#bm34-arrow)');svg.append(line);const badge=document.createElement('span');badge.className='bm34-release';badge.textContent='放出：下垂体後葉';board.append(badge);}
  submit.disabled=readOnly||!Object.keys(rules.fields).every(k=>answers[k]);
 }
 function choose(id){char=id;answers={...(session.state.bodymap.people[id]?.confirmed||(game.ident[id]?rules.answer[id]:{}))};phase=Object.keys(rules.fields).find(k=>!answers[k])||'made_at';brainZoom=false;draw();}
 function set(field,value){if(readOnly||session.state.bodymap.people[char]?.confirmed?.[field])return;answers[field]=value;if(field==='made_at')brainZoom=false;phase=field==='made_at'?'target':field==='target'?'trigger':field==='trigger'?'commander':'commander';draw();}
 submit.onclick=()=>{if(char&&Object.keys(rules.fields).every(k=>answers[k]))onSubmit({char,answers:{...answers}});};
 draw();if(forceChar&&!list.querySelector("button")?.disabled)choose(forceChar);return {render:draw};
}
g.Ext34BodymapUI={mount};if(typeof module!=="undefined")module.exports=g.Ext34BodymapUI;
})(globalThis);
