(function() {
  'use strict';

  console.log("⚡ [Labs.google Auto-Clear Extension] Content script activated!");

  const errorKeywords = [
    "we noticed some unusual activity",
    "unusual activity",
    "please visit the help center",
    "failed",
    "please wait",
    "try again in",
    "rate limit",
    "quota exceeded",
    "something went wrong"
  ];

  let isProcessing = false;

  async function detectAndClear() {
    if (isProcessing) return;

    // ตรวจสอบว่ามีสวิตช์ปิดการทำงานไว้ใน storage หรือไม่
    const { autoClearEnabled = true } = await chrome.storage.local.get("autoClearEnabled");
    if (!autoClearEnabled) return;

    const bodyText = document.body ? document.body.innerText.toLowerCase() : "";
    let foundError = false;

    for (const keyword of errorKeywords) {
      if (bodyText.includes(keyword)) {
        foundError = true;
        break;
      }
    }

    if (!foundError) return;

    isProcessing = true;
    console.warn("⚠️ [Labs.google Auto-Clear] ตรวจพบการ์ด Fail/นับถอยหลัง! สั่งล้างแคชอัตโนมัติ...");

    // 1. กดปุ่ม ลบการ์ด (🗑️) หรือ Retry (🔄) บนหน้าจอทันทีถ้าพบ
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
      const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
      const text = btn.innerText.toLowerCase();
      if (ariaLabel.includes('delete') || ariaLabel.includes('retry') || text.includes('retry')) {
        try { btn.click(); } catch(e) {}
      }
    });

    // 2. เคลียร์ DOM Storage ฝั่งหน้าเว็บ
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch(e) {}

    if (window.indexedDB && indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        dbs.forEach(db => {
          try { indexedDB.deleteDatabase(db.name); } catch(e){}
        });
      });
    }

    // 3. แสดง Banner แจ้งเตือนสั้นๆ บนหน้าจอ
    showNoticeBanner();

    // 4. ส่งข้อความให้ Background Service Worker ล้าง Cookies
    chrome.runtime.sendMessage({ action: "CLEAR_SITE_DATA" }, (response) => {
      console.log("Response from background:", response);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    });
  }

  function showNoticeBanner() {
    const banner = document.createElement('div');
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
    banner.innerHTML = '⚡ [Extension] ตรวจพบ Fail! ล้างคุกกี้/แคช และรีเฟรชให้อัตโนมัติทันที';
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
