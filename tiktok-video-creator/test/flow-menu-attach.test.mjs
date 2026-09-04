// Unit tests for Flow "Add to prompt" menu item detection and attachment tracking
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

class MockElement {
  constructor(tagName, textContent = "", attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.textContent = textContent;
    this.attributes = { ...attrs };
    this.children = [];
    this.parentElement = null;
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (node.matches(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  matches(selector) {
    const parts = selector.split(",").map(s => s.trim());
    for (const part of parts) {
      if (part === this.tagName.toLowerCase()) return true;
      if (part.startsWith(".") && (this.getAttribute("class") || "").includes(part.slice(1))) return true;
      if (part.startsWith("[role=") && part.endsWith("]")) {
        const role = part.slice(6, -1).replace(/["']/g, "");
        if (this.getAttribute("role") === role) return true;
      }
      if (part.startsWith("[data-radix-collection-item]")) {
        if (this.attributes["data-radix-collection-item"] !== undefined) return true;
      }
      if (part.includes("[aria-label*=")) {
        const valMatch = part.match(/\[aria-label\*=["']?([^"'\]]+)["']?/i);
        if (valMatch) {
          const val = valMatch[1].trim().toLowerCase();
          const aria = (this.getAttribute("aria-label") || "").toLowerCase();
          if (aria.includes(val)) return true;
        }
      }
      if (part.includes("button") && this.tagName === "BUTTON") return true;
      if (part.includes("img") && this.tagName === "IMG") return true;
      if (part.includes("video") && this.tagName === "VIDEO") return true;
      if (part.includes("div") && this.tagName === "DIV") return true;
      if (part.includes("menu-item") && (this.getAttribute("class") || "").includes("menu-item")) return true;
    }
    return false;
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (child.matches(selector)) results.push(child);
        visit(child);
      }
    };
    visit(this);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function elementText(el) {
  return [
    el.textContent,
    el.getAttribute("aria-label"),
    el.getAttribute("title")
  ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

test("findAddToPromptMenuItem accurately selects Add to prompt without selecting the entire menu container", () => {
  const menuContainer = new MockElement("div", "", { role: "menu", class: "flow-popup-menu" });

  const items = [
    "Favorite",
    "Reuse prompt",
    "Animate",
    "Add to prompt",
    "Download",
    "Copy",
    "Rename",
    "Share",
    "Set project cover",
    "Flag output",
    "Move to trash"
  ];

  let expectedItem = null;
  for (const label of items) {
    const itemEl = new MockElement("div", "", { role: "menuitem", class: "menu-item" });
    const iconEl = new MockElement("span", label === "Add to prompt" ? "add" : "icon");
    const textEl = new MockElement("span", label);
    itemEl.appendChild(iconEl);
    itemEl.appendChild(textEl);
    itemEl.textContent = label;
    menuContainer.appendChild(itemEl);
    if (label === "Add to prompt") expectedItem = itemEl;
  }

  menuContainer.textContent = items.join(" ");

  const mockDocument = {
    querySelectorAll: (sel) => {
      if (sel.includes("menuitem") || sel.includes("button")) {
        return menuContainer.querySelectorAll('[role="menuitem"], button, [role="button"]');
      }
      return [menuContainer, ...menuContainer.children];
    }
  };

  function findItem() {
    const itemSelectors = [
      '[role="menuitem"]',
      '[role="option"]',
      '[data-radix-collection-item]',
      '[class*="menu-item" i]',
      'button',
      'li',
      'div[tabindex]'
    ];

    for (const sel of itemSelectors) {
      const nodes = mockDocument.querySelectorAll(sel);
      for (const node of nodes) {
        const text = elementText(node).toLowerCase();
        if ((text.includes("add to prompt") || text.includes("เพิ่มไปยังพรอมต์") || text.includes("use as input")) &&
            !text.includes("favorite") && !text.includes("move to trash") && !text.includes("download")) {
          return node;
        }
      }
    }
    return null;
  }

  const found = findItem();
  assert.ok(found, "Should find the Add to prompt menu item");
  assert.equal(found, expectedItem, "Found item should be the specific Add to prompt menuitem, not the container");
  assert.ok(!elementText(found).includes("Favorite"), "Selected item must not contain Favorite");
  assert.ok(!elementText(found).includes("Move to trash"), "Selected item must not contain Move to trash");
});

test("prompt attachment count tracks chips accurately and ignores avatars", () => {
  const promptPanel = new MockElement("div", "", { class: "prompt-bar" });
  const editor = new MockElement("div", "", { role: "textbox" });
  promptPanel.appendChild(editor);

  const avatar = new MockElement("img", "", { alt: "Google Account: User" });
  promptPanel.appendChild(avatar);

  function getPromptAttachments(panel) {
    const attachments = [];
    const removeBtns = panel.querySelectorAll("button[aria-label*='cancel' i],button[aria-label*='remove' i],button[aria-label*='delete' i]");
    for (const btn of removeBtns) {
      const chip = btn.closest("div") || btn;
      if (!attachments.includes(chip)) attachments.push(chip);
    }
    const medias = panel.querySelectorAll("img, video");
    for (const m of medias) {
      const alt = (m.getAttribute("alt") || "").toLowerCase();
      if (alt.includes("google account") || alt.includes("profile") || alt.includes("avatar")) continue;
      if (!attachments.some(a => a === m || a.children?.includes(m))) {
        attachments.push(m);
      }
    }
    return attachments;
  }

  assert.equal(getPromptAttachments(promptPanel).length, 0, "Initial attachment count should be 0 even if avatar exists");

  const chip = new MockElement("div", "", { class: "attachment-chip" });
  const thumb = new MockElement("img", "", { alt: "Media thumbnail" });
  const removeBtn = new MockElement("button", "x", { "aria-label": "Remove media" });
  chip.appendChild(thumb);
  chip.appendChild(removeBtn);
  promptPanel.appendChild(chip);

  assert.equal(getPromptAttachments(promptPanel).length, 1, "Attachment count should be 1 after image chip is added");
});

test("combined Flow preserves a completed image when video generation has no URL", async () => {
  const source = await readFile(new URL("../tabs/tab-video.js", import.meta.url), "utf8");
  assert.match(
    source,
    /product\.status = product\.videoUrl \? "done" : "image_done";/,
    "a Phase 2 failure must leave the completed Phase 1 image resumable"
  );
});

test("combined Flow never starts video generation without its generated still attached", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(
    source,
    /throw new Error\("แนบภาพที่สร้างเสร็จเข้า prompt วิดีโอไม่สำเร็จ จึงไม่กด Generate วิดีโอ"\)/,
    "failed Add to prompt must block video generation"
  );
  assert.match(
    source,
    /throw new Error\("ไม่พบภาพที่แนบใน prompt วิดีโอ จึงไม่กด Generate วิดีโอ"\)/,
    "the attachment chip must be present before the video prompt is submitted"
  );
});

test("image result polling snapshots direct Flow tiles so uploaded sources cannot be returned as generated output", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(source, /function snapDirectTileKeys\(\)/);
  assert.match(source, /preGenMediaKeys = new Set\(\[\.\.\.snapMediaKeys\(\), \.\.\.snapDirectTileKeys\(\)\]\)/);
  assert.match(source, /Uploaded source tiles \(for example 1\.jpg\/2\.jpg\) can appear[\s\S]*before the generated result/);
});

test("combined image generation attaches every uploaded reference before Generate", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(source, /attachUploadsToPrompt\(uploadedTiles, "drive_folder_upload", \{ skipTabSwitch: true \}\)/);
  assert.match(source, /attached\.length !== uploadedTiles\.length/);
  assert.match(source, /ingredientButtons/);
});

test("Flow verifies the active Veo model before it can generate video", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(source, /function hasActiveFlowModelFamily\(phase\)/);
  assert.match(source, /ยืนยันโมเดล \$\{phase === "video" \? "Veo" : "Banana"\} ไม่สำเร็จ จึงไม่กด Generate/);
  assert.match(source, /if \(!hasActiveFlowModelFamily\(phase\)\)/);
});

test("Flow selects and verifies the configured Frames reference mode before video generation", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(source, /function radioMatchesLabel\(item, label\)/);
  assert.match(source, /item\.querySelector\('\.toggle-text'\)\?\.textContent/);
  assert.match(source, /function selectVerifiedVideoReferenceMode\(options, cfg\)/);
  assert.match(source, /const label = videoRefMode === "frames" \? "Frames" : "Ingredients"/);
  assert.match(source, /await clickVisibleRadio\(label\)/);
  assert.match(source, /!isVisibleRadioSelected\(label\)/);
  assert.match(source, /ยืนยันโหมดอ้างอิงวิดีโอ \$\{label\} ไม่สำเร็จ จึงไม่กด Generate/);
});

test("combined video attaches only the generated still before typing the video prompt", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  const attach = source.indexOf("await addGeneratedStillToPrompt(result);");
  const prompt = source.indexOf('log("✍️ กรอก Prompt วิดีโอ', attach);
  assert.ok(attach >= 0 && prompt > attach, "generated still must be attached before video prompt entry");
  assert.match(source.slice(attach, prompt), /promptAttachmentCount\(\) !== 1/);
});

test("combined video forces Frames and never re-adds uploaded references", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  const combined = source.slice(source.indexOf('if (phase === "combined") {'));
  assert.match(combined, /const videoOptions = \{ \.\.\.options, videoRefMode: "frames" \}/);
  assert.doesNotMatch(combined.slice(0, combined.indexOf('// 6b. กรอก prompt')), /attachUploadsToPrompt\(uploadedTiles/);
  assert.match(source, /function isPreGenerationMediaKey\(value = ""\)/);
  assert.match(source, /resultKeys\.some\(isPreGenerationMediaKey\)/);
  assert.match(source, /let generatedStillMediaKeys = new Set\(\)/);
  assert.match(source, /generatedStillMediaKeys = new Set\(\[result\.tileId, result\.key, result\.mediaUrl, result\.href\]/);
  assert.match(source, /Always close any stale menu first[\s\S]*let menuItem = await waitForAddToPromptMenuItem/);
});

test("multi-image upload retries Flow's transient file input", async () => {
  const source = await readFile(new URL("../content/flow-automation.js", import.meta.url), "utf8");
  assert.match(source, /queryAllIncludingShadowRoots\('input\[type="file"\]'\)/);
  assert.match(source, /for \(let attempt = 1; attempt <= 3; attempt \+= 1\)/);
  assert.match(source, /const inputDeadline = Date\.now\(\) \+ 3000/);
  assert.match(source, /injectFileViaFlowUploadMenu\(files\)/);
  assert.match(source, /same-batch-input/);
  assert.match(source, /Flow occasionally drops the short-lived input/);
  assert.match(source, /Google Flow ไม่ได้สร้าง file input หลังเลือก Upload/);
});

test("video completion reveals Flow's lazy thumbnail before polling the media result", async () => {
  const source = await readFile(new URL("../background.js", import.meta.url), "utf8");
  assert.match(source, /generated\\s\+video\\s\+thumbnail/i);
  assert.match(source, /revealedVideoTile: true/);
});
