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
      assert.ok(!prompt.includes("Scene 2 must use a new sentence"));
    });
  }
}
