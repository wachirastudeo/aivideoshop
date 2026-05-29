/**
 * tiktok-interceptor-receiver.js
 * Content script รันใน ISOLATED world
 * รับข้อความจากการดักจับในหน้าเว็บหลัก (MAIN world) และส่งไป background.js
 */

window.addEventListener("message", (event) => {
  if (event.data && event.data.__ttInterceptor) {
    const { type, url, method, postData, responseBody } = event.data;
    chrome.runtime.sendMessage({
      type: "TIKTOK_LEARNED_PAYLOAD",
      payload: { url, method, postData, responseBody }
    }).catch(() => {});
  }
});
