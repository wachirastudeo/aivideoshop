import { buildCaption, normalizeHashtags } from "../modules/prompt-builder.js";
import { generatePostCopy } from "../modules/image-analyzer.js";

const DEFAULT_POST_SETTINGS = {
  captionTemplate: "{product_name}",
  hashtags: ["#TikTokShop", "#ของดีบอกต่อ"],
  autoAddProductLink: true,
  afterCreateAction: "post",
  defaultMode: "post",
  privacy: "",
  scheduleTime: "",
  scheduleInterval: 10,
  location: "",
  aiGenerated: true,
  allowComment: true,
  allowReuse: true,
  postNoLink: false,
  postRandomCaptionHook: true,
  postCustomProductName: "",
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
  await checkSelectedProductForPost();
}

async function loadPostSettings() {
  const [{ settings = {} }, { creatorState = {} }] = await Promise.all([
    chrome.storage.sync.get("settings"),
    chrome.storage.local.get("creatorState")
  ]);
  return resolveMainPostSettings(normalizePostSettings(settings.postDefaults), creatorState.settings);
}

function bindEvents() {
  document.querySelector("#post-save-settings")?.addEventListener("click", savePostSettings);
  document.querySelector("#post-open-upload")?.addEventListener("click", openTikTokUpload);
  document.querySelector("#post-test-file")?.addEventListener("change", onTestFileChange);
  document.querySelector("#post-test-run")?.addEventListener("click", runTestUpload);
  document.querySelector("#post-test-generate-ai")?.addEventListener("click", () => generateAndFillCaptionAndHashtags());
  document.querySelector("#post-reset-settings")?.addEventListener("click", async () => {
    fillForm(DEFAULT_POST_SETTINGS);
    await savePostSettings();
  });

  document.querySelector("#post-default-mode")?.addEventListener("change", () => {
    syncPostModeFields("post-default-mode");
    syncScheduleState();
    scheduleAutoSave();
  });
  document.querySelector("#post-after-create-action")?.addEventListener("change", () => {
    syncPostModeFields("post-after-create-action");
    syncPublishModeState();
    scheduleAutoSave();
  });

  document.querySelectorAll(
    "#post-caption-template, #post-hashtags, #post-auto-product-link, #post-no-link, #post-random-caption-hook, #post-custom-product-name, #post-privacy, #post-schedule-time, #post-schedule-interval, #post-location, #post-allow-comment, #post-allow-reuse, #post-shopee-csv-folder, #post-shopee-csv-filename"
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
  const files = Array.from(event.target.files || []);
  const info = document.querySelector("#post-test-file-info");
  if (!info) return;
  if (!files.length) {
    info.textContent = "ยังไม่ได้เลือกไฟล์";
    return;
  }
  const totalMb = files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024;
  const names = files.slice(0, 3).map((file) => file.name).join(", ");
  info.textContent = `${files.length} คลิป — รวม ${totalMb.toFixed(2)} MB${names ? ` (${names}${files.length > 3 ? ", ..." : ""})` : ""}`;
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
  const files = Array.from(document.querySelector("#post-test-file")?.files || []);
  if (!files.length) {
    setTestStatus("กรุณาเลือกไฟล์วิดีโออย่างน้อย 1 คลิปก่อน", "error");
    return;
  }

  const productName = getValue("post-test-product-name").trim();
  const manualCaption = getValue("post-test-caption").trim();
  const manualHashtags = getValue("post-test-hashtags").trim();
  const productId = getValue("post-test-product-id").trim();
  const productUrl = getValue("post-test-product-url").trim();
  const [{ settings = {} }, { creatorState = {} }] = await Promise.all([
    chrome.storage.sync.get("settings"),
    chrome.storage.local.get("creatorState")
  ]);
  const postSettings = resolveMainPostSettings(readForm(settings.postDefaults), creatorState.settings);
  const action = postSettings.defaultMode || "draft";
  if (action === "download") {
    setTestStatus("โหมดหลักตั้งเป็นดาวน์โหลดอย่างเดียว จึงไม่ส่งเข้า TikTok Studio", "info");
    return;
  }
  const postType = action === "schedule" ? "schedule" : action === "draft" ? "draft" : "now";
  const uploadMode = postType === "now" || postType === "schedule" ? "post" : "draft";

  const defaultHashtags = normalizeHashtags(postSettings.hashtags, 5);
  const hashtags = manualHashtags
    ? normalizeHashtags(manualHashtags.split(",").map(t => t.trim()).filter(Boolean), 5)
    : defaultHashtags;

  const productInfo = {
    productId: postSettings.autoAddProductLink ? productId : "",
    productUrl: postSettings.autoAddProductLink ? productUrl : "",
    name: productName,
    originalName: productName,
    cta: "สั่งได้เลย"
  };

  let caption = manualCaption;
  let finalHashtags = hashtags;

  if (!caption) {
    const postCopy = await generatePostCopy(productInfo, postSettings);
    caption = postCopy.caption !== undefined ? postCopy.caption : buildCaption(productInfo, postSettings);
    finalHashtags = normalizeHashtags(postCopy.hashtags?.length ? postCopy.hashtags : hashtags, 5);
  }
  if (postType === "schedule" && !postSettings.scheduleTime) {
    setTestStatus("กรุณาเลือกเวลาโพสต์ก่อนตั้งเวลา", "error");
    return;
  }
  if (postType === "schedule") {
    const requestedDate = new Date(postSettings.scheduleTime);
    if (Number.isNaN(requestedDate.getTime())) {
      setTestStatus(`เวลาตั้งโพสต์ไม่ถูกต้อง: ${postSettings.scheduleTime}`, "error");
      return;
    }
    if (requestedDate.getTime() <= Date.now()) {
      setTestStatus("เวลาตั้งโพสต์ต้องเป็นเวลาในอนาคต", "error");
      return;
    }
  }

  try {
    if (button) button.disabled = true;
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const jobId = createTestJobId();
      const scheduleTime = postType === "schedule"
        ? offsetScheduleTime(postSettings.scheduleTime, index * (parseInt(postSettings.scheduleInterval, 10) || 10))
        : "";

      setTestStatus(`กำลังอ่านคลิป ${index + 1}/${files.length}: ${file.name}`, "info");
      const dataUrl = await fileToDataUrl(file);
      const payload = {
        jobId,
        videoUrl: dataUrl,
        filename: file.name,
        caption: caption || "โพสต์คลิปเอง",
        hashtags: finalHashtags,
        productId: postSettings.autoAddProductLink ? productId : "",
        productUrl: postSettings.autoAddProductLink ? productUrl : "",
        productName: postSettings.postCustomProductName || productName,
        isCustomProductName: Boolean(postSettings.postCustomProductName),
        mode: uploadMode,
        postType,
        scheduleTime,
        location: postSettings.location || "",
        privacy: postSettings.privacy || "",
        allowComment: postSettings.allowComment !== false,
        allowReuse: postSettings.allowReuse !== false
      };

      setTestStatus(`กำลังส่งคลิป ${index + 1}/${files.length} เข้า TikTok Studio...`, "info");
      const response = await chrome.runtime.sendMessage({ type: "TIKTOK_SEND_DRAFT", payload });
      if (!response?.ok) {
        throw new Error(response?.error || `ส่งคลิปที่ ${index + 1} ไม่สำเร็จ`);
      }

      setTestStatus(`กำลังรอผลคลิป ${index + 1}/${files.length} ก่อนส่งคลิปถัดไป...`, "info");
      const result = await waitForTestJob(jobId);
      if (result?.success === false) {
        throw new Error(result.error || `TikTok ทำงานกับคลิปที่ ${index + 1} ไม่สำเร็จ`);
      }
    }

    setTestStatus(`ส่งครบทั้ง ${files.length} คลิปแล้ว — ใช้สินค้าชิ้นเดิมตามที่ตั้งไว้`, "success");
  } catch (error) {
    setTestStatus("error: " + (error?.message || error), "error");
  } finally {
    if (button) button.disabled = false;
  }
}

function createTestJobId() {
  if (globalThis.crypto?.randomUUID) return `manual-${globalThis.crypto.randomUUID()}`;
  return `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function waitForTestJob(jobId, timeoutMs = 8 * 60 * 1000) {
  const storageKey = `tiktokJob:${jobId}`;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const stored = await chrome.storage.local.get(storageKey);
    const result = stored?.[storageKey];
    if (result) {
      await chrome.storage.local.remove(storageKey);
      return result;
    }
    await sleep(1000);
  }
  throw new Error("รอผลจาก TikTok นานเกินไป กรุณาตรวจสอบแท็บ TikTok Studio");
}

function offsetScheduleTime(value, minutesOffset) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setMinutes(date.getMinutes() + minutesOffset);
  const roundedMinutes = Math.round(date.getMinutes() / 5) * 5;
  date.setMinutes(roundedMinutes, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function savePostSettings() {
  if (isHydrating) return;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = readForm(settings.postDefaults);
  const { creatorState = {} } = await chrome.storage.local.get("creatorState");
  const action = postDefaults.defaultMode;
  await chrome.storage.sync.set({
    settings: {
      ...settings,
      postDefaults: {
        ...postDefaults,
        defaultMode: action,
        afterCreateAction: action
      }
    }
  });
  await chrome.storage.local.set({
    creatorState: {
      ...creatorState,
      settings: {
        ...(creatorState.settings || {}),
        postAction: action,
        postNoLink: !postDefaults.autoAddProductLink,
        postRandomCaptionHook: postDefaults.postRandomCaptionHook,
        postCustomProductName: postDefaults.postCustomProductName,
        postScheduleTime: postDefaults.scheduleTime,
        postScheduleInterval: postDefaults.scheduleInterval
      }
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
  setChecked("post-no-link", post.postNoLink || !post.autoAddProductLink);
  setChecked("post-random-caption-hook", post.postRandomCaptionHook);
  setValue("post-custom-product-name", post.postCustomProductName);
  setValue("post-after-create-action", post.afterCreateAction);
  setValue("post-default-mode", post.defaultMode);
  setValue("post-after-create-action", post.defaultMode);
  setValue("post-privacy", post.privacy);
  setValue("post-schedule-time", post.scheduleTime);
  setValue("post-schedule-interval", post.scheduleInterval ?? 10);
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
    ...existing,
    captionTemplate: hasField("post-caption-template") ? getValue("post-caption-template") : existing.captionTemplate,
    hashtags: hasField("post-hashtags")
      ? getValue("post-hashtags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
      : existing.hashtags,
    autoAddProductLink: hasField("post-no-link") ? !getChecked("post-no-link") : (hasField("post-auto-product-link") ? getChecked("post-auto-product-link") : existing.autoAddProductLink),
    afterCreateAction: normalizePostingAction(getValue("post-after-create-action") || getValue("post-default-mode") || existing.afterCreateAction),
    defaultMode: normalizePostingAction(getValue("post-default-mode") || getValue("post-after-create-action") || existing.defaultMode),
    privacy: getValue("post-privacy"),
    scheduleTime: getValue("post-schedule-time"),
    scheduleInterval: hasField("post-schedule-interval") ? (parseInt(getValue("post-schedule-interval"), 10) || 10) : existing.scheduleInterval,
    location: getValue("post-location"),
    aiGenerated: true,
    allowComment: getChecked("post-allow-comment"),
    allowReuse: getChecked("post-allow-reuse"),
    postNoLink: hasField("post-no-link") ? getChecked("post-no-link") : existing.postNoLink,
    postRandomCaptionHook: hasField("post-random-caption-hook") ? getChecked("post-random-caption-hook") : existing.postRandomCaptionHook,
    postCustomProductName: hasField("post-custom-product-name") ? getValue("post-custom-product-name").trim() : existing.postCustomProductName,
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

  const defaultMode = normalizePostingAction(post.defaultMode || post.afterCreateAction);
  return {
    ...post,
    captionTemplate: post.captionTemplate || DEFAULT_POST_SETTINGS.captionTemplate,
    hashtags: normalizeHashtags(hashtags, 4),
    afterCreateAction: defaultMode,
    defaultMode,
    autoAddProductLink: post.autoAddProductLink !== false,
    scheduleInterval: parseInt(post.scheduleInterval, 10) || 10,
    aiGenerated: true,
    allowComment: post.allowComment !== false,
    allowReuse: post.allowReuse !== false,
    postNoLink: Boolean(post.postNoLink),
    postRandomCaptionHook: post.postRandomCaptionHook !== undefined ? Boolean(post.postRandomCaptionHook) : true,
    postCustomProductName: String(post.postCustomProductName || "").trim(),
    shopeeCsvFolder: post.shopeeCsvFolder || DEFAULT_POST_SETTINGS.shopeeCsvFolder,
    shopeeCsvFilename: post.shopeeCsvFilename || DEFAULT_POST_SETTINGS.shopeeCsvFilename
  };
}

function normalizePostingAction(value) {
  if (value === "now") return "post";
  return ["download", "draft", "post", "schedule"].includes(value) ? value : "post";
}

function resolveMainPostSettings(postDefaults = {}, mainSettings = {}) {
  const normalizedDefaults = normalizePostSettings(postDefaults);
  const hasMainNoLink = typeof mainSettings?.postNoLink === "boolean";
  const mainAction = mainSettings && ["download", "draft", "post", "schedule"].includes(mainSettings.postAction)
    ? mainSettings.postAction
    : normalizedDefaults.defaultMode;
  return normalizePostSettings({
    ...normalizedDefaults,
    defaultMode: mainAction,
    afterCreateAction: mainAction,
    scheduleTime: mainSettings?.postScheduleTime || normalizedDefaults.scheduleTime,
    scheduleInterval: mainSettings?.postScheduleInterval || normalizedDefaults.scheduleInterval,
    autoAddProductLink: hasMainNoLink ? !mainSettings.postNoLink : normalizedDefaults.autoAddProductLink,
    postNoLink: hasMainNoLink ? mainSettings.postNoLink : normalizedDefaults.postNoLink,
    postRandomCaptionHook: mainSettings?.postRandomCaptionHook !== undefined ? mainSettings.postRandomCaptionHook : normalizedDefaults.postRandomCaptionHook,
    postCustomProductName: mainSettings?.postCustomProductName || normalizedDefaults.postCustomProductName
  });
}

function syncPostModeFields(sourceId) {
  const action = normalizePostingAction(getValue(sourceId));
  setValue("post-default-mode", action);
  setValue("post-after-create-action", action);
  syncScheduleState();
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

async function checkSelectedProductForPost() {
  const stored = await chrome.storage.local.get("selectedProductForPost");
  if (stored.selectedProductForPost) {
    const product = stored.selectedProductForPost;
    setValue("post-test-product-name", product.name || product.originalName || "");
    setValue("post-test-product-id", product.productId || "");
    setValue("post-test-product-url", product.productUrl || "");
    
    await chrome.storage.local.remove("selectedProductForPost");
    helpers.showStatus?.("ดึงข้อมูลสินค้ามาป้อนให้เรียบร้อยแล้ว กำลังสร้าง Caption...", "success");

    // ดึง/สร้าง Caption และ Hashtags ให้อัตโนมัติทันที
    await generateAndFillCaptionAndHashtags(product);
  }
}

async function generateAndFillCaptionAndHashtags(product = null) {
  const productName = getValue("post-test-product-name").trim();
  const productId = getValue("post-test-product-id").trim();
  const productUrl = getValue("post-test-product-url").trim();

  if (!productName) {
    setTestStatus("กรุณากรอกชื่อสินค้าเพื่อสร้าง Caption", "error");
    return;
  }

  setTestStatus("กำลังสร้าง Caption และ Hashtags ด้วย AI/Template...", "info");
  const generateBtn = document.querySelector("#post-test-generate-ai");
  if (generateBtn) generateBtn.disabled = true;

  try {
    const [{ settings = {} }, { creatorState = {} }] = await Promise.all([
      chrome.storage.sync.get("settings"),
      chrome.storage.local.get("creatorState")
    ]);
    const postSettings = resolveMainPostSettings(normalizePostSettings(settings.postDefaults), creatorState.settings);
    const defaultsHashtags = normalizeHashtags(postSettings.hashtags, 5);

    const productInfo = {
      productId,
      productUrl,
      name: productName,
      originalName: productName,
      cta: "สั่งได้เลย",
      ...(product || {})
    };

    const postCopy = await generatePostCopy(productInfo, postSettings);
    const caption = postCopy.caption !== undefined ? postCopy.caption : buildCaption(productInfo, postSettings);
    const finalHashtags = normalizeHashtags(postCopy.hashtags?.length ? postCopy.hashtags : defaultsHashtags, 5);

    setValue("post-test-caption", caption);
    setValue("post-test-hashtags", finalHashtags.join(", "));
    setTestStatus("สร้าง Caption และ Hashtags สำเร็จ", "success");
  } catch (error) {
    setTestStatus("สร้างข้อความล้มเหลว: " + (error?.message || error), "error");
  } finally {
    if (generateBtn) generateBtn.disabled = false;
  }
}
