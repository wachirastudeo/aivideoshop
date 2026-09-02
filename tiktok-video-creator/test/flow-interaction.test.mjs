import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
const queueSource = await readFile(new URL("../tabs/tab-video.js", import.meta.url), "utf8");

function loadContentScript(elements = []) {
  const document = {
    hidden: false,
    body: { appendChild() {} },
    scrollingElement: null,
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return elements; }
  };
  const chrome = {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async () => ({})
    },
    storage: {
      local: { get: async () => ({}), set: async () => {}, remove: async () => {} },
      onChanged: { addListener() {} }
    }
  };
  const context = vm.createContext({
    console,
    chrome,
    document,
    location: { href: "https://labs.google/fx/tools/flow/project/test", hostname: "labs.google" },
    window: { innerWidth: 1200, innerHeight: 800, screenX: 0, screenY: 0 },
    getComputedStyle: (el) => el.style || { overflowY: "visible" },
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout() {},
    MutationObserver: class { observe() {} },
    PointerEvent: class {},
    MouseEvent: class {},
    KeyboardEvent: class {},
    Event: class {},
    DragEvent: class {},
    DataTransfer: class {},
    File: class {},
    FileReader: class {},
    Blob,
    URL,
    atob,
    fetch
  });
  vm.runInContext(source, context);
  return context;
}

test("click fallback emits exactly one click", () => {
  const context = loadContentScript();
  let nativeClicks = 0;
  let syntheticEvents = 0;
  context.click({
    click() { nativeClicks += 1; },
    dispatchEvent() { syntheticEvents += 1; }
  });
  assert.equal(nativeClicks, 1);
  assert.equal(syntheticEvents, 0);
});

test("unusual activity produces a stop message instead of a recovery retry", () => {
  const context = loadContentScript();
  const message = context.unusualActivityStopMessage("We noticed some unusual activity");

  assert.match(message, /ระบบหยุดอัตโนมัติ/);
  assert.doesNotMatch(source, /CLEAR_SITE_DATA|localStorage\.clear\(\)|indexedDB\.deleteDatabase/);
});

test("passive waits do not emit random idle mouse or scroll activity", () => {
  assert.doesNotMatch(source, /wiggleMouse|nudgeScroll|doWiggle|doScroll/);
});

test("upload polling does not click tabs or force a page reload", () => {
  assert.doesNotMatch(source, /refreshMediaList/);
  assert.doesNotMatch(source, /window\.location\.reload\(\)/);
  assert.match(source, /Math\.max\(30, Math\.min\(300, Math\.ceil\(waitMs \/ 1000\)\)\)/);
});

test("Flow queue applies a conservative cooldown between products", () => {
  assert.match(queueSource, /FLOW_ITEM_COOLDOWN_MIN_MS = 30000/);
  assert.match(queueSource, /FLOW_ITEM_COOLDOWN_MAX_MS = 60000/);
  assert.match(queueSource, /FLOW_BREAK_EVERY_ITEMS = 5/);
  assert.doesNotMatch(queueSource, /delaySeconds = 4 \+ Math\.floor/);
});
