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
    case "SHOPEE_CLICK_POINT":       return clickPointWithDebugger(message.payload, sender, { detachAfter: true });
    case "SHOPEE_FETCH_IMAGES":      return fetchShopeeImages(message.payload);
    case "SHOPEE_CLOSE_SCRAPE_TAB":  return closeShopeeScrapeTab();
    case "OPEN_GOOGLE_FLOW":         return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO":           return downloadVideo(message.payload);
    case "DOWNLOAD_FILE":            return downloadFile(message.payload);
    case "FETCH_IMAGE_DATA":         return fetchImageData(message.payload);
    case "POST_TO_TIKTOK":           return postToTikTok(message.payload);
    case "GET_FLOW_SETTINGS":        return getFlowSettings();
    case "FLOW_INSERT_TEXT":         return insertTextWithDebugger(message.payload, sender);
    case "FLOW_CLICK_POINT":         return clickPointWithDebugger(message.payload, sender, { detachAfter: true });
    case "FLOW_DEBUGGER_ATTACH":     return ensureDebuggerAttached(sender?.tab?.id).then(() => ({ ok: true }));
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
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
  } catch (error) {
    // SW อาจ restart แล้ว Set หาย แต่ debugger ยัง attach อยู่จริง — ถือว่าพร้อมใช้งาน
    if (!/already attached/i.test(error?.message || "")) throw error;
  }
  attachedDebuggerTabs.add(tabId);
}

async function detachDebuggerTab(tabId) {
  if (tabId == null) return { detached: false };
  attachedDebuggerTabs.delete(tabId);
  try {
    await chrome.debugger.detach({ tabId });
    return { detached: true };
  } catch (error) {
    return { detached: false };
  }
}

// detach อัตโนมัติถ้า tab ปิด หรือ debugger หลุด
chrome.debugger.onDetach?.addListener((source) => {
  if (source?.tabId != null) attachedDebuggerTabs.delete(source.tabId);
});

const lastDebuggerPositions = new Map();

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getBezierPoints(x0, y0, x3, y3, steps) {
  const points = [];
  const dx = x3 - x0;
  const dy = y3 - y0;
  const p1x = x0 + dx * 0.25 + (Math.random() - 0.5) * 120;
  const p1y = y0 + dy * 0.25 + (Math.random() - 0.5) * 120;
  const p2x = x0 + dx * 0.75 + (Math.random() - 0.5) * 120;
  const p2y = y0 + dy * 0.75 + (Math.random() - 0.5) * 120;
  for (let i = 1; i <= steps; i++) {
    const t = easeInOutQuad(i / steps);
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * x3;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t * y3;
    points.push({ x, y });
  }
  return points;
}

async function clickPointWithDebugger(payload, sender, options = {}) {
  const tabId = sender?.tab?.id;
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกดปุ่ม");
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("ตำแหน่งปุ่ม Generate ไม่ถูกต้อง");
  }

  // ดึงข้อมูล tab เพื่อเอา windowId มาขยาย/โฟกัสหน้าต่าง (กันเคสย่อหน้าต่างไว้ทำให้พิกัดเพี้ยนหรือกดไม่ได้)
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.windowId) {
      await chrome.windows.update(tab.windowId, { state: "normal", focused: true });
      await new Promise((r) => setTimeout(r, 300)); // รอให้หน้าต่างขยายเสร็จ
    }
  } catch (err) {
    console.error("โฟกัสหน้าต่างล้มเหลว:", err);
  }

  const target = { tabId };
  try {
    await ensureDebuggerAttached(tabId);

    // เลียนแบบวิถีการขยับเมาส์ลากเป็นเส้นโค้ง Bezier ไปยังจุดคลิก
    const start = lastDebuggerPositions.get(tabId) || { x: 500, y: 400 };
    const distance = Math.hypot(x - start.x, y - start.y);
    if (distance > 5) {
      const steps = Math.max(8, Math.min(30, Math.floor(distance / 20)));
      const points = getBezierPoints(start.x, start.y, x, y, steps);
      for (const pt of points) {
        await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
          type: "mouseMoved",
          x: pt.x,
          y: pt.y,
          button: "none"
        });
        await new Promise((r) => setTimeout(r, 6 + Math.random() * 8));
      }
    }

    // เลื่อนเมาส์ไปยังตำแหน่งเป้าหมายปลายทางตัวจริง
    await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x,
      y,
      button: "none"
    });
    lastDebuggerPositions.set(tabId, { x, y });

    // คลิกเมาส์
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
  } finally {
    if (options?.detachAfter) {
      await detachDebuggerTab(tabId);
    }
  }
}

async function insertTextWithDebugger(payload, sender) {
  const tabId = sender?.tab?.id;
  const text = String(payload?.text || "");
  if (!tabId) throw new Error("ไม่พบ tab สำหรับกรอก prompt");
  if (!text && payload?.clear !== true) return { inserted: false };

  // ดึงข้อมูล tab เพื่อเอา windowId มาขยาย/โฟกัสหน้าต่างก่อนกรอกข้อมูล
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.windowId) {
      await chrome.windows.update(tab.windowId, { state: "normal", focused: true });
      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    console.error("โฟกัสหน้าต่างล้มเหลว:", err);
  }

  const platform = await chrome.runtime.getPlatformInfo();
  const isMac = platform.os === "mac";
  const selectAllModifier = isMac ? 4 : 2; // Meta (4) for Mac Cmd+A, Control (2) for Windows/Linux Ctrl+A

  const target = { tabId };
  const delay = (min, max) => new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

  try {
    await ensureDebuggerAttached(tabId);

    if (payload?.clear !== false) {
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyDown", key: "a", code: "KeyA",
        windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: selectAllModifier
      });
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyUp", key: "a", code: "KeyA",
        windowsVirtualKeyCode: 65, nativeVirtualKeyCode: 65, modifiers: selectAllModifier
      });
      await delay(80, 180);
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyDown", key: "Backspace", code: "Backspace",
        windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8
      });
      await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
        type: "keyUp", key: "Backspace", code: "Backspace",
        windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8
      });
      await delay(150, 300);
    }

    // ส่งข้อความทั้งหมดทีเดียวเพื่อเลียนแบบการ Paste (ลดความเสี่ยงโดนตรวจจับความเร็วแป้นพิมพ์)
    if (text) {
      await chrome.debugger.sendCommand(target, "Input.insertText", { text: text });
    }
    return { inserted: true, method: "Input.insertText" };
  } finally {
    await detachDebuggerTab(tabId);
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
  const flowSettings = await getFlowSettings();
  const reuseProject = flowSettings.reuseProject === true;
  const FLOW_URL = "https://labs.google/fx/tools/flow";
  const existingTabs = await queryFlowTabs();
  let tab;
  let needNavigate = true;
  let needReload = false;
  if (existingTabs.length > 0) {
    tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    try {
      await chrome.windows.update(tab.windowId, { focused: true });
    } catch { }
    
    if (reuseProject && isFlowProjectUrl(tab.url || "")) {
      needNavigate = false;
      needReload = true;
    } else {
      needNavigate = true;
      needReload = false;
    }
  } else {
    tab = await chrome.tabs.create({ url: FLOW_URL, active: true });
    needNavigate = false;
    needReload = false;
  }

  if (needNavigate) {
    await chrome.tabs.update(tab.id, { url: FLOW_URL });
    await waitForTabComplete(tab.id);
  } else if (needReload) {
    await chrome.tabs.reload(tab.id);
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
  // Every product job owns a separate Flow project, unless the reuseProject setting is enabled.
  const flowSettingsForProject = await getFlowSettings();
  const reuseProjectFlag = flowSettingsForProject.reuseProject === true;
  await prepareFlowProject(tab.id, { forceNew: !reuseProjectFlag });
  await ensureFlowContentScript(tab.id);
  assertRunNotStopped(runVersion, flowStopVersion);

  await chrome.storage.local.set({ activeFlowTabId: tab.id });
  try {
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
  } catch (err) {
    await chrome.storage.local.remove("activeFlowTabId");
    throw err;
  }
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
    videoModel: settings.flow?.videoModel || "veo-3.1-lite-low-priority",
    imageModel: settings.flow?.imageModel || "nano-banana-pro",
    autoPortrait: settings.flow?.autoPortrait !== false,
    uploadWaitSec: settings.flow?.uploadWaitSec ?? 8,
    reuseProject: settings.flow?.reuseProject === true,
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
  await chrome.storage.local.remove("activeFlowTabId");
  const tabs = await queryFlowTabs();
  await Promise.allSettled(tabs.map(async (tab) => {
    await chrome.tabs.sendMessage(tab.id, { type: "FLOW_STOP" });
    await detachDebuggerTab(tab.id);
  }));
  return { ok: true, stoppedTabs: tabs.length };
}

async function stopTikTokStudioPipeline() {
  tiktokStopVersion += 1;
  await chrome.storage.local.remove("activeTikTokTabId");
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
  const log = (msg, lvl = "info") => {
    chrome.runtime.sendMessage({ type: "PIPELINE_LOG", payload: { level: lvl, message: `[ดึงรูป] ${msg}` } }).catch(() => {});
  };

  log(`เตรียมดึงสินค้า: ${productUrl}`);

  if (!/^https:\/\/(?:[\w-]+\.)?shopee\.co\.th\//.test(productUrl || "")) {
    log(`ลิงก์ไม่ถูกต้อง: ${productUrl}`, "error");
    return { images: [], error: "ลิงก์สินค้าไม่ถูกต้อง" };
  }

  // ปิดแท็บสินค้าเดิมก่อนเสมอ (ถ้ามีเปิดอยู่) - ทำแบบไม่บล็อก (ไม่มี await) ป้องกันเบราว์เซอร์ค้าง
  if (shopeeScrapeTabId != null) {
    const oldTabId = shopeeScrapeTabId;
    shopeeScrapeTabId = null;
    chrome.tabs.remove(oldTabId).catch(() => {});
    log(`ปิดแท็บเก่า ID: ${oldTabId}`);
  }

  // สร้างแท็บใหม่สำหรับสินค้ารายการนี้เสมอ
  log(`กำลังสร้างแท็บใหม่...`);
  let tab;
  try {
    tab = await chrome.tabs.create({ url: productUrl, active: true });
    shopeeScrapeTabId = tab.id;
    log(`สร้างแท็บสำเร็จ ID: ${tab.id}`);
  } catch (e) {
    log(`สร้างแท็บล้มเหลว: ${e.message}`, "error");
    return { images: [], error: "ไม่สามารถสร้างแท็บได้: " + e.message };
  }

  try {
    if (tab.windowId) {
      chrome.windows.update(tab.windowId, { state: "normal", focused: true }).catch(() => {});
    }
  } catch (e) {
    console.error("Focus window error:", e);
  }

  const startTime = Date.now();
  let images = [];
  let blocked = false;
  let resolvedConsumerUrl = productUrl;
  let isAffiliate = productUrl.includes("affiliate.shopee.co.th/offer/product_offer/");

  log(`เริ่มวนลูปตรวจสอบรูปภาพ (สูงสุด 9 วินาที)...`);
  // วนลูปโพลหาสินค้าและรูปภาพจนกว่าจะพบ หรือหมดเวลารอ (Timeout 9 วินาที)
  while (Date.now() - startTime < 9000) {
    await delay(500);
    try {
      const currentTab = await chrome.tabs.get(shopeeScrapeTabId);
      
      // กรณีลิงก์ Affiliate: ค้นหาลิงก์ปลายทางเพื่อนำทางไปต่อ
      if (isAffiliate && currentTab.url && currentTab.url.includes("affiliate.shopee.co.th/offer/product_offer/")) {
        log(`ตรวจพบลิงก์ Affiliate กำลังแกะลิงก์ตรง...`);
        let extractedUrlResult;
        try {
          [{ result: extractedUrlResult }] = await chrome.scripting.executeScript({
            target: { tabId: shopeeScrapeTabId },
            injectImmediately: true,
            func: () => {
              const anchors = Array.from(document.querySelectorAll("a"));
              let link = anchors.find(a => {
                const href = a.href || "";
                return href.includes("shopee.co.th") && !href.includes("affiliate.shopee.co.th") && (href.includes("/product/") || /-i\.\d+\.\d+/i.test(href));
              });
              if (link) return link.href;
              return null;
            }
          });
        } catch (err) {
          log(`แกะลิงก์ตรงล้มเหลว: ${err.message}`, "warn");
        }

        if (extractedUrlResult) {
          log(`แกะลิงก์ตรงสำเร็จ: ${extractedUrlResult}`);
          resolvedConsumerUrl = extractedUrlResult;
          isAffiliate = false;
          await chrome.tabs.update(shopeeScrapeTabId, { url: extractedUrlResult });
        }
        continue;
      }

      // ดึงข้อมูลรูปภาพจากแกลเลอรี
      let scrapeRes;
      try {
        [{ result: scrapeRes }] = await chrome.scripting.executeScript({
          target: { tabId: shopeeScrapeTabId },
          injectImmediately: true,
          func: scrapeShopeeGallery
        });
      } catch (err) {
        continue; // หน้าเว็บอาจยังไม่พร้อม ค่อยลองรอบถัดไป
      }

      if (scrapeRes) {
        if (scrapeRes.blocked) {
          log(`⚠️ ตรวจพบหน้า Captcha/Verify ของ Shopee!`, "warn");
          blocked = true;
          break; // ติดหน้า Captcha ให้เบรกออกทันที
        }
        if (scrapeRes.images && scrapeRes.images.length > 0) {
          images = scrapeRes.images;
          const elapsed = Date.now() - startTime;
          // รออย่างน้อย 2 วินาทีเพื่อให้โหลดรูปแกลเลอรีครบ (หรือหยุดทันทีถ้าได้รูปเยอะแล้ว เช่น >= 5 รูป)
          if (images.length >= 5 || elapsed >= 2000) {
            log(`ดึงรูปแกลเลอรีสำเร็จ: ${images.length} รูป`);
            break;
          } else {
            log(`พบรูปภาพ ${images.length} รูป... กำลังรอโหลดรูปเพิ่มเติม...`);
          }
        }
      }
    } catch (e) {
      // เกิดข้อผิดพลาดของแท็บ ให้ลองใหม่รอบหน้า
    }
  }

  if (images.length === 0 && !blocked) {
    log(`หมดเวลาดึงรูปภาพของสินค้านี้ (ได้ 0 รูป)`);
  }

  return { images, blocked, consumerUrl: resolvedConsumerUrl };
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
    let url = s.split("@")[0];
    // Strip thumbnail suffixes (_tn)
    url = url.replace(/_tn$/, "").replace(/_tn(?=\.[a-zA-Z0-9]+(?:\?|$))/, "");
    // Strip size suffixes (e.g. _w640, _w320, _s120, _w640_h640)
    url = url.replace(/_(?:w|h|s)\d+(?:_(?:w|h|s)\d+)?(?=\.[a-zA-Z0-9]+(?:\?|$))/, "");
    url = url.replace(/_(?:w|h|s)\d+(?:_(?:w|h|s)\d+)?$/, "");
    return url;
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

async function pullShopeeProducts({ keyword, count, mode, minCommission, minSales, sortBy } = {}) {
  if (!keyword) throw new Error("ไม่มีคำค้นหา");
  const want = Math.max(1, parseInt(count, 10) || 1);
  const collect = mode === "collect";
  const minComm = Math.max(0, Number(minCommission) || 0);
  const minS = Math.max(0, parseInt(minSales, 10) || 0);

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
    const result = await chrome.tabs.sendMessage(tab.id, { type: "SHOPEE_RUN", keyword, count: want, mode: "collect", minCommission: minComm, minSales: minS, sortBy });
    if (!result?.ok) throw new Error(result?.error || "ดึงสินค้า Shopee ไม่สำเร็จ");
    return { ticked: result.ticked, capped: result.capped, products: result.products || [] };
  }

  // โหมด export: ปุ่ม "เอา ลิงก์" ไม่ยอม generate/download จาก synthetic click
  // ต้องเป็น trusted click ผ่าน chrome.debugger (เหมือนปุ่ม Generate ของ Flow)
  try {
    const result = await chrome.tabs.sendMessage(tab.id, { type: "SHOPEE_RUN", keyword, count: want, mode, minCommission: minComm, minSales: minS, sortBy });
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

async function waitForTabComplete(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab?.status === "complete") return;
  } catch (e) {}

  return new Promise((resolve) => {
    const timeout = setTimeout(cleanup, 12000); // รอสูงสุด 12 วินาที
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
  const jitterFactor = ms >= 300 ? (0.7 + Math.random() * 0.6) : 1.0;
  return new Promise((resolve) => setTimeout(resolve, Math.round(ms * jitterFactor)));
}

chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  if (item.byExtensionId === chrome.runtime.id) {
    let targetPath = null;
    let conflictAction = null;
    
    // 1. Try to extract filename and conflict action from URL hash or custom parameter
    if (item.url && item.url.includes("x-filename=")) {
      const match = item.url.match(/[#;?]x-filename=([^;&]+)/);
      if (match) {
        targetPath = decodeURIComponent(match[1]);
      }
    }
    if (item.url && item.url.includes("x-conflict=")) {
      const matchConflict = item.url.match(/[#;&?]x-conflict=([^;&]+)/);
      if (matchConflict) {
        conflictAction = matchConflict[1];
      }
    }
    
    // 2. Fallback: if no targetPath in URL, but item.filename already contains our custom path
    if (!targetPath && item.filename) {
      const index = item.filename.indexOf("aivideoshop");
      if (index !== -1) {
        targetPath = item.filename.substring(index).replace(/\\/g, "/");
      }
    }
    
    if (targetPath) {
      // 3. Determine conflictAction if not explicitly specified
      if (!conflictAction) {
        const lowerPath = targetPath.toLowerCase();
        if (lowerPath.endsWith(".mp4") || lowerPath.endsWith(".webm")) {
          conflictAction = "overwrite";
        } else {
          // Default to uniquify for images/CSV and other files to prevent overwriting
          conflictAction = "uniquify";
        }
      }
      
      suggest({
        filename: targetPath,
        conflictAction: conflictAction
      });
      return;
    }
  }
  suggest();
});

async function downloadVideo(payload) {
  const preparedVideo = await prepareVideoBase64ForTikTok(payload.url);
  const mimeType = preparedVideo.mimeType || "video/mp4";
  const conflict = payload.conflictAction || "overwrite";
  const base64Url = `data:${mimeType};x-filename=${encodeURIComponent(payload.filename)};x-conflict=${conflict};base64,${preparedVideo.base64}`;
  const downloadUrl = /^https:|^data:/i.test(payload.url || "")
    ? (payload.url + (payload.url.includes("#") ? "&" : "#") + `x-filename=${encodeURIComponent(payload.filename)}&x-conflict=${conflict}`)
    : base64Url;
  
  try {
    const id = await chrome.downloads.download({
      url: downloadUrl,
      filename: payload.filename,
      conflictAction: conflict,
      saveAs: false
    });
    return { downloadId: id, videoUrl: base64Url, mimeType };
  } catch (error) {
    return { downloadId: null, downloadError: error.message, videoUrl: base64Url, mimeType };
  }
}

async function fetchAsDataUrl(url, filename, conflict = "overwrite") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  const base64 = btoa(binary);
  const mime = blob.type || "image/jpeg";
  return `data:${mime};x-filename=${encodeURIComponent(filename)};x-conflict=${conflict};base64,${base64}`;
}

async function fetchImageData(payload) {
  // Use a dummy filename for fetchImageData since it is just loading data and not downloading via Chrome
  const dataUrl = await fetchAsDataUrl(payload.url, "dummy.jpg", "overwrite");
  const commaIdx = dataUrl.indexOf(",");
  const base64 = dataUrl.substring(commaIdx + 1);
  const mime = dataUrl.substring(5, commaIdx).split(";")[0];
  return { base64, mime };
}

async function downloadFile(payload) {
  try {
    let downloadUrl = payload.url;
    const conflict = payload.conflictAction || "overwrite";
    if (downloadUrl && !downloadUrl.startsWith("data:")) {
      try {
        downloadUrl = await fetchAsDataUrl(payload.url, payload.filename, conflict);
      } catch (fetchErr) {
        console.warn("[background] fetchAsDataUrl failed, falling back to direct URL:", fetchErr.message);
        downloadUrl = payload.url + (payload.url.includes("#") ? "&" : "#") + `x-filename=${encodeURIComponent(payload.filename)}&x-conflict=${conflict}`;
      }
    } else if (downloadUrl && downloadUrl.startsWith("data:")) {
      const commaIdx = downloadUrl.indexOf(",");
      const head = downloadUrl.substring(0, commaIdx);
      const base64 = downloadUrl.substring(commaIdx + 1);
      downloadUrl = `${head};x-filename=${encodeURIComponent(payload.filename)};x-conflict=${conflict},${base64}`;
    }
    
    return new Promise((resolve) => {
      chrome.downloads.download({
        url: downloadUrl,
        filename: payload.filename,
        conflictAction: conflict,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        const checkAndResolve = (state, error) => {
          if (state === "complete") {
            chrome.downloads.onChanged.removeListener(listener);
            resolve({ ok: true, downloadId });
            return true;
          } else if (state === "interrupted") {
            chrome.downloads.onChanged.removeListener(listener);
            resolve({ ok: false, error: "Download interrupted: " + (error || "") });
            return true;
          }
          return false;
        };
        
        const listener = (delta) => {
          if (delta.id === downloadId) {
            checkAndResolve(delta.state?.current, delta.error?.current);
          }
        };
        chrome.downloads.onChanged.addListener(listener);
        
        chrome.downloads.search({ id: downloadId }, (results) => {
          if (results && results[0]) {
            checkAndResolve(results[0].state, results[0].error);
          }
        });
      });
    });
  } catch (error) {
    return { ok: false, error: "ดาวน์โหลดรูปล้มเหลว: " + error.message };
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
  let finalMs = ms;
  if (ms >= 1000) {
    const extraRandom = Math.floor(Math.random() * 2000) - 800; // -800ms to +1200ms
    finalMs = Math.max(800, ms + extraRandom);
  }
  const jitterFactor = finalMs >= 300 ? (0.75 + Math.random() * 0.50) : 1.0; // 0.75 to 1.25
  return new Promise(resolve => setTimeout(resolve, Math.round(finalMs * jitterFactor)));
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
  await chrome.storage.local.set({ activeTikTokTabId: tabId });

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
    chrome.storage.local.remove("activeTikTokTabId").catch(() => {});
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

// ─── Tab Active Watchdog ──────────────────────────────────────────
setInterval(async () => {
  try {
    const data = await chrome.storage.local.get(["activeFlowTabId", "activeTikTokTabId"]);
    
    if (data.activeFlowTabId) {
      try {
        const tab = await chrome.tabs.get(Number(data.activeFlowTabId));
        if (!tab.active) {
          await chrome.tabs.update(tab.id, { active: true });
          try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
          console.log("[Watchdog] Pulling active Google Flow tab to foreground (ID:", tab.id, ")");
        }
      } catch (err) {
        // Tab no longer exists, clear it
        await chrome.storage.local.remove("activeFlowTabId");
      }
    }
    
    if (data.activeTikTokTabId) {
      try {
        const tab = await chrome.tabs.get(Number(data.activeTikTokTabId));
        if (!tab.active) {
          await chrome.tabs.update(tab.id, { active: true });
          try { await chrome.windows.update(tab.windowId, { focused: true }); } catch (_) {}
          console.log("[Watchdog] Pulling active TikTok Studio tab to foreground (ID:", tab.id, ")");
        }
      } catch (err) {
        // Tab no longer exists, clear it
        await chrome.storage.local.remove("activeTikTokTabId");
      }
    }
  } catch (e) {
    console.error("[Watchdog] Error in active tab watchdog:", e);
  }
}, 5000);
