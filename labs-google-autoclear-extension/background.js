// Chrome Extension Background Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CLEAR_SITE_DATA") {
    (async () => {
      try {
        // ล้าง cookies, cache, storage สำหรับ labs.google
        await chrome.browsingData.remove({
          origins: ["https://labs.google"]
        }, {
          cookies: true,
          cache: true,
          serviceWorkers: true,
          indexedDB: true,
          localStorage: true
        });

        console.log("⚡ [Background] Cleared browsingData for https://labs.google");
        sendResponse({ success: true });
      } catch (err) {
        console.error("❌ [Background] Error clearing site data:", err);
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true; // Keep channel open for async response
  }
});
