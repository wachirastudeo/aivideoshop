# TikTok Video Creator Extension - Project Handoff

*อัพเดตล่าสุด: 30 พฤษภาคม 2026*

## ภาพรวมโปรเจกต์

โปรเจกต์นี้คือ Chrome Extension แบบ Manifest V3 ชื่อ **TikTok Video Creator** สำหรับช่วย TikTok seller สร้างวิดีโอขายสินค้าเร็วขึ้นผ่าน side panel ของ Chrome

เป้าหมายหลัก:

1. ดึงสินค้าจาก TikTok Showcase
2. เลือกสินค้าหรืออัพโหลดภาพสินค้าเอง
3. สร้าง prompt สำหรับ Google Flow แบบ 2 phase
4. Phase 1: สร้างภาพสินค้าใหม่ให้สวยก่อน
5. Phase 2: ใช้ภาพที่ approve แล้วสร้างวิดีโอ 8 วินาที
6. ดาวน์โหลดวิดีโอ หรือเตรียมโพสต์ลง TikTok พร้อม product link
7. ตั้งค่าการโพสต์ TikTok แยกใน Tab 3 และให้ระบบดาวน์โหลดก่อนอัปโหลด/โพสต์อัตโนมัติ

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
    ├── tab-post.html
    ├── tab-post.js
    ├── tab-video.html
    └── tab-video.js
```

## สิ่งที่ทำไปแล้ว

### 1. Manifest V3
(คงเดิม)

### 2. Side Panel App Shell
(คงเดิม)

### 3. Tab สินค้า TikTok
(คงเดิม)

### 4. Tab สร้างวิดีโอ
(อัปเดต): หลังสร้างวิดีโอเสร็จสามารถเลือกได้ว่าจะดาวน์โหลดอย่างเดียว, ดาวน์โหลด + บันทึกแบบร่าง TikTok, หรือดาวน์โหลด + โพสต์ TikTok โดย flow TikTok จะดาวน์โหลดไฟล์ก่อนเสมอ แล้วจึงเปิด/โฟกัส `https://www.tiktok.com/tiktokstudio/upload` เพื่ออัปโหลดต่อ

### 4.1 Tab ตั้งค่าโพสต์ TikTok
ไฟล์:
- `tabs/tab-post.html`
- `tabs/tab-post.js`

ความสามารถ:
- ตั้งค่า action หลังสร้างวิดีโอ: `download`, `draft`, `post`, `both`
- Auto-save ทุก field ลง `chrome.storage.sync.settings.postDefaults`
- ตั้ง caption template พร้อม variables: `{product_name}`, `{product_id}`, `{price}`, `{product_details}`, `{highlights}`, `{shop_name}`, `{cta}`
- จำกัด hashtags สูงสุด 5 อัน
- บังคับเปิด AI-generated disclosure เสมอ (`aiGenerated: true`)
- ตั้งค่า privacy, schedule time, location, comments, reuse
- ปุ่มเปิด `https://www.tiktok.com/tiktokstudio/upload`

### 5. Prompt Builder
(คงเดิม)

### 6. Image Analyzer
(คงเดิม)

### 7. Google Flow Automation (อัปเดต)
ไฟล์:
- `background.js`
- `modules/google-flow.js`

อัปเดต:
- ปรับปรุงการตรวจหาปุ่ม "New project" ให้เป็นแบบ **Language-Agnostic** (ใช้ icon ตรวจสอบแทน text)
- แก้ไขปัญหา **CSP Violation** โดยย้ายการ `fetch()` ภาพมาทำในฝั่ง Client (Target Page Context) แทนการ fetch จาก background ทำให้โหลดภาพจาก TikTok CDN ได้สำเร็จ
- เพิ่ม logic รอการ Generate ผลลัพธ์ให้เสร็จสมบูรณ์ก่อนคืนค่า Status "สำเร็จ"

### 8. Video Output
(อัปเดต): `modules/video-output.js` จัดการ download และส่ง payload ไป `TIKTOK_SEND_DRAFT` สำหรับ TikTok Studio automation

รายละเอียด:
- ชื่อไฟล์ใช้ `productId`: `${productId}_${YYYY-MM-DD}_tiktok.mp4`
- `publishVideo()` ไม่ใช้ placeholder `POST_TO_TIKTOK` แล้ว แต่ส่งไป background เพื่อเปิด TikTok Studio upload page
- ส่ง `productId`, `productUrl`, `productName`, `filename`, `caption`, `hashtags`, schedule/privacy/permission settings ไป content script

### 8.1 TikTok Studio Automation
ไฟล์:
- `background.js`
- `content/tiktok-studio-automation.js`
- `modules/video-output.js`

Flow:
1. ถ้า TikTok Studio upload tab เปิดอยู่ จะ focus tab นั้น
2. ถ้ามี TikTok Studio tab อื่น จะเปลี่ยน URL เป็น `https://www.tiktok.com/tiktokstudio/upload`
3. ถ้าไม่มี tab จะสร้าง tab ใหม่ที่ `https://www.tiktok.com/tiktokstudio/upload`
4. ดาวน์โหลด/แปลงวิดีโอ แล้ว inject เข้า file input
5. กรอก caption + hashtags (สูงสุด 5)
6. เปิด AI-generated content เสมอ
7. ตั้ง privacy, schedule, location, comments/reuse ตาม settings
8. เพิ่ม product link โดยใช้ `productId`:
   - คลิก `เพิ่มลิงก์`
   - คลิก `ถัดไป`
   - เลือก `นำเสนอสินค้า`
   - ค้นหาด้วย `productId`
   - เลือกสินค้า
   - คลิก `ถัดไป`
   - ตั้งชื่อสินค้าไม่เกิน 25 ตัวอักษร
   - คลิก `เพิ่ม`
9. บันทึกแบบร่างหรือโพสต์ตาม settings

### 9. Options Page
(คงเดิม)

### 10. Icons
(คงเดิม)

## Message Passing ที่ใช้

ใน `background.js` มี message types:

```text
FETCH_PRODUCTS
OPEN_GOOGLE_FLOW
DOWNLOAD_VIDEO
POST_TO_TIKTOK
TIKTOK_SEND_DRAFT
TIKTOK_UPLOAD_VIDEO
```

รายละเอียด:

- `FETCH_PRODUCTS`: เรียก `fetchShowcaseProducts` จาก `modules/tiktok-api.js`
- `OPEN_GOOGLE_FLOW`: เปิด Google Flow และ inject prompt
- `DOWNLOAD_VIDEO`: download URL ด้วย `chrome.downloads.download`
- `POST_TO_TIKTOK`: legacy placeholder
- `TIKTOK_SEND_DRAFT`: เปิด/โฟกัส TikTok Studio upload page, เตรียมวิดีโอ, ส่ง payload ไป content script
- `TIKTOK_UPLOAD_VIDEO`: content script อัปโหลดวิดีโอ กรอกข้อมูล ตั้งค่าโพสต์ เพิ่ม product link และ save draft/post

## Storage ที่ใช้

### chrome.storage.local

ใช้กับ state ระหว่าง tabs และ workflow:

```js
{
  activeTab: "video" | "products" | "post",
  productQueue: [
    {
      productId,
      name,
      price,
      imageUrls,
      approvedImage,
      videoUrl,
      productUrl,
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
      autoAddProductLink,
      afterCreateAction, // download | draft | post | both
      defaultMode, // draft | now | schedule
      privacy,
      scheduleTime,
      location,
      aiGenerated, // forced true
      allowComment,
      allowReuse,
      confirmPost
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

### Priority 3 - TikTok Studio Posting Automation

ทำแล้วบางส่วน:

- เปิด/โฟกัส `https://www.tiktok.com/tiktokstudio/upload` อัตโนมัติ
- อัปโหลดวิดีโอผ่าน UI automation
- กรอก caption/hashtags/settings
- เพิ่ม product link จาก `productId`
- save draft/post ตาม settings

ต้องทำเพิ่ม:

- ทดสอบ live หลังอัปโหลดจริงครบ flow ทุก modal
- เพิ่ม progress bar จริงใน UI
- เพิ่ม fallback selector เมื่อ TikTok Studio เปลี่ยน UI
- handle error เฉพาะของ TikTok Studio ให้ละเอียดขึ้น

ไฟล์ที่เกี่ยวข้อง:

- `modules/video-output.js`
- `modules/tiktok-api.js`
- `background.js`
- `tabs/tab-video.js`

### Priority 4 - Google Flow automation

การทำ Auto-Flow (Playwright-like) ถูกพัฒนาให้ใช้งานได้เกือบสมบูรณ์แล้ว:

- รองรับการ Reuse Tab เพื่อป้องกันเครื่องหน่วง
- รองรับการตั้งค่า Image/Video และ 9:16 สัดส่วนอัตโนมัติ
- รองรับการอัปโหลด Reference Image อัตโนมัติ

สิ่งที่อาจต้องทำเพิ่มในอนาคต:

- การดักจับ Error กรณี AI ของ Google Flow สร้างภาพไม่ผ่าน (เช่น ติด Policy) เพื่อให้คิวงานไม่ค้าง
- ปรับจูน Timeout หรือคีย์เวิร์ดหาก UI ของ Google Flow มีการเปลี่ยนแปลง

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
- ทดลอง workflow Phase 1/Phase 2 กับ Google Flow แบบ Fully Automatic E2E
- บันทึก settings/token
- ตั้งค่า TikTok posting ใน Tab 3
- ดาวน์โหลดวิดีโอแล้วอัปโหลดต่อไป TikTok Studio ผ่าน UI automation
- ตั้งชื่อไฟล์ด้วย `productId`
- สร้าง caption จาก product details และจำกัด hashtags สูงสุด 5
- บังคับเปิด AI-generated disclosure

ยังไม่พร้อม production:

- TikTok OAuth/token exchange จริง
- TikTok Showcase API production validation
- TikTok Content Posting API official endpoint จริง
- TikTok Studio UI automation ยังต้องทดสอบ live หลังอัปโหลดจริงทุกขั้นตอน
