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

  function findExportButton() {
    return (
      byText("button", /export|ส่งออก|ดาวน์โหลด|download/i) ||
      byText('[role="button"], a, div', /export|ส่งออก|ดาวน์โหลด/i) ||
      null
    );
  }

  // checkbox ของ Shopee อาจเป็น <input type=checkbox> หรือ custom component
  function findProductCheckboxes() {
    const native = Array.from(
      document.querySelectorAll('tbody input[type="checkbox"], [class*="row"] input[type="checkbox"], input[type="checkbox"]')
    ).filter(visible);
    if (native.length) return native;
    // custom checkbox: element ที่มี role=checkbox หรือ class shopee
    return Array.from(
      document.querySelectorAll('[role="checkbox"], [class*="checkbox"]')
    ).filter((el) => visible(el) && !el.closest("thead"));
  }

  function isChecked(el) {
    if (el.matches?.('input[type="checkbox"]')) return el.checked;
    return el.getAttribute("aria-checked") === "true" || /checked|active/i.test(el.className);
  }

  function tickCheckbox(el) {
    if (isChecked(el)) return;
    el.click();
  }

  async function run(keyword, count) {
    log(`run keyword="${keyword}" count=${count}`);

    // 1) ค้นหา
    const input = await waitFor(findSearchInput, { timeout: 10000 });
    if (!input) return { ok: false, error: "หาช่องค้นหาไม่เจอ — โครงหน้าอาจเปลี่ยน" };
    input.focus();
    nativeSetValue(input, keyword);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
    const searchBtn = byText("button", /^ค้นหา$|^search$/i);
    if (searchBtn) searchBtn.click();

    await sleep(2500);

    // 2) ติ๊ก N ชิ้นแรก (เลื่อนหน้า/scroll ถ้ายังไม่ครบ)
    let ticked = 0;
    let lastSeen = 0;
    let stagnant = 0;

    while (ticked < count) {
      const boxes = findProductCheckboxes();
      if (!boxes.length) {
        const ready = await waitFor(() => findProductCheckboxes().length > 0, { timeout: 6000 });
        if (!ready) break;
        continue;
      }

      for (const box of boxes) {
        if (ticked >= count) break;
        if (!isChecked(box)) {
          tickCheckbox(box);
          await sleep(120);
        }
        if (isChecked(box)) ticked++;
      }

      if (ticked >= count) break;

      // โหลดเพิ่ม: scroll ลงล่างสุด เผื่อ infinite scroll / เปลี่ยนหน้า
      if (boxes.length === lastSeen) {
        stagnant++;
        const nextBtn = byText('button, a, [role="button"], li', /^›$|^>$|ถัดไป|next/i);
        if (nextBtn && !nextBtn.matches("[disabled]")) {
          nextBtn.click();
          await sleep(2000);
        } else if (stagnant >= 2) {
          break; // ไม่มีสินค้าเพิ่มแล้ว
        }
      } else {
        stagnant = 0;
      }
      lastSeen = boxes.length;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1200);
    }

    if (ticked === 0) return { ok: false, error: "ไม่พบสินค้าให้ติ๊ก (ลองคำค้นอื่น หรือเช็คการล็อกอิน)" };

    // 3) กด Export ของเว็บ + ยืนยัน modal (ถ้ามี)
    const exportBtn = await waitFor(findExportButton, { timeout: 6000 });
    if (!exportBtn) return { ok: false, error: `ติ๊กแล้ว ${ticked} ชิ้น แต่หาปุ่ม Export ไม่เจอ` };
    exportBtn.click();
    await sleep(1200);

    const confirmBtn = byText('button, [role="button"]', /ยืนยัน|confirm|ตกลง|ดาวน์โหลด|export/i);
    if (confirmBtn && confirmBtn !== exportBtn) {
      confirmBtn.click();
      await sleep(800);
    }

    return { ok: true, ticked };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "SHOPEE_PING") { reply({ pong: true }); return false; }
    if (msg?.type === "SHOPEE_RUN") {
      run(msg.keyword, Math.max(1, parseInt(msg.count, 10) || 1))
        .then(reply)
        .catch((err) => reply({ ok: false, error: err?.message || String(err) }));
      return true; // async
    }
    return false;
  });

  log("content script ready");
})();
