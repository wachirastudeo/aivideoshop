/**
 * @description ขอ background เปิด Google Flow และส่ง prompt เข้าไป
 * @param {"image"|"video"} phase - phase ที่ต้องการเปิด
 * @param {string} prompt - prompt ที่จะวางใน Google Flow
 * @param {string} imageUrl - URL ของรูปภาพ
 * @returns {Promise<string>} resultUrl ที่ได้กลับมาจาก automation
 */
export async function openGoogleFlow(phase, prompt, imageUrl = "") {
  const response = await chrome.runtime.sendMessage({
    type: "OPEN_GOOGLE_FLOW",
    payload: { phase, prompt, imageUrl }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "เปิด Google Flow ไม่สำเร็จ");
  }

  return response.resultUrl || "";
}
