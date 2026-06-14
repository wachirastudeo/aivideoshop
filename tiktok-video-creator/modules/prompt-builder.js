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

const THAI_PERSON_DIRECTION = "Make the reviewer clearly Thai and natural. Keep the product fully visible and unchanged; do not wear, cover, bend, or deform it.";

const PRODUCT_FIDELITY_DIRECTION = "Use the title to identify the single product. Preserve only its exact shape, proportions, structure/count, materials, colors, hardware, labels, and printed details; the visible product overrides conflicting title variants. Do not redesign it.";

const PRODUCT_ISOLATION_DIRECTION = "Ignore the original background and every unrelated object. Show one product only in a new setting suitable for its real use.";

const PRODUCT_STRUCTURE_DIRECTION = "Keep the exact visible count and arrangement of drawers, shelves, doors, compartments, handles, legs, and other product parts. Never add, remove, merge, or rearrange them.";

const SHOE_FIDELITY_DIRECTION = "For footwear, preserve the exact single-shoe/pair count, side and viewing angle, toe shape, sole thickness and tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, and color blocking. Do not turn it into another shoe model.";

const VIDEO_REALISM_DIRECTION = "Keep motion subtle and realistic; no morphing, duplication, or impossible action.";

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
    videoStyle: "review",
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
  const productName = generationProductName(productInfo.name, 220) || "the attached product";
  const details = compactPromptText(productInfo.highlights, 100);
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);

  const promptParts = [
    `Create one vertical 9:16 commercial product photo of ${productName}.`,
    PRODUCT_FIDELITY_DIRECTION,
    PRODUCT_ISOLATION_DIRECTION,
    categoryDirection || PRODUCT_STRUCTURE_DIRECTION,
    analysisDirection,
    "Choose a clean, realistic, commercially appealing background that fits this product category.",
    `Centered, true scale, sharp and clearly visible, uncluttered.${details ? ` Emphasize: ${details}.` : ""}`
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
  const productName = generationProductName(productInfo.name, 220) || "the attached product";
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const overlayText = [
    textEnabled ? productName : "",
    compactPromptText(settings.promotionText, 80),
    compactPromptText(settings.cta === "กรอกเอง" ? settings.customCta : settings.cta, 80)
  ].filter(Boolean);

  const promptParts = [
    `Create a ${durationSeconds}-second vertical 9:16 product video for ${productName}.`,
    PRODUCT_FIDELITY_DIRECTION,
    PRODUCT_ISOLATION_DIRECTION,
    categoryDirection || PRODUCT_STRUCTURE_DIRECTION,
    analysisDirection,
    `New suitable scene: ${compactPromptText(locationStr, 100)}, ${compactPromptText(auto.mood, 60)} lighting. Do not recreate the original scene.`,
    auto.videoStyle === "review" ? "Product-review format: clearly present the product, key details, and realistic use." : "",
    `Subtle ${compactPromptText(auto.cameraMovement, 80)}; keep the whole product sharp, clearly visible, stable, centered, and unchanged.`,
    VIDEO_REALISM_DIRECTION,
    textEnabled && overlayText.length
      ? `Use only these Thai overlays: ${overlayText.join(" | ")}. Do not cover the package label.`
      : "No added text, captions, subtitles, CTA, stickers, badges, watermarks, or UI. Preserve only text printed on the real package."
  ];

  if (auto.presenter && auto.presenter !== "none") {
    promptParts.push(`Presenter: ${PRESENTERS[auto.presenter] || PRESENTERS.none}. ${THAI_PERSON_DIRECTION}`);
  }

  return promptParts.filter(Boolean).join("\n");
}

function compactPromptText(value, maxLength) {
  return sanitizeText(value).slice(0, maxLength).replace(/[.;,:-]\s*$/, "");
}

function buildAnalysisDirection(productInfo = {}) {
  const structureAdvice = compactPromptText(productInfo.structureAdvice, 220);
  const promptAdvice = stripStructuralVariantCounts(compactPromptText(productInfo.promptAdvice, 140));
  const advice = [structureAdvice, promptAdvice].filter(Boolean).join(" ");
  return advice ? `Product analysis: ${advice}` : "";
}

function buildCategoryFidelityDirection(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.category || ""}`.toLowerCase();
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return SHOE_FIDELITY_DIRECTION;
  }
  return "";
}

function generationProductName(value, maxLength) {
  return stripStructuralVariantCounts(compactPromptText(value, maxLength));
}

function stripStructuralVariantCounts(value) {
  return String(value || "")
    .replace(/\b\d+(?:\s*[/|,]\s*\d+)+\s*(?:drawer|drawers|shelf|shelves|tier|tiers|door|doors|compartment|compartments)\b/gi, " ")
    .replace(/\b\d+\s*(?:drawer|drawers|shelf|shelves|tier|tiers|door|doors|compartment|compartments)\b/gi, " ")
    .replace(/\d+(?:\s*[/|,]\s*\d+)+\s*(?:ชั้น|ลิ้นชัก|ช่อง|บาน)/g, " ")
    .replace(/\d+\s*(?:ชั้น|ลิ้นชัก|ช่อง|บาน)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveAutoSettings(productInfo = {}, settings = {}) {
  const inferred = inferPromptAutoOptions(productInfo);
  const recommended = productInfo.autoOptions && typeof productInfo.autoOptions === "object"
    ? productInfo.autoOptions
    : {};
  const requiredLocation = inferRequiredProductLocation(productInfo);
  const footwear = isFootwearProduct(productInfo);
  return {
    videoStyle: isAuto(settings.videoStyle) ? (recommended.videoStyle || inferred.videoStyle) : settings.videoStyle,
    presenter: isAuto(settings.presenter) ? pickAutoReviewer(productInfo) : settings.presenter,
    voiceTone: isAuto(settings.voiceTone) ? (recommended.voiceTone || inferred.voiceTone) : settings.voiceTone,
    mood: isAuto(settings.mood) ? (recommended.mood || inferred.mood) : settings.mood,
    location: isAuto(settings.location) ? (requiredLocation || recommended.location || inferred.location) : settings.location,
    customLocation: sanitizeText(settings.customLocation),
    cameraMovement: isAuto(settings.cameraMovement) ? (footwear ? "Slow Zoom In" : (recommended.cameraMovement || inferred.cameraMovement)) : settings.cameraMovement,
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

  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Professional", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "Furniture product, shown alone in a clean realistic interior suited to its use");
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Trendy", "Urban Street", "Slow Zoom In", "Cut ตรง", "Footwear product, shown clearly without a presenter to preserve its exact model");
  }
  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return promptAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "Promotion-led product, optimized for urgency and fast conversion");
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    return promptAutoOptions("cinematic", "woman", "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "Beauty or premium product, optimized for trust and texture detail");
  }
  if (/(เสื้อ|กางเกง|กระเป๋า|แฟชั่น|wear|shirt|dress|bag)/i.test(text)) {
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

  return promptAutoOptions("review", "woman", "professional", "Professional", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "General product review focused on clear details and realistic use");
}

function inferRequiredProductLocation(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();
  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return "Modern Living Room";
  }
  return "";
}

function isFootwearProduct(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.category || ""}`.toLowerCase();
  return /(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text);
}

function pickAutoReviewer(productInfo = {}) {
  const identity = String(
    productInfo.productId ||
    productInfo.product_id ||
    productInfo.name ||
    productInfo.originalName ||
    "product"
  );
  let hash = 0;
  for (let i = 0; i < identity.length; i += 1) {
    hash = ((hash << 5) - hash + identity.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "woman" : "man";
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
