import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVideoPrompt, VIDEO_STYLES, getDefaultSettings } from "../modules/prompt-builder.js";

for (const style of VIDEO_STYLES) {
  test(`spoken greeting ban reaches ${style.id} video prompt`, () => {
    const prompt = buildVideoPrompt(
      { name: "เสื้อยืด", category: "fashion", hooks: ["สวัสดีค่ะ แนะนำสินค้านี้"] },
      { ...getDefaultSettings(), videoStyle: style.id }
    );
    assert.ok(prompt.split("\n")[1].startsWith("SPOKEN DIALOGUE RULE:"));
    assert.ok(prompt.includes('Never say "สวัสดี"'));
    assert.ok(prompt.includes("anywhere in dialogue or voiceover"));
    assert.ok(prompt.includes("Start directly with the product hook"));
  });
}
