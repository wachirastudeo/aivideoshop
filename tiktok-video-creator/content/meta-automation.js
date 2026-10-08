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
    let input = document.querySelector('input[type="file"]');
    if (!input) {
      const addBtn = button(/^Add attachment$/i);
      if (addBtn) {
        addBtn.click();
        input = await waitFor(()=>document.querySelector('input[type="file"]'),'upload file input', 5000).catch(()=>null);
      }
    }
    if (!input) {
      input = await waitFor(()=>document.querySelector('input[type="file"]'),'upload file input');
    }
    const transfer = new DataTransfer();
    for (const [index,dataUrl] of dataUrls.entries()) {
      const blob = await (await fetch(dataUrl)).blob();
      if (!blob.type.startsWith('image/')) throw new Error('Meta AI reference must be an image');
      const extension = {'image/png':'png','image/webp':'webp','image/gif':'gif'}[blob.type] || 'jpg';
      transfer.items.add(new File([blob],`product-reference-${index+1}.${extension}`,{type:blob.type}));
    }
    input.files = transfer.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
    await waitFor(()=>button(/^Remove image$/i),'uploaded reference image',60000);
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
  async function generate(kind, prompt, references) {
    await report(`uploading-${kind}-reference`);
    await upload(references);
    const existing = new Set(responseMedia(kind).map(item=>item.url));
    const oldResponses = new Set(document.querySelectorAll('[aria-label="Meta AI response"]'));
    const multiScene = !/META 10-SECOND SINGLE-SCENE PLAN:/.test(prompt);
    const direction = kind === 'image'
      ? 'Generate an actual image using the uploaded product reference. Output a vertical 9:16 image, not a written description. CRITICAL COLOR FIDELITY LOCK: Strictly match the exact color, shade, hue, and saturation of the product from the uploaded reference image pixel-for-pixel. Do NOT alter, shift, tint, or recolor the product under any scene lighting.'
      : `Generate an actual VIDEO from the uploaded product image. Mandatory: vertical portrait 9:16, exactly 10 seconds. Output the video file, not a description or GIF. CRITICAL COLOR FIDELITY LOCK: Strictly preserve the exact product color, fabric/material hue, shade, and printed artwork from the uploaded reference image pixel-for-pixel; do not tint, desaturate, or shift product colors under any lighting. ${multiScene ? 'META SALES SHOT PRIORITY: Use three sequential full-frame front-facing scenes with clean cuts: 0–3s WIDE establishing shot showing the product with the presenter or selling environment; 3–6s MEDIUM shot emphasizing the product and natural demonstration; 6–10s CLOSE product shot showing the front label and material clearly, finishing on a steady sales hero hold. Keep the camera level and front-facing in all three scenes. No oblique or three-quarter angles, orbit, side views, or product rotation. Change framing by moving the camera closer, never by enlarging the product.' : 'META SINGLE-SCENE PRIORITY: Use one continuous front-facing shot for the full 10 seconds with no cuts or scene changes. Start with a clear product view, show one natural product action through gentle camera or presenter movement, and finish on a steady hero hold.'} Keep the entire product visible with comfortable margins; no extreme macro or cropped packaging. Preserve product shape, printed artwork, physical size, contents, presenter, and setting. Keep true scale against hands and body; a 200g pouch stays a compact one-hand retail pouch, never a giant sack. Do not reveal an unseen back or invent hidden details. No collage or split screen. Continue one narration smoothly without restarting. META PRESENTER AGE: When the prompt shows an adult woman or man and specifies no different age, cast a newly generated fictional Thai adult aged 20–25 with a visibly youthful face. Do not copy the age, face, or identity of any person visible in a product reference image; that image is for the product only. Keep the same young presenter in every scene. META THAI SPEECH: All spoken dialogue and voiceover must be in natural native Thai only, with Thai pronunciation throughout; no English speech or English dubbing. Follow the selected music-only mode if it requests no speech. This selected scene plan overrides conflicting shot-count and camera directions; retain the selected product action and audio mode.`;
    const content = kind === 'video' ? prepareMetaVideoPrompt(prompt) : prompt;
    await enterPrompt(`${direction}\n${content}`);
    await report(`generating-${kind}`);
    let redoAttempts = 0;
    let lastFailedResponse = null;
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
      if (failure) throw failure;
      if (!response) return null;
      return responseMedia(kind).find(item=>!existing.has(item.url));
    },`generated ${kind}`,10*60*1000);
    await report(`retrieving-${kind}`);
    const fetched = await fetch(output.url);
    if (!fetched.ok) throw new Error(`Meta AI media download failed (${fetched.status})`);
    const blob = await fetched.blob();
    if (!blob.type.startsWith(`${kind}/`)) throw new Error(`Meta AI did not return a ${kind} file`);
    if (kind === 'video') {
      const video = output.element;
      await waitFor(()=>video.readyState>=1,'video metadata',30000);
      if (Math.abs(video.duration-10)>.3 || Math.abs(video.videoWidth/video.videoHeight-9/16)>.03) {
        throw new Error(`Meta AI returned ${video.videoWidth}x${video.videoHeight}, ${video.duration.toFixed(2)}s; required vertical 9:16, 10s`);
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
  async function generateWithRetry(kind, prompt, references) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await generate(kind,prompt,references);
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
      const videoReferences = imgUrl ? [imgUrl] : (payload.references?.length ? [payload.references[0]] : []);
      const resultUrl = payload.phase === 'image' ? imgUrl : await generateWithRetry('video',prompts.videoPrompt,videoReferences);
      await chrome.storage.local.set({[`metaJob:${payload.jobId}`]:{result:{ok:true,resultUrl,imgUrl,provider:'meta-ai'}}});
    } catch (error) {
      await chrome.storage.local.set({[`metaJob:${payload.jobId}`]:{result:{ok:false,error:error.message,code:error.code,retryable:error.retryable,imgUrl,pageUrl:location.href}}});
    } finally {
      running = false;
      await chrome.runtime.sendMessage({type:'META_DONE'}).catch(()=>{});
    }
  }
  chrome.runtime.onMessage.addListener((message,sender,reply)=>{
    if (message.type === 'META_STOP') {stopped=true;reply({stopped:true});}
    if (message.type === 'META_RUN') {
      if (running) {reply({accepted:false,error:'Meta AI is already generating'});return;}
      running=true;stopped=false;activeJobId=message.payload.jobId;reply({accepted:true});
      run(message.payload);
    }
  });
})();
