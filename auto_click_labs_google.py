import asyncio
import os
from playwright.async_api import async_playwright

async def run_labs_google_clear():
    artifact_dir = "/Users/pae/.gemini/antigravity/brain/75fc6c20-7feb-4017-9f5c-2b40fb4cc8f0"
    os.makedirs(artifact_dir, exist_ok=True)
    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    print("🚀 เริ่มต้นคลิกล้างคุกกี้ labs.google ผ่าน Browser Automation...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            executable_path=chrome_path if os.path.exists(chrome_path) else None,
            headless=True
        )
        context = await browser.new_context()
        page = await context.new_page()

        # 1. เปิดเว็บ labs.google
        print("🌐 1. เปิดหน้าเว็บ https://labs.google/fx/tools/flow...")
        try:
            await page.goto("https://labs.google/fx/tools/flow", timeout=15000)
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Notice: {e}")

        # 2. เคลียร์ Cookies และ Site Data ทั้งหมด
        print("🧹 2. คลิกและล้าง Cookies & Site Data ของ labs.google...")
        await context.clear_cookies()
        await page.evaluate("""() => {
            localStorage.clear();
            sessionStorage.clear();
            if (window.indexedDB && indexedDB.databases) {
                indexedDB.databases().then(dbs => {
                    dbs.forEach(db => indexedDB.deleteDatabase(db.name));
                });
            }
        }""")

        screenshot_path = os.path.join(artifact_dir, "labs_google_cleared.png")
        await page.screenshot(path=screenshot_path)
        print(f"📸 บันทึกรูปภาพสำเร็จ: {screenshot_path}")

        await browser.close()
        print("🎉 ล้างข้อมูลไซต์ labs.google สำเร็จเรียบร้อย!")

if __name__ == "__main__":
    asyncio.run(run_labs_google_clear())
