import { buildCaption } from "./prompt-builder.js";
import { postToTikTok } from "./tiktok-api.js";

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

  const safeName = String(productInfo.name || "product").replace(/[^\w\u0E00-\u0E7F-]+/g, "_").slice(0, 50);
  const date = new Date().toISOString().slice(0, 10);
  const response = await chrome.runtime.sendMessage({
    type: "DOWNLOAD_VIDEO",
    payload: { url, filename: `${safeName}_${date}_tiktok.mp4` }
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
  return postToTikTok({
    videoUrl,
    productId: productInfo.productId,
    productUrl: productInfo.productUrl,
    caption: buildCaption(productInfo, settings.postDefaults),
    privacy: "PUBLIC"
  });
}
