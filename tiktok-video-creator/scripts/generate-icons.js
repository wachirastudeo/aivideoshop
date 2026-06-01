import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

/**
 * @description คำนวณ CRC32 สำหรับ chunk PNG
 * @param {Buffer} buffer - input buffer
 * @returns {number} crc32
 */
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * @description สร้าง PNG chunk
 * @param {string} type - chunk type
 * @param {Buffer} data - chunk data
 * @returns {Buffer} chunk buffer
 */
function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

/**
 * @description ตรวจว่าจุดอยู่ในสามเหลี่ยม play หรือไม่
 * @param {number} x - x
 * @param {number} y - y
 * @param {number} size - icon size
 * @returns {boolean} true ถ้าอยู่ใน shape
 */
function isPlayTriangle(x, y, size) {
  const left = size * 0.36;
  const top = size * 0.28;
  const bottom = size * 0.72;
  const right = size * 0.75;
  if (x < left || x > right || y < top || y > bottom) return false;
  const mid = size * 0.5;
  const edge = x - left;
  const halfHeight = (bottom - top) / 2;
  const allowed = (edge / (right - left)) * halfHeight;
  return Math.abs(y - mid) <= allowed;
}

/**
 * @description สร้าง PNG RGBA แบบง่ายสำหรับ extension icon
 * @param {number} size - ขนาด icon
 * @returns {Buffer} PNG buffer
 */
function createIcon(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const radius = size * 0.22;
  for (let y = 0; y < size; y += 1) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = rowStart + 1 + x * 4;
      const px = x + 0.5;
      const py = y + 0.5;
      const left = radius;
      const right = size - radius;
      const top = radius;
      const bottom = size - radius;
      const cx = px < left ? left : px > right ? right : px;
      const cy = py < top ? top : py > bottom ? bottom : py;
      const rounded = Math.hypot(px - cx, py - cy) <= radius;
      const inPlay = isPlayTriangle(x, y, size);
      const playShadowCyan = isPlayTriangle(x + size * 0.04, y - size * 0.02, size);
      const playShadowPink = isPlayTriangle(x - size * 0.04, y + size * 0.02, size);
      const sparkleLarge = Math.abs(x - size * 0.73) + Math.abs(y - size * 0.31) < size * 0.075;
      const sparkleSmall = Math.abs(x - size * 0.29) + Math.abs(y - size * 0.72) < size * 0.08;
      const t = (x + y) / (size * 2);

      if (!rounded) {
        raw[offset + 3] = 0;
      } else if (sparkleLarge) {
        raw[offset] = 255;
        raw[offset + 1] = 255;
        raw[offset + 2] = 255;
        raw[offset + 3] = 245;
      } else if (sparkleSmall) {
        raw[offset] = 37;
        raw[offset + 1] = 244;
        raw[offset + 2] = 238;
        raw[offset + 3] = 235;
      } else if (inPlay) {
        raw[offset] = 255;
        raw[offset + 1] = 255;
        raw[offset + 2] = 255;
        raw[offset + 3] = 255;
      } else if (playShadowCyan) {
        raw[offset] = 37;
        raw[offset + 1] = 244;
        raw[offset + 2] = 238;
        raw[offset + 3] = 230;
      } else if (playShadowPink) {
        raw[offset] = 254;
        raw[offset + 1] = 44;
        raw[offset + 2] = 85;
        raw[offset + 3] = 230;
      } else {
        raw[offset] = Math.round(32 - 24 * t);
        raw[offset + 1] = Math.round(32 - 27 * t);
        raw[offset + 2] = Math.round(39 - 33 * t);
        raw[offset + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of [16, 48, 128]) {
  writeFileSync(new URL(`../assets/icon${size}.png`, import.meta.url), createIcon(size));
}
