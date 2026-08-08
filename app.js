const DEFAULT_STATE = {
  dataVersion:APP_DATA_SCHEMA_VERSION,
  tab:'route',
  routeMode:'DAILY',
  dailyStatus:{},
  weeklyStatus:{},
  goals:{mackerelSteak:0,meuniere:0,bouillabaisse:0,fishChips:0,critPotion:0,advancedCrit:0},
  inventory:{},
  q:'',
  pf:'ALL'
};

const STORAGE_KEY = 'mabiLifeToolState';
const LOCAL_STATE_VERSION = 2;

let state = loadState();

function migrateState(raw){
  const x = raw && typeof raw === 'object' ? raw : {};

  // v0.1 -> v0.2: single status map split into daily / weekly.
  if(x.status && (!x.dailyStatus || !x.weeklyStatus)){
    x.dailyStatus = {...(x.dailyStatus||{})};
    x.weeklyStatus = {...(x.weeklyStatus||{})};
    tasks.forEach(t=>{
      if(x.status[t.id]){
        if(t.type==='shop') x.weeklyStatus[t.id]=x.status[t.id];
        else x.dailyStatus[t.id]=x.status[t.id];
      }
    });
    delete x.status;
  }

  // Future migrations should be appended here and never erase inventory/goals.
  x.localStateVersion = LOCAL_STATE_VERSION;
  x.dataVersion = APP_DATA_SCHEMA_VERSION;
  return x;
}

function loadState(){
  try{
    const rawText = localStorage.getItem(STORAGE_KEY);
    if(!rawText) return structuredClone(DEFAULT_STATE);
    const incoming = migrateState(JSON.parse(rawText));
    return {
      ...structuredClone(DEFAULT_STATE),
      ...incoming,
      routeMode: incoming.routeMode || 'DAILY',
      dailyStatus: {...(incoming.dailyStatus||{})},
      weeklyStatus: {...(incoming.weeklyStatus||{})},
      goals: {...DEFAULT_STATE.goals,...(incoming.goals||{})},
      inventory: {...(incoming.inventory||{})}
    };
  }catch(e){
    console.warn('Failed to load local state:', e);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(){
  state.localStateVersion = LOCAL_STATE_VERSION;
  state.dataVersion = APP_DATA_SCHEMA_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function statusMapForTask(t){ return t.type==='shop' ? state.weeklyStatus : state.dailyStatus; }
function taskStatus(t){ return statusMapForTask(t)[t.id] || 'todo'; }
function scheduleLabel(t){ return t.type==='shop' ? '每週限購' : '每日交換'; }
function routeTasksByMode(){
  return filteredTasks().filter(t=>state.routeMode==='DAILY' ? t.type==='barter' : t.type==='shop');
}

const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const nameOf = id => materials[id]?.name || recipes[id]?.name || id;
const money = n => Number(n||0).toLocaleString('zh-TW');

function vPass(){ return true; }
function pPass(p){ return state.pf==='ALL'||state.pf===p; }

function computeBOM(){
  const demand={};
  const surplus={};
  Object.entries(state.goals).forEach(([rid,qty])=>{
    qty=Number(qty)||0;
    if(qty>0) demand[rid]=(demand[rid]||0)+qty;
  });
  const maxTier=Math.max(...Object.values(recipes).map(r=>r.tier));
  for(let tier=maxTier;tier>=1;tier--){
    Object.entries(recipes).filter(([,r])=>r.tier===tier).forEach(([rid,r])=>{
      const total=demand[rid]||0;
      const inv=Number(state.inventory[rid]||0);
      const net=Math.max(total-inv,0);
      if(net<=0){ demand[rid]=0; return; }
      const batches=Math.ceil(net/r.outputQty);
      surplus[rid]=batches*r.outputQty-net;
      for(const [iid,q] of Object.entries(r.ingredients)){
        demand[iid]=(demand[iid]||0)+q*batches;
      }
      demand[rid]=0;
    });
  }
  const base={};
  Object.entries(demand).forEach(([id,q])=>{
    if(q<=0) return;
    const inv=Number(state.inventory[id]||0);
    base[id]=Math.max(q-inv,0);
  });
  return {base,surplus};
}

function recommendations(){
  const {base}=computeBOM();
  const remain={...base};
  const out={};
  tasks.filter(t=>t.type==='shop').forEach(t=>{
    const need=Math.max(remain[t.output]||0,0);
    if(!need){ out[t.id]=0; return; }
    const cap=t.limit??need;
    const q=Math.min(need,cap);
    out[t.id]=q;
    remain[t.output]=Math.max(0,need-q);
  });
  return out;
}

function badgeP(p){ return `<span class="badge p-${p}">${PRIORITY_LABEL[p]}</span>`; }

function filteredTasks(){
  const q=(state.q||'').trim().toLowerCase();
  return tasks.filter(t=>{
    const hay=[t.town,t.npc,nameOf(t.input),nameOf(t.output),t.why].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && pPass(t.priority);
  });
}

function renderMetrics(){
  const active=tasks;
  const daily=active.filter(t=>t.type==='barter');
  const weekly=active.filter(t=>t.type==='shop');
  const dailyDone=daily.filter(t=>taskStatus(t)==='done').length;
  const weeklyDone=weekly.filter(t=>taskStatus(t)==='done').length;
  const dailyCritical=daily.filter(t=>t.priority==='S_PLUS'||t.priority==='S');
  const weeklyCritical=weekly.filter(t=>t.priority==='S_PLUS'||t.priority==='S');
  const criticalDone=[
    ...dailyCritical.filter(t=>taskStatus(t)==='done'),
    ...weeklyCritical.filter(t=>taskStatus(t)==='done')
  ].length;
  const criticalTotal=dailyCritical.length+weeklyCritical.length;
  const missing=Object.values(computeBOM().base).filter(x=>x>0).length;
  $('#metrics').innerHTML=`
    <div class="metric"><div class="label">每日以物易物</div><div class="value">${dailyDone}/${daily.length}</div></div>
    <div class="metric"><div class="label">每週限購商店</div><div class="value">${weeklyDone}/${weekly.length}</div></div>
    <div class="metric"><div class="label">S+/S 完成</div><div class="value">${criticalDone}/${criticalTotal}</div></div>
    <div class="metric"><div class="label">生產缺料種類</div><div class="value">${missing}</div></div>`;
}

function renderRoute(){
  const list=routeTasksByMode();
  const rec=recommendations();
  const modeTitle = state.routeMode==='DAILY' ? '每日以物易物' : '每週限購商店';
  const modeHelp = state.routeMode==='DAILY'
    ? '每天重置的 NPC 交換。建議先處理 S+/S，再看材料庫存決定 A/B。'
    : '補貨週期的金幣商店。限購量不等於建議購買量，依生產目標與庫存補缺口。';

  const controls = `
    <div class="card">
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">
        <div>
          <b>${modeTitle}</b>
          <div class="small">${modeHelp}</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ${state.routeMode==='DAILY'?'primary':''}" id="dailyModeBtn">每日以物易物</button>
          <button class="btn ${state.routeMode==='WEEKLY'?'primary':''}" id="weeklyModeBtn">每週限購商店</button>
        </div>
      </div>
    </div>`;

  const body=TOWN_ORDER.map((town,ti)=>{
    const tt=list.filter(t=>t.town===town);
    if(!tt.length) return '';
    const byNpc={};
    tt.forEach(t=>(byNpc[t.npc]??=[]).push(t));
    const d=tt.filter(t=>taskStatus(t)==='done').length;
    return `<div class="town">
      <div class="town-head"><h2>${ti+1}. ${town}</h2><div class="small">${d}/${tt.length}</div></div>
      ${Object.entries(byNpc).sort((a,b)=>a[1][0].order-b[1][0].order).map(([npc,arr])=>`
        <div class="npc">
          <div class="npc-head">
            <div class="npc-name">${arr[0].order}. ${npc}</div>
            <div class="small">${scheduleLabel(arr[0])}｜${arr.length} 項</div>
          </div>
          ${arr.map(t=>{
            const st=taskStatus(t);
            const line=t.type==='shop'
              ? `商店購買 → <b>${nameOf(t.output)}</b>｜$${money(t.price)}${t.limit?`｜限 ${t.limit}`:'｜限額未定'}`
              : `${nameOf(t.input)} ×${t.inputQty} → <b>${nameOf(t.output)} ×${t.outputQty}</b>`;
            const rq=t.type==='shop'?rec[t.id]:null;
            let decision='';
            if(t.type==='shop'){
              if(rq>0) decision=`<b>本週建議：</b>購買 ${rq}`;
              else if(t.priority==='B' && t.output==='beetle') decision=`<b>本週建議：</b>0；若只為伐木定位，可維持庫存 1`;
              else decision=`<b>本週建議：</b>沒有生產缺口，可跳過`;
            }
            return `<div class="task ${st==='done'?'done':st==='skip'?'skip':''}">
              <div class="task-main">
                <div>
                  <div class="badges">${badgeP(t.priority)}<span class="badge">${scheduleLabel(t)}</span></div>
                  <div class="line">${line}</div>
                  ${decision?`<div class="decision">${decision}</div>`:''}
                  <details><summary>為什麼做？</summary><div class="reason">${t.why}</div></details>
                </div>
                <div class="actions">
                  <button class="status ${st==='done'?'active':''}" data-id="${t.id}" data-action="done">完成</button>
                  <button class="status ${st==='skip'?'active':''}" data-id="${t.id}" data-action="skip">跳過</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>`).join('')}
    </div>`;
  }).join('') || `<div class="notice">目前篩選條件沒有符合的${modeTitle}項目。</div>`;

  $('#route').innerHTML=controls+body;

  $('#dailyModeBtn').addEventListener('click',()=>{state.routeMode='DAILY';saveState();renderAll();});
  $('#weeklyModeBtn').addEventListener('click',()=>{state.routeMode='WEEKLY';saveState();renderAll();});
  $$('#route .status').forEach(b=>b.addEventListener('click',()=>{
    const t=tasks.find(x=>x.id===b.dataset.id);
    if(!t) return;
    const map=statusMapForTask(t);
    const action=b.dataset.action;
    map[t.id]=map[t.id]===action?'todo':action;
    saveState(); renderAll();
  }));
}

function renderPrep(){
  const pending=tasks.filter(t=>t.type==='barter' && taskStatus(t)!=='done' && taskStatus(t)!=='skip');
  const grouped={};
  pending.forEach(t=>{
    grouped[t.town]??={};
    grouped[t.town][t.input]=(grouped[t.town][t.input]||0)+t.inputQty;
  });
  $('#prep').innerHTML=`
    <div class="notice">只列尚未完成／未跳過的交換前置物。商店購買品不重複列入。</div>
    ${Object.entries(grouped).map(([town,items])=>`
      <div class="card"><b>${town}</b><div class="sep"></div>
        ${Object.entries(items).map(([id,q])=>`<label style="display:block;margin:8px 0"><input type="checkbox" style="width:auto;margin-right:8px">${nameOf(id)} ×${q}</label>`).join('')}
      </div>`).join('') || '<div class="card">目前沒有待準備的交換材料。</div>'}`;
}

function renderProduction(){
  const {base,surplus}=computeBOM();
  const entries=Object.entries(base).filter(([,q])=>q>0).sort((a,b)=>b[1]-a[1]);
  const shopIds=new Set(tasks.filter(t=>t.type==='shop').map(t=>t.output));
  const shopCost=entries.reduce((sum,[id,q])=>{
    const prices=tasks.filter(t=>t.type==='shop'&&t.output===id).map(t=>t.price).filter(Boolean);
    return sum+(prices.length?Math.min(...prices)*q:0);
  },0);

  $('#production').innerHTML=`
    <div class="grid2">
      <div class="card">
        <b>本週成品目標</b><div class="sep"></div>
        ${Object.entries(recipes).map(([id,r])=>`
          <div class="goal-row">
            <div>${badgeP(r.priority)} ${r.name}<div class="small">每批產出 ${r.outputQty}</div></div>
            <input class="goal" data-id="${id}" type="number" min="0" step="1" value="${state.goals[id]||0}">
          </div>`).join('')}
      </div>
      <div class="card">
        <b>計算摘要</b><div class="sep"></div>
        <div class="grid2">
          <div class="metric"><div class="label">基礎缺料</div><div class="value">${entries.length}</div></div>
          <div class="metric"><div class="label">NPC 可購缺口估值</div><div class="value">$${money(shopCost)}</div></div>
        </div>
        <div class="small" style="margin-top:10px">高級暴擊秘藥會遞迴展開普通暴擊秘藥，再計算四葉草、咪咪蘑菇汁液等基礎需求；批次產量會納入。</div>
      </div>
    </div>
    <div class="card">
      <b>缺料與庫存</b><div class="sep"></div>
      ${entries.length?entries.map(([id,q])=>`
        <div class="material-row">
          <div><b>${nameOf(id)}</b><div class="source">${materials[id]?.source||''}${shopIds.has(id)?'｜可由跑商商店補':''}</div></div>
          <div class="right">缺 <b>${q}</b></div>
          <input class="inv" data-id="${id}" type="number" min="0" value="${state.inventory[id]||0}" placeholder="庫存">
        </div>`).join(''):'<div class="small">設定成品目標後，這裡會自動展開完整材料缺口。</div>'}
      ${Object.keys(surplus).length?`<details><summary>批次製作剩餘</summary><div class="reason">${Object.entries(surplus).filter(([,q])=>q>0).map(([id,q])=>`${nameOf(id)} +${q}`).join('、')||'無'}</div></details>`:''}
    </div>`;

  $$('.goal').forEach(i=>i.addEventListener('change',()=>{
    state.goals[i.dataset.id]=Math.max(0,Number(i.value||0));
    saveState(); renderAll();
  }));
  $$('.inv').forEach(i=>i.addEventListener('change',()=>{
    state.inventory[i.dataset.id]=Math.max(0,Number(i.value||0));
    saveState(); renderAll();
  }));
}

function materialUses(id){
  const out=[];
  Object.entries(recipes).forEach(([,r])=>{
    if(r.ingredients[id]) out.push(`${r.name}：${r.ingredients[id]}/批`);
  });
  return out;
}
function renderSearch(){
  const q=(state.q||'').trim().toLowerCase();
  const ids=Object.keys(materials).filter(id=>{
    const src=tasks.filter(t=>t.output===id).map(t=>`${t.town}${t.npc}`).join(' ');
    const uses=materialUses(id).join(' ');
    return !q || `${materials[id].name} ${materials[id].source} ${src} ${uses}`.toLowerCase().includes(q);
  });
  $('#search').innerHTML=ids.length?ids.map(id=>{
    const src=tasks.filter(t=>t.output===id);
    const uses=materialUses(id);
    return `<div class="card">
      <div style="display:flex;justify-content:space-between;gap:10px"><b>${materials[id].name}</b><span class="small">${materials[id].source}</span></div>
      <div class="search-result">
        <div><b class="small">取得方式</b>
          ${src.length?src.map(t=>`<div class="route-chip">${t.town} → ${t.npc}｜${t.type==='shop'?`$${money(t.price)}`:`${nameOf(t.input)} ×${t.inputQty}`}</div>`).join(''):'<div class="small" style="margin-top:6px">目前沒有已收錄的 NPC 來源</div>'}
        </div>
        <div><b class="small">核心用途</b>
          ${uses.length?uses.map(x=>`<div class="route-chip">${x}</div>`).join(''):'<div class="small" style="margin-top:6px">目前核心配方未使用；沒有明確目標就不建議因「限購」而囤。</div>'}
        </div>
      </div>
    </div>`;
  }).join(''):'<div class="notice">沒有符合搜尋條件的材料。</div>';
}

function renderAll(){
  renderMetrics(); renderRoute(); renderPrep(); renderProduction(); renderSearch();
  $('#q').value=state.q||'';
  $('#pf').value=state.pf||'ALL';
  $$('.panel').forEach(p=>p.classList.toggle('active',p.id===state.tab));
  $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
}

$$('.tab').forEach(b=>b.addEventListener('click',()=>{
  state.tab=b.dataset.tab; saveState(); renderAll();
}));
$('#q').addEventListener('input',e=>{state.q=e.target.value;saveState();renderRoute();renderSearch();});
$('#pf').addEventListener('change',e=>{state.pf=e.target.value;saveState();renderRoute();});

$('#resetBtn').addEventListener('click',()=>{
  const choice=prompt('輸入 1 重設「每日以物易物」；輸入 2 重設「每週限購商店」；輸入 3 兩者都重設。\n庫存與生產目標都會保留。','1');
  if(choice==='1') state.dailyStatus={};
  else if(choice==='2') state.weeklyStatus={};
  else if(choice==='3'){ state.dailyStatus={}; state.weeklyStatus={}; }
  else return;
  saveState(); renderAll();
});

$('#exportBtn').addEventListener('click',()=>{
  const payload={exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='mabinogi-life-tool-data.json'; a.click();
  URL.revokeObjectURL(url);
});

$('#importFile').addEventListener('change',async e=>{
  const f=e.target.files?.[0]; if(!f) return;
  try{
    const text=await f.text();
    const obj=JSON.parse(text);
    const incoming=migrateState(obj.state||obj);
    state={...structuredClone(DEFAULT_STATE),...incoming,
      routeMode:incoming.routeMode||'DAILY',
      dailyStatus:{...(incoming.dailyStatus||{})},
      weeklyStatus:{...(incoming.weeklyStatus||{})},
      goals:{...DEFAULT_STATE.goals,...(incoming.goals||{})},
      inventory:{...(incoming.inventory||{})}
    };
    saveState(); renderAll(); alert('匯入完成');
  }catch(err){ alert('匯入失敗：檔案格式不正確'); }
  e.target.value='';
});

renderAll();
