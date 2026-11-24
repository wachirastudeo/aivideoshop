export function flowClipLengths(model) {
  return model === 'omni-flash' ? [8, 10] : [8];
}

export function resolveFlowClipLength(model, requested) {
  const lengths = flowClipLengths(model);
  return lengths.includes(Number(requested)) ? Number(requested) : 8;
}

export function flowStoryPartCount(value) {
  const count = Number(value);
  return [2, 3, 4].includes(count) ? count : 1;
}

export function flowReferenceMode(model, phase, parts, requested = 'frames') {
  if (phase === 'combined' || parts > 1 || model === 'veo-3.1-quality') return 'frames';
  return requested;
}

export function syncFlowLengthControls({ model, duration, parts, total }, requested) {
  const modelValue = document.getElementById(model)?.value;
  const durationSelect = document.getElementById(duration);
  if (!durationSelect) return;
  const value = requested ?? durationSelect.value;
  const lengths = flowClipLengths(modelValue);
  if (Array.from(durationSelect.options, option => Number(option.value)).join() !== lengths.join()) {
    durationSelect.replaceChildren(...lengths.map(seconds => new Option(`${seconds} seconds`, seconds)));
  }
  const seconds = resolveFlowClipLength(modelValue, value);
  durationSelect.value = String(seconds);
  const count = flowStoryPartCount(document.getElementById(parts)?.value);
  const totalLabel = document.getElementById(total);
  if (totalLabel) totalLabel.textContent = `${count} × ${seconds}s = ${count * seconds}s`;
}
