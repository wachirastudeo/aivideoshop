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
async function closeOpenAgentToggle(options = {}) {
    const required = options.required === true;
    let button = findOpenAgentToggle();
    if (!button) return false;

    log("ปิด Agent ที่เปิดอยู่ก่อนอัปโหลด...");
    button.scrollIntoView({ block: "center", inline: "center" });

    for (let attempt = 1; attempt <= 3; attempt++) {
        click(button);

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
async function waitForMediaCard(tile, options = {}) {
    const timeoutMs = options.timeoutMs ?? 12000;
    const phase = options.phase || "";
    const tabIcon = options.tabIcon || "";
    const excludedKeys = options.excludedKeys || new Set();
    const end = Date.now() + timeoutMs;

    while (Date.now() < end) {
        const exact = findMediaCard(tile);
        if (exact) return { el: exact, card: describeMediaCard(exact), fallback: false };

        const fallback = findFallbackMediaCard(tile, phase, tabIcon, excludedKeys);
        if (fallback) return { el: fallback.el, card: fallback.card, fallback: true };

        await sleep(500);
    }
    return { el: null, card: null, fallback: false };
}
function findFallbackMediaCard(tile, phase = "", tabIcon = "", excludedKeys = new Set()) {
    const cards = getMediaCards()
        .map(card => ({ card, status: mediaCardStatus(card), el: findMediaCard(card) }))
        .filter(item => item.el && !excludedKeys.has(item.card.key));

    const candidates = tabIcon === "drive_folder_upload"
        ? cards.filter(item => isReadyUploadedImageCard(item.card, item.status, item.el))
        : cards.filter(item => isGeneratedResultCard(item.card, item.status, "image"));
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

    return candidates[0];
}
function describeMediaCard(el) {
    const root = el?.closest?.("[data-tile-id], [draggable='true'], a[href*='/edit/'], article") || el;
    if (!root) return null;
    const tileId = root.getAttribute?.("data-tile-id") || "";
    const link = root.matches?.('a[href*="/edit/"]') ? root : root.querySelector?.('a[href*="/edit/"]');
    const href = link?.href || "";
    const mediaUrl = getTileMediaUrl(root);
    const label = elementText(root).slice(0, 160);
    return { key: tileId || href || mediaUrl || label, tileId, href, mediaUrl, label };
}
function isReadyUploadedImageCard(card, status, el) {
    if (!card?.tileId || !status.ready || status.failed || status.progress) return false;
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
function mediaCardStatus(cardInfo) {
    const el = findMediaCard(cardInfo);
    if (!el) return { ready: false, failed: false, progress: true, rendered: false, text: "" };
    const text = mediaCardDeepText(el).toLowerCase();

    // มี indicator กำลังโหลดจริงไหม (progress bar / spinner) — กัน % ค้างใน text ทำให้รอเก้อ
    const hasLoadingIndicator = Boolean(
        el.querySelector?.("[role='progressbar'], progress, [class*='progress'], [class*='spinner'], [class*='loading']")
    );
    const wordProgress = text.includes("uploading") || text.includes("processing") ||
        text.includes("generating") || text.includes("rendering") || text.includes("creating") ||
        text.includes("queued") || text.includes("pending") || text.includes("waiting");
    // นับ % เป็น progress เฉพาะตอนมี loading indicator จริงเท่านั้น
    const percentProgress = hasLoadingIndicator && /\b\d{1,3}\s*%/.test(text);
    const video = el.matches?.("video") ? el : el.querySelector?.("video");
    const hasPlayableVideo = Boolean(
        video && (video.currentSrc || video.src || video.querySelector("source")?.src)
    );
    const pendingVideoProgress = Boolean(el.querySelector?.("[role='slider']")) && !hasPlayableVideo;
    const progress = wordProgress || percentProgress || pendingVideoProgress;

    const hasFailureLabel = [...el.querySelectorAll("div,span,p")]
        .some(node => node.children.length === 0 && /^(failed|failure|ล้มเหลว)$/i.test(node.textContent?.trim() || ""));
    const hasFailureMessage = /\b(generation|creation|rendering)\s+failed\b/i.test(text)
        || text.includes("couldn't generate")
        || text.includes("could not generate")
        || text.includes("สร้างไม่สำเร็จ");
    const failed = !progress && (hasFailureLabel || hasFailureMessage);
    const rendered = hasRenderableMedia(el);
    return { ready: rendered && !progress, failed, progress, rendered, text };
}
function mediaCardFailureMessage(cardInfo, status) {
    const el = findMediaCard(cardInfo);
    const message = extractFlowFailureReason(el);

    if (/prominent people/i.test(message)) {
        return `Google Flow ปฏิเสธ prompt เพราะอาจเกี่ยวข้องกับบุคคลสาธารณะ: ${message}`;
    }
    return message
        ? `Google Flow สร้าง${cardInfo?.mediaUrl ? "สื่อ" : "ผลลัพธ์"}ไม่สำเร็จ: ${message}`
        : "Google Flow แสดงสถานะ Failed โดยไม่ระบุสาเหตุ";
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
    return unique.find(text => /(prompt|policy|people|unable|couldn'?t|could not|try again|not allowed|violate|error)/i.test(text))
        || unique[0]
        || "";
}
function findMediaCardRetryButton(cardInfo) {
    const el = findMediaCard(cardInfo);
    if (!el) return null;

    return [...el.querySelectorAll("button,[role='button']")].find(button => {
        if (!isVisible(button) || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
        const text = elementText(button).toLowerCase();
        const icon = [...button.querySelectorAll("i,.google-symbols,.material-icons")]
            .some(node => node.textContent?.trim().toLowerCase() === "refresh");
        return text.includes("retry") || icon;
    }) || null;
}
async function retryFailedMediaCard(cardInfo, attempt, maxAttempts, restartGeneration) {
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

    return { started: false, error: "กด Retry แล้ว แต่ Google Flow ไม่เริ่มสร้างใหม่" };
}
async function restartFailedGeneration(attempt, maxAttempts, restartGeneration) {
    if (typeof restartGeneration !== "function") {
        return { started: false, error: "ไม่พบปุ่ม Retry และไม่มีข้อมูลสำหรับสร้างคำขอเดิมใหม่" };
    }
    log(`Flow ไม่มีปุ่ม Retry → สร้างคำขอเดิมใหม่อัตโนมัติ (${attempt}/${maxAttempts})...`);
    try {
        await restartGeneration();
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
    if (img && (img.complete || img.naturalWidth > 0) && (img.naturalWidth || img.clientWidth) > 0) return true;

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

    if (isProjectUrl(location.href)) {
        const end = Date.now() + 30000;
        while (Date.now() < end) {
            if (hasPromptEditor()) return true;
            await sleep(POLL);
        }
        log("❌ หน้า project เปิดแล้ว แต่ prompt editor ยังไม่พร้อม");
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
    if (hasPromptEditor()) {
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
    if (isProjectUrl(location.href)) return true;

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

    for (let i = 0; i < 40; i++) {
        const action = findAction(createLabels);
        if (action) {
            log(`กดปุ่ม Flow: ${elementText(action).slice(0, 60) || "Create/New project"}`);
            action.scrollIntoView({ block: "center", inline: "center" });
            click(action);
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

// ── 3. uploadImages ──────────────────────────────────────────
async function uploadImages(dataUrls, waitMs = 300000, fallbackUrls = []) {
    await closeFlowPanels({ required: true });
    patchFileInput();
    const tiles = [];
    for (let i = 0; i < dataUrls.length; i++) {
        await closeFlowPanels({ required: true });
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

        const candidates = [dataUrls[i], ...(fallbackUrls[i] || [])].filter(Boolean);
        let blob = null;
        let lastDownloadError = null;
        for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
            try {
                const candidate = candidates[candidateIndex];
                blob = candidate.startsWith("data:")
                    ? toBlob(candidate)
                    : await fetch(candidate).then(async response => {
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        return response.blob();
                    });
                if (!/^image\//i.test(blob.type || "")) {
                    throw new Error(`type=${blob.type || "unknown"}`);
                }
                if (candidateIndex > 0) log(`⚠️ URL รูปหลักใช้ไม่ได้ ใช้รูปแสดงผลสำรองแทน`);
                break;
            } catch (error) {
                blob = null;
                lastDownloadError = error;
            }
        }
        if (!blob) {
            throw new Error(`ดาวน์โหลดรูปแล้วไม่ใช่ไฟล์ภาพ (${lastDownloadError?.message || "unknown"}) — URL อาจถูกบล็อก/หมดอายุ`);
        }
        let mime = blob.type || "image/jpeg";
        const ext = mimeToImageExt(mime);
        const file = new File([blob], `${i + 1}.${ext}`, { type: mime });
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
        ? (options.imageCount || cfg.imageCount || 1)
        : (options.videoCount || cfg.videoCount || 1);
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
    // เลือก sub-tab วิดีโอ: Ingredients (VIDEO_REFERENCES) หรือ Frames (VIDEO_FRAMES)
    if (phase !== "image") {
        const refMode = (options.videoRefMode || "ingredients") === "frames" ? "VIDEO_FRAMES" : "VIDEO_REFERENCES";
        const picked = await clickMenuTab(refMode);
        if (picked) log(`เลือกแท็บวิดีโอ: ${refMode === "VIDEO_FRAMES" ? "Frames" : "Ingredients"}`);
        await sleep(600);
    }
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
    const target = tiles.length;
    log(`แนบรูปเข้า prompt (${target} รูป)...`);

    // สลับไป tab ที่ถูกต้อง (Uploaded หรือ Images)
    await switchMediaTab(tabIcon);

    const done = new Set();
    const usedResolvedKeys = new Set();
    for (const tile of tiles) {
        const id = tile?.key || tile?.tileId || tile?.href || tile?.mediaUrl;
        if (!id) continue;
        const tileLabel = String(id).slice(0, 12);
        const beforeCount = promptAttachmentCount();
        const result = await waitForMediaCard(tile, {
            tabIcon,
            phase: tabIcon === "image" ? "image" : "",
            timeoutMs: tabIcon === "image" ? 15000 : 20000,
            excludedKeys: usedResolvedKeys
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
        if (!attached && promptAttachmentCount() <= beforeCount) {
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

async function switchMediaTab(tabIcon) {
    const labels = tabIcon === "image"
        ? ["View images", "Images", "Generated", "รูปภาพ"]
        : ["View uploaded media", "Uploaded", "Uploads", "อัปโหลด"];
    const tabBtn = byIcon(tabIcon) || byText(labels);
    if (tabBtn) {
        await humanClick(tabBtn);
        await sleep(1200);
    }
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
    selectEditableContents(editor);
    try {
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_INSERT_TEXT",
            payload: { text: prompt, clear: true }
        });
        if (response?.ok && response.inserted && await waitForPromptCommit(editor, prompt, 3000)) {
            log("✅ กรอก Prompt เข้า Slate สำเร็จ");
            return;
        }
    } catch (error) {
        console.warn("[FlowAuto] trusted prompt insert failed:", error);
    }

    selectEditableContents(editor);
    document.execCommand("delete", false, null);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" }));
    await sleep(100);

    document.execCommand("insertText", false, prompt);
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    editor.blur();
    await sleep(100);
    editor.focus();
    if (await waitForPromptCommit(editor, prompt, 2000)) return;

    try {
        selectEditableContents(editor);
        document.execCommand("delete", false, null);
        const dt = new DataTransfer(); dt.setData("text/plain", prompt);
        editor.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
        if (await waitForPromptCommit(editor, prompt, 1500)) return;
    } catch (e) { console.warn("[FlowAuto] paste failed:", e); }

    selectEditableContents(editor);
    document.execCommand("delete", false, null);
    await sleep(50);
    for (const ch of prompt) {
        if (stopRequested) return;
        document.execCommand(ch === "\n" ? "insertLineBreak" : "insertText", false, ch === "\n" ? null : ch);
        await sleep(4);
    }
    editor.dispatchEvent(new Event("change", { bubbles: true }));
    if (!await waitForPromptCommit(editor, prompt, 2500)) {
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
        const submitReady = !promptHasMediaAttachment() || Boolean(findGenerateButton());
        if (inserted.includes(needle) && submitReady) {
            await sleepStop(250);
            return true;
        }
        await sleep(100);
    }
    return false;
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
    if (await clickButtonCenterWithDebugger(btn) && await waitGenerationStarted(btn, 5000)) {
        return true;
    }

    log("Trusted click ยังไม่เริ่มสร้าง → ลอง human click...");
    await humanClick(btn);
    if (await waitGenerationStarted(btn, 3500)) return true;

    log("Human click ยังไม่เริ่มสร้าง → ลอง DOM click...");
    click(btn);
    if (await waitGenerationStarted(btn, 2000)) return true;

    log("DOM click ยังไม่เริ่มสร้าง → ลองกด Enter...");
    btn.focus();
    btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    btn.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    if (await waitGenerationStarted(btn, 2000)) return true;

    throw new Error("กด Generate แล้ว แต่ Flow ไม่เริ่มสร้าง จึงไม่รอผลลัพธ์");
}

async function clickButtonCenterWithDebugger(button) {
    const rect = button.getBoundingClientRect();
    const x = Math.round(rect.left + rect.width / 2);
    const y = Math.round(rect.top + rect.height / 2);
    try {
        const response = await chrome.runtime.sendMessage({
            type: "FLOW_CLICK_POINT",
            payload: { x, y }
        });
        if (response?.ok && response.clicked) return true;
        console.warn("[FlowAuto] trusted click failed response:", response);
    } catch (error) {
        console.warn("[FlowAuto] trusted click failed:", error);
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
        const newCards = getMediaCards().filter(card => card.key && !preGenMediaKeys.has(card.key));
        const hasNewProgress = newCards.some(card => mediaCardStatus(card).progress);
        if (disabled) {
            if (!disabledSince) disabledSince = Date.now();
        } else {
            disabledSince = 0;
        }
        if (hasNewProgress || (disabledSince && Date.now() - disabledSince >= 500)) {
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
    const maxMs = phase === "image" ? 180000 : 300000;
    const progressGraceMs = 25000;
    // Flow can briefly mark queued Veo jobs as Failed, then replace the same
    // cards with playable videos. Keep waiting long enough for that late result.
    const failureGraceMs = phase === "video" ? 90000 : 30000;
    let retryAttempts = 0;
    let startedAt = Date.now();
    let end = Date.now() + maxMs;
    let pendingFailure = "";
    let pendingFailedCard = null;
    let failureSeenAt = 0;
    log("รอผลลัพธ์จาก Flow...");
    while (Date.now() < end) {
        if (stopRequested) return { tileId: null, mediaUrl: "" };
        const newCards = getMediaCards()
            .filter(card => card.key && !preGenMediaKeys.has(card.key))
            .map(card => ({ card, status: mediaCardStatus(card) }));
        let failedResult = null;
        let failedCard = null;
        let hasActiveGeneration = hasVisibleGenerationIndicator();

        for (const { card, status } of newCards) {
            if (status.progress) hasActiveGeneration = true;
            if (status.failed && !failedResult) {
                failedResult = mediaCardFailureMessage(card, status);
                failedCard = card;
            }
            if (!status.progress && !status.ready && Date.now() - startedAt < progressGraceMs) {
                log("รอ Flow เริ่มแสดงเปอร์เซ็น...");
                continue;
            }
            if (!isGeneratedResultCard(card, status, phase)) continue;
            log("✅ พบผลลัพธ์ที่สร้างเสร็จแล้ว!");
            return { tileId: card.tileId || card.key, mediaUrl: card.mediaUrl, href: card.href, key: card.key };
        }
        if (failedResult) {
            pendingFailure = failedResult;
            pendingFailedCard = failedCard;
        }
        if (hasActiveGeneration) {
            // A failed sibling tile can appear while another requested video
            // is still rendering. Do not age or act on that failure yet.
            failureSeenAt = 0;
            const rem = Math.round((end - Date.now()) / 1000);
            log(`วิดีโอยังกำลังสร้างอยู่ รอต่อ... (~${rem}s)`);
            await sleep(1000);
            continue;
        }
        if (pendingFailure) {
            if (!failureSeenAt) failureSeenAt = Date.now();
            const failureAge = Date.now() - failureSeenAt;
            if (failureAge < failureGraceMs) {
                log(`Flow แสดง Failed ชั่วคราว รอผลลัพธ์สำเร็จอีก ${Math.ceil((failureGraceMs - failureAge) / 1000)}s...`);
                await sleep(1000);
                continue;
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
    return [...document.querySelectorAll("[role='progressbar'],progress,[aria-busy='true']")]
        .some(isVisible);
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
        await closeFlowPanels();
        const cfg = await loadSettings();

        // 1. ไปหน้า project
        log("ตรวจหน้าโปรเจกต์ Google Flow...");
        const ok = await ensureProjectPage();
        if (!ok) throw new Error("ไม่สามารถเปิดหน้า project ได้ (ตรวจสอบว่า login Google แล้ว)");
        await sleep(300);
        dismissIAgree();
        log("ตรวจหน้าต่างที่บังพื้นที่อัปโหลด...");
        await closeFlowPanels({ required: true });

        // 2. สลับไป Uploaded tab
        log("เปิดคลัง Uploaded...");
        await switchToUploadedTab();
        await closeFlowPanels({ required: true });

        // 3. อัปโหลดรูป (รองรับหลายรูปจาก options.imageUrls สำหรับ Ingredients)
        let uploadedTiles = [];
        const rawList = (Array.isArray(options.imageUrls) && options.imageUrls.length)
            ? options.imageUrls
            : (imageUrl ? [imageUrl] : []);
        const dataUrls = rawList
            .map(normalizeImageUrlForUpload)
            .filter((u) => u && (u.startsWith("data:") || u.startsWith("http")));
        // ตัดซ้ำ + จำกัดสูงสุด 6 รูป
        const uniqueUrls = [...new Set(dataUrls)].slice(0, 6);
        if (uniqueUrls.length === 0) {
            throw new Error(`ไม่มี URL รูปภาพสินค้าที่ใช้ได้สำหรับอัปโหลด (imageUrl=${imageUrl || "ว่าง"})`);
        }
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
        const resultPhase = phase === "combined" ? "image" : phase;
        const restartInitialGeneration = async () => {
            if (cfg.autoPortrait) await ensureConfig(resultPhase, options);
            const attached = await attachUploadsToPrompt(uploadedTiles, "drive_folder_upload");
            if (attached.length !== uploadedTiles.length) {
                throw new Error("แนบรูปสินค้าเข้า prompt ไม่ครบระหว่าง Retry");
            }
            await setPrompt(initialPrompt);
            await clickGenerate();
        };
        const result = await waitForResult(resultPhase, {
            restartGeneration: restartInitialGeneration
        });

        if (phase === "combined" && result.tileId) {
            if (!prompt?.videoPrompt) throw new Error("ไม่มี prompt สำหรับสร้างวิดีโอ Phase 2");
            log("🎯 ได้รูปภาพแล้ว! กำลังนำรูปไปสร้างวิดีโอต่อทันที...");
            await sleep(2000); // รอให้ระบบบันทึกรูปสักพัก

            // 4b. เปลี่ยน config เป็น VIDEO mode + portrait
            if (cfg.autoPortrait) await ensureConfig("video", options);

            // 5b. แนบรูปเป็น Ingredients: ใช้เฉพาะรูปสินค้าที่ผู้ใช้เลือก (ไม่รวมภาพที่เจน กันอัพซ้ำ)
            //     Frames: ใช้ภาพที่เจนเป็นเฟรมเดียว
            //     อัพหลายรูป (>1) → บังคับ Ingredients เสมอ จะได้ใช้รูปครบ
            let useIngredients = (options.videoRefMode || "ingredients") !== "frames";
            if (uploadedTiles.length > 1 && !useIngredients) {
                useIngredients = true;
                log("เลือกหลายรูป → สลับวิดีโอเป็น Ingredients อัตโนมัติ");
            }
            const videoRefTiles = useIngredients
                ? (uploadedTiles.length ? uploadedTiles.filter(Boolean) : [result])
                : [result];
            // ตัด tile ซ้ำตาม key/tileId
            const seenTiles = new Set();
            const uniqueTiles = videoRefTiles.filter((t) => {
                const k = t?.tileId || t?.key || t?.mediaUrl;
                if (!k || seenTiles.has(k)) return false;
                seenTiles.add(k); return true;
            });
            const videoReferenceTab = useIngredients ? "drive_folder_upload" : "image";
            const attachedGenerated = await attachUploadsToPrompt(uniqueTiles, videoReferenceTab);
            if (attachedGenerated.length === 0) throw new Error("แนบภาพเข้า prompt วิดีโอไม่สำเร็จ จึงไม่กด Generate");
            log(`แนบ Ingredients ${attachedGenerated.length}/${uniqueTiles.length} รูป`);

            // 6b. กรอก prompt สำหรับวิดีโอ
            log("กรอก Prompt วิดีโอ...");
            await setPrompt(prompt.videoPrompt);

            // 7b. กด Generate
            await clickGenerate();

            // 8b. รอผลลัพธ์วิดีโอ
            const restartVideoGeneration = async () => {
                if (cfg.autoPortrait) await ensureConfig("video", options);
                const retryAttached = await attachUploadsToPrompt(uniqueTiles, videoReferenceTab);
                if (retryAttached.length !== uniqueTiles.length) {
                    throw new Error("แนบภาพอ้างอิงวิดีโอไม่ครบระหว่าง Retry");
                }
                await setPrompt(prompt.videoPrompt);
                await clickGenerate();
            };
            const vidResult = await waitForResult("video", {
                restartGeneration: restartVideoGeneration
            });

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
function normalizeImageUrlForUpload(raw) {
    let u = String(raw || "").trim();
    if (!u) return "";
    if (u.startsWith("//")) return "https:" + u;
    if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;
    // tos key เปล่า เช่น tos-alisg-i-aphluv4xwc-sg/abc... → สร้าง full CDN URL
    const key = u.replace(/^\/+/, "");
    if (/^(tos-|obj\/tos)/i.test(key)) {
        const token = key.match(/-i-([a-z0-9]+)-/i)?.[1] || "";
        const suffix = token ? `~tplv-${token}-resize-jpeg:800:800.jpeg` : "";
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
    await chrome.storage.local.set({ [`flowJob:${jobId}`]: payload });
    await chrome.runtime.sendMessage({ type: "FLOW_PIPELINE_DONE", payload }).catch(() => { });
}

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
        runPipeline(msg.payload)
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

chrome.runtime.sendMessage({ type: "FLOW_CONTENT_READY" }).catch(() => { });
console.log("[FlowAuto] loaded on", location.href);
