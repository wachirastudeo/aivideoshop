import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../content/tiktok-studio-automation.js', import.meta.url), 'utf8');
const body = source.match(/function scheduleDateInputMatches\(value, year, month, day\) \{[\s\S]*?\n\}/)[0];
const context = vm.createContext({normalizeCalendarDigits: value => String(value || '')});
vm.runInContext(body, context);
test('accepts TikTok English date display and rejects a different day', () => {
  assert.equal(context.scheduleDateInputMatches('Nov 3, 2026', 2026, 11, 3), true);
  assert.equal(context.scheduleDateInputMatches('Nov 2, 2026', 2026, 11, 3), false);
  assert.equal(context.scheduleDateInputMatches('2026-11-03', 2026, 11, 3), true);
});
