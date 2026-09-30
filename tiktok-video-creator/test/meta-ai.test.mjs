import test from 'node:test';
import assert from 'node:assert/strict';
import { openGoogleFlow } from '../modules/google-flow.js';

function mockChrome(provider, outcome) {
  const data = {};
  const listeners = new Set();
  const removed = new Set();
  const calls = [];
  globalThis.chrome = {
    storage: {
      sync: { get: async () => ({ settings: { generationProvider: provider } }) },
      local: {
        set: async (values) => Object.assign(data, values),
        get: async (key) => ({ [key]: data[key] }),
        remove: async (key) => { delete data[key]; },
      },
      onChanged: { addListener: fn => listeners.add(fn), removeListener: fn => listeners.delete(fn) },
    },
    runtime: {
      getURL: path => `chrome-extension://test/${path}`,
      sendMessage: async (message) => {
        calls.push(message);
        if (message.type !== 'OPEN_META_AI') return {ok:false,error:'Flow reached'};
        setTimeout(() => {
          const key = `metaJob:${message.payload.jobId}`;
          if (outcome === 'stop') listeners.forEach(fn=>fn({flowStopRequested:{newValue:true}},'local'));
          else if (outcome === 'close') removed.forEach(fn=>fn(7));
          else listeners.forEach(fn=>fn({[key]:{newValue:{result:outcome}}},'local'));
        },0);
        return {ok:true,started:true,tabId:7};
      },
    },
    tabs: {
      onRemoved: { addListener: fn => removed.add(fn), removeListener: fn => removed.delete(fn) },
    },
  };
  return { data, listeners, removed, calls };
}

test('Meta AI selection routes image, video and combined jobs and cleans up', async () => {
  for (const phase of ['image', 'video', 'combined']) {
    const result = {ok:true, resultUrl:'data:video/mp4;base64,dGVzdA==', imgUrl:'data:image/png;base64,dGVzdA=='};
    const mock = mockChrome('meta-ai', result);
    assert.deepEqual(await openGoogleFlow(phase, 'prompt'), result);
    assert.equal(mock.calls[0].type, 'OPEN_META_AI');
    assert.equal(mock.calls[0].payload.phase, phase);
    assert.deepEqual(mock.data, {});
    assert.equal(mock.listeners.size, 0);
    assert.equal(mock.removed.size, 0);
  }
});
test('closing the Meta tab rejects promptly and removes both listeners', async () => {
  const mock = mockChrome('meta-ai', 'close');
  await assert.rejects(openGoogleFlow('video', 'prompt'), /tab was closed/);
  assert.equal(mock.listeners.size, 0);
  assert.equal(mock.removed.size, 0);
  assert.deepEqual(mock.data, {});
});
test('Meta AI stop and account refusal reject and clean up', async () => {
  for (const outcome of ['stop', {ok:false,error:'Video generation unavailable'}]) {
    const mock = mockChrome('meta-ai', outcome);
    await assert.rejects(openGoogleFlow('image', 'prompt'), /stopped|unavailable/);
    assert.deepEqual(mock.data, {});
    assert.equal(mock.listeners.size, 0);
  }
});
test('Meta quota failure keeps its completed image and prevents queue retries', async () => {
  mockChrome('meta-ai', {ok:false,error:'You reached your limit',code:'META_QUOTA',retryable:false,imgUrl:'data:image/png;base64,dGVzdA=='});
  await assert.rejects(openGoogleFlow('combined', {imagePrompt:'image',videoPrompt:'video'}), error => {
    assert.equal(error.code, 'META_QUOTA');
    assert.equal(error.retryable, false);
    assert.equal(error.imgUrl, 'data:image/png;base64,dGVzdA==');
    return true;
  });
});
test('existing settings default to Google Flow', async () => {
  const mock = mockChrome(undefined);
  await assert.rejects(openGoogleFlow('image', 'prompt'), /Flow reached/);
  assert.equal(mock.calls[0].type, 'OPEN_GOOGLE_FLOW');
  assert.equal(mock.listeners.size, 0);
});

test('every dispatched video and combined job carries mandatory portrait 10-second settings', async () => {
  for (const phase of ['video', 'combined']) {
    const mock = mockChrome('google-flow');
    await assert.rejects(openGoogleFlow(phase, phase === 'combined' ? {imagePrompt:'image', videoPrompt:'video'} : 'video', '', {videoDuration:8,aspectRatio:'16:9'}), /Flow reached/);
    const payload = mock.calls[0].payload;
    assert.equal(payload.options.videoDuration,10);
    assert.equal(payload.options.aspectRatio,'9:16');
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : payload.prompt.videoPrompt;
    assert.match(prompt,/vertical portrait 9:16 video lasting exactly 10 seconds/);
    if (phase === 'combined') assert.equal(payload.prompt.imagePrompt,'image');
  }
});
