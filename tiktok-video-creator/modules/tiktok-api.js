import { resolveProductUrl } from "./prompt-builder.js";

const SHOWCASE_ENDPOINT = "https://shop.tiktok.com/api/v1/streamer_desktop/showcase_product/list";



/**
 * @description ดึงรายการสินค้าจาก TikTok Showcase
 * @param {object} options - page settings
 * @returns {Promise<object>} product list และ page token
 */
export async function fetchShowcaseProducts(options = {}) {
  // TikTok API นี้ใช้ offset และ count แทน page_token / page_size
  const offset = options.pageToken ? parseInt(options.pageToken, 10) : 0;
  const count = options.pageSize || 100;
  
  const endpoint = `${SHOWCASE_ENDPOINT}?offset=${offset}&count=${count}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json, text/plain, */*"
      }
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("กรุณา login TikTok (www.tiktok.com/tiktokstudio) ก่อนดึงสินค้า");
      }
      throw new Error(`HTTP ${res.status} — ดึงสินค้าไม่สำเร็จ`);
    }

    const data = await res.json();
    console.log("TikTok API Response Data:", data);

    if (data.code !== 0 && data.code !== undefined) {
      throw new Error(data.message || `API error code=${data.code}`);
    }

    const list = data.data?.products || data.data?.list || data.products || data.items || [];
    
    // คำนวณ offset สำหรับหน้าถัดไป (ถ้าดึงมาได้ครบตามจำนวน count แสดงว่ามีหน้าต่อไป)
    const nextOffset = list.length >= count ? String(offset + count) : "";

    return {
      products: list.map(normalizeProduct),
      nextPageToken: nextOffset,
      rawData: data
    };
  } catch (error) {
    throw new Error("ดึงข้อมูลล้มเหลว (ตรวจสอบว่า Login TikTok แล้วหรือยัง): " + error.message);
  }
}

/**
 * @description แปลง response จาก TikTok ให้เป็น shape เดียวกัน
 * @param {object} item - product raw item
 * @returns {object} normalized product
 */
export function normalizeProduct(item) {
  // รองรับทั้งโครงสร้างเก่าและโครงสร้างใหม่ของ Affiliate API
  const imageUrls = resolveLargestProductImageUrls(item);
  const displayImageUrl = resolveDisplayProductImageUrl(item, imageUrls);

  const priceStr = (item.format_available_price || item.price?.sale_price || item.price || "").replace(/[฿$\s]/g, "");

  const commissionRateNum = item.affiliate_info?.commission_rate ?? 0;
  const commissionRate = (commissionRateNum / 1000).toFixed(1);
  const commission = item.affiliate_info?.est_commission_expense ?? "";

  const productName = item.title || item.product_name || item.name || "Untitled product";
  const normalized = {
    productId: item.product_id || item.id || "",
    name: productName,
    originalName: productName,
    productLinkTitle: productName,
    displayImageUrl,
    flowImageUrl: imageUrls[0] || displayImageUrl || "",
    imageUrls: imageUrls.length > 0 ? imageUrls : ["assets/icon.svg"],
    price: priceStr,
    currency: item.currency || item.price?.currency || "THB",
    stockCount: String(item.stock_num ?? item.stock_count ?? item.stock ?? 0),
    category: item.category_info?.name || item.category || "",
    shopName: item.seller_info?.shop_name || "",
    productUrl: item.product_url || item.url || "",
    details: item.detail || item.description || item.desc || "",
    rawProduct: item,
    commissionRate,
    commission
  };
  normalized.productUrl = resolveProductUrl(normalized);
  return normalized;
}

function resolveLargestProductImageUrls(item = {}) {
  const candidates = [item.cover, ...(Array.isArray(item.images) ? item.images : [])]
    .flatMap(extractImageCandidates)
    .filter((candidate) => candidate.url);

  const seen = new Set();
  return candidates
    .sort((a, b) => scoreImageCandidate(b) - scoreImageCandidate(a))
    .map((candidate) => candidate.url)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function resolveDisplayProductImageUrl(item = {}, imageUrls = []) {
  let url = item.cover?.url_list?.[0] || item.images?.[0]?.url_list?.[0] || imageUrls[0] || "";
  if (url.startsWith("//")) {
    url = "https:" + url;
  }
  return url;
}

function normalizeProductImageUrl(raw) {
  let u = String(raw || "").trim();
  if (!u) return "";
  if (u.startsWith("//")) return "https:" + u;
  if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;
  // tos key เปล่าจาก TikTok (image.uri) → สร้าง full CDN URL (token อยู่ในคีย์)
  const key = u.replace(/^\/+/, "");
  if (/^(tos-|obj\/tos)/i.test(key)) {
    const token = key.match(/-i-([a-z0-9]+)-/i)?.[1] || "";
    const suffix = token ? `~tplv-${token}-resize-jpeg:800:800.jpeg` : "";
    return `https://p16-oec-va.ibyteimg.com/${key}${suffix}`;
  }
  return u;
}

function extractImageCandidates(image = {}) {
  const urls = [
    image.origin_url,
    image.original_url,
    image.original,
    image.url,
    image.uri,
    ...(Array.isArray(image.url_list) ? image.url_list : [])
  ].filter(Boolean);

  return urls.map((url, index) => {
    const formattedUrl = normalizeProductImageUrl(url);
    return {
      url: formattedUrl,
      index,
      width: Number(image.width || image.w || image.origin_width || image.original_width || 0),
      height: Number(image.height || image.h || image.origin_height || image.original_height || 0)
    };
  });
}

function scoreImageCandidate(candidate) {
  const pixels = candidate.width * candidate.height;
  const url = String(candidate.url || "").toLowerCase();
  let score = pixels || 0;

  if (/origin|original|tos-maliva|obj\/tos/i.test(url)) score += 10_000_000;
  const sizeMatch = url.match(/(?:^|[^\d])(\d{3,5})[x_*](\d{3,5})(?:[^\d]|$)/);
  if (sizeMatch) score += Number(sizeMatch[1]) * Number(sizeMatch[2]);
  score -= candidate.index;

  return score;
}

/**
 * @description แปลง error response จาก TikTok เป็นข้อความที่ debug ได้
 * @param {Response} response - fetch response
 * @param {string} fallbackMessage - fallback message
 * @returns {Promise<string>} error message
 */
async function getTikTokErrorMessage(response, fallbackMessage) {
  try {
    const data = await response.json();
    const apiMessage = data.message || data.error?.message || data.error_msg || data.code || "";
    const suffix = apiMessage ? `: ${apiMessage}` : ` (HTTP ${response.status})`;
    return `${fallbackMessage}${suffix}`;
  } catch {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }
}

/**
 * @description ส่งข้อความให้ background อัปโหลดวิดีโอขึ้น TikTok
 * @param {object} payload - ข้อมูลวิดีโอและสินค้า
 * @returns {Promise<object>} ผลลัพธ์
 */
export async function postToTikTok(payload) {
  const response = await chrome.runtime.sendMessage({ type: "POST_TO_TIKTOK", payload });
  if (!response?.ok) throw new Error(response?.error || "โพสต์ลง TikTok ไม่สำเร็จ");
  return response;
}
