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
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch(e) {}
          if (window.indexedDB && indexedDB.databases) {
            indexedDB.databases().then(dbs => {
              dbs.forEach(db => {
                try { indexedDB.deleteDatabase(db.name); } catch(e){}
              });
            });
          }
          location.reload();
        }
      });
    }
  });
});
