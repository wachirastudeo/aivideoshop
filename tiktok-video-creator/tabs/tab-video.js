import {
  VIDEO_STYLES,
  buildImagePrompt,
  buildVideoPrompt,
  getDefaultSettings,
  resolveProductUrl,
  buildCaption,
  buildPostHashtags,
  normalizeHashtags,
  truncateShopeeCaptionAndHashtags
} from "../modules/prompt-builder.js";
import { analyzeProductImages, fileToDataUrl } from "../modules/image-analyzer.js";
import { openGoogleFlow } from "../modules/google-flow.js";
import { downloadVideo, publishVideo, scheduleVideo, sendVideoToTikTokStudio } from "../modules/video-output.js";

const MOODS = ["Auto", "สดใส", "หรูหรา", "น่ารัก", "Professional", "Trendy", "มินิมัล", "Dark & Moody"];
const RUNNING_STATUSES = new Set(["image_generating", "video_generating", "flow1", "flow2"]);
const POST_RETRY_ATTEMPTS = 2;
const POST_RETRY_DELAY_MS = 60000;
const FLOW_LOGIN_RETRY_MS = 5000;

let helpers = {};
let settings = getDefaultSettings();
let productQueue = [];
let isProcessing = false;
let stopRequested = false;
const stopWaiters = new Set();

export async function initVideoTab(injectedHelpers) {
  helpers = injectedHelpers;
  const stored = await chrome.storage.local.get(["creatorState", "productQueue"]);
  const { settings: savedOptions = {} } = await chrome.storage.sync.get("settings");

  const optionDefaults = {
    videoStyle: savedOptions.defaultVideoStyle || "testimonial",
    presenter: savedOptions.defaultPresenter || "Auto",
    voiceTone: savedOptions.defaultVoiceTone || "Auto",
    language: savedOptions.defaultLanguage || "ไทย",
    imageModel: savedOptions.flow?.imageModel || "nano-banana-pro",
    videoModel: savedOptions.flow?.videoModel || "veo-3.1-lite-low-priority",
    imageCount: savedOptions.flow?.imageCount || 1,
    videoCount: savedOptions.flow?.videoCount || 1,
    postAction: savedOptions.postDefaults?.afterCreateAction || "post",
    videoRefMode: "ingredients",
    ...(savedOptions.mediaSettings || {})
  };

  settings = normalizeSettings({
    ...getDefaultSettings(),
    ...optionDefaults,
    ...(stored.creatorState?.settings || {})
  });
  productQueue = resetStaleStatuses(normalizeProductQueue(stored.productQueue));

  populateStyleDropdown();
  renderPills("mood-pills", MOODS, settings.mood, (value) => updateSettings({ mood: value }));
  bindGlobalEvents();
  fillGlobalFormFromState();
  renderQueue();
}

export async function syncSelectedProductToVideoTab() {
  const stored = await chrome.storage.local.get(["productQueue"]);
  productQueue = resetStaleStatuses(normalizeProductQueue(stored.productQueue));
  renderQueue();
  await persistState();
  helpers.logActivity?.(`โหลดคิวสินค้าใหม่: ${productQueue.length} รายการ`, "success");
}

function bindGlobalEvents() {
  [
    "video-style", "presenter", "custom-presenter", "voice-tone", "location", "custom-location",
    "text-enabled", "clip-text", "promotion-text", "text-position", "camera-movement",
    "image-count", "video-count", "video-duration", "aspect-ratio", "post-action", "post-no-link",
    "post-schedule-date", "post-schedule-time", "post-schedule-interval", "image-model", "video-model", "video-ref-mode", "flow-gen-mode"
  ].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (!el) return;
    el.addEventListener("input", syncSettingsForm);
    el.addEventListener("change", syncSettingsForm);
  });

  document.querySelector("#btn-batch-create")?.addEventListener("click", () => processQueue());
  document.querySelector("#btn-batch-clear")?.addEventListener("click", () => {
    clearVideoQueue().catch((error) => helpers.showStatus(error.message, "error"));
  });
  document.querySelector("#btn-batch-stop")?.addEventListener("click", () => {
    requestStop().catch(() => {});
  });
}

function fillGlobalFormFromState() {
  setValue("video-style", settings.videoStyle);
  setValue("presenter", settings.presenter);
  setValue("custom-presenter", settings.customPresenter);
  setValue("voice-tone", settings.voiceTone);
  setValue("location", settings.location);
  setValue("custom-location", settings.customLocation);
  setValue("text-enabled", settings.textEnabled);
  setValue("clip-text", settings.clipText);
  setValue("promotion-text", settings.promotionText);
  setValue("text-position", settings.textPosition);
  setValue("text-style-font", settings.textStyleFont);
  setValue("camera-movement", settings.cameraMovement);
  setValue("image-model", settings.imageModel);
  setValue("video-model", settings.videoModel);
  setValue("image-count", settings.imageCount);
  setValue("video-count", settings.videoCount);
  setValue("video-duration", settings.videoDuration);
  setValue("aspect-ratio", settings.aspectRatio);
  setValue("video-ref-mode", settings.videoRefMode);
  setValue("flow-gen-mode", settings.flowGenMode);
  setValue("post-action", settings.postAction);
  setValue("post-no-link", settings.postNoLink);
  setValue("post-custom-product-name", settings.postCustomProductName);

  let dt;
  if (settings.postScheduleTime) {
    dt = new Date(settings.postScheduleTime);
    if (Number.isNaN(dt.getTime())) dt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
  } else {
    dt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
  }
  setValue("post-schedule-date", toInputDate(dt));
  setValue("post-schedule-time", toInputTime(dt));
  setValue("post-schedule-interval", settings.postScheduleInterval || 10);

  syncVideoTextSettingsVisibility();
  syncCustomLocationVisibility();
  syncCustomPresenterVisibility();
  syncScheduleTimeVisibility();
}

function syncSettingsForm() {
  const dateVal = getValue("post-schedule-date");
  const timeVal = getValue("post-schedule-time") || "00:00";
  const combinedTime = (dateVal && timeVal) ? `${dateVal}T${timeVal}` : "";

  settings = normalizeSettings({
    ...settings,
    videoStyle: getValue("video-style"),
    presenter: getValue("presenter"),
    customPresenter: getValue("custom-presenter"),
    voiceTone: getValue("voice-tone"),
    location: getValue("location"),
    customLocation: getValue("custom-location"),
    textEnabled: getValue("text-enabled"),
    clipText: getValue("clip-text"),
    promotionText: getValue("promotion-text"),
    textPosition: getValue("text-position"),
    textStyleFont: getValue("text-style-font"),
    cameraMovement: getValue("camera-movement"),
    imageModel: getValue("image-model"),
    videoModel: getValue("video-model"),
    imageCount: parseInt(getValue("image-count"), 10) || 1,
    videoCount: parseInt(getValue("video-count"), 10) || 1,
    videoDuration: parseInt(getValue("video-duration"), 10) || 8,
    aspectRatio: getValue("aspect-ratio") || "9:16",
    videoRefMode: getValue("video-ref-mode") || "frames",
    flowGenMode: getValue("flow-gen-mode") || "combined",
    postAction: getValue("post-action"),
    postNoLink: getValue("post-no-link"),
    postCustomProductName: getValue("post-custom-product-name"),
    postScheduleTime: combinedTime,
    postScheduleInterval: parseInt(getValue("post-schedule-interval"), 10) || 10
  });

  renderQueue();
  syncVideoTextSettingsVisibility();
  syncCustomLocationVisibility();
  syncScheduleTimeVisibility();
  syncCustomPresenterVisibility();
  persistState();
}

function updateSettings(patch) {
  settings = normalizeSettings({ ...settings, ...patch });
  renderQueue();
  persistState();
}

function normalizeProductQueue(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      let displayImageUrl = item.displayImageUrl || item.imageUrls?.[0] || "";
      let flowImageUrl = item.flowImageUrl || item.imageUrls?.[0] || "";
      if (displayImageUrl.startsWith("//")) displayImageUrl = "https:" + displayImageUrl;
      if (flowImageUrl.startsWith("//")) flowImageUrl = "https:" + flowImageUrl;
      const imageUrls = (item.imageUrls || []).map(url => url.startsWith("//") ? "https:" + url : url);
      return {
        ...item,
        status: normalizeStatus(item.status),
        errorMessage: item.errorMessage || "",
        flowImageTileId: item.flowImageTileId || "",
        flowVideoTileId: item.flowVideoTileId || "",
        approvedImage: item.approvedImage || "",
        videoUrl: item.videoUrl || "",
        productId: item.productId || item.product_id || item.id || "",
        product_id: item.productId || item.product_id || item.id || "",
        productUrl: resolveProductUrl(item),
        displayImageUrl,
        flowImageUrl,
        imageUrls: imageUrls.length > 0 ? imageUrls : ["assets/icon.svg"],
        originalName: item.originalName || item.productLinkTitle || item.rawProduct?.title || item.rawProduct?.product_name || item.rawProduct?.name || item.name || "",
        productLinkTitle: item.productLinkTitle || item.originalName || item.rawProduct?.title || item.rawProduct?.product_name || item.rawProduct?.name || item.name || "",
        shopName: item.shopName || "",
        category: item.category || "",
        details: item.details || "",
        structureAdvice: item.structureAdvice || "",
        promptAdvice: item.promptAdvice || "",
        autoOptions: item.autoOptions && typeof item.autoOptions === "object" ? item.autoOptions : null
      };
    });
}

function normalizeStatus(status) {
  if (status === "flow1") return "image_generating";
  if (status === "flow2") return "video_generating";
  return status || "idle";
}

// เมื่อ panel โหลดใหม่ ไม่มีงานไหนรันค้างข้าม reload — สถานะ in-progress ที่ค้างให้ปรับลงเป็นสถานะพัก
// (ไม่งั้นการ์ดจะค้าง "กำลังทำภาพ/วิดีโอ" ตลอดทั้งที่ไม่มีอะไรทำงาน)
function resetStaleStatuses(queue) {
  return queue.map((p) => {
    if (!RUNNING_STATUSES.has(p.status)) return p;
    let status = "prompt_ready";
    if (p.videoUrl) status = "done";
    else if (p.approvedImage || p.flowImageTileId) status = "image_done";
    return { ...p, status, errorMessage: "" };
  });
}

function normalizeSettings(value) {
  return {
    ...value,
    language: "ไทย",
    textEnabled: value.textEnabled === true || value.textEnabled === "true" ? "true" : "false",
    clipText: (value.clipText || "").trim(),
    cta: "กดสั่งซื้อที่ตะกร้าด้านล่าง",
    customCta: "",
    location: value.location || "Auto",
    customLocation: value.customLocation || "",
    customPresenter: value.customPresenter || "",
    pacing: value.pacing || 2,
    transition: value.transition || "Auto",
    imageModel: value.imageModel || "nano-banana-pro",
    videoModel: value.videoModel || "veo-3.1-lite-low-priority",
    imageCount: value.imageCount || 1,
    videoCount: value.videoCount || 1,
    videoDuration: value.videoDuration || 8,
    aspectRatio: value.aspectRatio || "9:16",
    videoRefMode: value.videoRefMode === "ingredients" ? "ingredients" : "frames",
    flowGenMode: value.flowGenMode === "video" ? "video" : "combined",
    postAction: value.postAction === "both" ? "draft" : (value.postAction || "post"),
    postNoLink: Boolean(value.postNoLink),
    postCustomProductName: (value.postCustomProductName || "").trim(),
    textStyleFont: value.textStyleFont || "handwriting",
    postScheduleTime: value.postScheduleTime || "",
    postScheduleInterval: parseInt(value.postScheduleInterval, 10) || 10
  };
}

function syncScheduleTimeVisibility() {
  const action = getValue("post-action");
  const container = document.querySelector("#schedule-time-container");
  if (container) {
    container.style.display = action === "schedule" ? "block" : "none";
  }
}

function syncVideoTextSettingsVisibility() {
  const enabled = getValue("text-enabled") === "true";
  document.querySelectorAll(".video-text-setting").forEach((field) => {
    field.hidden = !enabled;
  });
}

function syncCustomLocationVisibility() {
  const customEnabled = getValue("location") === "กรอกเอง";
  document.querySelectorAll(".custom-location-setting").forEach((field) => {
    field.hidden = !customEnabled;
  });
}

function syncCustomPresenterVisibility() {
  const customEnabled = getValue("presenter") === "กรอกเอง";
  document.querySelectorAll(".custom-presenter-setting").forEach((field) => {
    field.hidden = !customEnabled;
  });
}

function populateStyleDropdown() {
  const select = document.querySelector("#video-style");
  if (!select) return;
  select.innerHTML = VIDEO_STYLES.map((style) => `
    <option value="${style.id}">${style.emoji} ${style.name} - ${style.description}</option>
  `).join("");
  select.insertAdjacentHTML("afterbegin", `<option value="Auto">อัตโนมัติ</option>`);
  select.value = settings.videoStyle;
}

function renderPills(rootId, values, activeValue, onSelect) {
  const root = document.querySelector(`#${rootId}`);
  if (!root) return;
  root.innerHTML = values.map((value) => `
    <button class="pill ${value === activeValue ? "pill--active" : ""}" type="button" data-value="${escapeHtml(value)}">${escapeHtml(value)}</button>
  `).join("");
  root.querySelectorAll("[data-value]").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(button.dataset.value);
      renderPills(rootId, values, button.dataset.value, onSelect);
    });
  });
}

function renderQueue() {
  productQueue = normalizeProductQueue(productQueue);
  const queueCount = document.querySelector("#queue-count");
  const readyCount = document.querySelector("#ready-count");
  if (queueCount) queueCount.textContent = productQueue.length;
  if (readyCount) readyCount.textContent = productQueue.filter((p) => p.status !== "done" && p.status !== "error").length;
  syncClearButtonState();
  syncPostActionUI();

  const list = document.querySelector("#batch-product-list");
  if (!list) return;

  if (productQueue.length === 0) {
    list.innerHTML = `<div class="empty-state">ยังไม่ได้เลือกสินค้า ไปที่แท็บสินค้า TikTok แล้วเลือกสินค้าที่ต้องการสร้างวิดีโอ</div>`;
    return;
  }

  list.innerHTML = productQueue.map(productMarkup).join("");
  bindBatchEvents();
}

function syncPostActionUI() {
  const select = document.querySelector("#post-action");
  if (!select) return;

  const allShopee = productQueue.length > 0 && productQueue.every(p => p.source === "shopee" || (p.productUrl && /shopee\.co\.th/i.test(p.productUrl)));
  const draftOpt = select.querySelector('option[value="draft"]');
  const postOpt = select.querySelector('option[value="post"]');
  const scheduleOpt = select.querySelector('option[value="schedule"]');

  if (allShopee) {
    if (draftOpt) draftOpt.disabled = true;
    if (postOpt) postOpt.disabled = true;
    if (scheduleOpt) scheduleOpt.disabled = true;
    select.value = "download";
    settings.postAction = "download";
  } else {
    if (draftOpt) draftOpt.disabled = false;
    if (postOpt) postOpt.disabled = false;
    if (scheduleOpt) scheduleOpt.disabled = false;
  }
}

function truncateText(str, maxLen = 30) {
  if (!str) return "";
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "...";
}

function getOrGenerateHooks(p) {
  if (p.hooks && p.hooks.length > 0) return p.hooks;
  const name = p.originalName || p.name || "";
  if (!name) return [];
  return [
    name,
    `ชี้เป้าสุดคุ้ม: ${name}`,
    `รีวิวผู้ใช้จริง: ${name}`,
    `หลังจากลอง ${name}`,
    `ของมันต้องมี: ${name}`
  ].map(h => h.trim());
}

function productMarkup(p, index) {
  const sourceImage = getDisplayProductImage(p);
  const approvedImage = p.approvedImage || "";
  const imagePrompt = buildImagePrompt(p, settings);
  const videoPrompt = buildVideoPrompt(p, settings);
  const status = getStatusMeta(p.status);
  const isVideoOnly = settings.flowGenMode === "video";
  const imageDone = Boolean(isVideoOnly || approvedImage || p.flowImageTileId || p.status === "done" || p.status === "video_generating");

  const postButtonText = getActionButtonText(settings.postAction || "download");

  // แสดงเฉพาะ URL ที่ <img> โหลดได้จริง (http/https/data) — กัน bare tos key ที่ขึ้นรูปแตก
  const loadable = (Array.isArray(p.imageUrls) ? p.imageUrls : [])
    .map((u) => (typeof u === "string" && u.startsWith("//")) ? "https:" + u : u)
    .filter((u) => typeof u === "string" && (/^https?:\/\//i.test(u) || u.startsWith("data:")));
  const galleryImages = (loadable.length ? loadable : [sourceImage]).filter(Boolean);
  const galleryMarkup = galleryImages.map((url, i) => `
        <figure class="media-tile">
          <img src="${escapeAttr(url)}" data-fallback="${escapeAttr(sourceImage)}" alt="" width="180" height="240">
          <figcaption>ภาพ ${i + 1}/${galleryImages.length}</figcaption>
        </figure>`).join("");

  const hooks = getOrGenerateHooks(p);
  const uniqueHooks = hooks.filter(h => h.trim() !== (p.originalName || "").trim());
  const currentName = (p.name || "").trim();
  const activeHook = uniqueHooks.find(h => h.trim() === currentName) || "";

  const hookDropdownMarkup = uniqueHooks.length > 0 ? `
    <div class="hook-container">
      <label class="field">
        <span class="field__label">ตัวเลือก Hook ขายของ</span>
        <select class="select batch-hook-select">
          <option value="none" ${!activeHook ? 'selected' : ''}>ไม่ใช้ Hook (ใช้ชื่อปกติ: ${escapeHtml(truncateText(p.originalName || p.name || "", 25))})</option>
          ${uniqueHooks.map(h => {
            const isSelected = h.trim() === currentName;
            return `<option value="${escapeAttr(h)}" ${isSelected ? 'selected' : ''}>${escapeHtml(h)}</option>`;
          }).join("")}
        </select>
      </label>
    </div>
  ` : "";

  return `
    <article class="flow-job" data-index="${index}" data-status="${escapeHtml(p.status)}">
      <header class="flow-job__header">
        <img class="flow-job__thumb" src="${escapeAttr(sourceImage)}" data-fallback="assets/icon.svg" alt="" width="64" height="64">
        <div class="flow-job__title">
          <h3>${escapeHtml(p.name || "ไม่มีชื่อสินค้า")}</h3>
          <span class="badge ${status.className}">${status.label}</span>
        </div>
        <button class="icon-button batch-remove" type="button" title="ลบออกจากคิว" aria-label="ลบออกจากคิว">${xIcon()}</button>
      </header>

      <div class="flow-steps" aria-label="Image generation step" ${isVideoOnly ? 'style="display: none;"' : ''}>
        ${stepMarkup("1", "ภาพ", imageDone, p.status === "image_generating")}
      </div>

      <div class="flow-job__grid">${galleryMarkup}
      </div>

      <div class="flow-job__body">
        <label class="field">
          <span class="field__label">ชื่อสินค้า / Hook</span>
          <input class="input batch-name" value="${escapeAttr(p.name || "")}">
        </label>

        ${hookDropdownMarkup}

        <label class="field">
          <span class="field__label">จุดขาย / ไฮไลต์</span>
          <textarea class="textarea batch-highlights" rows="2" placeholder="จุดเด่นสินค้า...">${escapeHtml(p.highlights || "")}</textarea>
        </label>

        <div class="prompt-grid" ${isVideoOnly ? 'style="grid-template-columns: 1fr;"' : ''}>
          <label class="field" ${isVideoOnly ? 'style="display: none;"' : ''}>
            <span class="field__label">Prompt ภาพ</span>
            <textarea class="textarea prompt-textarea batch-image-prompt" rows="5" readonly>${escapeHtml(imagePrompt)}</textarea>
          </label>
          <label class="field">
            <span class="field__label">Prompt วิดีโอ</span>
            <textarea class="textarea prompt-textarea batch-prompt" rows="5" readonly>${escapeHtml(videoPrompt)}</textarea>
          </label>
        </div>

        <label class="field upload-field">
          <span class="field__label">${isVideoOnly ? "เปลี่ยนภาพอ้างอิงวิดีโอ" : "ใส่ภาพ Phase 1 เอง"}</span>
          <span class="button button--ghost button--full file-button">
            ${imageIcon()} อัพโหลดภาพ
            <input type="file" class="batch-upload-approved" accept="image/png,image/jpeg,image/webp">
          </span>
        </label>

        ${p.errorMessage ? `<p class="flow-error">${escapeHtml(p.errorMessage)}</p>` : ""}

        <div class="inline-actions flow-job__actions">
          <button class="button batch-analyze" type="button">${sparkIcon()} วิเคราะห์จุดขาย</button>
          <button class="button batch-copy" type="button">${copyIcon()} คัดลอก Prompt</button>
          <button class="button button--danger batch-stop" type="button" ${RUNNING_STATUSES.has(p.status) ? "" : "hidden"}>${stopIcon()} หยุด</button>
        </div>
      </div>
    </article>
  `;
}

function stepMarkup(number, label, done, running) {
  const state = done ? "done" : running ? "running" : "idle";
  return `
    <div class="flow-step flow-step--${state}">
      <span>${number}</span>
      <strong>${label}</strong>
    </div>
  `;
}

function bindBatchEvents() {
  const list = document.querySelector("#batch-product-list");
  if (!list) return;

  // รูปโหลดไม่ได้ → สลับไป fallback (MV3 บล็อก inline onerror จึงผูกที่นี่)
  list.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const fb = img.dataset.fallback;
      if (fb && img.getAttribute("src") !== fb) { img.src = fb; }
      else { img.src = "assets/icon.svg"; }
    });
  });

  list.querySelectorAll(".flow-job").forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    const p = productQueue[idx];
    if (!p) return;

    const nameInput = item.querySelector(".batch-name");
    const hookSelect = item.querySelector(".batch-hook-select");

    nameInput?.addEventListener("input", (e) => {
      const val = e.target.value;
      p.name = val;
      p.status = p.status === "idle" ? "prompt_ready" : p.status;
      updatePrompts(item, p);
      persistState();
      renderCountersOnly();

      // Sync selection in hook dropdown
      if (hookSelect) {
        let found = false;
        const trimmedVal = val.trim();
        for (let i = 1; i < hookSelect.options.length; i++) {
          if (hookSelect.options[i].value.trim() === trimmedVal) {
            hookSelect.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found) {
          hookSelect.value = "none";
        }
      }
    });

    hookSelect?.addEventListener("change", (e) => {
      const selectedVal = e.target.value;
      if (selectedVal === "none") {
        p.name = p.originalName || "";
      } else {
        p.name = selectedVal;
      }
      if (nameInput) nameInput.value = p.name;

      p.status = p.status === "idle" ? "prompt_ready" : p.status;
      updatePrompts(item, p);
      persistState();
      renderCountersOnly();
    });
    item.querySelector(".batch-highlights")?.addEventListener("input", (e) => {
      p.highlights = e.target.value;
      p.status = p.status === "idle" ? "prompt_ready" : p.status;
      updatePrompts(item, p);
      persistState();
      renderCountersOnly();
    });
    item.querySelector(".batch-analyze")?.addEventListener("click", () => handleAnalyze(p));
    item.querySelector(".batch-copy")?.addEventListener("click", () => copyPrompts(item));
    item.querySelector(".batch-stop")?.addEventListener("click", () => handleStop(p));
    item.querySelector(".batch-upload-approved")?.addEventListener("change", (e) => handleUploadApproved(e, p));
    item.querySelector(".batch-remove")?.addEventListener("click", () => {
      productQueue.splice(idx, 1);
      renderQueue();
      persistState();
    });
  });
}

function updatePrompts(itemEl, product) {
  const imagePrompt = itemEl.querySelector(".batch-image-prompt");
  const videoPrompt = itemEl.querySelector(".batch-prompt");
  if (imagePrompt) imagePrompt.value = buildImagePrompt(product, settings);
  if (videoPrompt) videoPrompt.value = buildVideoPrompt(product, settings);
}

async function copyPrompts(itemEl) {
  const imagePrompt = itemEl.querySelector(".batch-image-prompt")?.value || "";
  const videoPrompt = itemEl.querySelector(".batch-prompt")?.value || "";
  await navigator.clipboard.writeText(`IMAGE PROMPT\n${imagePrompt}\n\nVIDEO PROMPT\n${videoPrompt}`);
  helpers.showStatus("คัดลอก Prompt แล้ว", "success");
}

function getStatusMeta(status) {
  switch (status) {
    case "prompt_ready": return { label: "พร้อมทำ", className: "badge--ready" };
    case "analyzed": return { label: "วิเคราะห์แล้ว", className: "badge--ready" };
    case "image_generating": return { label: "กำลังทำภาพ", className: "badge--running" };
    case "image_done": return { label: "ภาพพร้อม", className: "badge--ready" };
    case "video_generating": return { label: "กำลังทำวิดีโอ", className: "badge--running" };
    case "post_blocked": return { label: "รอแก้ Error", className: "badge--error" };
    case "done": return { label: "พร้อมโพสต์", className: "badge--success" };
    case "error": return { label: "Error", className: "badge--error" };
    default: return { label: "รอดำเนินการ", className: "" };
  }
}

async function handleAnalyze(product) {
  try {
    helpers.showStatus("กำลังวิเคราะห์ด้วย AI...", "info");
    const analysis = await analyzeProductImages(getAnalysisProductImages(product), product);
    // ไม่เขียน highlights ทับ — ให้ผู้ใช้กรอกเอง
    product.name = analysis.name || product.name;
    product.hooks = analysis.hooks || [];
    product.targetGroup = analysis.targetGroup || product.targetGroup;
    product.structureAdvice = analysis.structureAdvice || product.structureAdvice || "";
    product.promptAdvice = analysis.promptAdvice || product.promptAdvice || "";
    product.autoOptions = analysis.autoOptions || product.autoOptions || null;
    product.status = "analyzed";
    product.errorMessage = "";
    await persistState();
    renderQueue();
    helpers.showStatus("วิเคราะห์เสร็จสิ้น", "success");
  } catch (err) {
    product.status = "error";
    product.errorMessage = err.message;
    await persistState();
    renderQueue();
    helpers.showStatus(err.message, "error");
  }
}

async function handleUploadApproved(event, product) {
  const [file] = [...event.target.files];
  if (!file) return;
  product.approvedImage = await fileToDataUrl(file);
  product.status = "image_done";
  product.errorMessage = "";
  await persistState();
  renderQueue();
  helpers.showStatus("อัพโหลดภาพ Phase 1 สำเร็จ", "success");
}

async function launchFlow(phase, product) {
  try {
    const prompt = phase === "image" ? buildImagePrompt(product, settings) : buildVideoPrompt(product, settings);
    const image = phase === "image" ? getFlowProductImage(product) : (product.approvedImage || getFlowProductImage(product));
    product.status = phase === "image" ? "image_generating" : "video_generating";
    product.errorMessage = "";
    await persistState();
    renderQueue();

    // วิดีโอต้องใช้รูปในกล่อง "ภาพ" (approvedImage จาก Phase 1) เท่านั้น
    // ไม่ใช่รูปตัวอย่างจากรายการสินค้า — override imageUrls ที่ buildFlowOptions ตั้งไว้
    const flowOptions = buildFlowOptions(product);
    if (phase === "video" && image) flowOptions.imageUrls = [image];

    helpers.showStatus(phase === "image" ? "เปิด Google Flow เพื่อสร้างภาพ..." : "เปิด Google Flow เพื่อสร้างวิดีโอ...", "info");
    const result = await runInterruptibly(() => openGoogleFlow(phase, prompt, image, flowOptions));

    if (phase === "image") {
      product.approvedImage = result?.resultUrl || product.approvedImage;
      product.flowImageTileId = result?.tileId || product.flowImageTileId || "";
      product.status = "image_done";
    } else {
      product.videoUrl = result?.resultUrl || product.videoUrl;
      product.flowVideoTileId = result?.tileId || product.flowVideoTileId || "";
      product.status = "done";
      product.productUrl = resolveProductUrl(product);
    }

    await persistState();
    renderQueue();
    helpers.showStatus(phase === "image" ? "สร้างภาพสำเร็จ" : "สร้างวิดีโอสำเร็จ", "success");

    // วิดีโอเสร็จ → ทำ action ต่อตาม setting (download / draft / post) อัตโนมัติ
    if (phase !== "image" && product.videoUrl) {
      const action = await getPostAction();
      helpers.logActivity?.(`วิดีโอเสร็จ → ดำเนินการต่ออัตโนมัติ (${action})`, "info");
      await handlePost(product);
    }
  } catch (err) {
    product.status = "error";
    product.errorMessage = err.message;
    await persistState();
    renderQueue();
    helpers.showStatus(err.message, "error");
  }
}

async function processQueue() {
  if (isProcessing) return;
  if (productQueue.length === 0) {
    helpers.showStatus("ยังไม่มีสินค้าในคิว", "error");
    return;
  }
  syncSettingsForm();
  // clip-text is now optional and will be generated automatically if left empty

  isProcessing = true;
  stopRequested = false;
  await chrome.storage.local.set({ tiktokStopRequested: false, flowStopRequested: false });
  setBatchButtons(true);
  helpers.showStatus("เริ่มสร้างภาพและวิดีโอแบบ Auto-Flow...", "info");

  const options = buildFlowOptions();
  let errorCount = 0;
  let processedCount = 0;
  let finalMessage = "";
  let finalLevel = "success";

  try {
    for (let i = 0; i < productQueue.length; i += 1) {
    if (stopRequested) break;
    const product = productQueue[i];
    if (product.status === "done") {
      helpers.logActivity?.(`สินค้า ${i + 1} (${product.name || "ไม่มีชื่อ"}): ข้ามการทำรายการเนื่องจากสถานะเป็น done แล้ว`, "info");
      continue;
    }

    try {
      assertNotStopped();
      if (product.status === "idle" || !product.autoOptions || !product.structureAdvice) {
        helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: กำลังวิเคราะห์ออปชันวิดีโอด้วย AI...`, "info");
        try {
          const analysis = await runInterruptibly(() => analyzeProductImages(getAnalysisProductImages(product), product));
          assertNotStopped();
          // ไม่เขียน highlights ทับ — ให้ผู้ใช้กรอกเอง
          product.name = analysis.name || product.name;
          product.hooks = analysis.hooks || [];
          product.targetGroup = analysis.targetGroup || product.targetGroup;
          product.structureAdvice = analysis.structureAdvice || product.structureAdvice || "";
          product.promptAdvice = analysis.promptAdvice || product.promptAdvice || "";
          product.autoOptions = analysis.autoOptions || product.autoOptions || null;
          await persistState();
          renderQueue();
        } catch (err) {
          helpers.logActivity?.(`วิเคราะห์ภาพสินค้า ${i + 1} ล้มเหลว (ใช้ข้อมูลเริ่มต้น): ${err.message}`, "warning");
        }
      }

      const isIngredients = options.videoRefMode === "ingredients";
      const isVideoOnly = settings.flowGenMode === "video" || product.status === "image_done";
      product.status = isVideoOnly ? "video_generating" : "image_generating";
      product.errorMessage = "";
      await persistState();
      renderQueue();

      let result;
      if (isVideoOnly) {
        helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: กำลังอัปโหลดรูปและสร้างวิดีโอ (${options.videoCount} คลิป)`, "info");
        const vidPrompt = buildVideoPrompt(product, settings);
        assertNotStopped();
        const modeLabel = isIngredients ? "Ingredients" : "Video Only";
        helpers.logActivity?.(`สินค้า ${i + 1} (${modeLabel}): เปิด New Project ใน Google Flow เพื่อสร้างวิดีโอโดยตรง`, "info");
        
        const referenceImage = product.approvedImage || getFlowProductImage(product);
        const flowOptions = buildFlowOptions(product);
        if (product.approvedImage) {
          flowOptions.imageUrls = [product.approvedImage];
        }
        
        result = await openGoogleFlowWithLoginResume("video", vidPrompt, referenceImage, flowOptions, product, i);
      } else {
        helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: สร้างภาพ แล้วต่อวิดีโอ (${options.imageCount} ภาพ, ${options.videoCount} คลิป)`, "info");
        const imgPrompt = buildImagePrompt(product, settings);
        const vidPrompt = buildVideoPrompt(product, settings);
        assertNotStopped();
        helpers.logActivity?.(`สินค้า ${i + 1}: เปิด New Project ใหม่ใน Google Flow เพื่อทำ Combined Pipeline`, "info");
        result = await openGoogleFlowWithLoginResume("combined", { imagePrompt: imgPrompt, videoPrompt: vidPrompt }, getFlowProductImage(product), buildFlowOptions(product), product, i);
      }
      assertNotStopped();

      product.approvedImage = result?.imgUrl || product.approvedImage || getFlowProductImage(product) || "";
      product.flowImageTileId = result?.imgTileId || product.flowImageTileId || "";
      product.videoUrl = result?.resultUrl || product.videoUrl || "";
      product.flowVideoTileId = result?.tileId || product.flowVideoTileId || "";
      product.status = product.videoUrl ? "video_generating" : "done";
      await persistState();
      renderQueue();

      if (product.videoUrl) {
        product.productUrl = resolveProductUrl(product);
        await persistState();
        const isShopee = product.source === "shopee" || (product.productUrl && /shopee\.co\.th/i.test(product.productUrl));
        const action = isShopee ? "download" : await getPostAction();
        let downloadedInfo = null;
        if (["download", "draft", "post", "schedule"].includes(action)) {
          assertNotStopped();
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังดาวน์โหลดวิดีโออัตโนมัติ...`, "info");
          const downloaded = await runInterruptibly(() => downloadVideo(product.videoUrl, product));
          assertNotStopped();
          product.preparedVideoUrl = downloaded.videoUrl || product.preparedVideoUrl || "";
          product.preparedVideoMimeType = downloaded.mimeType || product.preparedVideoMimeType || "";
          downloadedInfo = downloaded;
          await persistState();
        }
        if (action === "draft") {
          assertNotStopped();
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังส่ง Draft TikTok อัตโนมัติ...`, "info");
          await retryPostStep(`ส่ง Draft TikTok สินค้า ${i + 1}`, async () => {
            assertNotStopped();
            const res = await sendVideoToTikTokStudio(product.preparedVideoUrl || product.videoUrl, product, "draft");
            assertNotStopped();
            if (!res?.ok) throw new Error(res?.error || "ส่ง Draft ล้มเหลว");
            helpers.logActivity?.(`ส่ง Draft TikTok สินค้า ${i + 1} สำเร็จ!`, "success");
          });
        }
        if (action === "post") {
          assertNotStopped();
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังอัปโหลดและโพสต์ TikTok อัตโนมัติ...`, "info");
          await retryPostStep(`โพสต์ TikTok สินค้า ${i + 1}`, () => publishVideo(product.preparedVideoUrl || product.videoUrl, product));
          assertNotStopped();
        }
        if (action === "schedule") {
          assertNotStopped();
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังอัปโหลดและตั้งเวลาโพสต์ TikTok อัตโนมัติ...`, "info");
          const scheduledCount = productQueue.slice(0, i).filter(p => p.status === "done").length;
          const interval = parseInt(settings.postScheduleInterval, 10) || 10;
          const minutesOffset = scheduledCount * interval;
          await retryPostStep(`ตั้งเวลาโพสต์ TikTok สินค้า ${i + 1}`, () => scheduleVideo(product.preparedVideoUrl || product.videoUrl, product, minutesOffset));
          assertNotStopped();
        }
        if (isShopee && downloadedInfo) {
          assertNotStopped();
          helpers.logActivity?.(`สินค้า ${i + 1} (Shopee): กำลังบันทึกข้อมูลสินค้าลงไฟล์ CSV...`, "info");
          await saveShopeeProductToCsv(product, downloadedInfo.filename || `${product.productId || "shopee"}_shopee.mp4`);
        }
        product.status = "done";
        product.errorMessage = "";
        await persistState();
        renderQueue();
      }
      processedCount += 1;
      // ถ้ามีสินค้าถัดไปในคิว ให้หน่วงเวลาสุ่ม หรือพักเบรกหากครบ 5 รายการ
      if (i < productQueue.length - 1) {
        const hasNextPending = productQueue.slice(i + 1).some(p => p.status !== "done");
        if (hasNextPending) {
          if (processedCount > 0 && processedCount % 5 === 0) {
            const breakSeconds = 180 + Math.floor(Math.random() * 61); // สุ่ม 180 - 240 วินาที (3-4 นาที)
            const minutesFormatted = (breakSeconds / 60).toFixed(1);
            helpers.showStatus(`ทำรายการครบ ${processedCount} รายการแล้ว พักเบรก ${minutesFormatted} นาทีเพื่อป้องกันการโดนจำกัดสิทธิ์...`, "info");
            helpers.logActivity?.(`พักเบรก ${minutesFormatted} นาที (${breakSeconds} วินาที) เนื่องจากทำรายการครบ ${processedCount} รายการ...`, "info");
            await interruptibleDelay(breakSeconds * 1000);
          } else {
            const delaySeconds = 4 + Math.floor(Math.random() * 3); // สุ่ม 4 - 6 วินาที (เฉลี่ย 5 วินาที)
            helpers.showStatus(`รอจังหวะแบบสุ่ม ${delaySeconds} วินาทีก่อนเริ่มสินค้าชิ้นถัดไป...`, "info");
            helpers.logActivity?.(`รอหน่วงเวลาระหว่างรายการชิ้นถัดไป ${delaySeconds} วินาที...`, "info");
            await interruptibleDelay(delaySeconds * 1000);
          }
        }
      }
    } catch (err) {
      if (stopRequested) {
        product.status = product.videoUrl ? "done" : "image_done";
        product.errorMessage = "";
        await persistState();
        renderQueue();
        break;
      }
      errorCount += 1;
      // กู้ภาพที่เจนเสร็จก่อนวิดีโอล้มเหลว เพื่อให้กดต่อวิดีโอได้โดยไม่ต้องเจนภาพใหม่
      if (err?.imgUrl) {
        product.approvedImage = err.imgUrl;
        product.flowImageTileId = err.imgTileId || product.flowImageTileId || "";
      }
      product.status = err?.imgUrl ? "image_done" : "post_blocked";
      product.errorMessage = err.message;
      await persistState();
      renderQueue();
      helpers.showStatus(`สินค้า ${i + 1} Error: ${err.message}`, "error");
      helpers.logActivity?.(`ข้ามสินค้า ${i + 1} (ทำต่อรายการถัดไป): ${err.message}`, "error");
      
      processedCount += 1;
      // ถ้ามีสินค้าถัดไปในคิว ให้หน่วงเวลาสุ่ม หรือพักเบรกหากครบ 5 รายการ (กรณีข้ามจาก error)
      if (i < productQueue.length - 1) {
        const hasNextPending = productQueue.slice(i + 1).some(p => p.status !== "done");
        if (hasNextPending) {
          if (processedCount > 0 && processedCount % 5 === 0) {
            helpers.showStatus(`ทำรายการครบ ${processedCount} รายการแล้ว พักเบรก 2 นาทีเพื่อป้องกันการโดนจำกัดสิทธิ์...`, "info");
            helpers.logActivity?.(`พักเบรก 2 นาที (120 วินาที) เนื่องจากทำรายการครบ ${processedCount} รายการ...`, "info");
            try {
              await interruptibleDelay(120 * 1000);
            } catch (e) {}
          } else {
            const delaySeconds = 4 + Math.floor(Math.random() * 3); // สุ่ม 4 - 6 วินาที (เฉลี่ย 5 วินาที)
            helpers.showStatus(`รอจังหวะแบบสุ่ม ${delaySeconds} วินาทีก่อนเริ่มสินค้าชิ้นถัดไป...`, "info");
            helpers.logActivity?.(`รอหน่วงเวลาระหว่างรายการชิ้นถัดไป ${delaySeconds} วินาที...`, "info");
            try {
              await interruptibleDelay(delaySeconds * 1000);
            } catch (e) {}
          }
        }
      }
      continue;
    }
    }

    const wasStopped = stopRequested;
    finalMessage = wasStopped
      ? "หยุดทำงานแล้ว"
      : errorCount > 0
        ? `จบโปรเซสเพราะ Error ${errorCount} รายการ`
        : "สร้างเสร็จสมบูรณ์ทุกรายการ";
    finalLevel = wasStopped ? "info" : errorCount > 0 ? "error" : "success";
  } catch (error) {
    finalMessage = error?.message || "โปรเซสหยุดจากข้อผิดพลาด";
    finalLevel = error?.code === "STOP_REQUESTED" ? "info" : "error";
  } finally {
    isProcessing = false;
    stopRequested = false;
    await chrome.storage.local.remove(["activeFlowTabId", "activeTikTokTabId"]);
    setBatchButtons(false);
    helpers.showStatus(finalMessage || "จบการทำงานแล้ว", finalLevel);
  }
}

async function retryPostStep(label, task) {
  let lastError = null;
  for (let attempt = 1; attempt <= POST_RETRY_ATTEMPTS; attempt += 1) {
    try {
      assertNotStopped();
      if (attempt > 1) {
        helpers.logActivity?.(`${label}: retry ${attempt}/${POST_RETRY_ATTEMPTS}`, "warning");
      }
      return await runInterruptibly(task);
    } catch (error) {
      if (stopRequested || error?.code === "STOP_REQUESTED") throw error;
      lastError = error;
      if (attempt >= POST_RETRY_ATTEMPTS) break;
      helpers.logActivity?.(`${label}: ${error.message} — รอ 60 วินาทีแล้วลองใหม่`, "warning");
      await interruptibleDelay(POST_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

async function openGoogleFlowWithLoginResume(phase, prompt, imageUrl, options, product, index) {
  while (!stopRequested) {
    try {
      return await runInterruptibly(() => openGoogleFlow(phase, prompt, imageUrl, options));
    } catch (error) {
      if (!isFlowLoginError(error)) throw error;

      product.status = "post_blocked";
      product.errorMessage = "รอ login Google Flow แล้วระบบจะทำงานต่ออัตโนมัติ";
      await persistState();
      renderQueue();
      helpers.showStatus(`สินค้า ${index + 1}: กรุณา login Google Flow ในแท็บที่เปิดอยู่`, "warning");
      helpers.logActivity?.(`สินค้า ${index + 1}: รอ login Google Flow แล้วจะลองต่ออัตโนมัติ`, "warning");
      await interruptibleDelay(FLOW_LOGIN_RETRY_MS);
    }
  }

  throw new Error("หยุดทำงานแล้ว");
}

function isFlowLoginError(error) {
  const message = String(error?.message || "");
  return error?.code === "FLOW_LOGIN_REQUIRED" ||
    /Google Flow ต้อง login Google|login Google|accounts\.google/i.test(message);
}

function delay(ms) {
  let finalMs = ms;
  if (ms >= 1000) {
    const extraRandom = Math.floor(Math.random() * 2000) - 800; // -800ms to +1200ms
    finalMs = Math.max(800, ms + extraRandom);
  }
  const jitterFactor = finalMs >= 300 ? (0.75 + Math.random() * 0.50) : 1.0; // 0.75 to 1.25
  return new Promise(resolve => setTimeout(resolve, Math.round(finalMs * jitterFactor)));
}

async function interruptibleDelay(ms, interval = 500) {
  const deadline = Date.now() + ms;
  while (!stopRequested && Date.now() < deadline) {
    await delay(Math.min(interval, deadline - Date.now()));
  }
  assertNotStopped();
}

function assertNotStopped() {
  if (!stopRequested) return;
  throw createStopError();
}

function createStopError() {
  const error = new Error("หยุดทำงานแล้ว");
  error.code = "STOP_REQUESTED";
  return error;
}

function runInterruptibly(task) {
  assertNotStopped();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      stopWaiters.delete(onStop);
      callback(value);
    };
    const onStop = () => finish(reject, createStopError());
    stopWaiters.add(onStop);

    Promise.resolve()
      .then(() => {
        assertNotStopped();
        return task();
      })
      .then(
        (value) => finish(resolve, value),
        (error) => finish(reject, error)
      );
  });
}

async function requestStop() {
  stopRequested = true;
  for (const stop of [...stopWaiters]) stop();
  helpers.showStatus("กำลังหยุด...", "info");
  
  // ตั้งค่าใน storage เพื่อให้ content script ได้รับทราบผ่าน storage listener ทันที
  await chrome.storage.local.set({ tiktokStopRequested: true, flowStopRequested: true });

  await Promise.allSettled([
    chrome.runtime.sendMessage({ type: "FLOW_STOP" }),
    chrome.runtime.sendMessage({ type: "TIKTOK_STOP" })
  ]);
}

function setBatchButtons(running) {
  const createButton = document.querySelector("#btn-batch-create");
  const stopButton = document.querySelector("#btn-batch-stop");
  if (createButton) createButton.hidden = running;
  if (stopButton) stopButton.hidden = !running;
  syncClearButtonState();
}

function syncClearButtonState() {
  const clearButton = document.querySelector("#btn-batch-clear");
  if (clearButton) clearButton.disabled = isProcessing || productQueue.length === 0;
}

async function clearVideoQueue() {
  if (isProcessing) {
    helpers.showStatus("กรุณาหยุดการทำงานก่อนล้างคิว", "error");
    return;
  }

  productQueue = [];
  await persistState();
  await chrome.storage.local.remove("selectedProduct");
  renderQueue();
  helpers.showStatus("ล้างคิววิดีโอแล้ว", "success");
}

function buildFlowOptions(product = null) {
  const opts = {
    imageModel: settings.imageModel,
    videoModel: settings.videoModel,
    imageCount: settings.imageCount,
    videoCount: settings.videoCount,
    videoDuration: settings.videoDuration,
    aspectRatio: settings.aspectRatio,
    videoRefMode: settings.videoRefMode || "frames"
  };
  if (product) opts.imageUrls = getFlowProductImages(product);
  return opts;
}

async function handleStop(product) {
  await requestStop();
  product.status = product.videoUrl ? "done" : "image_done";
  await persistState();
  renderQueue();
  helpers.showStatus("หยุดทำงานแล้ว", "info");
}

async function handleDownload(product) {
  try {
    if (!product.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังดาวน์โหลด...", "info");
    const downloaded = await downloadVideo(product.videoUrl, product);
    const isShopee = product.source === "shopee" || (product.productUrl && /shopee\.co\.th/i.test(product.productUrl));
    if (isShopee) {
      helpers.showStatus("กำลังบันทึก CSV...", "info");
      await saveShopeeProductToCsv(product, downloaded.filename || `${product.productId || "shopee"}_shopee.mp4`);
    }
    product.status = "done";
    await persistState();
    renderQueue();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function handlePost(product) {
  const isShopee = product.source === "shopee" || (product.productUrl && /shopee\.co\.th/i.test(product.productUrl));
  const action = isShopee ? "download" : await getPostAction();
  if (action === "download") {
    return handleDownload(product);
  }

  if (action === "draft") {
    return handleSendDraft(product);
  }

  const isSchedule = action === "schedule";
  const actionLabel = isSchedule ? "ตั้งเวลาโพสต์ TikTok" : "โพสต์ TikTok";

  try {
    if (!product.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังดาวน์โหลดก่อนอัปโหลด TikTok...", "info");
    const downloaded = await downloadVideo(product.videoUrl, product).catch((err) => {
      helpers.logActivity?.(`ดาวน์โหลดก่อนโพสต์ล้มเหลว: ${err.message}`, "error");
      return null;
    });
    product.preparedVideoUrl = downloaded?.videoUrl || product.preparedVideoUrl || "";
    product.preparedVideoMimeType = downloaded?.mimeType || product.preparedVideoMimeType || "";
    await persistState();
    helpers.showStatus(`กำลังส่งไป TikTok (${actionLabel})...`, "info");
    if (isSchedule) {
      await retryPostStep(actionLabel, () => scheduleVideo(product.preparedVideoUrl || product.videoUrl, product));
    } else {
      await retryPostStep(actionLabel, () => publishVideo(product.preparedVideoUrl || product.videoUrl, product));
    }
    product.status = "done";
    await persistState();
    renderQueue();
    helpers.showStatus(`✅ ${actionLabel} สำเร็จ!`, "success");
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function getPostAction() {
  const { settings: syncSettings = {} } = await chrome.storage.sync.get("settings");
  return settings.postAction || syncSettings.postDefaults?.afterCreateAction || "post";
}

function getActionButtonText(action) {
  if (action === "download") return `${downloadIcon()} Download`;
  if (action === "draft") return `${saveIcon()} บันทึกแบบร่าง`;
  if (action === "schedule") return `${clockIcon()} ตั้งเวลาโพสต์`;
  return `${sendIcon()} โพสต์ TikTok`;
}

async function handleSendDraft(product) {
  try {
    if (!product.videoUrl) throw new Error("ไม่มี videoUrl");
    helpers.showStatus("ส่ง Draft TikTok...", "info");
    const downloaded = await downloadVideo(product.videoUrl, product).catch((err) => {
      helpers.logActivity?.(`ดาวน์โหลดก่อนส่ง Draft ล้มเหลว: ${err.message}`, "error");
      return null;
    });
    product.preparedVideoUrl = downloaded?.videoUrl || product.preparedVideoUrl || "";
    product.preparedVideoMimeType = downloaded?.mimeType || product.preparedVideoMimeType || "";
    await persistState();
    const result = await retryPostStep("ส่ง Draft TikTok", () => sendVideoToTikTokStudio(product.preparedVideoUrl || product.videoUrl, product, "draft"));
    if (!result?.ok) throw new Error(result?.error || "ส่ง Draft ล้มเหลว");
    product.status = "done";
    await persistState();
    renderQueue();
    helpers.showStatus("✅ ส่ง Draft TikTok สำเร็จ!", "success");
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

function renderCountersOnly() {
  const queueCount = document.querySelector("#queue-count");
  const readyCount = document.querySelector("#ready-count");
  if (queueCount) queueCount.textContent = productQueue.length;
  if (readyCount) readyCount.textContent = productQueue.filter((p) => p.status !== "done" && p.status !== "error").length;
  syncClearButtonState();
}

async function persistState() {
  const creatorState = {
    settings,
    productInfo: {}
  };
  const storableQueue = productQueue.map(({ preparedVideoUrl, preparedVideoMimeType, ...product }) => product);
  await chrome.storage.local.set({ creatorState, productQueue: storableQueue });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function getValue(id) {
  const el = document.querySelector(`#${id}`);
  if (!el) return "";
  if (el.type === "checkbox") return el.checked;
  return el.value || "";
}

function setValue(id, value) {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  if (el.type === "checkbox") {
    el.checked = Boolean(value);
  } else {
    el.value = value ?? "";
  }
}

function getDisplayProductImage(product = {}) {
  let url = product.displayImageUrl || product.imageUrls?.[0] || "assets/icon.svg";
  if (url.startsWith("//")) {
    url = "https:" + url;
  }
  return url;
}

function getFlowProductImage(product = {}) {
  // ใช้ "ภาพที่ผู้ใช้เลือก" (imageUrls) ก่อนเสมอ แล้วค่อย fallback ไปรูปแสดงผลหลัก
  // เลือก full URL (http/https/data) ที่ใช้ได้จริง — กัน bare tos uri ที่อัพไม่ได้
  const candidates = [
    ...(product.imageUrls || []),
    product.displayImageUrl,
    product.flowImageUrl
  ];
  for (let url of candidates) {
    url = String(url || "").trim();
    if (!url) continue;
    if (url.startsWith("//")) url = "https:" + url;
    if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  }
  // ไม่มี full URL — คืนตัวแรก ให้ normalizeImageUrlForUpload ฝั่ง Flow แปลงต่อ
  return product.imageUrls?.[0] || product.flowImageUrl || product.displayImageUrl || "";
}

// คืนรูปสินค้าหลายรูป (full URL ที่ใช้ได้) สำหรับ Ingredients — ดึงจาก display + imageUrls
function getFlowProductImages(product = {}) {
  const out = [];
  const seen = new Set();

  const getCleanKey = (urlStr) => {
    let u = urlStr.split("?")[0].split("#")[0];
    u = u.replace(/~tplv-.*$/, ""); // ตัด resize template suffix ของ TikTok CDN ออกเพื่อเช็คซ้ำ
    return u;
  };

  const push = (raw) => {
    let url = String(raw || "").trim();
    if (!url) return;
    if (url.startsWith("//")) url = "https:" + url;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("data:")) return;
    const cleanKey = getCleanKey(url);
    if (seen.has(cleanKey)) return;
    seen.add(cleanKey);
    out.push(url);
  };

  // ใช้ "ภาพที่ผู้ใช้เลือกด้านล่าง" (imageUrls) ก่อนเสมอ — รวมกรณีเลือกรูปเดียว
  if (product.imageUrls && product.imageUrls.length > 0) {
    product.imageUrls.forEach(push);
  }

  // หากภาพที่เลือกโหลดไม่ได้เลย (เช่นคิวเก่าเก็บ bare origin URL) ค่อย fallback ไปรูปแสดงผลหลัก
  if (out.length === 0) {
    push(product.displayImageUrl);
    push(product.flowImageUrl);
  }

  return out.slice(0, 6);
}

function getAnalysisProductImages(product = {}) {
  return [getFlowProductImage(product), ...(product.imageUrls || [])]
    .map(url => url.startsWith("//") ? "https:" + url : url)
    .filter(Boolean);
}

function xIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>`;
}

function sparkIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"></path></svg>`;
}

function copyIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
}

function downloadIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>`;
}

function imageIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
}

function playIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
}

function stopIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>`;
}

function saveIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><path d="M17 21v-8H7v8"></path><path d="M7 3v5h8"></path></svg>`;
}

function sendIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>`;
}

function clockIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
}

async function saveShopeeProductToCsv(product, videoFilename) {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = settings.postDefaults || {};
  const folder = (postDefaults.shopeeCsvFolder || "shopee_exports").trim();
  const filename = (postDefaults.shopeeCsvFilename || "shopee_products.csv").trim();
  
  const csvKey = `shopee_csv_rows:${folder}:${filename}`;
  const localData = await chrome.storage.local.get(csvKey);
  let rows = localData[csvKey] || [];
  
  const videoName = String(videoFilename || "").split("/").pop();
  
  const caption = (product.caption !== undefined && product.caption !== null)
    ? product.caption
    : buildCaption(product, postDefaults);
  
  const hashtagList = buildPostHashtags(product, postDefaults);
  const truncated = truncateShopeeCaptionAndHashtags(caption, hashtagList);
  
  const cleanCaption = truncated.caption.replace(/"/g, '""');
  const productLinks = String(product.productUrl || "").replace(/"/g, '""');
  const hashtags = truncated.hashtags.replace(/"/g, '""');
  
  const exists = rows.find(r => r.video === videoName);
  if (!exists) {
    rows.push({
      video: videoName,
      caption: cleanCaption,
      product_links: productLinks,
      hashtags: hashtags
    });
  } else {
    exists.caption = cleanCaption;
    exists.product_links = productLinks;
    exists.hashtags = hashtags;
  }
  await chrome.storage.local.set({ [csvKey]: rows });
  
  const header = "video,caption,product_links,hashtags,\n";
  const body = rows.map(r => `"${r.video}","${r.caption}","${r.product_links}","${r.hashtags}",`).join("\n");
  const csvContent = header + body;
  
  // แปลงเป็น Base64 เพื่อความปลอดภัยในการดาวน์โหลดไฟล์ CSV ผ่าน data: URI ใน Chrome
  const base64Content = btoa(unescape(encodeURIComponent(csvContent)));
  const dataUrl = `data:text/csv;charset=utf-8;base64,${base64Content}`;
  
  // ล้างเครื่องหมาย / หรือ \ ด้านหน้าและด้านหลัง เพื่อให้ดาวน์โหลดผ่าน Chrome API สำเร็จ (ต้องเป็น relative path เท่านั้น)
  const cleanFolder = folder.replace(/^[/\\]+|[/\\]+$/g, "").trim();
  const cleanFilename = filename.replace(/^[/\\]+|[/\\]+$/g, "").trim();
  const csvPath = cleanFolder ? `${cleanFolder}/${cleanFilename}` : cleanFilename;
  
  const res = await chrome.runtime.sendMessage({
    type: "DOWNLOAD_FILE",
    payload: {
      url: dataUrl,
      filename: csvPath,
      conflictAction: "overwrite"
    }
  });

  if (res && !res.ok) {
    console.error("ดาวน์โหลดไฟล์ CSV ล้มเหลว:", res.error);
    helpers.showStatus?.("บันทึก CSV ล้มเหลว: " + res.error, "error");
  } else {
    helpers.showStatus?.("บันทึกข้อมูลสินค้าลง CSV สำเร็จ", "success");
  }
}

function toInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toInputTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
