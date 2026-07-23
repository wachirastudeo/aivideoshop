import asyncio
import os
from playwright.async_api import async_playwright

async def run_automation():
    artifact_dir = "/Users/pae/.gemini/antigravity/brain/75fc6c20-7feb-4017-9f5c-2b40fb4cc8f0"
    os.makedirs(artifact_dir, exist_ok=True)

    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

    print("🚀 กำลังเริ่มต้น Browser Automation ด้วย Google Chrome...")
    async with async_playwright() as p:
        # เปิด Google Chrome
        browser = await p.chromium.launch(
            executable_path=chrome_path if os.path.exists(chrome_path) else None,
            headless=True
        )
        context = await browser.new_context()
        page = await context.new_page()

        # 1. เปิดเว็บ Shopee
        print("🌐 1. กำลังเปิดหน้าเว็บ Shopee...")
        try:
            await page.goto("https://shopee.co.th", timeout=15000)
            await page.wait_for_timeout(2000)
        except Exception as e:
            print(f"Opening Shopee page notice: {e}")

        # 2. คลิกและล้าง Cookies & Storage ทั้งหมด
        print("🧹 2. กำลังดำเนินการล้าง Cookies และ Local Storage ทั้งหมด...")
        await context.clear_cookies()
        try:
            await page.evaluate("""() => {
                localStorage.clear();
                sessionStorage.clear();
            }""")
        except Exception:
            pass

        screenshot_path1 = os.path.join(artifact_dir, "step1_shopee_cleared.png")
        await page.screenshot(path=screenshot_path1)
        print(f"📸 บันทึกภาพหลังล้าง Cookie: {screenshot_path1}")

        # 3. เปิดเว็บแอปพลิเคชันคลีนไฟล์ CSV
        print("📄 3. กำลังเปิดโปรแกรม Shopee CSV Cleaner...")
        local_app_url = "file:///Users/pae/Documents/aivideoshop-main/shopee_csv_cleaner.html"
        await page.goto(local_app_url)
        await page.wait_for_timeout(1000)

        # 4. อัปโหลดไฟล์ shopee_data_thailand.csv เข้าไปในเว็บแอป
        print("📤 4. กำลังคลิกอัปโหลดไฟล์ shopee_data_thailand.csv...")
        csv_file_path = "/Users/pae/Documents/aivideoshop-main/shopee_data_thailand.csv"
        
        file_input = page.locator("#fileInput")
        await file_input.set_input_files(csv_file_path)
        await page.wait_for_timeout(1500)

        screenshot_path2 = os.path.join(artifact_dir, "step2_csv_uploaded.png")
        await page.screenshot(path=screenshot_path2)
        print(f"📸 บันทึกภาพอัปโหลดสำเร็จ: {screenshot_path2}")

        # 5. คลิกปุ่มดาวน์โหลด CSV ภาษาไทย
        print("📥 5. กำลังคลิกปุ่มดาวน์โหลด CSV (UTF-8 BOM)...")
        download_btn = page.locator("button:has-text('ดาวน์โหลด CSV')")
        
        async with page.expect_download() as download_info:
            await download_btn.click()
        
        download = await download_info.value
        saved_download_path = os.path.join("/Users/pae/Documents/aivideoshop-main", download.suggested_filename)
        await download.save_as(saved_download_path)
        print(f"✅ คลิกดาวน์โหลดสำเร็จเป็นไฟล์: {saved_download_path}")

        screenshot_path3 = os.path.join(artifact_dir, "step3_download_complete.png")
        await page.screenshot(path=screenshot_path3)
        print(f"📸 บันทึกภาพขั้นตอนสุดท้าย: {screenshot_path3}")

        await browser.close()
        print("🎉 เสร็จสิ้นการทำงานและคลิกทุกขั้นตอนเรียบร้อยแล้ว!")

if __name__ == "__main__":
    asyncio.run(run_automation())
