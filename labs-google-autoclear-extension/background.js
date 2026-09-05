// Chrome Extension Background Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CLEAR_SITE_DATA") {
    (async () => {
      try {
        // ล้าง cache, storage สำหรับ flow.google.com (ไม่ลบคุกกี้เพื่อรักษาสถานะ Login)
        await chrome.browsingData.remove({
          origins: ["https://flow.google.com"]
        }, {
          cookies: false,
          cache: true,
          serviceWorkers: true,
          indexedDB: true,
          localStorage: true
        });

        console.log("⚡ [Background] Cleared browsingData for https://flow.google.com");

        // รีเฟรชแท็บ flow.google.com ที่เปิดอยู่
        const tabs = await chrome.tabs.query({ url: "https://flow.google.com/*" });
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.reload(tab.id);
          }
        }

        sendResponse({ success: true });
      } catch (err) {
        console.error("❌ [Background] Error clearing site data:", err);
        sendResponse({ success: false, error: err.toString() });
      }
    })();
    return true; // Keep channel open for async response
  }
});
