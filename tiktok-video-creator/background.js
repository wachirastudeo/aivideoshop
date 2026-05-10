import { fetchShowcaseProducts } from "./modules/tiktok-api.js";

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

async function routeMessage(message, sender) {
  switch (message?.type) {
    case "FETCH_PRODUCTS": return fetchShowcaseProducts(message.payload);
    case "OPEN_GOOGLE_FLOW": return openGoogleFlow(message.payload);
    case "DOWNLOAD_VIDEO": return downloadVideo(message.payload);
    case "POST_TO_TIKTOK": return postToTikTok(message.payload);
    default: throw new Error("ไม่รู้จักคำสั่งที่ส่งมา");
  }
}

async function openCreatorTab() {
  const url = chrome.runtime.getURL("sidepanel.html?mode=tab");
  const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL("sidepanel.html*") });
  if (existingTabs[0]?.id) {
    await chrome.tabs.update(existingTabs[0].id, { active: true });
    return { tabId: existingTabs[0].id };
  }
  const tab = await chrome.tabs.create({ url, active: true });
  return { tabId: tab.id };
}

async function openGoogleFlow(payload) {
  let tab;
  const existingTabs = await chrome.tabs.query({ url: "*://labs.google/fx/tools/flow*" });
  if (existingTabs.length > 0) {
    tab = existingTabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.status !== "complete") await waitForTabComplete(tab.id);
  } else {
    tab = await chrome.tabs.create({ url: "https://labs.google/fx/tools/flow", active: true });
    await waitForTabComplete(tab.id);
  }

  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [payload.prompt, payload.phase, payload.imageUrl],
    func: injectPromptIntoFlow
  });

  if (!result?.ok) await notify("TikTok Video Creator", result?.error || "Automation ล้มเหลว");
  else await notify("TikTok Video Creator", "ส่งข้อมูลเข้า Flow สำเร็จ!");
  
  return { tabId: tab.id, ok: result?.ok, error: result?.error, resultUrl: result?.resultUrl };
}

function injectPromptIntoFlow(prompt, phase, imageUrl) {
  return new Promise(async (resolve) => {
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const helper = document.createElement("div");
    helper.style.cssText = "position:fixed;z-index:99999;left:16px;bottom:16px;padding:12px 16px;border-radius:8px;background:#111;color:#fff;border:1px solid #0f0;font:13px system-ui;max-width:320px;";
    helper.textContent = "🤖 Auto Flow กำลังทำงาน...";
    document.body.append(helper);
    const log = (msg) => { helper.textContent = "🤖 " + msg; console.log("[AutoFlow]", msg); };

    try {
      await sleep(2000);

      // --- 1. NEW PROJECT CHECK ---
      if (!window.location.pathname.includes('/project/')) {
          log("หน้า Dashboard: คลิกเปิดโปรเจกต์ใหม่...");
          const addBtn = Array.from(document.querySelectorAll("i")).find(i => i.textContent === "add_2")?.closest("button");
          if (addBtn) { addBtn.click(); await sleep(3000); }
      } else {
          log("อยู่ในหน้า Project แล้ว...");
      }

      // --- 2. DIRECT IMAGE UPLOAD ---
      if (imageUrl) {
        log("กำลังดึงภาพ...");
        try {
            const fileInputs = document.querySelectorAll('input[type="file"]');
            let fileInput = null;
            for (const input of fileInputs) {
              const accept = input.getAttribute("accept") || "";
              if (accept.includes("image") || accept === "" || accept.includes("*")) {
                fileInput = input;
                break;
              }
            }
            
            if (fileInput) {
                const res = await fetch(imageUrl);
                const blob = await res.blob();
                const file = new File([blob], "image.png", { type: blob.type });

                const dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                
                // Trigger events to notify React
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                fileInput.dispatchEvent(new Event('input', { bubbles: true }));
                log("ยัดไฟล์ลง input สำเร็จ!");
                await sleep(2500); // Wait for upload
            } else {
                throw new Error("หา input[type='file'] ไม่เจอใน DOM");
            }
        } catch (err) {
            log("❌ อัปโหลดภาพไม่สำเร็จ: " + err.message);
        }
      }

      // --- 3. INJECT PROMPT ---
      log("กำลังพิมพ์ Prompt...");
      
      // Method 1: Use Google Flow's specific textarea ID
      let editor = document.querySelector('#PINHOLE_TEXT_AREA_ELEMENT_ID');
      
      // Method 2: Fallback to any visible textarea
      if (!editor) {
          editor = document.querySelector('textarea:not([disabled])');
      }

      if (editor) {
        editor.focus();
        await sleep(100);
        
        // Native setter method for React textareas
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeInputValueSetter.call(editor, prompt);
        
        editor.dispatchEvent(new Event('input', { bubbles: true }));
        editor.dispatchEvent(new Event('change', { bubbles: true }));
        
        await sleep(1500);
      } else {
        throw new Error("หาช่องพิมพ์ไม่เจอ");
      }

      // --- 4. CLICK CREATE/GENERATE ---
      log("ค้นหาปุ่ม Create...");
      const allButtons = Array.from(document.querySelectorAll('button:not([disabled])'));
      let generateBtn = null;
      
      for (const btn of allButtons) {
        const innerHTML = btn.innerHTML || "";
        const text = (btn.textContent || "").toLowerCase();

        // The button has an <i> with arrow_forward and a <span> with "Create"
        if (innerHTML.includes("arrow_forward") && text.includes("create")) {
          generateBtn = btn;
          break;
        }
      }
      
      if (generateBtn) {
          log("กด Create แล้ว! กำลังรอผลลัพธ์...");
          generateBtn.click();
      } else {
          throw new Error("หาปุ่ม Create ไม่เจอ (อาจจะรอข้อมูล)");
      }

      // --- 5. WAIT FOR RESULT ---
      await sleep(20000); // Wait for generation
      log("✅ ทำงานเสร็จสิ้น");
      helper.remove();
      resolve({ ok: true });

    } catch (e) {
      log("❌ ผิดพลาด: " + e.message);
      await sleep(5000);
      helper.remove();
      resolve({ ok: false, error: e.message });
    }
  });
}

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

async function downloadVideo(payload) {
  const id = await chrome.downloads.download({ url: payload.url, filename: payload.filename, saveAs: true });
  return { downloadId: id };
}

async function postToTikTok(payload) {
  const { tiktokAuth } = await chrome.storage.sync.get("tiktokAuth");
  if (!tiktokAuth?.accessToken) throw new Error("ยังไม่มี Access Token");
  await chrome.storage.local.set({ lastTikTokPostPayload: payload });
  throw new Error("ยังไม่ได้ตั้งค่า endpoint สำหรับโพสต์จริง");
}

async function notify(title, message) {
  try { await chrome.notifications.create({ type: "basic", iconUrl: "assets/icon128.png", title, message }); } catch {}
}
