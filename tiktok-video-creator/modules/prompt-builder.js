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
  Auto: "Realistic cinematic shot. Prefer product-only views. If a presenter is shown, they must stand near or gesture towards the product without complex handling.",
  none: "No humans. Focus entirely on the product resting stably in a realistic setting with smooth camera movement.",
  hands_only: "Only realistic hands holding the product gently and steadily, no face or body. No twisting or flipping of the product to prevent glitches.",
  woman: "A young Thai woman reviewer presenting the product. She stands near or holds it gently without squeezing or bending it, smiling at the camera.",
  man: "A young Thai man reviewer presenting the product. He stands near or holds it gently without squeezing or bending it, smiling at the camera.",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality"
};

const THAI_PERSON_DIRECTION = "Natural Thai reviewer. The product must remain rigid, static, and completely unchanged; the reviewer stands next to it or holds it gently without covering, bending, or deforming it.";

const HANDS_DIRECTION = "Show only realistic human hands holding and presenting the product — no face, body, or full person. Anatomically correct hands with exactly five fingers per hand. The product itself must remain rigid and unchanged; do not cover, bend, warp, or deform it.";

const PRODUCT_FIDELITY_DIRECTION = "Reproduce the product EXACTLY as shown in the reference image: preserve its exact shape, form, color, material, labels, and parts. STRICT RULE: Do not add any extra items, objects, parts, accessories, or decorations that are not in the reference image. Do not add packaging, boxes, bags, or cases unless they are clearly visible in the reference image. Do not substitute, modify, or add parts to the product. It must look 100% identical to the uploaded product image.";

const PRODUCT_ISOLATION_DIRECTION = "Ignore the original background and every unrelated object. Show one product only in a new setting suitable for its real use.";

const PRODUCT_STRUCTURE_DIRECTION = "Keep the exact visible count of parts. Never add, remove, or rearrange them.";

const SCALE_FIDELITY_DIRECTION = "Keep proportions and scale identical to reference: never stretch, squash, enlarge, or shrink it. The physical size of the product must be realistic and true-to-life compared to the environment, hands, or presenter. Do not make the product abnormally large or out-of-scale relative to the surroundings (Strictest rule: Product size must be realistic and in true scale relative to its environment or presenter; never make the product abnormally large).";

const MATCH_STILL_DIRECTION = "IMPORTANT: The attached reference image is a multi-angle/multi-scene collage grid. The video must follow this reference by depicting the product and the presenter across different scenes and angles as shown in the collage. Maintain absolute consistency for the product: its shape, proportions, physical size, scale, colors, materials, printed logos, and text must be identical in every scene. The size, scale, dimensions, and proportions of the product in the video must match the reference image exactly relative to the presenter and background; do not enlarge, shrink, stretch, or warp it (Strictest rule: The product's size and relative scale in the video must match the reference image exactly; do not shrink or enlarge it). If a presenter is visible in the reference image, the presenter in the video (including their face, hair, clothing, gender, age, and overall appearance) must look exactly identical and consistent with the presenter depicted in the reference image across all scenes (Strictest rule: The face, hair, clothing, and overall appearance of the presenter in the video must match the presenter in the reference image exactly and remain identical throughout the entire video). STRICT RULE: Do NOT generate the video frame as a collage, grid, storyboard, split-screen, or multi-panel composition. Each scene in the video must be a single, full-frame shot showing only one angle/perspective at a time. Animate each small image/panel from the reference collage sequentially, presenting each one as an individual full-screen scene (1 small image = 1 full-frame scene/shot). Animate each scene with smooth camera movement and transition between them with clean cuts.";

const REALISM_AND_PHYSICS_DIRECTION = "Realistic motion only. The product must remain rigid and static: no morphing, warping, bending, melting, opening, or closing. No floating. Camera movement must be smooth and stable.";

const SHOE_FIDELITY_DIRECTION = "For footwear, preserve the exact single-shoe/pair count, toe shape, sole thickness, lace pattern, and color blocking. Do not change the shoe model.";

const PRINTED_GRAPHIC_FIDELITY_DIRECTION = "Reproduce the printed surface artwork, motif, patterns, illustrations, logos, and graphics EXACTLY as in the reference. Maintain the exact layout, colors, shapes, and placement of the design. Copy it pixel-faithfully; never redraw, restyle, simplify, distort, or replace the pattern. For videos, this pattern must remain completely static and unchanged on the product's surface as the camera moves or the presenter holds it.";

const EYEWEAR_FIDELITY_DIRECTION = "For eyewear, the size and scale of the glasses must be perfectly proportioned to a human face, head, or hands. Do not make the glasses abnormally large, tiny, or out-of-scale relative to the presenter. Maintain the exact frame shape, lens color/transparency, bridge width, and temple length.";

const SPEECH_DIRECTION = "At most ONE short natural Thai spoken line in the whole clip, said once in a single scene; other scenes have no speech. Never repeat, loop, echo, or restart it; no doubled or stuttering audio. No greeting — never say สวัสดี, หวัดดี, hello, or hi; go straight to the product message.";
const VOICEOVER_DIRECTION = "Add a natural Thai off-screen voiceover narration (no visible person). All spoken audio must be in Thai.";

const TEXT_FREE_DIRECTION = "STRICT: No added text, words, or characters. Do not render promotional copy, price tags, banners, watermarks, captions, subtitles, CTA, sale labels, or signs. Keep the product's own printed text, logos, and labels exactly as in the reference — do not alter, translate, add, or remove them. Do not add any extra readable text onto the scene.";

const NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION = "STRICT RULE: Do not add, invent, or write any new text, labels, brand names, slogans, numbers, or gibberish text on the product surface or packaging. If the original reference product is blank or has no text, the generated product must be completely clean and blank without any text. Do not generate fake branding or mock text on the product.";

const NO_PEOPLE_DIRECTION = "No people, faces, presenters, reviewers, or characters.";

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
    customPresenter: "",
    voiceTone: "Auto",
    mood: "Auto",
    location: "Auto",
    customLocation: "",
    language: "ไทย",
    textEnabled: "false",
    clipText: "",
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

export function buildImagePrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const productName = generationProductName(productInfo.name, productInfo.category) || "the attached product";
  const details = compactPromptText(productInfo.highlights || "", 100).replace(/[^\x00-\x7F]/g, "").trim();
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const productText = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const isHeavy = isHeavyProduct(productText);

  const handsOnly = auto.presenter === "hands_only";
  const noPeople = !(auto.presenter && auto.presenter !== "none");

  // Determine introductory description/layout advice based on presenter settings (always keep multiple angles grid/collage)
  const intro = (auto.presenter && auto.presenter !== "none" && auto.presenter !== "hands_only")
    ? `A high-fidelity product photography collage grid in one vertical 9:16 layout, showing ${productName} from multiple angles and scenes with a presenter shown in the frame.`
    : (auto.presenter === "hands_only")
      ? `A high-fidelity product photography collage grid in one vertical 9:16 layout, showing ${productName} from multiple angles and scenes with realistic human hands holding the product in the frame.`
      : `A high-fidelity product photography collage grid in one vertical 9:16 layout, showing ${productName} from multiple angles and scenes.`;

  let peopleDirection = "";
  if (handsOnly) {
    peopleDirection = "Show realistic human hands holding the product.";
  } else if (auto.presenter && auto.presenter !== "none") {
    let presenterInstruction = PRESENTERS[auto.presenter] || PRESENTERS.none;
    if (auto.presenter === "กรอกเอง") {
      presenterInstruction = auto.customPresenter || "a presenter";
    }
    peopleDirection = `Presenter: ${presenterInstruction}`;
  } else {
    peopleDirection = NO_PEOPLE_DIRECTION;
  }

  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true") && Boolean(settings?.clipText || productInfo.name);
  const textItems = [
    settings?.clipText ? sanitizeText(settings.clipText) : (productInfo.name ? sanitizeText(productInfo.name) : ""),
    settings?.promotionText ? sanitizeText(settings.promotionText) : "",
    productInfo.cta || settings?.cta || "สั่งได้เลย"
  ].filter(Boolean);

  const textDirection = textEnabled
    ? `Visible text overlays are enabled. Integrate these exact Thai-language text overlays neatly and professionally onto the image scenes (as advertising headlines, product highlight callouts, or clean typography badges): ${textItems.join(" | ") || "ข้อความภาษาไทย"}. All visible text, labels, titles, and CTA typography must be in clean, correct, natural Thai language only, with perfect spelling and readable typography. Position overlays in ${settings?.textPosition || "Middle"}. STRICTLY FORBIDDEN: do not add any English text, romanized Thai, unconfigured words, or random gibberish labels.`
    : `${TEXT_FREE_DIRECTION}\nFinal check: ensure no added text or numbers exist in the output.`;

  const promptParts = [
    intro,
    PRODUCT_FIDELITY_DIRECTION,
    SCALE_FIDELITY_DIRECTION,
    "Critical: The generated image must maintain absolute fidelity to the original product in the reference image. The product's shape, curves, outlines, colors, materials, branding, labels, and text must be 100% identical and unchanged. Do not redesign, warp, or modify the product's structure.",
    "Depict the product from a diverse mix of camera angles and shot distances in a collage grid: wide shots showing the product in context or with a presenter, medium shots, and detailed close-ups/narrow shots highlighting product textures and labels. Show different angles (front view, 45-degree angle, top-down view) to represent the product comprehensively across the collage panels (Strictest rule: depict a diverse mix of wide, medium, and close-up shots in the collage).",
    isHeavy ? "Real scale." : "Small consumer product scale: The product is a small, lightweight item. Depict it in a realistic small scale relative to the environment, hands, or presenter. Do not make it look abnormally large or giant (Strictest rule: Product size must be realistic and in true scale relative to its environment or presenter; never make the product abnormally large).",
    PRODUCT_ISOLATION_DIRECTION,
    PRODUCT_STRUCTURE_DIRECTION,
    categoryDirection,
    analysisDirection,
    "Choose a clean, realistic, commercially appealing background that fits this product category.",
    `Centered, true scale, sharp and clearly visible, uncluttered.${details ? ` Visually emphasize (do NOT write as text): ${details}.` : ""}`,
    peopleDirection,
    "Strictest rule: any text, labels, brand names, or writing on the product and packaging must match the reference image exactly; do NOT invent new words or add any extra text or promotional overlays.",
    NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION,
    textDirection
  ];

  return promptParts.filter(Boolean).join("\n");
}

function getProductWeightCategory(text = "") {
  const clean = text.toLowerCase();
  if (/(ผ้าคลุม|ผ้าปู|สติกเกอร์|ขาตั้ง|ตัวยึด|เบาะรอง|ปลอก|โมเดล|ของเล่น|จิ๋ว|miniature|toy|cover|sticker|case|holder|mount|cushion|protector)/i.test(clean)) {
    return "light";
  }

  // 1. Immobile/bulky products (e.g. furniture, large appliances)
  const isImmobile = /(ตู้|เตียง|ลิ้นชัก|ชั้นวาง|โต๊ะ|เก้าอี้|โซฟา|เฟอร์นิเจอร์|เครื่องซักผ้า|ตู้เย็น|ทีวี|โทรทัศน์|ที่นอน|ฟูก|ลู่วิ่ง|จักรยาน|แอร์|เครื่องปรับอากาศ|เตาอบ|ไมโครเวฟ|เครื่องล้างจาน|ตู้แช่|cabinet|drawer|shelf|wardrobe|dresser|furniture|table|desk|chair|sofa|couch|bed|mattress|refrigerator|fridge|freezer|washing\s*machine|washer|dryer|dishwasher|tv|television|air\s*conditioner|treadmill|bicycle|bike|oven|stove|microwave)/i.test(clean);
  if (isImmobile) {
    return "immobile";
  }

  // 2. Check weight values first (so heavy sacks >= 25kg are classified as immobile)
  const weightRegex = /(\d+(?:\.\d+)?)\s*(?:กิโลกรัม|กิโล|กิโ|กก\.?|kg|kilograms?)(?![a-zA-Z0-9])/i;
  const match = clean.match(weightRegex);
  if (match) {
    const weightVal = parseFloat(match[1]);
    if (weightVal >= 25) {
      return "immobile"; // 25kg or more is immobile/extremely heavy
    }
    if (weightVal >= 5) {
      return "medium_heavy"; // 5-25kg is medium heavy
    }
  }

  // 3. Medium heavy/bulky but liftable products (sacks, dumbbells, etc.)
  const isMediumHeavyKeywords = /(กระสอบ|ข้าวสาร|ปุ๋ย|ปูนซีเมนต์|ปูน|ทรายแมว|อาหารสัตว์|อาหารสุนัข|อาหารหมา|อาหารแมว|sack|fertilizer|cement\s*bag|concrete\s*bag|pet\s*food\s*bag|dog\s*food\s*bag|cat\s*food\s*bag|cat\s*litter|dumbbell|ดัมเบล)/i.test(clean);
  if (isMediumHeavyKeywords) {
    return "medium_heavy";
  }

  return "light";
}

function isHeavyProduct(text = "") {
  return getProductWeightCategory(text) !== "light";
}

/**
 * @description สร้าง prompt วิดีโอสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
function generateThaiDialogue(productInfo, settings, auto) {
  let phrase = "";
  if (settings?.clipText) {
    phrase = settings.clipText;
  } else if (productInfo?.highlights) {
    const parts = productInfo.highlights.split(/[,\n;]/);
    phrase = parts[0].trim();
  } else {
    phrase = "สินค้าตัวนี้ดีมากๆ";
  }
  
  // ลบอิโมจิและอักขระพิเศษ
  phrase = phrase.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
  
  const isMan = auto?.presenter === "man";
  const ending = isMan ? "ครับ" : "ค่ะ";
  
  if (!phrase.endsWith("ค่ะ") && !phrase.endsWith("ครับ") && !phrase.endsWith("เลย") && !phrase.endsWith("นะ")) {
    phrase = phrase + ` ดีมากๆ เลย${ending}`;
  }
  return phrase;
}

export function buildVideoPrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const locationStr = resolvePromptLocation(auto);
  const durationSeconds = Number.parseInt(settings?.videoDuration, 10) || 8;
  const clipText = compactPromptText(settings?.clipText, 80);
  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true") && Boolean(clipText);
  const productName = generationProductName(productInfo.name, productInfo.category) || "the attached product";
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const overlayText = [
    clipText,
    textEnabled ? compactPromptText(settings?.promotionText, 80) : ""
  ].filter(Boolean);
 
  const productText = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const weightCategory = getProductWeightCategory(productText);
  const isHeavy = weightCategory !== "light";
  const isImmobile = weightCategory === "immobile";

  const promptParts = [
    `สร้างวิดีโอโฆษณารีวิวสินค้า ${productName} ความยาว ${durationSeconds} วินาที ในอัตราส่วนแนวตั้ง 9:16 (Create a ${durationSeconds}-second vertical 9:16 commercial product review video for ${productName}).`,
    MATCH_STILL_DIRECTION,
    PRODUCT_FIDELITY_DIRECTION,
    REALISM_AND_PHYSICS_DIRECTION,
    isHeavy ? "Real scale." : "Close-up scale: Show the product in a prominent close-up so all details remain sharp and readable.",
    PRODUCT_STRUCTURE_DIRECTION,
    categoryDirection,
    analysisDirection,
    NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION,
  ];

  const handsOnly = auto.presenter === "hands_only";
  const noPeople = !(auto.presenter && auto.presenter !== "none");
  const sceneStyle = (noPeople || handsOnly) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle)
    ? "review"
    : auto.videoStyle;
  let sceneBreakdown = getMultiSceneDescription(sceneStyle, productName, compactPromptText(locationStr, 100), compactPromptText(auto.mood, 60))
    .replace(/\d+-second\s*/g, "");
  if (noPeople) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown on its own")
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b/gi, "the product shown on its own");
  } else if (handsOnly) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "hands holding and presenting the product")
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, "hands holding the product")
      .replace(/\bhands\s+starting\s+to\s+open\b/gi, "hands gesturing towards");
  }

  // Adjust prompt for heavy/large products to prevent unnatural holding/lifting
  if (isImmobile) {
    const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sceneBreakdown = sceneBreakdown
      .replace(new RegExp(`\\bholding\\s+(?:the\\s+)?(?:attached\\s+)?${escapedName}\\b`, "gi"), `standing next to ${productName}`)
      .replace(/\bholding\s+(?:the\s+)?product\b/gi, "standing next to the product")
      .replace(/\bholding\s+/gi, "standing next to ")
      .replace(/\bhands\s+holding\b/gi, "hands gesturing towards")
      .replace(/\bhands\s+starting\s+to\s+open\b/gi, "hands gesturing towards");
  }

  promptParts.push(
    `Use distinct scenes with hard cuts; split the ${durationSeconds}s evenly across the scenes below.`,
    `STRICT LIMIT: The video must contain AT MOST 3 to 4 sequential scenes/shots. Do not generate too many scenes, cuts, or edits. Keep the storytelling simple and clean.`,
    sceneBreakdown,
    `Subtle ${compactPromptText(auto.cameraMovement, 80)}; keep every shot sharp, clearly visible, and stable. Realistic motion only — no morphing, duplication, or impossible action.`
  );

  promptParts.push(
    textEnabled && overlayText.length
      ? `MUST always display these exact Thai text overlays, clearly legible and on-screen in every scene at ${compactPromptText(settings?.textPosition, 40) || "Auto"}: ${overlayText.join(" | ")}. Render the Thai script accurately with correct Thai characters, vowels, and tone marks, spelled exactly as written. Style it as eye-catching TikTok-pop kinetic typography: a bold rounded heavy sans-serif, bright punchy colors with a contrasting outline or soft drop shadow / highlight pill behind the words so it stays readable on any background, large and centered in its safe area, with a lively pop-in animation — vibrant and playful but clean, never garbled, fake, or misspelled. The text is required in the final video; do not omit it and do not add any other readable text.`
      : TEXT_FREE_DIRECTION
  );

  let handsDir = HANDS_DIRECTION;
  let presenterInstruction = auto.presenter && PRESENTERS[auto.presenter] ? PRESENTERS[auto.presenter] : PRESENTERS.none;
  if (auto.presenter === "กรอกเอง") {
    presenterInstruction = auto.customPresenter || "a presenter";
  }

  if (isImmobile) {
    handsDir = handsDir
      .replace("holding and presenting", "gesturing towards and interacting with")
      .replace("holding", "touching or gesturing towards")
      + " The product is large and heavy, resting stably on a flat surface or floor; do not attempt to lift, carry, or hold it in the air.";

    presenterInstruction = presenterInstruction
      .replace("holding and presenting", "standing next to and presenting")
      .replace("holding", "presenting or interacting with")
      + " The product is large and heavy, resting stably on a flat surface or floor; do not attempt to lift, carry, or hold it in the air.";
  } else if (weightCategory === "medium_heavy") {
    handsDir = handsDir
      .replace("holding and presenting", "holding with both hands and presenting")
      + " The product is a medium-sized item (approx 5-20kg); depict it in a realistic medium scale relative to the hands, never as a tiny packet or a giant sack.";

    presenterInstruction = presenterInstruction
      .replace("holding and presenting", "holding with both hands and presenting")
      .replace("holding", "holding with both hands or interacting with")
      + " The product is a medium-sized item (approx 5-20kg); depict it in a realistic medium scale relative to the presenter, never as a tiny packet or a giant sack.";
  } else if (weightCategory === "light") {
    const isEyewear = /(แว่นตา|แว่นกันแดด|แว่นสายตา|แว่น|glasses|sunglasses|eyewear|spectacles)/i.test(productText);
    if (isEyewear) {
      handsDir = handsDir
        + " The product is eyewear; depict the glasses in a realistic natural scale relative to the hands or face, ensuring it fits perfectly without looking abnormally large or tiny.";

      presenterInstruction = presenterInstruction
        + " The product is eyewear; depict the glasses in a realistic natural scale relative to the presenter's face or head, ensuring it fits perfectly on the face without looking abnormally large or tiny.";
    } else {
      handsDir = handsDir
        + " The product is a small item; depict it in a prominent large scale relative to the hands (close-up), ensuring the product's brand name and labels are large, clear, and easy to read. Never show it as a tiny or insignificant object.";

      presenterInstruction = presenterInstruction
        + " The product is a small item; depict it in a prominent large scale (close-up or medium close-up) relative to the presenter, ensuring the product's brand name and labels are large, clear, and easy to read. Never show it as a tiny or insignificant object.";
    }
  }

  // รวมข้อมูลสินค้าทั้งหมดมาประกบรวมกันสำหรับส่งให้ AI วิเคราะห์ทำบทพูด
  // NOTE: ไม่ส่งราคาและ CTA เข้า speech context เพื่อป้องกัน AI พูดราคาหรือ CTA ออกมา
  const details = [];
  if (productInfo.name) details.push(`Product Name: ${productInfo.name}`);
  if (productInfo.highlights) details.push(`Highlights: ${productInfo.highlights}`);
  if (settings?.clipText) details.push(`Main Message: ${settings.clipText}`);
  const combinedProductDetails = details.join(", ");

  const toneDesc = VOICE_TONES[auto.voiceTone] || VOICE_TONES.Auto;
  
  const speechDir = `Spoken script: The spoken dialogue must be in Thai script, spoken once in a single scene with a ${toneDesc}. Based on these product details [${combinedProductDetails}], the AI must dynamically generate a highly matching, relevant, and natural spoken dialogue in Thai script. The speaker must present the product's value proposition, features, or name naturally in Thai. STRICTLY FORBIDDEN: never start the spoken script with any greeting or welcome words such as "สวัสดี", "หวัดดี", "สวัสดีครับ", "สวัสดีค่ะ", "hello", "hi", or "hey". Start directly with the product's key value (Strictest rule: Never say any greeting). STRICTLY FORBIDDEN: never mention any price, cost, number, currency, discount amount, or promotional price in any form — not in Thai ("ราคา", "บาท", "ลด", "ถูก") nor in English ("price", "baht", "cost", "sale"). STRICTLY FORBIDDEN: never mention any product weight, volume, size, or physical quantity in the spoken script, such as grams ("กรัม", "g"), kilograms ("กิโลกรัม", "กิโล", "กก.", "kg"), milliliters ("มล.", "ml"), liters ("ลิตร", "l"), ounces ("ออนซ์", "oz"), or any numerical amount (Strictest rule: spoken script must never mention any product weight, volume, or size). ALSO FORBIDDEN: never say any call-to-action phrases such as "สั่งได้เลย", "กดลิงก์", "ช้อปเลย", "รีบซื้อ", "order now", "click the link", or any buying prompt. Do not speak in English, do not add subtitles, and ensure the voice is a natural Thai speaker talking matching the product identity.`;
  const voiceoverDir = "Voiceover: Add a natural Thai off-screen voiceover narration speaking in Thai.";

  if (handsOnly) {
    promptParts.push(`${handsDir} ${voiceoverDir} ${speechDir}`);
  } else if (auto.presenter && auto.presenter !== "none") {
    promptParts.push(`Presenter: ${presenterInstruction}. ${THAI_PERSON_DIRECTION} (Strictest rule: Use exactly one single consistent presenter throughout the entire video. Do not introduce other people, do not switch presenters, and do not morph or change the presenter's appearance between scenes). ${speechDir}`);
  } else {
    promptParts.push(`${NO_PEOPLE_DIRECTION} ${voiceoverDir} ${speechDir}`);
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
  const parts = [structureAdvice, promptAdvice].filter(Boolean);
  if (parts.length === 0) return "";
  // นำ structureAdvice มาใช้เป็นรายละเอียดรูปร่างสินค้าจากภาพจริง เพื่อให้ AI เข้าใจบริบท์รูปบเข้า-ออกเสมอผ่าน prompt
  return `Image analysis of reference: ${parts.join(" ")} — Reproduce the product exactly as described here; this overrides any general category assumption about its form.`;
}

function buildCategoryFidelityDirection(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.category || ""}`.toLowerCase();
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return SHOE_FIDELITY_DIRECTION;
  }
  if (/(แว่นตา|แว่นกันแดด|แว่นสายตา|แว่น|glasses|sunglasses|eyewear|spectacles)/i.test(text)) {
    return EYEWEAR_FIDELITY_DIRECTION;
  }
  if (/(เคส|เคสโทรศัพท์|เคสมือถือ|กรอบ|กรอบโทรศัพท์|เสื้อ|เสื้อยืด|เสื้อลาย|เสื้อยืดลาย|กางเกง|หมวก|กระเป๋า|หมอน|แก้ว|ถ้วย|เมือก|พวงกุญแจ|สติกเกอร์|โปสเตอร์|แผ่นรอง|แผ่นรองเมาส์|สกรีน|ลายสกรีน|ลายการ์ตูน|ภาพวาด|ของแต่งบ้าน|ผ้า|case|cover|skin|sticker|decal|poster|mug|tumbler|tee|tshirt|hoodie|cap|hat|bag|pillow|canvas|printed|graphic|pattern|illustration|ลาย|ลายพิมพ์|พิมพ์ลาย)/i.test(text)) {
    return PRINTED_GRAPHIC_FIDELITY_DIRECTION;
  }
  return "";
}

function cleanEnglishProductName(title) {
  if (!title) return "";
  
  // 1. Remove bracketed text, since brackets often contain metadata like [READY STOCK], [COD]
  let clean = title.replace(/\[[^\]]*\]/g, " ")
                   .replace(/\([^)]*\)/g, " ")
                   .replace(/\{[^}]*\}/g, " ");

  // 2. Remove common promotional and transactional keywords (case-insensitive)
  const promoKeywords = [
    /\bready\s*stock\b/gi, /\breadystock\b/gi,
    /\bhot\s*sale\b/gi, /\bhotsale\b/gi,
    /\bbest\s*quality\b/gi, /\bbest\s*seller\b/gi,
    /\bfree\s*shipping\b/gi, /\bfree\s*delivery\b/gi,
    /\b100%\s*original\b/gi, /\b100%\s*authentic\b/gi,
    /\boriginal\b/gi, /\bauthentic\b/gi,
    /\bnew\s*arrival\b/gi, /\bspecial\s*offer\b/gi,
    /\bpre\s*order\b/gi, /\bpre-order\b/gi,
    /\bflash\s*sale\b/gi, /\bflashsale\b/gi,
    /\bfast\s*shipping\b/gi, /\bfast\s*delivery\b/gi,
    /\blocal\s*stock\b/gi, /\bbrand\s*new\b/gi,
    /\blimited\s*edition\b/gi, /\blimited\b/gi,
    /\bpremium\b/gi, /\bhigh\s*quality\b/gi, /\btop\s*quality\b/gi,
    /\bwarranty\b/gi, /\bguarantee\b/gi,
    /\bcod\b/gi, /\bfree\b/gi, /\bnew\b/gi, /\bhot\b/gi,
    /\bdiscount\b/gi, /\bsale\b/gi, /\boff\b/gi, /\bgift\b/gi, /\bgifts\b/gi,
    /\b\d+\s*pcs\b/gi, /\b\d+\s*pieces\b/gi, /\b\d+\s*piece\b/gi,
    /\b\d+\s*pack\b/gi, /\b\d+\s*set\b/gi,
    /\b\d+%\b/g
  ];

  for (const regex of promoKeywords) {
    clean = clean.replace(regex, " ");
  }

  // 3. Keep only English characters, numbers, and basic spaces
  clean = clean.replace(/[^\x00-\x7F]/g, " "); // Remove non-ASCII
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, " "); // Remove special punctuation
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

function generationProductName(value, category = "") {
  if (!value) return "the product";

  const lowerVal = value.toLowerCase();
  const lowerCat = String(category || "").toLowerCase();

  // Map keywords to clean English generic terms
  if (lowerVal.includes("กาแฟ") || lowerCat.includes("coffee")) return "coffee product";
  if (lowerVal.includes("พัดลม") || lowerCat.includes("fan")) return "portable fan";
  if (lowerVal.includes("เสื้อ") || lowerVal.includes("กางเกง") || lowerVal.includes("ผ้า") || lowerCat.includes("clothe") || lowerCat.includes("apparel")) return "clothing item";
  if (lowerVal.includes("ครีม") || lowerVal.includes("เซรั่ม") || lowerVal.includes("บำรุง") || lowerVal.includes("สกินแคร์") || lowerCat.includes("skin") || lowerCat.includes("cosmetic")) return "skincare product bottle";
  if (lowerVal.includes("อาหาร") || lowerVal.includes("ขนม") || lowerCat.includes("food") || lowerCat.includes("snack")) return "food product";
  if (lowerVal.includes("แก้ว") || lowerVal.includes("ขวด") || lowerCat.includes("bottle") || lowerCat.includes("cup")) return "cup";
  if (lowerVal.includes("กระเป๋า") || lowerCat.includes("bag")) return "bag";
  if (lowerVal.includes("รองเท้า") || lowerCat.includes("shoe")) return "shoe";

  // If there are English words in the original name, extract the first few words to identify it
  let englishWords = cleanEnglishProductName(value);
  if (englishWords.length > 3) {
    const words = englishWords.split(" ").slice(0, 4).join(" ");
    if (words.length > 3) return stripStructuralVariantCounts(words);
  }

  return "the product";
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
    customPresenter: sanitizeText(settings.customPresenter),
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
    return promptAutoOptions("review", "none", "kind", "มินิมัล", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "Product with set or bundle, use reference image to determine actual form");
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
  let template = defaults.captionTemplate !== undefined ? defaults.captionTemplate : "{product_name}";
  // If template is the old default which included {product_details}, clean it up by omitting {product_details}
  if (template === "{product_name}\n{product_details}\n{cta}") {
    template = "{product_name}\n{cta}";
  }
  if (typeof template === "string" && template.trim() === "") {
    return "";
  }
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

  if (!hook || defaults.randomOpening === false) {
    return body.trim();
  }
  const rest = body.startsWith(hook) ? body.slice(hook.length).trim() : body.trim();

  // สุ่มคำขึ้นต้นสนุกๆ นำหน้า Hook เพื่อไม่ให้ข้อความโพสต์ซ้ำซ้อน
  const randomOpenings = [
    "ชี้เป้าความคุ้มวันนี้! ✨",
    "บอกต่อของดีที่ต้องมี! 🛍️",
    "ใครยังไม่มีรีบเลย! 🔥",
    "ไอเทมเด็ดชิ้นนี้ห้ามพลาด! 😍",
    "ลองหรือยัง? ของดีบอกต่อ 💯",
    "ตัวช่วยชีวิตดีขึ้นเยอะ! 👍",
    "หลังจากลองตัวนี้คือปังมาก! 💖",
    "ส่องด่วน! ดีงามเกินต้าน 🌟"
  ];
  const prefix = randomOpenings[Math.floor(Math.random() * randomOpenings.length)];
  const randomizedHook = `${prefix} ${hook}`;

  return rest ? `${randomizedHook}\n${rest}` : randomizedHook;
}

function removeEmojis(str) {
  return String(str || "").replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
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

export function truncateShopeeCaptionAndHashtags(caption, hashtagList = []) {
  let rawCaption = String(caption || "")
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let tags = [...hashtagList];

  let combined = `${rawCaption} ${tags.join(" ")}`.trim();
  if (combined.length > 150) {
    while (tags.length > 1 && `${rawCaption} ${tags.join(" ")}`.trim().length > 150) {
      tags.pop();
    }
    combined = `${rawCaption} ${tags.join(" ")}`.trim();
    if (combined.length > 150) {
      const tagsStr = tags.join(" ");
      const allowedCaptionLen = 150 - tagsStr.length - 1; // 1 space
      if (allowedCaptionLen > 3) {
        rawCaption = rawCaption.slice(0, allowedCaptionLen - 3).trim() + "...";
      } else if (allowedCaptionLen > 0) {
        rawCaption = rawCaption.slice(0, allowedCaptionLen).trim();
      } else {
        rawCaption = "";
        tags = [tags.join(" ").slice(0, 150)];
      }
    }
  }

  return {
    caption: rawCaption,
    hashtags: tags.join(" ")
  };
}
