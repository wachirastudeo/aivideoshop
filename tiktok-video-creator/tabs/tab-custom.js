import { openGoogleFlow } from "../modules/google-flow.js";
import { downloadVideo, sendVideoToTikTokStudio } from "../modules/video-output.js";

const CUSTOM_VISUAL_STYLES = [
  {
    id: "cinematic",
    emoji: "🎬",
    name: "Cinematic / ภาพยนตร์",
    description: "มิติภาพสวย แสงเงาสมจริงระดับหนังฮอลลีวูด",
    fragment: "cinematic film style, dramatic lighting, beautiful depth of field, professional color grading, realistic cinematic shot"
  },
  {
    id: "anime",
    emoji: "🌸",
    name: "Anime / อนิเมะญี่ปุ่น",
    description: "ลายเล่นการ์ตูนญี่ปุ่น สีสันสดใส ลายเส้นสะอาดตา",
    fragment: "japanese anime aesthetic style, vibrant colors, clean hand-drawn linework, beautiful anime background"
  },
  {
    id: "3d-cartoon",
    emoji: "🧸",
    name: "3D Animation / การ์ตูน 3D",
    description: "แนวอนิเมชัน 3 มิติ คล้ายพิกซาร์ น่ารักละมุน",
    fragment: "3D animation style, cute character design, soft lighting, clay shaders, pixar disney aesthetic"
  },
  {
    id: "cyberpunk",
    emoji: "🌆",
    name: "Cyberpunk / ไซเบอร์พังก์",
    description: "โลกอนาคต แสงไฟนีออน และบรรยากาศยามค่ำคืน",
    fragment: "cyberpunk aesthetic style, glowing neon lights, futuristic city lights, dark moody atmosphere, purple and cyan color accents"
  },
  {
    id: "retro-vhs",
    emoji: "📺",
    name: "Retro VHS / วิดีโอยุค 90s",
    description: "กลิ่นอายย้อนยุค กลิตช์เทป และสีแนวอนาล็อก",
    fragment: "90s retro VHS video style, analog tape glitches, scanlines, nostalgic warm colors, retro chromatic aberration"
  },
  {
    id: "documentary",
    emoji: "📹",
    name: "Realistic / สารคดีสมจริง",
    description: "เหมือนถ่ายด้วยกล้องวิดีโอจริง แสงธรรมชาติ ไม่แต่งเติม",
    fragment: "realistic documentary style, raw footage feel, handheld camera movement, natural light, lifelike authentic colors"
  },
  {
    id: "stop-motion",
    emoji: "🧱",
    name: "Claymation / สต็อปโมชัน",
    description: "งานปั้นดินน้ำมันเคลื่อนไหวทีละเฟรม ดูมีเสน่ห์ทำมือ",
    fragment: "claymation stop-motion style, hand-crafted clay textures, slightly choppy organic frame rate, cute handmade aesthetic"
  },
  {
    id: "watercolor",
    emoji: "🎨",
    name: "Watercolor / ภาพวาดสีน้ำ",
    description: "แนวศิลปะภาพวาดสีน้ำละมุนฟุ้งๆ ชวนฝัน",
    fragment: "dreamy watercolor painting style, flowing paint textures, soft washes of color, hand-drawn sketch overlay"
  },
  {
    id: "glowing-neon",
    emoji: "⚡",
    name: "Neon Light / นีออนเรืองแสง",
    description: "ลายเส้นเรืองแสง สไตล์นีออนอาร์ตพื้นหลังเข้ม",
    fragment: "glowing neon wireframe style, bright electric outlines, dark background, high contrast synthwave theme"
  }
];

let helpers = {};
let selectedImageBase64 = "";
let selectedModelRefImageBase64 = "";

let stopRequested = false;
const stopWaiters = new Set();

function assertNotStopped() {
  if (!stopRequested) return;
  throw createStopError();
}

function createStopError() {
  const error = new Error("หยุดทำงานแล้ว");
  error.code = "STOP_REQUESTED";
  return error;
}

function runInterruptibly(task) {
  assertNotStopped();

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      stopWaiters.delete(onStop);
      callback(value);
    };
    const onStop = () => finish(reject, createStopError());
    stopWaiters.add(onStop);

    Promise.resolve()
      .then(() => {
        assertNotStopped();
        return task();
      })
      .then(
        (value) => finish(resolve, value),
        (error) => finish(reject, error)
      );
  });
}

async function requestStop() {
  stopRequested = true;
  for (const stop of [...stopWaiters]) stop();
  const statusEl = document.querySelector("#custom-status");
  if (statusEl) statusEl.textContent = "กำลังหยุด...";
  
  await chrome.storage.local.set({ tiktokStopRequested: true, flowStopRequested: true });

  await Promise.allSettled([
    chrome.runtime.sendMessage({ type: "FLOW_STOP" }),
    chrome.runtime.sendMessage({ type: "TIKTOK_STOP" })
  ]);
}

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
    "customCreatorScheduleTime",
    "customCreatorStyle",
    "customCreatorModelRefImage",
    "activeFlowTabId",
    "activeTikTokTabId"
  ]);

  populateStyleDropdown();

  if (stored.customCreatorPrompt) {
    const promptInput = document.querySelector("#custom-prompt");
    if (promptInput) promptInput.value = stored.customCreatorPrompt;
  }
  if (stored.customCreatorStyle) {
    setValue("custom-video-style", stored.customCreatorStyle);
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
  defaultDt.setMinutes(Math.round(defaultDt.getMinutes() / 5) * 5);
  defaultDt.setSeconds(0);
  defaultDt.setMilliseconds(0);
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
    setValue("custom-loops", settings.loops || 1);
    setValue("custom-schedule-interval", settings.scheduleInterval || 10);
  }

  if (stored.customCreatorModelRefImage) {
    selectedModelRefImageBase64 = stored.customCreatorModelRefImage;
  }
  renderCustomModelRefPreview();

  syncScheduleTimeVisibility();

  // Bind events
  document.querySelector("#custom-prompt")?.addEventListener("input", saveState);
  document.querySelector("#custom-video-style")?.addEventListener("change", saveState);
  document.querySelector("#custom-caption")?.addEventListener("input", saveState);
  document.querySelector("#custom-hashtags")?.addEventListener("input", saveState);
  document.querySelector("#custom-flow-mode")?.addEventListener("change", saveState);
  document.querySelector("#custom-video-model")?.addEventListener("change", saveState);
  document.querySelector("#custom-video-duration")?.addEventListener("change", saveState);
  document.querySelector("#custom-aspect-ratio")?.addEventListener("change", saveState);
  document.querySelector("#custom-loops")?.addEventListener("input", saveState);
  document.querySelector("#custom-schedule-interval")?.addEventListener("input", saveState);
  
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

  const modelRefInput = document.querySelector("#custom-model-ref-image-input");
  modelRefInput?.addEventListener("change", async () => {
    const file = modelRefInput.files?.[0];
    if (file) {
      try {
        selectedModelRefImageBase64 = await readFileAsDataUrl(file);
        renderCustomModelRefPreview();
        await saveState();
        helpers.showStatus?.("อัปโหลดภาพใบหน้าอ้างอิงสำเร็จ", "success");
      } catch (err) {
        helpers.showStatus?.(err.message, "error");
        selectedModelRefImageBase64 = "";
        renderCustomModelRefPreview();
      }
    }
  });

  const modelRefClearBtn = document.querySelector("#custom-model-ref-clear-btn");
  modelRefClearBtn?.addEventListener("click", async () => {
    selectedModelRefImageBase64 = "";
    if (modelRefInput) modelRefInput.value = "";
    renderCustomModelRefPreview();
    await saveState();
    helpers.showStatus?.("ลบภาพใบหน้าอ้างอิงแล้ว", "info");
  });

  document.querySelector("#custom-btn-clear")?.addEventListener("click", () => {
    const promptInput = document.querySelector("#custom-prompt");
    if (promptInput) promptInput.value = "";
    setValue("custom-video-style", "none");
    const captionInput = document.querySelector("#custom-caption");
    if (captionInput) captionInput.value = "";
    const hashtagsInput = document.querySelector("#custom-hashtags");
    if (hashtagsInput) hashtagsInput.value = "";
    if (fileInput) fileInput.value = "";
    if (fileInfo) fileInfo.textContent = "ยังไม่ได้เลือกรูปภาพ (เว้นว่างไว้เพื่อเจนจากข้อความล้วน)";
    selectedImageBase64 = "";
    selectedModelRefImageBase64 = "";
    if (modelRefInput) modelRefInput.value = "";
    renderCustomModelRefPreview();
    setValue("custom-loops", 1);
    setValue("custom-schedule-interval", 10);
    saveState();
  });

   document.querySelector("#custom-btn-create")?.addEventListener("click", () => startPipeline());
  document.querySelector("#custom-btn-stop")?.addEventListener("click", () => {
    requestStop().catch(() => {});
  });

  // Sync running state from storage on load
  const isRunning = Boolean(stored.activeFlowTabId || stored.activeTikTokTabId);
  const createBtn = document.querySelector("#custom-btn-create");
  const stopBtn = document.querySelector("#custom-btn-stop");
  const clearBtn = document.querySelector("#custom-btn-clear");
  if (createBtn) createBtn.hidden = isRunning;
  if (stopBtn) stopBtn.hidden = !isRunning;
  if (clearBtn) clearBtn.disabled = isRunning;
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

  // Update preview
  const dateVal = getValue("custom-post-schedule-date");
  const timeVal = getValue("custom-post-schedule-time");
  const previewEl = document.getElementById("custom-post-schedule-preview");
  if (previewEl) {
    if (dateVal && timeVal) {
      previewEl.textContent = `ตรงกับวันที่บน TikTok: ${dateVal} เวลา ${timeVal}`;
      previewEl.style.display = "block";
    } else {
      previewEl.style.display = "none";
    }
  }

  const intervalContainer = document.querySelector("#custom-schedule-interval-container");
  if (intervalContainer) {
    intervalContainer.style.display = action === "schedule" ? "block" : "none";
  }
}

function renderCustomModelRefPreview() {
  const previewImg = document.querySelector("#custom-model-ref-preview-img");
  const placeholderIcon = document.querySelector("#custom-model-ref-placeholder-icon");
  const clearBtn = document.querySelector("#custom-model-ref-clear-btn");
  if (selectedModelRefImageBase64) {
    if (previewImg) {
      previewImg.src = selectedModelRefImageBase64;
      previewImg.hidden = false;
    }
    if (placeholderIcon) placeholderIcon.style.display = "none";
    if (clearBtn) clearBtn.hidden = false;
  } else {
    if (previewImg) {
      previewImg.src = "";
      previewImg.hidden = true;
    }
    if (placeholderIcon) placeholderIcon.style.display = "block";
    if (clearBtn) clearBtn.hidden = true;
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
    aspectRatio: getValue("custom-aspect-ratio"),
    loops: parseInt(getValue("custom-loops"), 10) || 1,
    scheduleInterval: parseInt(getValue("custom-schedule-interval"), 10) || 10
  };
  await chrome.storage.local.set({
    customCreatorPrompt: prompt,
    customCreatorCaption: caption,
    customCreatorHashtags: hashtags,
    customCreatorPostAction: getValue("custom-post-action"),
    customCreatorScheduleDate: getValue("custom-post-schedule-date"),
    customCreatorScheduleTime: getValue("custom-post-schedule-time"),
    customCreatorStyle: getValue("custom-video-style"),
    customCreatorSettings: settings,
    customCreatorModelRefImage: selectedModelRefImageBase64
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

function interruptibleDelay(ms) {
  return runInterruptibly(() => new Promise(resolve => setTimeout(resolve, ms)));
}

async function startPipeline() {
  const btn = document.querySelector("#custom-btn-create");
  const stopBtn = document.querySelector("#custom-btn-stop");
  const clearBtn = document.querySelector("#custom-btn-clear");
  const statusEl = document.querySelector("#custom-status");
  const prompt = document.querySelector("#custom-prompt")?.value.trim();
  const caption = document.querySelector("#custom-caption")?.value.trim() || "";
  const hashtagsRaw = document.querySelector("#custom-hashtags")?.value.trim() || "";

  if (!prompt) {
    helpers.showStatus("กรุณากรอก Prompt ก่อนเริ่มสร้าง", "error");
    return;
  }

  try {
    stopRequested = false;
    await chrome.storage.local.set({ tiktokStopRequested: false, flowStopRequested: false });

    if (btn) btn.hidden = true;
    if (stopBtn) stopBtn.hidden = false;
    if (clearBtn) clearBtn.disabled = true;

    const flowMode = getValue("custom-flow-mode");
    const videoModel = getValue("custom-video-model");
    const duration = parseInt(getValue("custom-video-duration"), 10) || 8;
    const aspectRatio = getValue("custom-aspect-ratio") || "9:16";
    const postAction = getValue("custom-post-action");
    const loops = parseInt(getValue("custom-loops"), 10) || 1;
    const interval = parseInt(getValue("custom-schedule-interval"), 10) || 10;

    let scheduledCount = 0;

    for (let i = 0; i < loops; i++) {
      assertNotStopped();
      const loopPrefix = loops > 1 ? `[รอบที่ ${i + 1}/${loops}] ` : "";

      if (statusEl) {
        statusEl.style.color = "";
        statusEl.textContent = `${loopPrefix}กำลังเริ่มระบบอัตโนมัติเปิดหน้า Google Flow...`;
      }
      helpers.logActivity?.(`${loopPrefix}เริ่มการเจนวิดีโออิสระ`, "info");

      const imageUrls = [];
      if (selectedImageBase64) imageUrls.push(selectedImageBase64);
      if (selectedModelRefImageBase64) imageUrls.push(selectedModelRefImageBase64);

      const flowOptions = {
        imageModel: "nano-banana-pro",
        videoModel: videoModel,
        imageCount: 1,
        videoCount: 1,
        videoDuration: duration,
        aspectRatio: aspectRatio,
        flowGenMode: flowMode,
        noImage: !selectedImageBase64 && !selectedModelRefImageBase64
      };

      if (imageUrls.length > 0) {
        flowOptions.imageUrls = imageUrls;
      }

      const phase = ["video", "image"].includes(flowMode) ? flowMode : "combined";
      
      const styleId = getValue("custom-video-style");
      const styleObj = CUSTOM_VISUAL_STYLES.find(s => s.id === styleId);
      const styleFragment = styleObj ? styleObj.fragment : "";

      let finalPrompt = prompt;
      if (styleFragment) {
        finalPrompt = `${prompt}\nVisual style: ${styleFragment}.`;
      }
      if (selectedImageBase64) {
        finalPrompt = `${finalPrompt}
STRICT PRODUCT FIDELITY LOCK: You MUST reproduce the product EXACTLY as in the reference image. Preserve its exact shape, 3D geometry, form, contours, colors, texture, printed artwork, logos, labels, and parts. STRICT RULE: Do NOT redesign, warp, deform, restyle, simplify, or modify the product. Do not add extra items or decorations. It must look 100% identical and pixel-faithful to the reference without any visual drift. ABSOLUTE ZERO DISTORTION RULE: All printed text, logos, packaging dimensions, and labels must be preserved exactly as shown, with perfect spelling.
Reproduce the printed surface artwork, motifs, patterns, illustrations, logos, and graphics EXACTLY as in the reference. Maintain the exact layout, colors, shapes, and placement. Copy it pixel-faithfully; never redraw, restyle, simplify, distort, or replace. For videos, this pattern must remain static on the product surface.
EXACT COLOR & PATTERN ACCURACY: Preserve the exact colors, patterns, artwork, and motifs from the reference. Do NOT shift, alter, recolor, or replace original colors or graphics under any lighting or environment effect.
STRICT RIGIDITY & STABILITY LOCK: Realistic motion only. The product must remain completely rigid, solid, and static throughout the video: strictly NO morphing, warping, bending, melting, opening, closing, floating, stretching, or shifting of dimensions. Preserve 100% exact product identity across all video frames. Camera movement must be smooth and stable.`;
      }
      if (selectedModelRefImageBase64) {
        finalPrompt = `${finalPrompt}\nSTRICT PRESENTER MATCH: A model reference image is provided. The presenter's face, hair, and overall appearance MUST look exactly identical to the model in the model reference image.`;
      }

      assertNotStopped();

      // 1. เรียกใช้ openGoogleFlow
      const flowResult = await runInterruptibly(() => openGoogleFlow(phase, finalPrompt, selectedImageBase64 || "", flowOptions));
      assertNotStopped();

      const videoUrl = flowResult?.resultUrl || "";

      if (!videoUrl) {
        throw new Error(flowMode === "image" ? "ไม่พบรูปภาพผลลัพธ์จาก Google Flow" : "ไม่พบวิดีโอผลลัพธ์จาก Google Flow");
      }

      if (statusEl) statusEl.textContent = `${loopPrefix}${flowMode === "image" ? "สร้างรูปภาพสำเร็จ! กำลังดาวน์โหลด..." : "สร้างวิดีโอสำเร็จ! กำลังดาวน์โหลดและเตรียมโพสต์..."}`;
      helpers.logActivity?.(`${loopPrefix}${flowMode === "image" ? "สร้างรูปภาพใน Flow สำเร็จ กำลังดาวน์โหลด..." : "สร้างวิดีโอใน Flow สำเร็จ กำลังดาวน์โหลด..."}`, "success");

      // 2. จำลองข้อมูล Product แบบไม่มีข้อมูลสินค้าเพื่อข้ามการปักตะกร้า
      const customProduct = {
        productId: "",
        product_id: "",
        name: (flowMode === "image" ? "custom_image_" : "custom_video_") + Date.now() + `_${i}`,
        originalName: flowMode === "image" ? "Custom Image" : "Custom Video",
        caption: caption,
        hashtags: hashtagsRaw.split(",").map(t => t.trim()).filter(Boolean),
        source: "custom",
        isImage: flowMode === "image"
      };

      assertNotStopped();

      // ดาวน์โหลดรูปภาพ/วิดีโอ
      const downloaded = await runInterruptibly(() => downloadVideo(videoUrl, customProduct));
      assertNotStopped();

      const videoLocalUrl = downloaded.videoUrl || videoUrl;

      if (postAction === "download" || flowMode === "image") {
        helpers.logActivity?.(`${loopPrefix}${flowMode === "image" ? "ดาวน์โหลดรูปภาพอิสระเสร็จสิ้น!" : "ดาวน์โหลดวิดีโออิสระเสร็จสิ้น!"}`, "success");
        if (statusEl) {
          statusEl.style.color = "#1a7";
          statusEl.textContent = `${loopPrefix}${flowMode === "image" ? "สร้างรูปภาพและดาวน์โหลดสำเร็จ!" : "สร้างวิดีโอและดาวน์โหลดสำเร็จ!"}`;
        }
        
        if (i < loops - 1) {
          const delaySec = 5;
          helpers.showStatus?.(`รอบที่ ${i + 1} เสร็จสิ้น รอ ${delaySec} วินาทีก่อนเริ่มรอบถัดไป...`, "info");
          await interruptibleDelay(delaySec * 1000);
        }
        continue;
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

      assertNotStopped();

      // 3. เรียกใช้ TikTok posting
      if (postAction === "draft") {
        helpers.logActivity?.(`${loopPrefix}กำลังส่งแบบร่างไปยัง TikTok Studio...`, "info");
        const res = await runInterruptibly(() => sendVideoToTikTokStudio(videoLocalUrl, customProduct, "draft"));
        if (!res?.ok) throw new Error(res?.error || "ส่งแบบร่างล้มเหลว");
        helpers.logActivity?.(`${loopPrefix}บันทึกแบบร่าง TikTok สำเร็จ!`, "success");
      } else if (postAction === "post") {
        helpers.logActivity?.(`${loopPrefix}กำลังส่งเพื่อโพสต์ไปยัง TikTok Studio...`, "info");
        const res = await runInterruptibly(() => sendVideoToTikTokStudio(videoLocalUrl, customProduct, "post"));
        if (!res?.ok) throw new Error(res?.error || "โพสต์ล้มเหลว");
        helpers.logActivity?.(`${loopPrefix}โพสต์ไปยัง TikTok Studio สำเร็จ!`, "success");
      } else if (postAction === "schedule") {
        helpers.logActivity?.(`${loopPrefix}กำลังตั้งเวลาโพสต์ไปยัง TikTok Studio...`, "info");
        const minutesOffset = scheduledCount * interval;
        const res = await runInterruptibly(() => sendVideoToTikTokStudio(videoLocalUrl, customProduct, "schedule", minutesOffset));
        if (!res?.ok) throw new Error(res?.error || "ตั้งเวลาล้มเหลว");
        helpers.logActivity?.(`${loopPrefix}ตั้งเวลาโพสต์บน TikTok Studio สำเร็จ! (บวกเวลาเพิ่ม ${minutesOffset} นาที)`, "success");
        scheduledCount++;
      }

      if (statusEl) {
        statusEl.style.color = "#1a7";
        statusEl.textContent = `${loopPrefix}ดำเนินการสร้างวิดีโอและส่งไปยัง TikTok Studio สำเร็จ!`;
      }

      if (i < loops - 1) {
        const delaySec = 10;
        helpers.showStatus?.(`รอบที่ ${i + 1} เสร็จสิ้น รอ ${delaySec} วินาทีก่อนเริ่มรอบถัดไป...`, "info");
        await interruptibleDelay(delaySec * 1000);
      }
    }

  } catch (err) {
    if (stopRequested || err?.code === "STOP_REQUESTED") {
      helpers.logActivity?.("หยุดทำงานอิสระสำเร็จ", "info");
      if (statusEl) {
        statusEl.style.color = "#888";
        statusEl.textContent = "หยุดทำงานแล้ว";
      }
    } else {
      helpers.logActivity?.(`ทำงานอิสระผิดพลาด: ${err.message}`, "error");
      if (statusEl) {
        statusEl.style.color = "#e23";
        statusEl.textContent = `ผิดพลาด: ${err.message}`;
      }
    }
  } finally {
    if (btn) btn.hidden = false;
    if (stopBtn) stopBtn.hidden = true;
    if (clearBtn) clearBtn.disabled = false;
    stopRequested = false;
  }
}

function populateStyleDropdown() {
  const select = document.querySelector("#custom-video-style");
  if (!select) return;
  select.innerHTML = CUSTOM_VISUAL_STYLES.map((style) => `
    <option value="${style.id}">${style.emoji} ${style.name} - ${style.description}</option>
  `).join("");
  select.insertAdjacentHTML("afterbegin", `<option value="none" selected>ไม่ระบุสไตล์ (ใช้ Prompt ล้วนๆ)</option>`);
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && (changes.activeFlowTabId || changes.activeTikTokTabId)) {
    chrome.storage.local.get(["activeFlowTabId", "activeTikTokTabId"]).then((stored) => {
      const running = Boolean(stored.activeFlowTabId || stored.activeTikTokTabId);
      const createBtn = document.querySelector("#custom-btn-create");
      const stopBtn = document.querySelector("#custom-btn-stop");
      const clearBtn = document.querySelector("#custom-btn-clear");
      if (createBtn) createBtn.hidden = running;
      if (stopBtn) stopBtn.hidden = !running;
      if (clearBtn) clearBtn.disabled = running;
    });
  }
});
