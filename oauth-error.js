(() => {
  const params = new URLSearchParams(window.location.search);
  const error = params.get('error');
  if (!error) return;

  const code = params.get('error_code') || '';
  const description = params.get('error_description') || '登入驗證失敗，請稍後再試。';

  const banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:10000;max-width:min(680px,calc(100vw - 28px));background:#2b1518;color:#ffd9de;border:1px solid #8f3946;border-radius:12px;padding:12px 16px;box-shadow:0 12px 32px #0008;font-size:.9rem;line-height:1.5';
  banner.innerHTML = `<strong>登入失敗</strong><br>${description}${code ? ` <span style="opacity:.7">(${code})</span>` : ''}`;
  document.body.appendChild(banner);

  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, document.title, cleanUrl);
  window.setTimeout(() => banner.remove(), 9000);
})();