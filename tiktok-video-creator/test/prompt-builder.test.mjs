// Unit tests for modules/prompt-builder.js — run: node test/prompt-builder.test.mjs
import {
  buildCaption,
  buildPostHashtags,
  buildProductNameHashtags,
  normalizeHashtags,
  resolveProductUrl,
  resolveCaptionProductName,
  buildVideoPrompt,
  buildImagePrompt,
  formatPrice,
  getDefaultSettings,
  getDefaultProductInfo
} from "../modules/prompt-builder.js";

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; results.push(`✅ ${name}`); }
  else { fail++; results.push(`❌ ${name}${detail ? " — " + detail : ""}`); }
}
function eq(name, got, want) {
  check(name, JSON.stringify(got) === JSON.stringify(want), `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`);
}

const settings = getDefaultSettings();

// --- caption: product name first, then hashtags ---
const prodA = {
  name: "Arzopa A1 จอภาพแบบพกพา",
  originalName: "Arzopa A1, จอภาพแบบพกพา,",
  productId: "123456",
  price: 2990, currency: "THB",
  rawProduct: { product_id: "123456" }
};
const capA = buildCaption(prodA, { captionTemplate: "{product_name}" });
check("caption starts with product name", capA.trim().startsWith("Arzopa"), `cap=${capA}`);

// --- hashtags: split comma-separated name into multiple tags ---
const nameTags = buildProductNameHashtags({ name: "Arzopa A1, จอภาพแบบพกพา, monitor" });
check("name hashtags split on comma", nameTags.length >= 2, `tags=${JSON.stringify(nameTags)}`);
check("name hashtags are #-prefixed", nameTags.every(t => t.startsWith("#")), `tags=${JSON.stringify(nameTags)}`);

const postTags = buildPostHashtags(prodA, { hashtags: ["#tiktokshop", "#ของดีบอกต่อ"] });
check("post hashtags <= 5", normalizeHashtags(postTags).length <= 5, `tags=${JSON.stringify(postTags)}`);
check("post hashtags include base tag", postTags.some(t => /tiktokshop/i.test(t)), `tags=${JSON.stringify(postTags)}`);

// --- product url resolution ---
const url = resolveProductUrl(prodA);
check("product url resolvable", typeof url === "string" && url.length > 0, `url=${url}`);

// --- caption name resolution prefers originalName ---
const rn = resolveCaptionProductName({ originalName: "ชื่อจริง", name: "ชื่อสั้น" });
eq("resolveCaptionProductName prefers originalName", rn, "ชื่อจริง");

// --- video prompt: product fidelity + sharp/match-hero directives present ---
const vid = buildVideoPrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("video prompt mentions fidelity (copy product)", /copy the attached product image/i.test(vid));
check("video prompt mentions sharp/clear product", /razor-sharp|clearly visible/i.test(vid), "missing sharpness directive");
check("video prompt is 9:16 vertical", /9:16|vertical/i.test(vid));

// --- image prompt: fidelity + sharp focus ---
const img = buildImagePrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("image prompt mentions fidelity", /copy the attached product image|source of truth/i.test(img));
check("image prompt sharp focus", /sharp focus/i.test(img));

// --- auto presenter/location inference by category (beauty -> woman) ---
const vidBeauty = buildVideoPrompt({ name: "เซรั่มหน้าใส วิตามินซี", highlights: "" }, settings);
check("beauty auto-selects a presenter line", /Presenter:/i.test(vidBeauty));

// --- formatPrice ---
const fp = formatPrice({ price: 2990, currency: "THB" });
check("formatPrice non-empty", typeof fp === "string" && fp.length > 0, `fp=${fp}`);

// --- normalizeHashtags dedup + cap ---
eq("normalizeHashtags dedup+cap", normalizeHashtags(["#a", "#a", "#b", "#c", "#d", "#e", "#f"], 3), ["#a", "#b", "#c"]);

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
