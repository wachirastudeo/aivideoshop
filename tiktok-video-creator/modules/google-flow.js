/**
 * @description ขอ background เปิด Google Flow และส่ง prompt เข้าไป
 * @param {"image"|"video"} phase - phase ที่ต้องการเปิด
 * @param {string} prompt - prompt ที่จะวางใน Google Flow
 * @param {string} imageUrl - URL ของรูปภาพ
 * @param {object} options - ตัวเลือกเพิ่มเติม (imageCount, videoCount, duration, aspectRatio)
 * @returns {Promise<string>} resultUrl ที่ได้กลับมาจาก automation
 */
export async function openGoogleFlow(phase, prompt, imageUrl = "", options = {}) {
  // If prompt is an object { imagePrompt, videoPrompt }, it means we want the combined pipeline
  const payload = { phase, prompt, imageUrl, options };

  const response = await chrome.runtime.sendMessage({
    type: "OPEN_GOOGLE_FLOW",
    payload
  });

  if (!response?.ok) {
    throw new Error(response?.error || "เปิด Google Flow ไม่สำเร็จ");
  }

  return response; // Return full response { ok, resultUrl, tileId, imgUrl }
}
