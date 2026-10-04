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
        sendMessage: async (id, message) => {events.push(['message', id, message]); return {accepted: true};},
      },
      scripting: {executeScript: async () => {}},
    };
    const open = new Function('chrome', 'flowStopVersion', 'assertRunNotStopped', 'waitForTabComplete', `${body};return openMetaAI;`)(chrome, 0, () => {}, async () => {});
    const result = await open({jobId: 'job-1', prompt: 'portrait'});
    assert.equal(result.tabId, existing.length ? 12 : 13);
    assert.equal(events.filter(event => event[0] === 'create').length, existing.length ? 0 : 1);
    if (existing.length) assert.deepEqual(events[0], ['update', 12, {active: true}]);
    assert.equal(events.at(-1)[2].type, 'META_RUN');
  });
}
