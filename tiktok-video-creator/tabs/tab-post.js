import { buildCaption, normalizeHashtags } from "../modules/prompt-builder.js";
import { generatePostCopy } from "../modules/image-analyzer.js";

const DEFAULT_POST_SETTINGS = {
  captionTemplate: "{product_name}",
  hashtags: ["#TikTokShop", "#ของดีบอกต่อ"],
  autoAddProductLink: true,
  afterCreateAction: "post",
  defaultMode: "now",
  privacy: "",
  scheduleTime: "",
  location: "",
  aiGenerated: true,
  allowComment: true,
  allowReuse: true,
  shopeeCsvFolder: "shopee_exports",
  shopeeCsvFilename: "shopee_products.csv"
};

let helpers = {};
let isHydrating = false;

export async function initPostTab(injectedHelpers) {
  helpers = injectedHelpers;
  const postSettings = await loadPostSettings();
  fillForm(postSettings);
  bindEvents();
}

async function loadPostSettings() {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  return normalizePostSettings(settings.postDefaults);
}

function bindEvents() {
  document.querySelector("#post-save-settings")?.addEventListener("click", savePostSettings);
  document.querySelector("#post-open-upload")?.addEventListener("click", openTikTokUpload);
  document.querySelector("#post-test-file")?.addEventListener("change", onTestFileChange);
  document.querySelector("#post-test-run")?.addEventListener("click", runTestUpload);
  document.querySelector("#post-reset-settings")?.addEventListener("click", async () => {
    fillForm(DEFAULT_POST_SETTINGS);
    await savePostSettings();
  });

  document.querySelector("#post-default-mode")?.addEventListener("change", () => {
    syncScheduleState();
    scheduleAutoSave();
  });
  document.querySelector("#post-after-create-action")?.addEventListener("change", () => {
    syncPublishModeState();
    scheduleAutoSave();
  });

  document.querySelectorAll(
    "#post-caption-template, #post-hashtags, #post-auto-product-link, #post-privacy, #post-schedule-time, #post-location, #post-allow-comment, #post-allow-reuse, #post-shopee-csv-folder, #post-shopee-csv-filename"
  ).forEach((input) => {
    input.addEventListener("input", scheduleAutoSave);
    input.addEventListener("change", scheduleAutoSave);
  });

  syncScheduleState();
  syncPublishModeState();
}

async function openTikTokUpload() {
  await chrome.tabs.create({ url: "https://www.tiktok.com/tiktokstudio/upload", active: true });
  helpers.showStatus?.("เปิดหน้า TikTok Studio Upload แล้ว", "success");
}

function onTestFileChange(event) {
  const file = event.target.files?.[0];
  const info = document.querySelector("#post-test-file-info");
  if (!info) return;
  info.textContent = file
    ? `${file.name} — ${(file.size / 1024 / 1024).toFixed(2)} MB`
    : "ยังไม่ได้เลือกไฟล์";
}

function setTestStatus(message, kind = "") {
  const el = document.querySelector("#post-test-status");
  if (el) el.textContent = message;
  if (message) helpers.showStatus?.(message, kind || "info");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("อ่านไฟล์ไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function runTestUpload() {
  const button = document.querySelector("#post-test-run");
  const file = document.querySelector("#post-test-file")?.files?.[0];
  if (!file) {
    setTestStatus("กรุณาเลือกไฟล์วิดีโอก่อน", "error");
    return;
  }

  const productName = getValue("post-test-product-name").trim();
  const manualCaption = getValue("post-test-caption").trim();
  const productId = getValue("post-test-product-id").trim();
  const productUrl = getValue("post-test-product-url").trim();
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postSettings = readForm(settings.postDefaults);
  const postType = postSettings.defaultMode || "draft";
  const uploadMode = postType === "now" || postType === "schedule" ? "post" : "draft";
  const hashtags = normalizeHashtags(postSettings.hashtags, 5);
  const productInfo = {
    productId,
    productUrl,
    name: productName,
    originalName: productName,
    cta: "สั่งได้เลย"
  };
  const postCopy = manualCaption
    ? { caption: manualCaption, hashtags }
    : await generatePostCopy(productInfo, postSettings);
  const caption = postCopy.caption !== undefined ? postCopy.caption : buildCaption(productInfo, postSettings);
  const finalHashtags = normalizeHashtags(postCopy.hashtags?.length ? postCopy.hashtags : hashtags, 5);
  if (postType === "schedule" && !postSettings.scheduleTime) {
    setTestStatus("กรุณาเลือกเวลาโพสต์ก่อนตั้งเวลา", "error");
    return;
  }

  try {
    if (button) button.disabled = true;
    setTestStatus("กำลังอ่านไฟล์...", "info");
    const dataUrl = await fileToDataUrl(file);

    setTestStatus("ส่งเข้า TikTok Studio...", "info");
    const payload = {
      videoUrl: dataUrl,
      filename: file.name,
      caption: caption || "โพสต์คลิปเอง",
      hashtags: finalHashtags,
      productId,
      productUrl,
      productName,
      mode: uploadMode,
      postType,
      scheduleTime: postSettings.scheduleTime || "",
      location: postSettings.location || "",
      privacy: postSettings.privacy || "",
      allowComment: postSettings.allowComment !== false,
      allowReuse: postSettings.allowReuse !== false
    };

    // pipeline ใช้เวลานาน (อัพโหลด+รอประมวลผล) channel อาจปิดก่อนได้ response
    // → ไม่ block รอจนจบ ถือว่าเริ่มแล้ว แล้วติดตามจาก log แทน
    chrome.runtime.sendMessage({ type: "TIKTOK_SEND_DRAFT", payload })
      .then((response) => {
        if (response?.ok) {
          setTestStatus("เริ่มทำงานบนหน้า TikTok แล้ว — ดูผลที่ Notification / แท็บ TikTok Studio", "info");
        } else if (response) {
          setTestStatus("ล้มเหลว: " + (response.error || "ไม่ทราบสาเหตุ"), "error");
        }
      })
      .catch((error) => {
        const msg = error?.message || String(error);
        if (msg.includes("message channel closed")) {
          setTestStatus("กำลังอัพโหลดเบื้องหลัง — ดูผลที่แท็บ TikTok Studio / Notification", "info");
        } else {
          setTestStatus("error: " + msg, "error");
        }
      });

    await sleep(800);
    setTestStatus("เริ่มอัพโหลดแล้ว — ดูความคืบหน้าที่แท็บ TikTok Studio", "info");
  } catch (error) {
    setTestStatus("error: " + (error?.message || error), "error");
  } finally {
    if (button) button.disabled = false;
  }
}

async function savePostSettings() {
  if (isHydrating) return;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = readForm(settings.postDefaults);
  await chrome.storage.sync.set({
    settings: {
      ...settings,
      postDefaults
    }
  });

  helpers.showStatus?.("บันทึกการตั้งค่าโพสต์ TikTok แล้ว", "success");
  helpers.logActivity?.("อัปเดตค่าเริ่มต้นการโพสต์ TikTok", "success");
}

function fillForm(value) {
  isHydrating = true;
  const post = normalizePostSettings(value);
  setValue("post-caption-template", post.captionTemplate);
  setValue("post-hashtags", post.hashtags.join(", "));
  setChecked("post-auto-product-link", post.autoAddProductLink);
  setValue("post-after-create-action", post.afterCreateAction);
  setValue("post-default-mode", post.defaultMode);
  setValue("post-privacy", post.privacy);
  setValue("post-schedule-time", post.scheduleTime);
  setValue("post-location", post.location);
  setChecked("post-ai-generated", post.aiGenerated);
  setChecked("post-allow-comment", post.allowComment);
  setChecked("post-allow-reuse", post.allowReuse);
  setValue("post-shopee-csv-folder", post.shopeeCsvFolder || "shopee_exports");
  setValue("post-shopee-csv-filename", post.shopeeCsvFilename || "shopee_products.csv");
  syncScheduleState();
  syncPublishModeState();
  isHydrating = false;
}

function scheduleAutoSave() {
  if (isHydrating) return;
  window.clearTimeout(scheduleAutoSave.timer);
  scheduleAutoSave.timer = window.setTimeout(() => {
    savePostSettings().catch((error) => helpers.showStatus?.(error.message, "error"));
  }, 450);
}

function readForm(existingPostDefaults = {}) {
  const existing = normalizePostSettings(existingPostDefaults);
  return normalizePostSettings({
    captionTemplate: hasField("post-caption-template") ? getValue("post-caption-template") : existing.captionTemplate,
    hashtags: hasField("post-hashtags")
      ? getValue("post-hashtags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      : existing.hashtags,
    autoAddProductLink: hasField("post-auto-product-link") ? getChecked("post-auto-product-link") : existing.autoAddProductLink,
    afterCreateAction: getValue("post-after-create-action"),
    defaultMode: getValue("post-default-mode"),
    privacy: getValue("post-privacy"),
    scheduleTime: getValue("post-schedule-time"),
    location: getValue("post-location"),
    aiGenerated: true,
    allowComment: getChecked("post-allow-comment"),
    allowReuse: getChecked("post-allow-reuse"),
    shopeeCsvFolder: hasField("post-shopee-csv-folder") ? getValue("post-shopee-csv-folder") : existing.shopeeCsvFolder,
    shopeeCsvFilename: hasField("post-shopee-csv-filename") ? getValue("post-shopee-csv-filename") : existing.shopeeCsvFilename
  });
}

function hasField(id) {
  return Boolean(document.querySelector(`#${id}`));
}

function normalizePostSettings(value = {}) {
  const post = { ...DEFAULT_POST_SETTINGS, ...(value || {}) };
  const hashtags = Array.isArray(post.hashtags)
    ? post.hashtags
    : String(post.hashtags || "").split(",");

  return {
    ...post,
    captionTemplate: post.captionTemplate || DEFAULT_POST_SETTINGS.captionTemplate,
    hashtags: normalizeHashtags(hashtags, 4),
    afterCreateAction: post.afterCreateAction === "both"
      ? "draft"
      : (["download", "draft", "post"].includes(post.afterCreateAction) ? post.afterCreateAction : "post"),
    defaultMode: ["draft", "now", "schedule"].includes(post.defaultMode) ? post.defaultMode : "now",
    autoAddProductLink: post.autoAddProductLink !== false,
    aiGenerated: true,
    allowComment: post.allowComment !== false,
    allowReuse: post.allowReuse !== false,
    shopeeCsvFolder: post.shopeeCsvFolder || DEFAULT_POST_SETTINGS.shopeeCsvFolder,
    shopeeCsvFilename: post.shopeeCsvFilename || DEFAULT_POST_SETTINGS.shopeeCsvFilename
  };
}

function syncScheduleState() {
  const isSchedule = getValue("post-default-mode") === "schedule";
  const scheduleInput = document.querySelector("#post-schedule-time");
  if (scheduleInput) scheduleInput.disabled = !isSchedule;
}

function syncPublishModeState() {
  const modeSelect = document.querySelector("#post-default-mode");
  if (!modeSelect) return;
  syncScheduleState();
}

function getValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function setValue(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el) el.value = value ?? "";
}

function getChecked(id) {
  return document.querySelector(`#${id}`)?.checked ?? false;
}

function setChecked(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el) el.checked = Boolean(value);
}
