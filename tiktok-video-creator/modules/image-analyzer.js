import { buildCaption, buildPostHashtags, normalizeHashtags, sanitizeText, resolveCaptionProductName, isUnderwearOrIntimateProduct } from "./prompt-builder.js";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const POST_CAPTION_MAX_LENGTH = 3000;

/**
 * @description แปลงไฟล์รูปเป็น data URL
 * @param {File} file - ไฟล์รูปภาพ
 * @returns {Promise<string>} data URL
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("อ่านไฟล์ภาพไม่สำเร็จ")));
    reader.readAsDataURL(file);
  });
}

/**
 * @description วิเคราะห์ภาพผ่าน Gemini Vision ถ้ามี API key, fallback จากชื่อสินค้าถ้าไม่มี key
 * @param {string[]} imageDataUrls - รูปสินค้าแบบ data URL
 * @param {object} productInfo - ข้อมูลสินค้าปัจจุบัน
 * @returns {Promise<object>} ผลวิเคราะห์
 */
export async function analyzeProductImages(imageDataUrls, productInfo = {}) {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const provider = settings.aiProvider || "gemini";

  try {
    if (provider === "openai") {
      const apiKey = settings.openaiApiKey;
      if (!apiKey) return buildTitleBasedFallback(productInfo);
      return await analyzeWithOpenAI(imageDataUrls, productInfo, settings);
    } else {
      const apiKey = settings.geminiApiKey;
      if (!apiKey) return buildTitleBasedFallback(productInfo);
      return await analyzeWithGemini(imageDataUrls, productInfo, settings);
    }
  } catch (err) {
    console.warn("AI Image Analysis API failed (falling back to title context):", err);
    return buildTitleBasedFallback(productInfo);
  }
}

export async function generatePostCopy(productInfo = {}, defaults = {}) {
  const template = defaults.captionTemplate !== undefined ? defaults.captionTemplate : "{product_name}";
  if (typeof template === "string" && template.trim() === "") {
    return {
      caption: "",
      hashtags: normalizeHashtags(buildPostHashtags(productInfo, { ...defaults, hashtags: productInfo.hashtags || defaults.hashtags }), 5),
      source: "empty_template"
    };
  }
  const fallback = buildFallbackPostCopy(productInfo, defaults);
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const provider = settings.aiProvider || "gemini";

  try {
    const localStore = await chrome.storage.local.get("creatorState");
    const localSettings = localStore?.creatorState?.settings || {};

    if (provider === "openai") {
      if (!settings.openaiApiKey) return fallback;
      return await generatePostCopyWithOpenAI(productInfo, defaults, settings, fallback, localSettings);
    }

    if (!settings.geminiApiKey) return fallback;
    return await generatePostCopyWithGemini(productInfo, defaults, settings, fallback, localSettings);
  } catch (error) {
    console.warn("AI post copy failed; falling back to template copy:", sanitizeApiErrorMessage(error?.message || error));
    return fallback;
  }
}

function buildFallbackPostCopy(productInfo, defaults) {
  const isShopee = productInfo.source === "shopee" || (productInfo.productUrl && /shopee\.co\.th/i.test(productInfo.productUrl));
  const maxLen = isShopee ? 100 : POST_CAPTION_MAX_LENGTH;
  const maxTags = isShopee ? 3 : 5;
  return {
    caption: truncatePostCaption(buildCaption(productInfo, defaults), maxLen),
    hashtags: normalizeHashtags(buildPostHashtags(productInfo, { ...defaults, hashtags: productInfo.hashtags || defaults.hashtags }), maxTags),
    source: "fallback"
  };
}

async function generatePostCopyWithGemini(productInfo, defaults, settings, fallback, localSettings = {}) {
  const apiKey = settings.geminiApiKey;
  const model = encodeURIComponent(settings.geminiModel || DEFAULT_GEMINI_MODEL);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(buildGeminiUrl(model, apiKey), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPostCopyPrompt(productInfo, defaults) }]
          }
        ],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) throw new Error(await getGeminiErrorMessage(response, "Gemini สร้าง caption/hashtag ไม่สำเร็จ"));
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || "{}";
    return normalizeGeneratedPostCopy(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}"), fallback, productInfo, defaults, localSettings);
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePostCopyWithOpenAI(productInfo, defaults, settings, fallback, localSettings = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${settings.openaiApiKey}`
      },
      body: JSON.stringify({
        model: settings.openaiModel || DEFAULT_OPENAI_MODEL,
        messages: [
          {
            role: "user",
            content: buildPostCopyPrompt(productInfo, defaults)
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1600,
        temperature: 0.35
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || "OpenAI สร้าง caption/hashtag ไม่สำเร็จ");
    }

    const data = await response.json();
    return normalizeGeneratedPostCopy(JSON.parse(data.choices?.[0]?.message?.content || "{}"), fallback, productInfo, defaults, localSettings);
  } finally {
    clearTimeout(timeout);
  }
}

function buildPostCopyPrompt(productInfo = {}, defaults = {}) {
  const isShopee = productInfo.source === "shopee" || (productInfo.productUrl && /shopee\.co\.th/i.test(productInfo.productUrl));
  const maxLen = isShopee ? 100 : POST_CAPTION_MAX_LENGTH;
  const platformName = isShopee ? "Shopee" : "TikTok Shop";
  const baseHashtags = normalizeHashtags(productInfo.hashtags || defaults.hashtags || [], isShopee ? 3 : 4).join(" ");
  const fullProductName = resolveFullProductNameForAi(productInfo);
  return [
    `Create ${platformName} post copy in Thai for this product.`,
    `Full product title from source: ${sanitizeLongText(fullProductName)}`,
    `Edited product name / hook: ${sanitizeLongText(productInfo.name || "")}`,
    `Product ID: ${sanitizeText(productInfo.productId || productInfo.product_id || "")}`,
    `Category: ${sanitizeText(productInfo.category || "")}`,
    `Shop: ${sanitizeText(productInfo.shopName || "")}`,
    `Price: ${productInfo.price ? sanitizeText(productInfo.price) : ""}`,
    `Highlights: ${sanitizeText(productInfo.highlights || productInfo.details || "")}`,
    `CTA: ${sanitizeText(productInfo.cta || "สั่งได้เลย")}`,
    `Default hashtags: ${baseHashtags}`,
    "Rules:",
    `- Caption must be natural Thai ${platformName} sales copy, maximum ${maxLen} characters.`,
    "- Do NOT start the caption with the exact product name or hook. Instead, generate a randomized, highly engaging, catchy, and unique opening hook phrase in Thai (e.g. curiosity gap, questions, bold statements, or urgency) to start the caption. Ensure it is creative and randomized each time so it does not look duplicate.",
    "- Use the full product title as the main source for product-specific details.",
    "- Do not include product URLs or raw links.",
    "- Do not include hashtags inside caption; return hashtags separately.",
    "- Do not invent medical, guaranteed, or unsupported claims.",
    "- Remove bracket/badge text, emoji, odd punctuation, and filler words.",
    isShopee
      ? "- Return at most 3 hashtags, all directly relevant to the product/category/use case, each starting with #."
      : "- Return at most 5 hashtags, all directly relevant to the product/category/use case, each starting with #.",
    'Return compact JSON only: {"caption":"...","hashtags":["#tag1","#tag2","#tag3"]}'
  ].join("\n");
}

function resolveFullProductNameForAi(productInfo = {}) {
  return [
    productInfo.originalName,
    productInfo.productLinkTitle,
    productInfo.rawProduct?.title,
    productInfo.rawProduct?.product_name,
    productInfo.rawProduct?.name,
    productInfo.name
  ].map(v => String(v || "").trim()).find(Boolean) || "the product";
}

function sanitizeLongText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, POST_CAPTION_MAX_LENGTH);
}

function normalizeGeneratedPostCopy(value, fallback, productInfo = {}, defaults = {}, localSettings = {}) {
  const isShopee = productInfo.source === "shopee" || (productInfo.productUrl && /shopee\.co\.th/i.test(productInfo.productUrl));
  const maxLen = isShopee ? 100 : POST_CAPTION_MAX_LENGTH;
  const maxTags = isShopee ? 3 : 5;
  const rawCaption = cleanGeneratedCaption(value?.caption) || fallback.caption;
  // ตรวจสอบความต้องการของผู้ใช้: หากสั่งให้สุ่มคำขึ้นต้นเสมอ (postRandomCaptionHook === true)
  // ให้ใช้ caption ที่สุ่มจาก AI ได้เลยโดยข้ามการดักใส่ hook หน้าชื่อสินค้า
  const caption = localSettings.postRandomCaptionHook
    ? truncatePostCaption(rawCaption, maxLen)
    : truncatePostCaption(ensureCaptionLeadsWithHook(rawCaption, productInfo, defaults), maxLen);
  const hashtags = normalizeHashtags(cleanGeneratedHashtags(value?.hashtags?.length ? value.hashtags : fallback.hashtags), maxTags);
  return {
    caption,
    hashtags,
    source: "ai"
  };
}

// caption ต้องขึ้นต้นด้วยช่อง "ชื่อสินค้า / Hook" เสมอ (ไม่มี random opening แล้ว)
function ensureCaptionLeadsWithHook(caption, productInfo = {}, defaults = {}) {
  const hook = resolveCaptionProductName(productInfo);
  const text = String(caption || "").trim();
  if (!hook) return text;

  const normalizedHook = hook.toLowerCase();
  if (text.toLowerCase().startsWith(normalizedHook)) return text;
  return text ? `${hook}\n${text}` : hook;
}

function cleanGeneratedHashtags(value) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  return rawTags
    .map((tag) => String(tag || "")
      .replace(/^#+/, "")
      .replace(/[^\p{L}\p{M}\p{N}\s_]/gu, " ")
      .replace(/\s+/g, "")
      .trim())
    .filter(Boolean)
    .map((tag) => `#${tag}`);
}

function cleanGeneratedCaption(value) {
  return String(value || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/#[\p{L}\p{M}\p{N}_]+/gu, " ")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/\{[^}]*}/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, POST_CAPTION_MAX_LENGTH)
    .trim();
}

function truncatePostCaption(value, maxLength = POST_CAPTION_MAX_LENGTH) {
  return String(value || "").trim().slice(0, maxLength).trim();
}

async function analyzeWithGemini(imageDataUrls, productInfo, settings) {
  const apiKey = settings.geminiApiKey;
  const productName = sanitizeText(resolveFullProductNameForAi(productInfo));
  const firstImage = imageDataUrls[0] || "";
  const [, mediaType = "image/jpeg"] = firstImage.match(/^data:(.*?);base64,/) || [];
  const base64 = firstImage.replace(/^data:.*?;base64,/, "");
  const model = encodeURIComponent(settings.geminiModel || DEFAULT_GEMINI_MODEL);
  const prompt = [
    "Analyze product image for TikTok Shop.",
    productName ? `Title: ${productName}` : "No title.",
    "Analyze the image and source product title together. Use the title for product type, model, size and intended use, and the image for exact appearance, product/set count, colors and artwork. First check whether the title describes the visible product. If they conflict, describe the visible product without inventing the named object, and state the mismatch in promptAdvice. Analyze only the product or set, not the whole scene.",
    "CRITICAL HERO PRODUCT ISOLATION — ZERO MARKETING PROPS OR FLAVOR GRAPHICS (เอาแค่สินค้า สิ่งประกอบฉากไม่ต้อง): In e-commerce product poster/ad images, sellers frequently surround the product with decorative flavor motifs, marketing props, or 2D graphics (such as champagne bottles, wine glasses, ice buckets, liquid splashes, floating coffee beans, fruit slices, flowers, ribbons, confetti, medals, or gift boxes). You MUST identify ONLY the SINGLE CORE COMMERCIAL PRODUCT being sold (e.g. the single coffee pouch, the supplement bottle, the serum bottle, the package) and COMPLETELY DISCARD all surrounding decorative props, secondary bottles, glasses, buckets, and splashes. Never describe these decorative props or flavor illustrations in name, highlights, structureAdvice, or promptAdvice. In structureAdvice and promptAdvice, state strictly: 'Single hero product packaging only; strictly forbid adding any surrounding decorative props, side bottles, glasses, cups, ice buckets, or secondary objects.'",
    "CRITICAL SINGLE HERO PRODUCT ISOLATION — NO UNREQUESTED MULTI-PIECE / BUNDLE (สินค้าชิ้นเดียว ถ้าไม่ได้บอกว่าหลายชิ้นหรือยกโหล): In e-commerce product listings, the cover photo frequently showcases multiple items together (e.g. 3-5 bottles arranged in a row, a stack of clothes, multiple color/flavor variants, a bunch of pens, or a cluster of boxes) to look attractive or show color choices. Check the product title carefully: unless the title explicitly states that the listing is for multiple pieces, a dozen, a bundle, or a multi-pack (e.g. explicitly stating 'หลายชิ้น', 'ยกโหล', '1 โหล', 'แพ็ค', 'เซ็ต', 'X ชิ้น', 'X ซอง', 'X ขวด', 'X กล่อง', 'bundle', 'pack of', 'set of', 'dozen', 'lot', 'pair/คู่' for shoes/socks): (1) The commercial product being sold is strictly ONE SINGLE ITEM. (2) You MUST select and focus on ONLY ONE single representative hero product item/piece from the example image. (3) Do NOT describe or output multiple pieces, a bundle, a stack, or a collection in name, highlights, structureAdvice, or promptAdvice. (4) In structureAdvice and promptAdvice, state strictly: 'Single individual product item only; although the reference photo may display multiple pieces or color variants, render strictly ONE single standalone hero item. Strictly forbid generating multiple bottles, items, or a bundle.' Only when the title explicitly specifies multiple items, a pack, a set, or a dozen should you describe and preserve multiple pieces as a set/bundle.",
    "Ignore the source background and every unrelated object, including room surfaces, furniture, decor, lamps, plants, pictures, rugs, windows, people, hands, and props. Do not describe them in structureAdvice or promptAdvice.",
    "TEXT SCOPE LOCK: Distinguish text physically printed, engraved, embossed, or permanently attached to the named product/its packaging from text merely placed around the product in the source image. Ignore all surrounding or overlaid text such as captions, slogans, feature callouts, price/discount badges, CTA banners, arrows, stickers, seller watermarks, marketplace UI, and text in the background or margins. That surrounding text is only image composition, not product information, and MUST NOT be copied into name, highlights, structureAdvice, promptAdvice, product labels, or product artwork.",
    "Treat the visible named product as the source of truth for physical structure and details. However, for item quantity: if the reference image displays multiple product pieces or color variants, but the title does NOT explicitly state multiple items, a pack, a set, or a dozen (หลายชิ้น / ยกโหล / แพ็ค), you must isolate ONE single hero product piece instead of treating the image as a multi-pack or bundle.",
    "Identify only the product's exact visible silhouette, width/height/depth proportions, dominant colors, color placement, material/texture, hardware, label layout, brand marks, numbers, icons, and readable text physically present on the product or its packaging. Never treat nearby/floating text as a product label, brand mark, feature, or printed detail.",
    "Count every clearly visible repeated structural part belonging to the product: drawers, shelves, tiers, doors, compartments, panels, handles, legs, wheels, openings, and included pieces. Record their exact arrangement and orientation. Use unknown for anything obscured; never count surrounding objects or infer a count from the title.",
    "For footwear, verify whether the reference shows one shoe or a pair and preserve the exact toe shape, sole thickness/tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, color blocking, side, and viewing angle.",
    "For clothing and fashion products, inspect the garment's visible design, cut, styling, and intended apparel section to infer product gender: include imageGender as man, woman, or unknown. Analyze the garment/product only, not the identity, age, or gender of any person appearing in the reference. Use unknown when the garment is unisex or ambiguous.",
    "For wristwatches, smart bands, fitness trackers, and wristbands (นาฬิกาข้อมือ / สายรัดข้อมือ / สายนาฬิกา / Loop / Whoop): Inspect the visible product carefully to check whether a digital screen or display actually exists. IGNORE marketing keywords in the title or image (e.g. 'Smartband', 'ECG', 'ตรวจคลื่นไฟฟ้าหัวใจ', 'ความดันเลือด', 'โหมดกีฬา', 'ตัวเรือนโลหะ'). If the physical product has NO SCREEN (such as a Loop/Whoop-style woven loop band, silicone wristband, fabric strap with metal buckle/sensor clasp, mosquito band, or fashion bracelet), you MUST state in structureAdvice: 'CRITICAL ZERO-HALLUCINATION: The product is a 100% SCREENLESS wristband with NO screen, NO display, NO watch face, NO clock hands, and NO Apple Watch casing; strictly do NOT add any digital screen or smartwatch display.' and in promptAdvice: 'Render strictly as a screenless fabric/silicone band with metal buckle; strictly forbid adding any screen, display glass, or smartwatch body.' If it is an analog watch, specify physical dial face, mechanical hands, indices, and crown, and forbid turning it into a smartwatch. If it is a smartwatch/smart band with an active or off screen, specify exact screen shape, bezel width, and display state (clean black glass if off, exact watchface if on). If it is a standalone strap/band, specify strap-only without a watch body. Detail exact strap material, texture, clasp/buckle, and color. Strictly forbid hallucinating features not visible in the reference image.",
    "For name, do not include a structural count unless it is clearly and completely visible in the image.",
    "For structureAdvice, write one concise English instruction containing only visually verified structure, counts, arrangement, and proportions. Explicitly say not to add or remove parts. If the listing is not explicitly for multiple pieces or a dozen, lock the count strictly to ONE single individual unit.",
    "For promptAdvice, write concise English guidance that preserves only the named product. Explicitly instruct generation to discard the original background and unrelated objects, including surrounding/overlay text. If the reference image displays multiple pieces but the listing is not explicitly for multiple pieces or a dozen, explicitly mandate rendering strictly ONE single hero piece and forbid multiple pieces or bundles. Choose a new setting suitable for the product category, preserve the exact color palette, design details, patterns, and style from the reference image, and ensure only text physically printed on the product or its packaging is rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English.",
    "For hooks, generate exactly 10 distinct high-converting sales hooks in Thai, customized for TikTok/Reels/Shorts. Each hook must: 1. Open powerfully in the first 1-2 seconds. 2. Highlight the main benefit. 3. Close with a gentle CTA to view or buy. 4. Be short enough to speak within 8 seconds. 5. Do NOT start with 'วันนี้จะมาแนะนำ...'. 6. Do NOT hallucinate features not visible in the image or title. 7. Avoid overly exaggerated, clickbaity claims or cringey buzzwords (e.g. do NOT use words like 'กรี๊ด', 'กราบ', 'เกินต้าน', 'ปังไม่ไหว', 'อึ้ง!', 'สั่นสะเทือนวงการ!', 'ที่สุดในชีวิต!', 'ต้องลองด่วนที่สุด!', 'ของอันนี้', 'ชิ้นนี้แนะนำเลย'). Keep them natural and conversational. The 10 hooks MUST follow these 10 angles in order: 1. เน้นจุดเด่น 2. เน้นราคา 3. เน้นความคุ้ม 4. เน้นปัญหาของลูกค้า 5. เน้นความน่ารัก/สวย/น่าใช้ 6. แบบชวนสงสัย 7. แบบรีวิว 8. แบบตรงๆขายเลย 9. แบบ 'เห็นแล้วต้องมี' 10. แบบไวรัล/สะดุดหู.",
    "For overlayText, generate ONE ultra-short Thai phrase (maximum 5 Thai words, ≤20 characters) that describes the product's best benefit in a cute, catchy way. This will appear as on-screen text overlay on the video. Examples: ดีไซน์สวย, ใช้ง่ายมาก, คุ้มสุดๆ, น่ามีมาก.",
    "The recommended location must fit the product's realistic use, not a generic trendy scene. For example, cabinets, drawers, shelves, and indoor furniture belong in a clean appropriate interior, never an urban street.",
    "Recommend creative options for an 8-second vertical TikTok product video. CRITICAL PRESENTER RULE: Recommend presenter as 'dog' or 'cat' ONLY if the product is specifically for pets/animals. NEVER recommend 'dog' or 'cat' for human products, clothing, gadgets, home items, or generic products.",
    "CRITICAL SENSITIVE INTIMATE APPAREL RULE (ชุดชั้นใน กางเกงใน บรา lingerie underwear): If the product is underwear, panties, bra, lingerie, boxers, swimwear, thong, or intimate apparel, you MUST NEVER recommend videoStyle as 'testimonial' or 'lifestyle', and NEVER recommend presenter as 'woman' or 'man' (strictly NO on-body wearing of underwear/lingerie to respect content policies). You MUST recommend videoStyle as 'hands-only' (tactile fabric showcase) or 'review', and presenter as 'none' (or 'hands_only'), with location as 'Studio Minimal' or 'Modern Living Room'. In promptAdvice, instruct strictly: 'Underwear/intimate apparel flat-lay or hanger product display only; strictly forbid any model wearing underwear on-body.' EXCLUSION FOR SPORTSWEAR / WORKOUT SETS: Activewear, gym wear, workout sets, yoga outfits, and athletic sportswear (ชุดออกกำลังกาย, ชุดกีฬา, ชุดฟิตเนส, ชุดโยคะ) are SPORTSWEAR/CLOTHING, NOT intimate apparel; they are fully wearable on-body by athletic models.",
    'Return compact JSON only: {"name":"Thai short name","hooks":["Thai hook 1","Thai hook 2","Thai hook 3","Thai hook 4","Thai hook 5","Thai hook 6","Thai hook 7","Thai hook 8","Thai hook 9","Thai hook 10"],"overlayText":"≤5 Thai words","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","structureAdvice":"verified English structure/count lock","promptAdvice":"short English reference fidelity prompt advice","autoOptions":{"videoStyle":"review|hands-only|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|still-motion|boxed-motion|trending-hook","presenter":"none|woman|man|cartoon3d|living_product|dog|cat","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace|Fitness Studio","cameraMovement":"45° Product Orbit Shot|Playful Zoom In & Out|Top View Orbit & Walk|Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
  ].join("\n");
  const parts = [{ text: prompt }];

  if (base64) {
    parts.push({
      inline_data: {
        mime_type: mediaType,
        data: base64
      }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(buildGeminiUrl(model, apiKey), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) throw new Error(await getGeminiErrorMessage(response, "Gemini วิเคราะห์ภาพไม่สำเร็จ"));
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || "{}";
    const jsonText = text.match(/\{[\s\S]*\}/)?.[0] || "{}";
    const parsed = JSON.parse(jsonText);

    return {
      name: sanitizeText(parsed.name || productName),
      imageGender: normalizeImageGender(parsed.imageGender || parsed.visualGender || parsed.autoOptions?.presenter || detectExplicitGender(productName)),
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks.map(h => sanitizeText(h)) : [],
      highlights: normalizeHighlights(parsed.highlights),
      targetGroup: sanitizeText(parsed.targetGroup || productInfo.targetGroup || "ทั่วไป"),
      structureAdvice: sanitizeText(parsed.structureAdvice || ""),
      promptAdvice: sanitizeText(parsed.promptAdvice || ""),
      autoOptions: normalizeAutoOptions(parsed.autoOptions, productInfo)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeWithOpenAI(imageDataUrls, productInfo, settings) {
  const apiKey = settings.openaiApiKey;
  const productName = sanitizeText(resolveFullProductNameForAi(productInfo));
  const firstImage = imageDataUrls[0] || "";
  const model = settings.openaiModel || DEFAULT_OPENAI_MODEL;

  const prompt = [
    "Analyze product image for TikTok Shop.",
    productName ? `Title: ${productName}` : "No title.",
    "Analyze the image and source product title together. Use the title for product type, model, size and intended use, and the image for exact appearance, product/set count, colors and artwork. First check whether the title describes the visible product. If they conflict, describe the visible product without inventing the named object, and state the mismatch in promptAdvice. Analyze only the product or set, not the whole scene.",
    "CRITICAL HERO PRODUCT ISOLATION — ZERO MARKETING PROPS OR FLAVOR GRAPHICS (เอาแค่สินค้า สิ่งประกอบฉากไม่ต้อง): In e-commerce product poster/ad images, sellers frequently surround the product with decorative flavor motifs, marketing props, or 2D graphics (such as champagne bottles, wine glasses, ice buckets, liquid splashes, floating coffee beans, fruit slices, flowers, ribbons, confetti, medals, or gift boxes). You MUST identify ONLY the SINGLE CORE COMMERCIAL PRODUCT being sold (e.g. the single coffee pouch, the supplement bottle, the serum bottle, the package) and COMPLETELY DISCARD all surrounding decorative props, secondary bottles, glasses, buckets, and splashes. Never describe these decorative props or flavor illustrations in name, highlights, structureAdvice, or promptAdvice. In structureAdvice and promptAdvice, state strictly: 'Single hero product packaging only; strictly forbid adding any surrounding decorative props, side bottles, glasses, cups, ice buckets, or secondary objects.'",
    "CRITICAL SINGLE HERO PRODUCT ISOLATION — NO UNREQUESTED MULTI-PIECE / BUNDLE (สินค้าชิ้นเดียว ถ้าไม่ได้บอกว่าหลายชิ้นหรือยกโหล): In e-commerce product listings, the cover photo frequently showcases multiple items together (e.g. 3-5 bottles arranged in a row, a stack of clothes, multiple color/flavor variants, a bunch of pens, or a cluster of boxes) to look attractive or show color choices. Check the product title carefully: unless the title explicitly states that the listing is for multiple pieces, a dozen, a bundle, or a multi-pack (e.g. explicitly stating 'หลายชิ้น', 'ยกโหล', '1 โหล', 'แพ็ค', 'เซ็ต', 'X ชิ้น', 'X ซอง', 'X ขวด', 'X กล่อง', 'bundle', 'pack of', 'set of', 'dozen', 'lot', 'pair/คู่' for shoes/socks): (1) The commercial product being sold is strictly ONE SINGLE ITEM. (2) You MUST select and focus on ONLY ONE single representative hero product item/piece from the example image. (3) Do NOT describe or output multiple pieces, a bundle, a stack, or a collection in name, highlights, structureAdvice, or promptAdvice. (4) In structureAdvice and promptAdvice, state strictly: 'Single individual product item only; although the reference photo may display multiple pieces or color variants, render strictly ONE single standalone hero item. Strictly forbid generating multiple bottles, items, or a bundle.' Only when the title explicitly specifies multiple items, a pack, a set, or a dozen should you describe and preserve multiple pieces as a set/bundle.",
    "Ignore the source background and every unrelated object, including room surfaces, furniture, decor, lamps, plants, pictures, rugs, windows, people, hands, and props. Do not describe them in structureAdvice or promptAdvice.",
    "TEXT SCOPE LOCK: Distinguish text physically printed, engraved, embossed, or permanently attached to the named product/its packaging from text merely placed around the product in the source image. Ignore all surrounding or overlaid text such as captions, slogans, feature callouts, price/discount badges, CTA banners, arrows, stickers, seller watermarks, marketplace UI, and text in the background or margins. That surrounding text is only image composition, not product information, and MUST NOT be copied into name, highlights, structureAdvice, promptAdvice, product labels, or product artwork.",
    "Treat the visible named product as the source of truth for physical structure and details. However, for item quantity: if the reference image displays multiple product pieces or color variants, but the title does NOT explicitly state multiple items, a pack, a set, or a dozen (หลายชิ้น / ยกโหล / แพ็ค), you must isolate ONE single hero product piece instead of treating the image as a multi-pack or bundle.",
    "Identify only the product's exact visible silhouette, width/height/depth proportions, dominant colors, color placement, material/texture, hardware, label layout, brand marks, numbers, icons, and readable text physically present on the product or its packaging. Never treat nearby/floating text as a product label, brand mark, feature, or printed detail.",
    "Count every clearly visible repeated structural part belonging to the product: drawers, shelves, tiers, doors, compartments, panels, handles, legs, wheels, openings, and included pieces. Record their exact arrangement and orientation. Use unknown for anything obscured; never count surrounding objects or infer a count from the title.",
    "For footwear, verify whether the reference shows one shoe or a pair and preserve the exact toe shape, sole thickness/tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, color blocking, side, and viewing angle.",
    "For clothing and fashion products, inspect the garment's visible design, cut, styling, and intended apparel section to infer product gender: include imageGender as man, woman, or unknown. Analyze the garment/product only, not the identity, age, or gender of any person appearing in the reference. Use unknown when the garment is unisex or ambiguous.",
    "For wristwatches, smart bands, fitness trackers, and wristbands (นาฬิกาข้อมือ / สายรัดข้อมือ / สายนาฬิกา / Loop / Whoop): Inspect the visible product carefully to check whether a digital screen or display actually exists. IGNORE marketing keywords in the title or image (e.g. 'Smartband', 'ECG', 'ตรวจคลื่นไฟฟ้าหัวใจ', 'ความดันเลือด', 'โหมดกีฬา', 'ตัวเรือนโลหะ'). If the physical product has NO SCREEN (such as a Loop/Whoop-style woven loop band, silicone wristband, fabric strap with metal buckle/sensor clasp, mosquito band, or fashion bracelet), you MUST state in structureAdvice: 'CRITICAL ZERO-HALLUCINATION: The product is a 100% SCREENLESS wristband with NO screen, NO display, NO watch face, NO clock hands, and NO Apple Watch casing; strictly do NOT add any digital screen or smartwatch display.' and in promptAdvice: 'Render strictly as a screenless fabric/silicone band with metal buckle; strictly forbid adding any screen, display glass, or smartwatch body.' If it is an analog watch, specify physical dial face, mechanical hands, indices, and crown, and forbid turning it into a smartwatch. If it is a smartwatch/smart band with an active or off screen, specify exact screen shape, bezel width, and display state (clean black glass if off, exact watchface if on). If it is a standalone strap/band, specify strap-only without a watch body. Detail exact strap material, texture, clasp/buckle, and color. Strictly forbid hallucinating features not visible in the reference image.",
    "For name, do not include a structural count unless it is clearly and completely visible in the image.",
    "For structureAdvice, write one concise English instruction containing only visually verified structure, counts, arrangement, and proportions. Explicitly say not to add or remove parts. If the listing is not explicitly for multiple pieces or a dozen, lock the count strictly to ONE single individual unit.",
    "For promptAdvice, write concise English guidance that preserves only the named product. Explicitly instruct generation to discard the original background and unrelated objects, including surrounding/overlay text. If the reference image displays multiple pieces but the listing is not explicitly for multiple pieces or a dozen, explicitly mandate rendering strictly ONE single hero piece and forbid multiple pieces or bundles. Choose a new setting suitable for the product category, preserve the exact color palette, design details, patterns, and style from the reference image, and ensure only text physically printed on the product or its packaging is rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English.",
    "For hooks, generate exactly 10 distinct high-converting sales hooks in Thai, customized for TikTok/Reels/Shorts. Each hook must: 1. Open powerfully in the first 1-2 seconds. 2. Highlight the main benefit. 3. Close with a gentle CTA to view or buy. 4. Be short enough to speak within 8 seconds. 5. Do NOT start with 'วันนี้จะมาแนะนำ...'. 6. Do NOT hallucinate features not visible in the image or title. 7. Avoid overly exaggerated, clickbaity claims or cringey buzzwords (e.g. do NOT use words like 'กรี๊ด', 'กราบ', 'เกินต้าน', 'ปังไม่ไหว', 'อึ้ง!', 'สั่นสะเทือนวงการ!', 'ที่สุดในชีวิต!', 'ต้องลองด่วนที่สุด!', 'ของอันนี้', 'ชิ้นนี้แนะนำเลย'). Keep them natural and conversational. The 10 hooks MUST follow these 10 angles in order: 1. เน้นจุดเด่น 2. เน้นราคา 3. เน้นความคุ้ม 4. เน้นปัญหาของลูกค้า 5. เน้นความน่ารัก/สวย/น่าใช้ 6. แบบชวนสงสัย 7. แบบรีวิว 8. แบบตรงๆขายเลย 9. แบบ 'เห็นแล้วต้องมี' 10. แบบไวรัล/สะดุดหู.",
    "For overlayText, generate ONE ultra-short Thai phrase (maximum 5 Thai words, ≤20 characters) that describes the product's best benefit in a cute, catchy way. This will appear as on-screen text overlay on the video. Examples: ดีไซน์สวย, ใช้ง่ายมาก, คุ้มสุดๆ, น่ามีมาก.",
    "The recommended location must fit the product's realistic use, not a generic trendy scene. For example, cabinets, drawers, shelves, and indoor furniture belong in a clean appropriate interior, never an urban street.",
    "Recommend creative options for an 8-second vertical TikTok product video. CRITICAL PRESENTER RULE: Recommend presenter as 'dog' or 'cat' ONLY if the product is specifically for pets/animals. NEVER recommend 'dog' or 'cat' for human products, clothing, gadgets, home items, or generic products.",
    "CRITICAL SENSITIVE INTIMATE APPAREL RULE (ชุดชั้นใน กางเกงใน บรา lingerie underwear): If the product is underwear, panties, bra, lingerie, boxers, swimwear, thong, or intimate apparel, you MUST NEVER recommend videoStyle as 'testimonial' or 'lifestyle', and NEVER recommend presenter as 'woman' or 'man' (strictly NO on-body wearing of underwear/lingerie to respect content policies). You MUST recommend videoStyle as 'hands-only' (tactile fabric showcase) or 'review', and presenter as 'none' (or 'hands_only'), with location as 'Studio Minimal' or 'Modern Living Room'. In promptAdvice, instruct strictly: 'Underwear/intimate apparel flat-lay or hanger product display only; strictly forbid any model wearing underwear on-body.' EXCLUSION FOR SPORTSWEAR / WORKOUT SETS: Activewear, gym wear, workout sets, yoga outfits, and athletic sportswear (ชุดออกกำลังกาย, ชุดกีฬา, ชุดฟิตเนส, ชุดโยคะ) are SPORTSWEAR/CLOTHING, NOT intimate apparel; they are fully wearable on-body by athletic models.",
    'Return compact JSON only: {"name":"Thai short name","hooks":["Thai hook 1","Thai hook 2","Thai hook 3","Thai hook 4","Thai hook 5","Thai hook 6","Thai hook 7","Thai hook 8","Thai hook 9","Thai hook 10"],"overlayText":"≤5 Thai words","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","structureAdvice":"verified English structure/count lock","promptAdvice":"short English reference fidelity prompt advice","autoOptions":{"videoStyle":"review|hands-only|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|still-motion|boxed-motion|trending-hook","presenter":"none|woman|man|cartoon3d|living_product|dog|cat","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace|Fitness Studio","cameraMovement":"45° Product Orbit Shot|Playful Zoom In & Out|Top View Orbit & Walk|Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
  ].join("\n");

  const content = [{ type: "text", text: prompt }];
  if (firstImage) {
    content.push({
      type: "image_url",
      image_url: {
        url: firstImage
      }
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    return {
      name: sanitizeText(parsed.name || productName),
      imageGender: normalizeImageGender(parsed.imageGender || parsed.visualGender || parsed.autoOptions?.presenter || detectExplicitGender(productName)),
      hooks: Array.isArray(parsed.hooks) ? parsed.hooks.map(h => sanitizeText(h)) : [],
      highlights: normalizeHighlights(parsed.highlights),
      targetGroup: sanitizeText(parsed.targetGroup || productInfo.targetGroup || "ทั่วไป"),
      structureAdvice: sanitizeText(parsed.structureAdvice || ""),
      promptAdvice: sanitizeText(parsed.promptAdvice || ""),
      autoOptions: normalizeAutoOptions(parsed.autoOptions, productInfo)
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @description ทดสอบ OpenAI API key
 * @param {string} apiKey - OpenAI API key
 * @param {string} modelName - OpenAI model name
 * @returns {Promise<object>} ผลทดสอบ API
 */
export async function testOpenAIConnection(apiKey, modelName = DEFAULT_OPENAI_MODEL) {
  const cleanKey = sanitizeText(apiKey);
  if (!cleanKey) {
    throw new Error("กรุณาใส่ OpenAI API Key ก่อนทดสอบ");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: "Return only this JSON object: {\"ok\":true}"
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || "OpenAI API Key หรือ Model ใช้งานไม่ได้");
    }

    return {
      model: modelName,
      message: "OpenAI API ready"
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @description ทดสอบ Gemini API key ด้วย request สั้น ๆ เพื่อยืนยันว่า key/model ใช้งานได้จริง
 * @param {string} apiKey - Gemini API key
 * @param {string} modelName - Gemini model name
 * @returns {Promise<object>} ผลทดสอบ API
 */
export async function testGeminiConnection(apiKey, modelName = DEFAULT_GEMINI_MODEL) {
  const cleanKey = sanitizeText(apiKey);
  const cleanModel = sanitizeText(modelName) || DEFAULT_GEMINI_MODEL;
  if (!cleanKey) {
    throw new Error("กรุณาใส่ Gemini API Key ก่อนทดสอบ");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(buildGeminiUrl(encodeURIComponent(cleanModel), cleanKey), {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Return only this JSON object: {\"ok\":true,\"message\":\"Gemini API ready\"}"
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(await getGeminiErrorMessage(response, "Gemini API Key หรือ Model ใช้งานไม่ได้"));
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text || "";
    return {
      model: cleanModel,
      message: sanitizeText(text) || "Gemini API ready"
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Gemini API ทดสอบไม่สำเร็จ: timeout เกิน 15 วินาที");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * @description สร้างผลวิเคราะห์จากชื่อสินค้าเมื่อไม่ได้ใส่ Gemini API key
 * @param {object} productInfo - ข้อมูลสินค้า
 * @returns {object} ผลวิเคราะห์ fallback
 */
function buildTitleBasedFallback(productInfo) {
  const name = sanitizeText(productInfo.name);
  if (!name) {
    throw new Error("ถ้าไม่ได้ใส่ Gemini API Key ต้องกรอกชื่อสินค้า/title สินค้าก่อนวิเคราะห์");
  }

  const targetGroup = sanitizeText(productInfo.targetGroup || "ทั่วไป");
  const existingHighlights = normalizeHighlights(productInfo.highlights);

  return {
    name,
    imageGender: normalizeImageGender(detectExplicitGender(name)),
    hooks: [
      name,
      `ชี้เป้าสุดคุ้ม: ${name}`,
      `รีวิวผู้ใช้จริง: ${name}`,
      `หลังจากลอง ${name}`,
      `ของมันต้องมี: ${name}`
    ],
    highlights: existingHighlights || [
      `• ${name} เหมาะกับการนำเสนอแบบเห็นสินค้าชัดเจน`,
      "• เน้นจุดเด่นหลัก ราคา และประโยชน์ที่ลูกค้าจะได้รับ",
      "• ใช้ภาพสินค้า close-up พร้อมแสงสะอาดเพื่อเพิ่มความน่าเชื่อถือ"
    ].join("\n"),
    targetGroup,
    structureAdvice: /(นาฬิกา|สมาร์ทวอทช์|สายรัดข้อมือ|สายนาฬิกา|wrist\s*watch|smartwatch|smart\s*band|smartband|wristband|fitness\s*tracker|\bloop\b|\bwhoop\b)/i.test(name)
      ? (/(?:ไม่มีจอ|ไร้จอ|no\s*screen|screenless|whoop|\bloop\b|curry|สายรัดข้อมือ|smart\s*band|smartband|fitness\s*tracker)/i.test(name) && !/(?:มีจอ|หน้าจอ|จอ\s*แสดงผล|amoled|oled|touchscreen)/i.test(name)
        ? "Title-only fallback; no image analysis has been performed. CRITICAL ZERO-HALLUCINATION SCREENLESS MANDATE: The reference product is a SCREENLESS wristband/strap with NO digital screen, NO LCD/OLED display, NO watch face, and NO clock hands. Strictly forbid adding any screen, display glass, or smartwatch casing. Preserve the exact fabric loop or silicone strap, weave pattern, and metal clasp from the reference image."
        : "Title-only fallback; no image analysis has been performed. Compare the attached image with the product title: preserve the exact visible watch or wristband structure. Visually verify whether a digital display screen exists in the reference image: if the product has no screen, render it strictly with NO screen, NO display, and NO smartwatch face; if it has an analog dial or digital screen, match it 100% faithfully. Preserve exact strap material, texture, clasp, and case shape; do not add or invent parts.")
      : "Title-only fallback; no image analysis has been performed. During generation, compare the attached image with the product title: use the title for identity, size and use, and preserve the visible product design. Visually count and preserve only that product's structural parts exactly. Keep the same drawers, shelves, tiers, doors, compartments, handles, legs, arrangement, and proportions; do not add or remove parts. Ignore conflicting count variants in the title. If the reference image displays multiple product pieces or color variants but the title does not state multiple pieces, a pack, a set, or a dozen (ไม่ได้บอกว่าหลายชิ้น, ยกโหล, แพ็ค, เซ็ต), depict strictly ONE single hero product piece.",
    promptAdvice: /(นาฬิกา|สมาร์ทวอทช์|สายรัดข้อมือ|สายนาฬิกา|wrist\s*watch|smartwatch|smart\s*band|smartband|wristband|fitness\s*tracker|\bloop\b|\bwhoop\b)/i.test(name)
      ? (/(?:ไม่มีจอ|ไร้จอ|no\s*screen|screenless|whoop|\bloop\b|curry|สายรัดข้อมือ|smart\s*band|smartband|fitness\s*tracker)/i.test(name) && !/(?:มีจอ|หน้าจอ|จอ\s*แสดงผล|amoled|oled|touchscreen)/i.test(name)
        ? "CRITICAL: The product is 100% SCREENLESS with NO screen and NO smartwatch display. Reproduce ONLY the screenless strap and metal buckle/clasp exactly as shown in the reference. Strictly forbid adding any screen, smartwatch UI, or clock hands."
        : "Preserve only the exact wristwatch or wristband from the reference image. For screenless wristbands, strictly forbid adding any screen, digital display, or smartwatch UI. For watches, preserve exact dial/screen, bezel, crown, strap, and colors. Do not hallucinate smartwatch features on screenless items. Discard the original background and unrelated objects.")
      : "Preserve only the named product's shape, proportions, colors, materials, hardware, labels, and printed text. If the reference image displays multiple pieces but the listing is not for multiple pieces or a dozen (ไม่ได้ระบุหลายชิ้น/ยกโหล), render strictly ONE single product unit. All printed text, packaging details, and brand logos on the product must be rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English. Discard the original background and every unrelated object, then create a new clean setting appropriate for the product category.",
    autoOptions: inferAutoOptionsFromProduct(productInfo)
  };
}

function normalizeAutoOptions(value, productInfo = {}) {
  const inferred = inferAutoOptionsFromProduct(productInfo);
  const raw = value && typeof value === "object" ? value : {};
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();
  const isUnderwear = isUnderwearOrIntimateProduct(text);
  const isPetProduct = /(สัตว์|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|แมว|สุนัข|สัตว์เลี้ยง|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b|\banimal\b)/i.test(text);
  const explicitGender = detectExplicitGender(text);
  const campingProduct = isCampingOutdoorProduct(text);
  const legacyHandsOnly = raw.presenter === "hands_only";

  let presenter = pickAllowed(raw.presenter, ["none", "woman", "man", "cartoon3d", "living_product", "dog", "cat"], inferred.presenter);
  if (isUnderwear) {
    presenter = "none";
  } else if (explicitGender) {
    presenter = explicitGender;
  } else if (campingProduct) {
    presenter = "man";
  }
  if ((presenter === "dog" || presenter === "cat") && !isPetProduct) {
    presenter = (inferred.presenter === "dog" || inferred.presenter === "cat") ? "woman" : inferred.presenter;
  }

  let videoStyle = legacyHandsOnly ? "hands-only" : pickAllowed(raw.videoStyle, ["sales", "review", "hands-only", "lifestyle", "flash-sale", "unboxing", "before-after", "testimonial", "cinematic", "still-motion", "boxed-motion", "trending-hook"], inferred.videoStyle);
  if (isUnderwear && (videoStyle === "testimonial" || videoStyle === "lifestyle")) {
    videoStyle = "hands-only";
  }

  let cameraMovement = pickAllowed(raw.cameraMovement, ["45° Product Orbit Shot", "Playful Zoom In & Out", "Orbit / 360°", "Top View Orbit & Walk", "Slider Same Angle", "Slider Same Angle & Fade", "Zoom & Angle Transition", "Slide & Rotate", "Top View Slide & Rotate", "Slow Zoom In", "Pan Left to Right", "Static/Still", "Handheld Shake", "Push In Fast"], inferred.cameraMovement);
  let transition = pickAllowed(raw.transition, ["None", "Fade", "Cut ตรง", "Zoom Transition", "Swipe", "Whip Pan"], inferred.transition);
  if (videoStyle === "still-motion") {
    if (/zoom|push/i.test(cameraMovement)) {
      cameraMovement = "45° Product Orbit Shot";
    }
    if (/zoom/i.test(transition)) {
      transition = "None";
    }
  }

  return {
    videoStyle,
    presenter,
    voiceTone: pickAllowed(raw.voiceTone, ["kind", "fun", "complain", "professional", "hype"], inferred.voiceTone),
    mood: pickAllowed(raw.mood, ["สดใส", "หรูหรา", "น่ารัก", "Professional", "Trendy", "มินิมัล", "Dark & Moody"], inferred.mood),
    location: pickAllowed(raw.location, ["Modern Living Room", "Studio Minimal", "Warehouse / Stockroom", "Urban Street", "Nature / Outdoor", "Luxury Showroom", "Cafe / Coffee Shop", "Office / Workspace", "Fitness Studio"], inferred.location),
    cameraMovement,
    transition,
    reason: sanitizeText(raw.reason || inferred.reason)
  };
}

function normalizeImageGender(value) {
  const clean = String(value || "").trim().toLowerCase();
  if (["man", "male", "men", "ผู้ชาย", "ชาย", "บุรุษ"].includes(clean)) return "man";
  if (["woman", "female", "women", "ผู้หญิง", "หญิง", "สตรี"].includes(clean)) return "woman";
  return "unknown";
}

function detectGender(text = "") {
  const explicitGender = detectExplicitGender(text);
  if (explicitGender) return explicitGender;
  if (/(ขี่มอเตอร์ไซค์|มอไซค์|ไรเดอร์|นักบิด|โกนหนวด|มีดโกน|เนกไท|บ็อกเซอร์|กางเกงในชาย|เสื้อเชิ้ตชาย|รองเท้าผู้ชาย|น้ำหอมผู้ชาย|ครีมผู้ชาย|โฟมผู้ชาย)/i.test(text)) return "man";
  if (/(ชุดเดรส|บรา|ยกทรง|กระโปรง|ลิปสติก|กระเป๋าถือผู้หญิง|ผ้าอนามัย)/i.test(text)) return "woman";
  return "woman";
}

function detectExplicitGender(text = "") {
  const clean = String(text || "");
  const isWomen = /(ผู้หญิง|หญิง|สตรี|สาว|คุณแม่|แม่และเด็ก)/i.test(clean)
    || /\b(?:woman|women|female|lady|ladies|girl|girls|maternity|mom|mother|women'?s|ladies'?)\b/i.test(clean);
  const isMen = /(ผู้ชาย|ชาย|บุรุษ|หนุ่ม)/i.test(clean)
    || /\b(?:man|men|male|boy|boys|gentleman|men'?s)\b/i.test(clean);
  if (isWomen && !isMen) return "woman";
  if (isMen && !isWomen) return "man";
  return "";
}

function isCampingOutdoorProduct(text = "") {
  return /(แคมป์|แคมป์ปิ้ง|เดินป่า|เต็นท์|ถุงนอน|เปลญวน|เปลแขวน|เก้าอี้สนาม|\bcamping\b|\bhiking\b|\btent\b|\bhammock\b|camp(?:ing)?\s+chair|sleeping\s+bag)/i.test(String(text || "").toLowerCase());
}

function inferAutoOptionsFromProduct(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();

  if (isUnderwearOrIntimateProduct(text)) {
    return buildAutoOptions(
      "hands-only",
      "none",
      "kind",
      "มินิมัล",
      "Studio Minimal",
      "Slow Zoom In",
      "Cut ตรง",
      "สินค้ากลุ่มชุดชั้นใน/กางเกงในเป็นสินค้าอ่อนไหวตามนโยบายแพลตฟอร์ม ไม่ควรใช้พรีเซนเตอร์สวมใส่ แนะนำโชว์เนื้อผ้า ความยืดหยุ่น การตัดเย็บแบบมือถือจับ (hands-only) บนพื้นผิวเรียบสะอาด"
    );
  }

  if (isCampingOutdoorProduct(text)) {
    return buildAutoOptions(
      "testimonial",
      "man",
      "professional",
      "Professional",
      "Nature / Outdoor",
      "Slow Zoom In",
      "Cut ตรง",
      "อุปกรณ์แคมป์และกลางแจ้งควรใช้ผู้ชายรีวิวในสถานที่ใช้งานจริง พร้อมแสดงการใช้งานตามธรรมชาติของสินค้า"
    );
  }

  if (/(โม่ง|โม่งกันแดด|โม่งคลุมหัว|โม่งขับรถ|หมวกโม่ง|ผ้าบัฟ|ผ้าบัฟฟ์|โม่งขี่มอไซค์|balaclava|buff|face mask|headwear|sun hood|riding hood|neck gaiter)/i.test(text)) {
    const isExplicitWomen = /(ผู้หญิง|หญิง|สตรี|women|woman|female)/i.test(text);
    const gender = isExplicitWomen ? "woman" : "man";
    return buildAutoOptions(
      "lifestyle",
      gender,
      "kind",
      "เท่",
      "Nature / Outdoor",
      "Slow Zoom In",
      "Fade",
      "สินค้ากลุ่มโม่ง หมวก ผ้าบัฟ ต้องใช้พรีเซนเตอร์เพศตรงกับกลุ่มเป้าหมาย (ผู้ชาย) และสวมใส่โม่ง/หมวก/ผ้าบัฟไว้บนศีรษะตลอดเวลา ห้ามถอดออกเด็ดขาด"
    );
  }
  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return buildAutoOptions("review", "none", "professional", "Professional", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "เฟอร์นิเจอร์ควรแสดงเดี่ยวในพื้นที่ภายในที่สะอาดและเหมาะกับการใช้งานจริง");
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return buildAutoOptions("review", "none", "professional", "Trendy", "Urban Street", "Slow Zoom In", "Cut ตรง", "รองเท้าควรแสดงสินค้าเดี่ยวโดยไม่มีพรีเซนเตอร์เพื่อล็อกรุ่นและรูปทรงให้ตรงต้นฉบับ");
  }
  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return buildAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "เหมาะกับโปรโมชันและการเร่งตัดสินใจ");
  }
  if (/(กันแดด|หมวกกันแดด|หมวกปีกกว้าง|ปลอกแขนกันแดด|เสื้อกันแดด|เสื้อกัน uv|แว่นกันแดด|ร่มกันแดด|สเปรย์กันแดด|โลชั่นกันแดด|ครีมกันแดด|กันแดดหน้า|กันแดดตัว|sunscreen|sunblock|sun lotion|sun spray|sun hat|sun visor|sun glasses|sunglasses|spf)/i.test(text)) {
    const gender = detectGender(text);
    return buildAutoOptions(
      "lifestyle",
      gender,
      "kind",
      "สดใส",
      "Nature / Outdoor",
      "Slow Zoom In",
      "Fade",
      "สินค้ากันแดด/หมวกกันแดดควรแสดงในบรรยากาศกลางแจ้ง แสงแดดธรรมชาติ ชายหาด หรือสวนกลางแจ้ง พร้อมพรีเซนเตอร์ที่เหมาะกับกลุ่มเป้าหมาย"
    );
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    const gender = detectGender(text);
    return buildAutoOptions("cinematic", gender, "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "สินค้าแนวความงามควรเน้นภาพพรีเมียมและรายละเอียดผิวสัมผัส");
  }
  if (/(เสื้อ|กางเกง|กระเป๋า|แฟชั่น|หมวก|wear|shirt|dress|bag|hat|cap)/i.test(text)) {
    const gender = detectGender(text);
    return buildAutoOptions("lifestyle", gender, "fun", "Trendy", "Urban Street", "Handheld Shake", "Swipe", "สินค้าแฟชั่นเหมาะกับการเห็นการใช้งานจริงโดยพรีเซนเตอร์ที่เหมาะกับสินค้า");
  }
  if (/(อาหารไก่|หัวอาหารไก่|อาหารนก|อาหารปลา|อาหารหมู|อาหารวัว|อาหารกุ้ง|chicken feed|poultry feed|fish food|bird food)/i.test(text)) {
    return buildAutoOptions(
      "review",
      "none",
      "professional",
      "Professional",
      "Warehouse / Stockroom",
      "Slow Zoom In",
      "Cut ตรง",
      "อาหารไก่/อาหารสัตว์ฟาร์มควรเน้นบรรจุภัณฑ์ เม็ดอาหาร และรายละเอียดความคุ้มค่าอย่างมืออาชีพ ห้ามใส่สุนัขหรือแมวในฉาก"
    );
  }
  if (/(อาหารแมว|แมว|\\bcat\\b|\\bkitten\\b)/i.test(text)) {
    return buildAutoOptions("review", "cat", "fun", "น่ารัก", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "สินค้าแมวแนะนำพรีเซนเตอร์เป็นน้องแมวสุดน่ารัก");
  }
  if (/(อาหารหมา|อาหารสุนัข|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|สุนัข|\\bdog\\b|\\bpuppy\\b)/i.test(text)) {
    return buildAutoOptions("review", "dog", "fun", "น่ารัก", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "สินค้าสุนัขแนะนำพรีเซนเตอร์เป็นน้องหมาสุดน่ารัก");
  }
  if (/(สัตว์เลี้ยง|\\bpet\\b)/i.test(text)) {
    return buildAutoOptions("review", "none", "professional", "Professional", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "สินค้าหมวดสัตว์เลี้ยงทั่วไปเน้นการโชว์สินค้าเดี่ยวอย่างเป็นมืออาชีพ");
  }
  if (/(จักรยานเด็ก|รถเด็ก|ของใช้เด็ก|ของเล่นเด็ก|คาร์ซีท|รถเข็นเด็ก|กระเป๋านักเรียน|เสื้อผ้าเด็ก|ชุดเด็ก|ของเล่น|เด็ก|\\bkids\\b|\\bkid\\b|\\btoddler\\b|\\bbaby\\b|\\bchildren\\b)/i.test(text)) {
    const isOutdoor = /(จักรยาน|รถเด็ก|สกู๊ตเตอร์|รองเท้า|หมวก|สนาม|กระเป๋า|bike|bicycle|scooter|car|outdoor)/i.test(text);
    return buildAutoOptions(
      "lifestyle",
      "child",
      "kind",
      "น่ารัก",
      isOutdoor ? "Nature / Outdoor" : "Modern Living Room",
      "Slow Zoom In",
      "Cut ตรง",
      "สินค้าเด็กต้องมีเด็กใช้งานสินค้าอย่างเป็นธรรมชาติในฉาก และมีผู้ปกครองคอยดูแลใกล้ชิดอย่างอบอุ่น"
    );
  }
  if (/(ครัว|บ้าน|เครื่องใช้|organizer|storage|clean|ทำความสะอาด)/i.test(text)) {
    return buildAutoOptions("before-after", "none", "professional", "Professional", "Modern Living Room", "Pan Left to Right", "Swipe", "สินค้าใช้ในบ้านควรเห็นปัญหาก่อนใช้และผลลัพธ์หลังใช้");
  }
  if (/(กล่อง|แพ็ค|package|เซ็ต|bundle|gift)/i.test(text)) {
    return buildAutoOptions("unboxing", "none", "kind", "มินิมัล", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "สินค้าแบบเซ็ตเหมาะกับการ reveal ผ่าน unboxing");
  }

  return buildAutoOptions("review", "woman", "professional", "Professional", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "รีวิวสินค้าโดยเน้นรายละเอียดและการใช้งานจริงให้ชัดเจน");
}

function buildAutoOptions(videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason) {
  return { videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason };
}

function pickAllowed(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

/**
 * @description normalize highlights ให้คง newline ได้ ไม่บีบเป็นบรรทัดเดียว
 * @param {unknown} value - raw value
 * @returns {string} highlights
 */
function normalizeHighlights(value) {
  if (Array.isArray(value)) {
    return value.map((item) => `• ${sanitizeText(item)}`).join("\n");
  }
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => sanitizeText(line).replace(/^[-•]\s*/, ""))
    .filter(Boolean)
    .slice(0, 3)
    .map((line) => `• ${line}`)
    .join("\n");
}

/**
 * @description สร้าง Gemini generateContent URL
 * @param {string} encodedModel - model name ที่ encode แล้ว
 * @param {string} apiKey - API key
 * @returns {string} URL
 */
function buildGeminiUrl(encodedModel, apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

/**
 * @description แปลง Gemini error response เป็นข้อความไทยที่ user อ่านได้
 * @param {Response} response - fetch response
 * @param {string} fallbackMessage - fallback
 * @returns {Promise<string>} error message
 */
async function getGeminiErrorMessage(response, fallbackMessage) {
  const statusHelp = getGeminiStatusHelp(response.status);
  try {
    const data = await response.json();
    const apiMessage = sanitizeApiErrorMessage(data.error?.message);
    return [fallbackMessage, `HTTP ${response.status}`, statusHelp, apiMessage].filter(Boolean).join(": ");
  } catch {
    return [fallbackMessage, `HTTP ${response.status}`, statusHelp].filter(Boolean).join(": ");
  }
}

function getGeminiStatusHelp(status) {
  if (status === 400) return "request หรือ model ไม่ถูกต้อง";
  if (status === 401 || status === 403) return "API key ไม่ถูกต้อง, ยังไม่ได้เปิดสิทธิ์ Gemini API, หรือ key ไม่มี permission";
  if (status === 404) return "ไม่พบ model นี้ กรุณาเลือก model อื่น";
  if (status === 429) return "quota หรือ rate limit เต็ม กรุณารอสักครู่แล้วลองใหม่";
  if (status >= 500) return "Gemini server มีปัญหาชั่วคราว";
  return "";
}

function sanitizeApiErrorMessage(message) {
  return sanitizeText(message)
    .replace(/key=AIza[0-9A-Za-z_-]+/g, "key=***")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "***");
}
