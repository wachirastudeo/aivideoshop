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

async function resolveFlowHomeUrl(currentUrl = "", getStored = async () => ({}), setStored = async () => {}) {
  if (currentUrl && currentUrl.includes("flow.google.com")) {
    const userInfo = extractFlowUserInfo(currentUrl);
    if (userInfo) {
      try {
        await setStored({ flowUserInfo: userInfo });
      } catch {}
      return buildFlowHomeUrl(userInfo);
    }
    // Flow URL without /u/X or authuser = User 0 (default Google user)
    try {
      await setStored({ flowUserInfo: { pathPrefix: "", authUser: "" } });
    } catch {}
    return "https://flow.google.com/";
  }

  try {
    const stored = await getStored();
    if (stored?.flowUserInfo?.pathPrefix || stored?.flowUserInfo?.authUser) {
      return buildFlowHomeUrl(stored.flowUserInfo);
    }
  } catch {}

  return "https://flow.google.com/";
}

function sortFlowTabs(allFlowTabs = [], { currentWindowId = null, lastActiveFlowTabId = null } = {}) {
  return [...allFlowTabs].sort((a, b) => {
    const aActiveCurrent = (a.active && a.windowId === currentWindowId) ? 1 : 0;
    const bActiveCurrent = (b.active && b.windowId === currentWindowId) ? 1 : 0;
    if (aActiveCurrent !== bActiveCurrent) return bActiveCurrent - aActiveCurrent;

    const aLastActive = (lastActiveFlowTabId && a.id === lastActiveFlowTabId) ? 1 : 0;
    const bLastActive = (lastActiveFlowTabId && b.id === lastActiveFlowTabId) ? 1 : 0;
    if (aLastActive !== bLastActive) return bLastActive - aLastActive;

    const aActive = a.active ? 1 : 0;
    const bActive = b.active ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;

    const aInWin = (a.windowId === currentWindowId) ? 1 : 0;
    const bInWin = (b.windowId === currentWindowId) ? 1 : 0;
    if (aInWin !== bInWin) return bInWin - aInWin;

    return (b.id || 0) - (a.id || 0);
  });
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

test("resolveFlowHomeUrl respects current tab User 0 and does not revert to old stored User 1", async () => {
  let saved = null;
  const mockGetStored = async () => ({ flowUserInfo: { pathPrefix: "/u/1", authUser: "" } });
  const mockSetStored = async (val) => { saved = val; };

  // Current tab is User 0 (plain flow home)
  const home = await resolveFlowHomeUrl("https://flow.google.com/", mockGetStored, mockSetStored);
  assert.equal(home, "https://flow.google.com/");
  assert.deepEqual(saved, { flowUserInfo: { pathPrefix: "", authUser: "" } });

  // Current tab is User 0 project
  const projectHome = await resolveFlowHomeUrl("https://flow.google.com/project/xyz", mockGetStored, mockSetStored);
  assert.equal(projectHome, "https://flow.google.com/");
  assert.deepEqual(saved, { flowUserInfo: { pathPrefix: "", authUser: "" } });
});

test("resolveFlowHomeUrl extracts and preserves User 2 when active tab is on User 2", async () => {
  let saved = null;
  const mockGetStored = async () => ({ flowUserInfo: { pathPrefix: "/u/1", authUser: "" } });
  const mockSetStored = async (val) => { saved = val; };

  const home = await resolveFlowHomeUrl("https://flow.google.com/u/2/project/c8418ff1", mockGetStored, mockSetStored);
  assert.equal(home, "https://flow.google.com/u/2/");
  assert.deepEqual(saved, { flowUserInfo: { pathPrefix: "/u/2", authUser: "" } });
});

test("resolveFlowHomeUrl uses stored user ONLY when opening brand new tab from scratch", async () => {
  const mockGetStored = async () => ({ flowUserInfo: { pathPrefix: "/u/2", authUser: "" } });
  const home = await resolveFlowHomeUrl("", mockGetStored, async () => {});
  assert.equal(home, "https://flow.google.com/u/2/");
});

test("sortFlowTabs prioritizes active tab in current window over old background tab", () => {
  const tabOldUser1 = { id: 10, windowId: 1, active: false, url: "https://flow.google.com/u/1/" };
  const tabNewUser2 = { id: 20, windowId: 1, active: true, url: "https://flow.google.com/u/2/" };

  const sorted = sortFlowTabs([tabOldUser1, tabNewUser2], { currentWindowId: 1 });
  assert.equal(sorted[0].id, 20);
  assert.equal(sorted[0].url, "https://flow.google.com/u/2/");
});

test("sortFlowTabs prioritizes last active Flow tab when none is currently focused", () => {
  const tab1 = { id: 10, windowId: 1, active: false, url: "https://flow.google.com/u/1/" };
  const tab2 = { id: 20, windowId: 1, active: false, url: "https://flow.google.com/u/2/" };

  const sorted = sortFlowTabs([tab1, tab2], { currentWindowId: 1, lastActiveFlowTabId: 20 });
  assert.equal(sorted[0].id, 20);
});

