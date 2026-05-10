/**
 * @description ขอ background เปิด Google Flow และส่ง prompt เข้าไป
 * @param {"image"|"video"} phase - phase ที่ต้องการเปิด
 * @param {string} prompt - prompt ที่จะวางใน Google Flow
 * @param {string} imageDataUrl - reference image แบบ data URL
 * @returns {Promise<string>} resultUrl ที่ได้กลับมาจาก automation
 */
export async function openGoogleFlow(phase, prompt, imageDataUrl = "") {
  const response = await chrome.runtime.sendMessage({
    type: "OPEN_GOOGLE_FLOW",
    payload: { phase, prompt, imageDataUrl }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "เปิด Google Flow ไม่สำเร็จ");
  }

  return response.resultUrl || "";
}
