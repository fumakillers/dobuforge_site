  (function () {
    "use strict";

    const FUNCTION_URL = "https://sho5mhqa234kqae2hpfgebu6zi0fmhbc.lambda-url.ap-northeast-1.on.aws/";

    window.addEventListener("DOMContentLoaded", function () {
      const form = document.querySelector("form");
      if (!form) return;

      const emailInput = form.elements["email"];
      const resultEl = document.getElementById("contact-result");
      const submitBtn = form.querySelector("button[type=submit]");

      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!emailInput || !emailInput.value) {
          if (resultEl) resultEl.textContent = "メールアドレスを入力してください。";
          return;
        }

        // Turnstile のトークンは自動で name="cf-turnstile-response" の input に入る
        const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
        const turnstileToken = tokenInput ? tokenInput.value : "";

        if (!turnstileToken) {
          if (resultEl) {
            resultEl.textContent = "Turnstile の検証が完了していません。数秒待ってから再度お試しください。";
          }
          return;
        }

        const email = emailInput.value.trim();

        // ボタン連打防止
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "送信中...";
        }
        if (resultEl) {
          resultEl.textContent = "";
        }

        try {
          const resp = await fetch(FUNCTION_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              turnstileToken: turnstileToken
            })
          });

          if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            if (resultEl) {
              resultEl.textContent = "エラーが発生しました。（" + resp.status + " " + text + "）";
            }
          } else {
            if (resultEl) {
              resultEl.textContent =
                "入力いただいたメールアドレス宛に、フォームへのURLを送信しました。メールをご確認ください。";
            }
          }
        } catch (err) {
          console.error(err);
          if (resultEl) {
            resultEl.textContent = "通信に失敗しました。少し時間をおいてから再度お試しください。";
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "送信";
          }
          // 1 回使ったら Turnstile をリセットしておくと親切
          if (window.turnstile && typeof window.turnstile.reset === "function") {
            try { window.turnstile.reset(); } catch (_) { /* ignore */ }
          }
        }
      });
    });
  })();
