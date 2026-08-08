// Dynamic homepage workflow guide. Personal progress remains in the existing browser state.
(() => {
  const prepKey = 'mabiLifeToolPrepReviewed';

  function ensureGuideHost(){
    if(document.getElementById('guide')) return;
    const metrics=document.getElementById('metrics');
    if(!metrics) return;
    const host=document.createElement('section');
    host.id='guide';
    metrics.parentNode.insertBefore(host,metrics);
  }

  function ensureGuideStyle(){
    if(document.getElementById('guide-style')) return;
    const style=document.createElement('style');
    style.id='guide-style';
    style.textContent=`
      .guide-card{background:linear-gradient(135deg,#17241d,#171e26 65%);border:1px solid #315e3d;border-radius:16px;padding:15px;margin:14px 0}
      .guide-head{display:flex;align-items:center;justify-content:space-between;gap:16px}
      .guide-eyebrow{font-size:.78rem;color:var(--accent);font-weight:700;letter-spacing:.04em;margin-bottom:4px}
      .guide-title{font-size:1.08rem;font-weight:750}
      .guide-message{color:var(--muted);font-size:.87rem;line-height:1.55;margin-top:5px;max-width:760px}
      .guide-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;flex-shrink:0}
      .guide-btn{border-radius:10px;padding:9px 12px;border:1px solid var(--line);font-weight:650;cursor:pointer}
      .guide-btn.primary{background:var(--accent);border-color:var(--accent);color:#0d1711}
      .guide-btn.secondary{background:#10161d;color:var(--text)}
      .guide-steps{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:14px}
      .guide-step{display:flex;align-items:center;gap:7px;padding:8px 9px;border:1px solid var(--line);border-radius:10px;color:var(--muted);font-size:.82rem;background:#10161d}
      .guide-step.current{border-color:var(--accent);color:var(--text);background:#173323}
      .guide-step.done{color:#b9d7c2;border-color:#294e34;background:#13251a}
      .guide-num{width:22px;height:22px;border:1px solid currentColor;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:800;flex:0 0 22px}
      @media(max-width:780px){
        .guide-head{align-items:flex-start;flex-direction:column}
        .guide-actions{justify-content:flex-start;width:100%}
        .guide-btn{flex:1}
        .guide-steps{grid-template-columns:1fr 1fr}
        .guide-step:last-child{grid-column:1 / -1}
      }
    `;
    document.head.appendChild(style);
  }

  function prepReviewed(){
    try{return sessionStorage.getItem(prepKey)==='1';}catch(e){return false;}
  }

  function setPrepReviewed(value){
    try{
      if(value) sessionStorage.setItem(prepKey,'1');
      else sessionStorage.removeItem(prepKey);
    }catch(e){}
  }

  function goToSection(tab, routeMode=null){
    state.tab=tab;
    if(routeMode) state.routeMode=routeMode;
    if(tab==='prep') setPrepReviewed(true);
    saveState();
    renderAll();
    requestAnimationFrame(()=>{
      const target=document.getElementById(tab);
      if(target) target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  function renderGuide(){
    ensureGuideHost();
    ensureGuideStyle();
    const host=document.getElementById('guide');
    if(!host) return;

    const hasGoals=Object.values(state.goals).some(v=>Number(v)>0);
    const rec=recommendations();
    const weeklyActionable=tasks.filter(t=>t.type==='shop' && (rec[t.id]||0)>0);
    const weeklyRemaining=weeklyActionable.filter(t=>!['done','skip'].includes(taskStatus(t)));
    const dailyRemaining=tasks.filter(t=>t.type==='barter' && !['done','skip'].includes(taskStatus(t)));

    let current=1;
    let title='先設定本週想做什麼';
    let message='先到「生產規劃」設定本週料理／秘藥目標；有現成材料時也一起填庫存，之後每週商店才會算出真正該買多少。';
    let primary={label:'設定本週目標',tab:'production'};
    let secondary={label:'先跑每日交換',tab:'route',mode:'DAILY'};

    if(hasGoals && weeklyRemaining.length>0){
      current=2;
      title=`先補每週限購：還有 ${weeklyRemaining.length} 項建議採買`;
      message='工具已依生產目標與庫存算出商店缺口。先把本週需要的限購材料補齊，再準備每日交換。';
      primary={label:'查看每週限購',tab:'route',mode:'WEEKLY'};
      secondary={label:'查看生產缺料',tab:'production'};
    }else if(hasGoals && dailyRemaining.length>0 && !prepReviewed()){
      current=3;
      title='每日交換前，先把材料一次帶齊';
      message=`每日以物易物還有 ${dailyRemaining.length} 項尚未處理。先看「出門準備」，可以減少跑到 NPC 才發現缺材料的往返。`;
      primary={label:'查看出門準備',tab:'prep'};
      secondary={label:'直接看每日交換',tab:'route',mode:'DAILY'};
    }else if(hasGoals && dailyRemaining.length>0){
      current=4;
      title=`開始每日交換：還有 ${dailyRemaining.length} 項`;
      message='材料已看過，接著照城鎮與 NPC 順序逐項完成；不打算做的項目可直接標記跳過。';
      primary={label:'開始每日交換',tab:'route',mode:'DAILY'};
      secondary={label:'再看一次準備清單',tab:'prep'};
    }else if(hasGoals){
      current=5;
      title='本輪跑商已處理完成';
      message='製作料理／秘藥或大量消耗材料後，回到「生產規劃」更新重要庫存，下一輪建議購買量才會維持準確。';
      primary={label:'更新庫存 / 生產規劃',tab:'production'};
      secondary={label:'查看材料用途',tab:'search'};
    }

    const steps=[['1','目標與庫存'],['2','每週限購'],['3','出門準備'],['4','每日交換'],['5','更新庫存']];
    const button=(cfg,kind='primary')=>`<button class="guide-btn ${kind}" data-guide-tab="${cfg.tab}" ${cfg.mode?`data-guide-mode="${cfg.mode}"`:''}>${cfg.label}</button>`;

    host.innerHTML=`
      <div class="guide-card">
        <div class="guide-head">
          <div>
            <div class="guide-eyebrow">建議操作流程</div>
            <div class="guide-title">${title}</div>
            <div class="guide-message">${message}</div>
          </div>
          <div class="guide-actions">${button(primary)}${button(secondary,'secondary')}</div>
        </div>
        <div class="guide-steps">
          ${steps.map(([n,label])=>`<div class="guide-step ${Number(n)<current?'done':Number(n)===current?'current':''}"><span class="guide-num">${Number(n)<current?'✓':n}</span><span>${label}</span></div>`).join('')}
        </div>
      </div>`;

    host.querySelectorAll('.guide-btn').forEach(b=>b.addEventListener('click',()=>goToSection(b.dataset.guideTab,b.dataset.guideMode||null)));
  }

  // Existing app events call renderAll dynamically, so wrapping it keeps the guide in sync.
  const baseRenderAll=renderAll;
  renderAll=function(){
    baseRenderAll();
    renderGuide();
  };

  const prepTab=document.querySelector('.tab[data-tab="prep"]');
  if(prepTab){
    prepTab.addEventListener('click',()=>{
      setPrepReviewed(true);
      requestAnimationFrame(renderGuide);
    });
  }

  const resetBtn=document.getElementById('resetBtn');
  if(resetBtn){
    resetBtn.addEventListener('click',()=>{
      // If the daily checklist was reset, the next render should recommend checking prep again.
      setTimeout(()=>{
        const allDailyTodo=tasks.filter(t=>t.type==='barter').every(t=>taskStatus(t)==='todo');
        if(allDailyTodo) setPrepReviewed(false);
        renderGuide();
      },0);
    });
  }

  renderGuide();
})();
