import { VIDEO_STYLES } from "../modules/prompt-builder.js";
import { DEFAULT_GEMINI_MODEL, testGeminiConnection } from "../modules/image-analyzer.js";

const statusBox = document.querySelector("#status");

/**
 * @description โหลด options ที่บันทึกไว้
 */
async function loadOptions() {
  const { settings = {}, tiktokAuth = {} } = await chrome.storage.sync.get(["settings", "tiktokAuth"]);

  document.querySelector("#default-video-style").innerHTML = VIDEO_STYLES
    .map((style) => `<option value="${style.id}">${style.emoji} ${style.name}</option>`)
    .join("");
  setValue("gemini-api-key", settings.geminiApiKey);
  setValue("gemini-model", settings.geminiModel || DEFAULT_GEMINI_MODEL);
  setValue("default-video-style", settings.defaultVideoStyle || "review");
  setValue("default-language", settings.defaultLanguage || "ไทย");
  setValue("caption-template", settings.postDefaults?.captionTemplate || "{product_name} {price} {cta}");
  setValue("default-hashtags", (settings.postDefaults?.hashtags || ["#TikTokShop", "#ของดีบอกต่อ"]).join(", "));
  document.querySelector("#auto-add-product-link").checked = settings.postDefaults?.autoAddProductLink !== false;
}

/**
 * @description บันทึก settings ทั้งหมด
 */
async function saveSettings() {
  const settings = {
    geminiApiKey: getValue("gemini-api-key"),
    geminiModel: getValue("gemini-model") || DEFAULT_GEMINI_MODEL,
    defaultVideoStyle: getValue("default-video-style"),
    defaultLanguage: getValue("default-language"),
    postDefaults: {
      captionTemplate: getValue("caption-template"),
      hashtags: getValue("default-hashtags").split(",").map((item) => item.trim()).filter(Boolean),
      autoAddProductLink: document.querySelector("#auto-add-product-link").checked
    }
  };

  await chrome.storage.sync.set({ settings });
  showStatus("บันทึก Settings แล้ว", "success");
}



/**
 * @description ทดสอบดึงสินค้า TikTok Showcase ด้วย Session ปัจจุบัน
 */
async function testProductFetch() {
  const button = document.querySelector("#test-products");

  button.disabled = true;
  button.textContent = "Testing...";
  showStatus("กำลังทดสอบดึงสินค้า TikTok...", "success");

  try {
    const response = await chrome.runtime.sendMessage({
      type: "FETCH_PRODUCTS",
      payload: { pageSize: 5, pageToken: "" }
    });

    if (!response?.ok) {
      throw new Error(response?.error || "ดึงสินค้าไม่สำเร็จ");
    }

    const count = response.products?.length || 0;
    const firstName = response.products?.[0]?.name ? ` ตัวแรก: ${response.products[0].name}` : "";
    showStatus(`ดึงสินค้าได้ ${count} รายการ${firstName}`, "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Test Product Fetch";
  }
}

/**
 * @description ทดสอบ Gemini API key ด้วย API request จริง
 */
async function testGemini() {
  const button = document.querySelector("#test-gemini");
  if (!getValue("gemini-api-key")) {
    showStatus("ไม่ได้ใส่ Gemini API Key: วิเคราะห์แบบ fallback ได้เมื่อมีชื่อสินค้า/title", "success");
    return;
  }

  button.disabled = true;
  button.textContent = "Testing...";
  showStatus("กำลังทดสอบ Gemini API...", "success");

  try {
    await saveSettings();
    const result = await testGeminiConnection(getValue("gemini-api-key"), getValue("gemini-model"));
    showStatus(`Gemini API ใช้งานได้ (${result.model})`, "success");
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Test Gemini API";
  }
}

/**
 * @description แสดง status
 * @param {string} message - message
 * @param {"success"|"error"} type - type
 */
function showStatus(message, type) {
  statusBox.textContent = message;
  statusBox.dataset.type = type;
  statusBox.hidden = false;
}

/**
 * @description อ่านค่า input
 * @param {string} id - id
 * @returns {string} value
 */
function getValue(id) {
  return document.querySelector(`#${id}`).value.trim();
}

/**
 * @description set input value
 * @param {string} id - id
 * @param {string} value - value
 */
function setValue(id, value) {
  const element = document.querySelector(`#${id}`);
  if (element) element.value = value || "";
}

document.querySelector("#save-settings").addEventListener("click", saveSettings);
document.querySelector("#test-products").addEventListener("click", testProductFetch);
document.querySelector("#test-gemini").addEventListener("click", testGemini);
loadOptions().catch((error) => showStatus(error.message, "error"));
