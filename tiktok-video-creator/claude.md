# Claude Project Context — TikTok Video Creator

*Last Updated: May 10, 2026*

This file provides specific technical instructions and context for Claude when assisting with this repository.

## 🧠 Strategic Context
You are assisting in building a Chrome Extension that automates TikTok video creation. Your primary value lies in **Image Analysis** and **Prompt Engineering** to bridge the gap between raw product images and high-quality video generation.

## 🛠 Coding Principles
- **Vanilla or Die**: Use native Web APIs, Vanilla JS (ES6+), and Vanilla CSS. No React, Tailwind, or heavy libraries.
- **Sharp Aesthetics**: All UI components must have `border-radius: 0;`. Use high-contrast colors and premium typography.
- **MV3 Compliance**: Strictly follow Chrome Extension Manifest V3 patterns (service workers, message passing, side panel API).

## 🎬 Prompt Engineering Guidelines
When generating prompts for Google Flow (in `modules/prompt-builder.js`):
1. **Scene-Based**: Always structure prompts into scenes (e.g., Hook, Showcase, CTA).
2. **Visual Fidelity**: Describe lighting (e.g., "studio clean", "dramatic neon") and camera movement (e.g., "slow orbit", "fast push-in").
3. **TikTok Native**: Prompts should reflect current TikTok trends (UGC style, fast pacing, viral hooks).

## 👁 Vision Analysis Patterns
When analyzing product images (using Claude Vision):
- **Identify**: Product category, primary color, key features, and brand vibe.
- **Suggest**: Target audience (e.g., Gen Z, professional, hobbyist) and a "Video Hook" based on the product's unique selling point.

## 💬 Communication Style
- **Token Efficiency (CRITICAL)**: Keep responses ULTRA-CONCISE. Do not explain your changes unless asked. Do not summarize what you did in long paragraphs. Just confirm the action and move on. Save tokens.
- **Concise Code**: Focus on the logic change, not the entire file, unless necessary.
- **Language**: Respond in Thai, but keep it extremely brief (e.g., "อัพเดทไฟล์เรียบร้อยครับ", "แก้ไข UI แล้วครับ").

## 📂 Key Files to Reference
- `manifest.json`: For permissions and entry points.
- `PROJECT_HANDOFF.md`: For the current state of the project.
- `AGENTS.md`: For your specific persona and team roles.

---
*If you are unsure about any implementation detail, prioritize the "Sharp Edges" and "Vanilla JS" constraints.*
