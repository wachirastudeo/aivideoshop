# aivideoshop

This project is an AI video generation tool tailored to specific needs.

## Features

- **No License Restrictions**: Built to operate independently without checking external licenses.
- **Custom Configuration**: Fully customizable video generation settings.
- **Independent Architecture**: Implements custom methods and processes, ensuring 100% independent code.
- **TikTok Video Creator Extension**: Chrome Extension side panel for selecting TikTok Showcase products, creating Google Flow videos, downloading output files, and optionally uploading them to TikTok Studio.
- **TikTok Posting Automation**: Supports download-only, download + draft, and download + post flows. Posting settings are saved automatically and applied to `https://www.tiktok.com/tiktokstudio/upload`.
- **Product-Aware Posting**: Keeps `productId`/`productUrl` through the workflow, names video files with product IDs, fills captions with product details, limits hashtags to 5, forces AI-generated disclosure on, and attempts to add the TikTok product link.

## Getting Started

Load `/Users/pae/Documents/aivideoshop-main/tiktok-video-creator` as an unpacked Chrome extension from `chrome://extensions`, then open the extension side panel.
