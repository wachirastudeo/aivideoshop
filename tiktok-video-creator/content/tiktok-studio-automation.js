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
    // ตอบกลับทันที (started) แล้วรัน pipeline เบื้องหลัง — กัน message channel ปิดตอน pipeline ยาว
    sendResponse({ ok: true, started: true });
    handleVideoUpload(message.payload)
      .then((result) => sendDone({ success: true, ...result }))
      .catch((err) => {
        const error = err instanceof Error ? err.message : String(err);
        sendDone({ success: false, error });
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
    const settingsResult = await applyUploadSettings({ postType, scheduleTime, location, privacy, productId, productUrl, productName, aiGenerated, allowComment, allowReuse });

    if (mode === "post") {
      // ถ้าอะไรไม่ครบ/ไม่สำเร็จ → ตกลงมาเป็น draft เสมอ
      const blockers = [];
      if (settingsResult.productRequired && !settingsResult.productAdded) blockers.push("เพิ่มลิงก์สินค้าไม่สำเร็จ");
      if (!settingsResult.aigcOk) blockers.push("ตั้ง AI-generated ไม่สำเร็จ");

      if (blockers.length) {
        sendPipelineLog("warn", `โพสต์ไม่ได้ (${blockers.join(", ")}) → บันทึกเป็น draft แทน`);
        await clickSaveDraftV2();
        log("Fallback: คลิก Save Draft สำเร็จ");
        sendPipelineLog("info", "เสร็จสิ้น (draft)");
        return { drafted: true, mode: "draft", postType, fallback: true, reason: blockers.join(", ") };
      }

      try {
        await clickPost();
        log("คลิก Post สำเร็จ");
        sendPipelineLog("info", "เสร็จสิ้น");
        return { posted: true, mode, postType, scheduleTime };
      } catch (postError) {
        sendPipelineLog("warn", `กด Post ล้มเหลว (${postError.message}) → บันทึกเป็น draft แทน`);
        await clickSaveDraftV2();
        log("Fallback: คลิก Save Draft สำเร็จ");
        sendPipelineLog("info", "เสร็จสิ้น (draft)");
        return { drafted: true, mode: "draft", postType, fallback: true, reason: postError.message };
      }
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
  const file = await videoUrlToFile(videoUrl, filename);
  log(`สร้างไฟล์วิดีโอแล้ว: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB, ${file.type})`);
  const input = await findUploadInput(45000);
  log("พบช่อง upload แล้ว กำลังยัดไฟล์ (DataTransfer)...");
  setInputFiles(input, file);

  // fallback: ถ้า drop แล้ว input ยังว่าง → re-decode base64 ยัดผ่าน input.files ตรง ๆ
  await sleep(400);
  if (!input.files || input.files.length === 0) {
    log("DataTransfer ไม่ติด — fallback ยัด base64 File ผ่าน input.files");
    forceSetInputFile(input, file);
  } else {
    log("ไฟล์ติด input แล้วผ่าน DataTransfer");
  }

  await verifyFileAccepted(input, file);
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
  const editor = await retryUntil("รอช่อง Caption", () => document.querySelector(TIKTOK_SELECTORS.captionEditor), 30000);
  if (!editor) {
    log("⚠️ ไม่พบช่อง Caption หลังหมดเวลา — ข้ามการกรอก caption");
    return;
  }
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
  const productRequired = Boolean(String(settings.productId || settings.productUrl || "").trim());
  const productAdded = await applyProductLink(settings.productId, settings.productUrl, settings.productName);

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

  const permissionChecks = [...document.querySelectorAll(TIKTOK_SELECTORS.userPermChecks)];
  await setCheckboxState(permissionChecks[0], settings.allowComment);
  await setCheckboxState(permissionChecks[1], settings.allowReuse);

  return { productRequired, productAdded, aigcOk };
}

async function applyProductLink(productId, productUrl, productName) {
  const productKey = String(productId || productUrl || "").trim();
  if (!productKey) return true; // ไม่ได้ระบุสินค้า ไม่ถือว่าพลาด

  const selectorModalOpen = () =>
    document.querySelector('.product-selector-modal, [aria-label="Add product links"]') ||
    document.querySelector('input[placeholder="Search products"]');

  // STEP 1: เปิด Add link จน modal โผล่
  const opened = await retryUntil("STEP1 คลิก Add link", async () => {
    const btn = document.querySelector(TIKTOK_SELECTORS.addLinkButton) || findButtonByText(["add link", "เพิ่มลิงก์", "add"]);
    if (isClickable(btn)) { realClick(btn); try { btn.click(); } catch (_) {} }
    return document.querySelector('.TUXModal, [role="dialog"]') || selectorModalOpen() ? true : null;
  }, 30000);
  if (!opened) return false;

  // STEP 2: modal "Add link" (Link type = Products) → กด Next จนเข้าหน้าเลือกสินค้า
  await retryUntil("STEP2 กด Next (Link type=Products)", async () => {
    if (selectorModalOpen()) return true; // เข้าหน้าเลือกสินค้าแล้ว
    const ltModal = [...document.querySelectorAll('.TUXModal, [role="dialog"]')].find((el) =>
      isVisible(el) && el.querySelector(".button-group, .TUXSelect") && /link type|products/i.test(el.textContent)
    );
    if (ltModal) {
      const next = modalPrimaryButton(["next", "ถัดไป"]) || modalFooterButton(["next", "ถัดไป"]) || findButtonByText(["next", "ถัดไป"]);
      if (isClickable(next)) { realClick(next); try { next.click(); } catch (_) {} }
    }
    return selectorModalOpen() ? true : null;
  }, 30000);

  // STEP 3: รอ modal เลือกสินค้า
  const selectorReady = await retryUntil("STEP3 รอ modal เลือกสินค้า", () => selectorModalOpen() ? true : null, 30000);
  if (!selectorReady) return false;

  // STEP 4: เลือกแท็บ Showcase products + รอช่องค้นหา
  const searchInput = await retryUntil("STEP4 เลือก Showcase + รอช่องค้นหา", () => {
    const tab = findButtonByText(["showcase products", "นำเสนอสินค้า"]);
    if (isClickable(tab) && tab.getAttribute("data-active") === null) realClick(tab);
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
  }, 40000, 2000);
  if (!row) {
    log(`❌ ไม่พบสินค้า: ${productKey}`);
    return false;
  }

  // STEP 6: เลือก radio วนจนปุ่ม Next ใน footer enable
  const nextBtn = await retryUntil("STEP6 เลือกสินค้า + รอ Next enable", async () => {
    const r = findProductRow(productKey) || row;
    if (r) selectProductRadio(r);
    const b = modalPrimaryButton(["next", "ถัดไป"]);
    return isClickable(b) ? b : null;
  }, 30000, 1000);
  if (!nextBtn) return false;
  realClick(nextBtn);
  try { nextBtn.click(); } catch (_) {}

  // STEP 7: รอเข้าหน้าตั้งชื่อสินค้า (modal "Product name")
  const titleInput = await retryUntil("STEP7 เข้าหน้าตั้งชื่อสินค้า", () => findProductNameInput(), 20000);

  // STEP 8: แก้ชื่อ (clean) — กรอกผ่าน React setter ให้ word count อัปเดต
  if (titleInput) {
    const existingTitle = titleInput.value;
    const finalTitle = buildProductLinkTitle(productName, existingTitle);
    titleInput.focus();
    try { titleInput.select(); } catch (_) {}
    typeIntoInput(titleInput, finalTitle);
    log(`STEP8 ตั้งชื่อสินค้า: ${finalTitle}`);
    await sleep(500);
  } else {
    log("STEP8 ไม่พบช่องชื่อสินค้า — ใช้ชื่อเดิมของ TikTok");
  }

  // STEP 9: กด Add วนจนช่องชื่อหาย = modal ปิด = เพิ่มสำเร็จ
  const added = await retryUntil("STEP9 กด Add ยืนยันสินค้า", async () => {
    const b = modalPrimaryButton(["add", "done", "เพิ่ม", "เสร็จ"]) ||
              modalFooterButton(["add", "done", "เพิ่ม", "เสร็จ"]) ||
              findButtonByText(["เพิ่ม", "add"]);
    if (isClickable(b)) { realClick(b); try { b.click(); } catch (_) {} }
    await sleep(900);
    return findProductNameInput() ? null : true; // ช่องชื่อหาย = modal ปิด = สำเร็จ
  }, 25000, 1500);
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

// หาแถวสินค้าที่ตรงกับ key (product ID / ชื่อ) — match จาก Product ID cell ก่อน
function findProductRow(key) {
  const nkey = normalizeText(key);
  const rows = [...document.querySelectorAll('tr.product-tb-row, [class*="product-tb-row"]')].filter(isVisible);
  if (!rows.length) return null;
  const exact = rows.find((row) =>
    [...row.querySelectorAll('.product-tb-cell, td')].some((cell) => normalizeText(cell.textContent) === nkey)
  );
  if (exact) return exact;
  const partial = rows.find((row) => normalizeText(row.textContent).includes(nkey));
  return partial || rows[0];
}

// เลือก radio ของสินค้าให้ React รับรู้ (set checked + .click() จริง + คลิก wrapper/label/row)
function selectProductRadio(row) {
  const radio = row.querySelector('input[type="radio"], input.TUXRadioStandalone-input');
  if (radio) {
    radio.scrollIntoView({ block: "center" });
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set;
    if (setter) setter.call(radio, true);
    else radio.checked = true;
    try { radio.click(); } catch (_) {}
    radio.dispatchEvent(new Event("input", { bubbles: true }));
    radio.dispatchEvent(new Event("change", { bubbles: true }));

    // เผื่อ React ผูก handler ไว้ที่ label/wrapper/row แทน input
    const label = radio.id ? row.querySelector(`label[for="${CSS.escape(radio.id)}"]`) : null;
    const wrapper = row.querySelector(".TUXRadioStandalone, .TUXRadio");
    if (wrapper) realClick(wrapper);
    if (label) realClick(label);
  }
  realClick(row.querySelector(".product-info-cell, .product-name-cell") || row);
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
  const button = await retryUntil("กดปุ่ม Save Draft", () => {
    const b = document.querySelector(TIKTOK_SELECTORS.saveDraftButton) || findButtonByText(TIKTOK_TEXT.saveDraft);
    return isClickable(b) ? b : null;
  }, 60000);
  if (!button) throw new Error("ไม่พบปุ่ม Save Draft ที่กดได้ (หมดเวลา 60s)");
  realClick(button);
  try { button.click(); } catch (_) {}
  await clickConfirmIfNeeded();
}

async function clickPost() {
  const button = await retryUntil("กดปุ่ม Post", () => {
    const b = document.querySelector(TIKTOK_SELECTORS.postButton) || findButtonByText(TIKTOK_TEXT.post);
    return isClickable(b) ? b : null;
  }, 60000);
  if (!button) throw new Error("ไม่พบปุ่ม Post ที่กดได้ (หมดเวลา 60s)");
  realClick(button);
  try { button.click(); } catch (_) {}
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

// วน fn ซ้ำจนสำเร็จ พร้อมแสดง countdown วินาทีที่เหลือทุก step
async function retryUntil(label, fn, totalMs = 30000, intervalMs = 1000) {
  const deadline = Date.now() + totalMs;
  let lastTick = -1;
  log(`▶ ${label} — เริ่ม (สูงสุด ${Math.round(totalMs / 1000)}s)`);
  while (Date.now() < deadline) {
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
      log(`⏳ ${label} — ลองใหม่... เหลือ ${remain}s`);
    }
    await sleep(intervalMs);
  }
  log(`⚠️ ${label} — หมดเวลา ${Math.round(totalMs / 1000)}s ยังไม่สำเร็จ`);
  return null;
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

// TikTok จำกัดชื่อ 30 ตัวอักษร — เผื่อไว้ใช้แค่ 25
const PRODUCT_TITLE_MAX = 25;

function buildProductLinkTitle(productName, fallbackTitle) {
  const userName = String(productName || "").trim();
  // ถ้า user กำหนดชื่อมา ใช้ตามนั้น; ถ้าไม่ เอาชื่อที่ TikTok เติมไว้มา clean
  const base = userName || cleanProductTitle(fallbackTitle);
  const safe = stripWeirdChars(base) || "สินค้า";
  return Array.from(safe).slice(0, PRODUCT_TITLE_MAX).join("").trim();
}

function cleanProductTitle(raw) {
  return String(raw || "")
    // ตัดวงเล็บ/ก้ามปูที่มีคำว่า live เช่น (Live) [Live] 【Live】
    .replace(/[（(\[【]\s*live\s*[）)\]】]/gi, " ")
    // ตัดคำว่า live ที่ห้อยหน้า-หลังพร้อมตัวคั่น
    .replace(/^\s*live\b[\s:|/\-–·]*/i, "")
    .replace(/[\s:|/\-–·]*\blive\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// เก็บเฉพาะตัวอักษร(ไทย/อังกฤษ/ภาษาอื่น) ตัวเลข และเว้นวรรค — ตัด emoji/สัญลักษณ์แปลก ๆ ออก
function stripWeirdChars(raw) {
  return String(raw || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
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
  console.log("[TikTokPost]", msg);
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
