(() => {
  const SUPABASE_URL = 'https://gzsqfvbrvzfcetzjipuc.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_L8_nFbp95L5cmVQ5E1uu2g_pfgzDe4E';
  const APP_URL = 'https://xm30703.github.io/mabinogi-life-tool/';
  const STORAGE_KEY = 'mabiLifeToolState';
  const META_PREFIX = 'mabiLifeToolCloudMeta:';
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  let currentUser = null;
  let lastSyncedSnapshot = '';
  let syncTimer = null;
  let syncing = false;
  let reconciledUserId = null;
  let reconcilePromise = null;

  function clone(v){ try{return structuredClone(v);}catch{return JSON.parse(JSON.stringify(v||{}));} }
  function localText(){ return localStorage.getItem(STORAGE_KEY) || ''; }
  function localState(){ try{return JSON.parse(localText() || '{}');}catch{return {};} }
  function stable(v){
    if(Array.isArray(v)) return v.map(stable);
    if(v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]));
    return v;
  }

  function normalizeWhole(raw){
    let x = clone(raw && typeof raw === 'object' ? raw : {});
    try{ if(typeof migrateState === 'function') x = migrateState(x); }catch(e){ console.warn('State migration during cloud normalize failed:',e); }
    let base = {};
    try{ if(typeof DEFAULT_STATE !== 'undefined') base = clone(DEFAULT_STATE); }catch{}
    const merged = {
      ...base,...x,
      dailyStatus:{...(x.dailyStatus||{})},
      weeklyStatus:{...(x.weeklyStatus||{})},
      permanentStatus:{...(x.permanentStatus||{})},
      goals:{...(base.goals||{}),...(x.goals||{})},
      inventory:{...(x.inventory||{})}
    };
    try{
      if(typeof recipes !== 'undefined') Object.entries(recipes).forEach(([id,r])=>{
        if(r?.plannerVisible===false) return;
        if(merged.goals[id]===undefined) merged.goals[id]=0;
      });
    }catch{}
    return merged;
  }

  function syncPayload(raw){
    const s = normalizeWhole(raw);
    return {
      dataVersion:s.dataVersion,
      localStateVersion:s.localStateVersion,
      dailyStatus:{...(s.dailyStatus||{})},
      weeklyStatus:{...(s.weeklyStatus||{})},
      permanentStatus:{...(s.permanentStatus||{})},
      goals:{...(s.goals||{})},
      inventory:{...(s.inventory||{})}
    };
  }
  function snapshot(raw){ return JSON.stringify(stable(syncPayload(raw))); }
  function meaningful(raw){
    const s=syncPayload(raw);
    if(['dailyStatus','weeklyStatus','permanentStatus','inventory'].some(k=>Object.keys(s[k]||{}).length>0)) return true;
    return Object.values(s.goals||{}).some(v=>Number(v)>0);
  }
  function metaKey(){ return currentUser ? `${META_PREFIX}${currentUser.id}` : ''; }
  function readMeta(){
    if(!currentUser) return null;
    try{return JSON.parse(localStorage.getItem(metaKey())||'null');}catch{return null;}
  }
  function writeMeta(snap,updatedAt=''){
    if(!currentUser) return;
    try{localStorage.setItem(metaKey(),JSON.stringify({snapshot:snap,updatedAt,at:Date.now()}));}catch{}
  }
  function setCloudStatus(text,cls=''){
    const el=document.querySelector('#cloudStatus');
    if(el){el.textContent=text;el.className=`cloud-status ${cls}`;}
  }

  function injectUI(){
    const toolbar=document.querySelector('.toolbar'); if(!toolbar)return;
    const box=document.createElement('div'); box.className='cloud-account';
    box.innerHTML=`<span id="cloudStatus" class="cloud-status">未登入</span><button class="btn" id="authBtn">登入 / 註冊</button><button class="btn" id="logoutBtn" hidden>登出</button>`;
    toolbar.prepend(box);

    const modal=document.createElement('div'); modal.id='authModal'; modal.className='auth-modal'; modal.hidden=true;
    modal.innerHTML=`<div class="auth-card"><button class="auth-close" id="authClose" aria-label="關閉">×</button><h3>登入你的跑商資料</h3><div class="small">登入後，跑商進度、庫存與生產目標會跨裝置同步。</div><button class="google-login" id="googleLoginBtn" type="button"><span class="google-mark" aria-hidden="true">G</span><span>使用 Google 登入</span></button><div class="auth-divider"><span>或使用 Email</span></div><label>Email<input id="authEmail" type="email" autocomplete="email" placeholder="name@example.com"></label><label>密碼<input id="authPassword" type="password" autocomplete="current-password" placeholder="至少 6 個字元"></label><div class="auth-actions"><button class="btn primary" id="loginBtn">登入</button><button class="btn" id="signupBtn">建立帳號</button></div><div id="authMessage" class="small"></div></div>`;
    document.body.appendChild(modal);

    const style=document.createElement('style');
    style.textContent=`.cloud-account{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.cloud-status{font-size:.8rem;color:var(--muted)}.cloud-status.ok{color:var(--accent)}.cloud-status.warn{color:var(--warn)}.auth-modal{position:fixed;inset:0;background:#0009;z-index:9999;display:grid;place-items:center;padding:18px}.auth-modal[hidden]{display:none}.auth-card{width:min(420px,100%);background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;position:relative;box-shadow:0 20px 60px #0008}.auth-card h3{margin:0 0 6px}.auth-card label{display:block;margin:14px 0 0;color:var(--muted);font-size:.86rem}.auth-card label input{margin-top:5px}.auth-actions{display:flex;gap:8px;margin-top:14px}.auth-close{position:absolute;right:12px;top:9px;border:0;background:transparent;color:var(--muted);font-size:1.7rem}.sync-user{max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.google-login{width:100%;margin-top:18px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #d7dce2;background:#fff;color:#202124;border-radius:10px;padding:10px 14px;font-weight:650}.google-login:hover{background:#f7f8f9}.google-login:disabled{opacity:.65;cursor:wait}.google-mark{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;font-weight:800;font-size:1rem;background:conic-gradient(from -45deg,#4285f4 0 25%,#34a853 0 50%,#fbbc05 0 75%,#ea4335 0);color:#fff;text-shadow:0 1px 2px #0005}.auth-divider{display:flex;align-items:center;gap:10px;margin:18px 0 4px;color:var(--muted);font-size:.78rem}.auth-divider:before,.auth-divider:after{content:'';height:1px;background:var(--line);flex:1}.sync-conflict-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:18px}.sync-conflict-actions button{min-height:46px}@media(max-width:520px){.sync-conflict-actions{grid-template-columns:1fr}}`;
    document.head.appendChild(style);

    document.querySelector('#authBtn').onclick=()=>{modal.hidden=false;};
    document.querySelector('#authClose').onclick=()=>{modal.hidden=true;};
    modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
    document.querySelector('#googleLoginBtn').onclick=loginWithGoogle;
    document.querySelector('#loginBtn').onclick=login;
    document.querySelector('#signupBtn').onclick=signup;
    document.querySelector('#logoutBtn').onclick=logout;
  }

  function authValues(){return {email:document.querySelector('#authEmail').value.trim(),password:document.querySelector('#authPassword').value};}
  function authMessage(msg,bad=false){const el=document.querySelector('#authMessage');if(el){el.textContent=msg;el.style.color=bad?'var(--danger)':'var(--muted)';}}
  async function loginWithGoogle(){
    const btn=document.querySelector('#googleLoginBtn');if(btn)btn.disabled=true;authMessage('正在前往 Google 登入…');
    const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:APP_URL,queryParams:{access_type:'online',prompt:'select_account'}}});
    if(error){if(btn)btn.disabled=false;authMessage(`Google 登入失敗：${error.message}`,true);}
  }
  async function login(){const {email,password}=authValues();if(!email||!password)return authMessage('請輸入 Email 與密碼。',true);authMessage('登入中…');const {error}=await client.auth.signInWithPassword({email,password});if(error)return authMessage(error.message,true);document.querySelector('#authModal').hidden=true;}
  async function signup(){const {email,password}=authValues();if(!email||password.length<6)return authMessage('請輸入有效 Email，密碼至少 6 個字元。',true);authMessage('建立帳號中…');const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:APP_URL}});if(error)return authMessage(error.message,true);if(data.session){authMessage('帳號建立完成。');document.querySelector('#authModal').hidden=true;}else authMessage('註冊成功，請先到信箱完成 Email 驗證，再回來登入。');}
  async function logout(){await syncNow(true);await client.auth.signOut();currentUser=null;reconciledUserId=null;localStorage.removeItem(STORAGE_KEY);location.reload();}

  function providerLabel(provider){const labels={google:'Google',email:'Email',facebook:'Facebook',discord:'Discord',github:'GitHub',apple:'Apple'};return labels[provider]||provider||'已驗證帳號';}
  function userPresentation(user){
    if(!user)return null;const meta=user.user_metadata||{};const identityMeta=(user.identities||[]).map(i=>i?.identity_data||{}).find(x=>Object.keys(x).length)||{};const provider=user.app_metadata?.provider||user.identities?.[0]?.provider||'email';const email=user.email||meta.email||identityMeta.email||'';const avatarUrl=meta.avatar_url||meta.picture||meta.avatar||identityMeta.avatar_url||identityMeta.picture||identityMeta.avatar||'';const displayName=meta.full_name||meta.name||meta.user_name||meta.preferred_username||identityMeta.full_name||identityMeta.name||identityMeta.user_name||(email?email.split('@')[0]:'已登入');const initialSource=provider==='email'?email:displayName;const initial=String(initialSource||email||'?').trim().charAt(0).toUpperCase()||'?';return {provider,email,avatarUrl,displayName,initial};
  }
  function updateAccountUI(){
    const authBtn=document.querySelector('#authBtn'),logoutBtn=document.querySelector('#logoutBtn');if(!authBtn||!logoutBtn)return;
    if(currentUser){const p=userPresentation(currentUser);authBtn.dataset.loggedIn='1';authBtn.dataset.email=p.email;authBtn.dataset.provider=p.provider;authBtn.dataset.providerLabel=providerLabel(p.provider);authBtn.dataset.displayName=p.displayName;authBtn.dataset.avatarUrl=p.avatarUrl;authBtn.dataset.initial=p.initial;authBtn.textContent=p.email||p.displayName||'已登入';authBtn.title=`登入方式：${providerLabel(p.provider)}`;authBtn.classList.add('sync-user');logoutBtn.hidden=false;setCloudStatus('雲端同步中','warn');}
    else{authBtn.dataset.loggedIn='0';['email','provider','providerLabel','displayName','avatarUrl','initial','avatarSignature'].forEach(k=>delete authBtn.dataset[k]);authBtn.textContent='登入 / 註冊';authBtn.removeAttribute('title');authBtn.classList.remove('sync-user');logoutBtn.hidden=true;setCloudStatus('本機模式');}
  }

  async function uploadState(raw){
    if(!currentUser)return false;
    const payload=syncPayload(raw&&typeof raw==='object'?raw:localState());
    const updatedAt=new Date().toISOString();
    const {error}=await client.from('user_states').upsert({user_id:currentUser.id,state:payload,updated_at:updatedAt},{onConflict:'user_id'});
    if(error){console.warn('Cloud sync failed:',error);setCloudStatus('離線｜本機已保存','warn');return false;}
    lastSyncedSnapshot=JSON.stringify(stable(payload));writeMeta(lastSyncedSnapshot,updatedAt);setCloudStatus('已同步 ☁','ok');return true;
  }

  function mergeRemoteIntoLocal(remotePayload){
    const local=normalizeWhole(localState());
    const merged={...local,dailyStatus:{...(remotePayload.dailyStatus||{})},weeklyStatus:{...(remotePayload.weeklyStatus||{})},permanentStatus:{...(remotePayload.permanentStatus||{})},goals:{...(remotePayload.goals||{})},inventory:{...(remotePayload.inventory||{})},dataVersion:remotePayload.dataVersion??local.dataVersion,localStateVersion:remotePayload.localStateVersion??local.localStateVersion};
    localStorage.setItem(STORAGE_KEY,JSON.stringify(merged));
    return merged;
  }

  function askConflict(){
    return new Promise(resolve=>{
      document.querySelector('#syncConflictModal')?.remove();
      const modal=document.createElement('div');modal.id='syncConflictModal';modal.className='auth-modal';
      modal.innerHTML=`<div class="auth-card"><h3>同步資料需要選擇</h3><div class="small" style="line-height:1.65;margin-top:6px">這台裝置與雲端都各有尚未同步的跑商資料。只需要選擇一次要保留哪一份；之後系統會以同步基準自動判斷，不會反覆詢問。</div><div class="sync-conflict-actions"><button class="btn" id="keepLocalBtn" type="button">使用這台裝置資料</button><button class="btn primary" id="keepCloudBtn" type="button">使用雲端資料</button></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector('#keepLocalBtn').onclick=()=>{modal.remove();resolve('local');};
      modal.querySelector('#keepCloudBtn').onclick=()=>{modal.remove();resolve('cloud');};
    });
  }

  async function applyRemote(remotePayload){
    const merged=mergeRemoteIntoLocal(remotePayload);
    await uploadState(merged);
    location.reload();
  }

  async function reconcile(){
    if(!currentUser)return;
    setCloudStatus('讀取雲端…','warn');
    const {data,error}=await client.from('user_states').select('state,updated_at').eq('user_id',currentUser.id).maybeSingle();
    if(error){console.warn('Cloud load failed:',error);setCloudStatus('離線｜使用本機資料','warn');return;}

    const localPayload=syncPayload(localState());
    if(!data){await uploadState(localPayload);return;}
    const remotePayload=syncPayload(data.state||{});
    const localSnap=JSON.stringify(stable(localPayload));
    const remoteSnap=JSON.stringify(stable(remotePayload));

    if(localSnap===remoteSnap){
      lastSyncedSnapshot=localSnap;writeMeta(localSnap,data.updated_at||'');setCloudStatus('已同步 ☁','ok');
      if(JSON.stringify(stable(data.state||{}))!==remoteSnap) await uploadState(localPayload);
      return;
    }

    const localHas=meaningful(localPayload),remoteHas=meaningful(remotePayload);
    if(localHas&&!remoteHas){await uploadState(localPayload);return;}
    if(!localHas&&remoteHas){await applyRemote(remotePayload);return;}
    if(!localHas&&!remoteHas){await uploadState(localPayload);return;}

    const meta=readMeta();
    if(meta?.snapshot){
      if(localSnap===meta.snapshot&&remoteSnap!==meta.snapshot){await applyRemote(remotePayload);return;}
      if(remoteSnap===meta.snapshot&&localSnap!==meta.snapshot){await uploadState(localPayload);return;}
    }

    const choice=await askConflict();
    if(choice==='local') await uploadState(localPayload);
    else await applyRemote(remotePayload);
  }

  async function syncNow(force=false){
    if(!currentUser||syncing)return;
    const snap=snapshot(localState());
    if(!force&&snap===lastSyncedSnapshot)return;
    syncing=true;await uploadState(localState());syncing=false;
  }
  function startWatcher(){clearInterval(syncTimer);syncTimer=setInterval(()=>syncNow(false),1200);}

  async function handleSession(session){
    currentUser=session?.user||null;updateAccountUI();
    if(!currentUser){clearInterval(syncTimer);reconciledUserId=null;lastSyncedSnapshot='';return;}
    const modal=document.querySelector('#authModal');if(modal)modal.hidden=true;
    if(reconciledUserId!==currentUser.id){
      reconciledUserId=currentUser.id;
      reconcilePromise=reconcile().catch(e=>{console.error('Cloud reconcile failed:',e);setCloudStatus('離線｜本機已保存','warn');}).finally(()=>{reconcilePromise=null;});
      await reconcilePromise;
    }else if(reconcilePromise) await reconcilePromise;
    lastSyncedSnapshot=lastSyncedSnapshot||snapshot(localState());startWatcher();
  }

  async function init(){
    injectUI();lastSyncedSnapshot=snapshot(localState());
    const {data}=await client.auth.getSession();await handleSession(data.session);
    client.auth.onAuthStateChange((_event,session)=>{setTimeout(()=>handleSession(session),0);});
    window.addEventListener('online',()=>syncNow(true));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&currentUser)syncNow(false);});
  }
  init();
})();