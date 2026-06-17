// Shopee Affiliate automation — ค้นหา → ติ๊ก N ชิ้นแรก → กด Export ของเว็บ
// เว็บเป็นตัวสร้างไฟล์ CSV เอง (รูปแบบ: รหัสสินค้า,ชื่อสินค้า,ราคา,ขาย,ชื่อร้านค้า,
// อัตราค่าคอมมิชชัน,คอมมิชชัน,ลิงก์สินค้า,ลิงก์ข้อเสนอ)
// NOTE: selector ของ Shopee เป็น dynamic class — ใช้ตัวที่เสถียร (placeholder, ข้อความปุ่ม,
// role, โครงสร้าง) + fallback หลายชั้น. ต้อง verify กับหน้าจริงตอนทดสอบ.

(() => {
  if (window.__shopeeAffiliateBound) return;
  window.__shopeeAffiliateBound = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  // ปุ่ม bulk ใน batch-bar: "รับลิงก์แบบทีเดียวทั้งหมด"
  function findBulkButton() {
    return (
      byText(".batch-bar button.ant-btn-primary, .batch-bar button", /รับลิงก์แบบ|ส่งออก|export/i) ||
      byText("button.ant-btn-primary, button", /รับลิงก์แบบ|ส่งออก|export/i) ||
      null
    );
  }

  // ปุ่มยืนยันใน modal: "เอา ลิงก์" (สร้างลิงก์ + ดาวน์โหลด CSV)
  function findModalConfirm() {
    return byText(
      ".ant-modal button, .ant-drawer button, [role='dialog'] button",
      /^เอา\s?ลิงก์$|ยืนยัน|ดาวน์โหลด|confirm|export/i
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
    const name = (card.querySelector(".ItemCard__name")?.textContent || "").trim();
    const img = card.querySelector("img");
    let imageUrl = img?.currentSrc || img?.src || img?.getAttribute("data-src") || "";
    if (imageUrl.startsWith("//")) imageUrl = "https:" + imageUrl;
    const price = (card.querySelector(".price")?.textContent || "").replace(/[^\d.]/g, "");
    const symbol = (card.querySelector(".symbol--left")?.textContent || "฿").trim();
    const commRate = ((card.querySelector(".commRate")?.textContent || "").match(/(\d+(?:\.\d+)?)%/) || [])[1] || "";
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
      source: "shopee"
    };
  }

  function getCardCommission(card) {
    const t = card?.querySelector(".commRate")?.textContent || "";
    return parseFloat((t.match(/(\d+(?:\.\d+)?)%/) || [])[1] || "0") || 0;
  }

  // เรียงผลลัพธ์ตามค่าคอมจากมากไปน้อย (ปุ่ม "คอมมิชชัน (%)")
  async function sortByCommissionDesc() {
    const btn = [...document.querySelectorAll("span, button, div, a")]
      .find((e) => visible(e) && (e.textContent || "").trim() === "คอมมิชชัน (%)" && e.querySelectorAll("*").length <= 1);
    if (!btn) return false;
    btn.click();
    await sleep(2500);
    return true;
  }

  async function run(keyword, count, mode = "export", minCommission = 0) {
    log(`run keyword="${keyword}" count=${count} mode=${mode} minComm=${minCommission}`);

    // 1) ค้นหา
    const input = await waitFor(findSearchInput, { timeout: 10000 });
    if (!input) return { ok: false, error: "หาช่องค้นหาไม่เจอ — โครงหน้าอาจเปลี่ยน" };
    // รอ list แรกโหลด (หน้า interactive) ก่อนพิมพ์ — กัน search ไม่ทำงานเพราะ SPA ยังไม่พร้อม
    await waitFor(() => findProductCheckboxes().length > 0, { timeout: 12000 });
    await sleep(600);
    input.focus();
    nativeSetValue(input, keyword);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    // ปุ่ม "ค้นหา" ของ Shopee เป็น addon (span) ไม่ใช่ <button> — กดเสริมให้ชัวร์
    const searchBtn = [...document.querySelectorAll("button, span, a")]
      .find((e) => visible(e) && (e.textContent || "").trim() === "ค้นหา" && e.querySelectorAll("*").length <= 1);
    if (searchBtn) searchBtn.click();

    // รอผลค้นหาโหลด (รอการ์ดสินค้าโผล่)
    await waitFor(() => findProductCheckboxes().length > 0, { timeout: 8000 });
    await sleep(800);

    // กรองค่าคอม: เรียง desc ก่อน (คอมสูงขึ้นบน) แล้วค่อยติ๊ก/หยุดเมื่อต่ำกว่าเกณฑ์
    if (minCommission > 0) {
      await sortByCommissionDesc();
      await waitFor(() => findProductCheckboxes().length > 0, { timeout: 8000 });
      await sleep(600);
    }

    // Shopee ติ๊กได้สูงสุด 100 ชิ้น/หน้า ต่อการ export หนึ่งครั้ง
    const PAGE_CAP = 100;
    const want = Math.min(count, PAGE_CAP);
    const capped = count > PAGE_CAP;

    // 2) ติ๊ก N ชิ้นแรก (scroll โหลดเพิ่มถ้ายังไม่ครบ)
    let ticked = 0;
    let stagnant = 0;
    let lastSeen = 0;
    let belowThreshold = false; // เจอการ์ดคอมต่ำกว่าเกณฑ์ (เรียง desc → ที่เหลือต่ำหมด)
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
          belowThreshold = true; // เรียงคอม desc แล้ว → ตัวถัดไปต่ำกว่าหมด หยุดได้
          break;
        }
        if (!isChecked(box)) {
          clickAttempts++;
          await tickCheckbox(box);
        }
        if (isChecked(box)) {
          ticked++;
          if (mode === "collect") {
            const product = scrapeCard(card);
            if (product) collected.push(product);
          }
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

    // โหมด collect: ดึงข้อมูล+รูปเข้าแอป ไม่ต้อง export CSV
    if (mode === "collect") {
      return { ok: true, ticked, capped, products: collected };
    }

    // 3) กดปุ่ม bulk "รับลิงก์แบบทีเดียวทั้งหมด" (synthetic พอ — แค่เปิด modal)
    const bulkBtn = await waitFor(findBulkButton, { timeout: 6000 });
    if (!bulkBtn) return { ok: false, error: `ติ๊กแล้ว ${ticked} ชิ้น แต่หาปุ่ม "รับลิงก์แบบทีเดียวทั้งหมด" ไม่เจอ` };
    bulkBtn.click();

    // 4) modal → ปุ่ม "เอา ลิงก์": ต้อง TRUSTED CLICK ผ่าน debugger
    //    (synthetic click ได้ไฟล์ CSV เปล่า — Shopee สร้าง/ดาวน์โหลดเฉพาะ trusted event)
    const confirmBtn = await waitFor(findModalConfirm, { timeout: 8000 });
    if (!confirmBtn) return { ok: false, error: `เปิด popup แล้วแต่หาปุ่ม "เอา ลิงก์" ไม่เจอ (ติ๊กไว้ ${ticked} ชิ้น)` };
    await sleep(400); // ให้ modal เข้าที่ก่อนวัดพิกัด
    const clicked = await trustedClick(confirmBtn);
    if (!clicked) return { ok: false, error: `กดปุ่ม "เอา ลิงก์" (trusted) ไม่สำเร็จ (ติ๊กไว้ ${ticked} ชิ้น)` };
    await sleep(3000); // รอสร้างลิงก์ + เริ่มดาวน์โหลด CSV

    return { ok: true, ticked, capped };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "SHOPEE_PING") { reply({ pong: true }); return false; }
    if (msg?.type === "SHOPEE_RUN") {
      run(
        msg.keyword,
        Math.max(1, parseInt(msg.count, 10) || 1),
        msg.mode === "collect" ? "collect" : "export",
        Math.max(0, Number(msg.minCommission) || 0)
      )
        .then(reply)
        .catch((err) => reply({ ok: false, error: err?.message || String(err) }));
      return true; // async
    }
    return false;
  });

  log("content script ready");
})();
