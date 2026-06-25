/**
 * tiktok-studio-automation.js
 * Content script สำหรับ automate TikTok Studio upload page
 * Pattern เดียวกับ flow-automation.js
 */

let isRunning = false;
let finalSubmitInProgress = false;
let stopRequested = false;

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

// ป้องกัน register listener ซ้ำ (โหลดทั้งจาก auto content-script และ background inject)
if (globalThis.__tiktokStudioListenerAdded) {
  console.log("[TikTokPost] listener already registered — skip duplicate");
} else {
  globalThis.__tiktokStudioListenerAdded = true;

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
    // ตอบกลับทันที (started) แล้วรัน pipeline เบื้องหลัง — กัน message channel ปิดตอน pipeline ยาว
    sendResponse({ ok: true, started: true });
    handleVideoUpload(message.payload)
      .then((result) => sendDone({ success: true, jobId: message.payload?.jobId || "", ...result }))
      .catch((err) => {
        if (err?.code === "STOP_REQUESTED") {
          sendDone({ success: true, stopped: true, jobId: message.payload?.jobId || "" });
          return;
        }
        const error = err instanceof Error ? err.message : String(err);
        sendDone({ success: false, error, jobId: message.payload?.jobId || "" });
      });
    return false;
  }
  if (message.type === "TIKTOK_UPLOAD_DRAFT") {
    handleDraftUpload(message.payload)
      .then((result) => sendResponse({ ok: true, ...result }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (message.type === "TIKTOK_STOP") {
    stopRequested = true;
    isRunning = false;
    sendResponse({ ok: true });
    return true;
  }
});

} // end guard __tiktokStudioListenerAdded

// ──────────────────────────────────────────────
// MAIN PIPELINE
// ──────────────────────────────────────────────

async function handleVideoUpload(payload = {}) {
  if (isRunning) throw new Error("กำลังอัปโหลดอยู่แล้ว");
  isRunning = true;
  stopRequested = false;
  logSeq = 0;

  try {
    assertNotStopped();
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

    assertNotStopped();
    await discardRecoveryDraftIfNeeded();
    assertNotStopped();
    sendPipelineLog("info", "กำลังอัปโหลดวิดีโอ...");
    await uploadVideoFromUrl(videoUrl, filename || buildVideoFilename({ productId }));
    assertNotStopped();
    sendPipelineLog("info", "รอ TikTok ประมวลผลวิดีโอ...");
    await waitForUploadFinished();
    assertNotStopped();
    await fillCaptionAndHashtags(caption, hashtags);
    assertNotStopped();
    const settingsResult = await applyUploadSettings({ postType, scheduleTime, location, privacy, productId, productUrl, productName, aiGenerated, allowComment, allowReuse });
    assertNotStopped();

    if (mode === "post") {
      const blockers = [];
      if (settingsResult.productRequired && !settingsResult.productAdded) blockers.push("เพิ่มลิงก์สินค้าไม่สำเร็จ");
      if (!settingsResult.aigcOk) blockers.push("ตั้ง AI-generated ไม่สำเร็จ");

      if (blockers.length) {
        throw new Error(`โพสต์ไม่ได้: ${blockers.join(", ")}`);
      }

      // ย้ำติ๊ก AI-generated content อีกครั้งก่อนกด Post ทุกครั้ง (กันถูกรีเซ็ตหลังเพิ่มสินค้า)
      log("ตรวจ AI-generated content ก่อนโพสต์...");
      const aigcBeforePost = await setAigcSwitch(aiGenerated ?? true);
      assertNotStopped();
      if (!aigcBeforePost) {
        throw new Error("ตั้ง AI-generated ไม่สำเร็จก่อนโพสต์");
      }

      assertNotStopped();
      await clickPost();
      log("คลิก Post สำเร็จ");
      sendPipelineLog("info", "เสร็จสิ้น");
      return { posted: true, mode, postType, scheduleTime };
    }

    // โหมด draft: ย้ำ AI-generated content ก่อนบันทึกเช่นกัน
    log("ตรวจ AI-generated content ก่อนบันทึก draft...");
    const aigcBeforeDraft = await setAigcSwitch(aiGenerated ?? true);
    assertNotStopped();
    if (!aigcBeforeDraft) throw new Error("ตั้ง AI-generated ไม่สำเร็จก่อนบันทึก draft");
    await clickSaveDraftV2();
    log("คลิก Save Draft สำเร็จ");
    sendPipelineLog("info", "เสร็จสิ้น");
    return { drafted: true, mode: "draft", postType };
  } finally {
    isRunning = false;
    finalSubmitInProgress = false;
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
    finalSubmitInProgress = false;
  }
}

async function uploadVideoFromUrl(videoUrl, filename = "video.mp4") {
  assertNotStopped();
  const file = await videoUrlToFile(videoUrl, filename);
  assertNotStopped();
  log(`สร้างไฟล์วิดีโอแล้ว: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${file.type})`);
  const input = await findUploadInput(45000);
  assertNotStopped();
  log("พบช่อง upload แล้ว กำลังยัดไฟล์ (DataTransfer)...");
  setInputFiles(input, file);

  // fallback: ถ้า drop แล้ว input ยังว่าง → re-decode base64 ยัดผ่าน input.files ตรง ๆ
  await sleep(400);
  assertNotStopped();
  if (!input.files || input.files.length === 0) {
    log("DataTransfer ไม่ติด — fallback ยัด base64 File ผ่าน input.files");
    forceSetInputFile(input, file);
  } else {
    log("ไฟล์ติด input แล้วผ่าน DataTransfer");
  }

  await verifyFileAccepted(input, file);
  assertNotStopped();
  log(`เลือกไฟล์วิดีโอแล้ว: ${file.name}`);
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
  // 1) ลองทาง DataTransfer drag-drop ก่อน (TikTok dropzone รับทางนี้เป็นหลัก)
  dispatchFileDrop(input, file);

  // 2) แล้วค่อยยัด input.files ผ่าน native setter / defineProperty เป็น fallback
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  try {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files")?.set;
    if (nativeSetter) nativeSetter.call(input, dataTransfer.files);
  } catch (_) {}
  if (!input.files || input.files.length === 0) {
    Object.defineProperty(input, "files", { value: dataTransfer.files, configurable: true });
  }

  input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1, pointerType: "mouse" }));
  input.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  input.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1, pointerType: "mouse" }));
}

function forceSetInputFile(input, file) {
  const dt = new DataTransfer();
  dt.items.add(file);
  try {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files")?.set;
    if (nativeSetter) nativeSetter.call(input, dt.files);
  } catch (_) {}
  if (!input.files || input.files.length === 0) {
    Object.defineProperty(input, "files", { value: dt.files, configurable: true });
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function findUploadInput(timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  let lastTick = -1;

  while (Date.now() < deadline) {
    const docs = [document, ...sameOriginFrameDocuments()];
    for (const doc of docs) {
      const inputs = [...doc.querySelectorAll(TIKTOK_SELECTORS.fileInput)]
        .filter(input => !input.disabled && input.type === "file");
      if (inputs.length) {
        log("✅ พบช่อง upload วิดีโอ");
        return inputs.find(input => String(input.accept || "").toLowerCase().includes("video")) || inputs[0];
      }
    }

    // กดปุ่มเปิด upload ซ้ำทุกครั้งที่วน (กันเน็ตช้า/หน้ายังไม่พร้อม)
    clickUploadEntryPoint();
    const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remain !== lastTick) {
      lastTick = remain;
      log(`⏳ หาช่อง upload วิดีโอ... เหลือ ${remain}s`);
    }
    await sleep(800);
  }

  throw new Error("ไม่พบช่อง upload วิดีโอใน TikTok Studio (หมดเวลา)");
}

function sameOriginFrameDocuments() {
  const docs = [];
  for (const frame of document.querySelectorAll("iframe")) {
    try {
      const doc = frame.contentDocument;
      if (doc) docs.push(doc);
    } catch (_) {
      // cross-origin frame — เข้าไม่ได้ ข้าม
    }
  }
  return docs;
}

function clickUploadEntryPoint() {
  const labels = [
    "select video",
    "select file",
    "upload video",
    "choose file",
    "เลือกวิดีโอ",
    "เลือกไฟล์",
    "อัปโหลดวิดีโอ",
    "อัพโหลดวิดีโอ"
  ];
  const button = findButtonByText(labels);
  if (button) {
    realClick(button);
    return;
  }

  const dropzone = [...document.querySelectorAll("[role='button'], label, div, section")]
    .filter(isVisible)
    .find((el) => {
      const text = normalizeText(el.textContent);
      return text.includes("upload") || text.includes("select video") || text.includes("เลือกวิดีโอ") || text.includes("อัปโหลด");
    });
  if (dropzone) realClick(dropzone);
}

function dispatchFileDrop(input, file) {
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  const target = input.closest("label, [role='button'], div, section") || input;
  for (const type of ["dragenter", "dragover", "drop"]) {
    target.dispatchEvent(new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer
    }));
  }
}

async function verifyFileAccepted(input, file) {
  const deadline = Date.now() + 15000;
  let hadInputFile = false;
  while (Date.now() < deadline) {
    const hasInputFile = input.files?.length > 0;
    if (hasInputFile) hadInputFile = true;
    const bodyText = normalizeText(document.body.innerText);
    const fileNameVisible = bodyText.includes(normalizeText(file.name));
    const uploadStarted =
      bodyText.includes("uploading") ||
      bodyText.includes("uploaded") ||
      bodyText.includes("processing") ||
      bodyText.includes("กำลังอัปโหลด") ||
      bodyText.includes("อัปโหลด") ||
      Boolean(document.querySelector("[class*='progress'], [class*='cover'], video"));

    if (hasInputFile && (fileNameVisible || uploadStarted)) return;
    await sleep(500);
  }

  // TikTok ยังไม่แสดงผลตอบสนองชัดเจน แต่ถ้าไฟล์อยู่ใน input แล้วก็ปล่อยให้ waitForUploadFinished ตรวจต่อ
  if (hadInputFile) {
    log("คำเตือน: ยังไม่เห็นสัญญาณ upload ชัดเจน แต่ไฟล์อยู่ใน input แล้ว — ดำเนินการต่อ");
    return;
  }
  throw new Error("TikTok Studio ไม่รับไฟล์วิดีโอหลังใส่เข้า input");
}

async function waitForUploadFinished(timeoutMs = 300000) {
  const deadline = Date.now() + timeoutMs;
  let lastLog = 0;

  while (Date.now() < deadline) {
    assertNotStopped();
    const statusText = normalizeText(document.body.innerText);
    const postButton = document.querySelector(TIKTOK_SELECTORS.postButton);
    const saveDraftButton = document.querySelector(TIKTOK_SELECTORS.saveDraftButton) || findButtonByText(TIKTOK_TEXT.saveDraft);

    // สัญญาณว่าโปรเซสเสร็จ: ปุ่ม Post/Save กดได้ (ไม่ผูกกับภาษา) — เป็นตัวชี้วัดหลัก
    const buttonReady = isClickable(postButton) || isClickable(saveDraftButton);

    // ยังกำลังประมวลผลอยู่หรือไม่ (มี progress bar / สถานะ uploading-processing ใด ๆ)
    const stillProcessing =
      statusText.includes("uploading") ||
      statusText.includes("processing") ||
      statusText.includes("กำลังอัปโหลด") ||
      statusText.includes("กำลังประมวลผล") ||
      Boolean(document.querySelector("[class*='progress'][role='progressbar'], progress"));

    const uploadedHint =
      statusText.includes("uploaded") ||
      statusText.includes("อัปโหลดแล้ว") ||
      statusText.includes("อัปโหลดสำเร็จ") ||
      Boolean(document.querySelector("video, [class*='cover']"));

    if (buttonReady && !stillProcessing && (uploadedHint || hasVideoPreview())) {
      await sleep(1500);
      return;
    }

    if (Date.now() - lastLog > 10000) {
      lastLog = Date.now();
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      log(`⏳ รอ TikTok ประมวลผลวิดีโอ... เหลือ ${remain}s (ปุ่มพร้อม=${buttonReady}, กำลังประมวลผล=${stillProcessing})`);
    }
    await sleep(1000);
  }

  throw new Error("upload timeout (หมดเวลาประมวลผลวิดีโอ)");
}

function hasVideoPreview() {
  return Boolean(document.querySelector("video[src], [class*='cover'] img, [class*='preview'] video"));
}

async function fillCaptionAndHashtags(caption, hashtags) {
  assertNotStopped();
  const editor = await retryUntil("รอช่อง Caption", () => document.querySelector(TIKTOK_SELECTORS.captionEditor), 30000);
  assertNotStopped();
  if (!editor) {
    throw new Error("ไม่พบช่อง Caption หลังหมดเวลา");
  }
  editor.focus();
  editor.click();
  selectAllEditable(editor);
  document.execCommand("delete", false);

  if (caption) {
    document.execCommand("insertText", false, caption);
  }

  for (const rawTag of normalizeHashtags(hashtags)) {
    assertNotStopped();
    const tag = String(rawTag || "").replace(/^#/, "").trim();
    if (!tag) continue;
    document.execCommand("insertText", false, ` #${tag}`);
    await sleep(250);
    // ปิด popup แนะนำแฮชแท็ก ไม่งั้นพอ focus หลุด (กดโพส) TikTok จะ commit suggestion ทับ
    dismissCaptionSuggestion(editor);
    await sleep(150);
  }

  // เคาะ popup ที่อาจค้างเป็นรอบสุดท้าย แล้วค่อยยิง input/change ให้ DraftJS อัปเดต state
  dismissCaptionSuggestion(editor);
  await sleep(150);
  editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: " " }));
  editor.dispatchEvent(new Event("change", { bubbles: true }));
}

// ปิดกล่อง suggestion (hashtag/mention) ของ TikTok caption editor ด้วย Escape
function dismissCaptionSuggestion(editor) {
  const opts = { key: "Escape", code: "Escape", keyCode: 27, which: 27, bubbles: true };
  (editor || document.body).dispatchEvent(new KeyboardEvent("keydown", opts));
  (editor || document.body).dispatchEvent(new KeyboardEvent("keyup", opts));
}

async function applyUploadSettings(settings) {
  assertNotStopped();
  await applyScheduleSettings(settings.postType, settings.scheduleTime);
  assertNotStopped();
  const productRequired = Boolean(String(settings.productId || settings.productUrl || "").trim());
  const productAdded = await applyProductLink(settings.productId, settings.productUrl, settings.productName);
  assertNotStopped();
  if (productRequired && !productAdded) {
    throw new Error("เพิ่มลิงก์สินค้าไม่สำเร็จ");
  }

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

  const aigcOk = await setAigcSwitch(settings.aiGenerated);
  assertNotStopped();
  if (!aigcOk) {
    throw new Error("ตั้ง AI-generated ไม่สำเร็จ");
  }

  const permissionChecks = [...document.querySelectorAll(TIKTOK_SELECTORS.userPermChecks)];
  await setCheckboxState(permissionChecks[0], settings.allowComment);
  await setCheckboxState(permissionChecks[1], settings.allowReuse);

  return { productRequired, productAdded, aigcOk };
}

// แท็บถูกเลือกอยู่หรือยัง — รองรับ data-active / aria-selected / class active|selected
function isTabActive(tab) {
  if (!tab) return false;
  const el = tab.closest('[role="tab"], [data-active], button') || tab;
  return (
    el.getAttribute("data-active") === "true" ||
    el.getAttribute("aria-selected") === "true" ||
    /(^|\s)(active|selected)(\s|$)|--active|--selected/i.test(el.className || "")
  );
}

async function applyProductLink(productId, productUrl, productName) {
  const productKey = String(productId || productUrl || "").trim();
  if (!productKey) return true; // ไม่ได้ระบุสินค้า ไม่ถือว่าพลาด

  const selectorModalOpen = () =>
    document.querySelector('.product-selector-modal, [aria-label="Add product links"]') ||
    document.querySelector('input[placeholder="Search products"]');

  // STEP 1: หาปุ่ม Add link → คลิก "ครั้งเดียว" → รอ modal เปิด (ไม่คลิกซ้ำ)
  const addBtn = await retryUntil("STEP1 หาปุ่ม Add link", () => {
    const b = document.querySelector(TIKTOK_SELECTORS.addLinkButton) || findButtonByText(["add link", "เพิ่มลิงก์", "add"]);
    return isClickable(b) ? b : null;
  }, 30000, 1500, () => {
    const b = document.querySelector(TIKTOK_SELECTORS.addLinkButton) || findButtonByText(["add link", "เพิ่มลิงก์", "add"]);
    return b ? `พบปุ่ม Add link clickable=${isClickable(b)}` : "ยังไม่พบปุ่ม Add link";
  });
  if (!addBtn) { log("❌ ไม่พบปุ่ม Add link"); return false; }
  await sleep(600);
  realClick(addBtn);
  try { addBtn.click(); } catch (_) {}
  log("STEP1 คลิก Add link (ครั้งเดียว) — รอ modal");
  const opened = await retryUntil("STEP1b รอ modal เปิด", () =>
    (document.querySelector('.TUXModal, [role="dialog"]') || selectorModalOpen()) ? true : null,
    20000, 1500, () => "modal=" + !!(document.querySelector('.TUXModal, [role="dialog"]') || selectorModalOpen()));
  if (!opened) { log("❌ คลิก Add link แล้ว modal ไม่เปิด"); return false; }

  // STEP 2: modal "Add link" (Link type = Products) → กด Next "ครั้งเดียว" → รอหน้าเลือกสินค้า
  if (!selectorModalOpen()) {
    const ltNext = await retryUntil("STEP2 หาปุ่ม Next (Link type=Products)", () => {
      const ltModal = [...document.querySelectorAll('.TUXModal, [role="dialog"]')].find((el) =>
        isVisible(el) && el.querySelector(".button-group, .TUXSelect") && /link type|products/i.test(el.textContent)
      );
      if (!ltModal) return selectorModalOpen() ? "skip" : null; // ไม่มี modal นี้ = ข้ามไปเลือกสินค้าแล้ว
      const b = modalPrimaryButton(["next", "ถัดไป"]) || modalFooterButton(["next", "ถัดไป"]) || findButtonByText(["next", "ถัดไป"]);
      return isClickable(b) ? b : null;
    }, 20000, 1500, () => diagPrimaryButton(["next", "ถัดไป"]));
    if (ltNext && ltNext !== "skip") {
      await sleep(500);
      realClick(ltNext);
      try { ltNext.click(); } catch (_) {}
      log("STEP2 คลิก Next (ครั้งเดียว) — รอหน้าเลือกสินค้า");
    }
  }

  // STEP 3: รอ modal เลือกสินค้า
  const selectorReady = await retryUntil("STEP3 รอ modal เลือกสินค้า", () => selectorModalOpen() ? true : null, 30000);
  if (!selectorReady) return false;

  // STEP 4: เลือกแท็บ Showcase products + รอช่องค้นหา
  const searchInput = await retryUntil("STEP4 เลือก Showcase + รอช่องค้นหา", () => {
    const tab = findButtonByText(["showcase products", "นำเสนอสินค้า"]);
    // คลิกแท็บ Showcase ถ้ายังไม่ active — รองรับทั้ง data-active="false", aria-selected, class
    if (isClickable(tab) && !isTabActive(tab)) realClick(tab);
    return document.querySelector('input[placeholder="Search products"], .product-search-input input, .product-selector-modal input[placeholder*="Search product"]');
  }, 30000);
  if (!searchInput) return false;

  // STEP 5: กรอก ID + กดค้นหา วนจนเจอแถวสินค้า
  const row = await retryUntil(`STEP5 ค้นหาสินค้า ${productKey}`, async () => {
    typeIntoInput(searchInput, "");
    await sleep(200);
    typeIntoInput(searchInput, productKey);
    triggerSearch(searchInput);
    await sleep(1500);
    return findProductRow(productKey);
  }, 40000, 2000, () => {
    const n = document.querySelectorAll('tr.product-tb-row').length;
    return `ผลค้นหา ${n} แถว, ตรง ID=${!!findProductRow(productKey)}`;
  });
  if (!row) {
    log(`❌ ไม่พบสินค้า: ${productKey}`);
    return false;
  }
  const selectedRowTitle = extractProductRowTitle(row, productKey);

  // STEP 6a: เลือกสินค้า (ครั้งเดียว) แล้วรอปุ่ม Next enable — re-select เฉพาะถ้ายังไม่ enable
  await selectProductRadio(findProductRow(productKey) || row);
  log("STEP6 เลือกสินค้าแล้ว — รอ Next enable");
  const diagNext = () => {
    const b = productSelectorNext();
    return b ? `Next: clickable=${isClickable(b)} disabled=${b.disabled} aria=${b.getAttribute("aria-disabled")}` : "ยังไม่พบปุ่ม Next ใน product-selector-modal";
  };
  let nextBtn = await retryUntil("STEP6a รอ Next enable", () => {
    const b = productSelectorNext();
    return isClickable(b) ? b : null;
  }, 25000, 1000, diagNext);
  if (!nextBtn) {
    log("STEP6 Next ยังไม่ enable — เลือกสินค้าซ้ำอีกรอบ");
    await selectProductRadio(findProductRow(productKey) || row);
    nextBtn = await retryUntil("STEP6a รอ Next enable (รอบ2)", () => {
      const b = productSelectorNext();
      return isClickable(b) ? b : null;
    }, 25000, 1000, diagNext);
  }
  if (!nextBtn) {
    log("❌ ปุ่ม Next ไม่ enable (เลือกสินค้าไม่ติด)");
    return false;
  }

  // STEP 6b: รอ Next display/enable นิ่งก่อน → re-fetch ปุ่มสด ๆ → คลิกครั้งเดียว
  await sleep(900); // รอปุ่ม Next แสดง/นิ่ง
  const freshNext = productSelectorNext();
  const btnToClick = isClickable(freshNext) ? freshNext : nextBtn;
  log(`STEP6b คลิก Next (clickable=${isClickable(btnToClick)})`);
  realClick(btnToClick);
  try { btnToClick.click(); } catch (_) {}
  let advanced = await retryUntil("STEP6b รอเข้าหน้าตั้งชื่อ", () =>
    (findProductNameInput() || !document.querySelector(".product-table")) ? true : null,
    10000, 1500);
  if (!advanced) {
    log("STEP6b ยังไม่เปลี่ยนหน้า — กด Next ซ้ำอีกครั้ง");
    const b = productSelectorNext();
    if (isClickable(b)) { realClick(b); try { b.click(); } catch (_) {} }
    advanced = await retryUntil("STEP6b รอเข้าหน้าตั้งชื่อ (รอบ2)", () =>
      (findProductNameInput() || !document.querySelector(".product-table")) ? true : null,
      10000, 1500);
  }
  if (!advanced) {
    log("❌ กด Next แล้วไม่เข้าหน้าตั้งชื่อ");
    return false;
  }

  // STEP 7: รอเข้าหน้าตั้งชื่อสินค้า (modal "Product name")
  const titleInput = await retryUntil("STEP7 เข้าหน้าตั้งชื่อสินค้า", () => findProductNameInput(), 20000);

  // STEP 8: แก้ชื่อ (clean) — ตั้งชื่อสินค้าใหม่ที่ตัดอักขระแปลกๆ ออก
  if (titleInput) {
    const existingTitle = titleInput.value;
    const finalTitle = await buildProductLinkTitle(selectedRowTitle || productName, existingTitle);
    titleInput.focus();
    try { titleInput.select(); } catch (_) {}
    typeIntoInput(titleInput, finalTitle);
    log(`[Product Link] 🎯 STEP8 ตั้งชื่อสินค้าสำเร็จ: "${finalTitle}" (ชื่อเดิม: "${existingTitle}")`);
    await sleep(500);
  } else {
    log(`[Product Link] ⚠️ STEP8 ไม่พบกล่องข้อความให้กรอกชื่อสินค้า (จะลองกดเพิ่มต่อโดยใช้ค่าเริ่มต้น):
    - ID สินค้า: ${productId || "ไม่พบ ID"}
    - ชื่อจากคิวระบบ: "${productName || "ไม่มี"}"`);
  }

  // STEP 9: กด Add "ครั้งเดียว" แล้วรอช่องชื่อหาย = modal ปิด (re-click เฉพาะถ้าค้าง)
  const findAddBtn = () => modalPrimaryButton(["add", "done", "เพิ่ม", "เสร็จ"]) ||
                           modalFooterButton(["add", "done", "เพิ่ม", "เสร็จ"]) ||
                           findButtonByText(["เพิ่ม", "add"]);
  const addBtn9 = await retryUntil("STEP9 หาปุ่ม Add", () => {
    const b = findAddBtn();
    return isClickable(b) ? b : null;
  }, 15000, 1500, () => diagPrimaryButton(["add", "done", "เพิ่ม", "เสร็จ"]));
  let added = false;
  if (addBtn9) {
    await sleep(500);
    realClick(addBtn9);
    try { addBtn9.click(); } catch (_) {}
    log("STEP9 กด Add (ครั้งเดียว) — รอ modal ปิด");
    added = await retryUntil("STEP9 รอ modal ปิด", () => findProductNameInput() ? null : true, 10000, 1500);
    if (!added) {
      log("STEP9 ยังไม่ปิด — กด Add ซ้ำอีกครั้ง");
      const b = findAddBtn();
      if (isClickable(b)) { realClick(b); try { b.click(); } catch (_) {} }
      added = await retryUntil("STEP9 รอ modal ปิด (รอบ2)", () => findProductNameInput() ? null : true, 10000, 1500);
    }
  }
  if (!added) {
    log("⚠️ กด Add ยืนยันสินค้าไม่สำเร็จ");
    return false;
  }
  log("✅ เพิ่มลิงก์สินค้าสำเร็จ");
  return true;
}

// หา input ชื่อสินค้าในหน้าแก้ชื่อ (label = Product name) — ไม่มี placeholder/name จึงต้องดู label/desc
function findProductNameInput() {
  const inputs = [...document.querySelectorAll(
    '.TUXModal input[type="text"], [role="dialog"] input[type="text"], .common-modal-body input.TUXTextInputCore-input, .common-modal-body input[type="text"]'
  )].filter((el) => isVisible(el) && !el.placeholder);
  if (!inputs.length) return null;
  const labeled = inputs.find((input) => {
    const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null;
    const descId = input.getAttribute("aria-describedby");
    const desc = descId ? document.getElementById(descId) : null;
    const text = normalizeText([label?.textContent, desc?.textContent].filter(Boolean).join(" "));
    return /product name|ชื่อสินค้า/.test(text);
  });
  return labeled || inputs[0];
}

// หาแถวสินค้าที่ "ตรงกับ key จริง" เท่านั้น (ไม่ fallback rows[0])
// → ต้องรอผลค้นหา filter เจอสินค้านั้นก่อนถึงคืนค่า แล้วค่อยเลือก
function findProductRow(key) {
  const nkey = normalizeText(key);
  const rows = [...document.querySelectorAll('tr.product-tb-row, [class*="product-tb-row"]')].filter(isVisible);
  if (!rows.length) return null;
  // 1) Product ID cell ตรงเป๊ะ
  const exact = rows.find((row) =>
    [...row.querySelectorAll('.product-tb-cell, td')].some((cell) => normalizeText(cell.textContent) === nkey)
  );
  if (exact) return exact;
  // 2) เผื่อ key เป็นชื่อ/URL — แถวที่ข้อความมี key
  return rows.find((row) => normalizeText(row.textContent).includes(nkey)) || null;
}

function extractProductRowTitle(row, productKey) {
  if (!row) return "";
  const radio = row.querySelector('input[type="radio"], input.TUXRadioStandalone-input');
  const directCandidates = [
    row.querySelector(".product-name")?.textContent,
    radio?.getAttribute("name"),
    radio?.value,
    row.querySelector(".product-image")?.getAttribute("alt"),
    row.querySelector("img[alt]")?.getAttribute("alt")
  ];
  for (const candidate of directCandidates) {
    const text = cleanProductTitle(candidate);
    if (text) return text;
  }

  const preferred = [
    ".product-title",
    ".product-info-name",
    ".product-info-cell [class*='name']",
    ".product-info-cell [class*='title']",
    "[class*='product-name']",
    "[class*='product-title']",
    "[class*='productName']",
    "[class*='productTitle']"
  ];
  for (const selector of preferred) {
    const el = row.querySelector(selector);
    const text = cleanProductTitle(el?.textContent);
    if (text) return text;
  }

  const nkey = normalizeText(productKey);
  const cellTexts = [...row.querySelectorAll(".product-tb-cell, td")]
    .map((cell) => cleanProductTitle(cell.textContent))
    .filter(Boolean)
    .filter((text) => normalizeText(text) !== nkey)
    .filter((text) => !/^https?:\/\//i.test(text))
    .filter((text) => !/^[฿$]?\s*\d[\d,.]*$/.test(text));

  return cellTexts
    .sort((a, b) => b.length - a.length)[0] || "";
}

// เลือกสินค้า "คลิกครั้งเดียว" ที่ radio (set checked + realClick เดียว ให้ React รับรู้)
async function selectProductRadio(row) {
  const radio = row.querySelector('input[type="radio"], input.TUXRadioStandalone-input');
  const target = radio || row.querySelector(".TUXRadioStandalone, .TUXRadio, .product-info-cell") || row;
  target.scrollIntoView({ block: "center" });
  await sleep(400);
  if (radio) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
    if (setter) setter.call(radio, true);
    else radio.checked = true;
  }
  realClick(target); // คลิกเลือกครั้งเดียวพอ
  if (radio) radio.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(400);
}

// หาปุ่ม Next ใน footer ของ "modal เลือกสินค้า" โดยเฉพาะ (กันไปโดน Next ของ modal อื่นที่ค้างใน DOM)
function productSelectorNext() {
  const modal = document.querySelector(".product-selector-modal");
  if (!modal) return null;
  const buttons = [...modal.querySelectorAll(".common-modal-footer button, .common-modal-footer .TUXButton")].filter(isVisible);
  return buttons.find((b) => {
    const t = normalizeText(b.textContent);
    if (t.includes("cancel") || t.includes("ยกเลิก")) return false;
    return t === "next" || t.includes("next") || t.includes("ถัดไป") || b.classList.contains("TUXButton--primary");
  }) || null;
}

// หาปุ่ม primary (Next/Add) ใน footer ของ modal — เลี่ยงปุ่ม Cancel (secondary)
function modalPrimaryButton(words = []) {
  const nwords = words.map(normalizeText).filter(Boolean);
  const buttons = [...document.querySelectorAll(
    '.common-modal-footer .TUXButton--primary, [role="dialog"] .TUXButton--primary, .TUXModal .TUXButton--primary, .button-group .TUXButton--primary'
  )].filter(isVisible);
  if (!buttons.length) return null;
  if (nwords.length) {
    const matched = buttons.find((b) => {
      const t = normalizeText(b.textContent);
      return nwords.some((w) => t === w || t.includes(w));
    });
    if (matched) return matched;
  }
  return buttons.find(isClickable) || buttons[0];
}

// หาปุ่มใน footer ของ modal ตาม label
function modalFooterButton(words) {
  const nwords = words.map(normalizeText);
  const buttons = [...document.querySelectorAll(
    '.common-modal-footer button, .TUXModal button, [role="dialog"] button'
  )].filter(isVisible);
  for (const button of buttons) {
    const text = normalizeText(button.textContent);
    if (!text) continue;
    if (nwords.some((word) => text === word || text.includes(word))) return button;
  }
  return null;
}

// สั่งค้นหา: กด Enter ในช่อง + คลิกไอคอนแว่นขยาย
function triggerSearch(input) {
  pressEnter(input);
  const icon = document.querySelector('.product-search-icon, .TUXTextInputCore-trailingIconWrapper');
  if (icon && isVisible(icon)) realClick(icon);
}

function pressEnter(el) {
  for (const type of ["keydown", "keypress", "keyup"]) {
    el.dispatchEvent(new KeyboardEvent(type, {
      bubbles: true,
      cancelable: true,
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
    }));
  }
}

// พิมพ์ลง input แบบ React-aware (native setter + input/change) ไม่ blur
function typeIntoInput(input, value) {
  input.focus();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
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

async function setAigcSwitch(desired) {
  if (desired === undefined) return true;
  const container = document.querySelector('[data-e2e="aigc_container"]');
  if (!container) { log("ไม่พบสวิตช์ AI-generated content"); return false; }

  const stateEl = container.querySelector('[data-state], [aria-checked]');
  const input = container.querySelector('input[role="switch"], input[type="checkbox"]');
  const isChecked = () => {
    if (stateEl) {
      return stateEl.getAttribute("data-state") === "checked" ||
             stateEl.getAttribute("aria-checked") === "true";
    }
    return Boolean(input?.checked);
  };

  if (isChecked() === Boolean(desired)) {
    log(`AI-generated content = ${desired} อยู่แล้ว`);
    return true;
  }

  const clickTarget = container.querySelector('.Switch__content, [data-layout="switch-root"], [role="switch"]') || input;

  // คลิก + verify หลายรอบ จนกว่าจะได้สถานะที่ต้องการ
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const target = attempt % 2 === 1 ? (clickTarget || input) : (input || clickTarget);
    if (target) realClick(target);
    await sleep(400);
    if (isChecked() === Boolean(desired)) {
      log(`ตั้ง AI-generated content = ${desired} สำเร็จ (รอบ ${attempt})`);
      return true;
    }
  }

  log(`⚠️ ตั้ง AI-generated content ไม่สำเร็จ (ค่าปัจจุบัน=${isChecked()}, ต้องการ=${desired}) — กรุณาเช็คเอง`);
  return false;
}

async function setCheckboxState(input, desired) {
  if (desired === undefined || !input) return;
  if (Boolean(input.checked) === Boolean(desired)) return;
  realClick(input);
  await sleep(250);
}

async function clickSaveDraftV2() {
  assertNotStopped();
  if (finalSubmitInProgress) throw new Error("กำลัง submit TikTok อยู่แล้ว");
  const button = await retryUntil("กดปุ่ม Save Draft", () => {
    const b = document.querySelector(TIKTOK_SELECTORS.saveDraftButton) || findButtonByText(TIKTOK_TEXT.saveDraft);
    return isClickable(b) ? b : null;
  }, 60000);
  if (!button) throw new Error("ไม่พบปุ่ม Save Draft ที่กดได้ (หมดเวลา 60s)");
  await sleep(800);
  assertNotStopped();
  finalSubmitInProgress = true;
  realClick(button);
  await clickConfirmIfNeeded();
}

async function clickPost() {
  assertNotStopped();
  if (finalSubmitInProgress) throw new Error("กำลัง submit TikTok อยู่แล้ว");
  const button = await retryUntil("กดปุ่ม Post", () => {
    const b = document.querySelector(TIKTOK_SELECTORS.postButton) || findButtonByText(TIKTOK_TEXT.post);
    return isClickable(b) ? b : null;
  }, 60000);
  if (!button) throw new Error("ไม่พบปุ่ม Post ที่กดได้ (หมดเวลา 60s)");
  await sleep(800);
  assertNotStopped();
  finalSubmitInProgress = true;
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

function assertNotStopped() {
  if (!stopRequested) return;
  const error = new Error("หยุดทำงานแล้ว");
  error.code = "STOP_REQUESTED";
  throw error;
}

// poll predicate จนได้ค่า truthy หรือหมดเวลา
async function waitFor(predicate, timeoutMs = 10000, intervalMs = 300) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const result = predicate();
      if (result) return result;
    } catch (_) {}
    await sleep(intervalMs);
  }
  return null;
}

// วน fn ซ้ำจนสำเร็จ พร้อม countdown + diagnose บอกว่าหาอะไรเจอ/ไม่เจอ
// เริ่มช้า ๆ แบบมนุษย์: หน่วงให้เว็บ render ก่อนเช็คครั้งแรก
async function retryUntil(label, fn, totalMs = 30000, intervalMs = 1500, diagnose = null) {
  const deadline = Date.now() + totalMs;
  let lastTick = -1;
  const diag = () => {
    if (!diagnose) return "";
    try { return ` | ${diagnose()}`; } catch (_) { return ""; }
  };
  log(`▶ ${label} — เริ่ม (สูงสุด ${Math.round(totalMs / 1000)}s)`);
  await sleep(700); // รอหน้าโหลด/ปุ่มแสดงก่อนเช็คครั้งแรก
  while (Date.now() < deadline) {
    assertNotStopped();
    try {
      const result = await fn();
      if (result) {
        log(`✅ ${label} — สำเร็จ`);
        return result;
      }
    } catch (_) {}
    const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    if (remain !== lastTick) {
      lastTick = remain;
      log(`🔄 ${label} — ยังไม่เจอ กำลังวนหา/ลองใหม่... เหลือ ${remain}s${diag()}`);
    }
    await sleep(intervalMs);
  }
  log(`⚠️ ${label} — หมดเวลา ${Math.round(totalMs / 1000)}s ยังไม่เจอ${diag()}`);
  return null;
}

// อธิบายสถานะปุ่ม primary (พบ/clickable/disabled) สำหรับ diagnose
function diagPrimaryButton(words) {
  const b = modalPrimaryButton(words);
  if (!b) return `ไม่พบปุ่ม primary [${words.join("/")}]`;
  const aria = b.getAttribute("aria-disabled");
  return `พบปุ่ม "${normalizeText(b.textContent)}" clickable=${isClickable(b)} disabled=${b.disabled} aria-disabled=${aria}`;
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

// TikTok จำกัดชื่อสินค้า 30 ตัวอักษร
const PRODUCT_TITLE_MAX = 30;

async function buildProductLinkTitle(productName, fallbackTitle) {
  const userName = String(productName || "").trim();
  // ถ้า user กำหนดชื่อมา ใช้ชื่อนั้นหลัง clean; ถ้าไม่ เอาชื่อที่ TikTok เติมไว้มา clean
  const base = cleanProductTitle(userName) || cleanProductTitle(fallbackTitle);
  const safe = stripWeirdChars(base) || "สินค้า";
  const fallback = truncateProductTitle(safe, PRODUCT_TITLE_MAX);
  const aiTitle = await generateProductLinkTitleWithAi(base, fallback);
  return truncateProductTitle(stripWeirdChars(cleanProductTitle(aiTitle)) || fallback, PRODUCT_TITLE_MAX);
}

function cleanProductTitle(raw) {
  return String(raw || "")
    // ตัด badge/ข้อความในวงเล็บจาก TikTok เช่น [New Arrival], (Live), 【...】
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    // ตัดคำว่า live ที่ห้อยหน้า-หลังพร้อมตัวคั่น
    .replace(/^\s*live\b[\s:|/\-–·]*/i, "")
    .replace(/[\s:|/\-–·]*\blive\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// เก็บเฉพาะตัวอักษร(ไทย/อังกฤษ/ภาษาอื่น) วรรณยุกต์ ตัวเลข เว้นวรรค และเครื่องหมายที่ใช้บ่อยในชื่อสินค้า (เช่น %, -, /, +, &, ., ,, (, ))
function stripWeirdChars(raw) {
  return String(raw || "")
    .replace(/[^\p{L}\p{M}\p{N}\s%\-+\/&.,()]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateProductTitle(title, maxLength) {
  const chars = Array.from(String(title || "").trim());
  if (chars.length <= maxLength) return chars.join("").trim();

  const sliced = chars.slice(0, maxLength).join("").trim();
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > 0) {
    const wordBoundary = sliced.slice(0, lastSpace).trim();
    if (Array.from(wordBoundary).length >= Math.floor(maxLength * 0.55)) {
      return wordBoundary;
    }
  }

  return sliced;
}

async function generateProductLinkTitleWithAi(rawTitle, fallbackTitle) {
  const settings = await getStoredSettings();
  const provider = settings.aiProvider || "gemini";
  const hasGemini = provider === "gemini" && settings.geminiApiKey;
  const hasOpenAI = provider === "openai" && settings.openaiApiKey;
  if (!hasGemini && !hasOpenAI) return "";

  try {
    return provider === "openai"
      ? await generateProductLinkTitleWithOpenAI(rawTitle, fallbackTitle, settings)
      : await generateProductLinkTitleWithGemini(rawTitle, fallbackTitle, settings);
  } catch (err) {
    log(`AI ตั้งชื่อสินค้าไม่สำเร็จ — ใช้ชื่อที่ clean แล้วแทน: ${err.message}`);
    return "";
  }
}

async function getStoredSettings() {
  try {
    const result = await chrome.storage.sync.get("settings");
    return result.settings || {};
  } catch (_) {
    return {};
  }
}

function buildProductTitlePrompt(rawTitle, fallbackTitle) {
  return [
    "Create a concise TikTok Shop product link title.",
    `Original product title: ${String(rawTitle || "").trim()}`,
    `Clean fallback title: ${String(fallbackTitle || "").trim()}`,
    "Rules:",
    `- Return one natural product name, maximum ${PRODUCT_TITLE_MAX} characters.`,
    "- Preserve useful brand/model/type words when possible.",
    "- Remove badges, promotions, bracket text, emoji, punctuation, price, quantity claims, and filler words.",
    "- Thai or English is OK. Use the same main language as the original title.",
    "- If the title is long, cut at a natural word boundary.",
    'Return compact JSON only: {"title":"..."}'
  ].join("\n");
}

async function generateProductLinkTitleWithGemini(rawTitle, fallbackTitle, settings) {
  const apiKey = settings.geminiApiKey;
  const model = encodeURIComponent(settings.geminiModel || "gemini-3.5-flash");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildProductTitlePrompt(rawTitle, fallbackTitle) }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || "{}";
    return parseAiProductTitle(text);
  } finally {
    clearTimeout(timeout);
  }
}

async function generateProductLinkTitleWithOpenAI(rawTitle, fallbackTitle, settings) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: settings.openaiModel || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: buildProductTitlePrompt(rawTitle, fallbackTitle)
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
    const data = await response.json();
    return parseAiProductTitle(data.choices?.[0]?.message?.content || "{}");
  } finally {
    clearTimeout(timeout);
  }
}

function parseAiProductTitle(text) {
  try {
    const jsonText = String(text || "").match(/\{[\s\S]*\}/)?.[0] || "{}";
    const parsed = JSON.parse(jsonText);
    return String(parsed.title || "").trim();
  } catch (_) {
    return "";
  }
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

let logSeq = 0;
function log(msg) {
  logSeq += 1;
  const line = `#${String(logSeq).padStart(2, "0")} ${msg}`;
  console.log("[TikTokPost]", line);
  chrome.runtime.sendMessage({ type: "TIKTOK_STUDIO_LOG", message: line }).catch(() => {});
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
