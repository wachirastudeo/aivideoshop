const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function run() {
  const userDataDir = path.join(__dirname, '..', 'temp_chrome_profile');
  console.log(`กำลังพยายามเปิด Chrome (Profile จำลอง) จากโฟลเดอร์: ${userDataDir}`);
  console.log('💡 จะใช้โปรไฟล์แยกเพื่อความสะดวก ไม่ชนกับ Chrome หลักที่คุณกำลังใช้งานอยู่');

  try {
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome', 
      viewport: null, // ใช้หน้าจอปกติ
      args: [
        '--disable-blink-features=AutomationControlled',
        '--excludeSwitches=enable-automation',
        '--start-maximized'
      ]
    });

    // Inject Script เพื่อพรางสถานะบอท
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    const page = await context.newPage();
    
    // สร้างไฟล์เก็บข้อมูล
    const outputFile = path.join(__dirname, 'captured-endpoints.json');
    fs.writeFileSync(outputFile, '[\n');
    let isFirst = true;

    function saveCapturedData(data) {
      const prefix = isFirst ? '' : ',\n';
      isFirst = false;
      fs.appendFileSync(outputFile, prefix + JSON.stringify(data, null, 2));
      console.log(`\n✅ บันทึก API สำเร็จลงใน: ${outputFile}\n`);
    }

    // ดักจับ requests
    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      
      if (/upload|publish|draft|post\/create/i.test(url) && ['POST', 'PUT'].includes(method)) {
        console.log(`\n🚀 [DETECTED REQUEST] ${method} -> ${url}`);
        try {
          console.log('Headers:', JSON.stringify(request.headers(), null, 2));
          console.log('Payload:', request.postData());
        } catch (e) {}
      }
    });

    // ดักจับ responses
    page.on('response', async (response) => {
      const url = response.url();
      const request = response.request();
      const method = request.method();

      if (/upload|publish|draft|post\/create/i.test(url) && ['POST', 'PUT'].includes(method)) {
        console.log(`\n📥 [DETECTED RESPONSE] ${url} (Status: ${response.status()})`);
        try {
          const text = await response.text();
          console.log('Response Body:', text);
          
          let jsonBody = {};
          try { jsonBody = JSON.parse(text); } catch (e) {}

          saveCapturedData({
            url,
            method,
            headers: request.headers(),
            postData: request.postData(),
            status: response.status(),
            responseBody: jsonBody,
            capturedAt: new Date().toISOString()
          });
        } catch (err) {
          console.log('ไม่สามารถอ่าน Response Body ได้ (อาจเป็นไฟล์อัปโหลดดิบ):', err.message);
        }
      }
    });

    console.log('กำลังนำทางไปยัง TikTok Studio Upload...');
    await page.goto('https://www.tiktok.com/tiktokstudio/upload', { timeout: 60000 });

    console.log('\n=============================================================');
    console.log('💡 วิธีการใช้งานเพื่อแกะ API:');
    console.log('1. หน้าต่างนี้คือเบราว์เซอร์จริงของคุณที่ Login ค้างไว้เรียบร้อยแล้ว');
    console.log('2. ลากไฟล์วิดีโออัปโหลด 1 คลิปตามปกติ');
    console.log('3. รอรันอัปโหลดเสร็จสิ้นจนบันทึกคลิปเป็นร่าง (Draft)');
    console.log('4. ปิดหน้าต่างเบราว์เซอร์นี้เมื่อทำเสร็จสิ้น');
    console.log('=============================================================\n');

    // รอจนเบราว์เซอร์ถูกปิด
    await new Promise((resolve) => {
      context.on('close', () => {
        console.log('เบราว์เซอร์ถูกปิดแล้ว.');
        resolve();
      });
    });

    fs.appendFileSync(outputFile, '\n]');
    console.log('จบการทำงาน.');
  } catch (err) {
    if (err.message.includes('close') || err.message.includes('locked')) {
      console.error('\n❌ เกิดข้อผิดพลาด: โปรไฟล์ Chrome ของคุณกำลังถูกใช้งานอยู่!');
      console.error('กรุณาปิดโปรแกรม Google Chrome ทั้งหมด (Command + Q) แล้วลองรันใหม่อีกครั้ง\n');
    } else {
      console.error('เกิดข้อผิดพลาด:', err.message);
    }
  }
}

run();
