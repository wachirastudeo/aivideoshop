import {
  VIDEO_STYLES,
  buildImagePrompt,
  buildVideoPrompt,
  getDefaultSettings
} from "../modules/prompt-builder.js";
import { analyzeProductImages, fileToDataUrl } from "../modules/image-analyzer.js";
import { openGoogleFlow } from "../modules/google-flow.js";
import { downloadVideo, publishVideo } from "../modules/video-output.js";

const MOODS = ["Auto", "สดใส", "หรูหรา", "น่ารัก", "Professional", "Trendy", "มินิมัล", "Dark & Moody"];
const RUNNING_STATUSES = new Set(["image_generating", "video_generating", "flow1", "flow2"]);

let helpers = {};
let settings = getDefaultSettings();
let productQueue = [];
let isProcessing = false;
let stopRequested = false;

export async function initVideoTab(injectedHelpers) {
  helpers = injectedHelpers;
  const stored = await chrome.storage.local.get(["creatorState", "productQueue"]);
  const { settings: savedOptions = {} } = await chrome.storage.sync.get("settings");

  const optionDefaults = {
    videoStyle: savedOptions.defaultVideoStyle || "Auto",
    presenter: savedOptions.defaultPresenter || "Auto",
    voiceTone: savedOptions.defaultVoiceTone || "Auto",
    language: savedOptions.defaultLanguage || "ไทย",
    imageModel: savedOptions.flow?.imageModel || "nano-banana-pro",
    videoModel: savedOptions.flow?.videoModel || "veo-3.1-fast",
    imageCount: savedOptions.flow?.imageCount || 1,
    videoCount: savedOptions.flow?.videoCount || 1,
    ...(savedOptions.mediaSettings || {})
  };

  settings = normalizeSettings({
    ...getDefaultSettings(),
    ...optionDefaults,
    ...(stored.creatorState?.settings || {})
  });
  productQueue = normalizeProductQueue(stored.productQueue);

  populateStyleDropdown();
  renderPills("mood-pills", MOODS, settings.mood, (value) => updateSettings({ mood: value }));
  bindGlobalEvents();
  fillGlobalFormFromState();
  renderQueue();
}

export async function syncSelectedProductToVideoTab() {
  const stored = await chrome.storage.local.get(["productQueue"]);
  productQueue = normalizeProductQueue(stored.productQueue);
  renderQueue();
  await persistState();
  helpers.logActivity?.(`โหลดคิวสินค้าใหม่: ${productQueue.length} รายการ`, "success");
}

function bindGlobalEvents() {
  [
    "video-style", "presenter", "voice-tone", "location",
    "show-name", "promotion-text", "text-position", "camera-movement",
    "image-count", "video-count", "video-duration", "aspect-ratio", "post-action",
    "image-model", "video-model"
  ].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (!el) return;
    el.addEventListener("input", syncSettingsForm);
    el.addEventListener("change", syncSettingsForm);
  });

  document.querySelector("#btn-batch-create")?.addEventListener("click", () => processQueue());
  document.querySelector("#btn-batch-stop")?.addEventListener("click", () => {
    stopRequested = true;
    helpers.showStatus("กำลังหยุด...", "info");
  });
}

function fillGlobalFormFromState() {
  setValue("video-style", settings.videoStyle);
  setValue("presenter", settings.presenter);
  setValue("voice-tone", settings.voiceTone);
  setValue("location", settings.location);
  setValue("show-name", settings.showName);
  setValue("promotion-text", settings.promotionText);
  setValue("text-position", settings.textPosition);
  setValue("camera-movement", settings.cameraMovement);
  setValue("image-model", settings.imageModel);
  setValue("video-model", settings.videoModel);
  setValue("image-count", settings.imageCount);
  setValue("video-count", settings.videoCount);
  setValue("video-duration", settings.videoDuration);
  setValue("aspect-ratio", settings.aspectRatio);
  setValue("post-action", settings.postAction);
  syncVideoTextSettingsVisibility();
}

function syncSettingsForm() {
  settings = normalizeSettings({
    ...settings,
    videoStyle: getValue("video-style"),
    presenter: getValue("presenter"),
    voiceTone: getValue("voice-tone"),
    location: getValue("location"),
    showName: getValue("show-name"),
    promotionText: getValue("promotion-text"),
    textPosition: getValue("text-position"),
    cameraMovement: getValue("camera-movement"),
    imageModel: getValue("image-model"),
    videoModel: getValue("video-model"),
    imageCount: parseInt(getValue("image-count"), 10) || 4,
    videoCount: parseInt(getValue("video-count"), 10) || 2,
    videoDuration: parseInt(getValue("video-duration"), 10) || 8,
    aspectRatio: getValue("aspect-ratio") || "9:16",
    postAction: getValue("post-action")
  });

  renderQueue();
  syncVideoTextSettingsVisibility();
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
    .map((item) => ({
      ...item,
      status: normalizeStatus(item.status),
      errorMessage: item.errorMessage || "",
      flowImageTileId: item.flowImageTileId || "",
      flowVideoTileId: item.flowVideoTileId || "",
      approvedImage: item.approvedImage || "",
      videoUrl: item.videoUrl || ""
    }));
}

function normalizeStatus(status) {
  if (status === "flow1") return "image_generating";
  if (status === "flow2") return "video_generating";
  return status || "idle";
}

function normalizeSettings(value) {
  return {
    ...value,
    language: "ไทย",
    showName: value.showName === true || value.showName === "true" ? "true" : "false",
    cta: "กดสั่งซื้อที่ตะกร้าด้านล่าง",
    customCta: "",
    pacing: value.pacing || 2,
    transition: value.transition || "Auto",
    imageModel: value.imageModel || "nano-banana-pro",
    videoModel: value.videoModel || "veo-3.1-fast",
    imageCount: value.imageCount || 1,
    videoCount: value.videoCount || 1,
    videoDuration: value.videoDuration || 8,
    aspectRatio: value.aspectRatio || "9:16",
    postAction: value.postAction || "download"
  };
}

function syncVideoTextSettingsVisibility() {
  const enabled = getValue("show-name") === "true";
  document.querySelectorAll(".video-text-setting").forEach((field) => {
    field.hidden = !enabled;
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

  const list = document.querySelector("#batch-product-list");
  if (!list) return;

  if (productQueue.length === 0) {
    list.innerHTML = `<div class="empty-state">ยังไม่ได้เลือกสินค้า ไปที่แท็บสินค้า TikTok แล้วเลือกสินค้าที่ต้องการสร้างวิดีโอ</div>`;
    return;
  }

  list.innerHTML = productQueue.map(productMarkup).join("");
  bindBatchEvents();
}

function productMarkup(p, index) {
  const sourceImage = p.imageUrls?.[0] || "assets/icon.svg";
  const approvedImage = p.approvedImage || "";
  const imagePrompt = buildImagePrompt(p, settings);
  const videoPrompt = buildVideoPrompt(p, settings);
  const status = getStatusMeta(p.status);
  const imageDone = Boolean(approvedImage || p.flowImageTileId || p.status === "done" || p.status === "video_generating");
  const videoDone = Boolean(p.videoUrl || p.flowVideoTileId || p.status === "done");

  return `
    <article class="flow-job" data-index="${index}" data-status="${escapeHtml(p.status)}">
      <header class="flow-job__header">
        <img class="flow-job__thumb" src="${escapeAttr(sourceImage)}" alt="" width="64" height="64">
        <div class="flow-job__title">
          <h3>${escapeHtml(p.name || "ไม่มีชื่อสินค้า")}</h3>
          <span class="badge ${status.className}">${status.label}</span>
        </div>
        <button class="icon-button batch-remove" type="button" title="ลบออกจากคิว" aria-label="ลบออกจากคิว">${xIcon()}</button>
      </header>

      <div class="flow-steps" aria-label="Flow generation steps">
        ${stepMarkup("1", "ภาพ", imageDone, p.status === "image_generating")}
        ${stepMarkup("2", "วิดีโอ", videoDone, p.status === "video_generating")}
      </div>

      <div class="flow-job__grid">
        <figure class="media-tile">
          <img src="${escapeAttr(sourceImage)}" alt="" width="180" height="240">
          <figcaption>ภาพ TikTok</figcaption>
        </figure>
      </div>

      <div class="flow-job__body">
        <label class="field">
          <span class="field__label">ชื่อสินค้า / Hook</span>
          <input class="input batch-name" value="${escapeAttr(p.name || "")}">
        </label>

        <label class="field">
          <span class="field__label">จุดขาย / ไฮไลต์</span>
          <textarea class="textarea batch-highlights" rows="2" placeholder="จุดเด่นสินค้า...">${escapeHtml(p.highlights || "")}</textarea>
        </label>

        <div class="prompt-grid">
          <label class="field">
            <span class="field__label">Prompt ภาพ</span>
            <textarea class="textarea prompt-textarea batch-image-prompt" rows="5" readonly>${escapeHtml(imagePrompt)}</textarea>
          </label>
          <label class="field">
            <span class="field__label">Prompt วิดีโอ</span>
            <textarea class="textarea prompt-textarea batch-prompt" rows="5" readonly>${escapeHtml(videoPrompt)}</textarea>
          </label>
        </div>

        <label class="field upload-field">
          <span class="field__label">ใส่ภาพ Phase 1 เอง</span>
          <span class="button button--ghost button--full file-button">
            อัพโหลดภาพ
            <input type="file" class="batch-upload-approved" accept="image/png,image/jpeg,image/webp">
          </span>
        </label>

        ${p.errorMessage ? `<p class="flow-error">${escapeHtml(p.errorMessage)}</p>` : ""}

        <div class="inline-actions flow-job__actions">
          <button class="button batch-analyze" type="button">${sparkIcon()} วิเคราะห์จุดขาย</button>
          <button class="button batch-copy" type="button">${copyIcon()} คัดลอก Prompt</button>
          <button class="button button--danger batch-stop" type="button" ${RUNNING_STATUSES.has(p.status) ? "" : "hidden"}>${stopIcon()} หยุด</button>
          <button class="button batch-download" type="button" ${p.videoUrl ? "" : "disabled"}>${downloadIcon()} Download</button>
          <button class="button button--primary batch-post" type="button" ${p.videoUrl ? "" : "disabled"}>โพสต์ TikTok</button>
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

  list.querySelectorAll(".flow-job").forEach((item) => {
    const idx = parseInt(item.dataset.index, 10);
    const p = productQueue[idx];
    if (!p) return;

    item.querySelector(".batch-name")?.addEventListener("input", (e) => {
      p.name = e.target.value;
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
    item.querySelector(".batch-download")?.addEventListener("click", () => handleDownload(p));
    item.querySelector(".batch-post")?.addEventListener("click", () => handlePost(p));
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
    case "done": return { label: "พร้อมโพสต์", className: "badge--success" };
    case "error": return { label: "Error", className: "badge--error" };
    default: return { label: "รอดำเนินการ", className: "" };
  }
}

async function handleAnalyze(product) {
  try {
    helpers.showStatus("กำลังวิเคราะห์ด้วย AI...", "info");
    const analysis = await analyzeProductImages(product.imageUrls || [], product);
    product.highlights = analysis.highlights || product.highlights;
    product.name = analysis.name || product.name;
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
    const image = phase === "image" ? product.imageUrls?.[0] : (product.approvedImage || product.imageUrls?.[0]);
    product.status = phase === "image" ? "image_generating" : "video_generating";
    product.errorMessage = "";
    await persistState();
    renderQueue();

    helpers.showStatus(phase === "image" ? "เปิด Google Flow เพื่อสร้างภาพ..." : "เปิด Google Flow เพื่อสร้างวิดีโอ...", "info");
    const result = await openGoogleFlow(phase, prompt, image, buildFlowOptions());

    if (phase === "image") {
      product.approvedImage = result?.resultUrl || product.approvedImage;
      product.flowImageTileId = result?.tileId || product.flowImageTileId || "";
      product.status = "image_done";
    } else {
      product.videoUrl = result?.resultUrl || product.videoUrl;
      product.flowVideoTileId = result?.tileId || product.flowVideoTileId || "";
      product.status = "done";
    }

    await persistState();
    renderQueue();
    helpers.showStatus(phase === "image" ? "สร้างภาพสำเร็จ" : "สร้างวิดีโอสำเร็จ", "success");
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

  isProcessing = true;
  stopRequested = false;
  setBatchButtons(true);
  helpers.showStatus("เริ่มสร้างภาพและวิดีโอแบบ Auto-Flow...", "info");

  const options = buildFlowOptions();
  let errorCount = 0;

  for (let i = 0; i < productQueue.length; i += 1) {
    if (stopRequested) break;
    const product = productQueue[i];

    try {
      if (product.status === "idle" || !product.highlights) {
        helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: กำลังวิเคราะห์จุดเด่นสินค้าด้วย AI...`, "info");
        try {
          const analysis = await analyzeProductImages(product.imageUrls || [], product);
          product.highlights = analysis.highlights || product.highlights;
          product.name = analysis.name || product.name;
          product.promptAdvice = analysis.promptAdvice || "";
          await persistState();
          renderQueue();
        } catch (err) {
          helpers.logActivity?.(`วิเคราะห์ภาพสินค้า ${i + 1} ล้มเหลว (ใช้ข้อมูลเริ่มต้น): ${err.message}`, "warning");
        }
      }

      product.status = "image_generating";
      product.errorMessage = "";
      await persistState();
      renderQueue();

      helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: สร้างภาพ แล้วต่อวิดีโอ (${options.imageCount} ภาพ, ${options.videoCount} คลิป)`, "info");
      const imgPrompt = buildImagePrompt(product, settings);
      const vidPrompt = buildVideoPrompt(product, settings);
      const result = await openGoogleFlow("combined", { imagePrompt: imgPrompt, videoPrompt: vidPrompt }, product.imageUrls?.[0], options);

      product.approvedImage = result?.imgUrl || product.approvedImage || product.imageUrls?.[0] || "";
      product.flowImageTileId = result?.imgTileId || product.flowImageTileId || "";
      product.videoUrl = result?.resultUrl || product.videoUrl || "";
      product.flowVideoTileId = result?.tileId || product.flowVideoTileId || "";
      product.status = "done";
      await persistState();
      renderQueue();

      if (product.videoUrl) {
        const action = settings.postAction || "download";
        if (action === "download" || action === "both") {
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังดาวน์โหลดวิดีโออัตโนมัติ...`, "info");
          await downloadVideo(product.videoUrl, product).catch(err => {
            helpers.logActivity?.(`ดาวน์โหลดวิดีโอสินค้า ${i + 1} ล้มเหลว: ${err.message}`, "error");
          });
        }
        if (action === "post" || action === "both") {
          helpers.logActivity?.(`สินค้า ${i + 1}: กำลังโพสต์ TikTok อัตโนมัติ...`, "info");
          await publishVideo(product.videoUrl, product).catch(err => {
            helpers.logActivity?.(`โพสต์ TikTok สินค้า ${i + 1} ล้มเหลว: ${err.message}`, "error");
          });
        }
      }
    } catch (err) {
      errorCount += 1;
      product.status = "error";
      product.errorMessage = err.message;
      await persistState();
      renderQueue();
      helpers.showStatus(`สินค้า ${i + 1} Error: ${err.message}`, "error");
    }
  }

  const wasStopped = stopRequested;
  isProcessing = false;
  stopRequested = false;
  setBatchButtons(false);
  const finalMessage = wasStopped
    ? "หยุดทำงานแล้ว"
    : errorCount > 0
      ? `ทำงานจบ แต่มี Error ${errorCount} รายการ`
      : "สร้างเสร็จสมบูรณ์ทุกรายการ";
  helpers.showStatus(finalMessage, wasStopped ? "info" : errorCount > 0 ? "error" : "success");
}

function setBatchButtons(running) {
  const createButton = document.querySelector("#btn-batch-create");
  const stopButton = document.querySelector("#btn-batch-stop");
  if (createButton) createButton.hidden = running;
  if (stopButton) stopButton.hidden = !running;
}

function buildFlowOptions() {
  return {
    imageModel: settings.imageModel,
    videoModel: settings.videoModel,
    imageCount: settings.imageCount,
    videoCount: settings.videoCount,
    videoDuration: settings.videoDuration,
    aspectRatio: settings.aspectRatio
  };
}

async function handleStop(product) {
  stopRequested = true;
  product.status = "image_done";
  await chrome.runtime.sendMessage({ type: "FLOW_STOP" }).catch(() => {});
  await persistState();
  renderQueue();
  helpers.showStatus("หยุดทำงานแล้ว", "info");
}

async function handleDownload(product) {
  try {
    if (!product.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังดาวน์โหลด...", "info");
    await downloadVideo(product.videoUrl, product);
    product.status = "done";
    await persistState();
    renderQueue();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function handlePost(product) {
  try {
    if (!product.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังส่งไป TikTok...", "info");
    await publishVideo(product.videoUrl, product);
    product.status = "done";
    await persistState();
    renderQueue();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

function renderCountersOnly() {
  const queueCount = document.querySelector("#queue-count");
  const readyCount = document.querySelector("#ready-count");
  if (queueCount) queueCount.textContent = productQueue.length;
  if (readyCount) readyCount.textContent = productQueue.filter((p) => p.status !== "done" && p.status !== "error").length;
}

async function persistState() {
  const creatorState = {
    settings,
    productInfo: {}
  };
  await chrome.storage.local.set({ creatorState, productQueue });
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
  return document.querySelector(`#${id}`)?.value || "";
}

function setValue(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el) el.value = value ?? "";
}

function xIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>`;
}

function sparkIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z"></path></svg>`;
}

function copyIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
}

function downloadIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg>`;
}

function imageIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
}

function playIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
}

function stopIcon() {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:4px;"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg>`;
}
