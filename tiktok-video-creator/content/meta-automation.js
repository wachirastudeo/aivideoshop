(() => {
  if (window.__tvcMetaAutomation) return;
  window.__tvcMetaAutomation = true;
  let running = false;
  let stopped = false;
  let activeJobId = '';
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const check = () => { if (stopped) throw new Error('Meta AI generation stopped'); };
  const visible = element => !!element?.getClientRects().length;
  const composer = () => [...document.querySelectorAll('[data-testid="composer-input"][contenteditable="true"], [contenteditable="true"][role="textbox"]')].find(visible);
  const label = element => (element.getAttribute('aria-label') || element.textContent || '').trim();
  const button = expression => [...document.querySelectorAll('button')].find(element => visible(element) && !element.disabled && expression.test(label(element)));
  const conversationLinks = () => [...document.querySelectorAll('a[href]')].filter(link => {
    const url = new URL(link.href, location.href);
    return url.origin === location.origin && url.pathname.startsWith('/prompt/');
  });
  const report = stage => chrome.storage.local.set({[`metaJob:${activeJobId}`]:{stage,pageUrl:location.href,updatedAt:Date.now()}});
  function generationFailure(text) {
    let code = '';
    if (/quota.*(?:exhausted|reached)|reached your limit|daily limit|generation limit|wait until tomorrow/i.test(text)) code = 'META_QUOTA';
    else if (/blocked by (?:our|the) security system/i.test(text)) code = 'META_SECURITY_BLOCK';
    else if (/video generation is not available|can(?:not|'t) (?:create|produce|generate).*video/i.test(text)) code = 'META_UNAVAILABLE';
    else if (/try again later|something went wrong/i.test(text)) code = 'META_GENERATION_FAILED';
    if (!code) return null;
    return Object.assign(new Error(`Meta AI: ${text.trim().slice(0,500)}`),{code,retryable:code === 'META_GENERATION_FAILED' && /something went wrong/i.test(text)});
  }
  async function waitFor(find, description, timeout = 30000) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      check();
      const result = await find();
      if (result) return result;
      await pause(400);
    }
    throw new Error(`Meta AI: timed out waiting for ${description}`);
  }
  async function click(element) {
    check();
    element.scrollIntoView({block:'center'});
    const rect = element.getBoundingClientRect?.() || { x: 0, y: 0, width: 0, height: 0 };
    if (rect.width && rect.height && chrome?.runtime?.sendMessage) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'META_CLICK',
          payload: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
        });
        if (response?.ok) return;
      } catch {}
    }
    element.click?.();
  }
  const blobData = blob => new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read generated Meta AI media'));
    reader.readAsDataURL(blob);
  });
  async function upload(dataUrls) {
    if (!dataUrls.length) return;
    const uploadedCount = () => [...document.querySelectorAll('button[aria-label="Remove image"]')].filter(visible).length;
    for (const [index,dataUrl] of dataUrls.entries()) {
      let input = document.querySelector('input[type="file"]');
      if (!input) {
        button(/^Add attachment$/i)?.click();
        input = await waitFor(()=>document.querySelector('input[type="file"]'),'upload file input');
      }
      const blob = await (await fetch(dataUrl)).blob();
      if (!blob.type.startsWith('image/')) throw new Error('Meta AI reference must be an image');
      const extension = {'image/png':'png','image/webp':'webp','image/gif':'gif'}[blob.type] || 'jpg';
      const transfer = new DataTransfer();
      transfer.items.add(new File([blob],`product-reference-${index+1}.${extension}`,{type:blob.type}));
      const expectedCount = uploadedCount() + 1;
      input.files = transfer.files;
      input.dispatchEvent(new Event('change',{bubbles:true}));
      await waitFor(()=>uploadedCount() >= expectedCount,`uploaded reference image ${index+1} of ${dataUrls.length}`,60000);
    }
    await waitFor(()=>composer(),'composer after upload');
    await pause(1200);
  }
  async function enterPrompt(text) {
    const previousLinks = new Set((typeof conversationLinks === 'function' ? conversationLinks() : []).map(link => link.href));
    const previousPath = location.pathname;
    const previousMessages = new Set(document.querySelectorAll('[aria-label="Your message"]'));
    const editor = await waitFor(composer,'New chat composer');
    editor.focus();
    const response = await chrome.runtime.sendMessage({ type: 'META_INSERT_TEXT', payload: { text, clear: false } });
    if (!response?.ok) {
      const transfer = new DataTransfer();
      transfer.setData('text/plain', text);
      editor.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: transfer }));
    }
    await waitFor(() => {
      const current = composer();
      if (!current) return false;
      const textSample = text.slice(0, 40).trim();
      return current.textContent?.includes(textSample) || current.innerText?.includes(textSample);
    }, 'prompt insertion');

    // Wait briefly for Lexical state update to enable Send button
    await pause(800);

    const findSendButton = () => {
      const byTestId = document.querySelector?.('button[data-testid="composer-send-button"], button[data-testid="send-button"]');
      if (byTestId && !byTestId.disabled) return byTestId;
      const byAria = document.querySelector?.('button[aria-label="Send"], button[aria-label*="send" i], button[aria-label*="ส่ง" i], button[aria-label*="submit" i]');
      if (byAria && !byAria.disabled) return byAria;
      const byRegex = button(/send|ส่ง|submit|arrow_upward/i);
      if (byRegex && !byRegex.disabled) return byRegex;
      return [...(document.querySelectorAll?.('button') || [])].find(b => {
        if (!visible(b) || b.disabled) return false;
        const container = b.closest?.('form, [data-testid*="composer"], div:has([contenteditable])');
        return !!(container && b.querySelector?.('svg'));
      });
    };

    const sendBtn = await waitFor(findSendButton, 'Send button', 10000).catch(() => null);
    if (sendBtn) {
      await click(sendBtn);
    } else {
      const targetEditor = composer() || editor;
      if (targetEditor) {
        targetEditor.focus?.();
        const response = await chrome.runtime.sendMessage({ type: 'META_PRESS_ENTER' });
        if (!response?.ok) throw new Error(response?.error || 'Could not submit Meta AI prompt');
      }
    }
    // Meta can save a submitted chat while leaving the home composer visible.
    // Follow only this submission's newly created history link; never resubmit.
    let openedHistory = false;
    await waitFor(async () => {
      const message = [...document.querySelectorAll('[aria-label="Your message"]')].at(-1);
      if (location.pathname.startsWith('/prompt/') && message && (location.pathname !== previousPath || !previousMessages.has(message))) return true;
      if (!openedHistory) {
        const newLinks = (typeof conversationLinks === 'function' ? conversationLinks() : []).filter(item => !previousLinks.has(item.href));
        const link = newLinks.find(item => label(item).includes(text.slice(0, 40))) || (newLinks.length === 1 ? newLinks[0] : null);
        if (link) { openedHistory = true; link.click(); }
      }

      // Automatically dismiss Discard modal if it appears
      const discardBtn = button(/^discard$/i) || [...(document.querySelectorAll?.('button') || [])].find(b => visible(b) && !b.disabled && /discard/i.test(label(b)));
      if (discardBtn && typeof discardBtn.click === 'function') {
        discardBtn.click();
      }

      const alertText = [...document.querySelectorAll('[role="alert"], [class*="error" i]')].map(item=>item.innerText || item.textContent || '').join('\n');
      const failure = generationFailure(alertText);
      if (failure) throw failure;
      return false;
    },'submitted conversation',45000);
  }
  const mediaUrl = element => element.currentSrc || element.src || element.querySelector('source')?.src || '';
  function responseMedia(kind) {
    // Only generated assistant messages; never source uploads or the media library.
    const responses = [...document.querySelectorAll('[aria-label="Meta AI response"]')];
    const response = responses.at(-1);
    if (!response) return [];
    return [...response.querySelectorAll(kind === 'video' ? 'video' : 'img')]
      .filter(element => kind === 'video' || (element.naturalWidth >= 256 && element.naturalHeight >= 256))
      .map(element => ({element,url:mediaUrl(element)})).filter(item => item.url);
  }
  function prepareMetaVideoPrompt(prompt) {
    return String(prompt || '').split('\n').filter(line =>
      !/^\s*(?:MANDATORY VIDEO FORMAT:|MANDATORY TWO-SCENE EDIT:|OMNI 10-SECOND MULTI-SHOT OVERRIDE:|META 10-SECOND (?:THREE-SCENE|SINGLE-SCENE) PLAN:|This video must consist of|[-*]\s*Scene\s*\d+\s*\(|Subtle Slow Zoom In;)/i.test(line)
    ).join('\n').replace(/, including 2\.5s, 5s and 7\.5s when present/g, '');
  }
  function multipartVideoDirection(parts) {
    const duration = parts * 10;
    const timeline = Array.from({length: parts}, (_, i) => `Part ${i + 1}: ${i * 10}–${(i + 1) * 10}s`).join('; ');
    return `HIGHEST PRIORITY — COMPLETE ${duration}-SECOND VIDEO: Generate exactly ${parts} distinct consecutive 10-second parts, then join them in order and attach ONE downloadable ${duration}-second vertical 9:16 MP4 in this chat. Use H.264 for browser playback if available. Timeline: ${timeline}. Use the requested story beats in order; when no timeline is supplied, start with the product introduction, use the middle for its natural demonstration, and finish with a clear product view. Use the same exact product, fictional presenter (if requested), outfit, location, lighting and audio style across the entire video. Match the action and framing across joins. Never repeat the opening or reuse footage to fill time. Preserve the selected audio mode and make any narration progress without repeated lines. The 10-second references below describe individual parts; the final video must be ${duration} seconds. Return the actual joined file.`;
  }
  async function selectThinkingMode() {
    const mode = document.querySelector('button[data-testid="composer-mode-dropdown-button"]');
    if (!mode || /thinking/i.test(label(mode))) return;
    await click(mode);
    const thinking = await waitFor(() => document.querySelector('[data-testid="composer-mode-option-think_hard"]'), 'Thinking mode');
    await click(thinking);
    await waitFor(() => /thinking/i.test(label(document.querySelector('button[data-testid="composer-mode-dropdown-button"]') || mode)), 'Thinking mode selection');
  }
  function metaLocationDirection(prompt, kind = 'video') {
    const source = String(prompt || '');
    const selected = source.match(/(?:SELECTED BACKGROUND LOCATION LOCK|SHOE WORN-ON-FEET SELECTED LOCATION LOCK): Use exactly the user's selected ([^\n.]+?)(?: background|\.|$)/i);
    const video = source.match(/^Location setting: Place the product in a brand new, realistic (.+?) background location\./m);
    const location = selected?.[1] || video?.[1];
    if (!location) return 'META SCENE LOCATION PRIORITY: Place the product in a brand new, realistic setting suitable for this product. Use the uploaded image ONLY to preserve the product itself; completely discard and replace its original background, room, setting, and location from the reference photo.';
    if (kind === 'image') {
      const livingRoom = /living room|ห้องนั่งเล่น/i.test(location)
        ? ' Furnish it as an attractive lived-in home: a sofa, coffee table, textured rug, curtains, a plant, and soft window light, with natural depth and realistic scale. No blank wall, empty showroom, trade-show banner, poster, or source-photo graphics.'
        : '';
      return `META IMAGE LOCATION PRIORITY: Create a NEW photograph in a clearly recognizable ${location}.${livingRoom} Use the uploaded image ONLY to preserve the product itself; replace its original background, people, signage, and composition. Keep the product accurate and prominent.`;
    }
    if (/FASHION SELFIE MODE/i.test(source)) return `META SELFIE LOCATION PRIORITY: Place the new model in a clearly recognizable ${location} setting that is visibly different from the reference photo's room, background, furniture, and composition. Keep this new setting stable throughout the video. Preserve the selected selfie framing and phone-over-face pose in every scene; do not cut to product-only shots.`;
    return `META SCENE LOCATION PRIORITY: Every scene and every camera framing must remain in the same clearly recognizable ${location} setting. Show enough room context in the wide shot to identify this location. Keep its furniture, architecture, and lighting consistent in medium and close shots. Do not move to a studio, shop, cafe, or another room. Use the uploaded image ONLY to preserve the product itself; completely discard and replace its original background, room, and location from the reference photo.`;
  }
  async function generate(kind, prompt, references, parts = 1) {
    const duration = kind === 'video' ? parts * 10 : 0;
    const multipart = kind === 'video' && parts > 1 ? multipartVideoDirection(parts) : '';
    if (multipart) await selectThinkingMode();
    await report(`uploading-${kind}-reference`);
    await upload(references);
    const existing = new Set(responseMedia(kind).map(item=>item.url));
    const oldResponses = new Set(document.querySelectorAll('[aria-label="Meta AI response"]'));
    const multiScene = !/META 10-SECOND SINGLE-SCENE(?: FASHION (?:SELFIE|LOWER-BODY))? PLAN:/.test(prompt);
    const phoneFilmInstallation = kind === 'video' && /META PHONE FILM INSTALLATION:/.test(prompt);
    const isFashionSelfie = /FASHION SELFIE MODE/i.test(prompt);
    const isPlusSize = /(?:สาวอวบ|คนอ้วน|คนตัวใหญ่|คนเจ้าเนื้อ|เจ้าเนื้อ|ไซส์ใหญ่|ไซส์จัมโบ้|จัมโบ้|บิ๊กไซส์|plus[\s-]*size|plussize|big\s*size|curvy|chubby|\b(?:2|3|4|5|6|7|8|9|10)\s*xl\b|\bxxl\b|\bxxxl\b|\bxxxxl\b)/i.test(prompt);
    const selfieIdentity = isPlusSize ? 'hairstyle, hair color, and underlying facial identity' : 'hairstyle, hair color, body appearance, and underlying facial identity';
    const selfieModel = /fictional (?:plus-size )?adult Thai male fashion model/i.test(prompt) ? 'Thai male fashion model' : 'Thai female fashion model';
    const selfieHair = 'THAI MODEL STYLING: Use a beautiful fictional adult Thai fashion model with a fresh, naturally radiant look, soft clean makeup, healthy realistic skin texture, and elegant everyday styling. Keep the face covered by the selfie phone. Use natural dark jet-black hair in a hairstyle clearly different from the reference person. No blonde, golden, honey-blonde, bleached, or brightly dyed hair.';
    const isPhoneCase = !isFashionSelfie && /(?:phone|mobile)?\s*(?:case|cover|casing)|เคส|magsafe/i.test(prompt);
    const phoneCaseLogoLock = isPhoneCase
      ? ' META PHONE CASE ZERO APPLE LOGO MANDATE (HIGHEST PRIORITY IN ALL CASES): Absolutely NEVER generate, render, display, or include the Apple logo (apple silhouette, bitten apple icon, or Apple text), Samsung logo, or any smartphone brand logo anywhere in the output (not on the phone case, not on the phone body, not inside the camera cutout, not in the magnetic ring, not on the screen). FOR CLEAR/TRANSPARENT CASES (เคสใส/โปร่งแสง เห็นตัวเครื่องเงาๆ ห้ามมีโลโก้เด็ดขาด): When the case is transparent or clear and the glossy glass/metal phone body is visible underneath, that glossy phone back MUST be completely 100% BLANK, SMOOTH, AND UNBRANDED with ABSOLUTELY NO APPLE LOGO. Keep the phone body and case completely generic and 100% unbranded in all shots. If an Apple logo is visible in the reference image or through a clear case/cutout, completely REMOVE and ERASE it, rendering that area as clean, plain unbranded material.'
      : '';
    const isHandsOnly = /META FIRST-PERSON POV HANDS-ONLY OVERRIDE/i.test(prompt);
    const direction = kind === 'image'
      ? `${isFashionSelfie ? `FASHION SELFIE IMAGE PRIORITY: Create one new fictional adult ${selfieModel} wearing the exact reference garment and holding a phone over the face. Give the model a clearly different ${selfieIdentity} from any person in the reference. ${selfieHair} Use a visibly different room and background; copy only the garment, not the source person or setting. ` : ''}Generate an actual image using the uploaded product reference. Output a vertical 9:16 image, not a written description. CRITICAL COLOR FIDELITY LOCK: Strictly match the exact color, shade, hue, and saturation of the product from the uploaded reference image pixel-for-pixel. Do NOT alter, shift, tint, or recolor the product under any scene lighting.${phoneCaseLogoLock}`
      : phoneFilmInstallation
        ? 'Generate the actual phone film installation VIDEO described below. Show the physical application and reserve the final two seconds for a steady view of the fully installed film. No presenter, package showcase, or spoken review.'
      : isFashionSelfie
        ? `Generate an actual VIDEO from the uploaded product image. Mandatory: vertical portrait 9:16, exactly 10 seconds. Output the video file, not a description or GIF. FASHION SELFIE HIGHEST PRIORITY: Show one NEW fictional adult ${selfieModel} WEARING the exact reference garment and standing in a natural outfit selfie pose throughout the video. The model must have a clearly different ${selfieIdentity} from every person in the reference image. ${selfieHair} The model holds a smartphone over the face in every frame; keep the phone, model, and worn garment visible. Never show the model holding folded clothing, presenting the garment by hand, or speaking to the camera. ${multiScene ? 'Use three clean cuts while preserving the same new model, phone-over-face pose, outfit, and selected framing in all three scenes.' : 'Use one continuous shot with the same new model, phone-over-face pose, outfit, and selected framing.'} Create a visibly different room and background from the reference; keep that new setting stable throughout. The uploaded image supplies ONLY the garment design: preserve its exact type, silhouette, fabric, cut, colors, pattern, print, and visible details. Do not copy the reference person, pose, hair, face, or location. Any narration is off-screen only; music-only mode has no speech.`
        : isHandsOnly
          ? `Generate an actual VIDEO from the uploaded product image. Mandatory: vertical portrait 9:16, exactly 10 seconds. Output the video file. FIRST-PERSON POV HANDS-ONLY MANDATE: In every shot, show only the product and natural hands with partial forearms entering from the frame edges. No faces, bodies, other people, silhouettes, or human reflections. Use the reference only for the product. Preserve its exact color, material, size, shape, and printed artwork.${phoneCaseLogoLock} ${multiScene ? 'Use three level, front-facing POV shots with clean cuts: 0–3s WIDE establishing the product and setting; 3–6s MEDIUM showing the selected hand action; 6–10s CLOSE showing product details and ending on a steady hold.' : 'Use one continuous level, front-facing POV shot for all 10 seconds. Show the selected hand action and end on a steady hold.'} Keep the full product visible with comfortable margins and the same setting throughout. No rotation or invented hidden details. Follow the selected audio mode: any Thai narration is continuous off-screen voiceover; music-only has no speech.`
        : `Generate an actual VIDEO from the uploaded product image. Mandatory: vertical portrait 9:16, exactly 10 seconds. Output the video file, not a description or GIF. CRITICAL PRODUCT MATCH LOCK (สินค้าในคลิปต้องเหมือนรูปต้นฉบับ 100% ทุกเฟรม ทุกซีน): The uploaded image is the exact item to show, as if the same physical product were filmed on camera. In every frame and after every cut, keep its shape, proportions, parts, colors, fabric/material, print/pattern, logo, label text, and visible count identical to the reference. Never redesign, recolor, simplify, add or remove parts, invent text, or swap in a similar-looking product; do not tint, desaturate, or shift product colors under any lighting. Only the setting, presenter, and camera may change.${phoneCaseLogoLock} ${multiScene ? 'META SALES SHOT PRIORITY: Use three sequential full-frame front-facing scenes with clean cuts: 0–3s WIDE establishing shot showing the product with the presenter or selling environment; 3–6s MEDIUM shot emphasizing the product and natural demonstration; 6–10s CLOSE product shot showing the front label and material clearly, finishing on a steady sales hero hold with the presenter calmly completing the spoken review before the final silent hold. Keep the camera level and front-facing in all three scenes. No oblique or three-quarter angles, orbit, side views, or product rotation. Change framing by moving the camera closer, never by enlarging the product.' : 'META SINGLE-SCENE PRIORITY: Use one continuous front-facing shot for the full 10 seconds with no cuts or scene changes. Start with a clear product view, show one natural product action through gentle camera or presenter movement, and finish on a steady hero hold with the presenter calmly completing the spoken review before the final silent hold.'} Keep the entire product visible with comfortable margins; no extreme macro or cropped packaging. Preserve product shape, printed artwork, physical size, and contents. Maintain consistency for the newly generated presenter and newly generated setting across scenes, but NEVER copy or match the face, person, background, room, or location from the reference photo. Keep true scale against hands and body. Do not reveal an unseen back or invent hidden details. No collage or split screen. Continue one narration smoothly without restarting. META PRESENTER AGE: When the prompt shows an adult woman or man and specifies no different age, cast a newly generated fictional Thai adult aged 20–25 with a visibly youthful face. Do not copy the age, face, or identity of any person visible in a product reference image; that image is for the product only. Keep the same young presenter in every scene. META THAI SPEECH: Compose the spoken line in natural Thai script first. Use a fluent native Thai voice with correct tones, vowels and final consonants, complete word endings, and brief natural pauses at phrase boundaries. Speak evenly at a comfortable conversational pace; keep every word intelligible and the voice clearly above music. No slurring, swallowed or rushed syllables, echo, or English-accented Thai. When a visible adult presenter is selected, that presenter speaks the Thai review on camera in their own voice; never use a detached background narrator for that presenter. Keep voiceover only for product-only, hands-only, covered-face, or explicitly selected voiceover modes. Music-only mode has no speech. This selected scene plan overrides conflicting shot-count and camera directions; retain the selected product action and audio mode.`;
    const content = kind === 'video' ? prepareMetaVideoPrompt(prompt) : prompt;
    const isProductOnly = /META PRODUCT-ONLY OVERRIDE/i.test(prompt);
    const presenterDelivery = phoneFilmInstallation ? '' : isFashionSelfie
      ? `FASHION SELFIE PRESENTER: Keep the same NEW adult model wearing the exact reference garment and holding the phone over the face in every frame. The model's hair, underlying face, and appearance must not match anyone in the source image. The new location must not resemble the source background. The model never holds the garment in hand and never speaks on camera; narration, if enabled, is off-screen.`
      : isHandsOnly
      ? 'FIRST-PERSON POV HANDS-ONLY MANDATE (HIGHEST PRIORITY): Strictly first-person POV only. Show only natural hands and forearms holding, touching, or demonstrating the product. Absolutely DO NOT generate, show, or include any face, head, eyes, nose, mouth, body, or on-screen presenter. If speech is enabled, use off-screen Thai voiceover only.'
      : isProductOnly
        ? 'PRODUCT-ONLY MANDATE (HIGHEST PRIORITY): Show only the product resting or showcased with camera movement. Absolutely DO NOT generate, show, or include any face, head, body, hands, or presenter. The Thai review is delivered entirely as an off-screen voiceover.'
        : kind === 'image'
          ? `PRESENTER REPLACEMENT: If a presenter is requested, create a new fictional Thai presenter with a different face and a calm, natural friendly expression. The uploaded person is only a product-scale reference; do not copy their face, pose, or expression. Strictly generate a completely new, distinct fictional face and a new, non-matching background setting.${isPlusSize ? ' PLUS-SIZE BODY: Model must have a realistic plus-size / curvy body proportion (สาวอวบ/คนตัวใหญ่) to fit the plus-size garment.' : ''}`
          : `PRESENTER DELIVERY: Speak the Thai review normally on camera in a clear, friendly voice. A natural smile is fine. Do not laugh or add laughter at the end. FACE & LOCATION REPLACEMENT (CRITICAL): If a presenter is shown, use a brand-new fictional Thai presenter with a completely different face and hairstyle from any person in the reference photo; absolutely never copy, clone, animate, or resemble the source person's face. The setting must also be a completely new location; never copy, clone, or reuse the background scene, room, or location from the reference photo.${isPlusSize ? ' PLUS-SIZE BODY: Model must have a realistic plus-size / curvy body proportion (สาวอวบ/คนตัวใหญ่) to fit the plus-size garment.' : ''}`;
    const plusSizeBody = isPlusSize && !isHandsOnly && !isProductOnly && !phoneFilmInstallation
      ? 'PLUS-SIZE CASTING (HIGHEST PRIORITY): If this shot calls for a model, cast a visibly large, full-bodied plus-size Thai adult. For a female presenter, cast a beautiful Thai woman with naturally Thai facial features and soft, polished makeup. Keep her face original and respect any selected face-covering or crop. Match the fullness of a plus-size reference model from the neck down, including a rounded abdomen, broad waist, full hips and thighs, and thick upper arms where visible. The garment must fit this larger body at its original scale. Do not slim the body, give it a narrow waist, or put oversized clothing on a slim model. Preserve this build in every shot. Body proportions can match the reference; the face, hair, and identity must be new. Follow the selected framing.'
      : '';
    const opening = kind === 'video' ? [direction, plusSizeBody] : [plusSizeBody, direction];
    const exportReminder = multipart ? `FINAL DELIVERY: Attach the actual joined ${duration}-second MP4 as one file.` : '';
    await enterPrompt([multipart, ...opening, metaLocationDirection(prompt, kind), presenterDelivery, content, exportReminder].filter(Boolean).join('\n').trim());
    await report(`generating-${kind}`);
    let redoAttempts = 0;
    let lastFailedResponse = null;
    const rejectedVideos = new Map();
    let completedAt;
    const output = await waitFor(async ()=>{
      const response = [...document.querySelectorAll('[aria-label="Meta AI response"]')].filter(item=>!oldResponses.has(item)).at(-1);
      const text = [
        response?.innerText || '',
        ...[...document.querySelectorAll('[role="alert"], [class*="error" i]')].map(item=>item.innerText || item.textContent || '')
      ].join('\n');

      if (/something went wrong/i.test(text) && redoAttempts < 2 && response && response !== lastFailedResponse) {
        lastFailedResponse = response;
        redoAttempts++;
        await report(`redo-attempt-${redoAttempts}-${kind}`);
        await pause(1200);
        await enterPrompt("ทำใหม่");
        await pause(1500);
        return null;
      }

      const failure = generationFailure(text);
      if (failure && (!multipart || failure.code !== 'META_UNAVAILABLE')) throw failure;
      if (!response) return null;
      const media = responseMedia(kind).filter(item=>!existing.has(item.url));
      if (!multipart) return media[0];
      for (const { element, url } of media.toReversed()) {
        if (rejectedVideos.has(url)) continue;
        if (element.readyState >= 1 && Math.abs(element.duration - duration) > .3) {
          rejectedVideos.set(url, `Meta AI returned ${element.duration.toFixed(2)}s; required ${duration}s`);
          continue;
        }
        if (url.startsWith('https:')) {
          const result = await chrome.runtime.sendMessage({ type: 'META_FETCH_JOINED_VIDEO', payload: { url, duration } });
          check();
          if (result?.ok && result.videoUrl) return { videoUrl: result.videoUrl };
          rejectedVideos.set(url, result?.error || 'Could not retrieve Meta AI video');
        } else if (element.readyState >= 1) {
          return { element, url };
        }
      }
      if (response.querySelector?.('[aria-label="Like this response"]')) {
        completedAt ??= Date.now();
        if (Date.now() - completedAt > 5000) {
          const error = [...rejectedVideos.values()].at(-1) || `Meta AI finished without attaching one joined ${duration}-second MP4`;
          throw failure || Object.assign(new Error(error), { code: 'META_JOINED_VIDEO_MISSING', retryable: false });
        }
      }
      return null;
    }, multipart ? `one joined ${duration}-second video` : `generated ${kind}`, Math.max(1, parts)*10*60*1000);
    await report(`retrieving-${kind}`);
    if (output.videoUrl) return output.videoUrl;
    const fetched = await fetch(output.url);
    if (!fetched.ok) throw new Error(`Meta AI media download failed (${fetched.status})`);
    const blob = await fetched.blob();
    if (!blob.type.startsWith(`${kind}/`)) throw new Error(`Meta AI did not return a ${kind} file`);
    if (kind === 'video') {
      const video = output.element;
      await waitFor(()=>video.readyState>=1,'video metadata',30000);
      if (!Number.isFinite(video.duration) || Math.abs(video.duration-duration)>.3 || Math.abs(video.videoWidth/video.videoHeight-9/16)>.03) {
        throw new Error(`Meta AI returned ${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(2)}s; required vertical 9:16, ${duration}s`);
      }
    }
    return blobData(blob);
  }
  async function newChat() {
    await waitFor(composer, 'New chat composer', 60000);
    // If already on the clean home page with no conversation messages, don't trigger unnecessary navigation
    if (location.pathname === '/' && !document.querySelector('[aria-label="Conversation messages"]')) {
      const currentComposer = composer();
      if (currentComposer && !currentComposer.textContent?.trim()) {
        return;
      }
    }
    const findNewChatLink = () => [...document.querySelectorAll('a')].find(link => visible(link) && (/^new chat/i.test(link.textContent.trim()) || link.getAttribute('aria-label')?.includes('New chat')) && new URL(link.href, location.href).pathname === '/');
    const link = findNewChatLink();
    if (link) {
      await click(link);
    } else {
      location.href = 'https://www.meta.ai/';
    }
    await waitFor(async () => {
      // Check if "Discard prompt?" confirmation dialog popped up
      const discardBtn = button(/^discard$/i) || [...document.querySelectorAll('button')].find(b => visible(b) && !b.disabled && /discard/i.test(label(b)));
      if (discardBtn) {
        discardBtn.click();
        await pause(500);
      }
      return composer() && (!document.querySelector('[aria-label="Conversation messages"]') || location.pathname === '/');
    }, 'empty New chat', 15000).catch(() => {
      if (location.pathname !== '/') location.href = 'https://www.meta.ai/';
    });
  }
  async function generateWithRetry(kind, prompt, references, parts = 1) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await generate(kind,prompt,references,parts);
      } catch (error) {
        check();
        if (!error.retryable || attempt === 1) throw error;
        await report(`retrying-${kind}`);
        await pause(3000);
        check();
        await newChat();
      }
    }
  }
  async function run(payload) {
    let imgUrl = '';
    try {
      await newChat();
      const prompts = typeof payload.prompt === 'string' ? {imagePrompt:payload.prompt,videoPrompt:payload.prompt} : payload.prompt;
      if (payload.phase !== 'video') imgUrl = await generateWithRetry('image',prompts.imagePrompt,payload.references || []);
      const videoReferences = imgUrl ? [imgUrl] : (payload.references || []);
      const parts = [2, 3, 4].includes(payload.options?.metaVideoParts) ? payload.options.metaVideoParts : 1;
      const resultUrl = payload.phase === 'image' ? imgUrl : await generateWithRetry('video',prompts.videoPrompt,videoReferences,parts);
      await chrome.storage.local.set({[`metaJob:${payload.jobId}`]:{result:{ok:true,resultUrl,imgUrl,provider:'meta-ai'}}});
    } catch (error) {
      await chrome.storage.local.set({[`metaJob:${payload.jobId}`]:{result:{ok:false,error:error.message,code:error.code,retryable:error.retryable,imgUrl,pageUrl:location.href}}});
    } finally {
      running = false;
      await chrome.runtime.sendMessage({type:'META_DONE'}).catch(()=>{});
    }
  }
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{
    if (message.type === 'META_READY') {
      reply({ready: document.readyState === 'complete' && Boolean(composer())});
    }
    if (message.type === 'META_STOP') {stopped=true;reply({stopped:true});}
    if (message.type === 'META_RUN') {
      if (running) {reply({accepted:false,error:'Meta AI is already generating'});return;}
      running=true;stopped=false;activeJobId=message.payload.jobId;reply({accepted:true});
      run(message.payload);
    }
  });
})();
