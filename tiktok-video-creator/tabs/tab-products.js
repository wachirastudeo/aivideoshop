
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
  const imageUrls = (product.imageUrls || []).map(url => url.startsWith("//") ? "https:" + url : url);

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

  return `
    <article class="product-card ${isSelected ? "product-card--selected" : ""}">
      <input type="checkbox" class="product-checkbox" data-id="${escapeHtml(product.productId)}" ${isSelected ? 'checked' : ''}>
      <img class="product-card__image" src="${imageUrl}" alt="">
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
