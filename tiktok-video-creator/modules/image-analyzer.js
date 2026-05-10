import { sanitizeText } from "./prompt-builder.js";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

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
  const apiKey = settings.geminiApiKey;
  const productName = sanitizeText(productInfo.name);

  if (!apiKey) {
    return buildTitleBasedFallback(productInfo);
  }

  const firstImage = imageDataUrls[0] || "";
  const [, mediaType = "image/jpeg"] = firstImage.match(/^data:(.*?);base64,/) || [];
  const base64 = firstImage.replace(/^data:.*?;base64,/, "");
  const model = encodeURIComponent(settings.geminiModel || DEFAULT_GEMINI_MODEL);
  const prompt = [
    "Analyze product image for TikTok Shop.",
    productName ? `Title: ${productName}` : "No title.",
    'Return compact JSON only: {"name":"Thai short name","highlights":["Thai benefit 1","Thai benefit 2","Thai benefit 3"],"targetGroup":"สาวออฟฟิศ|แม่บ้าน|วัยรุ่น|ทั่วไป","promptAdvice":"short English video prompt advice"}'
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
      promptAdvice: sanitizeText(parsed.promptAdvice || "")
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
    promptAdvice: `Create a clean TikTok product video for "${name}". Use the product title as the main context, show a clear hero shot, emphasize benefits and CTA, and keep the visual simple because no vision API key was provided.`
  };
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
  try {
    const data = await response.json();
    const apiMessage = data.error?.message ? `: ${data.error.message}` : "";
    return `${fallbackMessage}${apiMessage}`;
  } catch {
    return fallbackMessage;
  }
}
