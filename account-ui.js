(() => {
  const CURRENT_VERSION = '2.7';
  const CHANGELOG = [
    {
      version:'2.7',
      title:'雲端同步衝突修正',
      items:['修正登入後本機／雲端資料選擇視窗反覆跳出的問題','雲端只同步跑商進度、一次性完成、庫存與生產目標，不再同步頁籤／搜尋／篩選等 UI 狀態','舊雲端資料會先套用目前資料結構再比較，避免版本升級被誤判為衝突','真正雙邊都有變更時改用站內選擇視窗，不再使用瀏覽器原生 confirm 對話框']
    },
    {
      version:'2.6',
      title:'通用登入頭像',
      items:['右上角改成圓形頭像，不再長駐顯示 Email','Google 等 OAuth 優先顯示登入平台提供的頭像','沒有平台頭像時自動以名稱或 Email 首字母建立頭像','頭像右下角以狀態點表示已同步、同步中或離線','帳號、Email、登入平台、版本紀錄與登出仍集中在同一選單']
    },
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
      .cloud-account{position:relative;display:flex;align-items:center}
      #cloudStatus,#logoutBtn{display:none!important}
      #authBtn.account-avatar-trigger{position:relative;width:44px;height:44px;min-width:44px;padding:0!important;border-radius:50%!important;display:grid;place-items:center;overflow:visible;background:#111820;border:1px solid var(--line);box-shadow:none}
      #authBtn.account-avatar-trigger:hover{border-color:var(--accent)}
      .avatar-shell{width:38px;height:38px;border-radius:50%;overflow:hidden;display:grid;place-items:center;position:relative;background:#27323d;color:var(--text);font-weight:800;font-size:1rem;line-height:1}
      .avatar-shell.menu-avatar{width:50px;height:50px;font-size:1.15rem;flex:0 0 50px}
      .avatar-letter{position:absolute;inset:0;display:grid;place-items:center;text-transform:uppercase}
      .avatar-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}
      .avatar-guest{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;color:var(--muted)}
      .avatar-status-dot{position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;border-radius:50%;border:2px solid #0d1319;background:#78838d;z-index:4}
      .avatar-status-dot.ok{background:#46d778}.avatar-status-dot.warn{background:#f0bb4c}.avatar-status-dot.offline{background:#78838d}
      .account-menu{position:absolute;right:0;top:calc(100% + 9px);z-index:10050;width:min(410px,calc(100vw - 24px));max-height:min(72vh,650px);overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 18px 55px #0009;padding:10px}
      .account-menu[hidden]{display:none}
      .account-menu-section{padding:10px}.account-menu-section+.account-menu-section{border-top:1px solid var(--line)}
      .account-identity{display:flex;align-items:center;gap:12px;min-width:0}.account-identity-copy{min-width:0;flex:1}
      .account-menu-eyebrow{font-size:.72rem;color:var(--muted);margin-bottom:4px}.account-menu-name{font-weight:800;font-size:1rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.account-menu-email{font-size:.78rem;color:var(--muted);margin-top:3px;overflow-wrap:anywhere}
      .account-menu-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.account-pill{font-size:.72rem;border:1px solid var(--line);border-radius:999px;padding:4px 8px;color:var(--muted)}.account-pill.ok{border-color:#2c6941;color:var(--accent)}.account-pill.warn{border-color:#7a6330;color:var(--warn)}
      .account-menu-actions{display:grid;gap:7px}.account-menu-action{width:100%;text-align:left;background:#10161d;color:var(--text);border:1px solid var(--line);border-radius:10px;padding:10px 11px;cursor:pointer}.account-menu-action:hover{border-color:var(--accent)}.account-menu-action.danger{color:#ffb1b1}.account-menu-action.primary{background:var(--accent);color:#0d1711;border-color:var(--accent);font-weight:750}
      .version-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.version-current{font-size:.72rem;color:#0d1711;background:var(--accent);border-radius:999px;padding:4px 8px;font-weight:800}.version-list{margin-top:8px}.version-item{padding:10px 0}.version-item+.version-item{border-top:1px solid var(--line)}.version-title{display:flex;align-items:baseline;gap:8px}.version-number{font-weight:800;color:var(--accent)}.version-name{font-weight:700}.version-item ul{margin:6px 0 0;padding-left:18px;color:var(--muted);font-size:.78rem;line-height:1.55}.version-item li+li{margin-top:2px}
      @media(max-width:780px){.account-menu{position:fixed;left:12px;right:12px;top:72px;width:auto;max-height:calc(100vh - 90px)}#authBtn.account-avatar-trigger{width:42px;height:42px;min-width:42px}.avatar-shell{width:36px;height:36px}}
    `;
    document.head.appendChild(style);

    function loggedIn(){ return authBtn.dataset.loggedIn === '1'; }
    function providerLabel(){ return authBtn.dataset.providerLabel || '已驗證帳號'; }
    function email(){ return authBtn.dataset.email || ''; }
    function displayName(){ return authBtn.dataset.displayName || (email() ? email().split('@')[0] : '帳號'); }
    function avatarUrl(){ return authBtn.dataset.avatarUrl || ''; }
    function initial(){ return (authBtn.dataset.initial || email().charAt(0) || displayName().charAt(0) || '?').toUpperCase(); }

    function syncState(text){
      if(/已同步/.test(text)) return 'ok';
      if(/讀取|同步中/.test(text)) return 'warn';
      return 'offline';
    }

    function guestIcon(){
      return `<svg class="avatar-guest" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4.5 21c.7-4.3 3.2-6.5 7.5-6.5s6.8 2.2 7.5 6.5"></path></svg>`;
    }

    function avatarHtml(sizeClass=''){
      if(!loggedIn()) return `<span class="avatar-shell ${sizeClass}">${guestIcon()}</span>`;
      const fallback = `<span class="avatar-letter">${esc(initial())}</span>`;
      const image = avatarUrl() ? `<img class="avatar-image" src="${esc(avatarUrl())}" alt="" referrerpolicy="no-referrer">` : '';
      return `<span class="avatar-shell ${sizeClass}">${fallback}${image}</span>`;
    }

    function bindAvatarFallback(root){
      root.querySelectorAll('.avatar-image').forEach(img => {
        img.addEventListener('error', () => { img.style.display='none'; }, {once:true});
      });
    }

    function statusClass(text){
      const state = syncState(text);
      return state === 'ok' ? 'ok' : state === 'warn' ? 'warn' : '';
    }

    function changelogHtml(){
      return CHANGELOG.map(v => `
        <div class="version-item">
          <div class="version-title"><span class="version-number">v${esc(v.version)}</span><span class="version-name">${esc(v.title)}</span></div>
          <ul>${v.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </div>`).join('');
    }

    function syncTrigger(){
      const syncText = cloudStatus?.textContent || (loggedIn() ? '已登入' : '本機模式');
      const signature = [loggedIn(),email(),displayName(),avatarUrl(),initial(),syncText].join('|');
      if(authBtn.dataset.avatarSignature === signature) return;
      authBtn.dataset.avatarSignature = signature;
      authBtn.classList.add('account-avatar-trigger');
      authBtn.classList.remove('sync-user');
      authBtn.setAttribute('aria-label', loggedIn() ? `帳號選單：${displayName()}` : '登入與系統資訊');
      authBtn.setAttribute('title', loggedIn() ? displayName() : '登入 / 註冊');
      authBtn.innerHTML = `${avatarHtml()}<span class="avatar-status-dot ${syncState(syncText)}" aria-hidden="true"></span>`;
      bindAvatarFallback(authBtn);
    }

    function renderMenu(){
      const isLoggedIn = loggedIn();
      const syncText = cloudStatus?.textContent || (isLoggedIn ? '已登入' : '本機模式');
      menu.innerHTML = `
        <div class="account-menu-section">
          <div class="account-identity">
            ${avatarHtml('menu-avatar')}
            <div class="account-identity-copy">
              <div class="account-menu-eyebrow">${isLoggedIn ? '目前登入者' : '帳號'}</div>
              <div class="account-menu-name">${esc(isLoggedIn ? displayName() : '尚未登入')}</div>
              ${isLoggedIn && email()?`<div class="account-menu-email">${esc(email())}</div>`:''}
            </div>
          </div>
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

      bindAvatarFallback(menu);
      menu.querySelector('#menuLoginBtn')?.addEventListener('click', () => {
        menu.hidden = true;
        if(authModal) authModal.hidden = false;
      });
      menu.querySelector('#menuLogoutBtn')?.addEventListener('click', () => {
        menu.hidden = true;
        logoutBtn.click();
      });
    }

    function openMenu(){ renderMenu(); menu.hidden = false; }
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
      syncTrigger();
      if(!menu.hidden) renderMenu();
    });
    observer.observe(authBtn,{childList:true,subtree:true,attributes:true});
    if(cloudStatus) observer.observe(cloudStatus,{childList:true,subtree:true,attributes:true});
    syncTrigger();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(initAccountUI, 0));
  }else{
    setTimeout(initAccountUI, 0);
  }
})();