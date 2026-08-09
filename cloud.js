(() => {
  const SUPABASE_URL = 'https://gzsqfvbrvzfcetzjipuc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_L8_nFbp95L5cmVQ5E1uu2g_pfgzDe4E';
  const APP_URL = 'https://xm30703.github.io/mabinogi-life-tool/';
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
        <h3>登入你的跑商資料</h3>
        <div class="small">登入後，跑商進度、庫存與生產目標會跨裝置同步。</div>

        <button class="google-login" id="googleLoginBtn" type="button">
          <span class="google-mark" aria-hidden="true">G</span>
          <span>使用 Google 登入</span>
        </button>

        <div class="auth-divider"><span>或使用 Email</span></div>

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
      .google-login{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #d7dce2;background:#fff;color:#202124;border-radius:10px;padding:10px 14px;font-weight:650}.google-login:hover{background:#f7f8f9}.google-login:disabled{opacity:.65;cursor:wait}.google-mark{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-weight:800;font-size:1rem;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 0 50%,#fbbc05 0 75%,#ea4335 0);color:#fff;text-shadow:0 1px 2px #0005}.auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0 4px;color:var(--muted);font-size:.78rem}.auth-divider:before,.auth-divider:after{content:'';height:1px;background:var(--line);flex:1}
    `;
    document.head.appendChild(style);

    document.querySelector('#authBtn').onclick = () => { modal.hidden = false; };
    document.querySelector('#authClose').onclick = () => { modal.hidden = true; };
    modal.addEventListener('click', e => { if(e.target === modal) modal.hidden = true; });
    document.querySelector('#googleLoginBtn').onclick = loginWithGoogle;
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

  async function loginWithGoogle(){
    const btn = document.querySelector('#googleLoginBtn');
    if(btn) btn.disabled = true;
    authMessage('正在前往 Google 登入…');
    const {error} = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: APP_URL,
        queryParams: {
          access_type: 'online',
          prompt: 'select_account'
        }
      }
    });
    if(error){
      if(btn) btn.disabled = false;
      authMessage(`Google 登入失敗：${error.message}`, true);
    }
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
    const {data,error} = await client.auth.signUp({email,password, options:{emailRedirectTo:APP_URL}});
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

  function providerLabel(provider){
    const labels = {google:'Google',email:'Email',facebook:'Facebook',discord:'Discord',github:'GitHub',apple:'Apple'};
    return labels[provider] || provider || '已驗證帳號';
  }

  function userPresentation(user){
    if(!user) return null;
    const meta = user.user_metadata || {};
    const identityMeta = (user.identities || []).map(i => i?.identity_data || {}).find(x => Object.keys(x).length) || {};
    const provider = user.app_metadata?.provider || user.identities?.[0]?.provider || 'email';
    const email = user.email || meta.email || identityMeta.email || '';
    const avatarUrl = meta.avatar_url || meta.picture || meta.avatar || identityMeta.avatar_url || identityMeta.picture || identityMeta.avatar || '';
    const displayName = meta.full_name || meta.name || meta.user_name || meta.preferred_username || identityMeta.full_name || identityMeta.name || identityMeta.user_name || (email ? email.split('@')[0] : '已登入');
    const initialSource = provider === 'email' ? email : displayName;
    const initial = String(initialSource || email || '?').trim().charAt(0).toUpperCase() || '?';
    return {provider,email,avatarUrl,displayName,initial};
  }

  function updateAccountUI(){
    const authBtn = document.querySelector('#authBtn');
    const logoutBtn = document.querySelector('#logoutBtn');
    if(!authBtn || !logoutBtn) return;
    if(currentUser){
      const p = userPresentation(currentUser);
      authBtn.dataset.loggedIn = '1';
      authBtn.dataset.email = p.email;
      authBtn.dataset.provider = p.provider;
      authBtn.dataset.providerLabel = providerLabel(p.provider);
      authBtn.dataset.displayName = p.displayName;
      authBtn.dataset.avatarUrl = p.avatarUrl;
      authBtn.dataset.initial = p.initial;
      authBtn.textContent = p.email || p.displayName || '已登入';
      authBtn.title = `登入方式：${providerLabel(p.provider)}`;
      authBtn.classList.add('sync-user');
      logoutBtn.hidden = false;
      setCloudStatus('雲端同步中', 'warn');
    } else {
      authBtn.dataset.loggedIn = '0';
      ['email','provider','providerLabel','displayName','avatarUrl','initial','avatarSignature'].forEach(k => delete authBtn.dataset[k]);
      authBtn.textContent = '登入 / 註冊';
      authBtn.removeAttribute('title');
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
      const modal = document.querySelector('#authModal');
      if(modal) modal.hidden = true;
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