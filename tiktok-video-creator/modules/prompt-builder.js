export const VIDEO_STYLES = [
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
  Auto: "Let AI choose whether a presenter improves the product video",
  none: "No humans, focus entirely on the product visual",
  woman: "A trendy young woman reviewer interacting with the product",
  man: "A stylish young man reviewer presenting the product",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality"
};

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
    videoStyle: "Auto",
    presenter: "Auto",
    voiceTone: "Auto",
    mood: "Auto",
    location: "Auto",
    language: "ไทย",
    showName: "false",
    promotionText: "",
    cta: "🛒 กดสั่งซื้อที่ตะกร้าด้านล่าง",
    customCta: "",
    textPosition: "Auto",
    cameraMovement: "Auto",
    pacing: 2,
    transition: "Auto",
    postAction: "download"
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
  const auto = resolveAutoSettings(productInfo, settings);
  const style = VIDEO_STYLES.find((item) => item.id === auto.videoStyle) || VIDEO_STYLES[0];
  const target = productInfo.targetGroup === "กรอกเอง" ? productInfo.customTargetGroup : productInfo.targetGroup;
  
  const moodStr = auto.mood;
  const locationStr = auto.location;

  const promptParts = [
    `High quality product photography of ${sanitizeText(productInfo.name) || "the product"}.`,
    `Location: ${sanitizeText(locationStr)}.`,
    `Mood/Atmosphere: ${sanitizeText(moodStr)}.`,
    "Composition: Product centered, sharp focus, high-end commercial lighting, clear texture.",
    `Style reference: ${style.fragment}.`,
    `Target audience: ${sanitizeText(target) || "TikTok users"}.`,
    `Visual Details: ${sanitizeText(productInfo.highlights) || "showcase product's unique design and quality"}.`,
    "Orientation: Vertical 9:16 aspect ratio, portrait mode."
  ];

  // Explicitly handle "No Text" or "Include Text"
  if (settings.showName === "false" || settings.showName === false) {
    promptParts.push("Negative prompt: NO text, NO letters, NO typography, NO words, NO logos, NO watermarks, NO clutter.");
  } else {
    const textContext = [
      settings.promotionText ? `Include text: "${sanitizeText(settings.promotionText)}"` : "",
      "Professional typography integrated into the scene."
    ].filter(Boolean).join(". ");
    promptParts.push(textContext);
  }

  if (productInfo.promptAdvice) {
    promptParts.push(`AI Visual Direction: ${sanitizeText(productInfo.promptAdvice)}`);
  }

  if (auto.reason) {
    promptParts.push(`Auto option rationale: ${sanitizeText(auto.reason)}`);
  }

  return promptParts.join("\n");
}

/**
 * @description สร้าง prompt วิดีโอสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildVideoPrompt(productInfo, settings) {
  const auto = resolveAutoSettings(productInfo, settings);
  const style = VIDEO_STYLES.find((item) => item.id === auto.videoStyle) || VIDEO_STYLES[0];
  const locationStr = auto.location;
  const ctaText = settings.cta === "กรอกเอง" ? settings.customCta : settings.cta;
  const durationSeconds = Number.parseInt(settings.videoDuration, 10) || 8;
  const midpointSeconds = Math.max(1, Math.floor(durationSeconds / 2));
  const voiceWordLimit = Math.max(6, Math.min(16, Math.floor(durationSeconds * 1.5)));
  const textItems = [
    settings.showName === true || settings.showName === "true" ? sanitizeText(productInfo.name) : "",
    settings.showName === true || settings.showName === "true" ? sanitizeText(settings.promotionText) : "",
    sanitizeText(ctaText || productInfo.cta)
  ].filter(Boolean);

  const promptParts = [
    `Create a ${durationSeconds}-second vertical 9:16 TikTok product video for ${sanitizeText(productInfo.name) || "this product"}.`,
    "Use the provided product image as the main visual reference and keep product appearance accurate.",
    "Do NOT include any pricing or cost information in the video.",
    "",
    `Auto-selected creative plan: style=${style.id}, presenter=${auto.presenter}, voiceTone=${auto.voiceTone}, mood=${auto.mood}, location=${auto.location}, camera=${auto.cameraMovement}, transition=${auto.transition}.`,
    auto.reason ? `Selection rationale: ${sanitizeText(auto.reason)}.` : "",
    `Presenter: ${PRESENTERS[auto.presenter] || PRESENTERS.none}.`,
    `Voice Tone: ${VOICE_TONES[auto.voiceTone] || VOICE_TONES.kind}.`,
    `Voiceover timing: use one short complete ${sanitizeText(settings.language)} sentence only, maximum ${voiceWordLimit} words, and finish the spoken sentence by ${Math.max(1, durationSeconds - 1)}s. Do not start a sentence that cannot finish before the video ends. No cut-off speech.`,
    `Camera Movement: ${sanitizeText(auto.cameraMovement)}.`,
    `Scene 1 (0-${midpointSeconds}s): Product center frame at ${sanitizeText(locationStr)}.`,
    `Scene 2 (${midpointSeconds}-${durationSeconds}s): Bold CTA moment with product full frame, upbeat energy.`,
    `Transition: ${sanitizeText(auto.transition)}.`,
    "",
    `Video style: ${style.name}. ${style.fragment}.`,
    `Text overlays: ${textItems.join(" | ") || "no text overlays except unavoidable platform UI"}. Position text in ${sanitizeText(settings.textPosition)}.`,
    `Video text mode: ${settings.showName === "true" ? "include configured video text" : "no added video text"}.`,
    `Text language: ${sanitizeText(settings.language)}. Pacing: ${PACING[settings.pacing] || PACING[2]}.`,
    "Avoid clutter, avoid wrong logos, avoid misspelled text, keep the product as the hero."
  ];

  if (productInfo.promptAdvice) {
    promptParts.push(`AI Creative Direction: ${sanitizeText(productInfo.promptAdvice)}`);
  }

  return promptParts.join("\n");
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
    cameraMovement: isAuto(settings.cameraMovement) ? (recommended.cameraMovement || inferred.cameraMovement) : settings.cameraMovement,
    transition: isAuto(settings.transition) ? (recommended.transition || inferred.transition) : settings.transition,
    reason: recommended.reason || inferred.reason || ""
  };
}

function isAuto(value) {
  return value === undefined || value === null || value === "" || value === "Auto";
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

  return promptAutoOptions("review", "none", "professional", "Professional", "Studio Minimal", "Orbit / 360°", "Cut ตรง", "General product, optimized for clear feature presentation");
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
  const template = defaults.captionTemplate || "{product_name}\n{product_details}\n{cta}";
  const hashtags = normalizeHashtags(defaults.hashtags);
  return template
    .replaceAll("{product_name}", sanitizeText(productInfo.name))
    .replaceAll("{product_id}", sanitizeText(productInfo.productId))
    .replaceAll("{price}", formatPrice(productInfo))
    .replaceAll("{shop_name}", sanitizeText(productInfo.shopName))
    .replaceAll("{product_details}", buildProductDetails(productInfo))
    .replaceAll("{highlights}", sanitizeText(productInfo.highlights))
    .replaceAll("{cta}", sanitizeText(productInfo.cta || "สั่งได้เลย"))
    .concat(" ", hashtags.join(" "))
    .trim();
}

export function normalizeHashtags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  const tags = [];

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
    if (tags.length >= 5) break;
  }

  return tags.length ? tags : ["#TikTokShop", "#ของดีบอกต่อ"];
}

function buildProductDetails(productInfo) {
  const details = [
    productInfo.productId ? `รหัสสินค้า: ${sanitizeText(productInfo.productId)}` : "",
    formatPrice(productInfo) ? `ราคา: ${formatPrice(productInfo)}` : "",
    productInfo.highlights ? `จุดเด่น: ${sanitizeText(productInfo.highlights)}` : "",
    productInfo.shopName ? `ร้าน: ${sanitizeText(productInfo.shopName)}` : "",
  ].filter(Boolean);

  return details.join("\n");
}
