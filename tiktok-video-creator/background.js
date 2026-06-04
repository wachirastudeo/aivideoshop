import { fetchShowcaseProducts } from "./modules/tiktok-api.js";
import { resolveProductUrl } from "./modules/prompt-builder.js";

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
    case "TIKTOK_SEND_DRAFT":        return sendTikTokDraft(message.payload);
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
    needNavigate = true;
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
    videoModel: settings.flow?.videoModel || "veo-3.1-lite",
    imageModel: settings.flow?.imageModel || "nano-banana-pro",
    autoPortrait: settings.flow?.autoPortrait !== false,
    uploadWaitSec: settings.flow?.uploadWaitSec ?? 8,
    imageCount: media.imageCount || 1,
    videoCount: media.videoCount || 1,
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
  const id = await chrome.downloads.download({ url: payload.url, filename: payload.filename, saveAs: false });
  return { downloadId: id };
}

async function postToTikTok(payload) {
  const { tiktokAuth } = await chrome.storage.sync.get("tiktokAuth");
  if (!tiktokAuth?.accessToken) throw new Error("ยังไม่มี Access Token");
  await chrome.storage.local.set({ lastTikTokPostPayload: payload });
  throw new Error("ยังไม่ได้ตั้งค่า endpoint สำหรับโพสต์จริง");
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

const TIKTOK_STUDIO_UPLOAD_URL = "https://www.tiktok.com/tiktokstudio/upload";
const VIDEO_PREP_RETRY_ATTEMPTS = 2;
const VIDEO_PREP_RETRY_DELAY_MS = 60000;

// ─── TikTok Studio: Send draft/post ผ่าน Page UI Automation บนหน้า upload ──────
async function sendTikTokDraft(payload) {
  const { videoUrl, caption = "", hashtags = [] } = payload;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = settings.postDefaults || {};
  const postType = payload.postType || postDefaults.defaultMode || "draft";
  const mode = payload.mode || (postType === "now" || postType === "schedule" ? "post" : "draft");
  const productUrl = resolveProductUrl(payload);
  const finalHashtags = normalizeHashtags(hashtags.length ? hashtags : (postDefaults.hashtags || []));
  assertTikTokPostMetadata({
    caption,
    hashtags: finalHashtags,
    productUrl
  });

  const tabId = await openTikTokStudioUploadTab();

  // 2. ดึงข้อมูลวิดีโอและแปลงเป็น Base64
  await notify("TikTok Automation", "กำลังดาวน์โหลดไฟล์วิดีโอเพื่อเตรียมกรอกหน้าเว็บ...");
  const preparedVideo = await retryVideoPreparation(videoUrl);
  const base64Data = preparedVideo.base64;
  const mimeType = preparedVideo.mimeType || "video/mp4";

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
  
  const dataUrl = `data:${mimeType || "video/mp4"};base64,${base64Data}`;
  const videoPayloadUrl = await transferVideoDataUrl(tabId, dataUrl);
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "TIKTOK_UPLOAD_VIDEO",
    payload: {
      videoUrl: videoPayloadUrl,
      filename: payload.filename || buildTikTokVideoFilename(payload),
      productId: payload.productId || "",
      productUrl,
      productName: payload.productName || "",
      caption,
      hashtags: finalHashtags,
      mode,
      postType,
      scheduleTime: payload.scheduleTime || postDefaults.scheduleTime || "",
      location: payload.location ?? postDefaults.location ?? "",
      privacy: payload.privacy ?? postDefaults.privacy ?? "",
      aiGenerated: true,
      allowComment: payload.allowComment ?? postDefaults.allowComment ?? true,
      allowReuse: payload.allowReuse ?? postDefaults.allowReuse ?? true
    }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "การกรอกและอัปโหลดวิดีโอบนหน้าเว็บล้มเหลว");
  }

  const doneMessage = response.posted
    ? "โพสต์บนหน้าเว็บสำเร็จแล้ว"
    : "บันทึกร่างดราฟต์บนหน้าเว็บสำเร็จแล้ว";
  await notify("TikTok Automation", doneMessage);
  return { ok: true, ...response };
}

async function retryVideoPreparation(videoUrl) {
  let lastError = null;
  for (let attempt = 1; attempt <= VIDEO_PREP_RETRY_ATTEMPTS; attempt += 1) {
    try {
      if (attempt > 1) {
        await notify("TikTok Automation", `ลองเตรียมวิดีโอใหม่รอบ ${attempt}/${VIDEO_PREP_RETRY_ATTEMPTS}`);
      }
      return await prepareVideoBase64ForTikTok(videoUrl);
    } catch (error) {
      lastError = error;
      if (attempt >= VIDEO_PREP_RETRY_ATTEMPTS) break;
      await notify("TikTok Automation", `เตรียมวิดีโอล้มเหลว: ${error.message} — รอ 60 วินาทีแล้วลองใหม่`);
      await sleep(VIDEO_PREP_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

async function prepareVideoBase64ForTikTok(videoUrl) {
  if (videoUrl.startsWith("blob:")) {
    try {
      return await fetchVideoBase64FromFlowTab(videoUrl);
    } catch (error) {
      return recordVideoBase64FromFlowTab(videoUrl, error.message);
    }
  }

  try {
    const videoRes = await fetch(videoUrl, { credentials: "include" });
    if (!videoRes.ok) throw new Error(`HTTP ${videoRes.status}`);
    const videoBlob = await videoRes.blob();
    return {
      base64: await blobToBase64(videoBlob),
      mimeType: videoBlob.type
    };
  } catch (error) {
    try {
      return await fetchVideoBase64FromFlowTab(videoUrl, error.message);
    } catch (flowFetchError) {
      return recordVideoBase64FromFlowTab(videoUrl, flowFetchError.message || error.message);
    }
  }
}

function assertTikTokPostMetadata({ caption = "", hashtags = [], productUrl = "" } = {}) {
  const missing = [];
  if (!String(caption || "").trim()) missing.push("caption");
  if (!normalizeHashtags(hashtags).length) missing.push("hashtags");
  if (!String(productUrl || "").trim()) missing.push("productUrl");
  if (missing.length) {
    throw new Error(`ห้ามโพสต์: ข้อมูลโพสต์ไม่ครบ (${missing.join(", ")})`);
  }
}

async function fetchVideoBase64FromFlowTab(videoUrl, previousError = "") {
  const flowTabs = await queryFlowTabs();
  if (!flowTabs.length) {
    throw new Error(previousError
      ? `ดาวน์โหลดวิดีโอล้มเหลว: ${previousError}`
      : "ตรวจพบ blob URL แต่ไม่พบหน้าเว็บ Google Flow ที่เปิดอยู่เพื่อดึงไฟล์");
  }

  const flowTabId = flowTabs[0].id;
  await ensureFlowContentScript(flowTabId);
  const res = await chrome.tabs.sendMessage(flowTabId, {
    type: "FLOW_FETCH_BLOB_BASE64",
    url: videoUrl
  });

  if (!res?.ok) {
    const detail = res?.error || previousError || "ไม่ทราบสาเหตุ";
    throw new Error("ดาวน์โหลดวิดีโอผ่านหน้า Google Flow ล้มเหลว: " + detail);
  }

  return { base64: res.base64, mimeType: res.mimeType || "video/mp4" };
}

async function recordVideoBase64FromFlowTab(videoUrl, previousError = "") {
  const flowTabs = await queryFlowTabs();
  if (!flowTabs.length) {
    throw new Error(previousError
      ? `บันทึกวิดีโอจากหน้า Google Flow ไม่สำเร็จ: ${previousError}`
      : "ไม่พบหน้าเว็บ Google Flow ที่เปิดอยู่เพื่อบันทึกวิดีโอ");
  }

  const flowTabId = flowTabs[0].id;
  await ensureFlowContentScript(flowTabId);
  const res = await chrome.tabs.sendMessage(flowTabId, {
    type: "FLOW_RECORD_VIDEO_BASE64",
    url: videoUrl
  });

  if (!res?.ok) {
    const detail = res?.error || previousError || "ไม่ทราบสาเหตุ";
    throw new Error("บันทึกวิดีโอผ่านหน้า Google Flow ล้มเหลว: " + detail);
  }

  return { base64: res.base64, mimeType: res.mimeType || "video/webm" };
}

async function transferVideoDataUrl(tabId, dataUrl) {
  const maxChunkSize = 512 * 1024;
  const key = `tiktok-video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const totalChunks = Math.ceil(dataUrl.length / maxChunkSize);

  const init = await chrome.tabs.sendMessage(tabId, {
    type: "CHUNK_INIT",
    payload: { key, totalChunks, totalSize: dataUrl.length }
  });
  if (!init?.ok) throw new Error(init?.error || "เริ่มส่งวิดีโอแบบ chunk ไม่สำเร็จ");

  for (let index = 0; index < totalChunks; index += 1) {
    const data = dataUrl.slice(index * maxChunkSize, (index + 1) * maxChunkSize);
    const pushed = await chrome.tabs.sendMessage(tabId, {
      type: "CHUNK_PUSH",
      payload: { key, index, data }
    });
    if (!pushed?.ok) {
      throw new Error(pushed?.error || `ส่งวิดีโอ chunk ${index + 1}/${totalChunks} ไม่สำเร็จ`);
    }
  }

  const done = await chrome.tabs.sendMessage(tabId, {
    type: "CHUNK_DONE",
    payload: { key }
  });
  if (!done?.ok) throw new Error(done?.error || "ประกอบวิดีโอจาก chunk ไม่สำเร็จ");

  return `chunked:${key}`;
}

function buildTikTokVideoFilename(productInfo = {}) {
  const rawId = productInfo.productId || productInfo.id || productInfo.name || "product";
  const safeId = String(rawId).replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "product";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeId}_${date}_tiktok.mp4`;
}

async function openTikTokStudioUploadTab() {
  const uploadTabs = [
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktokstudio/upload*" })),
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktok-studio/upload*" })),
  ];

  let tab = uploadTabs[0];
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch (_) {}
    return tab.id;
  }

  const studioTabs = [
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktokstudio/*" })),
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktok-studio/*" })),
  ];

  tab = studioTabs[0];
  if (tab) {
    await chrome.tabs.update(tab.id, { url: TIKTOK_STUDIO_UPLOAD_URL, active: true });
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch (_) {}
    await waitForTabComplete(tab.id);
    await sleep(3000);
    return tab.id;
  }

  const newTab = await chrome.tabs.create({ url: TIKTOK_STUDIO_UPLOAD_URL, active: true });
  await waitForTabComplete(newTab.id);
  await sleep(3000);
  return newTab.id;
}

async function notify(title, message) {
  try { await chrome.notifications.create({ type: "basic", iconUrl: "assets/icon128.png", title, message }); } catch { }
}

function normalizeHashtags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  const tags = [];

  for (const rawTag of rawTags) {
    const cleaned = String(rawTag || "").trim().replace(/\s+/g, "").replace(/^#+/, "");
    if (!cleaned) continue;

    const tag = `#${cleaned}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
    if (tags.length >= 5) break;
  }

  return tags;
}
