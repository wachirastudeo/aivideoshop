import assert from 'node:assert/strict';
import { analyzeProductImages } from '../modules/image-analyzer.js';

const originalFetch = globalThis.fetch;
const originalChrome = globalThis.chrome;
const originalFileReader = globalThis.FileReader;
const reference = 'data:image/png;base64,dGVzdA==';
const product = { originalName: 'Travel tumbler 900ml', name: 'Edited sales hook' };
try {
  for (const provider of ['gemini', 'openai']) {
    globalThis.chrome = { storage: { sync: { get: async () => ({ settings: {
      aiProvider: provider, geminiApiKey: 'test-only', openaiApiKey: 'test-only'
    } }) } } };
    let request;
    let analysis = '{}';
    globalThis.fetch = async (_url, options) => {
      request = JSON.parse(options.body);
      return { ok: true, json: async () => ({
        candidates: [{ content: { parts: [{ text: analysis }] } }],
        choices: [{ message: { content: analysis } }]
      }) };
    };
    const result = await analyzeProductImages([reference], product);
    const payload = JSON.stringify(request);
    assert.match(payload, /Title: Travel tumbler 900ml/);
    assert.doesNotMatch(payload, /Title: Edited sales hook/);
    assert.match(payload, /Find the item named in the listing title/);
    assert.match(payload, /never substitute a more prominent object/);
    assert.match(payload, /dGVzdA==/);
    assert.equal(result.name, product.originalName);
    analysis = JSON.stringify({
      listedProductVisible: false,
      name: 'Leather handbag',
      hooks: ['Carry this handbag'],
      structureAdvice: 'Preserve the bag strap',
      promptAdvice: 'Show the bag in close-up'
    });
    const missing = await analyzeProductImages([reference], { originalName: 'Cotton T-shirt', name: 'Leather handbag' });
    assert.equal(missing.name, 'Cotton T-shirt');
    assert.doesNotMatch(JSON.stringify(missing), /handbag|bag strap/);

    analysis = JSON.stringify({ listedProductVisible: true, name: 'Cotton tee', structureAdvice: 'Keep the ribbed neckline' });
    const matched = await analyzeProductImages([reference], { name: 'Cotton T-shirt' });
    assert.equal(matched.name, 'Cotton tee');
    assert.equal(matched.structureAdvice, 'Keep the ribbed neckline');
  }

  const imageUrl = 'https://down-th.img.susercontent.com/file/shirt-image';
  globalThis.chrome = { storage: { sync: { get: async () => ({ settings: { geminiApiKey: 'test-only' } }) } } };
  globalThis.FileReader = class extends EventTarget {
    async readAsDataURL(blob) {
      this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
      this.dispatchEvent(new Event('load'));
    }
  };
  let geminiRequest;
  globalThis.fetch = async (url, options) => {
    if (url === imageUrl) return new Response(new Blob(['test'], { type: 'image/png' }));
    geminiRequest = JSON.parse(options.body);
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{}' }] } }] }) };
  };
  await analyzeProductImages([imageUrl], product);
  assert.deepEqual(geminiRequest.contents[0].parts[1], { inline_data: { mime_type: 'image/png', data: 'dGVzdA==' } });

  globalThis.chrome = { storage: { sync: { get: async () => ({ settings: {} }) } } };
  globalThis.fetch = () => { throw new Error('No API call expected without a key'); };
  const fallback = await analyzeProductImages([reference], product);
  assert.equal(fallback.name, product.originalName);
  assert.match(fallback.structureAdvice, /no image analysis has been performed/);
  console.log('8 image/title context cases passed');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.chrome = originalChrome;
  globalThis.FileReader = originalFileReader;
}
