import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../content/flow-automation.js', import.meta.url), 'utf8');
function load(start, end, dependencies) {
  return new Function(...Object.keys(dependencies), `${source.slice(source.indexOf(start), source.indexOf(end, source.indexOf(start)))}; return ${start.match(/function (\w+)/)[1]};`)(...Object.values(dependencies));
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

test('Generate dispatches one trusted click and does not claim confirmation without it', async () => {
  const calls = [];
  const button = { scrollIntoView() {} };
  const run = load('async function clickGenerate()', '\nasync function clickButtonCenterWithDebugger', {
    log: message => calls.push(message),
    detachFlowDebugger: async () => {}, sleep: async () => {},
    snapMediaKeys: () => [], snapDirectTileKeys: () => [],
    stopRequested: false, preGenMediaKeys: new Set(),
    findGenerateButton: () => button, findDisabledGenerateButton: () => null,
    humanClick: async () => calls.push('synthetic'),
    clickButtonCenterWithDebugger: async () => { calls.push('trusted'); return true; },
    waitGenerationStarted: async () => false
  });
  await run();
  assert.equal(calls.filter(value => value === 'trusted').length, 1);
  assert.ok(!calls.includes('synthetic'));
  assert.ok(!calls.some(value => value.startsWith('✅')));
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
