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
  const jobId = crypto.randomUUID();
  const storageKey = `flowJob:${jobId}`;
  const payload = { phase, prompt, imageUrl, options, jobId };
  await chrome.storage.local.remove(storageKey);
  const donePromise = waitForFlowJob(jobId);

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "OPEN_GOOGLE_FLOW",
      payload
    });
  } catch (error) {
    donePromise.cancel();
    throw error;
  }

  if (!response?.ok || !response?.started) {
    donePromise.cancel();
    const error = new Error(response?.error || "เปิด Google Flow ไม่สำเร็จ");
    error.code = response?.code || "";
    throw error;
  }

  const result = await donePromise;
  await chrome.storage.local.remove(storageKey);
  if (!result?.ok) {
    throw new Error(result?.error || "Google Flow สร้างผลลัพธ์ไม่สำเร็จ");
  }
  return result;
}

function waitForFlowJob(jobId, timeoutMs = 12 * 60 * 1000) {
  const storageKey = `flowJob:${jobId}`;
  let timer = null;
  let handler = null;

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    if (handler) chrome.storage.onChanged.removeListener(handler);
  };

  const promise = new Promise((resolve) => {
    handler = (changes, areaName) => {
      if (areaName !== "local") return;
      const payload = changes[storageKey]?.newValue;
      if (!payload || payload.jobId !== jobId) return;
      cleanup();
      resolve(payload.result || { ok: false, error: "ไม่พบผลลัพธ์ Flow" });
    };
    chrome.storage.onChanged.addListener(handler);

    chrome.storage.local.get(storageKey).then((stored) => {
      const payload = stored[storageKey];
      if (!payload || payload.jobId !== jobId) return;
      cleanup();
      resolve(payload.result || { ok: false, error: "ไม่พบผลลัพธ์ Flow" });
    });

    timer = setTimeout(() => {
      cleanup();
      resolve({ ok: false, error: "หมดเวลารอผลลัพธ์ Google Flow (12 นาที)" });
    }, timeoutMs);
  });

  promise.cancel = cleanup;
  return promise;
}
