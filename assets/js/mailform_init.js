    window.addEventListener("DOMContentLoaded", function () {
      // ★★ ここをお兄ちゃんの「本番メール送信用 Lambda URL」に差し替え ★★
      const LAMBDA_SUBMIT_URL = "https://YOUR_LAMBDA_URL_HERE/";

      // -----------------------------
      // 1. token をデコード＆検証して hidden / email に流し込む
      // -----------------------------
      function decodeToken(token) {
        try {
          // URL-safe Base64 を普通の Base64 に戻す
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

      const params = new URLSearchParams(window.location.search);
      const rawToken = params.get("token");

      if (!rawToken || rawToken.trim() === "") {
        // token 無し → トップへ
        window.location.replace("index.html");
        return;
      }

      const payload = decodeToken(rawToken);
      if (!payload || typeof payload.exp !== "number") {
        window.location.replace("index.html");
        return;
      }

      // exp チェック
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        console.warn("Token expired");
        window.location.replace("index.html");
        return;
      }

      // フォームに反映
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
      // 2. 送信時に Lambda に JSON で POST
      // -----------------------------
      const form   = document.getElementById("mail-form");
      const result = document.getElementById("result");

      if (!form) return;

      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();

        result.textContent = "送信中です…";

        const formData = new FormData(form);
        const body = {};
        formData.forEach((value, key) => {
          body[key] = value;
        });

        try {
          const res = await fetch(LAMBDA_SUBMIT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          const text = await res.text();

          if (res.ok) {
            result.textContent = "送信しました。ありがとうございました。";
            // メールアドレスは残したいので name / message だけクリア
            form.querySelector('input[name="name"]').value = "";
            form.querySelector('textarea[name="message"]').value = "";
          } else {
            console.error("Lambda error:", text);
            result.textContent = "エラーが発生しました: " + text;
          }
        } catch (err) {
          console.error(err);
          result.textContent = "ネットワークエラーが発生しました。時間をおいて再度お試しください。";
        }
      });
    });