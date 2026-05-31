#!/usr/bin/env node

const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const STUDIO_UPLOAD_URL =
  "https://www.tiktok.com/tiktokstudio/upload?from=creator_center&tab=video";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

function printUsage() {
  console.log(`
Usage:
  node scripts/tiktok-studio-draft.js --video /absolute/path/video.mp4 --caption "caption" --hashtags "tag1,tag2"

Options:
  --video          Required. Local video file path.
  --caption        Optional. Caption text.
  --hashtags       Optional. Comma or space separated hashtags.
  --location       Optional. Search and choose a TikTok location.
  --privacy        Optional. Privacy label to choose, e.g. Everyone, Friends, Only you.
  --ai-generated   Optional. true/false.
  --allow-comment  Optional. true/false.
  --allow-reuse    Optional. true/false.
  --action         Optional. draft or post. Defaults to draft.
  --profile        Optional. Chrome user data dir. Defaults to ./temp_chrome_profile.
  --keep-open      Optional. Keep Chrome open after the action.

Notes:
  - This drives the TikTok Studio web UI with Playwright.
  - It does not replay private TikTok endpoints or bypass browser origin rules.
  - Login once in the opened Chrome profile if TikTok asks for it.
`.trim());
}

function normalizeHashtags(value) {
  if (!value) return "";
  return String(value)
    .split(/[,\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
}

async function fillEditable(page, text) {
  if (!text) return;

  const candidates = [
    '[data-testid*="caption"] [contenteditable="true"]',
    '[class*="caption"] [contenteditable="true"]',
    '.notranslate[contenteditable="true"]',
    '[contenteditable="true"]',
    'textarea[placeholder*="caption" i]',
    'textarea',
  ];

  for (const selector of candidates) {
    const locator = page.locator(selector).first();
    if (!(await locator.count())) continue;
    try {
      await locator.waitFor({ state: "visible", timeout: 3000 });
      await locator.click({ timeout: 3000 });
      await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await page.keyboard.press("Backspace");
      await page.keyboard.type(text, { delay: 12 });
      return;
    } catch (_) {
      // Try the next selector; TikTok changes this editor often.
    }
  }

  throw new Error("Could not find TikTok caption editor.");
}

function parseOptionalBool(value) {
  if (value === undefined) return undefined;
  if (value === true) return true;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

async function setCheckboxLike(page, selector, desired, label) {
  if (desired === undefined) return;
  const input = page.locator(selector).first();
  if (!(await input.count())) {
    console.log(`Skipping ${label}: selector not found.`);
    return;
  }
  await input.scrollIntoViewIfNeeded().catch(() => {});
  const checked = await input.isChecked().catch(async () => {
    return await input.evaluate((el) => Boolean(el.checked));
  });
  if (checked !== desired) {
    await input.click({ force: true });
    console.log(`Set ${label}: ${desired}`);
  }
}

async function setPrivacy(page, privacy) {
  if (!privacy) return;
  const combo = page.locator('[data-e2e="video_visibility_container"] button[role="combobox"]').first();
  if (!(await combo.count())) {
    console.log("Skipping privacy: visibility combobox not found.");
    return;
  }
  await combo.scrollIntoViewIfNeeded().catch(() => {});
  await combo.click();
  const option = page.getByText(privacy, { exact: true }).first();
  await option.waitFor({ state: "visible", timeout: 10000 });
  await option.click();
  console.log(`Set privacy: ${privacy}`);
}

async function setLocation(page, location) {
  if (!location) return;
  const input = page.locator('[data-e2e="poi_container"] input[placeholder="Search locations"]').first();
  if (!(await input.count())) {
    console.log("Skipping location: location search input not found.");
    return;
  }
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.click();
  await input.fill(location);
  const option = page.getByText(location, { exact: false }).first();
  await option.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  if (await option.count()) {
    await option.click().catch(() => {});
  }
  console.log(`Set location search: ${location}`);
}

async function applyPostSettings(page, settings) {
  await setLocation(page, settings.location);
  await setPrivacy(page, settings.privacy);
  await setCheckboxLike(page, '[data-e2e="aigc_container"] input[type="checkbox"]', settings.aiGenerated, "AI-generated");
  await setCheckboxLike(page, '[data-e2e="user_perm_container"] input[type="checkbox"]', settings.allowComment, "allow comment");

  if (settings.allowReuse !== undefined) {
    const reuse = page.locator('[data-e2e="user_perm_container"] input[type="checkbox"]').nth(1);
    if (await reuse.count()) {
      await reuse.scrollIntoViewIfNeeded().catch(() => {});
      const checked = await reuse.isChecked().catch(async () => reuse.evaluate((el) => Boolean(el.checked)));
      if (checked !== settings.allowReuse) {
        await reuse.click({ force: true });
      }
      console.log(`Set allow reuse: ${settings.allowReuse}`);
    }
  }
}

async function waitForUploadReady(page) {
  const readySignals = [
    page.locator('[contenteditable="true"]').first().waitFor({ state: "visible", timeout: 120000 }),
    page.locator('button:has-text("Draft")').first().waitFor({ state: "visible", timeout: 120000 }),
    page.locator('button:has-text("Post")').first().waitFor({ state: "visible", timeout: 120000 }),
    page.locator("text=/cover|caption|draft|post/i").first().waitFor({ state: "visible", timeout: 120000 }),
  ];

  await Promise.race(readySignals).catch(() => {
    throw new Error("Timed out waiting for TikTok upload form to become ready.");
  });
}

async function clickSaveDraft(page) {
  const selectors = [
    'button:has-text("Save draft")',
    'button:has-text("Save as draft")',
    'button:has-text("Draft")',
    'button:has-text("ร่าง")',
  ];

  for (const selector of selectors) {
    const button = page.locator(selector).filter({ hasNotText: /discard/i }).first();
    if (!(await button.count())) continue;
    try {
      await button.waitFor({ state: "visible", timeout: 5000 });
      await button.click({ timeout: 5000 });
      return;
    } catch (_) {
      // Try the next label.
    }
  }

  throw new Error("Could not find a visible Save Draft button.");
}

async function clickFinalAction(page, action) {
  if (action === "post") {
    const postButton = page.locator('button[data-e2e="post_video_button"]').first();
    await postButton.scrollIntoViewIfNeeded().catch(() => {});
    await postButton.click();
    console.log("Post button clicked.");
    return;
  }

  const draftButton = page.locator('button[data-e2e="save_draft_button"]').first();
  if (await draftButton.count()) {
    await draftButton.scrollIntoViewIfNeeded().catch(() => {});
    await draftButton.click();
    console.log("Save draft button clicked.");
    return;
  }

  await clickSaveDraft(page);
}

async function run() {
  const args = parseArgs(process.argv);
  if (args.help || args.h) {
    printUsage();
    return;
  }

  const videoPath = args.video ? path.resolve(String(args.video)) : "";
  if (!videoPath || !fs.existsSync(videoPath)) {
    printUsage();
    throw new Error(`Video file not found: ${videoPath || "(missing --video)"}`);
  }

  const profileDir = path.resolve(
    args.profile || process.env.TIKTOK_CHROME_PROFILE || path.join(__dirname, "..", "temp_chrome_profile")
  );
  const caption = [args.caption || "", normalizeHashtags(args.hashtags)].filter(Boolean).join(" ").trim();
  const keepOpen = Boolean(args["keep-open"]);
  const action = String(args.action || "draft").toLowerCase();
  if (!["draft", "post"].includes(action)) throw new Error("--action must be draft or post");
  const settings = {
    location: args.location ? String(args.location) : "",
    privacy: args.privacy ? String(args.privacy) : "",
    aiGenerated: parseOptionalBool(args["ai-generated"]),
    allowComment: parseOptionalBool(args["allow-comment"]),
    allowReuse: parseOptionalBool(args["allow-reuse"]),
  };
  const screenshotPath = path.join(__dirname, "tiktok-studio-draft-error.png");

  console.log(`Opening Chrome profile: ${profileDir}`);
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chrome",
    headless: false,
    viewport: null,
    acceptDownloads: true,
    args: ["--start-maximized"],
  });

  try {
    const page = context.pages()[0] || (await context.newPage());
    page.setDefaultTimeout(30000);

    console.log(`Opening TikTok Studio: ${STUDIO_UPLOAD_URL}`);
    await page.goto(STUDIO_UPLOAD_URL, { waitUntil: "domcontentloaded", timeout: 90000 });
    await waitForTikTokStudioOrLogin(page);

    await waitForUploadPage(page);

    const fileInput = page.locator('input[type="file"][accept*="video"], input[type="file"]').first();
    await fileInput.waitFor({ state: "attached", timeout: 120000 });
    console.log(`Uploading video: ${videoPath}`);
    await fileInput.setInputFiles(videoPath);

    console.log("Waiting for TikTok Studio to finish preparing the upload form...");
    await waitForUploadReady(page);

    if (caption) {
      console.log("Filling caption.");
      await fillEditable(page, caption);
    }

    await applyPostSettings(page, settings);

    console.log(`Running final action: ${action}`);
    await clickFinalAction(page, action);

    await page
      .locator('text=/draft|saved|success|ร่าง|สำเร็จ/i')
      .first()
      .waitFor({ state: "visible", timeout: 30000 })
      .catch(() => {});

    console.log("Final action completed. Check TikTok Studio for final confirmation.");

    if (keepOpen) {
      console.log("Chrome remains open because --keep-open was set. Close it manually when done.");
      await new Promise((resolve) => context.on("close", resolve));
    }
  } catch (error) {
    const page = context.pages()[0];
    if (page) {
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      console.error(`Saved failure screenshot: ${screenshotPath}`);
    }
    throw error;
  } finally {
    if (!keepOpen) {
      await context.close().catch(() => {});
    }
  }
}

async function waitForTikTokStudioOrLogin(page) {
  await Promise.race([
    page.waitForURL(/tiktok\.com\/login|tiktok\.com\/signup/i, { timeout: 15000 }).catch(() => null),
    page.waitForURL(/tiktok\.com\/tiktokstudio|tiktok\.com\/tiktok-studio/i, { timeout: 15000 }).catch(() => null),
  ]);

  if (/\/login|\/signup/i.test(page.url())) {
    console.log("TikTok login is required. Log in in the opened Chrome window; the script will continue.");
    await page.waitForURL(/tiktok\.com\/tiktokstudio|tiktok\.com\/tiktok-studio/i, { timeout: 600000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {});
  }
}

async function waitForUploadPage(page) {
  const fileInput = page.locator('input[type="file"][accept*="video"], input[type="file"]').first();

  for (;;) {
    if (/\/login|\/signup/i.test(page.url())) {
      console.log("TikTok login is required in this Chrome profile. Log in there; the script will continue.");
      await page.waitForURL(/tiktok\.com\/tiktokstudio|tiktok\.com\/tiktok-studio/i, { timeout: 600000 });
      await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {});
    }

    const result = await Promise.race([
      fileInput.waitFor({ state: "attached", timeout: 10000 }).then(() => "ready").catch(() => null),
      page.waitForURL(/tiktok\.com\/login|tiktok\.com\/signup/i, { timeout: 10000 }).then(() => "login").catch(() => null),
    ]);

    if (result === "ready") return;
    if (result === "login") continue;

    if (/\/login|\/signup/i.test(page.url())) continue;
    throw new Error(`Could not find TikTok upload input at ${page.url()}`);
  }
}

run().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
