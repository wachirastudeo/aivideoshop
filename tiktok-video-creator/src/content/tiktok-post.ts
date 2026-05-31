declare const chrome: any;

type PostType = "draft" | "now" | "schedule";

type TikTokUploadPayload = {
  videoUrl: string;
  caption?: string;
  hashtags?: string[];
  postType?: PostType;
  scheduleTime?: string | number | Date;
  notAiGenerated?: boolean;
};

type UploadResult = {
  success: boolean;
  error?: string;
};

const STATE = { installed: false };

const CHUNKS = new Map<
  string,
  { chunks: string[]; totalChunks: number; received: number; totalSize?: number }
>();

const COMPLETED_CHUNKS = new Map<string, string>();

const SELECTORS = {
  fileInput: 'input[type="file"][accept*="video"], input[type="file"]',
  captionEditor: 'div[contenteditable="true"]',
  postButton: 'button[data-e2e="post_video_button"]',
  saveDraftButton: 'button[data-e2e="save_draft_button"]',
  advancedSettings: '[data-e2e="advanced_settings_container"]',
  aiContainer: '[data-e2e="aigc_container"]',
};

const TEXT = {
  saveDraft: ["save draft", "save as draft", "save to drafts", "บันทึกฉบับร่าง", "บันทึกแบบร่าง"],
  postNow: ["post", "publish", "post now", "โพสต์", "โพส", "เผยแพร่", "โพสต์เลย", "โพสเลย"],
  discardDraft: ["discard", "start over", "reset", "clear", "ทิ้ง", "เริ่มใหม่", "ล้าง"],
  recoveryContext: ["wasn't saved", "wasnt saved", "were editing", "continue editing", "ยังไม่ได้บันทึก", "แก้ไขต่อ", "ของเก่า"],
  confirmSaveAnyway: ["save anyway", "บันทึกต่อไป", "บันทึกอยู่ดี", "confirm", "ยืนยัน"],
};

export function onExecute(ctx?: unknown) {
  if (STATE.installed || (globalThis as any).__cleanTiktokPostInstalled) return;
  STATE.installed = true;
  (globalThis as any).__cleanTiktokPostInstalled = true;
  installMessageListener();
  log("content script ready", ctx);
}

function installMessageListener() {
  chrome.runtime.onMessage.addListener((message: any, _sender: unknown, sendResponse: (value: any) => void) => {
    const type = message?.type;
    const payload = message?.payload;

    if (type === "TIKTOK_POST" && payload?.action === "ping") {
      sendResponse({ ready: true });
      return false;
    }

    if (type === "CHUNK_INIT") {
      CHUNKS.set(payload.key, {
        chunks: new Array(payload.totalChunks),
        totalChunks: payload.totalChunks,
        received: 0,
        totalSize: payload.totalSize,
      });
      sendResponse({ ok: true });
      return false;
    }

    if (type === "CHUNK_PUSH") {
      const session = CHUNKS.get(payload.key);
      if (!session) {
        sendResponse({ ok: false, error: "chunk session not found" });
        return false;
      }
      if (typeof session.chunks[payload.index] !== "string") session.received += 1;
      session.chunks[payload.index] = payload.data;
      sendResponse({ ok: true, received: session.received });
      return false;
    }

    if (type === "CHUNK_DONE") {
      const session = CHUNKS.get(payload.key);
      if (!session) {
        sendResponse({ ok: false, error: "chunk session not found" });
        return false;
      }
      if (session.chunks.some((chunk) => typeof chunk !== "string")) {
        sendResponse({ ok: false, error: `missing chunks: received ${session.received}/${session.totalChunks}` });
        return false;
      }
      const assembled = session.chunks.join("");
      COMPLETED_CHUNKS.set(payload.key, assembled);
      CHUNKS.delete(payload.key);
      sendResponse({ ok: true, size: assembled.length });
      return false;
    }

    if (type === "TIKTOK_UPLOAD_VIDEO") {
      handleUpload(normalizePayload(payload))
        .then(sendDone)
        .catch((err) => {
          const error = err instanceof Error ? err.message : String(err);
          warn("upload failed:", err);
          sendDone({ success: false, error });
        });
      sendResponse({ started: true });
      return false;
    }

    return false;
  });
}

function normalizePayload(payload: TikTokUploadPayload): TikTokUploadPayload {
  const next = { postType: "draft" as PostType, caption: "", hashtags: [], notAiGenerated: true, ...payload };
  if (typeof next.videoUrl === "string" && next.videoUrl.startsWith("chunked:")) {
    const key = next.videoUrl.slice("chunked:".length);
    const dataUrl = COMPLETED_CHUNKS.get(key);
    if (!dataUrl) throw new Error(`chunked video not assembled: ${key}`);
    next.videoUrl = dataUrl;
    COMPLETED_CHUNKS.delete(key);
  }
  return next;
}

async function handleUpload(payload: TikTokUploadPayload): Promise<UploadResult> {
  sendPipelineLog("info", "เริ่มโพสต์ TikTok...");
  await waitForPageReady(20_000);
  await discardRecoveredDraftIfNeeded();
  sendPipelineLog("info", "กำลังอัปโหลดวิดีโอ...");
  await uploadVideo(payload.videoUrl);
  sendPipelineLog("info", "รอ TikTok ประมวลผลวิดีโอ...");
  await waitForUploadReady(120_000);

  if (payload.caption || payload.hashtags?.length) {
    sendPipelineLog("info", "กำลังใส่ caption และ hashtag...");
    await fillCaption(payload.caption ?? "", payload.hashtags ?? []);
  }

  if (!payload.notAiGenerated) await enableAiGeneratedLabel();
  if (payload.postType === "schedule" && payload.scheduleTime) await setScheduleTime(payload.scheduleTime);

  const submitted = await submit(payload.postType ?? "draft");
  if (!submitted) return { success: false, error: "submit failed" };
  sendPipelineLog("info", "เสร็จสิ้น");
  return { success: true };
}

async function waitForPageReady(timeoutMs: number) {
  const input = await waitForElement<HTMLInputElement>(SELECTORS.fileInput, timeoutMs);
  if (!input) throw new Error("TikTok upload page is not ready: file input not found");
}

async function uploadVideo(videoUrl: string) {
  const input = await waitForElement<HTMLInputElement>(SELECTORS.fileInput, 15_000);
  if (!input) throw new Error("file input not found");
  const file = await urlToFile(videoUrl);
  const transfer = new DataTransfer();
  transfer.items.add(file);
  Object.defineProperty(input, "files", { value: transfer.files, configurable: true });
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function urlToFile(videoUrl: string): Promise<File> {
  if (videoUrl.startsWith("data:")) {
    const [header, body] = videoUrl.split(",", 2);
    if (!body) throw new Error("invalid data URL");
    const mime = header.match(/data:(.*?);base64/)?.[1] || "video/mp4";
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], "video.mp4", { type: mime });
  }

  const response = await fetch(videoUrl);
  if (!response.ok) throw new Error(`video fetch failed: ${response.status}`);
  const blob = await response.blob();
  return new File([blob], "video.mp4", { type: blob.type || "video/mp4" });
}

async function waitForUploadReady(timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const draftButton = findButtonByText(TEXT.saveDraft);
    const postButton = document.querySelector<HTMLButtonElement>(SELECTORS.postButton) || findButtonByText(TEXT.postNow);
    if (isUsableButton(draftButton) || isUsableButton(postButton)) {
      await sleep(1_500);
      return;
    }
    await sleep(1_000);
  }
  warn("upload wait timeout; continuing anyway");
}

async function fillCaption(caption: string, hashtags: string[]) {
  const editor = await waitForElement<HTMLElement>(SELECTORS.captionEditor, 10_000);
  if (!editor) {
    warn("caption editor not found");
    return;
  }
  editor.focus();
  document.execCommand("selectAll", false);
  document.execCommand("delete", false);
  if (caption.trim()) await insertText(editor, caption.trim());
  for (const rawTag of hashtags) {
    const tag = rawTag.replace(/^#+/, "").trim();
    if (tag) await insertText(editor, ` #${tag}`);
  }
}

async function insertText(target: HTMLElement, text: string) {
  target.focus();
  document.execCommand("insertText", false, text);
  target.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await sleep(80);
}

async function enableAiGeneratedLabel() {
  const aiContainer = await waitForElement<HTMLElement>(SELECTORS.aiContainer, 8_000);
  if (!aiContainer) {
    warn("AI container not found");
    return;
  }
  const switchElement = aiContainer.querySelector<HTMLElement>('input[role="switch"], [role="switch"], [aria-checked], input[type="checkbox"]');
  if (!switchElement) return;
  const checked = switchElement.getAttribute("aria-checked") === "true" || (switchElement as HTMLInputElement).checked === true;
  if (!checked) clickElement(switchElement);
}

async function setScheduleTime(value: string | number | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("invalid scheduleTime");
  document.querySelector<HTMLElement>('input[type="radio"][name="postSchedule"][value="schedule"]')?.click();
  await sleep(800);
  await setReadonlyInputValue(/^\d{4}-\d{2}-\d{2}$/, toInputDate(date));
  await setReadonlyInputValue(/^\d{2}:\d{2}$/, toInputTime(date));
}

async function setReadonlyInputValue(pattern: RegExp, value: string) {
  const input = findReadonlyInput(pattern);
  if (!input) {
    warn(`readonly input not found for ${value}`);
    return;
  }
  input.removeAttribute("readonly");
  setNativeInputValue(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  input.setAttribute("readonly", "readonly");
}

function findReadonlyInput(pattern: RegExp): HTMLInputElement | null {
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[readonly][type="text"], input.TUXTextInputCore-input[readonly]'));
  return inputs.find((input) => pattern.test(input.value)) ?? null;
}

async function submit(postType: PostType) {
  await sleep(1_000);
  if (postType === "draft") {
    const draftButton = document.querySelector<HTMLElement>(SELECTORS.saveDraftButton) || findButtonByText(TEXT.saveDraft);
    if (!isUsableButton(draftButton)) return false;
    clickElement(draftButton);
    return true;
  }

  const postButton = document.querySelector<HTMLElement>(SELECTORS.postButton) || findButtonByText(TEXT.postNow);
  if (!isUsableButton(postButton)) return false;
  clickElement(postButton);
  const confirmButton = await findButtonByTextAsync([...TEXT.confirmSaveAnyway, "post now", "โพสต์เลย", "โพสเลย"], 5_000);
  if (confirmButton) clickElement(confirmButton);
  return true;
}

async function discardRecoveredDraftIfNeeded() {
  const bodyText = document.body.textContent?.toLowerCase() ?? "";
  if (!TEXT.recoveryContext.some((text) => bodyText.includes(text))) return;
  const discardButton = findButtonByText(TEXT.discardDraft);
  if (discardButton) clickElement(discardButton);
}

function findButtonByText(words: string[]): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('button, [role="button"], .TUXButton-label, .TUXButton'));
  for (const element of candidates) {
    const text = element.textContent?.trim().toLowerCase() ?? "";
    if (!text || text.length > 80) continue;
    if (words.some((word) => text === word.toLowerCase() || text.includes(word.toLowerCase()))) {
      return element.closest<HTMLElement>('button, [role="button"]') || element;
    }
  }
  return null;
}

async function findButtonByTextAsync(words: string[], timeoutMs: number): Promise<HTMLElement | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const button = findButtonByText(words);
    if (button) return button;
    await sleep(300);
  }
  return null;
}

async function waitForElement<T extends Element>(selector: string, timeoutMs: number): Promise<T | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const element = document.querySelector<T>(selector);
    if (element) return element;
    await sleep(250);
  }
  return null;
}

function isUsableButton(element: HTMLElement | null | undefined) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const disabled = element.getAttribute("aria-disabled") === "true" || (element as HTMLButtonElement).disabled === true;
  return rect.width > 0 && rect.height > 0 && !disabled;
}

function clickElement(element: HTMLElement) {
  element.focus?.();
  element.click?.();
  const rect = element.getBoundingClientRect();
  const eventInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
    button: 0,
    view: window,
  };
  element.dispatchEvent(new MouseEvent("mousedown", eventInit));
  element.dispatchEvent(new MouseEvent("mouseup", eventInit));
  element.dispatchEvent(new MouseEvent("click", eventInit));
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value");
  descriptor?.set?.call(input, value);
}

function toInputDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toInputTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function sendDone(result: UploadResult) {
  chrome.runtime.sendMessage({ type: "TIKTOK_DONE", payload: result }).catch((err: unknown) => warn("sendDone failed:", err));
}

function sendPipelineLog(level: "info" | "warn" | "error", message: string) {
  chrome.runtime.sendMessage({ type: "PIPELINE_LOG", payload: { source: "tiktok-post", level, message, time: Date.now() } }).catch(() => {});
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function log(...args: unknown[]) {
  console.log("[TikTokPost]", ...args);
}

function warn(...args: unknown[]) {
  console.warn("[TikTokPost]", ...args);
}
