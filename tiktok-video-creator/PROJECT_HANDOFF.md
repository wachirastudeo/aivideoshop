# TikTok Video Creator Extension - Project Handoff

## ภาพรวมโปรเจกต์

โปรเจกต์นี้คือ Chrome Extension แบบ Manifest V3 ชื่อ **TikTok Video Creator** สำหรับช่วย TikTok seller สร้างวิดีโอขายสินค้าเร็วขึ้นผ่าน side panel ของ Chrome

เป้าหมายหลัก:

1. ดึงสินค้าจาก TikTok Showcase
2. เลือกสินค้าหรืออัพโหลดภาพสินค้าเอง
3. สร้าง prompt สำหรับ Google Flow แบบ 2 phase
4. Phase 1: สร้างภาพสินค้าใหม่ให้สวยก่อน
5. Phase 2: ใช้ภาพที่ approve แล้วสร้างวิดีโอ 8 วินาที
6. ดาวน์โหลดวิดีโอ หรือเตรียมโพสต์ลง TikTok พร้อม product link

โปรเจกต์ใช้ **vanilla JavaScript ES modules**, HTML, CSS เท่านั้น ไม่มี framework และไม่มี bundler

## โฟลเดอร์หลัก

```text
tiktok-video-creator/
├── manifest.json
├── background.js
├── sidepanel.html
├── sidepanel.js
├── sidepanel.css
├── PROJECT_HANDOFF.md
├── assets/
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── modules/
│   ├── google-flow.js
│   ├── image-analyzer.js
│   ├── prompt-builder.js
│   ├── tiktok-api.js
│   └── video-output.js
├── options/
│   ├── options.html
│   └── options.js
├── scripts/
│   └── generate-icons.js
└── tabs/
    ├── tab-products.html
    ├── tab-products.js
    ├── tab-video.html
    └── tab-video.js
```

## สิ่งที่ทำไปแล้ว

### 1. Manifest V3

ไฟล์: `manifest.json`

ทำแล้ว:

- ตั้งค่า Manifest V3
- ใช้ `background.js` เป็น service worker แบบ module
- เปิด side panel ที่ `sidepanel.html`
- มี options page ที่ `options/options.html`
- ตั้ง permissions:
  - `storage`
  - `sidePanel`
  - `activeTab`
  - `scripting`
  - `downloads`
  - `identity`
  - `tabs`
  - `notifications`
- ตั้ง host permissions:
  - TikTok Shop
  - TikTok Open API
  - Google Labs
  - Gemini API
- ตั้ง CSP สำหรับ extension page
- ใช้ PNG icons ตามขนาด `16/48/128`

### 2. Side Panel App Shell

ไฟล์:

- `sidepanel.html`
- `sidepanel.js`
- `sidepanel.css`

ทำแล้ว:

- UI dark theme
- accent สี TikTok pink `#FE2C55`
- header พร้อมโลโก้และปุ่ม settings
- tab bar 2 แท็บ:
  - `สร้างวิดีโอ`
  - `สินค้า TikTok`
- โหลด tab HTML ด้วย `fetch`
- init logic ของแต่ละ tab ผ่าน ES module
- ใช้ `chrome.storage.local` เก็บ active tab
- มี status box สำหรับ error/success message ภาษาไทย

### 3. Tab สินค้า TikTok

ไฟล์:

- `tabs/tab-products.html`
- `tabs/tab-products.js`
- `modules/tiktok-api.js`

ทำแล้ว:

- UI list สินค้าแบบเหมาะกับ side panel แคบ
- ระบบ Batch Selection: เลือกสินค้าหลายรายการพร้อมกันผ่าน Checkbox
- ระบบ Pagination: แสดงผลหน้าละ 10 รายการ (โหลดล่วงหน้า 100 รายการ)
- search bar
- sort by ชื่อ / ราคา / สต็อก / ค่าคอมมิชชัน (คำนวณจากจำนวนเงินจริง)
- refresh button
- load more button รองรับ page token
- product card แสดง thumbnail, ชื่อสินค้า (แสดงชื่อเต็มไม่ตัดคำ), ราคา, stock, ค่าคอมมิชชัน
- ปุ่มสร้างวิดีโอ (Batch Create) เมื่อเลือกหลายรายการ:
  - เก็บข้อมูลสินค้าเข้า `productQueue` ใน `chrome.storage.local`
  - switch ไปแท็บสร้างวิดีโอเพื่อทำรายการแบบสายพาน
- การดึงสินค้า route ผ่าน background message `FETCH_PRODUCTS`
- มี TikTok OAuth starter ผ่าน `chrome.identity.launchWebAuthFlow`
- รองรับการใส่ access token เองใน Options

ข้อจำกัดปัจจุบัน:

- TikTok OAuth ยังไม่ได้ exchange `code` เป็น access token จริง เพราะต้องมี TikTok app secret/backend ที่ปลอดภัย
- endpoint Showcase ใช้ตามสเปกใน prompt แต่ production อาจต้องปรับตาม API จริงของบัญชี/region

### 4. Tab สร้างวิดีโอ

ไฟล์:

- `tabs/tab-video.html`
- `tabs/tab-video.js`
- `modules/prompt-builder.js`
- `modules/image-analyzer.js`
- `modules/google-flow.js`
- `modules/video-output.js`

ทำแล้ว:

- ระบบ Batch Processing Dashboard (แบบรายการ):
  - ส่วนตั้งค่าภาพรวม (Global Settings) ไว้ด้านล่าง (Style Dropdown, Hook, Mood, Location)
  - ส่วนคิวสินค้า (Product Queue) ไว้ด้านบนสุด แสดงสินค้าทั้งหมดที่เลือกมา
  - แต่ละสินค้าอยู่ในรูปแบบ Accordion พร้อมปุ่มลบ (❌) ที่หัวข้อเพื่อความรวดเร็ว
  - สถานะสินค้าชัดเจน: รอดำเนินการ, วิเคราะห์แล้ว, Phase 1, Phase 2, พร้อมโพสต์
- ส่วนจัดการรายสินค้า (ใน Accordion):
  - โชว์รูปจิ๋วข้างชื่อสินค้าเพื่อประหยัดพื้นที่
  - แก้ไขชื่อสินค้ารายชิ้นได้ (ไม่รวมราคา เพื่อความคลีนในวิดีโอ)
  - ปุ่มวิเคราะห์ AI รายชิ้น (หาจุดขาย)
  - Prompt Preview รายชิ้น ( build ตาม global settings + ข้อมูลสินค้า)
  - ปุ่มเปิด Google Flow Phase 1 / Phase 2 รายชิ้น
  - อัพโหลด Approved Image และใส่ Video URL รายชิ้น
- การตั้งค่าภาพรวม (แปลไทย 100%):
  - สไตล์วิดีโอ (Dropdown 8 styles พร้อมคำอธิบาย)
  - การเปิดคลิป (Hook)
  - อารมณ์ (Mood) และ ฉากสถานที่ (Location)
  - มุมกล้องและการตัดต่อ (Camera Movement, Pacing, Transition)
- ผลลัพธ์และการโพสต์:
  - วิดีโอจะถูกสร้างโดยไม่มีการใส่ราคา (เน้นความสวยงามและปักตะกร้าแทน)
  - ดาวน์โหลดวิดีโอรายชิ้น
  - โพสต์ลง TikTok + ปักตะกร้า รายชิ้น

### 5. Prompt Builder

ไฟล์: `modules/prompt-builder.js`

ทำแล้ว:

- เก็บ `VIDEO_STYLES` ครบ 8 style พร้อมคำอธิบาย `shotPattern` ภาษาไทย
- `getDefaultSettings` (ลบ Color Palette และ Lighting Style ออก เพื่อความมินิมัล)
- `getDefaultProductInfo`
- `sanitizeText`
- `buildImagePrompt(productInfo, settings)` (ใช้ Location แทน Lighting)
- `buildVideoPrompt(productInfo, settings)` (ไม่ใส่ราคาลงใน Video Prompt)
- `buildCaption(productInfo, defaults)`

Prompt ออกแบบเป็นภาษาอังกฤษตาม Google Flow แต่ UI นำเสนอเป็นภาษาไทย 100% และล็อควิดีโอเป็น 8 วินาที 9:16

### 6. Image Analyzer

ไฟล์: `modules/image-analyzer.js`

ทำแล้ว:

- `fileToDataUrl`
- `analyzeProductImages`
- ถ้ามี Gemini API key ใน `chrome.storage.sync.settings.geminiApiKey` จะเรียก Gemini `generateContent` API
- ใช้ model จาก `chrome.storage.sync.settings.geminiModel` หรือ default เป็น `gemini-2.0-flash`
- ถ้าไม่มี API key จะ fallback จากชื่อสินค้า/title ที่กรอกไว้
- ถ้าไม่มี API key และไม่มีชื่อสินค้า ระบบจะแจ้งให้กรอกชื่อสินค้า/title ก่อนวิเคราะห์

ข้อควรระวัง:

- browser extension เรียก Gemini API ตรงได้ แต่ production ควรใช้ backend proxy เพื่อไม่ expose API key ฝั่ง client
- endpoint ปัจจุบันใช้ `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

### 7. Google Flow Automation

ไฟล์:

- `modules/google-flow.js`
- `background.js`

ทำแล้ว:

- side panel ส่ง message `OPEN_GOOGLE_FLOW`
- background เปิด tab ใหม่ที่ `https://labs.google/fx/tools/flow`
- รอ tab โหลดเสร็จ
- inject script เพื่อหา `textarea`, `contenteditable`, หรือ input text
- ใส่ prompt ลง field ถ้าพบ
- แสดง notification และ overlay ในหน้า Flow

ข้อจำกัดปัจจุบัน:

- ยังไม่สามารถ upload reference image เข้า Google Flow อัตโนมัติแบบเสถียร เพราะ UI ของ Google Flow อาจเปลี่ยนและ file input อาจถูกป้องกัน
- ตอนนี้ extension แจ้งให้ user upload/reference image เองถ้า Flow ต้องการ

### 8. Video Output

ไฟล์: `modules/video-output.js`

ทำแล้ว:

- `downloadVideo(url, productInfo)`
- ส่ง message `DOWNLOAD_VIDEO` ไป background
- background ใช้ `chrome.downloads.download`
- ตั้งชื่อไฟล์เป็น `[ชื่อสินค้า]_[วันที่]_tiktok.mp4`
- `publishVideo(videoUrl, productInfo)` สร้าง payload และ caption

ข้อจำกัดปัจจุบัน:

- `POST_TO_TIKTOK` ใน background เป็น placeholder
- ยังไม่ได้ยิง TikTok Content Posting API จริง เพราะต้องมี app approval, endpoint, token flow และ product link integration ที่ถูกต้อง
- payload ล่าสุดจะถูกเก็บใน `chrome.storage.local.lastTikTokPostPayload` เพื่อ debug

### 9. Options Page

ไฟล์:

- `options/options.html`
- `options/options.js`

ทำแล้ว:

- TikTok Account:
  - username
  - client id
  - access token
  - refresh token
  - disconnect/save
- AI Settings:
  - Gemini API Key
  - Gemini Model
  - test connection แบบเบื้องต้น
- Video Defaults:
  - default video style
  - video length 8 วินาที
  - default language
- TikTok Post Defaults:
  - caption template
  - hashtags
  - auto-add product link
- บันทึกลง `chrome.storage.sync`

### 10. Icons

ไฟล์:

- `assets/icon.svg`
- `assets/icon16.png`
- `assets/icon48.png`
- `assets/icon128.png`
- `scripts/generate-icons.js`

ทำแล้ว:

- สร้าง SVG logo สำหรับแสดงใน UI
- สร้าง PNG icons สำหรับ manifest
- script generate PNG ทำงานได้ด้วย Node.js ล้วน ไม่ต้องติดตั้ง dependency

## Message Passing ที่ใช้

ใน `background.js` มี message types:

```text
FETCH_PRODUCTS
OPEN_GOOGLE_FLOW
DOWNLOAD_VIDEO
POST_TO_TIKTOK
```

รายละเอียด:

- `FETCH_PRODUCTS`: เรียก `fetchShowcaseProducts` จาก `modules/tiktok-api.js`
- `OPEN_GOOGLE_FLOW`: เปิด Google Flow และ inject prompt
- `DOWNLOAD_VIDEO`: download URL ด้วย `chrome.downloads.download`
- `POST_TO_TIKTOK`: placeholder สำหรับ upload/post จริง

## Storage ที่ใช้

### chrome.storage.local

ใช้กับ state ระหว่าง tabs และ workflow:

```js
{
  activeTab: "video" | "products",
```js
{
  activeTab: "video" | "products",
  productQueue: [
    {
      productId,
      name,
      price,
      imageUrls,
      approvedImage,
      videoUrl,
      highlights,
      status, // idle, analyzed, flow1, flow2, done
    }
  ],
  selectedProduct: {}, // legacy single item fallback
  creatorState: {
    settings, // Global Video Settings
  },
  lastTikTokPostPayload: {}
}
```
}
```

### chrome.storage.sync

ใช้กับ settings/token:

```js
{
  settings: {
    tiktokUsername,
    tiktokClientId,
    geminiApiKey,
    geminiModel,
    defaultVideoStyle,
    defaultLanguage,
    postDefaults: {
      captionTemplate,
      hashtags,
      autoAddProductLink
    }
  },
  tiktokAuth: {
    accessToken,
    refreshToken,
    expiresAt
  }
}
```

## วิธีโหลดทดสอบใน Chrome

1. เปิด `chrome://extensions`
2. เปิด Developer mode
3. กด Load unpacked
4. เลือกโฟลเดอร์:

```text
/Users/pae/Desktop/aivideoshop/tiktok-video-creator
```

5. คลิก icon extension เพื่อเปิด side panel

## คำสั่งตรวจสอบที่รันแล้ว

รันจากโฟลเดอร์ `tiktok-video-creator`:

```bash
find . -name '*.js' -exec node --check {} \;
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"
file assets/icon16.png assets/icon48.png assets/icon128.png
```

ผลลัพธ์:

- JavaScript syntax ผ่านทุกไฟล์
- `manifest.json` parse ได้
- PNG icons ถูกต้องครบ 3 ขนาด

## งานที่ควรทำต่อ

### Priority 1 - ทดสอบโหลด extension จริง

ต้องโหลดใน Chrome เพื่อเช็ก:

- manifest warning/error
- side panel เปิดได้จริง
- tab switching
- options page
- storage sync/local
- Google Flow tab เปิดและ inject prompt ได้จริงหรือไม่

### Priority 2 - TikTok API จริง

ต้องทำเพิ่ม:

- สร้าง TikTok developer app
- ตั้ง redirect URL จาก `chrome.identity.getRedirectURL("tiktok")`
- ทำ backend endpoint สำหรับ exchange OAuth code เป็น token
- ทำ refresh token flow
- ตรวจ endpoint ดึง Showcase Product จริงตามสิทธิ์บัญชี
- map response fields ให้ตรง production

ไฟล์ที่เกี่ยวข้อง:

- `modules/tiktok-api.js`
- `background.js`
- `options/options.js`

### Priority 3 - TikTok Content Posting API

ต้องทำเพิ่ม:

- เพิ่ม endpoint upload video จริง
- เพิ่ม init/upload/publish flow ตาม TikTok API ปัจจุบัน
- ผูก product link/ตะกร้า ถ้า API อนุญาต
- เพิ่ม progress bar จริงใน UI
- handle error code จาก TikTok

ไฟล์ที่เกี่ยวข้อง:

- `modules/video-output.js`
- `modules/tiktok-api.js`
- `background.js`
- `tabs/tab-video.js`

### Priority 4 - Google Flow automation

ควรทดสอบกับ UI จริงของ Google Flow แล้วปรับ:

- selector ของ prompt input
- flow สำหรับ reference image
- reuse tab เดิมแทนเปิดใหม่ทุกครั้ง
- detect page readiness ให้แม่นขึ้น
- fallback copy prompt ถ้า inject ไม่ได้

ไฟล์ที่เกี่ยวข้อง:

- `background.js`
- `modules/google-flow.js`

### Priority 5 - UX polish

ควรเพิ่ม:

- loading state ปุ่มวิเคราะห์ภาพ
- disabled state ตอน field ไม่พร้อม
- validation form ก่อนเปิด Flow
- empty state ที่ละเอียดขึ้น
- progress bar ตอน post TikTok
- mock products สำหรับ demo mode ถ้ายังไม่มี token

ไฟล์ที่เกี่ยวข้อง:

- `tabs/tab-video.js`
- `tabs/tab-products.js`
- `sidepanel.css`

## ข้อควรระวังสำหรับ AI ที่มาทำต่อ

- อย่าใส่ API key หรือ token ลง source code
- อย่าเปลี่ยนเป็น framework/bundler ถ้าไม่ได้จำเป็น เพราะโปรเจกต์ตั้งใจให้โหลดเป็น unpacked extension ได้ตรง ๆ
- ถ้าแก้ path ใน tab HTML ต้องจำไว้ว่า HTML ถูก fetch มาใส่ใน `sidepanel.html` ดังนั้น relative path ของ asset ควรอิงจาก root ของ extension เช่น `assets/icon.svg`
- ถ้าเพิ่ม inline style/script ต้องตรวจ CSP ใน `manifest.json`
- ถ้าเพิ่ม network domain ต้องเพิ่มใน `host_permissions` และ `connect-src`
- อย่า log token/access token ลง console
- Error message ที่ user เห็นควรเป็นภาษาไทย

## สถานะปัจจุบัน

สถานะ: **prototype ใช้งาน UI ได้ / integration จริงบางส่วนยังเป็น placeholder**

พร้อมสำหรับ:

- โหลดเป็น unpacked extension
- ทดลองสร้าง prompt
- ทดลอง upload/preview image
- ทดลอง workflow Phase 1/Phase 2 กับ Google Flow แบบกึ่ง manual
- บันทึก settings/token

ยังไม่พร้อม production:

- TikTok OAuth/token exchange จริง
- TikTok Showcase API production validation
- TikTok Content Posting API จริง
- Google Flow reference image upload automation แบบ fully automatic
