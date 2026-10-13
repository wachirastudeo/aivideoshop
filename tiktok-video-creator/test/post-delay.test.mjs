import test from "node:test";
import assert from "node:assert/strict";
import { normalizePostDelay, postDelayMs } from "../modules/post-delay.js";

test("post-now delay defaults to a random 10–12 minutes", () => {
  assert.equal(postDelayMs(undefined, undefined, () => 0), 10 * 60_000);
  assert.equal(postDelayMs(undefined, undefined, () => 0.5), 11 * 60_000);
  assert.equal(postDelayMs(undefined, undefined, () => 0.999), 12 * 60_000);
});

test("post-now delay accepts a fixed interval and normalizes invalid settings", () => {
  assert.equal(postDelayMs(5, 5, () => 0.75), 5 * 60_000);
  assert.equal(postDelayMs(15, 5, () => 0), 15 * 60_000);
  assert.equal(normalizePostDelay("", 10), 10);
  assert.equal(normalizePostDelay("abc", 12), 12);
  assert.equal(normalizePostDelay("0", 10), 0);
});
