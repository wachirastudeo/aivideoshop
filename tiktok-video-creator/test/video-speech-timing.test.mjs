import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVideoPrompt, VIDEO_STYLES, getDefaultSettings } from "../modules/prompt-builder.js";

for (const duration of [4, 6, 8, 10]) {
  for (const style of VIDEO_STYLES) {
    test(`${style.id}: speech completes before ${duration}s clip ends`, () => {
      const prompt = buildVideoPrompt({ name: "เสื้อยืด", category: "fashion" }, {
        ...getDefaultSettings(), videoStyle: style.id, videoDuration: String(duration)
      });
      assert.ok(prompt.includes(`finish every sentence by ${duration - 1}s`));
      assert.ok(prompt.includes(`at most ${Math.floor((duration - 1.5) * 3)} spoken syllables total`));
      assert.ok(prompt.includes("never speed up, trail off"));
      assert.ok(prompt.includes("music-only clips remain without speech"));
      assert.ok(prompt.includes("SINGLE AUDIO TAKE: Speak one sentence once across the whole clip."));
      assert.ok(prompt.includes("Scene cuts change visuals only; never restart narration"));
      assert.ok(prompt.includes("After the sentence ends, stay silent."));
      assert.ok(!prompt.includes("Scene 2 must use a new sentence"));
    });
  }
}

for (const videoModel of ["omni-flash", "veo-3.1"]) {
  test(`${videoModel}: 10s narration spans visual cuts without stopping`, () => {
    const prompt = buildVideoPrompt({ name: "เสื้อยืด", category: "fashion", highlights: "ผ้านุ่ม ใส่สบาย" }, {
      ...getDefaultSettings(), videoStyle: "fashion-hanger-presenter", videoDuration: 10, videoModel,
      audioMode: "voiceover"
    });
    assert.ok(prompt.includes("ONE complete connected Thai sentence of about 20–25 syllables"));
    assert.ok(prompt.includes("continuously from 0.5s until 8–9s"));
    assert.ok(prompt.includes("No mid-sentence silence, stop-and-resume delivery"));
    assert.ok(prompt.includes("including 2.5s, 5s and 7.5s when present"));
    assert.ok(!prompt.includes("STRICT PROGRESSIVE SCENE NARRATION"));
  });
}

test("10s music-only video does not request continuous speech", () => {
  const prompt = buildVideoPrompt({ name: "เสื้อยืด" }, {
    ...getDefaultSettings(), videoDuration: 10, audioMode: "music_only"
  });
  assert.ok(!prompt.includes("10-SECOND CONTINUOUS DELIVERY"));
});

for (const metaMultiScene of [true, false]) {
  test(`Meta AI 10s speech is complete and omits product codes (${metaMultiScene ? "three scenes" : "one scene"})`, () => {
    const prompt = buildVideoPrompt({ name: "เสื้อยืด รุ่น ABC-123", productId: "987654321", highlights: "ผ้านุ่ม" }, {
      ...getDefaultSettings(), generationProvider: "meta-ai", videoDuration: 10,
      metaMultiScene, audioMode: "voiceover"
    });
    assert.ok(prompt.includes("META 10-SECOND SPEECH OVERRIDE"));
    assert.ok(prompt.includes("at most 18 spoken syllables total"));
    assert.ok(prompt.includes("finish every sentence by 8s"));
    assert.ok(prompt.includes("never read a product ID, SKU, model/catalog code"));
    assert.ok(prompt.includes("shorten or omit details before speaking"));
  });
}
