import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCategoryFidelityDirection, buildVideoPrompt, getDefaultSettings, PRODUCT_TYPES } from "../modules/prompt-builder.js";

const lock = (name, productType) => buildCategoryFidelityDirection({ name, productType });

test("new product types are detected from the title", () => {
  assert.match(lock("หม้อทอดไร้น้ำมัน 5L"), /^KITCHEN APPLIANCE FIDELITY LOCK/);
  assert.match(lock("เครื่องชงกาแฟ"), /^KITCHEN APPLIANCE FIDELITY LOCK/);
  assert.match(lock("ตุ๊กตาหมี"), /^TOY FIDELITY LOCK/);
  assert.match(lock("ปลอกคอแมว"), /^PET ACCESSORY FIDELITY LOCK/);
  assert.match(lock("ที่วางมือถือในรถ"), /^CAR ACCESSORY FIDELITY LOCK/);
  assert.match(lock("สว่านไร้สาย"), /^TOOL & HARDWARE FIDELITY LOCK/);
  assert.match(lock("กล่องเก็บของ"), /^STORAGE & ORGANIZER FIDELITY LOCK/);
});

test("existing detections keep their branches", () => {
  assert.match(lock("อาหารแมว"), /^For food, beverages/);
  assert.match(lock("เสื้อยืด"), /^STRICT CLOTHING/);
  assert.match(lock("กาแฟดริป"), /^STRICT COFFEE\/TEA POUCH/);
});

test("a selected product type overrides title detection", () => {
  assert.match(lock("เสื้อยืด", "toy"), /^TOY FIDELITY LOCK/);
  assert.match(lock("สร้อยคอ", "jewelry"), /^For jewelry/);
  assert.match(lock("ตุ๊กตาหมี", "general"), /^UNIVERSAL PRODUCT & PACKAGING/);
  assert.match(lock("ตุ๊กตาหมี", "auto"), /^TOY FIDELITY LOCK/);
  assert.match(lock("ตุ๊กตาหมี", "unknown-type"), /^TOY FIDELITY LOCK/);
});

test("selected type reaches the video prompt and every type id is unique", () => {
  assert.match(buildVideoPrompt({ name: "สินค้า", productType: "car" }, getDefaultSettings()), /CAR ACCESSORY FIDELITY LOCK/);
  assert.equal(new Set(PRODUCT_TYPES.map(type => type.id)).size, PRODUCT_TYPES.length);
});
