import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../content/flow-automation.js', import.meta.url), 'utf8');
function load(start, end, dependencies, functionName = start.match(/function (\w+)/)[1]) {
  return new Function(...Object.keys(dependencies), `${source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))}; return ${functionName};`)(...Object.values(dependencies));
}

test('result polling never clicks the composer Clear prompt control', async () => {
  let clicks = 0;
  const button = {
    textContent: 'close',
    getAttribute: () => 'Clear prompt',
    querySelectorAll: () => [],
    getBoundingClientRect: () => ({ top: 500 })
  };
  const run = load('async function closeGeneratedAssetOverlay()', '\nfunction ', {
    document: { querySelectorAll: () => [button] },
    isVisible: () => clicks === 0,
    humanClick: async () => { clicks++; },
    sleep: async () => {}, log: () => {}
  });
  assert.equal(await run(), false);
  assert.equal(clicks, 0);
});

function loadGenerate(calls, verifyResolution) {
  const button = { scrollIntoView() {} };
  return load('async function clickGenerate(', '\nasync function clickButtonCenterWithDebugger', {
    log: message => calls.push(message),
    detachFlowDebugger: async () => {}, sleep: async () => {},
    snapMediaKeys: () => [], snapDirectTileKeys: () => [],
    stopRequested: false, preGenMediaKeys: new Set(),
    findGenerateButton: () => button, findDisabledGenerateButton: () => null,
    selectVerifiedVideoResolution: verifyResolution,
    humanClick: async () => calls.push('synthetic'),
    clickButtonCenterWithDebugger: async () => { calls.push('trusted'); return true; },
    waitGenerationStarted: async () => false
  });
}

test('image Generate dispatches one trusted click without checking video resolution', async () => {
  const calls = [];
  const run = loadGenerate(calls, async () => { throw new Error('Unexpected resolution check'); });
  await run('image');
  assert.equal(calls.filter(value => value === 'trusted').length, 1);
  assert.ok(!calls.includes('synthetic'));
  assert.ok(!calls.some(value => value.startsWith('✅')));
});

test('video Generate verifies 720p before submitting', async () => {
  const calls = [];
  const run = loadGenerate(calls, async () => calls.push('verified'));
  await run('video');
  assert.deepEqual(calls.filter(value => ['verified', 'trusted'].includes(value)), ['verified', 'trusted']);
});

test('video Generate never submits when 720p cannot be verified', async () => {
  const calls = [];
  const run = loadGenerate(calls, async () => { throw new Error('720p unavailable'); });
  await assert.rejects(run('video'), /720p unavailable/);
  assert.ok(!calls.includes('trusted'));
});

function loadResolutionPicker({ initialResolution = '360p', keepsSelection = true } = {}) {
  const calls = [];
  let resolution = initialResolution;
  let open = false;
  const trigger = {
    get textContent() { return `Video · ${resolution} · 8s`; },
    getAttribute: name => name === 'aria-label' ? 'Settings trigger' : null
  };
  const option = {
    textContent: '720p', querySelector: () => null,
    getAttribute: name => name === 'aria-checked' ? String(resolution === '720p') : null
  };
  const group = { querySelectorAll: () => [option] };

  const run = load('function findFlowSettingsTrigger()', '\nasync function selectAspectRatio', {
    document: {
      querySelectorAll: selector => {
        if (selector === 'button') return [trigger];
        return open && selector.startsWith('flow-toggles') ? [group] : [];
      }
    },
    isVisible: () => true,
    elementText: el => `${el.textContent} ${el.getAttribute('aria-label') || ''}`,
    humanClick: async el => {
      if (el === trigger) {
        calls.push('open');
        open = true;
      } else if (el === option) {
        calls.push('720p');
        resolution = '720p';
      }
    },
    closeAnyOpenMenu: async () => {
      calls.push('close');
      open = false;
      if (!keepsSelection) resolution = initialResolution;
    },
    sleep: async () => {}, log: () => {}
  }, 'selectVerifiedVideoResolution');
  return { calls, verify: run };
}

test('Flow 360p is switched to 720p and rechecked after settings closes', async () => {
  const { calls, verify } = loadResolutionPicker();
  await verify();
  assert.deepEqual(calls, ['open', '720p', 'close']);
});

test('Flow 720p in the composer confirms fixed-resolution models without opening settings', async () => {
  const { calls, verify } = loadResolutionPicker({ initialResolution: '720p' });
  await verify();
  assert.deepEqual(calls, []);
});

test('the 720p check rejects a selection that reverts when the menu closes', async () => {
  const { calls, verify } = loadResolutionPicker({ keepsSelection: false });
  await assert.rejects(verify(), /720p/);
  assert.deepEqual(calls, ['open', '720p', 'close']);
});

test('Start generation is selected ahead of unrelated arrow buttons', () => {
  const makeButton = (label, icon) => ({
    getAttribute: name => name === 'aria-label' ? label : null,
    querySelectorAll: selector => selector === 'span' ? [] : [{ textContent: icon }],
    getBoundingClientRect: () => ({ top: 500, height: 40 })
  });
  const arrow = makeButton('Next', 'arrow_forward');
  const generate = makeButton('Start generation', '');
  const run = load('function findPromptSubmitButtons()', '\nfunction findGenerateButton()', {
    document: { querySelectorAll: () => [arrow, generate] },
    findPromptEditor: () => null, isVisible: () => true
  });
  assert.equal(run()[0], generate);
});
