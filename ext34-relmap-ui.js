/* Read-only relationship overview; no new game state is stored. */
(function(g){"use strict";
function mount(root,{game,onClose}){
 root.replaceChildren();root.className='rel34-root';const h=document.createElement('h2');h.textContent='関係マップ';root.append(h);
 const explanation=document.createElement('p');explanation.textContent='● 見た　◎ 次に見られる　🔒 条件あり　□ 未受領　白 期限切れ';root.append(explanation);
 const hint=document.createElement('p');hint.className='rel34-hint';hint.setAttribute('role','status');hint.textContent='マスを選ぶと条件のヒントが出ます。';root.append(hint);
 const scroller=document.createElement('div');scroller.className='rel34-scroll';root.append(scroller);
 const table=document.createElement('table');scroller.append(table);const head=document.createElement('tr');const corner=document.createElement('th');corner.textContent='人物';head.append(corner);
 const columns=['固有1','固有2','固有3','固有4','会話1','会話2','会話3','会話4','会話5','会話6','下校1','下校2','誕生日'];
 for(const label of columns){const th=document.createElement('th');th.textContent=label;head.append(th);}table.append(head);
 const fallback={relmap_hint_ident:'地図で判明してから',relmap_hint_friend:'もう少し仲良くなってから'};
 const marks={seen:'●',next:'◎',locked:'🔒',unavailable:'□',expired:'白',pending:'・'},statusLabels={seen:'既読',next:'次に見られる',locked:'条件あり',unavailable:'未収録',expired:'期限切れ',pending:'未読'};
 for(const id of game.T){const tr=document.createElement('tr'),th=document.createElement('th');th.scope='row';th.textContent=game.R.cast.names[id]||id;tr.append(th);
  for(const [i,cell] of g.Ext34Relmap.cells(game,id).entries()){const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.className='rel34-'+cell.status;button.textContent=marks[cell.status];button.setAttribute('aria-label',`${th.textContent} ${columns[i]} ${statusLabels[cell.status]}`);
   button.onclick=()=>{const pool=cell.hintKey&&game.d.pools[cell.hintKey];const first=Array.isArray(pool)?pool.flat(Infinity).find(x=>x&&typeof x.text==='string')?.text:null;hint.textContent=first||fallback[cell.hintKey]||(cell.status==='unavailable'?'この場面は収録されていません':cell.status==='seen'?'見た場面です':cell.status==='expired'?'期限が過ぎました':cell.status==='next'?'条件を満たしています。人物と会ってみましょう。':'同じ種類の前の場面から進めましょう。');};td.append(button);tr.append(td);}
  table.append(tr);}
 const close=document.createElement('button');close.textContent='閉じる';close.onclick=onClose;root.append(close);
}
g.Ext34RelmapUI={mount};if(typeof module!=='undefined')module.exports=g.Ext34RelmapUI;
})(globalThis);
