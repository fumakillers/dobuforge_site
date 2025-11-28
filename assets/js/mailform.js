  window.addEventListener("DOMContentLoaded", function () {
    // ★★ 本番メール送信用 Lambda URL ★★
    const LAMBDA_SUBMIT_URL = "https://tjobihm5engweuexcsohq4cubq0fxxtl.lambda-url.ap-northeast-1.on.aws/";

    // -----------------------------
    // 1. token をデコード＆検証して hidden / email に流し込む
    // -----------------------------
    function decodeToken(token) {
      try {
        // URL-safe Base64 -> 通常 Base64
        let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
        if (b64.length % 4 !== 0) {
          b64 = b64.padEnd(b64.length + (4 - (b64.length % 4)), "=");
        }
        const json = atob(b64);
        return JSON.parse(json);
      } catch (err) {
        console.error("Token decode error:", err);
        return null;
      }
    }

    const params   = new URLSearchParams(window.location.search);
    const rawToken = params.get("token");

    if (!rawToken || rawToken.trim() === "") {
      window.location.replace("index.html");
      return;
    }

    const payload = decodeToken(rawToken);
    if (!payload || typeof payload.exp !== "number") {
      window.location.replace("index.html");
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      console.warn("Token expired");
      window.location.replace("index.html");
      return;
    }

    const emailInput = document.querySelector('input[name="email"]');
    const sigInput   = document.querySelector('input[name="sig"]');
    const tokenInput = document.querySelector('input[name="token"]');

    if (emailInput && payload.email) {
      emailInput.value = payload.email;
      emailInput.readOnly = true;
    }
    if (sigInput && payload.sig) {
      sigInput.value = payload.sig;
    }
    if (tokenInput) {
      tokenInput.value = rawToken;
    }

    // -----------------------------
    // 2. 送信時に Lambda に JSON で POST ＋ ボタン disable / メッセージ表示
    // -----------------------------
    const form    = document.getElementById("mail-form");
    const result  = document.getElementById("result");
    const sendBtn = document.getElementById("sendBtn");

    if (!form) return;

    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();

      if (sendBtn) {
        sendBtn.disabled = true;
      }
      if (result) {
        result.textContent = "送信中です…";
        result.style.color = "#ccc";
      }

      const formData = new FormData(form);
      const body = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });

      try {
        const res  = await fetch(LAMBDA_SUBMIT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const text = await res.text();

        if (res.ok) {
          if (result) {
            result.textContent = "お問い合わせを送信しました。ありがとうございました。";
            result.style.color = "#8f8";
          }
          // メールアドレスは残す。name と message だけクリア
          const nameInput = form.querySelector('input[name="name"]');
          const msgArea   = form.querySelector('textarea[name="message"]');
          if (nameInput) nameInput.value = "";
          if (msgArea) msgArea.value = "";
          // 成功時はボタン disable のまま
        } else {
          console.error("Lambda error:", text);
          if (result) {
            result.textContent = "エラーが発生しました: " + text;
            result.style.color = "#f88";
          }
          if (sendBtn) {
            sendBtn.disabled = false;
          }
        }
      } catch (err) {
        console.error(err);
        if (result) {
          result.textContent = "ネットワークエラーが発生しました。時間をおいて再度お試しください。";
          result.style.color = "#f88";
        }
        if (sendBtn) {
          sendBtn.disabled = false;
        }
      }
    });
  });
