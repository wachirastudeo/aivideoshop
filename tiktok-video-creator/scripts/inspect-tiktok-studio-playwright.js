#!/usr/bin/env node

const { chromium } = require("playwright-core");
const fs = require("fs");
const path = require("path");

const URL = "https://www.tiktok.com/tiktokstudio/upload?from=creator_center&tab=video";

async function run() {
  const userDataDir = path.join(__dirname, "..", "temp_chrome_profile");
  const outputFile = path.join(__dirname, "tiktok-studio-playwright-inspect.json");
  const screenshotFile = path.join(__dirname, "tiktok-studio-playwright-inspect.png");

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: "chrome",
    viewport: null,
    args: ["--start-maximized"],
  });

  const page = context.pages()[0] || (await context.newPage());
  const requests = [];

  page.on("request", (request) => {
    const url = request.url();
    if (/tiktok|ttwstatic|byte/i.test(url) && /upload|publish|draft|post|creator/i.test(url)) {
      requests.push({
        type: "request",
        method: request.method(),
        url,
        resourceType: request.resourceType(),
        postData: request.postData() || "",
      });
    }
  });

  page.on("response", (response) => {
    const request = response.request();
    const url = response.url();
    if (/tiktok|ttwstatic|byte/i.test(url) && /upload|publish|draft|post|creator/i.test(url)) {
      requests.push({
        type: "response",
        method: request.method(),
        url,
        status: response.status(),
        resourceType: request.resourceType(),
      });
    }
  });

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(5000);

  const pageMap = await page.evaluate(() => {
    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const attr = (el, name) => el?.getAttribute?.(name) || "";
    const visible = (el) => {
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const rect = (el) => {
      const box = el.getBoundingClientRect();
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    };
    const control = (el, index) => ({
      index,
      tag: el.tagName.toLowerCase(),
      role: attr(el, "role"),
      type: attr(el, "type"),
      dataE2E: attr(el, "data-e2e"),
      dataTestid: attr(el, "data-testid"),
      ariaLabel: attr(el, "aria-label"),
      placeholder: attr(el, "placeholder"),
      name: attr(el, "name"),
      value: el.value || attr(el, "value"),
      checked: el.checked === true,
      disabled: Boolean(el.disabled) || attr(el, "aria-disabled") === "true",
      text: clean(el.innerText || el.textContent || el.value).slice(0, 180),
      visible: visible(el),
      rect: rect(el),
    });

    return {
      title: document.title,
      url: location.href,
      loginPage: /\/login|\/signup/i.test(location.href) || /log in to tiktok/i.test(document.body.innerText),
      bodySummary: clean(document.body.innerText).slice(0, 1500),
      fileInputs: [...document.querySelectorAll('input[type="file"]')].map(control),
      dataE2E: [...document.querySelectorAll("[data-e2e]")].map((el, index) => ({
        index,
        dataE2E: attr(el, "data-e2e"),
        tag: el.tagName.toLowerCase(),
        text: clean(el.innerText || el.textContent).slice(0, 260),
        visible: visible(el),
        rect: rect(el),
      })),
      controls: [...document.querySelectorAll('input, textarea, [contenteditable="true"], button, [role="button"], [role="combobox"], [role="switch"], [role="radio"]')]
        .map(control)
        .filter((item) => item.visible || item.text || item.dataE2E || item.ariaLabel || item.placeholder),
    };
  });

  await page.screenshot({ path: screenshotFile, fullPage: false }).catch(() => {});
  fs.writeFileSync(outputFile, JSON.stringify({ inspectedAt: new Date().toISOString(), pageMap, requests }, null, 2));

  console.log(JSON.stringify({
    ok: true,
    title: pageMap.title,
    url: pageMap.url,
    loginPage: pageMap.loginPage,
    fileInputCount: pageMap.fileInputs.length,
    dataE2ECount: pageMap.dataE2E.length,
    controlCount: pageMap.controls.length,
    requestCount: requests.length,
    outputFile,
    screenshotFile,
  }, null, 2));

  if (pageMap.loginPage || process.argv.includes("--keep-open")) {
    console.log("Browser stays open. Log in if needed, then close it manually.");
    await new Promise((resolve) => context.on("close", resolve));
    return;
  }

  await context.close();
}

run().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
