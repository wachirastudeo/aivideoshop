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
  if (!fs.existsSync(logFilePath)) {
    console.error('File does not exist:', logFilePath);
    process.exit(1);
  }

  const buffer = fs.readFileSync(logFilePath);
  const content = buffer.toString('binary');
  
  console.log('File size:', buffer.length, 'bytes');

  // ค้นหาคำสำคัญ
  const searchKey = 'tiktokLearnedEndpoints';
  let index = 0;
  let matches = [];

  while ((index = content.indexOf(searchKey, index)) !== -1) {
    matches.push(index);
    index += searchKey.length;
  }

  console.log(`พบคำว่า "${searchKey}" ทั้งหมด ${matches.length} จุด`);

  if (matches.length === 0) {
    console.log('❌ ไม่พบข้อมูลดักจับ TikTok ใน Log File');
    // ลองสแกนหาคำว่า tiktok เพื่อดูว่ามีคีย์อื่นบ้าง
    console.log('\nข้อมูล "tiktok" อื่นๆ ใน log:');
    let tIdx = 0;
    while ((tIdx = content.indexOf('tiktok', tIdx)) !== -1) {
      const snippet = content.substr(Math.max(0, tIdx - 50), 200).replace(/[\x00-\x1F\x7F-\x9F]/g, '.');
      console.log(`- index ${tIdx}: ...${snippet}...`);
      tIdx += 'tiktok'.length;
    }
  } else {
    // ดึงส่วนข้อมูลหลังคีย์มาวิเคราะห์หา JSON
    for (let i = 0; i < matches.length; i++) {
      const startIdx = matches[i];
      const substring = content.substr(startIdx, 10 * 1024 * 1024); // 10 MB
      
      const braceStart = substring.indexOf('{');
      if (braceStart !== -1) {
        let openBraces = 0;
        let braceEnd = -1;
        
        for (let j = braceStart; j < substring.length; j++) {
          if (substring[j] === '{') openBraces++;
          if (substring[j] === '}') {
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
          console.log(`\n--- Match #${i + 1} at index ${startIdx} ---`);
          try {
            const parsed = JSON.parse(cleanJsonStr);
            console.log(JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('ข้อความดิบ (ไม่สามารถ parse JSON ได้):', cleanJsonStr.slice(0, 800));
          }
        }
      }
    }
  }

} catch (err) {
  console.error('Error:', err.message);
}
