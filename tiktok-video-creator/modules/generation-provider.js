export function bindGenerationProvider(selectId, initialProvider, flowControlIds, onError = console.error) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.value = initialProvider === "meta-ai" ? "meta-ai" : "google-flow";
  function updateControls() {
    const meta = select.value === "meta-ai";
    for (const id of flowControlIds) {
      const control = document.getElementById(id);
      const field = control?.closest(".field");
      if (field) field.hidden = meta;
      if (control) control.disabled = meta;
    }
    const help = document.getElementById(`${selectId}-help`);
    if (help) help.hidden = !meta;
    const multiSceneField = document.getElementById("meta-multi-scene-field");
    if (multiSceneField) multiSceneField.hidden = !meta;
  }
  updateControls();
  let saving = Promise.resolve();
  select.addEventListener("change", () => {
    updateControls();
    const provider = select.value;
    saving = saving.catch(() => {}).then(async () => {
      const { settings = {} } = await chrome.storage.sync.get("settings");
      await chrome.storage.sync.set({ settings: { ...settings, generationProvider: provider } });
    });
    saving.catch(onError);
  });
}
