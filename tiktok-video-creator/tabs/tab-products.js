
import { formatPrice, resolveProductUrl } from "../modules/prompt-builder.js";

let products = [];
let nextPageToken = "";
let helpers = {};
let selectedIds = new Set();
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/**
 * @description เริ่ม logic ของแท็บสินค้า
 * @param {object} injectedHelpers - helper จาก sidepanel
 */
export async function initProductsTab(injectedHelpers) {
  helpers = injectedHelpers;
  bindSourceSwitch();
  bindShopeeEvents();
  bindManualEvents();
  bindProductEvents();

  const stored = await chrome.storage.local.get(["pullSource"]);
  let activeSource = stored.pullSource;
  if (activeSource !== "shopee" && activeSource !== "manual" && activeSource !== "tiktok") {
    activeSource = "tiktok";
  }
  applySource(activeSource);

  if (products.length > 0) {
    renderProducts();
    const loadMore = document.querySelector("#load-more-products");
    const loadAll = document.querySelector("#load-all-products");
    if (loadMore) loadMore.hidden = !nextPageToken;
    if (loadAll) loadAll.hidden = !nextPageToken;
  } else {
    await loadProducts({ reset: true, silent: true });
  }
}

/**
 * @description สลับแหล่งดึงสินค้า TikTok / Shopee / Manual
 */
function bindSourceSwitch() {
  document.querySelectorAll(".source-switch__button").forEach((btn) => {
    btn.addEventListener("click", () => {
      applySource(btn.dataset.source);
      chrome.storage.local.set({ pullSource: btn.dataset.source });
    });
  });
}

function applySource(source) {
  document.querySelectorAll(".source-switch__button").forEach((btn) => {
    btn.classList.toggle("source-switch__button--active", btn.dataset.source === source);
  });
  const tiktokPanel = document.querySelector("#source-tiktok");
  const shopeePanel = document.querySelector("#source-shopee");
  const manualPanel = document.querySelector("#source-manual");
  if (tiktokPanel) tiktokPanel.hidden = source !== "tiktok";
  if (shopeePanel) shopeePanel.hidden = source !== "shopee";
  if (manualPanel) manualPanel.hidden = source !== "manual";
}

/**
 * @description ผูก event ฝั่ง Shopee: ปุ่ม "ดึงเข้าแอป" (collect) และ "Export CSV" (export)
 */
function bindShopeeEvents() {
  document.querySelector("#shopee-pull")?.addEventListener("click", () => runShopeePull());

  const csvBtn = document.querySelector("#shopee-csv-btn");
  const csvInput = document.querySelector("#shopee-csv");
  csvBtn?.addEventListener("click", () => csvInput?.click());
  csvInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset เพื่อเลือกไฟล์เดิมซ้ำได้
    if (file) await importShopeeCsv(file);
  });
}

/**
 * @description อ่านไฟล์ CSV → ตัดคำ → ไล่เปิดลิงก์สินค้าดึงรูปจริง → ทำรายการ → หน้าวิดีโอ
 */
async function importShopeeCsv(file) {
  const btn = document.querySelector("#shopee-csv-btn");
  const setProg = (t, type) => {
    const el = document.querySelector("#shopee-csv-progress");
    if (!el) return;
    el.style.color = type === "error" ? "#e23" : type === "success" ? "#1a7" : "";
    if (type !== "error" && type !== "success" && t) {
      el.innerHTML = `
        <div class="spinner-container">
          <span class="spinner" aria-hidden="true"></span>
          <span>${escapeHtml(t)}</span>
        </div>
      `;
      showLoadingOverlay(t);
    } else {
      el.textContent = t;
      if (type === "success" || type === "error") {
        hideLoadingOverlay();
      }
    }
  };

  try {
    if (btn) btn.disabled = true;
    const text = await file.text();
    const rows = parseShopeeCsv(text);
    if (!rows.length) throw new Error("ไฟล์ว่างหรืออ่านไม่ออก");

    setProg(`พบ ${rows.length} สินค้า — เริ่มดึงรูป...`);
    helpers.logActivity?.(`อ่าน CSV: ${rows.length} สินค้า`);

    const built = [];
    let blocked = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      setProg(`กำลังดึงรูป ${i + 1}/${rows.length}: ${row.name.slice(0, 24)}...`);
      let images = [];
      if (row.productUrl) {
        let res = await chrome.runtime.sendMessage({ type: "SHOPEE_FETCH_IMAGES", payload: { productUrl: row.productUrl } });
        if (res?.ok && res.blocked) {
          await showCaptchaPrompt(`⚠️ ตรวจพบหน้ายืนยันตัวตน (Captcha) ของ Shopee!\nกรุณาไปที่แท็บหน้าต่าง Shopee ที่เด้งขึ้นมา แล้วกดยืนยันตัวตนให้ผ่าน\nจากนั้นกลับมากดปุ่มด้านล่างเพื่อดึงรูปภาพของสินค้านี้ใหม่อีกครั้ง`);
          res = await chrome.runtime.sendMessage({ type: "SHOPEE_FETCH_IMAGES", payload: { productUrl: row.productUrl } });
        }
        if (res?.ok) {
          images = res.images || [];
          if (res.blocked) blocked++;
        }
      }
      built.push({
        productId: row.productId,
        name: row.name,
        price: row.price,
        currency: "THB",
        displayImageUrl: images[0] || "",
        imageUrls: images,                 // หลายรูป → image picker ใช้งานได้
        productUrl: row.productUrl || row.offerUrl,
        shopName: row.shopName,
        commission: row.commission,
        commissionRate: "",
        salesCount: row.salesCount,
        stockCount: "99",
        source: "shopee"
      });
    }
    await chrome.runtime.sendMessage({ type: "SHOPEE_CLOSE_SCRAPE_TAB" });

    // แสดงเป็นรายการ (เหมือน TikTok) — เลือกรูป/เลือกสินค้า แล้วกดสร้างวิดีโอเอง
    products = built;
    selectedIds.clear();
    currentPage = 1;
    renderProducts();
    const blockNote = blocked ? ` (${blocked} ชิ้นโดน Shopee กัน captcha ดึงรูปไม่ได้)` : "";
    setProg(`ทำรายการ ${built.length} ชิ้นแล้ว — เลือกรูป/สินค้าแล้วกดสร้างวิดีโอ${blockNote}`, "success");
    helpers.logActivity?.(`CSV → รายการ ${built.length} ชิ้น${blockNote}`, "success");
  } catch (error) {
    setProg(error.message, "error");
    helpers.logActivity?.(`อ่าน CSV ไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    if (btn) btn.disabled = false;
    hideLoadingOverlay();
  }
}

/**
 * @description ตัดคำ CSV ของ Shopee (รองรับ field มี comma ในเครื่องหมายคำพูด)
 * คอลัมน์: รหัสสินค้า,ชื่อสินค้า,ราคา,ขาย,ชื่อร้านค้า,อัตราค่าคอมมิชชัน,คอมมิชชัน,ลิงก์สินค้า,ลิงก์ข้อเสนอ
 */
function parseShopeeCsv(text) {
  const clean = text.replace(/^﻿/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const splitRow = (line) => {
    const cells = [];
    let cur = "", inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) { cells.push(cur); cur = ""; }
      else cur += c;
    }
    cells.push(cur);
    return cells;
  };

  const header = splitRow(lines[0]).map((h) => h.trim());
  const idx = (name) => header.findIndex((h) => h.includes(name));
  const col = {
    id: idx("รหัสสินค้า"),
    name: idx("ชื่อสินค้า"),
    price: idx("ราคา"),
    shop: idx("ชื่อร้าน"),
    comm: idx("คอมมิชชัน"),
    link: idx("ลิงก์สินค้า"),
    offer: idx("ลิงก์ข้อเสนอ"),
    sales: idx("ขาย")
  };

  return lines.slice(1).map((line) => {
    const c = splitRow(line);
    const get = (i) => (i >= 0 ? (c[i] || "").trim() : "");
    return {
      productId: get(col.id),
      name: get(col.name),
      price: get(col.price).replace(/[^\d.]/g, ""),
      shopName: get(col.shop),
      commission: get(col.comm),
      productUrl: get(col.link),
      offerUrl: get(col.offer),
      salesCount: get(col.sales)
    };
  }).filter((r) => r.productUrl || r.productId);
}

async function runShopeePull() {
  const keyword = document.querySelector("#shopee-keyword")?.value.trim() || "";
  const count = parseInt(document.querySelector("#shopee-count")?.value, 10);
  const minCommRaw = document.querySelector("#shopee-min-comm")?.value.trim() || "";
  const minCommission = minCommRaw === "" ? 0 : Math.max(0, parseFloat(minCommRaw) || 0);
  const minSalesRaw = document.querySelector("#shopee-min-sales")?.value.trim() || "";
  const minSales = minSalesRaw === "" ? 0 : Math.max(0, parseInt(minSalesRaw, 10) || 0);
  const sortBy = document.querySelector("#shopee-sort")?.value || "ความเกี่ยวข้อง";
  const pullBtn = document.querySelector("#shopee-pull");

  if (!keyword) return setShopeeStatus("กรอกคำค้นหาก่อน", "error");
  if (!Number.isInteger(count) || count < 1) return setShopeeStatus("จำนวนต้องเป็นเลขจำนวนเต็มมากกว่า 0", "error");

  if (pullBtn) pullBtn.disabled = true;
  const commNote = minCommission > 0 ? ` คอม ≥${minCommission}%` : "";
  const salesNote = minSales > 0 ? ` ขาย ≥${minSales}ชิ้น` : "";
  setShopeeStatus(`กำลังเปิด Shopee และดึง ${count} ชิ้น...${commNote}${salesNote}`);
  showLoadingOverlay(`กำลังเปิด Shopee และดึง ${count} ชิ้น...${commNote}${salesNote}`);
  helpers.logActivity?.(`ดึง Shopee: "${keyword}" จำนวน ${count}${commNote}${salesNote} เรียงลำดับ: ${sortBy}`);

  try {
    // mode "both": ติ๊ก → Export CSV (trusted click) + คืนข้อมูลสินค้ามาทำวิดีโอ
    const response = await chrome.runtime.sendMessage({
      type: "PULL_SHOPEE_PRODUCTS",
      payload: { keyword, count, mode: "both", minCommission, minSales, sortBy }
    });
    if (!response?.ok) throw new Error(response?.error || "ดึงสินค้า Shopee ไม่สำเร็จ");
    let capNote = response.capped ? " (Shopee จำกัด 100 ชิ้น/ครั้ง)" : "";
    const filterNotes = [];
    if (minCommission > 0) filterNotes.push(`คอม ≥${minCommission}%`);
    if (minSales > 0) filterNotes.push(`ขาย ≥${minSales} ชิ้น`);
    if (filterNotes.length > 0 && (response.ticked ?? 0) < count) {
      capNote += ` (${filterNotes.join(" และ ")} มีแค่ ${response.ticked ?? 0} ชิ้น)`;
    }

    const items = (response.products || []).filter((p) => p.productId || p.name);
    if (!items.length) {
      setShopeeStatus(`ไม่พบข้อมูลสินค้าที่ดึงมาได้${capNote}`, "error");
      return;
    }

    setShopeeStatus(`พบ ${items.length} สินค้า — เริ่มดึงรูปภาพของแต่ละสินค้า...`);
    showLoadingOverlay(`พบ ${items.length} สินค้า — เริ่มดึงรูปภาพของแต่ละสินค้า...`);
    helpers.logActivity?.(`ดึง Shopee: พบ ${items.length} สินค้า — กำลังดึงรูปภาพเข้าระบบ`);

    const built = [];
    let blocked = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      setShopeeStatus(`กำลังดึงรูป ${i + 1}/${items.length}: ${item.name.slice(0, 24)}...`);
      showLoadingOverlay(`กำลังดึงรูป ${i + 1}/${items.length}:\n${item.name.slice(0, 32)}...`);
      
      let images = [];
      let consumerUrl = item.productUrl;
      if (item.productUrl) {
        let res = await chrome.runtime.sendMessage({
          type: "SHOPEE_FETCH_IMAGES",
          payload: { productUrl: item.productUrl }
        });
        if (res?.ok && res.blocked) {
          await showCaptchaPrompt(`⚠️ ตรวจพบหน้ายืนยันตัวตน (Captcha) ของ Shopee!\nกรุณาไปที่แท็บหน้าต่าง Shopee ที่เด้งขึ้นมา แล้วกดยืนยันตัวตนให้ผ่าน\nจากนั้นกลับมากดปุ่มด้านล่างเพื่อดึงรูปภาพของสินค้านี้ใหม่อีกครั้ง`);
          res = await chrome.runtime.sendMessage({
            type: "SHOPEE_FETCH_IMAGES",
            payload: { productUrl: item.productUrl }
          });
        }
        if (res?.ok) {
          images = res.images || [];
          if (res.consumerUrl) {
            consumerUrl = res.consumerUrl;
          }
          if (res.blocked) blocked++;
        }
      }
      
      const finalImages = images.length > 0 ? images : (item.imageUrls || []);
      built.push({
        ...item,
        displayImageUrl: finalImages[0] || item.displayImageUrl || "",
        imageUrls: finalImages,
        productUrl: consumerUrl // เก็บลิงก์สินค้าจริง (ฝั่งผู้บริโภค)
      });
    }

    await chrome.runtime.sendMessage({ type: "SHOPEE_CLOSE_SCRAPE_TAB" });

    products = built;
    selectedIds.clear();
    currentPage = 1;
    renderProducts();

    const blockNote = blocked ? ` (${blocked} ชิ้นโดน captcha ดึงรูปไม่ได้)` : "";
    setShopeeStatus(`ดึงสินค้า ${built.length} ชิ้นเข้ามาในรายการแล้ว — เลือกรูป/สินค้าแล้วกดสร้างวิดีโอ${blockNote}${capNote}`, "success");
    helpers.logActivity?.(`Shopee: ดึงสินค้า ${built.length} ชิ้นเข้ารายการสำเร็จ${blockNote}`, "success");
  } catch (error) {
    setShopeeStatus(error.message, "error");
    helpers.logActivity?.(`Shopee ไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    if (pullBtn) pullBtn.disabled = false;
    hideLoadingOverlay();
  }
}

function showLoadingOverlay(text) {
  const overlay = document.querySelector("#loading-overlay");
  const txtEl = document.querySelector("#loading-overlay-text");
  const spinner = document.querySelector("#loading-overlay-spinner");
  const btn = document.querySelector("#loading-overlay-btn");
  if (overlay) {
    if (txtEl) txtEl.textContent = text || "กำลังดำเนินการ...";
    if (spinner) spinner.style.display = "";
    if (btn) btn.style.display = "none";
    overlay.hidden = false;
  }
}

function hideLoadingOverlay() {
  const overlay = document.querySelector("#loading-overlay");
  const btn = document.querySelector("#loading-overlay-btn");
  const spinner = document.querySelector("#loading-overlay-spinner");
  if (overlay) overlay.hidden = true;
  if (btn) btn.style.display = "none";
  if (spinner) spinner.style.display = "";
}

function showCaptchaPrompt(message) {
  return new Promise((resolve) => {
    const overlay = document.querySelector("#loading-overlay");
    const txtEl = document.querySelector("#loading-overlay-text");
    const spinner = document.querySelector("#loading-overlay-spinner");
    const btn = document.querySelector("#loading-overlay-btn");
    
    if (overlay) overlay.hidden = false;
    if (txtEl) txtEl.textContent = message;
    if (spinner) spinner.style.display = "none";
    
    if (btn) {
      btn.style.display = "block";
      btn.onclick = () => {
        btn.style.display = "none";
        if (spinner) spinner.style.display = "";
        resolve();
      };
    } else {
      setTimeout(resolve, 5000);
    }
  });
}

function setShopeeStatus(text, type) {
  const el = document.querySelector("#shopee-status");
  if (!el) return;
  el.style.color = type === "error" ? "#e23" : type === "success" ? "#1a7" : "";
  if (type !== "error" && type !== "success" && text) {
    el.innerHTML = `
      <div class="spinner-container">
        <span class="spinner" aria-hidden="true"></span>
        <span>${escapeHtml(text)}</span>
      </div>
    `;
  } else {
    el.textContent = text;
  }
}

/**
 * @description ผูก event ของ toolbar และปุ่ม auth
 */
function bindProductEvents() {
  const connectBtn = document.querySelector("#connect-tiktok");
  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      try {
        helpers.showStatus("กำลังดึงสินค้าจาก TikTok Studio...", "success");
        await loadProducts({ reset: true });
      } catch (error) {
        helpers.showStatus(error.message, "error");
      }
    });
  }

  document.querySelector("#refresh-products")?.addEventListener("click", () => loadProducts({ reset: true }));
  document.querySelector("#load-more-products")?.addEventListener("click", () => loadProducts({ reset: false }));
  document.querySelector("#load-all-products")?.addEventListener("click", () => loadAllProducts());
  document.querySelector("#product-search")?.addEventListener("input", () => { currentPage = 1; renderProducts(); });
  document.querySelector("#product-sort")?.addEventListener("change", () => { currentPage = 1; renderProducts(); });

  document.querySelector("#select-all-products")?.addEventListener("change", (e) => {
    const isChecked = e.target.checked;
    const query = document.querySelector("#product-search")?.value.trim().toLowerCase() || "";
    const visibleProducts = products.filter((p) => p.name.toLowerCase().includes(query));
    
    if (isChecked) {
      visibleProducts.forEach(p => selectedIds.add(p.productId));
    } else {
      visibleProducts.forEach(p => selectedIds.delete(p.productId));
    }
    renderProducts();
  });

  document.querySelector("#clear-all-products")?.addEventListener("click", () => {
    selectedIds.clear();
    const selectAll = document.querySelector("#select-all-products");
    if (selectAll) selectAll.checked = false;
    renderProducts();
  });

  document.querySelector("#download-batch-images")?.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;
    const selectedProducts = products.filter(p => selectedIds.has(p.productId));
    
    helpers.showStatus(`เริ่มดาวน์โหลดรูปภาพสำหรับ ${selectedProducts.length} สินค้า...`, "success");
    helpers.logActivity?.(`เริ่มดาวน์โหลดรูปภาพสำหรับ ${selectedProducts.length} สินค้า`, "info");
    
    const dateTimeStr = getFormattedDateTime();
    let totalImages = 0;
    let successProducts = 0;
    for (const product of selectedProducts) {
      let urlsToDownload = [];
      if (Array.isArray(product.selectedImageUrls) && product.selectedImageUrls.length > 0) {
        urlsToDownload = product.selectedImageUrls;
      } else if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
        urlsToDownload = product.imageUrls;
      } else if (product.displayImageUrl) {
        urlsToDownload = [product.displayImageUrl];
      }
      urlsToDownload = [...new Set(urlsToDownload.filter(Boolean))].map(url => url.startsWith("//") ? "https:" + url : url);
      
      const sanitizedName = sanitizeFolderName(product.name || product.productId);
      let successCount = 0;
      for (let i = 0; i < urlsToDownload.length; i++) {
        const url = urlsToDownload[i];
        const ext = getExtensionFromUrl(url);
        const filename = `aivideoshop/download_${dateTimeStr}/${sanitizedName}_${i + 1}${ext}`;
        
        const res = await chrome.runtime.sendMessage({
          type: "DOWNLOAD_FILE",
          payload: {
            url: url,
            filename: filename,
            conflictAction: "uniquify"
          }
        });
        if (res?.ok) {
          successCount++;
          totalImages++;
        }
        await new Promise(r => setTimeout(r, 50));
      }
      if (successCount > 0) {
        successProducts++;
      }
    }
    
    helpers.showStatus(`ดาวน์โหลดรูปภาพสำเร็จ ${totalImages} รูป ของ ${successProducts}/${selectedProducts.length} สินค้า`, "success");
    helpers.logActivity?.(`ดาวน์โหลดรูปภาพสำเร็จรวม ${totalImages} รูปภาพ ของสินค้า ${successProducts} รายการ`, "success");
  });

  document.querySelector("#create-batch-videos")?.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;
    const selectedArray = products
      .filter(p => selectedIds.has(p.productId))
      .map(buildSelectedProductPayload);
    const stored = await chrome.storage.local.get("creatorState");
    const creatorState = stored.creatorState || {};
    if (!creatorState.settings) creatorState.settings = {};
    creatorState.settings.postAction = "post";
    await chrome.storage.local.set({
      selectedProduct: selectedArray[0],
      productQueue: selectedArray,
      activeTab: "video",
      creatorState
    });
    helpers.logActivity?.(`เลือกสินค้าเพื่อสร้างวิดีโอ ${selectedArray.length} รายการ`, "success");
    helpers.showStatus("ส่งสินค้าไปหน้า สร้างวิดีโอ แล้ว", "success");
    await helpers.switchTab("video");
  });
}

/**
 * @description ดึงสินค้า TikTok ผ่าน background/module และแสดง error ที่เป็นมิตร
 * @param {object} options - reset/silent
 */
async function loadProducts({ reset = false, silent = false } = {}) {
  const list = document.querySelector("#product-list");
  const loadMore = document.querySelector("#load-more-products");
  const loadAll = document.querySelector("#load-all-products");

  if (reset) {
    products = [];
    nextPageToken = "";
    currentPage = 1;
  }

  if (list) list.innerHTML = skeletonMarkup();
  if (loadMore) loadMore.hidden = true;
  if (loadAll) loadAll.hidden = true;
  if (!silent) {
    helpers.logActivity?.(reset ? "เริ่มดึงสินค้า TikTok ใหม่" : "กำลังโหลดสินค้าเพิ่ม");
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: "FETCH_PRODUCTS",
      payload: { pageToken: nextPageToken, pageSize: 100 }
    });
    if (!response?.ok) throw new Error(response?.error || "ไม่สามารถดึงสินค้าได้");
    const result = response;
    products = reset ? result.products : [...products, ...result.products];
    nextPageToken = result.nextPageToken;
    renderProducts();
    if (loadMore) loadMore.hidden = !nextPageToken;
    if (loadAll) loadAll.hidden = !nextPageToken;

    if (result.products.length === 0) {
      const rawStr = JSON.stringify(result.rawData || {}).substring(0, 150);
      helpers.showStatus("ได้ 0 รายการ", "error");
      helpers.logActivity?.("Raw Data: " + rawStr, "error");
    } else {
      helpers.logActivity?.(`ดึงสินค้าได้ ${result.products.length} รายการ รวมทั้งหมด ${products.length} รายการ`, "success");
    }
  } catch (error) {
    if (!silent) helpers.showStatus(error.message, "error");
    helpers.logActivity?.(`ดึงสินค้าไม่สำเร็จ: ${error.message}`, "error");
    if (list) list.innerHTML = `<div class="empty-state">ยังไม่มีสินค้าให้แสดง<br>เชื่อมต่อ TikTok หรือเพิ่ม Access Token ใน Options</div>`;
  }
}

async function loadAllProducts() {
  const list = document.querySelector("#product-list");
  const loadMore = document.querySelector("#load-more-products");
  const loadAll = document.querySelector("#load-all-products");

  if (loadMore) loadMore.hidden = true;
  if (loadAll) loadAll.hidden = true;

  helpers.logActivity?.("เริ่มดึงสินค้าทั้งหมดจาก TikTok...");

  let pageCount = 0;
  try {
    while (nextPageToken) {
      pageCount++;
      helpers.showStatus(`กำลังดึงสินค้า TikTok หน้าที่ ${pageCount}... (ได้แล้ว ${products.length} ชิ้น)`, "info");
      const response = await chrome.runtime.sendMessage({
        type: "FETCH_PRODUCTS",
        payload: { pageToken: nextPageToken, pageSize: 100 }
      });
      if (!response?.ok) throw new Error(response?.error || "ไม่สามารถดึงสินค้าได้");
      products = [...products, ...response.products];
      nextPageToken = response.nextPageToken;
      renderProducts();
    }
    helpers.showStatus(`ดึงสินค้าเสร็จสิ้นทั้งหมด ${products.length} ชิ้น!`, "success");
    helpers.logActivity?.(`ดึงสินค้าทั้งหมดเรียบร้อยแล้ว: รวม ${products.length} รายการ`, "success");
  } catch (error) {
    helpers.showStatus(error.message, "error");
    helpers.logActivity?.(`ดึงสินค้าทั้งหมดไม่สำเร็จระหว่างทาง: ${error.message}`, "error");
  } finally {
    if (loadMore) loadMore.hidden = !nextPageToken;
    if (loadAll) loadAll.hidden = !nextPageToken;
  }
}

/**
 * @description render รายการสินค้าแบบ list พร้อม search/sort
 */
function renderProducts() {
  const list = document.querySelector("#product-list");
  if (!list) return;
  
  const query = document.querySelector("#product-search")?.value.trim().toLowerCase() || "";
  const sortBy = document.querySelector("#product-sort")?.value || "newest";

  const filtered = products
    .filter((product) => product.name.toLowerCase().includes(query))
    .sort((a, b) => sortProducts(a, b, sortBy));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  if (!paginated.length) {
    list.innerHTML = `<div class="empty-state">ไม่พบสินค้า</div>`;
    renderPagination(0);
    return;
  }

  list.innerHTML = paginated.map(productMarkup).join("");
  
  list.querySelectorAll(".product-checkbox").forEach((cb) => {
    cb.addEventListener("change", (e) => {
      if (e.target.checked) selectedIds.add(e.target.dataset.id);
      else selectedIds.delete(e.target.dataset.id);
      
      const card = e.target.closest(".product-card");
      card?.classList.toggle("product-card--selected", e.target.checked);
      updateBatchUI();
    });
  });

  list.querySelectorAll("[data-pick-images]").forEach((img) => {
    img.addEventListener("click", (e) => {
      e.stopPropagation();
      const product = products.find((item) => item.productId === img.dataset.pickImages);
      if (product) openImagePicker(product);
    });
  });

  list.querySelectorAll("[data-download-images]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const product = products.find((item) => item.productId === button.dataset.downloadImages);
      if (product) {
        await downloadProductImages(product);
      }
    });
  });

  list.querySelectorAll("[data-create-video]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = products.find((item) => item.productId === button.dataset.createVideo);
      await selectProduct(product);
    });
  });

  list.querySelectorAll("[data-go-post]").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.stopPropagation();
      const product = products.find((item) => item.productId === button.dataset.goPost);
      if (product) {
        await sendProductToPostTab(product);
      }
    });
  });

  list.querySelectorAll(".product-card__id").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = el.dataset.copyId;
      if (id) {
        navigator.clipboard.writeText(id).then(() => {
          helpers.showStatus(`คัดลอก ID: ${id} แล้ว`, "success");
        }).catch(() => {
          helpers.showStatus("คัดลอกล้มเหลว", "error");
        });
      }
    });
  });
  
  updateBatchUI();
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const container = document.querySelector("#pagination-controls");
  if (!container) return;
  
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  
  let html = `<button class="pagination-button" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>◀</button>`;
  const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const endPage = Math.min(totalPages, startPage + 4);

  if (startPage > 1) {
    html += `<button class="pagination-button" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="pagination-ellipsis">...</span>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination-button ${i === currentPage ? 'pagination-button--active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination-ellipsis">...</span>`;
    html += `<button class="pagination-button" data-page="${totalPages}">${totalPages}</button>`;
  }
  
  html += `<button class="pagination-button" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>▶</button>`;
  
  container.innerHTML = html;
  
  container.querySelectorAll(".pagination-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.dataset.page);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        renderProducts();
        document.querySelector("#tab-root").scrollTo({ top: 0 });
      }
    });
  });
}

function updateBatchUI() {
  const query = document.querySelector("#product-search")?.value.trim().toLowerCase() || "";
  const visibleProducts = products.filter((p) => p.name.toLowerCase().includes(query));
  const selectAll = document.querySelector("#select-all-products");
  const batchBtn = document.querySelector("#create-batch-videos");
  const batchDownloadBtn = document.querySelector("#download-batch-images");
  
  if (selectAll && visibleProducts.length > 0) {
    selectAll.checked = visibleProducts.every(p => selectedIds.has(p.productId));
  }
  if (batchBtn) {
    batchBtn.textContent = `สร้างวิดีโอ (${selectedIds.size})`;
    batchBtn.disabled = selectedIds.size === 0;
  }
  if (batchDownloadBtn) {
    batchDownloadBtn.textContent = `ดาวน์โหลดภาพ (${selectedIds.size})`;
    batchDownloadBtn.disabled = selectedIds.size === 0;
  }
}

function sortProducts(a, b, sortBy) {
  if (sortBy === "newest") return 0;
  if (sortBy === "commission") {
    const valA = Number(String(a.commission).replace(/[^\d.-]/g, '')) || 0;
    const valB = Number(String(b.commission).replace(/[^\d.-]/g, '')) || 0;
    return valB - valA;
  }
  if (sortBy === "price") return Number(a.price || 0) - Number(b.price || 0);
  if (sortBy === "stock") return Number(b.stockCount || 0) - Number(a.stockCount || 0);
  return a.name.localeCompare(b.name, "th");
}

async function selectProduct(product) {
  if (!product) return;
  const selectedProduct = buildSelectedProductPayload(product);

  const stored = await chrome.storage.local.get("creatorState");
  const creatorState = stored.storedCreatorState || stored.creatorState || {};
  if (!creatorState.settings) creatorState.settings = {};
  creatorState.settings.postAction = "post";
  await chrome.storage.local.set({
    selectedProduct,
    productQueue: [selectedProduct],
    activeTab: "video",
    creatorState
  });
  helpers.logActivity?.(`เลือกสินค้าเพื่อสร้างวิดีโอ: ${selectedProduct.originalName || selectedProduct.name}`, "success");
  helpers.showStatus("ส่งสินค้าไปหน้า สร้างวิดีโอ แล้ว", "success");
  await helpers.switchTab("video");
}

function buildSelectedProductPayload(product) {
  const productUrl = resolveProductUrl(product);
  const productId = product.productId || product.product_id || product.id || "";
  const originalName = product.originalName || product.productLinkTitle || product.rawProduct?.title || product.rawProduct?.product_name || product.rawProduct?.name || product.name || "";
  let displayImageUrl = product.displayImageUrl || product.imageUrls?.[0] || "";
  let flowImageUrl = product.flowImageUrl || product.imageUrls?.[0] || "";
  if (displayImageUrl.startsWith("//")) displayImageUrl = "https:" + displayImageUrl;
  if (flowImageUrl.startsWith("//")) flowImageUrl = "https:" + flowImageUrl;
  const baseImages = Array.isArray(product.selectedImageUrls) && product.selectedImageUrls.length
    ? product.selectedImageUrls
    : (product.imageUrls || []).slice(0, 1);
  const imageUrls = baseImages.map(url => url.startsWith("//") ? "https:" + url : url);

  return {
    ...product,
    productId,
    product_id: productId,
    name: product.name || originalName,
    originalName,
    productLinkTitle: product.productLinkTitle || originalName,
    displayImageUrl,
    flowImageUrl,
    price: product.price,
    currency: product.currency,
    highlights: "",
    targetGroup: "ทั่วไป",
    cta: "สั่งได้เลย",
    imageUrls,
    productUrl,
    shopName: product.shopName || "",
    category: product.category || "",
    details: product.details || "",
    rawProduct: product.rawProduct || product
  };
}

function openImagePicker(product) {
  const images = (product.imageUrls || []).filter(Boolean);
  if (images.length <= 1) {
    return; // มีรูปเดียว ไม่ต้องเลือก
  }
  const preset = new Set(
    Array.isArray(product.selectedImageUrls) && product.selectedImageUrls.length
      ? product.selectedImageUrls
      : [images[0]]
  );

  document.querySelector("#image-picker-overlay")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "image-picker-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;";

  const box = document.createElement("div");
  box.style.cssText = "background:#fff;color:#111;max-width:520px;width:100%;max-height:80vh;overflow:auto;border-radius:0;border:2px solid #111;";
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-bottom:1px solid #ddd;">
      <strong style="font-size:15px;">เลือกรูปสินค้า (Ingredients)</strong>
      <button type="button" data-act="close" style="border:0;background:none;font-size:20px;cursor:pointer;">×</button>
    </div>
    <div style="padding:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;" data-grid></div>
    <div style="display:flex;gap:8px;justify-content:space-between;padding:12px 14px;border-top:1px solid #ddd;">
      <div style="display:flex;gap:8px;">
        <button type="button" data-act="all" style="border:1px solid #111;background:#fff;padding:6px 10px;border-radius:0;cursor:pointer;">เลือกทั้งหมด</button>
        <button type="button" data-act="none" style="border:1px solid #111;background:#fff;padding:6px 10px;border-radius:0;cursor:pointer;">ล้าง</button>
      </div>
      <button type="button" data-act="confirm" style="border:0;background:#111;color:#fff;padding:6px 14px;border-radius:0;cursor:pointer;font-weight:700;">ยืนยัน (${preset.size})</button>
    </div>`;

  const grid = box.querySelector("[data-grid]");
  const renderGrid = () => {
    grid.innerHTML = images.map((url, i) => {
      const sel = preset.has(url);
      return `<div data-img="${i}" style="position:relative;cursor:pointer;border:3px solid ${sel ? "#111" : "transparent"};aspect-ratio:1;overflow:hidden;background:#f0f0f0;">
        <img src="${escapeHtml(url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;${sel ? "" : "opacity:.45;"}">
        ${sel ? `<span style="position:absolute;top:2px;right:2px;background:#111;color:#fff;font-size:11px;padding:1px 5px;">✓</span>` : ""}
      </div>`;
    }).join("");
    box.querySelector('[data-act="confirm"]').textContent = `ยืนยัน (${preset.size})`;
  };
  renderGrid();

  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  box.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-img]");
    if (cell) {
      const url = images[Number(cell.dataset.img)];
      if (preset.has(url)) preset.delete(url); else preset.add(url);
      renderGrid();
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (act === "close") close();
    if (act === "all") { images.forEach((u) => preset.add(u)); renderGrid(); }
    if (act === "none") { preset.clear(); renderGrid(); }
    if (act === "confirm") {
      const chosen = images.filter((u) => preset.has(u));
      product.selectedImageUrls = chosen.length ? chosen : [images[0]];
      close();
      renderProducts();
    }
  });

  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function productMarkup(product) {
  const imageUrl = product.displayImageUrl || product.imageUrls?.[0] || "assets/icon.svg";
  
  let commissionBadge = '';
  if (Number(product.commissionRate) > 0 || product.commission) {
    const commText = [product.commission, `(${product.commissionRate}%)`].filter(Boolean).join(" ");
    commissionBadge = `<span class="meta-badge meta-badge--commission">ได้ ${commText}</span>`;
  }

  const stockCount = Number(product.stockCount || 0);
  const stockBadge = stockCount <= 0 
    ? `<span class="meta-badge meta-badge--danger">หมดสต๊อก</span>`
    : '';

  let salesBadge = '';
  if (product.salesCount) {
    salesBadge = `<span class="meta-badge meta-badge--info">ขายแล้ว ${product.salesCount}</span>`;
  }

  const isSelected = selectedIds.has(product.productId);
  const allImages = (product.imageUrls || []).filter(Boolean);
  const totalImages = allImages.length;
  const selectedImages = Array.isArray(product.selectedImageUrls) && product.selectedImageUrls.length
    ? product.selectedImageUrls
    : allImages.slice(0, 1);
  const imgBadge = totalImages > 1
    ? `<span class="image-count-badge" style="position:absolute;top:6px;left:6px;background:#000;color:#fff;font-size:11px;font-weight:700;padding:2px 6px;border-radius:0;z-index:2;">${selectedImages.length}/${totalImages} รูป</span>`
    : "";

  return `
    <article class="product-card ${isSelected ? "product-card--selected" : ""}" style="position:relative;">
      <input type="checkbox" class="product-checkbox" data-id="${escapeHtml(product.productId)}" ${isSelected ? 'checked' : ''}>
      ${imgBadge}
      <img class="product-card__image" src="${imageUrl}" alt="" data-pick-images="${escapeHtml(product.productId)}" title="คลิกเพื่อเลือกหลายรูป" style="cursor:pointer;">
      <div class="product-card__content">
        <h3 class="product-card__name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</h3>
        <div class="product-card__id" data-copy-id="${escapeHtml(product.productId)}" style="font-size:10px;color:var(--muted);margin-top:4px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;background:var(--panel-2);padding:2px 6px;border:1px dashed var(--line);border-radius:4px;" title="คลิกเพื่อคัดลอก ID">
          <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>ID: ${escapeHtml(product.productId)}</span>
        </div>
        <p class="product-card__meta">
          <strong>${escapeHtml(formatPrice(product))}</strong>
          ${commissionBadge}
          ${salesBadge}
          ${stockBadge}
        </p>
      </div>
      <button class="icon-button" type="button" data-go-post="${escapeHtml(product.productId)}" title="ส่งไปโพสต์" aria-label="ส่งไปโพสต์">${postIcon()}</button>
      <button class="icon-button" type="button" data-download-images="${escapeHtml(product.productId)}" title="ดาวน์โหลดภาพ" aria-label="ดาวน์โหลดภาพ">${downloadIcon()}</button>
      <button class="icon-button" type="button" data-create-video="${escapeHtml(product.productId)}" title="สร้างวิดีโอ" aria-label="สร้างวิดีโอ">${videoIcon()}</button>
    </article>
  `;
}

function skeletonMarkup() {
  return Array.from({ length: 4 }, (_, index) => `
    <article class="product-card skeleton-card" aria-hidden="true">
      <div class="product-card__image skeleton-block"></div>
      <div class="product-card__content">
        <div class="skeleton-line skeleton-line--wide"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    </article>
  `).join("");
}

function videoIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
}

function downloadIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;
}

function sanitizeFolderName(name) {
  return String(name || "").replace(/[\\/:*?"<>|]/g, "_").trim();
}

function getExtensionFromUrl(url) {
  const cleanUrl = String(url || "").split(/[?#]/)[0];
  const extMatch = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
  if (extMatch) return extMatch[0].toLowerCase();
  
  const cdnMatch = String(url || "").match(/(jpeg|jpg|png|webp|gif|svg)/i);
  if (cdnMatch) {
    const ext = cdnMatch[1].toLowerCase();
    return ext === "jpeg" ? ".jpg" : `.${ext}`;
  }
  return ".jpg";
}

async function downloadProductImages(product) {
  let urlsToDownload = [];
  if (Array.isArray(product.selectedImageUrls) && product.selectedImageUrls.length > 0) {
    urlsToDownload = product.selectedImageUrls;
  } else if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
    urlsToDownload = product.imageUrls;
  } else if (product.displayImageUrl) {
    urlsToDownload = [product.displayImageUrl];
  }
  
  urlsToDownload = [...new Set(urlsToDownload.filter(Boolean))].map(url => url.startsWith("//") ? "https:" + url : url);
  console.log("[DEBUG-DOWNLOAD] Product Name:", product.name);
  console.log("[DEBUG-DOWNLOAD] URLs to download:", urlsToDownload);
  
  if (urlsToDownload.length === 0) {
    helpers.showStatus("ไม่พบรูปภาพสินค้าที่จะดาวน์โหลด", "error");
    return;
  }
  
  helpers.showStatus(`กำลังดาวน์โหลดรูปภาพสำหรับ ${product.name}...`, "success");
  helpers.logActivity?.(`เริ่มดาวน์โหลดรูปภาพ ${urlsToDownload.length} รูป ของ ${product.name}`, "info");
  
  const dateTimeStr = getFormattedDateTime();
  const sanitizedName = sanitizeFolderName(product.name || product.productId);
  let successCount = 0;
  let errors = [];
  
  for (let i = 0; i < urlsToDownload.length; i++) {
    const url = urlsToDownload[i];
    const ext = getExtensionFromUrl(url);
    const filename = `aivideoshop/download_${dateTimeStr}/${sanitizedName}_${i + 1}${ext}`;
    console.log(`[DEBUG-DOWNLOAD] Requesting image ${i + 1}/${urlsToDownload.length}:`, url, "->", filename);
    
    try {
      const res = await chrome.runtime.sendMessage({
        type: "DOWNLOAD_FILE",
        payload: {
          url: url,
          filename: filename,
          conflictAction: "uniquify"
        }
      });
      console.log(`[DEBUG-DOWNLOAD] Response for image ${i + 1}:`, res);
      if (res?.ok) {
        successCount++;
      } else {
        errors.push(`รูปที่ ${i + 1}: ${res?.error || "ดาวน์โหลดไม่สำเร็จ"}`);
      }
    } catch (err) {
      console.error(`[DEBUG-DOWNLOAD] Error for image ${i + 1}:`, err);
      errors.push(`รูปที่ ${i + 1}: ${err.message || "เกิดข้อผิดพลาด"}`);
    }
  }
  
  if (errors.length > 0) {
    helpers.showStatus(`ดาวน์โหลดสำเร็จ ${successCount}/${urlsToDownload.length} รูป (ล้มเหลว: ${errors.slice(0, 2).join(", ")}${errors.length > 2 ? '...' : ''})`, "error");
    helpers.logActivity?.(`ดาวน์โหลดรูปภาพสำหรับ ${product.name} สำเร็จ ${successCount}/${urlsToDownload.length} (ล้มเหลว: ${errors.join("; ")})`, "error");
  } else {
    helpers.showStatus(`ดาวน์โหลดรูปภาพสำเร็จ ${successCount}/${urlsToDownload.length} รูป`, "success");
    helpers.logActivity?.(`ดาวน์โหลดรูปภาพสำหรับ ${product.name} สำเร็จทั้งหมด (${successCount}/${urlsToDownload.length} รูป)`, "success");
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFormattedDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function postIcon() {
  return `<svg class="svg-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"></path><path d="M22 2l-7 20-4-9-9-4 20-7z"></path></svg>`;
}

async function sendProductToPostTab(product) {
  if (!product) return;
  const payload = buildSelectedProductPayload(product);
  await chrome.storage.local.set({
    selectedProductForPost: payload
  });
  helpers.logActivity?.(`เลือกสินค้าเพื่อส่งไปโพสต์: ${payload.originalName || payload.name}`, "success");
  helpers.showStatus("ส่งสินค้าไปหน้า โพสต์ TikTok แล้ว", "success");
  await helpers.switchTab("post");
}

function bindManualEvents() {
  const fileInput = document.querySelector("#manual-image-file");
  const fileInfo = document.querySelector("#manual-image-file-info");
  const addBtn = document.querySelector("#manual-add");
  const statusEl = document.querySelector("#manual-status");

  fileInput?.addEventListener("change", () => {
    const files = fileInput.files;
    if (files && files.length > 0) {
      fileInfo.textContent = `เลือกรูปภาพแล้ว ${files.length} รูป`;
    } else {
      fileInfo.textContent = "ยังไม่ได้เลือกรูปภาพ (กรุณาเลือกอย่างน้อย 1 รูป)";
    }
  });

  addBtn?.addEventListener("click", async () => {
    try {
      const name = document.querySelector("#manual-name")?.value.trim();
      const price = parseFloat(document.querySelector("#manual-price")?.value) || 0;
      const url = document.querySelector("#manual-url")?.value.trim();
      const files = fileInput?.files || [];

      if (!name) {
        throw new Error("กรุณากรอกชื่อสินค้า / Hook");
      }
      if (files.length === 0) {
        throw new Error("กรุณาเลือกรูปภาพอย่างน้อย 1 รูป");
      }

      addBtn.disabled = true;
      if (statusEl) statusEl.textContent = "กำลังประมวลผลรูปภาพ...";

      // อ่านไฟล์เป็น base64 data urls
      const imageUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await readFileAsDataUrl(file);
        imageUrls.push(dataUrl);
      }

      // สร้าง product object เพื่อเอาใส่คิว
      // สำหรับสินค้ากรอกเอง productId จะเป็น timestamp ชั่วคราว
      const manualId = "manual_" + Date.now();
      const product = {
        productId: manualId,
        product_id: manualId,
        id: manualId,
        name: name,
        originalName: name,
        productLinkTitle: name.slice(0, 25), // clean title for link
        displayImageUrl: imageUrls[0],
        flowImageUrl: imageUrls[0],
        price: price ? String(price) : "0",
        currency: "THB",
        imageUrls: imageUrls,
        selectedImageUrls: imageUrls,
        productUrl: url || "",
        shopName: "Manual Input",
        category: "General",
        details: "สินค้ากรอกข้อมูลเอง",
        source: "manual",
        status: "pending"
      };

      const payload = buildSelectedProductPayload(product);

      // โหลดคิวปัจจุบันจาก storage
      const storedQueue = await chrome.storage.local.get(["productQueue"]);
      const queue = Array.isArray(storedQueue.productQueue) ? storedQueue.productQueue : [];
      queue.push(payload);

      // บันทึกกลับลง storage
      await chrome.storage.local.set({
        productQueue: queue,
        selectedProduct: payload,
        activeTab: "video"
      });

      if (statusEl) {
        statusEl.style.color = "#1a7";
        statusEl.textContent = "เพิ่มสินค้าเข้าคิวสร้างวิดีโอแล้ว! กำลังเปลี่ยนหน้า...";
      }

      // รีเซ็ตฟอร์ม
      if (document.querySelector("#manual-name")) document.querySelector("#manual-name").value = "";
      if (document.querySelector("#manual-price")) document.querySelector("#manual-price").value = "";
      if (document.querySelector("#manual-url")) document.querySelector("#manual-url").value = "";
      if (fileInput) fileInput.value = "";
      if (fileInfo) fileInfo.textContent = "ยังไม่ได้เลือกรูปภาพ (กรุณาเลือกอย่างน้อย 1 รูป)";

      setTimeout(async () => {
        if (statusEl) statusEl.textContent = "";
        addBtn.disabled = false;
        await helpers.switchTab("video");
      }, 1000);

    } catch (err) {
      if (statusEl) {
        statusEl.style.color = "#e23";
        statusEl.textContent = err.message;
      }
      addBtn.disabled = false;
    }
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("อ่านไฟล์รูปภาพไม่สำเร็จ"));
    reader.readAsDataURL(file);
  });
}
