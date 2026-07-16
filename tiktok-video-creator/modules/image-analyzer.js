import { buildCaption, buildPostHashtags, normalizeHashtags, sanitizeText, resolveCaptionProductName } from "./prompt-builder.js";

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
    if (provider === "openai") {
      if (!settings.openaiApiKey) return fallback;
      return await generatePostCopyWithOpenAI(productInfo, defaults, settings, fallback);
    }

    if (!settings.geminiApiKey) return fallback;
    return await generatePostCopyWithGemini(productInfo, defaults, settings, fallback);
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

async function generatePostCopyWithGemini(productInfo, defaults, settings, fallback) {
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
    return normalizeGeneratedPostCopy(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}"), fallback, productInfo, defaults);
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePostCopyWithOpenAI(productInfo, defaults, settings, fallback) {
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
    return normalizeGeneratedPostCopy(JSON.parse(data.choices?.[0]?.message?.content || "{}"), fallback, productInfo, defaults);
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

function normalizeGeneratedPostCopy(value, fallback, productInfo = {}, defaults = {}) {
  const isShopee = productInfo.source === "shopee" || (productInfo.productUrl && /shopee\.co\.th/i.test(productInfo.productUrl));
  const maxLen = isShopee ? 100 : POST_CAPTION_MAX_LENGTH;
  const maxTags = isShopee ? 3 : 5;
  const rawCaption = cleanGeneratedCaption(value?.caption) || fallback.caption;
  const caption = truncatePostCaption(ensureCaptionLeadsWithHook(rawCaption, productInfo, defaults), maxLen);
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
  const productName = sanitizeText(productInfo.name);
  const firstImage = imageDataUrls[0] || "";
  const [, mediaType = "image/jpeg"] = firstImage.match(/^data:(.*?);base64,/) || [];
  const base64 = firstImage.replace(/^data:.*?;base64,/, "");
  const model = encodeURIComponent(settings.geminiModel || DEFAULT_GEMINI_MODEL);
  const prompt = [
    "Analyze product image for TikTok Shop.",
    productName ? `Title: ${productName}` : "No title.",
    "Use the title to identify which single object in the image is the product. Analyze only that named product object, not the whole image.",
    "Ignore the source background and every unrelated object, including room surfaces, furniture, decor, lamps, plants, pictures, rugs, windows, people, hands, and props. Do not describe them in structureAdvice or promptAdvice.",
    "Treat the visible named product as the source of truth. The title may contain conflicting size/count variants and must never override visible product evidence.",
    "Identify only the product's exact visible silhouette, width/height/depth proportions, dominant colors, color placement, material/texture, hardware, label layout, brand marks, numbers, icons, and readable printed text.",
    "Count every clearly visible repeated structural part belonging to the product: drawers, shelves, tiers, doors, compartments, panels, handles, legs, wheels, openings, and included pieces. Record their exact arrangement and orientation. Use unknown for anything obscured; never count surrounding objects or infer a count from the title.",
    "For footwear, verify whether the reference shows one shoe or a pair and preserve the exact toe shape, sole thickness/tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, color blocking, side, and viewing angle.",
    "For name, do not include a structural count unless it is clearly and completely visible in the image.",
    "For structureAdvice, write one concise English instruction containing only visually verified structure, counts, arrangement, and proportions. Explicitly say not to add or remove parts.",
    "For promptAdvice, write concise English guidance that preserves only the named product. Explicitly instruct generation to discard the original background and unrelated objects, choose a new setting suitable for the product category, and ensure all printed text, packaging details, and brand logos on the product are rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English.",
    "For hooks, generate an array of 5 distinct high-converting sales hooks in Thai, customized for TikTok Shop. Each hook must be under 50 characters, punchy, stop the scroll, and appeal to different angles (e.g. pain points, promotions/discounts, transformation/results, trending/social proof, urgency).",
    "For overlayText, generate ONE ultra-short Thai phrase (maximum 5 Thai words, ≤20 characters) that describes the product's best benefit in a cute, catchy way. This will appear as on-screen text overlay on the video. Examples: ดีไซน์สวย, ใช้ง่ายมาก, คุ้มสุดๆ, น่ามีมาก.",
    "The recommended location must fit the product's realistic use, not a generic trendy scene. For example, cabinets, drawers, shelves, and indoor furniture belong in a clean appropriate interior, never an urban street.",
    "Recommend creative options for an 8-second vertical TikTok product video.",
    'Return compact JSON only: {"name":"Thai short name","hooks":["Thai hook 1","Thai hook 2","Thai hook 3","Thai hook 4","Thai hook 5"],"overlayText":"≤5 Thai words","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","structureAdvice":"verified English structure/count lock","promptAdvice":"short English reference fidelity prompt advice","autoOptions":{"videoStyle":"review|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|trending-hook","presenter":"none|woman|man|cartoon3d|living_product","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace","cameraMovement":"Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
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
  const productName = sanitizeText(productInfo.name);
  const firstImage = imageDataUrls[0] || "";
  const model = settings.openaiModel || DEFAULT_OPENAI_MODEL;

  const prompt = [
    "Analyze product image for TikTok Shop.",
    productName ? `Title: ${productName}` : "No title.",
    "Use the title to identify which single object in the image is the product. Analyze only that named product object, not the whole image.",
    "Ignore the source background and every unrelated object, including room surfaces, furniture, decor, lamps, plants, pictures, rugs, windows, people, hands, and props. Do not describe them in structureAdvice or promptAdvice.",
    "Treat the visible named product as the source of truth. The title may contain conflicting size/count variants and must never override visible product evidence.",
    "Identify only the product's exact visible silhouette, width/height/depth proportions, dominant colors, color placement, material/texture, hardware, label layout, brand marks, numbers, icons, and readable printed text.",
    "Count every clearly visible repeated structural part belonging to the product: drawers, shelves, tiers, doors, compartments, panels, handles, legs, wheels, openings, and included pieces. Record their exact arrangement and orientation. Use unknown for anything obscured; never count surrounding objects or infer a count from the title.",
    "For footwear, verify whether the reference shows one shoe or a pair and preserve the exact toe shape, sole thickness/tread, heel, tongue, collar, panels, seams, lace pattern/eyelets, logo placement, color blocking, side, and viewing angle.",
    "For name, do not include a structural count unless it is clearly and completely visible in the image.",
    "For structureAdvice, write one concise English instruction containing only visually verified structure, counts, arrangement, and proportions. Explicitly say not to add or remove parts.",
    "For promptAdvice, write concise English guidance that preserves only the named product. Explicitly instruct generation to discard the original background and unrelated objects, choose a new setting suitable for the product category, and ensure all printed text, packaging details, and brand logos on the product are rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English.",
    "For hooks, generate an array of 5 distinct high-converting sales hooks in Thai, customized for TikTok Shop. Each hook must be under 50 characters, punchy, stop the scroll, and appeal to different angles (e.g. pain points, promotions/discounts, transformation/results, trending/social proof, urgency).",
    "For overlayText, generate ONE ultra-short Thai phrase (maximum 5 Thai words, ≤20 characters) that describes the product's best benefit in a cute, catchy way. This will appear as on-screen text overlay on the video. Examples: ดีไซน์สวย, ใช้ง่ายมาก, คุ้มสุดๆ, น่ามีมาก.",
    "The recommended location must fit the product's realistic use, not a generic trendy scene. For example, cabinets, drawers, shelves, and indoor furniture belong in a clean appropriate interior, never an urban street.",
    "Recommend creative options for an 8-second vertical TikTok product video.",
    'Return compact JSON only: {"name":"Thai short name","hooks":["Thai hook 1","Thai hook 2","Thai hook 3","Thai hook 4","Thai hook 5"],"overlayText":"≤5 Thai words","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","structureAdvice":"verified English structure/count lock","promptAdvice":"short English reference fidelity prompt advice","autoOptions":{"videoStyle":"review|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|trending-hook","presenter":"none|woman|man|cartoon3d|living_product","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace","cameraMovement":"Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
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
    structureAdvice: "Use the product title to identify the product object. Visually count and preserve only that product's structural parts exactly. Keep the same drawers, shelves, tiers, doors, compartments, handles, legs, arrangement, and proportions; do not add or remove parts. Ignore conflicting count variants in the title.",
    promptAdvice: "Preserve only the named product's shape, proportions, colors, materials, hardware, labels, and printed text. All printed text, packaging details, and brand logos on the product must be rendered extremely sharp, clear, legible, and spelt correctly in both Thai and English. Discard the original background and every unrelated object, then create a new clean setting appropriate for the product category.",
    autoOptions: inferAutoOptionsFromProduct(productInfo)
  };
}

function normalizeAutoOptions(value, productInfo = {}) {
  const inferred = inferAutoOptionsFromProduct(productInfo);
  const raw = value && typeof value === "object" ? value : {};
  return {
    videoStyle: pickAllowed(raw.videoStyle, ["sales", "review", "lifestyle", "flash-sale", "unboxing", "before-after", "testimonial", "cinematic", "trending-hook"], inferred.videoStyle),
    presenter: pickAllowed(raw.presenter, ["none", "woman", "man", "cartoon3d", "living_product"], inferred.presenter),
    voiceTone: pickAllowed(raw.voiceTone, ["kind", "fun", "complain", "professional", "hype"], inferred.voiceTone),
    mood: pickAllowed(raw.mood, ["สดใส", "หรูหรา", "น่ารัก", "Professional", "Trendy", "มินิมัล", "Dark & Moody"], inferred.mood),
    location: pickAllowed(raw.location, ["Modern Living Room", "Studio Minimal", "Warehouse / Stockroom", "Urban Street", "Nature / Outdoor", "Luxury Showroom", "Cafe / Coffee Shop", "Office / Workspace"], inferred.location),
    cameraMovement: pickAllowed(raw.cameraMovement, ["Slow Zoom In", "Orbit / 360°", "Pan Left to Right", "Static/Still", "Handheld Shake", "Push In Fast"], inferred.cameraMovement),
    transition: pickAllowed(raw.transition, ["Cut ตรง", "Zoom Transition", "Swipe", "Fade", "Whip Pan"], inferred.transition),
    reason: sanitizeText(raw.reason || inferred.reason)
  };
}

function inferAutoOptionsFromProduct(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();

  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return buildAutoOptions("review", "none", "professional", "Professional", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "เฟอร์นิเจอร์ควรแสดงเดี่ยวในพื้นที่ภายในที่สะอาดและเหมาะกับการใช้งานจริง");
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return buildAutoOptions("review", "none", "professional", "Trendy", "Urban Street", "Slow Zoom In", "Cut ตรง", "รองเท้าควรแสดงสินค้าเดี่ยวโดยไม่มีพรีเซนเตอร์เพื่อล็อกรุ่นและรูปทรงให้ตรงต้นฉบับ");
  }
  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return buildAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "เหมาะกับโปรโมชันและการเร่งตัดสินใจ");
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    return buildAutoOptions("cinematic", "woman", "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "สินค้าแนวความงามควรเน้นภาพพรีเมียมและรายละเอียดผิวสัมผัส");
  }
  if (/(เสื้อ|กางเกง|กระเป๋า|แฟชั่น|wear|shirt|dress|bag)/i.test(text)) {
    return buildAutoOptions("lifestyle", "woman", "fun", "Trendy", "Urban Street", "Handheld Shake", "Swipe", "สินค้าแฟชั่นเหมาะกับการเห็นการใช้งานจริง");
  }
  if (/(ของเล่น|เด็ก|น่ารัก|cute|toy|kid|pet|สัตว์เลี้ยง)/i.test(text)) {
    return buildAutoOptions("trending-hook", "cartoon3d", "fun", "น่ารัก", "Modern Living Room", "Push In Fast", "Zoom Transition", "สินค้าน่ารักควรเปิดด้วย hook สนุกและภาพจำง่าย");
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
