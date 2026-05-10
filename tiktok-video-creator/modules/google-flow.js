/**
 * @description ขอ background เปิด Google Flow และส่ง prompt เข้าไป
 * @param {"image"|"video"} phase - phase ที่ต้องการเปิด
 * @param {string} prompt - prompt ที่จะวางใน Google Flow
 * @param {string} imageDataUrl - reference image แบบ data URL (หรือ URL ธรรมดา)
 * @returns {Promise<string>} resultUrl ที่ได้กลับมาจาก automation
 */
export async function openGoogleFlow(phase, prompt, imageDataUrl = "") {
  let finalDataUrl = imageDataUrl;
  
  if (finalDataUrl && !finalDataUrl.startsWith("data:")) {
    try {
      const res = await fetch(finalDataUrl);
      const blob = await res.blob();
      finalDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Failed to convert image url to data url:", err);
      // Fallback
    }
  }

  const response = await chrome.runtime.sendMessage({
    type: "OPEN_GOOGLE_FLOW",
    payload: { phase, prompt, imageDataUrl: finalDataUrl }
  });

  if (!response?.ok) {
    throw new Error(response?.error || "เปิด Google Flow ไม่สำเร็จ");
  }

  return response.resultUrl || "";
}
