const fs = require('fs');
const path = require('path');

const dbDir = '/Users/pae/Library/Application Support/Google/Chrome/Default/Local Extension Settings/gghniflcfbkadcmmbcciaoofifpfinbd';
let logFilePath = '';

try {
  const files = fs.readdirSync(dbDir);
  const logFiles = files.filter(f => f.endsWith('.log'));
  if (logFiles.length === 0) {
    console.error('❌ ไม่พบไฟล์ Log ในโฟลเดอร์');
    process.exit(1);
  }
  
  const latestLog = logFiles.map(f => ({
    name: f,
    time: fs.statSync(path.join(dbDir, f)).mtime.getTime()
  })).sort((a, b) => b.time - a.time)[0].name;

  logFilePath = path.join(dbDir, latestLog);
  console.log('ใช้ไฟล์ Log ล่าสุด:', logFilePath);
} catch (e) {
  console.error('Error finding log file:', e.message);
  process.exit(1);
}

try {
  const content = fs.readFileSync(logFilePath).toString('binary');
  const searchKey = 'productQueue';
  let index = 0;
  let matches = [];

  while ((index = content.indexOf(searchKey, index)) !== -1) {
    matches.push(index);
    index += searchKey.length;
  }

  console.log(`พบคำว่า "${searchKey}" ทั้งหมด ${matches.length} จุด`);

  if (matches.length === 0) {
    console.log('❌ ไม่พบข้อมูล productQueue ใน Log File');
  } else {
    // ดึงตัวล่าสุด
    const startIdx = matches[matches.length - 1];
    const substring = content.substr(startIdx, 15000);
    
    const braceStart = substring.indexOf('['); // productQueue is an array
    if (braceStart !== -1) {
      let openBraces = 0;
      let braceEnd = -1;
      
      for (let j = braceStart; j < substring.length; j++) {
        if (substring[j] === '[') openBraces++;
        if (substring[j] === ']') {
          openBraces--;
          if (openBraces === 0) {
            braceEnd = j;
            break;
          }
        }
      }

      if (braceEnd !== -1) {
        const jsonStr = substring.substring(braceStart, braceEnd + 1);
        const cleanJsonStr = jsonStr.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        try {
          const parsed = JSON.parse(cleanJsonStr);
          console.log('\n--- สถานะล่าสุดของสินค้าในคิว (Product Queue) ---');
          parsed.forEach((p, idx) => {
            console.log(`\n[#${idx + 1}] ${p.name || 'ไม่มีชื่อ'}`);
            console.log(`- Status: ${p.status}`);
            console.log(`- Video URL: ${p.videoUrl ? p.videoUrl.slice(0, 80) + '...' : 'ไม่มี'}`);
            console.log(`- Error Message: ${p.errorMessage || 'ไม่มี (ปกติ)'}`);
          });
        } catch (e) {
          console.log('ข้อความดิบ (ไม่สามารถ parse JSON ได้):', cleanJsonStr.slice(0, 800));
        }
      }
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}
