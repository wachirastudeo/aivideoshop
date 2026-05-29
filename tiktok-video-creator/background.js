import { fetchShowcaseProducts } from "./modules/tiktok-api.js";

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => { });
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

async function routeMessage(message, sender) {
  switch (message?.type) {
    case "FETCH_PRODUCTS":          return fetchShowcaseProducts(message.payload);
    case "OPEN_GOOGLE_FLOW":         return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO":           return downloadVideo(message.payload);
    case "POST_TO_TIKTOK":           return postToTikTok(message.payload);
    case "GET_FLOW_SETTINGS":        return getFlowSettings();
    case "FLOW_INSERT_TEXT":         return insertTextWithDebugger(message.payload, sender);
    case "FLOW_CLICK_POINT":         return clickPointWithDebugger(message.payload, sender);
    case "FLOW_PRESS_KEY":           return pressKeyWithDebugger(message.payload, sender);
    case "FLOW_PING":                return { pong: true };
    case "FLOW_CONTENT_READY":       return { ok: true };
    case "FLOW_STOP":                return stopFlowPipeline();
    case "TIKTOK_LEARN_ENDPOINT":   return learnTikTokEndpoint();
    case "TIKTOK_SEND_DRAFT":        return sendTikTokDraft(message.payload);
    case "TIKTOK_LEARNED_PAYLOAD":   return saveTikTokLearnedPayload(message.payload);
    case "TIKTOK_STUDIO_LOG":        console.log("TikTok Studio:", message.message); return { ok: true };
    case "TIKTOK_DONE":              console.log("TikTok Done:", message.payload); return { ok: true };
    case "PIPELINE_LOG":             console.log("Pipeline:", message.payload); return { ok: true };
    default: throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
  }
}

async function pressKeyWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const key = String(payload?.key || "Enter");
  const code = key === " " ? "Space" : key;
  const windowsVirtualKeyCode = key === " " ? 32 : key === "Enter" ? 13 : 0;
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกดปุ่ม");

  const target = { tabId };
  let attached = false;
  try {
    await chrome.debugger.attach(target, "1.3");
    attached = true;
    await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
      type: "keyDown",
      key,
      code,
      windowsVirtualKeyCode,
      nativeVirtualKeyCode: windowsVirtualKeyCode
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
      type: "keyUp",
      key,
      code,
      windowsVirtualKeyCode,
      nativeVirtualKeyCode: windowsVirtualKeyCode
    });
    return { pressed: true };
  } finally {
    if (attached) {
      await chrome.debugger.detach(target).catch(() => { });
    }
  }
}

async function clickPointWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกดปุ่ม");
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("ตำแหน่งปุ่ม Generate ไม่ถูกต้อง");

  const target = { tabId };
  let attached = false;
  try {
    await chrome.debugger.attach(target, "1.3");
    attached = true;
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      button: "none"
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      button: "left",
      clickCount: 1
    });
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x,
      y,
      button: "left",
      clickCount: 1
    });
    return { clicked: true };
  } finally {
    if (attached) {
      await chrome.debugger.detach(target).catch(() => { });
    }
  }
}

async function insertTextWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const text = String(payload?.text || "");
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกรอก prompt");
  if (!text) return { inserted: false };

  const target = { tabId };
  let attached = false;
  try {
    await chrome.debugger.attach(target, "1.3");
    attached = true;

    if (payload?.clear !== false) {
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "a",
        code: "KeyA",
        windowsVirtualKeyCode: 65,
        nativeVirtualKeyCode: 65,
        modifiers: 4
      });
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "a",
        code: "KeyA",
        windowsVirtualKeyCode: 65,
        nativeVirtualKeyCode: 65,
        modifiers: 4
      });
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyDown",
        key: "Backspace",
        code: "Backspace",
        windowsVirtualKeyCode: 8,
        nativeVirtualKeyCode: 8
      });
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyUp",
        key: "Backspace",
        code: "Backspace",
        windowsVirtualKeyCode: 8,
        nativeVirtualKeyCode: 8
      });
    }

    await chrome.debugger.sendCommand(target, "Input.insertText", { text });
    return { inserted: true };
  } finally {
    if (attached) {
      await chrome.debugger.detach(target).catch(() => { });
    }
  }
}

async function openCreatorTab() {
  const url = chrome.runtime.getURL("sidepanel.html?mode=tab");
  const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("sidepanel.html*") });
  if (existingTabs[0]?.id) {
    await chrome.tabs.update(existingTabs[0].id, { active: true });
    return { tabId: existingTabs[0].id };
  }
  const tab = await chrome.tabs.create({ url, active: true });
  return { tabId: tab.id };
}

async function openGoogleFlow(payload) {
  const FLOW_URL = "https://labs.google/fx/tools/flow";
  const existingTabs = await queryFlowTabs();
  let tab;
  let needNavigate = true;

  if (existingTabs.length > 0) {
    tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch { }
    const url = tab.url || "";
    if (url.endsWith("/tools/flow") || url.endsWith("/tools/flow/")) {
      needNavigate = false;
    }
  } else {
    tab = await chrome.tabs.create({ url: FLOW_URL, active: true });
    needNavigate = false;
  }

  if (needNavigate) {
    await chrome.tabs.update(tab.id, { url: FLOW_URL });
    await waitForTabComplete(tab.id);
  } else {
    const currentTab = await chrome.tabs.get(tab.id);
    if (currentTab.status !== "complete") {
      await waitForTabComplete(tab.id);
    }
  }

  tab = await chrome.tabs.get(tab.id);
  if (tab.url?.includes("accounts.google.com")) {
    throw new Error("Google Flow ต้อง login Google ก่อน แล้วค่อยกดสร้างใหม่");
  }

  // รอ content script พร้อม หรือ inject เองถ้า tab เปิดอยู่ก่อน reload extension
  await ensureFlowContentScript(tab.id);

  // ส่ง message ไปหา content script พร้อมการตั้งค่า
  let result;
  try {
    result = await chrome.tabs.sendMessage(tab.id, {
      type: "FLOW_RUN_PIPELINE",
      payload: {
        phase: payload.phase,
        prompt: payload.prompt,
        imageUrl: payload.imageUrl || "",
        options: payload.options || {}
      }
    });
  } catch (err) {
    throw new Error("ส่งคำสั่งไปยัง Flow ไม่สำเร็จ: " + err.message);
  }

  if (!result?.ok) {
    await notify("TikTok Video Creator", result?.error || "Automation ล้มเหลว");
  } else {
    await notify("TikTok Video Creator", "Flow สำเร็จ!");
  }

  return { 
    tabId: tab.id, 
    ok: result?.ok, 
    error: result?.error, 
    resultUrl: result?.resultUrl || "",
    tileId: result?.tileId || "",
    imgTileId: result?.imgTileId || "",
    imgUrl: result?.imgUrl || ""
  };
}

async function getFlowSettings() {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const media = settings.mediaSettings || {};
  return {
    videoModel: settings.flow?.videoModel || "veo-3.1-fast",
    imageModel: settings.flow?.imageModel || "nano-banana-pro",
    autoPortrait: settings.flow?.autoPortrait !== false,
    uploadWaitSec: settings.flow?.uploadWaitSec ?? 8,
    imageCount: media.imageCount || 4,
    videoCount: media.videoCount || 2,
    videoDuration: media.videoDuration || 8,
    aspectRatio: media.aspectRatio || "9:16",
    autoDownload: media.autoDownload !== false,
    showProgress: media.showProgress !== false
  };
}

async function stopFlowPipeline() {
  const tabs = await queryFlowTabs();
  for (const tab of tabs) {
    chrome.tabs.sendMessage(tab.id, { type: "FLOW_STOP" }).catch(() => { });
  }
  return { ok: true };
}

async function queryFlowTabs() {
  return [
    ...(await chrome.tabs.query({ url: "*://labs.google/fx/tools/flow*" })),
    ...(await chrome.tabs.query({ url: "*://labs.google/fx/*/tools/flow*" })),
    ...(await chrome.tabs.query({ url: "*://labs.google.com/fx/tools/flow*" })),
    ...(await chrome.tabs.query({ url: "*://labs.google.com/fx/*/tools/flow*" }))
  ].filter((candidate, index, list) => candidate.id && list.findIndex((item) => item.id === candidate.id) === index);
}

/**
 * รอให้ content script โหลดเสร็จโดย poll ด้วย ping message
 */
function waitForContentScript(tabId, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(async () => {
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: "FLOW_PING" });
        clearInterval(interval);
        resolve(Boolean(response?.pong));
      } catch {
        if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(false);
        }
      }
    }, 500);
  });
}

async function ensureFlowContentScript(tabId) {
  if (await waitForContentScript(tabId, 2500)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/flow-automation.js"]
    });
  } catch (error) {
    throw new Error("inject content script ไปยัง Google Flow ไม่สำเร็จ: " + error.message);
  }

  const ready = await waitForContentScript(tabId, 8000);
  if (!ready) {
    throw new Error("content script ของ Google Flow ยังไม่พร้อมหลัง inject");
  }
}

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

async function downloadVideo(payload) {
  const id = await chrome.downloads.download({ url: payload.url, filename: payload.filename, saveAs: true });
  return { downloadId: id };
}

async function postToTikTok(payload) {
  const { tiktokAuth } = await chrome.storage.sync.get("tiktokAuth");
  if (!tiktokAuth?.accessToken) throw new Error("ยังไม่มี Access Token");
  await chrome.storage.local.set({ lastTikTokPostPayload: payload });
  throw new Error("ยังไม่ได้ตั้งค่า endpoint สำหรับโพสต์จริง");
}

// ─── TikTok Studio: Learn API endpoint via debugger ────────────────────────
let _learnListener = null;

async function learnTikTokEndpoint() {
  // หา tab TikTok Studio ที่เปิดอยู่
  const tabs = [
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktokstudio/*" })),
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktok-studio/*" })),
  ];
  if (!tabs[0]) throw new Error(
    "กรุณาเปิด https://www.tiktok.com/tiktokstudio/upload ก่อน แล้วกดอีกครั้ง"
  );

  const tabId = tabs[0].id;
  const target = { tabId };
  const capturedRequests = {};

  // Detach ถ้า attach ค้างอยู่
  await chrome.debugger.detach(target).catch(() => {});
  await chrome.debugger.attach(target, "1.3");
  await chrome.debugger.sendCommand(target, "Network.enable", {});

  // Remove listener เก่า
  if (_learnListener) {
    chrome.debugger.onEvent.removeListener(_learnListener);
  }

  _learnListener = async (source, method, params) => {
    if (source.tabId !== tabId) return;

    // จับ request ที่เกี่ยวกับ upload/publish/post/create ที่ส่งไปหา TikTok
    if (method === "Network.requestWillBeSent") {
      const url = params.request?.url || "";
      const isTikTok = url.includes("tiktok.com") || url.includes("tiktokcdn.com");
      const matchesKeyword = /upload|publish|draft|post|create|top\/v1/i.test(url);

      if (isTikTok && matchesKeyword && ["POST", "PUT"].includes(params.request?.method)) {
        capturedRequests[params.requestId] = {
          url,
          method: params.request.method,
          headers: params.request.headers,
          postData: params.request.postData || "",
        };
      }
    }

    // จับ response body
    if (method === "Network.loadingFinished" && capturedRequests[params.requestId]) {
      try {
        let responseBody = {};
        try {
          const bodyResult = await chrome.debugger.sendCommand(target, "Network.getResponseBody", {
            requestId: params.requestId,
          });
          responseBody = JSON.parse(bodyResult.body || "{}");
        } catch (_) {
          // ละเว้นหากดึง body ไม่สำเร็จ หรือไม่ใช่ JSON (เช่น PUT upload chunk)
        }
        
        const req = capturedRequests[params.requestId];
        
        // ลองดึง postData เต็มจาก debugger protocol
        let fullPostData = req.postData;
        try {
          const postDataResult = await chrome.debugger.sendCommand(target, "Network.getRequestPostData", {
            requestId: params.requestId,
          });
          if (postDataResult?.postData) {
            fullPostData = postDataResult.postData;
          }
        } catch (_) {}

        const urlObj = new URL(req.url);
        
        let key = urlObj.pathname;
        const actionParam = urlObj.searchParams.get("Action");
        if (actionParam) {
          key = `${urlObj.pathname}?Action=${actionParam}`;
        }

        // ดึงข้อมูลเดิมจาก storage ก่อน เพื่อนำมารวมกัน ไม่ให้เขียนทับกันเอง
        const stored = await chrome.storage.local.get("tiktokLearnedEndpoints");
        const currentEndpoints = stored.tiktokLearnedEndpoints || {};

        currentEndpoints[key] = {
          url: req.url,
          method: req.method,
          postData: fullPostData,
          sampleResponse: responseBody,
          capturedAt: Date.now(),
        };

        // บันทึกทันทีทุกครั้งที่จับได้
        await chrome.storage.local.set({ tiktokLearnedEndpoints: currentEndpoints });
        await notify("TikTok Endpoint Captured", `จับ API: ${key}`);
      } catch (err) {
        console.error("Error saving captured endpoint:", err);
      }
    }
  };

  chrome.debugger.onEvent.addListener(_learnListener);

  // Detach อัตโนมัติหลัง 10 นาที
  setTimeout(async () => {
    if (_learnListener) chrome.debugger.onEvent.removeListener(_learnListener);
    await chrome.debugger.detach(target).catch(() => {});
    _learnListener = null;
    await notify("TikTok Interceptor", "หยุดดักจับ API แล้ว (ครบ 10 นาที)");
  }, 600_000);

  return { ok: true, watching: tabId, message: "กำลังดักจับ API — ไปอัปโหลดวิดีโอบน TikTok Studio ได้เลย" };
}

// ─── TikTok Studio: Send draft (ยิงตรงเหมือน fetchShowcaseProducts) ────────
// Helper แปลง Blob เป็น Base64 ใน Service Worker (ปลอดภัยจาก Call Stack Limit)
async function blobToBase64(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const len = bytes.byteLength;
  const chunk_size = 16000;
  for (let i = 0; i < len; i += chunk_size) {
    const chunk = bytes.subarray(i, Math.min(i + chunk_size, len));
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── TikTok Studio: Send draft (ผ่าน Page UI Automation หรือ Direct API) ──────
async function sendTikTokDraft(payload) {
  const { videoUrl, caption = "", hashtags = [] } = payload;

  // 1. หาหรือเปิด Tab TikTok Studio Upload
  let tabs = [
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktokstudio/*" })),
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktok-studio/*" })),
  ];
  
  let tabId;
  if (tabs[0]) {
    tabId = tabs[0].id;
    await chrome.tabs.update(tabId, { active: true });
    try {
      await chrome.windows.update(tabs[0].windowId, { focused: true });
    } catch (_) {}
  } else {
    const newTab = await chrome.tabs.create({ url: "https://www.tiktok.com/tiktokstudio/upload", active: true });
    tabId = newTab.id;
    await waitForTabComplete(tabId);
    await sleep(3000); // รอให้หน้าเว็บเซตอัพตัวสักครู่
  }

  // 2. ดึงข้อมูลวิดีโอและแปลงเป็น Base64
  await notify("TikTok Automation", "กำลังดาวน์โหลดไฟล์วิดีโอเพื่อเตรียมกรอกหน้าเว็บ...");
  let base64Data = "";
  let mimeType = "video/mp4";

  if (videoUrl.startsWith("blob:")) {
    // หา Tab Google Flow เพื่อให้ช่วยดาวน์โหลด blob url
    const flowTabs = await queryFlowTabs();
    if (flowTabs.length > 0) {
      const flowTabId = flowTabs[0].id;
      // ให้แน่ใจว่า content script พร้อมในหน้า Google Flow
      await ensureFlowContentScript(flowTabId);
      const res = await chrome.tabs.sendMessage(flowTabId, {
        type: "FLOW_FETCH_BLOB_BASE64",
        url: videoUrl
      });
      if (res?.ok) {
        base64Data = res.base64;
        mimeType = res.mimeType || mimeType;
      } else {
        throw new Error("ดาวน์โหลด blob วิดีโอผ่านหน้า Google Flow ล้มเหลว: " + (res?.error || "ไม่ทราบสาเหตุ"));
      }
    } else {
      throw new Error("ตรวจพบ blob URL แต่ไม่พบหน้าเว็บ Google Flow ที่เปิดอยู่เพื่อดึงไฟล์");
    }
  } else {
    // ดึงตรงผ่าน background
    const videoRes = await fetch(videoUrl, { credentials: "omit" });
    if (!videoRes.ok) throw new Error(`ดาวน์โหลดวิดีโอล้มเหลว: ${videoRes.status}`);
    const videoBlob = await videoRes.blob();
    base64Data = await blobToBase64(videoBlob);
    mimeType = videoBlob.type;
  }

  // 3. ตรวจสอบและ Inject Content Script สำหรับควบคุมหน้าเว็บ
  try {
    await chrome.tabs.sendMessage(tabId, { type: "TIKTOK_STUDIO_PING" });
  } catch (_) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content/tiktok-studio-automation.js"]
    });
    await sleep(500);
  }

  // 4. ส่งข้อมูลไปให้ Content Script ดำเนินการอัปโหลดและกรอกรายละเอียด
  await notify("TikTok Automation", "กำลังเริ่มขั้นตอนอัปโหลดและกรอกข้อมูลอัตโนมัติ...");
  
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "TIKTOK_UPLOAD_DRAFT",
    payload: {
      videoBlob: {
        data: base64Data,
        mimeType: mimeType,
        filename: "video.mp4"
      },
      caption,
      hashtags
    }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "การกรอกและอัปโหลดวิดีโอบนหน้าเว็บล้มเหลว");
  }

  await notify("TikTok Automation", "บันทึกร่างดราฟต์บนหน้าเว็บสำเร็จแล้ว! 🎉");
  return { ok: true, drafted: true };
}

async function notify(title, message) {
  try { await chrome.notifications.create({ type: "basic", iconUrl: "assets/icon128.png", title, message }); } catch { }
}

async function saveTikTokLearnedPayload(payload) {
  const { url, method, postData, responseBody } = payload;
  try {
    const urlObj = new URL(url, "https://www.tiktok.com");
    let key = urlObj.pathname;
    const actionParam = urlObj.searchParams.get("Action");
    if (actionParam) {
      key = `${urlObj.pathname}?Action=${actionParam}`;
    }

    const stored = await chrome.storage.local.get("tiktokLearnedEndpoints");
    const currentEndpoints = stored.tiktokLearnedEndpoints || {};

    currentEndpoints[key] = {
      url: urlObj.href,
      method,
      postData,
      sampleResponse: responseBody,
      capturedAt: Date.now(),
    };

    await chrome.storage.local.set({ tiktokLearnedEndpoints: currentEndpoints });
    await notify("TikTok Endpoint Captured", `ดักจับ API สำเร็จ: ${key}`);
    return { ok: true };
  } catch (err) {
    console.error("Error saving captured stealth endpoint:", err);
    return { ok: false, error: err.message };
  }
}
