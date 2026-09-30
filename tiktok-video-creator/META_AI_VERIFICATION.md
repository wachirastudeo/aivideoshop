# Meta AI live verification — 2026-09-30

Goal remains incomplete: verify one Create Video button run from the TikTok
product queue through New chat, image upload, prompt submission, generated image,
generated 9:16 10-second video, and automatic download.

## Verified live

- Product: TikTok `1729639835109395291`, SH3 waterproof boots, using its pulled reference image.
- New chat manual reference attachment and video submission generated real boots footage.
  Conversation: https://www.meta.ai/prompt/f1abe3b0-0718-49f0-8e98-6cb4cf06dcec
- The extension's automatic reference upload and image prompt produced a 1152×2048
  image. Its current selectors found the generated image, and fetch returned
  HTTP 200, `image/webp`, 453064 bytes.
  Conversation: https://www.meta.ai/prompt/7d6a0669-b2ac-4ac9-823e-1cb728a3a5d9
- The production `downloadVideo` module downloaded the completed Meta video
  via Chrome download ID `7581`; Chrome showed Done. This download reused the
  completed manual-generation result, so it is not proof of the whole automated run.
- File: `/Users/pae/Downloads/1729639835109395291_meta_verified_2026-09-30_tiktok.mp4`
- `ffprobe`: H.264 720×1280, video 10.000000 s, AAC audio 10.000000 s,
  container 10.000000 s, 11107273 bytes. An extracted frame showed boots in water.

## Blocking live response

The automatic video submission reached Meta, but its saved response says
“The video generation quota is temporarily exhausted right now” and
“You reached your limit … wait until tomorrow.”
Conversation: https://www.meta.ai/prompt/a925cb46-662d-4008-a352-255ac98e6105

Earlier long image prompts received `Your request was blocked by our security system.`
No security controls, account limits, or paid upgrades were bypassed.

## Fixes after inspection

- Always select New chat before uploading.
- If Meta saves a conversation but leaves the home composer visible, follow only
  the newly created history link matching this submission; do not submit again.
- Surface quota, account, and security failures as non-retryable, preserving an
  image already generated. Stop the batch instead of automatically retrying them.
- Reject promptly when the generation tab closes, and clean up listeners.
- Retain the generated image's proper file extension when uploading for video.
- Reject failed downloads instead of reporting product completion.
- Removed the unused assisted import/settings detour.

Validation: 130 Node tests passed; `git diff --check` passed. Extension was reloaded.
The new history recovery and complete combined run still need live verification
after quota is available. Do not mark the goal complete from unit tests or the
separately verified generation/download stages.
