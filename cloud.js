(() => {
  const SUPABASE_URL = 'https://gzsqfvbrvzfcetzjipuc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_L8_nFbp95L5cmVQ5E1uu2g_pfgzDe4E';
  const STORAGE_KEY = 'mabiLifeToolState';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let currentUser = null;
  let lastSyncedLocal = localStorage.getItem(STORAGE_KEY) || '';
  let syncTimer = null;
  let syncing = false;

  function localText(){ return localStorage.getItem(STORAGE_KEY) || ''; }
  function localState(){
    try { return JSON.parse(localText() || '{}'); } catch { return {}; }
  }
  function meaningful(s){
    if(!s || typeof s !== 'object') return false;
    const maps = ['dailyStatus','weeklyStatus','inventory'];
    if(maps.some(k => Object.keys(s[k] || {}).length > 0)) return true;
    return Object.values(s.goals || {}).some(v => Number(v) > 0);
  }
  function setCloudStatus(text, cls=''){
    const el = document.querySelector('#cloudStatus');
    if(el){ el.textContent = text; el.className = `cloud-status ${cls}`; }
  }

  function injectUI(){
    const toolbar = document.querySelector('.toolbar');
    if(!toolbar) return;
    const box = document.createElement('div');
    box.className = 'cloud-account';
    box.innerHTML = `<span id="cloudStatus" class="cloud-status">未登入</span><button class="btn" id="authBtn">登入 / 註冊</button><button class="btn" id="logoutBtn" hidden>登出</button>`;
    toolbar.prepend(box);

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="auth-card">
        <button class="auth-close" id="authClose" aria-label="關閉">×</button>
        <h3>帳號登入 / 註冊</h3>
        <div class="small">登入後，跑商進度、庫存與生產目標會同步到雲端。</div>
        <label>Email<input id="authEmail" type="email" autocomplete="email" placeholder="name@example.com"></label>
        <label>密碼<input id="authPassword" type="password" autocomplete="current-password" placeholder="至少 6 個字元"></label>
        <div class="auth-actions">
          <button class="btn primary" id="loginBtn">登入</button>
          <button class="btn" id="signupBtn">建立帳號</button>
        </div>
        <div id="authMessage" class="small"></div>
      </div>`;
    document.body.appendChild(modal);

    const style = document.createElement('style');
    style.textContent = `
      .cloud-account{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.cloud-status{font-size:.8rem;color:var(--muted)}.cloud-status.ok{color:var(--accent)}.cloud-status.warn{color:var(--warn)}
      .auth-modal{position:fixed;inset:0;background:#0009;z-index:9999;display:grid;place-items:center;padding:18px}.auth-modal[hidden]{display:none}.auth-card{width:min(420px,100%);background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;position:relative;box-shadow:0 20px 60px #0008}.auth-card h3{margin:0 0 6px}.auth-card label{display:block;margin:14px 0 0;color:var(--muted);font-size:.86rem}.auth-card label input{margin-top:5px}.auth-actions{display:flex;gap:8px;margin-top:14px}.auth-close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:var(--muted);font-size:1.7rem}.sync-user{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    `;
    document.head.appendChild(style);

    document.querySelector('#authBtn').onclick = () => { modal.hidden = false; };
    document.querySelector('#authClose').onclick = () => { modal.hidden = true; };
    modal.addEventListener('click', e => { if(e.target === modal) modal.hidden = true; });
    document.querySelector('#loginBtn').onclick = login;
    document.querySelector('#signupBtn').onclick = signup;
    document.querySelector('#logoutBtn').onclick = logout;
  }

  function authValues(){
    return {
      email: document.querySelector('#authEmail').value.trim(),
      password: document.querySelector('#authPassword').value
    };
  }
  function authMessage(msg, bad=false){
    const el = document.querySelector('#authMessage');
    if(el){ el.textContent = msg; el.style.color = bad ? 'var(--danger)' : 'var(--muted)'; }
  }

  async function login(){
    const {email,password} = authValues();
    if(!email || !password) return authMessage('請輸入 Email 與密碼。', true);
    authMessage('登入中…');
    const {error} = await client.auth.signInWithPassword({email,password});
    if(error) return authMessage(error.message, true);
    document.querySelector('#authModal').hidden = true;
  }

  async function signup(){
    const {email,password} = authValues();
    if(!email || password.length < 6) return authMessage('請輸入有效 Email，密碼至少 6 個字元。', true);
    authMessage('建立帳號中…');
    const {data,error} = await client.auth.signUp({email,password});
    if(error) return authMessage(error.message, true);
    if(data.session){
      authMessage('帳號建立完成。');
      document.querySelector('#authModal').hidden = true;
    }else{
      authMessage('註冊成功，請先到信箱完成 Email 驗證，再回來登入。');
    }
  }

  async function logout(){
    await syncNow(true);
    await client.auth.signOut();
    currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  }

  function updateAccountUI(){
    const authBtn = document.querySelector('#authBtn');
    const logoutBtn = document.querySelector('#logoutBtn');
    if(!authBtn || !logoutBtn) return;
    if(currentUser){
      authBtn.textContent = currentUser.email || '已登入';
      authBtn.classList.add('sync-user');
      logoutBtn.hidden = false;
      setCloudStatus('雲端同步中', 'warn');
    } else {
      authBtn.textContent = '登入 / 註冊';
      authBtn.classList.remove('sync-user');
      logoutBtn.hidden = true;
      setCloudStatus('本機模式');
    }
  }

  async function uploadState(s){
    if(!currentUser) return false;
    const payload = s && typeof s === 'object' ? s : localState();
    const {error} = await client.from('user_states').upsert({
      user_id: currentUser.id,
      state: payload,
      updated_at: new Date().toISOString()
    }, {onConflict:'user_id'});
    if(error){
      console.warn('Cloud sync failed:', error);
      setCloudStatus('離線｜本機已保存', 'warn');
      return false;
    }
    lastSyncedLocal = localText();
    setCloudStatus('已同步 ☁', 'ok');
    return true;
  }

  async function reconcile(){
    if(!currentUser) return;
    setCloudStatus('讀取雲端…', 'warn');
    const {data,error} = await client.from('user_states').select('state,updated_at').eq('user_id', currentUser.id).maybeSingle();
    if(error){
      console.warn('Cloud load failed:', error);
      setCloudStatus('離線｜使用本機資料', 'warn');
      return;
    }
    const local = localState();
    if(!data){
      await uploadState(local);
      return;
    }
    const remote = data.state || {};
    const same = JSON.stringify(remote) === JSON.stringify(local);
    if(same){ lastSyncedLocal = localText(); setCloudStatus('已同步 ☁','ok'); return; }

    if(meaningful(local) && meaningful(remote)){
      const useLocal = confirm('偵測到這台裝置與雲端都有跑商資料。\n\n按「確定」：用這台裝置資料覆蓋雲端\n按「取消」：下載雲端資料到這台裝置');
      if(useLocal){ await uploadState(local); return; }
    } else if(meaningful(local) && !meaningful(remote)){
      await uploadState(local);
      return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
    lastSyncedLocal = localStorage.getItem(STORAGE_KEY) || '';
    location.reload();
  }

  async function syncNow(force=false){
    if(!currentUser || syncing) return;
    const text = localText();
    if(!force && text === lastSyncedLocal) return;
    syncing = true;
    await uploadState(localState());
    syncing = false;
  }

  function startWatcher(){
    clearInterval(syncTimer);
    syncTimer = setInterval(() => syncNow(false), 1200);
  }

  async function handleSession(session){
    currentUser = session?.user || null;
    updateAccountUI();
    if(currentUser){
      await reconcile();
      startWatcher();
    }else{
      clearInterval(syncTimer);
    }
  }

  async function init(){
    injectUI();
    const {data} = await client.auth.getSession();
    await handleSession(data.session);
    client.auth.onAuthStateChange((_event,session) => {
      setTimeout(() => handleSession(session), 0);
    });
    window.addEventListener('online', () => syncNow(true));
    window.addEventListener('beforeunload', () => { if(currentUser) syncNow(true); });
  }

  init();
})();