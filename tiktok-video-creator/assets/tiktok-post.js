let installed = false;

export async function onExecute(ctx = {}) {
  if (installed || globalThis.__cleanTiktokPostInstalled) return;

  installed = true;
  globalThis.__cleanTiktokPostInstalled = true;

  console.log("[TikTokPost] loader ready", ctx);

  await import(chrome.runtime.getURL("content/tiktok-studio-automation.js"));
}
