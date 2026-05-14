/**
 * flow-automation.js
 * Pipeline ลำดับตาม autogenx:
 * 1. ensureProjectPage
 * 2. switchToUploadedTab
 * 3. uploadImages  ← รอ data-tile-id ใหม่
 * 4. ensureConfig  ← mode / 9:16 / model
 * 5. attachUploadsToPrompt ← right-click → "Add to prompt"
 * 6. setPrompt     ← ClipboardEvent paste → char-by-char fallback
 * 7. clickGenerate ← arrow_forward icon
 * 8. waitForResult ← รอ data-tile-id ใหม่
 */

const POLL = 500;
const MAX_WAIT = 30000;
const FLOW_HOME = "https://labs.google/fx/tools/flow";

const PROMPT_SELECTORS = [
    '[data-slate-editor="true"]',
    '.public-DraftEditor-content[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[placeholder*="Describe"]',
    'textarea[placeholder*="create"]',
    'textarea[placeholder*="Create"]',
];

let stopRequested = false;
let preGenTileIds = new Set();

// ── Overlay ──────────────────────────────────────────────────
let _overlay = null;
function log(msg) {
    if (!_overlay) {
        _overlay = document.createElement("div");
        _overlay.style.cssText = "position:fixed;z-index:2147483647;left:16px;bottom:16px;" +
            "padding:12px 16px;border-radius:10px;background:#111;color:#fff;" +
            "border:1px solid #0f0;font:13px system-ui;max-width:360px;" +
            "box-shadow:0 4px 16px rgba(0,0,0,.6);pointer-events:none";
        document.body.appendChild(_overlay);
    }
    _overlay.textContent = "🤖 " + msg;
    console.log("[FlowAuto]", msg);
}
function removeOverlay() { _overlay?.remove(); _overlay = null; }

// ── Timing ───────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
function jitter(min, max) { return sleep(min + Math.random() * (max - min)); }
async function sleepStop(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (stopRequested) return;
        await sleep(Math.min(200, end - Date.now()));
    }
}

// ── Human click (autogenx) ───────────────────────────────────
function fireAt(el, cx, cy) {
    const sx = cx + window.screenX, sy = cy + window.screenY;
    const b = () => ({
        bubbles: true, cancelable: true, clientX: cx, clientY: cy,
        screenX: sx, screenY: sy, button: 0, buttons: 0,
        movementX: Math.floor(Math.random() * 5) - 2, movementY: Math.floor(Math.random() * 5) - 2, view: window
    });
    const p = () => ({ ...b(), pointerId: 1, pointerType: "mouse", isPrimary: true, pressure: 0, width: 1, height: 1 });
    el.dispatchEvent(new PointerEvent("pointerover", p()));
    el.dispatchEvent(new MouseEvent("mouseover", b()));
    el.dispatchEvent(new PointerEvent("pointermove", p()));
    el.dispatchEvent(new MouseEvent("mousemove", b()));
    el.dispatchEvent(new PointerEvent("pointerdown", { ...p(), pressure: .5, buttons: 1 }));
    el.dispatchEvent(new MouseEvent("mousedown", { ...b(), buttons: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup", p()));
    el.dispatchEvent(new MouseEvent("mouseup", b()));
    el.dispatchEvent(new MouseEvent("click", b()));
}
function click(el) {
    const r = el.getBoundingClientRect();
    const px = r.width * .2, py = r.height * .2;
    fireAt(el, r.left + px + Math.random() * (r.width - px * 2), r.top + py + Math.random() * (r.height - py * 2));
}
async function trail(tx, ty) {
    const sx = tx + (Math.random() - .5) * 100, sy = ty + (Math.random() - .5) * 70;
    const n = 3 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= n; i++) {
        const t = i / n, x = sx + (tx - sx) * t + (Math.random() - .5) * 3, y = sy + (ty - sy) * t + (Math.random() - .5) * 3;
        const o = {
            bubbles: true, clientX: x, clientY: y, screenX: x + window.screenX, screenY: y + window.screenY,
            pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0, pressure: 0, view: window
        };
        document.dispatchEvent(new PointerEvent("pointermove", o));
        document.dispatchEvent(new MouseEvent("mousemove", { ...o, movementX: 2, movementY: 1 }));
        await sleep(15 + Math.random() * 25);
    }
}
async function humanClick(el) {
    await jitter(800, 2000);
    const r = el.getBoundingClientRect();
    const px = r.width * .2, py = r.height * .2;
    const cx = r.left + px + Math.random() * (r.width - px * 2), cy = r.top + py + Math.random() * (r.height - py * 2);
    await trail(cx, cy);
    fireAt(el, cx, cy);
}

// ── Right-click ──────────────────────────────────────────────
function fireRightAt(el, cx, cy) {
    const sx = cx + window.screenX, sy = cy + window.screenY;
    const b = () => ({
        bubbles: true, cancelable: true, clientX: cx, clientY: cy,
        screenX: sx, screenY: sy, button: 2, buttons: 2,
        movementX: Math.floor(Math.random() * 5) - 2, movementY: Math.floor(Math.random() * 5) - 2, view: window
    });
    const p = () => ({ ...b(), pointerId: 1, pointerType: "mouse", isPrimary: true, pressure: 0, width: 1, height: 1 });
    el.dispatchEvent(new PointerEvent("pointerover", p()));
    el.dispatchEvent(new MouseEvent("mouseover", b()));
    el.dispatchEvent(new PointerEvent("pointermove", p()));
    el.dispatchEvent(new MouseEvent("mousemove", b()));
    el.dispatchEvent(new PointerEvent("pointerdown", { ...p(), pressure: .5, buttons: 2 }));
    el.dispatchEvent(new MouseEvent("mousedown", { ...b(), buttons: 2 }));
    el.dispatchEvent(new PointerEvent("pointerup", p()));
    el.dispatchEvent(new MouseEvent("mouseup", b()));
    el.dispatchEvent(new MouseEvent("contextmenu", b()));
}
async function rightClick(el) {
    await jitter(800, 2000);
    const r = el.getBoundingClientRect();
    const px = r.width * .2, py = r.height * .2;
    const cx = r.left + px + Math.random() * (r.width - px * 2), cy = r.top + py + Math.random() * (r.height - py * 2);
    await trail(cx, cy);
    fireRightAt(el, cx, cy);
}

// ── DOM helpers ──────────────────────────────────────────────
function byText(labels) {
    const list = Array.isArray(labels) ? labels : [labels];
    for (const el of document.querySelectorAll("button,[role='button'],a,div[tabindex]")) {
        const t = (el.textContent || "").trim();
        if (list.some(l => t.includes(l))) return el;
    }
    return null;
}
function byIcon(name) {
    for (const btn of document.querySelectorAll("button")) {
        const i = btn.querySelector("i");
        if (i?.textContent?.trim() === name) return btn;
    }
    return null;
}
async function waitFor(selectors, label, ms = MAX_WAIT) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el && el.offsetParent !== null) return el;
        }
        await sleep(POLL);
    }
    for (const s of selectors) { const el = document.querySelector(s); if (el) return el; }
    console.warn("[FlowAuto] timeout:", label);
    return null;
}
function waitEl(sel, ms = MAX_WAIT) {
    return new Promise(res => {
        const el = document.querySelector(sel);
        if (el) return res(el);
        const end = Date.now() + ms;
        const iv = setInterval(() => {
            const f = document.querySelector(sel);
            if (f) { clearInterval(iv); res(f); }
            else if (Date.now() > end) { clearInterval(iv); res(null); }
        }, POLL);
    });
}
function isProjectUrl(href) { return /\/fx(?:\/[a-z]{2})?\/tools\/flow\/project/i.test(href); }
function isHomeUrl(href) { return /\/fx(?:\/[a-z]{2})?\/tools\/flow\/?$/i.test(href); }
function waitProjectUrl(ms = MAX_WAIT) {
    return new Promise(res => {
        if (isProjectUrl(location.href)) return res(true);
        const end = Date.now() + ms;
        const iv = setInterval(() => {
            if (isProjectUrl(location.href)) { clearInterval(iv); res(true); }
            else if (Date.now() > end) { clearInterval(iv); res(false); }
        }, POLL);
    });
}

// ── Tile snapshot ────────────────────────────────────────────
function snapTiles() {
    const s = new Set();
    document.querySelectorAll("[data-tile-id]").forEach(el => {
        const id = el.getAttribute("data-tile-id");
        if (id) s.add(id);
    });
    return s;
}

// ── File input patch (autogenx) ──────────────────────────────
function patchFileInput() {
    const D = 3000;
    new MutationObserver(muts => {
        for (const m of muts) for (const n of m.addedNodes) {
            if (!(n instanceof HTMLInputElement) || n.type !== "file") continue;
            const orig = n.remove.bind(n); n.remove = () => setTimeout(orig, D);
            const p = n.parentNode;
            if (p) {
                const oc = p.removeChild.bind(p); p.removeChild = c => {
                    if (c === n) { setTimeout(() => oc(c), D); return c; } return oc(c);
                };
            }
        }
    }).observe(document.body, { childList: true, subtree: true });
}

// ── dataUrl → Blob ───────────────────────────────────────────
function toBlob(dataUrl) {
    const c = dataUrl.indexOf(","); if (c < 0) throw new Error("bad dataUrl");
    let b64 = dataUrl.slice(c + 1).replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - b64.length % 4) % 4; if (pad) b64 += "=".repeat(pad);
    const mime = (dataUrl.slice(0, c).match(/:(.*?);/) || [])[1] || "image/png";
    const raw = atob(b64), buf = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
    return new Blob([buf], { type: mime });
}

// ── Notice dialog ────────────────────────────────────────────
function dismissIAgree() {
    for (const d of document.querySelectorAll('[role="dialog"][data-state="open"]'))
        for (const b of d.querySelectorAll("button"))
            if ((b.textContent || "").trim().toLowerCase() === "i agree") { click(b); return true; }
    return false;
}
function watchNotice() {
    dismissIAgree();
    new MutationObserver(() => dismissIAgree()).observe(document.body, { childList: true, subtree: true });
}

// ── 1. ensureProjectPage ─────────────────────────────────────
async function ensureProjectPage() {
    if (isProjectUrl(location.href)) return true;
    if (isHomeUrl(location.href)) {
        const cwf = byText(["Create with Flow"]);
        if (cwf) {
            log('กด "Create with Flow"...');
            click(cwf); await sleep(2000);
            if (location.hostname.includes("accounts.google")) { log("❌ ยังไม่ได้ login Google"); return false; }
            await sleep(1000);
        }
        log('กด "New project"...');
        for (let i = 0; i < 20; i++) {
            const btn = byText(["New project", "โปรเจ็กต์ใหม่"]);
            if (btn) { click(btn); break; }
            await sleep(POLL);
        }
        return waitProjectUrl(MAX_WAIT);
    }
    if (location.hostname.includes("accounts.google")) { log("❌ ยังไม่ได้ login Google"); return false; }
    log("navigate ไป Flow..."); location.href = FLOW_HOME; return false;
}

// ── 2. switchToUploadedTab ───────────────────────────────────
async function switchToUploadedTab() {
    const btn = byIcon("drive_folder_upload");
    if (btn) { await humanClick(btn); log("✅ สลับไป Uploaded tab"); await sleep(1000); }
}

// ── 3. uploadImages ──────────────────────────────────────────
async function uploadImages(dataUrls, waitMs = 8000) {
    patchFileInput();
    const tiles = [];
    for (let i = 0; i < dataUrls.length; i++) {
        log(`อัปโหลดรูป ${i + 1}/${dataUrls.length}...`);
        const before = snapTiles();

        let inp = document.querySelector('input[type="file"][accept*="image"]')
            || document.querySelector('input[type="file"]');
        if (!inp) {
            const addBtn = byText(["Add Media", "เพิ่มสื่อ", "Upload image", "อัปโหลดรูปภาพ"]);
            if (addBtn) { click(addBtn); await sleep(1500); }
            inp = document.querySelector('input[type="file"]');
        }
        if (!inp) throw new Error("หา file input ไม่เจอ");

        const blob = dataUrls[i].startsWith("data:") ? toBlob(dataUrls[i])
            : await fetch(dataUrls[i]).then(r => r.blob());
        const file = new File([blob], `product-${Date.now()}.png`, { type: blob.type || "image/png" });
        const dt = new DataTransfer(); dt.items.add(file);
        inp.files = dt.files;
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        inp.dispatchEvent(new Event("input", { bubbles: true }));

        // รอ tile ใหม่ปรากฏ (autogenx captureNewUploadedTile)
        const secs = Math.max(1, Math.ceil(waitMs / 1000));
        let tileId = null, tileUrl = null;
        for (let s = secs; s > 0; s--) {
            if (stopRequested) return tiles;
            log(`รออัปโหลด ${i + 1}/${dataUrls.length}... ${s}s`);
            await sleep(1000);
            for (const el of document.querySelectorAll("[data-tile-id]")) {
                const id = el.getAttribute("data-tile-id");
                if (id && !before.has(id)) {
                    tileId = id;
                    const img = el.querySelector("img");
                    if (img?.src && /^(https?:|blob:)/.test(img.src)) tileUrl = img.src;
                    break;
                }
            }
            if (tileId) break;
        }
        tiles.push({ tileId, url: tileUrl });
        log(`✅ อัปโหลดรูป ${i + 1} สำเร็จ (tile=${tileId?.slice(0, 12) || "?"})`);
    }
    return tiles;
}

// ── 4. ensureConfig ──────────────────────────────────────────
async function clickMenuTab(key) {
    for (const tab of document.querySelectorAll('[role="tab"]')) {
        if ((tab.id || "").endsWith("-trigger-" + key)) {
            if (tab.getAttribute("aria-selected") === "true") return true;
            await humanClick(tab); return true;
        }
    }
    return false;
}
async function ensureConfig(phase) {
    log(`ตั้งค่า ${phase === "image" ? "Image" : "Video"} + 9:16...`);
    let cfgBtn = null;
    for (const btn of document.querySelectorAll('button[aria-haspopup="menu"]')) {
        const i = btn.querySelector("i.google-symbols,i.material-icons");
        if (i?.textContent?.startsWith("crop_")) { cfgBtn = btn; break; }
    }
    if (!cfgBtn) { log("⚠️ หาปุ่ม config ไม่เจอ"); return; }
    await humanClick(cfgBtn); await sleep(500);
    const menu = await waitEl('[role="menu"][data-state="open"]', 3000);
    if (!menu) { log("⚠️ เมนู config ไม่เปิด"); return; }
    await clickMenuTab(phase === "image" ? "IMAGE" : "VIDEO"); await sleep(800);
    await clickMenuTab("PORTRAIT"); await sleep(800);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(400);
    if (document.querySelector('[role="menu"][data-state="open"]')) { document.body.click(); await sleep(300); }
    log("✅ ตั้งค่า mode + 9:16 สำเร็จ");
}

// ── 5. attachUploadsToPrompt ─────────────────────────────────
async function attachUploadsToPrompt(tiles, tabIcon = "drive_folder_upload") {
    if (!tiles || tiles.length === 0) return;
    log("แนบรูปเข้า prompt...");
    // สลับไป tab ที่ถูกต้อง (Uploaded หรือ Images)
    const tabBtn = byIcon(tabIcon);
    if (tabBtn) { await humanClick(tabBtn); await sleep(1000); }

    const done = new Set();
    for (const tile of tiles) {
        if (!tile.tileId) continue;
        const el = document.querySelector(`[data-tile-id="${CSS.escape(tile.tileId)}"]`);
        if (!el) { log(`⚠️ tile ${tile.tileId.slice(0, 12)} ไม่เจอใน DOM`); continue; }
        el.scrollIntoView({ block: "center", behavior: "instant" });
        await sleep(400);
        const img = el.querySelector("img");
        if (!img) continue;
        // right-click → "Add to prompt"
        const menuOpen = document.querySelector('[role="menu"][data-state="open"]');
        if (menuOpen) { document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await sleep(300); }
        await rightClick(img);
        const ctxMenu = await waitEl('[role="menu"][data-state="open"]', 2000);
        if (!ctxMenu) { log("⚠️ context menu ไม่เปิด"); continue; }
        let menuItem = null;
        for (const item of ctxMenu.querySelectorAll('[role="menuitem"]')) {
            const t = (item.textContent || "").toLowerCase();
            if (t.includes("add to prompt") || t.includes("เพิ่มไปยังพรอมต์")) { menuItem = item; break; }
        }
        if (!menuItem) {
            document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            log("⚠️ ไม่เจอ 'Add to prompt' ใน menu"); continue;
        }
        await humanClick(menuItem);
        log(`✅ แนบรูป tile ${tile.tileId.slice(0, 12)} สำเร็จ`);
        done.add(tile.tileId);
        await jitter(800, 1500);
        if (document.querySelector('[role="menu"][data-state="open"]')) {
            document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            await sleep(200);
        }
    }
}

// ── 6. setPrompt (paste → char-by-char fallback) ─────────────
async function setPrompt(prompt) {
    const editor = await waitFor(PROMPT_SELECTORS, "promptInput", 15000);
    if (!editor) throw new Error("หาช่องพิมพ์ prompt ไม่เจอ");
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(500);
    await humanClick(editor);
    await sleep(400);

    if (editor.matches('[data-slate-editor="true"]')) {
        await typeSlate(editor, prompt); return;
    }
    if (editor.matches(".public-DraftEditor-content")) {
        await typeDraft(editor, prompt); return;
    }
    if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        editor.focus();
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        if (setter) setter.call(editor, prompt); else editor.value = prompt;
        editor.dispatchEvent(new Event("input", { bubbles: true }));
        editor.dispatchEvent(new Event("change", { bubbles: true }));
        return;
    }
    editor.focus();
    editor.textContent = prompt;
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
}

async function typeSlate(editor, prompt) {
    editor.focus(); await sleep(100);
    const sel = window.getSelection(), r = document.createRange();
    r.selectNodeContents(editor); sel?.removeAllRanges(); sel?.addRange(r); await sleep(50);
    if (editor.textContent?.trim().length > 0) {
        editor.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: "deleteContentBackward" }));
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: "deleteContentBackward" }));
        await sleep(100);
    }
    // Primary: ClipboardEvent paste
    try {
        const dt = new DataTransfer(); dt.setData("text/plain", prompt);
        editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        await sleep(400);
        const got = (editor.textContent || "").trim();
        const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(30, prompt.length));
        if (got.replace(/\s+/g, "").includes(needle)) {
            log("✅ กรอก Prompt สำเร็จ (paste)");
            await sleepStop(2000); return;
        }
    } catch (e) { console.warn("[FlowAuto] paste failed:", e); }
    // Fallback: char-by-char
    editor.focus(); await sleep(50);
    for (const ch of prompt) {
        if (stopRequested) return;
        const type = ch === "\n" ? "insertLineBreak" : "insertText";
        editor.dispatchEvent(new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType: type, data: ch === "\n" ? null : ch }));
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true, inputType: type, data: ch === "\n" ? null : ch }));
        await sleep(12);
    }
    log("✅ กรอก Prompt สำเร็จ (char-by-char)");
    await sleepStop(3000);
}

async function typeDraft(editor, prompt) {
    editor.focus(); await sleep(100);
    document.execCommand("selectAll", false, null);
    document.execCommand("delete", false, null);
    await sleep(50);
    for (const ch of prompt) { document.execCommand("insertText", false, ch); await sleep(10); }
    await sleepStop(3000);
}

// ── 7. clickGenerate ─────────────────────────────────────────
async function clickGenerate() {
    log("หาปุ่ม Generate...");
    preGenTileIds = snapTiles();
    const end = Date.now() + 8000;
    let btn = null;
    while (Date.now() < end) {
        if (stopRequested) return false;
        for (const b of document.querySelectorAll("button")) {
            if (b.disabled || b.getAttribute("aria-disabled") === "true") continue;
            const i = b.querySelector("i");
            if (i?.textContent?.trim() === "arrow_forward") { btn = b; break; }
        }
        if (btn) break;
        await sleep(300);
    }
    if (!btn) {
        const fb = byText(["Generate", "Create", "สร้าง"]);
        if (fb && !fb.disabled) btn = fb;
    }
    if (!btn) throw new Error("หาปุ่ม Generate ไม่เจอ");
    log("🚀 กด Generate!");
    btn.scrollIntoView({ block: "center", inline: "center" });
    await sleep(400);
    await humanClick(btn);
    return true;
}

// ── 8. waitForResult ─────────────────────────────────────────
async function waitForResult(phase) {
    const maxMs = phase === "image" ? 60000 : 120000;
    const end = Date.now() + maxMs;
    log("รอผลลัพธ์จาก Flow...");
    while (Date.now() < end) {
        if (stopRequested) return { tileId: null, mediaUrl: "" };
        for (const el of document.querySelectorAll("[data-tile-id]")) {
            const id = el.getAttribute("data-tile-id");
            if (!id || preGenTileIds.has(id)) continue;
            const vid = el.querySelector("video"), img = el.querySelector("img");
            const mediaUrl = vid?.src || img?.src || "";
            log("✅ พบผลลัพธ์แล้ว!");
            return { tileId: id, mediaUrl };
        }
        const rem = Math.round((end - Date.now()) / 1000);
        log(`รอผลลัพธ์... (~${rem}s)`);
        await sleep(1000);
    }
    return { tileId: null, mediaUrl: "" };
}

// ── Load settings ────────────────────────────────────────────
async function loadSettings() {
    try {
        const r = await chrome.runtime.sendMessage({ type: "GET_FLOW_SETTINGS" });
        if (r && !r.error) return r;
    } catch { }
    return { videoModel: "veo-3.1-fast", imageModel: "nano-banana-pro", autoPortrait: true, uploadWaitSec: 8 };
}

// ── Main pipeline ─────────────────────────────────────────────
async function runPipeline(payload) {
    const { phase, prompt, imageUrl } = payload;
    stopRequested = false;
    try {
        log("เริ่ม Auto Flow...");
        watchNotice();
        const cfg = await loadSettings();

        // 1. ไปหน้า project
        const ok = await ensureProjectPage();
        if (!ok) throw new Error("ไม่สามารถเปิดหน้า project ได้ (ตรวจสอบว่า login Google แล้ว)");
        await sleep(1500);
        dismissIAgree();

        // 2. สลับไป Uploaded tab
        await switchToUploadedTab();

        // 3. อัปโหลดรูป
        let uploadedTiles = [];
        if (imageUrl) {
            const dataUrls = imageUrl.startsWith("data:") || imageUrl.startsWith("http")
                ? [imageUrl] : [];
            if (dataUrls.length > 0) {
                uploadedTiles = await uploadImages(dataUrls, cfg.uploadWaitSec * 1000);
            }
        }

        // 4. ตั้งค่า mode + ratio (สำหรับภาพ)
        if (cfg.autoPortrait) await ensureConfig(phase === "combined" ? "image" : phase);

        // 5. แนบรูปเข้า prompt (หน้า Uploaded)
        if (uploadedTiles.length > 0) await attachUploadsToPrompt(uploadedTiles, "drive_folder_upload");

        // 6. กรอก prompt
        log("กรอก Prompt...");
        const initialPrompt = typeof prompt === "object" ? prompt.imagePrompt : prompt;
        await setPrompt(initialPrompt);

        // 7. กด Generate
        await clickGenerate();

        // 8. รอผลลัพธ์
        const result = await waitForResult(phase === "combined" ? "image" : phase);

        if (phase === "combined" && result.tileId) {
            log("🎯 ได้รูปภาพแล้ว! กำลังนำรูปไปสร้างวิดีโอต่อทันที...");
            await sleep(2000); // รอให้ระบบบันทึกรูปสักพัก

            // 4b. เปลี่ยน config เป็น VIDEO mode + portrait
            if (cfg.autoPortrait) await ensureConfig("video");

            // 5b. แนบรูปที่เพิ่งสร้างเสร็จเข้า prompt ใหม่! (หน้า Images)
            await attachUploadsToPrompt([{ tileId: result.tileId }], "image");

            // 6b. กรอก prompt สำหรับวิดีโอ
            log("กรอก Prompt วิดีโอ...");
            await setPrompt(prompt.videoPrompt);

            // 7b. กด Generate
            await clickGenerate();

            // 8b. รอผลลัพธ์วิดีโอ
            const vidResult = await waitForResult("video");

            await sleep(1500);
            removeOverlay();
            return { ok: true, resultUrl: vidResult.mediaUrl, tileId: vidResult.tileId, imgUrl: result.mediaUrl };
        }

        await sleep(1500);
        removeOverlay();
        return { ok: true, resultUrl: result.mediaUrl, tileId: result.tileId };

    } catch (err) {
        log("❌ " + err.message);
        await sleep(5000);
        removeOverlay();
        return { ok: false, error: err.message };
    }
}

// ── Message listener ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "FLOW_PING") { reply({ pong: true }); return false; }
    if (msg?.type === "FLOW_STOP") { stopRequested = true; reply({ ok: true }); return false; }
    if (msg?.type === "FLOW_RUN_PIPELINE") { runPipeline(msg.payload).then(reply); return true; }
    return false;
});

chrome.runtime.sendMessage({ type: "FLOW_CONTENT_READY" }).catch(() => { });
console.log("[FlowAuto] loaded on", location.href);
