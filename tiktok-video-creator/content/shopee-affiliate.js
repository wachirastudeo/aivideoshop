// Shopee Affiliate automation — ค้นหา → ติ๊ก N ชิ้นแรก → กด Export ของเว็บ
// เว็บเป็นตัวสร้างไฟล์ CSV เอง (รูปแบบ: รหัสสินค้า,ชื่อสินค้า,ราคา,ขาย,ชื่อร้านค้า,
// อัตราค่าคอมมิชชัน,คอมมิชชัน,ลิงก์สินค้า,ลิงก์ข้อเสนอ)
// NOTE: selector ของ Shopee เป็น dynamic class — ใช้ตัวที่เสถียร (placeholder, ข้อความปุ่ม,
// role, โครงสร้าง) + fallback หลายชั้น. ต้อง verify กับหน้าจริงตอนทดสอบ.

(() => {
  if (window.__shopeeAffiliateBound) return;
  window.__shopeeAffiliateBound = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function parseSalesNumber(salesText) {
    if (!salesText) return 0;
    const clean = salesText.toLowerCase().replace(/ขายแล้ว|ขายได้|sold|ชิ้น/gi, "").replace(/[^\d.k+]/g, "").trim();
    if (clean.includes("k")) {
      const num = parseFloat(clean.replace("k", "")) || 0;
      return Math.round(num * 1000);
    }
    return parseInt(clean, 10) || 0;
  }

  function log(msg) {
    console.log("[Shopee Affiliate]", msg);
  }

  // รอจน predicate คืนค่า truthy หรือหมดเวลา
  async function waitFor(predicate, { timeout = 12000, interval = 300 } = {}) {
    const start = Date.now();
    for (;;) {
      let value;
      try { value = predicate(); } catch { value = null; }
      if (value) return value;
      if (Date.now() - start > timeout) return null;
      await sleep(interval);
    }
  }

  function visible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function byText(selector, re) {
    return Array.from(document.querySelectorAll(selector)).find(
      (el) => visible(el) && re.test((el.textContent || "").trim())
    );
  }

  function nativeSetValue(input, value) {
    const proto = input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter ? setter.call(input, value) : (input.value = value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // ---- หา element หลัก (มี fallback หลายชั้น) ----
  function findSearchInput() {
    const candidates = [
      ...document.querySelectorAll('input[type="search"]'),
      ...document.querySelectorAll('input[placeholder*="ค้นหา"]'),
      ...document.querySelectorAll('input[placeholder*="Search"]'),
      ...document.querySelectorAll('input[type="text"]')
    ];
    return candidates.find(visible) || null;
  }

  // ปุ่ม bulk ใน batch-bar: "รับลิงก์แบบทีเดียวทั้งหมด" หรือ "รับลิงก์ทั้งหมด" หรือ "รับลิงก์"
  function findBulkButton() {
    // 1. ลองหาใน batch-bar หรือ container ที่เกี่ยวข้องโดยตรงก่อน
    const selectors = [
      ".batch-bar button.ant-btn-primary",
      ".batch-bar button",
      ".batch-bar .ant-btn",
      ".batch-bar [role='button']",
      "[class*='batch'] button",
      "[class*='batch'] .ant-btn",
      "[class*='batch'] [role='button']",
      "[class*='bar'] button",
      "[class*='bar'] .ant-btn",
      "[class*='bar'] [role='button']",
      "[class*='bottom'] button",
      "[class*='bottom'] .ant-btn",
      "[class*='bottom'] a",
      "[class*='bottom'] [role='button']"
    ].join(", ");

    const bulkInBatchBar = byText(selectors, /รับลิงก์|ส่งออก|export/i);
    if (bulkInBatchBar) return bulkInBatchBar;

    // 2. fallback หาปุ่มที่มีข้อความแต่ต้องไม่ใช่ปุ่มรับลิงก์รายตัว (ไม่อยู่ในการ์ดสินค้า)
    const allButtons = Array.from(document.querySelectorAll("button.ant-btn-primary, button, .ant-btn, a.ant-btn, [role='button']")).filter(visible);
    return allButtons.find(btn => {
      const text = (btn.textContent || "").trim();
      const isMatch = /รับลิงก์|ส่งออก|export/i.test(text);
      if (!isMatch) return false;
      // กรองออกหากอยู่ในการ์ดสินค้าเดี่ยวๆ
      if (btn.closest(".ItemCard__container, .AffiliateItemCard__gelinkSection, [class*='ItemCard']")) {
        return false;
      }
      return true;
    }) || null;
  }

  // ปุ่มยืนยันใน modal: "เอา ลิงก์" (สร้างลิงก์ + ดาวน์โหลด CSV)
  function findModalConfirm() {
    return byText(
      ".ant-modal button, .ant-drawer button, [role='dialog'] button, .ant-modal-footer button, " +
      ".ant-modal .ant-btn, .ant-drawer .ant-btn, [role='dialog'] .ant-btn, " +
      ".ant-modal [role='button'], .ant-drawer [role='button'], [role='dialog'] [role='button']",
      /เอา\s?ลิงก์|ยืนยัน|ดาวน์โหลด|confirm|export/i
    );
  }

  // checkbox สินค้าเป็น Ant Design: label.ant-checkbox-wrapper ในการ์ดสินค้า
  function findProductCheckboxes() {
    const scoped = Array.from(
      document.querySelectorAll(
        ".ItemCard__container .ant-checkbox-wrapper, .AffiliateItemCard__gelinkSection .ant-checkbox-wrapper"
      )
    ).filter(visible);
    if (scoped.length) return scoped;
    return Array.from(document.querySelectorAll("label.ant-checkbox-wrapper")).filter(visible);
  }

  function isChecked(el) {
    if (el.classList?.contains("ant-checkbox-wrapper")) {
      return el.classList.contains("ant-checkbox-wrapper-checked") || !!el.querySelector(".ant-checkbox-checked");
    }
    if (el.matches?.('input[type="checkbox"]')) return el.checked;
    return /checked|active/i.test(el.className);
  }

  // คลิกติ๊ก แล้ว verify; ถ้าไม่ติดลองคลิก target อื่นในการ์ด (input/span/box)
  async function tickCheckbox(el) {
    if (isChecked(el)) return true;
    if (el.scrollIntoView) {
      el.scrollIntoView({ block: "center", inline: "center" });
      await sleep(100);
    }
    const targets = [
      el,
      el.querySelector("input.ant-checkbox-input"),
      el.querySelector(".ant-checkbox"),
      el.querySelector(".ant-checkbox-inner")
    ].filter(Boolean);
    for (const t of targets) {
      t.click();
      await sleep(120);
      if (isChecked(el)) return true;
    }
    return isChecked(el);
  }

  // คลิกแบบ trusted ผ่าน background → chrome.debugger (Input.dispatchMouseEvent)
  // จำเป็นสำหรับปุ่ม "เอา ลิงก์": synthetic click ได้ไฟล์ CSV เปล่า, trusted click ได้ไฟล์เต็ม
  async function trustedClick(el) {
    if (el.scrollIntoView) {
      el.scrollIntoView({ block: "center", inline: "center" });
      await sleep(350); // ให้ scroll เข้าที่และปุ่มหยุดนิ่ง
    }
    const r = el.getBoundingClientRect();
    const x = Math.round(r.left + r.width / 2);
    const y = Math.round(r.top + r.height / 2);
    const res = await chrome.runtime.sendMessage({ type: "SHOPEE_CLICK_POINT", payload: { x, y } });
    return Boolean(res?.ok && res?.clicked);
  }

  // checkbox อยู่ใน <a> ของการ์ด → คลิกติ๊กจะเปิดแท็บสินค้าด้วย
  // ใช้ preventDefault ไม่ได้ เพราะจะยกเลิกการติ๊ก checkbox ไปพร้อมกัน
  // จึงถอด href/target ของการ์ดชั่วคราว (checkbox ติ๊กได้ + ไม่เด้งแท็บ)
  const strippedAnchors = new Map();
  function stripNewCardAnchors() {
    document.querySelectorAll(".ItemCard__container").forEach((card) => {
      const a = card.closest("a");
      if (a && a.hasAttribute("href") && !strippedAnchors.has(a)) {
        strippedAnchors.set(a, { href: a.getAttribute("href"), target: a.getAttribute("target") });
        a.removeAttribute("href");
        a.removeAttribute("target");
      }
    });
  }
  function restoreCardAnchors() {
    for (const [a, v] of strippedAnchors) {
      if (v.href != null) a.setAttribute("href", v.href);
      if (v.target != null) a.setAttribute("target", v.target);
    }
    strippedAnchors.clear();
  }

  // ดึงข้อมูลสินค้าจากการ์ด ให้ shape เดียวกับ TikTok normalizeProduct
  // เพื่อ reuse pipeline สร้างวิดีโอเดิม (รูป + ชื่อ + ราคา เพียงพอต่อการทำวิดีโอ)
  function scrapeCard(card) {
    if (!card) return null;
    const a = card.closest("a") || card.querySelector("a");
    // href อาจถูก stripNewCardAnchors ถอดไปชั่วคราว → อ่านค่าเดิมจาก map
    const href = a?.getAttribute("href") || (a && strippedAnchors.get(a)?.href) || "";
    const productId = (href.match(/product_offer\/(\d+)/) || [])[1] || "";
    let nameEl = card.querySelector("div.ItemCard__name, span.ItemCard__name, p.ItemCard__name");
    if (!nameEl) nameEl = card.querySelector(".ItemCard__name");
    if (nameEl && (nameEl.tagName === "A" || nameEl.classList.contains("ItemCard__container") || nameEl.classList.contains("ItemCard__nameSection"))) {
      nameEl = nameEl.querySelector("div.ItemCard__name, span.ItemCard__name, p.ItemCard__name, [class*='name']") || nameEl;
    }
    let name = nameEl ? (nameEl.textContent || "").trim() : "";
    if (name.includes("เอา ลิงก์") || name.includes("อัตราค่าคอมมิชชัน") || name.includes("ขายแล้ว") || name.includes("ขายได้") || name.includes("฿")) {
      const possibleTitles = Array.from(card.querySelectorAll("div, span, p")).filter(el => {
        const txt = (el.textContent || "").trim();
        return txt && 
               !txt.includes("เอา ลิงก์") && 
               !txt.includes("อัตราค่าคอมมิชชัน") && 
               !txt.includes("ขายแล้ว") && 
               !txt.includes("ขายได้") &&
               !txt.includes("฿") &&
               !el.querySelector("div, span, p");
      });
      if (possibleTitles.length > 0) {
        possibleTitles.sort((a, b) => b.textContent.length - a.textContent.length);
        name = possibleTitles[0].textContent.trim();
      }
    }
    const img = card.querySelector("img");
    let imageUrl = img?.currentSrc || img?.src || img?.getAttribute("data-src") || "";
    if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
    const price = (card.querySelector(".price")?.textContent || "").replace(/[^\d.]/g, "");
    const symbol = (card.querySelector(".symbol--left")?.textContent || "฿").trim();
    const commRate = ((card.querySelector(".commRate")?.textContent || "").match(/(\d+(?:\.\d+)?)%/) || [])[1] || "";
    
    // ค้นหาข้อความ "ขายแล้ว" หรือ "ขายได้" หรือ "Sold" เพื่อเก็บจำนวนที่เคยขายได้
    const salesEl = [...card.querySelectorAll("span, div, p")].find((el) => {
      const txt = (el.textContent || "").trim();
      return (txt.includes("ขายแล้ว") || txt.includes("ขายได้") || txt.toLowerCase().includes("sold")) &&
             txt.length < 40 &&
             !txt.includes("฿") &&
             !txt.includes("อัตราค่าคอมมิชชัน") &&
             !txt.includes("เอา ลิงก์");
    });
    let salesCount = "";
    if (salesEl) {
      salesCount = salesEl.textContent.replace(/ขายแล้ว|ขายได้|sold|ชิ้น/gi, "").trim();
    }

    if (!productId && !name) return null;
    return {
      productId,
      product_id: productId,
      name,
      originalName: name,
      displayImageUrl: imageUrl,
      flowImageUrl: imageUrl,
      imageUrls: imageUrl ? [imageUrl] : [],
      price,
      currency: symbol === "฿" ? "THB" : symbol,
      productUrl: productId ? `https://affiliate.shopee.co.th/offer/product_offer/${productId}` : "",
      shopName: "",
      category: "",
      details: "",
      commission: "",
      commissionRate: commRate,
      salesCount,
      stockCount: "99",
      source: "shopee"
    };
  }

  function getCardCommission(card) {
    const t = card?.querySelector(".commRate")?.textContent || "";
    return parseFloat((t.match(/(\d+(?:\.\d+)?)%/) || [])[1] || "0") || 0;
  }

  // เรียงลำดับผลลัพธ์ตามหัวข้อ (ความเกี่ยวข้อง, คอมมิชชัน (%), ขายดี, ราคา)
  async function sortTabBy(type) {
    if (!type || type === "ความเกี่ยวข้อง") return true;
    const btn = [...document.querySelectorAll("span, button, div, a")]
      .find((e) => visible(e) && (e.textContent || "").trim() === type && e.querySelectorAll("*").length <= 1);
    if (!btn) return false;
    btn.click();
    await sleep(2500);
    return true;
  }

  function getProductIdsSignature() {
    return findProductCheckboxes().map(box => {
      const card = box.closest(".ItemCard__container");
      const a = card?.closest("a") || card?.querySelector("a");
      const href = a?.getAttribute("href") || (a && strippedAnchors.get(a)?.href) || "";
      return (href.match(/product_offer\/(\d+)/) || [])[1] || card?.querySelector(".ItemCard__name")?.textContent || "";
    }).filter(Boolean).join(",");
  }

  async function waitPageLoadAfterAction(oldSignature, timeoutMs = 8000) {
    const start = Date.now();
    await sleep(500); // Allow immediate spinner to mount or list to clear
    
    const isSpinnerVisible = () => {
      const spinners = [
        ...document.querySelectorAll(".ant-spin-spinning, .ant-spin, .ant-loading, [class*='spin'], [class*='loading'], .ant-skeleton")
      ];
      return spinners.some(el => visible(el) && !el.closest('button, input, textarea'));
    };

    if (isSpinnerVisible()) {
      log("Spinner detected, waiting for it to disappear...");
      const spinnerGone = await waitFor(() => !isSpinnerVisible(), { timeout: timeoutMs, interval: 300 });
      if (spinnerGone) {
        log("Spinner disappeared.");
        await sleep(500);
        return true;
      }
    }

    log("Waiting for signature to change from old signature...");
    while (Date.now() - start < timeoutMs) {
      const currentSignature = getProductIdsSignature();
      if (currentSignature !== oldSignature) {
        log(`Signature changed from "${oldSignature}" to "${currentSignature}". Load complete.`);
        await sleep(500);
        return true;
      }
      await sleep(300);
    }
    
    log("Reached timeout waiting for page load/change.");
    return false;
  }

  async function run(keyword, count, mode = "export", minCommission = 0, minSales = 0, sortBy = "ความเกี่ยวข้อง") {
    log(`run keyword="${keyword}" count=${count} mode=${mode} minComm=${minCommission} minSales=${minSales} sortBy=${sortBy}`);

    // 1) ค้นหา
    const input = await waitFor(findSearchInput, { timeout: 10000 });
    if (!input) return { ok: false, error: "หาช่องค้นหาไม่เจอ — โครงหน้าอาจเปลี่ยน" };
    // รอ list แรกโหลด (หน้า interactive) ก่อนพิมพ์ — กัน search ไม่ทำงานเพราะ SPA ยังไม่พร้อม
    await waitFor(() => findProductCheckboxes().length > 0, { timeout: 12000 });
    await sleep(600);

    const oldSignature = getProductIdsSignature();
    log(`Recorded product signature before search: ${oldSignature}`);

    input.focus();
    nativeSetValue(input, keyword);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    // ปุ่ม "ค้นหา" ของ Shopee เป็น addon (span) ไม่ใช่ <button> — กดเสริมให้ชัวร์
    const searchBtn = [...document.querySelectorAll("button, span, a")]
      .find((e) => visible(e) && (e.textContent || "").trim() === "ค้นหา" && e.querySelectorAll("*").length <= 1);
    if (searchBtn) searchBtn.click();

    // รอผลค้นหาโหลดและหน้าจออัปเดตผลลัพธ์ใหม่
    await waitPageLoadAfterAction(oldSignature, 12000);

    // ทำการเรียงลำดับตามหัวข้อที่เลือก (เช่น ขายดี, คอมมิชชัน (%), ราคา)
    if (sortBy && sortBy !== "ความเกี่ยวข้อง") {
      const sigBeforeSort = getProductIdsSignature();
      const sorted = await sortTabBy(sortBy);
      if (sorted) {
        await waitPageLoadAfterAction(sigBeforeSort, 8000);
      }
    } else if (minCommission > 0) {
      // ถ้าไม่ได้เลือกเรียงอะไร แต่กรองค่าคอมขั้นต่ำ ให้เรียงคอมก่อนโดยปริยายเพื่อประสิทธิภาพ
      const sigBeforeSort = getProductIdsSignature();
      const sorted = await sortTabBy("คอมมิชชัน (%)");
      if (sorted) {
        await waitPageLoadAfterAction(sigBeforeSort, 8000);
      }
    }

    // Shopee ติ๊กได้สูงสุด 100 ชิ้น/หน้า ต่อการ export หนึ่งครั้ง
    const PAGE_CAP = 100;
    const want = Math.min(count, PAGE_CAP);
    const capped = count > PAGE_CAP;

    // 2) ติ๊ก N ชิ้นแรก (scroll โหลดเพิ่มถ้ายังไม่ครบ)
    let ticked = 0;
    let stagnant = 0;
    let lastSeen = 0;
    let belowThreshold = false; // เจอการ์ดคอมต่ำกว่าเกณฑ์
    let boxesSeen = 0;          // diagnostic: เจอ checkbox สูงสุดกี่ตัว
    let clickAttempts = 0;      // diagnostic: พยายามคลิกติ๊กกี่ครั้ง
    const collected = []; // mode "collect": เก็บ object สินค้าจากการ์ดที่ติ๊ก

    while (ticked < want && !belowThreshold) {
      const boxes = findProductCheckboxes();
      boxesSeen = Math.max(boxesSeen, boxes.length);
      if (!boxes.length) {
        const ready = await waitFor(() => findProductCheckboxes().length > 0, { timeout: 6000 });
        if (!ready) break;
        continue;
      }

      stripNewCardAnchors(); // กันแท็บสินค้าเด้งตอนติ๊ก (รวมการ์ดที่เพิ่ง scroll โหลด)
      for (const box of boxes) {
        if (ticked >= want) break;
        const card = box.closest(".ItemCard__container");
        if (minCommission > 0 && getCardCommission(card) < minCommission) {
          if (sortBy === "คอมมิชชัน (%)" || (sortBy === "ความเกี่ยวข้อง" && minCommission > 0)) {
            belowThreshold = true; // เรียงคอม desc แล้ว → ตัวถัดไปต่ำกว่าหมด หยุดได้
            break;
          } else {
            // เรียงอย่างอื่น (เช่น ขายดี) → แค่ข้ามชิ้นนี้เพื่อสแกนชิ้นถัดไป
            continue;
          }
        }
        if (minSales > 0) {
          const salesEl = [...card.querySelectorAll("span, div, p")].find((el) => {
            const txt = (el.textContent || "").trim();
            return txt.includes("ขายแล้ว") || txt.includes("ขายได้") || txt.toLowerCase().includes("sold");
          });
          const salesText = salesEl ? salesEl.textContent.trim() : "";
          const salesNum = parseSalesNumber(salesText);
          if (salesNum < minSales) {
            if (sortBy === "ขายดี") {
              belowThreshold = true; // เรียงขายดี desc แล้ว → ตัวถัดไปต่ำกว่าหมด หยุดได้
              break;
            } else {
              // เรียงอย่างอื่น -> แค่ข้ามชิ้นนี้เพื่อสแกนชิ้นถัดไป
              continue;
            }
          }
        }
        if (!isChecked(box)) {
          clickAttempts++;
          await tickCheckbox(box);
        }
        if (isChecked(box)) {
          ticked++;
          const product = scrapeCard(card); // เก็บข้อมูลทุก mode (ใช้ทำวิดีโอ)
          if (product) collected.push(product);
        }
      }

      if (ticked >= want || belowThreshold) break;

      // ยังไม่ครบ → scroll โหลดสินค้าเพิ่ม (lazy list)
      if (boxes.length === lastSeen) {
        if (++stagnant >= 3) break; // ไม่มีสินค้าเพิ่มแล้ว
      } else {
        stagnant = 0;
      }
      lastSeen = boxes.length;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1400);
    }
    restoreCardAnchors(); // คืน href ให้การ์ดก่อนทำสเต็ปต่อไป

    if (ticked === 0) {
      if (boxesSeen === 0) {
        return { ok: false, error: "ไม่พบการ์ดสินค้า (search ไม่ขึ้นผล/หน้าโหลดช้า) — ลองคำค้นอื่นหรือเช็คล็อกอิน Shopee" };
      }
      return { ok: false, error: `เจอสินค้า ${boxesSeen} ชิ้น แต่ติ๊กไม่ติด (คลิก ${clickAttempts} ครั้ง) — checkbox อาจเปลี่ยนโครง` };
    }

    // โหมด collect: ดึงข้อมูล+รูปเข้าแอปอย่างเดียว ไม่ต้อง export CSV
    if (mode === "collect") {
      return { ok: true, ticked, capped, products: collected };
    }
    // โหมด export/both: ทำต่อไป export CSV — และคืน products ให้ทำวิดีโอด้วย

    // 3) กดปุ่ม bulk "รับลิงก์แบบทีเดียวทั้งหมด"
    const bulkBtn = await waitFor(findBulkButton, { timeout: 6000 });
    if (!bulkBtn) return { ok: false, error: `ติ๊กแล้ว ${ticked} ชิ้น แต่หาปุ่ม "รับลิงก์แบบทีเดียวทั้งหมด" ไม่เจอ` };
    
    // ลองเปิด modal ด้วย synthetic click ก่อน เพราะง่ายและเสถียรที่สุดสำหรับปุ่มที่ไม่ได้ต้องการ download CSV
    bulkBtn.click();
    
    // รอตรวจสอบว่า modal เปิดขึ้นมาจริงหรือไม่
    let confirmBtn = await waitFor(findModalConfirm, { timeout: 3000 });
    if (!confirmBtn) {
      log("ลองคลิก bulkBtn ด้วย trustedClick (Debugger)...");
      const clickedBulk = await trustedClick(bulkBtn);
      if (!clickedBulk) {
        log("trustedClick bulkBtn failed, retrying synthetic click");
        bulkBtn.click();
      }
      confirmBtn = await waitFor(findModalConfirm, { timeout: 6000 });
    }

    // 4) modal → ปุ่ม "เอา ลิงก์": ต้อง TRUSTED CLICK ผ่าน debugger
    //    (synthetic click ได้ไฟล์ CSV เปล่า — Shopee สร้าง/ดาวน์โหลดเฉพาะ trusted event)
    if (!confirmBtn) return { ok: false, error: `เปิด popup แล้วแต่หาปุ่ม "เอา ลิงก์" ไม่เจอ (ติ๊กไว้ ${ticked} ชิ้น)` };
    await sleep(400); // ให้ modal เข้าที่ก่อนวัดพิกัด
    const clicked = await trustedClick(confirmBtn);
    if (!clicked) return { ok: false, error: `กดปุ่ม "เอา ลิงก์" (trusted) ไม่สำเร็จ (ติ๊กไว้ ${ticked} ชิ้น)` };
    await sleep(3000); // รอสร้างลิงก์ + เริ่มดาวน์โหลด CSV

    return { ok: true, ticked, capped, products: collected };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "SHOPEE_PING") { reply({ pong: true }); return false; }
    if (msg?.type === "SHOPEE_RUN") {
      run(
        msg.keyword,
        Math.max(1, parseInt(msg.count, 10) || 1),
        msg.mode === "collect" ? "collect" : "export",
        Math.max(0, Number(msg.minCommission) || 0),
        Math.max(0, parseInt(msg.minSales, 10) || 0),
        msg.sortBy || "ความเกี่ยวข้อง"
      )
        .then(reply)
        .catch((err) => reply({ ok: false, error: err?.message || String(err) }));
      return true; // async
    }
    return false;
  });

  log("content script ready");
})();
