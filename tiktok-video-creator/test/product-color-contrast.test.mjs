import assert from 'node:assert/strict';
import { buildVideoPrompt, getDefaultSettings, VIDEO_STYLES } from '../modules/prompt-builder.js';

const defaults = getDefaultSettings();
let cases = 0;

function checkColorSeparation(prompt, context) {
  assert.match(prompt, /HIGHEST PRIORITY — PRODUCT COLOR & BACKGROUND SEPARATION/, context);
  assert.match(prompt, /Reference image controls product hue, saturation, brightness/i, context);
  assert.match(prompt, /neutral white balance on product/i, context);
  assert.match(prompt, /no ambient tint, color spill or cinematic grading/i, context);
  assert.match(prompt, /Light products: darker neutral background/i, context);
  assert.match(prompt, /Dark products: lighter neutral background/i, context);
  assert.match(prompt, /No tone-on-tone product\/background\/outfit camouflage/i, context);
  assert.match(prompt, /change background, never product colors/i, context);
  assert.doesNotMatch(prompt, /\blow contrast\b|FORBIDDEN: High contrast/i, context);
  cases++;
}

// Cover specialized style builders as well as their ordinary shared path.
for (const generationProvider of ['google-flow', 'meta-ai']) {
  for (const { id: videoStyle } of VIDEO_STYLES) {
    const settings = { ...defaults, generationProvider, videoStyle, videoDuration: 10,
      mood: 'Dark & Moody', location: 'Studio Minimal', presenter: 'woman' };
    const product = { name: 'Cream cotton shirt', category: 'clothing' };
    checkColorSeparation(buildVideoPrompt(product, settings), `${generationProvider}/${videoStyle}/video`);
  }
}

// Meta installation bypasses the normal style wrapper; it must keep the rule.
for (const name of ['ฟิล์มหน้าจอ iPhone', 'ฟิล์มหลัง iPhone', 'ฟิล์มกันรอยเลนส์กล้อง iPhone']) {
  checkColorSeparation(buildVideoPrompt({ name }, { ...defaults,
    generationProvider: 'meta-ai', videoDuration: 10 }), `meta-film/${name}`);
}

// Category-specific branches must keep reference colors even in moody scenes.
for (const name of ['White iPhone phone case', 'Black running shoes', 'เสื้อกันฝนเด็ก']) {
  checkColorSeparation(buildVideoPrompt({ name }, {
    ...defaults, mood: 'Dark & Moody', location: 'Studio Minimal'
  }), `category/${name}`);
}

const staleAdvice = 'Use a cream background and warm amber mood lighting to blend the cream product into the scene.';
const product = { name: 'Cream cotton shirt', category: 'clothing', promptAdvice: staleAdvice };
for (const generationProvider of ['google-flow', 'meta-ai']) {
  const prompt = buildVideoPrompt(product, { ...defaults, generationProvider, videoStyle: 'review' });
  assert.ok(prompt.lastIndexOf('HIGHEST PRIORITY — PRODUCT COLOR & BACKGROUND SEPARATION') > prompt.indexOf(staleAdvice),
    'The color override must follow AI scene advice');
  assert.match(prompt, /every frame and cut/i);
  assert.match(prompt, /Overrides mood, source lighting and AI styling advice/i);
  assert.equal(prompt.split('HIGHEST PRIORITY — PRODUCT COLOR & BACKGROUND SEPARATION').length - 1, 1);
}

console.log(`${cases} product color/contrast prompt cases passed`);
