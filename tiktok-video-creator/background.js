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
    case "FETCH_PRODUCTS": return fetchShowcaseProducts(message.payload);
    case "OPEN_GOOGLE_FLOW": return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO": return downloadVideo(message.payload);
    case "POST_TO_TIKTOK": return postToTikTok(message.payload);
    case "GET_FLOW_SETTINGS": return getFlowSettings();
    case "FLOW_PING": return { pong: true };
    case "FLOW_CONTENT_READY": return { ok: true };
    case "FLOW_STOP": return stopFlowPipeline();
    default: throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
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

async function notify(title, message) {
  try { await chrome.notifications.create({ type: "basic", iconUrl: "assets/icon128.png", title, message }); } catch { }
}
