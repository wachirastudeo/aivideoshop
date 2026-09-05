/**
 * flow-automation.js
 * Pipeline:
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
const FLOW_HOME = "https://flow.google.com/";

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
// Identity of the still produced by Phase 1 of the current combined run.
// Video retries snapshot the existing media grid again, so this allow-list
// keeps the known generated still attachable without allowing uploaded tiles.
let generatedStillMediaKeys = new Set();

let lastSentTopic = "";
let _overlay = null;

function log(msg, options = {}) {
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

    // เอาแค่หัวข้อใหม่: ถ้าลบตัวเลขเวลาถอยหลังออกแล้วข้อความยังเป็นเรื่องเดิม จะไม่ส่งซ้ำไปที่ Side Panel
    const topic = msg
        .replace(/\d+\s*s\b/gi, "")
        .replace(/\(~?\d+\s*s?\)/gi, "")
        .replace(/\d+/g, "")
        .replace(/\.+/g, "") // ลบจุดทั้งหมดเพื่อไม่ให้ต่างกันที่สัญลักษณ์จุดถอยหลัง
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

    if (!options.forceSidePanel && topic === lastSentTopic) {
        return; // หัวข้อเดิม ข้ามการส่งไป Side Panel
    }
    lastSentTopic = topic;

    // คงตัวเลขเวลาไว้ใน Side Panel เพื่อให้ผู้ใช้เห็นว่าแต่ละช่วงพัก/รอใช้เวลาประมาณเท่าไร
    const sidePanelMessage = msg
        .replace(/\.+$/g, "") // ลบจุดท้ายข้อความ
        .replace(/\s+/g, " ")
        .trim();

    chrome.runtime.sendMessage({
        type: "PIPELINE_LOG",
        payload: {
            source: "flow-automation",
            level: msg.includes("❌") || msg.includes("⚠️") ? "error" : "info",
            message: `[Google Flow] ${sidePanelMessage}`,
            time: Date.now()
        }
    }).catch(() => {});
}
function removeOverlay() { _overlay?.remove(); _overlay = null; }

function formatDelaySeconds(ms) {
    const seconds = Math.max(1, Math.round(ms / 1000));
    return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
}

function logDelay(ms) {
    log(`⏳ พัก/รอประมาณ ${formatDelaySeconds(ms)}...`, { forceSidePanel: true });
}

// ── Timing ───────────────────────────────────────────────────
const sleep = (ms) => {
    let finalMs = ms;
    if (ms >= 1000) {
        const extraRandom = Math.floor(Math.random() * 2000) - 800; // -800ms to +1200ms
        finalMs = Math.max(800, ms + extraRandom);
    }
    const jitterFactor = finalMs >= 300 ? (0.75 + Math.random() * 0.50) : 1.0; // 0.75 to 1.25
    const totalMs = Math.min(10000, Math.round(finalMs * jitterFactor)); // จำกัดเพดานสูงสุดไม่เกิน 10 วินาทีตามที่ผู้ใช้กำหนด

    if (totalMs >= 2500) {
        logDelay(totalMs);
    }

    // การยิง mousemove/scroll สุ่มระหว่างรอไม่ได้ช่วยให้ขั้นตอนสำเร็จ และ event
    // ที่สร้างจาก content script เป็น synthetic จึงไม่ควรใช้เป็นสัญญาณแทนผู้ใช้จริง
    return new Promise(r => setTimeout(r, totalMs));
};

function jitter(min, max) { return sleep(min + Math.random() * (max - min)); }
async function sleepStop(ms) {
    const end = Date.now() + ms;
    while (Date.now() < end) {
        if (stopRequested) return;
        await sleep(Math.min(200, end - Date.now()));
    }
}

// ── Human click ──────────────────────────────────────────────
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
    // DOM fallback ต้องยิง click เพียงครั้งเดียว การเรียก el.click() แล้วตามด้วย
    // fireAt() จะสร้าง click event สองรอบและทำให้ toggle/menu เปิดแล้วปิดกลับทันที
    try { el.click?.(); } catch { }
}

// คลิกแบบ pointer sequence ครั้งเดียว โดยไม่เรียก el.click()
// ใช้กับปุ่มที่ต้องรับ pointerdown/up ก่อน click
function pointerClick(el) {
    const r = el.getBoundingClientRect();
    fireAt(el, r.left + r.width / 2, r.top + r.height / 2);
}
let currentMouseX = window.innerWidth / 2;
let currentMouseY = window.innerHeight / 2;
document.addEventListener("mousemove", (e) => {
    currentMouseX = e.clientX;
    currentMouseY = e.clientY;
}, { passive: true });

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function getBezierPoints(x0, y0, x3, y3, steps) {
    const points = [];
    const dx = x3 - x0;
    const dy = y3 - y0;
    const p1x = x0 + dx * 0.25 + (Math.random() - 0.5) * 120;
    const p1y = y0 + dy * 0.25 + (Math.random() - 0.5) * 120;
    const p2x = x0 + dx * 0.75 + (Math.random() - 0.5) * 120;
    const p2y = y0 + dy * 0.75 + (Math.random() - 0.5) * 120;
    for (let i = 1; i <= steps; i++) {
        const t = easeInOutQuad(i / steps);
        const mt = 1 - t;
        const x = mt * mt * mt * x0 + 3 * mt * mt * t * p1x + 3 * mt * t * t * p2x + t * t * t * x3;
        const y = mt * mt * mt * y0 + 3 * mt * mt * t * p1y + 3 * mt * t * t * p2y + t * t * t * y3;
        points.push({ x, y });
    }
    return points;
}

async function trail(tx, ty) {
    const startX = currentMouseX;
    const startY = currentMouseY;
    const distance = Math.hypot(tx - startX, ty - startY);
    if (distance < 5) return;
    const steps = Math.max(8, Math.min(30, Math.floor(distance / 20)));
    const points = getBezierPoints(startX, startY, tx, ty, steps);
    for (let i = 0; i < points.length; i++) {
        const { x, y } = points[i];
        const o = {
            bubbles: true, cancelable: true, clientX: x, clientY: y,
            screenX: x + window.screenX, screenY: y + window.screenY,
            pointerId: 1, pointerType: "mouse", isPrimary: true, buttons: 0, pressure: 0, view: window
        };
        document.dispatchEvent(new PointerEvent("pointermove", o));
        document.dispatchEvent(new MouseEvent("mousemove", {
            ...o,
            movementX: i > 0 ? x - points[i - 1].x : 0,
            movementY: i > 0 ? y - points[i - 1].y : 0
        }));
        await sleep(6 + Math.random() * 8);
    }
    currentMouseX = tx;
    currentMouseY = ty;
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
    return (r.width > 0 || r.height > 0 || el.offsetWidth > 0 || el.offsetHeight > 0) && style.visibility !== "hidden" && style.display !== "none";
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
async function closeOpenAgentToggle(options = {}) {
    const required = options.required === true;
    let button = findOpenAgentToggle();
    if (!button) return false;

    log("ปิด Agent ที่เปิดอยู่ก่อนอัปโหลด...");
    button.scrollIntoView({ block: "center", inline: "center" });

    for (let attempt = 1; attempt <= 3; attempt++) {
        // ปุ่ม Agent เป็น toggle — ต้องยิง pointer sequence ครั้งเดียว (ไม่ใช่ click() ที่ยิงซ้ำแล้ว toggle กลับ)
        pointerClick(button);

        const verifyEnd = Date.now() + 2000;
        while (Date.now() < verifyEnd) {
            await sleep(250);
            button = findOpenAgentToggle();
            if (!button) {
                log("✅ ปิด Agent แล้ว");
                return true;
            }
        }
        log(`ลองปิด Agent ซ้ำ ${attempt}/3...`);
    }

    if (required) throw new Error("Agent ยังเปิดอยู่ จึงไม่อัปโหลดรูป");
    log("⚠️ กดปิด Agent แล้ว แต่สถานะ aria-pressed ยังเป็น true");
    return false;
}
function findOpenSessionPanelCloseButton() {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
        .filter(isVisible)
        .filter(heading => /^untitled session$/i.test((heading.textContent || "").trim()));

    const isCloseButton = (button) => {
        if (!button || !isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") {
            return false;
        }
        const hasCloseIcon = [...button.querySelectorAll("i,.google-symbols,.material-icons")]
            .some(node => (node.textContent || "").trim().toLowerCase() === "close");
        const hasCloseLabel = [...button.querySelectorAll("span")]
            .some(node => (node.textContent || "").trim().toLowerCase() === "close");
        return hasCloseIcon || hasCloseLabel;
    };

    for (const heading of headings) {
        // ปุ่มปิดของ session panel อยู่บน header ซึ่งสูงกว่า heading หลายชั้น
        // ปีน ancestor ขึ้นไปเรื่อยๆ แล้วหาปุ่มปิดในแต่ละชั้น (scope อยู่ใน panel กัน match ปุ่มอื่น)
        let panel = heading.parentElement;
        for (let depth = 0; depth < 7 && panel; depth++, panel = panel.parentElement) {
            if (!isVisible(panel)) continue;
            const closeButton = [...panel.querySelectorAll("button,[role='button']")].find(isCloseButton);
            if (closeButton) return closeButton;
        }
    }

    return null;
}
async function closeOpenSessionPanel(options = {}) {
    const required = options.required === true;
    let button = findOpenSessionPanelCloseButton();
    if (!button) return false;

    log("ปิดหน้าต่าง Untitled session...");
    button.scrollIntoView({ block: "center", inline: "center" });

    for (let attempt = 1; attempt <= 3; attempt++) {
        // ใช้ native click เท่านั้น — ห้ามใช้ helper click() ที่ยิง synthetic event ตามพิกัด
        // เพราะหลัง panel ปิด พิกัดเดิมจะกลายเป็นปุ่มเปิด agent ทำให้ panel เด้งกลับ
        try { button.click(); } catch { }

        const verifyEnd = Date.now() + 2000;
        while (Date.now() < verifyEnd) {
            await sleep(250);
            button = findOpenSessionPanelCloseButton();
            if (!button) {
                log("✅ ปิดหน้าต่าง Untitled session แล้ว");
                return true;
            }
        }
        log(`ลองปิดหน้าต่าง Untitled session ซ้ำ ${attempt}/3...`);
    }

    if (required) {
        throw new Error("หน้าต่าง Untitled session ยังเปิดอยู่ จึงไม่อัปโหลดรูป");
    }
    log("⚠️ กดปิดหน้าต่าง Untitled session แล้ว แต่หน้าต่างยังเปิดอยู่");
    return false;
}
async function closeFlowPanels(options = {}) {
    await closeOpenSessionPanel(options);
    await closeOpenAgentToggle(options);
}
async function closeGeneratedAssetOverlay() {
    // The result preview X and the prompt editor's "Clear prompt" X are both
    // rendered as close icons. Pick the topmost visible close control (the
    // preview X is above the editor) and verify that it really disappeared.
    const signature = btn => `${btn.getAttribute("aria-label") || ""} ${btn.textContent || ""} ${[...btn.querySelectorAll("mat-icon,.google-symbols,.material-icons")].map(n => n.textContent || "").join(" ")}`.trim();
    const candidates = [...document.querySelectorAll("button,[role='button']")]
        .filter(isVisible)
        .filter(btn => !/clear prompt/i.test(btn.getAttribute("aria-label") || ""))
        .filter(btn => /(?:^|\s)(?:close|dismiss|ปิด)(?:\s|$)/i.test(signature(btn)));
    // In the current UI the modal close control is exposed as the stable
    // `Clear prompt` button (same close icon/class shown in the DOM dump).
    const clearPrompt = [...document.querySelectorAll("button[aria-label='Clear prompt']")].find(isVisible);
    if (clearPrompt) candidates.push(clearPrompt);
    if (!candidates.length) return false;
    const button = candidates.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    try {
        await humanClick(button);
        const end = Date.now() + 2200;
        while (Date.now() < end) {
            if (!isVisible(button)) { log("✅ ปิดหน้าต่างผลลัพธ์ภาพแล้ว"); return true; }
            await sleep(150);
        }
    } catch {}
    log("⚠️ พบปุ่มปิดหน้าต่างผลลัพธ์ภาพ แต่หน้าต่างยังไม่ปิด");
    return false;
}
function hasPromptEditor() {
    const el = findPromptEditor();
    return Boolean(el && isVisible(el));
}
function byIcon(name) {
    const buttons = [...document.querySelectorAll("button")];
    // pass 1: แมตช์ icon ligature แบบเป๊ะก่อน (กันปุ่ม "Upload images" มาชน byIcon("image"))
    for (const btn of buttons) {
        const i = btn.querySelector("i,.google-symbols,.material-icons,[class*='icon']");
        if (i?.textContent?.trim() === name) return btn;
    }
    // pass 2: fallback label substring
    for (const btn of buttons) {
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
function isProjectUrl(href) { return /^https:\/\/flow\.google\.com\/(?:u\/\d+\/)?project(?:\/|$)/i.test(href); }
function isHomeUrl(href) { return /^https:\/\/flow\.google\.com\/(?:u\/\d+\/)?(?:[?#].*)?$/i.test(href); }
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

// Include Flow's direct tile hosts (including uploaded 1.jpg/2.jpg tiles)
// in the pre-generation snapshot. The legacy card parser can miss these
// closed-component tiles, which previously made an uploaded image look like
// the newly generated result.
function snapDirectTileKeys() {
    const keys = new Set();
    const hosts = document.querySelectorAll("flow-grid-tile-container, flow-image-tile, [role='gridcell'], article, div[class*='grid-tile']");
    for (const host of hosts) {
        const img = host.querySelector('img');
        const key = host.getAttribute('data-tile-id') || img?.getAttribute('data-media-id') || img?.currentSrc || img?.src;
        if (key) keys.add(key);
    }
    return keys;
}
function getMediaCards() {
    const cards = [];
    const seen = new Set();
    const candidates = [
        // Current Flow v2 generated tiles use this element and expose the
        // stable asset identity on the nested image.
        ...document.querySelectorAll("flow-grid-tile-container, flow-image-tile"),
        ...document.querySelectorAll("[data-tile-id]"),
        ...document.querySelectorAll('a[href*="/edit/"]'),
        ...document.querySelectorAll("[draggable='true']"),
        ...document.querySelectorAll("img,video")
    ];

    for (const node of candidates) {
        // Current Flow upload tiles are plain `button filename > img` rather
        // than data-tile-id cards. Keep the button so its filename is usable.
        const card = node.closest("[data-tile-id], [draggable='true'], a[href*='/edit/'], article, button") || node;
        const tileId = card.getAttribute?.("data-tile-id") ||
            node.getAttribute?.("data-media-id") ||
            node.querySelector?.("[data-media-id]")?.getAttribute("data-media-id") ||
            node.closest?.("[data-media-id]")?.getAttribute("data-media-id") ||
            node.closest?.("[data-tile-id]")?.getAttribute("data-tile-id") || "";
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
        const matches = [...document.querySelectorAll(`[data-tile-id="${CSS.escape(cardInfo.tileId)}"], [data-media-id="${CSS.escape(cardInfo.tileId)}"]`)];
        if (matches.length > 0) {
            return matches.find((el) => !el.parentElement?.closest(`[data-tile-id="${CSS.escape(cardInfo.tileId)}"]`)) || matches[0];
        }
    }
    if (cardInfo.href) {
        const byHref = [...document.querySelectorAll('a[href*="/edit/"]')].find(link => link.href === cardInfo.href);
        if (byHref) return byHref.closest("[data-tile-id], [draggable='true'], article, button") || byHref;
    }
    if (cardInfo.mediaUrl) {
        const byMedia = [...document.querySelectorAll("img,video")].find(media => (media.currentSrc || media.src) === cardInfo.mediaUrl);
        if (byMedia) return byMedia.closest("[data-tile-id], [draggable='true'], article, button") || byMedia;
    }
    return null;
}
async function waitForMediaCard(tile, options = {}) {
    const timeoutMs = options.timeoutMs ?? 12000;
    const phase = options.phase || "";
    const tabIcon = options.tabIcon || "";
    const excludedKeys = options.excludedKeys || new Set();
    const allowFallback = options.allowFallback !== false;
    const end = Date.now() + timeoutMs;

    while (Date.now() < end) {
        const exact = findMediaCard(tile);
        if (exact) return { el: exact, card: describeMediaCard(exact), fallback: false };

        if (allowFallback) {
            const fallback = findFallbackMediaCard(tile, phase, tabIcon, excludedKeys);
            if (fallback) return { el: fallback.el, card: fallback.card, fallback: true };
        }

        await sleep(500);
    }
    return { el: null, card: null, fallback: false };
}
function findFallbackMediaCard(tile, phase = "", tabIcon = "", excludedKeys = new Set()) {
    const cards = getMediaCards()
        .map(card => ({ card, status: mediaCardStatus(card), el: findMediaCard(card) }))
        .filter(item => item.el && !excludedKeys.has(item.card.key));

    let candidates = tabIcon === "drive_folder_upload"
        ? cards.filter(item => isReadyUploadedImageCard(item.card, item.status, item.el))
        : cards.filter(item => isGeneratedResultCard(item.card, item.status, "image"));
    // สำหรับภาพที่เจน: ตัดการ์ดที่มีอยู่ "ก่อนกด Generate" (เช่นรูปอัพโหลดด้านบน) ออก
    // เพื่อไม่ให้หยิบภาพต้นฉบับแทนภาพที่เจนเสร็จ
    if (tabIcon !== "drive_folder_upload") {
        const generatedOnly = candidates.filter(item => !preGenMediaKeys.has(item.card.key));
        if (generatedOnly.length) candidates = generatedOnly;
    }
    if (!candidates.length) return null;

    if (tile?.mediaUrl) {
        const byMediaUrl = candidates.find(item => item.card.mediaUrl && sameMediaUrl(item.card.mediaUrl, tile.mediaUrl));
        if (byMediaUrl) return byMediaUrl;
    }
    if (tile?.href) {
        const byHref = candidates.find(item => item.card.href && item.card.href === tile.href);
        if (byHref) return byHref;
    }
    const wantedLabel = normalizeMediaLabel(tile?.label);
    if (wantedLabel) {
        const byLabel = candidates.find(item => normalizeMediaLabel(item.card.label) === wantedLabel);
        if (byLabel) return byLabel;
    }

    // ไม่มี match เป๊ะ → เลือกตัวล่างสุด/ใหม่สุด (ภาพที่เจนล่าสุดอยู่ด้านล่าง) สำหรับภาพที่เจน
    return tabIcon === "drive_folder_upload" ? candidates[0] : candidates[candidates.length - 1];
}
function describeMediaCard(el) {
    const root = el?.closest?.("[data-tile-id], [draggable='true'], a[href*='/edit/'], article, button") || el;
    if (!root) return null;
    const tileId = root.getAttribute?.("data-tile-id") || "";
    const link = root.matches?.('a[href*="/edit/"]') ? root : root.querySelector?.('a[href*="/edit/"]');
    const href = link?.href || "";
    const mediaUrl = getTileMediaUrl(root);
    const label = elementText(root).slice(0, 160);
    return { key: tileId || href || mediaUrl || label, tileId, href, mediaUrl, label };
}
function isReadyUploadedImageCard(card, status, el) {
    if (!card?.key || !status.ready || status.failed || status.progress) return false;
    const video = el.matches?.("video") ? el : el.querySelector?.("video");
    const image = el.matches?.("img") ? el : el.querySelector?.("img,[style*='background-image']");
    if (!image || video) return false;
    const text = `${card.label || ""} ${status.text || ""}`.toLowerCase();
    return !text.includes("start creating") && !text.includes("drop media");
}
function normalizeMediaLabel(value = "") {
    return String(value)
        .toLowerCase()
        .replace(/\b(generated|uploaded|image|video|play_circle|warning)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function sameMediaUrl(a = "", b = "") {
    const clean = (value) => String(value || "").split("?")[0].split("#")[0];
    return Boolean(clean(a) && clean(a) === clean(b));
}
function isPreGenerationMediaKey(value = "") {
    if (!value) return false;
    const isGeneratedStill = [...generatedStillMediaKeys].some(key => key === value || sameMediaUrl(key, value));
    return !isGeneratedStill && [...preGenMediaKeys].some(key => key === value || sameMediaUrl(key, value));
}
function mediaCardStatus(cardInfo) {
    const el = findMediaCard(cardInfo);
    if (!el) return { ready: false, failed: false, progress: false, rendered: false, text: "" };
    const text = mediaCardDeepText(el).toLowerCase();

    // ตรวจสอบ spinner และสถานะอัปโหลด/ประมวลผล ซึ่งระบุการทำงานของระบบภายนอกที่ไม่ใช่การเจนจาก prompt
    const hasSpinner = Boolean(
        el.querySelector("[role='progressbar'],progress,[aria-busy='true'],.spinner,[class*='spinner'],.loading,[class*='loading'],.loader,[class*='loader']")
    );
    const isUploadingOrProcessing = text.includes("uploading") || text.includes("processing") ||
        text.includes("กำลังอัปโหลด") || text.includes("กำลังประมวลผล");

    // คำค้นหาความคืบหน้าในการเจนภาพ/วิดีโอ (อาจซ้ำกับข้อความใน prompt)
    const promptProgressWord = text.includes("generating") || text.includes("rendering") || text.includes("creating") ||
        text.includes("queued") || text.includes("pending") || text.includes("waiting") ||
        text.includes("กำลังสร้าง") || text.includes("กำลังเรนเดอร์") || text.includes("รอคิว") || text.includes("กำลังรอ");

    // Flow บางเวอร์ชันใส่เปอร์เซ็นต์ไว้ใน aria/data attribute แทน textContent
    // ต้องอ่านทุกแหล่ง เพราะ Failed + % ยังเป็นงานที่กำลังสร้าง ไม่ใช่ failure ปลายทาง
    const progressNodes = [...el.querySelectorAll(
        "[role='progressbar'],[aria-valuenow],[aria-valuetext],[data-progress],[data-percent]"
    )];
    const progressMeta = progressNodes.map(node => [
        elementText(node),
        node.getAttribute("aria-valuenow"),
        node.getAttribute("aria-valuetext"),
        node.getAttribute("data-progress"),
        node.getAttribute("data-percent")
    ].filter(Boolean).join(" ")).join(" ");
    const progressSource = `${text} ${progressMeta}`;
    const percentProgress = /(?:^|\D)\d{1,3}\s*%/.test(progressSource) ||
        progressNodes.some(node => {
            const raw = node.getAttribute("aria-valuenow") || node.getAttribute("data-progress") || node.getAttribute("data-percent");
            const value = Number(raw);
            return Number.isFinite(value) && value >= 0 && value < 100;
        });
    const video = el.matches?.("video") ? el : el.querySelector?.("video");
    const hasPlayableVideo = Boolean(
        video && (video.currentSrc || video.src || video.querySelector("source")?.src)
    );
    const pendingVideoProgress = Boolean(el.querySelector?.("[role='slider']")) && !hasPlayableVideo;
    
    const rendered = hasRenderableMedia(el);
    // หากมีรูปหรือวิดีโอแสดงผลแล้ว จะไม่ถือว่าอยู่ในระหว่างเจน (ป้องกันกรณี Prompt มีคำว่า waiting/creating แล้วติด Loop)
    // แต่ถ้ายังมี spinner หรือข้อความระบุว่ากำลังอัปโหลด/ประมวลผล จะถือว่ายังอยู่ในกระบวนการทำงานเสมอ (ห้าม bypass ด้วย rendered)
    const progress = isUploadingOrProcessing || hasSpinner ||
        ((promptProgressWord || percentProgress || pendingVideoProgress) && !rendered);

    // สัญญาณ fail จริงของ Flow: การ์ดล้มเหลวจะมี icon "delete" โผล่ inline บนการ์ด
    // (การ์ดสำเร็จมีแค่ favorite / redo=Reuse prompt / more_vert ส่วน delete ซ่อนในเมนู)
    // — เชื่อถือกว่าการสแกนคำว่า "Failed" ที่หลุดมาจาก tile ข้างเคียง/disclaimer ท้ายหน้า
    const actionIcons = [...el.querySelectorAll(".google-symbols,.material-icons,.material-symbols-outlined,i")]
        .map(n => (n.textContent || "").trim().toLowerCase());
    const hasDeleteIcon = actionIcons.includes("delete") || actionIcons.includes("delete_forever");
    const failureReason = extractFlowFailureReason(el);
    const failed = !progress && !rendered && hasDeleteIcon && Boolean(failureReason);
    const ambiguousFailure = !progress && !rendered && hasDeleteIcon && !failureReason;
    return { ready: rendered && !progress, failed, ambiguousFailure, progress, rendered, text };
}
function mediaCardFailureMessage(cardInfo, status) {
    const el = findMediaCard(cardInfo);
    const message = extractFlowFailureReason(el);

    if (isUnusualActivityFailure(message)) {
        return `Google Flow ตรวจพบพฤติกรรมผิดปกติ (Unusual Activity): ${message || "We noticed some unusual activity"} (คำแนะนำ: ลบ Cookies & Site Data ของ flow.google.com แล้วรีเฟรชหน้าเว็บ)`;
    }
    if (isAudioGenerationFailure(message)) {
        return `Google Flow สร้างผลลัพธ์ไม่สำเร็จ: ${message} (คำแนะนำ: ลบ Cookies & Site Data ของ flow.google.com แล้วรีเฟรชหน้าเว็บ)`;
    }
    if (/prominent people/i.test(message)) {
        return `Google Flow ปฏิเสธ prompt เพราะอาจเกี่ยวข้องกับบุคคลสาธารณะ: ${message}`;
    }
    return message
        ? `Google Flow สร้าง${cardInfo?.mediaUrl ? "สื่อ" : "ผลลัพธ์"}ไม่สำเร็จ: ${message}`
        : "Google Flow แสดงสถานะ Failed โดยไม่ระบุสาเหตุ";
}
function isProminentPeoplePolicyFailure(message) {
    return /prominent people|generating prominent people/i.test(String(message || ""));
}
function isUnusualActivityFailure(message) {
    return /we noticed some unusual activity|unusual[ _-]activity/i.test(String(message || ""));
}
function unusualActivityStopMessage(message = "") {
    return `Google Flow ตรวจพบพฤติกรรมผิดปกติ (Unusual Activity): ${message || "We noticed some unusual activity"} — ระบบหยุดอัตโนมัติเพื่อไม่ส่งคำขอซ้ำ กรุณาตรวจหน้า Flow และรอให้ข้อจำกัดคลายก่อนเริ่มงานใหม่`;
}
function isAudioGenerationFailure(message) {
    return /audio generation failed|please try a different prompt|silent videos/i.test(String(message || ""));
}
function buildPeopleSafePrompt(prompt) {
    const cleaned = String(prompt || "")
        .split(/\n+/)
        .filter(line => !/^\s*Presenter:/i.test(line))
        .map(line => line
            .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character)\b[^.;]*[.;]?/gi, " ")
            .replace(/\s+/g, " ")
            .trim())
        .filter(Boolean)
        .join("\n");
    return `${cleaned}\nProduct-only scene. No people, faces, presenters, reviewers, characters, celebrities, or public figures.`;
}
function extractFlowFailureReason(el) {
    if (!el) return "";
    const failedLabel = [...el.querySelectorAll("div,span,p")]
        .find(node => node.children.length === 0 && /^(failed|failure|ล้มเหลว)$/i.test(node.textContent?.trim() || ""));
    if (!failedLabel) return "";

    const ignored = /^(warning|failed|failure|refresh|retry|undo|redo|reuse prompt|delete_forever|delete)$/i;
    const candidates = [];
    let container = failedLabel.parentElement;
    for (let depth = 0; container && depth < 4; depth += 1, container = container.parentElement) {
        for (const node of container.children) {
            if (node === failedLabel) continue;
            const text = node.textContent?.replace(/\s+/g, " ").trim() || "";
            const controlsOnly = text.replace(/warning|failed|failure|refresh|retry|undo|redo|reuse\s*prompt|delete_forever|delete/gi, "").trim();
            if (text && controlsOnly && text.length <= 600 && !ignored.test(text)) candidates.push(text);
        }
        if (container === el) break;
    }

    const unique = [...new Set(candidates)];
    return unique.find(text => /(unusual|activity|prompt|policy|people|unable|couldn'?t|could not|try again|not allowed|violate|error|help center)/i.test(text))
        || unique[0]
        || "";
}
function findMediaCardRetryButton(cardInfo) {
    const el = findMediaCard(cardInfo);
    if (!el) return null;

    return [...el.querySelectorAll("button,[role='button']")].find(button => {
        if (!isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
        const text = elementText(button).toLowerCase();
        // หมายเหตุ: "redo" = Reuse prompt (มีบนการ์ดสำเร็จทุกใบ) จึงห้ามนับเป็น retry
        const icon = [...button.querySelectorAll("i,.google-symbols,.material-icons")]
            .some(node => /^(refresh|restart_alt)$/.test(node.textContent?.trim().toLowerCase() || ""));
        return text.includes("retry") || text.includes("try again") || icon;
    }) || null;
}
async function retryFailedMediaCard(cardInfo, attempt, maxAttempts, restartGeneration) {
    const failureReason = extractFlowFailureReason(findMediaCard(cardInfo));
    if (isProminentPeoplePolicyFailure(failureReason)) {
        log(`Flow ปฏิเสธบุคคลเด่น → สร้างใหม่แบบไม่มีคน (${attempt}/${maxAttempts})...`);
        return restartFailedGeneration(attempt, maxAttempts, restartGeneration, {
            policyFallback: "no-people",
            failureReason
        });
    }

    if (isUnusualActivityFailure(failureReason)) {
        const error = unusualActivityStopMessage(failureReason);
        log(`⛔ ${error}`);
        return { started: false, error };
    }

    if (isAudioGenerationFailure(failureReason)) {
        log(`Flow แจ้ง Audio Generation Failed → พักก่อน Retry (${attempt}/${maxAttempts})...`);
        await sleepStop(5000 + Math.random() * 3000);
        return restartFailedGeneration(attempt, maxAttempts, restartGeneration, {
            failureReason
        });
    }

    const button = findMediaCardRetryButton(cardInfo);
    if (!button) return restartFailedGeneration(attempt, maxAttempts, restartGeneration);

    const beforeKeys = snapMediaKeys();
    log(`Flow แสดง Failed → กด Retry อัตโนมัติ (${attempt}/${maxAttempts})...`);
    button.scrollIntoView({ block: "center", inline: "center" });
    await humanClick(button);

    for (let fallback = 0; fallback < 2; fallback++) {
        const end = Date.now() + 5000;
        while (Date.now() < end) {
            const status = mediaCardStatus(cardInfo);
            const hasNewCard = getMediaCards().some(card => card.key && !beforeKeys.has(card.key));
            if (hasNewCard || status.progress || !status.failed) {
                log("✅ Flow เริ่ม Retry แล้ว");
                return { started: true, error: "" };
            }
            await sleep(350);
        }

        const currentButton = findMediaCardRetryButton(cardInfo);
        if (!currentButton) break;
        await humanClick(currentButton);
    }

    log("⚠️ กด Retry บนการ์ดแล้วไม่ตอบสนอง → พักก่อนสร้างคำขอเดิมใหม่หนึ่งครั้ง...");
    await sleepStop(5000 + Math.random() * 3000);
    return restartFailedGeneration(attempt, maxAttempts, restartGeneration, {
        failureReason
    });
}
async function restartFailedGeneration(attempt, maxAttempts, restartGeneration, context = {}) {
    if (typeof restartGeneration !== "function") {
        return { started: false, error: "ไม่พบปุ่ม Retry และไม่มีข้อมูลสำหรับสร้างคำขอเดิมใหม่" };
    }
    log(`Flow ไม่มีปุ่ม Retry → สร้างคำขอเดิมใหม่อัตโนมัติ (${attempt}/${maxAttempts})...`);
    try {
        await restartGeneration(context);
        log("✅ Flow เริ่มสร้างคำขอเดิมใหม่แล้ว");
        return { started: true, error: "" };
    } catch (error) {
        const reason = error?.message || "ไม่ทราบสาเหตุ";
        log(`⚠️ สร้างคำขอเดิมใหม่ไม่สำเร็จ: ${reason}`);
        return { started: false, error: reason };
    }
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
    // เช็คว่ารูปภาพโหลดเสร็จสิ้นสมบูรณ์และแสดงผลชัดเจน (complete และ naturalWidth > 0)
    // แต่ถ้าอยู่นอกสายตา (Off-screen) naturalWidth ก็จะมากกว่า 0 อยู่ดีเมื่อโหลดเสร็จ
    if (img && img.src && img.complete && img.naturalWidth > 0) return true;

    const vid = el.matches?.("video") ? el : el.querySelector?.("video");
    // นับ <source> child ด้วย (วิดีโอเสร็จแล้วแต่ยังไม่ load → readyState 0, src ว่าง)
    if (vid && (vid.readyState >= 1 || vid.currentSrc || vid.src || vid.querySelector("source")?.src || vid.poster)) return true;

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

// ── File input patch ─────────────────────────────────────────
function patchFileInput() {
    // ปิดการทำงานไว้ชั่วคราว เพราะการแก้ removeChild ทำให้ React ใน Google Flow พัง (จอดำ)
    // การหน่วงเวลาลบ DOM ทำให้ React state ไม่ตรงกับ DOM จริง
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

function findImageFileInput() {
    const inputs = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots('input[type="file"]')
        : [...document.querySelectorAll('input[type="file"]')];
    return inputs.find(input => /image/i.test(input.getAttribute('accept') || '')) || inputs[0] || null;
}

function queryAllIncludingShadowRoots(selector, root = document) {
    const found = [];
    const visit = (node) => {
        found.push(...node.querySelectorAll(selector));
        for (const element of node.querySelectorAll("*")) {
            if (element.shadowRoot) visit(element.shadowRoot);
        }
    };
    visit(root);
    return found;
}

function findReadyUploadedFileCard(fileName) {
    const expected = String(fileName || "").trim().toLowerCase();
    if (!expected) return null;
    for (const button of queryAllIncludingShadowRoots("button")) {
        // A Flow tile lives inside its own component. Its inner button can
        // report a zero-sized rect to the page script despite being visible
        // and actionable in the composed UI, so do not gate this exact
        // filename match on isVisible().
        if (!elementText(button).trim().toLowerCase().includes(expected)) continue;
        // Flow v2 exposes the filename as a button only after its upload has
        // finished. The image can be a sibling in a nested container, so do
        // not require a particular thumbnail hierarchy here.
        const root = button.closest("[data-tile-id], [draggable='true'], a[href*='/edit/'], article") || button.parentElement || button;
        return root;
    }
    return null;
}

function setFileInputFiles(input, fileOrFiles) {
    const transfer = new DataTransfer();
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    files.filter(Boolean).forEach(file => transfer.items.add(file));
    const filesSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "files")?.set;
    if (filesSetter) filesSetter.call(input, transfer.files);
    else input.files = transfer.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
}

function findAddMediaButton() {
    const exact = [...document.querySelectorAll(
        'button[aria-label*="add media" i], button[mattooltip*="add media" i], [role="button"][aria-label*="add media" i]'
    )].find(isVisible);
    return exact || byText(["Add Media", "เพิ่มสื่อ"]);
}

function findUploadMenuItem() {
    const candidates = [...document.querySelectorAll("body *")]
        .filter(isVisible)
        .map(el => ({
            el: el.closest('button, [role="button"], [role="menuitem"], [tabindex], [mat-menu-item], [class*="menu-item"]') || el,
            text: elementText(el).trim().toLowerCase()
        }))
        .filter(item => /^(upload|อัปโหลด)$/.test(item.text));
    candidates.sort((a, b) => a.text.length - b.text.length);
    return candidates[0]?.el || null;
}

// Flow's current Add media → Upload command creates and clicks a short-lived
// file input. Capture its DOM click in the content-script world, attach the
// file, and prevent the picker default action so React receives change.
async function injectFileViaFlowUploadMenu(file) {
    const existing = findImageFileInput();
    if (existing) {
        setFileInputFiles(existing, file);
        return "existing-input";
    }

    let lastError = null;
    // Flow occasionally drops the short-lived input when another upload just
    // completed. Re-open the menu and retry a few times before failing the
    // image, so a multi-image batch does not stop at image 2/2.
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        const addMedia = findAddMediaButton();
        if (!addMedia) throw new Error("ไม่พบปุ่ม Add media ใน Google Flow");
        let capturedInput = null;
        let assignmentError = null;
        const interceptFilePicker = (event) => {
            const input = event.target;
            if (!(input instanceof HTMLInputElement) || input.type?.toLowerCase() !== "file") return;
            capturedInput = input;
            event.preventDefault();
            try {
                setFileInputFiles(input, file);
            } catch (error) {
                assignmentError = error;
            }
        };
        document.addEventListener("click", interceptFilePicker, true);
        try {
            pointerClick(addMedia);
            const menuDeadline = Date.now() + 5000;
            let upload = null;
            while (Date.now() < menuDeadline && !upload) {
                upload = findUploadMenuItem();
                if (!upload) await sleep(100);
            }
            if (!upload) throw new Error("เปิดเมนู Add media แล้ว แต่ไม่พบคำสั่ง Upload");

            pointerClick(upload);
            // Angular may append the file input asynchronously on subsequent
            // uploads. Poll briefly instead of declaring failure after a
            // single 250ms snapshot.
            const inputDeadline = Date.now() + 3000;
            while (!capturedInput && !findImageFileInput() && Date.now() < inputDeadline) {
                await sleep(150);
            }
            if (assignmentError) throw assignmentError;
            if (capturedInput) return "menu-input";
            const lateInput = findImageFileInput();
            if (lateInput) {
                setFileInputFiles(lateInput, file);
                return "late-input";
            }
            throw new Error("Google Flow ไม่ได้สร้าง file input หลังเลือก Upload");
        } catch (error) {
            lastError = error;
            if (attempt < 3) {
                document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
                await sleep(700 * attempt);
            }
        } finally {
            document.removeEventListener("click", interceptFilePicker, true);
        }
    }
    throw lastError || new Error("Google Flow ไม่ได้สร้าง file input หลังเลือก Upload");
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
function findNewProjectButton() {
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
    
    // 1. Try standard labels first
    let btn = findAction(createLabels);
    if (btn) return btn;

    // 2. Try looking for any button/link/div with role="button" containing the word "project" or "new" or "สร้าง" and an "add" icon or "+"
    const candidates = [...document.querySelectorAll("button, [role='button'], a, [tabindex]")]
        .filter(isVisible);

    for (const el of candidates) {
        const text = elementText(el).toLowerCase();
        const isProjectRelated = text.includes("project") || text.includes("flow") || text.includes("new") || text.includes("สร้าง") || text.includes("ใหม่");
        
        const icons = [...el.querySelectorAll("i, .google-symbols, .material-icons, .material-symbols-outlined, [class*='icon']")]
            .map(i => i.textContent.trim().toLowerCase());
        
        const hasAddIcon = icons.some(name => name === "add" || name === "create" || name === "plus" || name.includes("add"));
        const hasPlusText = el.textContent.includes("+");

        if (isProjectRelated && (hasAddIcon || hasPlusText)) {
            return el;
        }
    }

    // 3. Fallback: find any visible button/link/div that has an "add" or "+" icon (not for upload)
    for (const el of candidates) {
        const icons = [...el.querySelectorAll("i, .google-symbols, .material-icons, .material-symbols-outlined, [class*='icon']")]
            .map(i => i.textContent.trim().toLowerCase());
        const hasAddIcon = icons.some(name => name === "add" || name === "create" || name === "plus" || name.includes("add"));
        const hasPlusText = el.textContent.includes("+");
        if (hasAddIcon || hasPlusText) {
            const text = el.textContent.toLowerCase();
            if (!text.includes("upload") && !text.includes("media") && !text.includes("drive")) {
                return el;
            }
        }
    }

    return null;
}

async function ensureProjectPage(isResume = false) {
    await sleep(1000);
    if (location.hostname.includes("accounts.google")) {
        log("❌ Google Flow ต้อง login Google ก่อน");
        return false;
    }

    if (isResume || isProjectUrl(location.href)) {
        log(isResume ? "🔄 กำลังดำเนินโครงการต่อหลังรีเฟรช: รอหน้าต่าง Prompt Editor..." : "กำลังรอให้หน้าโปรเจกต์พร้อม (Prompt Editor)...");
        const end = Date.now() + 45000; // ขยายเวลารอเป็น 45 วินาที
        while (Date.now() < end) {
            if (hasPromptEditor()) return true;
            await sleep(POLL);
        }
        log("❌ หน้า project เปิดแล้ว แต่ prompt editor ยังไม่พร้อม");
        return false;
    }

    // Every run must start from a fresh Flow project. If we are already in
    // Flow, avoid reloading the site; use the visible app controls instead.
    if (hasPromptEditor()) {
        const back = findAction(["Go Back", "arrow_back"]);
        if (back) {
            log("กลับไปหน้า Flow เพื่อกด New project...");
            back.scrollIntoView({ block: "center", inline: "center" });
            pointerClick(back);
            await sleep(2000);
        }
    }

    for (let i = 0; i < 24; i++) {
        if (location.hostname.includes("accounts.google")) {
            log("❌ Google Flow ต้อง login Google ก่อน");
            return false;
        }
        const action = findNewProjectButton();
        if (action) {
            log(`กดปุ่ม Flow: ${elementText(action).slice(0, 60) || "Create/New project"}`);
            action.scrollIntoView({ block: "center", inline: "center" });
            pointerClick(action);
            await sleep(3800); // หน่วงเวลาหลังคลิกเปิดโปรเจกต์
            if (isProjectUrl(location.href)) return true;
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

async function prepareFreshProject() {
    if (location.hostname.includes("accounts.google")) {
        throw new Error("Google Flow ต้อง login Google ก่อน");
    }
    if (isProjectUrl(location.href)) {
        const back = findAction(["Go Back", "arrow_back"]);
        if (back) {
            log("กลับไปหน้า Flow เพื่อสร้าง New Project ใหม่...");
            back.scrollIntoView({ block: "center", inline: "center" });
            pointerClick(back);
            await sleep(2200);
        } else {
            log("ไม่พบปุ่มย้อนกลับของ project เดิม → เปิดหน้า Flow ใหม่...");
            location.href = FLOW_HOME;
            const deadline = Date.now() + 30000;
            while (!isHomeUrl(location.href) && Date.now() < deadline) {
                await sleep(POLL);
            }
            if (!isHomeUrl(location.href)) throw new Error("กลับไปหน้า Flow เพื่อสร้าง New Project ใหม่ไม่สำเร็จ");
        }
    }

    for (let i = 0; i < 40; i++) {
        const action = findNewProjectButton();
        if (action) {
            log(`กดปุ่ม Flow: ${elementText(action).slice(0, 60) || "Create/New project"}`);
            action.scrollIntoView({ block: "center", inline: "center" });
            pointerClick(action);
            await sleep(3800); // หน่วงเวลาหลังคลิกเปิดโปรเจกต์
            return true;
        }
        await sleep(POLL);
    }

    throw new Error("ไม่เจอปุ่ม Create/New project ในหน้า Google Flow");
}

// ── 2. switchToUploadedTab ───────────────────────────────────
async function switchToUploadedTab() {
    const btn = byIcon("drive_folder_upload") || byText(["Uploaded", "Uploads", "อัปโหลด"]);
    if (btn) { await humanClick(btn); log("✅ สลับไป Uploaded tab"); await sleep(1000); }
}

async function refreshMediaList() {
    // Flow v2 already updates the media grid live. Switching category views
    // here can leave its component tree in a transient state indefinitely,
    // which made a completed upload look like a stuck upload. Keep the
    // current grid mounted and yield once before querying it again.
    await sleep(500);
}

// ── 3. uploadImages ──────────────────────────────────────────
async function uploadImages(dataUrls, waitMs = 400000, fallbackUrls = []) {
    await closeFlowPanels({ required: true });
    patchFileInput();
    
    log(`ดาวน์โหลดข้อมูลรูปภาพ ${dataUrls.length} รูป...`);
    const files = [];
    for (let i = 0; i < dataUrls.length; i++) {
        const candidates = [dataUrls[i], ...(fallbackUrls[i] || [])].filter(Boolean);
        let blob = null;
        let lastDownloadError = null;
        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            try {
                const candidate = candidates[candidateIndex];
                blob = candidate.startsWith("data:")
                    ? toBlob(candidate)
                    : await (async () => {
                        const res = await chrome.runtime.sendMessage({
                            type: "FETCH_IMAGE_DATA",
                            payload: { url: candidate }
                        });
                        if (res && res.error) throw new Error(res.error);
                        if (!res || !res.base64) throw new Error("ไม่ได้รับข้อมูลรูปภาพจาก background script");
                        return toBlob(`data:${res.mime || "image/jpeg"};base64,${res.base64}`);
                    })();
                if (!/^image\//i.test(blob.type || "")) {
                    throw new Error(`type=${blob.type || "unknown"}`);
                }
                break;
            } catch (error) {
                blob = null;
                lastDownloadError = error;
            }
        }
        if (!blob) {
            throw new Error(`ดาวน์โหลดรูปที่ ${i + 1} ล้มเหลว (${lastDownloadError?.message || "unknown"}) — URL อาจถูกบล็อก/หมดอายุ`);
        }
        let mime = blob.type || "image/jpeg";
        const ext = mimeToImageExt(mime);
        files.push(new File([blob], `${i + 1}.${ext}`, { type: mime }));
    }

    await closeFlowPanels({ required: true });
    log(`กำลังอัปโหลดรูปภาพทีละภาพ จำนวนทั้งหมด ${files.length} รูป...`);
    const before = snapMediaKeys();
    const tiles = [];
    const needed = files.length;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        log(`กำลังอัปโหลดรูปที่ ${i + 1}/${needed} (${file.name})...`);

        // Open Flow's native Upload command only once. Passing the complete
        // file list avoids a second synthetic file-picker gesture, which Flow
        // rejects after the first upload. We still wait for each named tile
        // below so callers receive one result per image.
        const uploadPath = i === 0
            ? await injectFileViaFlowUploadMenu(files)
            : "same-batch-input";
        log(`ส่งรูปเข้า Google Flow ผ่าน ${uploadPath} แล้ว กำลังรอการ์ดสื่อ...`);

        // ดีเลย์หลังอัปโหลดเพื่อเลียนแบบความเร็วคนจริงๆ
        await sleep(1500 + Math.random() * 1500);

        // รอจนกระทั่งรูปนี้อัปโหลดเสร็จและพร้อมใช้งาน
        const secs = Math.max(30, Math.min(300, Math.ceil(waitMs / 1000)));
        let imageReady = false;
        
        for (let s = secs; s > 0; s--) {
            if (stopRequested) return tiles;
            
            // ดึงการ์ดใหม่ที่สร้างขึ้น
            const currentNewCards = getMediaCards().filter(card => card.key && !before.has(card.key));
            const newlyReadyCards = currentNewCards.filter(card => 
                mediaCardStatus(card).ready && !tiles.some(t => t.key === card.key)
            );
            // Current Flow can render an upload progress placeholder with the
            // final filename before the image tile is ready. That reuses the
            // snapshot key, so a key-only "new card" check never sees it.
            const readyFallbackCards = before.size === 0
                ? getMediaCards().filter(card =>
                    mediaCardStatus(card).ready &&
                    !tiles.some(tile => tile.key === card.key) &&
                    (String(card.label || "").includes(file.name) || String(card.key || "").includes(file.name))
                )
                : [];
            // Flow v2 currently uses `button 1.jpg > img` with no stable card
            // attributes. Its exact filename + rendered-image pair is the
            // authoritative upload completion signal.
            const readyFileButton = findReadyUploadedFileCard(file.name);
            const namedReadyCard = readyFileButton ? describeMediaCard(readyFileButton) : null;
            const readyCards = newlyReadyCards.length
                ? newlyReadyCards
                : namedReadyCard && !tiles.some(tile => tile.key === namedReadyCard.key)
                    ? [namedReadyCard]
                    : readyFallbackCards;
            
            if (readyCards.length > 0) {
                const card = readyCards[0];
                tiles.push(card);
                log(`✅ อัปโหลดรูปที่ ${i + 1} สำเร็จ (media=${card.key.slice(0, 12) || "?"})`);
                imageReady = true;
                break;
            }

            // Flow v2's uploaded tile is inside an encapsulated component, so
            // the normal page DOM cannot see it even though it is visibly
            // complete. Ask the background's CDP accessibility bridge to
            // open that exact filename and select "Add to prompt" directly.
            const axAttach = await chrome.runtime.sendMessage({
                type: "FLOW_ATTACH_MEDIA_BY_NAME",
                payload: { fileName: file.name }
            }).catch(() => null);
            if (axAttach?.attached) {
                const card = { key: axAttach.key, label: axAttach.label, alreadyAttached: true };
                tiles.push(card);
                log(`✅ อัปโหลดและแนบรูปที่ ${i + 1} สำเร็จผ่าน Flow media menu`);
                imageReady = true;
                break;
            }
            
            const pollCount = secs - s + 1;
            if (pollCount % 8 === 0) {
                log(`ตรวจ tile ${file.name}: filenameMatch=${Boolean(readyFileButton)} cards=${getMediaCards().length}`);
                await refreshMediaList();
            } else {
                await sleep(1000);
            }
        }

        if (!imageReady) {
            throw new Error(`อัปโหลดรูปที่ ${i + 1} ล้มเหลว (หมดเวลา)`);
        }

        // ดีเลย์ระหว่างไฟล์ 2 ถึง 4 วินาที
        if (i < needed - 1) {
            const stepDelay = 2000 + Math.random() * 2000;
            log(`⏳ ดีเลย์สุ่มระหว่างภาพ ${Math.round(stepDelay)}ms...`);
            await sleep(stepDelay);
        }
    }
    
    return tiles;
}

// ── 4. ensureConfig ──────────────────────────────────────────
async function clickMenuTab(key) {
    const aliases = {
        IMAGE: ["IMAGE", "IMAGES", "รูปภาพ"],
        VIDEO: ["VIDEO", "VIDEOS", "วิดีโอ"],
        PORTRAIT: ["PORTRAIT", "9:16", "VERTICAL", "แนวตั้ง"],
        Subject: ["SUBJECT", "วัตถุ", "ตัวแบบ", "หัวข้อ", "สิ่งที่แสดง"],
        SUBJECT: ["SUBJECT", "วัตถุ", "ตัวแบบ", "หัวข้อ", "สิ่งที่แสดง"],
        Style: ["STYLE", "สไตล์", "รูปแบบ"],
        STYLE: ["STYLE", "สไตล์", "รูปแบบ"],
        Structure: ["STRUCTURE", "โครงสร้าง"],
        STRUCTURE: ["STRUCTURE", "โครงสร้าง"],
        VIDEO_REFERENCES: ["VIDEO_REFERENCES", "VIDEO REFERENCES", "INGREDIENTS", "ส่วนผสม", "วัตถุดิบ", "อ้างอิงวิดีโอ"],
        VIDEO_FRAMES: ["VIDEO_FRAMES", "VIDEO FRAMES", "FRAMES", "เฟรม", "กรอบ", "เฟรมวิดีโอ"]
    }[key] || [String(key).toUpperCase()];
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

function radioMatchesLabel(item, label) {
    const expected = String(label).trim().toUpperCase();
    const candidates = [
        item.querySelector('.toggle-text')?.textContent,
        item.getAttribute('aria-label'),
        item.value,
        elementText(item)
    ].filter(Boolean).map(value => String(value).trim().toUpperCase());
    // Material's icon name and visible label can be concatenated in textContent
    // (for example, "crop_freeFrames"), so a suffix is a valid exact label.
    return candidates.some(text => text === expected
        || text.startsWith(`${expected} `)
        || text.endsWith(expected));
}

async function clickVisibleRadio(label) {
    for (const item of document.querySelectorAll('[role="radio"], input[type="radio"]')) {
        if (!isVisible(item)) continue;
        if (radioMatchesLabel(item, label)) {
            const target = item.closest('label,[role="radio"],button') || item;
            await humanClick(target);
            return true;
        }
    }
    return false;
}

function isVisibleRadioSelected(label) {
    return [...document.querySelectorAll('[role="radio"], input[type="radio"]')].some(item => {
        if (!isVisible(item)) return false;
        if (!radioMatchesLabel(item, label)) return false;
        return item.checked === true
            || item.getAttribute('aria-checked') === 'true'
            || item.getAttribute('aria-selected') === 'true';
    });
}

function getVideoReferenceMode(options = {}, cfg = {}) {
    const rawMode = String(options.videoRefMode ?? cfg.videoRefMode ?? "frames").trim().toLowerCase();
    return rawMode === "ingredients" ? "ingredients" : "frames";
}

async function selectVerifiedVideoReferenceMode(options, cfg) {
    const videoRefMode = getVideoReferenceMode(options, cfg);
    const label = videoRefMode === "frames" ? "Frames" : "Ingredients";
    const key = videoRefMode === "frames" ? "VIDEO_FRAMES" : "VIDEO_REFERENCES";

    // Flow's current settings panel exposes Frames/Ingredients as radio controls,
    // not tabs.  A tab-only lookup leaves the previously selected mode unchanged.
    const picked = await clickVisibleRadio(label)
        || await clickMenuItemByText([label])
        || await clickMenuTab(key);
    await sleep(350);
    if (!picked || !isVisibleRadioSelected(label)) {
        throw new Error(`ยืนยันโหมดอ้างอิงวิดีโอ ${label} ไม่สำเร็จ จึงไม่กด Generate`);
    }
    log(`เลือกโหมดอ้างอิงวิดีโอ: ${label}`);
    return videoRefMode;
}

// Flow's current settings UI does not consistently expose the active mode as a
// checked radio.  Its Settings trigger, however, always reflects the selected
// model family.  Use that as the final assertion after the menu is closed.
function hasActiveFlowModelFamily(phase) {
    // The compact Settings trigger currently says "Video · 720p · 8s" for
    // Veo, while older Flow builds show the literal Veo model name.
    const expected = phase === "video" ? /\bVEO\b|\bVIDEO\b/i : /NANO\s+BANANA|BANANA\s+PRO/i;
    return [...document.querySelectorAll('button')].some(btn => {
        if (!isVisible(btn)) return false;
        const label = `${btn.textContent || ""} ${btn.getAttribute("aria-label") || ""} ${btn.getAttribute("data-tooltip") || ""}`;
        return /settings\s+trigger/i.test(label) && expected.test(label);
    });
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
    if (targetVal > 8) targetVal = 8;
    
    // Google Flow ใช้ format "XN" สำหรับทุกค่า เช่น "X1", "X2", "X3", "X4"
    const label = `X${targetVal}`;
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
    // New Flow settings uses a pop-up button in a panel, not a role=menu.
    const scope = menu || document;
    const modelBtn = Array.from(scope.querySelectorAll('button[aria-haspopup="menu"], [role="button"]'))
        .find(btn => isVisible(btn) && /select model family|model family|โมเดล/i.test(
            `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''}`));
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
    const isNormalLite = modelKey === "veo-3.1-lite";
    const alreadySelected = !(isNormalLite && currentText.includes("LOWER PRIORITY"))
        && (targets.some(t => currentText === t) || targets.some(t => currentText.includes(t)));
    if (alreadySelected) {
        log(`\u2705 Model ${modelKey} ถูกเลือกอยู่แล้ว (${currentText})`);
        return modelKey;
    }
    
    log(`สลับโมเดลเป็น ${modelKey}... (ปัจจุบัน: ${currentText})`);
    await humanClick(modelBtn);
    await sleep(800);
    
    // ค้นหา item ใน sub-menu ที่เปิดขึ้นมา
    const matchItem = (items, matchTargets = targets, excludeLowerPriority = false) => {
        // Pass 1: exact match
        for (const item of items) {
            if (!isVisible(item)) continue;
            const text = (item.textContent || "").trim().toUpperCase();
            if (excludeLowerPriority && text.includes("LOWER PRIORITY")) continue;
            if (matchTargets.some(t => text === t)) return item;
        }
        // Pass 2: substring match (เฉพาะ target ที่ยาวที่สุดก่อน เพื่อป้องกัน collision)
        const sortedTargets = [...matchTargets].sort((a, b) => b.length - a.length);
        for (const item of items) {
            if (!isVisible(item)) continue;
            const text = (item.textContent || "").trim().toUpperCase();
            if (excludeLowerPriority && text.includes("LOWER PRIORITY")) continue;
            if (sortedTargets.some(t => text.includes(t))) return item;
        }
        return null;
    };

    const openMenus = document.querySelectorAll('[role="menu"][data-state="open"], [role="listbox"], [role="menu"]');
    for (const sub of openMenus) {
        if (sub === menu) continue;
        const items = sub.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], button, [data-radix-collection-item]');
        const found = matchItem(Array.from(items), targets, isNormalLite);
        if (found) {
            log(`พบตัวเลือก model: ${found.textContent.trim()}, กำลังกดเลือก...`);
            await humanClick(found);
            await sleep(600);
            return modelKey;
        }
    }
    
    // Fallback: ค้นหาทั่วทั้ง document
    const fallbackItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], [data-radix-collection-item]');
    const found = matchItem(Array.from(fallbackItems), targets, isNormalLite);
    if (found) {
        log(`พบตัวเลือก model (fallback): ${found.textContent.trim()}, กำลังกดเลือก...`);
        await humanClick(found);
        await sleep(600);
        return modelKey;
    }

    if (modelKey === "veo-3.1-lite-low-priority") {
        const fallbackKey = "veo-3.1-lite";
        const fallbackTargets = mapping[fallbackKey];
        log("⚠️ ไม่พบ Veo 3.1 — Lite [Lower Priority] (0 เครดิต) จึงใช้ Veo 3.1 — Lite แทน ซึ่งอาจมีค่าเครดิต");

        for (const sub of openMenus) {
            if (sub === menu) continue;
            const items = sub.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], button, [data-radix-collection-item]');
            const fallbackFound = matchItem(Array.from(items), fallbackTargets, true);
            if (fallbackFound) {
                log(`พบตัวเลือก model fallback: ${fallbackFound.textContent.trim()}, กำลังกดเลือก...`);
                await humanClick(fallbackFound);
                await sleep(600);
                return fallbackKey;
            }
        }

        const fallbackItems = document.querySelectorAll('[role="menuitem"], [role="menuitemradio"], [role="option"], [role="radio"], [data-radix-collection-item]');
        const fallbackFound = matchItem(Array.from(fallbackItems), fallbackTargets, true);
        if (fallbackFound) {
            log(`พบตัวเลือก model fallback (ทั่วหน้า): ${fallbackFound.textContent.trim()}, กำลังกดเลือก...`);
            await humanClick(fallbackFound);
            await sleep(600);
            return fallbackKey;
        }
    }
    
    log(`\u26a0\ufe0f ไม่พบตัวเลือกสำหรับ model key: ${modelKey}`);
    return false;
}

async function ensureConfig(phase, options = {}) {
    const cfg = await loadSettings();
    const aspectRatio = options.aspectRatio || cfg.aspectRatio || "9:16";
    const count = phase === "image"
        ? (options.imageCount || cfg.imageCount || 1)
        : (options.videoCount || cfg.videoCount || 1);
    const modelKey = phase === "image"
        ? (options.imageModel || cfg.imageModel || "nano-banana-pro")
        : (options.videoModel || cfg.videoModel || "veo-3.1-lite-low-priority");

    log(`ตั้งค่า ${phase === "image" ? "Image" : "Video"} + Aspect Ratio: ${aspectRatio} + Count: ${count}x + Model: ${modelKey}...`);
    const configIsOpen = () => Boolean(document.querySelector('[role="menu"][data-state="open"]')
        || [...document.querySelectorAll('[role="radio"]')].some(isVisible));
    let configOpened = configIsOpen();
    for (let attempt = 1; attempt <= 3 && !configOpened; attempt += 1) {
        const buttons = [...document.querySelectorAll('button')].filter(isVisible);
        // Prefer Flow's stable accessible name. Generic aspect/mode matches can
        // accidentally target a button in the prompt or a stale media card.
        let cfgBtn = buttons.find(btn => /settings\s+trigger/i.test(`${btn.textContent || ""} ${btn.getAttribute("aria-label") || ""}`));
        if (!cfgBtn) {
            cfgBtn = buttons.find(btn => {
                const i = btn.querySelector("i.google-symbols,i.material-icons");
                const label = `${btn.textContent || ""} ${btn.getAttribute("aria-label") || ""} ${btn.getAttribute("data-tooltip") || ""}`.toLowerCase();
                return i?.textContent?.startsWith("crop_") || label.includes("aspect") || label.includes("ratio") || label.includes("mode");
            });
        }
        if (!cfgBtn) break;
        log(`เปิดเมนู config (รอบ ${attempt}/3)...`);
        await humanClick(cfgBtn);
        const readyEnd = Date.now() + 1800;
        while (Date.now() < readyEnd && !configIsOpen()) await sleep(100);
        configOpened = configIsOpen();
    }
    const menu = document.querySelector('[role="menu"][data-state="open"]');
    if (!configOpened) {
        throw new Error("เมนู config ไม่เปิด จึงไม่กด Generate");
    }
    
    const modeLabel = phase === "image" ? "Image" : "Video";
    const modeSelected = await clickVisibleRadio(modeLabel)
        || await clickMenuItemByText([modeLabel])
        || await clickMenuTab(phase === "image" ? "IMAGE" : "VIDEO");
    if (!modeSelected) throw new Error(`ไม่พบตัวเลือก ${modeLabel} ในเมนู config จึงไม่กด Generate`);
    await sleep(800);
    // Radio semantics are absent in Flow's newer settings UI.  Verification is
    // therefore deferred until the selected model is visible on Settings below.
    if (phase === "image") {
        // บังคับเลือกแท็บ Subject สำหรับรูปภาพนิ่ง เพื่อให้ใช้สินค้าต้นฉบับเป็นแค่อ้างอิงวัตถุ ไม่ใช้โครงภาพเดิม
        const picked = await clickMenuTab("Subject");
        if (picked) log("เลือกแท็บรูปภาพ: Subject");
        await sleep(600);
    } else {
        await selectVerifiedVideoReferenceMode(options, cfg);
        await sleep(600);
    }
    (await clickVisibleRadio(aspectRatio)) || await selectAspectRatio(aspectRatio); await sleep(800);
    (await clickVisibleRadio(`x${count}`)) || await selectBatchCount(count); await sleep(800);
    const selectedModelKey = await selectModel(modelKey); await sleep(800);
    
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep(400);
    if (document.querySelector('[role="menu"][data-state="open"]')) { document.body.click(); await sleep(300); }
    if (!selectedModelKey) throw new Error(`เลือกโมเดล ${modelKey} ไม่สำเร็จ จึงไม่กด Generate`);
    if (!hasActiveFlowModelFamily(phase)) {
        throw new Error(`ยืนยันโมเดล ${phase === "video" ? "Veo" : "Banana"} ไม่สำเร็จ จึงไม่กด Generate`);
    }
    log(`✅ ตั้งค่า mode + ${aspectRatio} + ${count}x + ${selectedModelKey} สำเร็จ`);
    return true;
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
async function attachUploadsToPrompt(tiles, tabIcon = "drive_folder_upload", options = {}) {
    if (!tiles || tiles.length === 0) return [];
    const target = tiles.length;
    log(`แนบรูปเข้า prompt (${target} รูป)...`);

    // Flow's Frames editor may commit a whole upload batch to the prompt
    // before the individual menu action resolves. Treat that visible state
    // as the completed Add-to-prompt operation and avoid duplicate retries.
    if (target > 1 && flowIngredientButtonCount() >= target) {
        log(`✅ Flow ยืนยันภาพแนบครบแล้ว (${target}/${target})`);
        return tiles.map(tile => tile?.key || tile?.tileId || tile?.href || tile?.mediaUrl).filter(Boolean);
    }

    // สลับไป tab ที่ถูกต้อง (Uploaded หรือ Images) — ข้ามได้ถ้ารูปอยู่ใน view แล้ว
    if (!options.skipTabSwitch) await switchMediaTab(tabIcon);

    const done = new Set();
    const usedResolvedKeys = new Set();
    for (const tile of tiles) {
        const id = tile?.key || tile?.tileId || tile?.href || tile?.mediaUrl;
        if (!id) continue;
        if (tile.alreadyAttached) {
            done.add(id);
            log(`✅ รูป ${String(tile.label || id).slice(0, 24)} ถูกแนบเข้า prompt แล้ว`);
            continue;
        }
        const tileLabel = String(id).slice(0, 12);
        const beforeCount = promptAttachmentCount();
        const result = await waitForMediaCard(tile, {
            tabIcon,
            phase: tabIcon === "image" ? "image" : "",
            timeoutMs: tabIcon === "image" ? 15000 : 20000,
            excludedKeys: usedResolvedKeys,
            // Source references must resolve to the exact uploaded tile.
            // Falling back to the newest card can silently reuse another item's media.
            allowFallback: options.allowFallback === true
        });
        const el = result.el;
        if (!el) throw new Error(`ไม่เจอรูป media ${tileLabel} ใน Google Flow`);
        if (result.fallback) {
            log(`⚠️ Flow เปลี่ยน media ID ${tileLabel} ใช้รูปที่พร้อมล่าสุดในแท็บแทน`);
        }
        if (result.card?.key) usedResolvedKeys.add(result.card.key);
        el.scrollIntoView({ block: "center", behavior: "instant" });
        await sleep(400);
        const media = el.querySelector("img,video,[role='img']") || el;

        // แนบทีละรูป — ยืนยันด้วยจำนวนแนบที่เพิ่มขึ้น (ไม่ใช่แค่ "มีรูปแล้ว")
        const attached = await addTileToPrompt(media);
        // Flow can commit the chip asynchronously after the helper's retries;
        // give its Frames editor a final observation window before failing.
        if (!attached) await sleep(1500);
        // Flow may update its AX/Frames attachment buttons after the menu
        // action resolves; accept the attachment once the visible count
        // reaches the number expected for this item.
        const verifiedCount = promptAttachmentCount();
        const expectedCount = Math.min(target, done.size + 1);
        const flowConfirmedBatch = target > 1 && flowIngredientButtonCount() >= target;
        if (!attached && verifiedCount < expectedCount && !flowConfirmedBatch) {
            throw new Error(`เลือกภาพแล้ว แต่กด Add to prompt ไม่สำเร็จ (media=${tileLabel})`);
        }

        done.add(id);
        log(`✅ แนบรูป media ${tileLabel} สำเร็จ (${done.size}/${target})`);
        await jitter(800, 1500);
        if (document.querySelector('[role="menu"][data-state="open"]')) {
            document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
            await sleep(200);
        }
    }
    return [...done];
}

// ล้างรูปที่แนบไว้ใน prompt panel ทั้งหมด (กดปุ่ม remove/cancel ของแต่ละรูป)
async function clearPromptAttachments() {
    const panel = getPromptPanel();
    if (!panel) return;
    let removed = 0;
    for (let i = 0; i < 12; i++) {
        const removeBtns = (typeof queryAllIncludingShadowRoots === "function"
            ? queryAllIncludingShadowRoots(
                "button[aria-label*='cancel' i],button[aria-label*='remove' i],button[aria-label*='delete' i],button[aria-label*='clear' i],button[aria-label*='ลบ'],button:has(.google-symbols:is([data-icon='close'], [data-icon='cancel']))"
              )
            : [...panel.querySelectorAll(
            "button[aria-label*='cancel' i],button[aria-label*='remove' i],button[aria-label*='delete' i],button[aria-label*='clear' i],button[aria-label*='ลบ'],button:has(.google-symbols:is([data-icon='close'], [data-icon='cancel']))"
              )]);
        let clicked = false;
        for (const btn of removeBtns) {
            if (isVisible(btn)) {
                try { btn.click(); } catch(e) {}
                await humanClick(btn);
                removed += 1;
                clicked = true;
                await sleep(300);
                break;
            }
        }
        if (!clicked) break;
    }
    if (removed) log(`ล้างรูปแนบเดิม ${removed} รูปออกจาก prompt แล้ว`);
}

async function clearAllPromptAttachmentsVerified() {
    // Flow's Frames editor can retain an uploaded image in the Start slot even
    // when its internal remove controls are hidden in a closed component. Use
    // the editor's atomic Clear prompt action first so both Start and End are
    // empty before placing the newly generated still.
    const atomicClear = byText(["Clear prompt", "ล้าง prompt"]);
    if (atomicClear && isVisible(atomicClear)) {
        await humanClick(atomicClear);
        await sleep(700);
    }
    for (let attempt = 1; attempt <= 3; attempt += 1) {
        await clearPromptAttachments();
        if (promptAttachmentCount() === 0) return true;
        const clearBtn = byText(["Clear prompt", "ล้าง prompt", "ล้างรูปแนบ"]);
        if (clearBtn && isVisible(clearBtn)) {
            await humanClick(clearBtn);
            await sleep(500);
        }
    }
    return promptAttachmentCount() === 0;
}

async function switchMediaTab(tabIcon) {
    let tabBtn;
    if (tabIcon === "image") {
        // แท็บภาพที่เจน — ห้ามไปโดนปุ่ม upload ("Upload images" มีคำว่า image)
        tabBtn = findImageLibraryTab();
    } else {
        tabBtn = byIcon(tabIcon) || byText(["View uploaded media", "Uploaded", "Uploads", "อัปโหลด"]);
    }
    if (tabBtn) {
        await humanClick(tabBtn);
        await sleep(1200);
    }
}

// หาแท็บคลัง "Images"/"All Media" โดยตัดปุ่มที่เกี่ยวกับ upload ออก
function findImageLibraryTab() {
    const labels = ["view images", "images", "all media", "generated", "รูปภาพ"];
    for (const el of document.querySelectorAll("button,[role='button'],[role='tab'],a,div[tabindex]")) {
        if (!isVisible(el)) continue;
        const t = elementText(el).toLowerCase();
        if (/upload|อัปโหลด/.test(t)) continue;
        if (labels.some(l => t.includes(l))) return el;
    }
    return null;
}

function flowFrameSlotButton(label) {
    const wanted = String(label || "").trim().toLowerCase();
    const buttons = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("button,[role='button']")
        : [...document.querySelectorAll("button,[role='button']")];
    return buttons.find(btn => {
        if (!isVisible(btn)) return false;
        const text = elementText(btn).trim().toLowerCase();
        const aria = (btn.getAttribute("aria-label") || "").trim().toLowerCase();
        return text === wanted || aria === wanted || aria === `${wanted} frame`;
    }) || null;
}

function framePickerSearchInput() {
    const root = framePickerRoot();
    const fields = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("input,textarea", root || document)
        : [...(root || document).querySelectorAll("input,textarea")];
    return fields.find(field => isVisible(field) && /search assets|ค้นหาสื่อ/i.test(
        `${field.getAttribute("placeholder") || ""} ${field.getAttribute("aria-label") || ""}`
    )) || null;
}

function framePickerRoot() {
    const roots = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("[role='dialog'],[aria-modal='true']")
        : [...document.querySelectorAll("[role='dialog'],[aria-modal='true']")];
    const match = roots.find(root => isVisible(root) && /select a frame image|เลือกภาพเฟรม/i.test(elementText(root)));
    if (match) return match;
    const heading = (typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("h1,h2,h3,[role='heading']")
        : [...document.querySelectorAll("h1,h2,h3,[role='heading']")])
        .find(node => isVisible(node) && /select a frame image|เลือกภาพเฟรม/i.test(elementText(node)));
    let node = heading;
    for (let i = 0; i < 6 && node; i += 1, node = node.parentElement) {
        if (isVisible(node) && node.getBoundingClientRect().height > 180) return node;
    }
    return null;
}

function framePickerAddButton() {
    const root = framePickerRoot();
    const buttons = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("button,[role='button']", root || document)
        : [...(root || document).querySelectorAll("button,[role='button']")];
    return buttons.find(btn => isVisible(btn) && /^(?:add to prompt|เพิ่มไปยังพรอมต์)$/i.test(elementText(btn).trim())) || null;
}

function setNativeTextValue(field, value) {
    if (!field) return false;
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(field, value);
    else field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
}

function framePickerShowsResult(result, label = "") {
    const root = framePickerRoot() || document;
    const keys = [result?.mediaUrl, result?.tileId, result?.key, result?.href].filter(Boolean).map(String);
    const mediaNodes = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("img,video", root)
        : [...root.querySelectorAll("img,video")];
    if (mediaNodes.some(node => {
        const src = node.currentSrc || node.src || node.getAttribute("src") || "";
        return src && keys.some(key => sameMediaUrl(src, key) || src.includes(key));
    })) return true;
    const pickerText = elementText(root).toLowerCase();
    return Boolean(label && pickerText.includes(label.toLowerCase()));
}

async function addGeneratedStillViaMoreMenu(tile) {
    if (promptAttachmentCount() !== 0) {
        throw new Error("Prompt วิดีโอยังมีภาพแนบเดิม จึงไม่เพิ่มภาพใหม่");
    }
    await closeAnyOpenMenu();
    await rightClick(tile);
    let menuItem = await waitForAddToPromptMenuItem(2000);
    if (!menuItem) {
        await closeAnyOpenMenu();
        const debuggerReady = await chrome.runtime.sendMessage({ type: "FLOW_DEBUGGER_ATTACH" });
        if (!debuggerReady?.ok) throw new Error("เปิดการควบคุมเมาส์เพื่อ hover ภาพไม่สำเร็จ");
        await sleep(800);
        const bounds = tile.getBoundingClientRect();
        const hover = await chrome.runtime.sendMessage({
            type: "FLOW_HOVER_POINT",
            payload: { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 }
        });
        if (!hover?.ok || !hover.hovered) throw new Error("Hover การ์ดภาพที่เจนใหม่ไม่สำเร็จ");
        log("เลื่อนเมาส์บนภาพที่เจนใหม่ แล้วเปิด More (…) → Add to prompt");
        let moreButton = null;
        const deadline = Date.now() + 4000;
        while (Date.now() < deadline && !moreButton) {
            moreButton = queryAllIncludingShadowRoots("button,[role='button']", tile).find(button => {
                if (!isVisible(button)) return false;
                const label = elementText(button).trim();
                return /^(?:more(?: options)?|more_horiz|more_vert|⋮|⋯|เพิ่มเติม)$/i.test(label) ||
                    /^(?:more(?: options)?|เพิ่มเติม)$/i.test(button.getAttribute("aria-label") || "") ||
                    /^(?:more(?: options)?|เพิ่มเติม)$/i.test(button.getAttribute("title") || "") ||
                    [...button.querySelectorAll(".google-symbols,.material-symbols-outlined,i")]
                        .some(icon => /^more_(?:horiz|vert)$/.test(icon.textContent.trim()));
            });
            if (!moreButton) await sleep(150);
        }
        if (!moreButton) throw new Error("ไม่พบปุ่ม More (…) บนการ์ดภาพที่เจนใหม่");
        await humanClick(moreButton);
        menuItem = await waitForAddToPromptMenuItem(3000);
    }
    if (!menuItem) {
        await closeAnyOpenMenu();
        throw new Error("ไม่พบ Add to prompt ในเมนู More ของภาพที่เจนใหม่");
    }
    await clickPromptMenuItem(menuItem);
    const attached = await waitPromptAttachment(0, 6000);
    await closeAnyOpenMenu();
    if (!attached || promptAttachmentCount() !== 1) {
        throw new Error("แนบภาพที่สร้างเสร็จเข้า prompt วิดีโอไม่สำเร็จ จึงไม่กด Generate วิดีโอ");
    }
    if (!flowFrameSlotButton("end")) {
        throw new Error("ภาพถูกใส่ End ด้วย จึงหยุดก่อนกด Generate วิดีโอ");
    }
    return true;
}

// Attach the exact generated tile using its More (…) → Add to prompt menu.
async function addGeneratedStillToPrompt(result) {
    // Video must reference the exact still returned by the completed image
    // generation. Never fall back to the newest visible image: Flow's media
    // grid also contains the uploaded source tiles, and choosing one here
    // silently produces a video from the wrong reference.
    if (!result || (!result.tileId && !result.key && !result.mediaUrl && !result.href)) {
        throw new Error("ผลลัพธ์ภาพที่เจนใหม่ไม่มีตัวระบุ media ที่ตรวจสอบได้");
    }
    const resultKeys = [result.tileId, result.key, result.mediaUrl, result.href].filter(Boolean);
    if (resultKeys.some(isPreGenerationMediaKey)) {
        throw new Error("ผลลัพธ์ภาพที่เลือกเป็นภาพอัปโหลดเดิม ไม่ใช่ภาพที่เจนใหม่");
    }
    // Direct Flow polling returns the exact tile host even when the tile lives
    // inside a closed component. Prefer that host, then require an exact DOM
    // identity match; never substitute another visible image.
    const directEl = result.el && result.el.isConnected !== false ? result.el : null;
    const el = directEl || findMediaCard(result);
    if (!el) throw new Error("ไม่พบการ์ดภาพที่เจนใหม่แบบตรงรายการเพื่อแนบเข้า prompt วิดีโอ");
    const resolvedCard = describeMediaCard(el);
    const resolvedKeys = [resolvedCard?.tileId, resolvedCard?.key, resolvedCard?.mediaUrl, resolvedCard?.href].filter(Boolean);
    if (resolvedKeys.some(isPreGenerationMediaKey)) {
        throw new Error("การ์ดภาพสำหรับวิดีโอชี้ไปยังภาพอัปโหลดเดิม จึงหยุดก่อนกด Generate");
    }
    el.scrollIntoView({ block: "center", behavior: "instant" });
    await sleep(600);
    await addGeneratedStillViaMoreMenu(el);
    log("✅ ภาพที่เจนล่าสุดถูกใส่ใน Start แล้ว (End ยังว่าง)");
    return true;
}

async function addTileToPrompt(media) {
    for (let attempt = 1; attempt <= 4; attempt++) {
        const beforeAttachCount = promptAttachmentCount();
        log(`กำลังแนบภาพเข้า Prompt (รอบที่ ${attempt}/4, รูปที่แนบอยู่แล้ว: ${beforeAttachCount})...`);

        // Always close any stale menu first. It may still belong to an
        // uploaded source; the fresh menu below must be opened on `media`.
        await closeAnyOpenMenu();
        await sleep(200);

        // 2. คลิกขวา (Context Menu) ที่ตัวภาพหรือการ์ดภาพ
        await rightClick(media);
        let menuItem = await waitForAddToPromptMenuItem(3000);
        if (menuItem) {
            log("🎯 พบปุ่ม 'Add to prompt' จากการคลิกขวา ทำการคลิก...");
            await clickPromptMenuItem(menuItem);
            if (beforeAttachCount > 0) {
                await sleep(700);
                await closeAnyOpenMenu();
                return true;
            }
            if (await waitPromptAttachment(beforeAttachCount)) {
                await closeAnyOpenMenu();
                return true;
            }
            if (beforeAttachCount > 0) {
                await sleep(700);
                await closeAnyOpenMenu();
                return true;
            }
        }

        // 3. ถ้าคลิกขวาไม่ขึ้น ให้ลอง Hover ที่การ์ดเพื่อหาปุ่ม More options (...)
        const tile = media.closest("[data-tile-id], flow-grid-tile-container, article, [role='listitem'], [draggable='true']") || media.parentElement;
        if (tile) {
            tile.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, cancelable: true }));
            tile.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true }));
            await sleep(300);

            const moreBtn = tile.querySelector(
                "button[aria-label*='more' i], button[aria-label*='option' i], button[title*='more' i], button:has(.google-symbols), button:has(svg)"
            );
            if (moreBtn && isVisible(moreBtn)) {
                log("คลิกปุ่ม More options (...) บนการ์ดภาพ...");
                await humanClick(moreBtn);
                menuItem = await waitForAddToPromptMenuItem(3000);
                if (menuItem) {
                    log("🎯 พบปุ่ม 'Add to prompt' จาก More options ทำการคลิก...");
                    await clickPromptMenuItem(menuItem);
                    if (beforeAttachCount > 0) {
                        await sleep(700);
                        await closeAnyOpenMenu();
                        return true;
                    }
                    if (await waitPromptAttachment(beforeAttachCount)) {
                        await closeAnyOpenMenu();
                        return true;
                    }
                    if (beforeAttachCount > 0) {
                        await sleep(700);
                        await closeAnyOpenMenu();
                        return true;
                    }
                }
            }
        }

        // 4. Fallback ผ่าน Background CDP Accessibility Tree
        try {
            log("ลองส่งคำสั่งคลิก Add to prompt ผ่าน CDP Bridge...");
            const cdpRes = await chrome.runtime.sendMessage({ type: "FLOW_CLICK_ADD_TO_PROMPT" });
            if (cdpRes?.ok && cdpRes?.clicked) {
                log("CDP กดคลิก Add to prompt แล้ว รอผลลัพธ์การแนบภาพ...");
                if (beforeAttachCount > 0) {
                    await sleep(700);
                    await closeAnyOpenMenu();
                    return true;
                }
                if (await waitPromptAttachment(beforeAttachCount, 3000)) {
                    await closeAnyOpenMenu();
                    return true;
                }
            }
        } catch (e) {
            console.warn("[FlowAuto] CDP bridge error:", e);
        }

        // 5. Fallback: Drag & Drop การ์ดไปยังช่อง Prompt
        if (await dragTileToPrompt(media, beforeAttachCount)) {
            await closeAnyOpenMenu();
            return true;
        }

        await closeAnyOpenMenu();
        if (attempt < 4) {
            log(`⚠️ แนบรูปเข้า prompt ไม่ติด รอสักครู่แล้วลองใหม่ (รอบ ${attempt + 1}/4)...`);
            await sleep(800);
        }
    }

    return false;
}

// หาองค์ประกอบปุ่ม/เมนู "Add to prompt" ในทุกรูปแบบของ UI ใหม่และเก่า
function findAddToPromptMenuItem() {
    // Priority 1: หาจาก Selector ของเมนูรายการมาตรฐาน
    const itemSelectors = [
        '[role="menuitem"]',
        '[role="option"]',
        '[data-radix-collection-item]',
        '[class*="menu-item" i]',
        '[class*="menuitem" i]',
        '[class*="dropdown-item" i]',
        '[class*="Item" i]',
        'button',
        'li',
        'div[tabindex]'
    ];

    for (const sel of itemSelectors) {
        try {
            const nodes = document.querySelectorAll(sel);
            for (const node of nodes) {
                if (!isVisible(node)) continue;
                // ตัดการ์ด prompt ด้านล่างออก
                if (node.closest('div[role="textbox"]') || node.closest('form[class*="prompt"]')) continue;
                const text = elementText(node).toLowerCase();
                // ต้องมีข้อความ Add to prompt หรือภาษาไทย แต่ต้องไม่ใช่ตัวคอนเทนเนอร์เมนูใหญ่ที่รวมข้อความทั้งเมนู
                if ((text.includes("add to prompt") || text.includes("เพิ่มไปยังพรอมต์") || text.includes("use as input")) &&
                    !text.includes("favorite") && !text.includes("move to trash") && !text.includes("download")) {
                    return node;
                }
            }
        } catch (e) {}
    }

    // Priority 2: ตรวจหา Text โดยตรงจาก Node ย่อย (span, p, div)
    const all = document.querySelectorAll('span, p, div, a');
    const candidates = [];
    for (const el of all) {
        if (!isVisible(el)) continue;
        if (el.closest('div[role="textbox"]') || el.closest('form[class*="prompt"]')) continue;
        const raw = (el.textContent || "").trim();
        const text = raw.toLowerCase();

        if (text === "add to prompt" || raw === "เพิ่มไปยังพรอมต์" || text === "use as input") {
            const clickable = el.closest('button, [role="menuitem"], [role="button"], [data-radix-collection-item], li, div[tabindex], div') || el;
            candidates.push({ el: clickable, len: raw.length, exact: true });
        } else if ((text.includes("add to prompt") || text.includes("เพิ่มไปยังพรอมต์")) &&
                   !text.includes("favorite") && !text.includes("move to trash") && raw.length < 50) {
            const clickable = el.closest('button, [role="menuitem"], [role="button"], [data-radix-collection-item], li, div[tabindex], div') || el;
            candidates.push({ el: clickable, len: raw.length, exact: false });
        }
    }

    if (candidates.length > 0) {
        candidates.sort((a, b) => (b.exact - a.exact) || (a.len - b.len));
        return candidates[0].el;
    }

    return null;
}

async function waitForAddToPromptMenuItem(timeoutMs = 3500) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        const item = findAddToPromptMenuItem();
        if (item && isVisible(item)) return item;
        await sleep(150);
    }
    return null;
}

async function clickPromptMenuItem(menuItem) {
    if (!menuItem) return false;
    menuItem.scrollIntoView({ block: "nearest", behavior: "instant" });
    await sleep(100);

    // Dispatch exactly once. Multiple fallbacks here caused Flow Frames to
    // consume the same image twice, filling both Start and End.
    menuItem.click();
    await sleep(350);
    return true;
}

async function closeAnyOpenMenu() {
    // ส่งปุ่ม Escape ไปยัง document และ window
    document.body?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));

    // ปิดเมนูที่เปิดอยู่
    const openMenus = document.querySelectorAll('[role="menu"], [role="menu"][data-state="open"], [popover], [data-radix-popper-content-wrapper]');
    for (const m of openMenus) {
        if (isVisible(m)) {
            m.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }));
        }
    }
    await sleep(200);
}

function getPromptPanel() {
    const editor = findPromptEditor();
    if (!editor) return null;
    let node = editor;
    // เดินขึ้นไปหา container แถบ Prompt ด้านล่าง (ไม่เกิน 5 ชั้น และไม่หลุดไปครอบทั้งหน้าเว็บ)
    for (let i = 0; i < 5 && node && node !== document.body; i++) {
        const hasCreateButton = Boolean(
            [...node.querySelectorAll?.("button,[role='button']") || []].some(btn => {
                const label = elementText(btn).toLowerCase();
                const icon = [...btn.querySelectorAll("i,.google-symbols,.material-icons,svg")]
                    .map(n => (n.textContent || "").toLowerCase())
                    .join(" ");
                return label.includes("arrow_forward") || label.includes("create") || label.includes("generate") ||
                       icon.includes("arrow_forward") || btn.querySelector("svg");
            })
        );
        const rect = node.getBoundingClientRect();
        // แถบ Prompt มีความสูงสมเหตุสมผล (< 350px) และอยู่ด้านล่าง
        if (hasCreateButton && rect.height > 30 && rect.height < 350) {
            return node;
        }
        node = node.parentElement;
    }
    return editor.closest("form") || editor.parentElement?.parentElement || editor.parentElement;
}

function getPromptAttachmentElements() {
    const panel = getPromptPanel();
    if (!panel) return [];

    const attachments = [];

    // 1. ตรวจหาปุ่มลบ/ยกเลิกรูปแนบในการ์ด Prompt
    const removeBtns = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("button[aria-label*='cancel' i],button[aria-label*='remove' i],button[aria-label*='delete' i],button[aria-label*='clear' i],button[aria-label*='ลบ'],button:has(.google-symbols:is([data-icon='close'], [data-icon='cancel']))")
        : [...panel.querySelectorAll("button[aria-label*='cancel' i],button[aria-label*='remove' i],button[aria-label*='delete' i],button[aria-label*='clear' i],button[aria-label*='ลบ'],button:has(.google-symbols:is([data-icon='close'], [data-icon='cancel']))")];
    for (const btn of removeBtns) {
        if (!isVisible(btn)) continue;
        const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
        if (/cancel|remove|delete|clear|ลบ|close/i.test(aria) || btn.querySelector('[data-icon="close"], [data-icon="cancel"]')) {
            // In Flow's closed components, closest()/contains() cannot cross
            // the shadow boundary. Use the remove control itself as the
            // canonical one-per-attachment marker to avoid double counting.
            const chip = btn;
            if (!attachments.includes(chip)) attachments.push(chip);
        }
    }

    // Remove controls are authoritative; do not add their nested thumbnails
    // a second time below.
    if (attachments.length > 0) return attachments;

    // 2. ตรวจหารูปหรือวิดีโอที่เป็น thumbnail ในแถบ Prompt (ตัด Avatar ผู้ใช้ออก)
    const medias = panel.querySelectorAll("img, video");
    for (const m of medias) {
        if (!isVisible(m)) continue;
        const alt = (m.alt || "").toLowerCase();
        if (alt.includes("google account") || alt.includes("profile") || alt.includes("avatar")) continue;
        const rect = m.getBoundingClientRect();
        if (rect.width < 16 || rect.height < 16) continue;
        if (!attachments.some(a => a === m || a.contains(m))) {
            attachments.push(m);
        }
    }

    return attachments;
}

function flowIngredientButtonCount() {
    const buttons = typeof queryAllIncludingShadowRoots === "function"
        ? queryAllIncludingShadowRoots("button,[role='button']")
        : [...document.querySelectorAll("button,[role='button']")];
    return buttons
        .filter(btn => isVisible(btn) && /^ingredient$/i.test(elementText(btn).trim())).length;
}

function promptAttachmentCount() {
    const detected = getPromptAttachmentElements().length;
    // Flow's current Frames editor exposes each attached chip as a plain
    // button labelled "Ingredient" outside the prompt panel's DOM subtree.
    // Include those buttons so a successful second attachment is not falsely
    // reported as a failed Add to prompt operation.
    const ingredientButtons = flowIngredientButtonCount();
    return Math.max(detected, ingredientButtons);
}

function promptHasMediaAttachment() {
    return promptAttachmentCount() > 0;
}

async function waitPromptAttachment(beforeCount, timeoutMs = 10000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        const current = promptAttachmentCount();
        if (current > beforeCount) return true;
        if (beforeCount === 0 && current > 0) return true;
        await sleep(200);
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
    return findAddToPromptMenuItem() || null;
}

function findAddButtonNear(media) {
    return null;
}

function findAddButton(root, anchor) {
    return null;
}

// ── 6. setPrompt (paste → human word-by-word fallback) ─────────────
/** Simulate human typing by inserting prompt word-by-word with random pauses */
async function humanTypeWords(prompt) {
    // Split on newlines first, then words
    const segments = prompt.split("\n");
    for (let s = 0; s < segments.length; s++) {
        if (stopRequested) return;
        if (s > 0) {
            document.execCommand("insertLineBreak", false, null);
            await sleep(120 + Math.random() * 180);
        }
        const words = segments[s].split(" ").filter(Boolean);
        for (let i = 0; i < words.length; i++) {
            if (stopRequested) return;
            const word = words[i] + (i < words.length - 1 ? " " : "");
            document.execCommand("insertText", false, word);
            // Short pause after each word (40–130ms)
            await sleep(40 + Math.random() * 90);
            // Occasional longer thinking pause every 8-15 words
            if (i > 0 && i % (8 + Math.floor(Math.random() * 7)) === 0) {
                await sleep(300 + Math.random() * 500);
            }
        }
    }
}


async function setPrompt(prompt) {
    const editor = await waitForPromptEditor(15000);
    if (!editor) throw new Error("หาช่องพิมพ์ prompt ไม่เจอ");

    // ปิด debugger ก่อนคลิกช่องกรอก เพื่อเคลียร์แถบเหลืองแจ้งเตือน (infobar) ไม่ให้ดันหน้าต่างขยับ
    await detachFlowDebugger();
    await sleep(400);

    editor.scrollIntoView({ behavior: "smooth", block: "center" });
    await sleep(600 + Math.random() * 400);
    await humanClick(editor);
    await sleep(500 + Math.random() * 300);

    if (editor.matches('[data-slate-editor="true"]')) {
        await typeSlate(editor, prompt);
    } else if (editor.matches(".public-DraftEditor-content")) {
        await typeDraft(editor, prompt);
    } else if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        await typePlainInput(editor, prompt);
    } else {
        await typeContentEditable(editor, prompt);
    }

    await sleep(1200);
    const typed = getPromptText(editor);
    const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(28, prompt.length));
    if (!typed.replace(/\s+/g, "").includes(needle)) {
        throw new Error("กรอก prompt ใน Google Flow ไม่สำเร็จ จึงไม่กด Generate");
    }
    log("✅ กรอก Prompt สำเร็จ");
    await detachFlowDebugger();
    log("รอสักครู่เพื่อความเสถียรของหน้าต่างและให้เหมือนคน...");
    await sleep(1000 + Math.random() * 500); // ดีเลย์สุ่มรอบการพิมพ์สั้นๆ ให้สอดคล้องกับคนพิมพ์เสร็จแล้วเตรียมกด
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
            if (aria.includes("what do you want") || text.includes("what do you want")) score += 85;
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
    document.execCommand("insertText", false, prompt);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
}

function getTextNodes(node) {
    const textNodes = [];
    if (node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
    } else {
        for (const child of node.childNodes) {
            textNodes.push(...getTextNodes(child));
        }
    }
    return textNodes;
}

function focusAndPlaceCursor(editor) {
    try {
        editor.focus();
        editor.click();
    } catch (e) {}
    const selection = window.getSelection();
    const range = document.createRange();
    
    const p = editor.querySelector('p, [data-slate-node="element"], [data-slate-leaf="true"]') || editor;
    try {
        range.selectNodeContents(p);
        range.collapse(true); // places cursor at the beginning
        selection?.removeAllRanges();
        selection?.addRange(range);
        return true;
    } catch (e) {
        console.warn("[FlowAuto] failed to set cursor selection:", e);
    }
    return false;
}

async function typeSlate(editor, prompt) {
    // 1. เลื่อนมาตรงกลางและโฟกัสช่องกรอก
    editor.scrollIntoView({ behavior: "instant", block: "center" });
    await sleep(200);
    
    // คลิกปุ่มตรงกลางด้วย debugger เพื่อปักหมุดโฟกัสจริงในโมเดล Slate/React
    log("คลิกปุ่มตรงกลางด้วย debugger เพื่อโฟกัส Slate...");
    await clickButtonCenterWithDebugger(editor);
    await sleep(300);

    const textNodes = getTextNodes(editor);
    const isEmpty = textNodes.length === 0 || editor.textContent.trim() === "";

    // วิธีที่ 1: ใช้ Debugger เป็นวิธีหลักเพื่ออัปเดต React State ของ Slate แน่นอนและหลีกเลี่ยงการ unmount/หน้าจอพัง
    try {
        log("กรอก Prompt ด้วยระบบ Debugger (เพื่อความเสถียรของ Slate/React)...");
        // ระบบ Debugger จะทำการล้างข้อมูลแบบปลอดภัย (Cmd+A + Backspace) และกรอกข้อความให้ผ่านระดับเบราว์เซอร์
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_INSERT_TEXT",
            payload: { text: prompt, clear: true }
        });
        if (response?.ok && response.inserted && await waitForPromptCommit(editor, prompt, 3500)) {
            log("✅ กรอก Prompt เข้า Slate สำเร็จ (Debugger)");
            editor.dispatchEvent(new Event("change", { bubbles: true }));
            await detachFlowDebugger();
            await sleep(500);
            return;
        }
    } catch (e) {
        console.warn("[FlowAuto] Debugger insert failed, falling back to other methods:", e);
    }

    // วิธีที่ 2: ลองใช้ execCommand แทรกข้อความธรรมดา (กรณีตัวตรวจจับ Debugger พลาด)
    try {
        log("ใช้ execCommand แทรกข้อความธรรมดา...");
        if (!isEmpty) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNodes[0], 0);
            const lastNode = textNodes[textNodes.length - 1];
            range.setEnd(lastNode, lastNode.length);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
        document.execCommand("insertText", false, prompt);
        editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
        editor.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(500);
        if (await waitForPromptCommit(editor, prompt, 2500)) {
            log("✅ กรอก Prompt สำเร็จ (DOM execCommand)");
            return;
        }
    } catch (e) { console.warn("[FlowAuto] execCommand failed:", e); }

    // วิธีที่ 3: ลองใช้ Clipboard Paste event จำลองการวางข้อความ
    try {
        log("ใช้ Clipboard Paste event...");
        if (!isEmpty) {
            const range = document.createRange();
            const selection = window.getSelection();
            range.setStart(textNodes[0], 0);
            const lastNode = textNodes[textNodes.length - 1];
            range.setEnd(lastNode, lastNode.length);
            selection?.removeAllRanges();
            selection?.addRange(range);
        }
        const dt = new DataTransfer(); dt.setData("text/plain", prompt);
        editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        await sleep(500);
        if (await waitForPromptCommit(editor, prompt, 2500)) {
            log("✅ กรอก Prompt สำเร็จ (Paste Event)");
            return;
        }
    } catch (e) { console.warn("[FlowAuto] paste failed:", e); }

    // ตรวจสอบขั้นสุดท้าย
    if (!await waitForPromptCommit(editor, prompt, 1000)) {
        throw new Error("กรอก prompt ใน Slate ไม่สำเร็จ");
    }
}


function selectEditableContents(editor) {
    editor.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);
}

async function waitForPromptCommit(editor, prompt, timeoutMs) {
    const needle = prompt.replace(/\s+/g, "").slice(0, Math.min(30, prompt.length));
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        const inserted = (editor.textContent || "").replace(/\s+/g, "");
        if (inserted.includes(needle)) {
            await sleepStop(250);
            return true;
        }
        await sleep(100);
    }
    return false;
}

async function typeDraft(editor, prompt) {
    editor.focus(); await sleep(150 + Math.random() * 100);
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, "");
    await sleep(100 + Math.random() * 100);
    await humanTypeWords(prompt);
    await sleepStop(2000);
}

// ── 7. clickGenerate ─────────────────────────────────────────
async function clickGenerate() {
    log("รอปุ่ม Generate พร้อมกด...");

    // ปิด debugger ก่อนกดเจนเพื่อให้ infobar หายไปและระดับหน้าจอกลับมาปกติ
    await detachFlowDebugger();
    await sleep(1000);


    preGenMediaKeys = new Set([...snapMediaKeys(), ...snapDirectTileKeys()]);
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
    
    // มีการ์ดใหม่แล้ว = เริ่มเจนแล้ว ห้ามกดซ้ำ (กันเจนภาพ 2รอบ)
    const generationStarted = () => getMediaCards().some(card => card.key && !preGenMediaKeys.has(card.key));

    // Submit exactly once. Flow may delay its DOM/card update for several
    // seconds; retrying with DOM click/Enter/trusted click creates duplicates.
    log("ลองกด Generate แบบปกติ (human click) — one-shot...");
    await humanClick(btn);
    await waitGenerationStarted(btn, 3500);
    log("✅ ส่งคำสั่ง Generate แล้ว (ไม่กดซ้ำ)");
    return true;
}

async function clickButtonCenterWithDebugger(button) {
    try {
        await chrome.runtime.sendMessage({ type: "FLOW_DEBUGGER_ATTACH" });
        await sleep(800); // รอให้แถบ "Extension started debugging" ดันหน้าจอลงมาให้เรียบร้อยก่อนวัดพิกัด
    } catch (e) {
        console.warn("[FlowAuto] failed to attach debugger beforehand:", e);
    }

    try {
        const rect = button.getBoundingClientRect();
        const x = Math.round(rect.left + rect.width / 2);
        const y = Math.round(rect.top + rect.height / 2);
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_CLICK_POINT",
            payload: { x, y }
        });
        if (response?.ok && response.clicked) return true;
        console.warn("[FlowAuto] trusted click failed response:", response);
    } catch (error) {
        console.warn("[FlowAuto] trusted click failed:", error);
    } finally {
        await detachFlowDebugger();
    }
    return false;
}

function findPromptSubmitButtons() {
    const editor = findPromptEditor();
    const editorRect = editor?.getBoundingClientRect();
    const candidates = [];

    for (const button of document.querySelectorAll("button,[role='button']")) {
        if (!isVisible(button) || button.getAttribute("aria-haspopup")) continue;

        const iconNames = [...button.querySelectorAll("i,.google-symbols,.material-icons")]
            .map(node => (node.textContent || "").trim().toLowerCase());
        const labelParts = [
            button.getAttribute("aria-label"),
            button.getAttribute("title"),
            ...[...button.querySelectorAll("span")].map(node => node.textContent)
        ].filter(Boolean).map(value => value.replace(/\s+/g, " ").trim().toLowerCase());
        const hasSubmitIcon = iconNames.some(name => name === "arrow_forward" || name === "send");
        const hasSubmitLabel = labelParts.some(label =>
            label === "create" || label === "generate" || label === "สร้าง"
        );
        if (!hasSubmitIcon && !hasSubmitLabel) continue;

        let insideComposer = !editor;
        for (let node = editor, depth = 0; node && depth < 10; node = node.parentElement, depth++) {
            if (node.contains(button)) {
                insideComposer = true;
                break;
            }
        }

        const rect = button.getBoundingClientRect();
        const nearEditor = Boolean(
            editorRect
            && Math.abs((rect.top + rect.height / 2) - (editorRect.top + editorRect.height / 2)) < 180
        );
        if (!insideComposer && !nearEditor) continue;

        candidates.push({
            button,
            score: (hasSubmitIcon ? 100 : 0) + (hasSubmitLabel ? 50 : 0) + (insideComposer ? 25 : 0)
        });
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.map(candidate => candidate.button);
}

function findGenerateButton() {
    return findPromptSubmitButtons().find(button =>
        !button.disabled && button.getAttribute("aria-disabled") !== "true"
    ) || null;
}

function findDisabledGenerateButton() {
    return findPromptSubmitButtons().find(button =>
        button.disabled || button.getAttribute("aria-disabled") === "true"
    ) || null;
}

async function waitGenerationStarted(button, timeoutMs = 7000) {
    const end = Date.now() + timeoutMs;
    let disabledSince = 0;
    while (Date.now() < end) {
        if (stopRequested) return false;
        const disabled = button.disabled || button.getAttribute("aria-disabled") === "true";
        // การ์ดใหม่ใดๆ ที่โผล่หลังกด = เริ่มเจนแล้ว (ไม่ต้องรอ % progress)
        // กัน false-negative ที่ทำให้กด Generate ซ้ำ → เจนภาพ 2 รอบ
        const hasNewCard = getMediaCards().some(card => card.key && !preGenMediaKeys.has(card.key));
        if (disabled) {
            if (!disabledSince) disabledSince = Date.now();
        } else {
            disabledSince = 0;
        }
        if (hasNewCard || (disabledSince && Date.now() - disabledSince >= 500)) {
            log("✅ Flow เริ่มสร้างแล้ว");
            return true;
        }
        await sleep(350);
    }
    return false;
}

// ── 8. waitForResult ─────────────────────────────────────────
async function waitForResult(phase, options = {}) {
    const maxRetryAttempts = 1;
    // Image generation can legitimately take several minutes even while Flow
    // shows a temporary Failed/percentage state. Give it enough time to settle.
    const maxMs = phase === "image" ? 300000 : 480000;
    const progressGraceMs = 25000;
    // Flow can briefly mark queued Veo jobs as Failed, then replace the same
    // cards with playable videos. Keep waiting long enough for that late result.
    const failureGraceMs = phase === "video" ? 90000 : 120000;
    let retryAttempts = 0;
    let startedAt = Date.now();
    let end = Date.now() + maxMs;
    let pendingFailure = "";
    let pendingFailedCard = null;
    let failureSeenAt = 0;
    log("รอผลลัพธ์จาก Flow...");
    while (Date.now() < end) {
        if (stopRequested) return { tileId: null, mediaUrl: "" };
        // The new result preview overlay can appear before its media card is
        // surfaced to the DOM/CDP bridge. Dismiss it during polling.
        await closeGeneratedAssetOverlay();
        // Direct selector for the current Flow v2 tile markup. This runs
        // before the legacy card parser, which can miss Angular/Lit tile hosts.
        const tileContainers = [
            ...document.querySelectorAll("flow-grid-tile-container, flow-image-tile, [role='gridcell'], article, div[class*='grid-tile']")
        ];
        let skippedUploadedImage = false;
        for (const host of tileContainers) {
            const label = (host.getAttribute("aria-label") || host.textContent || "").toLowerCase();
            const busy = /(?:\d{1,3}\s*%|generating|rendering|creating|queued|pending|กำลังสร้าง|กำลังเรนเดอร์)/i.test(label);
            if (busy) continue;
            if (label.includes("upload") || label.includes("start creating") || label.includes("drop media")) continue;

            const img = host.querySelector("img");
            const video = host.querySelector("video");

            if (phase === "image" && img) {
                const src = img.currentSrc || img.src || "";
                const alt = (img.alt || "").toLowerCase();
                if (alt.includes("avatar") || alt.includes("profile") || alt.includes("google account")) continue;
                if (!src || src.startsWith("data:image/svg")) continue;
                const mediaId = host.getAttribute("data-tile-id") || img.getAttribute("data-media-id") || src;
                // Uploaded source tiles (for example 1.jpg/2.jpg) can appear
                // before the generated result. Never return one as the image
                // result used for the video's Start frame.
                if (preGenMediaKeys.has(mediaId) || /(?:^|\s)\d+\.jpg(?:\s|$)/i.test(label) || /(?:^|[/_-])\d+\.jpg(?:[?#]|$)/i.test(src)) {
                    skippedUploadedImage = true;
                    continue;
                }
                log("✅ ตรวจพบภาพที่สร้างเสร็จแล้วจาก Flow (ตรวจพบจาก tile container)");
                return { tileId: mediaId, mediaUrl: src, key: mediaId, label, el: host };
            }

            if (phase === "video" && (video || img)) {
                const videoSrc = video?.currentSrc || video?.src || video?.querySelector("source")?.src || "";
                if (videoSrc || (video && video.readyState >= 1) || /\.(mp4|webm|mov)(\?|$)/i.test(videoSrc)) {
                    const mediaId = host.getAttribute("data-tile-id") || videoSrc;
                    log("✅ ตรวจพบวิดีโอที่สร้างเสร็จแล้วจาก Flow (ตรวจพบจาก tile container)");
                    return { tileId: mediaId, mediaUrl: videoSrc, key: mediaId, label, el: host };
                }
            }
        }
        if (phase === "image" && skippedUploadedImage && Date.now() % 5_000 < POLL) {
            log("⏳ พบเฉพาะภาพอัปโหลดเดิม ยังรอภาพที่เจนใหม่จาก Flow");
        }

        // The generated media grid is now inside a closed component. Ask the
        // background CDP bridge for a surfaced thumbnail URL before falling
        // back to the legacy page-DOM cards.
        const cdpResult = await chrome.runtime.sendMessage({
            type: "FLOW_FIND_GENERATED_MEDIA",
            payload: { phase }
        }).catch(() => null);
        if (cdpResult?.found && cdpResult.mediaUrl) {
            log("✅ พบ URL ผลลัพธ์จาก Flow ผ่าน accessibility/CDP bridge");
            return { tileId: cdpResult.key, mediaUrl: cdpResult.mediaUrl, key: cdpResult.key };
        }

        const newCards = getMediaCards()
            .filter(card => card.key && !preGenMediaKeys.has(card.key))
            .map(card => ({ card, status: mediaCardStatus(card) }));

        // Check for completed generated result first to avoid getting stuck by page loading indicators
        let readyResult = null;
        for (const { card, status } of newCards) {
            if (isGeneratedResultCard(card, status, phase)) {
                readyResult = { tileId: card.tileId || card.key, mediaUrl: card.mediaUrl, href: card.href, key: card.key };
                break;
            }
        }
        if (readyResult) {
            log("✅ พบผลลัพธ์ที่สร้างเสร็จแล้ว!");
            return readyResult;
        }

        let failedResult = null;
        let failedCard = null;
        let hasActiveGeneration = false;
        let hasAmbiguousFailure = false;

        for (const { card, status } of newCards) {
            if (status.progress) hasActiveGeneration = true;
            if (status.ambiguousFailure) hasAmbiguousFailure = true;
            if (status.failed && !failedResult) {
                failedResult = mediaCardFailureMessage(card, status);
                failedCard = card;
            }
        }
        if (failedResult) {
            pendingFailure = failedResult;
            pendingFailedCard = failedCard;
        }
        if (hasAmbiguousFailure) {
            // Flow อาจแสดง Failed ชั่วคราวระหว่างที่ backend ยังประมวลผลอยู่
            // โดยเฉพาะตอนการ์ดยังมี % แต่รายละเอียด error ยังไม่ถูกสร้างใน DOM
            hasActiveGeneration = true;
            failureSeenAt = 0;
            log("⏳ Flow แสดง Failed แต่ยังไม่มีสาเหตุ/ผลลัพธ์ — ยังไม่ถือว่าล้มเหลว รอต่อ...");
        }
        if (hasActiveGeneration) {
            // A failed sibling tile can appear while another requested video
            // is still rendering. Do not age or act on that failure yet.
            failureSeenAt = 0;
            const rem = Math.round((end - Date.now()) / 1000);
            log(phase === "video" ? `วิดีโอยังกำลังสร้างอยู่ รอต่อ... (~${rem}s)` : `ภาพยังกำลังสร้างอยู่ รอต่อ... (~${rem}s)`);
            await sleep(1000);
            continue;
        }

        // Check if we are still waiting for progress indicator on any new card
        let inGrace = false;
        for (const { card, status } of newCards) {
            if (!status.progress && !status.ready && Date.now() - startedAt < progressGraceMs) {
                inGrace = true;
                break;
            }
        }
        if (inGrace) {
            log("รอ Flow เริ่มแสดงเปอร์เซ็น...");
            await sleep(1000);
            continue;
        }
        if (pendingFailure) {
            if (!failureSeenAt) failureSeenAt = Date.now();
            const failureAge = Date.now() - failureSeenAt;
            const policyFailure = isProminentPeoplePolicyFailure(pendingFailure);
            const unusualFailure = isUnusualActivityFailure(pendingFailure);
            if (unusualFailure) {
                // นี่เป็นข้อจำกัดจากบริการ ไม่ใช่ transient UI failure การล้าง storage
                // แล้วส่งคำขอเดิมซ้ำทันทีทำให้ session เสียและอาจเพิ่มคำขอที่ถูกปฏิเสธ
                throw new Error(unusualActivityStopMessage(pendingFailure));
            }
            if (!policyFailure && failureAge < failureGraceMs) {
                log(`Flow แสดง Failed ชั่วคราว รอผลลัพธ์สำเร็จอีก ${Math.ceil((failureGraceMs - failureAge) / 1000)}s...`);
                await sleep(1000);
                continue;
            }
            // ด่านสุดท้ายก่อน Retry: เช็คให้แน่ใจว่าไม่มีผลลัพธ์ที่เสร็จจริงอยู่แล้ว
            // กัน Flow โชว์ Failed ชั่วคราวบนการ์ดข้างเคียง ทั้งที่วิดีโอตัวจริงเจนเสร็จแล้ว
            // → ถ้าเจอ result ที่สำเร็จ ให้คืนค่าเลย ไม่รีบเจนซ้ำ
            const confirmed = findReadyGeneratedResult(phase);
            if (confirmed) {
                log("✅ พบผลลัพธ์ที่เสร็จจริงก่อน Retry — ไม่เจนซ้ำ");
                return confirmed;
            }
            if (retryAttempts < maxRetryAttempts) {
                retryAttempts++;
                const retryResult = await retryFailedMediaCard(
                    pendingFailedCard,
                    retryAttempts,
                    maxRetryAttempts,
                    options.restartGeneration
                );
                if (retryResult.started) {
                    startedAt = Date.now();
                    end = Date.now() + maxMs;
                    pendingFailure = "";
                    pendingFailedCard = null;
                    failureSeenAt = 0;
                    continue;
                }
                if (retryResult.error) {
                    pendingFailure = `${pendingFailure}; Retry ไม่สำเร็จ: ${retryResult.error}`;
                }
            }
            throw new Error(pendingFailure);
        }
        const rem = Math.round((end - Date.now()) / 1000);
        log(`รอผลลัพธ์ที่สร้างเสร็จ... (~${rem}s)`);
        await sleep(1000);
    }
    throw new Error(phase === "image"
        ? "รอผลลัพธ์ภาพจาก Google Flow หมดเวลา หรือไม่พบ media tile ใหม่"
        : "รอผลลัพธ์วิดีโอจาก Google Flow หมดเวลา หรือไม่พบ media tile ใหม่");
}

function hasVisibleGenerationIndicator() {
    const hasIndicator = [...document.querySelectorAll("[role='progressbar'],progress,[aria-busy='true']")]
        .some(isVisible);
    if (hasIndicator) return true;

    // ค้นหาสปินเนอร์/ไอคอนโหลดที่มีคลาสหรือบทบาท
    const spinnerSelectors = [
        ".spinner", "[class*='spinner']",
        ".loading", "[class*='loading']",
        ".loader", "[class*='loader']",
        "[class*='progress-bar']", "[class*='progress_bar']",
        "[class*='loading-bar']", "[class*='loading_bar']",
        "[class*='progress-indicator']", "[class*='progress_indicator']",
        "[role='progressbar']", "progress", "[aria-busy='true']"
    ];
    for (const selector of spinnerSelectors) {
        try {
            const spinners = document.querySelectorAll(selector);
            for (const spinner of spinners) {
                if (spinner && isVisible(spinner)) {
                    if (!spinner.closest?.('input, textarea, [contenteditable="true"], [role="textbox"], .public-DraftEditor-content')) {
                        return true;
                    }
                }
            }
        } catch (e) {}
    }

    // ค้นหาข้อความเปอร์เซ็นต์ (0-99%) หรือคำความคืบหน้าจากทุกอิลิเมนต์บนหน้าจอ (ยกเว้นสคริปต์/สไตล์)
    const elements = document.getElementsByTagName("*");
    for (const el of elements) {
        const tagName = el.tagName.toLowerCase();
        if (tagName === "script" || tagName === "style" || tagName === "noscript" || tagName === "iframe") continue;

        const text = (el.textContent || "").trim();
        if (!text) continue;

        // เช็คข้อความความคืบหน้า/เปอร์เซ็นต์ก่อน เพื่อประหยัดการทำงานและป้องกัน Layout Thrashing
        const hasPercent = /(?:^|\W)(?:\d{1,2})\s*%/.test(text) && text.length < 50;
        const hasProgressWord = (text.toLowerCase().includes("generating") || text.toLowerCase().includes("rendering") ||
                                 text.toLowerCase().includes("processing") || text.toLowerCase().includes("uploading") ||
                                 text.includes("กำลังสร้าง") || text.includes("กำลังเรนเดอร์") ||
                                 text.includes("กำลังประมวลผล") || text.includes("กำลังอัปโหลด") ||
                                 text.includes("รอคิว") || text.includes("กำลังรอ")) && text.length < 50;

        if (hasPercent || hasProgressWord) {
            // เช็คความเห็นได้ขององค์ประกอบและการอยู่ในช่องกรอกข้อมูลทีหลัง
            if (!isVisible(el)) continue;
            if (el.closest?.('input, textarea, [contenteditable="true"], [role="textbox"], .public-DraftEditor-content')) {
                continue;
            }
            return true;
        }
    }
    return false;
}

function isGeneratedResultCard(card, status, phase) {
    // New Flow cards can be fully rendered while their media URL is hidden
    // inside the component. Completion is based on rendered card state; URL
    // extraction is a separate best-effort handoff step.
    if (!status.ready) return false;
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

// re-scan การ์ดปัจจุบันหา result ที่สร้างเสร็จจริง (ใช้ยืนยันก่อนตัดสินใจ Retry)
function findReadyGeneratedResult(phase) {
    for (const card of getMediaCards()) {
        if (!card.key || preGenMediaKeys.has(card.key)) continue;
        const status = mediaCardStatus(card);
        if (!isGeneratedResultCard(card, status, phase)) continue;
        return { tileId: card.tileId || card.key, mediaUrl: card.mediaUrl, href: card.href, key: card.key };
    }
    return null;
}

// ── Load settings ────────────────────────────────────────────
async function loadSettings() {
    try {
        const r = await chrome.runtime.sendMessage({ type: "GET_FLOW_SETTINGS" });
        if (r && !r.error) return {
            ...r,
            uploadWaitSec: Math.max(30, Math.min(300, Number(r.uploadWaitSec) || 120))
        };
    } catch { }
    return { videoModel: "veo-3.1-lite-low-priority", imageModel: "nano-banana-pro", autoPortrait: true, uploadWaitSec: 120 };
}

// ── Main pipeline ─────────────────────────────────────────────
async function runPipeline(payload, runOptions = {}) {
    const { phase, prompt, imageUrl, options = {} } = payload;
    const resumeState = runOptions.resumeState;
    const jobId = runOptions.jobId || "";
    stopRequested = false;
    generatedStillMediaKeys = new Set();
    let imageResult = null;
    try {
        log(resumeState ? "ดำเนินการ Auto Flow ต่อหลังรีเฟรช..." : "เริ่ม Auto Flow...");
        watchNotice();
        await closeFlowPanels();
        const cfg = await loadSettings();

        // 1. ไปหน้า project
        log("ตรวจหน้าโปรเจกต์ Google Flow...");
        const ok = await ensureProjectPage(Boolean(resumeState));
        if (!ok) throw new Error("ไม่สามารถเปิดหน้า project ได้ (ตรวจสอบว่า login Google แล้ว)");
        await sleep(5000); // หน่วงเวลา 5 วินาทีหลังเข้าหน้าโปรเจกต์
        dismissIAgree();
        log("ตรวจหน้าต่างที่บังพื้นที่อัปโหลด...");
        await closeFlowPanels({ required: true });
        await sleep(5000); // หน่วงเวลา 5 วินาที

        // 2. ไม่กด filter ใดๆ ในแถบซ้าย (All Media เห็นทุกอย่าง) — อัปโหลดผ่านปุ่ม + ในช่อง prompt
        await closeFlowPanels({ required: true });
        await sleep(5000); // หน่วงเวลา 5 วินาที

        let uploadedTiles = [];
        if (resumeState) {
            uploadedTiles = resumeState.uploadedTiles || [];
            log(`🔄 ใช้รูปภาพสินค้าที่อัปโหลดเสร็จแล้วจากการรีเฟรชหน้าเพจ (${uploadedTiles.length} รูป)`);
            await sleep(5000); // หน่วงเวลา 5 วินาที
        } else {
            // ล้างรูปแนบเดิมที่อาจค้างอยู่จากการรันครั้งก่อน (กรณีเปิดใช้ โปรเจคเดียวตลอด / reuseProject)
            log("ล้างรูปแนบเดิมที่ค้างอยู่ในช่อง Prompt...");
            await clearPromptAttachments();
            await sleep(2000);

            // 3. อัปโหลดรูป (รองรับหลายรูปจาก options.imageUrls สำหรับ Ingredients)
            // ภาพนิ่ง/Subject ต้องแนบ reference หลักเพียงรูปเดียว; แต่ combined ต้อง
            // อัปโหลดรูปอื่นไว้เพื่อแนบเป็น Ingredients ตอนต่อวิดีโอภายหลัง
            const isImageOnlyPhase = phase === "image";
            const rawList = isImageOnlyPhase
                ? (imageUrl ? [imageUrl] : (Array.isArray(options.imageUrls) ? options.imageUrls.slice(0, 1) : []))
                : ((Array.isArray(options.imageUrls) && options.imageUrls.length)
                    ? options.imageUrls
                    : (imageUrl ? [imageUrl] : []));
            const dataUrls = rawList
                .map(normalizeImageUrlForUpload)
                .filter((u) => u && (u.startsWith("data:") || u.startsWith("http")));
            // ตัดซ้ำ แต่ไม่ตัดจำนวนภาพทิ้ง — Flow รองรับ batch หลายภาพ
            // และผู้ใช้ต้องการให้ทุกภาพที่เลือกถูกส่งเข้าโปรเจกต์
            const uniqueUrls = [...new Set(dataUrls)];
            if (uniqueUrls.length === 0) {
                if (options.noImage) {
                    log("โหมดเจนอิสระแบบไม่มีภาพอ้างอิง: ข้ามการอัปโหลดรูปภาพ");
                } else {
                    throw new Error(`ไม่มี URL รูปภาพสินค้าที่ใช้ได้สำหรับอัปโหลด (imageUrl=${imageUrl || "ว่าง"})`);
                }
            }
            if (uniqueUrls.length > 0) {
                await closeFlowPanels({ required: true });
                log(`เตรียมอัปโหลด ${uniqueUrls.length} รูป`);
                const normalizedFallback = normalizeImageUrlForUpload(imageUrl);
                const fallbackUrls = uniqueUrls.map((url, index) =>
                    index === 0 && normalizedFallback && normalizedFallback !== url ? [normalizedFallback] : []
                );
                uploadedTiles = await uploadImages(uniqueUrls, cfg.uploadWaitSec * 1000, fallbackUrls);
                if (uploadedTiles.length === 0) {
                    throw new Error("อัปโหลดรูปภาพสินค้าเข้า Google Flow ไม่สำเร็จ (ไม่พบ media card หลังจากการอัปโหลด)");
                }

                // The upload bridge already selected Add to prompt. Reloading
                // Flow here discards that transient prompt state and used to
                // restart the hidden-card lookup loop. Continue in this same
                // live project instead.
                log("✅ อัปโหลดพร้อมใช้งานแล้ว ดำเนินการสร้างภาพต่อทันที (ไม่รีเฟรชหน้า)");
            }
        }

        const initialPrompt = typeof prompt === "object" ? prompt.imagePrompt : prompt;
        if (!initialPrompt) throw new Error("ไม่มี prompt สำหรับสร้างภาพ/วิดีโอ");

        // 4. ตั้งค่า mode + ratio
        if (cfg.autoPortrait) {
            await ensureConfig(phase === "combined" ? "image" : phase, options);
            await sleep(5000); // หน่วงเวลา 5 วินาที
        }

        // 5. แนบรูปเข้า prompt — ไม่กด filter, หาในวิวปัจจุบัน (รูปเพิ่งอัปโหลดอยู่ใน DOM แล้ว)
        if (uploadedTiles.length > 0) {
            // Image generation must use every uploaded reference. Only the
            // later video Frames step is restricted to the newest generated
            // still; never truncate the source set before image Generate.
            const attached = await attachUploadsToPrompt(uploadedTiles, "drive_folder_upload", { skipTabSwitch: true });
            if (attached.length !== uploadedTiles.length) throw new Error("แนบรูปสินค้าเข้า prompt ไม่ครบ จึงไม่กด Generate");
            await sleep(5000); // หน่วงเวลา 5 วินาที
        }

        // 6. กรอก prompt
        log("กรอก Prompt...");
        await setPrompt(initialPrompt);
        await sleep(800 + Math.random() * 400); // หน่วงเวลาสั้นๆ ก่อนกด Generate

        // 7. กด Generate
        await clickGenerate();
        await sleep(5000); // หน่วงเวลา 5 วินาทีหลังกด Generate เผื่อหน้าเว็บเริ่มทำงาน

        // 8. รอผลลัพธ์
        const resultPhase = phase === "combined" ? "image" : phase;
        const restartInitialGeneration = async (context = {}) => {
            if (cfg.autoPortrait) {
                await ensureConfig(resultPhase, options);
                await sleep(5000);
            }
            const attached = await attachUploadsToPrompt(uploadedTiles, "drive_folder_upload", { skipTabSwitch: true });
            if (attached.length !== uploadedTiles.length) {
                throw new Error("แนบรูปสินค้าเข้า prompt ไม่ครบระหว่าง Retry");
            }
            await sleep(5000);
            const retryPrompt = context.policyFallback === "no-people"
                ? buildPeopleSafePrompt(initialPrompt)
                : initialPrompt;
            await setPrompt(retryPrompt);
            await sleep(800 + Math.random() * 400);
            await clickGenerate();
        };
        const result = await waitForResult(resultPhase, {
            restartGeneration: restartInitialGeneration
        });
        if (!result?.mediaUrl && !result?.tileId && !result?.key) {
            throw new Error(`Flow ไม่พบการ์ดผลลัพธ์ ${resultPhase === "image" ? "ภาพ" : "วิดีโอ"}`);
        }
        if (resultPhase === "image") {
            imageResult = { imgUrl: result.mediaUrl, imgTileId: result.tileId };
            generatedStillMediaKeys = new Set([result.tileId, result.key, result.mediaUrl, result.href].filter(Boolean));
        }

        if (phase === "combined") {
            const videoPrompt = typeof prompt === "object" ? prompt.videoPrompt : prompt;
            if (!videoPrompt) throw new Error("ไม่มี prompt สำหรับสร้างวิดีโอ Phase 2");
            // The combined pipeline's contract is image -> video: the video
            // must use only the newly generated still. Force Frames here even
            // if an older saved setting says Ingredients, because Ingredients
            // would re-add the uploaded source images as video references.
            const videoOptions = { ...options, videoRefMode: "frames" };
            await closeGeneratedAssetOverlay();
            log("🎯 ได้รูปภาพแล้ว! รอก่อนสัก 5-10 วินาทีตามที่กำหนด (เพื่อเลี่ยงการส่งคำสั่งเร็วเกินไป)...");
            await sleep(8000 + Math.random() * 2000); // รอ 8-10 วินาที

            // 4b. เปลี่ยน config เป็น VIDEO mode + portrait
            if (cfg.autoPortrait) {
                await ensureConfig("video", videoOptions);
                await sleep(5000); // หน่วงเวลา 5 วินาที
            }

            // ล้างรูป listing ที่แนบไว้ตอนสร้างภาพออกก่อน ไม่งั้นวิดีโอจะอ้างอิง
            // รูปสินค้าเดิมแทนภาพที่เจนเสร็จใน Phase 1
            await clearAllPromptAttachmentsVerified();
            await sleep(5000); // หน่วงเวลา 5 วินาที

            // 5b. สลับแถบไลบรารีทางด้านซ้ายกลับมาที่แท็บ IMAGE เพื่อให้ภาพที่สร้างใน Phase 1 แสดงผลและสามารถเลือกได้
            await switchMediaTab("image");
            await sleep(2000);

            // ภาพที่เจนเสร็จอยู่ในผลลัพธ์แล้ว → คลิกขวา Add to prompt ให้เรียบร้อยก่อนเสมอ
            log("📸 กำลังแนบภาพที่เจนเสร็จเข้า Prompt สำหรับวิดีโอ...");
            await addGeneratedStillToPrompt(result);
            if (!promptHasMediaAttachment()) {
                throw new Error("ไม่พบภาพที่แนบใน prompt วิดีโอ จึงไม่กด Generate วิดีโอ");
            }
            if (promptAttachmentCount() !== 1) {
                log("⚠️ พบภาพแนบเกิน 1 ใบในโหมด Frames — ล้างแล้วแนบภาพที่เจนใหม่อีกครั้ง");
                await clearAllPromptAttachmentsVerified();
                await addGeneratedStillToPrompt(result);
                if (promptAttachmentCount() !== 1) {
                    throw new Error("โหมด Frames ต้องมีภาพที่เจนแล้วเพียง 1 ใบใน prompt วิดีโอ");
                }
            }
            await closeAnyOpenMenu();
            log(`✅ ใช้ภาพที่สร้างใหม่เป็น reference วิดีโอสำเร็จ (media=${String(result.tileId || result.key || result.mediaUrl).slice(0, 12)})`);
            await sleep(2500);

            // 6b. กรอก prompt สำหรับวิดีโอ (เมื่อแนบรูปเข้า prompt เรียบร้อยแล้วเท่านั้น)
            log("✍️ กรอก Prompt วิดีโอ (หลังแนบภาพเรียบร้อยแล้ว)...");
            await setPrompt(videoPrompt);
            await sleep(1000 + Math.random() * 500); // หน่วงเวลาสั้นๆ ก่อนกด Generate

            // 7b. กด Generate
            await clickGenerate();
            await sleep(5000); // หน่วงเวลา 5 วินาทีหลังกด Generate เผื่อหน้าเว็บเริ่มทำงาน

            // 8b. รอผลลัพธ์วิดีโอ
            const restartVideoGeneration = async (context = {}) => {
                if (cfg.autoPortrait) await ensureConfig("video", videoOptions);
                await clearPromptAttachments();
                await addGeneratedStillToPrompt(result);
                const retryPrompt = context.policyFallback === "no-people"
                    ? buildPeopleSafePrompt(videoPrompt)
                    : videoPrompt;
                await setPrompt(retryPrompt);
                await clickGenerate();
            };
            const vidResult = await waitForResult("video", {
                restartGeneration: restartVideoGeneration
            });

            await sleep(1500);
            await detachFlowDebugger();
            removeOverlay();
            return { ok: true, resultUrl: vidResult.mediaUrl, tileId: vidResult.tileId, imgUrl: result.mediaUrl, imgTileId: result.tileId };
        }

        log("🎯 บันทึกภาพเสร็จสิ้น! รอก่อนสัก 5-10 วินาที...");
        await sleep(8000 + Math.random() * 2000); // รอ 8-10 วินาที
        await detachFlowDebugger();
        removeOverlay();
        return { ok: true, resultUrl: result.mediaUrl, tileId: result.tileId };

    } catch (err) {
        log("❌ " + err.message);
        await detachFlowDebugger();
        await sleep(5000);
        removeOverlay();
        // เก็บภาพที่เจนเสร็จไว้ ถึงแม้ phase วิดีโอจะล้มเหลว จะได้ไม่ต้องเจนภาพใหม่
        if (imageResult?.imgUrl) {
            return { ok: false, error: err.message, imgUrl: imageResult.imgUrl, imgTileId: imageResult.imgTileId };
        }
        return { ok: false, error: err.message };
    }
}

// ปลด debugger (infobar) ที่ค้างไว้ตอนจบ pipeline
async function detachFlowDebugger() {
    try { await chrome.runtime.sendMessage({ type: "FLOW_DEBUGGER_DETACH" }); } catch { }
}

async function recordVideoBase64(videoUrl = "") {
    const video = findRecordableVideo(videoUrl);
    if (!video) throw new Error("ไม่พบวิดีโอที่เล่นได้ในหน้า Google Flow");
    if (typeof video.captureStream !== "function") throw new Error("เบราว์เซอร์ไม่รองรับ captureStream สำหรับวิดีโอ");

    video.scrollIntoView({ block: "center", inline: "center" });
    video.muted = true;
    video.playsInline = true;

    // ถ้ายังไม่โหลด (lazy <source>) สั่ง load แล้วรอ metadata ก่อน
    if (video.readyState < 2) {
        try { video.load(); } catch { }
        await Promise.race([
            once(video, "loadeddata"),
            once(video, "canplay"),
            sleep(8000)
        ]);
    }

    if (Number.isFinite(video.duration) && video.duration > 0) {
        try { video.currentTime = 0; } catch { }
    }

    try {
        await video.play();
    } catch (playError) {
        // บางครั้งต้องคลิก tile ก่อนถึงเล่นได้ — ลองคลิกแล้วเล่นใหม่
        try { video.click(); } catch { }
        await sleep(500);
        await video.play();
    }
    const stream = video.captureStream();
    const mimeType = [
        "video/mp4;codecs=avc1.42E01E",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm"
    ].find(type => MediaRecorder.isTypeSupported(type)) || "";
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];

    recorder.ondataavailable = (event) => {
        if (event.data?.size) chunks.push(event.data);
    };

    const stopped = new Promise((resolve, reject) => {
        recorder.onerror = () => reject(recorder.error || new Error("MediaRecorder error"));
        recorder.onstop = resolve;
    });

    const durationMs = Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(Math.max(video.duration * 1000 + 1000, 3000), 30000)
        : 12000;

    recorder.start(500);
    await Promise.race([
        once(video, "ended"),
        sleep(durationMs)
    ]);
    if (recorder.state !== "inactive") recorder.stop();
    await stopped;
    stream.getTracks().forEach(track => track.stop());

    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    if (!blob.size) throw new Error("บันทึกวิดีโอจาก Flow ได้ไฟล์ว่าง");

    const dataUrl = await blobToDataUrl(blob);
    return {
        base64: dataUrl.split(",")[1],
        mimeType: blob.type || "video/webm"
    };
}

// map MIME → นามสกุลภาพที่ Flow รองรับ (.png .jpg .webp .gif .heic .heif)
function mimeToImageExt(mime) {
    const m = String(mime || "").toLowerCase();
    if (m.includes("png")) return "png";
    if (m.includes("webp")) return "webp";
    if (m.includes("gif")) return "gif";
    if (m.includes("heic")) return "heic";
    if (m.includes("heif")) return "heif";
    return "jpg"; // jpeg/อื่น ๆ
}

// แปลง URL/URI ภาพให้เป็น full URL สำหรับอัปโหลด (รองรับ tos key เปล่าจาก TikTok)
function maximizeProductImageUrl(url) {
    if (!url) return "";
    if (url.startsWith("//")) {
        url = "https:" + url;
    }
    // TikTok/ByteDance CDN Image Processing Optimization
    if (url.includes("~tplv-")) {
        const match = url.match(/~tplv-([a-zA-Z0-9-]+?)(?:-resize|-crop|:)/i);
        if (match) {
            const token = match[1];
            return url.replace(/~tplv-.*$/, `~tplv-${token}-origin-jpeg.jpeg`);
        }
    }
    return url;
}

function normalizeImageUrlForUpload(raw) {
    let u = String(raw || "").trim();
    if (!u) return "";
    if (u.startsWith("//")) u = "https:" + u;
    if (/^https?:\/\//i.test(u)) {
        return maximizeProductImageUrl(u);
    }
    if (u.startsWith("data:")) return u;
    // tos key เปล่า เช่น tos-alisg-i-aphluv4xwc-sg/abc... → สร้าง full CDN URL
    const key = u.replace(/^\/+/, "");
    if (/^(tos-|obj\/tos)/i.test(key)) {
        const token = key.match(/-i-([a-z0-9]+)-/i)?.[1] || "";
        const suffix = token ? `~tplv-${token}-origin-jpeg.jpeg` : "";
        return `https://p16-oec-general.tiktokcdn.com/${key}${suffix}`;
    }
    return u;
}

function hasVideoSource(video) {
    return Boolean(
        video.currentSrc ||
        video.src ||
        video.querySelector("source")?.src ||
        video.readyState >= 1
    );
}

function findRecordableVideo(videoUrl = "") {
    const all = [...document.querySelectorAll("video")];
    // รวม video ที่มี <source> child ด้วย (src/currentSrc อาจว่างจนกว่าจะ load)
    let videos = all.filter(video => isVisible(video) && hasVideoSource(video));
    // ผ่อนเงื่อนไข: ถ้าไม่เจอ ลองทุก video ที่มี source ใด ๆ (ไม่สน visible)
    if (!videos.length) videos = all.filter(hasVideoSource);
    // ผ่อนสุด: เอา video ใด ๆ ที่มีในหน้า (เดี๋ยว play() จะ trigger load เอง)
    if (!videos.length) videos = all;
    if (!videos.length) return null;

    const target = String(videoUrl || "").split("?")[0].split("#")[0];
    if (target) {
        const exact = videos.find(video => {
            const urls = [video.currentSrc, video.src, video.querySelector("source")?.src]
                .map(value => String(value || "").split("?")[0].split("#")[0])
                .filter(Boolean);
            return urls.includes(target);
        });
        if (exact) return exact;
    }

    return videos
        .map(video => ({ video, area: video.getBoundingClientRect().width * video.getBoundingClientRect().height }))
        .sort((a, b) => b.area - a.area)[0]?.video || videos[0];
}

function once(target, eventName) {
    return new Promise(resolve => target.addEventListener(eventName, resolve, { once: true }));
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error("อ่านไฟล์วิดีโอไม่สำเร็จ"));
        reader.readAsDataURL(blob);
    });
}

// ── Message listener ──────────────────────────────────────────
async function finishFlowJob(jobId, result) {
    if (!jobId) return;
    const payload = {
        jobId,
        result,
        completedAt: new Date().toISOString()
    };
    try {
        await chrome.storage.local.set({ [`flowJob:${jobId}`]: payload });
    } catch (error) {
        console.warn("[FlowAuto] storage set failed (possibly context invalidated):", error);
    }
    try {
        await chrome.runtime.sendMessage({ type: "FLOW_PIPELINE_DONE", payload });
    } catch (error) {
        console.warn("[FlowAuto] runtime message send failed (possibly context invalidated):", error);
    }
}
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.flowStopRequested?.newValue === true) {
        stopRequested = true;
        console.log("[FlowAuto] ได้รับคำสั่งหยุดงานผ่าน storage");
    }
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "FLOW_PING") { reply({ pong: true }); return false; }
    if (msg?.type === "FLOW_STOP") { stopRequested = true; reply({ ok: true }); return false; }
    if (msg?.type === "FLOW_PREPARE_PROJECT") {
        reply({ accepted: true });
        prepareFreshProject().catch(err => log("❌ " + err.message));
        return false;
    }
    if (msg?.type === "FLOW_RUN_PIPELINE") {
        const jobId = String(msg.jobId || "");
        if (!jobId) {
            reply({ accepted: false, error: "ไม่พบ Flow job ID" });
            return false;
        }
        reply({ accepted: true, jobId });
        runPipeline(msg.payload, { jobId })
            .then(result => finishFlowJob(jobId, result))
            .catch(error => finishFlowJob(jobId, { ok: false, error: error.message || "Flow automation ล้มเหลว" }));
        return false;
    }
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
    if (msg?.type === "FLOW_RECORD_VIDEO_BASE64") {
        recordVideoBase64(msg.url)
            .then(result => reply({ ok: true, ...result }))
            .catch(err => reply({ ok: false, error: err.message }));
        return true;
    }
    return false;
});

// ตรวจสอบงานค้างเพื่อทำต่อหลังรีเฟรชหน้าเว็บ (Resume pipeline after F5 refresh)
(async function checkResumeJob() {
    try {
        const data = await chrome.storage.local.get("flowActiveJobResume");
        const state = data?.flowActiveJobResume;
        if (state && state.jobId) {
            if (state.step === "AFTER_UPLOAD" || state.step === "AFTER_FIRST_REFRESH") {
                log("🔄 พบงานจากเวอร์ชันเดิมหลังรีเฟรช กำลังดำเนินการต่อโดยไม่รีโหลดซ้ำ...");
                await chrome.storage.local.remove("flowActiveJobResume");
                // รอให้หน้าเว็บและองค์ประกอบต่างๆ โหลดเสร็จสิ้นสมบูรณ์
                await sleep(4500);
                runPipeline(state.payload, { resumeState: state, jobId: state.jobId })
                    .then(result => finishFlowJob(state.jobId, result))
                    .catch(error => finishFlowJob(state.jobId, { ok: false, error: error.message || "Flow automation ล้มเหลวหลังรีเฟรช" }));
            }
        }
    } catch (e) {
        console.error("[FlowAuto] Failed to resume job:", e);
    }
})();

chrome.runtime.sendMessage({ type: "FLOW_CONTENT_READY" }).catch(() => { });
console.log("[FlowAuto] loaded on", location.href);
