(() => {
  const CURRENT_VERSION = '2.5';
  const CHANGELOG = [
    {
      version:'2.5',
      title:'帳號選單與版本紀錄',
      items:['右上角整合帳號、同步狀態、版本紀錄與登出','未登入時也可從同一選單登入／註冊並查看更新內容']
    },
    {
      version:'2.4',
      title:'完整生產規劃',
      items:['成品目標分成頂級料理、高階藥品、武器、防具、飾品','加入現階段最高階製作裝備與藥品','重寫 BOM，合併共用中間材料後再依批次產量進位']
    },
    {
      version:'2.3',
      title:'完整以物易物目錄',
      items:['每日交換拆成「推薦項目／全部交換」','補齊四地區已整理的 NPC 交換目錄','一次性設計圖可永久標記完成']
    },
    {
      version:'2.2',
      title:'交換鏈與巢狀路線',
      items:['加入交換 → 再交換的上下游關聯','出門準備可辨識途中取得的中間交換品','補上特蕾西音樂盒 → 瓦爾特皮革等跨城供應鏈']
    },
    {
      version:'2.1',
      title:'Google 登入',
      items:['Google OAuth 成為主要登入方式','Email／Password 保留為備援','OAuth 錯誤網址自動清理並顯示簡短提示']
    },
    {
      version:'2.0',
      title:'帳號與雲端同步',
      items:['導入 Supabase Auth 與 user_states','RLS 限制每位玩家只能讀寫自己的資料','登入後跨裝置同步，Local Storage 保留作本機快取與舊資料移轉']
    },
    {
      version:'1.0',
      title:'第一個正式 Web 版',
      items:['GitHub Pages 公開部署','每日交換與每週限購分離','庫存、生產目標、缺料、材料搜尋與匯出／匯入','個人進度保存在瀏覽器 Local Storage']
    }
  ];

  function esc(value){
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function initAccountUI(){
    const authBtn = document.querySelector('#authBtn');
    const logoutBtn = document.querySelector('#logoutBtn');
    const authModal = document.querySelector('#authModal');
    const cloudStatus = document.querySelector('#cloudStatus');
    const cloudAccount = document.querySelector('.cloud-account');
    if(!authBtn || !logoutBtn || !cloudAccount) return;

    const menu = document.createElement('div');
    menu.id = 'accountMenu';
    menu.className = 'account-menu';
    menu.hidden = true;
    cloudAccount.appendChild(menu);

    const style = document.createElement('style');
    style.id = 'account-menu-style';
    style.textContent = `
      .cloud-account{position:relative}
      #cloudStatus,#logoutBtn{display:none!important}
      #authBtn:after{content:'⌄';margin-left:7px;color:var(--muted);font-size:.85em}
      .account-menu{position:absolute;right:0;top:calc(100% + 9px);z-index:10050;width:min(410px,calc(100vw - 24px));max-height:min(72vh,650px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 55px #0009;padding:10px}
      .account-menu[hidden]{display:none}
      .account-menu-section{padding:10px}.account-menu-section+.account-menu-section{border-top:1px solid var(--line)}
      .account-menu-eyebrow{font-size:.72rem;color:var(--muted);margin-bottom:5px}.account-menu-email{font-weight:750;overflow-wrap:anywhere}.account-menu-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.account-pill{font-size:.72rem;border:1px solid var(--line);border-radius:999px;padding:4px 8px;color:var(--muted)}.account-pill.ok{border-color:#2c6941;color:var(--accent)}.account-pill.warn{border-color:#7a6330;color:var(--warn)}
      .account-menu-actions{display:grid;gap:7px}.account-menu-action{width:100%;text-align:left;background:#10161d;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 11px;cursor:pointer}.account-menu-action:hover{border-color:var(--accent)}.account-menu-action.danger{color:#ffb1b1}.account-menu-action.primary{background:var(--accent);color:#0d1711;border-color:var(--accent);font-weight:750}
      .version-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.version-current{font-size:.72rem;color:#0d1711;background:var(--accent);border-radius:999px;padding:4px 8px;font-weight:800}.version-list{margin-top:8px}.version-item{padding:10px 0}.version-item+.version-item{border-top:1px solid var(--line)}.version-title{display:flex;align-items:baseline;gap:8px}.version-number{font-weight:800;color:var(--accent)}.version-name{font-weight:700}.version-item ul{margin:6px 0 0;padding-left:18px;color:var(--muted);font-size:.78rem;line-height:1.55}.version-item li+li{margin-top:2px}
      @media(max-width:780px){.account-menu{position:fixed;left:12px;right:12px;top:72px;width:auto;max-height:calc(100vh - 90px)}}
    `;
    document.head.appendChild(style);

    function loggedIn(){
      return authBtn.textContent.trim() !== '登入 / 註冊';
    }

    function providerLabel(){
      const title = authBtn.getAttribute('title') || '';
      return title.replace(/^登入方式：/, '') || '已驗證帳號';
    }

    function statusClass(text){
      if(/已同步/.test(text)) return 'ok';
      if(/離線|讀取|同步中/.test(text)) return 'warn';
      return '';
    }

    function changelogHtml(){
      return CHANGELOG.map(v => `
        <div class="version-item">
          <div class="version-title"><span class="version-number">v${esc(v.version)}</span><span class="version-name">${esc(v.title)}</span></div>
          <ul>${v.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>`).join('');
    }

    function renderMenu(){
      const isLoggedIn = loggedIn();
      const syncText = cloudStatus?.textContent || (isLoggedIn ? '已登入' : '本機模式');
      menu.innerHTML = `
        <div class="account-menu-section">
          <div class="account-menu-eyebrow">${isLoggedIn ? '目前登入者' : '帳號'}</div>
          <div class="account-menu-email">${esc(isLoggedIn ? authBtn.textContent.trim() : '尚未登入')}</div>
          <div class="account-menu-meta">
            ${isLoggedIn ? `<span class="account-pill">${esc(providerLabel())}</span>` : '<span class="account-pill">本機模式</span>'}
            <span class="account-pill ${statusClass(syncText)}">${esc(syncText)}</span>
          </div>
        </div>
        <div class="account-menu-section account-menu-actions">
          ${isLoggedIn
            ? '<button class="account-menu-action danger" id="menuLogoutBtn" type="button">登出</button>'
            : '<button class="account-menu-action primary" id="menuLoginBtn" type="button">登入 / 註冊</button>'}
        </div>
        <div class="account-menu-section">
          <div class="version-head"><div><div class="account-menu-eyebrow">系統更新</div><b>版本紀錄</b></div><span class="version-current">目前 v${CURRENT_VERSION}</span></div>
          <div class="version-list">${changelogHtml()}</div>
        </div>`;

      menu.querySelector('#menuLoginBtn')?.addEventListener('click', () => {
        menu.hidden = true;
        if(authModal) authModal.hidden = false;
      });
      menu.querySelector('#menuLogoutBtn')?.addEventListener('click', () => {
        menu.hidden = true;
        logoutBtn.click();
      });
    }

    function openMenu(){
      renderMenu();
      menu.hidden = false;
    }
    function closeMenu(){ menu.hidden = true; }

    authBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopImmediatePropagation();
      if(menu.hidden) openMenu(); else closeMenu();
    }, true);

    document.addEventListener('click', e => {
      if(!menu.hidden && !cloudAccount.contains(e.target)) closeMenu();
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeMenu(); });

    const observer = new MutationObserver(() => {
      if(!menu.hidden) renderMenu();
    });
    observer.observe(authBtn,{childList:true,subtree:true,attributes:true});
    if(cloudStatus) observer.observe(cloudStatus,{childList:true,subtree:true,attributes:true});
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(initAccountUI, 0));
  }else{
    setTimeout(initAccountUI, 0);
  }
})();