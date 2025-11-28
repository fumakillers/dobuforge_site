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
            body: JSON.stringify({ email })
          });

          if (!resp.ok) {
            // Lambda は 200 以外のとき text で "Internal Server Error" とか返す
            const text = await resp.text().catch(() => "");
            if (resultEl) {
              resultEl.textContent = "エラーが発生しました。（" + resp.status + " " + text + "）";
            }
          } else {
            if (resultEl) {
              resultEl.textContent =
                "入力いただいたメールアドレス宛に、フォームへのURLを送信しました。メールをご確認ください。";
            }
            // 必要ならメールアドレスを空に
            // emailInput.value = "";
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
        }
      });
    });
  })();