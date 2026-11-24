import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../background.js', import.meta.url), 'utf8');
const body = source.slice(source.indexOf('async function openMetaAI('), source.indexOf('\nasync function openGoogleFlow('));
for (const existing of [[], [{id: 11, active: false}, {id: 12, active: true}]]) {
  test(existing.length ? 'Meta reuses the active existing tab without navigation' : 'Meta creates a tab only when none exists', async () => {
    const events = [];
    const chrome = {
      tabs: {
        query: async () => existing,
        create: async options => {events.push(['create', options]); return {id: 13};},
        update: async (id, options) => {events.push(['update', id, options]);},
        get: async () => ({url: 'https://www.meta.ai/', status: 'complete'}),
        sendMessage: async (id, message, target) => {
          events.push(['message', id, message, target]);
          return message.type === 'META_READY' ? {ready: true} : {accepted: true};
        },
      },
      scripting: {executeScript: async () => [{documentId: 'ready-document'}]},
      storage: {local: {set: async values => {events.push(['storage', values]);}}},
    };
    const open = loadOpenMetaAI(chrome);
    const result = await open({jobId: 'job-1', prompt: 'portrait'});
    assert.equal(result.tabId, existing.length ? 12 : 13);
    assert.equal(events.filter(event => event[0] === 'create').length, existing.length ? 0 : 1);
    if (existing.length) assert.deepEqual(events[0], ['update', 12, {active: true}]);
    assert.deepEqual(events.at(-3), ['storage', {activeMetaTabId: result.tabId}]);
    assert.equal(events.at(-1)[2].type, 'META_RUN');
    assert.deepEqual(events.at(-1)[3], {documentId: 'ready-document'});
  });
}

test('the first click waits through a Meta startup reload before dispatching the original job once', async () => {
  const messages = [];
  let documentId = 'startup-document';
  let startupChecks = 0;
  const chrome = {
    tabs: {
      query: async () => [],
      create: async () => ({id: 13}),
      get: async () => ({url: 'https://www.meta.ai/', status: 'complete'}),
      sendMessage: async (_tabId, message, target) => {
        messages.push([message.type, target?.documentId]);
        if (message.type === 'META_READY' && documentId === 'startup-document') {
          if (startupChecks++ === 0) return {ready: false};
          documentId = 'reloaded-document';
          throw Error('Could not establish connection. Receiving end does not exist.');
        }
        if (message.type === 'META_READY') return {ready: true};
        if (target?.documentId !== 'reloaded-document') throw Error('Job dispatched before Meta was ready');
        assert.equal(message.payload.jobId, 'first-click');
        return {accepted: true};
      },
    },
    scripting: {executeScript: async () => [{documentId}]},
    storage: {local: {set: async () => {}, remove: async () => {}}},
  };

  const result = await loadOpenMetaAI(chrome)({jobId: 'first-click', phase: 'video', prompt: 'portrait'});
  assert.equal(result.started, true);
  assert.deepEqual(messages, [
    ['META_READY', 'startup-document'],
    ['META_READY', 'startup-document'],
    ['META_READY', 'reloaded-document'],
    ['META_RUN', 'reloaded-document'],
  ]);
});

function loadOpenMetaAI(chrome) {
  return new Function('chrome', 'flowStopVersion', 'assertRunNotStopped', 'delay', `${body};return openMetaAI;`)(chrome, 0, () => {}, async () => {});
}
