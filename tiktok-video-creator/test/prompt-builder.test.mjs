// Unit tests for modules/prompt-builder.js — run: node test/prompt-builder.test.mjs
import {
  buildCaption,
  appendTikTokCaptionSignature,
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
  resolveSpokenOpeningHook,
  stripForeignNonThaiScripts,
  VIDEO_STYLES,
  HIDDEN_VIDEO_STYLE_IDS,
  getSelectableVideoStyles
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

check("hands-only is a standalone video style", VIDEO_STYLES.some((style) => style.id === "hands-only"));
check("requested sales styles are hidden from selectors", ["review", "flash-sale", "sales", "lifestyle", "cinematic", "trending-hook", "before-after"].every((id) => HIDDEN_VIDEO_STYLE_IDS.has(id)));
check("UGC/Testimonial appears first in selectable styles", getSelectableVideoStyles()[0]?.id === "testimonial");
check("fashion hanger presenter is a selectable style", getSelectableVideoStyles().some((style) => style.id === "fashion-hanger-presenter"));

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
eq("caption signature appends at the end", appendTikTokCaptionSignature("ขายดีมาก"), "ขายดีมาก i love tiktok");
eq("caption signature is not duplicated", appendTikTokCaptionSignature("ขายดีมาก i love tiktok"), "ขายดีมาก i love tiktok");
check("caption signature is not a hashtag", !normalizeHashtags(["#TikTokShop"]).includes("#ilovetiktok"));

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
check("default video forbids added scene text", /STRICT NO-TEXT RULE:[\s\S]*Do not add text overlays[\s\S]*anywhere/i.test(vid), vid);
check("default video preserves only visible product text", /Preserve only product text visible in the reference/i.test(vid), vid);
check("default video ignores surrounding image text", /STRICT LOGO & PRINTED TEXT FIDELITY LOCK:[\s\S]*physically present on the product\/packaging[\s\S]*Ignore surrounding overlay text/i.test(vid), vid);
check("default video keeps absent product text blank", /If no text is visibly present on the reference product[\s\S]*surface completely blank[\s\S]*Never infer text from the title or surrounding image/i.test(vid), vid);
check("video prompt starts with Thai advertisement prefix", /^สร้างวิดีโอโฆษณารีวิวสินค้า/i.test(vid), vid);
check("default video puts no-text rule before style instructions", vid.indexOf("HIGHEST PRIORITY — STRICT NO-TEXT RULE") < vid.indexOf("Visual style:"), vid);

const hangerProduct = { name: "เสื้อเชิ้ตลายดอก", category: "เสื้อผ้า", highlights: "เสื้อเชิ้ตแขนสั้น ลายดอกสีฟ้า" };
const hangerImage = buildImagePrompt(hangerProduct, { ...settings, videoStyle: "fashion-hanger-presenter", presenter: "woman" });
const hangerVideo = buildVideoPrompt(hangerProduct, { ...settings, videoStyle: "fashion-hanger-presenter", presenter: "woman" });
const autoHangerVideo = buildVideoPrompt(
  { name: "เสื้อเชิ้ตผู้ชาย", category: "เสื้อผ้าผู้ชาย" },
  { ...settings, videoStyle: "fashion-hanger-presenter", presenter: "Auto" }
);
check("fashion hanger image shows a visible fictional face", /FASHION HANGER PRESENTER MODE[\s\S]*fully visible fresh youthful face[\s\S]*brand-new fictional face/i.test(hangerImage), hangerImage);
check("fashion hanger image limits model age to 25", /aged 20-25 years old[\s\S]*Never make the model older than 25/i.test(hangerImage), hangerImage);
check("fashion hanger image uses a youthful attractive model", /visibly youthful[\s\S]*naturally beautiful[\s\S]*aged 20-25 years old/i.test(hangerImage), hangerImage);
check("fashion hanger image uses a Thai model with Korean-inspired styling", /distinctly Thai identity[\s\S]*Korean-inspired K-fashion\/K-beauty aesthetic[\s\S]*not a Korean or foreign model/i.test(hangerImage), hangerImage);
check("fashion hanger image matches the worn and held garments", /EXACT GARMENT PAIR LOCK[\s\S]*one instance naturally worn[\s\S]*one identical instance hanging on a real clothes hanger/i.test(hangerImage), hangerImage);
check("fashion hanger image copies only the sold garment", /FASHION HANGER PRODUCT-ONLY STYLE LOCK[\s\S]*copy only the exact garment[\s\S]*copy only that shirt[\s\S]*Do not copy any non-product clothing/i.test(hangerImage), hangerImage);
check("fashion hanger image avoids unrequested jeans", /NO UNREQUESTED JEANS LOCK[\s\S]*Do not dress the model in jeans[\s\S]*non-denim option/i.test(hangerImage), hangerImage);
check("fashion hanger video presents directly to camera", /direct-to-camera[\s\S]*looks into the camera|direct-to-camera[\s\S]*looking into the camera/i.test(hangerVideo), hangerVideo);
check("fashion hanger video keeps non-product styling original", /FASHION HANGER PRODUCT-ONLY STYLE LOCK[\s\S]*everything else must be an original fictional choice/i.test(hangerVideo), hangerVideo);
check("fashion hanger video prevents source-face matching", /does not copy, match, resemble, or reproduce any face from the reference image/i.test(hangerVideo), hangerVideo);
check("fashion hanger video keeps the exact garment on the model", /already wearing|naturally wears the exact reference garment|exact reference garment/i.test(hangerVideo), hangerVideo);
check("fashion hanger Auto always uses a Thai Korean-style woman aged 20-25", /Thai female fashion model aged 20-25 years old[\s\S]*Korean-inspired K-fashion\/K-beauty aesthetic[\s\S]*This is a Thai woman/i.test(autoHangerVideo), autoHangerVideo);

// --- image prompt: fidelity + sharp focus ---
const img = buildImagePrompt({ name: "ครีมบำรุงผิว", highlights: "" }, settings);
check("image prompt mentions fidelity", /preserve exact shape/i.test(img));
check("image prompt sharp focus", /sharp and clearly visible|sharp focus/i.test(img));
check(
  "image prompt locks the exact pattern variant",
  /STILL IMAGE — EXACT VARIANT & PATTERN LOCK[\s\S]*one fixed surface map[\s\S]*Do not blend different variants/i.test(img),
  img
);
check(
  "image prompt preserves pattern placement details",
  /motif identity, count, spacing, orientation, scale, edge placement, asymmetry/i.test(img),
  img
);
check(
  "every still prompt treats the reference surface as an unchanged transfer",
  /EDIT THE UPLOADED PRODUCT, DO NOT REGENERATE IT:[\s\S]*product-preserving image edit[\s\S]*Synthesize only the pixels outside the product boundary[\s\S]*same uploaded item/i.test(img),
  img
);
check("reference image keeps product text but forbids added text", /Preserve only product text visible in the reference[\s\S]*product surface blank/i.test(img), img);
check("reference image ignores surrounding image text", /PRODUCT TEXT SCOPE:[\s\S]*Product text only[\s\S]*background text/i.test(img), img);
check("reference image keeps absent product text blank", /If none is visible\/readable[\s\S]*surface blank[\s\S]*never infer text from the title or surrounding image/i.test(img), img);
check("default image puts no-text rule before product instructions", img.indexOf("HIGHEST PRIORITY — STRICT NO-TEXT RULE") < img.indexOf("REFERENCE PRODUCT IDENTITY ONLY"), img);

const coloredBoxImage = buildImagePrompt({
  name: "กล่องของขวัญสีฟ้าพร้อมฉลาก",
  category: "บรรจุภัณฑ์",
  highlights: "กล่องสีฟ้า ฉลากสีขาว และโลโก้สีน้ำเงิน"
}, settings);
check("packaging still image locks visible box colors", /HIGHEST PRIORITY STILL REFERENCE FIDELITY[\s\S]*visible packaging colors[\s\S]*STRICT COLOR REPRODUCTION LOCK/i.test(coloredBoxImage), coloredBoxImage);
check("packaging still image separates product colors from the background", /Reference controls only the product\/set identity[\s\S]*Do not copy the source people[\s\S]*create a new composition/i.test(coloredBoxImage), coloredBoxImage);

const coffeePouch = buildImagePrompt({
  name: "กาแฟคั่วบด Angry Bears Coffee",
  originalName: "กาแฟคั่วบด Angry Bears Coffee",
  category: "ซองกาแฟ",
  highlights: "ซองกาแฟสีดำ ฉลากสีน้ำตาล มีโลโก้หมี Angry Bears"
}, settings);
check("coffee prompt disambiguates comparison or alternate pouch references", /REFERENCE VARIANT DISAMBIGUATION[\s\S]*use only the original product/i.test(coffeePouch), coffeePouch);
check("coffee prompt rejects alternate blue/yellow pouch artwork", /COFFEE REFERENCE VARIANT LOCK[\s\S]*blue\/yellow artwork/i.test(coffeePouch), coffeePouch);
check("coffee prompt keeps the canonical pouch as one consistent design", /one consistent design/i.test(coffeePouch), coffeePouch);
check("coffee prompt remains within the image prompt size guard", coffeePouch.length < 14000, `length=${coffeePouch.length}`);
const compactCoffeeStill = buildImagePrompt(
  { name: "กาแฟโบราณ สูตรพิเศษ", category: "ซองกาแฟ" },
  { ...settings, flowGenMode: "combined", presenter: "Auto" }
);
check(
  "combined coffee still uses reference-first mode",
  /Create one vertical 9:16 product still of the exact product or set visible in the attached image/i.test(compactCoffeeStill)
    && /REFERENCE-FIRST MODE:[\s\S]*uploaded image is the only visual source of truth/i.test(compactCoffeeStill)
    && !/underwear/i.test(compactCoffeeStill),
  compactCoffeeStill
);
check(
  "combined coffee still uses the universal no-redraw surface lock",
  /EDIT THE UPLOADED PRODUCT, DO NOT REGENERATE IT:[\s\S]*same uploaded item/i.test(compactCoffeeStill),
  compactCoffeeStill
);
check(
  "combined coffee still keeps the prompt compact",
  compactCoffeeStill.length < 4000,
  `length=${compactCoffeeStill.length}`
);
check(
  "combined still derives scale from the reference",
  /REALISTIC PRODUCT SCALE:[\s\S]*scale from the visible reference/i.test(compactCoffeeStill)
    && /visible table space and background around the product|small amount of the supporting table surface|never let the pouch fill the table/i.test(compactCoffeeStill),
  compactCoffeeStill
);
check(
  "coffee hero composition does not imply oversized product",
  /HERO COMPOSITION DOES NOT MEAN OVERSIZED:[\s\S]*sharp focus[\s\S]*not by enlarging it/i.test(compactCoffeeStill),
  compactCoffeeStill
);
check(
  "coffee still keeps floor and empty table mostly out of frame",
  /natural eye-level product photograph[\s\S]*floor mostly out of frame[\s\S]*soft background blur/i.test(compactCoffeeStill),
  compactCoffeeStill
);

check(
  "stale coffee metadata cannot force a pouch or a single item in reference-first stills",
  compactCoffeeStill.startsWith("IMAGE ANALYSIS FIRST")
    && /ignore incompatible shape, count, packaging, scale, and usage/i.test(compactCoffeeStill)
    && !/actual coffee pouch|COFFEE\/TEA POUCH|exactly one pouch|sealed pouch form|for coffee pouch bag/i.test(compactCoffeeStill),
  compactCoffeeStill
);
check("combined image keeps the actual source title", /PRODUCT TITLE CONTEXT: กาแฟโบราณ สูตรพิเศษ/.test(compactCoffeeStill), compactCoffeeStill);
check("image and name have complementary roles", /Image defines appearance[\s\S]*title supplies type, model, size and use/.test(compactCoffeeStill), compactCoffeeStill);
check("beautification preserves the original product", /Beautify lighting, background and composition; preserve the original product/.test(compactCoffeeStill), compactCoffeeStill);
for (const videoStyle of ["review", "still-motion", "boxed-motion", "fashion-selfie", "fashion-hanger-presenter"]) {
  const visualFirst = buildImagePrompt({ name: "Coffee", category: "coffee" }, { ...settings, videoStyle });
  check(`image analysis priority precedes metadata for ${videoStyle}`, visualFirst.startsWith("IMAGE ANALYSIS FIRST") && /PRODUCT TITLE CONTEXT: Coffee/.test(visualFirst) && !/Use this explicit product name to determine what the item is/.test(visualFirst), visualFirst);
}

const nonCoffeePaperFoodContainer = buildImagePrompt(
  {
    name: "Happy Safe Box ถุงกระดาษคราฟท์ พร้อมฝาพลาสติกใส OPS 750 ml",
    category: "บรรจุภัณฑ์อาหาร"
  },
  { ...settings, flowGenMode: "combined", presenter: "none" }
);
check(
  "paper food container does not enter the coffee pouch still branch",
  !/Create one vertical 9:16 product still for coffee pouch bag|COFFEE REFERENCE VARIANT LOCK|COFFEE REFERENCE FIRST STILL/i.test(nonCoffeePaperFoodContainer),
  nonCoffeePaperFoodContainer
);
check(
  "paper food container keeps its uploaded product as the source",
  /REFERENCE PRODUCT IDENTITY ONLY[\s\S]*Extract and reproduce only the exact physical product/i.test(nonCoffeePaperFoodContainer),
  nonCoffeePaperFoodContainer
);

const ttbPaperCupProduct = buildImagePrompt(
  {
    name: "TTB ถ้วยกระดาษคราฟท์ 500/750/1000ml พร้อมฝาใส OPS หนาพิเศษ กันน้ำ ไม่เป็นไอน้ำ Food Grade COD ส่งตรงจากโรงงาน คุณภาพพรีเมียม TTB FoodPack บรรจุภัณฑ์อาหาร",
    originalName: "TTB ถ้วยกระดาษคราฟท์ 500/750/1000ml พร้อมฝาใส OPS หนาพิเศษ กันน้ำ ไม่เป็นไอน้ำ Food Grade COD ส่งตรงจากโรงงาน คุณภาพพรีเมียม TTB FoodPack บรรจุภัณฑ์อาหาร",
    category: "บรรจุภัณฑ์อาหาร"
  },
  { ...settings, flowGenMode: "combined", presenter: "none" }
);
check(
  "TTB paper cup title resolves to a paper food container, not a coffee mug",
  /paper food container with a clear OPS lid/i.test(ttbPaperCupProduct) && !/coffee mug|coffee pouch bag|200-500g pouch/i.test(ttbPaperCupProduct),
  ttbPaperCupProduct
);
check(
  "TTB paper cup prompt prevents label artwork becoming real bowls",
  /PAPER FOOD CONTAINER FIDELITY LOCK[\s\S]*Do not turn photos or illustrations printed on the label into real bowls, food, stacks/i.test(ttbPaperCupProduct),
  ttbPaperCupProduct
);
const ttbPaperCupWithCoffeeHighlight = buildImagePrompt(
  {
    name: "TTB ถ้วยกระดาษคราฟท์ 500/750/1000ml พร้อมฝาใส OPS",
    originalName: "TTB ถ้วยกระดาษคราฟท์ 500/750/1000ml พร้อมฝาใส OPS",
    category: "บรรจุภัณฑ์อาหาร",
    highlights: "ใช้ใส่กาแฟและเครื่องดื่มร้อนได้"
  },
  { ...settings, flowGenMode: "combined", presenter: "none" }
);
check(
  "non-coffee product name blocks coffee routing even when highlights mention coffee",
  !/coffee pouch bag|coffee mug|COFFEE REFERENCE VARIANT LOCK|standard coffee\/tea bag/i.test(ttbPaperCupWithCoffeeHighlight),
  ttbPaperCupWithCoffeeHighlight
);

const hookDoesNotReplaceVisualIdentity = buildImagePrompt({
  name: "แต่งตัวยากใช่ไหม ลุคนี้ช่วยให้แมทช์ง่ายขึ้น",
  originalName: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว",
  category: "แฟชั่น"
}, settings);
check("image metadata hint uses the original title without overriding the reference", /PRODUCT TITLE CONTEXT:[^\n]*เสื้อเชิ้ตแขนยาวลายจุดสีขาว/i.test(hookDoesNotReplaceVisualIdentity), hookDoesNotReplaceVisualIdentity);
check("image identity does not use the edited hook as the requested product", !/PRODUCT NAME \/ CATEGORY LOCK:[^\n]*แต่งตัวยากใช่ไหม/i.test(hookDoesNotReplaceVisualIdentity), hookDoesNotReplaceVisualIdentity);
check("apparel still image gives the garment reference priority", /APPAREL REFERENCE PRIORITY/i.test(hookDoesNotReplaceVisualIdentity), hookDoesNotReplaceVisualIdentity);

const fashionSelfieSettings = { ...settings, videoStyle: "fashion-selfie", presenter: "Auto", cameraMovement: "Auto" };
const fashionSelfieImage = buildImagePrompt({
  name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว",
  category: "แฟชั่น"
}, fashionSelfieSettings);
const fashionSelfieVideo = buildVideoPrompt({
  name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว",
  category: "แฟชั่น"
}, fashionSelfieSettings);
check("fashion selfie image hides the model face with a phone", /FASHION SELFIE MODE[\s\S]*smartphone[\s\S]*fully cover and obscure the face/i.test(fashionSelfieImage), fashionSelfieImage);
check("fashion selfie image keeps the garment full body", /head-to-toe|full-body/i.test(fashionSelfieImage) && /exact reference garment/i.test(fashionSelfieImage), fashionSelfieImage);
check("fashion selfie video keeps the phone over the face", /FASHION SELFIE MODE[\s\S]*phone must fully cover the face/i.test(fashionSelfieVideo), fashionSelfieVideo);
check("fashion selfie video uses minimal pan movement", /slow, subtle left-to-right smartphone-camera pan/i.test(fashionSelfieVideo), fashionSelfieVideo);
check("fashion selfie video forbids face reveal and walking", /never reveal eyes, nose, mouth[\s\S]*walking, turning around/i.test(fashionSelfieVideo), fashionSelfieVideo);
check("fashion selfie Auto chooses a beautiful minimal background", /(minimalist apartment|hotel-lobby|modern apartment entryway|botanical courtyard)/i.test(fashionSelfieImage) && /FASHION SELFIE BACKGROUND QUALITY LOCK/i.test(fashionSelfieImage), fashionSelfieImage);
check("fashion selfie Auto does not fall back to a generic urban street", !/Urban Street/i.test(fashionSelfieImage + fashionSelfieVideo), fashionSelfieImage + fashionSelfieVideo);
check("fashion selfie keeps the background stable and secondary", /FASHION SELFIE BACKGROUND LOCK[\s\S]*stable, tasteful, and secondary to the garment/i.test(fashionSelfieVideo), fashionSelfieVideo);

const fashionSelfiePantsSettings = { ...fashionSelfieSettings, cameraFraming: "half_body" };
const fashionSelfiePants = { name: "กางเกงออกกำลังกายผู้ชาย", category: "เสื้อผ้า" };
const fashionSelfiePantsImage = buildImagePrompt(fashionSelfiePants, fashionSelfiePantsSettings);
const fashionSelfiePantsVideo = buildVideoPrompt(fashionSelfiePants, fashionSelfiePantsSettings);
check("fashion selfie identifies pants instead of generic clothing", /featuring pants/i.test(fashionSelfiePantsImage) && /featuring pants/i.test(fashionSelfiePantsVideo), fashionSelfiePantsImage + fashionSelfiePantsVideo);
check("fashion selfie pants adds only one complementary top", /exactly one pair[\s\S]*sole visible bottom garment[\s\S]*simple matching top/i.test(fashionSelfiePantsImage) && /exactly one pair[\s\S]*sole visible bottom garment[\s\S]*simple matching top/i.test(fashionSelfiePantsVideo), fashionSelfiePantsImage + fashionSelfiePantsVideo);
check("fashion selfie pants forces complete full-body framing", /head-to-toe|full-body/i.test(fashionSelfiePantsImage) && /head-to-toe|full-length/i.test(fashionSelfiePantsVideo) && /FASHION SELFIE COMPLETE BODY LOCK/i.test(fashionSelfiePantsVideo), fashionSelfiePantsImage + fashionSelfiePantsVideo);
const fashionSelfiePantsLowerBodySettings = { ...fashionSelfieSettings, cameraFraming: "lower_body" };
const fashionSelfiePantsLowerBodyImage = buildImagePrompt(fashionSelfiePants, fashionSelfiePantsLowerBodySettings);
const fashionSelfiePantsLowerBodyVideo = buildVideoPrompt(fashionSelfiePants, fashionSelfiePantsLowerBodySettings);
check("fashion selfie lower-body framing shows pants from waist to feet", /lower-body shot[\s\S]*framed from the waist to the feet/i.test(fashionSelfiePantsLowerBodyImage) && /lower-body shot[\s\S]*framed from the waist to the feet/i.test(fashionSelfiePantsLowerBodyVideo), fashionSelfiePantsLowerBodyImage + fashionSelfiePantsLowerBodyVideo);
check("fashion selfie lower-body framing crops out the upper body", /crop out the head and upper torso/i.test(fashionSelfiePantsLowerBodyImage) && /crop out the head and upper torso/i.test(fashionSelfiePantsLowerBodyVideo), fashionSelfiePantsLowerBodyImage + fashionSelfiePantsLowerBodyVideo);
check("fashion selfie lower-body framing does not use a selfie phone", /not a selfie[\s\S]*do not include a smartphone/i.test(fashionSelfiePantsLowerBodyImage) && /not a selfie[\s\S]*do not include a smartphone/i.test(fashionSelfiePantsLowerBodyVideo), fashionSelfiePantsLowerBodyImage + fashionSelfiePantsLowerBodyVideo);
check("fashion selfie lower-body framing uses lower-body continuity only", /LOWER-BODY GARMENT FRAME LOCK/i.test(fashionSelfiePantsLowerBodyImage) && /LOWER-BODY GARMENT FRAME LOCK/i.test(fashionSelfiePantsLowerBodyVideo) && !/FASHION SELFIE COMPLETE BODY LOCK/i.test(fashionSelfiePantsLowerBodyImage + fashionSelfiePantsLowerBodyVideo), fashionSelfiePantsLowerBodyImage + fashionSelfiePantsLowerBodyVideo);
check("fashion selfie shirt keeps one featured top and a complete body", /sole visible featured top[\s\S]*opaque, full-coverage matching bottom/i.test(fashionSelfieImage) && /FASHION SELFIE COMPLETE BODY LOCK/i.test(fashionSelfieImage), fashionSelfieImage);

const fashionSelfieFitness = buildVideoPrompt(
  { name: "กางเกงออกกำลังกายผู้ชาย", category: "เสื้อผ้า" },
  { ...fashionSelfieSettings, location: "Auto" }
);
check("fashion selfie sportswear uses a fitness background", /Bright home workout|Outdoor park fitness|modern gym|home fitness|fitness studio/i.test(fashionSelfieFitness), fashionSelfieFitness);

const fashionSelfieHalfBodySettings = { ...fashionSelfieSettings, cameraFraming: "half_body" };
const fashionSelfieHalfBodyImage = buildImagePrompt({ name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว", category: "แฟชั่น" }, fashionSelfieHalfBodySettings);
const fashionSelfieHalfBodyVideo = buildVideoPrompt({ name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว", category: "แฟชั่น" }, fashionSelfieHalfBodySettings);
check("fashion selfie image honors half-body framing", /FASHION SELFIE CAMERA FRAMING LOCK[\s\S]*medium half-body shot[\s\S]*top of the head to the waist[\s\S]*Do not show the legs or feet/i.test(fashionSelfieHalfBodyImage) && !/full-body fashion selfie image|full-body fashion photograph|full-length head-to-toe shot|stable full-body front view|stable full-body hero view/i.test(fashionSelfieHalfBodyImage), fashionSelfieHalfBodyImage);
check("fashion selfie video honors half-body framing", /FASHION SELFIE CAMERA FRAMING LOCK[\s\S]*medium half-body shot[\s\S]*top of the head to the waist[\s\S]*never switch to a full-body or head-to-toe shot/i.test(fashionSelfieHalfBodyVideo) && !/full-body fashion photograph|full-length head-to-toe shot|stable full-body front view|stable full-body hero view/i.test(fashionSelfieHalfBodyVideo), fashionSelfieHalfBodyVideo);

const fashionSelfieTextSettings = {
  ...fashionSelfieSettings,
  textEnabled: "true",
  clipText: "ลุคนี้ต้องมี",
  promotionText: "ส่งฟรี"
};
const fashionSelfieTextImage = buildImagePrompt({ name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว", category: "แฟชั่น" }, fashionSelfieTextSettings);
const fashionSelfieTextVideo = buildVideoPrompt({ name: "เสื้อเชิ้ตแขนยาวลายจุดสีขาว", category: "แฟชั่น" }, fashionSelfieTextSettings);
check("fashion selfie image includes configured text overlays", fashionSelfieTextImage.includes("ลุคนี้ต้องมี") && fashionSelfieTextImage.includes("ส่งฟรี"), fashionSelfieTextImage);
check("fashion selfie video includes configured text overlays", fashionSelfieTextVideo.includes("ลุคนี้ต้องมี") && fashionSelfieTextVideo.includes("ส่งฟรี"), fashionSelfieTextVideo);
check("fashion selfie text stays away from garment details", /away from the model's phone, face area, and garment details/i.test(fashionSelfieTextVideo), fashionSelfieTextVideo);

const mensFashionSelfieProduct = { name: "เสื้อเชิ้ตผู้ชายแขนยาว", category: "เสื้อผ้าผู้ชาย" };
const mensFashionSelfieImage = buildImagePrompt(mensFashionSelfieProduct, fashionSelfieSettings);
const mensFashionSelfieVideo = buildVideoPrompt(mensFashionSelfieProduct, fashionSelfieSettings);
check("fashion selfie auto-selects a male model for menswear image", /fictional adult Thai male fashion model/i.test(mensFashionSelfieImage) && !/fictional adult Thai female fashion model/i.test(mensFashionSelfieImage), mensFashionSelfieImage);
check("fashion selfie auto-selects a male model for menswear video", /fictional adult Thai male fashion model/i.test(mensFashionSelfieVideo) && !/fictional adult Thai female fashion model/i.test(mensFashionSelfieVideo), mensFashionSelfieVideo);

const explicitMaleFashionSelfie = buildVideoPrompt(
  { name: "เสื้อผ้าแฟชั่น", category: "แฟชั่น" },
  { ...fashionSelfieSettings, presenter: "man" }
);
check("fashion selfie respects explicit male presenter", /fictional adult Thai male fashion model/i.test(explicitMaleFashionSelfie), explicitMaleFashionSelfie);

const staleFemaleForMenswear = buildVideoPrompt(
  { name: "เสื้อผ้าสุภาพบุรุษ", category: "แฟชั่น" },
  { ...fashionSelfieSettings, presenter: "woman" }
);
check("explicit female presenter selection wins over menswear inference", /fictional adult Thai female fashion model/i.test(staleFemaleForMenswear) && !/fictional adult Thai male fashion model/i.test(staleFemaleForMenswear), staleFemaleForMenswear);

const imageDetectedMenswear = buildVideoPrompt(
  { name: "เสื้อแฟชั่น", category: "เสื้อผ้า", imageGender: "man" },
  { ...fashionSelfieSettings, presenter: "Auto" }
);
check("fashion selfie uses image-analysis gender when title is ambiguous", /fictional adult Thai male fashion model/i.test(imageDetectedMenswear), imageDetectedMenswear);

const staleTextSettings = {
  ...settings,
  textEnabled: "false",
  clipText: "รองเท้าทดสอบ",
  promotionText: "ลด 50%",
  cta: "กดซื้อเลย"
};
const staleTextVideo = buildVideoPrompt({ name: "รองเท้าทดสอบ" }, staleTextSettings);
check("disabled text ignores stale promotion and CTA", !/ลด 50%|กดซื้อเลย/.test(staleTextVideo), staleTextVideo);
const staleTextVideoStyle = staleTextVideo.match(/Visual style: ([\s\S]*?)(?=\n|$)/i)?.[1] || "";
check("text-disabled video removes conflicting style overlay instructions", !/text overlays?|text hook overlay|countdown timer graphic|bold promotion text/i.test(staleTextVideoStyle), staleTextVideoStyle);

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
check("image prompt isolates only the named product", /Extract and reproduce only the exact physical product|single product|one product/i.test(cabinetImage));
check("image prompt rejects source-scene objects", /100% NEW SCENE & BACKGROUND|ignore the original background|ignoring its original background/i.test(cabinetImage));
check("image prompt creates a new suitable background", /brand new|background that fits this product category/i.test(cabinetImage));
check("video prompt uses two scenes", /TWO-SCENE EDIT/i.test(cabinetVideo) && /Scene 1/i.test(cabinetVideo));
check("cabinet video uses a suitable interior", /Modern Living Room/i.test(cabinetVideo) && !/Urban Street/i.test(cabinetVideo));
check("image prompt stays concise", cabinetImage.length < 14000, `length=${cabinetImage.length}`);
check("video prompt stays concise", cabinetVideo.length < 21000, `length=${cabinetVideo.length}`);

// --- footwear fidelity: preserve the exact model while Auto includes a reviewer ---
const shoe = {
  name: "รองเท้าผ้าใบผู้หญิง สีขาว",
  highlights: "",
  autoOptions: { presenter: "none", cameraMovement: "Handheld Shake", location: "Urban Street" }
};
const shoeImage = buildImagePrompt(shoe, settings);
const shoeVideo = buildVideoPrompt(shoe, settings);
check("shoe prompt locks shoe-specific geometry", /toe shape[\s\S]*sole thickness[\s\S]*lace pattern/i.test(shoeImage));
check("shoe prompt uses a shoe semantic label instead of clothing", /Show sneaker shoes clearly|Show sandals clearly|Show shoes clearly/i.test(shoeImage) && !/Show clothing garment clearly/i.test(shoeImage), shoeImage);
check("shoe prompt locks pattern coordinates to the reference", /STRICT FOOTWEAR PATTERN COORDINATE LOCK[\s\S]*toe box[\s\S]*heel[\s\S]*Do not redraw/i.test(shoeImage));
check("shoe prompt preserves exact pattern orientation and asymmetry", /fixed texture map[\s\S]*motif positions[\s\S]*orientation[\s\S]*left\/right asymmetry[\s\S]*Do not redraw, mirror, rotate, simplify, recolor/i.test(shoeImage), shoeImage);
check("shoe prompt preserves single or pair count", /single-shoe\/pair count/i.test(shoeImage));
check("shoe prompt locks realistic human-foot scale", /STRICT FOOTWEAR SCALE & PLACEMENT LOCK/i.test(shoeImage) && /true foot-sized proportions/i.test(shoeImage));
check("shoe prompt uses an outdoor footwear location", /outdoor home driveway|front yard|quiet neighborhood street|park path/i.test(shoeImage + shoeVideo));
check("shoe prompt rejects oversized placement", /do not enlarge the shoe to furniture-scale/i.test(shoeImage));
check("shoe prompt rejects indoor locations", /never inside a house|bedroom|entryway|closet|shoe shelf|showroom|cafe|studio/i.test(shoeImage));
check("shoe still image has highest-priority outdoor background lock", /HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE/i.test(shoeImage) && /outdoor pavement|concrete|grass|natural daylight/i.test(shoeImage));
check("shoe still image locks grounded placement", /REALISTIC FOOTWEAR STILL PLACEMENT LOCK/i.test(shoeImage) && /sole touching the surface|soles supported by the surface/i.test(shoeImage) && /believable contact shadow/i.test(shoeImage));
check("shoe still image uses a natural footwear composition", /Single full-frame footwear .*product shot/i.test(shoeImage) && /realistic 3\/4 product angle/i.test(shoeImage) && /natural spacing/i.test(shoeImage));
check("shoe still image requires both shoes together", /MANDATORY FOOTWEAR PAIR STILL COMPOSITION/i.test(shoeImage) && /BOTH shoes/i.test(shoeImage) && /NEVER output only one shoe/i.test(shoeImage));
check("still prompt transfers product identity only", /REFERENCE PRODUCT IDENTITY ONLY[\s\S]*do NOT reproduce the source photo as a whole/i.test(shoeImage));
check("still prompt rejects copying the source scene", /do not copy the source people, pose, background, props, lighting, camera angle, framing, or layout/i.test(shoeImage));
check("still prompt requires a new composition", /create a new composition/i.test(shoeImage));
const singleShoeImage = buildImagePrompt({ name: "รองเท้าข้างเดียว", structureAdvice: "Reference shows one single shoe only." }, settings);
check("explicit single-shoe reference stays single", /exact single shoe from the reference/i.test(singleShoeImage) && !/MANDATORY FOOTWEAR PAIR STILL COMPOSITION/i.test(singleShoeImage));
check("shoe video Auto includes a reviewer", /Presenter: (?:A fictional adult Thai woman reviewer|A fictional adult Thai man reviewer)/i.test(shoeVideo));
check("shoe presenter outfit matches the footwear", /PRESENTER OUTFIT MATCH[\s\S]*exact reference footwear[\s\S]*casual streetwear or athletic wear/i.test(shoeVideo), shoeVideo);
check("shoe video Auto overrides no-person recommendation", !/No people, faces, presenters/i.test(shoeVideo));
check("shoe video overrides unstable saved camera", /Subtle Slow Zoom In/i.test(shoeVideo) && !/Handheld Shake/i.test(shoeVideo));
check("shoe prompts remain concise", shoeImage.length < 15000 && shoeVideo.length < 21000, `image=${shoeImage.length} video=${shoeVideo.length}`);

const runningShoeVideo = buildVideoPrompt(
  { name: "รองเท้าวิ่งผู้หญิง", productId: "running-activity-shoe" },
  { ...settings, presenter: "woman", productActivity: "running" }
);
check("running activity requires visible running motion", /PRODUCT USE — RUNNING[\s\S]*clearly visible natural running stride|ACTIVE RUNNING FOOTWEAR SEQUENCE/i.test(runningShoeVideo), runningShoeVideo);
check("running activity rejects standing-only movement", /Do not make the whole video standing in place|never standing-only/i.test(runningShoeVideo), runningShoeVideo);

const wearOnlyShoeVideo = buildVideoPrompt(
  { name: "รองเท้าผู้หญิง", productId: "wear-activity-shoe" },
  { ...settings, presenter: "woman", productActivity: "wear" }
);
check("wear activity keeps movement minimal", /PRODUCT USE — WEAR\/SHOW ONLY[\s\S]*mostly stable pose/i.test(wearOnlyShoeVideo), wearOnlyShoeVideo);

// --- default behavior: UGC/testimonial style + stable Auto reviewer ---
const generalReviewA = buildVideoPrompt({ name: "เครื่องชงกาแฟรุ่น A", productId: "10000001" }, settings);
const generalReviewB = buildVideoPrompt({ name: "เครื่องชงกาแฟรุ่น A", productId: "10000001" }, settings);
check("default style is UGC/testimonial", settings.videoStyle === "testimonial");
check("default video uses UGC testimonial structure", /UGC testimonial/i.test(generalReviewA));
check("testimonial structure is limited to two scenes", /Scene 2 \(Feature Showcase\)/i.test(generalReviewA) && !/- Scene 3/i.test(generalReviewA));
eq(
  "Auto reviewer is stable per product",
  generalReviewA.match(/Presenter: ([^\n.]+)/)?.[1],
  generalReviewB.match(/Presenter: ([^\n.]+)/)?.[1]
);
check("Auto reviewer is male or female", /Presenter: (?:A fictional adult Thai woman reviewer|A fictional adult Thai man reviewer)/i.test(generalReviewA));

const voiceoverReviewVideo = buildVideoPrompt(
  { name: "แก้วเก็บความเย็น", category: "เครื่องใช้ในบ้าน" },
  { ...settings, videoStyle: "review-voiceover", presenter: "woman", audioMode: "music_only" }
);
check("voiceover review style is hands-on and multi-scene", /REVIEW WITH OVERDUB SEQUENCE|Hands-On Use|Real Use/i.test(voiceoverReviewVideo) && /product being used|using .* naturally/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review style makes the product action primary", /hands-on product-use review|product and hands must dominate|Product Hook/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review does not open with a face", /face must not be the opening subject|before showing any face|never a face-to-camera intro/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review uses multiple product angles", /different practical angle|another angle|close-up during real use/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review style forbids lip movement", /never lip-sync|never move the lips|mouth closed/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review ends with a silent-presenter override", /FINAL VOICEOVER-ONLY OVERRIDE[\s\S]*NOT a talking-head or on-camera speaking video[\s\S]*mouth must remain closed and completely motionless/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review removes generic on-camera narration conflict", !/STRICT PROGRESSIVE SCENE NARRATION/i.test(voiceoverReviewVideo), voiceoverReviewVideo);
check("voiceover review style forces overdub instead of music-only", /Voiceover: Add a natural Thai off-screen voiceover/i.test(voiceoverReviewVideo) && !/INSTRUMENTAL MUSIC ONLY/i.test(voiceoverReviewVideo), voiceoverReviewVideo);

const stillMotionSettings = {
  ...settings,
  videoStyle: "still-motion",
  flowGenMode: "combined",
  presenter: "woman",
  cameraMovement: "Auto"
};
const stillMotionVideo = buildVideoPrompt({ name: "แก้วน้ำเก็บความเย็น" }, stillMotionSettings);
const stillMotionImage = buildImagePrompt({ name: "แก้วน้ำเก็บความเย็น" }, stillMotionSettings);
check("still-motion mode uses a dedicated camera-only prompt", /STILL-IMAGE MOTION MODE/i.test(stillMotionVideo) && /CAMERA MOTION ONLY/i.test(stillMotionVideo), stillMotionVideo);
check("still-motion mode uses physical lateral dolly with parallax", /PHYSICAL LEFT-RIGHT DOLLY/i.test(stillMotionVideo) && /translate the camera to the right/i.test(stillMotionVideo) && /travel left along the same path/i.test(stillMotionVideo) && /foreground-background parallax/i.test(stillMotionVideo) && /No cuts or abrupt direction changes/i.test(stillMotionVideo) && !/MULTI-ANGLE|energetic visual variety|angle transitions/i.test(stillMotionVideo), stillMotionVideo);
check("still-motion mode keeps the product stationary", /product stays completely still, rigid, and unchanged/i.test(stillMotionVideo) && /Do not rotate, slide, bounce, float, bend, resize, morph/i.test(stillMotionVideo), stillMotionVideo);
check("still-motion mode forbids hands in video and still image", /CAMERA-ONLY \/ NO-HANDS LOCK/i.test(stillMotionVideo) && /CAMERA-ONLY \/ NO-HANDS LOCK/i.test(stillMotionImage) && /zero hands/i.test(stillMotionImage), `${stillMotionVideo}\n${stillMotionImage}`);
check("still-motion mode has no review scene structure", !/- Scene 1|Scene 2|Scene 3|Presenter:/i.test(stillMotionVideo), stillMotionVideo);
check("still-motion combined still image is product-only", /No people, faces, presenters, reviewers, or characters\./i.test(stillMotionImage), stillMotionImage);

const boxedMotionSettings = {
  ...settings,
  videoStyle: "boxed-motion",
  flowGenMode: "combined",
  presenter: "woman",
  cameraMovement: "Auto"
};
const boxedMotionVideo = buildVideoPrompt({ name: "กาแฟคั่วบด", category: "ซองกาแฟ" }, boxedMotionSettings);
const boxedMotionImage = buildImagePrompt({ name: "กาแฟคั่วบด", category: "ซองกาแฟ" }, boxedMotionSettings);
check("boxed-motion mode requests an open presentation box", /BOXED PRODUCT MOTION MODE/i.test(boxedMotionVideo) && /open presentation box/i.test(boxedMotionVideo), boxedMotionVideo);
check("boxed-motion mode keeps the product and box stationary", /keep both the product and box stable/i.test(boxedMotionVideo) && /CAMERA MOTION ONLY/i.test(boxedMotionVideo), boxedMotionVideo);
check("boxed-motion mode uses multiple left-right and in-out camera angles", /MULTI-ANGLE/i.test(boxedMotionVideo) && /front hero angle[\s\S]*left three-quarter angle[\s\S]*right three-quarter angle/i.test(boxedMotionVideo) && /left-to-right/i.test(boxedMotionVideo) && /push in and pull back/i.test(boxedMotionVideo) && !/15–20° three-quarter angle/i.test(boxedMotionVideo), boxedMotionVideo);
check("boxed-motion mode adds only a fitted open box to the still", /BOXED PRODUCT REFERENCE MODE/i.test(boxedMotionImage) && /open presentation box/i.test(boxedMotionImage) && /only newly added object/i.test(boxedMotionImage), boxedMotionImage);
check("boxed-motion mode forbids hands in video and still image", /CAMERA-ONLY \/ NO-HANDS LOCK/i.test(boxedMotionVideo) && /CAMERA-ONLY \/ NO-HANDS LOCK/i.test(boxedMotionImage) && /zero hands/i.test(boxedMotionImage), `${boxedMotionVideo}\n${boxedMotionImage}`);
check("boxed-motion mode has no presenter or review structure", !/- Scene 1|Scene 2|Scene 3|Presenter:/i.test(boxedMotionVideo), boxedMotionVideo);

const boxedCarFragranceProduct = {
  name: "POLARIS | 120ml CARQIA เจลน้ำหอมปรับอากาศ น้ำหอมรถยนต์ Luxury car perfume",
  category: "เครื่องหอม"
};
const boxedCarFragranceSettings = { ...settings, videoStyle: "boxed-motion", flowGenMode: "combined", presenter: "none", location: "Auto" };
const boxedCarFragranceImage = buildImagePrompt(boxedCarFragranceProduct, boxedCarFragranceSettings);
const boxedCarFragranceVideo = buildVideoPrompt(boxedCarFragranceProduct, boxedCarFragranceSettings);
const boxedCarFragrancePrompt = `${boxedCarFragranceImage}\n${boxedCarFragranceVideo}`;
check("boxed car fragrance uses an indoor tabletop presentation", /indoor premium gift-presentation room|clean elegant tabletop/i.test(boxedCarFragrancePrompt), boxedCarFragrancePrompt);
check("boxed car fragrance does not put the gift box inside the car", !/Inside a parked luxury car|car cabin|dashboard|center console|cup-holder|air-vent/i.test(boxedCarFragrancePrompt), boxedCarFragrancePrompt);
check("boxed mode locks box fit and tabletop support", /BOXED PRESENTATION COMPOSITION LOCK/i.test(boxedCarFragrancePrompt) && /rest flat and fully supported on a real tabletop/i.test(boxedCarFragrancePrompt), boxedCarFragrancePrompt);

const autoLocationProducts = [
  { id: "camping", name: "เต็นท์แคมปิ้ง", category: "อุปกรณ์แคมปิ้ง", forbidden: /cafe|coffee shop/i, expected: /campsite|camping|forest|outdoor/i },
  { id: "fitness", name: "ยางยืดออกกำลังกาย", category: "อุปกรณ์ออกกำลังกาย", forbidden: /cafe|coffee shop/i, expected: /fitness|workout|gym|exercise/i },
  { id: "office", name: "เก้าอี้สำนักงาน", category: "เฟอร์นิเจอร์สำนักงาน", forbidden: /cafe|coffee shop|living room/i, expected: /office|workspace/i },
  { id: "bag", name: "กระเป๋าสะพาย", category: "กระเป๋าแฟชั่น", forbidden: /cafe|coffee shop/i, expected: /travel|entryway|park|bedroom/i }
];
for (const product of autoLocationProducts) {
  const autoLocationPrompt = buildVideoPrompt(product, { ...settings, videoStyle: "boxed-motion", presenter: "none", location: "Auto" });
  const locationLine = autoLocationPrompt.split("\n").find(line => /Keep the fitted open box and product/i.test(line)) || autoLocationPrompt;
  check(`Auto location fits ${product.id}`, product.expected.test(locationLine) && !product.forbidden.test(locationLine), locationLine);
}

const fragranceAutoProducts = [
  { id: "perfume", name: "น้ำหอมผู้หญิง กลิ่นดอกไม้", category: "เครื่องหอม", expected: /vanity|bedroom console|perfume display|marble|wood console/i },
  { id: "reed-diffuser", name: "ก้านหอมอโรม่า", category: "เครื่องหอมในบ้าน", expected: /home fragrance|wood console|relaxation|spa-like|entryway|bedside/i }
];
for (const product of fragranceAutoProducts) {
  const fragranceSettings = { ...settings, presenter: "none", location: "Auto", flowGenMode: "combined" };
  const fragranceImage = buildImagePrompt(product, fragranceSettings);
  const fragranceVideo = buildVideoPrompt(product, fragranceSettings);
  const combinedPrompt = `${fragranceImage}\n${fragranceVideo}`;
  const fragranceLocation = fragranceVideo.match(/Location setting:[^\n]*/i)?.[0] || "";
  check(`Auto fragrance background fits ${product.id}`, product.expected.test(combinedPrompt), combinedPrompt);
  check(
    `Auto fragrance background rejects unrelated scene ${product.id}`,
    !/Modern Bathroom|Cafe \/ Coffee Shop|Kitchen|Sports setting/i.test(fragranceLocation),
    fragranceLocation
  );
  check(`Auto fragrance prompt includes category lock ${product.id}`, /FRAGRANCE PRODUCT BACKGROUND LOCK/i.test(combinedPrompt), combinedPrompt);
}

const carFragranceProduct = {
  name: "POLARIS | 120ml CARQIA เจลน้ำหอมปรับอากาศ กลิ่นหอมทนนาน น้ำหอมรถยนต์ หรูหรา ผ่อนคลาย Luxury car perfume ของขวัญวันหยุด",
  category: "เครื่องหอม"
};
const carFragranceSettings = { ...settings, presenter: "none", location: "Auto", flowGenMode: "combined" };
const carFragranceImage = buildImagePrompt(carFragranceProduct, carFragranceSettings);
const carFragranceVideo = buildVideoPrompt(carFragranceProduct, carFragranceSettings);
const carFragranceLocation = carFragranceVideo.match(/Location setting:[^\n]*/i)?.[0] || "";
check("Car fragrance Auto background uses a real car cabin", /car cabin|car interior|dashboard|center console|cup-holder|air-vent/i.test(carFragranceLocation), carFragranceLocation);
check("Car fragrance Auto background rejects garden and home scenes", !/garden|สวน|outdoor|bedroom|vanity|bathroom|kitchen|cafe|household table/i.test(carFragranceLocation), carFragranceLocation);
check("Car fragrance prompt includes vehicle fragrance lock", /CAR FRAGRANCE BACKGROUND LOCK/i.test(`${carFragranceImage}\n${carFragranceVideo}`), `${carFragranceImage}\n${carFragranceVideo}`);

const originalNameLocationPrompt = buildVideoPrompt(
  { name: "สินค้าทั่วไป", originalName: "อุปกรณ์แคมปิ้ง เต็นท์", category: "สินค้า", autoOptions: { location: "Cafe / Coffee Shop" } },
  { ...settings, videoStyle: "boxed-motion", presenter: "none", location: "Auto" }
);
const originalNameLocationLine = originalNameLocationPrompt.split("\n").find(line => /Keep the fitted open box and product/i.test(line)) || originalNameLocationPrompt;
check("Auto location uses original product name keywords", /campsite|camping|forest|outdoor/i.test(originalNameLocationLine) && !/cafe|coffee shop/i.test(originalNameLocationLine), originalNameLocationLine);

const coffeeSceneA = buildVideoPrompt({ name: "กาแฟคั่วบด", category: "ซองกาแฟ", productId: "coffee-a" }, settings);
const coffeeSceneB = buildVideoPrompt({ name: "กาแฟคั่วบด", category: "ซองกาแฟ", productId: "coffee-b" }, settings);
const coffeeLocationA = coffeeSceneA.match(/Location setting:[^\n]*/i)?.[0] || "";
const coffeeLocationB = coffeeSceneB.match(/Location setting:[^\n]*/i)?.[0] || "";
check("Auto scene varies by product while staying coffee-compatible", coffeeLocationA !== coffeeLocationB && /café|coffee/i.test(coffeeLocationA) && /café|coffee/i.test(coffeeLocationB), `${coffeeLocationA} || ${coffeeLocationB}`);
check("Auto scene selection is stable for the same product", coffeeLocationA === (buildVideoPrompt({ name: "กาแฟคั่วบด", category: "ซองกาแฟ", productId: "coffee-a" }, settings).match(/Location setting:[^\n]*/i)?.[0] || ""));

const spokenHookProduct = {
  name: "เก้าอี้แคมป์พับได้",
  hooks: ["นั่งนานก็ยังสบาย", "สายแคมป์ต้องดูจุดนี้", "พับเก็บง่ายกว่าที่คิด"]
};
eq("spoken hook selector can choose the first analyzed hook", resolveSpokenOpeningHook(spokenHookProduct, () => 0), "นั่งนานก็ยังสบาย");
eq("spoken hook selector can choose another analyzed hook", resolveSpokenOpeningHook(spokenHookProduct, () => 0.999), "พับเก็บง่ายกว่าที่คิด");
eq(
  "spoken hook selector rejects hooks containing the product name",
  resolveSpokenOpeningHook({ ...spokenHookProduct, hooks: ["เก้าอี้แคมป์พับได้ ใช้ง่าย", "สายแคมป์ต้องดูจุดนี้"] }, () => 0),
  "สายแคมป์ต้องดูจุดนี้"
);
const spokenHookVideo = buildVideoPrompt({ ...spokenHookProduct, hooks: ["สายแคมป์ต้องดูจุดนี้"] }, settings);
check("video prompt keeps the selected hook as optional inspiration", /OPENING HOOK GUIDANCE[\s\S]*Optional inspiration: "สายแคมป์ต้องดูจุดนี้"[\s\S]*Adapt or ignore it as needed/i.test(spokenHookVideo), spokenHookVideo);
check("video prompt forbids reading the full product title aloud", /STRICT SPOKEN PRODUCT TITLE EXCLUSION[\s\S]*Never read or repeat the full product title verbatim[\s\S]*Never speak any SKU, product ID, catalog code/i.test(spokenHookVideo), spokenHookVideo);
check("video prompt lets the model choose natural wording", /The wording is up to the model/i.test(spokenHookVideo), spokenHookVideo);
const groundedSpeechVideo = buildVideoPrompt(
  { name: "เสื้อเชิ้ตลายดอก", highlights: ["ผ้าชีฟอง", "แขนพอง", "ลายจุด"] },
  settings
);
check("spoken prompt provides flexible product context", /PRODUCT-SPECIFIC SPEECH CONTEXT[\s\S]*ผ้าชีฟอง[\s\S]*แขนพอง[\s\S]*ลายจุด[\s\S]*flexible context, not a fixed script/i.test(groundedSpeechVideo), groundedSpeechVideo);
check("spoken prompt avoids unrelated or invented claims", /Avoid unrelated situations[\s\S]*exaggerated claims/i.test(groundedSpeechVideo), groundedSpeechVideo);
check("spoken prompt leaves wording to the model", /The wording is up to the model/i.test(groundedSpeechVideo), groundedSpeechVideo);
const codedTitleSpeechVideo = buildVideoPrompt(
  {
    name: "เซรั่มวิตามินซี รุ่น ABC-12345 สีทอง",
    originalName: "เซรั่มวิตามินซี รุ่น ABC-12345 สีทอง",
    productId: "987654321",
    highlights: ["เนื้อบางเบา", "ใช้ตอนเช้า"]
  },
  { ...settings, presenter: "none", flowGenMode: "video" }
);
check(
  "spoken prompt does not expose raw product titles or IDs",
  /raw product title is visual metadata only and is never a spoken phrase/i.test(codedTitleSpeechVideo)
    && /STRICT SPOKEN PRODUCT TITLE EXCLUSION/i.test(codedTitleSpeechVideo)
    && !/Internal product title for factual grounding|Product context only, never say aloud:|987654321/i.test(codedTitleSpeechVideo),
  codedTitleSpeechVideo
);
const fallbackHookSamples = Array.from({ length: 100 }, (_, index) =>
  resolveSpokenOpeningHook({ name: "สินค้าไม่มีหมวด", hooks: [] }, () => index / 100)
);
check("fallback random hooks include a problem-solution angle", fallbackHookSamples.some(hook => /ปัญหา/i.test(hook)), JSON.stringify(fallbackHookSamples));
check(
  "women product selects Thai woman reviewer",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({ name: "รองเท้าวิ่งผู้หญิง", productId: "women-shoe" }, settings))
);
check(
  "women product overrides bad AI male reviewer recommendation",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({
    name: "รองเท้าผู้หญิง สีขาว",
    productId: "women-shoe-ai-man",
    autoOptions: { presenter: "man" }
  }, settings))
);
check(
  "English women's product does not match men keyword",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({
    name: "women's white sneakers",
    productId: "english-womens-shoe",
    autoOptions: { presenter: "man" }
  }, settings))
);
check(
  "tools product selects Thai man reviewer",
  /Presenter: A fictional adult Thai man reviewer/i.test(buildVideoPrompt({ name: "สว่านไฟฟ้าสำหรับช่าง", productId: "power-drill" }, settings))
);
check(
  "AI real-reviewer recommendation is respected",
  /Presenter: A fictional adult Thai man reviewer/i.test(buildVideoPrompt({
    name: "น้ำหอมรุ่นใหม่",
    productId: "recommended-man",
    autoOptions: { presenter: "man" }
  }, settings))
);

const campChairProduct = {
  name: "เก้าอี้แคมป์พับได้",
  productId: "camp-chair-ai-woman",
  autoOptions: { presenter: "woman", location: "Modern Living Room" }
};
const campChairVideo = buildVideoPrompt(campChairProduct, settings);
const campChairImage = buildImagePrompt(campChairProduct, settings);
check("camping chair Auto overrides bad AI woman recommendation", /Presenter: A fictional adult Thai man reviewer/i.test(campChairVideo));
check("camping chair image and video keep the same male reviewer", /Presenter: A fictional adult Thai man reviewer/i.test(campChairImage));
check("camping chair uses natural seated or beside-chair interaction", /NATURAL CAMPING CHAIR USE[\s\S]*sit in it normally or stand beside it/i.test(campChairVideo), campChairVideo);
check("camping chair still uses a natural grounded pose", /Natural still composition:[\s\S]*reviewer seated normally or standing beside it/i.test(campChairImage), campChairImage);
check("camping chair still does not request generic holding", !/stands near or holds it gently/i.test(campChairImage), campChairImage);
check("camping chair does not assume a straight four-leg frame", !/strictly straight, vertical, and sturdy 4-leg/i.test(campChairVideo), campChairVideo);
check("camping chair is not described as large and heavy", !/product is large and heavy/i.test(campChairVideo), campChairVideo);
check(
  "manual presenter selection still overrides camping Auto",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt(campChairProduct, { ...settings, presenter: "woman" }))
);

const hammockProduct = {
  name: "เปลญวนผ้าแคมป์ปิ้ง",
  productId: "camping-hammock",
  autoOptions: { presenter: "woman", location: "Studio Minimal" }
};
const hammockVideo = buildVideoPrompt(hammockProduct, settings);
const hammockImage = buildImagePrompt(hammockProduct, settings);
check("camping hammock Auto selects a male reviewer", /Presenter: A fictional adult Thai man reviewer/i.test(hammockVideo));
check("hammock is identified as a camping hammock, not clothing", /camping hammock/i.test(hammockVideo) && !/holding clothing garment/i.test(hammockVideo), hammockVideo);
check("hammock is installed between natural supports", /already installed between two sturdy trees or on a proper hammock stand/i.test(hammockVideo), hammockVideo);
check("hammock still uses hammock structure instead of packaging rules", /HAMMOCK STRUCTURE FIDELITY/i.test(hammockImage) && !/UNIVERSAL PRODUCT & PACKAGING LABEL FIDELITY LOCK/i.test(hammockImage), hammockImage);
check("hammock still is attached and naturally occupied", /Install the hammock between two sturdy trees or on a proper hammock stand[\s\S]*reviewer sitting or reclining naturally/i.test(hammockImage), hammockImage);
check("camping still prompts keep fidelity lock within a safe prompt size", campChairImage.length < 12000 && hammockImage.length < 12000, `chair=${campChairImage.length} hammock=${hammockImage.length}`);
check("hammock is not forced into the wearable holding rule", !/WEARABLE PRODUCT CONTINUITY|STRICT ALWAYS-WORN RULE/i.test(hammockVideo), hammockVideo);
check("hammock is not described as a small hand-sized item", !/small hand-sized|product is a small item/i.test(hammockVideo), hammockVideo);
check("wearable products still keep continuity guidance", /WEARABLE PRODUCT CONTINUITY/i.test(buildVideoPrompt({ name: "เสื้อยืดผู้ชาย" }, settings)));

const wearablePantsVideo = buildVideoPrompt({ name: "กางเกงออกกำลังกายผู้ชาย" }, { ...settings, presenter: "wearable_crop" });
check("wearable crop mode keeps pants in a lower-body frame", /WEARABLE CLOSE-UP MODE/i.test(wearablePantsVideo) && /waist-to-ankles lower-body crop/i.test(wearablePantsVideo), wearablePantsVideo);
check("wearable crop mode hides the face and uses voiceover", /no face, head, full torso, or full-body presenter/i.test(wearablePantsVideo) && /off-screen Thai voiceover/i.test(wearablePantsVideo), wearablePantsVideo);
check("wearable crop mode prevents a third hand", /at most two anatomically connected human hands total/i.test(wearablePantsVideo) && /never a third hand/i.test(wearablePantsVideo), wearablePantsVideo);

const wearableStyleVideo = buildVideoPrompt({ name: "กางเกงออกกำลังกายผู้ชาย" }, { ...settings, videoStyle: "wearable-crop", presenter: "Auto" });
check("wearable crop video style replaces the presenter option", /WEARABLE CLOSE-UP MODE/i.test(wearableStyleVideo) && /waist-to-ankles lower-body crop/i.test(wearableStyleVideo), wearableStyleVideo);
check("wearable crop video style uses off-screen voiceover", /off-screen Thai voiceover/i.test(wearableStyleVideo), wearableStyleVideo);

const wearableShoeVideo = buildVideoPrompt({ name: "รองเท้าวิ่งผู้หญิง" }, { ...settings, presenter: "wearable_crop" });
check("wearable crop mode frames shoes on feet and lower legs", /feet-and-lower-legs crop/i.test(wearableShoeVideo), wearableShoeVideo);
const wearableShoeImage = buildImagePrompt({ name: "รองเท้าแตะผู้หญิง สีครีม" }, { ...settings, presenter: "wearable_crop", location: "Urban Street" });
check("wearable shoe still uses seated feet-only close-up framing", /SHOE WORN-ON-FEET CLOSE-UP MODE/i.test(wearableShoeImage) && /model is seated/i.test(wearableShoeImage) && /both feet stay planted flat on the floor/i.test(wearableShoeImage) && /No raised leg/i.test(wearableShoeImage), wearableShoeImage);
check("wearable shoe still respects its selected location", /SHOE WORN-ON-FEET SELECTED LOCATION LOCK[\s\S]*Urban Street/i.test(wearableShoeImage) && !/SHOE WORN-ON-FEET INDOOR BACKGROUND LOCK/i.test(wearableShoeImage) && !/HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE/i.test(wearableShoeImage), wearableShoeImage);
check("wearable shoe video keeps a seated grounded pose with subtle foot movement", /SHOE WORN-ON-FEET VIDEO MODE/i.test(wearableShoeVideo) && /model remains seated/i.test(wearableShoeVideo) && /both feet planted flat on the floor/i.test(wearableShoeVideo) && /subtle natural foot movement|SUBTLE FOOT MOVEMENT ONLY/i.test(wearableShoeVideo) && /No raised leg/i.test(wearableShoeVideo), wearableShoeVideo);
const selectedShoeImage = buildImagePrompt({ name: "รองเท้าแตะผู้หญิง สีครีม" }, { ...settings, presenter: "none", location: "Modern Living Room" });
const selectedShoeVideo = buildVideoPrompt({ name: "รองเท้าแตะผู้หญิง สีครีม" }, { ...settings, presenter: "wearable_crop", location: "Modern Living Room" });
check("explicit shoe location overrides the outdoor default in stills", /SELECTED BACKGROUND LOCATION LOCK[\s\S]*Modern Living Room/i.test(selectedShoeImage) && !/HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE/i.test(selectedShoeImage), selectedShoeImage);
check("explicit shoe location reaches the video prompt", /Location setting:[\s\S]*Modern Living Room/i.test(selectedShoeVideo) && /SHOE WORN-ON-FEET SELECTED LOCATION LOCK[\s\S]*Modern Living Room/i.test(selectedShoeVideo) && !/Location setting:[\s\S]*Modern Bathroom/i.test(selectedShoeVideo), selectedShoeVideo);
const autoCreamShoeVideo = buildVideoPrompt({ name: "รองเท้าแตะผู้หญิง สีครีม" }, { ...settings, presenter: "wearable_crop", location: "Auto" });
check("shoe color word does not trigger the bathroom location classifier", !/Location setting:[\s\S]*Modern Bathroom/i.test(autoCreamShoeVideo), autoCreamShoeVideo);

const wearableBraceletVideo = buildVideoPrompt({ name: "สร้อยข้อมือเงินแท้" }, { ...settings, presenter: "wearable_crop" });
check("wearable crop mode frames bracelets on the wrist", /wrist-and-hand or forearm crop/i.test(wearableBraceletVideo), wearableBraceletVideo);

const wearableGloveVideo = buildVideoPrompt({ name: "ถุงมือกันบาด" }, { ...settings, presenter: "wearable_crop" });
check("wearable crop mode frames gloves on the hand", /wrist-and-hand or forearm crop/i.test(wearableGloveVideo), wearableGloveVideo);

// Child presenter age-group auto detection tests — Auto mode MUST pick parents (woman/man)
check(
  "baby product name in Auto presenter mode falls back to parent (woman) presenter",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({ name: "นมผงเด็กแรกเกิด", productId: "baby-milk" }, settings))
);
check(
  "toddler product name in Auto presenter mode falls back to parent (woman) presenter",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({ name: "ห่วงยางเด็กหัดเดินเตาะแตะ", productId: "toddler-ring" }, settings))
);
check(
  "older child product name in Auto presenter mode selects parent (woman) presenter",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({ name: "กระเป๋านักเรียนประถมเด็กโต", productId: "older-child-bag" }, settings))
);
check(
  "general child/toy product name in Auto presenter mode selects parent (woman) presenter",
  /Presenter: A fictional adult Thai woman reviewer/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "child-toy" }, settings))
);
check(
  "explicit older_child mode selects older_child presenter",
  /Presenter: A cute Thai older child \(7-12 years old, kid\)/i.test(buildVideoPrompt({ name: "กระเป๋านักเรียนประถมเด็กโต", productId: "older-child-bag" }, { ...settings, presenter: "older_child" }))
);
check(
  "explicit child mode selects child presenter",
  /Presenter: A cute young Thai child \(4-6 years old, kindergarten age/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "child-toy" }, { ...settings, presenter: "child" }))
);
const combinedChildImage = buildImagePrompt(
  { name: "ของเล่นเด็ก 4 ขวบ", productId: "combined-child-toy" },
  { ...settings, flowGenMode: "combined", presenter: "child" }
);
check(
  "combined mode keeps explicit child presenter in the reference image",
  /KIDS PRODUCT SCENE WITH CHILD & PARENT SUPERVISION/i.test(combinedChildImage) && !/No people, faces, presenters/i.test(combinedChildImage),
  combinedChildImage
);
const combinedOlderChildImage = buildImagePrompt(
  { name: "กระเป๋านักเรียนเด็กโต", productId: "combined-older-child" },
  { ...settings, flowGenMode: "combined", presenter: "older_child" }
);
check(
  "combined mode keeps explicit older child presenter in the reference image",
  /KIDS PRODUCT SCENE WITH CHILD & PARENT SUPERVISION/i.test(combinedOlderChildImage) && !/No people, faces, presenters/i.test(combinedOlderChildImage),
  combinedOlderChildImage
);
check(
  "video prompt explicitly locks the selected child mode",
  /EXPLICIT CHILD PRESENTER MODE:[\s\S]*Do NOT replace the child with an adult-only presenter/i.test(buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "explicit-child-lock" }, { ...settings, presenter: "child" })),
  buildVideoPrompt({ name: "ของเล่นเด็ก 4 ขวบ", productId: "explicit-child-lock" }, { ...settings, presenter: "child" })
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

const childRaincoatVideo = buildVideoPrompt(
  { name: "【Oucefi】เสื้อกันฝน สำหรับเด็กลายการ์ตูนหลากหลายสีสันสดใส", category: "เสื้อผ้า", productId: "child-raincoat" },
  { ...settings, presenter: "child", flowGenMode: "combined", videoStyle: "testimonial" }
);
const childRaincoatImage = buildImagePrompt(
  { name: "【Oucefi】เสื้อกันฝน สำหรับเด็กลายการ์ตูนหลากหลายสีสันสดใส", category: "เสื้อผ้า", productId: "child-raincoat-image" },
  { ...settings, presenter: "child", flowGenMode: "combined" }
);
check(
  "raincoat video uses an outdoor rainy location",
  /Location setting:[^\n]*Safe outdoor rainy setting[^\n]*never indoors/i.test(childRaincoatVideo)
    && !/Location setting:[^\n]*(?:studio|room|bedroom|nursery|cafe)/i.test(childRaincoatVideo),
  childRaincoatVideo
);
check(
  "raincoat image uses an outdoor rainy location",
  /RAINWEAR OUTDOOR USE LOCK:[\s\S]*outdoors[\s\S]*Never place rainwear in an indoor room/i.test(childRaincoatImage),
  childRaincoatImage
);
check(
  "still image locks patterns to the uploaded reference",
  /REFERENCE PIXEL ARTWORK LOCK:[\s\S]*Preserve only the product's visible physical pattern[\s\S]*Ignore surrounding overlay text/i.test(childRaincoatImage),
  childRaincoatImage
);
check(
  "combined child clothing still stays product-only for design fidelity",
  /No people, faces, presenters, reviewers, or characters\./i.test(childRaincoatImage),
  childRaincoatImage
);
check(
  "raincoat auto location is not an indoor studio",
  !/Location setting:[^\n]*(?:studio|room|bedroom|nursery|cafe)/i.test(childRaincoatVideo),
  childRaincoatVideo
);
check(
  "child clothing prompt uses supervised child garment direction",
  /CHILD GARMENT USE:[\s\S]*parent stays nearby/i.test(childRaincoatVideo),
  childRaincoatVideo
);
check(
  "child clothing prompt removes adult-model contradiction",
  !/APPAREL MODEL SAFETY|APPAREL WEARING MODE: The .*adult model|adult commercial fit model/i.test(childRaincoatVideo),
  childRaincoatVideo
);
check(
  "child clothing prompt stays below the compact video limit",
  childRaincoatVideo.length < 20000,
  `length=${childRaincoatVideo.length}`
);

for (const presenter of ["woman", "man"]) {
  const selectedAdultKidsImage = buildImagePrompt(
    { name: "ของเล่นเด็ก 4 ขวบ", productId: `manual-${presenter}-kids-product` },
    { ...settings, presenter }
  );
  const selectedAdultKidsVideo = buildVideoPrompt(
    { name: "ของเล่นเด็ก 4 ขวบ", productId: `manual-${presenter}-kids-product` },
    { ...settings, presenter }
  );
  check(
    `manual ${presenter} image presenter excludes child scene for kids product`,
    /EXPLICIT ADULT PRESENTER LOCK/i.test(selectedAdultKidsImage)
      && !/KIDS PRODUCT SCENE WITH CHILD|MULTI-PERSON HAND ANATOMY/i.test(selectedAdultKidsImage),
    selectedAdultKidsImage
  );
  check(
    `manual ${presenter} video presenter excludes child scene for kids product`,
    /EXPLICIT ADULT PRESENTER LOCK/i.test(selectedAdultKidsVideo)
      && !/KIDS PRODUCT SCENE WITH CHILD|MULTI-PERSON HAND ANATOMY|one child and one parent\/guardian/i.test(selectedAdultKidsVideo)
      && /Use exactly one single consistent presenter throughout the entire video/i.test(selectedAdultKidsVideo),
    selectedAdultKidsVideo
  );
}




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

const policySafeCustomPresenter = buildVideoPrompt(
  { name: "เสื้อเชิ้ตผู้หญิง", productId: "policy-custom" },
  { ...settings, presenter: "กรอกเอง", customPresenter: "looks like Lisa BLACKPINK, wearing a white shirt" }
);
check("custom presenter likeness request is neutralized", /a fictional adult commercial model/i.test(policySafeCustomPresenter) && !/Lisa|BLACKPINK|looks like/i.test(policySafeCustomPresenter), policySafeCustomPresenter);

// --- auto presenter/location inference by category (beauty -> reviewer) ---
const vidBeauty = buildVideoPrompt({ name: "เซรั่มหน้าใส วิตามินซี", highlights: "" }, settings);
check("beauty auto-selects a presenter line", /Presenter:/i.test(vidBeauty));
check("beauty presenter outfit matches the beauty category", /PRESENTER OUTFIT MATCH[\s\S]*polished, elegant, modest beauty-review attire/i.test(vidBeauty), vidBeauty);

// --- formatPrice ---
const fp = formatPrice({ price: 2990, currency: "THB" });
check("formatPrice non-empty", typeof fp === "string" && fp.length > 0, `fp=${fp}`);

// --- normalizeHashtags dedup + cap ---
eq("normalizeHashtags dedup+cap", normalizeHashtags(["#a", "#a", "#b", "#c", "#d", "#e", "#f"], 3), ["#a", "#b", "#c"]);
eq("normalizeHashtags removes repeated hash prefixes", normalizeHashtags(["##TikTokShop", "###ของดีบอกต่อ"]), ["#TikTokShop", "#ของดีบอกต่อ"]);
eq("normalizeHashtags removes the malformed TikTokShop tag", normalizeHashtags(["##TikTokShp", "#ของดีบอกต่อ"]), ["#ของดีบอกต่อ"]);
eq("normalizeHashtags canonicalizes the valid TikTokShop tag", normalizeHashtags(["#tiktokshop"]), ["#TikTokShop"]);
eq("normalizeHashtags splits space-separated tags", normalizeHashtags("##TikTokShop #ของดีบอกต่อ"), ["#TikTokShop", "#ของดีบอกต่อ"]);
eq("normalizeHashtags handles mixed comma and space input", normalizeHashtags("##Tiktok, ###ขายดี #ของดี"), ["#Tiktok", "#ขายดี", "#ของดี"]);
check("normalizeHashtags never outputs repeated hash prefixes", normalizeHashtags(["##Tiktok", "###ขายดี"]).every((tag) => !/^##/.test(tag)));

// --- omni-flash: multi-scene description ---
const omniSettings = { ...settings, videoModel: "omni-flash", videoStyle: "sales" };
const omniVid = buildVideoPrompt({ name: "เครื่องปั่นน้ำผลไม้", highlights: "" }, omniSettings);
check("omni-flash video prompt requests two scenes", /TWO-SCENE EDIT/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 1", /Scene 1/i.test(omniVid), omniVid);
check("omni-flash video prompt has Scene 2", /Scene 2/i.test(omniVid), omniVid);
check("omni-flash video prompt is limited to Scene 1 and Scene 2", /Scene 2/i.test(omniVid) && !/- Scene 3/i.test(omniVid), omniVid);
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

const rice14Kg = { name: "ข้าวสารหอมมะลิ กระสอบ 14 กิโลกรัม" };
const rice14KgImage = buildImagePrompt(rice14Kg, settings);
const rice14KgVideo = buildVideoPrompt(rice14Kg, settings);
check("14kg rice sack keeps the exact stated weight in the image prompt", /STRICT WEIGHT & PACKAGE SIZE LOCK[\s\S]*weighs 14kg[\s\S]*Do NOT depict it as a 5kg, 1kg/i.test(rice14KgImage), rice14KgImage);
check("14kg rice sack keeps substantial physical scale in the image prompt", /substantial heavy package, not a small retail pouch/i.test(rice14KgImage), rice14KgImage);
check("14kg rice sack keeps the exact stated weight in the video prompt", /STRICT WEIGHT & PACKAGE SIZE LOCK[\s\S]*weighs 14kg[\s\S]*Do NOT depict it as a 5kg, 1kg/i.test(rice14KgVideo), rice14KgVideo);

const lightSoap = { name: "สบู่ก้อน 100 กรัม" };
const lightSoapImage = buildImagePrompt(lightSoap, settings);
check("light product soap 100g not detected as heavy", !/Real scale./i.test(lightSoapImage), lightSoapImage);

// --- image prompt presenter tests ---
const imgPresenterWoman = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "woman" });
check("image prompt with woman presenter focuses on product hero presentation", /Product Hero Focus|Product Focus|Product photography/i.test(imgPresenterWoman), imgPresenterWoman);
check("image prompt with woman presenter uses single full-frame product intro", /one authentic full-frame smartphone photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterWoman), imgPresenterWoman);
check("image prompt with one presenter forbids a third hand", /SINGLE-PRESENTER HAND ANATOMY[\s\S]*Never render a third hand/i.test(imgPresenterWoman), imgPresenterWoman);
check("image prompt locks explicit woman presenter selection", /HIGHEST PRIORITY EXPLICIT PRESENTER GENDER LOCK[\s\S]*selected a woman presenter[\s\S]*Never substitute a man/i.test(imgPresenterWoman), imgPresenterWoman);

const halfBodySettings = { ...settings, presenter: "woman", cameraFraming: "half_body" };
const imgHalfBody = buildImagePrompt({ name: "ลิปสติก" }, halfBodySettings);
const vidHalfBody = buildVideoPrompt({ name: "ลิปสติก" }, halfBodySettings);
check("half-body image framing is applied to the presenter", /CAMERA FRAMING LOCK[\s\S]*medium half-body shot[\s\S]*top of the head to the waist[\s\S]*product clearly visible/i.test(imgHalfBody), imgHalfBody);
check("half-body video framing is applied to the presenter", /CAMERA FRAMING LOCK[\s\S]*medium half-body shot[\s\S]*top of the head to the waist[\s\S]*Do not show the legs or feet/i.test(vidHalfBody), vidHalfBody);
check("half-body framing does not apply to hands-only mode", !/CAMERA FRAMING LOCK/i.test(buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only", cameraFraming: "half_body" })));

const imgPresenterNone = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "none" });
check("image prompt with no presenter forbids people", /No people, faces/i.test(imgPresenterNone), imgPresenterNone);
check("image prompt with no presenter uses single full-frame product intro", /one authentic full-frame smartphone photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterNone), imgPresenterNone);
check("image prompt with no presenter has no positive presenter references", !/relative to the presenter|with a presenter/i.test(imgPresenterNone), imgPresenterNone);

const imgPresenterCustom = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "กรอกเอง", customPresenter: "ชายสูงวัยใจดีสวมแว่นตา" });
check("image prompt with custom presenter without modelRefImage maintains clean product focus", /Product Hero Focus|Product Focus|Product photography/i.test(imgPresenterCustom), imgPresenterCustom);

const imgPresenterHands = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only" });
check("image prompt with hands_only presenter shows hands", /realistic hands|first-person POV/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only presenter uses single full-frame product intro", /one authentic full-frame smartphone photograph|single full-frame authentic smartphone camera photograph/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only uses scale relative to hands", /relative to the hands|relative to the surroundings/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only requires exactly one hand", /SINGLE-HAND LOCK FOR HANDS-ONLY MODE[\s\S]*Never show a second hand/i.test(imgPresenterHands), imgPresenterHands);
check("image prompt with hands_only strictly forbids faces", /FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(imgPresenterHands) && !/deformed|mutated/i.test(imgPresenterHands), imgPresenterHands);

const vidPresenterNone = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "none" });
check("video prompt with no presenter has no positive presenter/person references", !/relative to the presenter|on-screen presenter|presenter's character/i.test(vidPresenterNone), vidPresenterNone);

const vidPresenterWoman = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "woman" });
check("video prompt with one presenter forbids a third hand", /SINGLE-PRESENTER HAND ANATOMY[\s\S]*Never render a third hand/i.test(vidPresenterWoman), vidPresenterWoman);
check("video prompt locks explicit woman presenter selection", /HIGHEST PRIORITY EXPLICIT PRESENTER GENDER LOCK[\s\S]*selected a woman presenter[\s\S]*Never substitute a man/i.test(vidPresenterWoman), vidPresenterWoman);

const vidPresenterHands = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "hands_only" });
check("video prompt with hands_only uses scale relative to hands", /relative to the hands/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only requires exactly one hand", /HANDS-ONLY SIMPLE HOLDING MOTION LOCK[\s\S]*exactly one hand[\s\S]*never show a second hand/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only globally locks one hand across all scenes", /GLOBAL SINGLE-HAND LOCK FOR THE ENTIRE HANDS-ONLY VIDEO[\s\S]*exactly one natural human hand total[\s\S]*Never add a second hand/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only strictly forbids faces", /STRICTLY FORBIDDEN: Do not show any face|FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(vidPresenterHands) && !/deformed|mutated/i.test(vidPresenterHands), vidPresenterHands);
check("video prompt with hands_only keeps movement to a simple hold and slight turn", /HANDS-ONLY SIMPLE HOLDING MOTION LOCK[\s\S]*move it gently a short distance left and right[\s\S]*one small natural partial turn/i.test(vidPresenterHands) && /Do not open, use, shake, swing, toss, repeatedly rotate/i.test(vidPresenterHands), vidPresenterHands);

const handsOnlyStyleVideo = buildVideoPrompt(
  { name: "แก้วเก็บความเย็น", category: "เครื่องใช้ในบ้าน" },
  { ...settings, videoStyle: "hands-only", presenter: "woman", flowGenMode: "video" }
);
const handsOnlyStyleImage = buildImagePrompt(
  { name: "แก้วเก็บความเย็น", category: "เครื่องใช้ในบ้าน" },
  { ...settings, videoStyle: "hands-only", presenter: "woman", flowGenMode: "combined" }
);
check("hands-only style forces exactly one hand", /HANDS-ONLY VIDEO STYLE LOCK[\s\S]*Exactly one hand only/i.test(handsOnlyStyleVideo) && /GLOBAL SINGLE-HAND LOCK FOR THE ENTIRE HANDS-ONLY VIDEO/i.test(handsOnlyStyleVideo), handsOnlyStyleVideo);
check("hands-only style ignores the selected woman presenter", !/fictional adult Thai woman reviewer|adult Thai woman reviewer/i.test(handsOnlyStyleVideo), handsOnlyStyleVideo);
check("hands-only style uses a simple two-scene holding sequence", /Scene 1 \(Hold\)[\s\S]*Scene 2 \(Gentle Move\)/i.test(handsOnlyStyleVideo) && !/- Scene 3/i.test(handsOnlyStyleVideo) && /Do not open, use, shake, swing, toss, repeatedly rotate/i.test(handsOnlyStyleVideo), handsOnlyStyleVideo);
check("hands-only style also reaches the combined still prompt with one hand", /realistic hands|first-person POV/i.test(handsOnlyStyleImage) && /FIRST-PERSON POV FACE EXCLUSION/i.test(handsOnlyStyleImage) && /STILL IMAGE SINGLE-HAND LOCK[\s\S]*exactly one natural human hand total/i.test(handsOnlyStyleImage), handsOnlyStyleImage);

const legacyHandsOnlyAutoVideo = buildVideoPrompt(
  { name: "แก้วเก็บความเย็น", category: "เครื่องใช้ในบ้าน", autoOptions: { videoStyle: "review", presenter: "hands_only" } },
  { ...settings, videoStyle: "Auto", presenter: "Auto" }
);
check("legacy hands_only auto recommendation migrates to hands-only style", /HANDS-ONLY VIDEO STYLE LOCK/i.test(legacyHandsOnlyAutoVideo), legacyHandsOnlyAutoVideo);

const vidPresenterUnboxingHands = buildVideoPrompt({ name: "ลิปสติก" }, { ...settings, presenter: "unboxing_hands" });
const imgPresenterUnboxingHands = buildImagePrompt({ name: "ลิปสติก" }, { ...settings, presenter: "unboxing_hands" });
check("unboxing still uses two hands without single-hand conflict", /UNBOXING TWO-HAND LOCK/i.test(imgPresenterUnboxingHands) && !/SINGLE-HAND LOCK/i.test(imgPresenterUnboxingHands), imgPresenterUnboxingHands);
check("video prompt with unboxing_hands uses hands-only unboxing presenter mode", /STRICT HANDS-ONLY UNBOXING PRESENTER MODE/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("video prompt with unboxing_hands opens box and reveals product", /opening a shipping box|opening the product box/i.test(vidPresenterUnboxingHands) && /revealing the exact target product inside the box|reveals the exact product inside the box/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("video prompt with unboxing_hands strictly forbids face and full person", /No face, head, torso, full body/i.test(vidPresenterUnboxingHands) && /FIRST-PERSON POV FACE EXCLUSION|No full face/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("unboxing video uses two hands without single-hand conflict", /UNBOXING TWO-HAND LOCK/i.test(vidPresenterUnboxingHands) && !/SINGLE-HAND LOCK/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("unboxing preserves source state and gives the revealed product most screen time", /never close an already-open box/i.test(vidPresenterUnboxingHands) && /remaining 60%/i.test(vidPresenterUnboxingHands) && /removed materials remain where placed/i.test(vidPresenterUnboxingHands) && !/Scene 3|Scene 4|hands lifting or presenting/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);
check("unboxing source is a visible product photograph instead of video steps", /UNBOXING SOURCE FRAME/i.test(imgPresenterUnboxingHands) && /product visibly supported/i.test(imgPresenterUnboxingHands) && !/MANDATORY UNBOXING ACTION SEQUENCE/i.test(imgPresenterUnboxingHands), imgPresenterUnboxingHands);


const childHandsImage = buildImagePrompt({ name: "จักรยานเด็ก" }, settings);
const childHandsVideo = buildVideoPrompt({ name: "จักรยานเด็ก" }, settings);
check("child and parent still uses per-person hand anatomy", /MULTI-PERSON HAND ANATOMY[\s\S]*Never give any person a third hand/i.test(childHandsImage), childHandsImage);
check("child and parent video uses per-person hand anatomy", /MULTI-PERSON HAND ANATOMY[\s\S]*Never give any person a third hand/i.test(childHandsVideo), childHandsVideo);
check("child video keeps exactly one child and one parent", /exactly two consistent people: one child and one parent\/guardian/i.test(childHandsVideo), childHandsVideo);

const imgTextEnabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "เย็นสบาย", promotionText: "ลด 50%" });
check("image prompt with text enabled shows only clipText phrase", /Place ONLY this single short Thai phrase/i.test(imgTextEnabled) && /เย็นสบาย/i.test(imgTextEnabled), imgTextEnabled);
check("image prompt with text enabled does NOT include product name or promotion in overlay", !/ลด 50%/i.test(imgTextEnabled) && !/พัดลมไร้สาย.*overlay/i.test(imgTextEnabled), imgTextEnabled);

const imgTextEnabledName = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: true, clipText: "", promotionText: "ลด 50%" });
check("image prompt with text enabled but no clipText lets Flow choose text", /Creatively add ONE short cute Thai phrase/i.test(imgTextEnabledName) || /No added text/i.test(imgTextEnabledName), imgTextEnabledName);

const imgTextDisabled = buildImagePrompt({ name: "พัดลมไร้สาย" }, { ...settings, textEnabled: false });
check("image prompt with text disabled uses TEXT_FREE_DIRECTION", /STRICT NO-TEXT RULE/i.test(imgTextDisabled), imgTextDisabled);

// --- small bag/coffee pouch scale tests ---
const coffeeProduct = { name: "ถุงกาแฟ 250 กรัม" };
const coffeeImage = buildImagePrompt(coffeeProduct, settings);
const coffeeVideo = buildVideoPrompt(coffeeProduct, settings);
check("coffee 250g image prompt infers hand-held package scale from name and image", /PACKAGE SCALE FROM NAME \+ IMAGE:[\s\S]*stated weight\/capacity[\s\S]*normal retail package size relative to the person's hand/i.test(coffeeImage), coffeeImage);
check("coffee 250g video prompt infers hand-held package scale from name and image", /PACKAGE SCALE FROM NAME \+ IMAGE:[\s\S]*stated weight\/capacity[\s\S]*normal retail package size relative to the person's hand/i.test(coffeeVideo), coffeeVideo);
const groundCoffeeImage = buildImagePrompt({ name: "กาแฟผงคั่วบด 200 กรัม" }, settings);
const groundCoffeeVideo = buildVideoPrompt({ name: "กาแฟผงคั่วบด 200 กรัม" }, settings);
check("ground coffee name maps to coffee powder", /ground coffee powder/i.test(groundCoffeeImage) && /ground coffee powder/i.test(groundCoffeeVideo), groundCoffeeImage + groundCoffeeVideo);
check("ground coffee prompt forbids whole beans", /STRICT COFFEE POWDER FORM LOCK[\s\S]*not whole coffee beans[\s\S]*Do not show whole roasted coffee beans/i.test(groundCoffeeImage + groundCoffeeVideo), groundCoffeeImage + groundCoffeeVideo);
const packagedGroundCoffeeImage = buildImagePrompt({ name: "กาแฟคั่วบด Arabica 200 กรัม" }, settings);
check("packaged ground coffee keeps the sealed pouch as the hero", /sealed printed coffee pouch bag containing ground coffee powder/i.test(packagedGroundCoffeeImage) && /STRICT SEALED COFFEE POUCH IDENTITY LOCK[\s\S]*must remain fully closed/i.test(packagedGroundCoffeeImage) && !/Show ground coffee powder clearly at realistic scale/i.test(packagedGroundCoffeeImage), packagedGroundCoffeeImage);
const teaCoffeePouchVideo = buildVideoPrompt(
  { name: "ซองชากาแฟ", category: "ซองชา/กาแฟ" },
  { ...settings, flowGenMode: "video", presenter: "none" }
);
check(
  "tea/coffee pouch video treats the uploaded front artwork as a rigid texture map",
  /COFFEE\/TEA POUCH ARTWORK STABILITY LOCK[\s\S]*rigid printed texture map[\s\S]*must not bend, melt, stretch, drift, reflow, morph/i.test(teaCoffeePouchVideo),
  teaCoffeePouchVideo
);
check(
  "tea/coffee pouch video does not assume a generic black valve pouch",
  /flat sachet, stand-up pouch, side-gusset bag, zipper pouch, valve pouch[\s\S]*do not assume a generic coffee-bag shape/i.test(teaCoffeePouchVideo),
  teaCoffeePouchVideo
);
const wholeBeanVideo = buildVideoPrompt({ name: "เมล็ดกาแฟคั่ว 200 กรัม" }, settings);
check("whole coffee bean name maps to whole roasted beans", /whole roasted coffee beans/i.test(wholeBeanVideo), wholeBeanVideo);
check("whole coffee prompt forbids ground powder", /STRICT WHOLE COFFEE BEANS FORM LOCK[\s\S]*not ground coffee powder[\s\S]*Do not show ground coffee powder/i.test(wholeBeanVideo), wholeBeanVideo);
const angryBearsCoffeeImage = buildImagePrompt({ name: "ANGRY BEARS COFFEE 100% ARABICA GRADE B DOI CHANG" }, settings);
check("angry bears coffee image prompt includes coffee pouch fidelity", /STRICT COFFEE\/TEA POUCH & PRINTED LABEL FIDELITY LOCK/i.test(angryBearsCoffeeImage), angryBearsCoffeeImage);
check("angry bears coffee image prompt includes label exact copy mandate", /ABSOLUTE LABEL & COLOR FIDELITY MANDATE/i.test(angryBearsCoffeeImage), angryBearsCoffeeImage);
check("angry bears coffee image prompt includes exact color lock", /STRICT COLOR REPRODUCTION LOCK/i.test(angryBearsCoffeeImage), angryBearsCoffeeImage);

const multiSceneVideo = buildVideoPrompt(
  { name: "5 กก ข้าวเหนียวเขี้ยวงู ตรานกกระเรียนทอง" },
  { ...settings, videoStyle: "review", duration: 8 }
);
check(
  "video prompt mandates two controlled scenes",
  /MANDATORY TWO-SCENE EDIT:[\s\S]*exactly 2 scenes[\s\S]*hard cut near 4s[\s\S]*No extra cuts/i.test(multiSceneVideo),
  multiSceneVideo
);

const phoneCaseStill = buildImagePrompt({ name: "เคสโทรศัพท์ลายดอกไม้ iPhone" }, settings);
check(
  "specialized phone-case still also uses the universal no-redraw surface lock",
  /EDIT THE UPLOADED PRODUCT, DO NOT REGENERATE IT:[\s\S]*same uploaded item/i.test(phoneCaseStill),
  phoneCaseStill
);

// --- liquid capacity and tabletop composition scale tests ---
const serum100mlImage = buildImagePrompt(
  { name: "เซรั่มบำรุงผิว 100 ml", category: "สกินแคร์" },
  { ...settings, flowGenMode: "combined", presenter: "none" }
);
const serum100mlVideo = buildVideoPrompt(
  { name: "เซรั่มบำรุงผิว 100 ml", category: "สกินแคร์" },
  { ...settings, flowGenMode: "video", presenter: "none" }
);
check(
  "100ml image prompt uses the real-world scale instruction",
  /100ml|100 ml/i.test(serum100mlImage)
    && /REAL-WORLD SCALE & PLACEMENT LOCK/i.test(serum100mlImage)
    && /Analyze the product name.*uploaded product image together/i.test(serum100mlImage)
    && /capacity\/weight\/dimensions are facts|capacity, weight, and dimensions are facts|capacity, weight, and dimensions as facts/i.test(serum100mlImage),
  serum100mlImage
);
check(
  "100ml image prompt keeps the tabletop/background proportionate",
  /surrounding surface and background depth|surface and background depth|medium framing with breathing room/i.test(serum100mlImage)
    && /never use macro framing|let the product\/table fill the frame|let the product or table fill the frame/i.test(serum100mlImage),
  serum100mlImage
);
check(
  "100ml video prompt uses the real-world scale instruction",
  /100ml|100 ml/i.test(serum100mlVideo)
    && /REAL-WORLD SCALE & PLACEMENT LOCK/i.test(serum100mlVideo)
    && /Analyze the product name.*uploaded product image together/i.test(serum100mlVideo)
    && /capacity\/weight\/dimensions are facts|capacity, weight, and dimensions are facts|capacity, weight, and dimensions as facts/i.test(serum100mlVideo),
  serum100mlVideo
);
check(
  "100ml video prompt keeps the tabletop/background proportionate",
  /surrounding surface and background depth|surface and background depth|medium framing with breathing room/i.test(serum100mlVideo)
    && /never use macro framing|let the product\/table fill the frame|let the product or table fill the frame/i.test(serum100mlVideo),
  serum100mlVideo
);
check(
  "100ml prompts keep the background secondary and do not force props",
  /product sharp and the background naturally soft\/blurred as secondary visual context|Keep product sharp; background soft\/blurred and secondary/i.test(`${serum100mlImage}\n${serum100mlVideo}`)
    && /do not force identifiable props or fill the scene with category objects|no forced props or category clutter|without forced props/i.test(`${serum100mlImage}\n${serum100mlVideo}`),
  `${serum100mlImage}\n${serum100mlVideo}`
);
check(
  "100ml prompts keep the product as the hero without changing physical size",
  /Product is the hero:[\s\S]*use focus[\s\S]*not resizing/i.test(`${serum100mlImage}\n${serum100mlVideo}`),
  `${serum100mlImage}\n${serum100mlVideo}`
);
check(
  "100ml prompts choose the smaller plausible scale when uncertain",
  /when uncertain, choose the smaller plausible scale/i.test(`${serum100mlImage}\n${serum100mlVideo}`),
  `${serum100mlImage}\n${serum100mlVideo}`
);
check(
  "held products fit the holder's hand",
  /especially the holder's hand[\s\S]*If held, fit it naturally to the hand; never make it oversized/i.test(`${serum100mlImage}\n${serum100mlVideo}`),
  `${serum100mlImage}\n${serum100mlVideo}`
);

// --- small tech accessory scale tests ---
const mouseProduct = { name: "ไร้สาย Gaming Mouse RGB", category: "computer accessory" };
const mouseImage = buildImagePrompt(mouseProduct, settings);
const mouseVideo = buildVideoPrompt(mouseProduct, settings);
check("mouse image prompt has strict small tech accessory scale lock", /STRICT SMALL TECH ACCESSORY SCALE LOCK/i.test(mouseImage) && /mouse is about palm-sized/i.test(mouseImage), mouseImage);
check("mouse video prompt has strict small tech accessory scale lock", /STRICT SMALL TECH ACCESSORY SCALE LOCK/i.test(mouseVideo) && /do not enlarge it into a giant object/i.test(mouseVideo), mouseVideo);
check("mouse prompt uses desk-sized context instead of generic oversized scale", /desk-sized tech accessory|desk surface/i.test(mouseImage + mouseVideo), mouseImage + mouseVideo);

// --- image prompt single full-frame format test ---
const imgLimit = buildImagePrompt({ name: "พัดลมไร้สาย" }, settings);
check("image prompt specifies single full-frame product layout", /one authentic full-frame smartphone photograph|single full-frame authentic smartphone camera photograph/i.test(imgLimit), imgLimit);

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

// Test 5b: forbidden spoken/overlay word is excluded from every video path
const wowVideo = buildVideoPrompt({ name: "รองเท้าผู้หญิง" }, settings);
check("video prompt globally forbids the word ว้าว", /STRICT WORD EXCLUSION[\s\S]*ว้าว[\s\S]*MUST NEVER appear/i.test(wowVideo), wowVideo);
const wowOverlayVideo = buildVideoPrompt(
  { name: "พัดลมไร้สาย" },
  { ...settings, textEnabled: true, clipText: "ว้าวมาก" }
);
check("configured overlay removes the word ว้าว", !/MUST display this exact Thai text overlay[\s\S]*"ว้าวมาก"/i.test(wowOverlayVideo), wowOverlayVideo);
check("resolveClipText removes the word ว้าว", resolveClipText({ name: "สินค้า" }, { textEnabled: true, clipText: "ว้าวมาก" }) === "มาก");

// Test 6: resolveClipText truncates long overlayText to <= 20 chars
const longOverlay = "พัดลมตั้งโต๊ะอเนกประสงค์ไร้สายพลังลมเย็นสุดๆพกพาสะดวก";
const clipTextTruncated = resolveClipText({ name: "สินค้า", overlayText: longOverlay }, { textEnabled: true });
check("resolveClipText truncates long overlayText to 20 chars ending with ..", clipTextTruncated.length <= 20 && clipTextTruncated.endsWith(".."), clipTextTruncated);

// Test 7: firstSceneNoPeople option makes Scene 1 product-only regardless of product size
const vidFirstSceneNoPeopleHoldable = buildVideoPrompt({ name: "เซรั่มหน้าใส" }, { ...settings, presenter: "woman", firstSceneNoPeople: true });
check("video prompt with firstSceneNoPeople (holdable) contains product-only override", /PRODUCT-ONLY SCENE 1: Do not show the presenter/i.test(vidFirstSceneNoPeopleHoldable) && /FINAL SCENE 1 OVERRIDE: Scene 1 is product-only/i.test(vidFirstSceneNoPeopleHoldable), vidFirstSceneNoPeopleHoldable);
check("video prompt with firstSceneNoPeople (holdable) forbids hands in Scene 1", /Scene 1.*STRICTLY FORBIDDEN: Do not show any people, faces, presenters, reviewers, characters, or hands/i.test(vidFirstSceneNoPeopleHoldable), vidFirstSceneNoPeopleHoldable);

const vidFirstSceneNoPeopleHeavy = buildVideoPrompt({ name: "กระสอบปูน 50 กิโลกรัม" }, { ...settings, presenter: "woman", firstSceneNoPeople: true });
check("video prompt with firstSceneNoPeople (heavy) contains strict product-only exception", /PRODUCT-ONLY SCENE 1: Do not show the presenter, any other people, hands, faces/i.test(vidFirstSceneNoPeopleHeavy), vidFirstSceneNoPeopleHeavy);
check("video prompt with firstSceneNoPeople (heavy) shows only product resting in Scene 1", /Scene 1.*product shown resting on its own.*PRODUCT-ONLY SCENE 1/i.test(vidFirstSceneNoPeopleHeavy), vidFirstSceneNoPeopleHeavy);

// Test 8: modelRefImage must not request human likeness matching
const vidNoModelRef = buildVideoPrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman" });
check("video prompt without modelRefImage keeps one presenter", /Use exactly one single consistent presenter/i.test(vidNoModelRef), vidNoModelRef);

const vidWithModelRef = buildVideoPrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman", modelRefImage: "data:image/png;base64,sample" });
check("video prompt with modelRefImage avoids likeness matching", !/PUBLIC FIGURE|LIKENESS|celebrity|influencer|private individual|exact same presenter|same gender, face|copy[^.]{0,80}(?:person|face)|clone|resemble/i.test(vidWithModelRef), vidWithModelRef);

const imgNoModelRef = buildImagePrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman" });
check("image prompt without modelRefImage instructs AI to focus on clean product hero presentation", /Product Hero Focus|Product Focus/i.test(imgNoModelRef), imgNoModelRef);

const imgWithModelRef = buildImagePrompt({ name: "เสื้อยืดแฟชั่น" }, { ...settings, presenter: "woman", modelRefImage: "data:image/png;base64,sample" });
check("image prompt with modelRefImage avoids likeness matching", !/PUBLIC FIGURE|LIKENESS|celebrity|influencer|private individual|brand new presenter face|copy[^.]{0,80}(?:person|face)|clone|resemble/i.test(imgWithModelRef), imgWithModelRef);
check("apparel image does not let the whole reference override fictional casting", !/REFERENCE PHOTO OVERRIDES TEXT/i.test(imgWithModelRef), imgWithModelRef);
check("apparel image generates its fictional presenter independently", /INDEPENDENT FICTIONAL CAST:[^\n]*presenter independently[^\n]*reference only for garment design details/i.test(imgWithModelRef), imgWithModelRef);

const genericReferenceImage = buildImagePrompt({ name: "แก้วเก็บความเย็น" }, { ...settings, presenter: "woman" });
check("non-apparel image still gives the product reference highest priority", /REFERENCE PRODUCT IDENTITY ONLY/i.test(genericReferenceImage), genericReferenceImage);
check("image prompt locks realistic product scale to the scene", /REALISTIC SCENE SCALE LOCK[\s\S]*real-world anchors[\s\S]*natural perspective/i.test(genericReferenceImage), genericReferenceImage);
check("image prompt scales from scene anchors instead of frame coverage", /Use real-world anchors, natural perspective, and background depth/i.test(genericReferenceImage), genericReferenceImage);
check("insulated tumbler image uses reference-led geometry without forcing a cylinder", /STRICT INSULATED DRINKWARE FIDELITY LOCK[\s\S]*without forcing a generic cylindrical shape/i.test(genericReferenceImage), genericReferenceImage);
check("insulated tumbler preserves printed text orientation and layout", /INSULATED DRINKWARE PRINTED-TEXT LAYOUT LOCK[\s\S]*If the reference text is vertical, keep it vertical[\s\S]*never reflow it horizontally/i.test(genericReferenceImage), genericReferenceImage);
const insulatedCupImage = buildImagePrompt({ name: "แก้วน้ำเก็บความเย็น", category: "แก้วน้ำ" }, { ...settings, presenter: "none" });
check("insulated cup is not mislabeled as a food cup", /Show insulated tumbler bottle clearly/i.test(insulatedCupImage) && !/Show food cup or container clearly/i.test(insulatedCupImage), insulatedCupImage);
const insulatedCupWithWrongAnalysis = buildImagePrompt(
  {
    name: "แก้วน้ำเก็บความเย็น",
    category: "แก้วน้ำ",
    structureAdvice: "The product is a ceramic food bowl with a wide open top.",
    promptAdvice: "Preserve the ceramic food bowl exactly."
  },
  { ...settings, presenter: "none" }
);
check("drinkware ignores incompatible stale image analysis", !/food bowl|wide open top|ceramic food bowl/i.test(insulatedCupWithWrongAnalysis) && /Secondary reference analysis hint only|Show insulated tumbler bottle clearly/i.test(insulatedCupWithWrongAnalysis), insulatedCupWithWrongAnalysis);

// Test 9: Video prompt fidelity directions
const sampleVideoPrompt = buildVideoPrompt({ name: "กระเป๋าเป้ลายการ์ตูน" }, settings);
check("video prompt includes printed graphic fidelity instruction", /Reproduce all printed surface artwork|Reproduce the printed surface artwork/i.test(sampleVideoPrompt), sampleVideoPrompt);
check("video prompt includes color and pattern accuracy instruction", /EXACT COLOR & PATTERN ACCURACY/i.test(sampleVideoPrompt), sampleVideoPrompt);
check("video prompt locks realistic product scale to the scene", /REALISTIC SCENE SCALE LOCK[\s\S]*natural perspective[\s\S]*never oversized, floating/i.test(sampleVideoPrompt), sampleVideoPrompt);
const musicOnlyPrompt = buildVideoPrompt({ name: "เคสมือถือ" }, { ...settings, audioMode: "music_only" });
check("music-only mode requests instrumental music", /AUDIO MODE — INSTRUMENTAL MUSIC ONLY/i.test(musicOnlyPrompt), musicOnlyPrompt);
check("music-only mode forbids spoken audio", /Do not generate any spoken narration, voiceover, dialogue/i.test(musicOnlyPrompt), musicOnlyPrompt);
const voiceoverPrompt = buildVideoPrompt({ name: "เคสมือถือ" }, { ...settings, audioMode: "voiceover" });
check("voiceover mode remains enabled by default", /Spoken audio \(Thai\):|Voiceover: Add/i.test(voiceoverPrompt) && !/AUDIO MODE — INSTRUMENTAL MUSIC ONLY/i.test(voiceoverPrompt), voiceoverPrompt);
// Test 10: Hands-only background aesthetics
const handsOnlyImg = buildImagePrompt({ name: "เคสมือถือ" }, { ...settings, presenter: "hands_only" });
check("hands_only image prompt contains background aesthetics", /BACKGROUND AESTHETICS/i.test(handsOnlyImg), handsOnlyImg);
check("hands_only image prompt has soft-focus cinematic bokeh blur instruction", /soft-focus shallow depth of field|cinematic bokeh blur/i.test(handsOnlyImg), handsOnlyImg);

const handsOnlyVid = buildVideoPrompt({ name: "เคสมือถือ" }, { ...settings, presenter: "hands_only" });
check("hands_only video prompt contains background setting or aesthetics", /Cafe \/ Coffee Shop|BACKGROUND AESTHETICS/i.test(handsOnlyVid), handsOnlyVid);

// Test 11: Auto mode always uses a Thai presenter and keeps the inferred setting
const caseAutoVid = buildVideoPrompt({ name: "เคสไอโฟน 16 Pro Max ลายการ์ตูน" }, { ...settings, presenter: "Auto", location: "Auto" });
check("phone case product Auto uses a fictional Thai presenter", /Presenter: A fictional adult Thai (?:woman|man) reviewer/i.test(caseAutoVid) && /THAI PRESENTER CAST/i.test(caseAutoVid), caseAutoVid);
check("phone case product Auto location recommends Cafe \/ Coffee Shop setting", /Cafe \/ Coffee Shop/i.test(caseAutoVid), caseAutoVid);
check("phone case product video prompt contains multi-angle multi-shot mandate", /MULTI-ANGLE PHONE CASE SHOT MANDATE/i.test(caseAutoVid), caseAutoVid);
check("Auto presenter is attractive and age-appropriate", /naturally attractive|beautiful or handsome|age-appropriate/i.test(caseAutoVid), caseAutoVid);

const caseAutoImg = buildImagePrompt({ name: "เคสไอโฟน 16 Pro Max ลายการ์ตูน" }, { ...settings, presenter: "Auto", location: "Auto" });
check("phone case image Auto uses a fictional Thai presenter", /Presenter: A fictional adult Thai (?:woman|man) reviewer/i.test(caseAutoImg) && /THAI PRESENTER CAST/i.test(caseAutoImg), caseAutoImg);
check("phone case image locks printed artwork to the case coordinates", /CASE ARTWORK COORDINATE LOCK[\s\S]*relative to the case's top, bottom, left, right edges[\s\S]*camera cutout/i.test(caseAutoImg), caseAutoImg);
check("phone case still uses the exact source product", /REFERENCE PRODUCT SOURCE[\s\S]*attached reference image as the exact source[\s\S]*Copy the visible case or case set 1:1/i.test(caseAutoImg), caseAutoImg);
check("phone case still keeps the original shape and camera opening", /REFERENCE PRODUCT SOURCE[\s\S]*outer silhouette[\s\S]*camera opening/i.test(caseAutoImg), caseAutoImg);
check("phone case still locks exact camera cutout geometry", /PHONE CASE STILL 1:1 GEOMETRY LOCK[\s\S]*lens-hole count, shape, size, spacing, orientation, and position[\s\S]*camera-island border thickness/i.test(caseAutoImg), caseAutoImg);
check("phone case still locks exact side rails and edge construction", /PHONE CASE STILL 1:1 GEOMETRY LOCK[\s\S]*side-rail thickness, color, material[\s\S]*top and bottom edge construction/i.test(caseAutoImg), caseAutoImg);
check("phone case still binds artwork coordinates to the physical shell", /indivisible source asset[\s\S]*artwork point fixed to its original coordinate[\s\S]*Do not recenter, scale, rotate, mirror, crop, repaint/i.test(caseAutoImg), caseAutoImg);
check("phone case still requires exactly one visible hand", /MANDATORY ONE-HAND PHONE CASE HOLD[\s\S]*exactly one visible natural adult hand total[\s\S]*second hand must remain completely outside the frame/i.test(caseAutoImg), caseAutoImg);
check("phone case still rejects a lookalike replacement", /FINAL PHONE CASE CHECK[\s\S]*same case from the original image[\s\S]*not a lookalike or generic replacement/i.test(caseAutoImg), caseAutoImg);
const combinedCaseImg = buildImagePrompt(
  { name: "เคสไอโฟน 16 Pro Max ลายการ์ตูน" },
  { ...settings, presenter: "Auto", location: "Auto", flowGenMode: "combined" }
);
check("combined phone case still keeps the mandatory one-hand hold", /MANDATORY ONE-HAND PHONE CASE HOLD/i.test(combinedCaseImg) && !/no people or hands/i.test(combinedCaseImg), combinedCaseImg);
const caseImagePresenter = caseAutoImg.match(/Presenter: A fictional adult Thai (?:woman|man) reviewer/i)?.[0] || "";
const caseVideoPresenter = caseAutoVid.match(/Presenter: A fictional adult Thai (?:woman|man) reviewer/i)?.[0] || "";
check("Auto still and video use the same presenter gender", caseImagePresenter === caseVideoPresenter, `${caseImagePresenter} vs ${caseVideoPresenter}`);
check("video keeps a single consistent presenter", /Use exactly one single consistent presenter/i.test(caseAutoVid), caseAutoVid);

const magneticCaseVid = buildVideoPrompt({ name: "เคสแม่เหล็กวงกลม ชาร์จไร้สาย ยึดขาตั้ง" }, settings);
check("magnetic phone case prompt includes built-in magnetic ring feature lock", /BUILT-IN MAGNETIC RING \(MAGSAFE\) FEATURE LOCK/i.test(magneticCaseVid), magneticCaseVid);
check("magnetic phone case prompt forbids external stick-ons or separate plates", /no extra attachments or stick-ons required/i.test(magneticCaseVid), magneticCaseVid);

// Test 12: Clothing front-only view lock
const clothingVid = buildVideoPrompt({ name: "เสื้อยืดคอกลมแฟชั่น", category: "เสื้อผ้า" }, settings);
check("clothing video prompt enforces front-only view lock", /STRICT CLOTHING & APPAREL GARMENT FIDELITY LOCK/i.test(clothingVid), clothingVid);
check("clothing video uses the explicit product name as an identity lock", /PRODUCT NAME \/ CATEGORY LOCK[\s\S]*เสื้อยืดคอกลมแฟชั่น/i.test(clothingVid), clothingVid);
check("clothing video prompt forbids back view and turning around", /do NOT show the back view|CLOTHING FRONT-ONLY RULE/i.test(clothingVid), clothingVid);
check("shirt video forbids underwear as the lower garment", /shirt\/top[\s\S]*never underwear[\s\S]*APPAREL WEARING MODE[\s\S]*Do NOT show underwear/i.test(clothingVid), clothingVid);
check("clothing video uses a generic fictional adult model", /HUMAN CAST:/i.test(clothingVid) && /APPAREL MODEL SAFETY/i.test(clothingVid) && /fictional adult/i.test(clothingVid), clothingVid);
check("clothing video keeps the presenter's complete head visible across cuts", /APPAREL PRESENTER FRAME CONTINUITY[\s\S]*head[^.]*fully inside the frame[\s\S]*hard cut/i.test(clothingVid), clothingVid);
check("clothing video does not request talking-head framing", !/talking head/i.test(clothingVid), clothingVid);

const clothingImg = buildImagePrompt({ name: "เสื้อเชิ้ตแขนยาว", category: "แฟชั่น" }, settings);
check("clothing image prompt enforces front-facing shot distribution", /front shot|front-facing/i.test(clothingImg), clothingImg);
check("clothing image uses the product title alongside the reference", /PRODUCT TITLE CONTEXT[\s\S]*เสื้อเชิ้ตแขนยาว/i.test(clothingImg), clothingImg);
check("clothing image uses a generic fictional adult model", /HUMAN CAST:/i.test(clothingImg) && /APPAREL MODEL SAFETY/i.test(clothingImg), clothingImg);
check("clothing prompts use the reference garment as the worn product", /APPAREL REFERENCE USE/i.test(clothingImg) && /APPAREL REFERENCE USE/i.test(clothingVid), clothingImg + clothingVid);
check("clothing prompts do not treat garments as hand-sized objects", !/hand-sized|pocket-sized/i.test(clothingImg + clothingVid), clothingImg + clothingVid);
check("clothing video does not apply rigid hard-edge object physics", !/rigid, solid|hard edges/i.test(clothingVid), clothingVid);
check("clothing presenter wears rather than stands beside the garment", /already wearing the exact reference garment/i.test(clothingVid) && !/reviewer stands next to it/i.test(clothingVid), clothingVid);
check("clothing scene directions show the garment worn instead of generically presented", /Scene 1[^\n]*model already wearing/i.test(clothingVid) && !/reviewer presenting[^\n]*normal real-world position/i.test(clothingVid), clothingVid);

const mensWorkoutPants = { name: "กางเกงออกกำลังกายผู้ชาย", category: "เสื้อผ้า", autoOptions: { presenter: "woman" } };
const mensWorkoutPantsImg = buildImagePrompt(mensWorkoutPants, settings);
const mensWorkoutPantsVid = buildVideoPrompt(mensWorkoutPants, settings);
check("men's workout pants override an incorrect woman recommendation", /Presenter: A fictional adult Thai man commercial fit model/i.test(mensWorkoutPantsImg) && /Presenter: A fictional adult Thai man commercial fit model/i.test(mensWorkoutPantsVid), mensWorkoutPantsImg + mensWorkoutPantsVid);
check("workout pants are the sole visible bottom garment", /exactly one pair[\s\S]*sole visible bottom garment/i.test(mensWorkoutPantsImg) && /exactly one pair[\s\S]*sole visible bottom garment/i.test(mensWorkoutPantsVid), mensWorkoutPantsImg + mensWorkoutPantsVid);
check("workout pants prompt does not request vague supporting clothes", !/supporting clothes/i.test(mensWorkoutPantsImg + mensWorkoutPantsVid), mensWorkoutPantsImg + mensWorkoutPantsVid);

const womensWorkoutPantsVid = buildVideoPrompt({ name: "กางเกงออกกำลังกายผู้หญิง", category: "เสื้อผ้า" }, settings);
check("women's workout pants select a woman model", /Presenter: A fictional adult Thai woman commercial fit model/i.test(womensWorkoutPantsVid), womensWorkoutPantsVid);
check("Auto men's apparel uses a handsome young working-age presenter", /AUTO PRESENTER PROFILE:[^\n]*Thai man around 22-35 years old[^\n]*handsome/i.test(mensWorkoutPantsVid), mensWorkoutPantsVid);
check("Auto women's apparel uses a youthful 20-29 presenter", /AUTO PRESENTER PROFILE:[^\n]*Thai woman around 20-29 years old[^\n]*visibly youthful adult appearance[^\n]*not mature-looking or elderly[^\n]*beautiful/i.test(womensWorkoutPantsVid), womensWorkoutPantsVid);

const manualWomanProfileVid = buildVideoPrompt({ name: "แก้วน้ำเก็บความเย็น" }, { ...settings, presenter: "woman" });
check("manual presenter selection does not receive the Auto age profile", !/AUTO PRESENTER PROFILE/i.test(manualWomanProfileVid), manualWomanProfileVid);

const seniorProductVid = buildVideoPrompt({ name: "ไม้เท้าสำหรับผู้สูงอายุ", targetGroup: "ผู้สูงอายุ" }, settings);
check("age-specific products do not receive the default young Auto profile", !/AUTO PRESENTER PROFILE/i.test(seniorProductVid), seniorProductVid);

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
check("furniture video prompt preserves its actual support geometry", /FURNITURE STRUCTURE FIDELITY[\s\S]*Preserve its actual support system and geometry/i.test(furnitureVid), furnitureVid);
check("furniture video prompt keeps the structure stable", /grounded and physically stable without changing, bending, melting, or warping/i.test(furnitureVid), furnitureVid);

const chairImg = buildImagePrompt({ name: "เก้าอี้ทานอาหารไม้", category: "เฟอร์นิเจอร์" }, settings);
const chairVid = buildVideoPrompt({ name: "เก้าอี้ทานอาหารไม้", category: "เฟอร์นิเจอร์" }, settings);
check("chair prompt locks chair-specific geometry", /CHAIR-SPECIFIC FIDELITY LOCK[\s\S]*seat pan shape[\s\S]*backrest height[\s\S]*leg count/i.test(chairImg + chairVid), chairImg + chairVid);
check("chair prompt forbids invented product text and logos", /FURNITURE SURFACE TEXT LOCK[\s\S]*Add NO new writing[\s\S]*fake logo[\s\S]*completely plain and blank/i.test(chairImg + chairVid), chairImg + chairVid);

const sofaImg = buildImagePrompt({ name: "โซฟาปรับนอน 2 ที่นั่ง ผ้าฮอลแลนด์" }, settings);
check("sofa image prompt includes furniture fidelity guidance", /FURNITURE STRUCTURE FIDELITY/i.test(sofaImg), sofaImg);

// Test 16: Phone case & Bags structural fidelity lock
const phoneCaseVid = buildVideoPrompt({ name: "เคสไอโฟน 16 Pro Max ลายการ์ตูนหมี" }, settings);
check("phone case video prompt includes phone case fidelity lock", /STRICT PHONE CASE & MOBILE ACCESSORY FIDELITY LOCK/i.test(phoneCaseVid), phoneCaseVid);
check("phone case video prevents pattern rotation and drift", /CASE ARTWORK COORDINATE LOCK[\s\S]*mirror it, rotate it, stretch it, reflow it, center-shift it[\s\S]*drift onto the phone/i.test(phoneCaseVid), phoneCaseVid);
check("phone case keeps true size against full-size scene anchors", /REAL-WORLD PHONE SCALE LOCK[\s\S]*true smartphone size relative to a full-size hand, table, room, and furniture[\s\S]*fill half a table/i.test(phoneCaseVid), phoneCaseVid);
check("complex phone case patterns copy from the clear reference", /COMPLEX PHONE CASE PATTERN REFERENCE LOCK[\s\S]*entire visible case-back artwork as one exact graphic layer[\s\S]*reference image overrides the product title/i.test(phoneCaseVid), phoneCaseVid);
check("phone case uses a natural one-hand grip", /NATURAL PHONE CASE HANDLING LOCK[\s\S]*relaxed ergonomic grip[\s\S]*thumb along one side[\s\S]*fingers naturally supporting/i.test(phoneCaseVid), phoneCaseVid);
check("phone case video keeps the second hand outside every shot", /MANDATORY ONE-HAND PHONE CASE HOLD[\s\S]*every shot[\s\S]*second hand must remain completely outside the frame/i.test(phoneCaseVid), phoneCaseVid);
check("phone case keeps camera cutout aligned while held", /NATURAL PHONE CASE HANDLING LOCK[\s\S]*cover the camera cutout[\s\S]*camera opening.*aligned/i.test(phoneCaseVid), phoneCaseVid);

const bagVid = buildVideoPrompt({ name: "กระเป๋าสะพายข้างหนังแท้สำหรับผู้หญิง" }, settings);
check("bag video prompt includes bags fidelity lock", /STRICT BAGS & ACCESSORIES STRUCTURAL FIDELITY LOCK/i.test(bagVid), bagVid);
check("accessory presenter outfit matches the fashion category", /PRESENTER OUTFIT MATCH[\s\S]*coordinated, modest modern fashion outfit/i.test(bagVid), bagVid);

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

// Test 21: Apparel supporting clothes must not replace or cover the product
const modestFashionVid = buildVideoPrompt({ name: "เสื้อเชิ้ตลายดอก" }, { ...settings, presenter: "woman" });
check("apparel video keeps the exact garment as the sole featured top", /APPAREL WEARING MODE[\s\S]*exact reference garment once as the sole visible featured top/i.test(modestFashionVid), modestFashionVid);
check("apparel video requires an opaque matching bottom naturally", /opaque, full-coverage matching bottom/i.test(modestFashionVid), modestFashionVid);

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
check("video prompt applies continuity only to wearable products", /WEARABLE PRODUCT CONTINUITY/i.test(videoPromptDonningCheck), videoPromptDonningCheck);
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
check("image prompt treats reference photo as highest-priority product source", /REFERENCE PRODUCT IDENTITY ONLY/i.test(fidelityImg), fidelityImg);
check("image prompt uses product-only compositing instead of copying the source scene", /PRODUCT-ONLY REFERENCE TRANSFER|do NOT reproduce the source photo as a whole/i.test(fidelityImg), fidelityImg);

const fidelityVid = buildVideoPrompt({ name: "black insulated bottle", category: "drinkware" }, { ...settings, presenter: "none" });
check("video prompt keeps strict reference product fidelity", /STRICT PRODUCT FIDELITY LOCK/i.test(fidelityVid), fidelityVid);

const insulatedCupAuto = buildVideoPrompt(
  { name: "แก้วน้ำเก็บความเย็น", category: "แก้วน้ำ" },
  { ...settings, presenter: "none", location: "Auto" }
);
check("insulated cup Auto scene allows a living room", /Bright realistic outdoor park or fitness setting|Bright modern living room/i.test(insulatedCupAuto), insulatedCupAuto);
const explicitFitnessLocationImage = buildImagePrompt(
  { name: "แก้วน้ำเก็บความเย็น", category: "แก้วน้ำ" },
  { ...settings, presenter: "none", location: "Fitness Studio" }
);
check("explicit Fitness Studio location reaches the still prompt", /SELECTED BACKGROUND LOCATION LOCK[\s\S]*Fitness Studio/i.test(explicitFitnessLocationImage), explicitFitnessLocationImage);

// Test 27: Auto background must match the product category.
const autoBackgroundCases = [
  ["water bottle", /Bright realistic outdoor park or fitness setting|Bright modern living room/i],
  ["cat food", /Clean pet-friendly home interior/i],
  ["toy", /Bright safe children's playroom/i],
  ["car phone holder", /Realistic clean car interior/i],
  ["laptop stand", /Neat modern desk workspace/i],
  ["running shoes", /Outdoor home driveway|front yard|quiet neighborhood street|park path/i],
  ["เครื่องชงกาแฟ", /kitchen coffee station|home coffee bar|modern kitchen counter/i],
  ["ทรายแมว", /Clean pet-friendly home interior|pet-care/i],
  ["เครื่องดูดฝุ่น", /clean modern home interior|utility or laundry|neat living room/i],
  ["ไม้เท้าเดินป่า", /forest hiking trail|mountain trailhead|trekking path/i]
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
check("shoe still image respects a saved indoor location", /SELECTED BACKGROUND LOCATION LOCK[\s\S]*Modern Living Room/i.test(shoeWithWrongSavedLocation) && !/HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE|outdoor home driveway|front yard|quiet neighborhood street|park path/i.test(shoeWithWrongSavedLocation));

const hikingPoleVideo = buildVideoPrompt(
  { name: "ไม้เท้าเดินป่า" },
  { ...settings, location: "Auto", presenter: "Auto" }
);
check("hiking pole Auto scene uses a real trail", /forest hiking trail|mountain trailhead|trekking path/i.test(hikingPoleVideo) && !/Modern Living Room|Clean Modern Studio/i.test(hikingPoleVideo), hikingPoleVideo);
check("hiking pole Auto presenter outfit matches hiking use", /PRESENTER OUTFIT MATCH:[^\n]*practical hiking outfit[\s\S]*hiking pants[\s\S]*trail shoes/i.test(hikingPoleVideo), hikingPoleVideo);
const genericCaneVideo = buildVideoPrompt(
  { name: "ไม้เท้า" },
  { ...settings, location: "Auto", presenter: "Auto" }
);
check("generic cane does not inherit hiking-pole scene rules", !/forest hiking trail|mountain trailhead|trekking path|practical hiking outfit/i.test(genericCaneVideo), genericCaneVideo);

check("unboxing lifts product out and places it beside the box", /lifting it fully clear of the box rim/i.test(vidPresenterUnboxingHands) && /Release only after it contacts the table/i.test(vidPresenterUnboxingHands) && /now-empty product cavity/i.test(vidPresenterUnboxingHands) && !/Keep the product supported in the open box|no forced lifting/i.test(vidPresenterUnboxingHands), vidPresenterUnboxingHands);

if (fail > 0) {
  console.log(results.filter(r => r.startsWith("❌")).join("\n"));
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
