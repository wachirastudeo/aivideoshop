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

let helpers = {};
let settings = getDefaultSettings();
let productQueue = [];
let isProcessing = false;
let stopRequested = false;

export async function initVideoTab(injectedHelpers) {
  helpers = injectedHelpers;
  const stored = await chrome.storage.local.get(["creatorState", "productQueue"]);
  const { settings: savedOptions = {} } = await chrome.storage.sync.get("settings");

  // merge: local state > options defaults > hardcoded defaults
  const optionDefaults = {
    videoStyle: savedOptions.defaultVideoStyle || "Auto",
    presenter: savedOptions.defaultPresenter || "Auto",
    voiceTone: savedOptions.defaultVoiceTone || "Auto",
    language: savedOptions.defaultLanguage || "ไทย"
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
    "pacing", "transition", "image-count", "video-count", "video-duration", "aspect-ratio"
  ].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.addEventListener("input", syncSettingsForm);
      el.addEventListener("change", syncSettingsForm);
    }
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
  setValue("pacing", settings.pacing);
  setValue("transition", settings.transition);
  
  // Media settings
  setValue("image-count", settings.imageCount);
  setValue("video-count", settings.videoCount);
  setValue("video-duration", settings.videoDuration);
  setValue("aspect-ratio", settings.aspectRatio);

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
    pacing: parseInt(getValue("pacing"), 10) || 2,
    transition: getValue("transition"),
    imageCount: parseInt(getValue("image-count"), 10) || 4,
    videoCount: parseInt(getValue("video-count"), 10) || 2,
    videoDuration: parseInt(getValue("video-duration"), 10) || 8,
    aspectRatio: getValue("aspect-ratio") || "9:16"
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
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
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
    imageCount: value.imageCount || 4,
    videoCount: value.videoCount || 2,
    videoDuration: value.videoDuration || 8,
    aspectRatio: value.aspectRatio || "9:16"
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
  select.insertAdjacentHTML("afterbegin", `<option value="Auto">✨ อัตโนมัติ</option>`);
  select.value = settings.videoStyle;
}

function renderPills(rootId, values, activeValue, onSelect) {
  const root = document.querySelector(`#${rootId}`);
  if (!root) return;
  root.innerHTML = values.map((value) => `
    <button class="pill ${value === activeValue ? "pill--active" : ""}" type="button" data-value="${value}">${value}</button>
  `).join("");
  root.querySelectorAll("[data-value]").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(button.dataset.value);
      renderPills(rootId, values, button.dataset.value, onSelect);
    });
  });
}

// Queue Rendering
function renderQueue() {
  productQueue = normalizeProductQueue(productQueue);
  const queueCount = document.querySelector("#queue-count");
  if (queueCount) queueCount.textContent = productQueue.length;

  const list = document.querySelector("#batch-product-list");
  if (!list) return;

  if (productQueue.length === 0) {
    list.innerHTML = `<div class="empty-state">ยังไม่ได้เลือกสินค้า กรุณาเลือกจากแท็บ "เลือกสินค้า"</div>`;
    return;
  }

  list.innerHTML = productQueue.map((p, index) => {
    const imageUrl = p.imageUrls?.[0] || 'assets/icon.svg';
    const statusText = getStatusText(p.status);
    const promptPreview = buildVideoPrompt(p, settings);

    return `
      <details class="product-batch-item card" data-index="${index}">
        <summary class="product-batch-summary">
          <img class="product-batch-image" src="${imageUrl}" alt="">
          <div class="product-card__content">
            <h3 class="product-batch-title" style="margin:0; font-size: 13px; font-weight: 650; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(p.name)}</h3>
            <div class="product-batch-status" style="margin-top:4px; display: ${p.status === 'idle' ? 'none' : 'block'};"><span class="badge ${p.status === 'done' ? 'badge--success' : ''}">${statusText}</span></div>
          </div>
          <div class="summary-actions">
            <button class="icon-button batch-remove" type="button" title="ลบออกจากคิว">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
            </button>
            <span class="chevron"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"></path></svg></span>
          </div>
        </summary>
        <div class="stack product-batch-body" style="padding: 0 12px 12px;">
          <div class="divider" style="margin: 0 0 12px 0;"></div>
          <label class="field">
            <span class="field__label">ชื่อสินค้า (ใช้ในวิดีโอ)</span>
            <input class="input batch-name" value="${escapeHtml(p.name)}">
          </label>
          
          <div class="inline-actions">
             <button class="button batch-analyze" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> วิเคราะห์หาจุดขาย</button>
             <button class="button batch-copy" type="button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg> คัดลอก Prompt</button>
          </div>
          
          <label class="field">
            <span class="field__label">จุดขาย / ไฮไลต์</span>
            <textarea class="textarea batch-highlights" rows="2" placeholder="จุดเด่นสินค้า...">${escapeHtml(p.highlights || "")}</textarea>
          </label>

          <label class="field">
            <span class="field__label">Prompt Preview</span>
            <textarea class="textarea batch-prompt prompt-textarea" rows="3" readonly style="font-family: monospace; font-size: 11px; color: var(--muted); background: var(--bg);">${escapeHtml(promptPreview)}</textarea>
          </label>
          
          <div class="divider" style="margin: 8px 0;"></div>
          
          <div class="card drop-card" style="background: var(--bg); border: 1px dashed var(--line); box-shadow: none;">
            <div class="approved-row" style="display: flex; gap: 12px; align-items: center;">
              <img class="batch-approved-preview approved-preview" src="${p.approvedImage || 'assets/icon.svg'}" alt="" style="width: 48px; height: 48px; border-radius: var(--radius); object-fit: cover; border: 1px solid var(--line); flex-shrink: 0;">
              <label class="button button--full button--ghost" style="flex: 1;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                อัพโหลดภาพ Phase 1
                <input type="file" class="batch-upload-approved" accept="image/png,image/jpeg,image/webp" hidden>
              </label>
            </div>
            <label class="field" style="margin-top: 12px;">
              <span class="field__label">URL วิดีโอจาก Google Flow</span>
              <input class="input batch-video-url" type="url" placeholder="วาง URL ที่นี่" value="${escapeHtml(p.videoUrl || '')}">
            </label>

            <div class="card" style="background: rgba(255,255,255,0.05); margin-top: 10px; padding: 10px; border: none;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <label class="field">
                  <span class="field__label">ความเป็นส่วนตัว</span>
                  <select class="input batch-privacy">
                    <option value="PUBLIC">สาธารณะ (Public)</option>
                    <option value="FRIENDS">เพื่อนเท่านั้น</option>
                    <option value="PRIVATE">ส่วนตัว (Private)</option>
                  </select>
                </label>
                <div style="display: flex; flex-direction: column; gap: 5px; font-size: 11px;">
                  <label><input type="checkbox" class="batch-allow-comment" checked> อนุญาตคอมเมนต์</label>
                  <label><input type="checkbox" class="batch-allow-duet" checked> อนุญาต Duet</label>
                  <label><input type="checkbox" class="batch-allow-stitch" checked> อนุญาต Stitch</label>
                </div>
              </div>
            </div>

            <div class="inline-actions" style="margin-top: 12px;">
              <button class="button batch-download button--full" type="button" style="flex:1;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Download</button>
              <button class="button button--primary batch-post button--full" type="button" style="flex:1;">โพสต์ลง TikTok</button>
            </div>
          </div>
          
          <div class="divider" style="margin: 8px 0;"></div>

          <div class="inline-actions">
            <button class="button button--ghost batch-flow-img button--full" type="button" style="flex:1; border-color: var(--accent); color: var(--accent);">✨ Phase1 ภาพ</button>
            <button class="button button--ghost batch-flow-vid button--full" type="button" style="flex:1; border-color: var(--accent); color: var(--accent);">🎬 Phase2 วิดีโอ</button>
            <button class="button button--danger batch-stop" type="button" style="display:${p.status === 'flow1' || p.status === 'flow2' ? 'inline-block' : 'none'}">หยุดทำงาน</button>
          </div>
        </div>
      </details>
    `;
  }).join("");

  bindBatchEvents();
}

function bindBatchEvents() {
  const list = document.querySelector("#batch-product-list");
  if (!list) return;

  list.querySelectorAll(".product-batch-item").forEach(item => {
    const idx = parseInt(item.dataset.index, 10);
    const p = productQueue[idx];

    item.querySelector(".batch-name").addEventListener("input", (e) => { p.name = e.target.value; updatePrompt(item, p); persistState(); });
    item.querySelector(".batch-video-url").addEventListener("input", (e) => { p.videoUrl = e.target.value; persistState(); });

    item.querySelector(".batch-analyze").addEventListener("click", () => handleAnalyze(p, item));
    item.querySelector(".batch-copy").addEventListener("click", () => {
      const prompt = item.querySelector(".batch-prompt").value;
      navigator.clipboard.writeText(prompt);
      helpers.showStatus("คัดลอก Prompt แล้ว", "success");
    });

    item.querySelector(".batch-flow-img").addEventListener("click", () => launchFlow("image", p, item));
    item.querySelector(".batch-flow-vid").addEventListener("click", () => launchFlow("video", p, item));
    const stopBtn = item.querySelector(".batch-stop");
    if (stopBtn) stopBtn.addEventListener("click", () => handleStop(p, item));

    item.querySelector(".batch-upload-approved").addEventListener("change", (e) => handleUploadApproved(e, p, item));

    item.querySelector(".batch-download").addEventListener("click", () => handleDownload(p));
    item.querySelector(".batch-post").addEventListener("click", () => handlePost(p));
    item.querySelector(".batch-remove").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      productQueue.splice(idx, 1);
      renderQueue();
      persistState();
    });
  });
}

function updatePrompt(itemEl, p) {
  const promptPreview = buildVideoPrompt(p, settings);
  const textArea = itemEl.querySelector(".batch-prompt");
  if (textArea) textArea.value = promptPreview;
}

function getStatusText(status) {
  switch (status) {
    case "analyzed": return "พร้อมทำภาพ/วิดีโอ";
    case "flow1": return "กำลังทำภาพ (Phase 1)";
    case "flow2": return "กำลังทำวิดีโอ (Phase 2)";
    case "done": return "พร้อมโพสต์ 🚀";
    default: return "รอดำเนินการ";
  }
}

async function handleAnalyze(p, itemEl) {
  try {
    helpers.showStatus("กำลังวิเคราะห์ด้วย AI...", "info");
    const urls = p.imageUrls || [];
    const analysis = await analyzeProductImages(urls, p);
    p.highlights = analysis.highlights || p.highlights;
    p.name = analysis.name || p.name;
    p.status = "analyzed";

    itemEl.querySelector(".batch-highlights").value = p.highlights;
    itemEl.querySelector(".batch-name").value = p.name;
    updatePrompt(itemEl, p);
    itemEl.querySelector("summary .badge").textContent = getStatusText(p.status);

    persistState();
    helpers.showStatus("วิเคราะห์เสร็จสิ้น", "success");
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function handleUploadApproved(e, p, itemEl) {
  const [file] = [...e.target.files];
  if (!file) return;
  p.approvedImage = await fileToDataUrl(file);
  const preview = itemEl.querySelector(".batch-approved-preview");
  if (preview) preview.src = p.approvedImage;
  helpers.showStatus("อัพโหลดภาพ Phase 1 สำเร็จ", "success");
  persistState();
}

async function launchFlow(phase, p, itemEl) {
  try {
    helpers.showStatus(phase === "image" ? "เปิด Google Flow (ภาพ)..." : "เปิด Google Flow (วิดีโอ)...", "info");
    const prompt = phase === "image" ? buildImagePrompt(p, settings) : itemEl.querySelector(".batch-prompt").value;
    const image = phase === "image" ? p.imageUrls?.[0] : (p.approvedImage || p.imageUrls?.[0]);

    // ดึงการตั้งค่าจาก storage
    const { settings: savedOptions = {} } = await chrome.storage.sync.get("settings");
    const media = savedOptions.mediaSettings || {};

    const options = {
      imageCount: settings.imageCount,
      videoCount: settings.videoCount,
      videoDuration: settings.videoDuration,
      aspectRatio: settings.aspectRatio
    };

    await openGoogleFlow(phase, prompt, image, options);

    p.status = phase === "image" ? "flow1" : "flow2";
    itemEl.querySelector("summary .badge").textContent = getStatusText(p.status);
    persistState();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;
  stopRequested = false;

  document.querySelector("#btn-batch-create").style.display = "none";
  document.querySelector("#btn-batch-stop").style.display = "inline-block";

  helpers.showStatus("เริ่มสร้างวิดีโอแบบ Auto-Flow...", "info");

  const options = {
    imageCount: settings.imageCount,
    videoCount: settings.videoCount,
    videoDuration: settings.videoDuration,
    aspectRatio: settings.aspectRatio
  };

  for (let i = 0; i < productQueue.length; i++) {
    if (stopRequested) break;

    const p = productQueue[i];
    const item = document.querySelector(`.product-batch-item[data-index="${i}"]`);

    try {
      // ใช้โหมด combined เพื่อรันทั้ง 2 ขั้นตอนใน Flow รอบเดียว
      helpers.showStatus(`สินค้า ${i + 1}/${productQueue.length}: กำลังสร้างภาพและวิดีโอ (${options.imageCount} ภาพ, ${options.videoCount} คลิป)... รอสักครู่`, "info");
      p.status = "flow1";
      if (item) item.querySelector("summary .badge").textContent = "กำลังสร้าง (1/2)";

      const imgPrompt = buildImagePrompt(p, settings);
      const vidPrompt = buildVideoPrompt(p, settings);

      const result = await openGoogleFlow("combined", { imagePrompt, videoPrompt: vidPrompt }, p.imageUrls?.[0], options);
      
      p.approvedImage = result?.imgUrl || p.approvedImage || p.imageUrls?.[0];
      if (item && p.approvedImage) item.querySelector(".batch-approved-preview").src = p.approvedImage;

      p.videoUrl = result?.resultUrl || p.videoUrl;
      if (item && p.videoUrl) item.querySelector(".batch-video-url").value = p.videoUrl;

      p.status = "done";
      if (item) item.querySelector("summary .badge").textContent = getStatusText(p.status);

      persistState();
    } catch (err) {
      helpers.showStatus(`สินค้า ${i + 1} Error: ${err.message}`, "error");
    }
  }

  isProcessing = false;
  stopRequested = false;
  document.querySelector("#btn-batch-create").style.display = "inline-block";
  document.querySelector("#btn-batch-stop").style.display = "none";
  helpers.showStatus(stopRequested ? "หยุดทำงานแล้ว" : "สร้างเสร็จสมบูรณ์ทุกรายการ!", "success");
}

async function handleStop(p, itemEl) {
  p.status = "analyzed";
  itemEl.querySelector("summary .badge").textContent = getStatusText(p.status);
  persistState();
  helpers.showStatus("หยุดทำงานแล้ว", "info");
}

async function handleDownload(p) {
  try {
    if (!p.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังดาวน์โหลด...", "info");
    await downloadVideo(p.videoUrl, p);
    p.status = "done";
    renderQueue();
    persistState();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function handlePost(p) {
  try {
    if (!p.videoUrl) throw new Error("กรุณาวาง URL วิดีโอ");
    helpers.showStatus("กำลังส่งไป TikTok...", "info");
    await publishVideo(p.videoUrl, p);
    p.status = "done";
    renderQueue();
    persistState();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
}

async function persistState() {
  const creatorState = {
    settings,
    productInfo: {}, // legacy fallback
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

function getValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function setValue(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el) el.value = value ?? "";
}

function getChecked(id) {
  return document.querySelector(`#${id}`)?.checked || false;
}

function setChecked(id, value) {
  const el = document.querySelector(`#${id}`);
  if (el) el.checked = Boolean(value);
}
