document.addEventListener('DOMContentLoaded', async () => {
  const toggle = document.getElementById('autoToggle');
  const manualBtn = document.getElementById('manualClearBtn');

  const { autoClearEnabled = true } = await chrome.storage.local.get("autoClearEnabled");
  toggle.checked = autoClearEnabled;

  toggle.addEventListener('change', async () => {
    await chrome.storage.local.set({ autoClearEnabled: toggle.checked });
  });

  manualBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.runtime.sendMessage({ action: "CLEAR_SITE_DATA" }, () => {
        chrome.tabs.reload(tab.id);
      });
    }
  });
});
