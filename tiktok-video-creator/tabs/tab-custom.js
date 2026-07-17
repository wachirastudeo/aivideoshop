import { openGoogleFlow } from "../modules/google-flow.js";
import { downloadVideo, sendVideoToTikTokStudio } from "../modules/video-output.js";

let helpers = {};
let selectedImageBase64 = "";

export async function initCustomTab(injectedHelpers) {
  helpers = injectedHelpers;

  // Restore saved state if any
  const stored = await chrome.storage.local.get([
    "customCreatorPrompt",
    "customCreatorSettings",
    "customCreatorCaption",
    "customCreatorHashtags",
    "customCreatorPostAction",
    "customCreatorScheduleDate",
    "customCreatorScheduleTime"
  ]);

  if (stored.customCreatorPrompt) {
    const promptInput = document.querySelector("#custom-prompt");
    if (promptInput) promptInput.value = stored.customCreatorPrompt;
  }
  if (stored.customCreatorCaption) {
    const captionInput = document.querySelector("#custom-caption");
    if (captionInput) captionInput.value = stored.customCreatorCaption;
  }
  if (stored.customCreatorHashtags) {
    const hashtagsInput = document.querySelector("#custom-hashtags");
    if (hashtagsInput) hashtagsInput.value = stored.customCreatorHashtags;
  }
  if (stored.customCreatorPostAction) {
    setValue("custom-post-action", stored.customCreatorPostAction);
  }
  let defaultDt = new Date(Date.now() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
  const defaultY = defaultDt.getFullYear();
  const defaultM = String(defaultDt.getMonth() + 1).padStart(2, "0");
  const defaultD = String(defaultDt.getDate()).padStart(2, "0");
  const defaultHh = String(defaultDt.getHours()).padStart(2, "0");
  const defaultMm = String(defaultDt.getMinutes()).padStart(2, "0");

  if (stored.customCreatorScheduleDate) {
    setValue("custom-post-schedule-date", stored.customCreatorScheduleDate);
  } else {
    setValue("custom-post-schedule-date", `${defaultY}-${defaultM}-${defaultD}`);
  }
  if (stored.customCreatorScheduleTime) {
    setValue("custom-post-schedule-time", stored.customCreatorScheduleTime);
  } else {
    setValue("custom-post-schedule-time", `${defaultHh}:${defaultMm}`);
  }

  if (stored.customCreatorSettings) {
    const settings = stored.customCreatorSettings;
    if (settings.flowMode) setValue("custom-flow-mode", settings.flowMode);
    if (settings.videoModel) setValue("custom-video-model", settings.videoModel);
    if (settings.duration) setValue("custom-video-duration", settings.duration);
    if (settings.aspectRatio) setValue("custom-aspect-ratio", settings.aspectRatio);
  }

  syncScheduleTimeVisibility();

  // Bind events
  document.querySelector("#custom-prompt")?.addEventListener("input", saveState);
  document.querySelector("#custom-caption")?.addEventListener("input", saveState);
  document.querySelector("#custom-hashtags")?.addEventListener("input", saveState);
  document.querySelector("#custom-flow-mode")?.addEventListener("change", saveState);
  document.querySelector("#custom-video-model")?.addEventListener("change", saveState);
  document.querySelector("#custom-video-duration")?.addEventListener("change", saveState);
  document.querySelector("#custom-aspect-ratio")?.addEventListener("change", saveState);
  
  document.querySelector("#custom-post-action")?.addEventListener("change", () => {
    syncScheduleTimeVisibility();
    saveState();
  });
  document.querySelector("#custom-post-schedule-date")?.addEventListener("change", saveState);
  document.querySelector("#custom-post-schedule-time")?.addEventListener("change", saveState);

  const fileInput = document.querySelector("#custom-image-file");
  const fileInfo = document.querySelector("#custom-image-file-info");

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (file) {
      fileInfo.textContent = `เลือกรูปภาพแล้ว: ${file.name}`;
      try {
        selectedImageBase64 = await readFileAsDataUrl(file);
      } catch (err) {
        helpers.showStatus(err.message, "error");
        selectedImageBase64 = "";
      }
    } else {
      fileInfo.textContent = "ยังไม่ได้เลือกรูปภาพ (เว้นว่างไว้เพื่อเจนจากข้อความล้วน)";
      selectedImageBase64 = "";
    }
  });

  document.querySelector("#custom-btn-clear")?.addEventListener("click", () => {
    const promptInput = document.querySelector("#custom-prompt");
    if (promptInput) promptInput.value = "";
    const captionInput = document.querySelector("#custom-caption");
    if (captionInput) captionInput.value = "";
    const hashtagsInput = document.querySelector("#custom-hashtags");
    if (hashtagsInput) hashtagsInput.value = "";
    if (fileInput) fileInput.value = "";
    if (fileInfo) fileInfo.textContent = "ยังไม่ได้เลือกรูปภาพ (เว้นว่างไว้เพื่อเจนจากข้อความล้วน)";
    selectedImageBase64 = "";
    saveState();
  });

  document.querySelector("#custom-btn-create")?.addEventListener("click", () => startPipeline());
}

function getValue(id) {
  return document.querySelector(`#${id}`)?.value || "";
}

function setValue(id, val) {
  const el = document.querySelector(`#${id}`);
  if (el) el.value = val ?? "";
}

function syncScheduleTimeVisibility() {
  const action = getValue("custom-post-action");
  const container = document.querySelector("#custom-schedule-time-container");
  if (container) {
    container.style.display = action === "schedule" ? "block" : "none";
  }
}

async function saveState() {
  const prompt = document.querySelector("#custom-prompt")?.value || "";
  const caption = document.querySelector("#custom-caption")?.value || "";
  const hashtags = document.querySelector("#custom-hashtags")?.value || "";
  const settings = {
    flowMode: getValue("custom-flow-mode"),
    videoModel: getValue("custom-video-model"),
    duration: getValue("custom-video-duration"),
    aspectRatio: getValue("custom-aspect-ratio")
  };
  await chrome.storage.local.set({
    customCreatorPrompt: prompt,
    customCreatorCaption: caption,
    customCreatorHashtags: hashtags,
    customCreatorPostAction: getValue("custom-post-action"),
    customCreatorScheduleDate: getValue("custom-post-schedule-date"),
    customCreatorScheduleTime: getValue("custom-post-schedule-time"),
    customCreatorSettings: settings
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}

async function startPipeline() {
  const btn = document.querySelector("#custom-btn-create");
  const statusEl = document.querySelector("#custom-status");
  const prompt = document.querySelector("#custom-prompt")?.value.trim();
  const caption = document.querySelector("#custom-caption")?.value.trim() || "";
  const hashtagsRaw = document.querySelector("#custom-hashtags")?.value.trim() || "";

  if (!prompt) {
    helpers.showStatus("กรุณากรอก Prompt ก่อนเริ่มสร้าง", "error");
    return;
  }

  try {
    if (btn) btn.disabled = true;
    if (statusEl) {
      statusEl.style.color = "";
      statusEl.textContent = "กำลังเริ่มระบบอัตโนมัติเปิดหน้า Google Flow...";
    }
    helpers.logActivity?.("เริ่มการเจนวิดีโออิสระ", "info");

    const flowMode = getValue("custom-flow-mode");
    const videoModel = getValue("custom-video-model");
    const duration = parseInt(getValue("custom-video-duration"), 10) || 8;
    const aspectRatio = getValue("custom-aspect-ratio") || "9:16";
    const postAction = getValue("custom-post-action");

    const flowOptions = {
      imageModel: "nano-banana-pro",
      videoModel: videoModel,
      imageCount: 1,
      videoCount: 1,
      videoDuration: duration,
      aspectRatio: aspectRatio,
      flowGenMode: flowMode,
      noImage: !selectedImageBase64
    };

    const phase = flowMode === "video" ? "video" : "combined";
    
    // 1. เรียกใช้ openGoogleFlow
    const flowResult = await openGoogleFlow(phase, prompt, selectedImageBase64 || "", flowOptions);
    const videoUrl = flowResult?.resultUrl || "";

    if (!videoUrl) {
      throw new Error("ไม่พบวิดีโอผลลัพธ์จาก Google Flow");
    }

    if (statusEl) statusEl.textContent = "สร้างวิดีโอสำเร็จ! กำลังดาวน์โหลดและเตรียมโพสต์...";
    helpers.logActivity?.("สร้างวิดีโอใน Flow สำเร็จ กำลังดาวน์โหลด...", "success");

    // 2. จำลองข้อมูล Product แบบไม่มีข้อมูลสินค้าเพื่อข้ามการปักตะกร้า
    const customProduct = {
      productId: "",
      product_id: "",
      name: "custom_video_" + Date.now(),
      originalName: "Custom Video",
      caption: caption,
      hashtags: hashtagsRaw.split(",").map(t => t.trim()).filter(Boolean),
      source: "custom"
    };

    // ดาวน์โหลดวิดีโอ
    const downloaded = await downloadVideo(videoUrl, customProduct);
    const videoLocalUrl = downloaded.videoUrl || videoUrl;

    if (postAction === "download") {
      helpers.logActivity?.("ดาวน์โหลดวิดีโออิสระเสร็จสิ้น!", "success");
      if (statusEl) {
        statusEl.style.color = "#1a7";
        statusEl.textContent = "สร้างวิดีโอและดาวน์โหลดสำเร็จ!";
      }
      return;
    }

    // เซ็ต postNoLink = true ใน creatorState settings เพื่อข้ามการปักตะกร้าชัวร์ 100%
    const storedState = await chrome.storage.local.get("creatorState");
    const creatorState = storedState.creatorState || {};
    if (!creatorState.settings) creatorState.settings = {};
    creatorState.settings.postNoLink = true;
    
    // กรณีตั้งเวลาโพสต์ ดึง schedule time
    let scheduleTime = "";
    if (postAction === "schedule") {
      const dateVal = getValue("custom-post-schedule-date");
      const timeVal = getValue("custom-post-schedule-time") || "00:00";
      scheduleTime = (dateVal && timeVal) ? `${dateVal}T${timeVal}` : "";
      creatorState.settings.postScheduleTime = scheduleTime;
    }
    await chrome.storage.local.set({ creatorState });

    // 3. เรียกใช้ TikTok posting
    if (postAction === "draft") {
      helpers.logActivity?.("กำลังส่งแบบร่างไปยัง TikTok Studio...", "info");
      const res = await sendVideoToTikTokStudio(videoLocalUrl, customProduct, "draft");
      if (!res?.ok) throw new Error(res?.error || "ส่งแบบร่างล้มเหลว");
      helpers.logActivity?.("บันทึกแบบร่าง TikTok สำเร็จ!", "success");
    } else if (postAction === "post") {
      helpers.logActivity?.("กำลังส่งเพื่อโพสต์ไปยัง TikTok Studio...", "info");
      const res = await sendVideoToTikTokStudio(videoLocalUrl, customProduct, "post");
      if (!res?.ok) throw new Error(res?.error || "โพสต์ล้มเหลว");
      helpers.logActivity?.("โพสต์ไปยัง TikTok Studio สำเร็จ!", "success");
    } else if (postAction === "schedule") {
      helpers.logActivity?.("กำลังตั้งเวลาโพสต์ไปยัง TikTok Studio...", "info");
      const res = await sendVideoToTikTokStudio(videoLocalUrl, customProduct, "schedule");
      if (!res?.ok) throw new Error(res?.error || "ตั้งเวลาล้มเหลว");
      helpers.logActivity?.("ตั้งเวลาโพสต์บน TikTok Studio สำเร็จ!", "success");
    }

    if (statusEl) {
      statusEl.style.color = "#1a7";
      statusEl.textContent = "ดำเนินการสร้างวิดีโอและส่งไปยัง TikTok Studio สำเร็จ!";
    }

  } catch (err) {
    helpers.logActivity?.(`ทำงานอิสระผิดพลาด: ${err.message}`, "error");
    if (statusEl) {
      statusEl.style.color = "#e23";
      statusEl.textContent = `ผิดพลาด: ${err.message}`;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}
