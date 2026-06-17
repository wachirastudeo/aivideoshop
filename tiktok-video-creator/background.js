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
    case "PULL_SHOPEE_PRODUCTS":     return pullShopeeProducts(message.payload);
    case "SHOPEE_CLICK_POINT":       return clickPointWithDebugger(message.payload, sender);
    case "SHOPEE_FETCH_IMAGES":      return fetchShopeeImages(message.payload);
    case "SHOPEE_CLOSE_SCRAPE_TAB":  return closeShopeeScrapeTab();
    case "OPEN_GOOGLE_FLOW":         return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO":           return downloadVideo(message.payload);
    case "POST_TO_TIKTOK":           return postToTikTok(message.payload);
    case "GET_FLOW_SETTINGS":        return getFlowSettings();
    case "FLOW_INSERT_TEXT":         return insertTextWithDebugger(message.payload, sender);
    case "FLOW_CLICK_POINT":         return clickPointWithDebugger(message.payload, sender);
    case "FLOW_DEBUGGER_DETACH":     return detachDebuggerTab(sender?.tab?.id);
    case "FLOW_PING":                return { pong: true };
    case "FLOW_CONTENT_READY":       return { ok: true };
    case "FLOW_PIPELINE_DONE":       return handleFlowPipelineDone(message.payload);
    case "FLOW_STOP":                return stopFlowPipeline();
    case "TIKTOK_STOP":              return stopTikTokStudioPipeline();
    case "TIKTOK_SEND_DRAFT":        return sendTikTokDraft(message.payload);
    case "TIKTOK_STUDIO_LOG":        console.log("TikTok Studio:", message.message); return { ok: true };
    case "TIKTOK_DONE":              return handleTikTokDone(message.payload);
    case "PIPELINE_LOG":             console.log("Pipeline:", message.payload); return { ok: true };
    default: throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
  }
}

// เก็บ tab ที่ debugger attach ค้างไว้ — ไม่ detach ทันทีหลังแต่ละ action
// เพราะ infobar "extension started debugging" ดันหน้าลง ถ้า detach แล้ว attach ใหม่
// พิกัดที่วัดไว้ก่อนหน้าจะเพี้ยน ทำให้คลิก Generate พลาดตำแหน่ง
const attachedDebuggerTabs = new Set();
let flowStopVersion = 0;
let tiktokStopVersion = 0;

async function ensureDebuggerAttached(tabId) {
  if (attachedDebuggerTabs.has(tabId)) return;
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
  } catch (error) {
    // SW อาจ restart แล้ว Set หาย แต่ debugger ยัง attach อยู่จริง — ถือว่าพร้อมใช้งาน
    if (!/already attached/i.test(error?.message || "")) throw error;
  }
  attachedDebuggerTabs.add(tabId);
}

async function detachDebuggerTab(tabId) {
  if (tabId == null || !attachedDebuggerTabs.has(tabId)) return { detached: false };
  attachedDebuggerTabs.delete(tabId);
  await chrome.debugger.detach({ tabId }).catch(() => { });
  return { detached: true };
}

// detach อัตโนมัติถ้า tab ปิด หรือ debugger หลุด
chrome.debugger.onDetach?.addListener((source) => {
  if (source?.tabId != null) attachedDebuggerTabs.delete(source.tabId);
});

async function clickPointWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกดปุ่ม");
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("ตำแหน่งปุ่ม Generate ไม่ถูกต้อง");
  }

  const target = { tabId };
  await ensureDebuggerAttached(tabId);
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
    buttons: 1,
    clickCount: 1
  });
  await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1
  });
  return { clicked: true };
}

async function insertTextWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const text = String(payload?.text || "");
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกรอก prompt");
  if (!text) return { inserted: false };

  const target = { tabId };
  try {
    await ensureDebuggerAttached(tabId);

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
    return { inserted: true, method: "Input.insertText" };
  } catch (error) {
    await detachDebuggerTab(tabId);
    throw error;
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
  const runVersion = flowStopVersion;
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
    return {
      ok: false,
      code: "FLOW_LOGIN_REQUIRED",
      error: "Google Flow ต้อง login Google ก่อน แล้วระบบจะทำงานต่ออัตโนมัติ"
    };
  }

  // รอ content script พร้อม หรือ inject เองถ้า tab เปิดอยู่ก่อน reload extension
  await ensureFlowContentScript(tab.id);
  // Every product job owns a separate Flow project. Keep this invariant here
  // even if callers or navigation behavior change later.
  await prepareFlowProject(tab.id, { forceNew: true });
  await ensureFlowContentScript(tab.id);
  assertRunNotStopped(runVersion, flowStopVersion);

  const jobId = String(payload.jobId || "");
  if (!jobId) throw new Error("ไม่พบ Flow job ID");

  // Start the long-running work in the content script and acknowledge it
  // immediately. Keeping this message channel open across generation causes
  // Chrome to close it after several minutes.
  let started;
  try {
    started = await chrome.tabs.sendMessage(tab.id, {
      type: "FLOW_RUN_PIPELINE",
      jobId,
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

  if (!started?.accepted) {
    throw new Error(started?.error || "Google Flow ไม่รับคำสั่งเริ่มงาน");
  }
  if (runVersion !== flowStopVersion) {
    await chrome.tabs.sendMessage(tab.id, { type: "FLOW_STOP" }).catch(() => {});
    throw createBackgroundStopError();
  }

  return { tabId: tab.id, jobId, started: true };
}

async function handleFlowPipelineDone(payload = {}) {
  if (payload.result?.ok) {
    await notify("TikTok Video Creator", "Flow สำเร็จ!");
  } else {
    await notify("TikTok Video Creator", payload.result?.error || "Automation ล้มเหลว");
  }
  return { received: true };
}

async function prepareFlowProject(tabId, { forceNew = false } = {}) {
  let current = await chrome.tabs.get(tabId);
  if (forceNew && isFlowProjectUrl(current.url || "")) {
    await chrome.tabs.update(tabId, { url: "https://labs.google/fx/tools/flow" });
    await waitForTabComplete(tabId);
    await ensureFlowContentScript(tabId);
    current = await chrome.tabs.get(tabId);
  }
  if (isFlowProjectUrl(current.url || "")) return;

  const response = await chrome.tabs.sendMessage(tabId, { type: "FLOW_PREPARE_PROJECT" });
  if (!response?.accepted) {
    throw new Error(response?.error || "สั่งเปิดโปรเจกต์ Google Flow ไม่สำเร็จ");
  }

  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.url?.includes("accounts.google.com")) {
      const error = new Error("Google Flow ต้อง login Google ก่อน แล้วระบบจะทำงานต่ออัตโนมัติ");
      error.code = "FLOW_LOGIN_REQUIRED";
      throw error;
    }
    if (isFlowProjectUrl(tab.url || "") && tab.status === "complete") return;
    await delay(500);
  }

  throw new Error("รอหน้า project ของ Google Flow หมดเวลา");
}

function isFlowProjectUrl(url = "") {
  return /\/fx(?:\/[a-z]{2})?\/tools\/flow\/project/i.test(url);
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
  flowStopVersion += 1;
  const tabs = await queryFlowTabs();
  await Promise.allSettled(tabs.map(async (tab) => {
    await chrome.tabs.sendMessage(tab.id, { type: "FLOW_STOP" });
    await detachDebuggerTab(tab.id);
  }));
  return { ok: true, stoppedTabs: tabs.length };
}

async function stopTikTokStudioPipeline() {
  tiktokStopVersion += 1;
  const tabs = [
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktokstudio/*" })),
    ...(await chrome.tabs.query({ url: "https://www.tiktok.com/tiktok-studio/*" })),
  ];
  await Promise.allSettled(
    tabs.map((tab) => chrome.tabs.sendMessage(tab.id, { type: "TIKTOK_STOP" }))
  );
  return { ok: true, stoppedTabs: tabs.length };
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

const SHOPEE_OFFER_URL = "https://affiliate.shopee.co.th/offer/product_offer";

// แท็บที่ใช้เปิดหน้าสินค้าจริงทีละลิงก์เพื่อดึง gallery (reuse ตัวเดียว)
let shopeeScrapeTabId = null;

async function closeShopeeScrapeTab() {
  if (shopeeScrapeTabId != null) {
    try { await chrome.tabs.remove(shopeeScrapeTabId); } catch { }
    shopeeScrapeTabId = null;
  }
  return { closed: true };
}

// เปิดลิงก์สินค้าจริง 1 ลิงก์ แล้วดึงรูปทั้งหมด (gallery)
// ถ้า Shopee เด้งหน้า anti-bot/verify → คืน blocked:true (ไม่ข้าม)
async function fetchShopeeImages({ productUrl } = {}) {
  if (!/^https:\/\/(?:[\w-]+\.)?shopee\.co\.th\//.test(productUrl || "")) {
    return { images: [], error: "ลิงก์สินค้าไม่ถูกต้อง" };
  }

  let tab = null;
  if (shopeeScrapeTabId != null) {
    try { tab = await chrome.tabs.get(shopeeScrapeTabId); } catch { shopeeScrapeTabId = null; }
  }
  if (tab) {
    await chrome.tabs.update(shopeeScrapeTabId, { url: productUrl });
  } else {
    // active:true เพื่อให้ผู้ใช้เห็น/กดผ่าน captcha ของ Shopee เองได้ถ้าโดนกัน
    tab = await chrome.tabs.create({ url: productUrl, active: true });
    shopeeScrapeTabId = tab.id;
  }
  await waitForTabComplete(shopeeScrapeTabId);
  await delay(2000); // รอ gallery render

  let result;
  try {
    [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: shopeeScrapeTabId },
      func: scrapeShopeeGallery
    });
  } catch (error) {
    return { images: [], error: "อ่านหน้าสินค้าไม่สำเร็จ: " + error.message };
  }
  return result || { images: [] };
}

// รันในหน้าสินค้า shopee.co.th — เก็บ URL รูปทั้งหมดจาก gallery
function scrapeShopeeGallery() {
  if (/verify\/traffic|anti_bot|\/captcha/i.test(location.href)) {
    return { images: [], blocked: true };
  }
  const set = new Set();
  const norm = (s) => {
    if (!s) return "";
    if (s.startsWith("//")) s = "https:" + s;
    return s.split("@")[0].split("_tn")[0]; // ตัด suffix resize/thumbnail → รูปเต็ม
  };
  // 1) รูปจาก <img> ที่อยู่บน CDN ของ Shopee
  document.querySelectorAll("img").forEach((img) => {
    const s = img.currentSrc || img.src || img.getAttribute("data-src") || "";
    if (/susercontent\.com\//.test(s) && !/icon|logo|label|rating/i.test(s)) set.add(norm(s));
  });
  // 2) background-image (gallery thumbnails บางตัวเป็น div bg)
  document.querySelectorAll('[style*="susercontent"]').forEach((el) => {
    const m = (el.getAttribute("style") || "").match(/url\(["']?([^"')]+susercontent[^"')]+)["']?\)/);
    if (m) set.add(norm(m[1]));
  });
  const images = [...set].filter((u) => u && u.length > 30).slice(0, 9);
  return { images, blocked: false };
}

async function pullShopeeProducts({ keyword, count, mode, minCommission } = {}) {
  if (!keyword) throw new Error("ไม่มีคำค้นหา");
  const want = Math.max(1, parseInt(count, 10) || 1);
  const collect = mode === "collect";
  const minComm = Math.max(0, Number(minCommission) || 0);

  const existing = await chrome.tabs.query({ url: "https://affiliate.shopee.co.th/*" });
  let tab = existing[0];
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true, url: SHOPEE_OFFER_URL });
    try { await chrome.windows.update(tab.windowId, { focused: true }); } catch { }
  } else {
    tab = await chrome.tabs.create({ url: SHOPEE_OFFER_URL, active: true });
  }
  await waitForTabComplete(tab.id);

  tab = await chrome.tabs.get(tab.id);
  if (/\/login|\/seller\/login|account.*login/i.test(tab.url || "")) {
    throw new Error("ยังไม่ได้ล็อกอิน Shopee Affiliate — ล็อกอินในแท็บที่เปิดแล้วลองใหม่");
  }

  await ensureShopeeContentScript(tab.id);

  // โหมด collect (ดึงเข้าแอป) แค่ติ๊ก+อ่าน DOM ไม่ต้อง trusted click
  if (collect) {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "SHOPEE_RUN", keyword, count: want, mode: "collect", minCommission: minComm });
    if (!result?.ok) throw new Error(result?.error || "ดึงสินค้า Shopee ไม่สำเร็จ");
    return { ticked: result.ticked, capped: result.capped, products: result.products || [] };
  }

  // โหมด export: ปุ่ม "เอา ลิงก์" ไม่ยอม generate/download จาก synthetic click
  // ต้องเป็น trusted click ผ่าน chrome.debugger (เหมือนปุ่ม Generate ของ Flow)
  // attach ก่อนให้ infobar "extension started debugging" ดันหน้าลงให้เสร็จ
  // แล้วค่อยให้ content script วัดพิกัดปุ่ม — พิกัดจะตรงกับตอน debugger click
  await ensureDebuggerAttached(tab.id);
  await delay(700);

  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "SHOPEE_RUN", keyword, count: want, mode, minCommission: minComm });
    if (!result?.ok) throw new Error(result?.error || "ดึงสินค้า Shopee ไม่สำเร็จ");
    return { ticked: result.ticked, capped: result.capped, products: result.products || [] };
  } finally {
    await detachDebuggerTab(tab.id);
  }
}

async function ensureShopeeContentScript(tabId) {
  if (await waitForShopeeReady(tabId, 2500)) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content/shopee-affiliate.js"] });
  } catch (error) {
    throw new Error("inject content script ไปยัง Shopee ไม่สำเร็จ: " + error.message);
  }
  const ready = await waitForShopeeReady(tabId, 8000);
  if (!ready) throw new Error("content script ของ Shopee ยังไม่พร้อมหลัง inject");
}

function waitForShopeeReady(tabId, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const interval = setInterval(async () => {
      try {
        const response = await chrome.tabs.sendMessage(tabId, { type: "SHOPEE_PING" });
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadVideo(payload) {
  const preparedVideo = await prepareVideoBase64ForTikTok(payload.url);
  const mimeType = preparedVideo.mimeType || "video/mp4";
  const dataUrl = `data:${mimeType};base64,${preparedVideo.base64}`;
  const downloadUrl = /^https:|^data:/i.test(payload.url || "") ? payload.url : dataUrl;
  try {
    const id = await chrome.downloads.download({ url: downloadUrl, filename: payload.filename, saveAs: false });
    return { downloadId: id, videoUrl: dataUrl, mimeType };
  } catch (error) {
    return { downloadId: null, downloadError: error.message, videoUrl: dataUrl, mimeType };
  }
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
  const runVersion = tiktokStopVersion;
  const { videoUrl, caption = "", hashtags = [] } = payload;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = settings.postDefaults || {};
  const postType = payload.postType || postDefaults.defaultMode || "draft";
  const mode = payload.mode || (postType === "now" || postType === "schedule" ? "post" : "draft");
  const productUrl = resolveProductUrl(payload);
  const finalHashtags = normalizeHashtags(hashtags.length ? hashtags : (postDefaults.hashtags || []));
  if (mode === "post") {
    assertTikTokPostMetadata({
      caption,
      hashtags: finalHashtags,
      productUrl
    });
  }

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
  assertRunNotStopped(runVersion, tiktokStopVersion);
  const completionMonitor = monitorTikTokSubmission(tabId, {
    jobId: payload.jobId || "",
    mode
  });
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
      allowReuse: payload.allowReuse ?? postDefaults.allowReuse ?? true,
      jobId: payload.jobId || ""
    }
  });

  if (!response?.ok) {
    completionMonitor.cancel();
    throw new Error(response?.error || "การกรอกและอัปโหลดวิดีโอบนหน้าเว็บล้มเหลว");
  }
  if (runVersion !== tiktokStopVersion) {
    completionMonitor.cancel();
    await chrome.tabs.sendMessage(tabId, { type: "TIKTOK_STOP" }).catch(() => {});
    throw createBackgroundStopError();
  }

  // content รัน pipeline เบื้องหลังและตอบ started ทันที — ผลจริงจะมาทาง TIKTOK_DONE
  await notify("TikTok Automation", "เริ่มอัปโหลด/กรอกข้อมูลบนหน้า TikTok แล้ว ดูความคืบหน้าที่แท็บ TikTok");
  return { ok: true, started: true };
}

function monitorTikTokSubmission(tabId, { jobId = "", mode = "post" } = {}) {
  let finished = false;
  let timer = null;
  const storageKey = jobId ? `tiktokJob:${jobId}` : "";
  const cleanup = () => {
    if (finished) return;
    finished = true;
    chrome.tabs.onUpdated.removeListener(onUpdated);
    if (timer) clearTimeout(timer);
  };
  const complete = async (url) => {
    if (finished || !storageKey) return;
    cleanup();
    await chrome.storage.local.set({
      [storageKey]: {
        success: true,
        jobId,
        posted: mode === "post",
        drafted: mode === "draft",
        mode,
        completionUrl: url,
        completedAt: new Date().toISOString()
      }
    });
  };
  const onUpdated = (updatedTabId, changeInfo, tab) => {
    if (updatedTabId !== tabId) return;
    const url = changeInfo.url || tab?.url || "";
    if (/\/tiktokstudio\/content(?:[?#]|$)/i.test(url)) {
      complete(url).catch(() => {});
    }
  };
  chrome.tabs.onUpdated.addListener(onUpdated);
  timer = setTimeout(cleanup, 6 * 60 * 1000);
  return { cancel: cleanup };
}

function assertRunNotStopped(runVersion, currentVersion) {
  if (runVersion === currentVersion) return;
  throw createBackgroundStopError();
}

function createBackgroundStopError() {
  const error = new Error("หยุดทำงานแล้ว");
  error.code = "STOP_REQUESTED";
  return error;
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
  if (videoUrl.startsWith("data:")) {
    const [meta, base64] = videoUrl.split(",");
    if (!base64) throw new Error("invalid data url");
    const mimeType = meta.match(/data:(.*?);base64/i)?.[1] || "video/mp4";
    return { base64, mimeType };
  }

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

async function handleTikTokDone(payload = {}) {
  console.log("TikTok Done:", payload);
  if (payload.jobId) {
    await chrome.storage.local.set({ [`tiktokJob:${payload.jobId}`]: payload });
  }
  if (payload.stopped) {
    await notify("TikTok Automation", "หยุดการอัปโหลด TikTok แล้ว");
    return { ok: true };
  }
  if (payload.success) {
    const msg = payload.posted
      ? "โพสต์ TikTok สำเร็จแล้ว ✅"
      : (payload.fallback ? `บันทึกร่างแทน (${payload.reason || "บางขั้นตอนไม่สำเร็จ"})` : "บันทึกร่าง TikTok สำเร็จแล้ว ✅");
    await notify("TikTok Automation", msg);
  } else {
    await notify("TikTok Automation", "ล้มเหลว: " + (payload.error || "ไม่ทราบสาเหตุ"));
  }
  return { ok: true };
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
