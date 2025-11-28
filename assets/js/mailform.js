  // Base64URL → 通常の Base64 へ変換してから atob する
  function decodeBase64Url(base64Url) {
    // - と _ を + / に戻す
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // パディング調整
    const pad = base64.length % 4;
    if (pad === 2) base64 += '==';
    else if (pad === 3) base64 += '=';
    else if (pad !== 0) throw new Error('invalid base64url');
    return atob(base64);
  }

  window.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // token が無ければトップに追い返す
    if (!token || token.trim() === '') {
      window.location.replace('index.html');
      return;
    }

    let payload;
    try {
      const json = decodeBase64Url(token.trim());
      payload = JSON.parse(json);

      // 最低限の構造チェック
      if (!payload.email || !payload.exp || !payload.sig) {
        throw new Error('invalid payload shape');
      }
    } catch (e) {
      console.error('トークンの解析に失敗しました:', e);
      window.location.replace('index.html');
      return;
    }

    // exp（秒）→ 現在時刻（ms）と比較
    const nowSec = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
      console.warn('トークンの有効期限切れ:', payload.exp, nowSec);
      window.location.replace('index.html');
      return;
    }

    // email, sig をフォームに反映
    const form = document.querySelector('form');
    if (!form) return;

    const emailInput = form.elements['email'];
    const sigInput = form.elements['sig'];

    if (emailInput) {
      emailInput.value = payload.email;
      emailInput.readOnly = true; // ユーザーは書き換え不可
    }

    if (sigInput) {
      sigInput.value = payload.sig; // 署名は hidden でそのまま送る
    }

    // デバッグしたければここで payload をログ
    console.log('token payload:', payload);
  });