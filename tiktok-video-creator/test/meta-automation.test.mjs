import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../content/meta-automation.js', import.meta.url), 'utf8');
function load(name, next, dependencies = {}) {
  const start = source.indexOf(`function ${name}(`);
  const asyncStart = source.slice(start - 6, start) === 'async ' ? start - 6 : start;
  const body = source.slice(asyncStart, source.indexOf(next, start));
  return new Function(...Object.keys(dependencies), `${body};return ${name};`)(...Object.values(dependencies));
}
const failure = load('generationFailure', '\n  async function waitFor');

test('temporary Meta error is retryable but try again later is not', () => {
  assert.equal(failure('Something went wrong. Please try again.').retryable, true);
  assert.equal(failure('Please try again later').retryable, false);
});

test('generation retries once in a new chat with the same prompt and references', async () => {
  const references = ['data:image/png;base64,reference'];
  const events = [];
  let attempts = 0;
  const retry = load('generateWithRetry', '\n  async function run', {
    generate: async (...args) => {
      events.push(args);
      if (++attempts === 1) throw failure('Something went wrong. Please try again.');
      return 'video-result';
    },
    check: () => {}, report: async stage => events.push(stage),
    pause: async () => {}, newChat: async () => events.push('new-chat'),
  });
  assert.equal(await retry('video','prompt',references), 'video-result');
  assert.deepEqual(events, [['video','prompt',references], 'retrying-video', 'new-chat', ['video','prompt',references]]);
});

test('retry stops after two failures and does not retry quota or cancellation', async () => {
  for (const [error, stopped, expected] of [
    [failure('Something went wrong. Please try again.'), false, 2],
    [failure('You reached your limit.'), false, 1],
    [failure('Something went wrong. Please try again.'), true, 1],
  ]) {
    let attempts = 0;
    const retry = load('generateWithRetry', '\n  async function run', {
      generate: async () => {attempts++; throw error;},
      check: () => {if (stopped) throw Error('Meta AI generation stopped');},
      report: async () => {}, pause: async () => {}, newChat: async () => {},
    });
    await assert.rejects(retry('video','prompt',[]), stopped ? /generation stopped/ : error);
    assert.equal(attempts, expected);
  }
});

test('Meta quota, security and account failures are actionable and non-retryable', () => {
  for (const [text, code] of [
    ['The video generation quota is temporarily exhausted right now.', 'META_QUOTA'],
    ['Upgrade to do more. You reached your limit. Get Meta One Core or wait until tomorrow.', 'META_QUOTA'],
    ['Your request was blocked by our security system.', 'META_SECURITY_BLOCK'],
    ['Video generation is not available to you', 'META_UNAVAILABLE'],
  ]) {
    const error = failure(text);
    assert.equal(error.code, code);
    assert.equal(error.retryable, false);
    assert.ok(error.message.includes(text));
  }
  assert.equal(failure('Animating boots in water'), null);
  assert.equal(failure("Here is your 10-second vertical product video."), null);
});

test('home-page submission follows only its new conversation and sends once', async () => {
  const prompt = 'Create a vertical product photo of the reference boots.';
  const location = { pathname: '/' };
  const oldLink = { href: 'https://www.meta.ai/prompt/old', textContent: prompt, click() { throw Error('Old conversation clicked'); } };
  const unrelated = { href: 'https://www.meta.ai/prompt/unrelated', textContent: 'Something else', click() { throw Error('Unrelated conversation clicked'); } };
  let links = [oldLink];
  let message;
  let sends = 0;
  let historyClicks = 0;
  const editor = { textContent: prompt, focus() {}, dispatchEvent() {} };
  const jobLink = { href: 'https://www.meta.ai/prompt/new', textContent: prompt, click() { historyClicks++; location.pathname = '/prompt/new'; message = {textContent:prompt}; } };
  const enter = load('enterPrompt', '\n  const mediaUrl', {
    conversationLinks: () => links,
    composer: () => editor,
    pause: async () => {},
    DataTransfer: class { setData() {} },
    ClipboardEvent: class {},
    chrome: {runtime:{sendMessage() {throw Error('Unexpected text fallback');}}},
    button: () => ({send:true}),
    click: async () => {sends++; links = [oldLink, unrelated, jobLink];},
    document: { querySelectorAll: selector => selector.includes('Your message') && message ? [message] : [] },
    location,
    label: element => element.textContent,
    generationFailure: failure,
    waitFor: async find => {for (let i=0;i<5;i++) {const result=find();if(result)return result;} throw Error('Condition never met');},
  });
  await enter(prompt);
  assert.equal(sends, 1);
  assert.equal(historyClicks, 1);
  assert.equal(location.pathname, '/prompt/new');
});

test('Meta video submission requests multiple angles while images remain single-frame', async () => {
  for (const kind of ['image', 'video']) {
    let submitted;
    const halt = new Error('captured submission');
    const generate = load('generate', '\n  async function newChat', {
      report: async () => {}, upload: async () => {},
      responseMedia: () => [], document: {querySelectorAll: () => []},
      enterPrompt: async prompt => {submitted = prompt; throw halt;},
    });
    await assert.rejects(generate(kind, 'Original product and audio instructions', []), error => error === halt);
    assert.ok(submitted.includes('Original product and audio instructions'));
    if (kind === 'video') {
      assert.match(submitted, /four sequential full-frame shots/);
      assert.match(submitted, /front view.*left three-quarter view.*right three-quarter view.*front hero view/);
      assert.match(submitted, /Keep true scale against hands and body/);
      assert.match(submitted, /Continue the same narration smoothly across cuts/);
      assert.match(submitted, /overrides conflicting single-shot/);
    } else {
      assert.doesNotMatch(submitted, /META MULTI-ANGLE/);
      assert.match(submitted, /Output a vertical 9:16 image/);
    }
  }
});
