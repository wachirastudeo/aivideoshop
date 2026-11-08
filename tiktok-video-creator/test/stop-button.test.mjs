import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../tabs/tab-video.js', import.meta.url), 'utf8');
const listener = source.slice(source.lastIndexOf('chrome.storage.onChanged.addListener('));

test('Stop stays visible while a local batch crosses a gap between active tabs', async () => {
  let onChanged;
  const visible = [];
  const chrome = { storage: {
    onChanged: { addListener: handler => { onChanged = handler; } },
    local: { get: async () => ({}) },
  } };
  const state = new Function('chrome', 'setBatchButtons', `let isProcessing = true; let batchProcessing = true; let activeJobRefresh = 0; ${listener}; return {getProcessing: () => isProcessing, endBatch: () => {batchProcessing = false;}};`)(chrome, running => visible.push(running));
  onChanged({ activeFlowTabId: { oldValue: 123 } }, 'local');
  await Promise.resolve();
  assert.equal(state.getProcessing(), true);
  assert.deepEqual(visible, []);

  state.endBatch();
  chrome.storage.local.get = async () => ({ activeMetaTabId: 456 });
  onChanged({ activeMetaTabId: { newValue: 456 } }, 'local');
  await Promise.resolve();
  assert.deepEqual(visible, [true]);

  chrome.storage.local.get = async () => ({});
  onChanged({ activeMetaTabId: { oldValue: 456 } }, 'local');
  await Promise.resolve();
  assert.deepEqual(visible, [true, false]);
});
