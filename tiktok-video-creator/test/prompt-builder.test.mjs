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
  truncateShopeeCaptionAndHashtags,
  isClothingProduct,
  isFurnitureProduct,
  buildCategoryFidelityDirection,
  stripForeignNonThaiScripts
} from "../modules/prompt-builder.js";

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = "") {
  if (cond) { pass++; results.push(`✅ ${name}`); }
  else { fail++; results.push(`❌ ${name}`); }
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
const phoneCaseTags = buildPostHashtags(
  { name: "เคสโทรศัพท์ iPhone 16" },
  { hashtags: ["#TikTokShop", "#เคสมือถือ"] }
);
check("phone case hashtags append Burmese phone-case tags", phoneCaseTags.includes("#iPhoneကာဗာ") && phoneCaseTags.includes("#ဖုန်းကာဗာ"), `tags=${JSON.stringify(phoneCaseTags)}`);
check("phone case hashtags stay within five tags", phoneCaseTags.length <= 5, `tags=${JSON.stringify(phoneCaseTags)}`);
const iPhoneCaseTags = buildPostHashtags({ name: "เคส iPhone 16 ใส" }, { hashtags: ["#TikTokShop"] });
check("iPhone case hashtags use Burmese iPhone and clear-case terms", iPhoneCaseTags.includes("#iPhoneကာဗာ") && iPhoneCaseTags.includes("#ဖုန်းကာဗာအကြည်"), `tags=${JSON.stringify(iPhoneCaseTags)}`);
const nonCaseTags = buildPostHashtags({ name: "แก้วเก็บความเย็น" }, { hashtags: ["#TikTokShop"] });
check("non-phone-case hashtags do not append Burmese phone-case tag", !nonCaseTags.includes("#ဖုန်းကာဗာ"), `tags=${JSON.stringify(nonCaseTags)}`);
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
check("default video forbids added scene text", /do not add any new, extra, or unnecessary text/i.test(vid), vid);
check("default video preserves the product's own printed text", /Keep the product's own printed text/i.test(vid), vid);
check("video prompt starts with Thai advertisement prefix", /^สร้างวิดีโอโฆษณารีวิวสินค้า/i.test(vid), vid);

// --- image prompt: fidelity + sharp focus ---
const img = buildImagePrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("image prompt mentions fidelity", /preserve its exact shape/i.test(img));
check("image prompt sharp focus", /sharp and clearly visible|sharp focus/i.test(img));
check("reference image keeps product text but forbids added text", /Keep the product's own printed text[\s\S]*do not add any new, extra, or unnecessary text/i.test(img), img);

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
check("enabled text uses only configured overlays", /รองเท้าทดสอบ/.test(enabledTextVideo) && !/ส่งฟรี/.test(enabledTextVideo), enabledTextVideo);
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
check("image prompt isolates only the named product", /ISOLATE AND EXTRACT ONLY THE PRODUCT|single product|one product/i.test(cabinetImage));
check("image prompt rejects source-scene objects", /100% NEW SCENE & BACKGROUND|ignore the original background|ignoring its original background/i.test(cabinetImage));
check("image prompt creates a new suitable background", /brand new|background that fits this product category/i.test(cabinetImage));
check("video prompt is multi-scene", /multi-scene|distinct scenes/i.test(cabinetVideo) && /Scene 1/i.test(cabinetVideo));
check("cabinet video uses a suitable interior", /Modern Living Room/i.test(cabinetVideo) && !/Urban Street/i.test(cabinetVideo));
check("image prompt stays concise", cabinetImage.length < 12000, `length=${cabinetImage.length}`);
check("video prompt stays concise", cabinetVideo.length < 18000, `length=${cabinetVideo.length}`);

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
check("shoe prompt locks realistic human-foot scale", /STRICT FOOTWEAR SCALE & PLACEMENT LOCK/i.test(shoeImage) && /true foot-sized proportions/i.test(shoeImage));
check("shoe prompt uses an outdoor footwear location", /outdoor home driveway|front yard|quiet neighborhood street|park path/i.test(shoeImage + shoeVideo));
check("shoe prompt rejects oversized placement", /do not enlarge the shoe to furniture-scale/i.test(shoeImage));
check("shoe prompt rejects indoor locations", /never inside a house|bedroom|entryway|closet|shoe shelf|showroom|cafe|studio/i.test(shoeImage));
check("shoe still image has highest-priority outdoor background lock", /HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE/i.test(shoeImage) && /outdoor pavement|concrete|grass|natural daylight/i.test(shoeImage));
check("shoe video Auto includes a reviewer", /Presenter: (?:A young Thai woman reviewer|A young Thai man reviewer)/i.test(shoeVideo));
check("shoe video Auto overrides no-person recommendation", !/No people, faces, presenters/i.test(shoeVideo));
check("shoe video overrides unstable saved camera", /Subtle Slow Zoom In/i.test(shoeVideo) && !/Handheld Shake/i.test(shoeVideo));
check("shoe prompts remain concise", shoeImage.length < 10000 && shoeVideo.length < 15000, `image=${shoeImage.length} video=${shoeVideo.length}`);

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

// Child presenter age-group auto detection tests — Auto mode MUST pick parents (woman/man)
check(
  "baby product name in Auto presenter mode falls back to parent (woman) presenter",
  /Presenter: A young Thai woman reviewer/i.test(buildVideoPrompt({ name: "นมผงเด็กแรกเกิด", productId: "baby-milk" }, settings))
);
check(
  "toddler product name in Auto presenter mode falls back to parent (woman) presenter",
  /Presenter: A young Thai woman reviewer/i.test(buildVideoPrompt({ name: "ห่วงยางเด็กหัดเดินเตาะแตะ", productId: "toddler-ring" }, settings))
);
check(
  "older child product name in Auto presenter mode selects parent (woman) presenter",
  /Presenter: A young Thai woman reviewer/i.test(buildVideoPrompt({ name: "กระเป๋านักเรียนประถมเด็กโต", productId: "older-child-bag" }, settings))
);
check(
  "general child/toy product name in Auto presenter mode selects parent (woman) presenter",
  /Presenter: A young Thai woman reviewer/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "child-toy" }, settings))
);
check(
  "explicit older_child mode selects older_child presenter",
  /Presenter: A cute Thai older child \(7-12 years old, kid\)/i.test(buildVideoPrompt({ name: "กระเป๋านักเรียนประถมเด็กโต", productId: "older-child-bag" }, { ...settings, presenter: "older_child" }))
);
check(
  "explicit child mode selects child presenter",
  /Presenter: A cute young Thai child \(4-6 years old, kindergarten age/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "child-toy" }, { ...settings, presenter: "child" }))
);
check(
  "explicit child presenter narrator is mother voice",
  /voice must sound like a caring Thai mother narrating/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก", productId: "child-narration" }, { ...settings, presenter: "child" }))
);
check(
  "explicit older child presenter narrator is mother voice",
  /voice must sound like a caring Thai mother narrating/i.test(buildVideoPrompt({ name: "ของเล่นเด็กโต", productId: "older-child-narration" }, { ...settings, presenter: "older_child" }))
);
check(
  "explicit child presenter narrator voice does not contradict with presenter identity",
  !/perfectly matches the character identity of the presenter/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก", productId: "child-narration" }, { ...settings, presenter: "child" }))
);
check(
  "explicit older child presenter narrator voice does not contradict with presenter identity",
  !/perfectly matches the character identity of the presenter/i.test(buildVideoPrompt({ name: "ของเล่นเด็กโต", productId: "older-child-narration" }, { ...settings, presenter: "older_child" }))
);
check(
  "explicit older child presenter narrator has age-appropriate settings without baby-talk",
  /never use baby-talk, baby words, or speak\/sound like a small child/i.test(buildVideoPrompt({ name: "ของเล่นเด็กโต", productId: "older-child-narration" }, { ...settings, presenter: "older_child" }))
);
check(
  "explicit child presenter narrator does not use baby-talk",
  /never use baby-talk or sound like a small child/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก", productId: "child-narration" }, { ...settings, presenter: "child" }))
);
check(
  "explicit child presenter narration does not sound like commercial product review",
  /NOT sound like a commercial product review or sales pitch/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก", productId: "child-narration" }, { ...settings, presenter: "child" }))
);
check(
  "child presenter strictly enforces kindergarten minimum age (4-6 years old, no babies/toddlers)",
  /strictly no baby or toddler under 4 years old/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "child-toy" }, { ...settings, presenter: "child" }))
);
check(
  "kids product scene direction enforces kindergarten minimum age",
  /strictly no babies or toddlers under kindergarten age/i.test(buildImagePrompt({ name: "จักรยานเด็ก", productId: "kids-bike" }, { ...settings, presenter: "child" }))
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
eq("normalizeHashtags removes repeated hash prefixes", normalizeHashtags(["##TikTokShop", "###ของดีบอกต่อ"]), ["#TikTokShop", "#ของดีบอกต่อ"]);
eq("normalizeHashtags splits space-separated tags", normalizeHashtags("##TikTokShop #ของดีบอกต่อ"), ["#TikTokShop", "#ของดีบอกต่อ"]);

// --- omni-flash: multi-scene description ---
const omniSettings = { ...settings, videoModel: "omni-flash", videoStyle: "sales" };
const omniVid = buildVideoPrompt({ name: "เครื่องปั่นน้ำผลไม้", highlights: "" }, omniSettings);
check("omni-flash video prompt requests multi-scene", /multi-scene|distinct scenes/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 1", /Scene 1/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 2", /Scene 2/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 3", /Scene 3/i.test(omniVid), omniVid);
// --- random caption opener test ---
const capRandom = buildCaption(prodA, { captionTemplate: "{product_name}", postRandomCaptionHook: true });
const capNonRandom = buildCaption(prodA, { captionTemplate: "{product_name}", postRandomCaptionHook: false });
check("random caption hook prepends random phrase", capRandom !== capNonRandom && capRandom.includes("Arzopa"), `random=${capRandom} non-random=${capNonRandom}`);
eq("non-random caption hook starts directly with product name", capNonRandom, "Arzopa A1 จอภาพแบบพกพา");

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
check("video prompt enforces real-world object gravity and contact shadows", /REAL-WORLD OBJECT PHYSICS/i.test(heavyRiceVideo) && /believable gravity, contact shadows/i.test(heavyRiceVideo), heavyRiceVideo);
check("video prompt allows camera movement but keeps product physically stable", /camera movement should feel like a real/i.test(heavyRiceVideo) && /product remains physically stable/i.test(heavyRiceVideo), heavyRiceVideo);

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
check("image prompt with woman presenter focuses on product hero presentation", /Product Hero Focus|Product Focus|Product photography/i.test(imgPresenterWoman), imgPresenterWoman);
check("image prompt with woman presenter uses single full-frame product intro", /multi-angle 4-panel grid photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterWoman), imgPresenterWoman);

const imgPresenterNone = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "none" });
check("image prompt with no presenter forbids people", /No people, faces/i.test(imgPresenterNone), imgPresenterNone);
check("image prompt with no presenter uses single full-frame product intro", /multi-angle 4-panel grid photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterNone), imgPresenterNone);
check("image prompt with no presenter has no positive presenter references", !/relative to the presenter|with a presenter/i.test(imgPresenterNone), imgPresenterNone);

const imgPresenterCustom = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "กรอกเอง", customPresenter: "ชายสูงวัยใจดีสวมแว่นตา" });
check("image prompt with custom presenter without modelRefImage maintains clean product focus", /Product Hero Focus|Product Focus|Product photography/i.test(imgPresenterCustom), imgPresenterCustom);

const imgPresenterHands = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only" });
check("image prompt with hands_only presenter shows hands", /realistic hands|first-person POV/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only presenter uses single full-frame product intro", /multi-angle 4-panel grid photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only uses scale relative to hands", /relative to the hands|relative to the surroundings/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only has strict hand details", /STRICT MAXIMUM TWO-HAND COUNT LOCK/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only strictly forbids faces", /FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(imgPresenterHands) && !/deformed|mutated/i.test(imgPresenterHands), imgPresenterHands);

const vidPresenterNone = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "none" });
check("video prompt with no presenter has no positive presenter/person references", !/relative to the presenter|on-screen presenter|presenter's character/i.test(vidPresenterNone), vidPresenterNone);

const vidPresenterHands = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only" });
check("video prompt with hands_only uses scale relative to hands", /relative to the hands/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only has strict hand details", /STRICT MAXIMUM TWO-HAND COUNT LOCK/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only globally locks two hands across all scenes", /GLOBAL TWO-HAND LOCK FOR THE ENTIRE VIDEO/i.test(vidPresenterHands) && /Never add a third hand/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only strictly forbids faces", /STRICTLY FORBIDDEN: Do not show any face|FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(vidPresenterHands) && !/deformed|mutated/i.test(vidPresenterHands), vidPresenterHands);

const vidPresenterUnboxingHands = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "unboxing_hands" });
check("video prompt with unboxing_hands uses hands-only unboxing presenter mode", /STRICT HANDS-ONLY UNBOXING PRESENTER MODE/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("video prompt with unboxing_hands opens box and reveals product", /opening a shipping box|opening the product box/i.test(vidPresenterUnboxingHands) && /revealing the exact target product inside the box|reveals the exact product inside the box/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("video prompt with unboxing_hands strictly forbids face and full person", /No face, head, torso, full body/i.test(vidPresenterUnboxingHands) && /FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("unboxing video globally locks two hands across all scenes", /GLOBAL TWO-HAND LOCK FOR THE ENTIRE VIDEO/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);

const imgTextEnabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "เย็นสบาย", promotionText: "ลด 50%" });
check("image prompt with text enabled shows only clipText phrase", /Place ONLY this single short Thai phrase/i.test(imgTextEnabled) && /เย็นสบาย/i.test(imgTextEnabled), imgTextEnabled);
check("image prompt with text enabled does NOT include product name or promotion in overlay", !/ลด 50%/i.test(imgTextEnabled) && !/พัดลมไร้สาย.*overlay/i.test(imgTextEnabled), imgTextEnabled);

const imgTextEnabledName = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "", promotionText: "ลด 50%" });
check("image prompt with text enabled but no clipText lets Flow choose text", /Creatively add ONE short cute Thai phrase/i.test(imgTextEnabledName) || /No added text/i.test(imgTextEnabledName), imgTextEnabledName);

const imgTextDisabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: false });
check("image prompt with text disabled uses TEXT_FREE_DIRECTION", /STRICT NO-TEXT RULE/i.test(imgTextDisabled), imgTextDisabled);

// --- small bag/coffee pouch scale tests ---
const coffeeProduct = { name: "ถุงกาแฟ 200 กรัม" };
const coffeeImage = buildImagePrompt(coffeeProduct, settings);
const coffeeVideo = buildVideoPrompt(coffeeProduct, settings);
check("coffee 200g image prompt has strict pouch scale instruction", /STRICT PRODUCT-SPECIFIC SIZE RULE/i.test(coffeeImage) && /standard hand-sized 200-500g pouch or bag/i.test(coffeeImage), coffeeImage);
check("coffee 200g video prompt has strict pouch scale instruction", /STRICT PRODUCT-SPECIFIC SIZE RULE/i.test(coffeeVideo) && /standard hand-sized 200-500g pouch or bag/i.test(coffeeVideo), coffeeVideo);

// --- small tech accessory scale tests ---
const mouseProduct = { name: "ไร้สาย Gaming Mouse RGB", category: "computer accessory" };
const mouseImage = buildImagePrompt(mouseProduct, settings);
const mouseVideo = buildVideoPrompt(mouseProduct, settings);
check("mouse image prompt has strict small tech accessory scale lock", /STRICT SMALL TECH ACCESSORY SCALE LOCK/i.test(mouseImage) && /mouse is about palm-sized/i.test(mouseImage), mouseImage);
check("mouse video prompt has strict small tech accessory scale lock", /STRICT SMALL TECH ACCESSORY SCALE LOCK/i.test(mouseVideo) && /do not enlarge it into a giant object/i.test(mouseVideo), mouseVideo);
check("mouse prompt uses desk-sized context instead of generic oversized scale", /desk-sized tech accessory|desk surface/i.test(mouseImage + mouseVideo), mouseImage + mouseVideo);

// --- image prompt single full-frame format test ---
const imgLimit = buildImagePrompt({ name: "พัดลมไร้สาย" }, settings);
check("image prompt specifies single full-frame product layout", /multi-angle 4-panel grid photograph|single full-frame authentic smartphone camera photograph/i.test(imgLimit), imgLimit);

// --- automatic text overlay & styling tests ---
import { resolveClipText } from "../modules/prompt-builder.js";

// Test 1: resolveClipText uses overlayText (not hooks)
const clipTextOverlay = resolveClipText({ name: "สินค้า", overlayText: "ดีไซน์สวย", hooks: ["ปังมากแม่ สวยสุดๆ คุ้มมากๆ"] }, { textEnabled: true });
check("resolveClipText prefers overlayText over hooks", clipTextOverlay === "ดีไซน์สวย", clipTextOverlay);

// Test 2: resolveClipText uses highlights when no overlayText
const clipTextHighlights = resolveClipText({ name: "สินค้า", highlights: "หอมมาก, สดชื่น" }, { textEnabled: true });
check("resolveClipText resolves to first highlight if overlayText empty", clipTextHighlights === "หอมมาก", clipTextHighlights);

// Test 3: resolveClipText resolves to natural review fallback if no info
const clipTextFallback = resolveClipText({ name: "สินค้าทั่วไป" }, { textEnabled: true });
check("resolveClipText resolves to natural review fallback if no info", ["น่าใช้มาก", "ดีไซน์สวย", "ใช้งานง่าย", "ดูดีมาก", "สะดวกสุดๆ", "รายละเอียดดี", "น่ามีติดบ้าน", "คุ้มค่าน่าใช้"].includes(clipTextFallback), clipTextFallback);

// Test 4: image prompt contains cute handwritten-style styling and doodles
const imgOverlay = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "เย็นสุดขั้ว" });
check("image prompt styling requests cute handwritten-style and doodles", /cute Thai handwritten-style/i.test(imgOverlay) && /doodles/i.test(imgOverlay) && /white with a soft shadow/i.test(imgOverlay), imgOverlay);

// Test 5: video prompt contains cute handwritten-style styling and doodles
const vidOverlay = buildVideoPrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "เย็นสุดขั้ว" });
check("video prompt styling requests cute handwritten-style and doodles", /cute Thai handwritten-style/i.test(vidOverlay) && /doodles/i.test(vidOverlay) && /white with a soft shadow/i.test(vidOverlay), vidOverlay);

// Test 6: resolveClipText truncates long overlayText to <= 20 chars
const longOverlay = "พัดลมตั้งโต๊ะอเนกประสงค์ไร้สายพลังลมเย็นสุดๆพกพาสะดวก";
const clipTextTruncated = resolveClipText({ name: "สินค้า", overlayText: longOverlay }, { textEnabled: true });
check("resolveClipText truncates long overlayText to 20 chars ending with ..", clipTextTruncated.length <= 20 && clipTextTruncated.endsWith(".."), clipTextTruncated);

// Test 7: firstSceneNoPeople option modifies Scene 1 and presenter instructions conditionally
const vidFirstSceneNoPeopleHoldable = buildVideoPrompt({ name: "เซรั่มหน้าใส" }, { ...settings, presenter: "woman", firstSceneNoPeople: true });
check("video prompt with firstSceneNoPeople (holdable) contains hands exception", /STRICT EXCEPTION FOR SCENE 1: Do not show the presenter's face/i.test(vidFirstSceneNoPeopleHoldable), vidFirstSceneNoPeopleHoldable);
check("video prompt with firstSceneNoPeople (holdable) shows only hands holding in Scene 1", /Scene 1.*Show only hands holding the product.*STRICTLY FORBIDDEN: Do not show any human faces/i.test(vidFirstSceneNoPeopleHoldable), vidFirstSceneNoPeopleHoldable);

const vidFirstSceneNoPeopleHeavy = buildVideoPrompt({ name: "กระสอบปูน 50 กิโลกรัม" }, { ...settings, presenter: "woman", firstSceneNoPeople: true });
check("video prompt with firstSceneNoPeople (heavy) contains strict exception for no people/hands", /STRICT EXCEPTION FOR SCENE 1: Do not show the presenter, any other people, or hands/i.test(vidFirstSceneNoPeopleHeavy), vidFirstSceneNoPeopleHeavy);
check("video prompt with firstSceneNoPeople (heavy) shows only product resting in Scene 1", /Scene 1.*Product-only shot.*rest on a flat surface/i.test(vidFirstSceneNoPeopleHeavy), vidFirstSceneNoPeopleHeavy);

// Test 8: modelRefImage & presenter face generation enforcement
const vidNoModelRef = buildVideoPrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman" });
check("video prompt without modelRefImage instructs AI NOT to copy face from product reference image", /CRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION/i.test(vidNoModelRef), vidNoModelRef);

const vidWithModelRef = buildVideoPrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman", modelRefImage: "data:image/png;base64,sample" });
check("video prompt with modelRefImage enforces brand new presenter face generation", /CRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION/i.test(vidWithModelRef), vidWithModelRef);

const imgNoModelRef = buildImagePrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman" });
check("image prompt without modelRefImage instructs AI to focus on clean product hero presentation", /Product Hero Focus|Product Focus|BRAND NEW PRESENTER FACE/i.test(imgNoModelRef), imgNoModelRef);

const imgWithModelRef = buildImagePrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman", modelRefImage: "data:image/png;base64,sample" });
check("image prompt with modelRefImage enforces brand new presenter face generation", /CRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION/i.test(imgWithModelRef), imgWithModelRef);

// Test 9: Video prompt fidelity directions
const sampleVideoPrompt = buildVideoPrompt({ name: "กระเป๋าเป้ลายการ์ตูน" }, settings);
check("video prompt includes printed graphic fidelity instruction", /Reproduce all printed surface artwork|Reproduce the printed surface artwork/i.test(sampleVideoPrompt), sampleVideoPrompt);
check("video prompt includes color and pattern accuracy instruction", /EXACT COLOR & PATTERN ACCURACY/i.test(sampleVideoPrompt), sampleVideoPrompt);
// Test 10: Hands-only background aesthetics
const handsOnlyImg = buildImagePrompt({ name: "เคสมือถือ" }, { ...settings, presenter: "hands_only" });
check("hands_only image prompt contains background aesthetics", /BACKGROUND AESTHETICS/i.test(handsOnlyImg), handsOnlyImg);
check("hands_only image prompt has soft-focus cinematic bokeh blur instruction", /soft-focus shallow depth of field|cinematic bokeh blur/i.test(handsOnlyImg), handsOnlyImg);

const handsOnlyVid = buildVideoPrompt({ name: "เคสมือถือ" }, { ...settings, presenter: "hands_only" });
check("hands_only video prompt contains background setting or aesthetics", /Cafe \/ Coffee Shop|BACKGROUND AESTHETICS/i.test(handsOnlyVid), handsOnlyVid);

// Test 11: Phone case product infers hands_only and Cafe/Coffee Shop setting
const caseAutoVid = buildVideoPrompt({ name: "เคสไอโฟน 16 Pro Max ลายการ์ตูน" }, { ...settings, presenter: "Auto", location: "Auto" });
check("phone case product Auto presenter recommends hands_only", /STRICTLY FORBIDDEN: Do not show any face or head in the frame/i.test(caseAutoVid), caseAutoVid);
check("phone case product Auto location recommends Cafe \/ Coffee Shop setting", /Cafe \/ Coffee Shop/i.test(caseAutoVid), caseAutoVid);
check("phone case product video prompt contains multi-angle multi-shot mandate", /MULTI-ANGLE PHONE CASE SHOT MANDATE/i.test(caseAutoVid), caseAutoVid);
check("no-presenter or hands_only presenter defaults voice narration to female narrator", /young Thai female|off-screen young Thai woman narrator/i.test(caseAutoVid), caseAutoVid);

const magneticCaseVid = buildVideoPrompt({ name: "เคสแม่เหล็กวงกลม ชาร์จไร้สาย ยึดขาตั้ง" }, settings);
check("magnetic phone case prompt includes built-in magnetic ring feature lock", /BUILT-IN MAGNETIC RING \(MAGSAFE\) FEATURE LOCK/i.test(magneticCaseVid), magneticCaseVid);
check("magnetic phone case prompt forbids external stick-ons or separate plates", /no extra attachments or stick-ons required/i.test(magneticCaseVid), magneticCaseVid);

// Test 12: Clothing front-only view lock
const clothingVid = buildVideoPrompt({ name: "เสื้อยืดคอกลมแฟชั่น", category: "เสื้อผ้า" }, settings);
check("clothing video prompt enforces front-only view lock", /STRICT CLOTHING & APPAREL GARMENT FIDELITY LOCK/i.test(clothingVid), clothingVid);
check("clothing video prompt forbids back view and turning around", /do NOT show the back view|CLOTHING FRONT-ONLY RULE/i.test(clothingVid), clothingVid);

const clothingImg = buildImagePrompt({ name: "เสื้อเชิ้ตแขนยาว", category: "แฟชั่น" }, settings);
check("clothing image prompt enforces front-facing shot distribution", /front shot|front-facing/i.test(clothingImg), clothingImg);

// Test 13: Auto never selects dog/cat; animal presenters are explicit opt-in only
const petFoodAutoVid = buildVideoPrompt({ name: "อาหารแมวพรีเมียม 1.2kg" }, { ...settings, presenter: "Auto" });
check("cat pet product Auto presenter excludes animal", !/cute cat|cute dog|Pet Opening/i.test(petFoodAutoVid), petFoodAutoVid);

const petCollarAutoVid = buildVideoPrompt({ name: "ปลอกคอสัตว์เลี้ยงพรีเมียม", category: "สัตว์เลี้ยง" }, { ...settings, presenter: "Auto" });
check("generic pet product Auto presenter excludes animal", !/cute cat|cute dog|Pet Opening/i.test(petCollarAutoVid), petCollarAutoVid);

const petFoodAutoOptVid = buildVideoPrompt({ name: "อาหารสัตว์", autoOptions: { presenter: "cat" } }, { ...settings, presenter: "Auto" });
check("autoOptions cat cannot override Auto animal exclusion", !/cute cat|cute dog|Pet Opening/i.test(petFoodAutoOptVid), petFoodAutoOptVid);

const dogToyVid = buildVideoPrompt({ name: "ของเล่นสุนัข" }, { ...settings, presenter: "dog" });
check("dog pet product explicit presenter includes reviewer and dog", /reviewer/i.test(dogToyVid) && /dog/i.test(dogToyVid), dogToyVid);
check("dog pet product voice matches reviewer presenting with pet", /the voice age, gender, and speech style must match the on-screen Thai presenter presenting the product with their pet/i.test(dogToyVid), dogToyVid);

// Test 14: Spray bottle & pet spray fidelity lock
const petSprayImg = buildImagePrompt({ name: "สเปรย์อาบน้ำแห้งแมว 250ml", category: "สัตว์เลี้ยง" }, settings);
check("pet spray image prompt includes spray bottle fidelity lock", /SPRAY BOTTLE & PACKAGING LABEL FIDELITY LOCK/i.test(petSprayImg), petSprayImg);
check("pet spray image prompt includes brand logo & pattern fidelity lock", /Preserve the exact brand logo, product name typography, printed graphics, patterns/i.test(petSprayImg), petSprayImg);

const petSprayVid = buildVideoPrompt({ name: "สเปรย์กำจัดเห็บหมัดหมา", category: "สัตว์เลี้ยง" }, settings);
check("pet spray video prompt includes spray bottle fidelity lock", /SPRAY BOTTLE & PACKAGING LABEL FIDELITY LOCK/i.test(petSprayVid), petSprayVid);

// Test 15: Furniture structural fidelity lock
check("isFurnitureProduct detects table/chair/sofa/desk", isFurnitureProduct("โต๊ะทำงานพับได้ โซฟา 3 ที่นั่ง เก้าอี้ทานอาหาร"));
check("isFurnitureProduct detects English furniture terms", isFurnitureProduct("modern wooden coffee table desk chair sofa"));

const furnitureVid = buildVideoPrompt({ name: "โต๊ะทำงานไม้แท้ 120cm", category: "เฟอร์นิเจอร์" }, settings);
check("furniture video prompt includes structural fidelity lock", /STRICT FURNITURE & INTERIOR STRUCTURAL FIDELITY LOCK/i.test(furnitureVid), furnitureVid);
check("furniture video prompt includes zero dynamic warping rule", /ZERO DYNAMIC WARPING RULE/i.test(furnitureVid), furnitureVid);

const sofaImg = buildImagePrompt({ name: "โซฟาปรับนอน 2 ที่นั่ง ผ้าฮอลแลนด์" }, settings);
check("sofa image prompt includes furniture fidelity lock", /STRICT FURNITURE & INTERIOR STRUCTURAL FIDELITY LOCK/i.test(sofaImg), sofaImg);

// Test 16: Phone case & Bags structural fidelity lock
const phoneCaseVid = buildVideoPrompt({ name: "เคสไอโฟน 16 Pro Max ลายการ์ตูนหมี" }, settings);
check("phone case video prompt includes phone case fidelity lock", /STRICT PHONE CASE & MOBILE ACCESSORY FIDELITY LOCK/i.test(phoneCaseVid), phoneCaseVid);

const bagVid = buildVideoPrompt({ name: "กระเป๋าสะพายข้างหนังแท้สำหรับผู้หญิง" }, settings);
check("bag video prompt includes bags fidelity lock", /STRICT BAGS & ACCESSORIES STRUCTURAL FIDELITY LOCK/i.test(bagVid), bagVid);

// Test 17: Foreign character stripping & strict Thai language lock
const strippedText = stripForeignNonThaiScripts("กระเป๋าถือแฟชั่น 现货 潮流包包 🔥เกรดพรีเมียม");
check("stripForeignNonThaiScripts strips Chinese/CJK characters", strippedText === "กระเป๋าถือแฟชั่น 🔥เกรดพรีเมียม", strippedText);

const sampleVidThai = buildVideoPrompt({ name: "กระเป๋าสะพาย" }, settings);
check("video prompt includes strict Thai language and zero gibberish lock", /STRICT THAI LANGUAGE ONLY & ZERO GIBBERISH LOCK/i.test(sampleVidThai), sampleVidThai);

// Test 18: Kids products (จักรยานเด็ก) Presenter & Parent Supervision Lock
const kidsBikeVid = buildVideoPrompt({ name: "จักรยานเด็กทรงสปอร์ต ล้อ 16 นิ้ว" }, settings);
const kidsBikeImg = buildImagePrompt({ name: "จักรยานเด็กทรงสปอร์ต ล้อ 16 นิ้ว" }, settings);
check("kids bicycle prompt includes child and supervising parent", /child|kid/i.test(kidsBikeVid) && /parent|guardian/i.test(kidsBikeVid), kidsBikeVid);
check("kids bicycle prompt excludes dogs/pets", !/pet animal|\bdog\b/i.test(kidsBikeVid), kidsBikeVid);
check("kids bicycle video prompt uses outdoor location", /outdoor home driveway|front yard|park path|quiet neighborhood street/i.test(kidsBikeVid), kidsBikeVid);
check("kids bicycle image prompt uses outdoor location", /outdoor home driveway|front yard|park path|quiet neighborhood street/i.test(kidsBikeImg), kidsBikeImg);
check("kids bicycle prompts do not use indoor nursery/playroom location", !/Bright safe children's playroom or nursery/i.test(kidsBikeVid + kidsBikeImg), kidsBikeVid + kidsBikeImg);

// Test 19: Poultry/Farm Feed (อาหารไก่) Exclusion of Dogs & Cats
const chickenFeedVid = buildVideoPrompt({ name: "อาหารไก่ไข่ โปรตีนสูง 30 กก." }, settings);
check("chicken feed video prompt excludes dogs/cats", !/pet animal|\bdog\b|\bcat\b/i.test(chickenFeedVid) && /POULTRY & LIVESTOCK FEED SPECIFIC RULE/i.test(chickenFeedVid), chickenFeedVid);

// Test 20: Sunscreen & Sun Protection products (กันแดด, หมวกกันแดด) Outdoor Bright Sunlight Location & Presenter Gender Lock
const sunscreenVid = buildVideoPrompt({ name: "ครีมกันแดดคุมมัน SPF50+ PA++++" }, settings);
check("sunscreen prompt assigns bright sunny outdoor location", /Bright Sunny Outdoor Beach|Nature \/ Outdoor|sunny outdoor environment/i.test(sunscreenVid), sunscreenVid);
check("sunscreen prompt includes sun protection scene lock", /SUN PROTECTION & SUN HAT SCENE LOCK/i.test(sunscreenVid), sunscreenVid);

const menSunHatVid = buildVideoPrompt({ name: "หมวกกันแดดปีกกว้าง สำหรับผู้ชาย" }, settings);
check("men's sun hat prompt includes male presenter and sunny outdoor location", /man|male/i.test(menSunHatVid) && /SUN PROTECTION & SUN HAT SCENE LOCK/i.test(menSunHatVid), menSunHatVid);

// Test 21: Modest Dress Code Lock (ห้ามชุดสุ่มเสี่ยง/วาบหวิว)
const modestFashionVid = buildVideoPrompt({ name: "เสื้อเชิ้ตลายดอก" }, { ...settings, presenter: "woman" });
check("video prompt includes strict modest dress code lock forbidding risqué outfits", /STRICT MODEST & APPROPRIATE DRESS CODE LOCK|ห้ามชุดสุ่มเสี่ยง/i.test(modestFashionVid), modestFashionVid);
check("video prompt forbids revealing cleavage/deep v-necks/micro-shorts", /No deep v-necks|no exposed cleavage|no micro-shorts/i.test(modestFashionVid), modestFashionVid);

// Test 22: Balaclava / Headwear / Buff Presenter Gender & Never Remove Mandate (ห้ามถอดโม่ง/หมวก/ผ้าบัฟ)
const balaclavaVid = buildVideoPrompt({ name: "โม่งคลุมหัวกันแดด ขี่มอเตอร์ไซค์" }, settings);
check("balaclava prompt includes strict headwear never remove mandate", /STRICT HEADWEAR & BALACLAVA WEARING LOCK|ห้ามถอดโม่ง/i.test(balaclavaVid), balaclavaVid);
check("balaclava prompt forbids taking off or removing headwear", /NEVER remove, pull down, take off, unmask/i.test(balaclavaVid), balaclavaVid);

// --- vehicle accessories require the matching vehicle in the scene ---
const motorcycleHelmetImage = buildImagePrompt({ name: "หมวกกันน็อคมอเตอร์ไซค์" }, settings);
const motorcycleHelmetVideo = buildVideoPrompt({ name: "หมวกกันน็อคมอเตอร์ไซค์" }, settings);
check("motorcycle helmet image includes real motorcycle context", /STRICT VEHICLE ACCESSORY CONTEXT LOCK/i.test(motorcycleHelmetImage) && /real motorcycle or scooter/i.test(motorcycleHelmetImage), motorcycleHelmetImage);
check("motorcycle helmet video uses motorcycle location", /Outdoor motorcycle driveway|roadside|parking area/i.test(motorcycleHelmetVideo) && !/Realistic clean car interior/i.test(motorcycleHelmetVideo), motorcycleHelmetVideo);

const motorcycleTopBoxImage = buildImagePrompt({ name: "กล่องท้ายมอเตอร์ไซค์" }, settings);
check("motorcycle top box image requires attachment to a motorcycle", /shown on, attached to, or directly beside a real motorcycle/i.test(motorcycleTopBoxImage) && /matching motorcycle/i.test(motorcycleTopBoxImage), motorcycleTopBoxImage);

const carAccessoryImage = buildImagePrompt({ name: "ที่วางโทรศัพท์ในรถยนต์" }, settings);
check("car accessory image includes real car context", /shown inside, attached to, or directly beside a real car/i.test(carAccessoryImage) && /actual car clearly visible/i.test(carAccessoryImage), carAccessoryImage);

// Test 23: No Donning & No Doffing Action Lock (ห้ามทำท่าถอดหรือสวมใส่)
const videoPromptDonningCheck = buildVideoPrompt({ name: "หมวกกันแดด" }, settings);
check("video prompt includes strict no-donning & no-doffing action lock", /STRICT NO-DONNING & NO-DOFFING ACTION LOCK|ห้ามทำท่าถอดหรือสวมใส่/i.test(videoPromptDonningCheck), videoPromptDonningCheck);
check("video prompt forbids motioning to put on or take off items", /Do NOT depict any action, motion, or gesture of putting on|taking off/i.test(videoPromptDonningCheck), videoPromptDonningCheck);

// Test 24: Full Face Balaclava / Mask Fabric Mouth Coverage Lock (ปิดปากมิดชิดธรรมชาติ ห้ามเห็นปาก/ขยับปากใต้ผ้า)
const fullBalaclavaVid = buildVideoPrompt({ name: "โม่งคลุมหมดหน้า ป้องกัน UV" }, settings);
check("full balaclava prompt includes fabric mouth covering lock", /STRICT FABRIC MOUTH-COVERING LOCK|ปิดปากมิดชิดธรรมชาติ/i.test(fullBalaclavaVid), fullBalaclavaVid);
check("full balaclava prompt forbids visible lips/mouth opening through fabric", /Do NOT show visible lips, mouth opening, lip-sync movement/i.test(fullBalaclavaVid), fullBalaclavaVid);

// Test 25: Pet Keyword Restriction Lock for Dog/Cat Presenter
const nonPetProdWithDogRec = buildVideoPrompt({ name: "แก้วน้ำเก็บความเย็น 500ml", autoOptions: { presenter: "dog" } }, settings);
check("non-pet product overrides recommended dog presenter", !/cute dog|pet animal/i.test(nonPetProdWithDogRec), nonPetProdWithDogRec);

const petProdWithDogRec = buildVideoPrompt({ name: "อาหารหมาพันธุ์เล็ก 1kg", autoOptions: { presenter: "dog" } }, settings);
check("pet product does not keep unselected recommended dog presenter", !/cute dog|pet animal/i.test(petProdWithDogRec), petProdWithDogRec);

// Test 26: Animals are never invented unless the user explicitly selects dog/cat presenter
const genericAutoImg = buildImagePrompt({ name: "generic water bottle", autoOptions: { presenter: "dog" } }, { ...settings, presenter: "Auto" });
check("generic Auto image prompt blocks unrequested animals", /No animals unless explicitly selected/i.test(genericAutoImg) && !/Pet Animal:|cute dog/i.test(genericAutoImg), genericAutoImg);

const genericAutoVid = buildVideoPrompt({ name: "generic water bottle", autoOptions: { presenter: "dog" } }, { ...settings, presenter: "Auto" });
check("generic Auto video prompt blocks unrequested animals", /No animals unless explicitly selected/i.test(genericAutoVid) && !/Pet Opening|cute dog/i.test(genericAutoVid), genericAutoVid);

const petAutoImg = buildImagePrompt({ name: "อาหารสุนัข premium", autoOptions: { presenter: "dog" } }, { ...settings, presenter: "Auto" });
check("Auto image mode never resolves to an animal presenter", /IMAGE AUTO MODE: No dog, cat/i.test(petAutoImg) && !/Pet Animal:|cute dog/i.test(petAutoImg), petAutoImg);

const explicitDogVid = buildVideoPrompt({ name: "generic water bottle" }, { ...settings, presenter: "dog" });
check("explicit dog presenter remains opt-in", /cute dog|pet animal/i.test(explicitDogVid) && !/STRICT ANIMAL EXCLUSION LOCK/i.test(explicitDogVid), explicitDogVid);

const fidelityImg = buildImagePrompt({ name: "black insulated bottle", category: "drinkware" }, { ...settings, presenter: "none" });
check("image prompt treats reference photo as highest-priority product source", /REFERENCE PHOTO OVERRIDES TEXT/i.test(fidelityImg), fidelityImg);
check("image prompt uses background-only compositing instead of product redesign", /BACKGROUND-ONLY EDIT/i.test(fidelityImg), fidelityImg);

const fidelityVid = buildVideoPrompt({ name: "black insulated bottle", category: "drinkware" }, { ...settings, presenter: "none" });
check("video prompt keeps strict reference product fidelity", /STRICT PRODUCT FIDELITY LOCK/i.test(fidelityVid), fidelityVid);

// Test 27: Auto background must match the product category.
const autoBackgroundCases = [
  ["water bottle", /Bright realistic outdoor park or fitness setting/i],
  ["cat food", /Clean pet-friendly home interior/i],
  ["toy", /Bright safe children's playroom/i],
  ["car phone holder", /Realistic clean car interior/i],
  ["laptop stand", /Neat modern desk workspace/i],
  ["running shoes", /Outdoor home driveway|front yard|quiet neighborhood street|park path/i]
];
for (const [name, expectedLocation] of autoBackgroundCases) {
  const autoImage = buildImagePrompt({ name }, { ...settings, location: "Auto", presenter: "Auto" });
  const autoVideo = buildVideoPrompt({ name }, { ...settings, location: "Auto", presenter: "Auto" });
  check(`Auto background matches ${name} category`, expectedLocation.test(autoImage + autoVideo) && /BACKGROUND COMPATIBILITY LOCK/i.test(autoImage), autoImage + autoVideo);
}

const shoeWithWrongSavedLocation = buildImagePrompt(
  { name: "รองเท้าวิ่งผู้หญิง", productId: "wrong-location-shoe" },
  { ...settings, location: "Modern Living Room" }
);
check("shoe still image overrides a wrong saved indoor location", /outdoor home driveway|front yard|quiet neighborhood street|park path/i.test(shoeWithWrongSavedLocation) && !/Modern Living Room/i.test(shoeWithWrongSavedLocation));

if (fail > 0) {
  console.log(results.filter(r => r.startsWith("❌")).join("\n"));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
