import { buildCaption, buildPostHashtags, normalizeHashtags, sanitizeText } from "./prompt-builder.js";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";
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
  return {
    caption: truncatePostCaption(buildCaption(productInfo, defaults)),
    hashtags: normalizeHashtags(buildPostHashtags(productInfo, { ...defaults, hashtags: productInfo.hashtags || defaults.hashtags }), 5),
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
    return normalizeGeneratedPostCopy(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}"), fallback);
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
    return normalizeGeneratedPostCopy(JSON.parse(data.choices?.[0]?.message?.content || "{}"), fallback);
  } finally {
    clearTimeout(timeout);
  }
}

function buildPostCopyPrompt(productInfo = {}, defaults = {}) {
  const baseHashtags = normalizeHashtags(productInfo.hashtags || defaults.hashtags || [], 4).join(" ");
  const fullProductName = resolveFullProductNameForAi(productInfo);
  return [
    "Create TikTok Shop post copy in Thai for this product.",
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
    `- Caption must be natural Thai TikTok Shop sales copy, maximum ${POST_CAPTION_MAX_LENGTH} characters.`,
    "- Use the full product title as the main source for product-specific details.",
    "- Do not include product URLs or raw links.",
    "- Do not include hashtags inside caption; return hashtags separately.",
    "- Do not invent medical, guaranteed, or unsupported claims.",
    "- Remove bracket/badge text, emoji, odd punctuation, and filler words.",
    "- Return at most 5 hashtags, all directly relevant to the product/category/use case, each starting with #.",
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
  ].find((value) => String(value || "").trim()) || "";
}

function sanitizeLongText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, POST_CAPTION_MAX_LENGTH);
}

function normalizeGeneratedPostCopy(value, fallback) {
  const caption = truncatePostCaption(cleanGeneratedCaption(value?.caption) || fallback.caption);
  const hashtags = normalizeHashtags(cleanGeneratedHashtags(value?.hashtags?.length ? value.hashtags : fallback.hashtags), 5);
  return {
    caption,
    hashtags,
    source: "ai"
  };
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

function truncatePostCaption(value) {
  return String(value || "").trim().slice(0, POST_CAPTION_MAX_LENGTH).trim();
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
    "Recommend creative options for an 8-second vertical TikTok product video.",
    'Return compact JSON only: {"name":"Thai short name","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","promptAdvice":"short English video prompt advice","autoOptions":{"videoStyle":"review|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|trending-hook","presenter":"none|woman|man|cartoon3d|living_product","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace","cameraMovement":"Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
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
      highlights: normalizeHighlights(parsed.highlights),
      targetGroup: sanitizeText(parsed.targetGroup || productInfo.targetGroup || "ทั่วไป"),
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
    "Recommend creative options for an 8-second vertical TikTok product video.",
    'Return compact JSON only: {"name":"Thai short name","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","promptAdvice":"short English video prompt advice","autoOptions":{"videoStyle":"review|lifestyle|flash-sale|unboxing|before-after|testimonial|cinematic|trending-hook","presenter":"none|woman|man|cartoon3d|living_product","voiceTone":"kind|fun|complain|professional|hype","mood":"สดใส|หรูหรา|น่ารัก|Professional|Trendy|มินิมัล|Dark & Moody","location":"Modern Living Room|Studio Minimal|Warehouse / Stockroom|Urban Street|Nature / Outdoor|Luxury Showroom|Cafe / Coffee Shop|Office / Workspace","cameraMovement":"Slow Zoom In|Orbit / 360°|Pan Left to Right|Static/Still|Handheld Shake|Push In Fast","transition":"Cut ตรง|Zoom Transition|Swipe|Fade|Whip Pan","reason":"short Thai reason"}}'
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
      highlights: normalizeHighlights(parsed.highlights),
      targetGroup: sanitizeText(parsed.targetGroup || productInfo.targetGroup || "ทั่วไป"),
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
    highlights: existingHighlights || [
      `• ${name} เหมาะกับการนำเสนอแบบเห็นสินค้าชัดเจน`,
      "• เน้นจุดเด่นหลัก ราคา และประโยชน์ที่ลูกค้าจะได้รับ",
      "• ใช้ภาพสินค้า close-up พร้อมแสงสะอาดเพื่อเพิ่มความน่าเชื่อถือ"
    ].join("\n"),
    targetGroup,
    promptAdvice: `Create a clean TikTok product video for "${name}". Use the product title as the main context, show a clear hero shot, emphasize benefits and CTA, and keep the visual simple because no vision API key was provided.`,
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

  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return buildAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "เหมาะกับโปรโมชันและการเร่งตัดสินใจ");
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    return buildAutoOptions("cinematic", "woman", "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "สินค้าแนวความงามควรเน้นภาพพรีเมียมและรายละเอียดผิวสัมผัส");
  }
  if (/(เสื้อ|กางเกง|รองเท้า|กระเป๋า|แฟชั่น|wear|shirt|dress|bag|shoe)/i.test(text)) {
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

  return buildAutoOptions("sales", "none", "professional", "Professional", "Studio Minimal", "Orbit / 360°", "Cut ตรง", "ใช้ข้อมูลสินค้าเพื่อขายสินค้าและโชว์จุดขายให้ชัดที่สุด");
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
