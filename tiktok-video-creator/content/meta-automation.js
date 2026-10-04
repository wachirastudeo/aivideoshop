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
      const result = find();
      if (result) return result;
      await pause(400);
    }
    throw new Error(`Meta AI: timed out waiting for ${description}`);
  }
  async function click(element) {
    check();
    element.scrollIntoView({block:'center'});
    const rect = element.getBoundingClientRect();
    const response = await chrome.runtime.sendMessage({type:'META_CLICK',payload:{x:rect.x+rect.width/2,y:rect.y+rect.height/2}});
    if (!response?.ok) throw new Error(response?.error || 'Meta AI click failed');
  }
  const blobData = blob => new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read generated Meta AI media'));
    reader.readAsDataURL(blob);
  });
  async function upload(dataUrls) {
    if (!dataUrls.length) return;
    await click(await waitFor(()=>button(/^Add attachment$/i),'Add attachment button'));
    const input = await waitFor(()=>document.querySelector('input[type="file"]'),'upload file input');
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
    const previousLinks = new Set(conversationLinks().map(link=>link.href));
    const editor = await waitFor(composer,'New chat composer');
    editor.focus();
    // Lexical uses paste to preserve uploaded image nodes in the composer.
    const transfer = new DataTransfer();
    transfer.setData('text/plain',text);
    editor.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:transfer}));
    await pause(500);
    if (!editor.textContent.includes(text.slice(0,80))) {
      const response = await chrome.runtime.sendMessage({type:'META_INSERT_TEXT',payload:{text,clear:false}});
      if (!response?.ok) throw new Error(response?.error || 'Could not enter Meta AI prompt');
    }
    await waitFor(()=>composer()?.textContent.includes(text.slice(0,80)),'prompt insertion');
    await click(await waitFor(()=>button(/^Send$/i),'Send button'));
    // Meta can save a submitted chat while leaving the home composer visible.
    // Follow only this submission's newly created history link; never resubmit.
    let openedHistory = false;
    await waitFor(()=>{
      const message = [...document.querySelectorAll('[aria-label="Your message"]')].at(-1);
      if (location.pathname.startsWith('/prompt/') && message?.textContent.includes(text.slice(0,80))) return true;
      if (!openedHistory) {
        const link = conversationLinks().find(item=>!previousLinks.has(item.href) && label(item).includes(text.slice(0,80)));
        if (link) { openedHistory = true; link.click(); }
      }
      const alertText = [...document.querySelectorAll('[role="alert"]')].map(item=>item.innerText).join('\n');
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
  async function generate(kind, prompt, references) {
    await report(`uploading-${kind}-reference`);
    await upload(references);
    const existing = new Set(responseMedia(kind).map(item=>item.url));
    const oldResponses = new Set(document.querySelectorAll('[aria-label="Meta AI response"]'));
    const direction = kind === 'image'
      ? 'Generate an actual image using the uploaded product reference. Output a vertical 9:16 image, not a written description.'
      : 'Generate an actual VIDEO from the uploaded product image. Mandatory: vertical portrait 9:16, exactly 10 seconds. Output the video file, not a description or GIF. META MULTI-ANGLE CAMERA PRIORITY: Use four sequential full-frame shots with clean cuts: 0–2.5s front view; 2.5–5s gentle left three-quarter view; 5–7.5s gentle right three-quarter view; 7.5–10s front hero view with a subtle camera push-in. Keep the entire product visible with comfortable space around it in every shot. Change camera angle, never product shape, printed artwork, physical size, contents, presenter, or setting. Keep true scale against hands and body; a 200g pouch stays a compact one-hand retail pouch, never a giant sack. Keep the reference-facing label readable; do not reveal an unseen back or invent hidden details. No strong zoom-in, macro shots, extreme close-ups, collage, split screen, or cropping. Continue the same narration smoothly across cuts without restarting. This four-shot camera plan overrides conflicting single-shot, static-camera, scene-count, zoom, or close-up directions; retain the selected product action and audio mode.';
    await enterPrompt(`${direction}\n${prompt}\n${direction}`);
    await report(`generating-${kind}`);
    const output = await waitFor(()=>{
      const response = [...document.querySelectorAll('[aria-label="Meta AI response"]')].filter(item=>!oldResponses.has(item)).at(-1);
      const text = [response?.innerText || '', ...[...document.querySelectorAll('[role="alert"]')].map(item=>item.innerText)].join('\n');
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
    await waitFor(composer,'New chat composer',60000);
    const link = await waitFor(()=>[...document.querySelectorAll('a')].find(link=>visible(link)&&/^New chat/.test(link.textContent.trim()) && new URL(link.href).pathname === '/'),'New chat link');
    await click(link);
    await waitFor(()=>composer()&&!document.querySelector('[aria-label="Conversation messages"]'),'empty New chat');
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
      const resultUrl = payload.phase === 'image' ? imgUrl : await generateWithRetry('video',prompts.videoPrompt,imgUrl?[imgUrl]:(payload.references || []));
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
