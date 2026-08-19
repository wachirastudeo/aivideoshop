export const VIDEO_STYLES = [
  {
    id: "sales",
    emoji: "🛒",
    name: "ขายสินค้า",
    description: "เน้นปิดการขาย โชว์สินค้า จุดขาย และ CTA ชัด",
    shotPattern: "[Hook สินค้า] → [โชว์จุดขายหลัก] → [สาธิต/ซูมรายละเอียด] → [CTA สั่งซื้อ]",
    fragment: "photorealistic 4K cinematic ad, category-fit lighting, hero shot, benefit, fast reveal, CTA"
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
    shotPattern: "[คนพูดถึงสินค้า] → [ใช้งานสินค้าตามจริง] → [แนะนำให้ลอง]",
    fragment: "user generated content style, talking head, handheld camera feel, natural lighting, genuine review vibe, product shown in its normal real-world position and use, casual authentic presentation"
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
    id: "still-motion",
    emoji: "📷",
    name: "ภาพนิ่งขยับกล้อง",
    description: "สินค้านิ่ง กล้องมือถือขยับซ้าย-ขวาเบาๆ ไม่รีวิว ไม่พูด",
    shotPattern: "[ภาพสินค้าเดิม] → [แพนซ้าย-ขวาเบาๆ] → [เปลี่ยนมุมเล็กน้อย]",
    fragment: "single still product image with subtle smartphone camera movement, natural handheld micro-motion, no presenter, no product handling, no review"
  },
  {
    id: "boxed-motion",
    emoji: "📦",
    name: "สินค้าในกล่อง + ขยับกล้อง",
    description: "วางสินค้าในกล่องเปิด สินค้านิ่ง กล้องมือถือเคลื่อนเบาๆ",
    shotPattern: "[สินค้าในกล่องเปิด] → [แพนซ้าย-ขวาเบาๆ] → [เปลี่ยนมุมกล่องเล็กน้อย]",
    fragment: "exact product displayed inside an open presentation box, subtle smartphone camera movement, product remains still, no presenter, no product handling, no review"
  },
  {
    id: "fashion-selfie",
    emoji: "👗",
    name: "Fashion Selfie เต็มตัว",
    description: "นางแบบถือมือถือบังหน้า เห็นชุดเต็มตัว กล้องแพนเบาๆ",
    shotPattern: "[ยืนถือมือถือบังหน้า] → [แพนซ้าย-ขวาเบาๆ] → [โชว์ชุดเต็มตัว]",
    fragment: "full-body fashion selfie, fictional adult model holding a smartphone in front of her face, face fully hidden, exact outfit clearly visible, minimal natural movement, subtle smartphone camera pan"
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
  Auto: "Realistic cinematic shot. Prefer product-only views. If a presenter is shown, they must be a fictional adult commercial model standing near or gesturing towards the product without complex handling.",
  none: "No humans. Focus entirely on the product resting stably in a realistic setting with smooth camera movement.",
  hands_only: "Realistic first-person POV (Point of View) perspective. Show the product being used, worn, or presented naturally with realistic anatomical hands (strictly 5 fingers per hand, natural ergonomic grip, clean skin texture, realistic knuckles) or feet/legs depending on product category. No face or head shown in the frame.",
  unboxing_hands: "Realistic first-person POV hands-only unboxing presenter. Show only natural human hands opening the product box/package and revealing the product inside. No face, head, torso, or full body shown.",
  wearable_crop: "Wearable close-up presenter mode. Show only the relevant body area wearing or using the exact product, cropped below the face with no face, head, or full body. Use a clear off-screen Thai voiceover instead of on-screen presenter speech.",
  woman: "A fictional adult Thai woman reviewer standing in full-body view, modestly dressed in a complete outfit (proper shirt/blouse AND long pants/jeans/skirt). She uses or stands near the product naturally for its category, smiling at the camera.",
  man: "A fictional adult Thai man reviewer standing in full-body view, modestly dressed in a complete outfit (proper shirt/polo AND long pants/jeans). He uses or stands near the product naturally for its category, smiling at the camera.",
  child: "A cute young Thai child (4-6 years old, kindergarten age, strictly no baby or toddler under 4 years old) actively, safely, and naturally riding, playing with, wearing, or using the product in the scene (not hard-selling), accompanied by a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby supervising with love and care.",
  older_child: "A cute Thai older child (7-12 years old, kid) actively, safely, and naturally riding, playing with, wearing, or using the product in the scene (not hard-selling), accompanied by a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby supervising with love and care.",
  cartoon3d: "A cute 3D stylized character (Pixar-like) showing the product",
  living_product: "The product itself becomes a living character with cute 3D eyes and personality",
  dog: "A fictional adult Thai reviewer standing in full-body view modestly dressed in a complete outfit (shirt AND long pants) together with a cute dog, presenting the product in a bright indoor setting.",
  cat: "A fictional adult Thai reviewer standing in full-body view modestly dressed in a complete outfit (shirt AND long pants) together with a cute cat, presenting the product in a warm indoor setting."
};

const THAI_PERSON_DIRECTION = "Natural fictional adult Thai reviewer standing in a full-length shot, modestly dressed in a complete outfit (proper top AND long pants/skirt). The product must remain rigid and static; reviewer stands next to it gently.";
const THAI_HUMAN_CAST_DIRECTION = "THAI PRESENTER CAST: Use the selected fictional Thai commercial presenter. In Auto mode, include exactly one well-groomed, realistic, age-appropriate fictional adult Thai presenter.";

const KIDS_WITH_PARENT_DIRECTION = "KIDS PRODUCT SCENE WITH CHILD & PARENT SUPERVISION: The scene MUST depict a happy young Thai kindergarten child (4-6 years old or older, strictly no babies or toddlers under kindergarten age) actively, safely, and naturally riding, playing with, wearing, or using the kids product (e.g. riding the kids bicycle, playing with the toy) in a bright, clean setting. The child is naturally enjoying and using the product naturally in the scene without hard-selling to the camera. Accompanying the child MUST BE a friendly, smiling Thai parent/guardian (mother or father) standing or sitting nearby, supervising with love, warmth, and care. STRICTLY FORBIDDEN: Do NOT include dogs or unrelated pet animals. Do NOT show an isolated adult presenter without a child for kids products.";

const STRICT_MODEST_DRESS_CODE_MANDATE = "STRICT MODEST & APPROPRIATE DRESS CODE LOCK (ห้ามชุดสุ่มเสี่ยง/วาบหวิว): Presenters and models MUST wear clean, elegant, modest, everyday commercial attire (such as casual shirts, blouses, t-shirts, jackets, jeans, trousers, or modest knee-length skirts/dresses). STRICTLY FORBIDDEN: Do NOT generate revealing, immodest, risqué, suggestive, or provocative outfits. No deep v-necks, no exposed cleavage, no strapless tops, no crop tops showing stomach, no micro-shorts, no see-through/sheer clothing, no underwear/lingerie, and no tight/revealing swimwear. Always keep clothing respectable, professional, and 100% appropriate for commercial advertising.";

const FULL_BODY_PRESENTER_DIRECTION = "STRICT FULL-BODY SHOT & DECENT MODEST DRESS CODE: Presenter MUST be shown in a full-length head-to-toe standing view with head, torso, full legs, feet, and footwear fully visible on the floor. STRICT FULL OUTFIT REQUIREMENT: Presenter MUST wear a complete, modest FULL OUTFIT with BOTH a proper top (shirt/blouse/jacket) AND proper long bottoms (trousers/jeans/long pants/knee-length skirt). FORBIDDEN (ห้ามชุดสุ่มเสี่ยง/วาบหวิว): Absolutely NO revealing, immodest, risqué, suggestive, or provocative attire. No deep v-necks, no cleavage, no strapless tops, no stomach/crop tops, no micro-shorts, no sheer/see-through clothes, no lingerie, and no tight/revealing swimwear.";
const FASHION_SELFIE_IMAGE_DIRECTION = "FASHION SELFIE MODE: Create one realistic vertical 9:16 full-body fashion photograph of a fictional adult Thai female model standing naturally and holding a real smartphone vertically in front of her face. The smartphone must fully cover and obscure the face and facial features; do not show eyes, nose, mouth, or identifiable facial details. Show the exact reference garment worn by the model from head to toe, including the complete outfit, full legs, feet, and footwear with generous space around the body. Keep the model modestly dressed and front-facing so the garment is easy to inspect. This is a privacy-preserving outfit showcase: no face reveal, no extra people, no text, no logos added to the phone, and no mirror selfie distortion.";
const FASHION_SELFIE_VIDEO_DIRECTION = "FASHION SELFIE MODE — PRIVACY-PRESERVING FULL-BODY OUTFIT SHOWCASE: Use one consistent fictional adult Thai female model standing still in a full-length head-to-toe shot. She holds a real smartphone vertically at face height throughout the entire clip, and the phone must fully cover the face in every frame; never reveal eyes, nose, mouth, facial features, or an identifiable face. The exact reference garment is the hero: preserve its silhouette, fit, length, fabric, colors, pattern, seams, and printed artwork exactly. Keep the model front-facing, modestly dressed, and physically stable. No talking, lip-sync, waving, walking, turning around, outfit changes, extra people, mirror distortion, or added text. Use only minimal natural posture movement and a slow, subtle left-to-right smartphone-camera pan with a very small handheld micro-sway so the full outfit remains visible and sharp.";

const FULL_PRODUCT_VISIBILITY_DIRECTION = "STRICT FULL PRODUCT VISIBILITY & NO CROPPING RULE: The ENTIRE product (including all top, bottom, left, right, side edges, legs, handles, doors, shelves, and structural frame) MUST be 100% fully visible inside the frame. ABSOLUTELY NO CROPPING or cutting off any edge or portion of the product. For large or bulky items (such as cabinets, wardrobes, kitchen sinks, dishwashers, refrigerators, sofas, desks, or shelves), use a wide-angle framing (wide camera shot) with ample breathing space around all four edges of the product so that the ENTIRE full cabinet/sink/furniture piece is completely captured in the frame without any part chopped off.";

const HANDS_DIRECTION = "NATURAL HUMAN HAND REALISM & AUTHENTIC REVIEW POSES: Realistic first-person POV (Point of View) perspective. Show authentic, natural human hands and forearms holding, supporting, or presenting the product in a realistic, comfortable review pose. NATURAL HAND POSES & GESTURES: Hands must use authentic, relaxed, ergonomic holding poses — such as gently supporting the product from the bottom or sides, holding it steadily with a natural grip, softly turning it to show texture, or gesturing naturally toward details. ALWAYS keep the main brand logo, product title, and printed front artwork 100% visible without hands blocking or covering them. STRICTLY FORBIDDEN POSES: awkward claw grips squeezing the product, fingers covering key printed logos or text, unnaturally contorted wrists, impossible arm angles, or hands floating detached in mid-air. The hands must look 100% realistic, organic, and human with natural skin texture, realistic knuckles, soft fingernails, and natural wrist alignment. STRICT MAXIMUM TWO-HAND COUNT LOCK: The frame must contain AT MOST 2 human hands in total (strictly 1 left hand and 1 right hand, or 1 single hand). ABSOLUTELY FORBIDDEN & CRITICAL RULE: NEVER render 3 hands, NEVER render a third hand, NEVER render floating extra hands, duplicated hands, extra arms, or more than 2 hands under any circumstances across all frames. Each hand must have strictly exactly 5 fingers with natural fingernails, clean skin texture, realistic knuckles, and wrist joints; no extra fingers, no distorted digits, no clipping into the product.";
const HANDS_ONLY_GLOBAL_COUNT_LOCK = "GLOBAL TWO-HAND LOCK FOR THE ENTIRE VIDEO: Across every scene and frame, show only 1 or 2 human hands total. Use exactly one left hand and one right hand at most. Never add a third hand, extra arm, duplicated hand, floating hand, or hand belonging to another person. If a shot would create a third hand, remove that hand and keep only the primary pair.";
const HANDS_ONLY_STILL_COUNT_LOCK = "STILL IMAGE TWO-HAND LOCK: Show at most 2 human hands total, one left and one right from the same person. Never render a third hand, extra arm, duplicated hand, detached hand, or more than 5 fingers on either hand.";
const SINGLE_PRESENTER_HAND_ANATOMY_DIRECTION = "SINGLE-PRESENTER HAND ANATOMY: The one presenter has exactly 2 arms and at most 2 hands total, one left and one right, naturally attached to the same body. Never render a third hand, duplicated hand, extra arm, detached hand, or more than 5 fingers on either hand. Hands may be naturally hidden behind the body or outside the crop, but no additional hands may appear.";
const MULTI_PERSON_HAND_ANATOMY_DIRECTION = "MULTI-PERSON HAND ANATOMY: Each human has exactly 2 arms and no more than 2 anatomically attached hands, one left and one right. Never give any person a third hand, duplicate a hand or arm, add detached or anonymous hands, or render more than 5 fingers on either hand.";
const UNBOXING_HANDS_DIRECTION = "STRICT HANDS-ONLY UNBOXING PRESENTER MODE: First-person POV tabletop unboxing video. Show ONLY realistic human hands and forearms opening a shipping box or product box, lifting the lid/flaps, removing tissue paper/bubble wrap/protective insert, and revealing the exact target product inside the box. The product must become clearly visible after the box opens and remain the hero focus. No face, head, torso, full body, or on-screen presenter may appear at any time. Keep the scene natural, satisfying, tactile, and realistic, like a TikTok unboxing review shot from the presenter's point of view.";
const UNBOXING_REVEAL_SEQUENCE = "MANDATORY UNBOXING ACTION SEQUENCE: Scene 1 shows a closed box/package on a table with only hands entering frame. Scene 2 shows the hands opening the box flaps/lid and gently removing protective packaging. Scene 3 reveals the exact product inside the box, fully visible and sharp. Scene 4 shows the hands lifting or presenting the product near the open box without covering logos, labels, printed artwork, or key product details. STRICTLY FORBIDDEN: do not show a face or full person, do not replace the product with generic packaging, do not leave the product hidden inside the box.";
const HANDS_ONLY_FACE_EXCLUSION = "STRICT RULE — FIRST-PERSON POV FACE EXCLUSION: Close-up or medium POV shot cropped below the neck or from a first-person angle. No full face, facial features, or head are visible in the frame.";
const HANDS_ONLY_BACKGROUND_DIRECTION = "BACKGROUND AESTHETICS: The background must be a beautiful, warm, authentic modern setting (such as a cozy aesthetic cafe, stylish workspace, realistic indoor room, or natural outdoor path appropriate for the product) with a soft-focus shallow depth of field (cinematic bokeh blur). Keep the POV perspective, product, and interacting hands/feet/body parts in crisp, sharp focus.";
const ANIMAL_PRESENTER_DIRECTION = "Show a friendly Thai reviewer standing together with a cute consistent pet animal (cat or dog as specified) in the frame interacting with or standing near the product. The product must remain rigid, static, and completely unchanged; the animal must not damage, bite, or deform the product.";
const NO_UNREQUESTED_ANIMALS_DIRECTION = "No animals unless explicitly selected.";

const PRODUCT_FIDELITY_DIRECTION = "STRICT PRODUCT FIDELITY LOCK: You MUST reproduce the product EXACTLY as in the reference image. Preserve its exact shape, 3D geometry, form, contours, colors, texture, printed artwork, patterns, print designs, graphical illustrations, logos, labels, and parts. The pattern, artwork, and visual print on the product (especially for phone cases, clothes, or printed goods) must be 100% identical, keeping the same graphics, colors, and layout without any modification or hallucination. STRICT RULE: Do NOT redesign, warp, deform, restyle, simplify, or modify the product. Do not add extra items or decorations. It must look 100% identical and pixel-faithful to the reference without any visual drift. ABSOLUTE ZERO DISTORTION RULE: All printed text, logos, packaging dimensions, and labels must be preserved exactly as shown, with perfect spelling.";
const STILL_PRODUCT_FIDELITY_DIRECTION = "STILL PRODUCT IDENTITY: Preserve its exact shape, proportions, support structure, materials, colors, patterns, visible logos, labels, and printed text from the reference image. Keep the product physically coherent and at realistic scale. Do not invent parts, remove parts, redesign it, or force a new geometry.";
const STILL_TEXT_INTEGRITY_DIRECTION = "STILL TEXT INTEGRITY: Preserve any Thai, English, or other script physically printed on the reference product exactly as visible. Do not invent extra writing, fake letters, logos, labels, or gibberish anywhere else in the image.";
const REFERENCE_PIXEL_ARTWORK_LOCK = "REFERENCE PIXEL ARTWORK LOCK: For every visible pattern, cartoon, stripe, logo, label, color block, seam, and surface texture, copy only what is visibly present in the uploaded reference image as one unchanged surface design. Do not infer, redraw, beautify, simplify, mirror, recolor, or invent details from the product name, category, or generic fashion knowledge. If a detail is unclear, preserve the visible shape and color without guessing.";
const REFERENCE_IMAGE_HIGHEST_PRIORITY = "REFERENCE PHOTO OVERRIDES TEXT: Match the attached product exactly. BACKGROUND-ONLY EDIT: Keep the uploaded image as the source of truth: ISOLATE AND EXTRACT ONLY THE PRODUCT, then place that unchanged product in a 100% NEW SCENE & BACKGROUND. Preserve its exact shape, proportions, materials, colors, markings, printed text, parts, visible count, and realistic physical size relative to hands, presenter, or surroundings. Keep it fully visible, sharp and clearly visible. One product, one image; no collage or split screen. Never substitute, redesign, duplicate, combine, enlarge, shrink, or invent product details.";
const REFERENCE_VARIANT_DISAMBIGUATION_DIRECTION = "REFERENCE VARIANT DISAMBIGUATION: If the reference is a screenshot, collage, comparison, or has multiple product appearances, use only the original product. Ignore alternate/generated versions and never combine their design details. Generate one product, not the comparison layout.";
const APPAREL_REFERENCE_PRIORITY = "APPAREL REFERENCE PRIORITY: The attached reference image is the single source of truth for the garment. Preserve the exact garment type, silhouette, cut, length, neckline, sleeves, fit, fabric, colors, print, and visible construction. Do not let a sales hook, generic fashion wording, or presenter styling replace or redesign the garment.";
const REFERENCE_COMPOSITING_DIRECTION = "BACKGROUND-ONLY EDIT: Keep the reference product unchanged; replace only the background.";
const IMAGE_AUTO_ANIMAL_EXCLUSION = "IMAGE AUTO MODE: No dog, cat, puppy, kitten, or other animal unless the user explicitly selected dog or cat presenter.";

const LABEL_EXACT_COPY_MANDATE = "⚠️ ABSOLUTE LABEL & COLOR FIDELITY MANDATE — HIGHEST PRIORITY RULE: The product label, packaging, printed surface, AND all product colors MUST be reproduced as an EXACT 1-to-1 COPY from the reference photo. FORBIDDEN ACTIONS: (1) Do NOT redraw, redesign, or reinterpret the label artwork. (2) Do NOT change any font or letter shape on the label. (3) Do NOT alter, add, remove, or rearrange any graphic elements or icons. (4) Do NOT shift any element's position on the label. (5) Do NOT change the label background color, border, or color scheme. (6) Do NOT replace the original label with a generic version. (7) Do NOT shift, tint, darken, brighten, or reinterpret any product color — reproduce every hue, saturation, and brightness EXACTLY as seen in the reference photo. The reference photo is the ONLY acceptable source — treat every color and every label element as a pixel-for-pixel photographic stamp.";

const COLOR_EXACT_LOCK = "STRICT COLOR REPRODUCTION LOCK: Every color on the product — packaging background color, text ink color, logo color, pattern fill colors, gradient transitions — MUST match the reference image EXACTLY. FORBIDDEN: Do NOT warm up or cool down tones, do NOT darken or brighten any area, do NOT change saturation, do NOT substitute one color for another. The product's own surface colors must remain 100% identical to the reference regardless of the new background lighting.";

const PRODUCT_ISOLATION_DIRECTION = "CRITICAL ISOLATION RULE — ISOLATE AND EXTRACT ONLY THE PRODUCT: You must cut out the single product from the reference photo, ignoring its original background. Place the exact same product into a 100% NEW SCENE & BACKGROUND. STRICT RESTRICTION: Do NOT redraw, redesign, mutate, or alter the product's shape, logo, patterns, branding, or colors. Transfer it with 100% pixel-faithful identity to the reference image.";

const PRODUCT_STRUCTURE_DIRECTION = "Keep the exact visible count of parts. Never add, remove, or rearrange them.";

const SCALE_FIDELITY_DIRECTION = "Keep proportions and scale identical to reference: never stretch, squash, enlarge, or shrink it. The physical size of the product must be realistic and true-to-life compared to the environment, hands, or presenter. Do not make the product abnormally large or out-of-scale relative to the surroundings (Strictest rule: Product size must be realistic and in true scale relative to its environment or presenter; never make the product abnormally large).";
const REALISTIC_SCENE_SCALE_DIRECTION = "REALISTIC SCENE SCALE LOCK: Use real-world anchors, natural perspective, and background depth; never oversized, floating, or pasted on.";

const BACKGROUND_COMPATIBILITY_LOCK = "BACKGROUND COMPATIBILITY LOCK: The environment, surface, props, colors, and lighting must make physical and commercial sense for the exact product. Use only category-relevant objects. Do not place unrelated food, pets, plants, sports gear, bathroom items, kitchen tools, vehicles, or decorative props in the scene. For vehicle accessories, the matching vehicle is a required relevant context object. Never let the background compete with, hide, recolor, or imply an incorrect use for the product.";
const RAINWEAR_OUTDOOR_LOCATION_LOCK = "RAINWEAR OUTDOOR USE LOCK: Show the raincoat or waterproof garment outdoors in light rain or immediately after rain, with a safe wet path, covered walkway, campsite edge, park path, or residential street and believable wet-ground reflections. Keep the child and parent safely supervised. Never place rainwear in an indoor room, bedroom, nursery, cafe, studio, showroom, or dry fashion backdrop.";
const VEHICLE_ACCESSORY_CONTEXT_DIRECTION = "STRICT VEHICLE ACCESSORY CONTEXT LOCK: The matching real vehicle MUST be clearly visible and correctly matched to the product. Motorcycle accessories (helmet, motorcycle top box, rear case, rack, pannier, phone mount, or motorcycle part) MUST be shown on, attached to, or directly beside a real motorcycle or scooter; show enough of the motorcycle to make the use unmistakable. Car accessories MUST be shown inside, attached to, or directly beside a real car; show the relevant dashboard, seat, trunk, door, windshield, or exterior body. ABSOLUTELY FORBIDDEN: Do not show a motorcycle/car accessory alone on a generic desk, empty studio floor, unrelated room, cafe, or mismatched vehicle. Keep the product as the hero while the matching vehicle provides clear real-world context.";
const FOOTWEAR_STILL_OUTDOOR_BACKGROUND_LOCK = "HIGHEST PRIORITY FOOTWEAR STILL BACKGROUND OVERRIDE: The entire still-image scene MUST be clearly outdoors in open air, such as an outdoor home driveway, front yard, quiet neighborhood street, or park path. Use outdoor pavement, concrete, grass, or natural daylight. The shoe must be grounded on the outdoor surface or naturally worn on a visible foot outside. ABSOLUTELY FORBIDDEN: indoor rooms, houses, bedrooms, entryways, closets, shoe shelves, retail interiors, cafes, studios, indoor floors, or studio backdrops. If any other instruction conflicts with this, keep the shoe outdoors.";
const STILL_VIDEO_SOURCE_HERO_LOCK = "VIDEO SOURCE SCALE LOCK: Keep product centered and sized from real-world scene anchors, not frame coverage; keep breathing room/background. No giant, floating, or pasted product.";

function resolveMatchStillDirection(autoPresenter, firstSceneNoPeople = false) {
  const baseFidelity = "STRICT REFERENCE PHOTO PRODUCT FIDELITY LOCK: Reproduce the product 100% pixel-faithfully from the reference image. Preserve exact 3D form, contours, colors, material texture, printed artwork, brand logos, typography, and packaging text without distortion, morphing, redesign, or alteration.";
  const collageRule = "STRICT RULE: Do NOT generate a collage or grid frame. Each scene must be a single full-frame shot. Animate each panel sequentially with smooth camera movement and clean cuts.";
  const singleSceneRule = "STRICT RULE: Do NOT generate a collage or grid frame. Each scene must be a single full-frame shot with smooth camera movement and clean cuts.";
  const newSceneEnv = "STRICT NEW REALISTIC BACKGROUND SCENE LOCK: Generate a BRAND NEW, realistic, aesthetically composed background environment tailored to this product category (living room for furniture, cafe for coffee/phone cases, bathroom for skincare, workspace for gadgets). DO NOT copy the reference photo background.";
  const presenterContinuityRule = "PRESENTER CONTINUITY: Use one consistent fictional presenter with the selected gender, age range, hairstyle, and outfit throughout the generated video scenes. Keep the cast limited to that presenter unless the selected mode explicitly requires a child, parent, or pet.";

  if (autoPresenter === "none") {
    return `IMPORTANT: Depict the product across different scenes. ${baseFidelity} ${newSceneEnv} ${BACKGROUND_COMPATIBILITY_LOCK} ${collageRule}`;
  }
  if (autoPresenter === "hands_only") {
    return `IMPORTANT: Depict the product in an authentic first-person POV perspective across different scenes. ${baseFidelity} ${newSceneEnv} ${BACKGROUND_COMPATIBILITY_LOCK} ${collageRule} STRICTLY FORBIDDEN: Do not show any face or head in the frame; keep the camera angle in a realistic first-person POV cropped below the neck showing hands, arms, or feet/legs interacting with or wearing the product naturally.`;
  }
  if (autoPresenter === "unboxing_hands") {
    return `IMPORTANT: Depict the product in an authentic first-person POV unboxing sequence across different scenes. ${baseFidelity} ${newSceneEnv} ${BACKGROUND_COMPATIBILITY_LOCK} ${collageRule} STRICTLY FORBIDDEN: Do not show any face, head, torso, full body, presenter, or reviewer in the frame; show only hands opening the box/package and revealing the exact product inside.`;
  }
  if (autoPresenter === "wearable_crop") {
    return `IMPORTANT: Depict the exact wearable product in relevant body-part close-up scenes across different scenes. ${baseFidelity} ${newSceneEnv} ${BACKGROUND_COMPATIBILITY_LOCK} ${WEARABLE_CROP_SCENE_DIRECTION} Use off-screen Thai voiceover only; no on-screen presenter dialogue.`;
  }

  const scenePresenterRule = firstSceneNoPeople
    ? "PRESENTER SCENE ORDER: Scene 1 must show the product only with no people, hands, faces, or presenter. The presenter may appear starting from Scene 2 only."
    : presenterContinuityRule;
  return `IMPORTANT: Depict the product and presenter across different scenes. ${baseFidelity} ${newSceneEnv} ${BACKGROUND_COMPATIBILITY_LOCK} ${scenePresenterRule} ${singleSceneRule}`;
}


const REALISM_AND_PHYSICS_DIRECTION = "STRICT RIGIDITY & STABILITY LOCK: Realistic motion only. Product remains rigid, solid, and static: no morphing, warping, melting, wobbling, floating, or self-animating. SMARTPHONE CAMERA LOOK: organic UGC lighting, real lens perspective, natural exposure, no CGI sheen.";

const NATURAL_PRODUCT_INTERACTION_DIRECTION = "REALISTIC PRODUCT USE: Show the product in its normal real-world position and use for its category. Let ordinary posture, contact, support, and movement follow common sense and gravity. Do not force handheld presentation for products that are normally installed, placed, sat on, hung, mounted, or rested. Avoid floating items, awkward grips, and warped object physics.";
const OBJECT_REALISM_DIRECTION = "REAL-WORLD OBJECT PHYSICS: Product has real weight, volume, hard edges, and stable contact points. It must rest on a surface, in a hand, or against support with believable gravity, contact shadows, occlusion, reflections, and scale. Only camera/hands/packaging may move; product must not wiggle, resize, self-rotate, or act like a character.";

const NO_PUTTING_ON_OR_TAKING_OFF_MANDATE = "WEARABLE PRODUCT CONTINUITY: The presenter is already wearing the item naturally from the first frame. Do not show putting on, taking off, or repeatedly adjusting clothing, headwear, face coverings, or footwear during the short review.";
const WEARABLE_CROP_HAND_ANATOMY_LOCK = "WEARABLE CROP ANATOMY LOCK: Show at most two anatomically connected human hands total, never a third hand, extra arm, duplicated limb, floating hand, detached wrist, or extra fingers. Ignore any duplicate hands or limbs in the reference/generated source. For pants, shoes, and socks, keep hands out of frame unless naturally required; for bracelets, rings, and gloves, show only the one natural hand/wrist or one natural pair needed to wear the product.";
const WEARABLE_CROP_MODE_DIRECTION = `WEARABLE CLOSE-UP MODE: Show only the relevant body area wearing or using the exact reference product. Crop below the face: no face, head, full torso, or full-body presenter. Keep the product as the hero, preserve its exact design and realistic scale, and use a clear natural off-screen Thai voiceover. Do not show putting on, taking off, or repeatedly adjusting the item. ${WEARABLE_CROP_HAND_ANATOMY_LOCK}`;
const WEARABLE_CROP_SCENE_DIRECTION = `WEARABLE CLOSE-UP SCENES: Every scene uses a clean close-up or medium crop of the relevant body part only. Keep the face and head outside the frame. No full-body shot, talking head, or on-screen presenter dialogue. The exact wearable product remains visible, naturally worn, stable, and undistorted. ${WEARABLE_CROP_HAND_ANATOMY_LOCK}`;

const SHOE_FIDELITY_DIRECTION = "For footwear, preserve the exact single-shoe/pair count, toe shape, sole thickness, lace pattern, and color blocking. Do not change the shoe model.";
const SHOE_SCALE_DIRECTION = "STRICT FOOTWEAR SCALE & PLACEMENT LOCK: This is a real human shoe, not a giant prop or miniature toy. Preserve true foot-sized proportions and the exact single-shoe/pair count. Show it at realistic scale relative to a human foot, leg, hand, shoe box, floor, shelf, or presenter. ABSOLUTELY FORBIDDEN: do not enlarge the shoe to furniture-scale, make it tiny, or place it in an unrelated oversized environment. Keep the shoe grounded on a realistic floor, shelf, or naturally worn on a foot.";

const CLOTHING_FIDELITY_DIRECTION = "STRICT CLOTHING & APPAREL GARMENT FIDELITY LOCK: Match the reference garment's type, cut, fit, length, neckline or waistband, sleeves or legs, fabric, color, print, logo, seams, pockets, and fasteners. Keep those visible design details consistent while allowing natural fabric drape and ordinary movement. Show the front design clearly and do not use a back-facing or 360-degree spin.";
const APPAREL_REFERENCE_USE_DIRECTION = "APPAREL REFERENCE USE: Treat the attached image as the authoritative reference for the garment itself. Reproduce that exact garment as the featured clothing item, preserving its cut, fit, length, neckline, sleeves, fabric, seams, pockets, fasteners, colors, print, logo, and every visible design detail. When a presenter is selected, the presenter is already wearing the exact reference garment naturally. When no presenter is selected, display the full-size garment naturally on a hanger, mannequin, or clean flat lay.";
const APPAREL_SCALE_DIRECTION = "APPAREL SCALE: Show the garment at realistic full-size human clothing scale, naturally fitted on the selected presenter or displayed at its true wearable size. Preserve the reference garment's exact proportions and fit.";
const APPAREL_VISIBILITY_DIRECTION = "APPAREL VISIBILITY: Keep the complete featured garment and its important front details clearly visible without covering it with hands, hair, outerwear, or props.";
const APPAREL_FABRIC_PHYSICS_DIRECTION = "NATURAL FABRIC PHYSICS: The garment is flexible fabric with believable drape, folds, seams, and gentle motion caused by the presenter's body. Keep its design, cut, proportions, colors, graphics, and construction unchanged while the fabric moves naturally.";
const APPAREL_PRESENTER_FRAME_CONTINUITY = "APPAREL PRESENTER FRAME CONTINUITY: Keep the presenter's complete head, neck, torso, arms, legs, and feet anatomically connected and fully inside the frame throughout every shot. Preserve comfortable space above the head and below the feet. The complete head and body must remain visible in the final frame before each hard cut and the first frame after each hard cut. Use instantaneous hard cuts only; never crossfade, dissolve, wipe, morph, or interpolate the presenter between scenes. Never crop, hide, detach, or make the head or any body part disappear during a scene change.";
const FICTIONAL_CAST_DIRECTION = "HUMAN CAST: Use a generic fictional commercial presenter according to the selected presenter mode.";
const INDEPENDENT_FICTIONAL_CAST_DIRECTION = "INDEPENDENT FICTIONAL CAST: Generate the selected fictional presenter independently. Use the product reference only for garment design details; choose the presenter and setting from the selected options.";
const APPAREL_FICTIONAL_MODEL_DIRECTION = "APPAREL MODEL SAFETY: For clothing, fashion, bags, or accessories, use only a fictional adult commercial fit model or product-only mannequin-style presentation.";
const NECK_SCARF_USAGE_LOCK = "STRICT SILK NECK SCARF USAGE LOCK: Treat this as the exact small silk neck scarf/neckerchief shown in the reference. Follow the reference image's real wearing position, fold, knot, and drape. For a scarf shown for the neck, keep it around the neck, collar, or collarbone only. Never wrap it around the hair, cover the head, make a turban/headwrap/headband, tie it as a hair accessory, or use it as a face covering. The reference usage overrides the generic word 'scarf'; only use headwear placement if the reference clearly shows head use.";

const COLOR_AND_PATTERN_FIDELITY_DIRECTION = "EXACT COLOR & PATTERN ACCURACY: Preserve the exact colors, patterns, artwork, and motifs from the reference image pixel-for-pixel. Do NOT shift, alter, tint, recolor, or replace original colors or graphics under any lighting or environment effect. Every color zone — background fill, text color, graphic element colors, border colors — must remain exactly as shown in the reference photo.";
export const TIKTOK_CAPTION_SIGNATURE = "i love tiktok";

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

function isRainwearProduct(text = "") {
  return /(เสื้อกันฝน|เสื้อฝน|ชุดกันฝน|เสื้อคลุมกันฝน|raincoat|rain\s*jacket|waterproof\s*jacket|waterproof\s*coat|poncho)/i.test(String(text || ""));
}

function isNeckScarfProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  return /(?:ผ้าพันคอ|ผ้าพันคอไหม|silk\s*scarf|neck\s*scarf|neckerchief)/i.test(clean) &&
    !/(ผ้าคลุมหัว|โพกหัว|คลุมผม|ผ้าโพก|head\s*scarf|headwrap|hair\s*scarf|turban)/i.test(clean);
}

function getApparelWearDirection(text = "", selectedPresenter = "") {
  const clean = String(text || "").toLowerCase();
  const gender = detectExplicitProductGender(clean) || (["woman", "man"].includes(selectedPresenter) ? selectedPresenter : "");
  const model = gender === "man" ? "adult male model" : gender === "woman" ? "adult female model" : "selected adult model";

  if (isNeckScarfProduct(clean)) {
    return `${NECK_SCARF_USAGE_LOCK} The ${model} wears the exact scarf naturally around the neck as shown in the reference, with the hair and head uncovered.`;
  }

  if (/(เดรส|จั๊มสูท|ชุดหมี|dress|jumpsuit|romper|one.?piece)/i.test(clean)) {
    return `APPAREL WEARING MODE: The ${model} naturally wears the exact reference one-piece garment once as intended. Let the model choose simple shoes and accessories naturally.`;
  }
  if (/(กางเกง|กระโปรง|เลกกิ้ง|ยีนส์|ขาสั้น|ขาสามส่วน|pants|trousers|shorts|leggings|jeans|skirt|bottoms?)/i.test(clean)) {
    return `APPAREL WEARING MODE: The ${model} naturally wears exactly one pair of the exact reference garment as the sole visible bottom garment. Let the model choose a simple matching top naturally. Do not add another pair of trousers, shorts, leggings, or a skirt over or under it.`;
  }
  if (/(เสื้อ|แจ็คเก็ต|สเวตเตอร์|ฮู้ด|shirt|tshirt|tee|top|jacket|hoodie|sweater|blouse|coat)/i.test(clean)) {
    return `APPAREL WEARING MODE: The ${model} naturally wears the exact reference garment once as the sole visible featured top. Use a simple opaque, full-coverage matching bottom such as jeans, trousers, or a modest skirt. Do NOT show underwear, lingerie, panties, briefs, thongs, bikini bottoms, or any transparent lower garment. Do not add another top over the reference garment.`;
  }
  return `APPAREL WEARING MODE: The ${model} naturally wears the exact reference garment once in the normal way for that garment type. Let the model choose a simple complementary outfit naturally without layering a duplicate garment of the same type.`;
}

function getChildApparelWearDirection(text = "") {
  const clean = String(text || "").toLowerCase();
  const garmentType = /(เสื้อกันฝน|raincoat|เสื้อ|แจ็คเก็ต|โค้ท|shirt|jacket|coat)/i.test(clean)
    ? "outer garment"
    : "exact reference garment";
  return `CHILD GARMENT USE: The supervised Thai child wears the exact reference ${garmentType} naturally and safely over age-appropriate opaque clothing. Keep the garment's real fit, colors, pattern, and visible details unchanged. The parent stays nearby; do not introduce an adult model, costume change, or child dialogue.`;
}

function getPresenterOutfitDirection(text = "", selectedPresenter = "") {
  const clean = String(text || "").toLowerCase();
  const model = selectedPresenter === "man" ? "male presenter" : "female or male presenter";

  if (isClothingProduct(clean)) {
    return getApparelWearDirection(clean, selectedPresenter);
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks)/i.test(clean)) {
    return `PRESENTER OUTFIT MATCH: The ${model} wears the exact reference footwear when intended. Use coordinated casual streetwear or athletic wear; never show a different shoe model or mismatched styling.`;
  }
  if (isCampingOutdoorProduct(clean) || isOutdoorRideProduct(clean) || /(วิ่ง|ออกกำลังกาย|ฟิตเนส|กีฬา|sport|running|workout|fitness|athletic)/i.test(clean)) {
    return `PRESENTER OUTFIT MATCH: The ${model} wears modest outdoor clothing with sports shoes matched to the product and setting.`;
  }
  if (/(ครีม|เซรั่ม|สกินแคร์|เมคอัพ|เครื่องสำอาง|ลิป|น้ำหอม|beauty|skincare|makeup|cosmetic|lipstick|perfume|fragrance)/i.test(clean)) {
    return `PRESENTER OUTFIT MATCH: The ${model} wears polished, elegant, modest beauty-review attire in calm colors that complement the product.`;
  }
  if (/(กระเป๋า|เป้|กระเป๋าถือ|กระเป๋าสะพาย|แว่น|นาฬิกา|เครื่องประดับ|bag|backpack|wallet|handbag|glasses|sunglasses|watch|jewelry|accessory)/i.test(clean)) {
    return `PRESENTER OUTFIT MATCH: The ${model} wears a coordinated, modest modern fashion outfit that complements the accessory and keeps it clearly visible.`;
  }
  if (/(ครัว|เครื่องครัว|ทำอาหาร|เตา|หม้อ|กระทะ|เครื่องใช้ในบ้าน|ทำความสะอาด|organizer|storage|kitchen|cookware|home appliance|cleaning)/i.test(clean)) {
    return `PRESENTER OUTFIT MATCH: The ${model} wears neat, modest smart-casual home attire appropriate to the product setting. Use an apron only for a cooking or kitchen product.`;
  }
  return `PRESENTER OUTFIT MATCH: The ${model} wears clean, modest clothing appropriate to the product category, use case, setting, and product colors. Avoid unrelated costumes or distracting patterns.`;
}

const PRINTED_GRAPHIC_FIDELITY_DIRECTION = "STRICT LOGO & PRINTED TEXT FIDELITY LOCK: Reproduce all printed surface artwork, brand logos, typography, font styles, symbols, badges, illustrations, and packaging text EXACTLY as in the reference image. Maintain the exact text placement, letter alignment, font weight, line spacing, logo proportion, and colors. Copy it 100% pixel-faithfully; NEVER redraw with a different font, NEVER restyle, simplify, omit, alter, or replace any logo or text. For video frames, all printed text and logos must remain static and crisp on the product surface.";




const SPRAY_BOTTLE_FIDELITY_DIRECTION = "SPRAY BOTTLE & PACKAGING LABEL FIDELITY LOCK: The product is a spray bottle, pump spray, aerosol canister, or liquid grooming bottle. You MUST reproduce the EXACT bottle shape, trigger/spray pump nozzle type, cap style, liquid container color, and printed front label artwork 100% pixel-faithfully as shown in the reference image. Preserve the exact brand logo, product name typography, printed graphics, patterns, illustrations, animal mascot graphics, and label colors. Do NOT draw a plain generic bottle, do NOT omit or change the brand logo/pattern, and do NOT alter the spray nozzle shape or label design.";
const EYEWEAR_FIDELITY_DIRECTION = "For eyewear, the size and scale of the glasses must be perfectly proportioned to a human face, head, or hands. Do not make the glasses abnormally large, tiny, or out-of-scale relative to the presenter. Maintain the exact frame shape, lens color/transparency, bridge width, and temple length.";
const BEAUTY_SKINCARE_FIDELITY_DIRECTION = "For cosmetics, skincare, and personal care (creams, serums, lipsticks, bottles, tubes, compacts): preserve the exact container bottle/jar/tube shape, dispenser cap/pump type, brand logo, printed text, label artwork, and formula texture. Do not alter container proportions, lid type, or packaging design.";
const COFFEE_BAG_FIDELITY_DIRECTION = "STRICT COFFEE POUCH & PRINTED LABEL TYPOGRAPHY LOCK: The product is a printed coffee bag or coffee bean pouch (such as a black matte side-gusset flat-bottom pouch with top zipper seal crimp line and round one-way degassing valve). You MUST reproduce the EXACT printed front label artwork, brand logo/mascot emblem (such as roaring bear, animal icon, or roastery logo), typography, font style, exact Thai/English brand text, grade markings (e.g. Grade A/B, 100% Arabica, Doi Chang), weight markings (e.g. 200g/250g/500g/1Kg), roasting badges, degassing valve, seal crimp edges, pouch color, and pouch shape 100% pixel-faithfully as shown in the reference image. Maintain the exact label background color, logo placement, badge alignment, and printed text layout without redrawing, altering, replacing, simplifying, changing fonts, or writing gibberish on the label.";
const COFFEE_POWDER_FORM_DIRECTION = "STRICT COFFEE POWDER FORM LOCK: The product is ground coffee powder/grounds, not whole coffee beans. Preserve the exact fine powder or ground-coffee form shown in the reference. If the package is opened or the contents are shown, reveal only loose ground coffee powder with a fine granular texture. ABSOLUTELY FORBIDDEN: Do not show whole roasted coffee beans, coffee cherries, unground beans, or a different coffee form.";
const COFFEE_BEANS_FORM_DIRECTION = "STRICT WHOLE COFFEE BEANS FORM LOCK: The product is whole roasted coffee beans, not ground coffee powder. Preserve the exact whole-bean form shown in the reference. If the package is opened or the contents are shown, reveal only whole roasted coffee beans. ABSOLUTELY FORBIDDEN: Do not show ground coffee powder, loose coffee grounds, coffee dust, or a different coffee form.";
const COFFEE_SEALED_POWDER_POUCH_DIRECTION = "STRICT SEALED COFFEE POUCH IDENTITY LOCK: The reference product is a sealed printed coffee pouch containing ground coffee powder. The sealed pouch itself is the hero product and must remain fully closed, upright, intact, and unchanged; keep all ground coffee inside the pouch. Do not replace the pouch with loose powder, a bowl, a cup, beans, or a generic package. Preserve the exact pouch silhouette, front artwork, label, colors, typography, seams, zipper/valve, and weight marking from the reference.";
const COFFEE_SEALED_BEANS_POUCH_DIRECTION = "STRICT SEALED COFFEE POUCH IDENTITY LOCK: The reference product is a sealed printed coffee pouch containing whole roasted coffee beans. The sealed pouch itself is the hero product and must remain fully closed, upright, intact, and unchanged; keep all coffee beans inside the pouch. Do not replace the pouch with loose beans, a bowl, a cup, powder, or a generic package. Preserve the exact pouch silhouette, front artwork, label, colors, typography, seams, zipper/valve, and weight marking from the reference.";
const COFFEE_REFERENCE_VARIANT_LOCK = "COFFEE REFERENCE VARIANT LOCK: Use only the canonical pouch in the reference; ignore alternate/generated pouches, promotional panels, blue/yellow artwork, oversized mascots, and headlines. Preserve one consistent design: silhouette, color, logo, typography, and label layout.";
const COFFEE_SINGLE_VARIANT_AD_LOCK = "COFFEE SINGLE-VARIANT AD LOCK: Roast words in the title are metadata; show only the exact reference pouch, not multiple roast variants, bags, colors, or a lineup.";
const COFFEE_COMPACT_TEXT_LOCK = "NO TEXT OVERLAY: No added captions, slogans, CTA, watermark, logo, banner, or graphic text; only printed label/scene text already in the reference may remain.";
const COFFEE_PROFESSIONAL_AD_DIRECTION = "PROFESSIONAL COFFEE PRODUCT AD: Minimal clean premium ad; exact pouch hero, fully visible on a clean surface, medium angle, soft daylight through a curtain, relevant context only. Respect the existing product scale rules: preserve the real physical size of a coffee pouch or hand-held item, with natural proportion relative to hands and surroundings; do not enlarge or shrink it. One product, one image; no collage, split screen, duplicate, alternate package, or unrelated props.";

function isCoffeePowderProduct(text = "") {
  return /(กาแฟผง|ผงกาแฟ|กาแฟบด|กาแฟคั่วบด|coffee powder|ground coffee|ground beans)/i.test(String(text || "").toLowerCase());
}

function isCoffeeBeanProduct(text = "") {
  return /(เมล็ดกาแฟ|กาแฟเมล็ด|เมล็ดคั่ว|coffee beans|whole coffee bean|whole bean)/i.test(String(text || "").toLowerCase());
}

function isPackagedCoffeeProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  return /(ถุงกาแฟ|ซองกาแฟ|ถุง|ซอง|pouch|sachet|packet|coffee\s*(?:bag|pouch)|\b(?:200|250|500|1000|1\s*kg)\s*g?\b|(?:200|250|500|1000|1\s*กิโล|1\s*กก)\s*กรัม?)/i.test(clean);
}

function isCoffeeProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  if (/(แก้วกาแฟ|กาแฟกระป๋อง|กาแฟพร้อมดื่ม|iced coffee|coffee cup|canned coffee|ready to drink coffee)/i.test(clean)) {
    return false;
  }
  return /(กาแฟ|coffee|arabica|robusta|doi chang|ดอยช้าง|roasters|roastery|espresso)/i.test(clean);
}
const ELECTRONICS_GADGETS_FIDELITY_DIRECTION = "For tech/gadgets, preserve exact body contours, button placement, screen bezel width, port cuts, texture, and brand logo. Do not distort device shape.";
const SMALL_TECH_ACCESSORY_SCALE_DIRECTION = "STRICT SMALL TECH ACCESSORY SCALE LOCK: This product is a real desk-sized tech accessory, not a large appliance or oversized prop. Preserve true physical scale: a mouse is about palm-sized (roughly 10-13cm long), a keyboard is desk-width and slim, earbuds fit in the ear or charging case, a charger/cable is small enough to hold in one hand, and a headset/headphones fit naturally on a human head or rest on a desk. Show it at realistic size relative to hands, a laptop, keyboard, desk surface, or presenter. ABSOLUTELY FORBIDDEN: do not enlarge it into a giant object, appliance, bag-sized item, or furniture-scale prop; do not shrink it into a tiny toy.";
const PHONE_CASE_FIDELITY_DIRECTION = "STRICT PHONE CASE & MOBILE ACCESSORY FIDELITY LOCK: You MUST reproduce the phone case (or mobile cover) EXACTLY as depicted in the reference image. PRESERVE EXACT 3D FORM & CUTOUT GEOMETRY: All camera lens cutout shapes, camera bump border, side button covers, speaker/charger port cutouts, edge bevels, AND any built-in magnetic ring (MagSafe ring) MUST be rendered 100% pixel-faithfully without any deformation. EXACT PRINTED ARTWORK & PATTERNS: Any printed cartoon graphics, illustrations, brand artwork, typography, pattern motifs, magnetic ring circle, or charm attachments MUST be reproduced 100% pixel-faithfully in exact position, colors, and layout. CASE ARTWORK COORDINATE LOCK: Treat the reference artwork as an exact texture map on the case surface. Preserve every motif's orientation and position relative to the case's top, bottom, left, right edges, corners, camera cutout, MagSafe ring, and side boundaries. Do NOT invent a similar pattern, mirror it, rotate it, stretch it, reflow it, center-shift it, crop it, or let it drift onto the phone, camera bump, bezel, or background. If perspective or curvature is visible, follow the reference perspective while keeping the artwork aligned to the physical case surface. REAL-WORLD PHONE SCALE LOCK: When the case is on or near a phone, preserve true smartphone size relative to a full-size hand, table, room, and furniture. Never let one phone or case fill half a table or become furniture-sized just to look prominent. ZERO WARPING & SHAPE DRIFT RULE: The phone case must remain 100% rigid, perfectly fitted to a phone, and static without morphing, bending, stretching, or shifting design elements across video frames.";
const PHONE_CASE_COMPLEX_PATTERN_REFERENCE_LOCK = "COMPLEX PHONE CASE PATTERN REFERENCE LOCK: When the source image is clear, copy the entire visible case-back artwork as one exact graphic layer from the reference. The reference image overrides the product title, generic knowledge, and memory. Preserve motif count, linework, spacing, orientation, borders, colors, asymmetry, and partial edge motifs. Do not reinterpret, clean up, complete, simplify, symmetrize, or redraw a difficult pattern; never replace it with a similar-looking design.";
const JEWELRY_FIDELITY_DIRECTION = "For jewelry/watches, preserve exact gemstone cuts, metal luster/shade, chain link style, clasp, watch face indices, and sub-dials. Do not alter craftsmanship details.";
const BAGS_ACCESSORIES_FIDELITY_DIRECTION = "STRICT BAGS & ACCESSORIES STRUCTURAL FIDELITY LOCK: You MUST reproduce the bag (handbag, backpack, tote bag, shoulder bag, cross-body bag, wallet, or pouch) EXACTLY as depicted in the reference image. PRESERVE EXACT 3D SHAPE & HARDWARE: All bag silhouettes, strap/handle drop lengths, zipper pulls, metal clasps, buckles, stitching lines, and pocket placements MUST be rendered 100% pixel-faithfully without structural warping. MATERIAL TEXTURE & PRINTED ARTWORK: Preserve exact leather grain, canvas weave, nylon sheen, quilted pattern, brand monogram, logo plaque, or printed artwork. ZERO DEFORMATION RULE: The bag must maintain its true 3D structure and form naturally without melting, twisting, stretching, or morphing across video frames.";
const FOOD_BEVERAGE_FIDELITY_DIRECTION = "For food, beverages, coffee, and supplements: preserve the exact pouch/bottle/jar packaging shape, printed artwork, label text, and food presentation. Do not warp packaging dimensions or branding.";
const GENERAL_PACKAGING_FIDELITY_DIRECTION = "UNIVERSAL PRODUCT & PACKAGING LABEL FIDELITY LOCK: You MUST reproduce the target product EXACTLY as shown in the reference image. Preserve its 100% exact 3D form, packaging shape, container type, brand logo, printed text, front label artwork, graphic illustrations, typography, color scheme, and texture. Copy the reference image pixel-faithfully; do NOT redesign, simplify, alter, recolor, or warp the product or its packaging in any way.";
const HOME_LIVING_FIDELITY_DIRECTION = "For home goods, kitchenware, tumblers, mugs, and bedding: preserve the exact item shape, handle, lid, material texture (ceramic, stainless steel, fabric), print pattern, and proportions.";
const TUMBLER_BOTTLE_FIDELITY_DIRECTION = "STRICT TUMBLER & WATER BOTTLE FIDELITY LOCK: You MUST reproduce the tumbler, mug, or water bottle EXACTLY as depicted in the reference image. PRESERVE EXACT 3D SHAPE & HARDWARE: The exact cylindrical taper, height-to-width ratio, handle shape and placement (if any), lid type, straw (if present), spout, and bottom base MUST be rendered 100% pixel-faithfully without warping. EXACT MATERIAL & ARTWORK: Preserve the exact material finish (matte, glossy stainless steel, gradient colors, powder coating) and ALL printed surface artwork, brand logos, cartoon characters, and patterns 100% pixel-faithfully. ZERO DEFORMATION RULE: The cup must remain 100% rigid, perfectly cylindrical, and static without melting, denting, or shifting dimensions across video frames.";
const FURNITURE_FIDELITY_DIRECTION = "FURNITURE STRUCTURE FIDELITY: Reproduce the furniture exactly as shown in the reference. Preserve its actual support system and geometry, whether it uses crossed folding legs, straight legs, a pedestal, a frame, fabric tension, or another construction. Keep the same proportions, armrests, seat/back shape, materials, stitching, joints, and hardware. Keep it grounded and physically stable without changing, bending, melting, or warping its structure.";
const CHAIR_FIDELITY_DIRECTION = "CHAIR-SPECIFIC FIDELITY LOCK: Reproduce the exact chair model in the reference, not a generic chair. Preserve the seat pan shape, backrest height/angle, armrests, leg count/geometry, braces, hinges, frame tubes, foot caps, upholstery, stitching, seams, and hardware. Preserve the exact folding mechanism and open position when visible. Keep it fully assembled and stable; never add, remove, straighten, round off, or replace structural parts.";
const FURNITURE_SURFACE_TEXT_LOCK = "FURNITURE SURFACE TEXT LOCK: Add NO new writing, letters, numbers, fake logo, brand name, label, watermark, sticker, badge, or typography. If none is visible in the reference, the product surface MUST remain completely plain and blank. Preserve only a real logo or intentional product pattern visibly present in the reference, in the same location.";
const HAMMOCK_FIDELITY_DIRECTION = "HAMMOCK STRUCTURE FIDELITY: Preserve the exact fabric bed shape, width, weave, colors, end ropes, loops, straps, knots, and spreader bars only when visible in the reference. Install those existing attachment parts naturally between two suitable supports without adding handles, rigid furniture legs, packaging, or extra structural parts.";

const SPEECH_DIRECTION = "STRICT PROGRESSIVE SCENE NARRATION, NATURAL UNHURRIED TEMPO & ZERO REPETITION LOCK: Each scene in the video MUST have its own UNIQUE, DIFFERENT spoken sentence in Thai that flows naturally at a relaxed, unhurried human pace (do NOT rush or speak too fast). ABSOLUTELY FORBIDDEN: NEVER repeat, loop, echo, or re-say the sentence spoken in the previous scene. Scene 2 MUST speak a NEW, DIFFERENT sentence from Scene 1; Scene 3 MUST speak a NEW, DIFFERENT sentence from Scene 2. Maintain a continuous, natural progressive voiceover across all scenes without repeating any phrase or sentence.";
const VOICEOVER_DIRECTION = "Add a clear, natural Thai off-screen voiceover narration speaking at a comfortable, unhurried pace (no visible person). All spoken audio must be in Thai.";
const NO_WOW_DIRECTION = "STRICT WORD EXCLUSION: The Thai word \"ว้าว\" MUST NEVER appear in spoken dialogue, voiceover, subtitles, captions, or any newly generated on-screen text. Use natural product-specific wording instead. Preserve only text that physically exists on the product reference.";

const TEXT_FREE_DIRECTION = "HIGHEST PRIORITY — STRICT NO-TEXT RULE: Do not add any text overlays, subtitles, captions, price tags, banners, promotional copy, watermarks, CTA, signs, labels, or graphics containing text. Absolutely no on-screen text, writing, letters, words, symbols, or numbers should be added anywhere in the image or video. Keep the product's own printed text exactly as in the reference image, but do not add any new, extra, or unnecessary text.";

const NO_ADDED_PATTERNS_OR_GRAPHICS_RULE = "⚠️ STRICT PLAIN PRODUCT LOCK: If the reference product is plain, blank, solid-colored, or lacks printed graphics/patterns, you MUST keep the generated product 100% PLAIN, BLANK, and CLEAN. Strictly FORBIDDEN: Do NOT invent, add, or draw any extra patterns, stripes, graphics, logos, prints, or decorations whatsoever.";
const NO_HALLUCINATED_BRAND_LOGOS_RULE = "⚠️ ZERO HALLUCINATION MANDATE: Strictly FORBIDDEN to generate, invent, or place any brand names, text, typography, letters, emblems, or logos on the product surface if they do NOT exist in the original reference image. If the product is blank in the reference, it MUST remain completely blank. Do NOT add random brands, gibberish text, or fake logos.";
const REFERENCE_BRAND_ONLY_LOCK = "STRICT REFERENCE BRAND-ONLY LOCK: Use only the brand name, logo, mascot, emblem, and printed marks visibly present on the uploaded product reference, with exact spelling, shape, position, and colors. Never guess, autocomplete, translate, replace, or invent branding from the title or category. Never add another manufacturer, retailer, marketplace, sponsor, competitor, or background logo. If the brand is unclear or not visible, leave the product unbranded. Exclude shop watermarks.";

const ENGRAVED_EMBOSSED_FIDELITY_DIRECTION = "STRICT ENGRAVED, EMBOSSED & SURFACE-CARVED PATTERN FIDELITY LOCK: If the product has engraved, embossed, debossed, etched, laser-carved, or relief-carved surface patterns, textures, or artwork (ลวดลายฉลัก/สลัก/นูน), you MUST reproduce every line, groove, motif, and depth relief 100% pixel-faithfully as shown in the reference image. STRICTLY FORBIDDEN: Do NOT redraw the pattern with simplified lines, do NOT round off sharp edges, do NOT add extra ornamental details, and do NOT change the spacing, proportions, or depth of any carved element. The engraved pattern must match the reference exactly in layout, shape, thickness of lines, and overall design without any artistic interpretation or hallucination. Preserve the exact metallic, ceramic, wood, or material surface finish that carries these carvings.";

const NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION = "STRICT THAI LANGUAGE ONLY & ZERO GIBBERISH LOCK: All visible text overlays, packaging writing, captions, signs, and spoken dialogue MUST be in 100% correct, flawless Thai script ONLY (ข้อความภาษาไทยถูกต้องเท่านั้น). ABSOLUTELY FORBIDDEN: Do NOT write or render foreign scripts (Chinese, Japanese, Korean, Arabic, etc.), distorted gibberish symbols, or fake pseudo-letters anywhere on the product, background, or video frame.";

const STRICT_SHOP_LOGO_EXCLUSION_RULE = "CRITICAL RULE — STRICTLY FORBIDDEN: Do NOT copy, replicate, draw, or include any shop logos, store branding watermarks, seller profile logos, platform badges, e-commerce icons, or corner watermarks visible in the reference photo. Extract ONLY the physical product object itself. Absolutely NO shop logos, NO store names, NO watermarks, NO seller stamps, and NO platform icons anywhere on the generated image or video.";




const STRICT_PRODUCT_IDENTITY_RULE = "STRICT PRODUCT IDENTITY: Do not invent new design details, buttons, stripes, logos, or decorations not on the reference. Render any texture finish (matte, glossy, metallic, fabric) or gradient with 100% precision. Do not compromise product accuracy for style.";

const NO_PEOPLE_DIRECTION = "No people, faces, presenters, reviewers, or characters.";
const EXPLICIT_ADULT_PRESENTER_NO_CHILD_DIRECTION = "EXPLICIT ADULT PRESENTER LOCK: The selected presenter is an adult woman or adult man. Show exactly one adult presenter only. Do NOT include any child, minor, baby, toddler, or parent-and-child pair, even when the product is intended for children.";
const EXPLICIT_CHILD_PRESENTER_DIRECTION = "EXPLICIT CHILD PRESENTER MODE: The user explicitly selected the cute child presenter. MUST show a happy fictional Thai child on camera, age 4-6 years old for child mode or 7-12 years old for older_child mode, actively and safely using or interacting with the product, together with exactly one friendly Thai parent/guardian supervising nearby. Do NOT replace the child with an adult-only presenter, Auto mode, hands-only, product-only, or voiceover-only presentation. Keep the same child and parent consistent across all scenes.";

export function isKidsProduct(text = "") {
  return /(จักรยานเด็ก|รถเด็ก|ของใช้เด็ก|ของเล่นเด็ก|คาร์ซีท|รถเข็นเด็ก|กระเป๋านักเรียน|เสื้อผ้าเด็ก|ชุดเด็ก|ของเล่น|เด็ก|kids|kid|toddler|baby|children)/i.test(String(text || ""));
}

function isExplicitAdultPresenterSelection(settings = {}) {
  return settings?.presenter === "woman" || settings?.presenter === "man";
}

function shouldUseKidsScene(productText, auto, settings = {}) {
  if (isExplicitAdultPresenterSelection(settings)) return false;
  return isKidsProduct(productText) || ["child", "older_child", "baby", "toddler"].includes(auto.presenter);
}

function getDefaultAutoPresenterProfile(text = "", presenter = "") {
  const hasAgeTarget = /(เด็ก|ทารก|วัยรุ่น|นักเรียน|นักศึกษา|วัยกลางคน|ผู้สูงอายุ|สูงวัย|วัยเกษียณ|คนแก่|อายุ\s*\d+|baby|toddler|child|children|teen|student|middle.?aged|senior|elderly|retiree|age\s*\d+)/i.test(String(text || ""));
  if (hasAgeTarget || !["woman", "man"].includes(presenter)) return "";

  const appearance = presenter === "man"
    ? "handsome, naturally attractive, well-groomed, and confident"
    : "beautiful, naturally attractive, well-groomed, and confident";
  return `AUTO PRESENTER PROFILE: Use a fictional Thai ${presenter} around 22-35 years old with a young working-age appearance: ${appearance}, realistic, approachable, and suitable for a modern commercial product review.`;
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
  if (/(เด็ก|ทารก|ของเล่น|\\bbaby\\b|\\bkid\\b|\\bchildren\\b|\\btoy\\b|\\binfant\\b|\\btoddler\\b)/i.test(text)) {
    return "tiny hearts 💖, small star doodles ⭐, and cute sparkles ✨";
  }

  // Pet
  if (/(สัตว์เลี้ยง|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|แมว|สุนัข|\\bpet\\b|\\bdog\\b|\\bcat\\b|\\banimal\\b)/i.test(text)) {
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
const MUSIC_ONLY_AUDIO_DIRECTION = "AUDIO MODE — INSTRUMENTAL MUSIC ONLY: Use only clean instrumental background music matched to the product mood and pacing. Do not generate any spoken narration, voiceover, dialogue, presenter speech, singing, lip-sync, or other vocal audio. The soundtrack must contain music only.";

/**
 * @description คืนค่า default settings สำหรับการสร้าง prompt
 * @returns {object} ค่าเริ่มต้นทั้งหมด
 */
export function getDefaultSettings() {
  return {
    videoStyle: "sales",
    presenter: "Auto",
    customPresenter: "",
    audioMode: "voiceover",
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

function sanitizePolicySensitiveText(value) {
  return sanitizeText(value)
    .replace(/\b(?:looks?\s+like|lookalike|resembling|same\s+face\s+as|face\s+of|body\s+of|voice\s+of|in\s+the\s+style\s+of|celebrity\s+style)\b[^.,;]*/gi, "a fictional adult commercial model")
    .replace(/(?:หน้าเหมือน|หน้าคล้าย|รูปร่างเหมือน|เสียงเหมือน|เหมือนดารา|เหมือนเซเลบ|เหมือนอินฟลู|สไตล์ดารา|สไตล์เซเลบ)\s*[^,.;\n]{0,80}/gi, "นางแบบ/นายแบบสมมติ")
    .trim();
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
    let manual = stripForbiddenVideoWords(String(settings.clipText).trim());
    if (!manual) return "";
    if (manual.length > 20) manual = manual.slice(0, 18).trim() + "..";
    return manual;
  }

  let phrase = "";

  // 2. AI-generated overlayText — specifically designed for on-screen use (≤5 Thai words)
  if (productInfo?.overlayText && String(productInfo.overlayText).trim()) {
    phrase = stripForbiddenVideoWords(String(productInfo.overlayText).trim());
  }
  // 3. First highlight segment as fallback
  else if (productInfo?.highlights) {
    const parts = Array.isArray(productInfo.highlights)
      ? productInfo.highlights
      : String(productInfo.highlights).split(/[,\n;]/);
    phrase = stripForbiddenVideoWords(String(parts[0] || "").trim());
  }
  // 4. hooks[0] truncated — for products analyzed before overlayText was added
  else if (productInfo?.hooks && productInfo.hooks.length > 0) {
    const h = String(productInfo.hooks[0]).trim();
    // take first 3 space-separated tokens at most (Thai hooks have no spaces usually, so this is a safety net)
    phrase = stripForbiddenVideoWords(h.split(/\s+/).slice(0, 3).join(" "));
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

function stripForbiddenVideoWords(value) {
  return String(value || "").replace(/ว้าว/gi, "").replace(/\s+/g, " ").trim();
}

function buildProductIdentityLock(productInfo = {}) {
  const productName = compactPromptText(
    sanitizePolicySensitiveText(
      getVisualProductName(productInfo)
    ),
    180
  );
  if (!productName) return "";
  const stableProductName = stripStructuralVariantCounts(productName);

  return `PRODUCT NAME / CATEGORY LOCK: The requested product is "${stableProductName}". Use this explicit product name to determine what the item is. The attached product reference remains authoritative for its exact visual design. Never substitute a different product type; if the name says shirt/top, generate a shirt/top, never underwear, lingerie, panties, briefs, or another unrelated garment. This instruction is semantic context only and must not appear as visible text.`;
}

function getVisualProductName(productInfo = {}) {
  return productInfo.originalName ||
    productInfo.productLinkTitle ||
    productInfo.rawProduct?.title ||
    productInfo.rawProduct?.product_name ||
    productInfo.rawProduct?.name ||
    productInfo.name ||
    productInfo.caption ||
    "";
}



export function buildImagePrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const visualProductName = getVisualProductName(productInfo);
  const productName = generationProductName(visualProductName, productInfo.category) || "the attached product";
  const details = compactPromptText(sanitizePolicySensitiveText(productInfo.highlights || ""), 100).replace(/[^\x00-\x7F]/g, "").trim();
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const productText = `${visualProductName} ${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  if (auto.videoStyle === "fashion-selfie") {
    return buildFashionSelfieImagePrompt(productInfo, productName, settings);
  }
  const isCoffeeImageAd = isCoffeeProduct(productText) || isPackagedCoffeeProduct(productText) || isCoffeePowderProduct(productText) || isCoffeeBeanProduct(productText);
  const isClothing = isClothingProduct(productText);
  // In Combined mode this still becomes the source frame for video. Keep
  // clothing reference designs untouched before the video presenter is added.
  const explicitChildPresenter = ["child", "older_child"].includes(settings?.presenter);
  const stillMotionMode = settings?.videoStyle === "still-motion";
  const boxedMotionMode = settings?.videoStyle === "boxed-motion";
  const productOnlyStill = stillMotionMode || boxedMotionMode || (settings?.flowGenMode === "combined" && (!explicitChildPresenter || isClothing));
  const autoPresenterProfile = !productOnlyStill && isAuto(settings.presenter)
    ? getDefaultAutoPresenterProfile(`${productText} ${productInfo.targetGroup || ""}`, auto.presenter)
    : "";
  const isChildPresenter = ["baby", "toddler", "child", "older_child"].includes(auto.presenter);
  const isFootwear = isFootwearProduct(productInfo);
  const vehicleAccessoryContext = getVehicleAccessoryContext(productText);
  const isHeavy = isHeavyProduct(productText);
  const specificScale = getProductSpecificScaleInstruction(productText);

  const isUnboxingHands = auto.presenter === "unboxing_hands";
  const handsOnly = !productOnlyStill && (auto.presenter === "hands_only" || isUnboxingHands);
  const wearableCrop = !productOnlyStill && auto.presenter === "wearable_crop";
  const noPeople = productOnlyStill || !(auto.presenter && auto.presenter !== "none");
  const referenceCompositingDirection = isClothing
    ? (productOnlyStill ? REFERENCE_COMPOSITING_DIRECTION : APPAREL_REFERENCE_USE_DIRECTION)
    : noPeople
      ? REFERENCE_COMPOSITING_DIRECTION
      : "BACKGROUND-ONLY EDIT WITH NATURAL PRESENTER COMPOSITING: Keep the reference product unchanged. Replace its source background and add the selected fictional presenter in a physically natural pose without altering the product.";

  const isAnimal = auto.presenter === "dog" || auto.presenter === "cat";
  const explicitlySelectedAnimal = settings?.presenter === "dog" || settings?.presenter === "cat";

  const isSingleMode = true; // FORCE SINGLE MODE ALWAYS: Prevents "4-panel grid" hallucination (ไม่ต้องตอนภาพ/แบ่งภาพ)

  const intro = `Create one authentic full-frame smartphone photograph in a vertical 9:16 layout. Show ${productName} clearly at realistic scale, matching the reference. Use natural everyday lighting without artificial studio gloss or CGI styling.`;

  const isKids = shouldUseKidsScene(productText, auto, settings);

  let peopleDirection = "";
  if (productOnlyStill) {
    peopleDirection = NO_PEOPLE_DIRECTION;
  } else if (handsOnly) {
    const stillHandCount = isUnboxingHands ? `\n${HANDS_ONLY_STILL_COUNT_LOCK}` : "";
    peopleDirection = `${isUnboxingHands ? `${UNBOXING_HANDS_DIRECTION}\n${UNBOXING_REVEAL_SEQUENCE}` : HANDS_DIRECTION}\n${HANDS_ONLY_FACE_EXCLUSION}${stillHandCount}`;
  } else if (isAnimal) {
    peopleDirection = `Pet Animal: A cute, friendly pet animal (${auto.presenter === "cat" ? "cat" : "dog"}) sitting next to or interacting naturally with the product in a bright, clean indoor setting. ${ANIMAL_PRESENTER_DIRECTION} ${SINGLE_PRESENTER_HAND_ANATOMY_DIRECTION}`;
  } else if (wearableCrop) {
    peopleDirection = `${WEARABLE_CROP_MODE_DIRECTION} Frame: ${getWearableCropFrame(productText)}.`;
  } else if (isKids && auto.presenter !== "none") {
    peopleDirection = `${KIDS_WITH_PARENT_DIRECTION} ${MULTI_PERSON_HAND_ANATOMY_DIRECTION}`;
  } else if (auto.presenter && auto.presenter !== "none") {
    const presenterInstruction = isClothing && !isChildPresenter
      ? `A fictional adult Thai ${auto.presenter === "man" ? "man" : "woman"} commercial fit model`
      : auto.presenter === "กรอกเอง"
        ? (auto.customPresenter || "a fictional adult Thai presenter")
        : (PRESENTERS[auto.presenter] || PRESENTERS.none);
    const apparelDirection = isChildPresenter && isClothing
      ? getChildApparelWearDirection(productText)
      : getPresenterOutfitDirection(productText, auto.presenter);
    peopleDirection = `Presenter: ${presenterInstruction}. ${apparelDirection} ${SINGLE_PRESENTER_HAND_ANATOMY_DIRECTION} Product Focus: Keep the product as the primary hero focal point in the center of the frame in true scale.`;
  } else {
    peopleDirection = NO_PEOPLE_DIRECTION;
  }

  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true");

  // If user typed a specific phrase → pass it; otherwise let Flow decide freely
  const userPhrase = settings?.clipText
    ? stripForbiddenVideoWords(sanitizeText(String(settings.clipText).trim()))
    : "";

  const productTextFidelityDirection = textEnabled
    ? "STRICT PRODUCT FIDELITY: Any text, labels, brand names, logos, or writing printed ON the product surface and packaging itself must match the reference image exactly. Do NOT alter, translate, add, or remove any text on the product surface. Do NOT write or overlay any of the new promotional text onto the product or its packaging directly."
    : "STRICT PRODUCT FIDELITY: Any text, labels, brand names, logos, or writing printed ON the product surface and packaging itself must match the reference image exactly. Do NOT alter, translate, add, or remove any text on the product surface. Do NOT add any extra text or promotional overlays on the product.";

  const doodles = resolveDoodleStyle(productInfo);

  const textStyleStr = TEXT_FONT_STYLES[settings?.textStyleFont] || TEXT_FONT_STYLES.handwriting;

  const textDirection = textEnabled
    ? userPhrase
      ? `Visible text overlay is enabled. Place ONLY this single short Thai phrase neatly onto the image: "${userPhrase}". Render the Thai script with perfect spelling, ensuring every consonant, vowel, and tone mark (such as ไม้เอก, ไม้โท, etc.) is in the correct vertical stack and perfectly placed. Style it as ${textStyleStr}. Include 1–2 small doodles nearby (${doodles}). Do NOT add any other text, product name, price, CTA, or promotion text. Do not block important parts of the product. Position overlay at ${settings?.textPosition || "Middle"}. STRICTLY FORBIDDEN: no English text, romanized Thai, or gibberish.`
      : `Visible text overlay is enabled. Creatively add ONE short cute Thai phrase (1–5 words, naturally matching this product) as a ${textStyleStr} overlay. The chosen Thai phrase must have flawless Thai spelling and grammar, with correct vowels and tone marks properly stacked. Include 1–2 small doodles nearby (${doodles}). Do NOT add product name, price, CTA, or promotion text. Do not block important parts of the product. Position overlay at ${settings?.textPosition || "Middle"}. Text must be natural Thai — no English, no gibberish.`
    : `${isCoffeeImageAd ? COFFEE_COMPACT_TEXT_LOCK : TEXT_FREE_DIRECTION}\nFinal check: ensure no added text or numbers exist in the output.`;

  const sceneStyle = (noPeople || handsOnly) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle) && !isUnboxingHands
    ? "review"
    : auto.videoStyle;

  const styleObj = VIDEO_STYLES.find(s => s.id === sceneStyle);
  let styleFragment = styleObj ? styleObj.fragment : "";

  if (!textEnabled) {
    // Remove text-generating language from style presets so it cannot conflict
    // with the explicit no-text rule below.
    styleFragment = styleFragment
      .replace(/\b(?:feature callout|text hook|bold promotion text|promotion text|text labels?|text overlays?|countdown timer graphic|graphic)\b[^,.;]*/gi, "")
      .replace(/,\s*,/g, ",")
      .replace(/^\s*,|,\s*$/g, "")
      .trim();
  }

  if (noPeople) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character|hands?)\b[^.;]*[.;]?/gi, "")
      .replace(/\b(?:hands?|people|presenters?|reviewers?|characters?)\b/gi, "");
  } else if (handsOnly) {
    styleFragment = styleFragment
      .replace(/\b(?:a|an)\s+(?:trendy|stylish|young|adult|Thai|natural|professional|friendly|casual|cute|3D|stylized|\s)*(?:woman|man|person|presenter|reviewer|character)\b[^.;]*[.;]?/gi, "hands ")
      .replace(/\b(?:people|presenters?|reviewers?|characters?)\b/gi, "hands");
  } else if (wearableCrop) {
    styleFragment = styleFragment
      .replace(/\btalking\s+head\b/gi, "wearable close-up")
      .replace(/\bfull[- ]body\b/gi, "cropped body-part")
      .replace(/\b(?:presenter|reviewer|model)\b/gi, "wearable close-up");
  }

  let shotDistribution = isSingleMode
    ? (isClothing
        ? "Single full-frame front shot: Depict ONLY the front-facing view of the clothing item in one single, high-resolution full-frame photograph centered in a 9:16 vertical layout. Highlight fabric texture, front logo, and front details. STRICT RULE: Show ONLY the front view of the garment; do NOT show the back view or reverse side."
        : "Single full-frame hero shot: Depict the product in one single, high-resolution full-frame photograph centered in a 9:16 vertical layout. Maintain 100% exact product fidelity, printed text, brand logo, and packaging artwork.")
    : (isClothing
        ? "Multi-angle 4-panel grid collage layout: A 4-panel split layout showing the clothing item from 4 clean front-facing perspectives (Panel 1: Full outfit view, Panel 2: Upper body close-up of collar/logo, Panel 3: Fabric texture detail, Panel 4: Lifestyle presentation). Maintain 100% identical garment cut, color, logo, and texture across all panels."
        : "Multi-angle 4-panel grid collage layout: A 4-panel split layout showing the product from 4 distinct angles (Panel 1: Front view hero shot, Panel 2: Side/3-quarter angle view, Panel 3: Macro close-up of texture/logo, Panel 4: Realistic lifestyle context). Maintain 100% identical product appearance, packaging artwork, colors, and printed text across all 4 panels.");

  let scaleInstruction = "";
  if (wearableCrop) {
    scaleInstruction = `Realistic wearable scale: Keep the exact item naturally proportioned to the relevant body part. Frame ${getWearableCropFrame(productText)}. Do not enlarge, shrink, or distort the wearable product.`;
  } else if (isClothing) {
    scaleInstruction = APPAREL_SCALE_DIRECTION;
  } else if (handsOnly) {
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
  if (boxedMotionMode) {
    return buildBoxedReferenceStillPrompt(productInfo, productText, productName, locationSetting, textEnabled);
  }
  if (isCoffeeImageAd && productOnlyStill) {
    return buildCoffeeReferenceFirstStillPrompt(productText, productName, locationSetting, textEnabled);
  }
  const imageBackgroundDirection = isClothing
    ? `APPAREL BACKGROUND: Show the exact reference garment naturally in a brand new, realistic ${locationSetting} setting with clean everyday lighting. Keep the garment as the clear focal point.`
    : handsOnly
    ? `${HANDS_ONLY_BACKGROUND_DIRECTION} Place the product in this category-appropriate setting: ${locationSetting}. Do not replace it with a generic cafe, desk, studio, or outdoor background unless that setting is appropriate for the exact product.`
    : `NEW REALISTIC BACKGROUND SCENE & NATURAL ATMOSPHERE: Place the unchanged product in a brand new, realistic ${locationSetting} scene suited to this product category. Use natural smartphone lighting, believable depth of field, and authentic textures; avoid CGI gloss and fake HDR.`;
  const stillBackgroundDirection = isFootwear
    ? `${FOOTWEAR_STILL_OUTDOOR_BACKGROUND_LOCK}\n${imageBackgroundDirection}`
    : imageBackgroundDirection;

  const hasEngravedPattern = /(ฉลัก|สลัก|นูน|แกะสลัก|ลายนูน|ลายฉลัก|ลายแกะ|engraved|embossed|debossed|etched|carved|relief|laser.?engraved|laser.?carved)/i.test(productText);

  const promptParts = [
    !textEnabled ? (isCoffeeImageAd ? COFFEE_COMPACT_TEXT_LOCK : TEXT_FREE_DIRECTION) : "",
    buildProductIdentityLock(productInfo),
    isExplicitAdultPresenterSelection(settings) ? EXPLICIT_ADULT_PRESENTER_NO_CHILD_DIRECTION : "",
    isClothing ? APPAREL_REFERENCE_PRIORITY : REFERENCE_IMAGE_HIGHEST_PRIORITY,
    REFERENCE_PIXEL_ARTWORK_LOCK,
    // Keep the uploaded product's own colors unchanged; only the background may change.
    COLOR_EXACT_LOCK,
    REFERENCE_BRAND_ONLY_LOCK,
    isNeckScarfProduct(productText) ? NECK_SCARF_USAGE_LOCK : "",
    isPackagedCoffeeProduct(productText) ? REFERENCE_VARIANT_DISAMBIGUATION_DIRECTION : "",
    isClothing ? referenceCompositingDirection : "",
    isRainwearProduct(productText) ? RAINWEAR_OUTDOOR_LOCATION_LOCK : "",
    FICTIONAL_CAST_DIRECTION,
    isClothing && !productOnlyStill && ["woman", "man"].includes(auto.presenter) ? INDEPENDENT_FICTIONAL_CAST_DIRECTION : "",
    isClothing && !productOnlyStill && !isChildPresenter ? APPAREL_FICTIONAL_MODEL_DIRECTION : "",
    BACKGROUND_COMPATIBILITY_LOCK,
    REALISTIC_SCENE_SCALE_DIRECTION,
    vehicleAccessoryContext ? VEHICLE_ACCESSORY_CONTEXT_DIRECTION : "",
    auto.presenter && auto.presenter !== "none" && !wearableCrop ? THAI_HUMAN_CAST_DIRECTION : "",
    autoPresenterProfile,
    intro,
    hasEngravedPattern ? ENGRAVED_EMBOSSED_FIDELITY_DIRECTION : "",
    isClothing ? APPAREL_VISIBILITY_DIRECTION : FULL_PRODUCT_VISIBILITY_DIRECTION,
    scaleInstruction,
    shotDistribution,
    specificScale,
    categoryDirection,
    isCoffeeImageAd ? COFFEE_REFERENCE_VARIANT_LOCK : "",
    analysisDirection,
    isFarmPoultryProduct(productText) ? FARM_POULTRY_FEED_EXCLUSION_RULE : "",
    explicitlySelectedAnimal ? "" : NO_UNREQUESTED_ANIMALS_DIRECTION,
    explicitlySelectedAnimal ? "" : IMAGE_AUTO_ANIMAL_EXCLUSION,
    isSunProtectionProduct(productText) ? SUNSCREEN_FIDELITY_DIRECTION : "",
    isHeadwearProduct(productText) ? HEADWEAR_NEVER_REMOVE_MANDATE : "",
    isFullFaceCoveringProduct(productText) ? FULL_FACE_COVERAGE_LOCK : "",
    stillBackgroundDirection,
    STILL_VIDEO_SOURCE_HERO_LOCK,
    `Centered, true scale, sharp and clearly visible, uncluttered.${details ? ` Visually emphasize (do NOT write as text): ${details}.` : ""}`,
    getStillProductUseDirection(productText),
    peopleDirection,
    productTextFidelityDirection,
    STILL_TEXT_INTEGRITY_DIRECTION,
    STRICT_SHOP_LOGO_EXCLUSION_RULE,
    textDirection
  ];

  return promptParts.filter(Boolean).join("\n");
}

function getProductWeightCategory(text = "") {
  const clean = text.toLowerCase();
  if (isCampingChairProduct(clean) || isHammockProduct(clean)) {
    return "portable_large";
  }
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

function isOutdoorRideProduct(text = "") {
  return /(จักรยาน|รถสามล้อ|สกู๊ตเตอร์|สกูตเตอร์|สเก็ตบอร์ด|โรลเลอร์เบลด|รถเด็กถีบ|balance\s*bike|bicycle|bike|tricycle|scooter|skateboard|rollerblade|ride-?on)/i.test(String(text || "").toLowerCase());
}

function isHammockProduct(text = "") {
  return /(เปลญวน|เปลแขวน|เปลผ้า(?:แคมป์|แขวน)|เปลนอน(?:แคมป์|เดินป่า)|\bhammock\b|camp(?:ing)?\s+hammock)/i.test(String(text || "").toLowerCase());
}

function isCampingChairProduct(text = "") {
  return /(เก้าอี้(?:พับ)?(?:แคมป์|แคมป์ปิ้ง|สนาม)|เก้าอี้แคมป์|camp(?:ing)?\s+chair|folding\s+(?:camp|outdoor)\s+chair)/i.test(String(text || "").toLowerCase());
}

function isCampingOutdoorProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  return isHammockProduct(clean)
    || isCampingChairProduct(clean)
    || /(แคมป์|แคมปิ้ง|อุปกรณ์แคมป์|อุปกรณ์แคมปิ้ง|เดินป่า|เต็นท์|ถุงนอน|\bcamping\b|\bhiking\b|\btent\b|sleeping\s+bag)/i.test(clean);
}

function isWearableProduct(text = "") {
  const clean = String(text || "").toLowerCase();
  return isClothingProduct(clean)
    || /(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(clean)
    || /(ถุงมือ|กำไล|สร้อยข้อมือ|สร้อย|แหวน|ถุงเท้า|glove|bracelet|wrist|necklace|ring|jewelry|socks?)/i.test(clean)
    || isHeadwearProduct(clean)
    || isFullFaceCoveringProduct(clean);
}

function getWearableCropFrame(text = "") {
  const clean = String(text || "").toLowerCase();
  if (/(กางเกง|กระโปรง|เลกกิ้ง|ยีนส์|ขาสั้น|ขาสามส่วน|pants|trousers|shorts|leggings|jeans|skirt|bottoms?)/i.test(clean)) {
    return "waist-to-ankles lower-body crop, showing the exact pants or skirt and natural leg movement";
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks?)/i.test(clean)) {
    return "feet-and-lower-legs crop, showing the exact footwear or socks on natural feet";
  }
  if (/(สร้อยข้อมือ|กำไล|แหวน|ถุงมือ|bracelet|wrist|ring|glove)/i.test(clean)) {
    return "wrist-and-hand or forearm crop, showing the exact accessory naturally worn";
  }
  if (/(สร้อยคอ|สร้อย|necklace)/i.test(clean)) {
    return "neck-and-upper-chest crop, showing the exact necklace naturally worn";
  }
  if (isHeadwearProduct(clean) || isFullFaceCoveringProduct(clean)) {
    return "head-and-shoulders crop from below the eyes or below the face, showing the exact worn item without showing the full face";
  }
  return "relevant body-part close-up showing the exact wearable product naturally worn";
}

function getNaturalProductInteractionDirection(text = "") {
  if (isHammockProduct(text)) {
    return "NATURAL HAMMOCK USE: Show the hammock already installed between two sturdy trees or on a proper hammock stand using its real end ropes or straps. A reviewer may sit or recline in it naturally. Do not hold, hand-stretch, carry, or display the hammock loose in the air.";
  }
  if (isCampingChairProduct(text)) {
    return "NATURAL CAMPING CHAIR USE: Show the chair fully opened and resting securely on level campsite ground. The reviewer may sit in it normally or stand beside it. Do not hold or lift the opened chair during the review.";
  }
  return NATURAL_PRODUCT_INTERACTION_DIRECTION;
}

function getStillProductUseDirection(text = "") {
  if (isHammockProduct(text)) {
    return "Natural still composition: Install the hammock between two sturdy trees or on a proper hammock stand using its visible end ropes or straps. Show the reviewer sitting or reclining naturally; never show the loose hammock held or stretched by hand.";
  }
  if (isCampingChairProduct(text)) {
    return "Natural still composition: Place the fully opened camping chair securely on level campsite ground. Show the reviewer seated normally or standing beside it; never show the opened chair held in the air.";
  }
  return "";
}

function buildCoffeeReferenceFirstStillPrompt(productText, productName, locationSetting, textEnabled = false) {
  const formDirection = isCoffeePowderProduct(productText)
    ? "Keep the exact sealed pouch form shown in the reference; if contents are visible, they are ground coffee powder only, never whole beans."
    : isCoffeeBeanProduct(productText)
      ? "Keep the exact sealed pouch form shown in the reference; if contents are visible, they are whole roasted beans only, never powder."
      : "Keep the exact sealed pouch form shown in the reference.";
  const textRule = textEnabled
    ? "If an overlay is enabled, place it only in empty background space; never cover or rewrite the pouch label."
    : "No added captions, slogans, logos, watermarks, or text overlays.";
  const sizeDirection = getProductSpecificScaleInstruction(productText)
    || "STRICT PRODUCT SCALE: This is a small hand-sized coffee pouch, about 15-20cm tall. Keep the table and surrounding background visibly larger than the pouch; never let the pouch fill the table or frame.";

  return [
    `Create one vertical 9:16 product still for ${productName}.`,
    "REFERENCE-FIRST MODE: The uploaded image is the only visual source of truth. Keep the actual coffee pouch from that image unchanged; do not redraw or reconstruct it from the product name, category, memory, or generic coffee knowledge.",
    "Preserve the exact pouch silhouette, seams, zipper, material, label artwork, Thai/English lettering, logo, illustrations, colors, layout, and printed details. If any detail is unclear, keep the visible reference detail rather than guessing.",
    "Do not replace the pouch with a similar package, alternate design, clean generic label, new wording, or another brand. Show exactly one pouch, fully closed, upright, and physically realistic.",
    formDirection,
    sizeDirection,
    "HERO COMPOSITION DOES NOT MEAN OVERSIZED: Make the pouch visually important through sharp focus, clean contrast, and placement—not by enlarging it. Preserve true physical scale with visible table space and background around it.",
    `Change only the surrounding background to a clean ${locationSetting} setting. Use a natural eye-level product photograph with a medium-close composition: show only a small amount of the supporting table surface, keep the floor mostly out of frame, and use soft background blur with realistic depth of field. Keep the pouch sharp, front-facing, centered, and clearly readable at true scale; do not use a macro close-up, wide empty floor, or oversized empty tabletop, and do not make the pouch fill the table or frame. Do not add unrelated props or people.`,
    textRule,
    "Single full-frame image only; no collage, split screen, duplicate product, redesign, color shift, or label modification."
  ].join("\n");
}

function buildBoxedReferenceStillPrompt(productInfo, productText, productName, locationSetting, textEnabled = false) {
  const sizeDirection = getProductSpecificScaleInstruction(productText)
    || "REALISTIC PRODUCT SCALE: Keep the exact product at its true physical size. Use a fitted open presentation box; never shrink or enlarge the product to fit the box.";
  const overlayDirection = textEnabled
    ? "Optional single Thai text overlay only in empty background space; never cover the product, its printed details, or the box interior."
    : TEXT_FREE_DIRECTION;

  return [
    `Create one vertical 9:16 product still for ${productName}.`,
    "BOXED PRODUCT REFERENCE MODE: Use the uploaded product image as the sole source of truth for the product. Place that exact product inside a clean, open presentation box that fits its real physical size.",
    buildProductIdentityLock(productInfo),
    REFERENCE_PIXEL_ARTWORK_LOCK,
    PRODUCT_FIDELITY_DIRECTION,
    "Preserve the product's exact shape, materials, colors, pattern, logo, printed artwork, label, text, seams, and every visible detail. Do not redesign, redraw, recolor, simplify, mirror, or invent anything on the product.",
    "The box is the only newly added object: an open lid or open presentation box with a clean neutral interior and a realistic fitted insert/support if needed. Add no branding or text to the box. Keep the product fully visible and never let the box cover important details.",
    sizeDirection,
    `Use a realistic ${locationSetting || "category-appropriate"} setting. Natural eye-level product photography, soft depth of field, limited table context, floor mostly out of frame, true scale, no oversized product and no giant box.`,
    "No presenter, hands, people, extra products, duplicate objects, busy props, collage, split screen, or product handling.",
    overlayDirection,
    "Single full-frame still image only. The product and box must be physically coherent, stable, and naturally placed.",
  ].filter(Boolean).join("\n");
}

function isSmallTechAccessoryProduct(text = "") {
  return /(เมาส์|เม้าส์|คีย์บอร์ด|แป้นพิมพ์|หูฟัง|เอียร์บัด|สายชาร์จ|หัวชาร์จ|แท่นชาร์จ|พาวเวอร์แบงค์|แผ่นรองเมาส์|อุปกรณ์ไอที|อุปกรณ์คอม|mouse|keyboard|keycap|headset|headphone|earphone|earbud|earbuds|charger|charging\s*(?:cable|brick|adapter|dock|stand)|cable|powerbank|power\s*bank|mousepad|mouse\s*pad|computer\s*accessory|desk\s*accessory|tech\s*accessory)/i.test(String(text || "").toLowerCase());
}

function getVehicleAccessoryContext(text = "") {
  const clean = String(text || "").toLowerCase();
  if (/(มอเตอร์ไซค์|มอเตอร์ไซด์|มอไซค์|motorcycle|motorbike|กล่องท้าย|กล่องมอเตอร์ไซค์|กล่องสัมภาระมอเตอร์ไซค์|top\s*box|tail\s*box|pannier|saddlebag|หมวกกันน็อค|หมวกกันน็อก|หมวกมอเตอร์ไซค์|motorcycle\s*helmet)/i.test(clean)) {
    return "motorcycle";
  }
  if (/(รถยนต์|รถเก๋ง|รถกระบะ|รถยนต์นั่ง|car|auto|automotive|vehicle|car\s*accessory|car\s*phone\s*holder|car\s*mount|dashboard\s*mount|อุปกรณ์รถยนต์|ที่วางโทรศัพท์ในรถ|ที่ยึดโทรศัพท์ในรถ)/i.test(clean)) {
    return "car";
  }
  return "";
}

function getProductSpecificScaleInstruction(text = "") {
  const clean = text.toLowerCase();

  if (isSmallTechAccessoryProduct(clean)) {
    return SMALL_TECH_ACCESSORY_SCALE_DIRECTION;
  }

  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(clean)) {
    return SHOE_SCALE_DIRECTION;
  }
  
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
  // Keep fallback hooks category-neutral. The model has the reference and
  // verified facts; generic guidance avoids inventing an unrelated use case.
  return [
    "เจอปัญหานี้อยู่ไหม",
    "ลองดูตัวช่วยที่อาจทำให้เรื่องนี้ง่ายขึ้น",
    "ใครกำลังมองหาวิธีที่สะดวกขึ้น ลองดูจุดนี้",
    "จุดนี้อาจช่วยให้ใช้งานง่ายขึ้น",
    "ลองดูรายละเอียดนี้ก่อนตัดสินใจ",
    "มีวิธีที่เหมาะกับการใช้งานแบบนี้ไหม ลองดู"
  ];
}

export function resolveSpokenOpeningHook(productInfo = {}, random = Math.random) {
  const productNames = [
    productInfo.name,
    productInfo.originalName,
    productInfo.productLinkTitle
  ]
    .map(value => sanitizeText(value).toLowerCase())
    .filter(value => value.length >= 3);

  const cleanHook = (value) => {
    const phrase = stripForbiddenVideoWords(sanitizeText(value))
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "")
      .replace(/^[\s"'“”‘’.,!?-]+|[\s"'“”‘’]+$/g, "")
      .trim();
    if (!phrase || /(ของอันนี้|ชิ้นนี้แนะนำเลย|สวัสดี|หวัดดี|\bhello\b|\bhi\b)/i.test(phrase)) return "";
    const lowerPhrase = phrase.toLowerCase();
    if (productNames.some(name => lowerPhrase.includes(name))) return "";
    return phrase;
  };

  const analyzedHooks = (Array.isArray(productInfo.hooks) ? productInfo.hooks : [])
    .map(cleanHook)
    .filter(Boolean);
  const fallbackHooks = [
    ...resolveProductHook(productInfo),
    "ลองดูจุดนี้ก่อนตัดสินใจ",
    "ใช้จริงแล้วสะดวกกว่าที่คิด",
    "จุดนี้หลายคนมองข้าม",
    "ใครกำลังเจอปัญหานี้อยู่บ้าง",
    "เห็นเรียบๆ แต่ใช้งานดีมาก"
  ].map(cleanHook).filter(Boolean);
  const pool = [...new Set(analyzedHooks.length ? analyzedHooks : fallbackHooks)];
  if (pool.length === 0) return "ลองดูจุดนี้ก่อนตัดสินใจ";

  const randomValue = Number(typeof random === "function" ? random() : 0);
  const boundedValue = Number.isFinite(randomValue) ? Math.max(0, Math.min(randomValue, 0.999999)) : 0;
  return pool[Math.floor(boundedValue * pool.length)];
}

function buildSpeechProductContext(productInfo = {}, productName = "the attached product") {
  const sourceName = sanitizePolicySensitiveText(
    getVisualProductName(productInfo)
  );
  const highlights = Array.isArray(productInfo.highlights)
    ? productInfo.highlights
    : String(productInfo.highlights || "").split(/[,;\n]/);
  const verifiedFacts = highlights
    .map(value => compactPromptText(sanitizePolicySensitiveText(value), 80))
    .filter(Boolean)
    .slice(0, 4);
  const factText = verifiedFacts.length
    ? verifiedFacts.join(" | ")
    : "only details visibly verified from the attached product reference";

  return "PRODUCT-SPECIFIC SPEECH CONTEXT: Treat this as " +
    productName +
    ". Internal product title for factual grounding: \"" +
    (compactPromptText(sourceName, 180) || productName) +
    "\". Verified product facts: [" +
    factText +
    "]. Use this as flexible context, not a fixed script. Choose a natural problem, use case, detail, or benefit only when it genuinely fits this product. Do not force every fact, invent claims, or describe another product category.";
}

function buildStillMotionVideoPrompt(productInfo, productName, locationStr, durationSeconds, textEnabled, overlayText, specificScale) {
  const overlayDirection = textEnabled && overlayText.length
    ? `Optional single Thai text overlay only: "${overlayText[0]}". Keep it in empty background space and never place it on the product label or surface.`
    : TEXT_FREE_DIRECTION;
  const scaleDirection = specificScale || "REALISTIC PRODUCT SCALE: Keep the product at its true physical size relative to the table, floor, hands, and surrounding environment. Do not enlarge it just because it is the hero.";

  return [
    `สร้างวิดีโอแนวตั้ง 9:16 ความยาว ${durationSeconds} วินาทีจากภาพสินค้า ${productName}`,
    "STILL-IMAGE MOTION MODE: Use the attached/generated still image as the source frame. The product stays completely still, rigid, and unchanged throughout the entire video. This is a simple product-shot animation, not a review or sales presentation.",
    buildProductIdentityLock(productInfo),
    REFERENCE_PIXEL_ARTWORK_LOCK,
    PRODUCT_FIDELITY_DIRECTION,
    scaleDirection,
    `Place the product naturally in a realistic ${locationStr || "category-appropriate"} setting. Keep natural photography composition, true scale, visible but limited context, and realistic contact shadows. Do not make the product oversized or let it fill the table or frame.`,
    "CAMERA MOTION ONLY — MODERATE VISIBLE MOVEMENT: Keep the product completely static while the handheld smartphone camera makes a clearly noticeable but realistic move. Over the clip, pan laterally from left to right by about 20–30 cm, gently push in or pull back by about 5–10%, then arc to a modest 15–20° three-quarter angle. Use natural parallax and light handheld sway; the camera must not feel locked off or static. Keep the movement smooth, continuous, controlled, and physically plausible.",
    "STRICTLY FORBIDDEN: Do not rotate, slide, bounce, float, bend, resize, morph, open, close, deform, or otherwise animate the product. Do not add a presenter, hands, dialogue, voiceover, product review, feature demonstration, extra product, duplicate object, or busy scene action.",
    overlayDirection,
    "Use one continuous shot or very gentle angle transition only. No fast cuts, no zoom punch, no 360-degree orbit, no dramatic effects, no collage, and no scene change that alters the product. Use quiet natural instrumental ambience or no audio."
  ].filter(Boolean).join("\n");
}

function buildBoxedMotionVideoPrompt(productInfo, productName, locationStr, durationSeconds, textEnabled, overlayText, specificScale) {
  const overlayDirection = textEnabled && overlayText.length
    ? `Optional single Thai text overlay only: "${overlayText[0]}". Keep it in empty background space and never place it on the product, printed label, or box. `
    : TEXT_FREE_DIRECTION;
  const scaleDirection = specificScale || "REALISTIC PRODUCT SCALE: Keep the exact product and fitted box at true physical size relative to the table and surrounding environment. Do not enlarge the product or box just because it is the hero.";

  return [
    `สร้างวิดีโอแนวตั้ง 9:16 ความยาว ${durationSeconds} วินาทีจากภาพสินค้า ${productName}`,
    "BOXED PRODUCT MOTION MODE: The exact product is already placed inside an open presentation box in the source still. Keep both the product and box stable and unchanged throughout the entire video. This is a simple product-shot animation, not an unboxing, review, or sales presentation.",
    buildProductIdentityLock(productInfo),
    REFERENCE_PIXEL_ARTWORK_LOCK,
    PRODUCT_FIDELITY_DIRECTION,
    scaleDirection,
    `Keep the fitted open box and product at true scale in a realistic ${locationStr || "category-appropriate"} setting. Keep only limited table context and almost no floor visible.`,
    "CAMERA MOTION ONLY — MODERATE VISIBLE MOVEMENT: Keep the product and box completely static while the handheld smartphone camera makes a clearly noticeable but realistic move. Over the clip, pan laterally from left to right by about 20–30 cm, gently push in or pull back by about 5–10%, then arc to a modest 15–20° three-quarter angle. Use natural parallax and light handheld sway; the camera must not feel locked off or static. Keep the movement smooth, continuous, controlled, and physically plausible.",
    "STRICTLY FORBIDDEN: Do not move, rotate, slide, bounce, float, resize, morph, open, close, deform, or otherwise animate the product or box. Do not add a presenter, hands, dialogue, voiceover, product review, feature demonstration, extra product, duplicate object, busy props, fast cuts, macro zoom, 360-degree orbit, or scene changes.",
    overlayDirection,
    "Use one continuous shot or one very gentle angle transition only. Use quiet natural instrumental ambience or no audio."
  ].filter(Boolean).join("\n");
}

export function buildVideoPrompt(productInfo, settings = {}) {
  const auto = resolveAutoSettings(productInfo, settings);
  const locationStr = resolvePromptLocation(auto);
  const durationSeconds = Number.parseInt(settings?.videoDuration, 10) || 8;
  const clipText = resolveClipText(productInfo, settings);
  const spokenOpeningHook = compactPromptText(resolveSpokenOpeningHook(productInfo), 30);
  const textEnabled = (settings?.textEnabled === true || settings?.textEnabled === "true");
  const visualProductName = getVisualProductName(productInfo);
  const productName = generationProductName(visualProductName, productInfo.category) || "the attached product";
  const analysisDirection = buildAnalysisDirection(productInfo);
  const categoryDirection = buildCategoryFidelityDirection(productInfo);
  const overlayText = [
    clipText,
    textEnabled ? compactPromptText(settings?.promotionText, 80) : ""
  ].filter(Boolean);
 
  const productText = `${visualProductName} ${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const autoPresenterProfile = isAuto(settings.presenter)
    ? getDefaultAutoPresenterProfile(`${productText} ${productInfo.targetGroup || ""}`, auto.presenter)
    : "";
  const vehicleAccessoryContext = getVehicleAccessoryContext(productText);
  const weightCategory = getProductWeightCategory(productText);
  const isHeavy = weightCategory !== "light";
  const isImmobile = weightCategory === "immobile";
  const isClothing = isClothingProduct(productText);
  const isWearable = isWearableProduct(productText);
  const specificScale = getProductSpecificScaleInstruction(productText);

  if (auto.videoStyle === "fashion-selfie") {
    return buildFashionSelfieVideoPrompt(productInfo, productName, locationStr, durationSeconds, settings);
  }

  if (auto.videoStyle === "boxed-motion") {
    return buildBoxedMotionVideoPrompt(productInfo, productName, locationStr, durationSeconds, textEnabled, overlayText, specificScale);
  }
  if (auto.videoStyle === "still-motion") {
    return buildStillMotionVideoPrompt(productInfo, productName, locationStr, durationSeconds, textEnabled, overlayText, specificScale);
  }

  const isUnboxingHands = auto.presenter === "unboxing_hands";
  const handsOnly = auto.presenter === "hands_only" || isUnboxingHands;
  const wearableCrop = auto.presenter === "wearable_crop";
  const noPeople = !(auto.presenter && auto.presenter !== "none");
  const isKids = shouldUseKidsScene(productText, auto, settings);
  const isChildPresenter = ["baby", "toddler", "child", "older_child"].includes(auto.presenter);
  const childApparelPrompt = isChildPresenter && isClothing;
  const isAnimal = auto.presenter === "dog" || auto.presenter === "cat";
  const explicitlySelectedAnimal = settings?.presenter === "dog" || settings?.presenter === "cat";
  const animalName = auto.presenter === "cat" ? "cute cat" : "cute dog";
  const firstSceneNoPeople = (settings?.firstSceneNoPeople === true || settings?.firstSceneNoPeople === "true");
  const sceneStyle = isUnboxingHands
    ? "unboxing"
    : (noPeople || handsOnly || wearableCrop) && ["testimonial", "lifestyle", "unboxing"].includes(auto.videoStyle)
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

  if (isClothing && styleFragment) {
    styleFragment = styleFragment.replace(/\btalking\s+head\b/gi, "stable full-body fashion review");
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
  if (wearableCrop) {
    scaleInstruction = `Realistic wearable scale: Keep the exact item naturally proportioned to the relevant body part. Frame ${getWearableCropFrame(productText)}. Do not enlarge, shrink, or distort the wearable product.`;
  } else if (isClothing) {
    scaleInstruction = APPAREL_SCALE_DIRECTION;
  } else if (handsOnly) {
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

  const PROGRESSIVE_AUDIO_NARRATION_MANDATE = "AUDIO GUIDANCE: Keep Thai narration short, natural, and non-repetitive. Prefer a concise opening line, then let the model add only brief narration when it genuinely clarifies the product. Do not force a fixed script or a line in every scene.";

  const promptParts = [
    `สร้างวิดีโอโฆษณารีวิวสินค้า ${productName} ความยาว ${durationSeconds} วินาที ในอัตราส่วนแนวตั้ง 9:16 (Create a ${durationSeconds}-second vertical 9:16 commercial product review video for ${productName}).`,
    buildProductIdentityLock(productInfo),
    !textEnabled ? TEXT_FREE_DIRECTION : "",
    NO_WOW_DIRECTION,
    isExplicitAdultPresenterSelection(settings) ? EXPLICIT_ADULT_PRESENTER_NO_CHILD_DIRECTION : "",
    isChildPresenter ? EXPLICIT_CHILD_PRESENTER_DIRECTION : "",
    isClothing ? REFERENCE_PIXEL_ARTWORK_LOCK : "",
    childApparelPrompt ? "" : LABEL_EXACT_COPY_MANDATE,
    COLOR_EXACT_LOCK,
    childApparelPrompt ? "" : NO_ADDED_PATTERNS_OR_GRAPHICS_RULE,
    childApparelPrompt ? "" : NO_HALLUCINATED_BRAND_LOGOS_RULE,
    REFERENCE_BRAND_ONLY_LOCK,
    FICTIONAL_CAST_DIRECTION,
    auto.presenter && auto.presenter !== "none" && !wearableCrop ? THAI_HUMAN_CAST_DIRECTION : "",
    autoPresenterProfile,
    isClothing && !wearableCrop && !isChildPresenter ? APPAREL_FICTIONAL_MODEL_DIRECTION : "",
    styleFragment ? `Visual style: ${styleFragment}.` : "",
    SPEECH_DIRECTION,
    auto.audioMode === "music_only" ? MUSIC_ONLY_AUDIO_DIRECTION : PROGRESSIVE_AUDIO_NARRATION_MANDATE,
    resolveMatchStillDirection(auto.presenter, firstSceneNoPeople),
    BACKGROUND_COMPATIBILITY_LOCK,
    REALISTIC_SCENE_SCALE_DIRECTION,
    vehicleAccessoryContext ? VEHICLE_ACCESSORY_CONTEXT_DIRECTION : "",
    PRODUCT_FIDELITY_DIRECTION,
    STRICT_PRODUCT_IDENTITY_RULE,
    isClothing ? APPAREL_REFERENCE_USE_DIRECTION : PRODUCT_ISOLATION_DIRECTION,
    isNeckScarfProduct(productText) ? NECK_SCARF_USAGE_LOCK : "",
    PRINTED_GRAPHIC_FIDELITY_DIRECTION,
    COLOR_AND_PATTERN_FIDELITY_DIRECTION,
    wearableCrop ? WEARABLE_CROP_SCENE_DIRECTION : (isClothing ? APPAREL_VISIBILITY_DIRECTION : FULL_PRODUCT_VISIBILITY_DIRECTION),
    wearableCrop
      ? "Critical: Keep the exact wearable product unchanged and clearly visible in the relevant body-part crop. Do not change its fit, color, shape, material, logo, or printed details."
      : isClothing
      ? "Critical: Keep the garment's cut, proportions, colors, fabric, graphics, branding, and construction identical across all scenes."
      : "Critical: Keep product shape, colors, materials, branding, and text 100% identical and static across all scenes; no redesign, warp, morph, or structural changes.",
    isClothing ? APPAREL_FABRIC_PHYSICS_DIRECTION : REALISM_AND_PHYSICS_DIRECTION,
    isClothing ? "" : getNaturalProductInteractionDirection(productText),
    isClothing ? "" : OBJECT_REALISM_DIRECTION,
    isWearable ? NO_PUTTING_ON_OR_TAKING_OFF_MANDATE : "",
    scaleInstruction,
    specificScale,
    PRODUCT_STRUCTURE_DIRECTION,
    categoryDirection,
    analysisDirection,
    isFarmPoultryProduct(productText) ? FARM_POULTRY_FEED_EXCLUSION_RULE : "",
    explicitlySelectedAnimal ? "" : NO_UNREQUESTED_ANIMALS_DIRECTION,
    isSunProtectionProduct(productText) ? SUNSCREEN_FIDELITY_DIRECTION : "",
    isHeadwearProduct(productText) ? HEADWEAR_NEVER_REMOVE_MANDATE : "",
    isFullFaceCoveringProduct(productText) ? FULL_FACE_COVERAGE_LOCK : "",
    isPhoneCaseProduct(productText) ? PHONE_CASE_MULTI_SHOT_MANDATE : "",
    isMagneticPhoneCaseProduct(productText) ? MAGNETIC_PHONE_CASE_FIDELITY_MANDATE : "",
    NO_GIBBERISH_TEXT_ON_PRODUCT_DIRECTION,
    STRICT_SHOP_LOGO_EXCLUSION_RULE,
    locationStr ? `Location setting: Place the product in a brand new, realistic ${locationStr} background location. DO NOT use or match the original reference image background.` : (handsOnly ? HANDS_ONLY_BACKGROUND_DIRECTION : "Choose a clean, realistic, commercially appealing background that fits this product category. ALWAYS generate a new, non-matching background location."),
  ];
  let sceneBreakdown = getMultiSceneDescription(sceneStyle, productName, compactPromptText(locationStr, 100), compactPromptText(auto.mood, 60), productText)
    .replace(/\d+-second\s*/g, "");
  if (noPeople) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown on its own")
      .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b/gi, "the product shown on its own");
  } else if (handsOnly) {
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "hands holding and presenting the product")
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, "hands holding the product");
    if (!isUnboxingHands) {
      sceneBreakdown = sceneBreakdown
        .replace(/\bhands\s+starting\s+to\s+open\b/gi, "hands gesturing towards");
    }
  } else if (wearableCrop) {
    const wearableFrame = getWearableCropFrame(productText);
    sceneBreakdown = sceneBreakdown
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, wearableFrame)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, wearableFrame)
      .replace(/\btalking\s+to\s+the\s+camera\b/gi, "with off-screen Thai voiceover");
    sceneBreakdown += `\n(${WEARABLE_CROP_SCENE_DIRECTION} Frame: ${wearableFrame}.)`;
  } else if (isAnimal) {
    sceneBreakdown = sceneBreakdown
      .replace(/- Scene 1 \(([^)]+)\): ([^\n]+)/i, `- Scene 1 ($1 - Pet Opening): A 3-second opening scene featuring a ${animalName} sitting next to or interacting naturally with ${productName} right from the start.`)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b[^.]*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, `a reviewer together with a ${animalName} sitting next to the product`)
      .replace(/\b(a |an )?(presenter|reviewer|model|person)\b/gi, `a reviewer together with a ${animalName}`)
      .replace(/\bhands\b/gi, "hands");
  } else if (isKids) {
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
    const clothingPresenterLabel = isChildPresenter ? "the supervised child" : "a model";
    sceneBreakdown = sceneBreakdown
      .replace(/(- Scene 1\b[^\n]*?(?:Open immediately with|Reveal) )/i, `$1${clothingPresenterLabel} already wearing the exact reference garment: `)
      .replace(/cuts\/transitions/gi, "instantaneous hard cuts")
      .replace(/360-degree rotation showing (.+?) from all angles/gi, "front-facing showcase showing the front view of $1")
      .replace(/showing (.+?) from all angles/gi, "showing the front view of $1")
      .replace(/with a reviewer presenting (.+?) in its normal real-world position and talking to the camera/gi, isChildPresenter ? "with the supervised child wearing $1 and showing its front design to the camera" : "with a model already wearing $1 and showing its front design to the camera")
      .replace(/the product used naturally as intended/gi, isChildPresenter ? "the exact reference garment worn naturally by the supervised child" : "the exact reference garment worn naturally by the model")
      .replace(/with the reviewer smiling/gi, isChildPresenter ? "with the supervised child wearing the exact reference garment and smiling" : "with the model wearing the exact reference garment and smiling");
    if (isChildPresenter) {
      sceneBreakdown = sceneBreakdown.replace(/\bmodel\b/gi, "child");
    }
    sceneBreakdown += `\n(CLOTHING FRONT-ONLY RULE: ${isChildPresenter ? "The supervised child" : "The model/presenter"} must remain strictly front-facing in all scenes; do NOT turn around or show the back side of the clothing item, to prevent arm and hand distortion glitches.)`;
  }

  if (firstSceneNoPeople && !noPeople) {
    const lines = sceneBreakdown.split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("- Scene 1")) {
        const scene1 = lines[i]
          .replace(/\bwith a reviewer holding .+?(?:\s+and talking to the camera(?:[^.]*)?)?/gi, `showcasing ${productName} resting on a flat surface`)
          .replace(/\bshow of hands starting to open the packaging of\b/gi, `shot of the unopened packaging of`)
          .replace(/\bhands starting to open the packaging of\b/gi, `the unopened packaging of`)
          .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b.*?(interacting|holding|demonstrating|opening|unwrapping|talking|smiling)[^.]*/gi, "the product shown resting on its own")
          .replace(/\btalking\s+(?:directly\s+)?to\s+the\s+camera\b[^.]*/gi, "showcasing the product")
          .replace(/\b(a |an )?(presenter|reviewer|model|person|hands?)\b/gi, "the product shown resting on its own");

        lines[i] = (scene1.includes("product shown resting on its own")
          ? scene1
          : "- Scene 1 (Hook): The product shown resting on its own on a suitable flat surface or floor.")
          + " (PRODUCT-ONLY SCENE 1: The product must rest on a flat surface or floor. STRICTLY FORBIDDEN: Do not show any people, faces, presenters, reviewers, characters, or hands in Scene 1. The presenter may appear starting from Scene 2 only.)";
        break;
      }
    }
    sceneBreakdown = lines.join("\n");
  }

  promptParts.push(
    `Use distinct scenes with hard cuts; split the ${durationSeconds}s evenly across the scenes below.`,
    `STRICT LIMIT: The video must contain AT MOST 3 to 4 sequential scenes/shots. Do not generate too many scenes, cuts, or edits. Keep the storytelling simple and clean.`,
    isUnboxingHands ? UNBOXING_REVEAL_SEQUENCE : "",
    sceneBreakdown,
    isClothing && !wearableCrop && !noPeople && !handsOnly && !isAnimal ? APPAREL_PRESENTER_FRAME_CONTINUITY : "",
    `Subtle ${compactPromptText(auto.cameraMovement, 80)}; camera movement should feel like a real handheld/tripod shot while the product remains physically stable. Keep shots sharp and clearly visible. No morphing, duplication, floating, or impossible action.`
  );

  const videoUserPhrase = settings?.clipText
    ? stripForbiddenVideoWords(sanitizeText(String(settings.clipText).trim()))
    : "";
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
    presenterInstruction = auto.customPresenter || "a fictional adult presenter";
  }
  if (isClothing && ["woman", "man"].includes(auto.presenter)) {
    presenterInstruction = `A fictional adult Thai ${auto.presenter} commercial fit model`;
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
  } else if (weightCategory === "light" && !isClothing) {
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
  if (productInfo.highlights) details.push(`Highlights: ${sanitizePolicySensitiveText(productInfo.highlights)}`);
  if (settings?.clipText) details.push(`Main Message: ${sanitizePolicySensitiveText(settings.clipText)}`);
  if (productInfo.name) details.push(`Product context only, never say aloud: ${sanitizePolicySensitiveText(productInfo.name)}`);
  const combinedProductDetails = [buildSpeechProductContext(productInfo, productName), ...details].filter(Boolean).join(", ");
  const openingHookDirection = `OPENING HOOK GUIDANCE: Start naturally from a customer problem, use case, or curiosity that genuinely fits this product. Optional inspiration: "${spokenOpeningHook}". Adapt or ignore it as needed; do not repeat it verbatim and do not force an unrelated problem. Use the product reference and verified details to guide the wording. Never invent claims.`;

  // Derive a speaker identity from the presenter setting so the AI voice matches the character
  let speakerIdentity = "a clear, friendly adult Thai woman narrator";
  if (auto.presenter === "woman") {
    speakerIdentity = "an adult Thai woman";
  } else if (auto.presenter === "man") {
    speakerIdentity = "an adult Thai man";
  } else if (auto.presenter === "none" || auto.presenter === "hands_only" || auto.presenter === "unboxing_hands" || auto.presenter === "wearable_crop") {
    speakerIdentity = "a clear, warm, friendly off-screen adult Thai woman narrator";
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
    : (auto.presenter === "none" || auto.presenter === "hands_only" || auto.presenter === "unboxing_hands" || auto.presenter === "wearable_crop")
      ? "the voice must sound like a clear, warm, friendly off-screen adult Thai female narrator presenting the product. Since no presenter's face or body is shown on screen, ensure the voice is explicitly a female voiceover narration."
      : (["baby", "toddler", "child", "older_child"].includes(auto.presenter))
        ? "the voice must sound like a caring Thai mother narrating warm and loving thoughts about her child on screen. The voice must be an adult mother's voice, and the narration must NEVER use baby-talk, baby words, or sound like a young child"
        : "the voice age, gender, and speech style must match the on-screen presenter exactly (Strictest rule: voice must match the presenter's character — if the presenter is an elderly woman, use an elderly woman's voice; if a young man, use a young man's voice; never use a mismatched voice for the presenter)";

  const voiceMatchEnd = (auto.presenter === "none" || auto.presenter === "hands_only" || auto.presenter === "unboxing_hands" || auto.presenter === "wearable_crop")
    ? "ensure the voice is a natural adult Thai female speaker delivering a clear off-screen voiceover narration."
    : (["baby", "toddler", "child", "older_child"].includes(auto.presenter))
      ? "ensure the voice is a natural Thai speaker whose voice matches the off-screen mother narrator."
      : "ensure the voice is a natural Thai speaker whose voice perfectly matches the character identity of the presenter.";

  const presentInstruction = isChildPresenter
    ? "narrate her own thoughts naturally in Thai off-screen (e.g., how the product helps her child, or how her child enjoys it). The script must NOT sound like a commercial product review or sales pitch, and the child must NOT present, explain features, or review the product themselves"
    : "present the product naturally in Thai; mention a relevant benefit, feature, material, or realistic use only when it fits";

  const speechCore = `Use [${combinedProductDetails}] as flexible context, not a script. Choose a natural Thai line that fits the actual product and its realistic use. Mention a relevant detail or benefit only when supported by the reference or product information. Avoid unrelated situations, exaggerated claims, filler, repetition, prices, or a forced CTA. The wording is up to the model.`;
  const speechDir = auto.audioMode === "music_only"
    ? MUSIC_ONLY_AUDIO_DIRECTION
    : isFullFaceCoveringProduct(productText)
    ? `Spoken audio (Thai): Use a short, natural off-screen Thai voiceover when useful. ${openingHookDirection} Voice character: ${speakerIdentity} — ${matchVoiceRule}. STRICT FABRIC MOUTH-COVERING LOCK: Keep the fabric over the mouth smooth, static, and fully covering the mouth while speaking. ${speechCore} Do not use subtitles, and ${voiceMatchEnd}`
    : `Spoken audio (Thai): Generate concise, natural Thai narration where it helps the story. ${openingHookDirection} Voice character: ${speakerIdentity} — ${matchVoiceRule}. ${speechCore} Speaker should ${presentInstruction}. Do not use subtitles, and ${voiceMatchEnd}`;
  const voiceoverDir = auto.audioMode === "music_only"
    ? MUSIC_ONLY_AUDIO_DIRECTION
    : (auto.presenter === "none" || auto.presenter === "hands_only" || auto.presenter === "unboxing_hands" || auto.presenter === "wearable_crop")
    ? "Voiceover: Add a clear, friendly off-screen Thai female voiceover narration speaking in Thai."
    : "Voiceover: Add a natural Thai off-screen voiceover narration speaking in Thai.";

  if (handsOnly) {
    let handsInstructions = `${isUnboxingHands ? `${UNBOXING_HANDS_DIRECTION}\n${UNBOXING_REVEAL_SEQUENCE}` : handsDir}\n${HANDS_ONLY_FACE_EXCLUSION}\n${HANDS_ONLY_GLOBAL_COUNT_LOCK}`;
    if (firstSceneNoPeople) {
      handsInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show hands or any human features in Scene 1. Hands are only allowed starting from Scene 2 onwards.\n${handsInstructions}`;
    }
    promptParts.push(`${handsInstructions}\n${voiceoverDir} ${speechDir}`);
  } else if (wearableCrop) {
    promptParts.push(`${WEARABLE_CROP_MODE_DIRECTION} Frame: ${getWearableCropFrame(productText)}. ${voiceoverDir} ${speechDir}`);
  } else if (auto.presenter === "dog" || auto.presenter === "cat") {
    let animalInstructions = `Presenter: ${presenterInstruction}. ${ANIMAL_PRESENTER_DIRECTION} ${SINGLE_PRESENTER_HAND_ANATOMY_DIRECTION} (Strictest rule: Use exactly one single consistent animal and presenter throughout the entire video. Do not switch animals or presenters, and do not morph or change their appearance between scenes).`;
    if (firstSceneNoPeople) {
      animalInstructions = `STRICT EXCEPTION FOR SCENE 1: Do not show the animal, any pets, people, or hands in Scene 1. The animal/pet character should only appear starting from Scene 2 onwards.\n${animalInstructions}`;
    }
    promptParts.push(`${animalInstructions} ${speechDir}`);
  } else if (auto.presenter && auto.presenter !== "none") {
    let personDir = isClothing
      ? "Natural fictional adult Thai commercial fit model in a full-length front-facing shot."
      : THAI_PERSON_DIRECTION;
    const presenterHandAnatomy = isKids
      ? MULTI_PERSON_HAND_ANATOMY_DIRECTION
      : SINGLE_PRESENTER_HAND_ANATOMY_DIRECTION;
    const presenterContinuity = isKids
      ? "Use exactly two consistent people: one child and one parent/guardian. Do not introduce anyone else or merge, duplicate, switch, or morph either person between scenes."
      : "Use exactly one single consistent presenter throughout the entire video. Do not introduce other people, switch presenters, or morph the presenter between scenes.";
    if (["baby", "toddler", "child", "older_child"].includes(auto.presenter)) {
      personDir = "Natural Thai child character. The product must remain rigid, static, and completely unchanged; the child stands next to it, plays with it, or holds it gently without deforming it. The child must NOT speak to the camera, must NOT speak any dialogue, and must NOT review the product directly; all spoken dialogue in this video is strictly an off-screen voiceover by a caring Thai mother.";
    }
    const presenterFraming = isChildPresenter && isClothing
      ? getChildApparelWearDirection(productText)
      : isClothing
      ? getApparelWearDirection(productText, auto.presenter)
      : `${FULL_BODY_PRESENTER_DIRECTION} ${getPresenterOutfitDirection(productText, auto.presenter)}`;
    let presenterInstructions = `Presenter: ${presenterInstruction}. ${personDir} ${presenterHandAnatomy} ${presenterFraming} (Strictest rule: ${presenterContinuity})`;
    if (firstSceneNoPeople) {
      presenterInstructions = `PRODUCT-ONLY SCENE 1: Do not show the presenter, any other people, hands, faces, or human features in Scene 1. Show only the product resting on its own. The presenter may appear starting from Scene 2 only.\n${presenterInstructions}`;
    }
    promptParts.push(`${presenterInstructions} ${speechDir}`);
  } else {
    promptParts.push(`${NO_PEOPLE_DIRECTION} ${voiceoverDir} ${speechDir}`);
  }

  if (firstSceneNoPeople) {
    promptParts.push("FINAL SCENE 1 OVERRIDE: Scene 1 is product-only. Do not show any person, presenter, face, body, hands, arms, animal, or human feature in Scene 1. Show only the unchanged product resting naturally on its own. All presenter or human activity starts from Scene 2.");
  }

  promptParts.push("STRICT ACTION RULE: Do NOT perform a thumbs up gesture (ห้ามยกนิ้วโป้ง/ยกนิ้วเยี่ยม) as it looks unnatural. Keep all poses and hand gestures completely natural and relaxed.");

  return promptParts.filter(Boolean).join("\n");
}

function buildFashionSelfieImagePrompt(productInfo, productName, settings = {}) {
  const garmentName = productName === "the attached product" ? "the exact attached garment" : productName;
  const apparelPriority = APPAREL_REFERENCE_PRIORITY;
  const fidelity = PRODUCT_FIDELITY_DIRECTION;
  const location = resolvePromptLocation(resolveAutoSettings(productInfo, settings));
  const textRule = buildFashionSelfieTextDirection(productInfo, settings, false);
  return [
    `Create one photorealistic vertical 9:16 full-body fashion selfie image featuring ${garmentName}.`,
    FASHION_SELFIE_IMAGE_DIRECTION,
    apparelPriority,
    fidelity,
    `Use a clean, realistic fashion setting${location ? ` such as ${compactPromptText(location, 80)}` : ""}; keep the background simple and never let it hide the garment.`,
    textRule,
    "The reference image is the only source of truth for the garment. Do not redesign, crop, duplicate, or replace it."
  ].join("\n");
}

function buildFashionSelfieVideoPrompt(productInfo, productName, locationStr, durationSeconds, settings = {}) {
  const garmentName = productName === "the attached product" ? "the exact attached garment" : productName;
  const location = locationStr ? ` in a clean, realistic ${compactPromptText(locationStr, 80)} setting` : " in a clean, realistic fashion setting";
  const textRule = buildFashionSelfieTextDirection(productInfo, settings, true);
  return [
    `Create a ${durationSeconds}-second photorealistic vertical 9:16 fashion outfit video featuring ${garmentName}${location}.`,
    FASHION_SELFIE_VIDEO_DIRECTION,
    APPAREL_REFERENCE_PRIORITY,
    PRODUCT_FIDELITY_DIRECTION,
    `MANDATORY SIMPLE SHOT PLAN: Scene 1 is a stable full-body front view with the model already holding the phone over her face. Scene 2 is a very slow, small left-to-right pan that keeps the complete outfit, feet, and phone visible. Scene 3 returns to a stable full-body hero view for garment inspection. Keep every shot single-frame, uncluttered, and easy to compare with the reference garment.`,
    `The model must remain standing in place; only subtle breathing, natural phone steadiness, and minimal camera motion are allowed. Do not zoom into the face or crop out the lower body.`,
    textRule,
    autoAudioDirection(settings)
  ].filter(Boolean).join("\n");
}

function buildFashionSelfieTextDirection(productInfo, settings = {}, isVideo = false) {
  const textEnabled = settings?.textEnabled === true || settings?.textEnabled === "true";
  if (!textEnabled) return TEXT_FREE_DIRECTION;

  const configuredTexts = [settings?.clipText, settings?.promotionText]
    .map((value) => stripForbiddenVideoWords(sanitizeText(String(value || "").trim())))
    .filter(Boolean)
    .slice(0, 2);
  const textStyle = TEXT_FONT_STYLES[settings?.textStyleFont] || TEXT_FONT_STYLES.handwriting;
  const position = compactPromptText(settings?.textPosition, 40) || "Auto";
  const doodles = resolveDoodleStyle(productInfo);
  const placement = isVideo
    ? "starting from the first frame and remaining clearly legible in every scene"
    : "clearly legible in the final image";

  if (configuredTexts.length > 0) {
    return `TEXT OVERLAY ENABLED: Display ONLY these exact Thai text overlays ${JSON.stringify(configuredTexts)} ${placement} at ${position}. Render every Thai character perfectly, style the text as ${textStyle}, and include 1–2 small doodles nearby (${doodles}). Keep the overlays in empty background space, away from the model's phone, face area, and garment details. Do not add any other text, price, CTA, logo, watermark, subtitle, English, romanized Thai, or gibberish.${isVideo ? " The text must sit over active video footage, not a frozen title card." : ""}`;
  }

  return `TEXT OVERLAY ENABLED: Create ONE short natural Thai phrase of 1–5 words ${placement} at ${position}. Render the Thai spelling perfectly, style the text as ${textStyle}, and include 1–2 small doodles nearby (${doodles}). Keep it in empty background space, away from the model's phone, face area, and garment details. Do not add product name, price, CTA, logo, watermark, English, romanized Thai, or gibberish.${isVideo ? " The text must sit over active video footage, not a frozen title card." : ""}`;
}

function autoAudioDirection(settings = {}) {
  return settings?.audioMode === "music_only"
    ? MUSIC_ONLY_AUDIO_DIRECTION
    : "Use only a calm off-screen Thai voiceover if narration is needed; the on-screen model must never speak or move her mouth behind the phone.";
}

function getMultiSceneDescription(videoStyle, productName, locationStr, mood, productText = "") {
  const loc = locationStr ? ` in a ${locationStr} setting` : "";
  const moodStyle = mood ? ` with ${mood} lighting` : "";

  if (isPhoneCaseProduct(productText || productName) || isMagneticPhoneCaseProduct(productText || productName)) {
    return [
      "This video uses four sequential phone-case showcase beats with clear cuts, preserving the exact artwork and built-in features:",
      `- Scene 1 (Hook, 0-2s): Reveal the full back artwork, pattern, and built-in magnetic ring of ${productName}${loc}${moodStyle}.`,
      "- Scene 2 (Detail, 2-4s): Macro close-up of the camera cutout border, side button covers, edge bevels, and material.",
      "- Scene 3 (Real Use, 4-6s): Show the exact case fitted naturally on a compatible smartphone during believable daily use.",
      "- Scene 4 (Hero + CTA, 6-8s): Finish with a premium fitted hero shot highlighting the magnetic ring and bottom charging-port cutout."
    ].join("\n");
  }

  switch (videoStyle) {
    case "sales":
      return [
        "Reusable four-beat TikTok sales structure. For 8s: 0-2s, 2-4s, 4-6s, 6-8s. Adapt to category; no forced outdoors or invented features:",
        `- Scene 1 (Hook): Reveal ${productName} immediately in a relevant setting${loc}${moodStyle}; use a scroll-stopping action.`,
        `- Scene 2 (Use + Detail): Show ${productName} in real use, then sharp close-ups of details/material/construction/interface.`,
        `- Scene 3 (Lifestyle Fit): Show one category-fit use: coffee, shoes, phone, office, camping, bags, or fitness.`,
        `- Scene 4 (Hero + CTA): End with ${productName} in a premium hero shot; if text is enabled, add one short Thai CTA, otherwise no text.`
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
        `- Scene 1 (Reviewer Hook): A 3-second opening with a reviewer presenting ${productName} in its normal real-world position and talking to the camera${loc}${moodStyle}.`,
        `- Scene 2 (Feature Showcase): A 3-second cut showing the product used naturally as intended.`,
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
  const hasEngraving = /(ฉลัก|สลัก|นูน|แกะสลัก|ลายนูน|ลายฉลัก|ลายแกะ|engraved|embossed|debossed|etched|carved|relief|laser.?engraved|laser.?carved)/i.test(text);
  if (isHammockProduct(text)) {
    return `${HAMMOCK_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(สเปรย์|ฉีด|ละออง|สเปรย์อาบน้ำ|ดับกลิ่น|สเปรย์แมว|สเปรย์หมา|spray|aerosol|mist|atomizer|pump\s*bottle)/i.test(text)) {
    return `${SPRAY_BOTTLE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks)/i.test(text)) {
    return `${SHOE_FIDELITY_DIRECTION}\n${SHOE_SCALE_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isClothingProduct(text)) {
    return `${isNeckScarfProduct(text) ? NECK_SCARF_USAGE_LOCK + "\n" : ""}${CLOTHING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isFurnitureProduct(text)) {
    const isChair = /(เก้าอี้|อาร์มแชร์|ม้านั่ง|chair|armchair|stool|bench)/i.test(text);
    return `${isChair ? CHAIR_FIDELITY_DIRECTION : FURNITURE_FIDELITY_DIRECTION}\n${FURNITURE_SURFACE_TEXT_LOCK}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(แว่นตา|แว่นกันแดด|แว่นสายตา|แว่น|glasses|sunglasses|eyewear|spectacles)/i.test(text)) {
    return EYEWEAR_FIDELITY_DIRECTION;
  }
  if (/(ครีม|เซรั่ม|ลิป|ลิปสติก|สกินแคร์|บำรุง|กันแดด|แชมพู|สบู่|น้ำหอม|แป้ง|รองพื้น|บลัชออน|แต่งหน้า|เครื่องสำอาง|cosmetics|skincare|serum|cream|lotion|lipstick|lipgloss|shampoo|cleanser|perfume|makeup|foundation)/i.test(text)) {
    return `${BEAUTY_SKINCARE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(เคส|ไอโฟน|เคสมือถือ|เคสโทรศัพท์|เคสไอโฟน|phone case|phone cover|mobile case|mobile cover|gadget)/i.test(text) || isMagneticPhoneCaseProduct(text)) {
    const extraMag = isMagneticPhoneCaseProduct(text) ? `\n${MAGNETIC_PHONE_CASE_FIDELITY_MANDATE}` : "";
    return `${PHONE_CASE_FIDELITY_DIRECTION}\n${PHONE_CASE_COMPLEX_PATTERN_REFERENCE_LOCK}${extraMag}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isSmallTechAccessoryProduct(text)) {
    return `${ELECTRONICS_GADGETS_FIDELITY_DIRECTION}\n${SMALL_TECH_ACCESSORY_SCALE_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(มือถือ|หูฟัง|บลูทูธ|สายชาร์จ|พาวเวอร์แบงค์|พัดลม|อิเล็กทรอนิกส์|earphone|headphone|bluetooth|charger|powerbank|fan|electronic|appliance)/i.test(text)) {
    return `${ELECTRONICS_GADGETS_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(กระเป๋า|เป้|กระเป๋าถือ|กระเป๋าสะพาย|กระเป๋าสตางค์|นาฬิกา|สร้อย|แหวน|ต่างหู|เครื่องประดับ|bag|backpack|wallet|purse|tote|handbag|crossbody|clutch|watch|jewelry|necklace|ring|bracelet|accessory)/i.test(text)) {
    return `${BAGS_ACCESSORIES_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (isCoffeePowderProduct(text)) {
    return `${isPackagedCoffeeProduct(text) ? COFFEE_SEALED_POWDER_POUCH_DIRECTION + "\n" : ""}${COFFEE_POWDER_FORM_DIRECTION}\n${COFFEE_BAG_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${LABEL_EXACT_COPY_MANDATE}\n${COLOR_EXACT_LOCK}`;
  }
  if (isCoffeeBeanProduct(text)) {
    return `${isPackagedCoffeeProduct(text) ? COFFEE_SEALED_BEANS_POUCH_DIRECTION + "\n" : ""}${COFFEE_BEANS_FORM_DIRECTION}\n${COFFEE_BAG_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${LABEL_EXACT_COPY_MANDATE}\n${COLOR_EXACT_LOCK}`;
  }
  if (isCoffeeProduct(text) || /(ถุงกาแฟ|เมล็ดกาแฟ|ซองกาแฟ|ผงกาแฟ|กาแฟคั่ว|coffee bag|coffee pouch|coffee bean bag|coffee beans pouch)/i.test(text)) {
    return `${COFFEE_BAG_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${LABEL_EXACT_COPY_MANDATE}\n${COLOR_EXACT_LOCK}`;
  }
  if (/(ชา|โกโก้|ขนม|อาหาร|อาหารเสริม|วิตามิน|คอลลาเจน|อาหารหมา|อาหารแมว|tea|snack|food|supplement|vitamin|collagen|pet food)/i.test(text)) {
    return `${FOOD_BEVERAGE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(แก้ว|กระบอกน้ำ|ชากาแฟ|กระติก|แก้วเก็บความเย็น|tumbler|mug|cup|bottle|flask)/i.test(text)) {
    return `${TUMBLER_BOTTLE_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  }
  if (/(หมอน|ผ้าห่ม|ที่นอน|ผ้าม่าน|เครื่องครัว|pillow|blanket|kitchenware|home)/i.test(text)) {
    return `${HOME_LIVING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}`;
  }
  if (/(สติกเกอร์|โปสเตอร์|แผ่นรอง|แผ่นรองเมาส์|สกรีน|ลายสกรีน|ลายการ์ตูน|ภาพวาด|ลาย|ลายพิมพ์|พิมพ์ลาย|sticker|decal|poster|canvas|printed|graphic|pattern|illustration)/i.test(text)) {
    return hasEngraving
      ? `${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${ENGRAVED_EMBOSSED_FIDELITY_DIRECTION}`
      : PRINTED_GRAPHIC_FIDELITY_DIRECTION;
  }
  const baseDirection = `${GENERAL_PACKAGING_FIDELITY_DIRECTION}\n${PRINTED_GRAPHIC_FIDELITY_DIRECTION}\n${COLOR_AND_PATTERN_FIDELITY_DIRECTION}`;
  return hasEngraving ? `${baseDirection}\n${ENGRAVED_EMBOSSED_FIDELITY_DIRECTION}` : baseDirection;
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

  // Outdoor products must be identified before generic fabric/clothing keywords.
  if (isHammockProduct(text)) return "camping hammock";
  if (isCampingChairProduct(text)) return "folding camping chair";

  // Coffee products must be identified before clothing keywords. Thai words
  // such as "โบราณ" contain the substring "บรา", which must not map coffee
  // to underwear.
  if (isCoffeePowderProduct(text)) return isPackagedCoffeeProduct(text) ? "sealed printed coffee pouch bag containing ground coffee powder" : "ground coffee powder";
  if (isCoffeeBeanProduct(text)) return isPackagedCoffeeProduct(text) ? "sealed printed coffee pouch bag containing whole roasted coffee beans" : "whole roasted coffee beans";
  if (isCoffeeProduct(text) || isPackagedCoffeeProduct(text)) return "coffee pouch bag";

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
  if (isCoffeePowderProduct(text)) return isPackagedCoffeeProduct(text) ? "sealed printed coffee pouch bag containing ground coffee powder" : "ground coffee powder";
  if (isCoffeeBeanProduct(text)) return isPackagedCoffeeProduct(text) ? "sealed printed coffee pouch bag containing whole roasted coffee beans" : "whole roasted coffee beans";
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
  const productText = [productInfo.name, productInfo.originalName, productInfo.category, productInfo.highlights]
    .filter(Boolean)
    .join(" ");
  const vehicleAccessoryContext = getVehicleAccessoryContext(productText);
  const outdoorOnlyProduct = footwear || isRainwearProduct(productText) || isOutdoorRideProduct(productText);
  const contextLockedProduct = outdoorOnlyProduct || Boolean(vehicleAccessoryContext);
  const isPetProduct = /(สัตว์เลี้ยง|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|แมว|สุนัข|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b|\banimal\b)/i.test(productText);
  const autoPresenter = pickAutoReviewer(productInfo);
  const prefersMan = detectExplicitProductGender(productText) === "man"
    || isCampingOutdoorProduct(productText)
    || /(ช่าง|mechanic)/i.test(productText);
  const safeAutoPresenter = (autoPresenter === "dog" || autoPresenter === "cat")
    ? "woman"
    : (autoPresenter === "hands_only" || autoPresenter === "none")
    ? (prefersMan ? "man" : "woman")
    : autoPresenter;
  return {
    videoStyle: isAuto(settings.videoStyle) ? (recommended.videoStyle || inferred.videoStyle) : settings.videoStyle,
    // Auto always includes a real reviewer. People-free output is only allowed
    // when the user explicitly selects the "none" presenter option.
    presenter: isAuto(settings.presenter) ? safeAutoPresenter : settings.presenter,
    customPresenter: sanitizePolicySensitiveText(settings.customPresenter),
    audioMode: settings.audioMode === "music_only" ? "music_only" : "voiceover",
    voiceTone: isAuto(settings.voiceTone) ? (recommended.voiceTone || inferred.voiceTone) : settings.voiceTone,
    mood: isAuto(settings.mood) ? (recommended.mood || inferred.mood) : settings.mood,
    location: contextLockedProduct ? requiredLocation : (isAuto(settings.location) ? (requiredLocation || recommended.location || inferred.location) : settings.location),
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
  const vehicleAccessoryContext = getVehicleAccessoryContext(text);

  if (vehicleAccessoryContext === "motorcycle") {
    return promptAutoOptions("review", "none", "professional", "Natural", "Outdoor Motorcycle Driveway or Roadside", "Slow Zoom In", "Cut ตรง", "Motorcycle accessory, shown on or beside a real motorcycle or scooter so its real-world use is unmistakable");
  }
  if (vehicleAccessoryContext === "car") {
    return promptAutoOptions("review", "none", "professional", "Professional", "Realistic Car Interior or Driveway", "Slow Zoom In", "Cut ตรง", "Car accessory, shown inside or beside a real car with the relevant vehicle context clearly visible");
  }
  if (isCampingOutdoorProduct(text)) {
    return promptAutoOptions("testimonial", "man", "professional", "Natural", "Nature / Outdoor", "Slow Zoom In", "Cut ตรง", "Camping or outdoor gear, shown with an adult Thai man using it naturally at a realistic campsite");
  }

  if (/(ซิ้ง|ซิ้งค์|ซิงค์|อ่าง|อ่างล้าง|ล้างจาน|เครื่องล้างจาน|ครัว|เครื่องครัว|เตาอบ|ไมโครเวฟ|จาน|ชาม|หม้อ|กระทะ|sink|dishwasher|kitchenware|cookware|kitchen)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Professional", "Modern Kitchen", "Slow Zoom In", "Cut ตรง", "Kitchen product, shown in a clean modern kitchen setting suited to its use");
  }
  if (/(ตู้|ลิ้นชัก|ชั้นวาง|เฟอร์นิเจอร์|ห้องนั่งเล่น|ห้องนอน|cabinet|drawer|shelf|furniture|wardrobe|dresser)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Professional", "Modern Living Room", "Slow Zoom In", "Cut ตรง", "Furniture product, shown alone in a clean realistic interior suited to its use");
  }
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|shoe|shoes|sneaker|footwear|sandal|boot)/i.test(text)) {
    return promptAutoOptions("review", "none", "professional", "Trendy", "Outdoor Home Driveway or Park Path", "Slow Zoom In", "Cut ตรง", "Footwear product, shown outdoors where shoes are realistically used, without a presenter to preserve its exact model");
  }
  if (isOutdoorRideProduct(text)) {
    return promptAutoOptions("review", "none", "fun", "Natural", "Outdoor Home Driveway or Park Path", "Slow Zoom In", "Cut ตรง", "Ride-on product, shown outdoors where it is realistically used");
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
  if (/(แมว|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|สุนัข|สัตว์เลี้ยง|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b)/i.test(text)) {
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
  const text = [
    productInfo.name,
    productInfo.originalName,
    productInfo.productLinkTitle,
    productInfo.productName,
    productInfo.highlights,
    productInfo.category
  ].filter(Boolean).join(" ").toLowerCase();
  const vehicleAccessoryContext = getVehicleAccessoryContext(text);

  // 0. Sun Protection & Sun Hats -> Sunny Outdoor Setting
  if (isSunProtectionProduct(text)) {
    return pickProductLocationVariant(productInfo, [
      "Sunny park promenade with natural daylight",
      "Bright garden path with soft morning sunlight",
      "Open beachside walkway with sunny daylight"
    ], "sun-protection");
  }

  if (isRainwearProduct(text)) {
    return pickProductLocationVariant(productInfo, [
      "Safe outdoor rainy setting: wet park path during light rain; never indoors",
      "Safe outdoor rainy setting: covered outdoor walkway with wet ground after rain; never indoors",
      "Safe outdoor rainy setting: quiet residential street immediately after rain; never indoors",
      "Safe outdoor rainy setting: campsite edge with light rain and wet natural ground; never indoors"
    ], "rainwear");
  }

  // Product-specific environments must win over broad lifestyle defaults.
  if (/(water bottle|thermos|tumbler|flask|กระบอกน้ำ|แก้วน้ำ|ขวดน้ำ|แก้วเก็บความเย็น)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Bright realistic outdoor park or fitness setting: park bench with a clean fitness path",
      "Bright realistic outdoor park or fitness setting: quiet morning jogging path with a simple outdoor bench",
      "Bright realistic outdoor park or fitness setting: clean gym corner with a realistic rubber floor and bench",
      "Bright realistic outdoor park or fitness setting: sunny garden rest area with a natural stone table"
    ], "drinkware");
  }
  if (/(ออกกำลังกาย|ฟิตเนส|กีฬา|ยางยืด|ดัมเบล|เสื่อโยคะ|โยคะ|ลู่วิ่ง|เวท|exercise|fitness|workout|gym|sport|resistance\s*band|dumbbell|yoga|treadmill)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Bright home workout corner with a clean exercise mat and natural window light",
      "Outdoor park fitness area with a clear path and soft morning daylight",
      "Clean modern gym corner with realistic rubber flooring and restrained background detail",
      "Quiet home fitness space with neutral walls and safe open floor"
    ], "fitness");
  }
  if (/(pet|animal|cat|kitten|dog|puppy|อาหารแมว|อาหารหมา|ปลอกคอ|สัตว์เลี้ยง)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Clean pet-friendly home interior: neutral-floor pet-care corner",
      "Clean pet-friendly home interior: bright feeding-area corner",
      "Clean pet-friendly home interior: sunny covered pet-care patio"
    ], "pet");
  }
  if (isOutdoorRideProduct(text)) {
    return pickProductLocationVariant(productInfo, [
      "Realistic outdoor home driveway with safe open space; never indoors",
      "Quiet neighborhood street with safe open space; never indoors",
      "Open park path with natural daylight and safe clearance; never indoors",
      "Residential front yard with a clear outdoor riding area; never indoors"
    ], "outdoor-ride");
  }
  if (isCampingOutdoorProduct(text)) {
    return pickProductLocationVariant(productInfo, [
      "Realistic campsite with natural ground, trees, and soft daylight",
      "Outdoor camping area beside a tent with safe open space",
      "Forest-edge trailhead with natural outdoor ground and daylight",
      "Quiet lakeside campsite with practical outdoor gear context"
    ], "camping");
  }
  if (isHammockProduct(text)) {
    return pickProductLocationVariant(productInfo, [
      "Natural outdoor campsite with two sturdy trees",
      "Shaded garden with a proper hammock stand",
      "Quiet lakeside campsite with safe hammock supports"
    ], "hammock");
  }
  if (vehicleAccessoryContext === "motorcycle") {
    return "Outdoor motorcycle driveway, roadside, parking area, or garage entrance with a real motorcycle or scooter clearly visible; show the accessory on, attached to, or directly beside the matching motorcycle; never a generic desk, empty studio, unrelated room, cafe, or car-only setting";
  }
  if (vehicleAccessoryContext === "car") {
    return "Realistic clean car interior, driveway, parking area, or open garage entrance with the actual car clearly visible; show the accessory inside, attached to, or directly beside the matching car; never a generic desk, empty studio, unrelated room, cafe, or motorcycle-only setting";
  }
  if (/(baby|infant|newborn|toddler|kid|kids|child|toy|เด็ก|ทารก|ของเล่น)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Bright safe children's playroom: clean age-appropriate surroundings",
      "Bright safe children's playroom: neat corner with soft natural daylight",
      "Bright safe children's playroom: shaded family play area with safe clean surroundings"
    ], "kids");
  }
  if (/(snack|food|drink|beverage|ขนม|อาหาร|เครื่องดื่ม|น้ำผลไม้)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Clean natural kitchen countertop with food-safe presentation",
      "Bright dining table with simple food-safe surroundings",
      "Minimal breakfast corner with natural window light"
    ], "food");
  }
  if (/(laptop|computer|keyboard|mouse|headphone|charger|cable|อุปกรณ์ไอที|คอมพิวเตอร์|หูฟัง|สายชาร์จ)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Neat modern desk workspace: realistic office lighting",
      "Neat modern desk workspace: minimal home office desk beside a window",
      "Neat modern desk workspace: clean creative desk with restrained background detail"
    ], "tech");
  }
  if (/(garden|plant|flower|outdoor|camping|hiking|ต้นไม้|ดอกไม้|สวน|แคมป์|เดินป่า)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Natural outdoor garden path suited to the product's actual use",
      "Clean campsite setting with natural daylight",
      "Quiet forest-edge trail with realistic outdoor ground"
    ], "outdoor");
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
    return pickProductLocationVariant(productInfo, [
      "Cafe / Coffee Shop: quiet wooden table beside a window",
      "Cafe / Coffee Shop: clean coffee bar counter with soft natural light",
      "Cafe / Coffee Shop: minimal corner with a softly blurred background",
      "Cafe / Coffee Shop: small terrace table with calm daylight"
    ], "cafe-food");
  }

  // Office furniture must stay in an office context, not a generic living room.
  if (/(เก้าอี้สำนักงาน|เก้าอี้ทำงาน|โต๊ะทำงาน|สำนักงาน|office\s*chair|desk\s*chair|ergonomic\s*chair|office\s*desk|workspace)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Modern office workspace with realistic desk and floor scale",
      "Bright home office beside a window with a clean working desk",
      "Quiet professional office corner with natural daylight"
    ], "office-furniture");
  }

  // 5. Living Room Furniture -> Modern Living Room
  if (/(โซฟา|ชั้นวางทีวี|ทีวี|โทรทัศน์|โต๊ะกลาง|ห้องนั่งเล่น|ตู้|ลิ้นชัก|ชั้นวาง|เตียง|เฟอร์นิเจอร์|sofa|couch|tv cabinet|living room|table|chair|furniture|shelf|cabinet)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Modern living room with natural window light",
      "Calm home interior with a clean neutral wall",
      "Minimal apartment living area with realistic furniture scale"
    ], "furniture");
  }

  // 6. Office & Tech Gadgets -> Stylish Office
  if (/(โต๊ะทำงาน|เก้าอี้ทำงาน|คอมพิวเตอร์|โน๊ตบุ๊ค|คีย์บอร์ด|เมาส์|หูฟัง|สำนักงาน|แกดเจ็ต|อิเล็กทรอนิกส์|office|desk|computer|laptop|workspace|gadget|headphone)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Stylish office desk with clean natural lighting",
      "Modern home workspace with a softly blurred background",
      "Quiet office corner with realistic desk-scale context"
    ], "office");
  }

  // 7. Bags, Fashion Accessories & Eyewear -> category-fit non-cafe contexts
  if (/(กระเป๋า|เป้|กระเป๋าถือ|กระเป๋าสะพาย|กระเป๋าสตางค์|แว่นตา|แว่นกันแดด|นาฬิกา|เครื่องประดับ|bag|backpack|wallet|purse|tote|handbag|crossbody|glasses|sunglasses|jewelry|watch|accessory)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Minimal travel lounge with realistic accessory context",
      "Clean entryway bench with a softly blurred home background",
      "Bright park bench with natural daylight and restrained outdoor context",
      "Simple bedroom dressing area with realistic accessory scale"
    ], "accessory");
  }

  // 8. Footwear -> Minimalist Studio / Urban Street
  if (/(รองเท้า|สนีกเกอร์|แตะ|บูท|ถุงเท้า|shoe|shoes|sneaker|footwear|sandal|boot|socks)/i.test(text)) {
    return pickProductLocationVariant(productInfo, [
      "Outdoor home driveway, front yard, quiet neighborhood street, or park path with safe open space: natural daylight",
      "Outdoor home driveway, front yard, quiet neighborhood street, or park path with safe open space: realistic pavement",
      "Outdoor home driveway, front yard, quiet neighborhood street, or park path with safe open space: natural ground and soft morning light",
      "Outdoor home driveway, front yard, quiet neighborhood street, or park path with safe open space: clear outdoor walkway"
    ], "footwear") + "; shoes remain at true human-foot scale and never indoors";
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

  const isFather = detectExplicitProductGender(productText) === "man" || /(คุณพ่อ|พ่อ|\bfather\b|\bdad\b)/i.test(productText);
  const explicitGender = detectExplicitProductGender(productText);

  const isPetProduct = /(สัตว์|หมา(?!ย|ก|ด|ล่า|น|ง|ม)|แมว|สุนัข|สัตว์เลี้ยง|อาหารแมว|อาหารหมา|\bcat\b|\bdog\b|\bpet\b|\bkitten\b|\bpuppy\b|\banimal\b)/i.test(productText);

  // AUTO PRESENTER RULE: Forbidden to pick child presenters (child/older_child).
  // If auto recommended presenter was a child, map to parent (father/mother) instead.
  const recommended = productInfo.autoOptions?.presenter;
  if (explicitGender) return explicitGender;
  if (isCampingOutdoorProduct(productText)) return "man";
  if (["woman", "man", "hands_only"].includes(recommended)) return recommended;
  if ((recommended === "dog" || recommended === "cat") && isPetProduct) return recommended;
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

  if (isPetProduct) {
    const isCat = /(แมว|\bcat\b|\bkitten\b)/i.test(productText);
    return isCat ? "cat" : "dog";
  }

  if (/(ครีม|เซรั่ม|สกินแคร์|เมคอัพ|เครื่องสำอาง|ลิป|มาสคาร่า|น้ำหอม|เครื่องประดับ|กระเป๋า|beauty|skincare|makeup|cosmetic|lipstick|jewelry|handbag)/i.test(productText)) {
    return "woman";
  }
  if (/(เครื่องมือ|สว่าน|ประแจ|ไขควง|รถยนต์|มอเตอร์ไซค์|อะไหล่|เกมมิ่ง|tool|drill|wrench|screwdriver|automotive|motorcycle|gaming|ช่าง|mechanic)/i.test(productText)) {
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

function detectExplicitProductGender(text = "") {
  const clean = String(text || "");
  const isWomen = /(ผู้หญิง|หญิง|สตรี|สาว|คุณแม่|แม่และเด็ก)/i.test(clean)
    || /\b(?:woman|women|female|lady|ladies|girl|girls|maternity|mom|mother|women'?s|ladies'?)\b/i.test(clean);
  const isMen = /(ผู้ชาย|ชาย|บุรุษ|หนุ่ม)/i.test(clean)
    || /\b(?:man|men|male|boy|boys|gentleman|men'?s)\b/i.test(clean);
  if (isWomen && !isMen) return "woman";
  if (isMen && !isWomen) return "man";
  return "";
}

function promptAutoOptions(videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason) {
  return { videoStyle, presenter, voiceTone, mood, location, cameraMovement, transition, reason };
}

function pickProductLocationVariant(productInfo = {}, locations = [], salt = "") {
  if (!locations.length) return "Clean Modern Studio";
  const seed = [
    salt,
    productInfo.sceneSeed,
    productInfo.productId || productInfo.product_id || productInfo.id,
    productInfo.originalName || productInfo.name,
    productInfo.category
  ].filter(Boolean).join("|");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return locations[Math.abs(hash) % locations.length];
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

export function appendTikTokCaptionSignature(value) {
  const caption = String(value || "").replace(/\s+/g, " ").trim();
  if (!caption) return TIKTOK_CAPTION_SIGNATURE;
  if (caption.toLowerCase().endsWith(TIKTOK_CAPTION_SIGNATURE)) return caption;
  return `${caption} ${TIKTOK_CAPTION_SIGNATURE}`;
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
  const rawTags = Array.isArray(value)
    ? value.flatMap((tag) => String(tag || "").split(/[\s,]+/))
    : String(value || "").split(/[\s,]+/);
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
  const tags = normalizeHashtags([...baseTags, ...nameTags], 5);
  if (!isPhoneCaseProduct(`${productInfo.name || ""} ${productInfo.category || ""}`)) return tags;

  const phoneCaseText = `${productInfo.name || ""} ${productInfo.category || ""} ${productInfo.highlights || ""}`;
  const relatedBurmeseTags = [
    /iphone/i.test(phoneCaseText) ? "#iPhoneကာဗာ" : "#မိုဘိုင်းဖုန်း",
    /အကြည်|ใส|clear|transparent/i.test(phoneCaseText) ? "#ဖုန်းကာဗာအကြည်" : "#ဖုန်းကာဗာ"
  ];

  // Keep relevant Burmese phone-case tags at the end without exceeding five tags.
  return normalizeHashtags([
    ...tags.filter(tag => !relatedBurmeseTags.some(related => tag.toLowerCase() === related.toLowerCase())).slice(0, 3),
    ...relatedBurmeseTags
  ], 5);
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
