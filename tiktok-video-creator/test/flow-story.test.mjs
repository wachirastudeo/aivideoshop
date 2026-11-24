import test from "node:test";
import assert from "node:assert/strict";
import { buildFlowStoryPrompts, generateFlowStory } from "../modules/flow-story.js";
import { flowClipLengths, flowReferenceMode, resolveFlowClipLength } from "../modules/flow-video-settings.js";

test("Veo Lite uses 8s, Omni allows 8s and 10s, and longer stories use Frames", () => {
  assert.deepEqual(flowClipLengths("veo-3.1-lite"), [8]);
  assert.deepEqual(flowClipLengths("omni-flash"), [8, 10]);
  assert.equal(resolveFlowClipLength("veo-3.1-lite-low-priority", 10), 8);
  assert.equal(resolveFlowClipLength("omni-flash", 6), 8);
  assert.equal(resolveFlowClipLength("omni-flash", 10), 10);
  assert.equal(flowReferenceMode("veo-3.1-lite", "video", 3, "ingredients"), "frames");
});

test("each part carries the same timeline and gets only its assigned beat", () => {
  const script = "0–6s: The car approaches the arch.\n6–12s: It drives through.\n12–18s: It stops by the flag.";
  const prompts = buildFlowStoryPrompts(`${script}\nSPEECH TIMING: Finish by 5s.`, 3, 6, script);
  assert.match(prompts[1], /PART 2 OF 3.*master time 6–12s/);
  assert.match(prompts[1], /THIS PART ONLY: 6–12s: It drives through\./);
  assert.doesNotMatch(prompts[1], /THIS PART ONLY:.*stops by the flag/);
  assert.doesNotMatch(prompts[1], /Finish by 5s/);
  const shared = prompt => prompt.split("MASTER TIMELINE FOR CONTEXT:\n")[1].split("SHARED SCRIPT AND VISUAL RULES")[0];
  assert.equal(shared(prompts[0]), shared(prompts[2]));
});

test("three clips run in order, each using the prior clip's last frame as its only reference", async () => {
  const events = [];
  let part = 0;
  const result = await generateFlowStory({
    phase: "combined", imageUrl: "source", prompt: { imagePrompt: "opening still", videoPrompt: "same story" },
    options: { flowStoryParts: 3, videoDuration: 8, videoRefMode: "ingredients", imageUrls: ["source", "detail"] },
    signal: new AbortController().signal,
    openClip: async (phase, prompt, image, opts) => {
      part++;
      events.push([phase, image, opts.imageUrls, opts.videoRefMode, opts.videoCount, opts.flowStartFrame]);
      return { resultUrl: `clip${part}`, flowTabId: part, imgUrl: part === 1 ? "still" : undefined };
    },
    downloadClip: async (url, tab) => {
      assert.equal(url, `clip${tab}`);
      events.push(`download-${url}`);
      return url;
    },
    media: {
      openStoryClip: async id => ({ id, input: { dispose() {} } }),
      lastStoryFrame: async clip => `last-${clip.id}`,
      joinStoryClips: async clips => clips.map(clip => clip.id).join("+"),
      storyDataUrl: async value => value,
    },
  });
  assert.deepEqual(events, [
    ["combined", "source", ["source", "detail"], "frames", 1, undefined], "download-clip1",
    ["video", "last-clip1", ["last-clip1"], "frames", 1, true], "download-clip2",
    ["video", "last-clip2", ["last-clip2"], "frames", 1, true], "download-clip3",
  ]);
  assert.equal(result.resultUrl, "clip1+clip2+clip3");
  assert.equal(result.imgUrl, "still");
  assert.equal(result.duration, 24);
});
