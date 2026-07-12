# Changelog — TikTok Video Creator Extension

---

## [0.4.1] — 2026-07-10

### Prompt Builder
- Updated image prompt collage generation to limit still images to at most 4 scenes/panels (`strictly containing at most 4 scenes/panels`). This ensures consistency with the video generation phase's scene limits.

### TikTok Studio Automation
- Fixed schedule date selection bug by implementing calendar day click automation (`clickCalendarDay`). The script now clicks the date input, waits for the calendar dropdown, navigates the month if necessary, and directly clicks the correct day element to ensure React state updates correctly, before adjusting the time. Fallback to direct input typing is preserved.

### Google Flow Automation
- Fixed reference image selection issue by mapping multilingual aliases (English & Thai) for reference mode tabs (`Subject`/`วัตถุ`, `Style`/`สไตล์`, `Structure`/`โครงสร้าง`, `Ingredients`/`ส่วนผสม`, and `Frames`/`เฟรม`) in the `clickMenuTab` helper. This ensures Google Flow correctly applies reference settings on Thai-configured browsers, maintaining fidelity to the uploaded reference images.
- Reordered the prompt editor typing flow in `typeSlate` to attempt DOM `execCommand("insertText")` and Clipboard Paste events *before* resorting to the `chrome.debugger` API. This completely prevents the white "debugging this browser" infobar warning from showing up in typical runs, making the automation stealthy and bypassing Google Flow's anti-bot debugger checks.
- Enhanced timing randomization across all operations. Updated the `sleep` and `delay` helpers in `flow-automation.js`, `tiktok-studio-automation.js`, `background.js`, and `tab-video.js` to automatically apply a randomized offset (between -800ms and +1200ms for large delays) and a dynamic jitter multiplier (±25%). This ensures that even static `sleep(5000)` calls produce completely dynamic, organic durations that vary on every run, avoiding static anti-bot timing checks. Added a strict **10000ms (10 seconds) maximum cap** on Google Flow's sleep helper to guarantee delays never stretch too long.
- Reduced delays between prompt typing and clicking the Generate button in Google Flow (from 9.8 seconds to approx 1.8-2.7 seconds) to better emulate natural human click speeds.
- Added a robust 3800ms delay (with random jitter) immediately after clicking the "New Project" button in both `prepareFreshProject` and `ensureProjectPage`. This ensures Google Flow loads and transitions to the project page fully before the script attempts subsequent DOM checks or image uploads.
- Fixed **accidental New Project clicks during job resumption** in Google Flow. Updated `ensureProjectPage` to accept an `isResume` flag so that when the page reloads to clean up memory after image uploads, the script is strictly prohibited from running navigation checks, navigating to the homepage, or clicking the "New Project" button. It now correctly and exclusively waits for the prompt editor to load on the existing project.
- Fixed **TikTok Studio schedule date selection errors**. Updated `clickCalendarDay` to support both full English/Thai month names and their abbreviations (e.g. `"Jul"`, `"ก.ค."`), preventing the script from mistakenly clicking the "Next Month" button. Also added a sorting priority to click outer interactive container elements (like `button`, `td`, and gridcells) instead of nested text `span` tags, and made all day-cell class name checks case-insensitive. Implemented an intelligent `calendarContainer` lookup checking for visible container elements containing more than 15 buttons/cells/spans and that do not contain the `dateInput` element to avoid misidentifying the date input wrapper as the calendar popover itself. Additionally, upgraded CSS class name attribute selectors with the case-insensitive `i` modifier (`[class*="calendar" i]`, `[class*="popover" i]`) to match any class casing variations, and implemented strict regular expression checks (`dateRegex`, `timeRegex`) to accurately identify date and time input elements in `fillScheduleTime` without capturing other text/search fields. Furthermore, updated `setTuxInputValue` to bypass React's virtual DOM value tracking mechanisms by calling the native `HTMLInputElement.prototype.value` setter and resetting `input._valueTracker`, guaranteeing that the input field value updates and triggers React's state sync successfully.
- Fixed **empty caption/hashtag errors and unsynced React state** on TikTok Studio. Added a strict safety fallback in `video-output.js`: if the AI-generated caption or edited caption is ever empty, null, or whitespace-only, the script will automatically fallback to the default template-based caption. Also wrapped the `caption` variable in `String(caption || "").trim()` inside `fillCaptionAndHashtags` and `fillCaption` in `tiktok-studio-automation.js` to prevent JavaScript crashes when performing regex operations on empty or null values. Implemented a verification system (`tryInsertMethod`) that types the caption, triggers a temporary `blur` to force React state synchronization, and checks if the text persists. If the text is cleared by React, it automatically retries using alternative methods (Clipboard Paste, Debugger typing) to guarantee that the caption state is successfully registered and does not disappear upon clicking Post. Additionally, added explicit `beforeinput` and `input` event dispatchers with text data payload during caption insertion to guarantee Draft.js/Lexical editors sync their React internal states, preventing normal caption text from disappearing on post submission.
- Implemented an **Active Tab Watchdog** in `background.js`. While an automation job is active on Google Flow or TikTok Studio, the background script checks every 5 seconds if the automation tab is active. If the user has switched tabs, the watchdog automatically focuses and reactivates the tab, preventing Chrome from throttling execution or suspending the tab, which guarantees the queue continues running reliably even in the background.
- Implemented **Active Human Emulation (Mouse Wiggling & Slight Scroll)** inside the sleep functions of `flow-automation.js`. For any sleep durations >= 2500ms, the script will now periodically and randomly move the virtual mouse cursor slightly and scroll the page up or down slightly. Also integrated these human actions with a 12% probability per loop iteration inside Google Flow's long polling loop `waitForResult` to keep the page active during AI generation phases.
- Reverted all timing randomization, jitter offsets, mouse wiggling, and screen scrolling from **TikTok Studio** ([tiktok-studio-automation.js](file:///Users/pae/Documents/aivideoshop-main/tiktok-video-creator/content/tiktok-studio-automation.js)). The `sleep` function was simplified to a direct promise wrapper, wiggles/scrolls were removed, and pipeline steps inside `handleVideoUpload` were shortened to fixed `1000` ms delays. This allows TikTok Studio uploads and submissions to run as fast and predictably as possible.
- Implemented **Automatic Hashtag De-duplication** during caption filling on TikTok Studio (`fillCaptionAndHashtags` and `fillCaption`). If a hashtag is already written in the main `caption` string (either by AI generation or manual user input), the script will filter out the duplicate hashtag from the tags array to prevent repeating it twice in the final post text box.
- Adjusted the **batch queue delay between products** in [tab-video.js](file:///Users/pae/Documents/aivideoshop-main/tiktok-video-creator/tabs/tab-video.js) to a brief **4 to 6 seconds (averaging 5 seconds)** instead of 10-30 seconds. This speeds up transitions between items in batch runs while retaining a tiny organic timing variation, and remains fully interruptible by the Stop button.

### Queue Processing & Resilience
- Added an automatic 2-minute (120-second) break after processing every 5 products inside the batch queue to prevent platform rate limits and detection.
- Added support for resuming video generation and posting directly for queue items whose images have already been generated (`image_done` status). When resuming a batch, the script now skips the image generation step for these items, uploads the existing approved image, and proceeds directly to video generation and posting. This prevents re-generation of images, saves credits, and ensures the queue completes successfully even if some video generation steps time out or fail.

## [0.4.0] — 2026-06-05

### Resilient TikTok Studio Automation (`content/tiktok-studio-automation.js`)

#### File upload
- DataTransfer drop attempted first, then base64 `File` fallback via native `input.files` setter / `defineProperty`.
- `findUploadInput` searches same-origin iframes too, retries with countdown, clicks the upload entry point each loop (60s window).
- `verifyFileAccepted` no longer throws if the file is already in the input — proceeds and lets `waitForUploadFinished` decide.
- `waitForUploadFinished` is language-agnostic: waits for Post/Save button ready + video preview (not the English word "uploaded"), 300s window with countdown.

#### Product link flow (rewritten, matches real DOM, 9 retry-with-countdown steps)
- STEP1 click **Add link** (once) → STEP2 **Add link** modal `Link type = Products` → click **Next** (once).
- STEP3 wait product-selector modal → STEP4 select **Showcase products** tab + search box.
- STEP5 type product **ID** into `input[placeholder="Search products"]`, trigger search (Enter + magnifier icon), loop until the matching ID row appears (no fallback to first row).
- STEP6 select product radio (single click) → wait Next enable (scoped to `.product-selector-modal` via `productSelectorNext`, avoids stale modals) → click Next.
- STEP7–9 rename page: `findProductNameInput` (label-based), set cleaned name via React setter, click **Add** until modal closes.
- Product title cleaning: strips `(Live)`/brackets and weird symbols/emoji, max 25 chars.

#### Each step is self-healing
- `retryUntil(label, fn, totalMs, intervalMs, diagnose)` loops until success with per-second countdown logs and diagnostics (button found? clickable? disabled?), so a stuck step is visible instead of a silent skip.
- Human pacing: warm-up delay before first check, larger intervals, settle delays before clicking Next / Post / Save Draft.

#### Post / draft safety
- Post mode falls back to **Save Draft** if the product link can't be added, AI-generated can't be set, or the Post click fails — with a loud log of the reason.
- `setAigcSwitch` reads `data-state`/`aria-checked`, clicks the real switch (not the `aria-hidden` input), verifies + retries up to 4 rounds.
- **AI-generated content** re-verified right before both Post and Save Draft.

#### Logging
- Sequential `#NN` numbered log lines, reset per run; emitted to console and the side panel.

### Decoupled messaging (`background.js`, `content/tiktok-studio-automation.js`)
- `TIKTOK_UPLOAD_VIDEO` acks `{ started: true }` immediately and runs the pipeline detached → fixes "message channel closed" on long uploads.
- `sendTikTokDraft` returns immediately; final result is surfaced via `TIKTOK_DONE` → notification (posted / draft fallback / failure).
- `prepareVideoBase64ForTikTok` decodes `data:` URLs directly (no bogus Google Flow fallback).
- Post metadata (`caption`, `hashtags`, `productUrl`) enforced only when actually posting, not for drafts.

### Side panel (`sidepanel.js`)
- Listens for `TIKTOK_STUDIO_LOG` / `PIPELINE_LOG` and renders detailed step status in the activity log (cap raised 30 → 100).

### Manual test panel (`tabs/tab-post.html`, `tabs/tab-post.js`)
- "ทดสอบอัพโหลด & โพสต์" panel: pick a local video, caption, **product ID**, product URL, mode (draft/now) → fires the real pipeline (non-blocking, file read as base64).

---

## [0.3.0] — 2026-05-30

### Features

#### Tab 3: TikTok Posting Settings
- Added a third side panel tab for TikTok posting configuration.
- Settings auto-save to `chrome.storage.sync.settings.postDefaults`.
- Supported post actions:
  - `download`: download only
  - `draft`: download + save TikTok draft
  - `post`: download + post TikTok
  - `both`: download + save TikTok draft
- Posting settings include caption template, hashtags, privacy, schedule time, location, comments, reuse, and confirmation word.
- AI-generated disclosure is forced on and cannot be saved as off.

#### Download-first TikTok Flow
- Video tab now downloads finished videos before any TikTok upload/post action.
- TikTok automation opens or focuses `https://www.tiktok.com/tiktokstudio/upload` automatically.
- If no TikTok Studio tab exists, the extension creates one.

#### Product ID and Product Link Flow
- Product queue preserves `productId` and `productUrl`.
- Download/upload filenames now use product ID: `${productId}_${YYYY-MM-DD}_tiktok.mp4`.
- TikTok Studio automation passes `productId`, `productUrl`, and `productName` through the Draft/Post payload.
- Added product link automation:
  - click `เพิ่มลิงก์`
  - click `ถัดไป`
  - select `นำเสนอสินค้า`
  - search by `productId`
  - select product
  - click `ถัดไป`
  - set product title to max 25 characters
  - click `เพิ่ม`

#### Captions and Hashtags
- Caption default now includes product details.
- Caption variables:
  - `{product_name}`
  - `{product_id}`
  - `{price}`
  - `{product_details}`
  - `{highlights}`
  - `{shop_name}`
  - `{cta}`
- Hashtags are normalized, deduplicated, prefixed with `#`, and capped at 5.

### Validation

- Ran syntax checks for updated JS files:
  - `node --check tabs/tab-post.js`
  - `node --check tabs/tab-video.js`
  - `node --check modules/video-output.js`
  - `node --check modules/prompt-builder.js`
  - `node --check options/options.js`
  - `node --check background.js`
  - `node --check content/tiktok-studio-automation.js`

### Notes

- TikTok Studio Add link was inspected live up to the final `เพิ่ม` modal, but the final click was not pressed manually to avoid modifying a real TikTok draft outside the automated flow.
- The UI automation remains selector-sensitive because TikTok Studio can change its DOM.

---

## [0.2.1] — 2026-05-29

### 🐛 Bug Fixes

#### ฟังก์ชันส่ง Draft TikTok ในคิวอัตโนมัติ (Batch Queue)
- **สาเหตุ**: ในโค้ดดั้งเดิมของ `processQueue` เช็คเงื่อนไขเฉพาะ `download`, `post`, และ `both` (ซึ่ง `both` ไปทำ `publishVideo` ที่ยังไม่ได้ทำจริง) ทำให้ตัวเลือก `draft` ไม่ทำงานโดยอัตโนมัติ
- **แก้**: อัปเดต `processQueue` ให้เช็ค `draft` และ `both` โดยทำการส่ง `TIKTOK_SEND_DRAFT` ไปยัง background service เพื่อยิง API ส่ง draft ของ TikTok

#### ปุ่มส่ง Draft บนการ์ดสินค้าเดี่ยว (Single Card Action)
- **สาเหตุ**: ปุ่มบนการ์ดสินค้าเดี่ยวเขียนว่า "โพสต์ TikTok" เสมอ และเรียกใช้ `handlePost` ซึ่งเรียก `publishVideo` (จะโยน Error เสมอ) แม้ว่าผู้ใช้จะตั้งค่าเป้าหมายเป็น "ส่ง Draft TikTok 📤"
- **แก้**: 
  - อัปเดตป้ายกำกับปุ่มบนการ์ดสินค้าให้เปลี่ยนเป็น "ส่ง Draft TikTok" อัตโนมัติเมื่อผู้ใช้เลือกการทำงานเป็น Draft หรือดาวน์โหลด + Draft
  - อัปเดตฟังก์ชัน `handlePost` ให้เปลี่ยนเส้นทางไปเรียก `handleSendDraft` เพื่ออัปโหลดเป็นร่างแบบเงียบโดยอัตโนมัติ

---

## [0.2.0] — 2026-05-29

### 🐛 Bug Fixes

#### UI แฮงค์ กดไรไม่ได้
- **สาเหตุ**: `bindGlobalEvents()` ใน `tab-video.js` ขาด `[` เปิด array ทำให้ function ล้มเหลวตั้งแต่ต้น event listener ไม่ถูก bind เลย
- **แก้**: เพิ่ม `[` และเพิ่ม `"image-model"`, `"video-model"` เข้า array ด้วย

#### Header ซ้อน 2 อัน
- **สาเหตุ**: Chrome Side Panel แสดง native header (ชื่อ + ไอคอน) อัตโนมัติ แต่ใน `sidepanel.html` ยังมี `<header class="app-header">` ของตัวเองซ้ำอีกอัน
- **แก้**: ลบ `<header class="app-header">` ออก — ใช้ native header ของ Chrome แทน

#### ปุ่มตั้งค่า ⚙️ หาย
- ย้ายปุ่ม settings gear จาก header เก่า → ชิดขวาใน `tab-bar` พร้อม CSS `.tab-bar__settings`

---

### ✨ Features

#### เพิ่มโมเดล Veo 3.1 — Lite [Lower Priority]
- **Key**: `veo-3.1-lite-low-priority`
- **UI Label**: `Veo 3.1 — Lite [Lower Priority] ⭐`
- เหมาะสำหรับ **Ultra plan** (0 เครดิต) + batch ใหญ่ที่ไม่รีบ
- แทนที่ `veo-3.1-fast-lp` / `veo-3.1-lite-lp` ที่ถูกปิดไปแล้ว (10 พ.ค. 2026)
- อัปเดตใน: `options.html`, `tab-video.html`, `flow-automation.js`

#### ปรับ `selectModel()` ให้ match UI จริง ป้องกัน collision
- เรียง mapping จากเฉพาะเจาะจงกว่า → กว้างกว่า (LP อยู่บน Lite)
- เพิ่ม `matchItem()` helper: **Pass 1 exact match** → **Pass 2 substring ยาวสุดก่อน**
- ป้องกัน `"LITE"` ไป match `"LITE [LOWER PRIORITY]"` โดยไม่ตั้งใจ

#### ค่า default จำนวนภาพ/วิดีโอ = 1
- เปลี่ยน default จาก 4 ภาพ / 2 คลิป → **1 ภาพ / 1 คลิป**
- แก้ใน: `tab-video.js` (normalizeSettings + optionDefaults), `options.js` (mediaSettings fallback)

---

### 🗂️ ไฟล์ที่เปลี่ยน

| ไฟล์ | รายละเอียด |
|---|---|
| `tabs/tab-video.js` | แก้ bug `[` หาย, default count = 1, เพิ่ม image-model/video-model ใน bindGlobalEvents |
| `tabs/tab-video.html` | เพิ่ม option `Veo 3.1 - Lite [Lower Priority]` |
| `options/options.html` | เพิ่ม card `Veo 3.1 — Lite [Lower Priority] ⭐` ในกริด model |
| `options/options.js` | default mediaSettings imageCount/videoCount = 1 |
| `content/flow-automation.js` | แก้ mapping + เขียน selectModel() ใหม่ป้องกัน collision |
| `sidepanel.html` | ลบ header ซ้อน, ย้าย ⚙️ เข้า tab-bar |
| `sidepanel.css` | เพิ่ม `.tab-bar__settings` CSS |

---

### 📦 โมเดลที่รองรับ (ล่าสุด)

#### วิดีโอ (Veo)
| Key | UI Label | เครดิต | หมายเหตุ |
|---|---|---|---|
| `veo-3.1-fast` | Veo 3.1 — Fast | ปกติ | แนะนำ (default) |
| `veo-3.1-quality` | Veo 3.1 — Quality | สูงสุด | คุณภาพดีสุด |
| `veo-3.1-lite` | Veo 3.1 — Lite | ต่ำ | เร็ว ประหยัด |
| `veo-3.1-lite-low-priority` | Veo 3.1 — Lite [Lower Priority] ⭐ | **0** | Ultra plan เท่านั้น |
| `omni-flash` | Omni Flash | ปกติ | โมเดลใหม่ล่าสุด |

#### ภาพ (Banana)
| Key | UI Label | เครดิต |
|---|---|---|
| `nano-banana-pro` | Nano Banana Pro | **0** |
| `nano-banana-2` | Nano Banana 2 | **0** |

---

### 🔧 วิธี Reload Extension

หลังอัปเดตไฟล์ใดก็ตาม ต้อง reload extension เสมอ:

1. เปิด `chrome://extensions`
2. กดปุ่ม **↺ Reload** ที่ card ของ extension
3. ปิด-เปิด Side Panel ใหม่

---

## [0.1.0] — 2026-05-28 (Initial)

- เพิ่มโมเดล Veo 3.1 Fast, Quality, Lite, Omni Flash
- เพิ่มฟังก์ชัน `selectBatchCount()` และ `selectModel()` ใน `flow-automation.js`
- เพิ่ม `imageModel` / `videoModel` dropdown ใน Video tab
- ออกแบบ Dark UI ใหม่ทั้งหมด (Minimalist Dark)
- รองรับ Gemini และ OpenAI API สำหรับวิเคราะห์ภาพสินค้า
