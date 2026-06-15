import { buildCaption, buildPostHashtags, normalizeHashtags, resolveProductUrl } from "./prompt-builder.js";
import { generatePostCopy } from "./image-analyzer.js";

/**
 * @description ดาวน์โหลดวิดีโอผ่าน background service worker
 * @param {string} url - URL วิดีโอ
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {Promise<object>} ผลลัพธ์ download
 */
export async function downloadVideo(url, productInfo) {
  if (!url || !/^(https:|blob:|data:)/.test(url)) {
    throw new Error("กรุณาใส่ URL วิดีโอแบบ HTTPS, blob หรือ data");
  }

  const filename = buildTikTokVideoFilename(productInfo);
  const response = await chrome.runtime.sendMessage({
    type: "DOWNLOAD_VIDEO",
    payload: { url, filename }
  });

  if (!response?.ok) throw new Error(response?.error || "ดาวน์โหลดวิดีโอไม่สำเร็จ");
  if (response.videoUrl) {
    productInfo.preparedVideoUrl = response.videoUrl;
    productInfo.preparedVideoMimeType = response.mimeType || "";
  }
  return response;
}

/**
 * @description สร้าง payload สำหรับโพสต์ TikTok และส่งให้ module API
 * @param {string} videoUrl - URL วิดีโอ
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {Promise<object>} ผลลัพธ์การโพสต์
 */
export async function publishVideo(videoUrl, productInfo) {
  return sendVideoToTikTokStudio(videoUrl, productInfo, "post");
}

export async function sendVideoToTikTokStudio(videoUrl, productInfo, mode = "post") {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = settings.postDefaults || {};
  const postMode = mode === "draft" ? "draft" : "post";
  const postType = postMode === "draft"
    ? "draft"
    : (postDefaults.defaultMode === "schedule" ? "schedule" : "now");
  const productUrl = resolveProductUrl(productInfo);
  productInfo.productUrl = productUrl;
  const postCopy = productInfo.caption
    ? {
        caption: productInfo.caption,
        hashtags: buildPostHashtags(productInfo, { ...postDefaults, hashtags: productInfo.hashtags || postDefaults.hashtags })
      }
    : await generatePostCopy(productInfo, postDefaults);
  const caption = postCopy.caption || buildCaption(productInfo, postDefaults);
  const hashtags = normalizeHashtags(postCopy.hashtags || buildPostHashtags(productInfo, { ...postDefaults, hashtags: productInfo.hashtags || postDefaults.hashtags }), 5);
  if (postMode === "post") {
    assertPostMetadata({ productInfo, caption, hashtags });
  }

  const jobId = crypto.randomUUID();
  const storageKey = `tiktokJob:${jobId}`;
  await chrome.storage.local.remove(storageKey);

  // เริ่มรอผลจริงก่อนส่ง เพื่อไม่พลาด event หรือ redirect หลังคลิก Post
  const donePromise = waitForTikTokDone(jobId, 360000);

  const response = await chrome.runtime.sendMessage({
    type: "TIKTOK_SEND_DRAFT",
    payload: {
      videoUrl,
      productId: productInfo.productId,
      productUrl,
      productName: resolveProductLinkTitle(productInfo),
      filename: buildTikTokVideoFilename(productInfo),
      caption,
      hashtags,
      mode: postMode,
      postType,
      scheduleTime: postDefaults.scheduleTime || "",
      location: postDefaults.location || "",
      privacy: postDefaults.privacy || "Public",
      aiGenerated: true,
      allowComment: postDefaults.allowComment !== false,
      allowReuse: postDefaults.allowReuse !== false,
      jobId
    }
  });

  if (!response?.ok) {
    donePromise.cancel?.();
    await chrome.storage.local.remove(storageKey);
    throw new Error(response?.error || "ส่งไป TikTok Studio ไม่สำเร็จ");
  }

  // content รัน pipeline เบื้องหลัง — รอผลจริงจาก TIKTOK_DONE (ไม่ใช่แค่ started)
  const done = await donePromise;
  await chrome.storage.local.remove(storageKey);
  if (!done?.success) {
    throw new Error(done?.error || "อัปโหลด/โพสต์ TikTok ไม่สำเร็จ");
  }
  return { ok: true, ...done };
}

/**
 * รอ event TIKTOK_DONE จาก content pipeline (ผ่าน listener แยก ไม่ค้าง message channel)
 * @param {string} jobId
 * @param {number} timeoutMs
 * @returns {Promise<{success:boolean,error?:string,posted?:boolean,drafted?:boolean}> & {cancel:Function}}
 */
function waitForTikTokDone(jobId, timeoutMs = 360000) {
  let timer = null;
  let handler = null;
  let storageHandler = null;
  const storageKey = `tiktokJob:${jobId}`;
  const cleanup = () => {
    if (timer) clearTimeout(timer);
    if (handler) chrome.runtime.onMessage.removeListener(handler);
    if (storageHandler) chrome.storage.onChanged.removeListener(storageHandler);
  };
  const promise = new Promise((resolve) => {
    handler = (msg) => {
      if (msg?.type === "TIKTOK_DONE" && msg.payload?.jobId === jobId) {
        cleanup();
        resolve(msg.payload || { success: false, error: "ไม่ทราบผลอัปโหลด" });
      }
    };
    chrome.runtime.onMessage.addListener(handler);

    storageHandler = (changes, areaName) => {
      if (areaName !== "local") return;
      const payload = changes[storageKey]?.newValue;
      if (!payload || payload.jobId !== jobId) return;
      cleanup();
      resolve(payload);
    };
    chrome.storage.onChanged.addListener(storageHandler);

    timer = setTimeout(() => {
      cleanup();
      resolve({ success: false, error: "หมดเวลารอผลอัปโหลด TikTok (6 นาที)" });
    }, timeoutMs);

    chrome.storage.local.get(storageKey).then((stored) => {
      const payload = stored[storageKey];
      if (!payload || payload.jobId !== jobId) return;
      cleanup();
      resolve(payload);
    });
  });
  promise.cancel = cleanup;
  return promise;
}

export function buildTikTokVideoFilename(productInfo = {}) {
  const rawId = productInfo.productId || productInfo.id || productInfo.name || "product";
  const safeId = String(rawId).replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "product";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeId}_${date}_tiktok.mp4`;
}

export function resolveProductLinkTitle(productInfo = {}) {
  return String(
    productInfo.productLinkTitle ||
    productInfo.originalName ||
    productInfo.rawProduct?.title ||
    productInfo.rawProduct?.product_name ||
    productInfo.rawProduct?.name ||
    productInfo.name ||
    ""
  ).trim();
}

export function assertPostMetadata({ productInfo = {}, caption = "", hashtags = [] } = {}) {
  const missing = [];
  if (!String(caption || "").trim()) missing.push("caption");
  if (!normalizeHashtags(hashtags).length) missing.push("hashtags");
  if (!resolveProductUrl(productInfo)) missing.push("productUrl");

  if (missing.length) {
    throw new Error(`ห้ามโพสต์: ข้อมูลโพสต์ไม่ครบ (${missing.join(", ")})`);
  }
}
