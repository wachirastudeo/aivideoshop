---
name: tiktok-video-creator
description: Build, maintain, and polish the TikTok Video Creator Chrome Extension. Use when working on this repository's Manifest V3 extension, side panel UI, TikTok product workflows, Google Flow prompt automation, AI image analysis, video prompt generation, TikTok posting, extension options, or project-specific UX/coding standards.
---

# TikTok Video Creator

*Last Updated: May 10, 2026*

## Core Context

Work on a Chrome Extension Manifest V3 app that helps TikTok sellers create product videos from TikTok Showcase products or uploaded product images.

Primary flow:

1. Load products from TikTok Showcase.
2. Queue one or more products for video creation.
3. Analyze product images or metadata.
4. Build Google Flow prompts in two phases:
   - Phase 1: generate a polished product image.
   - Phase 2: generate an 8-second vertical TikTok video from the approved image.
5. Download the video or prepare TikTok posting with product link.

## Hard Rules

- Use vanilla JavaScript ES modules, HTML, and CSS only.
- Do not add React, Tailwind, bundlers, or heavy frameworks.
- Follow Chrome Extension Manifest V3 patterns.
- Use `chrome.storage.local` for app state and queues.
- Use `chrome.storage.sync` for user settings, tokens, and API keys.
- Keep UI copy Thai-first unless the prompt target requires English.
- Keep generated Google Flow prompts in English.
- Lock generated videos to 8 seconds and 9:16 vertical format.
- Avoid exposing production secrets in extension code; prefer backend/proxy for real production API secrets.

## Visual Standards

- Dark premium UI.
- Main colors:
  - Background: `#000000`
  - Text: `#FFFFFF`
  - TikTok accent: `#FE2C55`
- Prefer sharp edges. Use `border-radius: 0` unless existing code clearly uses another pattern.
- Keep side panel layouts dense, scannable, and practical for narrow width.
- No placeholder-looking UI.
- Make batch workflows efficient: queue, status, per-product action, clear errors.

## Key Files

- `manifest.json`: extension permissions, side panel, service worker, CSP.
- `background.js`: service worker, message routing, API calls, Google Flow tab automation.
- `sidepanel.html`: main side panel shell.
- `sidepanel.js`: tab switching and shared status handling.
- `sidepanel.css`: global side panel styling.
- `tabs/tab-products.html`: TikTok product list UI.
- `tabs/tab-products.js`: product list, search, sort, pagination, queue handoff.
- `tabs/tab-video.html`: video creation UI.
- `tabs/tab-video.js`: product queue, analysis, prompt preview, Flow actions, output actions.
- `modules/prompt-builder.js`: image/video prompts, captions, video styles.
- `modules/image-analyzer.js`: Gemini image analysis and fallback analysis.
- `modules/google-flow.js`: Google Flow prompt handoff helpers.
- `modules/tiktok-api.js`: TikTok OAuth/product/posting API wrapper.
- `modules/video-output.js`: download and TikTok post orchestration.
- `options/options.html`: settings UI.
- `options/options.js`: token/API key/settings persistence.

## Project Documentation

- `PROJECT_HANDOFF.md`: Detailed project overview, current mission, and status.
- `AGENTS.md`: Agent personas, roles, and project vibe for development teams.

## Implementation Workflow

1. Read `PROJECT_HANDOFF.md` and `AGENTS.md` before large changes.
2. Inspect the target module before editing.
3. Keep changes scoped to the requested workflow.
4. Preserve existing module boundaries:
   - UI event/state logic stays in tab files.
   - prompt construction stays in `modules/prompt-builder.js`.
   - TikTok API behavior stays in `modules/tiktok-api.js`.
   - Google Flow automation stays in `modules/google-flow.js` and `background.js`.
5. Add focused error handling for extension APIs and browser automation.
6. Prefer clear status messages in Thai for user-facing failures.

## Prompt Builder Guidance

When editing `modules/prompt-builder.js`:

- Structure prompts by scene: hook, product showcase, detail, CTA.
- Keep product price out of video visuals unless explicitly requested.
- Emphasize product fidelity: category, color, shape, materials, and visible features.
- Include camera movement, pacing, location, mood, and transition details.
- Keep TikTok-native pacing: fast hook, clear reveal, simple CTA.
- Preserve the 8 video styles unless the user asks to change them.

## Image Analysis Guidance

When editing `modules/image-analyzer.js`:

- Use API analysis when a configured key exists.
- Fall back gracefully from product title/metadata when no key exists.
- Ask for product title only when neither image analysis nor useful metadata is available.
- Extract practical selling inputs:
  - product category
  - primary color/material
  - key features
  - target audience
  - hook idea
  - prompt notes

## Google Flow Automation Guidance

When editing Google Flow behavior:

- Treat Google Flow UI as unstable.
- Use defensive selectors for textarea, contenteditable, and text inputs.
- Add clear notification/overlay feedback after opening Flow.
- Do not assume automated reference image upload will always work.
- If image upload cannot be made reliable, guide the user to upload the approved reference image manually.

## TikTok API Guidance

When editing TikTok API behavior:

- Keep OAuth/token logic separated from UI rendering.
- Never hardcode app secrets.
- Use background messages for network/API operations that should not live in UI code.
- Expect endpoint or region differences and make errors visible.
- Keep product queue data minimal but enough to recreate prompts.

## Response Style

- **CRITICAL**: Keep replies ULTRA-CONCISE to save tokens.
- Do not explain your code or changes unless explicitly asked.
- Answer in Thai (e.g., "เรียบร้อยครับ", "แก้ไขไฟล์แล้ว").
- No long summaries. Mention changed files and stop.
