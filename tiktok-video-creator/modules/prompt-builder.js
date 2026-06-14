export const VIDEO_STYLES = [
  {
    id: "sales",
    emoji: "🛒",
    name: "ขายสินค้า",
    description: "เน้นปิดการขาย โชว์สินค้า จุดขาย และ CTA ชัด",
    shotPattern: "[Hook สินค้า] → [โชว์จุดขายหลัก] → [สาธิต/ซูมรายละเอียด] → [CTA สั่งซื้อ]",
    fragment: "conversion-focused TikTok shop product video, clear product hero shots, strong benefit demonstration, fast product reveal, persuasive shopping CTA moment, clean commercial lighting, purchase-intent pacing"
  },
  {
    id: "review",
    emoji: "🎯",
    name: "Review สินค้า",
    description: "โชว์สินค้าชัดทุกมุม ครบ feature",
    shotPattern: "[สินค้า 360°] → [ซูมจุดเด่นหลัก] → [ปุ่มสั่งซื้อ]",
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
    description: "กระตุ้นซื้อ โปรเด่น เวลาจำกัด",
    shotPattern: "[สินค้า] → [โชว์โปรโมชั่น] → [นับถอยหลัง/ปุ่มสั่งซื้อ]",
    fragment: "high energy flash sale ad, bold promotion text, red and white color scheme, fast cuts every 1-2 seconds, urgency visual elements, countdown timer graphic"
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

const PACING = {
  1: "slow cinematic pacing, smooth cuts every 4 seconds",
  2: "balanced TikTok pacing, clean cuts every 2-3 seconds",
  3: "rapid viral pacing, energetic cuts every 1-2 seconds"
};

const PRESENTERS = {
  Auto: "Let AI choose whether a Thai presenter improves the product video",
  none: "No humans, focus entirely on the product visual",
  woman: "A trendy young Thai woman reviewer interacting with the product",
  man: "A stylish young Thai man reviewer presenting the product",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality"
};

const THAI_PERSON_DIRECTION = "If a person appears, make them clearly Thai, realistic and natural, with correct anatomy (two hands, five natural fingers each). Avoid extra/missing/fused fingers, distorted hands, plastic skin, or doll-like AI faces.";

const PRODUCT_FIDELITY_DIRECTION = "Reference product identity lock: copy the attached product image as closely as possible. Preserve the exact silhouette, proportions, package shape, cap/lid/nozzle details, material, texture, color palette, color placement, labels, brand marks, icons, numbers, and all printed text visible on the product or packaging. Do not redesign, recolor, simplify, translate, correct, replace, blur, or invent logos, badges, labels, text, decorations, variants, extra products, or different packaging. Keep realistic proportions and true scale.";

const VIDEO_REALISM_DIRECTION = "Keep it realistic and physically plausible: subtle smooth camera move with minor motion only. No exaggerated or impossible action — no flying, morphing, explosions, speed ramps, or objects multiplying. Calm, clean, true-to-life so it generates reliably.";

const VOICE_TONES = {
  Auto: "Let AI choose the most suitable voice tone for the product and audience",
  kind: "Kind, friendly, and gentle tone",
  fun: "Fun, high-energy, and playful tone",
  complain: "Funny complaining and slightly annoyed but hilarious tone",
  professional: "Professional, authoritative, and expert tone",
  hype: "Super excited, fast-talking, and high-hype tone"
};

/**
 * @description คืนค่า default settings สำหรับการสร้าง prompt
 * @returns {object} ค่าเริ่มต้นทั้งหมด
 */
export function getDefaultSettings() {
  return {
    videoStyle: "sales",
    presenter: "Auto",
    voiceTone: "Auto",
    mood: "Auto",
    location: "Auto",
    customLocation: "",
    language: "ไทย",
    showName: "false",
    promotionText: "",
    cta: "🛒 กดสั่งซื้อที่ตะกร้าด้านล่าง",
    customCta: "",
    textPosition: "Auto",
    cameraMovement: "Auto",
    pacing: 2,
    transition: "Auto",
    postAction: "post"
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
 * @description จัดรูปแบบราคาให้สวยงาม (เช่น ฿1,200)
 * @param {object} product - product info
 * @returns {string} formatted price
 */
export function formatPrice(product) {
  if (!product.price) return "";
  const symbol = product.currency === "THB" ? "฿" : product.currency;
  return `${symbol}${Number(product.price).toLocaleString()}`;
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
 * @description สร้าง prompt สำหรับ Phase 1 เพื่อทำภาพสินค้าใหม่
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildImagePrompt(productInfo, settings) {
  const productName = compactPromptText(productInfo.name, 220) || "the attached product";
  const details = compactPromptText(productInfo.highlights, 180);

  const promptParts = [
    `Create one vertical 9:16 commercial product photo of ${productName}.`,
    "Use the attached image as the exact product reference. Preserve the package shape, proportions, colors, cap, label layout, logo, numbers, and printed text. Do not redesign or invent packaging details.",
    "First analyze the product image, product name, category, packaging, purpose, and likely real-world use. Then choose the most suitable location and background scene for this specific product.",
    "Flow must decide the location, environment, props, surface, lighting, color atmosphere, and supporting details so they naturally match the product and help communicate its use.",
    "Keep the chosen scene commercially appealing, realistic, believable, and uncluttered. Do not default to a generic studio, bedroom, kitchen, or living room unless that setting genuinely fits this product.",
    "Composition: one centered product, realistic scale, sharp focus, readable front label, clean premium lighting, uncluttered background.",
    details ? `Emphasize: ${details}.` : ""
  ];

  if (settings.showName === "false" || settings.showName === false) {
    promptParts.push("No added text, captions, stickers, badges, watermarks, extra products, or people. Keep only text already printed on the real package.");
  } else {
    const promotionText = compactPromptText(settings.promotionText, 100);
    promptParts.push(promotionText
      ? `Add only this Thai overlay text: "${promotionText}". Keep it separate from the package label.`
      : "Do not add overlay text. Preserve only the original package text.");
  }

  return promptParts.filter(Boolean).join("\n");
}

/**
 * @description สร้าง prompt วิดีโอสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildVideoPrompt(productInfo, settings) {
  const auto = resolveAutoSettings(productInfo, settings);
  const locationStr = resolvePromptLocation(auto);
  const durationSeconds = Number.parseInt(settings.videoDuration, 10) || 8;
  const textEnabled = settings.showName === true || settings.showName === "true";
  const productName = compactPromptText(productInfo.name, 220) || "the attached product";
  const overlayText = [
    textEnabled ? productName : "",
    compactPromptText(settings.promotionText, 80),
    compactPromptText(settings.cta === "กรอกเอง" ? settings.customCta : settings.cta, 80)
  ].filter(Boolean);

  const promptParts = [
    `Create a ${durationSeconds}-second vertical 9:16 product video for ${productName}.`,
    "Use the attached image as the exact product reference. Keep the package shape, colors, cap, logo, label layout, numbers, and printed text unchanged in every frame.",
    `Use one continuous product-hero scene at ${compactPromptText(locationStr, 100)} with ${compactPromptText(auto.mood, 60)} lighting.`,
    `Use one subtle camera move: ${compactPromptText(auto.cameraMovement, 80)}. Keep the product sharp, stable, realistic, and centered.`,
    "No scene split, collage, duplicated product, morphing, warped packaging, label drift, price, or impossible motion.",
    textEnabled && overlayText.length
      ? `Use only these Thai overlays: ${overlayText.join(" | ")}. Do not cover the package label.`
      : "No added text, captions, subtitles, CTA, stickers, badges, watermarks, or UI. Preserve only text printed on the real package."
  ];

  if (auto.presenter && auto.presenter !== "none") {
    promptParts.push(`${PRESENTERS[auto.presenter] || PRESENTERS.none}. ${THAI_PERSON_DIRECTION}`);
  }

  return promptParts.filter(Boolean).join("\n");
}

function compactPromptText(value, maxLength) {
  return sanitizeText(value).slice(0, maxLength).replace(/[.;,:-]\s*$/, "");
}

function resolveAutoSettings(productInfo = {}, settings = {}) {
  const inferred = inferPromptAutoOptions(productInfo);
  const recommended = productInfo.autoOptions && typeof productInfo.autoOptions === "object"
    ? productInfo.autoOptions
    : {};

  return {
    videoStyle: isAuto(settings.videoStyle) ? (recommended.videoStyle || inferred.videoStyle) : settings.videoStyle,
    presenter: isAuto(settings.presenter) ? (recommended.presenter || inferred.presenter) : settings.presenter,
    voiceTone: isAuto(settings.voiceTone) ? (recommended.voiceTone || inferred.voiceTone) : settings.voiceTone,
    mood: isAuto(settings.mood) ? (recommended.mood || inferred.mood) : settings.mood,
    location: isAuto(settings.location) ? (recommended.location || inferred.location) : settings.location,
    customLocation: sanitizeText(settings.customLocation),
    cameraMovement: isAuto(settings.cameraMovement) ? (recommended.cameraMovement || inferred.cameraMovement) : settings.cameraMovement,
    transition: isAuto(settings.transition) ? (recommended.transition || inferred.transition) : settings.transition,
    reason: recommended.reason || inferred.reason || ""
  };
}

function isAuto(value) {
  return value === undefined || value === null || value === "" || value === "Auto";
}

function resolvePromptLocation(auto = {}) {
  if (auto.location === "กรอกเอง") {
    return sanitizeText(auto.customLocation) || "custom user-defined product scene";
  }
  return auto.location;
}

function inferPromptAutoOptions(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();

  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return promptAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "Promotion-led product, optimized for urgency and fast conversion");
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    return promptAutoOptions("cinematic", "woman", "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "Beauty or premium product, optimized for trust and texture detail");
  }
  if (/(เสื้อ|กางเกง|รองเท้า|กระเป๋า|แฟชั่น|wear|shirt|dress|bag|shoe)/i.test(text)) {
    return promptAutoOptions("lifestyle", "woman", "fun", "Trendy", "Urban Street", "Handheld Shake", "Swipe", "Fashion product, optimized for in-use lifestyle context");
  }
  if (/(ของเล่น|เด็ก|น่ารัก|cute|toy|kid|pet|สัตว์เลี้ยง)/i.test(text)) {
    return promptAutoOptions("trending-hook", "cartoon3d", "fun", "น่ารัก", "Modern Living Room", "Push In Fast", "Zoom Transition", "Cute product, optimized for playful thumb-stop hook");
  }
  if (/(ครัว|บ้าน|เครื่องใช้|organizer|storage|clean|ทำความสะอาด)/i.test(text)) {
    return promptAutoOptions("before-after", "none", "professional", "Professional", "Modern Living Room", "Pan Left to Right", "Swipe", "Home utility product, optimized to show the problem and result clearly");
  }
  if (/(กล่อง|แพ็ค|package|เซ็ต|bundle|gift)/i.test(text)) {
    return promptAutoOptions("unboxing", "none", "kind", "มินิมัล", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "Bundle or packaged product, optimized for reveal and detail shots");
  }

  return promptAutoOptions("sales", "none", "professional", "Professional", "Studio Minimal", "Orbit / 360°", "Cut ตรง", "General product, optimized for product sales conversion");
}

function promptAutoOptions(videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason) {
  return { videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason };
}

/**
 * @description สร้าง caption TikTok จากข้อมูลสินค้าและ defaults
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} defaults - ค่า defaults จาก options
 * @returns {string} caption
 */
export function buildCaption(productInfo, defaults = {}) {
  const template = defaults.captionTemplate || "{product_name}";
  const productUrl = resolveProductUrl(productInfo);
  const productName = resolveCaptionProductName(productInfo);
  const caption = renderCaptionTemplate(template, {
    product_name: cleanCaptionText(productName),
    product_id: sanitizeText(productInfo.productId),
    product_url: sanitizeText(productUrl),
    price: formatPrice(productInfo),
    shop_name: cleanCaptionText(productInfo.shopName),
    category: cleanCaptionText(productInfo.category),
    product_details: buildProductDetails(productInfo),
    highlights: cleanCaptionText(productInfo.highlights),
    cta: cleanCaptionText(productInfo.cta || "สั่งได้เลย")
  });

  const productNameLine = defaults.autoAddProductLink !== false && productName && !caption.includes(productName)
    ? `\n${cleanCaptionText(productName)}`
    : "";

  return `${caption}${productNameLine}`.trim();
}

function renderCaptionTemplate(template, variables) {
  return String(template || "")
    .split("\n")
    .map((line) => renderCaptionLine(line, variables))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function renderCaptionLine(line, variables) {
  const placeholders = [...String(line || "").matchAll(/{([a-z_]+)}/g)].map((match) => match[1]);
  if (placeholders.some((key) => variables[key] !== undefined && !String(variables[key] || "").trim())) {
    return "";
  }

  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value || "")),
    line
  ).replace(/[ \t]+/g, " ").trim();
}

export function resolveCaptionProductName(productInfo = {}) {
  return cleanCaptionText(
    productInfo.originalName ||
    productInfo.productLinkTitle ||
    productInfo.rawProduct?.title ||
    productInfo.rawProduct?.product_name ||
    productInfo.rawProduct?.name ||
    productInfo.name ||
    ""
  );
}

function cleanCaptionText(value) {
  return stripWeirdCaptionChars(removeCaptionBracketText(value));
}

function removeCaptionBracketText(value) {
  return String(value || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/\{[^}]*}/g, " ");
}

function stripWeirdCaptionChars(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function resolveProductUrl(productInfo = {}) {
  const direct = [
    productInfo.productUrl,
    productInfo.product_url,
    productInfo.url,
    productInfo.shareUrl,
    productInfo.share_url,
    productInfo.affiliateUrl,
    productInfo.affiliate_url,
    productInfo.rawProduct?.product_url,
    productInfo.rawProduct?.url,
    productInfo.rawProduct?.share_url,
    productInfo.rawProduct?.affiliate_url
  ].map(value => String(value || "").trim()).find(isLikelyProductUrl);
  if (direct) return direct;

  const nested = findNestedProductUrl(productInfo.rawProduct || productInfo);
  if (nested) return nested;

  const productId = String(productInfo.productId || productInfo.product_id || productInfo.id || "").trim();
  if (/^\d{8,}$/.test(productId)) {
    return `https://www.tiktok.com/view/product/${productId}`;
  }
  return "";
}

function isLikelyProductUrl(value) {
  return /^https?:\/\//i.test(value) && /(?:tiktok|shop)/i.test(value);
}

function findNestedProductUrl(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return "";
  seen.add(value);

  for (const [key, nestedValue] of Object.entries(value)) {
    if (/url|link/i.test(key) && isLikelyProductUrl(String(nestedValue || "").trim())) {
      return String(nestedValue).trim();
    }
  }
  for (const nestedValue of Object.values(value)) {
    const found = findNestedProductUrl(nestedValue, seen);
    if (found) return found;
  }
  return "";
}

export function normalizeHashtags(value, maxTags = 5) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  const tags = [];
  const limit = Math.max(1, Number.parseInt(maxTags, 10) || 5);

  for (const rawTag of rawTags) {
    const cleaned = String(rawTag || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/^#+/, "");
    if (!cleaned) continue;

    const tag = `#${cleaned}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
    if (tags.length >= limit) break;
  }

  return tags.length ? tags : ["#TikTokShop", "#ของดีบอกต่อ"].slice(0, limit);
}

export function buildPostHashtags(productInfo = {}, defaults = {}) {
  const baseTags = normalizeHashtags(defaults.hashtags, 4);
  const nameTags = buildProductNameHashtags(productInfo);
  return normalizeHashtags([...baseTags, ...nameTags], 5);
}

function resolveRawProductName(productInfo = {}) {
  return [
    productInfo.productLinkTitle,
    productInfo.originalName,
    productInfo.rawProduct?.title,
    productInfo.rawProduct?.product_name,
    productInfo.rawProduct?.name,
    productInfo.name
  ].find((value) => String(value || "").trim()) || "";
}

function segmentToHashtag(segment) {
  const cleaned = String(segment || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const chars = Array.from(cleaned);
  const shortName = chars.length > 25 ? chars.slice(0, 25).join("").trim() : cleaned;
  const tag = `#${shortName.replace(/\s+/g, "")}`;
  return tag.length > 1 ? tag : "";
}

// แตกชื่อสินค้าตาม comma/ขีดคั่น เป็นหลาย hashtag (เช่น "Arzopa A1, จอภาพแบบพกพา," → #ArzopaA1 #จอภาพแบบพกพา)
export function buildProductNameHashtags(productInfo = {}) {
  const rawName = resolveRawProductName(productInfo);
  const tags = [];
  for (const segment of String(rawName).split(/[,，、|/\n]+/)) {
    const tag = segmentToHashtag(segment);
    if (tag) tags.push(tag);
  }
  return tags;
}

// คงไว้เพื่อ backward compat — คืน hashtag แรกจากชื่อ
export function buildProductNameHashtag(productInfo = {}) {
  return buildProductNameHashtags(productInfo)[0] || "";
}

function buildProductDetails(productInfo) {
  const details = [
    productInfo.productId ? `รหัสสินค้า: ${sanitizeText(productInfo.productId)}` : "",
    formatPrice(productInfo) ? `ราคา: ${formatPrice(productInfo)}` : "",
    productInfo.highlights ? `จุดเด่น: ${cleanCaptionText(productInfo.highlights)}` : "",
    productInfo.category ? `หมวดหมู่: ${cleanCaptionText(productInfo.category)}` : "",
    productInfo.shopName ? `ร้าน: ${cleanCaptionText(productInfo.shopName)}` : "",
  ].filter(Boolean);

  return details.join("\n");
}
