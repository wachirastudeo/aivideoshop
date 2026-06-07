
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
  bindProductEvents();
  await loadProducts({ reset: true, silent: true });
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

  document.querySelector("#create-batch-videos")?.addEventListener("click", async () => {
    if (selectedIds.size === 0) return;
    const selectedArray = products
      .filter(p => selectedIds.has(p.productId))
      .map(buildSelectedProductPayload);
    await chrome.storage.local.set({ selectedProduct: selectedArray[0], productQueue: selectedArray, activeTab: "video" });
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

  if (reset) {
    products = [];
    nextPageToken = "";
    currentPage = 1;
  }

  if (list) list.innerHTML = skeletonMarkup();
  if (loadMore) loadMore.hidden = true;
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

  list.querySelectorAll("[data-create-video]").forEach((button) => {
    button.addEventListener("click", async () => {
      const product = products.find((item) => item.productId === button.dataset.createVideo);
      await selectProduct(product);
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
  
  if (selectAll && visibleProducts.length > 0) {
    selectAll.checked = visibleProducts.every(p => selectedIds.has(p.productId));
  }
  if (batchBtn) {
    batchBtn.textContent = `สร้างวิดีโอ (${selectedIds.size})`;
    batchBtn.disabled = selectedIds.size === 0;
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

  await chrome.storage.local.set({ selectedProduct, productQueue: [selectedProduct], activeTab: "video" });
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
        <p class="product-card__meta">
          <strong>${escapeHtml(formatPrice(product))}</strong>
          ${commissionBadge}
          ${stockBadge}
        </p>
      </div>
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
