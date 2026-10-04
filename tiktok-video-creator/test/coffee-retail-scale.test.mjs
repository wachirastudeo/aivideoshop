import test from 'node:test';
import assert from 'node:assert/strict';
import {buildImagePrompt, buildVideoPrompt} from '../modules/prompt-builder.js';
for (const videoStyle of ['review', 'still-motion', 'boxed-motion', 'hands-only']) {
  test(`200g coffee scale survives ${videoStyle} image and video branches`, () => {
    const product = {originalName: 'เมล็ดกาแฟคั่ว ซอง 200 กรัม', name: 'Coffee beans'};
    for (const build of [buildImagePrompt, buildVideoPrompt]) {
      const prompt = build(product, {videoStyle, presenter: 'woman'});
      assert.match(prompt, /RETAIL COFFEE SCALE: 200g/);
      assert.match(prompt, /never chest-sized/);
      assert.match(prompt, /Move the camera closer; never enlarge the pouch/);
    }
  });
}
test('retail weight is not guessed for unknown or larger coffee sizes', () => {
  for (const name of ['Coffee beans', 'Coffee beans 1kg', 'Coffee beans 500g', 'Coffee machine 200g']) {
    assert.doesNotMatch(buildImagePrompt({name}, {videoStyle: 'review'}), /RETAIL COFFEE SCALE/);
  }
});
test('English and kilogram retail weights are recognized', () => {
  for (const name of ['Coffee beans 200 g', 'Coffee beans 0.2 kg', 'Coffee beans 250 grams']) {
    assert.match(buildImagePrompt({name}, {videoStyle: 'review'}), /RETAIL COFFEE SCALE: (?:200|250)g/);
  }
});
