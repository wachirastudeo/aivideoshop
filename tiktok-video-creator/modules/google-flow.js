import { openMetaAI } from "./meta-ai.js";
import { flowReferenceMode, flowStoryPartCount, resolveFlowClipLength } from "./flow-video-settings.js";

/**
 * @description ขอ background เปิด Google Flow และส่ง prompt เข้าไป
 * @param {"image"|"video"} phase - phase ที่ต้องการเปิด
 * @param {string} prompt - prompt ที่จะวางใน Google Flow
 * @param {string} imageUrl - URL ของรูปภาพ
 * @param {object} options - ตัวเลือกเพิ่มเติม (imageCount, videoCount, duration, aspectRatio)
 * @returns {Promise<string>} resultUrl ที่ได้กลับมาจาก automation
 */
export async function openGoogleFlow(phase, prompt, imageUrl = "", options = {}) {
  const { onStoryProgress, ...requestOptions } = options;
  options = requestOptions;
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const isMeta = (options.generationProvider || settings.generationProvider) === "meta-ai";
  if (phase === "video" || phase === "combined") {
    const model = options.videoModel || settings.flow?.videoModel || "veo-3.1-lite-low-priority";
    const parts = flowStoryPartCount(options.flowStoryParts);
    const referenceMode = flowReferenceMode(model, phase, parts, options.videoRefMode);
    const duration = isMeta ? 10 : resolveFlowClipLength(model, options.videoDuration);
    const direction = `MANDATORY VIDEO FORMAT: Create a vertical portrait 9:16 video lasting exactly ${duration} seconds. ${isMeta ? "Keep this format and duration throughout the final output." : "Use one continuous shot with no cuts or scene changes."}`;
    options = { ...options, videoDuration: duration, aspectRatio: "9:16", videoResolution: "720p" };
    if (!isMeta) {
      options = { ...options, videoModel: model, videoRefMode: referenceMode, verifyVideoLength: true, flowStoryParts: parts };
    }
    if (phase === "combined") {
      const prompts = typeof prompt === "string" ? { imagePrompt: prompt, videoPrompt: prompt } : prompt;
      prompt = { ...prompts, videoPrompt: `${direction}\n${prompts.videoPrompt || ""}\n${direction}` };
    } else {
      prompt = `${direction}\n${prompt}\n${direction}`;
    }
  }
  if (isMeta) return openMetaAI(phase, prompt, imageUrl, options);
  if (phase !== "image" && options.flowStoryParts > 1) return openFlowStory(phase, prompt, imageUrl, options, onStoryProgress);
  return runFlowJob(phase, prompt, imageUrl, options);
}

async function openFlowStory(phase, prompt, imageUrl, options, onProgress) {
  const controller = new AbortController();
  const stop = () => controller.abort(new Error("Google Flow story stopped"));
  const onChanged = (changes, area) => { if (area === "local" && changes.flowStopRequested?.newValue === true) stop(); };
  chrome.storage.onChanged.addListener(onChanged);
  try {
    const { flowStopRequested } = await chrome.storage.local.get("flowStopRequested");
    if (flowStopRequested) stop();
    const [{ generateFlowStory }, media] = await Promise.all([import("./flow-story.js"), import("./flow-story-media.js")]);
    const downloadClip = async (url, tabId, label) => {
      const response = await chrome.runtime.sendMessage({ type: "FLOW_FETCH_STORY_CLIP", payload: { url, tabId, label } });
      if (!response?.ok || !response.base64) throw new Error(response?.error || "Could not download the Flow story clip");
      return new Blob([Uint8Array.fromBase64(response.base64)], { type: response.mimeType });
    };
    const openClip = (...args) => runFlowJob(...args, controller.signal);
    return await generateFlowStory({ phase, prompt, imageUrl, options, onProgress, openClip, downloadClip, media, signal: controller.signal });
  } finally {
    chrome.storage.onChanged.removeListener(onChanged);
  }
}

async function runFlowJob(phase, prompt, imageUrl, options, signal) {
  signal?.throwIfAborted();
  // If prompt is an object { imagePrompt, videoPrompt }, it means we want the combined pipeline
  const jobId = crypto.randomUUID();
  const storageKey = `flowJob:${jobId}`;
  const payload = { phase, prompt, imageUrl, options, jobId };
  await chrome.storage.local.remove(storageKey);
  const donePromise = waitForFlowJob(jobId, signal);

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
    const error = new Error(result?.error || "Google Flow สร้างผลลัพธ์ไม่สำเร็จ");
    // เก็บภาพที่เจนเสร็จไว้ (ถ้ามี) เพื่อให้ผู้เรียกไม่ต้องเจนภาพใหม่
    if (result?.imgUrl) {
      error.imgUrl = result.imgUrl;
      error.imgTileId = result.imgTileId || "";
    }
    throw error;
  }
  return options.flowStorySequence ? { ...result, flowTabId: response.tabId } : result;
}

function waitForFlowJob(jobId, signal) {
  const storageKey = `flowJob:${jobId}`;
  let timer = null;
  let handler = null;
  let onAbort;

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    if (handler) chrome.storage.onChanged.removeListener(handler);
    signal?.removeEventListener("abort", onAbort);
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
    onAbort = () => {
      cleanup();
      resolve({ ok: false, error: "Google Flow story stopped", code: "STOP_REQUESTED" });
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    chrome.storage.local.get(storageKey).then((stored) => {
      const payload = stored[storageKey];
      if (!payload || payload.jobId !== jobId) return;
      cleanup();
      resolve(payload.result || { ok: false, error: "ไม่พบผลลัพธ์ Flow" });
    });

    timer = setTimeout(() => {
      cleanup();
      resolve({ ok: false, error: "หมดเวลารอผลลัพธ์ Google Flow (15 นาที)" });
    }, 15 * 60 * 1000);
    if (signal?.aborted) onAbort();
  });

  promise.cancel = cleanup;
  return promise;
}
