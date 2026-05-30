import { buildCaption } from "./prompt-builder.js";

/**
 * @description ดาวน์โหลดวิดีโอผ่าน background service worker
 * @param {string} url - URL วิดีโอ
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {Promise<object>} ผลลัพธ์ download
 */
export async function downloadVideo(url, productInfo) {
  if (!url || !/^https:\/\//.test(url)) {
    throw new Error("กรุณาใส่ URL วิดีโอแบบ HTTPS");
  }

  const filename = buildTikTokVideoFilename(productInfo);
  const response = await chrome.runtime.sendMessage({
    type: "DOWNLOAD_VIDEO",
    payload: { url, filename }
  });

  if (!response?.ok) throw new Error(response?.error || "ดาวน์โหลดวิดีโอไม่สำเร็จ");
  return response;
}

/**
 * @description สร้าง payload สำหรับโพสต์ TikTok และส่งให้ module API
 * @param {string} videoUrl - URL วิดีโอ
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {Promise<object>} ผลลัพธ์การโพสต์
 */
export async function publishVideo(videoUrl, productInfo) {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const postDefaults = settings.postDefaults || {};
  const postType = postDefaults.defaultMode === "schedule" ? "schedule" : "now";
  const response = await chrome.runtime.sendMessage({
    type: "TIKTOK_SEND_DRAFT",
    payload: {
      videoUrl,
      productId: productInfo.productId,
      productUrl: productInfo.productUrl,
      productName: productInfo.name,
      filename: buildTikTokVideoFilename(productInfo),
      caption: buildCaption(productInfo, postDefaults),
      hashtags: postDefaults.hashtags || [],
      mode: "post",
      postType,
      scheduleTime: postDefaults.scheduleTime || "",
      location: postDefaults.location || "",
      privacy: postDefaults.privacy || "Public",
      aiGenerated: true,
      allowComment: postDefaults.allowComment !== false,
      allowReuse: postDefaults.allowReuse !== false,
      confirmPost: postDefaults.confirmPost || ""
    }
  });

  if (!response?.ok) throw new Error(response?.error || "โพสต์ลง TikTok ไม่สำเร็จ");
  return response;
}

export function buildTikTokVideoFilename(productInfo = {}) {
  const rawId = productInfo.productId || productInfo.id || productInfo.name || "product";
  const safeId = String(rawId).replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "product";
  const date = new Date().toISOString().slice(0, 10);
  return `${safeId}_${date}_tiktok.mp4`;
}
