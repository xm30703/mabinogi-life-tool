// Grouped production planner + dependency-safe BOM.
// Loaded after app.js and before guide.js.
(() => {
  const GROUPS = [
    {id:'FOOD',label:'頂級料理',hint:'目前高價值戰鬥料理',open:true},
    {id:'MEDICINE_HIGH',label:'高階藥品',hint:'目前版本可製作的高階回復／戰鬥藥品',open:true},
    {id:'MEDICINE_BASE',label:'基礎／前置藥品',hint:'可直接做，也會被高階成品自動展開',open:false},
    {id:'WEAPON',label:'目前最高階製作武器',hint:'以現階段武器製作台 Lv.3 為上限，依職業選目標',open:false},
    {id:'ARMOR',label:'目前最高階製作防具',hint:'每個目標 1 代表完整 5 件套',open:false},
    {id:'ACCESSORY',label:'目前最高階製作飾品',hint:'多用途製作台 Lv.3 的最高階項鍊／戒指',open:false}
  ];

  function ensureRecipeGoalKeys(){
    let changed=false;
    Object.entries(recipes).forEach(([id,r])=>{
      if(r.plannerVisible===false) return;
      if(state.goals[id]===undefined){ state.goals[id]=0; changed=true; }
    });
    if(changed) saveState();
  }

  computeBOM = function(){
    const demand={};
    const surplus={};
    const roots=[];
    Object.entries(state.goals||{}).forEach(([rid,qty])=>{
      qty=Math.max(0,Number(qty)||0);
      if(qty<=0 || !recipes[rid]) return;
      demand[rid]=(demand[rid]||0)+qty;
      roots.push(rid);
    });

    const reachable=new Set();
    const visit=id=>{
      if(reachable.has(id)||!recipes[id]) return;
      reachable.add(id);
      Object.keys(recipes[id].ingredients||{}).forEach(iid=>{ if(recipes[iid]) visit(iid); });
    };
    roots.forEach(visit);

    const indegree={},children={};
    reachable.forEach(id=>{indegree[id]=0;children[id]=[];});
    reachable.forEach(parent=>{
      Object.keys(recipes[parent].ingredients||{}).forEach(child=>{
        if(!reachable.has(child)) return;
        children[parent].push(child);
        indegree[child]=(indegree[child]||0)+1;
      });
    });
    const queue=[...reachable].filter(id=>indegree[id]===0),order=[];
    while(queue.length){
      const id=queue.shift(); order.push(id);
      children[id].forEach(child=>{ indegree[child]-=1; if(indegree[child]===0) queue.push(child); });
    }
    if(order.length!==reachable.size){
      console.warn('Production recipe cycle detected; unresolved nodes will be processed once.');
      [...reachable].forEach(id=>{if(!order.includes(id)) order.push(id);});
    }

    order.forEach(rid=>{
      const r=recipes[rid],total=Math.max(0,Number(demand[rid]||0));
      if(total<=0){ demand[rid]=0; return; }
      const inv=Math.max(0,Number(state.inventory[rid]||0));
      const net=Math.max(total-inv,0);
      if(net<=0){ demand[rid]=0; return; }
      const outQty=Math.max(1,Number(r.outputQty||1));
      const batches=Math.ceil(net/outQty),made=batches*outQty;
      surplus[rid]=Math.max(0,made-net);
      Object.entries(r.ingredients||{}).forEach(([iid,q])=>{ demand[iid]=(demand[iid]||0)+(Number(q)||0)*batches; });
      demand[rid]=0;
    });

    const base={};
    Object.entries(demand).forEach(([id,q])=>{
      q=Math.max(0,Number(q)||0);
      if(q<=0 || recipes[id]) return;
      const inv=Math.max(0,Number(state.inventory[id]||0));
      const missing=Math.max(q-inv,0);
      if(missing>0) base[id]=missing;
    });
    return {base,surplus};
  };

  function recipeRow(id,r){
    const value=Math.max(0,Number(state.goals[id]||0));
    return `<div class="goal-row production-goal-row">
      <div class="production-goal-copy">
        <div>${badgeP(r.priority||'A')} <b>${r.name}</b></div>
        <div class="small">每批產出 ${r.outputQty||1}${r.note?`｜${r.note}`:''}</div>
      </div>
      <input class="goal" data-id="${id}" type="number" min="0" step="1" value="${value}" inputmode="numeric">
    </div>`;
  }

  function renderGroup(group){
    const rows=Object.entries(recipes).filter(([,r])=>r.plannerVisible!==false && (r.category||'OTHER')===group.id);
    if(!rows.length) return '';
    const active=rows.filter(([id])=>Number(state.goals[id]||0)>0).length;
    return `<details class="production-group" ${group.open?'open':''}>
      <summary><span><b>${group.label}</b><span class="small production-group-hint">${group.hint}</span></span><span class="production-group-count">${active?`${active} 項已設定`:`${rows.length} 項`}</span></summary>
      <div class="production-group-body">${rows.map(([id,r])=>recipeRow(id,r)).join('')}</div>
    </details>`;
  }

  renderProduction = function(){
    ensureRecipeGoalKeys();
    const {base,surplus}=computeBOM();
    const entries=Object.entries(base).filter(([,q])=>Number(q)>0).sort((a,b)=>Number(b[1])-Number(a[1]));
    const shopIds=new Set(shopCatalog.map(t=>t.output));
    const barterIds=new Set(barterCatalog.map(t=>t.output));
    const shopCost=entries.reduce((sum,[id,q])=>{
      const prices=shopCatalog.filter(t=>t.output===id).map(t=>Number(t.price)).filter(Number.isFinite);
      return sum+(prices.length?Math.min(...prices)*Number(q):0);
    },0);

    $('#production').innerHTML=`
      <div class="notice production-scope">目前生產規劃以現階段可取得的 <b>3級加工／製作台</b> 為上限；裝備類用「目前最高階製作」表示，避免把後續版本配方混進現在的跑商需求。</div>
      <div class="grid2 production-layout">
        <div class="card"><b>本週成品目標</b><div class="small" style="margin-top:5px">只填你真的打算製作的數量；中間加工品不必手算，BOM 會自動往下展開。</div><div class="sep"></div>${GROUPS.map(renderGroup).join('')}</div>
        <div class="card"><b>計算摘要</b><div class="sep"></div><div class="grid2"><div class="metric"><div class="label">基礎缺料</div><div class="value">${entries.length}</div></div><div class="metric"><div class="label">NPC 可購缺口估值</div><div class="value">$${money(shopCost)}</div></div></div><div class="small" style="margin-top:10px">多個成品共用同一中間材料時，會先合併需求再依批次產量進位；成品、中間品庫存也會先扣除，避免重複放大需求。</div></div>
      </div>
      <div class="card"><b>缺料與庫存</b><div class="sep"></div>
        ${entries.length?entries.map(([id,q])=>{
          const bsrc=barterSourcesFor(id);
          const extra=[shopIds.has(id)?'可由每週商店補':'',barterIds.has(id)?'可由每日交換取得':''].filter(Boolean).join('｜');
          return `<div class="material-row"><div><b>${nameOf(id)}</b><div class="source">${materials[id]?.source||''}${extra?`｜${extra}`:''}</div>${bsrc.length?`<div class="small" style="margin-top:4px;color:var(--accent)">交換來源：${bsrc.map(t=>`${t.town} → ${t.npc}`).join('、')}</div>`:''}</div><div class="right">缺 <b>${qtyText(q)}</b></div><input class="inv" data-id="${id}" type="number" min="0" value="${state.inventory[id]||0}" placeholder="庫存" inputmode="numeric"></div>`;
        }).join(''):'<div class="small">設定成品目標後，這裡會自動展開完整材料缺口。</div>'}
        ${Object.keys(surplus).length?`<details><summary>批次製作剩餘</summary><div class="reason">${Object.entries(surplus).filter(([,q])=>Number(q)>0).map(([id,q])=>`${nameOf(id)} +${qtyText(q)}`).join('、')||'無'}</div></details>`:''}
      </div>`;

    $$('.goal').forEach(i=>i.addEventListener('change',()=>{ state.goals[i.dataset.id]=Math.max(0,Number(i.value||0)); saveState(); renderAll(); }));
    $$('.inv').forEach(i=>i.addEventListener('change',()=>{ state.inventory[i.dataset.id]=Math.max(0,Number(i.value||0)); saveState(); renderAll(); }));
  };

  const style=document.createElement('style');
  style.id='production-v24-style';
  style.textContent=`
    .production-group{border:1px solid var(--line);border-radius:12px;margin:9px 0;background:#111820;overflow:hidden}
    .production-group>summary{cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px}
    .production-group>summary::-webkit-details-marker{display:none}
    .production-group>summary:before{content:'›';display:inline-block;margin-right:8px;color:var(--muted);font-size:1.2rem;transition:transform .15s}
    .production-group[open]>summary:before{transform:rotate(90deg)}
    .production-group>summary>span:first-of-type{flex:1}
    .production-group-hint{display:block;margin-top:3px;font-weight:400}
    .production-group-count{font-size:.76rem;color:var(--muted);white-space:nowrap}
    .production-group-body{border-top:1px solid var(--line);padding:0 12px}
    .production-goal-row:last-child{border-bottom:0}.production-goal-copy{min-width:0}.production-scope{margin-bottom:12px}
    @media(max-width:780px){.production-layout{grid-template-columns:1fr}.production-group>summary{align-items:flex-start}.production-group-count{padding-top:2px}.production-goal-row{grid-template-columns:minmax(0,1fr) 92px}.production-goal-row input{width:92px}}
  `;
  document.head.appendChild(style);
  ensureRecipeGoalKeys();
  renderAll();
})();