import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../content.js", import.meta.url), "utf8");

test("unusual activity only records and displays a warning", async () => {
  const intervals = [];
  const stored = [];
  let sentMessages = 0;
  let reloads = 0;
  let clicks = 0;
  const body = {
    innerText: "We noticed some unusual activity. Please visit the help center.",
    appendChild() {}
  };
  const document = {
    body,
    documentElement: body,
    getElementById() { return null; },
    createElement() {
      return { style: {}, remove() {}, set textContent(value) { this._text = value; } };
    },
    querySelectorAll() {
      return [{ click() { clicks += 1; } }];
    }
  };
  const context = vm.createContext({
    console,
    document,
    location: {
      href: "https://labs.google/fx/tools/flow/project/test",
      pathname: "/fx/tools/flow/project/test",
      reload() { reloads += 1; }
    },
    chrome: {
      storage: {
        local: {
          get: async () => ({ autoClearEnabled: true }),
          set: async (value) => { stored.push(value); }
        }
      },
      runtime: { sendMessage() { sentMessages += 1; } }
    },
    setInterval(fn) { intervals.push(fn); return 1; },
    MutationObserver: class { observe() {} },
    Date
  });

  vm.runInContext(source, context);
  assert.equal(intervals.length, 1);
  await intervals[0]();

  assert.equal(clicks, 0);
  assert.equal(sentMessages, 0);
  assert.equal(reloads, 0);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].lastDetectedError.keyword, "we noticed some unusual activity");
});

test("ordinary waiting and historical failed text do not trigger the monitor", async () => {
  const intervals = [];
  const stored = [];
  const body = {
    innerText: "Please wait while your video is generating. Previous item: Failed.",
    appendChild() {}
  };
  const document = {
    body,
    documentElement: body,
    getElementById() { return null; },
    createElement() { return { style: {}, remove() {} }; }
  };
  const context = vm.createContext({
    console,
    document,
    location: { href: "https://labs.google/fx/tools/flow/project/test", pathname: "/fx/tools/flow/project/test" },
    chrome: {
      storage: { local: { get: async () => ({ autoClearEnabled: true }), set: async value => stored.push(value) } }
    },
    setInterval(fn) { intervals.push(fn); return 1; },
    MutationObserver: class { observe() {} },
    Date
  });

  vm.runInContext(source, context);
  await intervals[0]();
  assert.equal(stored.length, 0);
});
