# Master Prompt — TikTok Video Creator Chrome Extension

> **วิธีใช้**: Copy prompt นี้ทั้งหมดไปวางใน Claude / ChatGPT / Cursor ก็ได้  
> แนะนำใช้กับ **Claude Sonnet** หรือ **Cursor AI** เพื่อผล coding ที่ดีที่สุด

---

## 🧠 Context ให้ AI รู้จัก Project

```
คุณเป็น senior full-stack developer ที่เชี่ยวชาญการเขียน Chrome Extension (Manifest V3)
และมีประสบการณ์กับ TikTok API, Google Labs tools และ browser automation

Project นี้คือ Chrome Extension ชื่อ "TikTok Video Creator"
เป้าหมาย: ช่วย TikTok seller สร้างวิดีโอขายสินค้าได้เร็ว โดย
1. ดึงสินค้าจาก TikTok Showcase ของตัวเอง
2. ส่งข้อมูลสินค้าไป generate วิดีโอที่ Google Flow (labs.google/fx/tools/flow)
3. โพสต์วิดีโอลง TikTok พร้อมปักตะกร้า หรือ download ไว้ในเครื่อง

Extension จะแสดงเป็น side panel เล็กๆ ด้านขวาของ browser
```

---

## 📁 โครงสร้าง Project ที่ต้องสร้าง

```
tiktok-video-creator/
├── manifest.json              # MV3, permissions, side_panel config
├── background.js              # Service worker: API calls, message routing
├── sidepanel.html             # Main UI entry point
├── sidepanel.js               # Tab switching, state management
├── sidepanel.css              # Styles
│
├── tabs/
│   ├── tab-video.html         # Tab 1: Video creator UI
│   ├── tab-video.js           # Tab 1: logic
│   ├── tab-products.html      # Tab 2: Product list UI
│   └── tab-products.js        # Tab 2: TikTok API fetch + display
│
├── modules/
│   ├── prompt-builder.js      # สร้าง video prompt จาก product data + style
│   ├── image-analyzer.js      # วิเคราะห์ภาพสินค้าด้วย AI (Claude/GPT vision)
│   ├── google-flow.js         # Automation ไปหน้า Google Flow + inject prompt
│   ├── tiktok-api.js          # TikTok Showcase API + Post API wrapper
│   └── video-output.js        # จัดการ download / post to TikTok
│
├── options/
│   ├── options.html           # Settings page
│   └── options.js             # บันทึก TikTok token, preferences
│
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## 🔧 Step 1 — manifest.json

```
สร้าง manifest.json สำหรับ Chrome Extension Manifest V3 ที่มี:

permissions:
  - storage          (เก็บ token และ settings)
  - sidePanel        (แสดงเป็น side panel ด้านขวา)
  - activeTab        (อ่าน URL ของ tab ปัจจุบัน)
  - scripting        (inject script เข้าหน้า Google Flow)
  - downloads        (download วิดีโอ)
  - identity         (TikTok OAuth ถ้าจำเป็น)

host_permissions:
  - https://shop.tiktok.com/*
  - https://open.tiktokapis.com/*
  - https://labs.google/*
  - https://api.anthropic.com/*   (ถ้าจะใช้ Claude วิเคราะห์ภาพ)

side_panel:
  default_path: sidepanel.html

action:
  เปิด side panel เมื่อคลิก icon
```

---

## 🎨 Step 2 — UI / sidepanel.html

```
สร้าง sidepanel.html เป็น single-page app ขนาด 380px กว้าง
ใช้ vanilla HTML + CSS + JS (ไม่ต้องใช้ framework)

Design:
- Dark theme, สี accent เป็น TikTok pink (#FE2C55) และ white
- Font: system-ui หรือ -apple-system
- มี header เล็กๆ แสดง logo + ชื่อ extension
- มี tab bar 2 แท็บ:
    แท็บ 1: "🎬 สร้างวิดีโอ"
    แท็บ 2: "🛍️ สินค้า TikTok"
- Content area ด้านล่าง switch ตาม tab ที่เลือก
- แต่ละ section มี scroll ได้อิสระ

State management:
- ใช้ Chrome Storage sync เก็บ: selectedProduct, videoStyle, settings
- ส่งข้อมูลระหว่าง tab ผ่าน chrome.storage.local (ไม่ใช่ DOM)
```

---

## 🎬 Step 3 — Tab 1: สร้างวิดีโอ (tab-video.js)

### 3A — Section: อัพโหลด/นำเข้าภาพสินค้า

```
สร้าง section "ภาพสินค้า" ที่:

1. มีปุ่ม "อัพโหลดภาพ" → input type=file รับ jpg/png/webp หลายภาพ
2. แสดง preview thumbnails ของภาพที่อัพ
3. ถ้ามีสินค้าถูกส่งมาจาก Tab 2 → ดึงภาพ URL มาแสดงแทน
4. ปุ่ม "วิเคราะห์ภาพ" → เรียก image-analyzer.js ที่ส่งภาพให้ Claude Vision
   และดึง: ชื่อสินค้า, จุดเด่น, กลุ่มเป้าหมาย, คำแนะนำ prompt
5. แสดงผลวิเคราะห์เป็น editable text ให้ user แก้ได้ก่อนสร้างวิดีโอ
```

### 3B — Section: ข้อมูลสินค้า

```
Form ที่มี field:
- ชื่อสินค้า (text input)
- ราคา (number input + สกุลเงิน dropdown: THB/USD)
- จุดขาย/ไฮไลต์ (textarea, 3 bullet points)
- กลุ่มเป้าหมาย (dropdown: สาวออฟฟิศ / แม่บ้าน / วัยรุ่น / ทั่วไป / กรอกเอง)
- Call to action (text: เช่น "สั่งได้เลย" "ราคาพิเศษวันนี้")

ถ้าข้อมูลถูก auto-fill จากการวิเคราะห์ภาพ → แสดง badge "AI แนะนำ" 
user ยังแก้ได้ทุก field
```

### 3C — Section: เลือกสไตล์วิดีโอ

```
สร้าง UI เลือกสไตล์วิดีโอแบบ card grid (2 คอลัมน์)
แต่ละการ์ดต้องแสดง: emoji + ชื่อสไตล์ + คำอธิบาย + ตัวอย่าง shot สั้นๆ
เมื่อเลือก → ไฮไลต์การ์ดนั้น (border สี TikTok pink #FE2C55)

สไตล์ที่มีให้เลือก:

1. 🎯 Review สินค้า
   คำอธิบาย: โชว์สินค้าชัดทุกมุม ครบ feature
   Shot pattern: [สินค้า 360°] → [zoom feature หลัก] → [ราคา+CTA]
   prompt fragment: "clean product showcase, multiple angles,
   feature callout text overlays, white or neutral background,
   professional lighting, no distractions"

2. 💃 Lifestyle / In-Use
   คำอธิบาย: สินค้าอยู่ในชีวิตจริง บรรยากาศสบายๆ
   Shot pattern: [scene ชีวิตประจำวัน] → [คนใช้สินค้า] → [สินค้า close-up]
   prompt fragment: "lifestyle product video, natural environment,
   person using product, warm natural lighting, authentic feel,
   UGC-style organic look"

3. 🔥 Flash Sale / Urgency
   คำอธิบาย: กระตุ้นซื้อ ราคาเด่น เวลาจำกัด
   Shot pattern: [สินค้า] → [ราคาเก่าขีดฆ่า/ราคาใหม่] → [countdown/CTA]
   prompt fragment: "high energy flash sale ad, bold price comparison
   text, red and white color scheme, fast cuts every 1-2 seconds,
   urgency visual elements, countdown timer graphic"

4. 📦 Unboxing
   คำอธิบาย: แกะกล่อง สร้างความตื่นเต้น first impression
   Shot pattern: [กล่องปิด] → [แกะ tissue/foam] → [สินค้าโผล่] → [detail]
   prompt fragment: "unboxing video style, hands opening package,
   reveal moment with dramatic pause, close-up on product details,
   satisfying unwrapping, tissue paper, ASMR aesthetic"

5. 🌟 Before / After
   คำอธิบาย: เปรียบเทียบก่อน-หลัง ผลลัพธ์ชัดเจน
   Shot pattern: [ปัญหาก่อน] → [transition effect] → [ผลหลังใช้]
   prompt fragment: "before and after comparison, split screen or
   transition wipe effect, problem state then solution state,
   dramatic improvement reveal, text labels Before / After"

6. 👩 Testimonial / UGC Style
   คำอธิบาย: เหมือนคนจริงรีวิว น่าเชื่อถือ
   Shot pattern: [พูดถึงสินค้า] → [โชว์สินค้า] → [แนะนำ]
   prompt fragment: "user generated content style, talking head,
   handheld camera feel, natural lighting, genuine review vibe,
   person holding product, casual authentic presentation"

7. ✨ Cinematic / Premium
   คำอธิบาย: ดูแพง หรูหรา เหมาะสินค้า premium
   Shot pattern: [สินค้า slow motion] → [detail macro shot] → [brand moment]
   prompt fragment: "cinematic product advertisement, slow motion,
   luxury feel, dark moody or bright airy lighting, macro close-ups,
   smooth camera movements, premium brand aesthetic, no text clutter"

8. 🎵 Trending Sound / Hook
   คำอธิบาย: เน้นช่วงแรก 3 วินาที hook คนหยุดดู
   Shot pattern: [visual hook แรงมาก] → [สินค้า] → [CTA เร็ว]
   prompt fragment: "attention-grabbing opening 3 seconds, bold hook
   visual, quick product reveal, trending TikTok pacing, text hook
   overlay at start, fast energetic edit"
```

### 3D — Section: ตั้งค่าวิดีโอ (ละเอียดขึ้น)

```
แบ่งเป็น 4 กลุ่มย่อย แต่ละกลุ่มเป็น collapsible row
UI style: icon + label + control บนบรรทัดเดียว ประหยัดพื้นที่

─── 🎬 โครงสร้างวิดีโอ ───────────────────────────

ความยาว: fixed 8 วินาที (ไม่มี option เปลี่ยน ล็อคไว้ก่อน)
  แสดงเป็น label "⏱ 8 วินาที" สีเทา ไม่ใช่ปุ่มกด

Hook แรก (3 วินาทีแรก): dropdown
  - ❓ คำถามกระตุ้น  ("รู้ไหมว่า...?")
  - 😱 Shock/Surprise (ภาพสินค้าเต็มจอทันที)
  - 🔢 ตัวเลขน่าสนใจ ("ลด 70% วันนี้เท่านั้น")
  - 🎭 Problem First  ("เคยเจอปัญหานี้ไหม?")
  - ✨ Result First   (โชว์ผลลัพธ์ก่อนเลย)

จำนวน Scene: fixed 2–3 scene (เหมาะกับ 8 วินาที)
  แนะนำ: Scene 1 (0-4วิ) hook+สินค้า / Scene 2 (4-8วิ) CTA

─── 🎨 ภาพและบรรยากาศ ───────────────────────────

Mood/บรรยากาศ: pill buttons (เลือกได้ 1)
  สดใส / หรูหรา / น่ารัก / Professional / Trendy / มินิมัล / Dark & Moody

Color Palette: dropdown
  - Auto (AI เลือกให้ตามสินค้า)
  - White & Clean      (สะอาด ดูดี)
  - Warm Tones         (ส้ม ครีม เบจ)
  - Bold & Vibrant     (สีจัด โดดเด่น)
  - Dark & Luxurious   (ดำ ทอง)
  - Pastel Soft        (พาสเทล น่ารัก)
  - Brand Color        (ให้กรอก hex color เอง)

แสงและสไตล์ภาพ: dropdown
  - Studio Clean       (พื้นขาว แสงสม่ำเสมอ)
  - Natural Daylight   (แสงธรรมชาติ outdoor)
  - Warm Indoor        (แสงอุ่น cozy)
  - Dark Dramatic      (dramatic lighting)
  - Neon/Colorful      (แสงสีสัน)

─── 📝 Text & Caption ───────────────────────────

ภาษาใน video: pill buttons → ไทย / English / ทั้งคู่

Text ที่ต้องโชว์ใน video:
  - ชื่อสินค้า: checkbox (default ON)
  - ราคา: checkbox + input ราคาจริง เช่น "฿299"
  - Promotion text: text input → เช่น "ลด 50%" / "ส่งฟรี" / "พร้อมส่ง"
  - Call to Action: dropdown
      "กดซื้อได้เลย" / "ลิงก์ในไบโอ" / "คอมเมนต์สั่งได้" / "สั่งในไลฟ์" / กรอกเอง

Text Position: dropdown
  - Bottom safe area  (ใต้สุด ไม่โดน TikTok UI บัง)
  - Center overlay    (กลางจอ)
  - Top third         (บนจอ)

─── 🎥 กล้องและการตัดต่อ ─────────────────────────

Camera Movement: dropdown
  - Auto (AI เลือกตามสไตล์)
  - Slow Zoom In       (ค่อยๆ ซูมหาสินค้า)
  - Orbit / 360°       (วนรอบสินค้า)
  - Pan Left→Right     (กวาดซ้ายไปขวา)
  - Static/Still       (นิ่ง ดูสะอาด)
  - Handheld Shake     (เหมือนถือกล้องเอง UGC feel)
  - Push In Fast       (ซูมเร็ว dramatic)

Pacing / จังหวะตัด: slider 3 ระดับ
  ช้า (Cinematic) ──●────── เร็ว (Viral)
  → แปลงเป็น prompt: "slow cinematic pacing, cuts every 5-7s" 
                  หรือ "rapid cuts every 1-2 seconds, high energy"

Transition Style: dropdown
  - Auto / Cut ตรง / Zoom Transition / Swipe / Fade / Whip Pan
```

### 3D-bonus — Preview Prompt ก่อน Generate

```
⭐ สิ่งที่เพิ่มใน v2 ของ section นี้: Prompt Preview Panel

ด้านล่างสุดของ settings มีกล่อง "Prompt ที่จะส่งไป Google Flow"
- แสดง prompt ภาษาอังกฤษที่ build มาจากทุก option ที่เลือก
- Real-time update ทุกครั้งที่ user เปลี่ยน option
- Textarea แก้ได้โดยตรง (ถ้า user อยากปรับ manual)
- ปุ่ม "Copy prompt" สำหรับ copy ไปวางเอง
- ปุ่ม "🚀 เปิด Google Flow" → เรียก google-flow.js inject prompt อัตโนมัติ

ตัวอย่าง prompt ที่ build ได้จาก options:
"Create an 8-second vertical 9:16 TikTok product video for
[ชื่อสินค้า] priced at ฿299.

Scene 1 (0-4s): [hook ที่เลือก] — product center frame,
[camera movement ที่เลือก], [lighting style], [color palette].
Scene 2 (4-8s): Bold CTA — '[CTA text]' text bottom-safe-area,
product full frame, [mood] energy.

Color palette: [palette ที่เลือก]. Pacing: [pacing ที่เลือก].
Text language: Thai. Transition: [transition ที่เลือก]."
```

### 3E — Prompt Builder + Google Flow (2 Phase)

```
Flow ทั้งหมดมี 2 phase โดยทั้งคู่ใช้ https://labs.google/fx/tools/flow

─────────────────────────────────────────────────
PHASE 1 — สร้างภาพสินค้าใหม่ให้สวยก่อน
─────────────────────────────────────────────────

สร้าง function buildImagePrompt(productInfo, settings) ที่ประกอบ prompt
สำหรับ generate ภาพสินค้าใหม่จากข้อมูลที่กรอกและตั้งค่าไว้

input ที่นำมาใช้:
  - productInfo.name          → ชื่อสินค้า
  - productInfo.highlights    → จุดเด่น
  - productInfo.targetGroup   → กลุ่มเป้าหมาย
  - settings.colorPalette     → สีพื้นหลัง/บรรยากาศ
  - settings.lightingStyle    → สไตล์แสง
  - settings.mood             → อารมณ์ภาพ
  - settings.videoStyle       → ใช้ดูว่าสินค้าควรอยู่ในบริบทไหน
  - originalImage             → ภาพสินค้าดั้งเดิม (ส่งเป็น reference)

ตัวอย่าง image prompt ที่ build ได้:
"High quality product photography of [ชื่อสินค้า].
[lighting: soft studio lighting with white background].
[mood: clean and professional]. Product centered, sharp focus,
no distractions. Style reference: [videoStyle context].
Suitable for [targetGroup] audience.
Key visual: [highlights ของสินค้า]."

google-flow.js — Phase 1:
1. เปิด tab ใหม่ไปที่ https://labs.google/fx/tools/flow
2. รอหน้าโหลด (waitForElement ของ input field)
3. inject ภาพสินค้าดั้งเดิมเป็น reference image
4. inject image prompt ลงใน prompt field
5. แสดง notification ใน side panel:
   "📸 Phase 1: กำลังเปิด Google Flow สร้างภาพสินค้า
    → ตรวจสอบ prompt แล้วกด Generate
    → เมื่อได้ภาพที่ชอบแล้ว กลับมากด [ใช้ภาพนี้] ใน extension"

─────────────────────────────────────────────────
รอ user approve ภาพ (ขั้นตอนกลาง)
─────────────────────────────────────────────────

หลังจาก Phase 1 extension แสดง UI รอ:
  [ 🖼️ ภาพที่ generate ได้จาก Google Flow ]  ← ให้ user upload/วางภาพที่ได้มา
  หรือ: ปุ่ม "วางภาพ (Paste)" รับ image จาก clipboard
  
  แสดง: before (ภาพดั้งเดิม) vs after (ภาพที่ generate ใหม่) side by side
  
  ปุ่ม: [✅ ใช้ภาพนี้ไปสร้างวิดีโอ]  [🔄 สร้างภาพใหม่อีกครั้ง]

─────────────────────────────────────────────────
PHASE 2 — สร้างวิดีโอจากภาพที่ approve แล้ว
─────────────────────────────────────────────────

สร้าง function buildVideoPrompt(productInfo, settings, approvedImage) ที่
ประกอบ prompt สำหรับสร้างวิดีโอ โดยใช้ภาพที่ผ่าน Phase 1 มาแล้วเป็นหลัก

ตัวอย่าง video prompt ที่ build ได้:
"Create an 8-second vertical 9:16 TikTok product video.
Use the provided product image as the main visual reference.

Scene 1 (0-4s): [hook ที่เลือก] — product from reference image,
[camera movement], [lighting style], [color palette].
Scene 2 (4-8s): '[CTA text]' text bottom-safe-area,
product full frame, [mood] energy.

Keep product appearance exactly as in the reference image.
Text language: Thai. Transition: [transition].
Pacing: [pacing]."

google-flow.js — Phase 2:
1. ใช้ Google Flow tab เดิม (ถ้ายังเปิดอยู่) หรือเปิดใหม่
2. inject ภาพที่ approve จาก Phase 1 เป็น reference
3. inject video prompt
4. แสดง notification:
   "🎬 Phase 2: พร้อมสร้างวิดีโอแล้ว
    → ตรวจสอบ prompt แล้วกด Generate
    → เมื่อวิดีโอเสร็จ กลับมาเลือก Download หรือ Post TikTok"

─────────────────────────────────────────────────
State management ระหว่าง Phase
─────────────────────────────────────────────────

เก็บ state ใน chrome.storage.local:
{
  phase: 'idle' | 'image_generating' | 'image_approved' | 'video_generating' | 'done',
  originalImage: base64,
  approvedImage: base64,    ← ภาพที่ผ่าน Phase 1
  imagePrompt: string,
  videoPrompt: string,
  productInfo: {...},
  settings: {...}
}

UI ใน side panel แสดง progress indicator:
  ① ตั้งค่า ──✓── ② สร้างภาพ ──●── ③ สร้างวิดีโอ ── ④ เสร็จ
  (highlight step ปัจจุบัน, checkmark step ที่ผ่านแล้ว)
```

### 3F — Section: ผลลัพธ์วิดีโอ

```
หลังจาก user generate วิดีโอใน Google Flow เสร็จ:

แสดงปุ่ม 2 ตัวเลือก:

[📥 Download วิดีโอ]
→ เรียก chrome.downloads.download() บันทึกไฟล์วิดีโอ
→ ตั้งชื่อไฟล์เป็น: [ชื่อสินค้า]_[วันที่]_tiktok.mp4

[📱 โพสต์ลง TikTok + ปักตะกร้า]
→ เรียก tiktok-api.js สำหรับ:
   1. Upload วิดีโอผ่าน TikTok Content Posting API
   2. เพิ่ม caption (auto-generate จาก product info + #hashtags)
   3. เพิ่ม Product Link ปักตะกร้า (ใช้ product_id ที่เก็บไว้จาก Tab 2)
   4. ตั้ง privacy: Public
→ แสดง progress bar ระหว่าง upload
→ แสดง link ไปดูโพสต์เมื่อสำเร็จ
```

---

## 🛍️ Step 4 — Tab 2: สินค้า TikTok (tab-products.js)

### 4A — TikTok API Authentication

```
สร้าง module tiktok-api.js:

1. ตรวจสอบว่ามี TikTok Access Token ใน chrome.storage.sync หรือไม่
2. ถ้าไม่มี → แสดงปุ่ม "เชื่อมต่อ TikTok"
   → เปิด TikTok OAuth flow ผ่าน chrome.identity.launchWebAuthFlow
   → scope ที่ต้องการ: user.info.basic, video.upload, product.list
   → เก็บ access_token และ refresh_token ใน storage

API endpoint สำหรับดึงสินค้า:
GET https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Parameters:
  page_size: 20
  page_token: "" (สำหรับ pagination)

Response fields ที่ต้องเก็บ:
  product_id, product_name, product_image_urls[], 
  price, currency, stock_count, category,
  product_url (TikTok shop link)
```

### 4B — Product List UI

```
สร้าง UI แสดงสินค้าแบบ list (ไม่ใช่ grid เพราะ panel แคบ):

แต่ละรายการสินค้าแสดง:
- รูปสินค้า thumbnail (48x48px)
- ชื่อสินค้า (truncate ถ้ายาวเกิน)
- ราคา (format เป็น ฿ หรือ $ ตาม currency)
- stock count
- ปุ่ม "สร้างวิดีโอ" (icon กล้อง)

Features:
- Search bar กรองชื่อสินค้า
- Sort by: ราคา / ชื่อ / สต็อก
- Pull to refresh (ปุ่ม refresh ด้านบน)
- Infinite scroll / Load more ปุ่ม
- Loading skeleton แสดงระหว่างดึง API

เมื่อกดปุ่ม "สร้างวิดีโอ":
1. เก็บ product data ทั้งหมดรวมถึง product_id ใน chrome.storage.local
2. Switch ไป Tab 1 อัตโนมัติ
3. Auto-fill ข้อมูลสินค้าใน form ของ Tab 1
4. Load รูปสินค้าเป็น preview ใน section ภาพสินค้า
```

---

## ⚙️ Step 5 — Options Page (Settings)

```
สร้างหน้า Options ที่ user เข้าได้จาก right-click icon > Options

Settings ที่ต้องมี:

Section: TikTok Account
- แสดง username ที่ login อยู่
- ปุ่ม Disconnect / Re-connect

Section: AI Settings (ถ้าใช้ Claude วิเคราะห์ภาพ)
- Claude API Key input (masked)
- ปุ่ม Test Connection

Section: Video Defaults
- Default video style (dropdown)
- Default video length (radio)
- Default language (ไทย/English)

Section: TikTok Post Defaults
- Default caption template (textarea)
  Variables ที่ใช้ได้: {product_name}, {price}, {cta}
- Default hashtags (tag input)
- Auto-add product link: toggle

บันทึกทุก setting ลง chrome.storage.sync
```

---

## 🔗 Step 6 — Data Flow & Message Passing

```
สร้าง background.js เป็น service worker ที่จัดการ:

1. Message routing ระหว่าง sidepanel ↔ content scripts
   chrome.runtime.onMessage.addListener(...)
   
   Messages:
   - FETCH_PRODUCTS → เรียก TikTok API → return product list
   - OPEN_GOOGLE_FLOW → เปิด tab + inject prompt
   - POST_TO_TIKTOK → upload video + add product link
   - DOWNLOAD_VIDEO → download file

2. Token refresh: 
   ตรวจ expiry ของ TikTok token ทุกครั้งก่อน API call
   ถ้า expired → auto refresh ผ่าน refresh_token
   ถ้า refresh failed → notify user ให้ login ใหม่

3. Error handling:
   ทุก API error ต้อง catch และส่ง friendly message กลับมาแสดงใน UI
   เช่น "ไม่สามารถดึงสินค้าได้ กรุณาตรวจสอบการเชื่อมต่อ"
```

---

## 🛡️ Step 7 — Security & Best Practices

```
ให้แน่ใจว่าโค้ดปฏิบัติตามแนวทางเหล่านี้:

1. ไม่เก็บ API key ใน source code → ใช้ chrome.storage.sync เท่านั้น
2. ใช้ Content Security Policy ที่ strict ใน manifest.json
3. Validate ทุก input จาก user ก่อน process
4. ใช้ HTTPS เท่านั้นสำหรับ API calls
5. ไม่ log sensitive data (token, personal info) ลง console
6. Handle ทุก async operation ด้วย try/catch
7. แสดง loading state ทุกครั้งที่มี async operation
8. Timeout สำหรับ API calls ที่ใช้เวลานาน (15 วินาที)
```

---

## 📋 Coding Standards สำหรับ Project นี้

```
Language: Vanilla JavaScript ES2022+ (ไม่ใช้ TypeScript แต่ใช้ JSDoc comments)
CSS: Custom Properties (CSS variables) สำหรับ theming
ไม่ใช้ framework หรือ bundler (เพื่อความเรียบง่าย)
ไม่ใช้ jQuery

การตั้งชื่อ:
- Functions: camelCase (fetchProducts, buildVideoPrompt)
- Constants: UPPER_SNAKE_CASE (TIKTOK_API_BASE, MAX_PRODUCTS)
- Files: kebab-case (tab-video.js, prompt-builder.js)
- CSS classes: BEM style (.product-card, .product-card__image)

Comment: ทุก function ต้องมี JSDoc
/**
 * @description อธิบายว่า function ทำอะไร
 * @param {string} productId - TikTok product ID
 * @returns {Promise<ProductData>} ข้อมูลสินค้า
 */

Error messages ให้เป็นภาษาไทย (เพราะ user เป็นคนไทย)
```

---

## 🚀 วิธีสั่ง AI ทีละ Step

คัดลอก context block + step ที่ต้องการ แล้วต่อท้ายด้วย:

```
[CONTEXT BLOCK ด้านบน]

ตอนนี้ให้สร้าง: [Step X — ชื่อ Step]
ตามข้อกำหนดข้างบนทั้งหมด
เขียนโค้ดที่ production-ready พร้อม error handling ครบถ้วน
ใส่ comment อธิบาย logic สำคัญเป็นภาษาไทย
```

### ลำดับที่แนะนำในการสร้าง:
1. `manifest.json` + โครงสร้าง folder
2. `sidepanel.html` + `sidepanel.css` (UI shell + tabs)
3. `tab-products.js` + `tiktok-api.js` (Tab 2 ก่อน เพราะเป็น data source)
4. `tab-video.js` sections 3A-3D (form และ UI)
5. `prompt-builder.js` (business logic สำคัญ)
6. `google-flow.js` (automation)
7. `video-output.js` (download + post)
8. `background.js` (service worker + message routing)
9. `options.html` + `options.js` (settings page)
10. Testing & polish

---

## 🧪 Test Cases ที่ต้องทดสอบก่อน deploy

```
□ เปิด extension → side panel แสดงขึ้นด้านขวา
□ Tab switching ทำงานถูกต้อง
□ Tab 2: Login TikTok → แสดง product list
□ Tab 2: กดสร้างวิดีโอ → switch Tab 1 + auto-fill ข้อมูล
□ Tab 1: อัพโหลดรูป → preview แสดง
□ Tab 1: วิเคราะห์ภาพ → auto-fill form
□ Tab 1: เลือกสไตล์ → ไฮไลต์การ์ด
□ Tab 1: กด Generate → เปิด Google Flow + inject prompt
□ Tab 1: Download → ไฟล์บันทึกในเครื่อง
□ Tab 1: Post TikTok → upload สำเร็จ + มี product link
□ Settings: บันทึก/โหลด settings ได้ถูกต้อง
□ Error states: แสดง error message ภาษาไทยเมื่อ API ล้มเหลว
```

---

*Prompt นี้ใช้กับ Claude Sonnet 4 / GPT-4o / Cursor AI*  
*อัพเดตล่าสุด: พฤษภาคม 2026*
