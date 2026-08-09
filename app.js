const DEFAULT_STATE = {
  dataVersion:APP_DATA_SCHEMA_VERSION,
  tab:'route',
  routeMode:'DAILY',
  dailyView:'RECOMMENDED',
  dailyStatus:{},
  weeklyStatus:{},
  permanentStatus:{},
  goals:{mackerelSteak:0,meuniere:0,bouillabaisse:0,fishChips:0,critPotion:0,advancedCrit:0},
  inventory:{},
  q:'',
  pf:'ALL'
};

const STORAGE_KEY = 'mabiLifeToolState';
const LOCAL_STATE_VERSION = 3;
let state = loadState();

function migrateState(raw){
  const x = raw && typeof raw === 'object' ? raw : {};
  if(x.status && (!x.dailyStatus || !x.weeklyStatus)){
    x.dailyStatus = {...(x.dailyStatus||{})};
    x.weeklyStatus = {...(x.weeklyStatus||{})};
    tasks.forEach(t=>{
      if(!x.status[t.id]) return;
      if(t.type==='shop') x.weeklyStatus[t.id]=x.status[t.id];
      else x.dailyStatus[t.id]=x.status[t.id];
    });
    delete x.status;
  }
  x.permanentStatus = {...(x.permanentStatus||{})};
  x.dailyView = x.dailyView || 'RECOMMENDED';
  x.localStateVersion = LOCAL_STATE_VERSION;
  x.dataVersion = APP_DATA_SCHEMA_VERSION;
  return x;
}

function loadState(){
  try{
    const rawText=localStorage.getItem(STORAGE_KEY);
    if(!rawText) return structuredClone(DEFAULT_STATE);
    const incoming=migrateState(JSON.parse(rawText));
    return {
      ...structuredClone(DEFAULT_STATE),...incoming,
      routeMode:incoming.routeMode||'DAILY',
      dailyView:incoming.dailyView||'RECOMMENDED',
      dailyStatus:{...(incoming.dailyStatus||{})},
      weeklyStatus:{...(incoming.weeklyStatus||{})},
      permanentStatus:{...(incoming.permanentStatus||{})},
      goals:{...DEFAULT_STATE.goals,...(incoming.goals||{})},
      inventory:{...(incoming.inventory||{})}
    };
  }catch(e){
    console.warn('Failed to load local state:',e);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(){
  state.localStateVersion=LOCAL_STATE_VERSION;
  state.dataVersion=APP_DATA_SCHEMA_VERSION;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const nameOf=id=>materials[id]?.name||recipes[id]?.name||id;
const money=n=>Number(n||0).toLocaleString('zh-TW');
const qtyText=n=>Number.isInteger(Number(n))?String(Number(n)):Number(n).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');

function statusMapForTask(t){
  if(t.oneTime) return state.permanentStatus;
  if(t.type==='shop') return state.weeklyStatus;
  return state.dailyStatus;
}
function taskStatus(t){ return statusMapForTask(t)[t.id]||'todo'; }
function scheduleLabel(t){ return t.oneTime?'一次性':t.type==='shop'?'每週限購':'每日交換'; }
function pPass(p){ return state.pf==='ALL'||state.pf===p; }

function computeBOM(){
  const demand={};
  const surplus={};
  Object.entries(state.goals).forEach(([rid,qty])=>{
    qty=Number(qty)||0;
    if(qty>0) demand[rid]=(demand[rid]||0)+qty;
  });
  const tiers=Object.values(recipes).map(r=>Number(r.tier)||1);
  const maxTier=tiers.length?Math.max(...tiers):1;
  for(let tier=maxTier;tier>=1;tier--){
    Object.entries(recipes).filter(([,r])=>(Number(r.tier)||1)===tier).forEach(([rid,r])=>{
      const total=Number(demand[rid]||0);
      const inv=Number(state.inventory[rid]||0);
      const net=Math.max(total-inv,0);
      if(net<=0){ demand[rid]=0; return; }
      const batches=Math.ceil(net/Number(r.outputQty||1));
      surplus[rid]=batches*Number(r.outputQty||1)-net;
      Object.entries(r.ingredients||{}).forEach(([iid,q])=>{
        demand[iid]=(demand[iid]||0)+Number(q)*batches;
      });
      demand[rid]=0;
    });
  }
  const base={};
  Object.entries(demand).forEach(([id,q])=>{
    if(Number(q)<=0) return;
    const inv=Number(state.inventory[id]||0);
    base[id]=Math.max(Number(q)-inv,0);
  });
  return {base,surplus};
}

function plannedBarterCount(t,bomBase=null){
  if(t.type!=='barter'||t.oneTime) return 0;
  if(t.conditional==='production'){
    const base=bomBase||computeBOM().base;
    const need=Math.max(Number(base[t.output]||0),0);
    if(!need) return 0;
    return Math.min(Number(t.limit||Infinity),Math.ceil(need/Math.max(Number(t.outputQty||1),1)));
  }
  return Math.min(Number(t.limit||Infinity),Math.max(Number(t.recommendedCount||0),0));
}

function recommendedDailyTasks(){
  const bomBase=computeBOM().base;
  return barterCatalog.filter(t=>!t.oneTime && plannedBarterCount(t,bomBase)>0);
}

function routeRank(t){
  const ti=TOWN_ORDER.indexOf(t.town);
  return (ti<0?999:ti)*1000+Number(t.order||0)*10+barterCatalog.findIndex(x=>x.id===t.id)/1000;
}
function barterUnit(t){ return {inputQty:Number(t.inputQty||0),outputQty:Number(t.outputQty||0)}; }
function barterSourcesFor(id){ return barterCatalog.filter(t=>t.output===id).sort((a,b)=>routeRank(a)-routeRank(b)); }
function barterUsesFor(id){ return barterCatalog.filter(t=>t.input===id).sort((a,b)=>routeRank(a)-routeRank(b)); }
function acquisitionSources(id){ return tasks.filter(t=>t.output===id).sort((a,b)=>routeRank(a)-routeRank(b)); }

function barterChainHint(t){
  if(t.type!=='barter') return '';
  const upstream=barterSourcesFor(t.input).filter(x=>x.id!==t.id);
  const downstream=barterUsesFor(t.output).filter(x=>x.id!==t.id);
  const parts=[];
  if(upstream.length) parts.push(`← 來源：${upstream.map(x=>`${x.town} → ${x.npc}`).join('、')}`);
  if(downstream.length){
    parts.push(`→ 下一站：${downstream.map(x=>`${x.town} → ${x.npc}（${nameOf(x.input)} ×${qtyText(x.inputQty)} → ${nameOf(x.output)} ×${qtyText(x.outputQty)}）`).join('、')}`);
  }
  return parts.length?`<div class="small" style="margin-top:7px;color:var(--accent)">${parts.join('<br>')}</div>`:'';
}

function recommendations(){
  const {base}=computeBOM();
  const remain={...base};
  const out={};
  shopCatalog.forEach(t=>{
    const need=Math.max(Number(remain[t.output]||0),0);
    if(!need){ out[t.id]=0; return; }
    const cap=t.limit==null?need:Number(t.limit);
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
    const chain=[...barterSourcesFor(t.input).map(x=>`${x.town} ${x.npc}`),...barterUsesFor(t.output).map(x=>`${x.town} ${x.npc}`)].join(' ');
    const hay=[t.town,t.npc,nameOf(t.input),nameOf(t.output),t.why,chain].join(' ').toLowerCase();
    return (!q||hay.includes(q))&&pPass(t.priority);
  });
}

function routeTasksByMode(){
  const filtered=filteredTasks();
  if(state.routeMode==='WEEKLY') return filtered.filter(t=>t.type==='shop');
  let daily=filtered.filter(t=>t.type==='barter');
  if(state.dailyView==='RECOMMENDED'){
    const ids=new Set(recommendedDailyTasks().map(t=>t.id));
    daily=daily.filter(t=>ids.has(t.id));
  }
  return daily;
}

function renderMetrics(){
  const daily=recommendedDailyTasks();
  const weekly=shopCatalog;
  const dailyDone=daily.filter(t=>taskStatus(t)==='done').length;
  const weeklyDone=weekly.filter(t=>taskStatus(t)==='done').length;
  const critical=[...daily.filter(t=>['S_PLUS','S'].includes(t.priority)),...weekly.filter(t=>['S_PLUS','S'].includes(t.priority))];
  const criticalDone=critical.filter(t=>taskStatus(t)==='done').length;
  const missing=Object.values(computeBOM().base).filter(x=>Number(x)>0).length;
  $('#metrics').innerHTML=`
    <div class="metric"><div class="label">每日推薦交換</div><div class="value">${dailyDone}/${daily.length}</div></div>
    <div class="metric"><div class="label">每週限購商店</div><div class="value">${weeklyDone}/${weekly.length}</div></div>
    <div class="metric"><div class="label">S+/S 完成</div><div class="value">${criticalDone}/${critical.length}</div></div>
    <div class="metric"><div class="label">生產缺料種類</div><div class="value">${missing}</div></div>`;
}

function renderRoute(){
  const list=routeTasksByMode();
  const rec=recommendations();
  const isDaily=state.routeMode==='DAILY';
  const modeTitle=isDaily?(state.dailyView==='RECOMMENDED'?'每日以物易物｜推薦項目':'每日以物易物｜全部交換'):'每週限購商店';
  const modeHelp=isDaily
    ? state.dailyView==='RECOMMENDED'
      ? '這裡只列建議納入日常路線的交換；要查 NPC 的完整商品請切換「全部交換」。'
      : '完整列出目前已收錄的 NPC 交換；一次性設計圖取得後可永久標記完成。'
    : '補貨週期的金幣商店。限購量不等於建議購買量，依生產目標與庫存補缺口。';

  const dailyToggle=isDaily?`
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button class="btn ${state.dailyView==='RECOMMENDED'?'primary':''}" id="recommendedViewBtn">推薦項目</button>
      <button class="btn ${state.dailyView==='ALL'?'primary':''}" id="allViewBtn">全部交換</button>
      <span class="small" style="align-self:center">完整目錄 ${barterCatalog.length} 項</span>
    </div>`:'';

  const controls=`<div class="card">
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between">
      <div><b>${modeTitle}</b><div class="small">${modeHelp}</div>${dailyToggle}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn ${isDaily?'primary':''}" id="dailyModeBtn">每日以物易物</button>
        <button class="btn ${!isDaily?'primary':''}" id="weeklyModeBtn">每週限購商店</button>
      </div>
    </div>
  </div>`;

  const body=TOWN_ORDER.map((town,ti)=>{
    const tt=list.filter(t=>t.town===town);
    if(!tt.length) return '';
    const byNpc={}; tt.forEach(t=>(byNpc[t.npc]??=[]).push(t));
    const d=tt.filter(t=>taskStatus(t)==='done').length;
    return `<div class="town">
      <div class="town-head"><h2>${ti+1}. ${town}</h2><div class="small">${d}/${tt.length}</div></div>
      ${Object.entries(byNpc).sort((a,b)=>a[1][0].order-b[1][0].order).map(([npc,arr])=>`
        <div class="npc">
          <div class="npc-head">
            <div class="npc-name">${arr[0].order}. ${npc}</div>
            <div class="small">${isDaily?(state.dailyView==='RECOMMENDED'?'推薦':'全部交換'):'每週限購'}｜${arr.length} 項</div>
          </div>
          ${arr.map(t=>{
            const st=taskStatus(t);
            const line=t.type==='shop'
              ? `商店購買 → <b>${nameOf(t.output)}</b>｜$${money(t.price)}${t.limit!=null?`｜限 ${t.limit}`:''}`
              : `${nameOf(t.input)} ×${qtyText(t.inputQty)} → <b>${nameOf(t.output)} ×${qtyText(t.outputQty)}</b>${t.limit!=null?`｜限 ${t.limit} 次`:''}`;
            let decision='';
            if(t.type==='shop'){
              const rq=rec[t.id]||0;
              decision=rq>0?`<b>本週建議：</b>購買 ${rq}`:`<b>本週建議：</b>沒有生產缺口，可跳過`;
            }else if(t.oneTime){
              decision=st==='done'?'<b>狀態：</b>已永久完成':'<b>一次性：</b>取得後可標記永久完成，不會跟著每日重設';
            }else{
              const count=plannedBarterCount(t);
              if(t.conditional==='production'){
                const need=Number(computeBOM().base[t.output]||0);
                decision=need>0?`<b>生產缺口：</b>${nameOf(t.output)} 缺 ${need}；建議交換 ${count} 次`:`<b>本週建議：</b>目前沒有生產缺口，可跳過`;
              }else if(count>0){
                decision=`<b>日常建議：</b>交換 ${count} 次`;
              }
            }
            const doneLabel=t.oneTime?'永久完成':'完成';
            const skipLabel=t.oneTime?'略過':'跳過';
            return `<div class="task ${st==='done'?'done':st==='skip'?'skip':''}">
              <div class="task-main">
                <div>
                  <div class="badges">${badgeP(t.priority)}<span class="badge">${scheduleLabel(t)}</span></div>
                  <div class="line">${line}</div>
                  ${barterChainHint(t)}
                  ${decision?`<div class="decision">${decision}</div>`:''}
                </div>
                <div class="actions">
                  <button class="info-toggle" type="button" data-info-id="${t.id}" aria-label="查看用途說明" aria-expanded="false" title="用途說明">ⓘ</button>
                  <button class="status ${st==='done'?'active':''}" data-id="${t.id}" data-action="done">${doneLabel}</button>
                  <button class="status ${st==='skip'?'active':''}" data-id="${t.id}" data-action="skip">${skipLabel}</button>
                </div>
              </div>
              <div class="reason-panel" id="reason-${t.id}" hidden>${t.why}</div>
            </div>`;
          }).join('')}
        </div>`).join('')}
    </div>`;
  }).join('')||`<div class="notice">目前篩選條件沒有符合的${modeTitle}項目。</div>`;

  $('#route').innerHTML=controls+body;
  $('#dailyModeBtn').onclick=()=>{state.routeMode='DAILY';saveState();renderAll();};
  $('#weeklyModeBtn').onclick=()=>{state.routeMode='WEEKLY';saveState();renderAll();};
  if($('#recommendedViewBtn')) $('#recommendedViewBtn').onclick=()=>{state.dailyView='RECOMMENDED';saveState();renderAll();};
  if($('#allViewBtn')) $('#allViewBtn').onclick=()=>{state.dailyView='ALL';saveState();renderAll();};
  $$('#route .info-toggle').forEach(b=>b.addEventListener('click',()=>{
    const panel=document.getElementById(`reason-${b.dataset.infoId}`); if(!panel)return;
    const open=panel.hidden; panel.hidden=!open; b.setAttribute('aria-expanded',String(open)); b.classList.toggle('active',open);
  }));
  $$('#route .status').forEach(b=>b.addEventListener('click',()=>{
    const t=tasks.find(x=>x.id===b.dataset.id); if(!t)return;
    const map=statusMapForTask(t); const action=b.dataset.action;
    map[t.id]=map[t.id]===action?'todo':action;
    saveState(); renderAll();
  }));
}

function computePrepPlan(){
  const bomBase=computeBOM().base;
  const pending=recommendedDailyTasks()
    .filter(t=>!['done','skip'].includes(taskStatus(t)))
    .sort((a,b)=>routeRank(a)-routeRank(b));
  const external={},produced={},producedBy={},transit=[];

  pending.forEach(t=>{
    const count=plannedBarterCount(t,bomBase);
    if(count<=0) return;
    let need=Number(t.inputQty||0)*count;
    const available=Number(produced[t.input]||0);
    const fromRoute=Math.min(need,available);
    if(fromRoute>0){
      need-=fromRoute; produced[t.input]=available-fromRoute;
      const from=producedBy[t.input];
      transit.push({id:t.input,qty:fromRoute,from:from?`${from.town} → ${from.npc}`:'前站交換',to:`${t.town} → ${t.npc}`});
    }
    if(need>0){
      external[t.town]??={}; external[t.town][t.input]=(external[t.town][t.input]||0)+need;
    }
    produced[t.output]=(produced[t.output]||0)+Number(t.outputQty||0)*count;
    producedBy[t.output]=t;
  });
  return {external,transit};
}

function renderPrep(){
  const {external,transit}=computePrepPlan();
  $('#prep').innerHTML=`
    <div class="notice">依「推薦項目」計算出門材料；完整交換目錄只是查詢用途，不會把所有低優先交換都塞進準備清單。前一站能取得的中間交換品會列在「途中銜接」。</div>
    ${Object.entries(external).map(([town,items])=>`<div class="card"><b>${town}</b><div class="sep"></div>${Object.entries(items).map(([id,q])=>`<label style="display:block;margin:8px 0"><input type="checkbox" style="width:auto;margin-right:8px">${nameOf(id)} ×${qtyText(q)}</label>`).join('')}</div>`).join('')||'<div class="card">目前沒有需要額外自帶的推薦交換材料。</div>'}
    ${transit.length?`<div class="card"><b>途中銜接</b><div class="sep"></div>${transit.map(x=>`<div class="route-chip">${x.from} 取得 ${nameOf(x.id)} ×${qtyText(x.qty)} → 帶到 ${x.to}</div>`).join('')}</div>`:''}`;
}

function renderProduction(){
  const {base,surplus}=computeBOM();
  const entries=Object.entries(base).filter(([,q])=>q>0).sort((a,b)=>b[1]-a[1]);
  const shopIds=new Set(shopCatalog.map(t=>t.output));
  const barterIds=new Set(barterCatalog.map(t=>t.output));
  const shopCost=entries.reduce((sum,[id,q])=>{
    const prices=shopCatalog.filter(t=>t.output===id).map(t=>t.price).filter(Boolean);
    return sum+(prices.length?Math.min(...prices)*q:0);
  },0);

  $('#production').innerHTML=`
    <div class="grid2">
      <div class="card"><b>本週成品目標</b><div class="sep"></div>${Object.entries(recipes).map(([id,r])=>`<div class="goal-row"><div>${badgeP(r.priority)} ${r.name}<div class="small">每批產出 ${r.outputQty}</div></div><input class="goal" data-id="${id}" type="number" min="0" step="1" value="${state.goals[id]||0}"></div>`).join('')}</div>
      <div class="card"><b>計算摘要</b><div class="sep"></div><div class="grid2"><div class="metric"><div class="label">基礎缺料</div><div class="value">${entries.length}</div></div><div class="metric"><div class="label">NPC 可購缺口估值</div><div class="value">$${money(shopCost)}</div></div></div><div class="small" style="margin-top:10px">製作 BOM 遞迴展開配方與批次產量；若缺料可透過每日交換取得，會標出完整 NPC 來源與後續交換鏈。</div></div>
    </div>
    <div class="card"><b>缺料與庫存</b><div class="sep"></div>
      ${entries.length?entries.map(([id,q])=>{
        const bsrc=barterSourcesFor(id);
        const extra=[shopIds.has(id)?'可由每週商店補':'',barterIds.has(id)?'可由每日交換取得':''].filter(Boolean).join('｜');
        return `<div class="material-row"><div><b>${nameOf(id)}</b><div class="source">${materials[id]?.source||''}${extra?`｜${extra}`:''}</div>${bsrc.length?`<div class="small" style="margin-top:4px;color:var(--accent)">交換來源：${bsrc.map(t=>`${t.town} → ${t.npc}`).join('、')}</div>`:''}</div><div class="right">缺 <b>${q}</b></div><input class="inv" data-id="${id}" type="number" min="0" value="${state.inventory[id]||0}" placeholder="庫存"></div>`;
      }).join(''):'<div class="small">設定成品目標後，這裡會自動展開完整材料缺口。</div>'}
      ${Object.keys(surplus).length?`<details><summary>批次製作剩餘</summary><div class="reason">${Object.entries(surplus).filter(([,q])=>q>0).map(([id,q])=>`${nameOf(id)} +${q}`).join('、')||'無'}</div></details>`:''}
    </div>`;

  $$('.goal').forEach(i=>i.addEventListener('change',()=>{state.goals[i.dataset.id]=Math.max(0,Number(i.value||0));saveState();renderAll();}));
  $$('.inv').forEach(i=>i.addEventListener('change',()=>{state.inventory[i.dataset.id]=Math.max(0,Number(i.value||0));saveState();renderAll();}));
}

function materialUses(id){
  const out=[];
  Object.entries(recipes).forEach(([,r])=>{if(r.ingredients[id])out.push(`${r.name}：${r.ingredients[id]}/批`);});
  barterUsesFor(id).forEach(t=>out.push(`交換｜${t.town} → ${t.npc}：${nameOf(t.input)} ×${qtyText(t.inputQty)} → ${nameOf(t.output)} ×${qtyText(t.outputQty)}`));
  return out;
}

function renderSearch(){
  const q=(state.q||'').trim().toLowerCase();
  const ids=Object.keys(materials).filter(id=>{
    const src=acquisitionSources(id).map(t=>`${t.town}${t.npc}`).join(' ');
    const uses=materialUses(id).join(' ');
    return !q||`${materials[id].name} ${materials[id].source} ${src} ${uses}`.toLowerCase().includes(q);
  });
  $('#search').innerHTML=ids.length?ids.map(id=>{
    const src=acquisitionSources(id),uses=materialUses(id);
    return `<div class="card"><div style="display:flex;justify-content:space-between;gap:10px"><b>${materials[id].name}</b><span class="small">${materials[id].source}</span></div><div class="search-result"><div><b class="small">取得方式</b>${src.length?src.map(t=>`<div class="route-chip">${t.town} → ${t.npc}｜${t.type==='shop'?`$${money(t.price)}`:`${nameOf(t.input)} ×${qtyText(t.inputQty)} → ×${qtyText(t.outputQty)}${t.limit!=null?`｜限${t.limit}`:''}`}</div>`).join(''):'<div class="small" style="margin-top:6px">目前沒有已收錄的 NPC 來源</div>'}</div><div><b class="small">核心用途／後續交換</b>${uses.length?uses.map(x=>`<div class="route-chip">${x}</div>`).join(''):'<div class="small" style="margin-top:6px">目前核心配方或交換鏈未使用。</div>'}</div></div></div>`;
  }).join(''):'<div class="notice">沒有符合搜尋條件的材料。</div>';
}

function renderAll(){
  renderMetrics();renderRoute();renderPrep();renderProduction();renderSearch();
  $('#q').value=state.q||''; $('#pf').value=state.pf||'ALL';
  $$('.panel').forEach(p=>p.classList.toggle('active',p.id===state.tab));
  $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
}

$$('.tab').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;saveState();renderAll();}));
$('#q').addEventListener('input',e=>{state.q=e.target.value;saveState();renderRoute();renderSearch();});
$('#pf').addEventListener('change',e=>{state.pf=e.target.value;saveState();renderRoute();});

$('#resetBtn').addEventListener('click',()=>{
  const choice=prompt('輸入 1 重設「每日推薦交換」；輸入 2 重設「每週限購商店」；輸入 3 兩者都重設。\n一次性設計圖的永久完成狀態、庫存與生產目標都會保留。','1');
  if(choice==='1') state.dailyStatus={};
  else if(choice==='2') state.weeklyStatus={};
  else if(choice==='3'){state.dailyStatus={};state.weeklyStatus={};}
  else return;
  saveState();renderAll();
});

$('#exportBtn').addEventListener('click',()=>{
  const payload={exportedAt:new Date().toISOString(),state};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url;a.download='mabinogi-life-tool-data.json';a.click();URL.revokeObjectURL(url);
});

$('#importFile').addEventListener('change',async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
    const obj=JSON.parse(await f.text()); const incoming=migrateState(obj.state||obj);
    state={...structuredClone(DEFAULT_STATE),...incoming,
      routeMode:incoming.routeMode||'DAILY',dailyView:incoming.dailyView||'RECOMMENDED',
      dailyStatus:{...(incoming.dailyStatus||{})},weeklyStatus:{...(incoming.weeklyStatus||{})},permanentStatus:{...(incoming.permanentStatus||{})},
      goals:{...DEFAULT_STATE.goals,...(incoming.goals||{})},inventory:{...(incoming.inventory||{})}};
    saveState();renderAll();alert('匯入完成');
  }catch(err){alert('匯入失敗：檔案格式不正確');}
  e.target.value='';
});

renderAll();