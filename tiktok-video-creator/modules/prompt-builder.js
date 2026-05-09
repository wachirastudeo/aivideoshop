export const VIDEO_STYLES = [
  {
    id: "review",
    emoji: "🎯",
    name: "Review สินค้า",
    description: "โชว์สินค้าชัดทุกมุม ครบ feature",
    shotPattern: "[สินค้า 360°] → [ซูมจุดเด่นหลัก] → [ราคา+ปุ่มสั่งซื้อ]",
    fragment: "clean product showcase, multiple angles, feature callout text overlays, white or neutral background, professional lighting, no distractions"
  },
  {
    id: "lifestyle",
    emoji: "💃",
    name: "Lifestyle / In-Use",
    description: "สินค้าอยู่ในชีวิตจริง บรรยากาศสบายๆ",
    shotPattern: "[ภาพบรรยากาศชีวิตจริง] → [คนใช้งานสินค้า] → [ซูมสินค้าใกล้ๆ]",
    fragment: "lifestyle product video, natural environment, person using product, warm natural lighting, authentic feel, UGC-style organic look"
  },
  {
    id: "flash-sale",
    emoji: "🔥",
    name: "Flash Sale / Urgency",
    description: "กระตุ้นซื้อ ราคาเด่น เวลาจำกัด",
    shotPattern: "[สินค้า] → [ราคาเดิมขีดฆ่า/โชว์ราคาใหม่] → [นับถอยหลัง/ปุ่มสั่งซื้อ]",
    fragment: "high energy flash sale ad, bold price comparison text, red and white color scheme, fast cuts every 1-2 seconds, urgency visual elements, countdown timer graphic"
  },
  {
    id: "unboxing",
    emoji: "📦",
    name: "Unboxing",
    description: "แกะกล่อง สร้างความตื่นเต้น first impression",
    shotPattern: "[โชว์กล่อง] → [แกะวัสดุกันกระแทก] → [เปิดเจอสินค้า] → [โชว์รายละเอียด]",
    fragment: "unboxing video style, hands opening package, reveal moment with dramatic pause, close-up on product details, satisfying unwrapping, tissue paper, ASMR aesthetic"
  },
  {
    id: "before-after",
    emoji: "🌟",
    name: "Before / After",
    description: "เปรียบเทียบก่อน-หลัง ผลลัพธ์ชัดเจน",
    shotPattern: "[โชว์ปัญหาก่อนใช้] → [เอฟเฟกต์เปลี่ยนผ่าน] → [ผลลัพธ์หลังใช้]",
    fragment: "before and after comparison, split screen or transition wipe effect, problem state then solution state, dramatic improvement reveal, text labels Before / After"
  },
  {
    id: "testimonial",
    emoji: "👩",
    name: "Testimonial / UGC Style",
    description: "เหมือนคนจริงรีวิว น่าเชื่อถือ",
    shotPattern: "[คนพูดถึงสินค้า] → [หยิบสินค้าขึ้นมาโชว์] → [แนะนำให้ลอง]",
    fragment: "user generated content style, talking head, handheld camera feel, natural lighting, genuine review vibe, person holding product, casual authentic presentation"
  },
  {
    id: "cinematic",
    emoji: "✨",
    name: "Cinematic / Premium",
    description: "ดูแพง หรูหรา เหมาะสินค้า premium",
    shotPattern: "[สินค้าสโลว์โมชั่น] → [ซูมรายละเอียดผิวสัมผัส] → [จบด้วยโลโก้แบรนด์]",
    fragment: "cinematic product advertisement, slow motion, luxury feel, dark moody or bright airy lighting, macro close-ups, smooth camera movements, premium brand aesthetic, no text clutter"
  },
  {
    id: "trending-hook",
    emoji: "🎵",
    name: "Trending Sound / Hook",
    description: "เน้นช่วงแรก 3 วินาที hook คนหยุดดู",
    shotPattern: "[เปิดด้วยภาพที่สะดุดตามาก] → [เผยโฉมสินค้า] → [สรุปสั้นๆ เร็วๆ]",
    fragment: "attention-grabbing opening 3 seconds, bold hook visual, quick product reveal, trending TikTok pacing, text hook overlay at start, fast energetic edit"
  }
];

const HOOKS = {
  question: "Open with a curiosity question that makes viewers stop scrolling",
  shock: "Start with a full-frame product reveal and a surprising visual moment",
  number: "Lead with a strong numeric offer or benefit in the first second",
  problem: "Show the everyday problem first, then introduce the product as the fix",
  result: "Show the desired result immediately before revealing how the product helps"
};

const PACING = {
  1: "slow cinematic pacing, smooth cuts every 4 seconds",
  2: "balanced TikTok pacing, clean cuts every 2-3 seconds",
  3: "rapid viral pacing, energetic cuts every 1-2 seconds"
};

/**
 * @description คืนค่า default settings สำหรับการสร้าง prompt
 * @returns {object} ค่าเริ่มต้นทั้งหมด
 */
export function getDefaultSettings() {
  return {
    videoStyle: "review",
    hook: "question",
    mood: "Professional",
    colorPalette: "Auto",
    brandColor: "",
    lightingStyle: "Studio Clean",
    language: "ไทย",
    showName: true,
    showPrice: true,
    promotionText: "",
    cta: "กดซื้อได้เลย",
    customCta: "",
    textPosition: "Bottom safe area",
    cameraMovement: "Auto",
    pacing: 2,
    transition: "Auto"
  };
}

/**
 * @description คืนค่า default product info
 * @returns {object} ข้อมูลสินค้าเริ่มต้น
 */
export function getDefaultProductInfo() {
  return {
    productId: "",
    name: "",
    price: "",
    currency: "THB",
    highlights: "",
    targetGroup: "ทั่วไป",
    customTargetGroup: "",
    cta: "สั่งได้เลย",
    imageUrls: [],
    productUrl: ""
  };
}

/**
 * @description ทำความสะอาดข้อความเพื่อใช้ใน prompt
 * @param {unknown} value - ค่าที่รับจาก user หรือ API
 * @returns {string} ข้อความที่ปลอดภัยขึ้น
 */
export function sanitizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 1200);
}

/**
 * @description จัด format ราคาให้เหมาะกับ currency
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {string} ราคาแบบพร้อมแสดง
 */
export function formatPrice(productInfo) {
  const rawPrice = sanitizeText(productInfo.price);
  if (!rawPrice) return "";
  if (productInfo.currency === "THB") return rawPrice.startsWith("฿") ? rawPrice : `฿${rawPrice}`;
  if (productInfo.currency === "USD") return rawPrice.startsWith("$") ? rawPrice : `$${rawPrice}`;
  return `${rawPrice} ${sanitizeText(productInfo.currency)}`;
}

/**
 * @description สร้าง prompt สำหรับ Phase 1 เพื่อทำภาพสินค้าใหม่
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildImagePrompt(productInfo, settings) {
  const style = VIDEO_STYLES.find((item) => item.id === settings.videoStyle) || VIDEO_STYLES[0];
  const target = productInfo.targetGroup === "กรอกเอง" ? productInfo.customTargetGroup : productInfo.targetGroup;
  const palette = settings.colorPalette === "Brand Color" && settings.brandColor
    ? `brand color ${settings.brandColor}`
    : settings.colorPalette;

  return [
    `High quality product photography of ${sanitizeText(productInfo.name) || "the product"}.`,
    `${sanitizeText(settings.lightingStyle)} lighting with ${sanitizeText(palette)} color direction.`,
    `Mood: ${sanitizeText(settings.mood)}. Product centered, sharp focus, clear shape and texture, no distractions.`,
    `Style reference: ${style.fragment}.`,
    `Suitable for ${sanitizeText(target) || "general TikTok shoppers"} audience.`,
    `Key visual details: ${sanitizeText(productInfo.highlights) || "show the strongest product benefits clearly"}.`,
    "Vertical 9:16 composition, clean commercial product image, ready to use as a video reference."
  ].join("\n");
}

/**
 * @description สร้าง prompt วิดีโอ 8 วินาทีสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildVideoPrompt(productInfo, settings) {
  const style = VIDEO_STYLES.find((item) => item.id === settings.videoStyle) || VIDEO_STYLES[0];
  const price = formatPrice(productInfo);
  const ctaText = settings.cta === "กรอกเอง" ? settings.customCta : settings.cta;
  const textItems = [
    settings.showName ? sanitizeText(productInfo.name) : "",
    settings.showPrice ? price : "",
    sanitizeText(settings.promotionText),
    sanitizeText(ctaText || productInfo.cta)
  ].filter(Boolean);
  const palette = settings.colorPalette === "Brand Color" && settings.brandColor
    ? `Brand Color ${settings.brandColor}`
    : settings.colorPalette;

  return [
    `Create an 8-second vertical 9:16 TikTok product video for ${sanitizeText(productInfo.name) || "this product"}${price ? ` priced at ${price}` : ""}.`,
    "Use the provided product image as the main visual reference and keep product appearance accurate.",
    "",
    `Scene 1 (0-4s): ${HOOKS[settings.hook] || HOOKS.question}. Product center frame, ${sanitizeText(settings.cameraMovement)} camera movement, ${sanitizeText(settings.lightingStyle)} lighting, ${sanitizeText(palette)} palette.`,
    `Scene 2 (4-8s): Bold CTA moment with product full frame, ${sanitizeText(settings.mood)} energy, ${sanitizeText(settings.transition)} transition.`,
    "",
    `Video style: ${style.name}. ${style.fragment}.`,
    `Text overlays: ${textItems.join(" | ") || "minimal clean text overlays"}. Position text in ${sanitizeText(settings.textPosition)}.`,
    `Text language: ${sanitizeText(settings.language)}. Pacing: ${PACING[settings.pacing] || PACING[2]}.`,
    "Avoid clutter, avoid wrong logos, avoid misspelled text, keep the product as the hero."
  ].join("\n");
}

/**
 * @description สร้าง caption TikTok จากข้อมูลสินค้าและ defaults
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} defaults - ค่า defaults จาก options
 * @returns {string} caption
 */
export function buildCaption(productInfo, defaults = {}) {
  const template = defaults.captionTemplate || "{product_name} {price} {cta}";
  const hashtags = Array.isArray(defaults.hashtags) ? defaults.hashtags : ["#TikTokShop", "#ของดีบอกต่อ"];
  return template
    .replaceAll("{product_name}", sanitizeText(productInfo.name))
    .replaceAll("{price}", formatPrice(productInfo))
    .replaceAll("{cta}", sanitizeText(productInfo.cta || "สั่งได้เลย"))
    .concat(" ", hashtags.join(" "))
    .trim();
}
