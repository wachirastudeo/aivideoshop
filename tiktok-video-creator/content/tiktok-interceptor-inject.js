/**
 * tiktok-interceptor.js
 * inject ที่ studio.tiktok.com — ดักจับ fetch/XHR เพื่อหา upload API
 * ส่งผลกลับ background ผ่าน postMessage → content script relay
 */

(function () {
  if (window.__ttInterceptorInjected) return;
  window.__ttInterceptorInjected = true;

  const TARGET_PATTERNS = [
    /upload/i,
    /publish/i,
    /post\/create/i,
    /draft/i,
    /video\/init/i,
    /upload_url/i,
  ];

  function shouldCapture(url) {
    return TARGET_PATTERNS.some((p) => p.test(url));
  }

  function notifyBackground(data) {
    window.postMessage({ __ttInterceptor: true, ...data }, "*");
  }

  // ── Intercept fetch ──────────────────────────────
  const _fetch = window.fetch.bind(window);
  window.fetch = async function (input, init = {}) {
    const url = typeof input === "string" ? input : input?.url;
    const method = (init?.method || "GET").toUpperCase();

    const response = await _fetch(input, init);

    if (shouldCapture(url) && method === "POST") {
      try {
        const clone = response.clone();
        const body = await clone.json();
        
        let postData = "";
        if (init?.body) {
          if (typeof init.body === "string") {
            postData = init.body;
          } else if (init.body instanceof URLSearchParams) {
            postData = init.body.toString();
          } else {
            postData = "[Complex/Binary Data]";
          }
        }

        notifyBackground({
          type: "FETCH_CAPTURED",
          url,
          method,
          postData,
          requestHeaders: Object.fromEntries(
            Object.entries(init?.headers || {})
          ),
          responseBody: body,
        });
      } catch (_) {}
    }
    return response;
  };

  // ── Intercept XHR ────────────────────────────────
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__ttUrl = url;
    this.__ttMethod = method?.toUpperCase();
    return _open.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    const self = this;
    if (shouldCapture(this.__ttUrl) && this.__ttMethod === "POST") {
      this.addEventListener("load", () => {
        try {
          const parsed = JSON.parse(this.responseText);
          let postData = "";
          if (typeof body === "string") {
            postData = body;
          } else {
            postData = "[Complex Data]";
          }
          notifyBackground({
            type: "XHR_CAPTURED",
            url: self.__ttUrl,
            method: self.__ttMethod,
            postData,
            responseBody: parsed,
          });
        } catch (_) {}
      });
    }
    return _send.call(this, body);
  };

  console.log("[TT-Interceptor] ✅ Network interceptor active on", location.hostname);
})();
