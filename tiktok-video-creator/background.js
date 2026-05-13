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
  // Abort mechanism: set window.__autoFlowAbort = true to stop
  window.__autoFlowAbort = false;
  return new Promise(async (resolve) => {
    const sleep = (ms) => new Promise((r, rej) => {
      const t = setTimeout(r, ms);
      const check = setInterval(() => {
        if (window.__autoFlowAbort) { clearTimeout(t); clearInterval(check); rej(new Error("ABORTED")); }
      }, 200);
      setTimeout(() => clearInterval(check), ms + 500);
    });
    const helper = document.createElement("div");
    helper.style.cssText = "position:fixed;z-index:99999;left:16px;bottom:16px;padding:12px 16px;border-radius:8px;background:#111;color:#fff;border:1px solid #0f0;font:13px system-ui;max-width:320px;box-shadow: 0 4px 12px rgba(0,0,0,0.5);";
    helper.textContent = "🤖 Auto Flow กำลังทำงาน...";
    // ปุ่มหยุด
    const stopBtn = document.createElement("button");
    stopBtn.textContent = "⛔ หยุด";
    stopBtn.style.cssText = "margin-top:8px;display:block;background:#e00;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font:12px system-ui;";
    stopBtn.onclick = () => { window.__autoFlowAbort = true; };
    helper.append(stopBtn);
    document.body.append(helper);
    const log = (msg) => { helper.textContent = "🤖 " + msg; console.log("[AutoFlow]", msg); };

    try {
      await sleep(2000);

      // --- 1. NEW PROJECT CHECK ---
      if (!window.location.pathname.includes('/project/')) {
          log("หน้า Dashboard: คลิกเปิดโปรเจกต์ใหม่...");
          let addBtn = Array.from(document.querySelectorAll("i")).find(i => i.textContent === "add" || i.textContent === "add_2" || i.textContent === "add_circle")?.closest("button");
          if (!addBtn) addBtn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.toLowerCase().includes("new project"));

          if (addBtn) { 
            addBtn.click(); 
            await sleep(4000); 
          } else {
            log("⚠️ หาปุ่ม New Project ไม่เจอ...");
          }
      }

      // --- 2. ASPECT RATIO & MODE SELECTION ---
      log(`ตั้งค่าโหมด ${phase === "image" ? "Image" : "Video"} และ Portrait (9:16)...`);

      // กดปุ่ม 🍌 เพื่อเปิด dropdown
      const menuTrigger = Array.from(document.querySelectorAll('button[aria-haspopup="menu"]')).find(b => {
          const html = b.innerHTML || "";
          return html.includes("crop_") && (html.includes("1x") || html.includes("Banana"));
      });
      if (!menuTrigger) throw new Error("หาปุ่มเปิดเมนู mode/ratio ไม่เจอ");
      menuTrigger.click();
      log("เปิดเมนูตั้งค่าแล้ว รอ...");
      await sleep(1500);

      // หา popper content wrapper ที่เพิ่งเปิด แล้วหา tab ใน popper โดยตรง
      const popper = document.querySelector('[data-radix-popper-content-wrapper]');
      if (!popper) throw new Error("เปิดเมนูแล้วแต่หา popper ไม่เจอ");

      const modeKey = phase === "image" ? "IMAGE" : "VIDEO";
      const modeBtn = popper.querySelector(`button[id*="-trigger-${modeKey}"]`);
      if (!modeBtn) throw new Error(`หาปุ่มโหมด ${phase} ใน popper ไม่เจอ`);
      modeBtn.click();
      log(`✅ เลือกโหมด ${phase} สำเร็จ`);
      await sleep(800);

      const portraitBtn = popper.querySelector('button[id$="-trigger-PORTRAIT"]');
      if (!portraitBtn) throw new Error("หาปุ่ม 9:16 ใน popper ไม่เจอ");
      portraitBtn.click();
      log("✅ เลือกสัดส่วน 9:16 สำเร็จ!");
      await sleep(800);

      // ปิด dropdown โดยกด trigger อีกครั้ง (toggle)
      menuTrigger.click();
      await sleep(500);

      // --- 3. DIRECT IMAGE UPLOAD + SELECT UPLOADED IMAGE ---
      if (imageUrl) {
        log("กำลังอัปโหลดรูปภาพอ้างอิง...");
        // Flow มี input[type="file"] อยู่ในหน้าโดยตรง
        let fileInput = document.querySelector('input[type="file"][accept*="image"]') 
                     || document.querySelector('input[type="file"]');
        if (!fileInput) {
            const addMediaBtn = Array.from(document.querySelectorAll('button')).find(b => 
              (b.getAttribute('aria-label') || "").toLowerCase().includes("add media") ||
              b.textContent.toLowerCase().includes("add media") || 
              (b.innerHTML || "").includes("add_2")
            );
            if (!addMediaBtn) throw new Error("หาปุ่ม Add Media และ file input ไม่เจอ");
            addMediaBtn.click();
            await sleep(1500);
            fileInput = document.querySelector('input[type="file"]');
            if (!fileInput) throw new Error("หา file input ไม่เจอหลังกด Add Media");
        }

        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "image.png", { type: blob.type });
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
        fileInput.dispatchEvent(new Event('input', { bubbles: true }));
        log("อัปโหลดภาพสำเร็จ! รอภาพโหลด...");
        await sleep(5000);

        // --- SELECT THE UPLOADED IMAGE ---
        log("กำลังเลือกภาพที่อัปโหลด...");
        let imageSelected = false;
        for (let attempt = 0; attempt < 10; attempt++) {
            // ภาพที่อัพแล้วอยู่ใน virtuoso list
            // src pattern: /fx/api/trpc/media.getMediaUrlRedirect
            const uploadedImg = Array.from(document.querySelectorAll('img')).find(img =>
                img.src.includes('media.getMediaUrlRedirect') || img.src.includes('trpc/media')
            );

            if (uploadedImg) {
                // คลิก parent container ที่ clickable
                const clickTarget = uploadedImg.closest('[data-index], button, [role="button"], [tabindex]') 
                                 || uploadedImg.parentElement;
                clickTarget.click();
                log("✅ เลือกภาพที่อัปโหลดสำเร็จ!");
                imageSelected = true;
                await sleep(1000);
                break;
            }
            log(`รอภาพปรากฏใน media panel... (${attempt + 1}/10)`);
            await sleep(1500);
        }
        if (!imageSelected) throw new Error("เลือกภาพที่อัปโหลดไม่สำเร็จ ภาพไม่ปรากฏใน panel");
      }

      // --- 4. INJECT PROMPT ---
      log("กำลังค้นหาช่องพิมพ์...");
      
      const textareas = Array.from(document.querySelectorAll('textarea:not([disabled])'));
      let editor = textareas.find(ta => {
          const ph = (ta.placeholder || "").toLowerCase();
          return ph.includes("create") || ph.includes("describe") || ph.includes("prompt");
      }) || textareas[textareas.length - 1] || document.querySelector('div[role="textbox"]') || document.querySelector('[contenteditable="true"]');

      if (editor) {
        log(`พบช่องพิมพ์! กำลังเลื่อนหน้าจอไปหา...`);
        
        // Visual Feedback for User
        editor.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const originalBorder = editor.style.border;
        editor.style.border = "3px solid red";
        editor.style.boxShadow = "0 0 10px red";
        
        await sleep(800);
        editor.click();
        editor.focus();
        await sleep(500);
        
        log("กำลังพิมพ์ Prompt ลงในช่อง...");
        
        const isTextarea = editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT';
        
        if (isTextarea) {
            // Native React setter for textarea
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(editor, prompt);
            } else {
                editor.value = prompt;
            }
            editor.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            // For contenteditable div (Slate.js in Google Flow)
            editor.focus();
            await sleep(300); // Give React time to register focus
            
            // Force select all existing content to clear it properly
            document.execCommand('selectAll', false, null);
            await sleep(100);
            
            // Natively insert text, which triggers `beforeinput` and `input` that Slate listens to
            const success = document.execCommand('insertText', false, prompt);
            
            if (!success) {
                // Extreme fallback: directly modify DOM and dispatch events
                editor.textContent = prompt;
                editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
            }
        }

        // Final event trigger to wake up the Generate button
        ['change', 'keyup', 'blur'].forEach(evt => {
            editor.dispatchEvent(new Event(evt, { bubbles: true }));
        });

        await sleep(1500); // Wait for React to enable the Create button
        editor.style.border = originalBorder; // Reset border
        
        // --- VERIFICATION ---
        const finalVal = (editor.value || editor.innerText || editor.textContent || "").trim();
        if (finalVal.length < 3) {
            throw new Error("⚠️ ไม่สามารถกรอก Prompt ได้ (ช่องพิมพ์ยังว่างอยู่)");
        }
        log("✅ กรอก Prompt สำเร็จ");
      } else { throw new Error("หาช่องพิมพ์ไม่เจอ"); }



      // --- 5. CLICK GENERATE ---
      log("กำลังค้นหาปุ่ม Generate...");
      await sleep(1000); // Wait for button to enable

      let generateBtn = null;
      const findBtn = () => {
          return Array.from(document.querySelectorAll('button')).find(btn => {
            if (btn.disabled) return false;
            
            // Check for the specific Flow button structure (icon + hidden "Create" span)
            const span = btn.querySelector('span');
            if (span && span.textContent.trim().toLowerCase() === "create") return true;
            
            const text = (btn.textContent || "").toLowerCase();
            const aria = (btn.getAttribute('aria-label') || "").toLowerCase();
            return text.includes("generate") || text === "create" || text.includes("arrow_forwardcreate") || aria.includes("generate") || aria.includes("create");
          });
      };

      // Poll for enabled button
      for (let i = 0; i < 10; i++) {
          generateBtn = findBtn();
          if (generateBtn) break;
          log(`รอปุ่ม Generate พร้อมใช้งาน... (${i+1}/10)`);
          await sleep(1000);
      }
      
      if (generateBtn) {
          log("🚀 กดปุ่ม Generate แล้ว!");
          generateBtn.click();
      } else {
          // Final desperate fallback: look for any primary-looking button with an arrow
          generateBtn = Array.from(document.querySelectorAll('button')).find(btn => 
              btn.innerHTML.includes("arrow_forward") && !btn.disabled
          );
          if (generateBtn) {
              log("🚀 กดปุ่ม Create (Fallback) แล้ว!");
              generateBtn.click();
          } else {
              throw new Error("หาปุ่ม Generate ที่กดได้ไม่เจอ (กรุณาเช็คว่า Prompt ถูกต้องและปุ่มไม่จาง)");
          }
      }

      // --- 6. WAIT FOR RESULT & GRAB URL ---
      // We wait for the generation to appear. In Flow, new items usually appear in a grid.
      // We'll poll for a new image or video element.
      let resultUrl = "";
      const startTime = Date.now();
      const maxWait = phase === "image" ? 45000 : 90000; // Images are faster, videos take longer

      while (Date.now() - startTime < maxWait) {
          // Look for images or videos in the workspace/clips area
          // This is a heuristic: the first img/video with a blob or cdn URL that isn't our reference
          const mediaElements = Array.from(document.querySelectorAll('img[src^="http"], img[src^="blob"], video[src^="http"], video[src^="blob"]'));
          
          // Filter out our reference image if we know its URL (might be hard with blobs)
          // Usually, the results are in a specific container or have specific classes
          const possibleResults = mediaElements.filter(el => {
              const src = el.src || "";
              // Avoid the small icons and the reference image (if it's not a blob we sent)
              if (src === imageUrl) return false;
              if (el.offsetWidth < 50 || el.offsetHeight < 50) return false;
              return true;
          });

          if (possibleResults.length > 0) {
              // Found something! Take the newest one (usually first or last depending on UI)
              // Google Flow usually puts new ones at the beginning of the list
              resultUrl = possibleResults[0].src;
              log("✅ พบผลลัพธ์แล้ว!");
              break;
          }
          await sleep(3000);
          log(`รอผลลัพธ์... (${Math.round((Date.now() - startTime)/1000)}s)`);
      }

      await sleep(2000);
      log("✅ ทำงานเสร็จสิ้น");
      helper.remove();
      resolve({ ok: true, resultUrl });

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
