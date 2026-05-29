import { initVideoTab, syncSelectedProductToVideoTab } from "./tabs/tab-video.js";
import { initProductsTab } from "./tabs/tab-products.js";

const TAB_HTML = {
  video: "tabs/tab-video.html",
  products: "tabs/tab-products.html"
};

const tabRoot = document.querySelector("#tab-root");
const statusBox = document.querySelector("#status");
const logList = document.querySelector("#activity-log-list");
const clearLogButton = document.querySelector("#clear-log");
const toggleLogButton = document.querySelector("#toggle-log");
const tabButtons = [...document.querySelectorAll("[data-tab]")];
const isTabMode = new URLSearchParams(location.search).get("mode") === "tab";

let activeTab = "video";
let activityLog = [];

if (isTabMode) {
  document.documentElement.dataset.mode = "tab";
}

/**
 * @description แสดงข้อความสถานะกลางของ side panel
 * @param {string} message - ข้อความภาษาไทยที่ต้องการแสดง
 * @param {"info"|"success"|"error"} type - ประเภทข้อความ
 */
export function showStatus(message, type = "info") {
  statusBox.textContent = message;
  statusBox.dataset.type = type;
  statusBox.hidden = false;
  logActivity(message, type);
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    statusBox.hidden = true;
  }, type === "error" ? 7000 : 3500);
}

/**
 * @description เพิ่มรายการ log ด้านล่างของแอพและบันทึกลง local storage
 * @param {string} message - ข้อความสถานะ
 * @param {"info"|"success"|"error"} type - ประเภท log
 */
export async function logActivity(message, type = "info") {
  const previous = activityLog[0];
  if (previous?.message === message && previous?.type === type) return;

  const entry = {
    id: crypto.randomUUID(),
    message,
    type,
    time: new Date().toISOString()
  };
  activityLog = [entry, ...activityLog].slice(0, 30);
  renderActivityLog();
  await chrome.storage.local.set({ activityLog });
}

/**
 * @description วาด activity log ลง UI
 */
function renderActivityLog() {
  if (!logList) return;
  if (!activityLog.length) {
    logList.innerHTML = `<li class="activity-log__empty">ยังไม่มี log</li>`;
    return;
  }

  logList.innerHTML = activityLog.map((entry) => `
    <li class="activity-log__item" data-type="${entry.type}">
      <time>${formatLogTime(entry.time)}</time>
      <span>${escapeHtml(entry.message)}</span>
    </li>
  `).join("");
}

/**
 * @description format เวลาใน log ให้สั้น
 * @param {string} isoTime - ISO time
 * @returns {string} เวลา HH:mm:ss
 */
function formatLogTime(isoTime) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date(isoTime));
}

/**
 * @description escape HTML สำหรับข้อความ log
 * @param {string} value - raw text
 * @returns {string} escaped text
 */
function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * @description โหลด HTML ของแท็บและ init logic ที่ตรงกัน
 * @param {"video"|"products"} tabName - ชื่อแท็บ
 */
async function loadTab(tabName) {
  activeTab = tabName;
  tabRoot.setAttribute("aria-busy", "true");
  logActivity(`กำลังโหลดแท็บ ${tabName === "video" ? "สร้างวิดีโอ" : "สินค้า TikTok"}`).catch(() => {});
  tabButtons.forEach((button) => {
    button.classList.toggle("tab-bar__button--active", button.dataset.tab === tabName);
  });

  const response = await fetch(TAB_HTML[tabName]);
  if (!response.ok) {
    throw new Error("ไม่สามารถโหลดหน้าจอแท็บได้");
  }

  tabRoot.innerHTML = await response.text();
  tabRoot.scrollTop = 0;

  if (tabName === "video") {
    await initVideoTab({ showStatus, logActivity, switchTab: loadTab });
  }

  if (tabName === "products") {
    await initProductsTab({ showStatus, logActivity, switchTab: loadTab });
  }

  tabRoot.setAttribute("aria-busy", "false");
  await chrome.storage.local.set({ activeTab: tabName });
  logActivity(`โหลดแท็บ ${tabName === "video" ? "สร้างวิดีโอ" : "สินค้า TikTok"} แล้ว`, "success").catch(() => {});
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    loadTab(button.dataset.tab).catch((error) => showStatus(error.message, "error"));
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.selectedProduct && activeTab === "video") {
    syncSelectedProductToVideoTab(changes.selectedProduct.newValue).catch((error) => {
      showStatus(error.message, "error");
    });
  }
});

clearLogButton?.addEventListener("click", async () => {
  activityLog = [];
  renderActivityLog();
  await chrome.storage.local.set({ activityLog });
});

toggleLogButton?.addEventListener("click", async () => {
  const logSection = document.querySelector(".activity-log");
  logSection.classList.toggle("activity-log--collapsed");
  const isCollapsed = logSection.classList.contains("activity-log--collapsed");
  await chrome.storage.local.set({ logCollapsed: isCollapsed });
});

chrome.storage.local.get(["activeTab", "activityLog", "logCollapsed"]).then(({ activeTab: storedTab, activityLog: storedLog, logCollapsed }) => {
  if (logCollapsed === false) {
    document.querySelector(".activity-log").classList.remove("activity-log--collapsed");
  } else {
    document.querySelector(".activity-log").classList.add("activity-log--collapsed");
  }
  
  activityLog = Array.isArray(storedLog) ? storedLog.slice(0, 30) : [];
  renderActivityLog();
  loadTab(storedTab || "video").catch((error) => showStatus(error.message, "error"));
});
