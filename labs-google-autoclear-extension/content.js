(function() {
  'use strict';

  console.log("⚠️ [Labs.google Activity Monitor] Content script activated");

  const errorKeywords = [
    "we noticed some unusual activity",
    "unusual activity",
    "try again in",
    "rate limit",
    "quota exceeded"
  ];

  let lastDetectedSignature = "";

  async function detectAndClear() {
    // ปิดค่าเริ่มต้นไว้ก่อน ผู้ใช้ต้องเปิดตัวตรวจจับเองจาก popup
    const { autoClearEnabled = false } = await chrome.storage.local.get("autoClearEnabled");
    if (!autoClearEnabled) return;

    const bodyText = document.body ? document.body.innerText.toLowerCase() : "";
    let foundKeyword = "";

    for (const keyword of errorKeywords) {
      if (bodyText.includes(keyword)) {
        foundKeyword = keyword;
        break;
      }
    }

    if (!foundKeyword) return;
    const signature = `${location.pathname}:${foundKeyword}`;
    if (signature === lastDetectedSignature) return;
    lastDetectedSignature = signature;

    // แจ้งเตือนอย่างเดียว: ไม่กด Retry/Delete, ไม่ล้าง storage และไม่ reload
    // โดยเฉพาะ Unusual Activity ต้องให้ผู้ใช้ตรวจสอบ ไม่ควรส่งคำขอเดิมซ้ำทันที
    console.warn("⚠️ [Labs.google Monitor] ตรวจพบข้อผิดพลาด:", foundKeyword);
    showNoticeBanner(foundKeyword);
    await chrome.storage.local.set({
      lastDetectedError: { keyword: foundKeyword, url: location.href, detectedAt: Date.now() }
    });
  }

  function showNoticeBanner(keyword) {
    document.getElementById("labs-google-monitor-banner")?.remove();
    const banner = document.createElement('div');
    banner.id = "labs-google-monitor-banner";
    banner.style.position = 'fixed';
    banner.style.top = '15px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.backgroundColor = '#d32f2f';
    banner.style.color = '#ffffff';
    banner.style.padding = '12px 24px';
    banner.style.borderRadius = '8px';
    banner.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
    banner.style.zIndex = '9999999';
    banner.style.fontWeight = 'bold';
    banner.style.fontSize = '16px';
    banner.style.fontFamily = 'sans-serif';
    banner.textContent = `⚠️ ตรวจพบ ${keyword} — หยุดอัตโนมัติไว้ก่อน โปรดตรวจหน้า Flow`;
    document.body.appendChild(banner);
  }

  // ตรวจสอบเป็นระยะทุกๆ 1 วินาที
  setInterval(detectAndClear, 1000);

  // สังเกตการเปลี่ยนแปลงโครงสร้าง DOM
  const observer = new MutationObserver(() => {
    detectAndClear();
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
})();
