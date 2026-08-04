export const VIDEO_STYLES = [
  {
    id: "sales",
    emoji: "🛒",
    name: "ขายสินค้า",
    description: "เน้นปิดการขาย โชว์สินค้า จุดขาย และ CTA ชัด",
    shotPattern: "[Hook สินค้า] → [โชว์จุดขายหลัก] → [สาธิต/ซูมรายละเอียด] → [CTA สั่งซื้อ]",
    fragment: "conversion-focused TikTok shop product video, clear product hero shots, strong benefit demonstration, fast product reveal, persuasive shopping CTA moment, clean commercial lighting, purchase-intent pacing"
  },
  {
    id: "review",
    emoji: "🎯",
    name: "Review สินค้า",
    description: "โชว์สินค้าชัดทุกมุม ครบ feature",
    shotPattern: "[สินค้า 360°] → [ซูมจุดเด่นหลัก] → [ปุ่มสั่งซื้อ]",
    fragment: "clean product showcase, multiple angles, feature callout text overlays, white or neutral background, professional lighting, no distractions"
  },
  {
    id: "lifestyle",
    emoji: "💃",
    name: "Lifestyle / In-Use",
    description: "สินค้าอยู่ในชีวิตจริง บรรยากาศสบายๆ",
    shotPattern: "[ภาพบรรยากาศชีวิตจริง] → [คนใช้งานสินค้า] → [ซูมสินค้าใกล้ๆ]",
    fragment: "lifestyle product video, natural environment, person using product, warm natural lighting, authentic feel, UGC-style organic look"
  },
  {
    id: "flash-sale",
    emoji: "🔥",
    name: "Flash Sale / Urgency",
    description: "กระตุ้นซื้อ โปรเด่น เวลาจำกัด",
    shotPattern: "[สินค้า] → [โชว์โปรโมชั่น] → [นับถอยหลัง/ปุ่มสั่งซื้อ]",
    fragment: "high energy flash sale ad, bold promotion text, red and white color scheme, fast cuts every 1-2 seconds, urgency visual elements, countdown timer graphic"
  },
  {
    id: "unboxing",
    emoji: "📦",
    name: "Unboxing",
    description: "แกะกล่อง สร้างความตื่นเต้น first impression",
    shotPattern: "[โชว์กล่อง] → [แกะวัสดุกันกระแทก] → [เปิดเจอสินค้า] → [โชว์รายละเอียด]",
    fragment: "unboxing video style, hands opening package, reveal moment with dramatic pause, close-up on product details, satisfying unwrapping, tissue paper, ASMR aesthetic"
  },
  {
    id: "before-after",
    emoji: "🌟",
    name: "Before / After",
    description: "เปรียบเทียบก่อน-หลัง ผลลัพธ์ชัดเจน",
    shotPattern: "[โชว์ปัญหาก่อนใช้] → [เอฟเฟกต์เปลี่ยนผ่าน] → [ผลลัพธ์หลังใช้]",
    fragment: "before and after comparison, split screen or transition wipe effect, problem state then solution state, dramatic improvement reveal, text labels Before / After"
  },
  {
    id: "testimonial",
    emoji: "👩",
    name: "UGC / Testimonial",
    description: "เหมือนคนจริงรีวิว น่าเชื่อถือ",
    shotPattern: "[คนพูดถึงสินค้า] → [หยิบสินค้าขึ้นมาโชว์] → [แนะนำให้ลอง]",
    fragment: "user generated content style, talking head, handheld camera feel, natural lighting, genuine review vibe, person holding product, casual authentic presentation"
  },
  {
    id: "cinematic",
    emoji: "✨",
    name: "Cinematic / Premium",
    description: "ดูแพง หรูหรา เหมาะสินค้า premium",
    shotPattern: "[สินค้าสโลว์โมชั่น] → [ซูมรายละเอียดผิวสัมผัส] → [จบด้วยโลโก้แบรนด์]",
    fragment: "cinematic product advertisement, slow motion, luxury feel, dark moody or bright airy lighting, macro close-ups, smooth camera movements, premium brand aesthetic, no text clutter"
  },
  {
    id: "trending-hook",
    emoji: "🎵",
    name: "Trending Sound / Hook",
    description: "เน้นช่วงแรก 3 วินาที hook คนหยุดดู",
    shotPattern: "[เปิดด้วยภาพที่สะดุดตามาก] → [เผยโฉมสินค้า] → [สรุปสั้นๆ เร็วๆ]",
    fragment: "attention-grabbing opening 3 seconds, bold hook visual, quick product reveal, trending TikTok pacing, text hook overlay at start, fast energetic edit"
  }
];

export const TEXT_FONT_STYLES = {
  handwriting: "cute Thai handwritten-style text in white with a soft shadow",
  "bold-modern": "cute bold modern rounded-sans style Thai text in white with a strong drop shadow",
  "neon-glow": "cute rounded glowing neon sign style Thai text with a vibrant outer glow",
  minimalist: "cute minimalist rounded thin style Thai text in clean soft white",
  "cartoon-3d": "cute 3D stylized pop-art cartoon style Thai text with a bold outline and playful texture",
  "clean-subtitle": "cute rounded readable Thai subtitle text enclosed inside a semi-transparent dark rounded rectangular background box, high readability",
  "product-label": "cute rounded Thai text styled as a graphic retail sticker label or price tag badge with a dashed border",
  "luxury-brand": "cute yet elegant high-end luxury fashion brand editorial style Thai text, fine thin lettering with generous spacing, premium aesthetic",
  "viral-bold": "cute high-energy retro pop-art style Thai text with a thick black outline, bold yellow fill, and offset shadow",
  typewriter: "cute vintage typewriter style Thai text, soft rounded monospace typewriter font appearance"
};

const PACING = {
  1: "slow cinematic pacing, smooth cuts every 4 seconds",
  2: "balanced TikTok pacing, clean cuts every 2-3 seconds",
  3: "rapid viral pacing, energetic cuts every 1-2 seconds"
};

const PRESENTERS = {
  Auto: "Realistic cinematic shot. Prefer product-only views. If a presenter is shown, they must stand near or gesture towards the product without complex handling.",
  none: "No humans. Focus entirely on the product resting stably in a realistic setting with smooth camera movement.",
  hands_only: "Realistic first-person POV (Point of View) perspective. Show the product being used, worn, or presented naturally with realistic anatomical hands (strictly 5 fingers per hand, natural ergonomic grip, clean skin texture, realistic knuckles) or feet/legs depending on product category. No face or head shown in the frame.",
  woman: "A young Thai woman reviewer standing in full-body view, modestly dressed in a complete outfit (proper shirt/blouse AND long pants/jeans/skirt). She stands near or holds it gently, smiling at the camera.",
  man: "A young Thai man reviewer standing in full-body view, modestly dressed in a complete outfit (proper shirt/polo AND long pants/jeans). He stands near or holds it gently, smiling at the camera.",
  child: "A cute young Thai child (4-6 years old, kindergarten age, strictly no baby or toddler under 4 years old) actively, safely, and naturally riding, playing with, wearing, or using the product in the scene (not hard-selling), accompanied by a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby supervising with love and care.",
  older_child: "A cute Thai older child (7-12 years old, kid) actively, safely, and naturally riding, playing with, wearing, or using the product in the scene (not hard-selling), accompanied by a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby supervising with love and care.",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality",
  dog: "A friendly Thai reviewer standing in full-body view modestly dressed in a complete outfit (shirt AND long pants) together with a cute dog, presenting the product in a bright indoor setting.",
  cat: "A friendly Thai reviewer standing in full-body view modestly dressed in a complete outfit (shirt AND long pants) together with a cute cat, presenting the product in a warm indoor setting."
};

const THAI_PERSON_DIRECTION = "Natural Thai reviewer standing in a full-length shot, modestly dressed in a complete outfit (proper top AND long pants/skirt). The product must remain rigid and static; reviewer stands next to it gently.";

const KIDS_WITH_PARENT_DIRECTION = "KIDS PRODUCT SCENE WITH CHILD & PARENT SUPERVISION: The scene MUST depict a happy young Thai kindergarten child (4-6 years old or older, strictly no babies or toddlers under kindergarten age) actively, safely, and naturally riding, playing with, wearing, or using the kids product (e.g. riding the kids bicycle, playing with the toy) in a bright, clean setting. The child is naturally enjoying and using the product naturally in the scene without hard-selling to the camera. Accompanying the child MUST BE a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby, supervising with love, warmth, and care. STRICTLY FORBIDDEN: Do NOT include dogs or unrelated pet animals. Do NOT show an isolated adult presenter without a child for kids products.";

const STRICT_MODEST_DRESS_CODE_MANDATE = "STRICT MODEST & APPROPRIATE DRESS CODE LOCK (ห้ามชุดสุ่มเสี่ยง/วาบหวิว): Presenters and models MUST wear clean, elegant, modest, everyday commercial attire (such as casual shirts, blouses, t-shirts, jackets, jeans, trousers, or modest knee-length skirts/dresses). STRICTLY FORBIDDEN: Do NOT generate revealing, immodest, risqué, suggestive, or provocative outfits. No deep v-necks, no exposed cleavage, no strapless tops, no crop tops showing stomach, no micro-shorts, no see-through/sheer clothing, no underwear/lingerie, and no tight/revealing swimwear. Always keep clothing respectable, professional, and 100% appropriate for commercial advertising.";

const FULL_BODY_PRESENTER_DIRECTION = "STRICT FULL-BODY SHOT & DECENT MODEST DRESS CODE: Presenter MUST be shown in a full-length head-to-toe standing view with head, torso, full legs, feet, and footwear fully visible on the floor. STRICT FULL OUTFIT REQUIREMENT: Presenter MUST wear a complete, modest FULL OUTFIT with BOTH a proper top (shirt/blouse/jacket) AND proper long bottoms (trousers/jeans/long pants/knee-length skirt). FORBIDDEN (ห้ามชุดสุ่มเสี่ยง/วาบหวิว): Absolutely NO revealing, immodest, risqué, suggestive, or provocative attire. No deep v-necks, no cleavage, no strapless tops, no stomach/crop tops, no micro-shorts, no sheer/see-through clothes, no lingerie, and no tight/revealing swimwear.";

const FULL_PRODUCT_VISIBILITY_DIRECTION = "STRICT FULL PRODUCT VISIBILITY & NO CROPPING RULE: The ENTIRE product (including all top, bottom, left, right, side edges, legs, handles, doors, shelves, and structural frame) MUST be 100% fully visible inside the frame. ABSOLUTELY NO CROPPING or cutting off any edge or portion of the product. For large or bulky items (such as cabinets, wardrobes, kitchen sinks, dishwashers, refrigerators, sofas, desks, or shelves), use a wide-angle framing (wide camera shot) with ample breathing space around all four edges of the product so that the ENTIRE full cabinet/sink/furniture piece is completely captured in the frame without any part chopped off.";

const HANDS_DIRECTION = "NATURAL HUMAN HAND REALISM & AUTHENTIC REVIEW POSES: Realistic first-person POV (Point of View) perspective. Show authentic, natural human hands and forearms holding, supporting, or presenting the product in a realistic, comfortable review pose. NATURAL HAND POSES & GESTURES: Hands must use authentic, relaxed, ergonomic holding poses — such as gently supporting the product from the bottom or sides, holding it steadily with a natural grip, softly turning it to show texture, or gesturing naturally toward details. ALWAYS keep the main brand logo, product title, and printed front artwork 100% visible without hands blocking or covering them. STRICTLY FORBIDDEN POSES: awkward claw grips squeezing the product, fingers covering key printed logos or text, unnaturally contorted wrists, impossible arm angles, or hands floating detached in mid-air. The hands must look 100% realistic, organic, and human with natural skin texture, realistic knuckles, soft fingernails, and natural wrist alignment. STRICT MAXIMUM TWO-HAND COUNT LOCK: The frame must contain AT MOST 2 human hands in total (strictly 1 left hand and 1 right hand, or 1 single hand). ABSOLUTELY FORBIDDEN & CRITICAL RULE: NEVER render 3 hands, NEVER render a third hand, NEVER render floating extra hands, duplicated hands, extra arms, or more than 2 hands under any circumstances across all frames. Each hand must have strictly exactly 5 fingers with natural fingernails, clean skin texture, realistic knuckles, and wrist joints; no extra fingers, no distorted digits, no clipping into the product.";
const HANDS_ONLY_FACE_EXCLUSION = "STRICT RULE — FIRST-PERSON POV FACE EXCLUSION: Close-up or medium POV shot cropped below the neck or from a first-person angle. No full face, facial features, or head are visible in the frame.";
const HANDS_ONLY_BACKGROUND_DIRECTION = "BACKGROUND AESTHETICS: The background must be a beautiful, warm, authentic modern setting (such as a cozy aesthetic cafe, stylish workspace, realistic indoor room, or natural outdoor path appropriate for the product) with a soft-focus shallow depth of field (cinematic bokeh blur). Keep the POV perspective, product, and interacting hands/feet/body parts in crisp, sharp focus.";
const ANIMAL_PRESENTER_DIRECTION = "Show a friendly Thai reviewer standing together with a cute consistent pet animal (cat or dog as specified) in the frame interacting with or standing near the product. The product must remain rigid, static, and completely unchanged; the animal must not damage, bite, or deform the product.";

const PRODUCT_FIDELITY_DIRECTION = "STRICT PRODUCT FIDELITY LOCK: You MUST reproduce the product EXACTLY as in the reference image. Preserve its exact shape, 3D geometry, form, contours, colors, texture, printed artwork, patterns, print designs, graphical illustrations, logos, labels, and parts. The pattern, artwork, and visual print on the product (especially for phone cases, clothes, or printed goods) must be 100% identical, keeping the same graphics, colors, and layout without any modification or hallucination. STRICT RULE: Do NOT redesign, warp, deform, restyle, simplify, or modify the product. Do not add extra items or decorations. It must look 100% identical and pixel-faithful to the reference without any visual drift. ABSOLUTE ZERO DISTORTION RULE: All printed text, logos, packaging dimensions, and labels must be preserved exactly as shown, with perfect spelling.";

const PRODUCT_ISOLATION_DIRECTION = "CRITICAL ISOLATION RULE — EXTRACT ONLY THE PRODUCT: You must cut out and extract ONLY the product from the reference photo, completely discarding the original background. Place the exact same product into a new scene. STRICT RESTRICTION: When extracting the product, you MUST NOT redraw, redesign, mutate, or alter the product's shape, logo, patterns, branding, or colors. The product must be transferred exactly as it is, maintaining 100% pixel-faithful identity to the reference image.";

const PRODUCT_STRUCTURE_DIRECTION = "Keep the exact visible count of parts. Never add, remove, or rearrange them.";

const SCALE_FIDELITY_DIRECTION = "Keep proportions and scale identical to reference: never stretch, squash, enlarge, or shrink it. The physical size of the product must be realistic and true-to-life compared to the environment, hands, or presenter. Do not make the product abnormally large or out-of-scale relative to the surroundings (Strictest rule: Product size must be realistic and in true scale relative to its environment or presenter; never make the product abnormally large).";

const MATCH_STILL_DIRECTION = "IMPORTANT: The attached reference image is a multi-angle/multi-scene collage grid. The video must follow this reference by depicting the product across different scenes and angles as shown in the collage. Maintain absolute consistency for the product: its shape, proportions, physical size, scale, colors, materials, printed logos, and text must be identical in every scene. The size, scale, dimensions, and proportions of the product in the video must match the reference image exactly relative to the background; do not enlarge, shrink, stretch, or warp it. STRICT BRAND NEW PRESENTER FACE LOCK: If a presenter is shown in the scene, the presenter in the video MUST feature an ENTIRELY BRAND NEW, UNIQUE face and appearance generated from scratch. ABSOLUTELY FORBIDDEN: NEVER copy, clone, mirror, or replicate the face, hair, or facial features of any person appearing in the reference photo. Always generate a completely new human face from scratch. Keep the newly generated presenter's appearance consistent across all scenes. STRICT RULE: Do NOT generate the video frame as a collage, grid, storyboard, split-screen, or multi-panel composition. Each scene in the video must be a single, full-frame shot showing only one angle/perspective at a time. Animate each small image/panel from the reference collage sequentially, presenting each one as an individual full-screen scene (1 small image = 1 full-frame scene/shot). Animate each scene with smooth camera movement and transition between them with clean cuts.";

function resolveMatchStillDirection(autoPresenter, hasModelRefImage = false) {
  const baseFidelity = "STRICT REFERENCE PHOTO PRODUCT FIDELITY LOCK: Reproduce the product 100% pixel-faithfully from the reference image. Preserve exact 3D form, contours, colors, material texture, printed artwork, brand logos, typography, and packaging text without distortion, morphing, redesign, or alteration.";
  const collageRule = "STRICT RULE: Do NOT generate a collage or grid frame. Each scene must be a single full-frame shot. Animate each panel sequentially with smooth camera movement and clean cuts.";
  const singleSceneRule = "STRICT RULE: Do NOT generate a collage or grid frame. Each scene must be a single full-frame shot with smooth camera movement and clean cuts.";
  const newSceneEnv = "STRICT NEW REALISTIC BACKGROUND SCENE LOCK: Generate a BRAND NEW, realistic, aesthetically composed background environment tailored to this product category (living room for furniture, cafe for coffee/phone cases, bathroom for skincare, workspace for gadgets). DO NOT copy the reference photo background.";
  const brandNewFaceRule = "CRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION: The presenter/model generated in this image/video MUST have an ENTIRELY BRAND NEW, COMPLETELY DIFFERENT face, hairstyle, and facial features from any person appearing in the uploaded reference photo. ABSOLUTELY FORBIDDEN: Do NOT copy, clone, mirror, or resemble the face or identity of any person shown in the uploaded reference image under any circumstances. Always generate a brand new presenter face from scratch while keeping presenter appearance consistent across all generated scenes.";

  if (autoPresenter === "none") {
    return `IMPORTANT: Depict the product across different scenes. ${baseFidelity} ${newSceneEnv} ${collageRule}`;
  }
  if (autoPresenter === "hands_only") {
    return `IMPORTANT: Depict the product in an authentic first-person POV perspective across different scenes. ${baseFidelity} ${newSceneEnv} ${collageRule} STRICTLY FORBIDDEN: Do not show any face or head in the frame; keep the camera angle in a realistic first-person POV cropped below the neck showing hands, arms, or feet/legs interacting with or wearing the product naturally.`;
  }

  return `IMPORTANT: Depict the product and presenter across different scenes. ${baseFidelity} ${newSceneEnv} ${brandNewFaceRule} ${singleSceneRule}`;
}


const REALISM_AND_PHYSICS_DIRECTION = "STRICT RIGIDITY & STABILITY LOCK: Realistic motion only. Product remains rigid, solid, and static: no morphing, warping, bending, or melting. SMARTPHONE CAMERA LOOK: Organic natural lighting, authentic everyday UGC feel, avoiding hyper-processed commercial studio gloss or artificial CGI sheen.";

const NO_PUTTING_ON_OR_TAKING_OFF_MANDATE = "STRICT ALWAYS-WORN RULE (ให้ใส่ไว้เลย ห้ามทำท่าถอดหรือสวมใส่): Presenter MUST ALREADY BE FULLY WEARING or holding the item steadily right from the very first frame of every scene. ABSOLUTELY FORBIDDEN: Do NOT depict any action of putting on, pulling over head, slipping on, buttoning up, taking off, pulling down, removing, or unmasking any clothing, balaclava, hat, shoes, or accessories. Presenter simply stands, poses, or gestures naturally while wearing the item.";

const SHOE_FIDELITY_DIRECTION = "For footwear, preserve the exact single-shoe/pair count, toe shape, sole thickness, lace pattern, and color blocking. Do not change the shoe model.";

const CLOTHING_FIDELITY_DIRECTION = "STRICT CLOTHING & APPAREL GARMENT FIDELITY LOCK: You MUST reproduce the clothing item EXACTLY as depicted in the reference image. Preserve its 100% exact garment cut, silhouette, neckline style (crewneck, V-neck, polo collar, hoodie, scoop neck), sleeve length (short sleeve, long sleeve, sleeveless), sleeve cut, fabric material texture (cotton, denim, knit, silk, linen, fleece), color shade, wash, buttons, zippers, pockets, and stitching. EXACT PRINTED GRAPHICS & PATTERNS: Any chest logo, printed artwork, typography, graphic illustrations, embroidery, brand crest, or pattern (stripes, plaid, floral, tie-dye) MUST be reproduced 100% pixel-faithfully in the exact same location, size, and colors. STRICTLY FORBIDDEN: Do NOT simplify, alter, redesign, recolor, or change the clothing item. Do NOT convert a printed shirt into a plain shirt, do NOT change sleeve length, and do NOT alter the collar or cut. The garment worn by the presenter must remain 100% identical and static across all video frames without any morphing or shifting. FRONT-ONLY VIEW LOCK: The presenter must face forward showing the front design of the garment. Do NOT show back-facing angles or 360-degree rotations.";

export function isClothingProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(clean)) {
    return false;
  }
  if (isFurnitureProduct(clean)) {
    return false;
  }
  return /(เสื้อ|กางเกง|กระโปรง|ชุด|เดรส|แจ็คเก็ต|สเวตเตอร์|ฮู้ด|เสื้อผ้า|แฟชั่น|เข็มขัด|หมวก|ถุงเท้า|กางเกงยีนส์|ชุดเดรส|ชุดเซ็ท|ชุดกระโปรง|ผ้าพันคอ|ผ้าคลุม|clothing|clothes|apparel|dress|shirt|tshirt|tee|pants|trousers|jacket|hoodie|skirt|outfit|garment|fashion|\bwear\b|suit|coat|\btop\b|\bbottom\b)/i.test(clean);
}

const PRINTED_GRAPHIC_FIDELITY_DIRECTION = "STRICT LOGO & PRINTED TEXT FIDELITY LOCK: Reproduce all printed surface artwork, brand logos, typography, font styles, symbols, badges, illustrations, and packaging text EXACTLY as in the reference image. Maintain the exact text placement, letter alignment, font weight, line spacing, logo proportion, and colors. Copy it 100% pixel-faithfully; NEVER redraw with a different font, NEVER restyle, simplify, omit, alter, or replace any logo or text. For video frames, all printed text and logos must remain static and crisp on the product surface.";

const COLOR_AND_PATTERN_FIDELITY_DIRECTION = "EXACT COLOR & PATTERN ACCURACY: Preserve the exact colors, patterns, artwork, and motifs from the reference. Do NOT shift, alter, recolor, or replace original colors or graphics under any lighting or environment effect.";

const SPRAY_BOTTLE_FIDELITY_DIRECTION = "SPRAY BOTTLE & PACKAGING LABEL FIDELITY LOCK: The product is a spray bottle, pump spray, aerosol canister, or liquid grooming bottle. You MUST reproduce the EXACT bottle shape, trigger/spray pump nozzle type, cap style, liquid container color, and printed front label artwork 100% pixel-faithfully as shown in the reference image. Preserve the exact brand logo, product name typography, printed graphics, patterns, illustrations, animal mascot graphics, and label colors. Do NOT draw a plain generic bottle, do NOT omit or change the brand logo/pattern, and do NOT alter the spray nozzle shape or label design.";
const EYEWEAR_FIDELITY_DIRECTION = "For eyewear, the size and scale of the glasses must be perfectly proportioned to a human face, head, or hands. Do not make the glasses abnormally large, tiny, or out-of-scale relative to the presenter. Maintain the exact frame shape, lens color/transparency, bridge width, and temple length.";
const BEAUTY_SKINCARE_FIDELITY_DIRECTION = "For cosmetics, skincare, and personal care (creams, serums, lipsticks, bottles, tubes, compacts): preserve the exact container bottle/jar/tube shape, dispenser cap/pump type, brand logo, printed text, label artwork, and formula texture. Do not alter container proportions, lid type, or packaging design.";
const COFFEE_BAG_FIDELITY_DIRECTION = "STRICT COFFEE POUCH & PRINTED LABEL TYPOGRAPHY LOCK: The product is a printed coffee bag or coffee bean pouch. You MUST reproduce the EXACT printed front label artwork, brand logo, emblem, typography, font style, exact Thai/English brand text, weight markings (e.g. 200g/250g/500g), coffee bean illustrations, roasting badges, degassing valve, seal crimp edges, and pouch shape (e.g., gusseted pouch or flat-bottom bag) 100% pixel-faithfully as shown in the reference image. Maintain the exact label background color, logo placement, badge alignment, and printed text layout without redrawing, altering, replacing, simplifying, changing fonts, or writing gibberish on the label.";
const ELECTRONICS_GADGETS_FIDELITY_DIRECTION = "For tech/gadgets, preserve exact body contours, button placement, screen bezel width, port cuts, texture, and brand logo. Do not distort device shape.";
const PHONE_CASE_FIDELITY_DIRECTION = "STRICT PHONE CASE & MOBILE ACCESSORY FIDELITY LOCK: You MUST reproduce the phone case (or mobile cover) EXACTLY as depicted in the reference image. PRESERVE EXACT 3D FORM & CUTOUT GEOMETRY: All camera lens cutout shapes, camera bump border, side button covers, speaker/charger port cutouts, edge bevels, AND any built-in magnetic ring (MagSafe ring) MUST be rendered 100% pixel-faithfully without any deformation. EXACT PRINTED ARTWORK & PATTERNS: Any printed cartoon graphics, illustrations, brand artwork, typography, pattern motifs, magnetic ring circle, or charm attachments MUST be reproduced 100% pixel-faithfully in exact position, colors, and layout. ZERO WARPING & SHAPE DRIFT RULE: The phone case must remain 100% rigid, perfectly fitted to a phone, and static without morphing, bending, stretching, or shifting design elements across video frames.";
const JEWELRY_FIDELITY_DIRECTION = "For jewelry/watches, preserve exact gemstone cuts, metal luster/shade, chain link style, clasp, watch face indices, and sub-dials. Do not alter craftsmanship details.";
const BAGS_ACCESSORIES_FIDELITY_DIRECTION = "STRICT BAGS & ACCESSORIES STRUCTURAL FIDELITY LOCK: You MUST reproduce the bag (handbag, backpack, tote bag, shoulder bag, cross-body bag, wallet, or pouch) EXACTLY as depicted in the reference image. PRESERVE EXACT 3D SHAPE & HARDWARE: All bag silhouettes, strap/handle drop lengths, zipper pulls, metal clasps, buckles, stitching lines, and pocket placements MUST be rendered 100% pixel-faithfully without structural warping. MATERIAL TEXTURE & PRINTED ARTWORK: Preserve exact leather grain, canvas weave, nylon sheen, quilted pattern, brand monogram, logo plaque, or printed artwork. ZERO DEFORMATION RULE: The bag must maintain its true 3D structure and form naturally without melting, twisting, stretching, or morphing across video frames.";
const FOOD_BEVERAGE_FIDELITY_DIRECTION = "For food, beverages, coffee, and supplements: preserve the exact pouch/bottle/jar packaging shape, printed artwork, label text, and food presentation. Do not warp packaging dimensions or branding.";
const GENERAL_PACKAGING_FIDELITY_DIRECTION = "UNIVERSAL PRODUCT & PACKAGING LABEL FIDELITY LOCK: You MUST reproduce the target product EXACTLY as shown in the reference image. Preserve its 100% exact 3D form, packaging shape, container type, brand logo, printed text, front label artwork, graphic illustrations, typography, color scheme, and texture. Copy the reference image pixel-faithfully; do NOT redesign, simplify, alter, recolor, or warp the product or its packaging in any way.";
const HOME_LIVING_FIDELITY_DIRECTION = "For home goods, kitchenware, tumblers, mugs, and bedding: preserve the exact item shape, handle, lid, material texture (ceramic, stainless steel, fabric), print pattern, and proportions.";
const TUMBLER_BOTTLE_FIDELITY_DIRECTION = "STRICT TUMBLER & WATER BOTTLE FIDELITY LOCK: You MUST reproduce the tumbler, mug, or water bottle EXACTLY as depicted in the reference image. PRESERVE EXACT 3D SHAPE & HARDWARE: The exact cylindrical taper, height-to-width ratio, handle shape and placement (if any), lid type, straw (if present), spout, and bottom base MUST be rendered 100% pixel-faithfully without warping. EXACT MATERIAL & ARTWORK: Preserve the exact material finish (matte, glossy stainless steel, gradient colors, powder coating) and ALL printed surface artwork, brand logos, cartoon characters, and patterns 100% pixel-faithfully. ZERO DEFORMATION RULE: The cup must remain 100% rigid, perfectly cylindrical, and static without melting, denting, or shifting dimensions across video frames.";
const FURNITURE_FIDELITY_DIRECTION = "STRICT FURNITURE & INTERIOR STRUCTURAL FIDELITY LOCK: You MUST reproduce the furniture piece (table, chair, sofa, desk, cabinet, shelf, wardrobe, bed, armchair, or home decor) EXACTLY as depicted in the reference image. PRESERVE EXACT 3D GEOMETRY & ARCHITECTURAL REALISM: All legs (strictly straight, vertical, and sturdy 4-leg or pedestal frame), tabletop thickness, armrests, seat cushion depth, backrest angle, wood grain orientation, upholstery fabric weave/leather texture, and metal joint hardware MUST be rendered 100% pixel-faithfully without any structural distortion or warping. ZERO DYNAMIC WARPING RULE: The furniture piece is 100% rigid architectural furniture resting flat and grounded on the floor. It must NEVER bend, melt, sway, stretch, warp, twist, float, or change shape as the camera moves. PHYSICAL PROPORTIONS & SCALE: Maintain true-to-life scale and proportions relative to the surrounding room, floor, walls, and any presenter standing or sitting near it. Do not distort legs or shrink/enlarge any component relative to the rest of the piece.";

const SPEECH_DIRECTION = "STRICT PROGRESSIVE SCENE NARRATION & ZERO REPETITION LOCK: Each scene in the video MUST have its own UNIQUE, DIFFERENT spoken sentence in Thai that flows naturally. ABSOLUTELY FORBIDDEN: NEVER repeat, loop, echo, or re-say the sentence spoken in the previous scene. Scene 2 MUST speak a NEW, DIFFERENT sentence from Scene 1; Scene 3 MUST speak a NEW, DIFFERENT sentence from Scene 2. Maintain a continuous, natural progressive voiceover across all scenes without repeating any phrase or sentence.";
const VOICEOVER_DIRECTION = "Add a natural Thai off-screen voiceover narration (no visible person). All spoken audio must be in Thai.";

const TEXT_FREE_DIRECTION = "STRICT NO-TEXT RULE: Do not add any text overlays, subtitles, captions, price tags, banners, promotional copy, watermarks, CTA, or signs. Absolutely no on-screen text, writing, or numbers should be added. Keep the product's own printed text exactly as in reference, but do not add any new, extra, or unnecessary text.";

const NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION = "STRICT THAI LANGUAGE ONLY & ZERO GIBBERISH LOCK: All visible text overlays, packaging writing, captions, signs, and spoken dialogue MUST be in 100% correct, flawless Thai script ONLY (ข้อความภาษาไทยถูกต้องเท่านั้น). ABSOLUTELY FORBIDDEN: Do NOT write or render foreign scripts (Chinese, Japanese, Korean, Arabic, etc.), distorted gibberish symbols, or fake pseudo-letters anywhere on the product, background, or video frame.";

const STRICT_SHOP_LOGO_EXCLUSION_RULE = "CRITICAL RULE — STRICTLY FORBIDDEN: Do NOT copy, replicate, draw, or include any shop logos, store branding watermarks, seller profile logos, platform badges, e-commerce icons, or corner watermarks visible in the reference photo. Extract ONLY the physical product object itself. Absolutely NO shop logos, NO store names, NO watermarks, NO seller stamps, and NO platform icons anywhere on the generated image or video.";

const NO_ADDED_PATTERNS_OR_GRAPHICS_RULE = "STRICT PLAIN & SOLID-COLOR PRODUCT RULE: If the reference product is plain, blank, or solid-colored without printed graphics, patterns, or logos, you MUST keep the product 100% PLAIN, SOLID-COLOR, and CLEAN. Strictly FORBIDDEN: Do NOT invent, add, or draw any extra patterns, stripes, graphics, logos, prints, or decorations that do not exist on the reference photo.";
const NO_HALLUCINATED_BRAND_LOGOS_RULE = "ZERO HALLUCINATED BRANDS & LOGOS: Strictly FORBIDDEN to generate, invent, or place any brand names, text, typography, emblems, or logos on the product surface if they do NOT exist in the original reference image. Do NOT add random brands, gibberish text marks, or fake logos to the product.";

const STRICT_PRODUCT_IDENTITY_RULE = "STRICT PRODUCT IDENTITY: Do not invent new design details, buttons, stripes, logos, or decorations not on the reference. Render any texture finish (matte, glossy, metallic, fabric) or gradient with 100% precision. Do not compromise product accuracy for style.";

const NO_PEOPLE_DIRECTION = "No people, faces, presenters, reviewers, or characters.";

export function isKidsProduct(text = "") {
  return /(จักรยานเด็ก|รถเด็ก|ของใช้เด็ก|ของเล่นเด็ก|คาร์ซีท|รถเข็นเด็ก|กระเป๋านักเรียน|เสื้อผ้าเด็ก|ชุดเด็ก|ของเล่น|เด็ก|kids|kid|toddler|baby|children)/i.test(String(text || ""));
}

export function isFarmPoultryProduct(text = "") {
  return /(อาหารไก่|หัวอาหารไก่|อาหารนก|อาหารปลา|อาหารหมู|อาหารวัว|อาหารกุ้ง|chicken feed|poultry feed|fish food|bird food)/i.test(String(text || ""));
}

export function isSunProtectionProduct(text = "") {
  return /(กันแดด|หมวกกันแดด|หมวกปีกกว้าง|ปลอกแขนกันแดด|เสื้อกันแดด|เสื้อกัน uv|แว่นกันแดด|ร่มกันแดด|สเปรย์กันแดด|โลชั่นกันแดด|ครีมกันแดด|กันแดดหน้า|กันแดดตัว|sunscreen|sunblock|sun lotion|sun spray|sun hat|sun visor|sun glasses|sunglasses|spf)/i.test(String(text || ""));
}

export function isHeadwearProduct(text = "") {
  return /(โม่ง|โม่งกันแดด|โม่งคลุมหัว|โม่งขับรถ|หมวกโม่ง|ผ้าบัฟ|ผ้าบัฟฟ์|โม่งขี่มอไซค์|หมวกกันแดด|หมวก|หมวกกันน็อก|หมวกแคป|หมวกปีก|balaclava|buff|face mask|headwear|sun hood|riding hood|helmet|neck gaiter)/i.test(String(text || ""));
}

export function isFullFaceCoveringProduct(text = "") {
  return /(โม่ง|โม่งคลุมหน้า|โม่งคลุมหมดหน้า|โม่งปิดปาก|ผ้าปิดปาก|ผ้าปิดจมูก|หน้ากากอนามัย|แมสก์|หน้ากาก|balaclava|full face balaclava|face mask|ski mask|mouth mask|gaiter)/i.test(String(text || ""));
}

export function isPhoneCaseProduct(text = "") {
  return /(เคส|เคสมือถือ|เคสโทรศัพท์|เคสไอโฟน|phone case|phone cover|mobile case|mobile cover|magsafe)/i.test(String(text || ""));
}

export function isMagneticPhoneCaseProduct(text = "") {
  return /(แม่เหล็ก|magsafe|วงกลม|ชาร์จไร้สาย|wireless charge|magnetic|ขาตั้งยึด|ยึดแม่เหล็ก)/i.test(String(text || ""));
}

const PHONE_CASE_MULTI_SHOT_MANDATE = "MULTI-ANGLE PHONE CASE SHOT MANDATE (โชว์หลายมุมหลายช็อต): The video MUST showcase the phone case across multiple distinct close-up angles (Scene 1: Full back cover artwork & built-in magnetic ring design, Scene 2: Close-up zoom of camera lens cutout border & side button covers, Scene 3: Bottom charging port cutout & edge finish, Scene 4: Full phone case fitted elegantly). Provide sequential multi-shot coverage highlighting every angle, built-in magnetic ring feature, and detail of the phone case.";

const MAGNETIC_PHONE_CASE_FIDELITY_MANDATE = "BUILT-IN MAGNETIC RING (MAGSAFE) FEATURE LOCK (วงกลมแม่เหล็กในตัว ชาร์จไร้สาย/ยึดขาตั้งง่าย): The circular ring on the back of the case is a built-in magnetic ring (MagSafe ring) integrated directly into the case for wireless charging alignment and magnetic stand mounting. Render this circular magnetic ring crisp, clean, centered, and 100% built-in seamlessly into the case back. ABSOLUTELY FORBIDDEN: Do NOT render external stick-on pads, separate adhesive magnetic plates, or extra stick-on accessories. The magnetic ring is 100% built-in to the case itself — no extra attachments or stick-ons required.";

const FARM_POULTRY_FEED_EXCLUSION_RULE = "POULTRY & LIVESTOCK FEED SPECIFIC RULE: This product is poultry/farm livestock feed (such as chicken feed). ABSOLUTELY FORBIDDEN: Do NOT render dogs, cats, puppies, kittens, or house pets in the scene under any circumstances. Present the product packaging and feed granules cleanly in a farm, warehouse, or natural outdoor environment.";

const SUNSCREEN_FIDELITY_DIRECTION = "SUN PROTECTION & SUN HAT SCENE LOCK: Place sun protection products (sunscreen, sun hats, sun visors, sunglasses, UV sleeves/jackets) in a bright, beautiful sunny outdoor environment (such as a sunlit park, outdoor garden, sunny promenade, outdoor cafe terrace, poolside, or beach with natural bright daylight). Vary the outdoor setting naturally. STRICTLY FORBIDDEN: Do NOT place sun protection products or sun hats in dark indoors, windowless rooms, or dim shaded interiors.";

const HEADWEAR_NEVER_REMOVE_MANDATE = "STRICT HEADWEAR & BALACLAVA WEARING LOCK (ห้ามถอดโม่ง/หมวก/ผ้าบัฟเด็ดขาด): Presenter MUST keep the balaclava, sun hood, buff mask, helmet, or hat 100% fully worn and properly positioned on their head/face across ALL scenes. ABSOLUTELY FORBIDDEN: Presenter MUST NEVER remove, pull down, take off, unmask, lift, or adjust the balaclava, buff, hood, or hat at any point during the video. It must stay continuously worn on their head/face throughout the entire clip from start to finish.";

const FULL_FACE_COVERAGE_LOCK = "STRICT FABRIC MOUTH-COVERING LOCK (ปิดปากมิดชิดธรรมชาติ ห้ามเห็นปาก/ห้ามขยับปากใต้ผ้า): The fabric of the balaclava/mask MUST remain 100% solid, smooth, opaque, and completely covering the mouth, lips, nose, and chin naturally across ALL frames. ABSOLUTELY FORBIDDEN & CRITICAL MOTION RULE: Do NOT show visible lips, mouth opening, lip-sync movement, or mouth contours deforming through the fabric when speaking. All Thai narration MUST be an off-screen/over-fabric voiceover with the fabric remaining completely smooth, static, and solid over the mouth without any mouth opening or lip distortion.";

/**
 * @description เลือก doodle style ตามประเภทสินค้าและกลุ่มเป้าหมาย
 * @param {object} productInfo - ข้อมูลสินค้า (name, category, targetGroup)
 * @returns {string} คำอธิบาย doodle สำหรับใส่ใน prompt
 */
function resolveDoodleStyle(productInfo = {}) {
  const text = [
    productInfo.name || "",
    productInfo.category || "",
    productInfo.targetGroup || "",
    productInfo.highlights || ""
  ].join(" ").toLowerCase();

  // Beauty / Skincare / Cosmetics
  if (/(ครีม|เซรั่ม|ลิป|แป้ง|มาสก์|สกิน|เมคอัพ|ไลเนอร์|บลัช|กันแดด|น้ำหอม|ของแต่งหน้า|beauty|skincare|cosmetic|perfume|serum|moisturizer|lipstick|makeup|blush|sunscreen)/i.test(text)) {
    return "small sparkles ✨, tiny flowers 🌸, and delicate hearts 💖";
  }

  // Food / Snack / Drink / Coffee
  if (/(อาหาร|ขนม|กาแฟ|ชา|เครื่องดื่ม|น้ำ|ผล|ส้ม|ช็อก|คุก|เค้ก|พิซซ่า|food|snack|drink|coffee|tea|juice|cake|chocolate|cookie|beverage|fruit)/i.test(text)) {
    return "tiny stars ⭐, small leaf doodles 🍃, and sparkles ✨";
  }

  // Fashion / Clothing / Shoes / Bags
  if (/(เสื้อ|กางเกง|กระโปรง|รองเท้า|กระเป๋า|แฟชั่น|เข็มขัด|หมวก|ผ้า|ถุง|fashion|clothing|clothes|shoes|bag|dress|shirt|pants|hat|accessory|accessories)/i.test(text)) {
    return "tiny hearts 💖, ribbon bow doodles 🎀, and small stars ⭐";
  }

  // Tech / Electronics / Gadgets
  if (/(โทรศัพท์|มือถือ|แล็ป|คอม|ลำโพง|หูฟัง|ชาร์จ|สาย|แบต|กล้อง|พัดลม|ไฟ|เครื่อง|ดิจิ|tech|phone|laptop|speaker|earphone|charger|cable|battery|camera|electronic|gadget|device)/i.test(text)) {
    return "small lightning bolt ⚡ doodles, arrow doodles →, and geometric star shapes ✦";
  }

  // Home / Furniture / Kitchen
  if (/(บ้าน|ห้อง|ตู้|เตียง|โซฟา|เก้าอี้|โต๊ะ|ครัว|จาน|ชาม|หม้อ|กระทะ|บ้าน|home|furniture|kitchen|table|chair|sofa|bed|shelf|drawer|cookware|plate|bowl|pot|pan)/i.test(text)) {
    return "small house doodles 🏠, tiny stars ⭐, and simple arrow doodles";
  }

  // Health / Supplement / Medicine / Sport
  if (/(วิตามิน|อาหารเสริม|ยา|สุขภาพ|ออกกำลัง|กีฬา|โปรตีน|vitamin|supplement|health|sport|fitness|protein|medicine|workout|gym)/i.test(text)) {
    return "small star doodles ⭐, sparkles ✨, and upward arrow doodles ↑";
  }

  // Baby / Kids / Toys
  if (/(เด็ก|ทารก|ของเล่น|baby|kid|children|toy|infant|toddler)/i.test(text)) {
    return "tiny hearts 💖, small star doodles ⭐, and cute sparkles ✨";
  }

  // Pet
  if (/(สัตว์เลี้ยง|หมา|แมว|สุนัข|pet|dog|cat|animal)/i.test(text)) {
    return "tiny paw print doodles 🐾, small hearts 💖, and sparkles ✨";
  }

  // Default — generic cute doodles
  return "small hearts 💖, sparkles ✨, and star doodles ⭐";
}


const VOICE_TONES = {
  Auto: "Let AI choose the most suitable voice tone for the product and audience",
  kind: "Kind, friendly, and gentle tone",
  fun: "Fun, high-energy, and playful tone",
  complain: "Funny complaining and slightly annoyed but hilarious tone",
  professional: "Professional, authoritative, and expert tone",
  hype: "Super excited, fast-talking, and high-hype tone"
};

/**
 * @description คืนค่า default settings สำหรับการสร้าง prompt
 * @returns {object} ค่าเริ่มต้นทั้งหมด
 */
export function getDefaultSettings() {
  return {
    videoStyle: "testimonial",
    presenter: "Auto",
    customPresenter: "",
    voiceTone: "Auto",
    mood: "Auto",
    location: "Auto",
    customLocation: "",
    language: "ไทย",
    textEnabled: "false",
    clipText: "",
    promotionText: "",
    cta: "🛒 กดสั่งซื้อที่ตะกร้าด้านล่าง",
    customCta: "",
    textPosition: "Auto",
    cameraMovement: "Auto",
    pacing: 2,
    transition: "Auto",
    postAction: "post",
    postRandomCaptionHook: true,
    firstSceneNoPeople: false,
    modelRefImage: "",
    imageMode: "single"
  };
}

/**
 * @description คืนค่า default product info
 * @returns {object} ข้อมูลสินค้าเริ่มต้น
 */
export function getDefaultProductInfo() {
  return {
    productId: "",
    name: "",
    price: "",
    currency: "THB",
    highlights: "",
    targetGroup: "ทั่วไป",
    customTargetGroup: "",
    cta: "สั่งได้เลย",
    imageUrls: [],
    productUrl: ""
  };
}

/**
 * @description จัดรูปแบบราคาให้สวยงาม (เช่น ฿1,200)
 * @param {object} product - product info
 * @returns {string} formatted price
 */
export function formatPrice(product) {
  if (!product.price) return "";
  const symbol = product.currency === "THB" ? "฿" : product.currency;
  return `${symbol}${Number(product.price).toLocaleString()}`;
}

/**
 * @description ทำความสะอาดข้อความเพื่อใช้ใน prompt
 * @param {unknown} value - ค่าที่รับจาก user หรือ API
 * @returns {string} ข้อความที่ปลอดภัยขึ้น
 */
export function sanitizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 1200);
}

/**
 * @description ดึงหรือสร้างข้อความที่จะปรากฏบนหน้าจอวิดีโอ (on-screen text overlay)
 *   Priority: settings.clipText (user typed) → overlayText (AI ≤5 words) → highlights[0] → naturalWordings fallback
 *   hooks[] is NOT used here — hooks are for captions/TikTok copy, not on-screen overlays.
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} ข้อความภาษาไทย ≤5 คำ / ≤20 ตัวอักษร
 */
export function resolveClipText(productInfo, settings = {}) {
  // 1. User typed something explicitly → use as-is (still truncate for safety)
  if (settings?.clipText && String(settings.clipText).trim()) {
    let manual = String(settings.clipText).trim();
    if (manual.length > 20) manual = manual.slice(0, 18).trim() + "..";
    return manual;
  }

  let phrase = "";

  // 2. AI-generated overlayText — specifically designed for on-screen use (≤5 Thai words)
  if (productInfo?.overlayText && String(productInfo.overlayText).trim()) {
    phrase = String(productInfo.overlayText).trim();
  }
  // 3. First highlight segment as fallback
  else if (productInfo?.highlights) {
    const parts = Array.isArray(productInfo.highlights)
      ? productInfo.highlights
      : String(productInfo.highlights).split(/[,\n;]/);
    phrase = String(parts[0] || "").trim();
  }
  // 4. hooks[0] truncated — for products analyzed before overlayText was added
  else if (productInfo?.hooks && productInfo.hooks.length > 0) {
    const h = String(productInfo.hooks[0]).trim();
    // take first 3 space-separated tokens at most (Thai hooks have no spaces usually, so this is a safety net)
    phrase = h.split(/\s+/).slice(0, 3).join(" ");
  }

  // 5. Stable but varied natural-language fallback — hash on full name string for diversity
  if (!phrase) {
    const naturalWordings = [
      "น่าใช้มาก",
      "ดีไซน์สวย",
      "ใช้งานง่าย",
      "ดูดีมาก",
      "สะดวกสุดๆ",
      "รายละเอียดดี",
      "น่ามีติดบ้าน",
      "คุ้มค่าน่าใช้"
    ];
    // djb2-style hash on the product name for stable but varied selection
    const nameStr = String(productInfo?.name || "x");
    let hash = 5381;
    for (let i = 0; i < nameStr.length; i++) {
      hash = ((hash << 5) + hash) + nameStr.charCodeAt(i);
      hash = hash & 0x7fffffff; // keep positive 32-bit
    }
    phrase = naturalWordings[hash % naturalWordings.length];
  }


  // Strip emoji/symbols that confuse image generators
  phrase = phrase.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "").trim();

  // Hard cap at 20 characters
  if (phrase.length > 20) phrase = phrase.slice(0, 18).trim() + "..";

  return phrase;
}




export function buildImagePrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const productName = generationProductName(productInfo.name, productInfo.category) || "the attached product";
  const details = compactPromptText(productInfo.highlights || "", 100).replace(/[^\x00-\x7F]/g, "").trim();
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const productText = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const isHeavy = isHeavyProduct(productText);
  const specificScale = getProductSpecificScaleInstruction(productText);

  const handsOnly = auto.presenter === "hands_only";
  const noPeople = !(auto.presenter && auto.presenter !== "none");

  const isAnimal = auto.presenter === "dog" || auto.presenter === "cat";

  const isSingleMode = true; // FORCE SINGLE MODE ALWAYS: Prevents "4-panel grid" hallucination (ไม่ต้องตอนภาพ/แบ่งภาพ)

  // Phase 1 STILL IMAGE: ALWAYS use a single full-frame high-resolution hero product photograph to ensure 100% exact product fidelity, sharp label text, and exact brand logo reproduction without multi-panel grid compression distortion.
  const intro = `A high-fidelity single full-frame authentic smartphone camera photograph in a vertical 9:16 layout, showing ${productName} clearly in the center with 100% exact, crystal-clear, 1-to-1 pixel-faithful reference product replica, brand logo, and printed packaging text. Rendered with natural everyday mobile camera quality, completely avoiding artificial commercial studio lighting, hyper-processed gloss, or ad staging.`;

  const modelRefImage = productInfo?.modelRefImage || settings?.modelRefImage || "";
  const hasModelRefImage = Boolean(modelRefImage && String(modelRefImage).trim());

  const isKids = isKidsProduct(productText) || ["child", "older_child", "baby", "toddler"].includes(auto.presenter);

  let peopleDirection = "";
  if (handsOnly) {
    peopleDirection = `${HANDS_DIRECTION}\n${HANDS_ONLY_FACE_EXCLUSION}`;
  } else if (isAnimal) {
    peopleDirection = `Pet Animal: A cute, friendly pet animal (${auto.presenter === "cat" ? "cat" : "dog"}) sitting next to or interacting naturally with the product in a bright, clean indoor setting. ${ANIMAL_PRESENTER_DIRECTION}`;
  } else if (isKids && auto.presenter !== "none") {
    peopleDirection = `${KIDS_WITH_PARENT_DIRECTION}`;
  } else if (auto.presenter && auto.presenter !== "none") {
    if (hasModelRefImage) {
      let presenterInstruction = PRESENTERS[auto.presenter] || PRESENTERS.none;
      if (auto.presenter === "กรอกเอง") {
        presenterInstruction = auto.customPresenter || "a presenter";
      }
      peopleDirection = `Presenter: ${presenterInstruction}\nCRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION: The presenter generated MUST have an ENTIRELY BRAND NEW, COMPLETELY DIFFERENT face, hairstyle, and facial features from any person shown in the reference photo. ABSOLUTELY FORBIDDEN: Do NOT copy, clone, mirror, or resemble the face of any person appearing in the reference photo under any circumstances. Always generate a brand new presenter face from scratch.`;
    } else {
      peopleDirection = "Product Focus: Focus entirely on a clean, sharp, authentic smartphone camera product presentation. The target product is the primary hero focal point in the center of the frame in true scale.\nCRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION: If any person or presenter is rendered, the presenter MUST have an ENTIRELY BRAND NEW, COMPLETELY DIFFERENT face, facial structure, and hairstyle from any person shown in the product reference image. ABSOLUTELY FORBIDDEN: Do NOT copy, match, replicate, mirror, or resemble the face of any person appearing in the reference photo under any circumstances.";
    }
  } else {
    peopleDirection = NO_PEOPLE_DIRECTION;
  }

  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true");

  // If user typed a specific phrase → pass it; otherwise let Flow decide freely
  const userPhrase = settings?.clipText ? sanitizeText(String(settings.clipText).trim()) : "";

  const productTextFidelityDirection = textEnabled
    ? "STRICT PRODUCT FIDELITY: Any text, labels, brand names, logos, or writing printed ON the product surface and packaging itself must match the reference image exactly. Do NOT alter, translate, add, or remove any text on the product surface. Do NOT write or overlay any of the new promotional text onto the product or its packaging directly."
    : "STRICT PRODUCT FIDELITY: Any text, labels, brand names, logos, or writing printed ON the product surface and packaging itself must match the reference image exactly. Do NOT alter, translate, add, or remove any text on the product surface. Do NOT add any extra text or promotional overlays on the product.";

  const doodles = resolveDoodleStyle(productInfo);

  const textStyleStr = TEXT_FONT_STYLES[settings?.textStyleFont] || TEXT_FONT_STYLES.handwriting;

  const textDirection = textEnabled
    ? userPhrase
      ? `Visible text overlay is enabled. Place ONLY this single short Thai phrase neatly onto the image: "${userPhrase}". Render the Thai script with perfect spelling, ensuring every consonant, vowel, and tone mark (such as ไม้เอก, ไม้โท, etc.) is in the correct vertical stack and perfectly placed. Style it as ${textStyleStr}. Include 1–2 small doodles nearby (${doodles}). Do NOT add any other text, product name, price, CTA, or promotion text. Do not block important parts of the product. Position overlay at ${settings?.textPosition || "Middle"}. STRICTLY FORBIDDEN: no English text, romanized Thai, or gibberish.`
      : `Visible text overlay is enabled. Creatively add ONE short cute Thai phrase (1–5 words, naturally matching this product) as a ${textStyleStr} overlay. The chosen Thai phrase must have flawless Thai spelling and grammar, with correct vowels and tone marks properly stacked. Include 1–2 small doodles nearby (${doodles}). Do NOT add product name, price, CTA, or promotion text. Do not block important parts of the product. Position overlay at ${settings?.textPosition || "Middle"}. Text must be natural Thai — no English, no gibberish.`
    : `${TEXT_FREE_DIRECTION}\nFinal check: ensure no added text or numbers exist in the output.`;


  const sceneStyle = (noPeople || handsOnly) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle)
    ? "review"
    : auto.videoStyle;

  const styleObj = VIDEO_STYLES.find(s => s.id === sceneStyle);
  let styleFragment = styleObj ? styleObj.fragment : "";

  if (noPeople) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character|hands?)\b[^.;]*[.;]?/gi, "")
      .replace(/\b(?:hands?|people|presenters?|reviewers?|characters?)\b/gi, "");
  } else if (handsOnly) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character)\b[^.;]*[.;]?/gi, "hands ")
      .replace(/\b(?:people|presenters?|reviewers?|characters?)\b/gi, "hands");
  }

  const isClothing = isClothingProduct(productText);
  let shotDistribution = isSingleMode
    ? (isClothing
        ? "Single full-frame front shot: Depict ONLY the front-facing view of the clothing item in one single, high-resolution full-frame photograph centered in a 9:16 vertical layout. Highlight fabric texture, front logo, and front details. STRICT RULE: Show ONLY the front view of the garment; do NOT show the back view or reverse side."
        : "Single full-frame hero shot: Depict the product in one single, high-resolution full-frame photograph centered in a 9:16 vertical layout. Maintain 100% exact product fidelity, printed text, brand logo, and packaging artwork.")
    : (isClothing
        ? "Multi-angle 4-panel grid collage layout: A 4-panel split layout showing the clothing item from 4 clean front-facing perspectives (Panel 1: Full outfit view, Panel 2: Upper body close-up of collar/logo, Panel 3: Fabric texture detail, Panel 4: Lifestyle presentation). Maintain 100% identical garment cut, color, logo, and texture across all panels."
        : "Multi-angle 4-panel grid collage layout: A 4-panel split layout showing the product from 4 distinct angles (Panel 1: Front view hero shot, Panel 2: Side/3-quarter angle view, Panel 3: Macro close-up of texture/logo, Panel 4: Realistic lifestyle context). Maintain 100% identical product appearance, packaging artwork, colors, and printed text across all 4 panels.");

  let scaleInstruction = "";
  if (handsOnly) {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Small consumer product scale: The product is a small, lightweight, pocket-sized/hand-sized item. Depict it in a realistic small scale relative to the hands in every panel. STRICT RULE: Do not make the product look abnormally large, giant, or oversized. Avoid extreme closeups that make the product fill the entire panel; keep a visible margin of surrounding space, hands, or background around the product to clearly show its compact hand-sized scale (Strictest rule: Product size must be realistic and in true scale relative to the hands; never make the product abnormally large).";
    if (!isHeavy) {
      scaleInstruction += " The physical size of the product must be perfectly proportional and realistic relative to the human hands holding it. Do not make the product abnormally giant, massive, or tiny relative to the hands.";
    }
  } else if (noPeople) {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Small consumer product scale: The product is a small, lightweight, pocket-sized/hand-sized item. Depict it in a realistic small scale relative to the environment in every panel. STRICT RULE: Do not make the product look abnormally large, giant, or oversized. Avoid extreme closeups that make the product fill the entire panel; keep a visible margin of surrounding space or background around the product to clearly show its compact hand-sized scale (Strictest rule: Product size must be realistic and in true scale relative to its environment; never make the product abnormally large).";
  } else {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Small consumer product scale: The product is a small, lightweight, pocket-sized/hand-sized item. Depict it in a realistic small scale relative to the environment, hands, or presenter in every panel. STRICT RULE: Do not make the product look abnormally large, giant, or oversized. Avoid extreme closeups that make the product fill the entire panel; keep a visible margin of surrounding space, hands, or background around the product to clearly show its compact hand-sized scale (Strictest rule: Product size must be realistic and in true scale relative to its environment or presenter; never make the product abnormally large).";
  }

  const locationSetting = auto.location || inferRequiredProductLocation(productInfo) || "Clean Modern Studio";
  const imageBackgroundDirection = handsOnly
    ? HANDS_ONLY_BACKGROUND_DIRECTION
    : `NEW REALISTIC BACKGROUND SCENE & NATURAL ATMOSPHERE: After extracting ONLY the target product from the reference image, place it into a BRAND NEW, highly realistic ${locationSetting} background scene. NATURAL SMARTPHONE ATMOSPHERE: Enhance the background with clean, organic everyday lighting, realistic depth of field, authentic real-life textures, and a believable environment tailored specifically to this product category. FORBIDDEN: Do NOT use hyper-processed commercial studio gloss, fake HDR sheen, or artificial CGI lighting. The scene MUST look authentic, natural, and grounded in real life.`;

  const promptParts = [
    intro,
    PRODUCT_FIDELITY_DIRECTION,
    STRICT_PRODUCT_IDENTITY_RULE,
    PRODUCT_ISOLATION_DIRECTION,
    PRINTED_GRAPHIC_FIDELITY_DIRECTION,
    COLOR_AND_PATTERN_FIDELITY_DIRECTION,
    FULL_PRODUCT_VISIBILITY_DIRECTION,
    scaleInstruction,
    "Critical: The generated image must maintain absolute fidelity to the product shape, colors, branding, and text (100% identical). Do not redesign, warp, or modify structure. Strictest rule: The product must look exactly like the reference photo, pixel-for-pixel.",
    shotDistribution,
    specificScale,
    PRODUCT_STRUCTURE_DIRECTION,
    categoryDirection,
    analysisDirection,
    isFarmPoultryProduct(productText) ? FARM_POULTRY_FEED_EXCLUSION_RULE : "",
    isSunProtectionProduct(productText) ? SUNSCREEN_FIDELITY_DIRECTION : "",
    isHeadwearProduct(productText) ? HEADWEAR_NEVER_REMOVE_MANDATE : "",
    isFullFaceCoveringProduct(productText) ? FULL_FACE_COVERAGE_LOCK : "",
    imageBackgroundDirection,
    `Centered, true scale, sharp and clearly visible, uncluttered.${details ? ` Visually emphasize (do NOT write as text): ${details}.` : ""}`,
    peopleDirection,
    productTextFidelityDirection,
    NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION,
    STRICT_SHOP_LOGO_EXCLUSION_RULE,
    NO_ADDED_PATTERNS_OR_GRAPHICS_RULE,
    NO_HALLUCINATED_BRAND_LOGOS_RULE,
    textDirection
  ];

  return promptParts.filter(Boolean).join("\n");
}

function getProductWeightCategory(text = "") {
  const clean = text.toLowerCase();
  if (/(ผ้าคลุม|ผ้าปู|สติกเกอร์|ขาตั้ง|ตัวยึด|เบาะรอง|ปลอก|โมเดล|ของเล่น|จิ๋ว|miniature|toy|cover|sticker|case|holder|mount|cushion|protector)/i.test(clean)) {
    return "light";
  }

  // 1. Immobile/bulky products (e.g. furniture, cabinets, sinks, large appliances)
  const isImmobile = /(ตู้|เตียง|ลิ้นชัก|ชั้นวาง|โต๊ะ|เก้าอี้|โซฟา|เฟอร์นิเจอร์|เครื่องซักผ้า|ตู้เย็น|ทีวี|โทรทัศน์|ที่นอน|ฟูก|ลู่วิ่ง|จักรยาน|แอร์|เครื่องปรับอากาศ|เตาอบ|ไมโครเวฟ|เครื่องล้างจาน|ตู้แช่|ซิ้ง|ซิ้งค์|ซิงค์|อ่าง|อ่างล้าง|เคาน์เตอร์|cabinet|drawer|shelf|wardrobe|dresser|furniture|table|desk|chair|sofa|couch|bed|mattress|refrigerator|fridge|freezer|washing\s*machine|washer|dryer|dishwasher|tv|television|air\s*conditioner|treadmill|bicycle|bike|oven|stove|microwave|sink|counter)/i.test(clean);
  if (isImmobile) {
    return "immobile";
  }

  // 2. Check weight values first (so heavy sacks >= 25kg are classified as immobile)
  const weightRegex = /(\d+(?:\.\d+)?)\s*(?:กิโลกรัม|กิโล|กิโ|กก\.?|kg|kilograms?)(?![a-zA-Z0-9])/i;
  const match = clean.match(weightRegex);
  if (match) {
    const weightVal = parseFloat(match[1]);
    if (weightVal >= 25) {
      return "immobile"; // 25kg or more is immobile/extremely heavy
    }
    if (weightVal >= 5) {
      return "medium_heavy"; // 5-25kg is medium heavy
    }
  }

  // 3. Medium heavy/bulky but liftable products (sacks, dumbbells, etc.)
  const isMediumHeavyKeywords = /(กระสอบ|ข้าวสาร|ปุ๋ย|ปูนซีเมนต์|ปูน|ทรายแมว|อาหารสัตว์|อาหารสุนัข|อาหารหมา|อาหารแมว|sack|fertilizer|cement\s*bag|concrete\s*bag|pet\s*food\s*bag|dog\s*food\s*bag|cat\s*food\s*bag|cat\s*litter|dumbbell|ดัมเบล)/i.test(clean);
  if (isMediumHeavyKeywords) {
    return "medium_heavy";
  }

  return "light";
}

function isHeavyProduct(text = "") {
  return getProductWeightCategory(text) !== "light";
}

function getProductSpecificScaleInstruction(text = "") {
  const clean = text.toLowerCase();
  
  // Detect coffee bags, pouches, sachets, packets (ถุงกาแฟ, ซองกาแฟ, 200g, 250g, 500g)
  const isSmallPouch = /(กาแฟ|ชา|ผง|ถุง|ซอง|ห่อ|เมล็ด|coffee|tea|powder|pouch|bag|sachet|pack|packet|200\s*g|250\s*g|500\s*g|gr?a?m|กรัม)/i.test(clean);
  if (isSmallPouch && !/(กระสอบ|25\s*kg|50\s*kg|10\s*kg|5\s*kg)/i.test(clean)) {
    return "STRICT PRODUCT-SPECIFIC SIZE RULE: This product is a standard hand-sized 200-500g pouch or bag. It must be depicted in a realistic hand-sized scale, easily held in one or both hands (height of the pouch is about 15-20cm). It must not be depicted as a tiny pocket sachet, nor as a giant sack or massive bag. Keep it perfectly proportional as a standard coffee/tea bag.";
  }
  
  return "";
}
/**
 * @description เลือก Hook เด็ดๆ ตามหมวดหมู่สินค้า
 * @param {object} productInfo
 * @returns {string[]} อาเรย์ของประโยค Hook
 */
function resolveProductHook(productInfo = {}) {
  const text = [
    productInfo.name || "",
    productInfo.category || "",
    productInfo.targetGroup || "",
    productInfo.highlights || ""
  ].join(" ").toLowerCase();

  // Tumbler / Mug
  if (/(แก้ว|กระบอกน้ำ|ชากาแฟ|tumbler|mug|cup|bottle)/i.test(text)) {
    return [
      "สายชากาแฟ ไม่มีใบนี้ไม่ได้แล้วจริงๆ",
      "ใครเป็นมนุษย์ออฟฟิศที่ติดน้ำหวาน ต้องมีใบนี้ติดโต๊ะ",
      "เบื่อไหม ซื้อกาแฟมายังไม่ทันหมดแก้ว น้ำแข็งละลายจนจืดซะแล้ว",
      "ตั้งแต่มีแก้วใบนี้ ก็ลืมแก้วทุกใบที่เคยซื้อมาเลย",
      "ลองพิสูจน์แล้ว แก้วใบนี้ใส่น้ำแข็งทิ้งไว้ข้ามคืน สรุปว่า"
    ];
  }

  // Beauty / Skincare
  if (/(ครีม|เซรั่ม|ลิป|แป้ง|มาสก์|สกินแคร์|เมคอัพ|beauty|skincare|cosmetic)/i.test(text)) {
    return [
      "กู้ผิวพังให้ปังได้ง่ายๆ ด้วยไอเทมนี้",
      "เคล็ดลับผิวสวยที่บล็อกเกอร์ไม่ค่อยบอกคุณ",
      "ใครที่มีปัญหาผิว รีบดูคลิปนี้ให้จบ",
      "บอกลาหน้าโทรม แค่มีกระปุกนี้ติดโต๊ะเครื่องแป้ง",
      "ของดีบอกต่อ ใช้จริงไม่จกตา"
    ];
  }
  
  // Fashion / Clothing
  if (/(เสื้อ|กางเกง|กระโปรง|รองเท้า|กระเป๋า|แฟชั่น|เดรส|fashion|clothing|clothes)/i.test(text)) {
    return [
      "ชุดนี้ใส่แล้วพรางหุ่นสุดๆ ใครเห็นก็ต้องทัก",
      "แมทช์ลุคได้ทุกลุค ไม่มีติดตู้ไม่ได้แล้ว",
      "สายแฟชั่นห้ามพลาด ตัวนี้คือไอเทมกันตาย",
      "หมดปัญหาคิดไม่ออกว่าจะใส่อะไรดี",
      "เนื้อผ้าดีมาก ทรงสวยเป๊ะ ตรงปกไม่จกตา"
    ];
  }

  // Tech / Gadgets
  if (/(โทรศัพท์|มือถือ|แล็ป|คอม|ลำโพง|หูฟัง|ชาร์จ|กล้อง|tech|phone|gadget)/i.test(text)) {
    return [
      "ไอเทมสุดล้ำ ที่จะทำให้ชีวิตคุณง่ายขึ้น 10 เท่า",
      "สายไอทีต้องจัด ตัวนี้สเปคคุ้มเกินราคามาก",
      "ใครชอบความสะดวกสบาย ไม่มีตัวนี้ถือว่าพลาด",
      "ฟีเจอร์จัดเต็มขนาดนี้ ไม่ซื้อไม่ได้แล้ว",
      "แก้ปัญหาจุกจิกกวนใจ ด้วยแก็ดเจ็ตตัวนี้เลย"
    ];
  }

  // Food / Snack
  if (/(อาหาร|ขนม|กาแฟ|เครื่องดื่ม|น้ำ|food|snack|drink)/i.test(text)) {
    return [
      "อร่อยแสงออกปาก ใครสายกินต้องมามุง",
      "หยุดกินไม่ได้เลย อร่อยจนต้องตุนไว้",
      "ของอร่อยที่สายกินห้ามพลาดเด็ดขาด",
      "ใครหิวตอนดึก สิ่งนี้คือคำตอบ",
      "อร่อยแถมมีประโยชน์ ต้องลองเลย"
    ];
  }

  return [
    "ไอเทมลับที่ใช้เองแล้วเวิร์คมาก",
    "บอกลาปัญหาเดิมๆ ไปได้เลยเมื่อเจอสิ่งนี้",
    "ของมันต้องมี พลาดไม่ได้แล้ว",
    "เคล็ดลับที่ทำให้ชีวิตง่ายขึ้นเยอะ",
    "ใครกำลังลังเล ดูคลิปนี้ให้จบก่อน",
    "หยุดก่อน ถ้าคุณยังไม่รู้จักสิ่งนี้",
    "ลองใช้มาสักพักแล้ว ประทับใจสุดๆ"
  ];
}

/**
 * @description สร้าง prompt วิดีโอสำหรับ Phase 2
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} settings - settings ของวิดีโอ
 * @returns {string} prompt ภาษาอังกฤษ
 */
function generateThaiDialogue(productInfo, settings, auto) {
  let phrase = "";
  if (settings?.clipText) {
    phrase = settings.clipText;
  } else if (productInfo?.highlights) {
    const parts = productInfo.highlights.split(/[,\n;]/);
    phrase = parts[0].trim();
  } else {
    const defaultPhrases = resolveProductHook(productInfo);
    phrase = defaultPhrases[Math.floor(Math.random() * defaultPhrases.length)];
  }
  
  // ลบอิโมจิและอักขระพิเศษ
  phrase = phrase.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();
  
  const isMan = auto?.presenter === "man";
  const ending = isMan ? "ครับ" : "ค่ะ";
  
  if (!phrase.endsWith("ค่ะ") && !phrase.endsWith("ครับ") && !phrase.endsWith("เลย") && !phrase.endsWith("นะ")) {
    const endingPhrases = [
      ` น่าใช้สุดๆ ${ending}`,
      ` ต้องลองเลย${ending}`,
      ` ห้ามพลาดเด็ดขาด${ending}`,
      ` ของมันต้องมีจริงๆ ${ending}`,
      ` ตอบโจทย์มาก${ending}`
    ];
    phrase = phrase + endingPhrases[Math.floor(Math.random() * endingPhrases.length)];
  }
  return phrase;
}

export function buildVideoPrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const locationStr = resolvePromptLocation(auto);
  const durationSeconds = Number.parseInt(settings?.videoDuration, 10) || 8;
  const clipText = resolveClipText(productInfo, settings);
  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true");
  const productName = generationProductName(productInfo.name, productInfo.category) || "the attached product";
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const overlayText = [
    clipText,
    textEnabled ? compactPromptText(settings?.promotionText, 80) : ""
  ].filter(Boolean);
 
  const productText = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const weightCategory = getProductWeightCategory(productText);
  const isHeavy = weightCategory !== "light";
  const isImmobile = weightCategory === "immobile";
  const isClothing = isClothingProduct(productText);
  const specificScale = getProductSpecificScaleInstruction(productText);

  const handsOnly = auto.presenter === "hands_only";
  const noPeople = !(auto.presenter && auto.presenter !== "none");
  const isAnimal = auto.presenter === "dog" || auto.presenter === "cat";
  const animalName = auto.presenter === "cat" ? "cute cat" : "cute dog";
  const firstSceneNoPeople = (settings?.firstSceneNoPeople === true || settings?.firstSceneNoPeople === "true");
  const modelRefImage = productInfo?.modelRefImage || settings?.modelRefImage || "";
  const hasModelRefImage = Boolean(modelRefImage && String(modelRefImage).trim());

  const sceneStyle = (noPeople || handsOnly) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle)
    ? "review"
    : auto.videoStyle;

  const styleObj = VIDEO_STYLES.find(s => s.id === sceneStyle);
  let styleFragment = styleObj ? styleObj.fragment : "";

  if (noPeople) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character|hands?)\b[^.;]*[.;]?/gi, "")
      .replace(/\b(?:hands?|people|presenters?|reviewers?|characters?)\b/gi, "");
  } else if (handsOnly) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character)\b[^.;]*[.;]?/gi, "hands ")
      .replace(/\b(?:people|presenters?|reviewers?|characters?)\b/gi, "hands");
  }

  if (firstSceneNoPeople && styleFragment) {
    styleFragment = styleFragment
      .replace(/\btalking\s+head\b/gi, "")
      .replace(/\b(?:a|an)?\s*(?:person|presenter|reviewer)\s+holding\s+product\b/gi, "")
      .replace(/,\s*,/g, ",")
      .replace(/^,\s*|,\s*$/g, "")
      .trim();
  }

  let scaleInstruction = "";
  if (handsOnly) {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Realistic small scale: Depict the product in its realistic small pocket-sized/hand-sized scale. Show it clearly and sharply, but do not make it look abnormally giant, massive, or oversized relative to the hands or surroundings.";
    if (!isHeavy) {
      scaleInstruction += " The physical size of the product must be perfectly proportional and realistic relative to the human hands holding it. Do not make the product abnormally giant, massive, or tiny relative to the hands.";
    }
  } else if (noPeople) {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Realistic small scale: Depict the product in its realistic small pocket-sized/hand-sized scale. Show it clearly and sharply, but do not make it look abnormally giant, massive, or oversized relative to the surroundings.";
  } else {
    scaleInstruction = isHeavy
      ? "Real scale."
      : "Realistic small scale: Depict the product in its realistic small pocket-sized/hand-sized scale. Show it clearly and sharply, but do not make it look abnormally giant, massive, or oversized relative to the presenter or surroundings.";
  }

  const PROGRESSIVE_AUDIO_NARRATION_MANDATE = "CRITICAL AUDIO NARRATION RULE — UNIQUE PER-SCENE SENTENCES & ZERO REPETITION: Every scene (Scene 1, Scene 2, Scene 3, Scene 4) must feature a NEW, UNIQUE, DIFFERENT spoken sentence in Thai that naturally advances the product review. Scene 2 MUST NOT repeat Scene 1's words; Scene 3 MUST NOT repeat Scene 2's words. ABSOLUTELY FORBIDDEN: Do NOT repeat, loop, or re-play the sentence from the previous scene under any circumstances.";

  const promptParts = [
    `สร้างวิดีโอโฆษณารีวิวสินค้า ${productName} ความยาว ${durationSeconds} วินาที ในอัตราส่วนแนวตั้ง 9:16 (Create a ${durationSeconds}-second vertical 9:16 commercial product review video for ${productName}).`,
    styleFragment ? `Visual style: ${styleFragment}.` : "",
    SPEECH_DIRECTION,
    PROGRESSIVE_AUDIO_NARRATION_MANDATE,
    resolveMatchStillDirection(auto.presenter, hasModelRefImage),
    PRODUCT_FIDELITY_DIRECTION,
    STRICT_PRODUCT_IDENTITY_RULE,
    PRODUCT_ISOLATION_DIRECTION,
    PRINTED_GRAPHIC_FIDELITY_DIRECTION,
    COLOR_AND_PATTERN_FIDELITY_DIRECTION,
    FULL_PRODUCT_VISIBILITY_DIRECTION,
    "Critical: The generated video must maintain absolute fidelity to the original product. Its shape, colors, materials, branding, and text must be 100% identical and remain completely consistent, static, and unchanged across all scenes. Do not redesign, warp, morph, or modify the product's structure in any way.",
    REALISM_AND_PHYSICS_DIRECTION,
    NO_PUTTING_ON_OR_TAKING_OFF_MANDATE,
    scaleInstruction,
    specificScale,
    PRODUCT_STRUCTURE_DIRECTION,
    categoryDirection,
    analysisDirection,
    isFarmPoultryProduct(productText) ? FARM_POULTRY_FEED_EXCLUSION_RULE : "",
    isSunProtectionProduct(productText) ? SUNSCREEN_FIDELITY_DIRECTION : "",
    isHeadwearProduct(productText) ? HEADWEAR_NEVER_REMOVE_MANDATE : "",
    isFullFaceCoveringProduct(productText) ? FULL_FACE_COVERAGE_LOCK : "",
    isPhoneCaseProduct(productText) ? PHONE_CASE_MULTI_SHOT_MANDATE : "",
    isMagneticPhoneCaseProduct(productText) ? MAGNETIC_PHONE_CASE_FIDELITY_MANDATE : "",
    NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION,
    STRICT_SHOP_LOGO_EXCLUSION_RULE,
    NO_ADDED_PATTERNS_OR_GRAPHICS_RULE,
    NO_HALLUCINATED_BRAND_LOGOS_RULE,
    locationStr ? `Location setting: Place the product in a brand new, realistic ${locationStr} background location. DO NOT use or match the original reference image background.` : (handsOnly ? HANDS_ONLY_BACKGROUND_DIRECTION : "Choose a clean, realistic, commercially appealing background that fits this product category. ALWAYS generate a new, non-matching background location."),
  ];
  let sceneBreakdown = getMultiSceneDescription(sceneStyle, productName, compactPromptText(locationStr, 100), compactPromptText(auto.mood, 60), productText)
    .replace(/\d+-second\s*/g, "");
  sceneBreakdown = sceneBreakdown
    .replace(/^(\s*-\s*Scene 1\b[^\n]*)/m, '$1 [AUDIO TRACK: Spoken line 1 in Thai - Opening hook phrase]')
    .replace(/^(\s*-\s*Scene 2\b[^\n]*)/m, '$1 [AUDIO TRACK: Spoken line 2 in Thai - MUST BE A NEW DIFFERENT SENTENCE FROM SCENE 1]')
    .replace(/^(\s*-\s*Scene 3\b[^\n]*)/m, '$1 [AUDIO TRACK: Spoken line 3 in Thai - MUST BE A NEW DIFFERENT SENTENCE FROM SCENE 2]')
    .replace(/^(\s*-\s*Scene 4\b[^\n]*)/m, '$1 [AUDIO TRACK: Spoken line 4 in Thai - MUST BE A NEW DIFFERENT SENTENCE FROM SCENE 3]');
  if (noPeople) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown on its own")
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b/gi, "the product shown on its own");
  } else if (handsOnly) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "hands holding and presenting the product")
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, "hands holding the product")
      .replace(/\bhands\s+starting\s+to\s+open\b/gi, "hands gesturing towards");
  } else if (isAnimal) {
    sceneBreakdown = sceneBreakdown
      .replace(/- Scene 1 \(([^)]+)\): ([^\n]+)/i, `- Scene 1 ($1 - Pet Opening): A 3-second opening scene featuring a ${animalName} sitting next to or interacting naturally with ${productName} right from the start.`)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, `a reviewer together with a ${animalName} sitting next to the product`)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, `a reviewer together with a ${animalName}`)
      .replace(/\bhands\b/gi, "hands");
  } else if (["baby", "toddler", "child", "older_child"].includes(auto.presenter) || isKidsProduct(productText)) {
    let childDesc = "a happy young Thai kindergarten child (4-6 years old, strictly no baby or toddler)";
    let childAction = "actively riding, playing with, or using the kids product naturally in the scene";
    if (auto.presenter === "baby" || auto.presenter === "toddler") {
      childDesc = "a cute young Thai kindergarten child (4-6 years old, strictly no baby or toddler)";
      childAction = "playing or interacting naturally with the product";
    } else if (auto.presenter === "older_child") {
      childDesc = "a cute older child/kid (7-12 years old)";
      childAction = "riding or using the product naturally in the scene";
    }
    const parentCare = "accompanied by a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby supervising with love and care (no hard selling)";
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, `${childDesc} ${childAction}, ${parentCare}`)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, `${childDesc} together with a supervising parent`);
  }

  // Adjust prompt for heavy/large products to prevent unnatural holding/lifting
  if (isImmobile) {
    const escapedName = productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sceneBreakdown = sceneBreakdown
      .replace(new RegExp(`\\bholding\\s+(?:the\\s+)?(?:attached\\s+)?${escapedName}\\b`, "gi"), `standing next to ${productName}`)
      .replace(/\bholding\s+(?:the\s+)?product\b/gi, "standing next to the product")
      .replace(/\bholding\s+/gi, "standing next to ")
      .replace(/\bhands\s+holding\b/gi, "hands gesturing towards")
      .replace(/\bhands\s+starting\s+to\s+open\b/gi, "hands gesturing towards");
  }

  if (isClothing) {
    sceneBreakdown = sceneBreakdown
      .replace(/360-degree rotation showing (.+?) from all angles/gi, "front-facing showcase showing the front view of $1")
      .replace(/showing (.+?) from all angles/gi, "showing the front view of $1");
    sceneBreakdown += "\n(CLOTHING FRONT-ONLY RULE: The model/presenter must remain strictly front-facing in all scenes; do NOT turn around or show the back side of the clothing item, to prevent arm and hand distortion glitches.)";
  }

  if (firstSceneNoPeople && !noPeople) {
    const isHoldable = !isHeavy && !isImmobile;
    const lines = sceneBreakdown.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("- Scene 1")) {
        let scene1 = lines[i];
        if (isHoldable) {
          scene1 = scene1
            // ดักจับ "with a reviewer holding ... and talking to the camera" (greedy ข้าม spaces และ product name ได้)
            .replace(/\bwith a reviewer holding .+?(?:\s+and talking to the camera(?:[^.]*)?)?/gi, "with hands holding the product")
            // ดักจับ reviewer/presenter/person ที่ทำกิจกรรมต่างๆ
            .replace(/\b(a |an )?(presenter|reviewer|model|person)\b.*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "hands holding and presenting the product")
            // ดักจับ "talking to the camera" โดยตรงที่อาจหลุดจาก pattern แรก
            .replace(/\btalking\s+(?:directly\s+)?to\s+the\s+camera\b[^.]*/gi, "presenting the product")
            // ดักจับ reviewer/presenter ที่เหลืออยู่
            .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, "hands holding the product");

          lines[i] = scene1 + " (SCENE 1 MUST SHOW NO HUMAN FACE OR BODY: Show only hands holding the product. STRICTLY FORBIDDEN: Do not show any human faces, presenters, reviewers, or people in Scene 1; show only the product and the hands holding it. The presenter/person must NOT appear until Scene 2.)";
        } else {
          scene1 = scene1
            // ดักจับ "with a reviewer holding ... and talking to the camera" (greedy ข้าม spaces และ product name ได้)
            .replace(/\bwith a reviewer holding .+?(?:\s+and talking to the camera(?:[^.]*)?)?/gi, `showcasing ${productName} resting on a flat surface`)
            // ดักจับ hands opening packaging
            .replace(/\bshow of hands starting to open the packaging of\b/gi, `shot of the unopened packaging of`)
            .replace(/\bhands starting to open the packaging of\b/gi, `the unopened packaging of`)
            // ดักจับ presenter/reviewer/person ที่ทำกิจกรรมต่างๆ
            .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b.*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown resting on its own")
            // ดักจับ talking to camera โดยตรง
            .replace(/\btalking\s+(?:directly\s+)?to\s+the\s+camera\b[^.]*/gi, "showcasing the product")
            // ดักจับ presenter/reviewer/person ที่เหลืออยู่
            .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b/gi, "the product shown resting on its own");

          lines[i] = scene1 + " (Product-only shot. The product must rest on a flat surface or floor. STRICTLY FORBIDDEN: Do not show any people, faces, presenters, reviewers, characters, or hands in Scene 1; show only the product on its own. SCENE 1 MUST BE PRODUCT-ONLY: The presenter must NOT appear until Scene 2.)";
        }
        break;
      }
    }
    sceneBreakdown = lines.join("\n");
  }

  promptParts.push(
    `Use distinct scenes with hard cuts; split the ${durationSeconds}s evenly across the scenes below.`,
    `STRICT LIMIT: The video must contain AT MOST 3 to 4 sequential scenes/shots. Do not generate too many scenes, cuts, or edits. Keep the storytelling simple and clean.`,
    sceneBreakdown,
    `Subtle ${compactPromptText(auto.cameraMovement, 80)}; keep every shot sharp, clearly visible, and stable. Realistic motion only — no morphing, duplication, or impossible action.`
  );

  const videoUserPhrase = settings?.clipText ? sanitizeText(String(settings.clipText).trim()) : "";
  const doodles = resolveDoodleStyle(productInfo);

  const textStyleStr = TEXT_FONT_STYLES[settings?.textStyleFont] || TEXT_FONT_STYLES.handwriting;

  promptParts.push(
    textEnabled
      ? videoUserPhrase
        ? `MUST display this exact Thai text overlay, clearly legible and on-screen starting immediately from the very first second (first frame / Scene 1) and visible in every scene at ${compactPromptText(settings?.textPosition, 40) || "Auto"}: "${videoUserPhrase}". Render Thai script with perfect spelling, ensuring every consonant, vowel, and tone mark is in the correct vertical stack and perfectly placed. Style it as ${textStyleStr}. Include 1–2 small doodles (${doodles}). Do not block important parts of the product. The text must appear on top of active, moving video footage right from the start to serve as an automatic video cover (STRICTLY FORBIDDEN: do not render a frozen image, still photo, or static title card with text in the middle).`
        : `MUST display ONE short cute Thai text overlay (1–5 words, naturally matching this product) starting immediately from the very first second (first frame / Scene 1) and visible in every scene, clearly legible, at ${compactPromptText(settings?.textPosition, 40) || "Auto"}. Render Thai script with perfect spelling, ensuring every consonant, vowel, and tone mark is in the correct vertical stack and perfectly placed. Style it as ${textStyleStr}. Include 1–2 small doodles (${doodles}). Do not block important parts of the product. Choose wording that feels natural and matches the product's benefit. The text must appear on top of active, moving video footage right from the start to serve as an automatic video cover (STRICTLY FORBIDDEN: do not render a frozen image, still photo, or static title card with text in the middle).`
      : TEXT_FREE_DIRECTION
  );

  let handsDir = HANDS_DIRECTION;
  let presenterInstruction = auto.presenter && PRESENTERS[auto.presenter] ? PRESENTERS[auto.presenter] : PRESENTERS.none;
  if (auto.presenter === "กรอกเอง") {
    presenterInstruction = auto.customPresenter || "a presenter";
  }

  if (isImmobile) {
    handsDir = handsDir
      .replace("holding and presenting", "gesturing towards and interacting with")
      .replace("holding", "touching or gesturing towards")
      + " The product is large and heavy, resting stably on a flat surface or floor; do not attempt to lift, carry, or hold it in the air.";

    presenterInstruction = presenterInstruction
      .replace("holding and presenting", "standing next to and presenting")
      .replace("holding", "presenting or interacting with")
      + " The product is large and heavy, resting stably on a flat surface or floor; do not attempt to lift, carry, or hold it in the air.";
  } else if (weightCategory === "medium_heavy") {
    handsDir = handsDir
      .replace("holding and presenting", "holding with both hands and presenting")
      + " The product is a medium-sized item (approx 5-20kg); depict it in a realistic medium scale relative to the hands, never as a tiny packet or a giant sack.";

    presenterInstruction = presenterInstruction
      .replace("holding and presenting", "holding with both hands and presenting")
      .replace("holding", "holding with both hands or interacting with")
      + " The product is a medium-sized item (approx 5-20kg); depict it in a realistic medium scale relative to the presenter, never as a tiny packet or a giant sack.";
  } else if (weightCategory === "light") {
    const isEyewear = /(แว่นตา|แว่นกันแดด|แว่นสายตา|แว่น|glasses|sunglasses|eyewear|spectacles)/i.test(productText);
    if (isEyewear) {
      handsDir = handsDir
        + " The product is eyewear; depict the glasses in a realistic natural scale relative to the hands or face, ensuring it fits perfectly without looking abnormally large or tiny.";

      presenterInstruction = presenterInstruction
        + " The product is eyewear; depict the glasses in a realistic natural scale relative to the presenter's face or head, ensuring it fits perfectly on the face without looking abnormally large or tiny.";
    } else {
      handsDir = handsDir
        + " The product is a small item; depict it in a realistic small hand-sized scale relative to the hands. Show it clearly and sharply, but do not make it look abnormally giant, massive, or oversized.";

      presenterInstruction = presenterInstruction
        + " The product is a small item; depict it in a realistic small hand-sized scale relative to the presenter. Show it clearly and sharply, but do not make it look abnormally giant, massive, or oversized.";
    }
  }

  // รวมข้อมูลสินค้าทั้งหมดมาประกบรวมกันสำหรับส่งให้ AI วิเคราะห์ทำบทพูด
  // NOTE: ไม่ส่งราคาและ CTA เข้า speech context เพื่อป้องกัน AI พูดราคาหรือ CTA ออกมา
  const details = [];
  if (productInfo.name) details.push(`Product Name: ${productInfo.name}`);
  if (productInfo.highlights) details.push(`Highlights: ${productInfo.highlights}`);
  if (settings?.clipText) details.push(`Main Message: ${settings.clipText}`);
  const combinedProductDetails = details.join(", ");

  const toneDesc = VOICE_TONES[auto.voiceTone] || VOICE_TONES.Auto;

  // Derive a speaker identity from the presenter setting so the AI voice matches the character
  let speakerIdentity = "a clear, friendly young Thai woman narrator";
  if (auto.presenter === "woman") {
    speakerIdentity = "a young Thai woman";
  } else if (auto.presenter === "man") {
    speakerIdentity = "a young Thai man";
  } else if (auto.presenter === "none" || auto.presenter === "hands_only") {
    speakerIdentity = "a clear, warm, friendly off-screen young Thai woman narrator";
  } else if (["baby", "toddler", "child", "older_child"].includes(auto.presenter)) {
    if (auto.presenter === "older_child") {
      speakerIdentity = "a caring Thai mother narrating warm thoughts about her school-aged child interacting with the product. The voice and script must be age-appropriate for an older child and must never use baby-talk, baby words, or speak/sound like a small child";
    } else {
      speakerIdentity = "a caring Thai mother narrating warm thoughts about her child interacting with the product. The voice and script must never use baby-talk or sound like a small child";
    }
  } else if (auto.presenter === "กรอกเอง" && auto.customPresenter) {
    // Use the custom presenter description to inform the voice identity
    speakerIdentity = `a Thai speaker whose voice, age, and speech style match this character: "${auto.customPresenter}"`;
  } else if (auto.presenter === "cartoon3d") {
    speakerIdentity = "a cheerful, animated cartoon character voice";
  } else if (auto.presenter === "living_product") {
    speakerIdentity = "a cute, playful animated product character voice";
  } else if (auto.presenter === "dog" || auto.presenter === "cat") {
    speakerIdentity = "a friendly Thai presenter presenting the product together with their pet";
  }
  
  const matchVoiceRule = (auto.presenter === "dog" || auto.presenter === "cat")
    ? "the voice age, gender, and speech style must match the on-screen Thai presenter presenting the product with their pet"
    : (auto.presenter === "none" || auto.presenter === "hands_only")
      ? "the voice must sound like a clear, warm, friendly off-screen young Thai female narrator presenting the product. Since no presenter's face or body is shown on screen, ensure the voice is explicitly a female voiceover narration."
      : (["baby", "toddler", "child", "older_child"].includes(auto.presenter))
        ? "the voice must sound like a caring Thai mother narrating warm and loving thoughts about her child on screen. The voice must be an adult mother's voice, and the narration must NEVER use baby-talk, baby words, or sound like a young child"
        : "the voice age, gender, and speech style must match the on-screen presenter exactly (Strictest rule: voice must match the presenter's character — if the presenter is an elderly woman, use an elderly woman's voice; if a young man, use a young man's voice; never use a mismatched voice for the presenter)";

  const voiceMatchEnd = (auto.presenter === "none" || auto.presenter === "hands_only")
    ? "ensure the voice is a natural young Thai female speaker delivering a clear off-screen voiceover narration."
    : (["baby", "toddler", "child", "older_child"].includes(auto.presenter))
      ? "ensure the voice is a natural Thai speaker whose voice matches the off-screen mother narrator."
      : "ensure the voice is a natural Thai speaker whose voice perfectly matches the character identity of the presenter.";

  const isChildPresenter = ["baby", "toddler", "child", "older_child"].includes(auto.presenter);
  const presentInstruction = isChildPresenter
    ? "narrate her own thoughts naturally in Thai off-screen (e.g., how the product helps her child, or how her child enjoys it). The script must NOT sound like a commercial product review or sales pitch, and the child must NOT present, explain features, or review the product themselves"
    : "present the product's value proposition, features, or name naturally in Thai";

  const speechDir = isFullFaceCoveringProduct(productText)
    ? `Spoken audio (Thai): Spoken dialogue is delivered purely as an off-screen Thai voiceover narration. Voice character: ${speakerIdentity} — ${matchVoiceRule}. STRICT FABRIC MOUTH-COVERING LOCK: Since the presenter is wearing a full face/mouth-covering balaclava/mask, the fabric over the mouth MUST remain 100% smooth, static, solid, and completely covering the mouth/lips without any visible lip movements, mouth opening, or fabric warping through the mouth area when speaking. Based strictly on [${combinedProductDetails}], speak true product details. FORBIDDEN: no exaggerated claims, no brand names or product names (DO NOT speak the brand name or product name), no greetings, no price/discounts, no quantities, no CTA. Do not speak in English, no subtitles, and ${voiceMatchEnd}`
    : `Spoken audio (Thai): Generate a short, natural Thai spoken dialogue (max 5-8 words, 2-3s) in Scene 1 ONLY with a ${toneDesc}. Voice character: ${speakerIdentity} — ${matchVoiceRule}. Speak ONCE cleanly in Scene 1; remaining scenes must be strictly silent with zero audio repetition. Based strictly on [${combinedProductDetails}], speak true product details. Speaker must ${presentInstruction}. FORBIDDEN: no exaggerated claims, no brand names or product names (DO NOT speak the brand name or product name), no greetings (never say "สวัสดี", "หวัดดี", "hello", "hi"), no price/discounts ("ราคา", "บาท", "ลด"), no quantities ("กรัม", "kg", "มล."), no CTA ("สั่งได้เลย", "กดลิงก์"). Do not speak in English, no subtitles, and ${voiceMatchEnd}`;
  const voiceoverDir = (auto.presenter === "none" || auto.presenter === "hands_only")
    ? "Voiceover: Add a clear, friendly off-screen Thai female voiceover narration speaking in Thai."
    : "Voiceover: Add a natural Thai off-screen voiceover narration speaking in Thai.";

  if (handsOnly) {
    let handsInstructions = `${handsDir}\n${HANDS_ONLY_FACE_EXCLUSION}`;
    if (firstSceneNoPeople) {
      const isHoldable = !isHeavy && !isImmobile;
      if (!isHoldable) {
        handsInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show hands or any human features in Scene 1. Hands are only allowed starting from Scene 2 onwards.\n${handsInstructions}`;
      }
    }
    promptParts.push(`${handsInstructions}\n${voiceoverDir} ${speechDir}`);
  } else if (auto.presenter === "dog" || auto.presenter === "cat") {
    let animalInstructions = `Presenter: ${presenterInstruction}. ${ANIMAL_PRESENTER_DIRECTION} (Strictest rule: Use exactly one single consistent animal and presenter throughout the entire video. Do not switch animals or presenters, and do not morph or change their appearance between scenes).`;
    if (firstSceneNoPeople) {
      const isHoldable = !isHeavy && !isImmobile;
      if (isHoldable) {
        animalInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show the animal or any pets/people in Scene 1. Only hands holding the product are allowed in Scene 1. The animal/pet character should only appear starting from Scene 2 onwards.\n${animalInstructions}`;
      } else {
        animalInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show the animal, any pets, people, or hands in Scene 1. The animal/pet character should only appear starting from Scene 2 onwards.\n${animalInstructions}`;
      }
    }
    promptParts.push(`${animalInstructions} ${speechDir}`);
  } else if (auto.presenter && auto.presenter !== "none") {
    let personDir = THAI_PERSON_DIRECTION;
    if (["baby", "toddler", "child", "older_child"].includes(auto.presenter)) {
      personDir = "Natural Thai child character. The product must remain rigid, static, and completely unchanged; the child stands next to it, plays with it, or holds it gently without deforming it. The child must NOT speak to the camera, must NOT speak any dialogue, and must NOT review the product directly; all spoken dialogue in this video is strictly an off-screen voiceover by a caring Thai mother.";
    }
    const faceMatchRule = "CRITICAL RULE — BRAND NEW PRESENTER FACE GENERATION: The uploaded reference image is for product extraction only and may contain a seller, model, or person in the photo. The presenter generated in this video MUST have an ENTIRELY BRAND NEW, COMPLETELY DIFFERENT face, facial structure, skin tone, hairstyle, and overall appearance from any person shown in the product reference image. ABSOLUTELY FORBIDDEN: Do NOT copy, match, replicate, mirror, or resemble the face or head of any person appearing in the reference photo under any circumstances. Always generate a completely new, authentic human face from scratch that bears zero resemblance to the reference photo.";
    let presenterInstructions = `Presenter: ${presenterInstruction}. ${personDir} ${FULL_BODY_PRESENTER_DIRECTION} ${faceMatchRule} (Strictest rule: Use exactly one single consistent presenter throughout the entire video. Do not introduce other people, do not switch presenters, and do not morph or change the presenter's appearance between scenes).`;
    if (firstSceneNoPeople) {
      const isHoldable = !isHeavy && !isImmobile;
      if (isHoldable) {
        presenterInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show the presenter's face, body, or any person in Scene 1. Only hands holding the product are allowed in Scene 1. The presenter should only appear starting from Scene 2 onwards. ⚠️ CRITICAL RULE FOR SCENE 1 — NO HUMAN FACE OR BODY IN SCENE 1: Scene 1 must show ONLY hands holding the product with NO face, NO body, NO presenter visible at all. The presenter's face and body must be completely absent from Scene 1. The presenter character should ONLY appear starting from Scene 2. STRICTLY FORBIDDEN in Scene 1: no face, no head, no torso, no person — only hands and product.\n${presenterInstructions}`;
      } else {
        presenterInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show the presenter, any other people, or hands in Scene 1. The presenter should only appear starting from Scene 2 onwards. ⚠️ CRITICAL RULE FOR SCENE 1 — PRODUCT ONLY IN SCENE 1: Scene 1 must show ONLY the product resting on its own with NO people, NO hands, NO presenter, NO faces visible at all. The presenter must be completely absent from Scene 1. The presenter character should ONLY appear starting from Scene 2. STRICTLY FORBIDDEN in Scene 1: no person, no hands, no face — only the product alone.\n${presenterInstructions}`;
      }
    }
    promptParts.push(`${presenterInstructions} ${speechDir}`);
  } else {
    promptParts.push(`${NO_PEOPLE_DIRECTION} ${voiceoverDir} ${speechDir}`);
  }

  return promptParts.filter(Boolean).join("\n");
}

function getMultiSceneDescription(videoStyle, productName, locationStr, mood, productText = "") {
  const loc = locationStr ? ` in a ${locationStr} setting` : "";
  const moodStyle = mood ? ` with ${mood} lighting` : "";

  if (isPhoneCaseProduct(productText || productName) || isMagneticPhoneCaseProduct(productText || productName)) {
    return [
      "This video must consist of multiple sequential scenes with clear cuts/transitions showing the phone case from multiple distinct close-up angles:",
      `- Scene 1 (Full Back Artwork & Built-in Magnetic Ring Hook): A clear 3-second opening shot showcasing the full back cover design, pattern, and built-in magnetic ring (MagSafe ring) of ${productName}${loc}${moodStyle}.`,
      `- Scene 2 (Camera Cutout & Edge Details): A 3-second macro close-up zoom on the camera lens cutout border, side button covers, and edge bevels.`,
      `- Scene 3 (Fitted View & Port Cutouts): A 2-second final scene showing the phone case fitted snugly on a smartphone, highlighting the built-in magnetic ring (for wireless charging and magnetic stand alignment) and bottom charging port cutout.`
    ].join("\n");
  }

  switch (videoStyle) {
    case "sales":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions to drive sales:",
        `- Scene 1 (Product Hook): A dynamic, eye-catching 2-second opening shot showcasing ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Benefit Showcase): A 3-second scene demonstrating the main benefits and features of the product in action.`,
        `- Scene 3 (Detail Close-up): A 3-second macro close-up of ${productName}'s quality and texture.`,
        `- Scene 4 (CTA Moment): A final 2-second persuasive shopping CTA shot, presenting the product beautifully.`
      ].join("\n");

    case "review":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions for a product review:",
        `- Scene 1 (Showcase): A 3-second 360-degree rotation showing ${productName} from all angles${loc}${moodStyle}.`,
        `- Scene 2 (Detail Zoom): A 3-second close-up zoom on the main features and highlights of the product.`,
        `- Scene 3 (Realistic Use): A 2-second final scene showing the product placed ready for use.`
      ].join("\n");

    case "lifestyle":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the product in lifestyle context:",
        `- Scene 1 (Atmosphere): A 3-second opening scene establishing a warm, realistic lifestyle environment${loc}${moodStyle}.`,
        `- Scene 2 (In-Use): A 3-second scene showing a presenter interacting naturally with ${productName}.`,
        `- Scene 3 (Close-up): A 2-second authentic close-up of the product in its natural setting.`
      ].join("\n");

    case "flash-sale":
      return [
        "This video must consist of multiple sequential scenes with fast, energetic cuts/transitions for a flash sale:",
        `- Scene 1 (Urgency Hook): A high-energy 2-second opening shot of ${productName}${loc}${moodStyle} to stop the scroll.`,
        `- Scene 2 (Promo Showcase): A 3-second rapid shot highlighting the product promotion and benefits.`,
        `- Scene 3 (Countdown CTA): A final 3-second fast cut shot emphasizing limited time/action.`
      ].join("\n");

    case "unboxing":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the unboxing process:",
        `- Scene 1 (The Box): A 3-second shot of hands starting to open the packaging of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (The Reveal): A 3-second satisfying reveal moment as the package is unwrapped/opened.`,
        `- Scene 3 (Detail Showcase): A 2-second close-up showing the pristine product out of the box.`
      ].join("\n");

    case "before-after":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions showing the transition/comparison:",
        `- Scene 1 (Problem/Before): A 3-second opening scene showing the need/before state with ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Transition): A 2-second transition effect or application moment.`,
        `- Scene 3 (Solution/After): A 3-second reveal showing the successful outcome and results after using the product.`
      ].join("\n");

    case "testimonial":
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions for a UGC testimonial:",
        `- Scene 1 (Reviewer Hook): A 3-second opening with a reviewer holding ${productName} and talking to the camera${loc}${moodStyle}.`,
        `- Scene 2 (Feature Showcase): A 3-second cut to the reviewer demonstrating how the product works.`,
        `- Scene 3 (Recommendation): A 2-second final recommendation shot with the reviewer smiling.`
      ].join("\n");

    case "cinematic":
      return [
        "This video must consist of multiple sequential scenes with smooth, cinematic cuts/transitions:",
        `- Scene 1 (Aesthetic Opening): A slow-motion 3-second elegant opening shot of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Macro Details): A 3-second slow macro close-up of the luxury texture and fine details.`,
        `- Scene 3 (Hero Shot): A 2-second final premium hero shot presenting the product majestically.`
      ].join("\n");

    case "trending-hook":
      return [
        "This video must consist of multiple sequential scenes with fast cuts/transitions for a trending TikTok hook:",
        `- Scene 1 (Thumb-Stop Hook): A highly eye-catching, unique 2-second opening shot of ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Product Reveal): A 3-second quick reveal showing the product features and utility.`,
        `- Scene 3 (Summary Cut): A final 3-second fast energetic cut summarizing the product appeal.`
      ].join("\n");

    default:
      return [
        "This video must consist of multiple sequential scenes with clear cuts/transitions:",
        `- Scene 1 (Hook): A dynamic, eye-catching 2-second opening shot featuring ${productName}${loc}${moodStyle}.`,
        `- Scene 2 (Showcase): A 3-second scene demonstrating the product, showing key details and features.`,
        `- Scene 3 (CTA): A 3-second close-up hero shot focusing on ${productName} with clear and appealing presentation.`
      ].join("\n");
  }
}

function compactPromptText(value, maxLength) {
  return sanitizeText(value).slice(0, maxLength).replace(/[.;,:-]\s*$/, "");
}

function buildAnalysisDirection(productInfo = {}) {
  const structureAdvice = compactPromptText(productInfo.structureAdvice, 220);
  const promptAdvice = stripStructuralVariantCounts(compactPromptText(productInfo.promptAdvice, 140));
  const parts = [structureAdvice, promptAdvice].filter(Boolean);
  if (parts.length === 0) return "";
  // นำ structureAdvice มาใช้เป็นรายละเอียดรูปร่างสินค้าจากภาพจริง เพื่อให้ AI เข้าใจบริบท์รูปบเข้า-ออกเสมอผ่าน prompt
  return `Image analysis of reference: ${parts.join(" ")} — Reproduce the product exactly as described here; this overrides any general category assumption about its form.`;
}

export function isFurnitureProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  return /(โต๊ะ|เก้าอี้|โซฟา|ตู้|ชั้นวาง|เตียง|เก้าอี้ทำงาน|โซฟาเบด|ตู้เสื้อผ้า|ตู้รองเท้า|โต๊ะคอม|โต๊ะทำงาน|โต๊ะกินข้าว|โต๊ะอาหาร|เก้าอี้พับ|ม้านั่ง|อาร์มแชร์|เฟอร์นิเจอร์|ของแต่งบ้าน|furniture|table|chair|sofa|desk|couch|cabinet|shelf|shelving|wardrobe|bed|armchair|stool|bench|sideboard|bookcase|credenza)/i.test(clean);
}

export function buildCategoryFidelityDirection(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`.toLowerCase();
  if (/(สเปรย์|ฉีด|ละออง|สเปรย์อาบน้ำ|ดับกลิ่น|สเปรย์แมว|สเปรย์หมา|spray|aerosol|mist|atomizer|pump\s*bottle)/i.test(text)) {
    return `${SPRAY_BOTTLE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks)/i.test(text)) {
    return `${SHOE_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isClothingProduct(text)) {
    return `${CLOTHING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isFurnitureProduct(text)) {
    return `${FURNITURE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(แว่นตา|แว่นกันแดด|แว่นสายตา|แว่น|glasses|sunglasses|eyewear|spectacles)/i.test(text)) {
    return EYEWEAR_FIDELITY_DIRECTION;
  }
  if (/(ครีม|เซรั่ม|ลิป|ลิปสติก|สกินแคร์|บำรุง|กันแดด|แชมพู|สบู่|น้ำหอม|แป้ง|รองพื้น|บลัชออน|แต่งหน้า|เครื่องสำอาง|cosmetics|skincare|serum|cream|lotion|lipstick|lipgloss|shampoo|cleanser|perfume|makeup|foundation)/i.test(text)) {
    return `${BEAUTY_SKINCARE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(เคส|ไอโฟน|เคสมือถือ|เคสโทรศัพท์|เคสไอโฟน|phone case|phone cover|mobile case|mobile cover|gadget)/i.test(text) || isMagneticPhoneCaseProduct(text)) {
    const extraMag = isMagneticPhoneCaseProduct(text) ? `\n${MAGNETIC_PHONE_CASE_FIDELITY_MANDATE}` : "";
    return `${PHONE_CASE_FIDELITY_DIRECTION}${extraMag}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(มือถือ|หูฟัง|บลูทูธ|สายชาร์จ|พาวเวอร์แบงค์|พัดลม|อิเล็กทรอนิกส์|earphone|headphone|bluetooth|charger|powerbank|fan|electronic|appliance)/i.test(text)) {
    return `${ELECTRONICS_GADGETS_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(กระเป๋า|เป้|กระเป๋าถือ|กระเป๋าสะพาย|กระเป๋าสตางค์|นาฬิกา|สร้อย|แหวน|ต่างหู|เครื่องประดับ|bag|backpack|wallet|purse|tote|handbag|crossbody|clutch|watch|jewelry|necklace|ring|bracelet|accessory)/i.test(text)) {
    return `${BAGS_ACCESSORIES_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(ถุงกาแฟ|เมล็ดกาแฟ|ซองกาแฟ|ผงกาแฟ|กาแฟคั่ว|coffee bag|coffee pouch|coffee bean bag|coffee beans pouch)/i.test(text)) {
    return `${COFFEE_BAG_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(กาแฟ|ชา|โกโก้|ขนม|อาหาร|อาหารเสริม|วิตามิน|คอลลาเจน|อาหารหมา|อาหารแมว|coffee|tea|snack|food|supplement|vitamin|collagen|pet food)/i.test(text)) {
    return `${FOOD_BEVERAGE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(แก้ว|กระบอกน้ำ|ชากาแฟ|กระติก|แก้วเก็บความเย็น|tumbler|mug|cup|bottle|flask)/i.test(text)) {
    return `${TUMBLER_BOTTLE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(หมอน|ผ้าห่ม|ที่นอน|ผ้าม่าน|เครื่องครัว|pillow|blanket|kitchenware|home)/i.test(text)) {
    return `${HOME_LIVING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(สติกเกอร์|โปสเตอร์|แผ่นรอง|แผ่นรองเมาส์|สกรีน|ลายสกรีน|ลายการ์ตูน|ภาพวาด|ลาย|ลายพิมพ์|พิมพ์ลาย|sticker|decal|poster|canvas|printed|graphic|pattern|illustration)/i.test(text)) {
    return PRINTED_GRAPHIC_FIDELITY_DIRECTION;
  }
  return `${GENERAL_PACKAGING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
}

function cleanEnglishProductName(title) {
  if (!title) return "";
  
  // 1. Remove bracketed text, since brackets often contain metadata like [READY STOCK], [COD]
  let clean = title.replace(/\[[^\]]*\]/g, " ")
                   .replace(/\([^)]*\)/g, " ")
                   .replace(/\{[^}]*\}/g, " ");

  // 2. Remove common promotional and transactional keywords (case-insensitive)
  const promoKeywords = [
    /\bready\s*stock\b/gi, /\breadystock\b/gi,
    /\bhot\s*sale\b/gi, /\bhotsale\b/gi,
    /\bbest\s*quality\b/gi, /\bbest\s*seller\b/gi,
    /\bfree\s*shipping\b/gi, /\bfree\s*delivery\b/gi,
    /\b100%\s*original\b/gi, /\b100%\s*authentic\b/gi,
    /\boriginal\b/gi, /\bauthentic\b/gi,
    /\bnew\s*arrival\b/gi, /\bspecial\s*offer\b/gi,
    /\bpre\s*order\b/gi, /\bpre-order\b/gi,
    /\bflash\s*sale\b/gi, /\bflashsale\b/gi,
    /\bfast\s*shipping\b/gi, /\bfast\s*delivery\b/gi,
    /\blocal\s*stock\b/gi, /\bbrand\s*new\b/gi,
    /\blimited\s*edition\b/gi, /\blimited\b/gi,
    /\bpremium\b/gi, /\bhigh\s*quality\b/gi, /\btop\s*quality\b/gi,
    /\bwarranty\b/gi, /\bguarantee\b/gi,
    /\bcod\b/gi, /\bfree\b/gi, /\bnew\b/gi, /\bhot\b/gi,
    /\bdiscount\b/gi, /\bsale\b/gi, /\boff\b/gi, /\bgift\b/gi, /\bgifts\b/gi,
    /\b\d+\s*pcs\b/gi, /\b\d+\s*pieces\b/gi, /\b\d+\s*piece\b/gi,
    /\b\d+\s*pack\b/gi, /\b\d+\s*set\b/gi,
    /\b\d+%\b/g
  ];

  for (const regex of promoKeywords) {
    clean = clean.replace(regex, " ");
  }

  // 3. Keep only English characters, numbers, and basic spaces
  clean = clean.replace(/[^\x00-\x7F]/g, " "); // Remove non-ASCII
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, " "); // Remove special punctuation
  clean = clean.replace(/\s+/g, " ").trim();

  return clean;
}

function generationProductName(value, category = "") {
  if (!value) return "the product";

  const lowerVal = String(value).toLowerCase();
  const lowerCat = String(category || "").toLowerCase();
  const text = `${lowerVal} ${lowerCat}`;

  // Clothing & Fashion
  if (/เดรส|ชุดกระโปรง|แซก|dress/i.test(text)) return "fashion dress";
  if (/เสื้อยืด|คอกลม|คอวี|t-shirt|tshirt|tee/i.test(text)) return "t-shirt";
  if (/เสื้อเชิ้ต|เชิ้ต|shirt/i.test(text)) return "shirt";
  if (/เสื้อฮู้ด|ฮู้ด|hoodie/i.test(text)) return "hoodie";
  if (/เสื้อแจ็คเก็ต|แจ็คเก็ต|เสื้อกันหนาว|jacket|coat/i.test(text)) return "jacket";
  if (/กางเกงขายาว|กางเกงยีนส์|ยีนส์|pants|trousers|jeans/i.test(text)) return "pants";
  if (/กางเกงขาสั้น|ขาสั้น|shorts/i.test(text)) return "shorts";
  if (/กระโปรง|skirt/i.test(text)) return "skirt";
  if (/ชุดชั้นใน|บรา|กางเกงใน|underwear|bra/i.test(text)) return "underwear";
  if (/ถุงเท้า|socks/i.test(text)) return "socks";
  if (/หมวก|cap|hat|beanie/i.test(text)) return "cap";
  if (/เสื้อ|ผ้า|clothe|apparel|garment/i.test(text)) return "clothing garment";

  // Footwear
  if (/สนีกเกอร์|ผ้าใบ|sneaker|sneakers/i.test(text)) return "sneaker shoes";
  if (/รองเท้าแตะ|แตะ|สลิปเปอร์|sandal|sandals|slipper|slippers/i.test(text)) return "sandals";
  if (/ส้นสูง|รองเท้าส้นสูง|heels|high heels/i.test(text)) return "high heels";
  if (/รองเท้าบูท|บูท|boots|boot/i.test(text)) return "boots";
  if (/รองเท้า|footwear|shoe|shoes/i.test(text)) return "shoes";

  // Beauty & Skincare & Personal Care
  if (/ลิป|ลิปสติก|ลิปแมตต์|ลิปมัน|ลิปบาล์ม|ลิปกลอส|lipstick|lipgloss|lip balm/i.test(text)) return "lipstick container";
  if (/เซรั่ม|เอสเซนส์|serum|essence|ampoule/i.test(text)) return "skincare serum bottle";
  if (/ครีม|มอยส์เจอร์|โลชั่น|กันแดด|cream|lotion|moisturizer|sunscreen/i.test(text)) return "skincare cream container";
  if (/โฟมล้างหน้า|คลีนซิ่ง|เจลล้างหน้า|cleanser|face wash/i.test(text)) return "facial cleanser bottle";
  if (/สบู่|สบู่อาบน้ำ|bar soap|soap/i.test(text)) return "bar soap";
  if (/แชมพู|ยาสระผม|ทรีทเม้นท์|ครีมนวด|shampoo|conditioner/i.test(text)) return "shampoo bottle";
  if (/น้ำหอม|perfume|fragrance/i.test(text)) return "perfume bottle";
  if (/แป้งพัฟ|แป้งฝุ่น|รองพื้น|บลัชออน|อายแชโดว์|แต่งหน้า|เครื่องสำอาง|makeup|foundation|powder|compact/i.test(text)) return "cosmetic makeup compact";

  // Electronics & Gadgets
  if (/เคส|เคสโทรศัพท์|เคสมือถือ|เคสไอโฟน|phone case|cover/i.test(text)) return "phone case";
  if (/หูฟัง|หูฟังบลูทูธ|หูฟังไร้สาย|earphone|earphones|earbuds|headphone|headphones/i.test(text)) return "wireless earphones";
  if (/สมาร์ทวอทช์|นาฬิกาข้อมือ|นาฬิกา|smartwatch|watch/i.test(text)) return "wrist watch";
  if (/พาวเวอร์แบงค์|พาวเวอร์แบงก์|powerbank|power bank/i.test(text)) return "power bank";
  if (/สายชาร์จ|หัวชาร์จ|ชาร์จ|charger|charging cable/i.test(text)) return "charger accessory";
  if (/พัดลม|พัดลมพกพา|portable fan|fan/i.test(text)) return "portable fan";

  // Bags & Accessories
  if (/กระเป๋าสะพาย|กระเป๋าถือ|กระเป๋าผู้หญิง|handbag|shoulder bag|tote bag/i.test(text)) return "handbag";
  if (/กระเป๋าเป้|เป้|backpack/i.test(text)) return "backpack";
  if (/กระเป๋าสตางค์|กระเป๋าเงิน|wallet|purse/i.test(text)) return "wallet";
  if (/กระเป๋า|bag/i.test(text)) return "bag";
  if (/สร้อย|แหวน|ต่างหู|กำไล|เครื่องประดับ|necklace|ring|earring|bracelet|jewelry/i.test(text)) return "fashion jewelry accessory";

  // Home & Kitchen
  if (/แก้วเก็บความเย็น|กระติกน้ำ|ขวดน้ำ|tumbler|water bottle|flask/i.test(text)) return "insulated tumbler bottle";
  if (/แก้วกาแฟ|แก้ว|ถ้วย|mug|cup/i.test(text)) return "coffee mug";
  if (/หมอน|หมอนข้าง|pillow|cushion/i.test(text)) return "pillow";
  if (/ผ้าห่ม|ผ้านวม|blanket|quilt/i.test(text)) return "blanket";

  // Food & Beverage & Supplements
  if (/ถุงกาแฟ|เมล็ดกาแฟ|ซองกาแฟ|ผงกาแฟ|กาแฟคั่ว|coffee bag|coffee pouch|coffee bean/i.test(text)) return "printed coffee pouch bag";
  if (/กาแฟ|coffee/i.test(text)) return "coffee pouch bag";
  if (/ชา|ชาไทย|ชาเขียว|tea/i.test(text)) return "tea product";
  if (/ขนม|คุกกี้|เบเกอรี่|snack|cookie|bakery/i.test(text)) return "snack food product";
  if (/อาหารเสริม|วิตามิน|คอลลาเจน|supplement|vitamin|collagen/i.test(text)) return "supplement bottle";
  if (/อาหารหมา|อาหารแมว|ขนมสุนัข|ขนมแมว|pet food|dog food|cat food/i.test(text)) return "pet food bag";

  // Try extracting cleaned English words if present
  let englishWords = cleanEnglishProductName(value);
  if (englishWords.length > 3) {
    const words = englishWords.split(" ").slice(0, 4).join(" ");
    if (words.length > 3) return stripStructuralVariantCounts(words);
  }

  return "the product";
}

function stripStructuralVariantCounts(value) {
  return String(value || "")
    .replace(/\b\d+(?:\s*[/|,]\s*\d+)+\s*(?:drawer|drawers|shelf|shelves|tier|tiers|door|doors|compartment|compartments)\b/gi, " ")
    .replace(/\b\d+\s*(?:drawer|drawers|shelf|shelves|tier|tiers|door|doors|compartment|compartments)\b/gi, " ")
    .replace(/\d+(?:\s*[/|,]\s*\d+)+\s*(?:ชั้น|ลิ้นชัก|ช่อง|บาน)/g, " ")
    .replace(/\d+\s*(?:ชั้น|ลิ้นชัก|ช่อง|บาน)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveAutoSettings(productInfo = {}, settings = {}) {
  const inferred = inferPromptAutoOptions(productInfo);
  const recommended = productInfo.autoOptions && typeof productInfo.autoOptions === "object"
    ? productInfo.autoOptions
    : {};
  const requiredLocation = inferRequiredProductLocation(productInfo);
  const footwear = isFootwearProduct(productInfo);
  return {
    videoStyle: isAuto(settings.videoStyle) ? (recommended.videoStyle || inferred.videoStyle) : settings.videoStyle,
    // Auto always includes a real reviewer. People-free output is only allowed
    // when the user explicitly selects the "none" presenter option.
    presenter: isAuto(settings.presenter) ? pickAutoReviewer(productInfo) : settings.presenter,
    customPresenter: sanitizeText(settings.customPresenter),
    voiceTone: isAuto(settings.voiceTone) ? (recommended.voiceTone || inferred.voiceTone) : settings.voiceTone,
    mood: isAuto(settings.mood) ? (recommended.mood || inferred.mood) : settings.mood,
    location: isAuto(settings.location) ? (requiredLocation || recommended.location || inferred.location) : settings.location,
    customLocation: sanitizeText(settings.customLocation),
    cameraMovement: isAuto(settings.cameraMovement) ? (footwear ? "Slow Zoom In" : (recommended.cameraMovement || inferred.cameraMovement)) : settings.cameraMovement,
    transition: isAuto(settings.transition) ? (recommended.transition || inferred.transition) : settings.transition,
    reason: recommended.reason || inferred.reason || ""
  };
}

function isAuto(value) {
  return value === undefined || value === null || value === "" || value === "Auto";
}

function resolvePromptLocation(auto = {}) {
  if (auto.location === "กรอกเอง") {
    return sanitizeText(auto.customLocation) || "custom user-defined product scene";
  }
  return auto.location;
}

function inferPromptAutoOptions(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();

  if (/(ซิ้ง|ซิ้งค์|ซิงค์|อ่าง|อ่างล้าง|ล้างจาน|เครื่องล้างจาน|ครัว|เครื่องครัว|เตาอบ|ไมโครเวฟ|จาน|ชาม|หม้อ|กระทะ|sink|dishwasher|kitchenware|cookware|kitchen)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Professional", "Modern Kitchen", "Slow Zoom In", "Cut ตรง", "Kitchen product, shown in a clean modern kitchen setting suited to its use");
  }
  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Professional", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "Furniture product, shown alone in a clean realistic interior suited to its use");
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Trendy", "Urban Street", "Slow Zoom In", "Cut ตรง", "Footwear product, shown clearly without a presenter to preserve its exact model");
  }
  if (/(ลด|sale|โปร|flash|discount|ถูก|ส่งฟรี)/i.test(text)) {
    return promptAutoOptions("flash-sale", "none", "hype", "Trendy", "Studio Minimal", "Push In Fast", "Whip Pan", "Promotion-led product, optimized for urgency and fast conversion");
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|makeup|beauty|เครื่องสำอาง|น้ำหอม|jewelry|เครื่องประดับ)/i.test(text)) {
    return promptAutoOptions("cinematic", "woman", "kind", "หรูหรา", "Luxury Showroom", "Slow Zoom In", "Fade", "Beauty or premium product, optimized for trust and texture detail");
  }
  if (/(เสื้อ|กางเกง|กระเป๋า|แฟชั่น|wear|shirt|dress|bag)/i.test(text)) {
    return promptAutoOptions("lifestyle", "woman", "fun", "Trendy", "Urban Street", "Handheld Shake", "Swipe", "Fashion product, optimized for in-use lifestyle context");
  }
  if (/(แมว|หมา(?!ย|ก|ด|ล่า)|สุนัข|สัตว์เลี้ยง|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b)/i.test(text)) {
    const isCat = /(แมว|\bcat\b|\bkitten\b)/i.test(text);
    return promptAutoOptions("review", isCat ? "cat" : "dog", "fun", "น่ารัก", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "Pet product, shown with a reviewer together with a cute matching pet animal in a clean indoor setting");
  }
  if (/(ของเล่น|เด็ก|น่ารัก|cute|toy|kid)/i.test(text)) {
    return promptAutoOptions("trending-hook", "cartoon3d", "fun", "น่ารัก", "Modern Living Room", "Push In Fast", "Zoom Transition", "Cute product, optimized for playful thumb-stop hook");
  }
  if (/(ครัว|บ้าน|เครื่องใช้|organizer|storage|clean|ทำความสะอาด)/i.test(text)) {
    return promptAutoOptions("before-after", "none", "professional", "Professional", "Modern Living Room", "Pan Left to Right", "Swipe", "Home utility product, optimized to show the problem and result clearly");
  }
  if (/(เคส|เคสโทรศัพท์|เคสมือถือ|โทรศัพท์|มือถือ|case|phone|mobile|gadget|cover)/i.test(text)) {
    return promptAutoOptions("review", "hands_only", "fun", "Trendy", "Cafe / Coffee Shop", "Slow Zoom In", "Cut ตรง", "Phone or mobile accessory product, shown held by hands in a cozy aesthetic cafe background");
  }

  if (/(กล่อง|แพ็ค|package|เซ็ต|bundle|gift)/i.test(text)) {
    return promptAutoOptions("review", "none", "kind", "มินิมัล", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "Product with set or bundle, use reference image to determine actual form");
  }

  return promptAutoOptions("review", "woman", "professional", "Professional", "Studio Minimal", "Slow Zoom In", "Cut ตรง", "General product review focused on clear details and realistic use");
}

function inferRequiredProductLocation(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.highlights || ""} ${productInfo.category || ""}`.toLowerCase();

  // 0. Sun Protection & Sun Hats -> Sunny Outdoor Setting
  if (isSunProtectionProduct(text)) {
    return "Sunny Outdoor Setting (Park, Garden, Promenade, or Beach)";
  }

  // 1. Kitchen & Cooking -> Modern Kitchen
  if (/(ซิ้ง|ซิ้งค์|ซิงค์|อ่าง|อ่างล้าง|ล้างจาน|เครื่องล้างจาน|ครัว|เครื่องครัว|เตาอบ|ไมโครเวฟ|จาน|ชาม|หม้อ|กระทะ|sink|dishwasher|kitchenware|cookware|kitchen)/i.test(text)) {
    return "Modern Kitchen";
  }

  // 2. Bathroom & Skincare & Cosmetics -> Modern Bathroom / Luxury Spa
  if (/(สบู่|แชมพู|ยาสระผม|ฝักบัว|ก๊อกน้ำ|สุขภัณฑ์|ห้องน้ำ|ชักโครก|กระดาษชำระ|ผ้าเช็ดตัว|ครีม|เซรั่ม|สกินแคร์|บำรุง|น้ำหอม|รองพื้น|ลิป|เครื่องสำอาง|bathroom|shower|faucet|toilet|towel|skincare|serum|cream|cosmetics|lipstick|perfume)/i.test(text)) {
    return "Modern Bathroom";
  }

  // 3. Bedroom & Bedding -> Cozy Bedroom
  if (/(เตียง|ที่นอน|ฟูก|หมอน|ผ้าห่ม|ผ้านวม|ตู้เสื้อผ้า|โต๊ะข้างเตียง|ห้องนอน|bed|mattress|pillow|blanket|wardrobe|nightstand|bedroom)/i.test(text)) {
    return "Cozy Bedroom";
  }

  // 4. Coffee, Tea, Beverages & Phone Cases -> Cafe / Coffee Shop
  if (/(เคส|ไอโฟน|เคสมือถือ|เคสโทรศัพท์|เคสไอโฟน|กาแฟ|เมล็ดกาแฟ|ผงกาแฟ|ชา|โกโก้|แก้วกาแฟ|เครื่องดื่ม|ถุงกาแฟ|phone case|phone cover|mobile case|mobile cover|coffee|tea|cafe|coffee shop|beverage)/i.test(text)) {
    return "Cafe / Coffee Shop";
  }

  // 5. Living Room Furniture -> Modern Living Room
  if (/(โซฟา|ชั้นวางทีวี|ทีวี|โทรทัศน์|โต๊ะกลาง|ห้องนั่งเล่น|ตู้|ลิ้นชัก|ชั้นวาง|เตียง|เฟอร์นิเจอร์|sofa|couch|tv cabinet|living room|table|chair|furniture|shelf|cabinet)/i.test(text)) {
    return "Modern Living Room";
  }

  // 6. Office & Tech Gadgets -> Stylish Office
  if (/(โต๊ะทำงาน|เก้าอี้ทำงาน|คอมพิวเตอร์|โน๊ตบุ๊ค|คีย์บอร์ด|เมาส์|หูฟัง|สำนักงาน|แกดเจ็ต|อิเล็กทรอนิกส์|office|desk|computer|laptop|workspace|gadget|headphone)/i.test(text)) {
    return "Stylish Office";
  }

  // 7. Bags, Fashion Accessories & Eyewear -> Cafe / Coffee Shop
  if (/(กระเป๋า|เป้|กระเป๋าถือ|กระเป๋าสะพาย|กระเป๋าสตางค์|แว่นตา|แว่นกันแดด|นาฬิกา|เครื่องประดับ|bag|backpack|wallet|purse|tote|handbag|crossbody|glasses|sunglasses|jewelry|watch|accessory)/i.test(text)) {
    return "Cafe / Coffee Shop";
  }

  // 8. Footwear -> Minimalist Studio / Urban Street
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks)/i.test(text)) {
    return "Minimalist Studio";
  }

  // 9. Clothing -> Minimalist Studio
  if (isClothingProduct(text)) {
    return "Minimalist Studio";
  }

  return "Clean Modern Studio";
}

function isFootwearProduct(productInfo = {}) {
  const text = `${productInfo.name || ""} ${productInfo.category || ""}`.toLowerCase();
  return /(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text);
}

function pickAutoReviewer(productInfo = {}) {
  const productText = [
    productInfo.name,
    productInfo.originalName,
    productInfo.category,
    productInfo.highlights,
    productInfo.targetGroup
  ].filter(Boolean).join(" ").toLowerCase();

  const isFather = /(ผู้ชาย|บุรุษ|คุณพ่อ|พ่อ|man|men|male|boy|boys|father|dad)/i.test(productText);

  // AUTO PRESENTER RULE: Forbidden to pick child presenters (child/older_child).
  // If auto recommended presenter was a child, map to parent (father/mother) instead.
  const recommended = productInfo.autoOptions?.presenter;
  if (["woman", "man", "hands_only", "dog", "cat"].includes(recommended)) return recommended;
  if (recommended === "baby" || recommended === "toddler" || recommended === "child" || recommended === "older_child") {
    return isFather ? "man" : "woman";
  }

  if (/(เคส|เคสโทรศัพท์|เคสมือถือ|โทรศัพท์|มือถือ|case|phone|mobile|gadget|cover)/i.test(productText)) {
    return "hands_only";
  }

  // AUTO PRESENTER RULE: Child/baby/toy/kids products MUST NOT select child presenters in Auto mode.
  // Must select parents (woman = mother, man = father) instead.
  // To use a child presenter, user must explicitly choose child mode (child or older_child) in presenter settings.
  if (/(เด็ก|ลูก|กุมาร|เด็กเล็ก|เด็กโต|ประถม|มัธยมต้น|ทารก|แรกเกิด|คลอดใหม่|เบบี๋|เตาะแตะ|หัดเดิน|วัยคลาน|baby|infant|newborn|toddler|kid|kids|child|children|toy|ของเล่น|อนุบาล|schoolkid|schoolkids)/i.test(productText)) {
    return isFather ? "man" : "woman";
  }

  if (/(แมว|หมา|สัตว์เลี้ยง|สุนัข|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b)/i.test(productText)) {
    const isCat = /(แมว|\bcat\b|\bkitten\b)/i.test(productText);
    return isCat ? "cat" : "dog";
  }

  if (/(ผู้หญิง|สตรี|สาว|คุณแม่|แม่และเด็ก|woman|women|female|lady|ladies|girl|girls|maternity|mom|mother)/i.test(productText)) {
    return "woman";
  }
  if (/(ผู้ชาย|บุรุษ|หนุ่ม|ช่าง|man|men|male|boy|boys|gentleman|mechanic)/i.test(productText)) {
    return "man";
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|เมคอัพ|เครื่องสำอาง|ลิป|มาสคาร่า|น้ำหอม|เครื่องประดับ|กระเป๋า|beauty|skincare|makeup|cosmetic|lipstick|jewelry|handbag)/i.test(productText)) {
    return "woman";
  }
  if (/(เครื่องมือ|สว่าน|ประแจ|ไขควง|รถยนต์|มอเตอร์ไซค์|อะไหล่|เกมมิ่ง|tool|drill|wrench|screwdriver|automotive|motorcycle|gaming)/i.test(productText)) {
    return "man";
  }

  const identity = String(
    productInfo.productId ||
    productInfo.product_id ||
    productInfo.name ||
    productInfo.originalName ||
    "product"
  );
  let hash = 0;
  for (let i = 0; i < identity.length; i += 1) {
    hash = ((hash << 5) - hash + identity.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2 === 0 ? "woman" : "man";
}

function promptAutoOptions(videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason) {
  return { videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason };
}

/**
 * @description สร้าง caption TikTok จากข้อมูลสินค้าและ defaults
 * @param {object} productInfo - ข้อมูลสินค้า
 * @param {object} defaults - ค่า defaults จาก options
 * @returns {string} caption
 */
export function buildCaption(productInfo, defaults = {}) {
  let template = defaults.captionTemplate !== undefined ? defaults.captionTemplate : "{product_name}";
  // If template is the old default which included {product_details}, clean it up by omitting {product_details}
  if (template === "{product_name}\n{product_details}\n{cta}") {
    template = "{product_name}\n{cta}";
  }
  if (typeof template === "string" && template.trim() === "") {
    return "";
  }
  const productUrl = resolveProductUrl(productInfo);
  const hook = cleanCaptionText(resolveCaptionProductName(productInfo));
  const body = renderCaptionTemplate(template, {
    product_name: hook,
    product_id: sanitizeText(productInfo.productId),
    product_url: sanitizeText(productUrl),
    price: formatPrice(productInfo),
    shop_name: cleanCaptionText(productInfo.shopName),
    category: cleanCaptionText(productInfo.category),
    product_details: buildProductDetails(productInfo),
    highlights: cleanCaptionText(productInfo.highlights),
    cta: cleanCaptionText(productInfo.cta || "สั่งได้เลย")
  });

  if (!hook) {
    return body.trim();
  }
  const rest = body.startsWith(hook) ? body.slice(hook.length).trim() : body.trim();

  // จัดการตัวเลือกสุ่มคำขึ้นต้นโพสต์ (postRandomCaptionHook)
  const useRandomHook = defaults.postRandomCaptionHook !== undefined
    ? defaults.postRandomCaptionHook
    : true;

  if (useRandomHook) {
    const RANDOM_CAPTION_HOOKS = [
      "ป้ายยาไอเทมเด็ดชิ้นนี้ ",
      "แนะนำของดีบอกต่อตัวนี้ ",
      "ใครหาตัวนี้อยู่ลองดูนะ ",
      "ไอเทมน่าใช้ที่อยากแนะนำ ",
      "พิกัดของดีต้องมีติดบ้าน ",
      "รวมของใช้แล้วชอบตัวนี้ ",
      "ไอเทมตอบโจทย์น่าลอง ",
      "ใช้เองแล้วชอบมากชิ้นนี้ ",
      "พิกัดป้ายยาสินค้าตัวนี้ ",
      "แนะนำตัวนี้เลยคุ้มจริง ",
      "ส่องความน่าใช้ของชิ้นนี้ ",
      "ไอเทมประจำวันที่แนะนำ ",
      "รีวิวของดีราคาจับต้องได้ ",
      "ของน่าใช้ที่อยากบอกต่อ ",
      "ไอเทมปังๆ ที่อยากให้ลอง "
    ];
    const randomIndex = Math.floor(Math.random() * RANDOM_CAPTION_HOOKS.length);
    const randomPrefix = RANDOM_CAPTION_HOOKS[randomIndex];
    const randomizedHook = `${randomPrefix}${hook}`;
    return rest ? `${randomizedHook}\n${rest}` : randomizedHook;
  }

  // ขึ้นต้นด้วยชื่อสินค้า/hook เลย
  return rest ? `${hook}\n${rest}` : hook;
}

function removeEmojis(str) {
  return String(str || "").replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim();
}

function renderCaptionTemplate(template, variables) {
  return String(template || "")
    .split("\n")
    .map((line) => renderCaptionLine(line, variables))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function renderCaptionLine(line, variables) {
  const placeholders = [...String(line || "").matchAll(/{([a-z_]+)}/g)].map((match) => match[1]);
  if (placeholders.some((key) => variables[key] !== undefined && !String(variables[key] || "").trim())) {
    return "";
  }

  return Object.entries(variables).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value || "")),
    line
  ).replace(/[ \t]+/g, " ").trim();
}

export function resolveCaptionProductName(productInfo = {}) {
  // Lead with the user-edited "ชื่อสินค้า / Hook" field (productInfo.name);
  // fall back to the raw scraped title only when it is empty.
  return cleanCaptionText(
    productInfo.name ||
    productInfo.originalName ||
    productInfo.productLinkTitle ||
    productInfo.rawProduct?.title ||
    productInfo.rawProduct?.product_name ||
    productInfo.rawProduct?.name ||
    ""
  );
}

export function stripForeignNonThaiScripts(value) {
  return String(value || "")
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f\uac00-\ud7af\u0400-\u04ff\u0600-\u06ff]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCaptionText(value) {
  return stripForeignNonThaiScripts(stripWeirdCaptionChars(removeCaptionBracketText(value)));
}

function removeCaptionBracketText(value) {
  return String(value || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/\{[^}]*}/g, " ");
}

function stripWeirdCaptionChars(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function resolveProductUrl(productInfo = {}) {
  const direct = [
    productInfo.productUrl,
    productInfo.product_url,
    productInfo.url,
    productInfo.shareUrl,
    productInfo.share_url,
    productInfo.affiliateUrl,
    productInfo.affiliate_url,
    productInfo.rawProduct?.product_url,
    productInfo.rawProduct?.url,
    productInfo.rawProduct?.share_url,
    productInfo.rawProduct?.affiliate_url
  ].map(value => String(value || "").trim()).find(isLikelyProductUrl);
  if (direct) return direct;

  const nested = findNestedProductUrl(productInfo.rawProduct || productInfo);
  if (nested) return nested;

  const productId = String(productInfo.productId || productInfo.product_id || productInfo.id || "").trim();
  if (/^\d{8,}$/.test(productId)) {
    return `https://www.tiktok.com/view/product/${productId}`;
  }
  return "";
}

function isLikelyProductUrl(value) {
  return /^https?:\/\//i.test(value) && /(?:tiktok|shop)/i.test(value);
}

function findNestedProductUrl(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return "";
  seen.add(value);

  for (const [key, nestedValue] of Object.entries(value)) {
    if (/url|link/i.test(key) && isLikelyProductUrl(String(nestedValue || "").trim())) {
      return String(nestedValue).trim();
    }
  }
  for (const nestedValue of Object.values(value)) {
    const found = findNestedProductUrl(nestedValue, seen);
    if (found) return found;
  }
  return "";
}

export function normalizeHashtags(value, maxTags = 5) {
  const rawTags = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = new Set();
  const tags = [];
  const limit = Math.max(1, Number.parseInt(maxTags, 10) || 5);

  for (const rawTag of rawTags) {
    const cleaned = String(rawTag || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/^#+/, "");
    if (!cleaned) continue;

    const tag = `#${cleaned}`;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    tags.push(tag);
    if (tags.length >= limit) break;
  }

  return tags.length ? tags : ["#TikTokShop", "#ของดีบอกต่อ"].slice(0, limit);
}

export function buildPostHashtags(productInfo = {}, defaults = {}) {
  const baseTags = normalizeHashtags(defaults.hashtags, 4);
  const nameTags = buildProductNameHashtags(productInfo);
  return normalizeHashtags([...baseTags, ...nameTags], 5);
}

function resolveRawProductName(productInfo = {}) {
  return [
    productInfo.productLinkTitle,
    productInfo.originalName,
    productInfo.rawProduct?.title,
    productInfo.rawProduct?.product_name,
    productInfo.rawProduct?.name,
    productInfo.name
  ].find((value) => String(value || "").trim()) || "";
}

function segmentToHashtags(segment) {
  const cleaned = String(segment || "")
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/【[^】]*】/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  return cleaned.split(/\s+/).map((word) => {
    const chars = Array.from(word);
    const shortWord = chars.length > 25 ? chars.slice(0, 25).join("") : word;
    return shortWord ? `#${shortWord}` : "";
  }).filter(Boolean);
}

// แตกชื่อสินค้าตามคำและเครื่องหมายคั่น เช่น "POSE รองเท้านวด" → #POSE #รองเท้านวด
export function buildProductNameHashtags(productInfo = {}) {
  const rawName = resolveRawProductName(productInfo);
  const tags = [];
  const seen = new Set();
  for (const segment of String(rawName).split(/[,，、|/\n]+/)) {
    for (const tag of segmentToHashtags(segment)) {
      const key = tag.toLocaleLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

// คงไว้เพื่อ backward compat — คืน hashtag แรกจากชื่อ
export function buildProductNameHashtag(productInfo = {}) {
  return buildProductNameHashtags(productInfo)[0] || "";
}

function buildProductDetails(productInfo) {
  const details = [
    productInfo.productId ? `รหัสสินค้า: ${sanitizeText(productInfo.productId)}` : "",
    formatPrice(productInfo) ? `ราคา: ${formatPrice(productInfo)}` : "",
    productInfo.highlights ? `จุดเด่น: ${cleanCaptionText(productInfo.highlights)}` : "",
    productInfo.category ? `หมวดหมู่: ${cleanCaptionText(productInfo.category)}` : "",
    productInfo.shopName ? `ร้าน: ${cleanCaptionText(productInfo.shopName)}` : "",
  ].filter(Boolean);

  return details.join("\n");
}

export function truncateShopeeCaptionAndHashtags(caption, hashtagList = []) {
  let rawCaption = String(caption || "")
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let tags = [...hashtagList];

  let combined = `${rawCaption} ${tags.join(" ")}`.trim();
  if (combined.length > 150) {
    while (tags.length > 1 && `${rawCaption} ${tags.join(" ")}`.trim().length > 150) {
      tags.pop();
    }
    combined = `${rawCaption} ${tags.join(" ")}`.trim();
    if (combined.length > 150) {
      const tagsStr = tags.join(" ");
      const allowedCaptionLen = 150 - tagsStr.length - 1; // 1 space
      if (allowedCaptionLen > 3) {
        rawCaption = rawCaption.slice(0, allowedCaptionLen - 3).trim() + "...";
      } else if (allowedCaptionLen > 0) {
        rawCaption = rawCaption.slice(0, allowedCaptionLen).trim();
      } else {
        rawCaption = "";
        tags = [tags.join(" ").slice(0, 150)];
      }
    }
  }

  return {
    caption: rawCaption,
    hashtags: tags.join(" ")
  };
}
