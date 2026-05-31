/**
 * tiktok-studio-automation.js
 * Content script สำหรับ automate TikTok Studio upload page
 * Pattern เดียวกับ flow-automation.js
 */

let isRunning = false;

const CHUNKS = new Map();
const COMPLETED_CHUNKS = new Map();

const TIKTOK_SELECTORS = {
  fileInput: 'input[type="file"][accept*="video"], input[type="file"]',
  captionEditor: '[data-e2e="caption_container"] .public-DraftEditor-content[contenteditable="true"], .notranslate.public-DraftEditor-content[contenteditable="true"], div[contenteditable="true"]',
  locationSearch: '[data-e2e="poi_container"] input[placeholder="Search locations"]',
  visibilityCombo: '[data-e2e="video_visibility_container"] button[role="combobox"]',
  scheduleContainer: '[data-e2e="schedule_container"]',
  postNowRadio: 'input[name="postSchedule"][value="post_now"]',
  scheduleRadio: 'input[name="postSchedule"][value="schedule"]',
  addLinkContainer: '[data-e2e="anchor_container"]',
  addLinkButton: '[data-e2e="anchor_container"] button, [data-e2e="anchor_container"] [role="button"]',
  aiGeneratedSwitch: '[data-e2e="aigc_container"] input[type="checkbox"]',
  userPermChecks: '[data-e2e="user_perm_container"] input[type="checkbox"]',
  postButton: 'button[data-e2e="post_video_button"]',
  saveDraftButton: 'button[data-e2e="save_draft_button"]',
  anyButton: 'button, [role="button"]',
};

const TIKTOK_TEXT = {
  saveDraft: ["save draft", "save as draft", "save to drafts", "บันทึกฉบับร่าง", "บันทึกแบบร่าง"],
  post: ["post", "publish", "โพสต์", "เผยแพร่"],
  confirm: ["save anyway", "confirm", "continue", "post now", "ยืนยัน", "บันทึกต่อไป", "โพสต์เลย", "โพสต์ทันที"],
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "TIKTOK_STUDIO_PING") {
    sendResponse({ pong: true });
    return true;
  }
  if (message.type === "TIKTOK_POST" && message.payload?.action === "ping") {
    sendResponse({ ready: true });
    return false;
  }
  if (message.type === "CHUNK_INIT") {
    const { key, totalChunks, totalSize } = message.payload || {};
    CHUNKS.set(key, {
      chunks: new Array(totalChunks),
      totalChunks,
      received: 0,
      totalSize,
    });
    sendResponse({ ok: true });
    return false;
  }
  if (message.type === "CHUNK_PUSH") {
    const { key, index, data } = message.payload || {};
    const session = CHUNKS.get(key);
    if (!session) {
      sendResponse({ ok: false, error: "chunk session not found" });
      return false;
    }
    if (typeof session.chunks[index] !== "string") session.received += 1;
    session.chunks[index] = data;
    sendResponse({ ok: true, received: session.received });
    return false;
  }
  if (message.type === "CHUNK_DONE") {
    const { key } = message.payload || {};
    const session = CHUNKS.get(key);
    if (!session) {
      sendResponse({ ok: false, error: "chunk session not found" });
      return false;
    }
    const missing = session.chunks.some((chunk) => typeof chunk !== "string");
    if (missing) {
      sendResponse({
        ok: false,
        error: `missing chunks: received ${session.received}/${session.totalChunks}`,
      });
      return false;
    }
    const assembled = session.chunks.join("");
    COMPLETED_CHUNKS.set(key, assembled);
    CHUNKS.delete(key);
    sendResponse({ ok: true, size: assembled.length });
    return false;
  }
  if (message.type === "TIKTOK_UPLOAD_VIDEO") {
    handleVideoUpload(message.payload)
      .then((result) => {
        sendDone({ success: true });
        sendResponse({ ok: true, success: true, ...result });
      })
      .catch((err) => {
        const error = err instanceof Error ? err.message : String(err);
        sendDone({ success: false, error });
        sendResponse({ ok: false, success: false, error });
      });
    return true;
  }
  if (message.type === "TIKTOK_UPLOAD_DRAFT") {
    handleDraftUpload(message.payload)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message.type === "TIKTOK_STOP") {
    isRunning = false;
    sendResponse({ ok: true });
    return true;
  }
});

// ──────────────────────────────────────────────
// MAIN PIPELINE
// ──────────────────────────────────────────────

async function handleVideoUpload(payload = {}) {
  if (isRunning) throw new Error("กำลังอัปโหลดอยู่แล้ว");
  isRunning = true;

  try {
    sendPipelineLog("info", "เริ่มโพสต์ TikTok...");
    const normalizedPayload = normalizeVideoUploadPayload(payload);
    const {
      videoUrl,
      caption = "",
      hashtags = [],
      mode = "draft",
      postType = "draft",
      scheduleTime = "",
      location = "",
      privacy = "",
      productId = "",
      productUrl = "",
      productName = "",
      filename = "",
      aiGenerated,
      allowComment,
      allowReuse,
    } = normalizedPayload;

    if (!videoUrl) throw new Error("missing videoUrl");

    await discardRecoveryDraftIfNeeded();
    sendPipelineLog("info", "กำลังอัปโหลดวิดีโอ...");
    await uploadVideoFromUrl(videoUrl, filename || buildVideoFilename({ productId }));
    sendPipelineLog("info", "รอ TikTok ประมวลผลวิดีโอ...");
    await waitForUploadFinished();
    await fillCaptionAndHashtags(caption, hashtags);
    await applyUploadSettings({ postType, scheduleTime, location, privacy, productId, productUrl, productName, aiGenerated, allowComment, allowReuse });

    if (mode === "post") {
      await clickPost();
      log("คลิก Post สำเร็จ");
      sendPipelineLog("info", "เสร็จสิ้น");
      return { posted: true, mode, postType, scheduleTime };
    }

    await clickSaveDraftV2();
    log("คลิก Save Draft สำเร็จ");
    sendPipelineLog("info", "เสร็จสิ้น");
    return { drafted: true, mode: "draft", postType };
  } finally {
    isRunning = false;
  }
}

function normalizeVideoUploadPayload(payload) {
  const next = { ...payload };

  if (typeof next.videoUrl === "string" && next.videoUrl.startsWith("chunked:")) {
    const key = next.videoUrl.slice("chunked:".length);
    const dataUrl = COMPLETED_CHUNKS.get(key);
    if (!dataUrl) {
      throw new Error(`chunked video not assembled: ${key}`);
    }
    next.videoUrl = dataUrl;
    COMPLETED_CHUNKS.delete(key);
  }

  const postType = next.postType || next.mode || "draft";
  const mode =
    next.mode ||
    (postType === "now" || postType === "schedule" ? "post" : "draft");

  return {
    ...next,
    mode,
    postType,
    aiGenerated: next.aiGenerated ?? (
      typeof next.notAiGenerated === "boolean" ? !next.notAiGenerated : undefined
    ),
  };
}

async function handleDraftUpload(payload) {
  if (isRunning) throw new Error("กำลังอัปโหลดอยู่แล้ว");
  isRunning = true;

  try {
    const { videoBlob, caption, hashtags } = payload;

    // 1. รอ upload dropzone โหลด
    await waitForElement('input[type="file"][accept*="video"]', 15000);
    await sleep(1000);

    // 2. สร้าง File object จาก blob data และ inject เข้า file input
    await injectVideoFile(videoBlob);
    log("อัปโหลดไฟล์วิดีโอสำเร็จ");

    // 3. รอ preview โหลด (TikTok ต้องใช้เวลา process)
    await waitForElement('[class*="upload-progress"][class*="complete"], [class*="cover-wrap"]', 30000)
      .catch((err) => log("คำเตือน: " + err.message + " (จะดำเนินการขั้นต่อไป)"));
    await sleep(2000);
    log("วิดีโอโหลดเสร็จแล้ว");

    // 4. กรอก caption
    if (caption) {
      await fillCaption(caption, hashtags || []);
      log("กรอก caption สำเร็จ");
    }

    // 5. คลิก "Save as Draft"
    await clickSaveDraft();
    log("คลิก Save Draft สำเร็จ");

    // 6. รอ confirm
    await waitForElement('[class*="success"], [class*="modal"][class*="success"]', 10000).catch(() => {});
    log("บันทึก Draft สำเร็จ! ✅");

    return { drafted: true };
  } finally {
    isRunning = false;
  }
}

async function uploadVideoFromUrl(videoUrl, filename = "video.mp4") {
  const input = await waitForElement(TIKTOK_SELECTORS.fileInput, 30000);
  const file = await videoUrlToFile(videoUrl, filename);
  setInputFiles(input, file);
  log(`เลือกไฟล์วิดีโอแล้ว: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
}

async function videoUrlToFile(videoUrl, filename = "video.mp4") {
  if (videoUrl.startsWith("data:")) {
    return dataUrlToFile(videoUrl, filename);
  }

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`cannot fetch video: HTTP ${response.status}`);
  }

  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "video/mp4" });
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(",");
  if (!meta || !base64) throw new Error("invalid data url");

  const mimeMatch = meta.match(/data:(.*?);base64/i);
  const mime = mimeMatch?.[1] || "video/mp4";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new File([bytes], filename, { type: mime });
}

function setInputFiles(input, file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  Object.defineProperty(input, "files", { value: dataTransfer.files, configurable: true });
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function waitForUploadFinished(timeoutMs = 180000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const statusText = normalizeText(document.body.innerText);
    const postButton = document.querySelector(TIKTOK_SELECTORS.postButton);
    const saveDraftButton = document.querySelector(TIKTOK_SELECTORS.saveDraftButton) || findButtonByText(TIKTOK_TEXT.saveDraft);

    if (
      statusText.includes("uploaded") &&
      (isClickable(postButton) || isClickable(saveDraftButton))
    ) {
      await sleep(1500);
      return;
    }

    await sleep(1000);
  }

  throw new Error("upload timeout");
}

async function fillCaptionAndHashtags(caption, hashtags) {
  const editor = await waitForElement(TIKTOK_SELECTORS.captionEditor, 30000);
  editor.focus();
  editor.click();
  selectAllEditable(editor);
  document.execCommand("delete", false);

  if (caption) {
    document.execCommand("insertText", false, caption);
  }

  for (const rawTag of normalizeHashtags(hashtags)) {
    const tag = String(rawTag || "").replace(/^#/, "").trim();
    if (!tag) continue;
    document.execCommand("insertText", false, ` #${tag}`);
    await sleep(250);
  }

  editor.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: editor.textContent,
  }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
}

async function applyUploadSettings(settings) {
  await applyScheduleSettings(settings.postType, settings.scheduleTime);
  await applyProductLink(settings.productId, settings.productUrl, settings.productName);

  if (settings.location) {
    const locationInput = document.querySelector(TIKTOK_SELECTORS.locationSearch);
    if (locationInput) {
      locationInput.focus();
      locationInput.value = "";
      locationInput.dispatchEvent(new Event("input", { bubbles: true }));
      locationInput.value = settings.location;
      locationInput.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(1200);
      const option = findButtonByText([settings.location]);
      if (isClickable(option)) realClick(option);
    }
  }

  if (settings.privacy) {
    const combo = document.querySelector(TIKTOK_SELECTORS.visibilityCombo);
    if (isClickable(combo)) {
      realClick(combo);
      await sleep(500);
      const option = findButtonByText([settings.privacy]);
      if (isClickable(option)) realClick(option);
    }
  }

  await setCheckboxState(document.querySelector(TIKTOK_SELECTORS.aiGeneratedSwitch), settings.aiGenerated);

  const permissionChecks = [...document.querySelectorAll(TIKTOK_SELECTORS.userPermChecks)];
  await setCheckboxState(permissionChecks[0], settings.allowComment);
  await setCheckboxState(permissionChecks[1], settings.allowReuse);
}

async function applyProductLink(productId, productUrl, productName) {
  const productKey = String(productId || productUrl || "").trim();
  if (!productKey) return;

  const addButton = document.querySelector(TIKTOK_SELECTORS.addLinkButton) || findButtonByText(["add link", "add", "เพิ่มลิงก์", "เพิ่ม"]);
  if (!isClickable(addButton)) {
    log("ไม่พบปุ่ม Add link สำหรับสินค้า");
    return;
  }

  realClick(addButton);
  await sleep(1200);

  const nextButton = findButtonByText(["ถัดไป", "next"]);
  if (isClickable(nextButton)) {
    realClick(nextButton);
    await sleep(1200);
  }

  const showcaseOption = findButtonByText(["นำเสนอสินค้า", "showcase product", "product showcase", "สินค้า"]);
  if (isClickable(showcaseOption)) {
    realClick(showcaseOption);
    await sleep(1000);
  }

  const searchInput = findVisibleInput(["search", "ค้นหา", "product", "สินค้า"]);
  if (!searchInput) {
    log("เปิด Add link แล้ว แต่ไม่พบช่องค้นหาสินค้า");
    return;
  }

  searchInput.focus();
  searchInput.value = "";
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  searchInput.value = productKey;
  searchInput.dispatchEvent(new Event("input", { bubbles: true }));
  await sleep(1800);

  const selectableProduct = findSelectableProduct(productId, productUrl);
  if (!selectableProduct) {
    log(`ไม่พบสินค้าในผลค้นหา: ${productKey}`);
    return;
  }

  realClick(selectableProduct);
  await sleep(800);

  const productNextButton = findButtonByText(["ถัดไป", "next"]);
  if (isClickable(productNextButton)) {
    realClick(productNextButton);
    await sleep(1000);
  }

  const titleInput = findVisibleInput(["ชื่อสินค้า", "product name", "title"]);
  if (titleInput) {
    setNativeValue(titleInput, buildProductLinkTitle(productName, productId));
    await sleep(400);
  }

  const finalAddButton = findButtonByText(["เพิ่ม", "add"]);
  if (isClickable(finalAddButton)) {
    realClick(finalAddButton);
  }
}

async function applyScheduleSettings(postType, scheduleTime) {
  if (!postType || postType === "draft") return;

  if (postType === "now") {
    await setRadioState(document.querySelector(TIKTOK_SELECTORS.postNowRadio), true);
    return;
  }

  if (postType !== "schedule") {
    throw new Error(`unsupported postType: ${postType}`);
  }

  if (!scheduleTime) {
    throw new Error("scheduleTime is required when postType is schedule");
  }

  await setRadioState(document.querySelector(TIKTOK_SELECTORS.scheduleRadio), true);
  await sleep(800);
  await fillScheduleTime(scheduleTime);
}

async function setRadioState(input, desired) {
  if (!input) return;
  if (Boolean(input.checked) === Boolean(desired)) return;
  realClick(input);
  await sleep(350);
}

async function fillScheduleTime(scheduleTime) {
  const date = new Date(scheduleTime);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`invalid scheduleTime: ${scheduleTime}`);
  }

  const container = document.querySelector(TIKTOK_SELECTORS.scheduleContainer) || document;
  const inputs = [...container.querySelectorAll("input")].filter(isVisible);
  if (!inputs.length) {
    log("ไม่พบช่องตั้งเวลา จะปล่อยให้ TikTok ใช้ค่าเดิมหลังเลือก Schedule");
    return;
  }

  const dateInput = inputs.find((input) => input.type === "date") || inputs[0];
  const timeInput = inputs.find((input) => input.type === "time") || inputs[1];
  const yyyyMmDd = toInputDate(date);
  const hhMm = toInputTime(date);

  const readonlyDateSet = setReadonlyInputValue(/^\d{4}-\d{2}-\d{2}$/, yyyyMmDd);
  const readonlyTimeSet = setReadonlyInputValue(/^\d{2}:\d{2}$/, hhMm);
  if (readonlyDateSet || readonlyTimeSet) {
    await sleep(300);
    return;
  }

  setInputValue(dateInput, yyyyMmDd);
  if (timeInput) setInputValue(timeInput, hhMm);
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

function setInputValue(input, value) {
  if (!input) return;
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.blur();
}

function setReadonlyInputValue(pattern, value) {
  const input = findReadonlyInput(pattern);
  if (!input) return false;

  input.removeAttribute("readonly");
  setInputValue(input, value);
  input.setAttribute("readonly", "readonly");
  return true;
}

function findReadonlyInput(pattern) {
  const inputs = [...document.querySelectorAll(
    'input[readonly][type="text"], input.TUXTextInputCore-input[readonly]'
  )];

  return inputs.find((input) => pattern.test(input.value)) || null;
}

async function setCheckboxState(input, desired) {
  if (desired === undefined || !input) return;
  if (Boolean(input.checked) === Boolean(desired)) return;
  realClick(input);
  await sleep(250);
}

async function clickSaveDraftV2() {
  const button = document.querySelector(TIKTOK_SELECTORS.saveDraftButton) ||
    await waitForButtonByText(TIKTOK_TEXT.saveDraft, 30000);

  if (!isClickable(button)) throw new Error("save draft button is disabled");
  realClick(button);
  await clickConfirmIfNeeded();
}

async function clickPost() {
  const button = await waitForElement(TIKTOK_SELECTORS.postButton, 30000);
  if (!isClickable(button)) throw new Error("post button is disabled");
  realClick(button);
  await clickConfirmIfNeeded();
}

async function clickConfirmIfNeeded() {
  await sleep(1500);
  const confirmButton = findButtonByText(TIKTOK_TEXT.confirm);
  if (isClickable(confirmButton)) {
    realClick(confirmButton);
  }
}

async function discardRecoveryDraftIfNeeded() {
  const bodyText = normalizeText(document.body.innerText);
  const hasRecoveryBanner =
    bodyText.includes("continue editing") ||
    bodyText.includes("wasn't saved") ||
    bodyText.includes("ยังไม่ได้บันทึก") ||
    bodyText.includes("แก้ไขต่อ");

  if (!hasRecoveryBanner) return;

  const discardButton = findButtonByText(["discard", "start over", "reset", "ทิ้ง", "เริ่มใหม่", "ล้าง"]);
  if (isClickable(discardButton)) {
    realClick(discardButton);
    await sleep(1000);
  }
}

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

async function injectVideoFile(blobData) {
  // blobData เป็น base64 string จาก background
  const byteString = atob(blobData.data);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
  const blob = new Blob([ab], { type: blobData.mimeType || "video/mp4" });
  const file = new File([blob], blobData.filename || "tiktok_video.mp4", { type: blob.type });

  const input = document.querySelector('input[type="file"][accept*="video"]');
  if (!input) throw new Error("ไม่พบช่อง upload วิดีโอ");

  const dt = new DataTransfer();
  dt.items.add(file);
  Object.defineProperty(input, "files", { value: dt.files, configurable: true });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function fillCaption(caption, hashtags) {
  // รอ caption editor โหลด (TikTok ใช้ contenteditable div)
  const captionEl = await waitForElement(
    '[class*="caption"] [contenteditable], [data-testid*="caption"] [contenteditable], .notranslate[contenteditable], [contenteditable="true"], [contenteditable]',
    10000
  );

  captionEl.focus();
  captionEl.click();
  await sleep(300);

  // ล้างข้อความเก่า
  document.execCommand("selectAll");
  document.execCommand("delete");
  await sleep(200);

  // พิมพ์ caption
  document.execCommand("insertText", false, caption);
  await sleep(300);

  // เพิ่ม hashtags
  for (const tag of normalizeHashtags(hashtags)) {
    const normalized = tag.startsWith("#") ? tag : `#${tag}`;
    document.execCommand("insertText", false, ` ${normalized}`);
    await sleep(150);
  }

  captionEl.dispatchEvent(new Event("input", { bubbles: true }));
  captionEl.dispatchEvent(new Event("change", { bubbles: true }));
}

async function clickSaveDraft() {
  // ลอง selector หลายแบบ (TikTok เปลี่ยน class บ่อย)
  const draftSelectors = [
    'button[data-testid*="draft"]',
    'button[class*="draft"]',
    'button:not([disabled])',  // fallback: หา button ที่มีข้อความ Draft
  ];

  for (const selector of draftSelectors) {
    const buttons = [...document.querySelectorAll(selector)];
    const draftBtn = buttons.find(btn =>
      /draft|ร่าง/i.test(btn.textContent)
    );
    if (draftBtn) {
      draftBtn.click();
      return;
    }
  }

  // ลอง XPath fallback (แปลงเป็นตัวพิมพ์เล็กทั้งหมดในการตรวจหาคำว่า draft)
  const xpath = "//button[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'draft') or contains(., 'ร่าง')]";
  const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  if (result.singleNodeValue) {
    result.singleNodeValue.click();
    return;
  }

  throw new Error("ไม่พบปุ่ม Save Draft — ลองกดเองบน TikTok Studio");
}

// ──────────────────────────────────────────────
// UTILS
// ──────────────────────────────────────────────

function waitForElement(selector, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(el);
      }
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout รอ element: ${selector}`));
    }, timeoutMs);

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function findButtonByText(words) {
  const normalizedWords = words.map((word) => normalizeText(word)).filter(Boolean);
  const elements = document.querySelectorAll(TIKTOK_SELECTORS.anyButton);

  for (const element of elements) {
    const text = normalizeText(element.textContent);
    if (!text) continue;

    const matched = normalizedWords.some((word) => text === word || text.includes(word));
    if (!matched) continue;

    const button = element.closest("button, [role='button']") || element;
    if (isVisible(button)) return button;
  }

  return null;
}

function findVisibleInput(words = []) {
  const normalizedWords = words.map((word) => normalizeText(word)).filter(Boolean);
  const inputs = document.querySelectorAll("input:not([type='hidden']), textarea, [contenteditable='true']");

  for (const input of inputs) {
    if (!isVisible(input)) continue;
    const text = normalizeText([
      input.getAttribute("aria-label"),
      input.getAttribute("placeholder"),
      input.getAttribute("name"),
      input.closest("[data-e2e]")?.textContent,
    ].filter(Boolean).join(" "));

    if (!normalizedWords.length || normalizedWords.some((word) => text.includes(word))) {
      return input;
    }
  }

  return null;
}

function findSelectableProduct(productId, productUrl) {
  const keys = [productId, productUrl].map((value) => normalizeText(value)).filter(Boolean);
  const controls = document.querySelectorAll("input[type='checkbox'], input[type='radio'], button, [role='button'], [role='checkbox'], [role='radio']");

  for (const control of controls) {
    if (!isVisible(control)) continue;
    const card = control.closest("label, [role='row'], [class*='card'], [class*='item'], [class*='product'], div") || control;
    const text = normalizeText(card.textContent);
    if (!keys.length || keys.some((key) => text.includes(key))) {
      return control;
    }
  }

  return null;
}

function buildProductLinkTitle(productName, productId) {
  const base = String(productName || productId || "สินค้า").replace(/\s+/g, " ").trim();
  return Array.from(base).slice(0, 25).join("");
}

function setNativeValue(element, value) {
  element.focus();

  if (element.isContentEditable) {
    selectAllEditable(element);
    document.execCommand("delete", false);
    document.execCommand("insertText", false, value);
  } else {
    element.value = "";
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function buildVideoFilename(productInfo = {}) {
  const rawId = productInfo.productId || productInfo.id || "product";
  const safeId = String(rawId).replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "product";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeId}_${date}_tiktok.mp4`;
}

async function waitForButtonByText(words, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const button = findButtonByText(words);
    if (isClickable(button)) return button;
    await sleep(500);
  }

  throw new Error(`button not found: ${words.join(", ")}`);
}

function isClickable(element) {
  if (!element) return false;
  if (!isVisible(element)) return false;
  if (element.disabled) return false;
  if (element.getAttribute("aria-disabled") === "true") return false;
  return true;
}

function isVisible(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeHashtags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  const tags = [];

  for (const rawTag of rawTags) {
    const cleaned = String(rawTag || "").trim().replace(/\s+/g, "").replace(/^#+/, "");
    if (!cleaned) continue;

    const tag = `#${cleaned}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
    if (tags.length >= 5) break;
  }

  return tags;
}

function selectAllEditable(element) {
  const range = document.createRange();
  range.selectNodeContents(element);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function realClick(element) {
  element.scrollIntoView({ block: "center", inline: "center" });

  const rect = element.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const options = {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX: x,
    clientY: y,
    button: 0,
  };

  element.dispatchEvent(new PointerEvent("pointerdown", { ...options, pointerId: 1, pointerType: "mouse" }));
  element.dispatchEvent(new MouseEvent("mousedown", options));
  element.dispatchEvent(new PointerEvent("pointerup", { ...options, pointerId: 1, pointerType: "mouse" }));
  element.dispatchEvent(new MouseEvent("mouseup", options));
  element.dispatchEvent(new MouseEvent("click", options));
}

function log(msg) {
  chrome.runtime.sendMessage({ type: "TIKTOK_STUDIO_LOG", message: msg }).catch(() => {});
}

function sendDone(result) {
  chrome.runtime.sendMessage({
    type: "TIKTOK_DONE",
    payload: result,
  }).catch(() => {});
}

function sendPipelineLog(level, message) {
  chrome.runtime.sendMessage({
    type: "PIPELINE_LOG",
    payload: {
      source: "tiktok-post",
      level,
      message,
      time: Date.now(),
    },
  }).catch(() => {});
}
