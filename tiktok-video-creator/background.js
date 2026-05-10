import { fetchShowcaseProducts } from "./modules/tiktok-api.js";

/**
 * @description เปิด side panel เมื่อผู้ใช้คลิก icon extension
 */
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel?.open && tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  await openCreatorTab();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  routeMessage(message, sender)
    .then((payload) => sendResponse({ ok: true, ...payload }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }));
  return true;
});

/**
 * @description route message จาก sidepanel ไปยัง action ที่เกี่ยวข้อง
 * @param {object} message - runtime message
 * @param {object} sender - sender info
 * @returns {Promise<object>} response payload
 */
async function routeMessage(message, sender) {
  switch (message?.type) {
    case "FETCH_PRODUCTS":
      return fetchShowcaseProducts(message.payload);
    case "OPEN_GOOGLE_FLOW":
      return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO":
      return downloadVideo(message.payload);
    case "POST_TO_TIKTOK":
      return postToTikTok(message.payload);
    default:
      throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
  }
}

async function openCreatorTab() {
  const url = chrome.runtime.getURL("sidepanel.html?mode=tab");
  const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("sidepanel.html*") });
  const existing = existingTabs[0];

  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true });
    return { tabId: existing.id };
  }

  const tab = await chrome.tabs.create({ url, active: true });
  return { tabId: tab.id };
}

/**
 * @description เปิด Google Flow และพยายาม inject prompt ลง textarea/input
 * @param {object} payload - phase, prompt, imageDataUrl
 * @returns {Promise<object>} tab id
 */
async function openGoogleFlow(payload) {
  let tab;
  const existingTabs = await chrome.tabs.query({ url: "*://labs.google/fx/tools/flow*" });
  
  if (existingTabs.length > 0) {
    tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    // ถ้าหน้ายังโหลดไม่เสร็จ ให้รอ
    if (tab.status !== "complete") {
      await waitForTabComplete(tab.id);
    }
  } else {
    tab = await chrome.tabs.create({ url: "https://labs.google/fx/tools/flow", active: true });
    await waitForTabComplete(tab.id);
  }

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [payload.prompt, payload.phase, payload.imageDataUrl],
    func: injectPromptIntoFlow
  });

  if (!result?.ok) {
    await notify("TikTok Video Creator", result?.error || "ไม่สามารถ Automation ได้ทั้งหมด กรุณาตรวจสอบแท็บ");
  } else {
    await notify("TikTok Video Creator", "สร้างผลลัพธ์สำเร็จ (Auto-Flow)");
  }

  return { tabId: tab.id, ok: result?.ok, error: result?.error, resultUrl: result?.resultUrl };
}

/**
 * @description ฟังก์ชันแบบ Playwright-style ทำงานฝั่ง Client เพื่ออัพรูป, กดปุ่ม, และรอผลลัพธ์
 */
function injectPromptIntoFlow(prompt, phase, imageDataUrl) {
  return new Promise(async (resolve) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    
    // Playwright-like: waitForElement
    const waitForNewMedia = (type, timeout = 120000) => {
      const existingCount = document.querySelectorAll(type).length;
      return new Promise((res, rej) => {
        const observer = new MutationObserver(() => {
          const items = document.querySelectorAll(type);
          if (items.length > existingCount) {
            observer.disconnect();
            const latest = items[items.length - 1];
            res(latest.src || latest.querySelector("source")?.src);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        setTimeout(() => { observer.disconnect(); rej(new Error("Timeout รอโหลด Media")); }, timeout);
      });
    };

    try {
      const helper = document.createElement("div");
      helper.style.cssText = "position:fixed;z-index:99999;left:16px;bottom:16px;padding:12px;border-radius:8px;background:#111;color:#0f0;border:1px solid #0f0;font:14px system-ui";
      helper.textContent = "🤖 Auto Flow Running... Waiting for page";
      document.body.append(helper);

      // รอเว็บโหลด UI เสร็จก่อน (เพราะเว็บ React มักจะโหลดช้า)
      const waitForUI = () => new Promise(res => {
        const start = Date.now();
        const timer = setInterval(() => {
          const btn = Array.from(document.querySelectorAll("button")).find(b => (b.textContent || "").toLowerCase().includes("new project"));
          const fld = document.querySelector("textarea, [contenteditable='true']");
          if (btn || fld || Date.now() - start > 15000) {
            clearInterval(timer);
            res();
          }
        }, 500);
      });
      await waitForUI();

      // 0. ตรวจสอบว่าอยู่หน้า Dashboard หรือไม่
      const newProjectBtn = Array.from(document.querySelectorAll("button, [role='button']")).find(b => 
        (b.textContent || "").toLowerCase().includes("new project")
      );
      if (newProjectBtn) {
        helper.textContent = "⏳ Clicking 'New project'...";
        newProjectBtn.click();
        
        // รอให้ Textarea โหลดขึ้นมา
        const start = Date.now();
        while (Date.now() - start < 10000) {
          const found = [...document.querySelectorAll("textarea"), ...document.querySelectorAll("[contenteditable='true']")].find(n => n.getBoundingClientRect().width > 50);
          if (found) break;
          await sleep(500);
        }
        await sleep(1000); // เผื่อ animation
      }

      // 0.5 ตั้งค่า Mode (Image/Video) และสัดส่วน 9:16
      const settingsBtn = Array.from(document.querySelectorAll("button[aria-haspopup='menu']")).find(b => 
        b.textContent.includes("Image") || 
        b.textContent.includes("Video") || 
        b.textContent.includes("crop_") || 
        b.textContent.includes("1x") ||
        b.querySelector("i")
      );
      if (settingsBtn) {
        helper.textContent = "⏳ Setting up mode and 9:16 ratio...";
        settingsBtn.click();
        await sleep(500); // รอเมนูเปิด
        
        const tabs = Array.from(document.querySelectorAll("[role='tab']"));
        
        // เลือกโหมดตาม phase
        const modeText = phase === "image" ? "Image" : "Video";
        const modeTab = tabs.find(t => t.textContent.trim() === modeText);
        if (modeTab && modeTab.getAttribute("aria-selected") !== "true") {
          modeTab.click();
          await sleep(300);
        }
        
        // เลือก 9:16
        const ratioTab = tabs.find(t => t.textContent.includes("9:16"));
        if (ratioTab && ratioTab.getAttribute("aria-selected") !== "true") {
          ratioTab.click();
          await sleep(300);
        }
        
        // ปิดเมนู
        if (settingsBtn.getAttribute("aria-expanded") === "true") {
          settingsBtn.click();
          await sleep(500);
        }
      }

      // 1. Upload File ก่อน
      if (imageDataUrl) {
        const fileInput = document.querySelector("input[type='file']");
        if (fileInput) {
          const [header, base64] = imageDataUrl.split(',');
          const mime = header.match(/:(.*?);/)[1] || "image/png";
          const bstr = atob(base64);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          const file = new File([new Blob([u8arr], { type: mime })], "ref.png", { type: mime });
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      await sleep(1000); // รอภาพโหลด

      // 2. Fill Text
      const candidates = [...document.querySelectorAll("textarea"), ...document.querySelectorAll("[contenteditable='true']"), ...document.querySelectorAll("input[type='text']")];
      const field = candidates.find(n => n.getBoundingClientRect().width > 50);
      if (field) {
        field.focus();
        if ("value" in field) {
          field.value = prompt;
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
        } else {
          field.textContent = prompt;
          field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
        }
      }

      await sleep(1500);

      // 3. Click Generate (หรือกด Enter)
      const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
      let generateBtn = buttons.find(b => {
        const text = (b.textContent || "").toLowerCase();
        const hasArrow = b.querySelector("i") && b.querySelector("i").textContent === "arrow_forward";
        // ต้องไม่ถูก disable และ (มีคำที่เกี่ยวข้องซ่อนอยู่ หรือมีไอคอน arrow_forward)
        return !b.disabled && (text.includes("generate") || text.includes("create") || text.includes("run") || text.includes("submit") || hasArrow);
      });

      // ถ้าไม่เจอคำชัดเจน ลองหาปุ่มที่มี svg หรือ arrow_forward
      if (!generateBtn) {
        generateBtn = buttons.find(b => !b.disabled && (b.querySelector("svg") || (b.querySelector("i") && b.querySelector("i").textContent.includes("arrow"))) && b.getBoundingClientRect().width > 20);
      }

      if (generateBtn) {
        helper.textContent = "⏳ Generating... (Waiting up to 2 mins)";
        generateBtn.click();
      } else if (field) {
        // Fallback
        helper.textContent = "⏳ Pressing Enter... (Waiting up to 2 mins)";
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      } else {
        throw new Error("หาปุ่ม Generate ไม่พบ");
      }

      // 4. Wait for output
      const resultUrl = await waitForNewMedia(phase === "image" ? "img" : "video", 120000);
      
      helper.textContent = "✅ Success!";
      await sleep(1000);
      helper.remove();
      
      resolve({ ok: true, resultUrl });
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

/**
 * @description รอ tab โหลดเสร็จ
 * @param {number} tabId - tab id
 * @returns {Promise<void>}
 */
function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const timeout = setTimeout(cleanup, 15000);
    function cleanup() {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") cleanup();
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * @description ดาวน์โหลดไฟล์วิดีโอ
 * @param {object} payload - url, filename
 * @returns {Promise<object>} download id
 */
async function downloadVideo(payload) {
  if (!chrome.downloads?.download) {
    const tab = await chrome.tabs.create({ url: payload.url, active: true });
    return { tabId: tab.id, fallback: "opened-tab" };
  }

  const id = await chrome.downloads.download({
    url: payload.url,
    filename: payload.filename,
    saveAs: true
  });
  return { downloadId: id };
}

/**
 * @description placeholder สำหรับ TikTok Content Posting API
 * @param {object} payload - video/caption/product data
 * @returns {Promise<object>} result
 */
async function postToTikTok(payload) {
  const { tiktokAuth } = await chrome.storage.sync.get("tiktokAuth");
  if (!tiktokAuth?.accessToken) {
    throw new Error("ยังไม่มี TikTok Access Token สำหรับโพสต์วิดีโอ");
  }
  if (!payload.videoUrl || !/^https:\/\//.test(payload.videoUrl)) {
    throw new Error("กรุณาใส่ URL วิดีโอแบบ HTTPS");
  }

  // TikTok Content Posting + Product Link ต้องใช้ endpoint และ approval ของ app จริง
  // จึงเก็บ payload ไว้ให้ตรวจสอบ และคืนข้อความชัดเจนแทนการยิง endpoint ที่ยังไม่ configure
  await chrome.storage.local.set({ lastTikTokPostPayload: payload });
  throw new Error("ยังไม่ได้ตั้งค่า TikTok Content Posting endpoint จริง โปรดเพิ่ม integration หลังได้ app approval");
}

/**
 * @description แสดง notification ถ้า permission พร้อม
 * @param {string} title - title
 * @param {string} message - message
 */
async function notify(title, message) {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon128.png",
      title,
      message
    });
  } catch {
    // Notification เป็น best-effort เท่านั้น
  }
}
