import { fetchShowcaseProducts } from "./modules/tiktok-api.js";

/**
 * @description เปิด side panel เมื่อผู้ใช้คลิก icon extension
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
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

/**
 * @description เปิด Google Flow และพยายาม inject prompt ลง textarea/input
 * @param {object} payload - phase, prompt, imageDataUrl
 * @returns {Promise<object>} tab id
 */
async function openGoogleFlow(payload) {
  const tab = await chrome.tabs.create({ url: "https://labs.google/fx/tools/flow", active: true });
  await waitForTabComplete(tab.id);

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [payload.prompt, payload.phase],
    func: injectPromptIntoFlow
  });

  if (!result?.ok) {
    await notify("TikTok Video Creator", "เปิด Google Flow แล้ว แต่ยังหา prompt field ไม่เจอ ให้ paste prompt เองจาก side panel");
  } else {
    await notify("TikTok Video Creator", payload.phase === "image" ? "Phase 1 พร้อมแล้ว ตรวจ prompt แล้วกด Generate" : "Phase 2 พร้อมแล้ว ตรวจ prompt แล้วกด Generate");
  }

  return { tabId: tab.id, injected: Boolean(result?.ok) };
}

/**
 * @description ฟังก์ชันนี้รันในหน้า Google Flow เพื่อใส่ prompt ลง field ที่พบ
 * @param {string} prompt - prompt
 * @param {string} phase - phase
 * @returns {object} result
 */
function injectPromptIntoFlow(prompt, phase) {
  const candidates = [
    ...document.querySelectorAll("textarea"),
    ...document.querySelectorAll("[contenteditable='true']"),
    ...document.querySelectorAll("input[type='text']")
  ];
  const field = candidates.find((node) => {
    const rect = node.getBoundingClientRect();
    return rect.width > 120 && rect.height > 24;
  });

  if (!field) return { ok: false };

  field.focus();
  if ("value" in field) {
    field.value = prompt;
    field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  } else {
    field.textContent = prompt;
    field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
  }

  const helper = document.createElement("div");
  helper.textContent = phase === "image"
    ? "TikTok Video Creator: Phase 1 image prompt inserted. Upload reference image manually if Google Flow asks for it."
    : "TikTok Video Creator: Phase 2 video prompt inserted. Upload approved reference image manually if Google Flow asks for it.";
  helper.style.cssText = "position:fixed;z-index:2147483647;left:16px;bottom:16px;max-width:360px;padding:12px 14px;border-radius:8px;background:#111;color:#fff;border:1px solid #FE2C55;font:14px system-ui";
  document.body.append(helper);
  setTimeout(() => helper.remove(), 10000);

  return { ok: true };
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
