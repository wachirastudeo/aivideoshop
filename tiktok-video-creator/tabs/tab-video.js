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
  settings = normalizeSettings({ ...getDefaultSettings(), ...(stored.creatorState?.settings || {}) });
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
    "show-name", "promotion-text", "text-position", "camera-movement"
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
    cameraMovement: getValue("camera-movement")
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
    pacing: 2,
    transition: "Auto"
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
            <h3 class="product-batch-title">${escapeHtml(p.name)}</h3>
            <div class="product-batch-status">สถานะ: <span class="badge">${statusText}</span></div>
          </div>
          <button class="icon-button batch-remove" type="button" title="ลบออกจากคิว">×</button>
        </summary>
        <div class="stack product-batch-body">
          <label class="field">
            <span class="field__label">ชื่อสินค้า (ใช้ในวิดีโอ)</span>
            <input class="input batch-name" value="${escapeHtml(p.name)}">
          </label>
          
          <div class="inline-actions">
             <button class="button batch-analyze" type="button">วิเคราะห์หาจุดขาย</button>
             <button class="button batch-copy" type="button">คัดลอก Prompt</button>
          </div>
          
          <label class="field">
            <span class="field__label">จุดขาย / ไฮไลต์</span>
            <textarea class="textarea batch-highlights" rows="2" placeholder="จุดเด่นสินค้า...">${escapeHtml(p.highlights || "")}</textarea>
          </label>

          <label class="field">
            <span class="field__label">Prompt Preview</span>
            <textarea class="textarea batch-prompt prompt-textarea" rows="3" readonly>${escapeHtml(promptPreview)}</textarea>
          </label>

          <div class="inline-actions">
            <button class="button button--primary batch-flow-img" type="button">Phase1 ภาพ</button>
            <button class="button button--primary batch-flow-vid" type="button">Phase2 วิดีโอ</button>
            <button class="button button--danger batch-stop" type="button" style="display:${p.status === 'flow1' || p.status === 'flow2' ? 'inline-block' : 'none'}">หยุดทำงาน</button>
          </div>
          
          <div class="card drop-card">
            <div class="approved-row">
              <img class="batch-approved-preview approved-preview" src="${p.approvedImage || 'assets/icon.svg'}" alt="">
              <label class="button button--full">
                อัพโหลดภาพ Phase 1
                <input type="file" class="batch-upload-approved" accept="image/png,image/jpeg,image/webp" hidden>
              </label>
            </div>
            <label class="field">
              <span class="field__label">URL วิดีโอจาก Google Flow</span>
              <input class="input batch-video-url" type="url" placeholder="วาง URL ที่นี่" value="${escapeHtml(p.videoUrl || '')}">
            </label>
            <div class="inline-actions">
              <button class="button batch-download" type="button">Download</button>
              <button class="button button--primary batch-post" type="button">โพสต์ลง TikTok</button>
            </div>
            <div class="inline-actions" style="margin-top:8px">
              <button class="button button--primary batch-flow-img" type="button">Phase1 ภาพ</button>
              <button class="button button--primary batch-flow-vid" type="button">Phase2 วิดีโอ</button>
              <button class="button button--danger batch-stop" type="button" style="display:${p.status === 'flow1' || p.status === 'flow2' ? 'inline-block' : 'none'}">หยุดทำงาน</button>
            </div>
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
    await openGoogleFlow(phase, prompt, image);
    
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
  
  helpers.showStatus("เริ่มสร้างวิดีโอทั้งหมด (ภาพ→วิดีโอ)...", "info");
  
  for (let i = 0; i < productQueue.length; i++) {
    if (stopRequested) break;
    
    const p = productQueue[i];
    const item = document.querySelector(`.product-batch-item[data-index="${i}"]`);
    
    try {
      // Phase 1: สร้างภาพ
      helpers.showStatus(`สินค้า ${i+1}/${productQueue.length}: กำลังสร้างภาพ...`, "info");
      p.status = "flow1";
      if (item) item.querySelector("summary .badge").textContent = getStatusText(p.status);
      
      const imgPrompt = buildImagePrompt(p, settings);
      await openGoogleFlow("image", imgPrompt, p.imageUrls?.[0]);
      
      // Phase 2: สร้างวิดีโอ
      helpers.showStatus(`สินค้า ${i+1}/${productQueue.length}: กำลังสร้างวิดีโอ...`, "info");
      p.status = "flow2";
      if (item) item.querySelector("summary .badge").textContent = getStatusText(p.status);
      
      const vidPrompt = buildVideoPrompt(p, settings);
      const refImage = p.approvedImage || p.imageUrls?.[0];
      await openGoogleFlow("video", vidPrompt, refImage);
      
      p.status = "done";
      if (item) {
        item.querySelector("summary .badge").textContent = getStatusText(p.status);
        if (refImage) item.querySelector(".batch-approved-preview").src = refImage;
      }
      
      persistState();
    } catch (err) {
      helpers.showStatus(`สินค้า ${i+1}: ${err.message}`, "error");
      p.status = "analyzed";
      if (item) item.querySelector("summary .badge").textContent = getStatusText(p.status);
    }
  }
  
  isProcessing = false;
  stopRequested = false;
  document.querySelector("#btn-batch-create").style.display = "inline-block";
  document.querySelector("#btn-batch-stop").style.display = "none";
  helpers.showStatus(stopRequested ? "หยุดทำงานแล้ว" : "สร้างวิดีโอเสร็จสิ้น", "success");
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
