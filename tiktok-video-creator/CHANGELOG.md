# Changelog — TikTok Video Creator Extension

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
