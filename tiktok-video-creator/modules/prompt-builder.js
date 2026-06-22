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
    name: "UGC / Testimonial",
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
  hands_only: "Only realistic Thai hands holding and presenting the product, no face or body",
  woman: "A trendy young Thai woman reviewer interacting with the product",
  man: "A stylish young Thai man reviewer presenting the product",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality"
};

const THAI_PERSON_DIRECTION = "Natural Thai reviewer. Keep the product visible and unchanged; do not wear, cover, bend, or deform it.";

const HANDS_DIRECTION = "Show only realistic human hands holding and presenting the product — no face, body, or full person. Anatomically correct hands with exactly five fingers per hand; never add, merge, distort, or remove fingers. Keep the product fully visible and unchanged.";

const PRODUCT_FIDELITY_DIRECTION = "Use the title to identify the single product. Preserve only its exact shape, proportions, structure/count, materials, colors, hardware, labels, and printed details; the visible product overrides conflicting title variants. Do not redesign it.";

const PRODUCT_ISOLATION_DIRECTION = "Ignore the original background and every unrelated object. Show one product only in a new setting suitable for its real use.";

const PRODUCT_STRUCTURE_DIRECTION = "Keep the exact visible count and arrangement of drawers, shelves, doors, compartments, handles, legs, and other product parts. Never add, remove, merge, or rearrange them.";

const SCALE_FIDELITY_DIRECTION = "Keep the product's proportions and real-world scale identical to the uploaded reference: same width-to-height ratio and part dimensions; never stretch, squash, elongate, enlarge, or shrink it.";

const MATCH_STILL_DIRECTION = "CRITICAL: the attached still is the exact first frame. Animate THAT image — the product's shape, proportions, printed pattern/artwork, colors, materials, text, and logo must stay pixel-identical to the still in every single scene and frame. Add only camera motion, lighting shifts, and scene action around it. Never redraw, restyle, re-render, swap, or alter the product; if a scene changes background, the same exact product from the still must remain unchanged.";

const STILL_TEXT_LOCK_DIRECTION = "Freeze every letter, word, number, logo, and printed graphic exactly as it appears on the product in the still — treat them as fixed, locked pixels. Do NOT re-render, re-typeset, translate, warp, blur, flicker, morph, or regenerate any text or print across scenes or hard cuts; keep it crisp, sharp, and legible, character-for-character identical in every frame. If a clean render of the text cannot be guaranteed during motion, keep the product still and move only the camera/background instead of distorting it.";

const SHOE_FIDELITY_DIRECTION = "For footwear, preserve the exact single-shoe/pair count, side and viewing angle, toe shape, sole thickness and tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, and color blocking. Do not turn it into another shoe model.";

const PRINTED_GRAPHIC_FIDELITY_DIRECTION = "Reproduce the printed surface artwork/pattern EXACTLY as in the reference: identical motif, characters, illustration, layout, composition, scale, position, orientation, and all colors. Treat the printed graphic as fixed image data — copy it pixel-faithfully, never reinterpret, redraw, restyle, simplify, mirror, shift, recolor, or replace it with a different design. Keep camera cutout, buttons, and ports placement unchanged.";

const VIDEO_REALISM_DIRECTION = "Keep motion subtle and realistic; no morphing, duplication, or impossible action.";
const SPEECH_DIRECTION = "Speak one short natural Thai line once; never repeat or loop the same phrase across scenes.";
const VOICEOVER_DIRECTION = "Add a natural Thai off-screen voiceover narration (no visible person). All spoken audio must be in Thai.";

const TEXT_FREE_DIRECTION = "Keep the product's own printed text, logos, and labels exactly as in the reference — do not alter, translate, garble, add, or remove them. Do not add any extra readable text onto the scene: no captions, subtitles, CTA, promotions, stickers, badges, watermarks, signs, or UI.";

const NO_PEOPLE_DIRECTION = "Product-only scene. No people, faces, presenters, reviewers, characters, celebrities, or public figures.";

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
    videoStyle: "testimonial",
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
    SCALE_FIDELITY_DIRECTION,
    PRODUCT_ISOLATION_DIRECTION,
    categoryDirection || PRODUCT_STRUCTURE_DIRECTION,
    analysisDirection,
    "Choose a clean, realistic, commercially appealing background that fits this product category.",
    `Centered, true scale, sharp and clearly visible, uncluttered.${details ? ` Emphasize: ${details}.` : ""}`,
    NO_PEOPLE_DIRECTION,
    TEXT_FREE_DIRECTION
  ];

  return promptParts.filter(Boolean).join("\n");
}

/**
 * @description สร้าง prompt วิดีโอสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
export function buildVideoPrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const locationStr = resolvePromptLocation(auto);
  const durationSeconds = Number.parseInt(settings?.videoDuration, 10) || 8;
  const textEnabled = settings?.showName === true || settings?.showName === "true";
  const productName = generationProductName(productInfo.name, 220) || "the attached product";
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const overlayText = [
    textEnabled ? productName : "",
    textEnabled ? compactPromptText(settings?.promotionText, 80) : ""
  ].filter(Boolean);

  const promptParts = [
    `Create a ${durationSeconds}-second vertical 9:16 multi-scene product video for ${productName}.`,
    MATCH_STILL_DIRECTION,
    STILL_TEXT_LOCK_DIRECTION,
    PRODUCT_FIDELITY_DIRECTION,
    SCALE_FIDELITY_DIRECTION,
    categoryDirection || PRODUCT_STRUCTURE_DIRECTION,
    analysisDirection,
  ];

  const handsOnly = auto.presenter === "hands_only";
  const noPeople = !(auto.presenter && auto.presenter !== "none");
  // Person-centric styles embed a full presenter/reviewer in the scenes; fall back
  // to the product-only review flow when there is no presenter, or when only hands
  // are allowed, so the scene text never demands a full face/body.
  const sceneStyle = (noPeople || handsOnly) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle)
    ? "review"
    : auto.videoStyle;
  let sceneBreakdown = getMultiSceneDescription(sceneStyle, productName, compactPromptText(locationStr, 100), compactPromptText(auto.mood, 60))
    .replace(/\d+-second\s*/g, "");
  if (noPeople) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown on its own")
      .replace(/\b(presenter|reviewer|person)\b/gi, "product");
  }

  promptParts.push(
    `MUST be multiple distinct scenes with hard cuts, not one continuous shot; split the ${durationSeconds}s evenly across the scenes below.`,
    sceneBreakdown,
    `Subtle ${compactPromptText(auto.cameraMovement, 80)}; keep all shots sharp, clearly visible, stable, and centered.`,
    VIDEO_REALISM_DIRECTION
  );

  promptParts.push(
    textEnabled && overlayText.length
      ? `MUST always display these exact Thai text overlays, clearly legible and on-screen in every scene at ${compactPromptText(settings?.textPosition, 40) || "Auto"}: ${overlayText.join(" | ")}. Render the Thai script accurately with correct Thai characters, vowels, and tone marks, spelled exactly as written, in a clean readable sans-serif font with high contrast — no garbled, fake, or misspelled letters. The text is required in the final video; do not omit it and do not add any other readable text.`
      : TEXT_FREE_DIRECTION
  );

  if (handsOnly) {
    promptParts.push(`${HANDS_DIRECTION} ${VOICEOVER_DIRECTION} ${SPEECH_DIRECTION}`);
  } else if (auto.presenter && auto.presenter !== "none") {
    promptParts.push(`Presenter: ${PRESENTERS[auto.presenter] || PRESENTERS.none}. ${THAI_PERSON_DIRECTION} ${SPEECH_DIRECTION}`);
  } else {
    promptParts.push(`${NO_PEOPLE_DIRECTION} ${VOICEOVER_DIRECTION} ${SPEECH_DIRECTION}`);
  }

  return promptParts.filter(Boolean).join("\n");
}

function getMultiSceneDescription(videoStyle, productName, locationStr, mood) {
  const loc = locationStr ? ` in a ${locationStr} setting` : "";
  const moodStyle = mood ? ` with ${mood} lighting` : "";

  switch (videoStyle) {
    case "sales":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions to drive sales:",
        `- Scene 1 (Product Hook): A dynamic, eye-catching 2-second opening shot showcasing ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Benefit Showcase): A 3-second scene demonstrating the main benefits and features of the product in action.`,
        `- Scene 3 (Detail Close-up): A 3-second macro close-up of ${productName}'s quality and texture.`,
        `- Scene 4 (CTA Moment): A final 2-second persuasive shopping CTA shot, presenting the product beautifully.`
      ].join("\n");

    case "review":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions for a product review:",
        `- Scene 1 (Showcase): A 3-second 360-degree rotation showing ${productName} from all angles${loc}${moodStyle}.`,
        `- Scene 2 (Detail Zoom): A 3-second close-up zoom on the main features and highlights of the product.`,
        `- Scene 3 (Realistic Use): A 2-second final scene showing the product placed ready for use.`
      ].join("\n");

    case "lifestyle":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the product in lifestyle context:",
        `- Scene 1 (Atmosphere): A 3-second opening scene establishing a warm, realistic lifestyle environment${loc}${moodStyle}.`,
        `- Scene 2 (In-Use): A 3-second scene showing a presenter interacting naturally with ${productName}.`,
        `- Scene 3 (Close-up): A 2-second authentic close-up of the product in its natural setting.`
      ].join("\n");

    case "flash-sale":
      return [
        "This video must consist of multiple sequential scenes with fast, energetic cuts/transitions for a flash sale:",
        `- Scene 1 (Urgency Hook): A high-energy 2-second opening shot of ${productName}${loc}${moodStyle} to stop the scroll.`,
        `- Scene 2 (Promo Showcase): A 3-second rapid shot highlighting the product promotion and benefits.`,
        `- Scene 3 (Countdown CTA): A final 3-second fast cut shot emphasizing limited time/action.`
      ].join("\n");

    case "unboxing":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the unboxing process:",
        `- Scene 1 (The Box): A 3-second shot of hands starting to open the packaging of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (The Reveal): A 3-second satisfying reveal moment as the package is unwrapped/opened.`,
        `- Scene 3 (Detail Showcase): A 2-second close-up showing the pristine product out of the box.`
      ].join("\n");

    case "before-after":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the transition/comparison:",
        `- Scene 1 (Problem/Before): A 3-second opening scene showing the need/before state with ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Transition): A 2-second transition effect or application moment.`,
        `- Scene 3 (Solution/After): A 3-second reveal showing the successful outcome and results after using the product.`
      ].join("\n");

    case "testimonial":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions for a UGC testimonial:",
        `- Scene 1 (Reviewer Hook): A 3-second opening with a reviewer holding ${productName} and talking to the camera${loc}${moodStyle}.`,
        `- Scene 2 (Feature Showcase): A 3-second cut to the reviewer demonstrating how the product works.`,
        `- Scene 3 (Recommendation): A 2-second final recommendation shot with the reviewer smiling.`
      ].join("\n");

    case "cinematic":
      return [
        "This video must consist of multiple sequential scenes with smooth, cinematic cuts/transitions:",
        `- Scene 1 (Aesthetic Opening): A slow-motion 3-second elegant opening shot of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Macro Details): A 3-second slow macro close-up of the luxury texture and fine details.`,
        `- Scene 3 (Hero Shot): A 2-second final premium hero shot presenting the product majestically.`
      ].join("\n");

    case "trending-hook":
      return [
        "This video must consist of multiple sequential scenes with fast cuts/transitions for a trending TikTok hook:",
        `- Scene 1 (Thumb-Stop Hook): A highly eye-catching, unique 2-second opening shot of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Product Reveal): A 3-second quick reveal showing the product features and utility.`,
        `- Scene 3 (Summary Cut): A final 3-second fast energetic cut summarizing the product appeal.`
      ].join("\n");

    default:
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions:",
        `- Scene 1 (Hook): A dynamic, eye-catching 2-second opening shot featuring ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Showcase): A 3-second scene demonstrating the product, showing key details and features.`,
        `- Scene 3 (CTA): A 3-second close-up hero shot focusing on ${productName} with clear and appealing presentation.`
      ].join("\n");
  }
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
  if (/(เคส|เคสโทรศัพท์|เคสมือถือ|กรอบ|กรอบโทรศัพท์|เสื้อลาย|เสื้อยืดลาย|แก้ว|เมือก|พวงกุญแจ|สติกเกอร์|โปสเตอร์|case|cover|skin|sticker|decal|poster|mug|tumbler|tee|printed|graphic|pattern|ลาย|ลายพิมพ์|พิมพ์ลาย)/i.test(text)) {
    return PRINTED_GRAPHIC_FIDELITY_DIRECTION;
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
    // Auto always includes a real reviewer. People-free output is only allowed
    // when the user explicitly selects the "none" presenter option.
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
  const recommended = productInfo.autoOptions?.presenter;
  if (recommended === "woman" || recommended === "man") return recommended;

  const productText = [
    productInfo.name,
    productInfo.originalName,
    productInfo.category,
    productInfo.highlights,
    productInfo.targetGroup
  ].filter(Boolean).join(" ").toLowerCase();

  if (/(ผู้หญิง|สตรี|สาว|คุณแม่|แม่และเด็ก|woman|women|female|lady|ladies|girl|girls|maternity|mom|mother)/i.test(productText)) {
    return "woman";
  }
  if (/(ผู้ชาย|บุรุษ|หนุ่ม|ช่าง|man|men|male|boy|boys|gentleman|mechanic)/i.test(productText)) {
    return "man";
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|เมคอัพ|เครื่องสำอาง|ลิป|มาสคาร่า|น้ำหอม|เครื่องประดับ|กระเป๋า|beauty|skincare|makeup|cosmetic|lipstick|jewelry|handbag)/i.test(productText)) {
    return "woman";
  }
  if (/(เครื่องมือ|สว่าน|ประแจ|ไขควง|รถยนต์|มอเตอร์ไซค์|อะไหล่|เกมมิ่ง|tool|drill|wrench|screwdriver|automotive|motorcycle|gaming)/i.test(productText)) {
    return "man";
  }

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
  const hook = cleanCaptionText(resolveCaptionProductName(productInfo));
  const body = renderCaptionTemplate(template, {
    product_name: hook,
    product_id: sanitizeText(productInfo.productId),
    product_url: sanitizeText(productUrl),
    price: formatPrice(productInfo),
    shop_name: cleanCaptionText(productInfo.shopName),
    category: cleanCaptionText(productInfo.category),
    product_details: buildProductDetails(productInfo),
    highlights: cleanCaptionText(productInfo.highlights),
    cta: cleanCaptionText(productInfo.cta || "สั่งได้เลย")
  });

  // caption ต้องขึ้นต้นด้วยช่อง "ชื่อสินค้า / Hook" เสมอ แล้วตามด้วยเนื้อ caption (ไม่ซ้ำ Hook)
  if (!hook) return body.trim();
  const rest = body.startsWith(hook) ? body.slice(hook.length).trim() : body.trim();
  return rest ? `${hook}\n${rest}` : hook;
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
  // Lead with the user-edited "ชื่อสินค้า / Hook" field (productInfo.name);
  // fall back to the raw scraped title only when it is empty.
  return cleanCaptionText(
    productInfo.name ||
    productInfo.originalName ||
    productInfo.productLinkTitle ||
    productInfo.rawProduct?.title ||
    productInfo.rawProduct?.product_name ||
    productInfo.rawProduct?.name ||
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

function segmentToHashtags(segment) {
  const cleaned = String(segment || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  return cleaned.split(/\s+/).map((word) => {
    const chars = Array.from(word);
    const shortWord = chars.length > 25 ? chars.slice(0, 25).join("") : word;
    return shortWord ? `#${shortWord}` : "";
  }).filter(Boolean);
}

// แตกชื่อสินค้าตามคำและเครื่องหมายคั่น เช่น "POSE รองเท้านวด" → #POSE #รองเท้านวด
export function buildProductNameHashtags(productInfo = {}) {
  const rawName = resolveRawProductName(productInfo);
  const tags = [];
  const seen = new Set();
  for (const segment of String(rawName).split(/[,，、|/\n]+/)) {
    for (const tag of segmentToHashtags(segment)) {
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(tag);
    }
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
