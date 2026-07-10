import { normalizeHashtags, VIDEO_STYLES } from "../modules/prompt-builder.js";
import { DEFAULT_GEMINI_MODEL, DEFAULT_OPENAI_MODEL, testGeminiConnection, testOpenAIConnection } from "../modules/image-analyzer.js";

// ─── DOM refs ───────────────────────────────────────────────
const saveStatusEl = document.querySelector("#save-status");

// ─── Load ────────────────────────────────────────────────────
async function loadOptions() {
  const { settings = {} } = await chrome.storage.sync.get("settings");

  // Video style dropdown
  const styleSelect = document.querySelector("#default-video-style");
  styleSelect.innerHTML = VIDEO_STYLES
    .map((s) => `<option value="${s.id}">${s.emoji} ${s.name}</option>`)
    .join("");

  // AI
  setSelectValue("ai-provider", settings.aiProvider || "gemini");
  setValue("gemini-api-key", settings.geminiApiKey || "");
  setSelectValue("gemini-model", settings.geminiModel || DEFAULT_GEMINI_MODEL);
  setValue("openai-api-key", settings.openaiApiKey || "");
  setSelectValue("openai-model", settings.openaiModel || DEFAULT_OPENAI_MODEL);
  updateProviderVisibility();

  // Google Flow
  const flow = settings.flow || {};
  setRadio("flow-video-model", flow.videoModel || "veo-3.1-lite-low-priority");
  setSelectValue("flow-image-model", flow.imageModel || "nano-banana-pro");
  setChecked("flow-auto-portrait", flow.autoPortrait !== false);
  setChecked("flow-reuse-tab", flow.reuseTab !== false);
  setChecked("flow-reuse-project", flow.reuseProject === true);
  const uploadWait = flow.uploadWaitSec ?? 8;
  setValue("flow-upload-wait", uploadWait);
  document.querySelector("#flow-upload-wait-label").textContent = uploadWait + "s";

  // Image & Video Settings
  const media = settings.mediaSettings || {};
  setValue("default-image-count", media.imageCount || 1);
  setValue("default-video-count", media.videoCount || 1);
  setSelectValue("default-video-duration", media.videoDuration || "8");
  setSelectValue("default-aspect-ratio", media.aspectRatio || "9:16");
  setChecked("auto-download-content", media.autoDownload !== false);
  setChecked("show-generation-progress", media.showProgress !== false);

  // Video defaults
  setSelectValue("default-video-style", settings.defaultVideoStyle || "testimonial");
  setSelectValue("default-language", settings.defaultLanguage || "ไทย");
  setSelectValue("default-presenter", settings.defaultPresenter || "Auto");
  setSelectValue("default-voice-tone", settings.defaultVoiceTone || "Auto");

  // Post defaults
  const post = settings.postDefaults || {};
  let template = post.captionTemplate;
  if (template === "{product_name}\n{product_details}\n{cta}") {
    template = "{product_name}\n{cta}";
    post.captionTemplate = template;
    chrome.storage.sync.set({ settings }).catch(() => {});
  }
  setValue("caption-template", template || "{product_name}\n{cta}");
  setValue("default-hashtags", normalizeHashtags(post.hashtags || ["#TikTokShop", "#ของดีบอกต่อ"], 4).join(", "));
  setChecked("auto-add-product-link", post.autoAddProductLink !== false);
  setChecked("caption-random-opening", post.randomOpening !== false);
  setValue("shopee-csv-folder", post.shopeeCsvFolder || "shopee_exports");
  setValue("shopee-csv-filename", post.shopeeCsvFilename || "shopee_products.csv");

  // Sync model card UI
  syncModelCards();
}

// ─── Save ────────────────────────────────────────────────────
async function saveSettings() {
  const btn = document.querySelector("#save-settings");
  btn.disabled = true;
  const { settings: existingSettings = {} } = await chrome.storage.sync.get("settings");

  const provider = getSelectValue("ai-provider") || "gemini";
  const geminiKey = getValue("gemini-api-key");
  const openaiKey = getValue("openai-api-key");

  try {
    if (provider === "gemini" && geminiKey) {
      showSaveStatus("กำลังตรวจสอบ Gemini API Key...", "info");
      await testGeminiConnection(geminiKey, getSelectValue("gemini-model"));
    } else if (provider === "openai" && openaiKey) {
      showSaveStatus("กำลังตรวจสอบ OpenAI API Key...", "info");
      await testOpenAIConnection(openaiKey, getSelectValue("openai-model"));
    }
  } catch (err) {
    showSaveStatus(`คีย์ไม่ถูกต้อง: ${err.message}`, "error");
    btn.disabled = false;
    throw err;
  }

  const settings = {
    aiProvider: provider,
    geminiApiKey: geminiKey,
    geminiModel: getSelectValue("gemini-model") || DEFAULT_GEMINI_MODEL,
    openaiApiKey: openaiKey,
    openaiModel: getSelectValue("openai-model") || DEFAULT_OPENAI_MODEL,

    flow: {
      videoModel: getRadio("flow-video-model") || "veo-3.1-lite-low-priority",
      imageModel: getSelectValue("flow-image-model") || "nano-banana-pro",
      autoPortrait: getChecked("flow-auto-portrait"),
      reuseTab: getChecked("flow-reuse-tab"),
      reuseProject: getChecked("flow-reuse-project"),
      uploadWaitSec: parseInt(getValue("flow-upload-wait"), 10) || 8
    },

    mediaSettings: {
      imageCount: parseInt(getValue("default-image-count"), 10) || 1,
      videoCount: parseInt(getValue("default-video-count"), 10) || 1,
      videoDuration: parseInt(getSelectValue("default-video-duration"), 10) || 8,
      aspectRatio: getSelectValue("default-aspect-ratio") || "9:16",
      autoDownload: getChecked("auto-download-content"),
      showProgress: getChecked("show-generation-progress")
    },

    defaultVideoStyle: getSelectValue("default-video-style"),
    defaultLanguage: getSelectValue("default-language"),
    defaultPresenter: getSelectValue("default-presenter"),
    defaultVoiceTone: getSelectValue("default-voice-tone"),

    postDefaults: {
      ...(existingSettings.postDefaults || {}),
      captionTemplate: getValue("caption-template"),
      hashtags: normalizeHashtags(getValue("default-hashtags"), 4),
      autoAddProductLink: getChecked("auto-add-product-link"),
      randomOpening: getChecked("caption-random-opening"),
      afterCreateAction: existingSettings.postDefaults?.afterCreateAction || "post",
      defaultMode: existingSettings.postDefaults?.defaultMode || "now",
      shopeeCsvFolder: getValue("shopee-csv-folder") || "shopee_exports",
      shopeeCsvFilename: getValue("shopee-csv-filename") || "shopee_products.csv"
    }
  };

  await chrome.storage.sync.set({ settings });
  showSaveStatus("บันทึกแล้ว ✓", "success");
  btn.disabled = false;
}

// ─── Test TikTok ─────────────────────────────────────────────
async function testProductFetch() {
  const btn = document.querySelector("#test-products");
  const badge = document.querySelector("#tiktok-test-badge");
  btn.disabled = true;
  btn.textContent = "กำลังทดสอบ...";
  badge.hidden = true;

  try {
    const res = await chrome.runtime.sendMessage({
      type: "FETCH_PRODUCTS",
      payload: { pageSize: 5, pageToken: "" }
    });
    if (!res?.ok) throw new Error(res?.error || "ดึงสินค้าไม่สำเร็จ");
    const count = res.products?.length || 0;
    const first = res.products?.[0]?.name ? ` · ${res.products[0].name}` : "";
    setBadge(badge, "ok", `✓ ${count} รายการ${first}`);
  } catch (err) {
    setBadge(badge, "error", "✗ " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ทดสอบดึงสินค้า`;
  }
}

// ─── Test Gemini ──────────────────────────────────────────────
async function testGemini() {
  const btn = document.querySelector("#test-gemini");
  const badge = document.querySelector("#gemini-test-badge");
  const apiKey = getValue("gemini-api-key");
  badge.hidden = true;

  if (!apiKey) {
    setBadge(badge, "ok", "ℹ️ ไม่มี key — ใช้ fallback จากชื่อสินค้า");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังทดสอบ...";

  try {
    await saveSettings();
    const result = await testGeminiConnection(apiKey, getSelectValue("gemini-model"));
    setBadge(badge, "ok", `✓ ${result.model} พร้อมใช้งาน`);
  } catch (err) {
    setBadge(badge, "error", "✗ " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "ทดสอบ";
  }
}

async function testOpenAI() {
  const btn = document.querySelector("#test-openai");
  const badge = document.querySelector("#openai-test-badge");
  const apiKey = getValue("openai-api-key");
  badge.hidden = true;

  if (!apiKey) {
    setBadge(badge, "ok", "ℹ️ ไม่มี key — ใช้ fallback จากชื่อสินค้า");
    return;
  }

  btn.disabled = true;
  btn.textContent = "กำลังทดสอบ...";

  try {
    await saveSettings();
    const result = await testOpenAIConnection(apiKey, getSelectValue("openai-model"));
    setBadge(badge, "ok", `✓ ${result.model} พร้อมใช้งาน`);
  } catch (err) {
    setBadge(badge, "error", "✗ " + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "ทดสอบ";
  }
}

function updateProviderVisibility() {
  const provider = getSelectValue("ai-provider") || "gemini";
  const geminiGroup = document.querySelector("#gemini-config-group");
  const openaiGroup = document.querySelector("#openai-config-group");
  if (!geminiGroup || !openaiGroup) return;

  if (provider === "openai") {
    geminiGroup.style.opacity = "0.4";
    openaiGroup.style.opacity = "1";
  } else {
    geminiGroup.style.opacity = "1";
    openaiGroup.style.opacity = "0.4";
  }
}

// ─── Helpers ──────────────────────────────────────────────────
function getValue(id) {
  return (document.querySelector(`#${id}`)?.value || "").trim();
}
function setValue(id, val) {
  const el = document.querySelector(`#${id}`);
  if (el) el.value = val ?? "";
}
function getSelectValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}
function setSelectValue(id, val) {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  // try to set; if option doesn't exist, keep default
  const exists = [...el.options].some((o) => o.value === val);
  if (exists) el.value = val;
}
function getChecked(id) {
  return document.querySelector(`#${id}`)?.checked ?? false;
}
function setChecked(id, val) {
  const el = document.querySelector(`#${id}`);
  if (el) el.checked = Boolean(val);
}
function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || "";
}
function setRadio(name, val) {
  const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (el) el.checked = true;
  syncModelCards();
}

function syncModelCards() {
  document.querySelectorAll(".flow-model-card").forEach((card) => {
    const radio = card.querySelector("input[type='radio']");
    card.classList.toggle("selected", radio?.checked ?? false);
  });
}

function setBadge(el, state, text) {
  el.textContent = text;
  el.dataset.state = state;
  el.hidden = false;
}

function showSaveStatus(msg, type) {
  saveStatusEl.textContent = msg;
  saveStatusEl.dataset.type = type;
  clearTimeout(showSaveStatus._t);
  showSaveStatus._t = setTimeout(() => {
    saveStatusEl.textContent = "";
    delete saveStatusEl.dataset.type;
  }, 3000);
}

// ─── Events ───────────────────────────────────────────────────
document.querySelector("#save-settings").addEventListener("click", saveSettings);
document.querySelector("#test-products").addEventListener("click", testProductFetch);
document.querySelector("#test-gemini").addEventListener("click", testGemini);
document.querySelector("#test-openai").addEventListener("click", testOpenAI);
document.querySelector("#ai-provider").addEventListener("change", updateProviderVisibility);

// Upload wait slider live label
document.querySelector("#flow-upload-wait").addEventListener("input", (e) => {
  document.querySelector("#flow-upload-wait-label").textContent = e.target.value + "s";
});

// Model card radio sync
document.querySelectorAll(".flow-model-card").forEach((card) => {
  card.addEventListener("click", () => {
    const radio = card.querySelector("input[type='radio']");
    if (radio) radio.checked = true;
    syncModelCards();
  });
});

// Auto-save on any change (debounced)
let autoSaveTimer;
document.querySelectorAll("input:not([type='radio']):not([type='password']), select, textarea").forEach((el) => {
  el.addEventListener("change", () => {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveSettings().catch(() => { });
    }, 800);
  });
});
document.querySelectorAll("input[type='radio']").forEach((el) => {
  el.addEventListener("change", () => {
    syncModelCards();
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveSettings().catch(() => { }), 800);
  });
});

// ─── Init ─────────────────────────────────────────────────────
loadOptions().catch((err) => showSaveStatus(err.message, "error"));
