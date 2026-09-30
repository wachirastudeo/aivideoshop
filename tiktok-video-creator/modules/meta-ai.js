// Uses the same background/content-script job lifecycle as Google Flow.
export async function openMetaAI(phase, prompt, imageUrl = "", options = {}) {
  if (!["image", "video", "combined"].includes(phase)) throw new Error("Unsupported Meta AI generation phase");
  const jobId = crypto.randomUUID();
  const key = `metaJob:${jobId}`;
  let timer;
  let changed;
  let rejectJob;
  let tabId;
  const closedTabs = new Set();
  const onTabRemoved = id => {
    closedTabs.add(id);
    if (id === tabId) rejectJob(new Error("Meta AI tab was closed before generation completed"));
  };
  const done = new Promise((resolve, reject) => {
    rejectJob = reject;
    changed = (changes, area) => {
      if (area !== "local") return;
      if (changes.flowStopRequested?.newValue === true) reject(new Error("Meta AI generation stopped"));
      const result = changes[key]?.newValue?.result;
      if (result) result.ok ? resolve(result) : reject(Object.assign(new Error(result.error), {imgUrl:result.imgUrl || "",code:result.code,retryable:result.retryable,pageUrl:result.pageUrl}));
    };
    chrome.storage.onChanged.addListener(changed);
    timer = setTimeout(() => reject(new Error("Meta AI generation timed out after 15 minutes")), 15 * 60 * 1000);
  });
  // Observe early completion/failure while the background opens the tab.
  done.catch(() => {});
  chrome.tabs.onRemoved.addListener(onTabRemoved);
  try {
    const response = await chrome.runtime.sendMessage({type:"OPEN_META_AI", payload:{phase,prompt,imageUrl,options,jobId}});
    if (!response?.ok || !response?.started) {
      rejectJob(new Error(response?.error || "Meta AI did not start generation"));
    }
    tabId = response?.tabId;
    if (closedTabs.has(tabId)) rejectJob(new Error("Meta AI tab was closed before generation completed"));
    return await done;
  } finally {
    clearTimeout(timer);
    chrome.storage.onChanged.removeListener(changed);
    chrome.tabs.onRemoved.removeListener(onTabRemoved);
    await chrome.storage.local.remove(key);
  }
}
