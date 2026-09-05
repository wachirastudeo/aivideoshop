import assert from 'node:assert/strict';
import { analyzeProductImages } from '../modules/image-analyzer.js';

const originalFetch = globalThis.fetch;
const originalChrome = globalThis.chrome;
const reference = 'data:image/png;base64,dGVzdA==';
const product = { originalName: 'Travel tumbler 900ml', name: 'Edited sales hook' };
try {
  for (const provider of ['gemini', 'openai']) {
    globalThis.chrome = { storage: { sync: { get: async () => ({ settings: {
      aiProvider: provider, geminiApiKey: 'test-only', openaiApiKey: 'test-only'
    } }) } } };
    let request;
    globalThis.fetch = async (_url, options) => {
      request = JSON.parse(options.body);
      return { ok: true, json: async () => ({
        candidates: [{ content: { parts: [{ text: '{}' }] } }],
        choices: [{ message: { content: '{}' } }]
      }) };
    };
    const result = await analyzeProductImages([reference], product);
    const payload = JSON.stringify(request);
    assert.match(payload, /Title: Travel tumbler 900ml/);
    assert.doesNotMatch(payload, /Title: Edited sales hook/);
    assert.match(payload, /First check whether the title describes the visible product/);
    assert.match(payload, /state the mismatch in promptAdvice/);
    assert.match(payload, /dGVzdA==/);
    assert.equal(result.name, product.originalName);
  }
  globalThis.chrome = { storage: { sync: { get: async () => ({ settings: {} }) } } };
  globalThis.fetch = () => { throw new Error('No API call expected without a key'); };
  const fallback = await analyzeProductImages([reference], product);
  assert.match(fallback.structureAdvice, /no image analysis has been performed/);
  console.log('3 image/title context cases passed');
} finally {
  globalThis.fetch = originalFetch;
  globalThis.chrome = originalChrome;
}
