import test from "node:test";
import assert from "node:assert/strict";

function extractFlowUserInfo(url = "") {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("flow.google.com")) return null;
    const uMatch = parsed.pathname.match(/^(\/u\/\d+)/);
    const authUser = parsed.searchParams.get("authuser");
    if (uMatch || authUser) {
      return {
        pathPrefix: uMatch ? uMatch[1] : "",
        authUser: authUser || ""
      };
    }
  } catch {}
  return null;
}

function buildFlowHomeUrl(userInfo) {
  const base = "https://flow.google.com";
  const path = userInfo?.pathPrefix ? `${userInfo.pathPrefix}/` : "/";
  const url = new URL(path, base);
  if (userInfo?.authUser) {
    url.searchParams.set("authuser", userInfo.authUser);
  }
  return url.toString();
}

function isFlowProjectUrl(url = "") {
  return /^https:\/\/flow\.google\.com\/(?:u\/\d+\/)?project(?:\/|$|\?)/i.test(url);
}

function isHomeUrl(href) {
  return /^https:\/\/flow\.google\.com\/(?:u\/\d+\/)?(?:[?#].*)?$/i.test(href);
}

test("extractFlowUserInfo parses path-based user session (/u/1/)", () => {
  const info = extractFlowUserInfo("https://flow.google.com/u/1/project/c8418ff1");
  assert.deepEqual(info, { pathPrefix: "/u/1", authUser: "" });
});

test("extractFlowUserInfo parses query-based user session (?authuser=2)", () => {
  const info = extractFlowUserInfo("https://flow.google.com/project/abc?authuser=2");
  assert.deepEqual(info, { pathPrefix: "", authUser: "2" });
});

test("extractFlowUserInfo parses both path and authuser", () => {
  const info = extractFlowUserInfo("https://flow.google.com/u/3/?authuser=3");
  assert.deepEqual(info, { pathPrefix: "/u/3", authUser: "3" });
});

test("extractFlowUserInfo returns null for default user 0 (plain flow home)", () => {
  const info = extractFlowUserInfo("https://flow.google.com/");
  assert.equal(info, null);
});

test("extractFlowUserInfo returns null for non-flow URLs", () => {
  const info = extractFlowUserInfo("https://www.tiktok.com/tiktokstudio");
  assert.equal(info, null);
});

test("buildFlowHomeUrl preserves /u/1/ path", () => {
  const home = buildFlowHomeUrl({ pathPrefix: "/u/1", authUser: "" });
  assert.equal(home, "https://flow.google.com/u/1/");
});

test("buildFlowHomeUrl preserves authuser query", () => {
  const home = buildFlowHomeUrl({ pathPrefix: "", authUser: "2" });
  assert.equal(home, "https://flow.google.com/?authuser=2");
});

test("buildFlowHomeUrl defaults to root flow home if empty", () => {
  const home = buildFlowHomeUrl(null);
  assert.equal(home, "https://flow.google.com/");
});

test("isFlowProjectUrl correctly matches project URLs across accounts", () => {
  assert.equal(isFlowProjectUrl("https://flow.google.com/project/abc"), true);
  assert.equal(isFlowProjectUrl("https://flow.google.com/u/1/project/abc"), true);
  assert.equal(isFlowProjectUrl("https://flow.google.com/project?id=123"), true);
  assert.equal(isFlowProjectUrl("https://flow.google.com/u/2/project"), true);
  assert.equal(isFlowProjectUrl("https://flow.google.com/"), false);
  assert.equal(isFlowProjectUrl("https://flow.google.com/u/1/"), false);
});

test("isHomeUrl correctly matches home URLs across accounts", () => {
  assert.equal(isHomeUrl("https://flow.google.com/"), true);
  assert.equal(isHomeUrl("https://flow.google.com/u/1/"), true);
  assert.equal(isHomeUrl("https://flow.google.com/?authuser=1"), true);
  assert.equal(isHomeUrl("https://flow.google.com/u/2/#recent"), true);
  assert.equal(isHomeUrl("https://flow.google.com/project/abc"), false);
  assert.equal(isHomeUrl("https://flow.google.com/u/1/project/abc"), false);
});
