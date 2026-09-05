import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../content/tiktok-studio-automation.js", import.meta.url), "utf8");
function harness(initial, acceptsEdit = true) {
  let text = initial;
  const editor = {
    get innerText() { return text; },
    focus() {},
    dispatchEvent() {}
  };
  const context = vm.createContext({
    selectAllEditable() {},
    dismissCaptionSuggestion() {},
    sleep: async () => {},
    InputEvent: class {},
    Event: class {},
    document: { execCommand(command, _, value) {
      if (acceptsEdit && command === "insertText") text = value;
    } }
  });
  const match = source.match(/async function repairCaptionHashtags\(editor\) \{[\s\S]*?\n\}/);
  assert.ok(match, "caption must be checked after editor insertion");
  vm.runInContext(match[0], context);
  return { run: () => context.repairCaptionHashtags(editor), read: () => text };
}
test("repairs repeated hashes in the final TikTok editor text", async () => {
  const h = harness("สินค้า i love tiktok ##TikTokShop ###ของดีบอกต่อ #VESSO");
  await h.run();
  assert.equal(h.read(), "สินค้า i love tiktok #TikTokShop #ของดีบอกต่อ #VESSO");
});
test("preserves valid hashtags and caption line breaks", async () => {
  const text = "สินค้า\n#TikTokShop #ของดีบอกต่อ";
  const h = harness(text);
  await h.run();
  assert.equal(h.read(), text);
});
test("stops posting when the editor rejects the correction", async () => {
  await assert.rejects(harness("##TikTokShop", false).run(), /Caption still contains repeated hashtag prefixes/);
});
