import test from "node:test";
import assert from "node:assert/strict";
import { normalizePostDelay, postDelayMs, waitForPostDelay } from "../modules/post-delay.js";

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

test("stopping a post queue ends its pending delay immediately", async () => {
  const controller = new AbortController();
  const started = Date.now();
  const waiting = waitForPostDelay(60_000, controller.signal);
  controller.abort();
  await waiting;
  assert.ok(Date.now() - started < 1_000);
});
