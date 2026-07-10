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
  getDefaultProductInfo,
  truncateShopeeCaptionAndHashtags
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
  productId: "123456789",
  price: 2990, currency: "THB",
  rawProduct: { product_id: "123456789" }
};
const capA = buildCaption(prodA, { captionTemplate: "{product_name}" });
check("caption contains product name", capA.includes("Arzopa"), `cap=${capA}`);

// --- hashtags: split product title into word-level tags ---
const nameTags = buildProductNameHashtags({ name: "Arzopa A1, จอภาพแบบพกพา, monitor" });
check("name hashtags split on comma", nameTags.length >= 2, `tags=${JSON.stringify(nameTags)}`);
check("name hashtags are #-prefixed", nameTags.every(t => t.startsWith("#")), `tags=${JSON.stringify(nameTags)}`);
eq(
  "product title words become separate hashtags",
  buildProductNameHashtags({ name: "POSE รองเท้านวด" }),
  ["#POSE", "#รองเท้านวด"]
);
eq(
  "duplicate product title words are removed",
  buildProductNameHashtags({ name: "POSE pose รองเท้านวด" }),
  ["#POSE", "#รองเท้านวด"]
);

const postTags = buildPostHashtags(prodA, { hashtags: ["#tiktokshop", "#ของดีบอกต่อ"] });
check("post hashtags <= 5", normalizeHashtags(postTags).length <= 5, `tags=${JSON.stringify(postTags)}`);
check("post hashtags include base tag", postTags.some(t => /tiktokshop/i.test(t)), `tags=${JSON.stringify(postTags)}`);
const posePostTags = buildPostHashtags(
  { name: "POSE รองเท้านวด Relax Air EVA" },
  { hashtags: ["#TikTokShop", "#ของดีบอกต่อ"] }
);
check("post hashtags include POSE title word", posePostTags.includes("#POSE"), `tags=${JSON.stringify(posePostTags)}`);
check("post hashtags include Thai product word", posePostTags.includes("#รองเท้านวด"), `tags=${JSON.stringify(posePostTags)}`);

// --- product url resolution ---
const url = resolveProductUrl(prodA);
check("product url resolvable", typeof url === "string" && url.length > 0, `url=${url}`);

// --- caption name resolution prefers the edited name/Hook field ---
const rn = resolveCaptionProductName({ originalName: "ชื่อจริง", name: "ชื่อสั้น" });
eq("resolveCaptionProductName prefers edited name", rn, "ชื่อสั้น");
const rnFallback = resolveCaptionProductName({ originalName: "ชื่อจริง" });
eq("resolveCaptionProductName falls back to originalName", rnFallback, "ชื่อจริง");

// --- video prompt: product fidelity + sharp/match-hero directives present ---
const vid = buildVideoPrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("video prompt locks only the product object", /preserve its exact shape/i.test(vid));
check("video prompt mentions sharp/clear product", /razor-sharp|clearly visible/i.test(vid), "missing sharpness directive");
check("video prompt is 9:16 vertical", /9:16|vertical/i.test(vid));
check("default video forbids added scene text", /do not add any extra readable text/i.test(vid), vid);
check("default video preserves the product's own printed text", /Keep the product's own printed text/i.test(vid), vid);
check("video prompt starts with Thai advertisement prefix", /^สร้างวิดีโอโฆษณารีวิวสินค้า/i.test(vid), vid);

// --- image prompt: fidelity + sharp focus ---
const img = buildImagePrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("image prompt mentions fidelity", /preserve its exact shape/i.test(img));
check("image prompt sharp focus", /sharp and clearly visible|sharp focus/i.test(img));
check("reference image keeps product text but forbids added text", /Keep the product's own printed text[\s\S]*do not add any extra readable text/i.test(img), img);

const staleTextSettings = {
  ...settings,
  textEnabled: "false",
  clipText: "รองเท้าทดสอบ",
  promotionText: "ลด 50%",
  cta: "กดซื้อเลย"
};
const staleTextVideo = buildVideoPrompt({ name: "รองเท้าทดสอบ" }, staleTextSettings);
check("disabled text ignores stale promotion and CTA", !/ลด 50%|กดซื้อเลย/.test(staleTextVideo), staleTextVideo);

const enabledTextVideo = buildVideoPrompt(
  { name: "รองเท้าทดสอบ" },
  { ...settings, textEnabled: "true", clipText: "รองเท้าทดสอบ", promotionText: "ส่งฟรี", textPosition: "Top third" }
);
check("enabled text uses only configured overlays", /รองเท้าทดสอบ \| ส่งฟรี/.test(enabledTextVideo), enabledTextVideo);
check("enabled text respects configured position", /at Top third/i.test(enabledTextVideo), enabledTextVideo);
check("enabled text does not inject default CTA", !/กดสั่งซื้อ|กดซื้อเลย/.test(enabledTextVideo), enabledTextVideo);

// --- structural fidelity: source image overrides ambiguous title variants ---
const cabinet = {
  name: "ตู้ลิ้นชัก 5/4/3 ชั้น ตู้ไม้ 5 ชั้น",
  highlights: "",
  structureAdvice: "The reference visibly has exactly 3 drawers with one handle per drawer.",
  promptAdvice: "Create a cabinet matching the listing ตู้ลิ้นชัก 5/4/3 ชั้น ตู้ไม้ 5 ชั้น."
};
const cabinetImage = buildImagePrompt(cabinet, settings);
const cabinetVideo = buildVideoPrompt(cabinet, settings);
check("image prompt strips ambiguous structural counts from title", !/5\/4\/3\s*ชั้น|5\s*ชั้น/i.test(cabinetImage), cabinetImage);
check("image prompt requires exact repeated-part counts", /3 drawers|exact visible count/i.test(cabinetImage));
check("image prompt says reference overrides title", /Keep the original text layout from the reference image|reference image/i.test(cabinetImage));
check("video prompt carries analyzed structure", /exactly 3 drawers/i.test(cabinetVideo));
check("video prompt forbids adding or removing parts", /never add, remove/i.test(cabinetVideo));
check("image prompt isolates only the named product", /single product|one product only/i.test(cabinetImage));
check("image prompt rejects source-scene objects", /ignore the original background and every unrelated object/i.test(cabinetImage));
check("image prompt creates a new suitable background", /background that fits this product category/i.test(cabinetImage));
check("video prompt is multi-scene", /multi-scene|distinct scenes/i.test(cabinetVideo) && /Scene 1/i.test(cabinetVideo));
check("cabinet video uses a suitable interior", /Modern Living Room/i.test(cabinetVideo) && !/Urban Street/i.test(cabinetVideo));
check("image prompt stays concise", cabinetImage.length < 5000, `length=${cabinetImage.length}`);
check("video prompt stays concise", cabinetVideo.length < 8000, `length=${cabinetVideo.length}`);

// --- footwear fidelity: preserve the exact model while Auto includes a reviewer ---
const shoe = {
  name: "รองเท้าผ้าใบผู้หญิง สีขาว",
  highlights: "",
  autoOptions: { presenter: "none", cameraMovement: "Handheld Shake", location: "Urban Street" }
};
const shoeImage = buildImagePrompt(shoe, settings);
const shoeVideo = buildVideoPrompt(shoe, settings);
check("shoe prompt locks shoe-specific geometry", /toe shape[\s\S]*sole thickness[\s\S]*lace pattern/i.test(shoeImage));
check("shoe prompt preserves single or pair count", /single-shoe\/pair count/i.test(shoeImage));
check("shoe video Auto includes a reviewer", /Presenter: (?:A young Thai woman reviewer|A young Thai man reviewer)/i.test(shoeVideo));
check("shoe video Auto overrides no-person recommendation", !/No people, faces, presenters/i.test(shoeVideo));
check("shoe video overrides unstable saved camera", /Subtle Slow Zoom In/i.test(shoeVideo) && !/Handheld Shake/i.test(shoeVideo));
check("shoe prompts remain concise", shoeImage.length < 5000 && shoeVideo.length < 8000, `image=${shoeImage.length} video=${shoeVideo.length}`);

// --- default behavior: UGC style + stable Auto reviewer ---
const generalReviewA = buildVideoPrompt({ name: "เครื่องชงกาแฟรุ่น A", productId: "10000001" }, settings);
const generalReviewB = buildVideoPrompt({ name: "เครื่องชงกาแฟรุ่น A", productId: "10000001" }, settings);
check("default style is UGC testimonial", settings.videoStyle === "testimonial");
check("default video uses UGC testimonial", /UGC testimonial/i.test(generalReviewA));
check("Auto reviewer is stable per product", generalReviewA === generalReviewB);
check("Auto reviewer is male or female", /Presenter: (?:A young Thai woman reviewer|A young Thai man reviewer)/i.test(generalReviewA));
check(
  "women product selects Thai woman reviewer",
  /Presenter: A young Thai woman reviewer/i.test(buildVideoPrompt({ name: "รองเท้าวิ่งผู้หญิง", productId: "women-shoe" }, settings))
);
check(
  "tools product selects Thai man reviewer",
  /Presenter: A young Thai man reviewer/i.test(buildVideoPrompt({ name: "สว่านไฟฟ้าสำหรับช่าง", productId: "power-drill" }, settings))
);
check(
  "AI real-reviewer recommendation is respected",
  /Presenter: A young Thai man reviewer/i.test(buildVideoPrompt({
    name: "น้ำหอมรุ่นใหม่",
    productId: "recommended-man",
    autoOptions: { presenter: "man" }
  }, settings))
);

// Explicit presenter choice must override Auto.
const explicitNone = buildVideoPrompt(
  { name: "เครื่องชงกาแฟรุ่น A", productId: "10000001" },
  { ...settings, presenter: "none" }
);
check("explicit presenter choice wins", !/Presenter:/i.test(explicitNone));
check("explicit no-presenter forbids people", /No people, faces, presenters/i.test(explicitNone));

const customPresenterPrompt = buildVideoPrompt(
  { name: "เครื่องปั่นน้ำผลไม้", productId: "10000002" },
  { ...settings, presenter: "กรอกเอง", customPresenter: "a chef wearing a white hat" }
);
check("custom presenter option injects custom presenter text", /Presenter: a chef wearing a white hat/i.test(customPresenterPrompt), customPresenterPrompt);

// --- auto presenter/location inference by category (beauty -> reviewer) ---
const vidBeauty = buildVideoPrompt({ name: "เซรั่มหน้าใส วิตามินซี", highlights: "" }, settings);
check("beauty auto-selects a presenter line", /Presenter:/i.test(vidBeauty));

// --- formatPrice ---
const fp = formatPrice({ price: 2990, currency: "THB" });
check("formatPrice non-empty", typeof fp === "string" && fp.length > 0, `fp=${fp}`);

// --- normalizeHashtags dedup + cap ---
eq("normalizeHashtags dedup+cap", normalizeHashtags(["#a", "#a", "#b", "#c", "#d", "#e", "#f"], 3), ["#a", "#b", "#c"]);

// --- omni-flash: multi-scene description ---
const omniSettings = { ...settings, videoModel: "omni-flash", videoStyle: "sales" };
const omniVid = buildVideoPrompt({ name: "เครื่องปั่นน้ำผลไม้", highlights: "" }, omniSettings);
check("omni-flash video prompt requests multi-scene", /multi-scene|distinct scenes/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 1", /Scene 1/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 2", /Scene 2/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 3", /Scene 3/i.test(omniVid), omniVid);
// --- empty caption template returns empty string ---
const capEmpty = buildCaption(prodA, { captionTemplate: "" });
eq("empty caption template returns empty string", capEmpty, "");

// --- Shopee caption & hashtags 150-char limit tests ---
const shortTrunc = truncateShopeeCaptionAndHashtags("สเปรย์หอมปรับอากาศ", ["#สเปรย์หอม", "#ปรับอากาศ"]);
eq("shopee short caption & hashtags keep all tags", shortTrunc, {
  caption: "สเปรย์หอมปรับอากาศ",
  hashtags: "#สเปรย์หอม #ปรับอากาศ"
});

const longCaption = "สเปรย์หอมปรับอากาศ ".repeat(7).trim(); // 132 chars
const tagsToDrop = ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6"];
const resDropped = truncateShopeeCaptionAndHashtags(longCaption, tagsToDrop);
check("shopee drops hashtags to fit 150", `${resDropped.caption} ${resDropped.hashtags}`.trim().length <= 150, `len=${`${resDropped.caption} ${resDropped.hashtags}`.trim().length}`);
check("shopee drops hashtags but keeps some", resDropped.hashtags.includes("#tag1") && !resDropped.hashtags.includes("#tag6"), `tags=${resDropped.hashtags}`);

const veryLongCaption = "สเปรย์หอมปรับอากาศ ".repeat(10).trim(); // 189 chars
const resTrunc = truncateShopeeCaptionAndHashtags(veryLongCaption, ["#tag1"]);
check("shopee truncates caption if single tag still exceeds 150", `${resTrunc.caption} ${resTrunc.hashtags}`.trim().length <= 150, `len=${`${resTrunc.caption} ${resTrunc.hashtags}`.trim().length}`);
check("shopee truncated caption ends with ellipsis", resTrunc.caption.endsWith("..."));

// --- heavy/large product weight/keyword tests ---
const heavyRice = { name: "ข้าวสารหอมมะลิกระสอบ 10 กิโล" };
const heavyRiceImage = buildImagePrompt(heavyRice, settings);
const heavyRiceVideo = buildVideoPrompt(heavyRice, settings);
check("heavy product weight 10kg detected for image", /Real scale./i.test(heavyRiceImage), heavyRiceImage);
check("heavy product weight 10kg detected for video", /Real scale./i.test(heavyRiceVideo), heavyRiceVideo);
check("heavy product weight 10kg uses realistic medium scale instructions", /realistic medium scale relative to the presenter, never as a tiny packet or a giant sack/i.test(heavyRiceVideo), heavyRiceVideo);

const heavyCement = { name: "ปูนซีเมนต์ 50kg" };
const heavyCementVideo = buildVideoPrompt(heavyCement, settings);
check("immobile heavy product weight 50kg prevents presenter holding product in air", /resting stably on a flat surface or floor; do not attempt to lift, carry, or hold it/i.test(heavyCementVideo), heavyCementVideo);

const heavyFertilizer = { name: "ปุ๋ยเคมี 15กก." };
const heavyFertilizerImage = buildImagePrompt(heavyFertilizer, settings);
check("heavy product weight 15kg (Thai abbreviation กก.) detected", /Real scale./i.test(heavyFertilizerImage), heavyFertilizerImage);

const lightSoap = { name: "สบู่ก้อน 100 กรัม" };
const lightSoapImage = buildImagePrompt(lightSoap, settings);
check("light product soap 100g not detected as heavy", !/Real scale./i.test(lightSoapImage), lightSoapImage);

// --- image prompt presenter tests ---
const imgPresenterWoman = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "woman" });
check("image prompt with woman presenter includes female reviewer", /young Thai woman reviewer/i.test(imgPresenterWoman), imgPresenterWoman);
check("image prompt with woman presenter changes intro layout text", /with a presenter shown in the frame/i.test(imgPresenterWoman), imgPresenterWoman);

const imgPresenterNone = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "none" });
check("image prompt with no presenter forbids people", /No people, faces/i.test(imgPresenterNone), imgPresenterNone);
check("image prompt with no presenter maintains grid layout text", /collage grid/i.test(imgPresenterNone), imgPresenterNone);

const imgPresenterCustom = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "กรอกเอง", customPresenter: "ชายสูงวัยใจดีสวมแว่นตา" });
check("image prompt with custom presenter injects custom presenter text", /ชายสูงวัยใจดีสวมแว่นตา/i.test(imgPresenterCustom), imgPresenterCustom);

const imgPresenterHands = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only" });
check("image prompt with hands_only presenter shows hands", /Show realistic human hands holding the product/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only presenter uses hands intro", /with realistic human hands holding the product/i.test(imgPresenterHands), imgPresenterHands);

const imgTextEnabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "เย็นสบาย", promotionText: "ลด 50%" });
check("image prompt with text enabled includes configured overlays", /Integrate these exact Thai-language text overlays/i.test(imgTextEnabled) && /เย็นสบาย/i.test(imgTextEnabled) && /ลด 50%/i.test(imgTextEnabled), imgTextEnabled);

const imgTextEnabledName = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "", promotionText: "ลด 50%" });
check("image prompt with text enabled using name translates to portable fan", /Integrate these exact Thai-language text overlays/i.test(imgTextEnabledName) && /portable fan/i.test(imgTextEnabledName) && /ลด 50%/i.test(imgTextEnabledName), imgTextEnabledName);

const imgTextDisabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: false });
check("image prompt with text disabled uses TEXT_FREE_DIRECTION", /No added text, words, or characters/i.test(imgTextDisabled), imgTextDisabled);

console.log(results.join("\n"));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
