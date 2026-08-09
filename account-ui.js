(() => {
  function initAccountUI(){
    const authBtn = document.querySelector('#authBtn');
    const logoutBtn = document.querySelector('#logoutBtn');
    const authModal = document.querySelector('#authModal');
    const cloudStatus = document.querySelector('#cloudStatus');
    if(!authBtn || !logoutBtn) return;

    const modal = document.createElement('div');
    modal.id = 'accountModal';
    modal.className = 'auth-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="auth-card account-card">
        <button class="auth-close" id="accountClose" aria-label="關閉">×</button>
        <h3>帳號資訊</h3>
        <div class="account-info-row"><span>帳號</span><strong id="accountEmail"></strong></div>
        <div class="account-info-row"><span>登入方式</span><strong id="accountProvider"></strong></div>
        <div class="account-info-row"><span>同步狀態</span><strong id="accountSync"></strong></div>
        <div class="small account-note">你的跑商進度、庫存與生產目標會同步到這個帳號。</div>
      </div>`;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
      .account-card{width:min(390px,100%)}
      .account-info-row{display:flex;justify-content:space-between;gap:18px;padding:12px 0;border-bottom:1px solid var(--line);font-size:.9rem}
      .account-info-row span{color:var(--muted)}
      .account-info-row strong{max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right}
      .account-note{margin-top:14px}
    `;
    document.head.appendChild(style);

    const close = () => { modal.hidden = true; };
    document.querySelector('#accountClose').onclick = close;
    modal.addEventListener('click', e => { if(e.target === modal) close(); });

    authBtn.addEventListener('click', e => {
      // cloud.js uses this same button for opening the login dialog. Once logged in,
      // intercept the click first and show account information instead.
      if(logoutBtn.hidden) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if(authModal) authModal.hidden = true;

      document.querySelector('#accountEmail').textContent = authBtn.textContent || '已登入';
      const title = authBtn.getAttribute('title') || '';
      document.querySelector('#accountProvider').textContent = title.replace(/^登入方式：/, '') || '已驗證帳號';
      document.querySelector('#accountSync').textContent = cloudStatus?.textContent || '已登入';
      modal.hidden = false;
    }, true);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', () => setTimeout(initAccountUI, 0));
  }else{
    setTimeout(initAccountUI, 0);
  }
})();