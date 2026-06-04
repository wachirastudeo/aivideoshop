import { normalizeHashtags } from "../modules/prompt-builder.js";

const DEFAULT_POST_SETTINGS = {
  captionTemplate: "{product_name}\n{product_details}\n{cta}",
  hashtags: ["#TikTokShop", "#ของดีบอกต่อ"],
  autoAddProductLink: true,
  afterCreateAction: "post",
  defaultMode: "now",
  privacy: "",
  scheduleTime: "",
  location: "",
  aiGenerated: true,
  allowComment: true,
  allowReuse: true
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
    "#post-caption-template, #post-hashtags, #post-auto-product-link, #post-privacy, #post-schedule-time, #post-location, #post-allow-comment, #post-allow-reuse"
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

async function savePostSettings() {
  if (isHydrating) return;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = readForm();
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

function readForm() {
  return normalizePostSettings({
    captionTemplate: getValue("post-caption-template"),
    hashtags: getValue("post-hashtags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    autoAddProductLink: getChecked("post-auto-product-link"),
    afterCreateAction: getValue("post-after-create-action"),
    defaultMode: getValue("post-default-mode"),
    privacy: getValue("post-privacy"),
    scheduleTime: getValue("post-schedule-time"),
    location: getValue("post-location"),
    aiGenerated: true,
    allowComment: getChecked("post-allow-comment"),
    allowReuse: getChecked("post-allow-reuse")
  });
}

function normalizePostSettings(value = {}) {
  const post = { ...DEFAULT_POST_SETTINGS, ...(value || {}) };
  const hashtags = Array.isArray(post.hashtags)
    ? post.hashtags
    : String(post.hashtags || "").split(",");

  return {
    ...post,
    captionTemplate: post.captionTemplate || DEFAULT_POST_SETTINGS.captionTemplate,
    hashtags: normalizeHashtags(hashtags),
    afterCreateAction: post.afterCreateAction === "both"
      ? "draft"
      : (["download", "draft", "post"].includes(post.afterCreateAction) ? post.afterCreateAction : "post"),
    defaultMode: ["draft", "now", "schedule"].includes(post.defaultMode) ? post.defaultMode : "now",
    autoAddProductLink: post.autoAddProductLink !== false,
    aiGenerated: true,
    allowComment: post.allowComment !== false,
    allowReuse: post.allowReuse !== false
  };
}

function syncScheduleState() {
  const isSchedule = getValue("post-default-mode") === "schedule";
  const scheduleInput = document.querySelector("#post-schedule-time");
  if (scheduleInput) scheduleInput.disabled = !isSchedule;
}

function syncPublishModeState() {
  const action = getValue("post-after-create-action");
  const modeSelect = document.querySelector("#post-default-mode");
  if (!modeSelect) return;

  modeSelect.disabled = action !== "post";
  if (action === "draft") {
    modeSelect.value = "draft";
  }
  if (action === "post" && modeSelect.value === "draft") {
    modeSelect.value = "now";
  }
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
