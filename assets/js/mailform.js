// ページ読み込み完了時に実行
window.addEventListener('DOMContentLoaded', function () {
  // URLSearchParams でクエリパラメータを取得
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  // token が取得できない（null または空文字列）場合は index.html にリダイレクト
  if (!token || token.trim() === '') {
    window.location.replace('index.html');
    return; // 以降の処理を中止
  }
  // Base64URL → JSON にデコードする関数
  function decodeToken(t) {
    try {
      // URL-safe Base64 を通常の Base64 に変換
      let base64 = t.replace(/-/g, '+').replace(/_/g, '/');
      // 長さを 4 の倍数にパディング
      if (base64.length % 4 !== 0) {
        base64 = base64.padEnd(base64.length + (4 - (base64.length % 4)), '=');
      }
      const json = atob(base64);
      return JSON.parse(json);
    } catch (e) {
      console.error('Token decode error:', e);
      return;
    }
  }
  const payload = decodeToken(token);
  if (!payload) {
    // トークンが壊れていたら index に返す
    window.location.replace('index.html');
    return;
  }
  // 1. tokenからexpを取得して有効期限が切れていたらindexにredirect
  if (typeof payload.exp !== 'number') {
    // exp が無い or おかしい → 不正扱い
    window.location.replace('index.html');
    return;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSec) {
    console.warn('Token expired');
    window.location.replace('index.html');
    return;
  }
  // 2. tokenからemailを取得してinputのname="email"のvalueに入れる
  if (payload.email) {
    const emailInput = document.querySelector('input[name="email"]');
    if (emailInput) {
      emailInput.value = payload.email;
      // 念のため JS からも readonly を保証
      emailInput.readOnly = true;
    }
  }
  // 3. tokenからsigを取得してinputのname="sig"のvalueに入れる
  if (payload.sig) {
    const sigInput = document.querySelector('input[name="sig"]');
    if (sigInput) {
      sigInput.value = payload.sig;
    }
  }

  // 4. 元の token 自体もサーバ側で検証に使いたい場合は hidden に入れて送る
  const tokenInput = document.querySelector('input[name="token"]');
  if (tokenInput) {
    tokenInput.value = token;
  }

  //console.log('取得したトークン payload:', payload);
});