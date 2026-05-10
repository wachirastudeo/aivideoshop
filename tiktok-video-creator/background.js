import { fetchShowcaseProducts } from "./modules/tiktok-api.js";

/**
 * @description เปิด side panel เมื่อผู้ใช้คลิก icon extension
 */
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel?.open && tab?.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
    return;
  }

  await openCreatorTab();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  routeMessage(message, sender)
    .then((payload) => sendResponse({ ok: true, ...payload }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "เกิดข้อผิดพลาด" }));
  return true;
});

/**
 * @description route message จาก sidepanel ไปยัง action ที่เกี่ยวข้อง
 * @param {object} message - runtime message
 * @param {object} sender - sender info
 * @returns {Promise<object>} response payload
 */
async function routeMessage(message, sender) {
  switch (message?.type) {
    case "FETCH_PRODUCTS":
      return fetchShowcaseProducts(message.payload);
    case "OPEN_GOOGLE_FLOW":
      return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO":
      return downloadVideo(message.payload);
    case "POST_TO_TIKTOK":
      return postToTikTok(message.payload);
    default:
      throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
  }
}

async function openCreatorTab() {
  const url = chrome.runtime.getURL("sidepanel.html?mode=tab");
  const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("sidepanel.html*") });
  const existing = existingTabs[0];

  if (existing?.id) {
    await chrome.tabs.update(existing.id, { active: true });
    return { tabId: existing.id };
  }

  const tab = await chrome.tabs.create({ url, active: true });
  return { tabId: tab.id };
}

/**
 * @description เปิด Google Flow และพยายาม inject prompt ลง textarea/input
 * @param {object} payload - phase, prompt, imageDataUrl
 * @returns {Promise<object>} tab id
 */
async function openGoogleFlow(payload) {
  let tab;
  const existingTabs = await chrome.tabs.query({ url: "*://labs.google/fx/tools/flow*" });
  
  if (existingTabs.length > 0) {
    tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    // ถ้าหน้ายังโหลดไม่เสร็จ ให้รอ
    if (tab.status !== "complete") {
      await waitForTabComplete(tab.id);
    }
  } else {
    tab = await chrome.tabs.create({ url: "https://labs.google/fx/tools/flow", active: true });
    await waitForTabComplete(tab.id);
  }

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [payload.prompt, payload.phase, payload.imageDataUrl],
    func: injectPromptIntoFlow
  });

  if (!result?.ok) {
    await notify("TikTok Video Creator", result?.error || "ไม่สามารถ Automation ได้ทั้งหมด กรุณาตรวจสอบแท็บ");
  } else {
    await notify("TikTok Video Creator", "สร้างผลลัพธ์สำเร็จ (Auto-Flow)");
  }

  return { tabId: tab.id, ok: result?.ok, error: result?.error, resultUrl: result?.resultUrl };
}

/**
 * @description ฟังก์ชันแบบ Playwright-style ทำงานฝั่ง Client เพื่ออัพรูป, กดปุ่ม, และรอผลลัพธ์
 */
function injectPromptIntoFlow(prompt, phase, imageDataUrl) {
  return new Promise(async (resolve) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    
    // Playwright-like: waitForElement
    const waitForNewMedia = (type, timeout = 120000) => {
      const existingCount = document.querySelectorAll(type).length;
      return new Promise((res, rej) => {
        const observer = new MutationObserver(() => {
          const items = document.querySelectorAll(type);
          if (items.length > existingCount) {
            observer.disconnect();
            const latest = items[items.length - 1];
            res(latest.src || latest.querySelector("source")?.src);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
        setTimeout(() => { observer.disconnect(); rej(new Error("Timeout รอโหลด Media")); }, timeout);
      });
    };

    try {
      const helper = document.createElement("div");
      helper.style.cssText = "position:fixed;z-index:99999;left:16px;bottom:16px;padding:12px;border-radius:8px;background:#111;color:#0f0;border:1px solid #0f0;font:14px system-ui";
      helper.textContent = "🤖 Auto Flow Running... Waiting for page";
      document.body.append(helper);

      // รอเว็บโหลด UI เสร็จก่อน (เพราะเว็บ React มักจะโหลดช้า)
      const waitForUI = () => new Promise(res => {
        const start = Date.now();
        const timer = setInterval(() => {
          const btn = Array.from(document.querySelectorAll("button, [role='button']")).find(b => {
            const text = (b.textContent || "").toLowerCase();
            return text.includes("new project");
          });
          const fld = document.querySelector("textarea, [contenteditable='true']");
          if (btn || fld || Date.now() - start > 15000) {
            clearInterval(timer);
            res();
          }
        }, 500);
      });
      await waitForUI();

      // 0. ตรวจสอบว่าอยู่หน้า Dashboard หรือไม่
      const newProjectBtn = Array.from(document.querySelectorAll("button, [role='button']")).find(b => {
         const text = (b.textContent || "").toLowerCase();
         // ไม่เอาปุ่มที่มีไอคอน add_2 (นั่นคือปุ่ม attachment ใน editor)
         const hasAddIcon = b.querySelector("i")?.textContent.includes("add_2");
         return text.includes("new project") && !hasAddIcon;
      });
      
      if (newProjectBtn) {
        helper.textContent = "⏳ Clicking 'New project'...";
        newProjectBtn.click();
        
        // รอให้ Textarea โหลดขึ้นมา
        const start = Date.now();
        while (Date.now() - start < 10000) {
          const found = [...document.querySelectorAll("textarea"), ...document.querySelectorAll("[contenteditable='true']")].find(n => n.getBoundingClientRect().width > 50);
          if (found) break;
          await sleep(500);
        }
        await sleep(1000); // เผื่อ animation
      }

      // 0.5 ตั้งค่า Mode (Image/Video) และสัดส่วน 9:16
      const settingsBtn = Array.from(document.querySelectorAll("button[aria-haspopup='menu'], button[aria-haspopup='dialog'], button[aria-haspopup='true']")).find(b => 
        (b.textContent || "").includes("Image") || 
        (b.textContent || "").includes("Video") || 
        (b.textContent || "").includes("crop_") || 
        (b.textContent || "").includes("1x") ||
        (b.querySelector("i") && !b.querySelector("i").textContent.includes("add_2"))
      );
      if (settingsBtn) {
        helper.textContent = "⏳ Setting up mode and 9:16 ratio...";
        settingsBtn.click();
        await sleep(500); // รอเมนูเปิด
        
        const tabs = Array.from(document.querySelectorAll("[role='tab'], [role='menuitem']"));
        
        // เลือกโหมดตาม phase
        const modeText = phase === "image" ? "Image" : "Video";
        const modeTab = tabs.find(t => (t.textContent || "").trim() === modeText);
        if (modeTab && modeTab.getAttribute("aria-selected") !== "true") {
          modeTab.click();
          await sleep(300);
        }
        
        // เลือก 9:16
        const ratioTab = tabs.find(t => (t.textContent || "").includes("9:16"));
        if (ratioTab && ratioTab.getAttribute("aria-selected") !== "true") {
          ratioTab.click();
          await sleep(300);
        }
        
        // ปิดเมนู (ถ้าเป็น dialog อาจต้องกดที่อื่น หรือกดซ้ำ)
        if (settingsBtn.getAttribute("aria-expanded") === "true" || settingsBtn.getAttribute("data-state") === "open") {
          settingsBtn.click();
          await sleep(500);
        }
      }

      // 1. Upload File ก่อน
      if (imageDataUrl && imageDataUrl.startsWith("data:")) {
        // หาปุ่ม attachment add_2 แล้วคลิกเพื่อเปิดเมนู Upload Image ถ้ายังไม่เปิด
        const attachBtn = Array.from(document.querySelectorAll("button")).find(b => {
          const iText = b.querySelector("i")?.textContent || "";
          return iText.includes("add_2");
        });
        if (attachBtn && attachBtn.getAttribute("aria-expanded") !== "true" && attachBtn.getAttribute("data-state") !== "open") {
          attachBtn.click();
          await sleep(500);
        }

        const [header, base64] = imageDataUrl.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const bstr = atob(base64);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) u8arr[n] = bstr.charCodeAt(n);
        const file = new File([new Blob([u8arr], { type: mime })], "ref.png", { type: mime });
        
        // วิธีที่ 1: input[type="file"]
        const fileInput = document.querySelector("input[type='file']");
        if (fileInput) {
          const dt = new DataTransfer();
          dt.items.add(file);
          fileInput.files = dt.files;
          fileInput.dispatchEvent(new Event("change", { bubbles: true }));
        }
        
        // วิธีที่ 2: Drop Event บนพื้นที่ Upload Image
        const uploadDiv = Array.from(document.querySelectorAll("div")).find(d => (d.textContent || "").includes("Upload image"));
        if (uploadDiv) {
          const dt = new DataTransfer();
          dt.items.add(file);
          const dropEvent = new DragEvent("drop", {
            bubbles: true, cancelable: true, dataTransfer: dt
          });
          uploadDiv.dispatchEvent(dropEvent);
        }
      }

      await sleep(1000); // รอภาพโหลด

      // 2. Fill Text
      const candidates = [...document.querySelectorAll("textarea"), ...document.querySelectorAll("[contenteditable='true']"), ...document.querySelectorAll("input[type='text']")];
      const field = candidates.find(n => n.getBoundingClientRect().width > 50);
      if (field) {
        field.focus();
        if ("value" in field) {
          field.value = prompt;
          field.dispatchEvent(new Event("change", { bubbles: true }));
          field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
        } else {
          // Content Editable (e.g. Slate.js)
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, prompt);
        }
      }

      await sleep(1500);

      // รอให้ UI พร้อม (รอให้ loading state หายไป)
      helper.textContent = "⏳ Waiting for UI to be ready...";
      const waitForUIReady = () => new Promise(res => {
        const start = Date.now();
        const checkInterval = setInterval(() => {
          const buttons = document.querySelectorAll("button, [role='button']");
          const isLoading = document.querySelector("[role='progressbar']") || 
                           document.querySelector(".loading") || 
                           document.querySelector("[aria-busy='true']");
          if (buttons.length > 0 && !isLoading) {
            clearInterval(checkInterval);
            res();
          }
          if (Date.now() - start > 10000) {
            clearInterval(checkInterval);
            res(); // ให้ดำเนินการต่อแม้ว่ายังไม่พร้อมก็ตาม
          }
        }, 300);
      });
      await waitForUIReady();

      // 3. Click Generate (หรือกด Enter)
      const getGenerateBtn = () => {
        const buttons = Array.from(document.querySelectorAll("button, [role='button']"));
        
        // ลำดับที่ 1: ค้นหาข้อความแบบ fuzzy match (generate, run, submit, create, confirm)
        let btn = buttons.find(b => {
          const text = (b.textContent || "").toLowerCase().trim();
          return text.includes("generate") || text.includes("run") || text.includes("submit") || 
                 text.includes("create") || text.includes("confirm") || text.includes("send");
        });
        
        // ลำดับที่ 2: ค้นหาปุ่มที่มี arrow icon (arrow_forward, arrow_right, chevron_right)
        if (!btn) {
          btn = buttons.find(b => {
            const hasArrow = b.querySelector("i") && (
              b.querySelector("i").textContent.includes("arrow_forward") ||
              b.querySelector("i").textContent.includes("arrow_right") ||
              b.querySelector("i").textContent.includes("chevron_right") ||
              b.querySelector("i").textContent.includes("play_arrow")
            );
            const hasSvgArrow = b.querySelector("svg") && b.innerHTML.includes("M");
            return hasArrow || hasSvgArrow;
          });
        }
        
        // ลำดับที่ 3: ค้นหาปุ่มสีหลัก (ปุ่มที่เด่นที่สุด - primary button)
        if (!btn) {
          btn = buttons.find(b => {
            const style = window.getComputedStyle(b);
            const bgColor = style.backgroundColor;
            const isColorful = bgColor && !bgColor.includes("transparent") && !bgColor.includes("rgba(0") && bgColor !== "rgb(0, 0, 0)";
            return isColorful && b.getBoundingClientRect().width > 40;
          });
        }
        
        // ลำดับที่ 4: ค้นหาปุ่ม button[type="submit"] หรือ disabled false และ visible
        if (!btn) {
          btn = buttons.find(b => {
            const isSubmitType = b.getAttribute("type") === "submit" || b.getAttribute("type") === "button";
            const isVisible = b.offsetHeight > 20 && b.offsetWidth > 20;
            const isNotDisabled = !b.disabled && !b.getAttribute("disabled");
            return isSubmitType && isVisible && isNotDisabled;
          });
        }
        
        // ลำดับที่ 5: ค้นหาปุ่มสุดท้ายที่มี icon หรือ visible ที่สุด
        if (!btn) {
          btn = buttons
            .filter(b => b.offsetHeight > 20 && b.offsetWidth > 20 && !b.disabled)
            .sort((a, b) => b.offsetWidth * b.offsetHeight - a.offsetWidth * a.offsetHeight)[0];
        }
        
        return btn;
      };

      const generateBtn = getGenerateBtn();
      
      const mediaType = phase === "image" ? "img" : "video";
      const getMediaSrcs = () => Array.from(document.querySelectorAll(mediaType))
          .map(el => el.src || el.querySelector("source")?.src)
          .filter(src => src && !src.startsWith("data:image/svg"));
      
      const initialSrcs = getMediaSrcs();

      if (generateBtn) {
        helper.textContent = "⏳ Generating... (Waiting up to 2 mins)";
        console.log("[AutoFlow] Generate button found. Clicking...", generateBtn);
        generateBtn.click();
      } else if (field) {
        // Fallback: กด Enter บนช่องฟอร์ม
        helper.textContent = "⏳ Pressing Enter... (Waiting up to 2 mins)";
        console.log("[AutoFlow] Generate button not found. Trying Enter key on field...", field);
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      } else {
        // Debug: ให้ข้อมูลมากขึ้นเพื่อช่วยแก้ไข
        const allButtons = Array.from(document.querySelectorAll("button, [role='button']"));
        const buttonTexts = allButtons.map(b => ({
          text: (b.textContent || "").substring(0, 50),
          hasIcon: !!b.querySelector("i") || !!b.querySelector("svg"),
          visible: b.offsetHeight > 0 && b.offsetWidth > 0
        }));
        console.error("[AutoFlow] Debug - Buttons on page:", buttonTexts);
        throw new Error("หาปุ่ม Generate ไม่พบ");
      }

      await sleep(3000); // รอให้ระบบเริ่ม generate

      // 4. Wait for output
      const resultUrl = await new Promise((res, rej) => {
        const start = Date.now();
        const timer = setInterval(() => {
          const currentSrcs = getMediaSrcs();
          const newSrc = currentSrcs.find(src => !initialSrcs.includes(src));
          
          const btn = getGenerateBtn();
          const hasSpinner = document.querySelector("[role='progressbar'], .animate-spin, svg use[href*='spinner']");
          const isGenerating = hasSpinner || (btn && (btn.disabled || (btn.textContent || "").toLowerCase().includes("stop") || (btn.textContent || "").toLowerCase().includes("cancel")));

          // ถ้ามี newSrc และสถานะไม่ได้กำลัง generate (หรือเวลาผ่านไปนานกว่า 10 วิแล้วมี newSrc) 
          // บางครั้ง UI ของ Google อาจจะไม่โชว์ spinner ชัดเจน
          const timeElapsed = Date.now() - start;
          if (newSrc && (!isGenerating || timeElapsed > 15000)) {
            clearInterval(timer);
            res(newSrc);
          } else if (timeElapsed > 120000) {
            clearInterval(timer);
            if (newSrc) res(newSrc); // fallback คืนค่าเท่าที่มี
            else rej(new Error("Timeout รอโหลด Media"));
          }
        }, 1000);
      });
      
      helper.textContent = "✅ Success!";
      await sleep(1000);
      helper.remove();
      
      resolve({ ok: true, resultUrl });
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

/**
 * @description รอ tab โหลดเสร็จ
 * @param {number} tabId - tab id
 * @returns {Promise<void>}
 */
function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const timeout = setTimeout(cleanup, 15000);
    function cleanup() {
      clearTimeout(timeout);
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    function listener(updatedTabId, changeInfo) {
      if (updatedTabId === tabId && changeInfo.status === "complete") cleanup();
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

/**
 * @description ดาวน์โหลดไฟล์วิดีโอ
 * @param {object} payload - url, filename
 * @returns {Promise<object>} download id
 */
async function downloadVideo(payload) {
  if (!chrome.downloads?.download) {
    const tab = await chrome.tabs.create({ url: payload.url, active: true });
    return { tabId: tab.id, fallback: "opened-tab" };
  }

  const id = await chrome.downloads.download({
    url: payload.url,
    filename: payload.filename,
    saveAs: true
  });
  return { downloadId: id };
}

/**
 * @description placeholder สำหรับ TikTok Content Posting API
 * @param {object} payload - video/caption/product data
 * @returns {Promise<object>} result
 */
async function postToTikTok(payload) {
  const { tiktokAuth } = await chrome.storage.sync.get("tiktokAuth");
  if (!tiktokAuth?.accessToken) {
    throw new Error("ยังไม่มี TikTok Access Token สำหรับโพสต์วิดีโอ");
  }
  if (!payload.videoUrl || !/^https:\/\//.test(payload.videoUrl)) {
    throw new Error("กรุณาใส่ URL วิดีโอแบบ HTTPS");
  }

  // TikTok Content Posting + Product Link ต้องใช้ endpoint และ approval ของ app จริง
  // จึงเก็บ payload ไว้ให้ตรวจสอบ และคืนข้อความชัดเจนแทนการยิง endpoint ที่ยังไม่ configure
  await chrome.storage.local.set({ lastTikTokPostPayload: payload });
  throw new Error("ยังไม่ได้ตั้งค่า TikTok Content Posting endpoint จริง โปรดเพิ่ม integration หลังได้ app approval");
}

/**
 * @description แสดง notification ถ้า permission พร้อม
 * @param {string} title - title
 * @param {string} message - message
 */
async function notify(title, message) {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon128.png",
      title,
      message
    });
  } catch {
    // Notification เป็น best-effort เท่านั้น
  }
}
