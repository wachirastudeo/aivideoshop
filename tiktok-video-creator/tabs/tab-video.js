import {
  VIDEO_STYLES,
  buildImagePrompt,
  buildVideoPrompt,
  getDefaultSettings
} from "../modules/prompt-builder.js";
import { analyzeProductImages, fileToDataUrl } from "../modules/image-analyzer.js";
import { openGoogleFlow } from "../modules/google-flow.js";
import { downloadVideo, publishVideo } from "../modules/video-output.js";

const MOODS = ["สดใส", "หรูหรา", "น่ารัก", "Professional", "Trendy", "มินิมัล", "Dark & Moody"];
const LANGUAGES = ["ไทย", "English", "ทั้งคู่"];

let helpers = {};
let settings = getDefaultSettings();
let productQueue = [];

export async function initVideoTab(injectedHelpers) {
  helpers = injectedHelpers;
  const stored = await chrome.storage.local.get(["creatorState", "productQueue"]);
  settings = { ...getDefaultSettings(), ...(stored.creatorState?.settings || {}) };
  productQueue = stored.productQueue || [];

  renderStyleCards();
  renderPills("mood-pills", MOODS, settings.mood, (value) => updateSettings({ mood: value }));
  renderPills("language-pills", LANGUAGES, settings.language, (value) => updateSettings({ language: value }));
  bindGlobalEvents();
  fillGlobalFormFromState();
  renderQueue();
}

export async function syncSelectedProductToVideoTab() {
  const stored = await chrome.storage.local.get(["productQueue"]);
  productQueue = stored.productQueue || [];
  renderQueue();
  await persistState();
  helpers.logActivity?.(`โหลดคิวสินค้าใหม่: ${productQueue.length} รายการ`, "success");
}

function bindGlobalEvents() {
  [
    "hook", "color-palette", "brand-color", "lighting-style",
    "show-name", "show-price", "promotion-text", "settings-cta",
    "custom-cta", "text-position", "camera-movement", "pacing", "transition"
  ].forEach((id) => {
    const el = document.querySelector(`#${id}`);
    if (el) {
      el.addEventListener("input", syncSettingsForm);
      el.addEventListener("change", syncSettingsForm);
    }
  });
}

function fillGlobalFormFromState() {
  setValue("hook", settings.hook);
  setValue("color-palette", settings.colorPalette);
  setValue("brand-color", settings.brandColor);
  setValue("lighting-style", settings.lightingStyle);
  setChecked("show-name", settings.showName);
  setChecked("show-price", settings.showPrice);
  setValue("promotion-text", settings.promotionText);
  setValue("settings-cta", settings.cta);
  setValue("custom-cta", settings.customCta);
  setValue("text-position", settings.textPosition);
  setValue("camera-movement", settings.cameraMovement);
  setValue("pacing", settings.pacing);
  setValue("transition", settings.transition);

  document.querySelector("#brand-color").hidden = settings.colorPalette !== "Brand Color";
  document.querySelector("#custom-cta").hidden = settings.cta !== "กรอกเอง";
}

function syncSettingsForm() {
  settings = {
    ...settings,
    hook: getValue("hook"),
    colorPalette: getValue("color-palette"),
    brandColor: getValue("brand-color"),
    lightingStyle: getValue("lighting-style"),
    showName: getChecked("show-name"),
    showPrice: getChecked("show-price"),
    promotionText: getValue("promotion-text"),
    cta: getValue("settings-cta"),
    customCta: getValue("custom-cta"),
    textPosition: getValue("text-position"),
    cameraMovement: getValue("camera-movement"),
    pacing: Number(getValue("pacing")),
    transition: getValue("transition")
  };
  document.querySelector("#brand-color").hidden = settings.colorPalette !== "Brand Color";
  document.querySelector("#custom-cta").hidden = settings.cta !== "กรอกเอง";
  
  // Re-render queue prompts based on new settings
  renderQueue();
  persistState();
}

function updateSettings(patch) {
  settings = { ...settings, ...patch };
  renderQueue();
  persistState();
}

function renderStyleCards() {
  const grid = document.querySelector("#style-grid");
  if (!grid) return;
  grid.innerHTML = VIDEO_STYLES.map((style) => `
    <button class="style-card ${style.id === settings.videoStyle ? "style-card--active" : ""}" type="button" data-style="${style.id}">
      <strong>${style.emoji} ${style.name}</strong>
      <span>${style.description}</span>
      <small>${style.shotPattern}</small>
    </button>
  `).join("");

  grid.querySelectorAll("[data-style]").forEach((button) => {
    button.addEventListener("click", () => {
      updateSettings({ videoStyle: button.dataset.style });
      renderStyleCards();
    });
  });
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
  document.querySelector("#queue-count").textContent = productQueue.length;
  const list = document.querySelector("#batch-product-list");
  
  if (productQueue.length === 0) {
    list.innerHTML = `<div class="empty-state">ยังไม่ได้เลือกสินค้า กรุณาเลือกจากแท็บ "เลือกสินค้า"</div>`;
    return;
  }

  // Create document fragment or innerHTML
  list.innerHTML = productQueue.map((p, index) => {
    const imageUrl = p.imageUrls?.[0] || 'assets/icon.svg';
    const statusText = getStatusText(p.status);
    const promptPreview = buildVideoPrompt(p, settings);

    return `
      <details class="product-batch-item" data-index="${index}" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 8px;">
        <summary style="display: flex; align-items: center; padding: 12px; cursor: pointer; gap: 12px; list-style: none;">
          <img src="${imageUrl}" style="width: 48px; height: 48px; border-radius: 6px; object-fit: cover;">
          <div style="flex-grow: 1;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(p.name)}</h3>
            <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">สถานะ: <strong style="color: #fe2c55;">${statusText}</strong></div>
          </div>
        </summary>
        <div style="padding: 12px; border-top: 1px solid #e5e7eb; background: #f9fafb;" class="stack">
          <label class="field">
            <span class="field__label">ชื่อสินค้า (ใช้ในวิดีโอ)</span>
            <input class="input batch-name" value="${escapeHtml(p.name)}">
          </label>
          <label class="field">
            <span class="field__label">ราคา</span>
            <input class="input batch-price" value="${escapeHtml(p.price || '')}" type="number" step="0.01">
          </label>
          
          <div class="inline-actions" style="margin-top: 8px;">
             <button class="button batch-analyze" type="button">✨ วิเคราะห์ด้วย AI (หาจุดขาย)</button>
             <button class="button batch-copy" type="button">📋 คัดลอก Prompt</button>
          </div>
          
          <label class="field">
            <span class="field__label">จุดขาย / ไฮไลต์</span>
            <textarea class="textarea batch-highlights" rows="2" placeholder="จุดเด่นสินค้า...">${escapeHtml(p.highlights || "")}</textarea>
          </label>

          <label class="field">
            <span class="field__label">Prompt (ดูหรือแก้ไข)</span>
            <textarea class="textarea batch-prompt" rows="3">${escapeHtml(promptPreview)}</textarea>
          </label>

          <div class="inline-actions" style="margin-top: 8px; margin-bottom: 8px;">
            <button class="button button--primary batch-flow-img" type="button">📸 Phase 1 (ภาพ)</button>
            <button class="button button--primary batch-flow-vid" type="button">🎬 Phase 2 (วิดีโอ)</button>
          </div>
          
          <div style="background: #ffffff; border: 1px dashed #d1d5db; border-radius: 8px; padding: 12px;">
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
              <img class="batch-approved-preview" src="${p.approvedImage || 'assets/icon.svg'}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;">
              <label class="button button--ghost" style="flex: 1; padding: 4px; font-size: 11px;">
                อัพโหลดภาพ Phase 1 
                <input type="file" class="batch-upload-approved" accept="image/png,image/jpeg,image/webp" hidden>
              </label>
            </div>
            <label class="field">
              <span class="field__label">URL วิดีโอจาก Google Flow</span>
              <input class="input batch-video-url" type="url" placeholder="วาง URL ที่นี่" value="${escapeHtml(p.videoUrl || '')}">
            </label>
            <div class="inline-actions" style="margin-top: 8px;">
              <button class="button batch-download" type="button">📥 Download</button>
              <button class="button button--primary batch-post" type="button">📱 โพสต์ลง TikTok</button>
            </div>
          </div>
          
          <div style="text-align: right; margin-top: 4px;">
             <button class="button button--ghost batch-remove" style="color: #ef4444; border-color: #fca5a5;">❌ ลบจากคิว</button>
          </div>
        </div>
      </details>
    `;
  }).join("");

  bindBatchEvents();
}

function bindBatchEvents() {
  const list = document.querySelector("#batch-product-list");
  
  list.querySelectorAll(".product-batch-item").forEach(item => {
    const idx = parseInt(item.dataset.index, 10);
    const p = productQueue[idx];

    item.querySelector(".batch-name").addEventListener("input", (e) => { p.name = e.target.value; updatePrompt(item, p); persistState(); });
    item.querySelector(".batch-price").addEventListener("input", (e) => { p.price = e.target.value; updatePrompt(item, p); persistState(); });
    item.querySelector(".batch-highlights").addEventListener("input", (e) => { p.highlights = e.target.value; updatePrompt(item, p); persistState(); });
    
    item.querySelector(".batch-video-url").addEventListener("input", (e) => { p.videoUrl = e.target.value; persistState(); });

    item.querySelector(".batch-analyze").addEventListener("click", () => handleAnalyze(p, item));
    item.querySelector(".batch-copy").addEventListener("click", () => {
      const prompt = item.querySelector(".batch-prompt").value;
      navigator.clipboard.writeText(prompt);
      helpers.showStatus("คัดลอก Prompt แล้ว", "success");
    });

    item.querySelector(".batch-flow-img").addEventListener("click", () => launchFlow("image", p, item));
    item.querySelector(".batch-flow-vid").addEventListener("click", () => launchFlow("video", p, item));

    item.querySelector(".batch-upload-approved").addEventListener("change", (e) => handleUploadApproved(e, p, item));
    
    item.querySelector(".batch-download").addEventListener("click", () => handleDownload(p));
    item.querySelector(".batch-post").addEventListener("click", () => handlePost(p));
    item.querySelector(".batch-remove").addEventListener("click", () => {
      productQueue.splice(idx, 1);
      renderQueue();
      persistState();
    });
  });
}

function updatePrompt(itemEl, p) {
  const promptPreview = buildVideoPrompt(p, settings);
  itemEl.querySelector(".batch-prompt").value = promptPreview;
}

function getStatusText(status) {
  switch (status) {
    case "analyzed": return "พร้อมทำภาพ/วิดีโอ";
    case "flow1": return "กำลังทำภาพ (Phase 1)";
    case "flow2": return "กำลังทำวิดีโอ (Phase 2)";
    case "done": return "พร้อมโพสต์ 🚀";
    default: return "รอข้อมูล";
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
    
    // Update DOM inputs without full re-render
    itemEl.querySelector(".batch-highlights").value = p.highlights;
    itemEl.querySelector(".batch-name").value = p.name;
    updatePrompt(itemEl, p);
    itemEl.querySelector("summary div strong").textContent = getStatusText(p.status);
    
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
  itemEl.querySelector(".batch-approved-preview").src = p.approvedImage;
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
    itemEl.querySelector("summary div strong").textContent = getStatusText(p.status);
    persistState();
  } catch (err) {
    helpers.showStatus(err.message, "error");
  }
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
