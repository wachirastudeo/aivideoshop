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
