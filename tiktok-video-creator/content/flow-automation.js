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
 * 8. waitForResult ← รอ media card ใหม่
 */

const POLL = 500;
const MAX_WAIT = 30000;
const FLOW_HOME = "https://labs.google/fx/tools/flow";

const PROMPT_SELECTORS = [
    'div[role="textbox"][contenteditable="true"][data-slate-editor="true"]',
    '[data-slate-editor="true"]',
    '.public-DraftEditor-content[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]',
    'div[contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    'textarea[placeholder*="Describe"]',
    'textarea[placeholder*="describe"]',
    'textarea[aria-label*="prompt" i]',
    'textarea[placeholder*="prompt" i]',
    'textarea[placeholder*="create"]',
    'textarea[placeholder*="Create"]',
    'textarea[placeholder*="change"]',
    'textarea[placeholder*="Change"]',
];

let stopRequested = false;
let preGenMediaKeys = new Set();

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
    try { el.click?.(); } catch { }
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
    const list = (Array.isArray(labels) ? labels : [labels]).map(l => String(l).toLowerCase());
    for (const el of document.querySelectorAll("button,[role='button'],a,div[tabindex],[aria-label]")) {
        if (!isVisible(el)) continue;
        const t = [
            el.textContent,
            el.getAttribute("aria-label"),
            el.getAttribute("title")
        ].filter(Boolean).join(" ").trim().toLowerCase();
        if (list.some(l => t.includes(l))) return el;
    }
    return null;
}
function elementText(el) {
    return [
        el.textContent,
        el.getAttribute("aria-label"),
        el.getAttribute("title")
    ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}
function isVisible(el) {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}
function findAction(labels) {
    const needles = labels.map(label => String(label).toLowerCase());
    const candidates = [...document.querySelectorAll("button,[role='button'],a,[tabindex],[aria-label]")]
        .filter(isVisible)
        .map(el => ({ el, text: elementText(el).toLowerCase() }))
        .filter(item => needles.some(needle => item.text.includes(needle)));
    candidates.sort((a, b) => {
        const aButton = /^(BUTTON|A)$/.test(a.el.tagName) || a.el.getAttribute("role") === "button";
        const bButton = /^(BUTTON|A)$/.test(b.el.tagName) || b.el.getAttribute("role") === "button";
        return Number(bButton) - Number(aButton) || a.text.length - b.text.length;
    });
    return candidates[0]?.el || null;
}
function findOpenAgentToggle() {
    for (const button of document.querySelectorAll('button[aria-pressed="true"]')) {
        if (!isVisible(button)) continue;
        const text = elementText(button).toLowerCase();
        const hasAgentContent = [...button.querySelectorAll(".content,span")]
            .some(node => (node.textContent || "").trim().toLowerCase() === "agent");
        if (hasAgentContent || /\bagent\b/.test(text)) return button;
    }
    return null;
}
async function closeOpenAgentToggle() {
    const button = findOpenAgentToggle();
    if (!button) return false;

    log("ปิด Agent ที่เปิดอยู่ก่อนเริ่มงาน...");
    button.scrollIntoView({ block: "center", inline: "center" });
    click(button);

    const end = Date.now() + 5000;
    while (Date.now() < end) {
        await sleep(250);
        if (!findOpenAgentToggle()) {
            log("✅ ปิด Agent แล้ว");
            return true;
        }
    }

    log("⚠️ กดปิด Agent แล้ว แต่สถานะ aria-pressed ยังเป็น true");
    return false;
}
function hasPromptEditor() {
    const el = findPromptEditor();
    return Boolean(el && isVisible(el));
}
function byIcon(name) {
    for (const btn of document.querySelectorAll("button")) {
        const i = btn.querySelector("i,.google-symbols,.material-icons,[class*='icon']");
        if (i?.textContent?.trim() === name) return btn;
        const label = `${btn.getAttribute("aria-label") || ""} ${btn.textContent || ""}`.toLowerCase();
        if (label.includes(name.toLowerCase())) return btn;
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

// ── Media snapshot ───────────────────────────────────────────
function snapMediaKeys() {
    return new Set(getMediaCards().map(card => card.key));
}
function getMediaCards() {
    const cards = [];
    const seen = new Set();
    const candidates = [
        ...document.querySelectorAll("[data-tile-id]"),
        ...document.querySelectorAll('a[href*="/edit/"]'),
        ...document.querySelectorAll("img,video")
    ];

    for (const node of candidates) {
        const card = node.closest("[data-tile-id], [draggable='true'], a[href*='/edit/'], article") || node;
        const tileId = card.getAttribute?.("data-tile-id") || node.closest?.("[data-tile-id]")?.getAttribute("data-tile-id") || "";
        const link = card.matches?.('a[href*="/edit/"]') ? card : card.querySelector?.('a[href*="/edit/"]');
        const href = link?.href || "";
        const mediaUrl = getTileMediaUrl(card) || getTileMediaUrl(node);
        const label = elementText(card).slice(0, 160);
        const key = tileId || href || mediaUrl || label;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        cards.push({ key, tileId, href, mediaUrl, label });
    }

    return cards;
}
function findMediaCard(cardInfo) {
    if (cardInfo.tileId) {
        const matches = [...document.querySelectorAll(`[data-tile-id="${CSS.escape(cardInfo.tileId)}"]`)];
        if (matches.length > 0) {
            return matches.find((el) => !el.parentElement?.closest(`[data-tile-id="${CSS.escape(cardInfo.tileId)}"]`)) || matches[0];
        }
    }
    if (cardInfo.href) {
        const byHref = [...document.querySelectorAll('a[href*="/edit/"]')].find(link => link.href === cardInfo.href);
        if (byHref) return byHref.closest("[data-tile-id], [draggable='true'], article") || byHref;
    }
    if (cardInfo.mediaUrl) {
        const byMedia = [...document.querySelectorAll("img,video")].find(media => (media.currentSrc || media.src) === cardInfo.mediaUrl);
        if (byMedia) return byMedia.closest("[data-tile-id], [draggable='true'], article") || byMedia;
    }
    return null;
}
function mediaCardStatus(cardInfo) {
    const el = findMediaCard(cardInfo);
    if (!el) return { ready: false, failed: false, progress: true, rendered: false, text: "" };
    const text = mediaCardDeepText(el).toLowerCase();
    
    // Check if any progress percentage is still visible (even 100% needs to disappear first)
    const progress = /\b\d{1,3}\s*%/.test(text) || text.includes("uploading") || text.includes("processing");
    
    const failed = !progress && (text.includes("failed") || text.includes("warning") || text.includes("ล้มเหลว"));
    const rendered = hasRenderableMedia(el);
    return { ready: rendered && !progress, failed, progress, rendered, text };
}
function mediaCardDeepText(el) {
    const parts = [elementText(el)];
    const tileId = el.getAttribute?.("data-tile-id") || el.closest?.("[data-tile-id]")?.getAttribute("data-tile-id");
    if (tileId) {
        for (const match of document.querySelectorAll(`[data-tile-id="${CSS.escape(tileId)}"]`)) {
            parts.push(elementText(match));
        }
    }
    
    // Helper to stop going up when we hit list/grid/root or editor elements to prevent text bleed
    const isCardContainer = (node) => {
        if (!node) return false;
        if (node.getAttribute?.("data-tile-id")) return true;
        if (node.getAttribute?.("draggable") === "true") return true;
        if (node.tagName === "ARTICLE") return true;
        
        const role = node.getAttribute?.("role");
        if (role === "grid" || role === "list" || role === "directory") return true;
        
        const cl = node.className || "";
        if (typeof cl === "string" && (cl.includes("grid") || cl.includes("gallery") || cl.includes("list"))) return true;
        
        // Stop if we hit any parent container that has a text box
        if (node.querySelector?.('[role="textbox"]') || node.querySelector?.('.public-DraftEditor-content')) return true;
        
        return false;
    };

    let node = el.parentElement;
    for (let i = 0; i < 6 && node; i++, node = node.parentElement) {
        parts.push(elementText(node));
        if (isCardContainer(node)) break;
        if (/\b\d{1,3}\s*%/.test(parts.join(" "))) break;
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
}
function hasRenderableMedia(el) {
    const img = el.matches?.("img") ? el : el.querySelector?.("img");
    if (img && (img.complete || img.naturalWidth > 0) && (img.naturalWidth || img.clientWidth) > 0) return true;

    const vid = el.matches?.("video") ? el : el.querySelector?.("video");
    if (vid && (vid.readyState >= 2 || vid.currentSrc || vid.src)) return true;

    const bg = [...el.querySelectorAll?.("[style*='background-image']") || []]
        .some(node => /url\(["']?[^"')]+["']?\)/.test(node.style.backgroundImage || ""));
    return bg;
}
function getTileMediaUrl(el) {
    const vid = el.querySelector("video");
    const source = el.querySelector("video source, source");
    const img = el.querySelector("img");
    const inline = [...el.querySelectorAll("[style*='background-image']")]
        .map(node => node.style.backgroundImage)
        .find(Boolean);
    const bg = inline?.match(/url\(["']?([^"')]+)["']?\)/)?.[1] || "";
    return vid?.currentSrc || vid?.src || source?.src || img?.currentSrc || img?.src || bg || "";
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
    await sleep(1000);
    if (location.hostname.includes("accounts.google")) {
        log("❌ Google Flow ต้อง login Google ก่อน");
        return false;
    }

    const createLabels = [
        "Create with Google Flow",
        "Create with Flow",
        "Try in Google Flow",
        "New project",
        "Create project",
        "Start a new project",
        "Create",
        "New",
        "โปรเจ็กต์ใหม่",
        "สร้างโปรเจ็กต์",
        "สร้าง"
    ];

    // Every run must start from a fresh Flow project. If we are already in
    // Flow, avoid reloading the site; use the visible app controls instead.
    if (isProjectUrl(location.href) || hasPromptEditor()) {
        const back = findAction(["Go Back", "arrow_back"]);
        if (back) {
            log("กลับไปหน้า Flow เพื่อกด New project...");
            back.scrollIntoView({ block: "center", inline: "center" });
            click(back);
            await sleep(2000);
        }
    }

    for (let i = 0; i < 24; i++) {
        if (location.hostname.includes("accounts.google")) {
            log("❌ Google Flow ต้อง login Google ก่อน");
            return false;
        }
        const action = findAction(createLabels);
        if (action) {
            log(`กดปุ่ม Flow: ${elementText(action).slice(0, 60) || "Create/New project"}`);
            action.scrollIntoView({ block: "center", inline: "center" });
            click(action);
            await sleep(2500);
            if (isProjectUrl(location.href) || hasPromptEditor()) return true;
            continue;
        }
        await sleep(POLL);
    }

    if (!isHomeUrl(location.href)) {
        log("navigate ไป Flow...");
        location.href = FLOW_HOME;
        return false;
    }

    log("❌ ไม่เจอปุ่ม Create/New project ในหน้า Google Flow");
    return false;
}

// ── 2. switchToUploadedTab ───────────────────────────────────
async function switchToUploadedTab() {
    const btn = byIcon("drive_folder_upload") || byText(["Uploaded", "Uploads", "อัปโหลด"]);
    if (btn) { await humanClick(btn); log("✅ สลับไป Uploaded tab"); await sleep(1000); }
}

// ── 3. uploadImages ──────────────────────────────────────────
async function uploadImages(dataUrls, waitMs = 300000) {
    patchFileInput();
    const tiles = [];
    for (let i = 0; i < dataUrls.length; i++) {
        log(`อัปโหลดรูป ${i + 1}/${dataUrls.length}...`);
        const before = snapMediaKeys();

        let inp = document.querySelector('input[type="file"][accept*="image"]')
            || document.querySelector('input[type="file"]');
        if (!inp) {
            const addBtn = byText(["Add Media", "เพิ่มสื่อ", "Upload image", "Upload", "อัปโหลดรูปภาพ", "Reference"]);
            if (addBtn) { click(addBtn); await sleep(1500); }
            inp = document.querySelector('input[type="file"]');
        }
        if (!inp) throw new Error("หา file input สำหรับอัปโหลดรูปใน Google Flow ไม่เจอ");

        const blob = dataUrls[i].startsWith("data:") ? toBlob(dataUrls[i])
            : await fetch(dataUrls[i]).then(r => r.blob());
        const file = new File([blob], `product-${Date.now()}.png`, { type: blob.type || "image/png" });
        const dt = new DataTransfer(); dt.items.add(file);
        inp.files = dt.files;
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        inp.dispatchEvent(new Event("input", { bubbles: true }));

        // รอ tile ใหม่ปรากฏและ upload เสร็จจริง
        const secs = Math.max(300, Math.ceil(waitMs / 1000));
        let mediaCard = null;
        let lastNewCard = null;
        let lastStatus = null;
        for (let s = secs; s > 0; s--) {
            if (stopRequested) return tiles;
            log(`รออัปโหลดและรอภาพแสดง ${i + 1}/${dataUrls.length}... ${s}s`);
            await sleep(1000);
            for (const card of getMediaCards()) {
                if (before.has(card.key)) continue;
                const status = mediaCardStatus(card);
                lastNewCard = card;
                lastStatus = status;
                if (status.ready) {
                    mediaCard = card;
                    break;
                }
            }
            if (mediaCard) break;
        }
        if (!mediaCard) {
            const detail = lastStatus?.text ? ` (${lastStatus.text.slice(0, 120)})` : "";
            const key = lastNewCard?.key ? ` media=${lastNewCard.key.slice(0, 12)}` : "";
            throw new Error(`รออัปโหลดรูปเข้า Google Flow หมดเวลา แต่ media card ยังไม่พร้อมใช้งาน${key}${detail}`);
        }
        tiles.push(mediaCard);
        log(`✅ อัปโหลดรูป ${i + 1} สำเร็จ (media=${mediaCard.key.slice(0, 12) || "?"})`);
    }
    return tiles;
}

// ── 4. ensureConfig ──────────────────────────────────────────
async function clickMenuTab(key) {
    const aliases = {
        IMAGE: ["IMAGE", "IMAGES", "รูปภาพ"],
        VIDEO: ["VIDEO", "VIDEOS", "วิดีโอ"],
        PORTRAIT: ["PORTRAIT", "9:16", "VERTICAL", "แนวตั้ง"]
    }[key] || [key];
    for (const tab of document.querySelectorAll('[role="tab"]')) {
        const label = `${tab.id || ""} ${tab.textContent || ""} ${tab.getAttribute("aria-label") || ""}`.toUpperCase();
        if ((tab.id || "").endsWith("-trigger-" + key) || aliases.some(alias => label.includes(alias))) {
            if (tab.getAttribute("aria-selected") === "true") return true;
            await humanClick(tab); return true;
        }
    }
    return false;
}
async function clickMenuItemByText(labels) {
    const list = (Array.isArray(labels) ? labels : [labels]).map(label => String(label).toUpperCase());
    const selectors = [
        '[role="menuitem"]',
        '[role="option"]',
        '[role="radio"]',
        '[role="tab"]',
        'button',
        '[data-radix-collection-item]'
    ].join(",");
    for (const item of document.querySelectorAll(selectors)) {
        if (!isVisible(item)) continue;
        const label = elementText(item).toUpperCase();
        if (list.some(value => label.includes(value))) {
            await humanClick(item);
            return true;
        }
    }
    return false;
}
async function selectAspectRatio(aspectRatio) {
    const ratio = String(aspectRatio || "9:16").trim();
    const labels = ratio === "9:16"
        ? ["9:16", "VERTICAL", "PORTRAIT 9:16", "แนวตั้ง 9:16"]
        : [ratio];

    if (await clickMenuItemByText(labels)) {
        log(`✅ เลือก aspect ratio ${ratio}`);
        return true;
    }

    log(`⚠️ ไม่เจอ aspect ratio ${ratio} ในเมนู`);
    return false;
}

async function selectBatchCount(count) {
    let targetVal = Number(count) || 1;
    if (targetVal < 1) targetVal = 1;
    if (targetVal > 4) targetVal = 4;
    
    const label = targetVal === 1 ? "1X" : `X${targetVal}`;
    log(`กำลังหาปุ่มสำหรับ batch count: ${label}...`);
    
    const menu = document.querySelector('[role="menu"][data-state="open"]');
    if (!menu) {
        log("⚠️ เมนู config ไม่เปิดอยู่ ไม่สามารถเลือก batch count");
        return false;
    }
    
    const tabs = menu.querySelectorAll('[role="tab"]');
    for (const tab of tabs) {
        if (!isVisible(tab)) continue;
        const text = (tab.textContent || "").trim().toUpperCase();
        if (text === label || text.includes(label)) {
            if (tab.getAttribute("aria-selected") === "true") {
                log(`✅ Batch count ${label} ถูกเลือกอยู่แล้ว`);
                return true;
            }
            await humanClick(tab);
            log(`✅ เลือก batch count ${label} แล้ว`);
            return true;
        }
    }
    log(`⚠️ ไม่พบปุ่มสำหรับ batch count ${label}`);
    return false;
}

async function selectModel(modelKey) {
    if (!modelKey) return false;
    const menu = document.querySelector('[role="menu"][data-state="open"]');
    if (!menu) {
        log("⚠️ เมนู config ไม่เปิดอยู่ ไม่สามารถเลือก model");
        return false;
    }
    
    const modelBtn = menu.querySelector('button[aria-haspopup="menu"]');
    if (!modelBtn) {
        log("⚠️ หาปุ่มเลือก model ในเมนู config ไม่เจอ");
        return false;
    }
    
    // ⚠️ เรียงจากเฉพาะเจาะจงกว่า → กว้างกว่า เพื่อป้องกัน "LITE" match "LITE [LOWER PRIORITY]"
    const mapping = {
        "veo-3.1-lite-low-priority": ["VEO 3.1 - LITE [LOWER PRIORITY]", "VEO 3.1 \u2014 LITE [LOWER PRIORITY]", "LITE [LOWER PRIORITY]"],
        "veo-3.1-fast":              ["VEO 3.1 - FAST", "VEO 3.1 — FAST", "VEO 3.1 \u2014 FAST"],
        "veo-3.1-quality":           ["VEO 3.1 - QUALITY", "VEO 3.1 — QUALITY", "VEO 3.1 \u2014 QUALITY"],
        "veo-3.1-lite":              ["VEO 3.1 - LITE", "VEO 3.1 — LITE", "VEO 3.1 \u2014 LITE"],
        "omni-flash":                ["OMNI FLASH", "OMNI"],
        "nano-banana-pro":           ["NANO BANANA PRO", "BANANA PRO"],
        "nano-banana-2":             ["NANO BANANA 2", "BANANA 2"]
    };
    
    const targets = mapping[modelKey] || [modelKey.toUpperCase()];
    const currentText = (modelBtn.textContent || "").trim().toUpperCase();
    
    // ตรวจสอบว่าเลือกอยู่แล้วหรือไม่ (exact match ก่อน → substring fallback)
    const alreadySelected = targets.some(t => currentText === t) || targets.some(t => currentText.includes(t));
    if (alreadySelected) {
        log(`\u2705 Model ${modelKey} ถูกเลือกอยู่แล้ว (${currentText})`);
        return true;
    }
    
    log(`สลับโมเดลเป็น ${modelKey}... (ปัจจุบัน: ${currentText})`);
    await humanClick(modelBtn);
    await sleep(800);
    
    // ค้นหา item ใน sub-menu ที่เปิดขึ้นมา
    const matchItem = (items) => {
        // Pass 1: exact match
        for (const item of items) {
            if (!isVisible(item)) continue;
            const text = (item.textContent || "").trim().toUpperCase();
            if (targets.some(t => text === t)) return item;
        }
        // Pass 2: substring match (เฉพาะ target ที่ยาวที่สุดก่อน เพื่อป้องกัน collision)
        const sortedTargets = [...targets].sort((a, b) => b.length - a.length);
        for (const item of items) {
            if (!isVisible(item)) continue;
            const text = (item.textContent || "").trim().toUpperCase();
            if (sortedTargets.some(t => text.includes(t))) return item;
        }
        return null;
    };

    const openMenus = document.querySelectorAll('[role="menu"][data-state="open"], [role="listbox"], [role="menu"]');
    for (const sub of openMenus) {
        if (sub === menu) continue;
        const items = sub.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], button, [data-radix-collection-item]');
        const found = matchItem(Array.from(items));
        if (found) {
            log(`พบตัวเลือก model: ${found.textContent.trim()}, กำลังกดเลือก...`);
            await humanClick(found);
            await sleep(600);
            return true;
        }
    }
    
    // Fallback: ค้นหาทั่วทั้ง document
    const fallbackItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], [data-radix-collection-item]');
    const found = matchItem(Array.from(fallbackItems));
    if (found) {
        log(`พบตัวเลือก model (fallback): ${found.textContent.trim()}, กำลังกดเลือก...`);
        await humanClick(found);
        await sleep(600);
        return true;
    }
    
    log(`\u26a0\ufe0f ไม่พบตัวเลือกสำหรับ model key: ${modelKey}`);
    return false;
}

async function ensureConfig(phase, options = {}) {
    const cfg = await loadSettings();
    const aspectRatio = options.aspectRatio || cfg.aspectRatio || "9:16";
    const count = phase === "image"
        ? (options.imageCount || cfg.imageCount || 4)
        : (options.videoCount || cfg.videoCount || 2);
    const modelKey = phase === "image"
        ? (options.imageModel || cfg.imageModel || "nano-banana-pro")
        : (options.videoModel || cfg.videoModel || "veo-3.1-lite");

    log(`ตั้งค่า ${phase === "image" ? "Image" : "Video"} + Aspect Ratio: ${aspectRatio} + Count: ${count}x + Model: ${modelKey}...`);
    let cfgBtn = null;
    for (const btn of document.querySelectorAll('button[aria-haspopup="menu"]')) {
        const i = btn.querySelector("i.google-symbols,i.material-icons");
        const label = `${btn.textContent || ""} ${btn.getAttribute("aria-label") || ""}`.toLowerCase();
        if (i?.textContent?.startsWith("crop_") || label.includes("aspect") || label.includes("ratio") || label.includes("mode")) { cfgBtn = btn; break; }
    }
    if (!cfgBtn) { log("⚠️ หาปุ่ม config ไม่เจอ"); return; }
    await humanClick(cfgBtn); await sleep(500);
    const menu = await waitEl('[role="menu"][data-state="open"]', 3000);
    if (!menu) { log("⚠️ เมนู config ไม่เปิด"); return; }
    
    await clickMenuTab(phase === "image" ? "IMAGE" : "VIDEO"); await sleep(800);
    await selectAspectRatio(aspectRatio); await sleep(800);
    await selectBatchCount(count); await sleep(800);
    await selectModel(modelKey); await sleep(800);
    
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(400);
    if (document.querySelector('[role="menu"][data-state="open"]')) { document.body.click(); await sleep(300); }
    log(`✅ ตั้งค่า mode + ${aspectRatio} + ${count}x + ${modelKey} สำเร็จ`);
}

async function openMediaEditWorkspace(tile) {
    const el = findMediaCard(tile);
    const tileLabel = (tile?.tileId || tile?.key || tile?.href || tile?.mediaUrl || "?").slice(0, 12);
    if (!el) throw new Error(`ไม่เจอรูป media ${tileLabel} สำหรับเปิดหน้า edit`);

    const link = el.matches?.('a[href*="/edit/"]') ? el : el.querySelector?.('a[href*="/edit/"]');
    log(`เปิดรูปสินค้าในหน้า edit (${tileLabel})...`);
    if (link) await humanClick(link);
    else await humanClick(el);

    const end = Date.now() + 12000;
    while (Date.now() < end) {
        if (/\/edit\//i.test(location.href) && hasEditPromptEditor()) {
            log("✅ เปิดหน้า edit ของรูปสินค้าแล้ว");
            return true;
        }
        await sleep(500);
    }
    throw new Error("เปิดหน้า edit ของรูปสินค้าไม่สำเร็จ");
}

function hasEditPromptEditor() {
    const editor = findPromptEditor();
    const text = elementText(editor || document.body).toLowerCase();
    return Boolean(editor && (text.includes("what do you want to change") || /\/edit\//i.test(location.href)));
}

async function ensureEditAspectRatio(options = {}) {
    const aspectRatio = options.aspectRatio || "9:16";
    log(`ตั้งค่า edit image เป็น ${aspectRatio}...`);
    const cfgBtn = [...document.querySelectorAll("button")]
        .filter(isVisible)
        .find(btn => {
            const label = elementText(btn).toLowerCase();
            return label.includes("crop_") || label.includes("nano banana");
        });
    if (!cfgBtn) { log("⚠️ หาปุ่ม crop/model ในหน้า edit ไม่เจอ"); return false; }
    await humanClick(cfgBtn);
    await sleep(600);
    const ok = await selectAspectRatio(aspectRatio);
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(300);
    return ok;
}

// ── 5. attachUploadsToPrompt ─────────────────────────────────
async function attachUploadsToPrompt(tiles, tabIcon = "drive_folder_upload") {
    if (!tiles || tiles.length === 0) return [];
    log("แนบรูปเข้า prompt...");
    if (promptHasMediaAttachment()) {
        log("✅ รูปอยู่ใน prompt แล้ว");
        return tiles.map(tile => tile.key || tile.tileId || tile.href || tile.mediaUrl).filter(Boolean);
    }

    // สลับไป tab ที่ถูกต้อง (Uploaded หรือ Images)
    const tabBtn = byIcon(tabIcon) || byText(tabIcon === "image" ? ["Images", "Generated", "รูปภาพ"] : ["Uploaded", "Uploads", "อัปโหลด"]);
    if (tabBtn) { await humanClick(tabBtn); await sleep(1000); }
    if (promptHasMediaAttachment()) {
        log("✅ รูปอยู่ใน prompt แล้ว");
        return tiles.map(tile => tile.key || tile.tileId || tile.href || tile.mediaUrl).filter(Boolean);
    }

    const done = new Set();
    for (const tile of tiles) {
        if (!tile?.key && !tile?.tileId && !tile?.href && !tile?.mediaUrl) continue;
        if (promptHasMediaAttachment()) {
            done.add(tile.key || tile.tileId || tile.href || tile.mediaUrl);
            continue;
        }
        const el = findMediaCard(tile);
        const tileLabel = (tile.tileId || tile.key || tile.href || tile.mediaUrl || "?").slice(0, 12);
        if (!el) throw new Error(`ไม่เจอรูป media ${tileLabel} ใน Google Flow`);
        el.scrollIntoView({ block: "center", behavior: "instant" });
        await sleep(400);
        const media = el.querySelector("img,video,[role='img']") || el;

        const attached = await addTileToPrompt(media);
        if (!attached && promptHasMediaAttachment()) {
            log("✅ รูปอยู่ใน prompt แล้ว");
            done.add(tile.key || tile.tileId || tile.href || tile.mediaUrl);
            continue;
        }
        if (!attached) throw new Error(`เลือกภาพแล้ว แต่กด Add to prompt ไม่สำเร็จ (media=${tileLabel})`);

        log(`✅ แนบรูป media ${tileLabel} สำเร็จ`);
        done.add(tile.key || tile.tileId || tile.href || tile.mediaUrl);
        await jitter(800, 1500);
        if (document.querySelector('[role="menu"][data-state="open"]')) {
            document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            await sleep(200);
        }
    }
    return [...done];
}

async function addTileToPrompt(media) {
    const beforeAttachCount = promptAttachmentCount();
    const directAdd = findAddButtonNear(media);
    if (directAdd) {
        await humanClick(directAdd);
        if (await waitPromptAttachment(beforeAttachCount)) return true;
    }

    const menuOpen = document.querySelector('[role="menu"][data-state="open"]');
    if (menuOpen) { document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await sleep(300); }

    await rightClick(media);
    let ctxMenu = await waitEl('[role="menu"][data-state="open"]', 2500);
    let menuItem = ctxMenu ? findPromptMenuItem(ctxMenu) : null;
    if (menuItem) {
        await humanClick(menuItem);
        if (await waitPromptAttachment(beforeAttachCount)) return true;
    }

    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(300);

    return dragTileToPrompt(media, beforeAttachCount);
}

function getPromptPanel() {
    const editor = findPromptEditor();
    let node = editor;
    for (let i = 0; i < 8 && node; i++) {
        const text = elementText(node).toLowerCase();
        const hasEditor = node === editor || node.contains(editor);
        const hasCreateButton = Boolean(
            [...node.querySelectorAll?.("button,[role='button']") || []].some(btn => {
                const label = elementText(btn).toLowerCase();
                return label.includes("arrow_forward") || label.includes("create");
            })
        );
        const hasPromptMedia = Boolean(node.querySelector?.("button img,img[alt*='media' i],video"));
        if (hasEditor && (hasCreateButton || hasPromptMedia)) return node;
        if (!editor && text.includes("what do you want to create") && (hasCreateButton || hasPromptMedia)) return node;
        node = node.parentElement;
    }
    return editor?.parentElement || null;
}

function promptAttachmentCount() {
    const panel = getPromptPanel();
    if (!panel) return 0;
    return panel.querySelectorAll("img,video,button:has(img),button[aria-label*='cancel' i],button[aria-label*='remove' i]").length;
}

function promptHasMediaAttachment() {
    const panel = getPromptPanel();
    if (!panel) return false;
    return Boolean(panel.querySelector("img,video,button img"));
}

async function waitPromptAttachment(beforeCount, timeoutMs = 3500) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        if (promptHasMediaAttachment()) return true;
        if (promptAttachmentCount() > beforeCount) return true;
        await sleep(250);
    }
    return false;
}

async function dragTileToPrompt(media, beforeCount) {
    const source = media.closest("[draggable='true']") || media;
    const target = getPromptPanel() || findPromptEditor();
    if (!source || !target) return false;
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const sx = from.left + from.width / 2;
    const sy = from.top + from.height / 2;
    const tx = to.left + Math.min(to.width - 24, Math.max(24, to.width * 0.18));
    const ty = to.top + to.height / 2;
    const data = new DataTransfer();
    const mouse = (type, x, y, extra = {}) => source.dispatchEvent(new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1, ...extra
    }));
    mouse("mousedown", sx, sy);
    source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: data, clientX: sx, clientY: sy }));
    for (let i = 1; i <= 8; i++) {
        const x = sx + (tx - sx) * (i / 8);
        const y = sy + (ty - sy) * (i / 8);
        document.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1 }));
        target.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data, clientX: x, clientY: y }));
        target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: data, clientX: x, clientY: y }));
        await sleep(80);
    }
    target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data, clientX: tx, clientY: ty }));
    source.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: data, clientX: tx, clientY: ty }));
    mouse("mouseup", tx, ty, { buttons: 0 });
    return waitPromptAttachment(beforeCount, 4000);
}

function findPromptMenuItem(root) {
    for (const item of root.querySelectorAll('[role="menuitem"],[role="option"],button,[data-radix-collection-item]')) {
        const t = elementText(item).toLowerCase();
        if (t.includes("add to prompt") || t.includes("use as input") || t.includes("add image") || t.includes("reference") || t.includes("เพิ่มไปยังพรอมต์")) return item;
    }
    return null;
}

function findAddButtonNear(media) {
    const roots = [];
    let node = media;
    for (let i = 0; i < 6 && node; i++) {
        roots.push(node);
        node = node.parentElement;
    }

    for (const root of roots) {
        const button = findAddButton(root, media);
        if (button) return button;
    }

    const tile = media.closest("[data-tile-id], article, [role='listitem'], [draggable='true']");
    if (tile?.parentElement) {
        const cards = [...tile.parentElement.children];
        const tileIndex = cards.indexOf(tile);
        for (const index of [tileIndex, tileIndex + 1, tileIndex - 1]) {
            const sibling = cards[index];
            if (!sibling) continue;
            const button = findAddButton(sibling, media);
            if (button) return button;
        }
    }

    return null;
}

function findAddButton(root, anchor) {
    const anchorRect = anchor?.getBoundingClientRect?.();
    const candidates = [];
    for (const button of root.querySelectorAll("button,[role='button']")) {
        if (!isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") continue;
        const label = elementText(button).toLowerCase();
        const icon = [...button.querySelectorAll("i,.google-symbols,.material-icons")]
            .map(node => node.textContent?.trim().toLowerCase())
            .filter(Boolean);
        if (label.includes("add media")) continue;
        if (
            label.includes("add to prompt") ||
            label.includes("add image") ||
            label.includes("use as input") ||
            label.includes("piece of media") ||
            label === "add" ||
            icon.includes("add")
        ) {
            const rect = button.getBoundingClientRect();
            const distance = anchorRect
                ? Math.hypot((rect.left + rect.width / 2) - (anchorRect.left + anchorRect.width / 2), (rect.top + rect.height / 2) - (anchorRect.top + anchorRect.height / 2))
                : 0;
            candidates.push({ button, distance });
        }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    return candidates[0]?.button || null;
}

// ── 6. setPrompt (paste → char-by-char fallback) ─────────────
async function setPrompt(prompt) {
    const editor = await waitForPromptEditor(15000);
    if (!editor) throw new Error("หาช่องพิมพ์ prompt ไม่เจอ");
    editor.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(500);
    await humanClick(editor);
    await sleep(400);

    if (editor.matches('[data-slate-editor="true"]')) {
        await typeSlate(editor, prompt);
    } else if (editor.matches(".public-DraftEditor-content")) {
        await typeDraft(editor, prompt);
    } else if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        await typePlainInput(editor, prompt);
    } else {
        await typeContentEditable(editor, prompt);
    }

    await sleep(700);
    const typed = getPromptText(editor);
    const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(28, prompt.length));
    if (!typed.replace(/\s+/g, "").includes(needle)) {
        throw new Error("กรอก prompt ใน Google Flow ไม่สำเร็จ จึงไม่กด Generate");
    }
    log("✅ กรอก Prompt สำเร็จ");
}

function findPromptEditor() {
    const exactFlowTextbox = document.querySelector('div[role="textbox"][contenteditable="true"][data-slate-editor="true"]');
    if (exactFlowTextbox && isVisible(exactFlowTextbox) && !exactFlowTextbox.closest("[draggable='true']")) {
        return exactFlowTextbox;
    }

    const candidates = [];
    for (const selector of PROMPT_SELECTORS) {
        for (const el of document.querySelectorAll(selector)) {
            if (!isVisible(el)) continue;
            const text = elementText(el).toLowerCase();
            const aria = `${el.getAttribute("aria-label") || ""} ${el.getAttribute("placeholder") || ""}`.toLowerCase();
            if (text.includes("reuse prompt") || text.includes("reuse text prompt")) continue;
            if (el.closest("[draggable='true']")) continue;
            const rect = el.getBoundingClientRect();
            let score = 0;
            if (aria.includes("what do you want to create") || text.includes("what do you want to create")) score += 80;
            if (aria.includes("what do you want to change") || text.includes("what do you want to change")) score += 90;
            if (aria.includes("prompt") || aria.includes("create") || aria.includes("change")) score += 30;
            if (rect.top > window.innerHeight * 0.45) score += 20;
            if (rect.width > 240) score += 10;
            candidates.push({ el, score, top: rect.top });
        }
    }
    candidates.sort((a, b) => b.score - a.score || b.top - a.top);
    return candidates[0]?.el || null;
}

async function waitForPromptEditor(ms = MAX_WAIT) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        const editor = findPromptEditor();
        if (editor) return editor;
        await sleep(POLL);
    }
    console.warn("[FlowAuto] timeout: promptInput");
    return null;
}

function getPromptText(editor) {
    if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") return editor.value || "";
    return editor.textContent || "";
}

async function typePlainInput(editor, prompt) {
    editor.focus();
    const proto = editor instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(editor, prompt); else editor.value = prompt;
    editor.dispatchEvent(new Event("input", { bubbles: true }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
}

async function typeContentEditable(editor, prompt) {
    editor.focus();
    const sel = window.getSelection(), range = document.createRange();
    range.selectNodeContents(editor);
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("delete", false, null);
    await sleep(100);
    document.execCommand("insertText", false, prompt);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
}

async function typeSlate(editor, prompt) {
    editor.focus(); await sleep(100);
    const sel = window.getSelection(), r = document.createRange();
    r.selectNodeContents(editor);
    sel?.removeAllRanges();
    sel?.addRange(r);
    await sleep(50);

    try {
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_INSERT_TEXT",
            payload: { text: prompt, clear: true }
        });
        await sleep(700);
        const inserted = (editor.textContent || "").replace(/\s+/g, "");
        const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(30, prompt.length));
        if (response?.ok && response.inserted && inserted.includes(needle)) {
            await sleepStop(1500);
            return;
        }
    } catch (e) {
        console.warn("[FlowAuto] debugger text insert failed:", e);
    }

    document.execCommand("delete", false, null);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
    await sleep(100);

    // Flow uses Slate. Native editing commands update the contenteditable DOM
    // and give Slate a real input path, unlike synthetic input events alone.
    document.execCommand("insertText", false, prompt);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
    await sleep(500);
    const inserted = (editor.textContent || "").replace(/\s+/g, "");
    const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(30, prompt.length));
    if (inserted.includes(needle)) {
        await sleepStop(1500);
        return;
    }

    // Primary: ClipboardEvent paste
    try {
        const dt = new DataTransfer(); dt.setData("text/plain", prompt);
        editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        await sleep(400);
        const got = (editor.textContent || "").trim();
        const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(30, prompt.length));
        if (got.replace(/\s+/g, "").includes(needle)) {
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
    log("รอปุ่ม Generate พร้อมกด...");
    preGenMediaKeys = snapMediaKeys();
    const end = Date.now() + 30000;
    let btn = null;
    let disabledArrow = false;
    while (Date.now() < end) {
        if (stopRequested) return false;
        btn = findGenerateButton();
        disabledArrow = disabledArrow || Boolean(findDisabledGenerateButton());
        if (btn) break;
        log(disabledArrow ? "รอปุ่ม arrow_forward Create enabled..." : "หาปุ่ม Generate...");
        await sleep(500);
    }
    if (!btn) {
        const fb = byText(["Generate", "สร้าง"]);
        if (fb && !fb.disabled) btn = fb;
    }
    if (!btn) throw new Error(disabledArrow
        ? "ปุ่ม arrow_forward Create ยัง disabled หลังกรอก prompt/แนบรูป จึงไม่กด Generate"
        : "หาปุ่ม Generate/Create ใน Google Flow ไม่เจอ");
    log("🚀 กด Generate!");
    btn.scrollIntoView({ block: "center", inline: "center" });
    await sleep(400);
    await clickButtonCenterWithDebugger(btn);
    if (await waitGenerationStarted(btn)) return true;

    await humanClick(btn);
    if (await waitGenerationStarted(btn)) return true;

    btn.click();
    if (await waitGenerationStarted(btn)) return true;

    btn.focus();
    await pressFocusedButtonWithDebugger(" ");
    if (await waitGenerationStarted(btn)) return true;

    btn.focus();
    await pressFocusedButtonWithDebugger("Enter");
    if (await waitGenerationStarted(btn)) return true;

    btn.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true, cancelable: true }));
    if (await waitGenerationStarted(btn)) return true;

    throw new Error("กด Generate แล้ว แต่ Flow ไม่เริ่มสร้าง จึงไม่รอผลลัพธ์");
}

async function clickButtonCenterWithDebugger(button) {
    const rect = button.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    log(`กดปุ่ม Generate ที่ตำแหน่ง ${x},${y}...`);
    try {
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_CLICK_POINT",
            payload: { x, y }
        });
        if (!response?.ok || !response.clicked) {
            console.warn("[FlowAuto] debugger click failed response:", response);
        }
    } catch (e) {
        console.warn("[FlowAuto] debugger click failed:", e);
    }
}

async function pressFocusedButtonWithDebugger(key) {
    try {
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_PRESS_KEY",
            payload: { key }
        });
        if (!response?.ok || !response.pressed) {
            console.warn("[FlowAuto] debugger key press failed response:", response);
        }
    } catch (e) {
        console.warn("[FlowAuto] debugger key press failed:", e);
    }
}

function findGenerateButton() {
    for (const icon of document.querySelectorAll("i,.google-symbols,.material-icons")) {
        if (icon.textContent?.trim() !== "arrow_forward") continue;
        const b = icon.closest("button");
        if (!b || !isVisible(b)) continue;
        const label = `${b.textContent || ""} ${b.getAttribute("aria-label") || ""}`.toLowerCase();
        const disabled = b.disabled || b.getAttribute("aria-disabled") === "true";
        if (disabled) continue;
        if (b.getAttribute("aria-haspopup")) continue;
        if (label.includes("create") || label.includes("arrow_forward")) return b;
    }
    return null;
}

function findDisabledGenerateButton() {
    for (const icon of document.querySelectorAll("i,.google-symbols,.material-icons")) {
        if (icon.textContent?.trim() !== "arrow_forward") continue;
        const b = icon.closest("button");
        if (!b || !isVisible(b)) continue;
        const label = `${b.textContent || ""} ${b.getAttribute("aria-label") || ""}`.toLowerCase();
        const disabled = b.disabled || b.getAttribute("aria-disabled") === "true";
        if (disabled && !b.getAttribute("aria-haspopup") && label.includes("create")) return b;
    }
    return null;
}

async function waitGenerationStarted(button, timeoutMs = 7000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        if (stopRequested) return false;
        const disabled = button.disabled || button.getAttribute("aria-disabled") === "true";
        const bodyText = elementText(document.body).toLowerCase();
        const hasBusyText = bodyText.includes("generating") || bodyText.includes("creating") || bodyText.includes("กำลังสร้าง");
        const hasNewMedia = getMediaCards().some(card => card.key && !preGenMediaKeys.has(card.key));
        if (disabled || hasBusyText || hasNewMedia) {
            log("✅ Flow เริ่มสร้างแล้ว");
            return true;
        }
        await sleep(350);
    }
    return false;
}

// ── 8. waitForResult ─────────────────────────────────────────
async function waitForResult(phase) {
    const maxMs = phase === "image" ? 180000 : 300000;
    const progressGraceMs = 25000;
    const startedAt = Date.now();
    const end = Date.now() + maxMs;
    log("รอผลลัพธ์จาก Flow...");
    while (Date.now() < end) {
        if (stopRequested) return { tileId: null, mediaUrl: "" };
        for (const card of getMediaCards()) {
            if (!card.key || preGenMediaKeys.has(card.key)) continue;
            const status = mediaCardStatus(card);
            if (!status.progress && !status.ready && Date.now() - startedAt < progressGraceMs) {
                log("รอ Flow เริ่มแสดงเปอร์เซ็น...");
                continue;
            }
            if (status.failed) {
                log("Flow tile แสดง Failed แต่ยังรอต่อจนกว่าจะมีผลลัพธ์หรือหมดเวลา...");
                continue;
            }
            if (!isGeneratedResultCard(card, status, phase)) continue;
            log("✅ พบผลลัพธ์ที่สร้างเสร็จแล้ว!");
            return { tileId: card.tileId || card.key, mediaUrl: card.mediaUrl, href: card.href, key: card.key };
        }
        const rem = Math.round((end - Date.now()) / 1000);
        log(`รอผลลัพธ์ที่สร้างเสร็จ... (~${rem}s)`);
        await sleep(1000);
    }
    throw new Error(phase === "image"
        ? "รอผลลัพธ์ภาพจาก Google Flow หมดเวลา หรือไม่พบ media tile ใหม่"
        : "รอผลลัพธ์วิดีโอจาก Google Flow หมดเวลา หรือไม่พบ media tile ใหม่");
}

function isGeneratedResultCard(card, status, phase) {
    if (!status.ready || !card.mediaUrl) return false;
    const text = `${card.label || ""} ${status.text || ""}`.toLowerCase();
    if (text.includes("uploaded image")) return false;
    if (text.includes("upload")) return false;
    if (text.includes("start creating") || text.includes("drop media")) return false;

    const el = findMediaCard(card);
    const videoEl = el?.matches?.("video") ? el : el?.querySelector?.("video");
    // Ensure the video element actually has an active source to prevent empty/placeholder tags from breaking image detection
    const hasActiveVideo = Boolean(videoEl && (videoEl.src || videoEl.currentSrc || videoEl.querySelector("source")?.src));
    const hasImage = Boolean(el?.matches?.("img") || el?.querySelector?.("img,[style*='background-image']"));
    
    if (phase === "video") {
        return hasActiveVideo || /\.(mp4|webm|mov)(\?|$)/i.test(card.mediaUrl);
    }
    return hasImage && !hasActiveVideo;
}

// ── Load settings ────────────────────────────────────────────
async function loadSettings() {
    try {
        const r = await chrome.runtime.sendMessage({ type: "GET_FLOW_SETTINGS" });
        if (r && !r.error) return {
            ...r,
            uploadWaitSec: Math.max(Number(r.uploadWaitSec) || 0, 300)
        };
    } catch { }
    return { videoModel: "veo-3.1-lite", imageModel: "nano-banana-pro", autoPortrait: true, uploadWaitSec: 300 };
}

// ── Main pipeline ─────────────────────────────────────────────
async function runPipeline(payload) {
    const { phase, prompt, imageUrl, options = {} } = payload;
    stopRequested = false;
    try {
        log("เริ่ม Auto Flow...");
        watchNotice();
        await closeOpenAgentToggle();
        const cfg = await loadSettings();

        // 1. ไปหน้า project
        const ok = await ensureProjectPage();
        if (!ok) throw new Error("ไม่สามารถเปิดหน้า project ได้ (ตรวจสอบว่า login Google แล้ว)");
        await sleep(1500);
        dismissIAgree();
        await closeOpenAgentToggle();

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

        const initialPrompt = typeof prompt === "object" ? prompt.imagePrompt : prompt;
        if (!initialPrompt) throw new Error("ไม่มี prompt สำหรับสร้างภาพ/วิดีโอ");

        // 4. ตั้งค่า mode + ratio
        if (cfg.autoPortrait) await ensureConfig(phase === "combined" ? "image" : phase, options);

        // 5. แนบรูปเข้า prompt (หน้า Uploaded)
        if (uploadedTiles.length > 0) {
            const attached = await attachUploadsToPrompt(uploadedTiles, "drive_folder_upload");
            if (attached.length !== uploadedTiles.length) throw new Error("แนบรูปสินค้าเข้า prompt ไม่ครบ จึงไม่กด Generate");
        }

        // 6. กรอก prompt
        log("กรอก Prompt...");
        await setPrompt(initialPrompt);

        // 7. กด Generate
        await clickGenerate();

        // 8. รอผลลัพธ์
        const result = await waitForResult(phase === "combined" ? "image" : phase);

        if (phase === "combined" && result.tileId) {
            if (!prompt?.videoPrompt) throw new Error("ไม่มี prompt สำหรับสร้างวิดีโอ Phase 2");
            log("🎯 ได้รูปภาพแล้ว! กำลังนำรูปไปสร้างวิดีโอต่อทันที...");
            await sleep(2000); // รอให้ระบบบันทึกรูปสักพัก

            // 4b. เปลี่ยน config เป็น VIDEO mode + portrait
            if (cfg.autoPortrait) await ensureConfig("video", options);

            // 5b. แนบรูปที่เพิ่งสร้างเสร็จเข้า prompt ใหม่! (หน้า Images)
            const attachedGenerated = await attachUploadsToPrompt([result], "image");
            if (attachedGenerated.length !== 1) throw new Error("แนบภาพที่สร้างเสร็จเข้า prompt วิดีโอไม่สำเร็จ จึงไม่กด Generate");

            // 6b. กรอก prompt สำหรับวิดีโอ
            log("กรอก Prompt วิดีโอ...");
            await setPrompt(prompt.videoPrompt);

            // 7b. กด Generate
            await clickGenerate();

            // 8b. รอผลลัพธ์วิดีโอ
            const vidResult = await waitForResult("video");

            await sleep(1500);
            removeOverlay();
            return { ok: true, resultUrl: vidResult.mediaUrl, tileId: vidResult.tileId, imgUrl: result.mediaUrl, imgTileId: result.tileId };
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
    if (msg?.type === "FLOW_FETCH_BLOB_BASE64") {
        fetch(msg.url, { credentials: "include" })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    reply({ ok: true, base64, mimeType: blob.type });
                };
                reader.onerror = (e) => reply({ ok: false, error: e.message });
                reader.readAsDataURL(blob);
            })
            .catch(err => reply({ ok: false, error: err.message }));
        return true;
    }
    return false;
});

chrome.runtime.sendMessage({ type: "FLOW_CONTENT_READY" }).catch(() => { });
console.log("[FlowAuto] loaded on", location.href);
